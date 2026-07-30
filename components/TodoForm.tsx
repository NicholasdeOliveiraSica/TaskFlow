'use client'

import { useState } from 'react'
import { Plus, Loader2, Sparkles, AlertCircle, Tag, Calendar } from 'lucide-react'

interface TodoFormProps {
  onAddTodo: (
    title: string,
    description: string | null,
    priority?: string,
    category?: string,
    due_date?: string | null
  ) => Promise<boolean>
}

export function TodoForm({ onAddTodo }: TodoFormProps) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [priority, setPriority] = useState<string>('medium')
  const [category, setCategory] = useState<string>('Personal')
  const [dueDate, setDueDate] = useState<string>('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    const trimmedTitle = title.trim()
    if (!trimmedTitle) return

    const cleanDescription = description.trim() ? description.trim() : null
    const cleanDueDate = dueDate.trim() ? dueDate.trim() : null

    setIsSubmitting(true)
    const success = await onAddTodo(trimmedTitle, cleanDescription, priority, category, cleanDueDate)
    setIsSubmitting(false)

    if (success) {
      setTitle('')
      setDescription('')
      setPriority('medium')
      setCategory('Personal')
      setDueDate('')
    }
  }

  const isFormValid = title.trim().length > 0

  return (
    <div className="glass-panel rounded-2xl p-5 sm:p-6 shadow-xl mb-8 border border-slate-800/80">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-4 h-4 text-indigo-400" />
        <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300">
          New Task
        </h2>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="todo-title" className="sr-only">
            Task Title
          </label>
          <input
            id="todo-title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What needs to be done?"
            className="w-full px-4 py-3 rounded-xl bg-slate-900/80 border border-slate-700/70 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 min-h-[44px]"
          />
        </div>

        <div>
          <label htmlFor="todo-desc" className="sr-only">
            Optional Description
          </label>
          <textarea
            id="todo-desc"
            rows={2}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Additional details (optional)..."
            className="w-full px-4 py-2.5 rounded-xl bg-slate-900/80 border border-slate-700/70 text-slate-100 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 resize-none text-sm"
          />
        </div>

        {/* Priority, Category & Due Date Controls */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-1">
          {/* Priority */}
          <div>
            <label htmlFor="form-priority" className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1 font-medium">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400" />
              Priority
            </label>
            <select
              id="form-priority"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/70 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] cursor-pointer font-medium"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">Urgent</option>
            </select>
          </div>

          {/* Category */}
          <div>
            <label htmlFor="form-category" className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1 font-medium">
              <Tag className="w-3.5 h-3.5 text-indigo-400" />
              Category
            </label>
            <select
              id="form-category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/70 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] cursor-pointer font-medium"
            >
              <option value="Work">Work</option>
              <option value="Personal">Personal</option>
              <option value="Studies">Studies</option>
              <option value="Focus">Focus</option>
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label htmlFor="form-due-date" className="block text-xs text-slate-400 mb-1.5 flex items-center gap-1 font-medium">
              <Calendar className="w-3.5 h-3.5 text-cyan-400" />
              Due Date
            </label>
            <input
              id="form-due-date"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-slate-900/80 border border-slate-700/70 text-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 min-h-[40px] cursor-pointer"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={!isFormValid || isSubmitting}
            className="min-h-[44px] px-6 py-2.5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-sm shadow-lg shadow-indigo-500/25 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer w-full sm:w-auto"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Adding...</span>
              </>
            ) : (
              <>
                <Plus className="w-4 h-4" />
                <span>Add Task</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}
