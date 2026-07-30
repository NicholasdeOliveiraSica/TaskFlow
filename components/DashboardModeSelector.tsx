'use client'

import { User, Users } from 'lucide-react'
import { DashboardMode } from '@/types/coop'

interface DashboardModeSelectorProps {
  mode: DashboardMode
  onModeChange: (mode: DashboardMode) => void
}

const modes: { id: DashboardMode; label: string; Icon: typeof User }[] = [
  { id: 'personal', label: 'My Tasks', Icon: User },
  { id: 'coop', label: 'Group Tasks', Icon: Users },
]

export function DashboardModeSelector({ mode, onModeChange }: DashboardModeSelectorProps) {
  return (
    <div
      role="tablist"
      aria-label="View mode"
      className="flex items-center p-1 rounded-2xl bg-slate-900/80 border border-slate-800/80 self-start mb-6 w-full sm:w-auto"
    >
      {modes.map(({ id, label, Icon }) => {
        const isActive = mode === id
        return (
          <button
            key={id}
            role="tab"
            aria-selected={isActive}
            onClick={() => onModeChange(id)}
            className={`flex-1 sm:flex-none flex items-center justify-center gap-2 min-h-[40px] px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-300 ease-in-out cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500/60 ${
              isActive
                ? 'bg-gradient-to-r from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-500/25'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
            }`}
          >
            <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
            <span>{label}</span>
          </button>
        )
      })}
    </div>
  )
}
