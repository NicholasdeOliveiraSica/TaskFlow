'use client'

import { useState } from 'react'
import { X, Hash, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { validateGroupCode } from '@/lib/group-code'
import { TaskGroup } from '@/types/coop'

interface JoinGroupModalProps {
  userId: string
  onGroupJoined: (group: TaskGroup) => void
  onClose: () => void
}

export function JoinGroupModal({ userId, onGroupJoined, onClose }: JoinGroupModalProps) {
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const isValidFormat = validateGroupCode(code)
  const isReady = code.length === 6 && isValidFormat

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!isReady) return

    setLoading(true)
    setError(null)

    try {
      // Find group by code
      const { data: group, error: findErr } = await supabase
        .from('task_groups')
        .select('id, name, code, owner_id, created_at')
        .eq('code', code)
        .maybeSingle()

      if (findErr || !group) {
        setError('Código não encontrado. Verifique e tente novamente.')
        return
      }

      // Check if already a member
      const { data: existing } = await supabase
        .from('group_members')
        .select('group_id')
        .eq('group_id', group.id)
        .eq('user_id', userId)
        .maybeSingle()

      if (existing) {
        // Already a member — just proceed
        onGroupJoined(group as TaskGroup)
        return
      }

      // Join the group
      const { error: joinErr } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: userId })

      if (joinErr) {
        setError('Não foi possível entrar no grupo. Tente novamente.')
        return
      }

      onGroupJoined(group as TaskGroup)
    } finally {
      setLoading(false)
    }
  }

  const handleCodeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 6)
    setCode(raw)
    setError(null)
  }

  const codeError =
    code.length > 0 && code.length < 6
      ? null // Still typing, don't show error yet
      : code.length === 6 && !isValidFormat
        ? 'O código deve conter apenas letras maiúsculas e números.'
        : null

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/50 animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-violet-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
              <Hash className="w-4 h-4 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Entrar em um Grupo</h2>
          </div>
          <button
            onClick={onClose}
            className="h-8 w-8 flex items-center justify-center rounded-lg text-slate-500 hover:text-slate-200 hover:bg-slate-800 transition duration-200 cursor-pointer"
            aria-label="Fechar modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleJoin} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="group-code" className="block text-sm font-medium text-slate-300">
              Código do grupo
            </label>
            <input
              id="group-code"
              type="text"
              value={code}
              onChange={handleCodeChange}
              placeholder="Ex: AX3K9Z"
              maxLength={6}
              required
              autoFocus
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm font-mono font-bold uppercase tracking-[0.25em] text-indigo-300 placeholder:text-slate-500 placeholder:font-normal placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition duration-200"
            />
            {/* Character progress hint */}
            <p className="text-xs text-slate-500">
              {code.length}/6 caracteres — somente letras maiúsculas e números
            </p>
          </div>

          {/* Validation or API error */}
          {(codeError || error) && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {codeError ?? error}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || !isReady}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-400 hover:to-indigo-500 text-white text-sm font-semibold shadow-lg shadow-violet-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Buscando...' : 'Entrar no Grupo'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="w-full min-h-[44px] rounded-xl text-slate-400 hover:text-slate-200 text-sm font-medium transition duration-200 cursor-pointer focus:outline-none"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
