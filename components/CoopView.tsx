'use client'

import { useState, useEffect, useCallback } from 'react'
import { createClient } from '@/lib/supabase/client'
import { TaskGroup } from '@/types/coop'
import { GroupCard } from '@/components/GroupCard'
import { CreateGroupModal } from '@/components/CreateGroupModal'
import { JoinGroupModal } from '@/components/JoinGroupModal'
import { CoopTaskList } from '@/components/CoopTaskList'
import { Users, Plus, Hash, ArrowLeft, Loader2 } from 'lucide-react'

interface CoopViewProps {
  userId: string
}

export function CoopView({ userId }: CoopViewProps) {
  const [userGroups, setUserGroups] = useState<TaskGroup[]>([])
  const [activeGroup, setActiveGroup] = useState<TaskGroup | null>(null)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showJoinModal, setShowJoinModal] = useState(false)
  const [loadingGroups, setLoadingGroups] = useState(true)
  const supabase = createClient()

  const fetchUserGroups = useCallback(async () => {
    setLoadingGroups(true)
    try {
      // Fetch group_members for this user, join task_groups
      const { data, error } = await supabase
        .from('group_members')
        .select('group_id, task_groups(id, name, code, owner_id, created_at)')
        .eq('user_id', userId)

      if (error) {
        console.error('Erro ao buscar grupos:', error.message)
        return
      }

      if (data) {
        const groups = data
          .map((row) => row.task_groups)
          .filter(Boolean) as TaskGroup[]
        setUserGroups(groups)
      }
    } finally {
      setLoadingGroups(false)
    }
  }, [supabase, userId])

  useEffect(() => {
    fetchUserGroups()
  }, [fetchUserGroups])

  const handleGroupCreated = (group: TaskGroup) => {
    setShowCreateModal(false)
    setUserGroups((prev) => {
      const exists = prev.find((g) => g.id === group.id)
      return exists ? prev : [group, ...prev]
    })
    setActiveGroup(group)
  }

  const handleGroupJoined = (group: TaskGroup) => {
    setShowJoinModal(false)
    setUserGroups((prev) => {
      const exists = prev.find((g) => g.id === group.id)
      return exists ? prev : [group, ...prev]
    })
    setActiveGroup(group)
  }

  // ── Active Group View ──────────────────────────────────
  if (activeGroup) {
    return (
      <div className="w-full">
        <button
          onClick={() => setActiveGroup(null)}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 mb-5 transition duration-200 cursor-pointer group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform duration-200" />
          <span>Back to groups</span>
        </button>
        <CoopTaskList group={activeGroup} userId={userId} />
      </div>
    )
  }

  // ── Groups List View ───────────────────────────────────
  return (
    <div className="w-full">
      {/* Section header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-500/20 to-violet-600/20 border border-indigo-500/20 flex items-center justify-center">
            <Users className="w-4 h-4 text-indigo-400" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-100">My Groups</h2>
            <p className="text-xs text-slate-500">
              {loadingGroups ? 'Loading...' : `${userGroups.length} group${userGroups.length !== 1 ? 's' : ''}`}
            </p>
          </div>
        </div>

        {/* Action buttons — only shown when user has groups */}
        {!loadingGroups && userGroups.length > 0 && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowJoinModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800/80 text-slate-400 hover:text-slate-200 text-xs font-semibold transition duration-200 cursor-pointer"
            >
              <Hash className="w-3.5 h-3.5" />
              <span>Join via code</span>
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-xs font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create group</span>
            </button>
          </div>
        )}
      </div>

      {/* Loading state */}
      {loadingGroups ? (
        <div className="flex items-center justify-center py-16 gap-3 text-slate-500">
          <Loader2 className="w-5 h-5 animate-spin text-indigo-400" />
          <span className="text-sm">Fetching your groups...</span>
        </div>
      ) : userGroups.length === 0 ? (
        /* ── Empty State ── */
        <div className="glass-card rounded-2xl border border-slate-800/80 my-4 overflow-hidden">
          {/* Decorative gradient header */}
          <div className="h-32 bg-gradient-to-br from-indigo-900/30 via-violet-900/20 to-slate-900/0 flex items-center justify-center">
            <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Users className="w-8 h-8 text-indigo-400" />
            </div>
          </div>

          <div className="p-8 flex flex-col items-center text-center">
            <h3 className="text-lg font-bold text-slate-200 mb-2">
              You are not part of any group yet
            </h3>
            <p className="text-sm text-slate-400 max-w-sm mb-8">
              Create a new group and invite others with the code, or join an existing group using a 6-character code.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-3 w-full max-w-sm">
              <button
                onClick={() => setShowCreateModal(true)}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white text-sm font-semibold shadow-lg shadow-indigo-500/20 transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Plus className="w-4 h-4" />
                Create your group
              </button>

              <div className="flex items-center gap-3 w-full sm:hidden">
                <div className="flex-1 h-px bg-slate-800" />
                <span className="text-xs text-slate-600 font-medium">or</span>
                <div className="flex-1 h-px bg-slate-800" />
              </div>
              <span className="hidden sm:block text-xs text-slate-600 font-medium">or</span>

              <button
                onClick={() => setShowJoinModal(true)}
                className="w-full sm:flex-1 flex items-center justify-center gap-2 min-h-[48px] px-5 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-700/60 hover:border-indigo-500/30 text-slate-300 hover:text-slate-100 text-sm font-medium transition-all duration-200 cursor-pointer focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <Hash className="w-4 h-4" />
                Join an existing one
              </button>
            </div>
          </div>
        </div>
      ) : (
        /* ── Groups list ── */
        <div className="space-y-3">
          {userGroups.map((group) => (
            <GroupCard
              key={group.id}
              group={group}
              onEnter={setActiveGroup}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      {showCreateModal && (
        <CreateGroupModal
          userId={userId}
          onGroupCreated={handleGroupCreated}
          onClose={() => setShowCreateModal(false)}
        />
      )}
      {showJoinModal && (
        <JoinGroupModal
          userId={userId}
          onGroupJoined={handleGroupJoined}
          onClose={() => setShowJoinModal(false)}
        />
      )}
    </div>
  )
}
