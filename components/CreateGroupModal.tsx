'use client'

import { useState } from 'react'
import { X, Users, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { generateGroupCode } from '@/lib/group-code'
import { TaskGroup } from '@/types/coop'

interface CreateGroupModalProps {
  userId: string
  onGroupCreated: (group: TaskGroup) => void
  onClose: () => void
}

export function CreateGroupModal({ userId, onGroupCreated, onClose }: CreateGroupModalProps) {
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const supabase = createClient()

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    const trimmedName = name.trim()
    if (!trimmedName) return

    setLoading(true)
    setError(null)

    try {
      // Generate a unique code (retry up to 3x on collision)
      let code = ''
      for (let attempt = 0; attempt < 3; attempt++) {
        const candidate = generateGroupCode()
        const { data: existing } = await supabase
          .from('task_groups')
          .select('id')
          .eq('code', candidate)
          .maybeSingle()
        if (!existing) {
          code = candidate
          break
        }
      }

      if (!code) {
        setError('Não foi possível gerar um código único. Tente novamente.')
        return
      }

      // Insert group
      const { data: group, error: groupErr } = await supabase
        .from('task_groups')
        .insert({ name: trimmedName, code, owner_id: userId })
        .select()
        .single()

      if (groupErr || !group) {
        setError('Erro ao criar o grupo. Tente novamente.')
        return
      }

      // Add owner as first member
      const { error: memberErr } = await supabase
        .from('group_members')
        .insert({ group_id: group.id, user_id: userId })

      if (memberErr) {
        setError('Grupo criado, mas houve um erro ao adicionar o membro. Tente recarregar.')
        return
      }

      onGroupCreated(group as TaskGroup)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-md shadow-2xl shadow-black/50 animate-modal-in">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Users className="w-4.5 h-4.5 text-white" />
            </div>
            <h2 className="text-lg font-bold text-slate-100">Criar Novo Grupo</h2>
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
        <form onSubmit={handleCreate} className="space-y-4">
          <div className="space-y-1.5">
            <label htmlFor="group-name" className="block text-sm font-medium text-slate-300">
              Nome do grupo
            </label>
            <input
              id="group-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Equipe Dev"
              maxLength={60}
              required
              autoFocus
              className="w-full bg-slate-800/80 border border-slate-700/80 rounded-xl px-4 py-3 text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/60 focus:border-indigo-500/60 transition duration-200"
            />
          </div>

          {/* Error */}
          {error && (
            <p className="text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          {/* Actions */}
          <div className="flex flex-col gap-2 pt-1">
            <button
              type="submit"
              disabled={loading || !name.trim()}
              className="w-full min-h-[44px] flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {loading ? 'Criando...' : 'Criar Grupo'}
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
