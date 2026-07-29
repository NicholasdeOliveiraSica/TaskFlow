'use client'

import { FilterStatus } from '@/types/todo'
import { CheckCircle2, ChevronDown } from 'lucide-react'

interface TaskFiltersProps {
  currentFilter: FilterStatus
  onFilterChange: (filter: FilterStatus) => void
  totalCount: number
  completedCount: number
  pendingCount: number
}

export function TaskFilters({
  currentFilter,
  onFilterChange,
  totalCount,
  completedCount,
  pendingCount,
}: TaskFiltersProps) {
  const options: { id: FilterStatus; label: string; count: number }[] = [
    { id: 'all', label: 'Todas', count: totalCount },
    { id: 'pending', label: 'Pendentes', count: pendingCount },
    { id: 'completed', label: 'Concluídas', count: completedCount },
  ]

  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
      {/* Counters display */}
      <div className="flex items-center gap-2 text-sm text-slate-400">
        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong className="text-slate-200 font-semibold">{completedCount}</strong> de{' '}
          <strong className="text-slate-200 font-semibold">{totalCount}</strong> tarefas concluídas
        </span>
      </div>

      {/* Filter select */}
      <div className="relative self-start sm:self-auto">
        <select
          id="task-filter-select"
          value={currentFilter}
          onChange={(e) => onFilterChange(e.target.value as FilterStatus)}
          className="appearance-none min-h-[38px] pl-4 pr-10 py-1.5 rounded-xl bg-slate-900/80 border border-slate-800/80 text-slate-200 text-xs font-semibold cursor-pointer transition duration-200 hover:border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60"
          aria-label="Filtrar tarefas"
        >
          {options.map((opt) => (
            <option key={opt.id} value={opt.id} className="bg-slate-900 text-slate-200">
              {opt.label} ({opt.count})
            </option>
          ))}
        </select>
        {/* Custom chevron icon */}
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">
          <ChevronDown className="w-3.5 h-3.5" />
        </div>
      </div>
    </div>
  )
}
