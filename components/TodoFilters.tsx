'use client'

import { FilterStatus } from '@/types/todo'
import { CheckCircle2, ListFilter } from 'lucide-react'

interface TodoFiltersProps {
  currentFilter: FilterStatus
  onFilterChange: (filter: FilterStatus) => void
  totalCount: number
  completedCount: number
  pendingCount: number
}

export function TodoFilters({
  currentFilter,
  onFilterChange,
  totalCount,
  completedCount,
  pendingCount,
}: TodoFiltersProps) {
  const tabs: { id: FilterStatus; label: string; count: number }[] = [
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

      {/* Tabs */}
      <div
        role="tablist"
        aria-label="Filtros de tarefas"
        className="flex items-center p-1 rounded-xl bg-slate-900/80 border border-slate-800/80 self-start sm:self-auto"
      >
        <ListFilter className="w-3.5 h-3.5 text-slate-500 ml-2.5 mr-1 hidden xs:block" />
        {tabs.map((tab) => {
          const isActive = currentFilter === tab.id
          return (
            <button
              key={tab.id}
              role="tab"
              aria-selected={isActive}
              onClick={() => onFilterChange(tab.id)}
              className={`min-h-[36px] px-3.5 py-1.5 rounded-lg text-xs font-semibold transition duration-200 flex items-center gap-1.5 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                isActive
                  ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-md shadow-indigo-500/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                  isActive ? 'bg-white/20 text-white' : 'bg-slate-800 text-slate-400'
                }`}
              >
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
