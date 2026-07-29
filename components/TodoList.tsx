'use client'

import { useState, useEffect, useCallback, useTransition, useOptimistic, useRef } from 'react'

import { createClient } from '@/lib/supabase/client'
import { Todo, FilterStatus } from '@/types/todo'
import { DashboardMode } from '@/types/coop'
import { TodoItem } from '@/components/TodoItem'
import { TodoForm } from '@/components/TodoForm'
import { TaskFilters } from '@/components/TaskFilters'
import { DashboardModeSelector } from '@/components/DashboardModeSelector'
import { CoopView } from '@/components/CoopView'
import { TodoPagination, PageSizeMode } from '@/components/TodoPagination'
import { useToast } from '@/context/ToastContext'

import { ClipboardList, CheckCircle2, Loader2 } from 'lucide-react'

interface TodoListProps {
  initialTodos: Todo[]
  initialTotalCount: number
  initialCompletedCount: number
  userId: string
}

type OptimisticAction =
  | { type: 'ADD'; payload: Todo }
  | { type: 'TOGGLE'; payload: { id: string; is_complete: boolean } }
  | {
    type: 'UPDATE'
    payload: {
      id: string
      title: string
      description: string | null
      priority?: string | null
      category?: string | null
      due_date?: string | null
    }
  }
  | { type: 'DELETE'; payload: { id: string } }
  | { type: 'REORDER'; payload: Todo[] }

export function TodoList({
  initialTodos,
  initialTotalCount,
  initialCompletedCount,
  userId,
}: TodoListProps) {
  const [mode, setMode] = useState<DashboardMode>('personal')
  const [todos, setTodos] = useState<Todo[]>(initialTodos)
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [pageSize, setPageSize] = useState<PageSizeMode>(10)
  const [currentPage, setCurrentPage] = useState<number>(1)


  // DB Counts fetched via HEAD queries (0 bytes payload)
  const [totalCount, setTotalCount] = useState<number>(initialTotalCount)
  const [completedCount, setCompletedCount] = useState<number>(initialCompletedCount)
  const [filteredCount, setFilteredCount] = useState<number>(initialTotalCount)

  // Infinite Scroll state
  const [hasMore, setHasMore] = useState<boolean>(true)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)

  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()
  const { showToast } = useToast()
  const supabase = createClient()

  // Refresh global counts from DB
  const refreshGlobalCounts = useCallback(async () => {
    const [{ count: totalDbCount }, { count: completedDbCount }] = await Promise.all([
      supabase
        .from('todos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId),
      supabase
        .from('todos')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_complete', true),
    ])

    if (totalDbCount !== null) setTotalCount(totalDbCount)
    if (completedDbCount !== null) setCompletedCount(completedDbCount)
  }, [supabase, userId])

  // Fetch initial or page todos from Supabase (Ordered by position ASC)
  const fetchTodos = useCallback(
    async (page: number, size: PageSizeMode, currentFilter: FilterStatus) => {
      setLoading(true)
      try {
        let query = supabase
          .from('todos')
          .select('id, title, description, is_complete, user_id, created_at, priority, category, due_date, position', { count: 'exact' })
          .eq('user_id', userId)
          .order('position', { ascending: true })
          .order('created_at', { ascending: false })

        if (currentFilter === 'pending') {
          query = query.eq('is_complete', false)
        } else if (currentFilter === 'completed') {
          query = query.eq('is_complete', true)
        }

        const isInfinite = size === 'all'
        const limitSize = isInfinite ? 20 : size
        const from = isInfinite ? 0 : (page - 1) * limitSize
        const to = from + limitSize - 1

        const { data, count: countFiltered, error } = await query.range(from, to)

        if (error) {
          console.error('Erro ao carregar tarefas:', error.message)
          showToast('Erro ao carregar tarefas. Tente novamente.', 'error')
        } else {
          if (data) {
            const fetched = data as Todo[]
            setTodos(fetched)
            if (isInfinite) {
              setHasMore(countFiltered !== null ? fetched.length < countFiltered : false)
            }
          }
          if (countFiltered !== null) setFilteredCount(countFiltered)
        }

        await refreshGlobalCounts()
      } finally {
        setLoading(false)
      }
    },
    [supabase, userId, showToast, refreshGlobalCounts]
  )

  // Fetch next batch of 20 items for Infinite Scroll
  const fetchNextBatch = useCallback(async () => {
    if (pageSize !== 'all' || loadingMore || !hasMore || loading) return
    setLoadingMore(true)

    try {
      let query = supabase
        .from('todos')
        .select('id, title, description, is_complete, user_id, created_at, priority, category, due_date, position')
        .eq('user_id', userId)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })

      if (filter === 'pending') {
        query = query.eq('is_complete', false)
      } else if (filter === 'completed') {
        query = query.eq('is_complete', true)
      }

      const offset = todos.length
      const { data, error } = await query.range(offset, offset + 19)

      if (error) {
        console.error('Erro ao carregar mais tarefas:', error.message)
      } else if (data && data.length > 0) {
        const newBatch = data as Todo[]
        setTodos((prev) => {
          const existingIds = new Set(prev.map((t) => t.id))
          const uniqueNew = newBatch.filter((t) => !existingIds.has(t.id))
          const updated = [...prev, ...uniqueNew]
          if (updated.length >= filteredCount || newBatch.length < 20) {
            setHasMore(false)
          }
          return updated
        })
      } else {
        setHasMore(false)
      }
    } finally {
      setLoadingMore(false)
    }
  }, [supabase, userId, filter, todos.length, pageSize, loadingMore, hasMore, loading, filteredCount])

  // IntersectionObserver for Infinite Scroll Sentinel
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (pageSize !== 'all' || loading || loadingMore || !hasMore) return
      if (observerRef.current) observerRef.current.disconnect()

      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          fetchNextBatch()
        }
      })

      if (node) observerRef.current.observe(node)
    },
    [pageSize, loading, loadingMore, hasMore, fetchNextBatch]
  )

  // Handle filter changes
  const handleFilterChange = (newFilter: FilterStatus) => {
    setFilter(newFilter)
    setCurrentPage(1)
    fetchTodos(1, pageSize, newFilter)
  }

  // Handle page size mode changes (10, 30, 50, 'all')
  const handlePageSizeChange = (newSize: PageSizeMode) => {
    setPageSize(newSize)
    setCurrentPage(1)
    fetchTodos(1, newSize, filter)
  }

  // Handle page navigation for fixed sizes
  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage)
    fetchTodos(newPage, pageSize, filter)
  }

  // React useOptimistic for 0ms instantaneous UI updates
  const [optimisticTodos, setOptimisticTodos] = useOptimistic(
    todos,
    (currentTodos: Todo[], action: OptimisticAction) => {
      switch (action.type) {
        case 'ADD':
          return [action.payload, ...currentTodos]
        case 'TOGGLE':
          return currentTodos.map((t) =>
            t.id === action.payload.id ? { ...t, is_complete: action.payload.is_complete } : t
          )
        case 'UPDATE':
          return currentTodos.map((t) =>
            t.id === action.payload.id
              ? {
                ...t,
                title: action.payload.title,
                description: action.payload.description,
                priority: action.payload.priority,
                category: action.payload.category,
                due_date: action.payload.due_date,
              }
              : t
          )
        case 'DELETE':
          return currentTodos.filter((t) => t.id !== action.payload.id)
        case 'REORDER':
          return action.payload
        default:
          return currentTodos
      }
    }
  )

  // Drag & Drop State
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropGapIndex, setDropGapIndex] = useState<number | null>(null)

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index)
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', index.toString())
  }

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'

    if (e.currentTarget instanceof HTMLElement) {
      const rect = e.currentTarget.getBoundingClientRect()
      const isUpperHalf = e.clientY - rect.top < rect.height / 2
      const calculatedGap = isUpperHalf ? index - 1 : index
      if (dropGapIndex !== calculatedGap) {
        setDropGapIndex(calculatedGap)
      }
    }
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Global drag cleanup listener to guarantee buraco is removed if drag is cancelled anywhere
  useEffect(() => {
    const handleGlobalDragEnd = () => {
      setDraggedIndex(null)
      setDropGapIndex(null)
    }

    window.addEventListener('dragend', handleGlobalDragEnd)
    window.addEventListener('mouseup', handleGlobalDragEnd)
    window.addEventListener('pointerup', handleGlobalDragEnd)

    return () => {
      window.removeEventListener('dragend', handleGlobalDragEnd)
      window.removeEventListener('mouseup', handleGlobalDragEnd)
      window.removeEventListener('pointerup', handleGlobalDragEnd)
    }
  }, [])

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    setDropGapIndex(null)
    if (draggedIndex === null) return

    let calculatedTarget = targetIndex
    if (e.currentTarget instanceof HTMLElement) {
      const rect = e.currentTarget.getBoundingClientRect()
      const isUpperHalf = e.clientY - rect.top < rect.height / 2
      calculatedTarget = isUpperHalf ? targetIndex : targetIndex + 1
    }

    if (draggedIndex < calculatedTarget) {
      calculatedTarget -= 1
    }

    if (draggedIndex === calculatedTarget) {
      setDraggedIndex(null)
      return
    }

    // 1. Instant local reorder
    const newTodos = [...todos]
    const [movedItem] = newTodos.splice(draggedIndex, 1)
    newTodos.splice(calculatedTarget, 0, movedItem)

    const updatedTodos = newTodos.map((item, idx) => ({
      ...item,
      position: idx,
    }))

    startTransition(() => {
      setOptimisticTodos({ type: 'REORDER', payload: updatedTodos })
    })

    setTodos(updatedTodos)
    setDraggedIndex(null)

    // 2. Save positions to Supabase DB
    const upsertPayload = updatedTodos.map((t) => ({
      id: t.id,
      user_id: userId,
      title: t.title,
      description: t.description,
      is_complete: t.is_complete,
      priority: t.priority,
      category: t.category,
      due_date: t.due_date,
      position: t.position,
    }))

    const { error } = await supabase.from('todos').upsert(upsertPayload)

    if (error) {
      console.error('Erro ao reordenar tarefas no DB:', error.message)
      showToast('Não foi possível salvar a nova ordem no servidor.', 'error')
      await fetchTodos(currentPage, pageSize, filter)
    } else {
      showToast('Ordem salva com sucesso!', 'success')
    }
  }

  const handleDragEnd = () => {
    setDraggedIndex(null)
    setDropGapIndex(null)
  }

  // 1. ADD TODO

  const handleAddTodo = async (
    title: string,
    description: string | null,
    priority?: string,
    category?: string,
    due_date?: string | null
  ): Promise<boolean> => {
    const tempId = `temp-${Date.now()}`
    const tempTodo: Todo = {
      id: tempId,
      user_id: userId,
      title,
      description,
      is_complete: false,
      priority: priority || 'medium',
      category: category || 'Pessoal',
      due_date: due_date || null,
      position: 0,
    }

    startTransition(() => {
      setOptimisticTodos({ type: 'ADD', payload: tempTodo })
    })

    const { data, error } = await supabase
      .from('todos')
      .insert([
        {
          user_id: userId,
          title,
          description,
          is_complete: false,
          priority: priority || 'medium',
          category: category || 'Pessoal',
          due_date: due_date || null,
          position: 0,
        },
      ])
      .select()
      .single()

    if (error) {
      showToast('Não foi possível criar a tarefa. Tente novamente.', 'error')
      await fetchTodos(currentPage, pageSize, filter)
      return false
    }

    if (data) {
      showToast('Tarefa criada com sucesso!', 'success')
      setCurrentPage(1)
      await fetchTodos(1, pageSize, filter)
      return true
    }

    return false
  }

  // 2. TOGGLE TODO
  const handleToggleTodo = async (id: string, is_complete: boolean) => {
    startTransition(() => {
      setOptimisticTodos({ type: 'TOGGLE', payload: { id, is_complete } })
    })

    const { error } = await supabase
      .from('todos')
      .update({ is_complete })
      .eq('id', id)

    if (error) {
      showToast('Não foi possível atualizar a tarefa.', 'error')
      await fetchTodos(currentPage, pageSize, filter)
    } else {
      setTodos((prev) =>
        prev.map((t) => (t.id === id ? { ...t, is_complete } : t))
      )
      const change = is_complete ? 1 : -1
      setCompletedCount((prev) => Math.max(0, prev + change))
    }
  }

  // 3. UPDATE TODO
  const handleUpdateTodo = async (
    id: string,
    title: string,
    description: string | null,
    priority?: string | null,
    category?: string | null,
    due_date?: string | null
  ): Promise<boolean> => {
    startTransition(() => {
      setOptimisticTodos({
        type: 'UPDATE',
        payload: { id, title, description, priority, category, due_date },
      })
    })

    const { error } = await supabase
      .from('todos')
      .update({
        title,
        description,
        priority: priority || 'medium',
        category: category || 'Pessoal',
        due_date: due_date || null,
      })
      .eq('id', id)

    if (error) {
      showToast('Não foi possível salvar as alterações da tarefa.', 'error')
      await fetchTodos(currentPage, pageSize, filter)
      return false
    }

    setTodos((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
            ...t,
            title,
            description,
            priority: priority || 'medium',
            category: category || 'Pessoal',
            due_date: due_date || null,
          }
          : t
      )
    )
    showToast('Tarefa atualizada com sucesso!', 'success')
    return true
  }

  // 4. DELETE TODO
  const handleDeleteTodo = async (id: string) => {
    startTransition(() => {
      setOptimisticTodos({ type: 'DELETE', payload: { id } })
    })

    const { error } = await supabase.from('todos').delete().eq('id', id)

    if (error) {
      showToast('Não foi possível excluir a tarefa.', 'error')
      await fetchTodos(currentPage, pageSize, filter)
    } else {
      showToast('Tarefa excluída.', 'success')
      await fetchTodos(currentPage, pageSize, filter)
    }
  }

  const pendingCount = Math.max(0, totalCount - completedCount)

  return (
    <div className="w-full">
      {/* Dashboard Mode Switcher */}
      <DashboardModeSelector mode={mode} onModeChange={setMode} />

      {/* Cooperative Tasks View */}
      {mode === 'coop' && <CoopView userId={userId} />}

      {/* Personal Tasks View */}
      {mode === 'personal' && (
        <>
          {/* Todo Form Input */}
          <TodoForm onAddTodo={handleAddTodo} />

          {/* Task Filters & Counters */}
          <TaskFilters
            currentFilter={filter}
            onFilterChange={handleFilterChange}
            totalCount={totalCount}
            completedCount={completedCount}
            pendingCount={pendingCount}
          />

          {/* Pagination Controls Bar (TOPO) */}
          {filteredCount > 0 && (
            <TodoPagination
              currentPage={currentPage}
              pageSize={pageSize}
              totalItems={filteredCount}
              displayedItemsCount={optimisticTodos.length}
              onPageChange={handlePageChange}
              onPageSizeChange={handlePageSizeChange}
            />
          )}

          {/* Loading Skeletons */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-20 rounded-xl bg-slate-900/60 border border-slate-800/80 animate-pulse p-4 flex items-center justify-between"
                >
                  <div className="flex items-center gap-3 w-full">
                    <div className="h-7 w-7 rounded-full bg-slate-800 shrink-0" />
                    <div className="space-y-2 w-2/3">
                      <div className="h-4 bg-slate-800 rounded w-3/4" />
                      <div className="h-3 bg-slate-800/60 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : optimisticTodos.length === 0 ? (
            /* Empty State View */
            <div className="glass-card rounded-2xl p-10 sm:p-12 text-center flex flex-col items-center justify-center border border-slate-800/80 my-4">
              <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
                <ClipboardList className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-slate-200">
                {filter === 'all'
                  ? 'Nenhuma tarefa encontrada'
                  : filter === 'pending'
                    ? 'Nenhuma tarefa pendente'
                    : 'Nenhuma tarefa concluída'}
              </h3>
              <p className="text-sm text-slate-400 mt-1 max-w-sm">
                {filter === 'all'
                  ? 'Adicione uma nova tarefa acima para começar a organizar seu dia!'
                  : filter === 'pending'
                    ? 'Parabéns! Todas as suas tarefas foram concluídas.'
                    : 'Você ainda não concluiu nenhuma tarefa nesta lista.'}
              </p>
            </div>
          ) : (
            /* Todo Cards List with Reordering */
            <div className="space-y-3">
              {optimisticTodos.map((todo, idx) => {
                let tiltMode: 'tilt-down' | 'tilt-up' | null = null
                if (draggedIndex !== null && dropGapIndex !== null) {
                  if (idx === dropGapIndex) {
                    tiltMode = 'tilt-down'
                  } else if (idx === dropGapIndex + 1) {
                    tiltMode = 'tilt-up'
                  }
                }

                return (
                  <TodoItem
                    key={todo.id}
                    todo={todo}
                    index={idx}
                    onToggle={handleToggleTodo}
                    onUpdate={handleUpdateTodo}
                    onDelete={handleDeleteTodo}
                    onDragStart={handleDragStart}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={handleDrop}
                    onDragEnd={handleDragEnd}
                    isDragging={draggedIndex === idx}
                    tiltMode={tiltMode}
                  />
                )
              })}

              {/* Infinite Scroll Sentinel & Loader */}
              {pageSize === 'all' && (
                <div ref={sentinelRef} className="pt-2 text-center">
                  {loadingMore ? (
                    <div className="py-4 flex items-center justify-center gap-2 text-xs text-indigo-400 font-medium">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Carregando mais 20 tarefas...</span>
                    </div>
                  ) : hasMore ? (
                    <button
                      type="button"
                      onClick={fetchNextBatch}
                      className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                    >
                      Carregar mais 20 tarefas
                    </button>
                  ) : (
                    <div className="py-4 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                      <span>Todas as {filteredCount} tarefas foram carregadas.</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
