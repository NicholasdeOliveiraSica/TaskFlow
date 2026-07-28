'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { CheckSquare, LogOut, User, Loader2 } from 'lucide-react'
import { useToast } from '@/context/ToastContext'

interface NavbarProps {
  userEmail?: string
}

export function Navbar({ userEmail }: NavbarProps) {
  const [loggingOut, setLoggingOut] = useState(false)
  const router = useRouter()
  const supabase = createClient()
  const { showToast } = useToast()

  const handleLogout = async () => {
    setLoggingOut(true)
    try {
      await supabase.auth.signOut()
      showToast('Sessão encerrada com sucesso.', 'success')
      router.push('/login')
      router.refresh()
    } catch {
      showToast('Erro ao encerrar sessão.', 'error')
      setLoggingOut(false)
    }
  }

  return (
    <header className="sticky top-0 z-40 w-full glass-panel border-b border-slate-800/80">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Left Side Branding */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <CheckSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-xl font-bold bg-gradient-to-r from-slate-100 via-indigo-100 to-indigo-400 bg-clip-text text-transparent">
              TaskFlow
            </span>
          </div>
        </div>

        {/* Right Side User Badge & Logout */}
        <div className="flex items-center gap-3">
          {userEmail && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50 text-xs text-slate-300">
              <User className="w-3.5 h-3.5 text-indigo-400" />
              <span className="truncate max-w-[180px]">{userEmail}</span>
            </div>
          )}

          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="min-h-[44px] px-3.5 py-2 rounded-xl bg-slate-800/80 hover:bg-rose-500/10 hover:border-rose-500/30 border border-slate-700/60 text-slate-300 hover:text-rose-300 text-sm font-medium flex items-center gap-2 transition duration-200 cursor-pointer disabled:opacity-50"
            aria-label="Encerrar sessão"
          >
            {loggingOut ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
            ) : (
              <LogOut className="w-4 h-4" />
            )}
            <span className="hidden xs:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  )
}
