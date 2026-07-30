'use client'

import {
  useState,
  useCallback,
  useTransition,
  useOptimistic,
  useRef,
  useEffect,
} from 'react'
import { createClient } from '@/lib/supabase/client'
import { CoopTask } from '@/types/coop'
import { TaskGroup } from '@/types/coop'
import { FilterStatus } from '@/types/todo'
import { TodoItem } from '@/components/TodoItem'
import { TodoForm } from '@/components/TodoForm'
import { TaskFilters } from '@/components/TaskFilters'
import { TodoPagination, PageSizeMode } from '@/components/TodoPagination'
import { useToast } from '@/context/ToastContext'
import { ClipboardList, CheckCircle2, Loader2 } from 'lucide-react'

interface CoopTaskListProps {
  group: TaskGroup
  userId: string
}

type OptimisticAction =
  | { type: 'ADD'; payload: CoopTask }
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
  | { type: 'REORDER'; payload: CoopTask[] }

// CoopTask shares the same fields as Todo — adapt for TodoItem compatibility
function coopToTodo(task: CoopTask) {
  return {
    id: task.id,
    user_id: task.created_by,
    title: task.title,
    description: task.description,
    is_complete: task.is_complete,
    priority: task.priority,
    category: task.category,
    due_date: task.due_date,
    position: task.position,
    created_at: task.created_at,
  }
}

export function CoopTaskList({ group, userId }: CoopTaskListProps) {
  const [tasks, setTasks] = useState<CoopTask[]>([])
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [pageSize, setPageSize] = useState<PageSizeMode>(10)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [completedCount, setCompletedCount] = useState(0)
  const [filteredCount, setFilteredCount] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [loading, setLoading] = useState(true)
  const [, startTransition] = useTransition()
  const { showToast } = useToast()
  const supabase = createClient()

  const refreshGlobalCounts = useCallback(async () => {
    const [{ count: total }, { count: completed }] = await Promise.all([
      supabase
        .from('coop_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id),
      supabase
        .from('coop_tasks')
        .select('*', { count: 'exact', head: true })
        .eq('group_id', group.id)
        .eq('is_complete', true),
    ])
    if (total !== null) setTotalCount(total)
    if (completed !== null) setCompletedCount(completed)
  }, [supabase, group.id])

  const fetchTasks = useCallback(
    async (page: number, size: PageSizeMode, currentFilter: FilterStatus) => {
      setLoading(true)
      try {
        let query = supabase
          .from('coop_tasks')
          .select(
            'id, group_id, created_by, title, description, is_complete, priority, category, due_date, position, created_at',
            { count: 'exact' }
          )
          .eq('group_id', group.id)
          .order('position', { ascending: true })
          .order('created_at', { ascending: false })

        if (currentFilter === 'pending') query = query.eq('is_complete', false)
        else if (currentFilter === 'completed') query = query.eq('is_complete', true)

        const isInfinite = size === 'all'
        const limitSize = isInfinite ? 20 : size
        const from = isInfinite ? 0 : (page - 1) * limitSize
        const to = from + limitSize - 1

        const { data, count: countFiltered, error } = await query.range(from, to)

        if (error) {
          showToast('Error loading group tasks.', 'error')
        } else {
          if (data) {
            setTasks(data as CoopTask[])
            if (isInfinite) {
              setHasMore(countFiltered !== null ? data.length < countFiltered : false)
            }
          }
          if (countFiltered !== null) setFilteredCount(countFiltered)
        }
        await refreshGlobalCounts()
      } finally {
        setLoading(false)
      }
    },
    [supabase, group.id, showToast, refreshGlobalCounts]
  )

  useEffect(() => {
    fetchTasks(1, pageSize, filter)
  }, [group.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const fetchNextBatch = useCallback(async () => {
    if (pageSize !== 'all' || loadingMore || !hasMore || loading) return
    setLoadingMore(true)
    try {
      let query = supabase
        .from('coop_tasks')
        .select(
          'id, group_id, created_by, title, description, is_complete, priority, category, due_date, position, created_at'
        )
        .eq('group_id', group.id)
        .order('position', { ascending: true })
        .order('created_at', { ascending: false })

      if (filter === 'pending') query = query.eq('is_complete', false)
      else if (filter === 'completed') query = query.eq('is_complete', true)

      const offset = tasks.length
      const { data, error } = await query.range(offset, offset + 19)

      if (error) console.error('Error loading more tasks:', error.message)
      else if (data && data.length > 0) {
        const newBatch = data as CoopTask[]
        setTasks((prev) => {
          const existing = new Set(prev.map((t) => t.id))
          const unique = newBatch.filter((t) => !existing.has(t.id))
          const updated = [...prev, ...unique]
          if (updated.length >= filteredCount || newBatch.length < 20) setHasMore(false)
          return updated
        })
      } else {
        setHasMore(false)
      }
    } finally {
      setLoadingMore(false)
    }
  }, [supabase, group.id, filter, tasks.length, pageSize, loadingMore, hasMore, loading, filteredCount])

  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useCallback(
    (node: HTMLDivElement | null) => {
      if (pageSize !== 'all' || loading || loadingMore || !hasMore) return
      if (observerRef.current) observerRef.current.disconnect()
      observerRef.current = new IntersectionObserver((entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) fetchNextBatch()
      })
      if (node) observerRef.current.observe(node)
    },
    [pageSize, loading, loadingMore, hasMore, fetchNextBatch]
  )

  // Drag & Drop
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null)
  const [dropGapIndex, setDropGapIndex] = useState<number | null>(null)

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
      const calculatedGap = e.clientY - rect.top < rect.height / 2 ? index - 1 : index
      if (dropGapIndex !== calculatedGap) setDropGapIndex(calculatedGap)
    }
  }

  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault() }

  useEffect(() => {
    const cleanup = () => { setDraggedIndex(null); setDropGapIndex(null) }
    window.addEventListener('dragend', cleanup)
    window.addEventListener('mouseup', cleanup)
    window.addEventListener('pointerup', cleanup)
    return () => {
      window.removeEventListener('dragend', cleanup)
      window.removeEventListener('mouseup', cleanup)
      window.removeEventListener('pointerup', cleanup)
    }
  }, [])

  const handleDrop = async (e: React.DragEvent, targetIndex: number) => {
    e.preventDefault()
    setDropGapIndex(null)
    if (draggedIndex === null) return

    let calculated = targetIndex
    if (e.currentTarget instanceof HTMLElement) {
      const rect = e.currentTarget.getBoundingClientRect()
      calculated = e.clientY - rect.top < rect.height / 2 ? targetIndex : targetIndex + 1
    }
    if (draggedIndex < calculated) calculated -= 1
    if (draggedIndex === calculated) { setDraggedIndex(null); return }

    const newTasks = [...tasks]
    const [moved] = newTasks.splice(draggedIndex, 1)
    newTasks.splice(calculated, 0, moved)
    const updated = newTasks.map((t, idx) => ({ ...t, position: idx }))

    startTransition(() => setOptimisticTasks({ type: 'REORDER', payload: updated }))
    setTasks(updated)
    setDraggedIndex(null)

    const upsert = updated.map((t) => ({
      id: t.id,
      group_id: t.group_id,
      created_by: t.created_by,
      title: t.title,
      description: t.description,
      is_complete: t.is_complete,
      priority: t.priority,
      category: t.category,
      due_date: t.due_date,
      position: t.position,
    }))

    const { error } = await supabase.from('coop_tasks').upsert(upsert)
    if (error) {
      showToast('Could not save new order.', 'error')
      await fetchTasks(currentPage, pageSize, filter)
    } else {
      showToast('Order saved successfully!', 'success')
    }
  }

  const handleDragEnd = () => { setDraggedIndex(null); setDropGapIndex(null) }

  // Optimistic UI
  const [optimisticTasks, setOptimisticTasks] = useOptimistic(
    tasks,
    (current: CoopTask[], action: OptimisticAction) => {
      switch (action.type) {
        case 'ADD': return [action.payload, ...current]
        case 'TOGGLE': return current.map((t) => t.id === action.payload.id ? { ...t, is_complete: action.payload.is_complete } : t)
        case 'UPDATE': return current.map((t) => t.id === action.payload.id ? { ...t, ...action.payload } : t)
        case 'DELETE': return current.filter((t) => t.id !== action.payload.id)
        case 'REORDER': return action.payload
        default: return current
      }
    }
  )

  // CRUD handlers
  const handleAddTodo = async (
    title: string,
    description: string | null,
    priority?: string,
    category?: string,
    due_date?: string | null
  ): Promise<boolean> => {
    const tempTask: CoopTask = {
      id: `temp-${Date.now()}`,
      group_id: group.id,
      created_by: userId,
      title,
      description,
      is_complete: false,
      priority: priority || 'medium',
      category: category || 'Personal',
      due_date: due_date || null,
      position: 0,
      created_at: null,
    }
    startTransition(() => setOptimisticTasks({ type: 'ADD', payload: tempTask }))

    const { data, error } = await supabase
      .from('coop_tasks')
      .insert([{
        group_id: group.id,
        created_by: userId,
        title,
        description,
        is_complete: false,
        priority: priority || 'medium',
        category: category || 'Personal',
        due_date: due_date || null,
        position: 0,
      }])
      .select()
      .single()

    if (error) {
      showToast('Could not create task.', 'error')
      await fetchTasks(currentPage, pageSize, filter)
      return false
    }

    if (data) {
      showToast('Task created successfully!', 'success')
      setCurrentPage(1)
      await fetchTasks(1, pageSize, filter)
      return true
    }
    return false
  }

  const handleToggleTodo = async (id: string, is_complete: boolean) => {
    startTransition(() => setOptimisticTasks({ type: 'TOGGLE', payload: { id, is_complete } }))
    const { error } = await supabase.from('coop_tasks').update({ is_complete }).eq('id', id)
    if (error) {
      showToast('Could not update task.', 'error')
      await fetchTasks(currentPage, pageSize, filter)
    } else {
      setTasks((prev) => prev.map((t) => t.id === id ? { ...t, is_complete } : t))
      setCompletedCount((prev) => Math.max(0, prev + (is_complete ? 1 : -1)))
    }
  }

  const handleUpdateTodo = async (
    id: string,
    title: string,
    description: string | null,
    priority?: string | null,
    category?: string | null,
    due_date?: string | null
  ): Promise<boolean> => {
    startTransition(() =>
      setOptimisticTasks({ type: 'UPDATE', payload: { id, title, description, priority, category, due_date } })
    )
    const { error } = await supabase
      .from('coop_tasks')
      .update({ title, description, priority: priority || 'medium', category: category || 'Personal', due_date: due_date || null })
      .eq('id', id)

    if (error) {
      showToast('Could not save changes.', 'error')
      await fetchTasks(currentPage, pageSize, filter)
      return false
    }
    setTasks((prev) =>
      prev.map((t) =>
        t.id === id
          ? {
              ...t,
              title,
              description,
              priority: priority ?? null,
              category: category ?? null,
              due_date: due_date ?? null,
            }
          : t
      )
    )
    showToast('Task updated!', 'success')
    return true
  }

  const handleDeleteTodo = async (id: string) => {
    startTransition(() => setOptimisticTasks({ type: 'DELETE', payload: { id } }))
    const { error } = await supabase.from('coop_tasks').delete().eq('id', id)
    if (error) {
      showToast('Could not delete task.', 'error')
      await fetchTasks(currentPage, pageSize, filter)
    } else {
      showToast('Task deleted.', 'success')
      await fetchTasks(currentPage, pageSize, filter)
    }
  }

  const pendingCount = Math.max(0, totalCount - completedCount)

  return (
    <div className="w-full">
      {/* Group header */}
      <div className="flex items-center gap-3 mb-4 p-4 rounded-xl bg-slate-900/40 border border-slate-800/60">
        <div className="flex flex-col gap-0.5 min-w-0">
          <span className="text-base font-bold text-slate-100 truncate">{group.name}</span>
          <span className="inline-flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Group code:</span>
            <span className="font-mono text-xs font-bold text-indigo-400 tracking-widest">{group.code}</span>
          </span>
        </div>
      </div>

      <TodoForm onAddTodo={handleAddTodo} />

      <TaskFilters
        currentFilter={filter}
        onFilterChange={(f) => { setFilter(f); setCurrentPage(1); fetchTasks(1, pageSize, f) }}
        totalCount={totalCount}
        completedCount={completedCount}
        pendingCount={pendingCount}
      />

      {filteredCount > 10 && (
        <TodoPagination
          currentPage={currentPage}
          pageSize={pageSize}
          totalItems={filteredCount}
          displayedItemsCount={optimisticTasks.length}
          onPageChange={(p) => { setCurrentPage(p); fetchTasks(p, pageSize, filter) }}
          onPageSizeChange={(s) => { setPageSize(s); setCurrentPage(1); fetchTasks(1, s, filter) }}
        />
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 rounded-xl bg-slate-900/60 border border-slate-800/80 animate-pulse p-4 flex items-center justify-between">
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
      ) : optimisticTasks.length === 0 ? (
        <div className="glass-card rounded-2xl p-10 sm:p-12 text-center flex flex-col items-center justify-center border border-slate-800/80 my-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mb-4 text-indigo-400">
            <ClipboardList className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-bold text-slate-200">
            {filter === 'all' ? 'No tasks in group' : filter === 'pending' ? 'No pending tasks' : 'No completed tasks'}
          </h3>
          <p className="text-sm text-slate-400 mt-1 max-w-sm">
            {filter === 'all' ? 'Add the first group task above!' : filter === 'pending' ? 'All group tasks are completed.' : 'No completed tasks yet.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {optimisticTasks.map((task, idx) => {
            let tiltMode: 'tilt-down' | 'tilt-up' | null = null
            if (draggedIndex !== null && dropGapIndex !== null) {
              if (idx === dropGapIndex) tiltMode = 'tilt-down'
              else if (idx === dropGapIndex + 1) tiltMode = 'tilt-up'
            }
            return (
              <TodoItem
                key={task.id}
                todo={coopToTodo(task)}
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

          {pageSize === 'all' && (
            <div ref={sentinelRef} className="pt-2 text-center">
              {loadingMore ? (
                <div className="py-4 flex items-center justify-center gap-2 text-xs text-indigo-400 font-medium">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Loading more tasks...</span>
                </div>
              ) : hasMore ? (
                <button
                  type="button"
                  onClick={fetchNextBatch}
                  className="py-2.5 px-5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-indigo-400 hover:text-indigo-300 transition cursor-pointer"
                >
                  Load more
                </button>
              ) : (
                <div className="py-4 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                  <span>All {filteredCount} tasks loaded.</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
