'use client'

import { ArrowRight } from 'lucide-react'
import { TaskGroup } from '@/types/coop'

interface GroupCardProps {
  group: TaskGroup
  onEnter: (group: TaskGroup) => void
}

export function GroupCard({ group, onEnter }: GroupCardProps) {
  return (
    <div className="group relative flex items-center justify-between gap-4 p-5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-indigo-500/30 hover:shadow-lg hover:shadow-indigo-500/5 transition-all duration-300 cursor-default">
      {/* Subtle glow on hover */}
      <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/0 to-violet-500/0 group-hover:from-indigo-500/5 group-hover:to-violet-500/5 transition-all duration-300 pointer-events-none" />

      <div className="flex flex-col gap-1.5 min-w-0">
        {/* Group name */}
        <span className="text-slate-100 font-bold text-base truncate">{group.name}</span>

        {/* Group code badge */}
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-800/80 border border-slate-700/50">
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />
            <span className="font-mono text-xs font-bold text-indigo-300 tracking-widest">
              {group.code}
            </span>
          </span>
        </div>
      </div>

      {/* Enter button */}
      <button
        onClick={() => onEnter(group)}
        className="shrink-0 flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 hover:bg-gradient-to-r hover:from-indigo-500 hover:to-violet-600 border border-indigo-500/30 hover:border-transparent text-indigo-300 hover:text-white text-sm font-semibold transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
        aria-label={`Entrar no grupo ${group.name}`}
      >
        <span className="hidden sm:inline">Entrar</span>
        <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  )
}
