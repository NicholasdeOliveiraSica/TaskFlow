'use client'

import { useState } from 'react'
import { Todo } from '@/types/todo'
import { Check, Edit2, Trash2, X, Save, Loader2, GripVertical, Calendar, Tag, AlertCircle } from 'lucide-react'

interface TodoItemProps {
  todo: Todo
  index: number
  onToggle: (id: string, is_complete: boolean) => Promise<void>
  onUpdate: (
    id: string,
    title: string,
    description: string | null,
    priority?: string | null,
    category?: string | null,
    due_date?: string | null
  ) => Promise<boolean>
  onDelete: (id: string) => Promise<void>
  onDragStart?: (e: React.DragEvent, index: number) => void
  onDragOver?: (e: React.DragEvent, index: number) => void
  onDragLeave?: (e: React.DragEvent, index: number) => void
  onDrop?: (e: React.DragEvent, index: number) => void
  onDragEnd?: (e: React.DragEvent) => void
  isDragging?: boolean
  tiltMode?: 'tilt-down' | 'tilt-up' | null
}

export function TodoItem({
  todo,
  index,
  onToggle,
  onUpdate,
  onDelete,
  onDragStart,
  onDragOver,
  onDragLeave,
  onDrop,
  onDragEnd,
  isDragging,
  tiltMode,
}: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editTitle, setEditTitle] = useState(todo.title)
  const [editDescription, setEditDescription] = useState(todo.description || '')
  const [editPriority, setEditPriority] = useState<string>(todo.priority || 'medium')
  const [editCategory, setEditCategory] = useState<string>(todo.category || 'Personal')
  const [editDueDate, setEditDueDate] = useState<string>(todo.due_date || '')
  const [isSaving, setIsSaving] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  const isCompleted = Boolean(todo.is_complete)
  const priority = (todo.priority || 'medium').toLowerCase()
  const category = todo.category || 'Personal'

  // Priority Styles (4px Left Border & Badges)
  const priorityMap: Record<string, { border: string; badge: string; label: string }> = {
    high: {
      border: 'border-l-rose-500',
      badge: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
      label: 'Urgent',
    },
    medium: {
      border: 'border-l-amber-400',
      badge: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
      label: 'Medium',
    },
    low: {
      border: 'border-l-emerald-400',
      badge: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
      label: 'Low',
    },
  }

  const currentPriority = priorityMap[priority] || priorityMap.medium

  // Category Badge Styles
  const categoryMap: Record<string, string> = {
    Work: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    Trabalho: 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
    Personal: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    Pessoal: 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30',
    Studies: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    Estudos: 'bg-violet-500/15 text-violet-300 border-violet-500/30',
    Focus: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
    Foco: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  }
  const currentCategoryStyle = categoryMap[category] || 'bg-slate-800 text-slate-300 border-slate-700'

  const handleToggle = async () => {
    setIsToggling(true)
    await onToggle(todo.id, !isCompleted)
    setIsToggling(false)
  }

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedTitle = editTitle.trim()
    if (!trimmedTitle) return

    setIsSaving(true)
    const success = await onUpdate(
      todo.id,
      trimmedTitle,
      editDescription.trim() ? editDescription.trim() : null,
      editPriority,
      editCategory,
      editDueDate.trim() ? editDueDate.trim() : null
    )
    setIsSaving(false)

    if (success) {
      setIsEditing(false)
    }
  }

  const handleDelete = async () => {
    setIsDeleting(true)
    await onDelete(todo.id)
  }

  const formatDate = (dateStr: string) => {
    if (!dateStr) return null
    const [year, month, day] = dateStr.split('-')
    if (year && month && day) return `${month}/${day}/${year}`
    return dateStr
  }

  // 3D Perspective Tilt Class Computation
  let tiltClass3D = ''
  if (tiltMode === 'tilt-down') {
    tiltClass3D = '[transform:perspective(1000px)_rotateX(-2deg)_translateZ(4px)] origin-top border-indigo-500/80 shadow-[0_12px_25px_rgba(99,102,241,0.25)] bg-indigo-950/40 ring-1 ring-indigo-500/30'
  } else if (tiltMode === 'tilt-up') {
    tiltClass3D = '[transform:perspective(1000px)_rotateX(2deg)_translateZ(4px)] origin-bottom border-indigo-500/80 shadow-[0_-12px_25px_rgba(99,102,241,0.25)] bg-indigo-950/40 ring-1 ring-indigo-500/30'
  }


  return (
    <div className="w-full relative group/item [perspective:1000px]">
      <div
        draggable={!isEditing}
        onDragStart={(e) => onDragStart?.(e, index)}
        onDragOver={(e) => onDragOver?.(e, index)}
        onDragLeave={(e) => onDragLeave?.(e, index)}
        onDrop={(e) => onDrop?.(e, index)}
        onDragEnd={(e) => onDragEnd?.(e)}
        className={`group relative rounded-xl p-4 sm:p-5 transition-all duration-200 border-l-4 border-y border-r shadow-md ${isDragging
          ? 'opacity-30 border-2 border-dashed border-slate-700/80 bg-slate-950/90 shadow-[inset_0_3px_12px_rgba(0,0,0,0.95)] scale-[0.99] select-none'
          : tiltMode
            ? tiltClass3D
            : 'hover:-translate-y-0.5 hover:shadow-xl hover:shadow-indigo-500/10'

          } ${currentPriority.border} ${isCompleted
            ? 'bg-slate-950/60 border-slate-900 opacity-60'
            : 'bg-gradient-to-r from-slate-900/90 via-slate-900/70 to-slate-950/80 border-slate-800/80 hover:border-slate-700'
          }`}
      >
        {isEditing ? (
          /* Edit Mode Form */
          <form onSubmit={handleSaveEdit} className="space-y-3">
            <div>
              <label htmlFor={`edit-title-${todo.id}`} className="sr-only">
                Edit Title
              </label>
              <input
                id={`edit-title-${todo.id}`}
                type="text"
                required
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[44px]"
              />
            </div>
            <div>
              <label htmlFor={`edit-desc-${todo.id}`} className="sr-only">
                Edit Description
              </label>
              <textarea
                id={`edit-desc-${todo.id}`}
                rows={2}
                value={editDescription}
                onChange={(e) => setEditDescription(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-800 border border-slate-700 text-slate-100 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <div>
                <label htmlFor={`edit-priority-${todo.id}`} className="block text-[11px] text-slate-400 mb-1 font-medium">
                  Priority
                </label>
                <select
                  id={`edit-priority-${todo.id}`}
                  value={editPriority}
                  onChange={(e) => setEditPriority(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">Urgent</option>
                </select>
              </div>

              <div>
                <label htmlFor={`edit-category-${todo.id}`} className="block text-[11px] text-slate-400 mb-1 font-medium">
                  Category
                </label>
                <select
                  id={`edit-category-${todo.id}`}
                  value={editCategory}
                  onChange={(e) => setEditCategory(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                >
                  <option value="Work">Work</option>
                  <option value="Personal">Personal</option>
                  <option value="Studies">Studies</option>
                  <option value="Focus">Focus</option>
                </select>
              </div>

              <div>
                <label htmlFor={`edit-date-${todo.id}`} className="block text-[11px] text-slate-400 mb-1 font-medium">
                  Due Date
                </label>
                <input
                  id={`edit-date-${todo.id}`}
                  type="date"
                  value={editDueDate}
                  onChange={(e) => setEditDueDate(e.target.value)}
                  className="w-full px-2.5 py-1.5 rounded-lg bg-slate-800 border border-slate-700 text-slate-200 text-xs"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false)
                  setEditTitle(todo.title)
                  setEditDescription(todo.description || '')
                  setEditPriority(todo.priority || 'medium')
                  setEditCategory(todo.category || 'Personal')
                  setEditDueDate(todo.due_date || '')
                }}
                className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg border border-slate-700 text-slate-300 hover:bg-slate-800 text-xs flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </button>
              <button
                type="submit"
                disabled={isSaving || !editTitle.trim()}
                className="min-h-[44px] min-w-[44px] px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1 cursor-pointer disabled:opacity-50"
              >
                {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                <span>Save</span>
              </button>
            </div>
          </form>
        ) : (
          /* Normal Display View */
          <div className="flex items-start justify-between gap-3">
            {/* Drag Handle, Checkbox and Content */}
            <div className="flex items-start gap-2.5 sm:gap-3.5 min-w-0 flex-1">
              {/* Refined Futuristic Drag Handle Pill */}
              <div
                className="mt-0.5 text-slate-500 group-hover/item:text-indigo-400 hover:text-cyan-300 transition-all duration-200 cursor-grab active:cursor-grabbing shrink-0 flex items-center p-1 rounded-lg bg-slate-900/80 border border-slate-800/80 hover:bg-indigo-500/15 hover:border-indigo-500/40 hover:shadow-md hover:shadow-indigo-500/20 active:scale-95"
                title="Click and drag to reorder"
              >
                <GripVertical className="w-4 h-4" />
              </div>

              {/* Checkbox Button */}
              <button
                type="button"
                onClick={handleToggle}
                disabled={isToggling}
                aria-label={isCompleted ? 'Mark as pending' : 'Mark as completed'}
                className={`mt-0.5 min-h-[44px] min-w-[44px] h-7 w-7 rounded-full flex items-center justify-center border transition-all duration-200 shrink-0 cursor-pointer shadow-sm ${isCompleted
                  ? 'bg-emerald-500 border-emerald-400 text-slate-950 font-bold scale-105'
                  : 'border-slate-600 hover:border-indigo-400 hover:text-indigo-400 bg-slate-900/90 text-slate-500/40 hover:scale-105'
                  }`}
              >
                {isToggling ? (
                  <Loader2 className="w-3.5 h-3.5 text-slate-400 animate-spin" />
                ) : isCompleted ? (
                  <Check className="w-4 h-4 stroke-[3]" />
                ) : (
                  <X className="w-3.5 h-3.5 opacity-40 hover:opacity-80 transition-opacity" />
                )}
              </button>

              {/* Content Details */}
              <div className="min-w-0 flex-1 pt-0.5">
                <h3
                  className={`text-sm font-bold tracking-tight break-words transition-all duration-200 ${isCompleted ? 'line-through text-slate-400 opacity-60' : 'text-slate-100'
                    }`}
                >
                  {todo.title}
                </h3>

                {todo.description && (
                  <p
                    className={`mt-1 text-xs break-words leading-relaxed ${isCompleted ? 'text-slate-500 line-through opacity-50' : 'text-slate-400'
                      }`}
                  >
                    {todo.description}
                  </p>
                )}

                {/* Tags, Priority & Due Date */}
                <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mt-2.5">
                  {/* Category Tag */}
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border flex items-center gap-1 ${currentCategoryStyle}`}>
                    <Tag className="w-2.5 h-2.5" />
                    <span>{category}</span>
                  </span>

                  {/* Priority Badge */}
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-semibold tracking-wide border flex items-center gap-1 ${currentPriority.badge}`}>
                    <AlertCircle className="w-2.5 h-2.5" />
                    <span>{currentPriority.label}</span>
                  </span>

                  {/* Due Date */}
                  {todo.due_date && (
                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium text-slate-400 bg-slate-800/80 border border-slate-700/60 flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-indigo-400" />
                      <span>Due: {formatDate(todo.due_date)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                aria-label="Edit task"
                title="Edit task"
                className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/15 transition cursor-pointer flex items-center justify-center"
              >
                <Edit2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleDelete}
                disabled={isDeleting}
                aria-label="Delete task"
                title="Delete task"
                className="min-h-[44px] min-w-[44px] p-2 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/15 transition cursor-pointer flex items-center justify-center disabled:opacity-50"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin text-rose-400" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
