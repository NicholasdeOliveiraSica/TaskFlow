'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { CheckSquare, LogIn, Loader2, AlertCircle, Mail, ArrowLeft, CheckCircle2 } from 'lucide-react'

function LoginContent() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [mode, setMode] = useState<'login' | 'forgot'>('login')
  const [resetEmail, setResetEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [cooldownMode, setCooldownMode] = useState<'success' | 'ratelimit' | null>(null)
  const [socialLoading, setSocialLoading] = useState<'google' | 'github' | null>(null)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const router = useRouter()
  const searchParams = useSearchParams()
  const supabase = createClient()

  // Rate limit countdown timer effect
  useEffect(() => {
    if (cooldown <= 0) {
      setCooldownMode(null)
      return
    }

    const timer = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          setCooldownMode(null)
          return 0
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [cooldown])

  useEffect(() => {
    const error = searchParams.get('error')
    if (error) {
      if (error === 'auth_callback_failed') {
        setErrorMsg('Falha no callback de autenticação. Verifique se o provedor OAuth está ativado no Supabase.')
      } else {
        setErrorMsg(error)
      }
    }
  }, [searchParams])

  const getRedirectUrl = () => {
    return typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : `${process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'}/auth/callback`
  }

  // Handle Standard Email & Password Login
  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)

    if (!email.trim() || !password) {
      setErrorMsg('Por favor, preencha todos os campos.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      })

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMsg('E-mail ou senha incorretos. Por favor, verifique suas credenciais.')
        } else {
          setErrorMsg(error.message || 'Erro ao realizar login. Tente novamente.')
        }
        setLoading(false)
        return
      }

      router.push('/')
      router.refresh()
    } catch {
      setErrorMsg('Ocorreu um erro ao processar sua solicitação. Tente novamente.')
      setLoading(false)
    }
  }

  // Handle Password Reset Request
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrorMsg(null)
    setSuccessMsg(null)

    if (cooldown > 0) return

    if (!resetEmail.trim()) {
      setErrorMsg('Por favor, informe seu e-mail.')
      return
    }

    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(resetEmail.trim(), {
        redirectTo: getRedirectUrl(),
      })

      if (error) {
        const isRateLimit =
          error.status === 429 ||
          error.code === 'over_email_send_rate_limit' ||
          error.message?.toLowerCase().includes('rate limit') ||
          error.message?.toLowerCase().includes('too many requests') ||
          error.message?.toLowerCase().includes('security purposes') ||
          error.message?.includes('429')

        if (isRateLimit) {
          setCooldownMode('ratelimit')
          setCooldown(60)
          setErrorMsg('Muitas solicitações enviadas. Aguarde 60 segundos para tentar novamente.')
        } else {
          setErrorMsg(error.message || 'Erro ao solicitar recuperação. Tente novamente.')
        }
        setLoading(false)
        return
      }

      setSuccessMsg('Instruções de recuperação enviadas para o seu e-mail!')
      setCooldownMode('success')
      setCooldown(30)
      setLoading(false)
    } catch {
      setErrorMsg('Ocorreu um erro ao enviar e-mail de recuperação.')
      setLoading(false)
    }
  }



  // Handle Social OAuth Login (Google & GitHub)
  const handleSocialLogin = async (provider: 'google' | 'github') => {
    setErrorMsg(null)
    setSocialLoading(provider)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: getRedirectUrl(),
        },
      })

      if (error) {
        setErrorMsg(`Erro ao conectar com ${provider}: ${error.message}`)
        setSocialLoading(null)
      }
    } catch {
      setErrorMsg(`Falha ao iniciar autenticação com ${provider}.`)
      setSocialLoading(null)
    }
  }

  return (
    <div className="relative w-full max-w-md bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl p-6 sm:p-8 shadow-2xl">
      {/* Branding Header */}
      <div className="flex flex-col items-center mb-6 text-center">
        <div className="h-11 w-11 rounded-xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center shadow-lg shadow-indigo-500/25 mb-2.5">
          <CheckSquare className="w-6 h-6 text-white" />
        </div>
        <h1 className="text-xl font-bold bg-gradient-to-r from-slate-100 via-slate-200 to-indigo-300 bg-clip-text text-transparent">
          TaskFlow
        </h1>
        <p className="text-xs text-slate-400 mt-0.5">
          {mode === 'login' ? 'Entre na sua conta para continuar' : 'Recuperação de Senha'}
        </p>
      </div>

      {/* Error Alert */}
      {errorMsg && (
        <div className="mb-4 p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
          <span className="break-words">{errorMsg}</span>
        </div>
      )}

      {/* Success Alert */}
      {successMsg && (
        <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-start gap-2.5 animate-in fade-in slide-in-from-top-1 duration-200">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {mode === 'login' ? (
        /* STANDARD LOGIN VIEW */
        <>
          {/* 1. Standard Email & Password Form (TOP) */}
          <form onSubmit={handleEmailLogin} className="space-y-3.5">
            <div>
              <label htmlFor="login-email" className="block text-xs font-medium text-slate-300 mb-1.5">
                E-mail
              </label>
              <input
                id="login-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 min-h-[42px]"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label htmlFor="login-password" className="block text-xs font-medium text-slate-300">
                  Senha
                </label>
                <button
                  type="button"
                  onClick={() => {
                    setErrorMsg(null)
                    setSuccessMsg(null)
                    setResetEmail(email)
                    setMode('forgot')
                  }}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-medium transition underline-offset-4 hover:underline cursor-pointer"
                >
                  Esqueceu a senha?
                </button>
              </div>
              <input
                id="login-password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 min-h-[42px]"
              />
            </div>

            <button
              type="submit"
              disabled={loading || socialLoading !== null}
              className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer mt-1"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Entrando...</span>
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  <span>Entrar</span>
                </>
              )}
            </button>
          </form>

          {/* 2. Divider (MIDDLE) */}
          <div className="relative my-5">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-slate-900 px-3 text-slate-500 font-medium tracking-wider">
                ou continue com
              </span>
            </div>
          </div>

          {/* 3. Social Provider Buttons (BOTTOM) */}
          <div className="space-y-2.5">
            {/* White Google Button */}
            <button
              type="button"
              onClick={() => handleSocialLogin('google')}
              disabled={loading || socialLoading !== null}
              className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-medium text-sm border border-slate-200 shadow-sm flex items-center justify-center gap-3 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {socialLoading === 'google' ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-700" />
              ) : (
                <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              )}
              <span>Continuar com Google</span>
            </button>

            {/* Dark GitHub Button */}
            <button
              type="button"
              onClick={() => handleSocialLogin('github')}
              disabled={loading || socialLoading !== null}
              className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-slate-800 hover:bg-slate-700/90 text-slate-100 font-medium text-sm border border-slate-700/80 shadow-sm flex items-center justify-center gap-3 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {socialLoading === 'github' ? (
                <Loader2 className="w-4 h-4 animate-spin text-slate-300" />
              ) : (
                <svg className="w-4 h-4 fill-current shrink-0" viewBox="0 0 24 24">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
                </svg>
              )}
              <span>Continuar com GitHub</span>
            </button>
          </div>

          {/* Footer Navigation */}
          <div className="mt-6 pt-4 border-t border-slate-800/80 text-center text-xs text-slate-400">
            Ainda não tem uma conta?{' '}
            <Link
              href="/register"
              className="text-indigo-400 hover:text-indigo-300 font-medium underline-offset-4 hover:underline transition"
            >
              Criar conta
            </Link>
          </div>
        </>
      ) : (
        /* FORGOT PASSWORD VIEW */
        <form onSubmit={handleResetPassword} className="space-y-4">
          <p className="text-xs text-slate-400 leading-relaxed mb-1">
            Informe seu e-mail cadastrado para receber um link de redefinição de senha.
          </p>

          <div>
            <label htmlFor="reset-email" className="block text-xs font-medium text-slate-300 mb-1.5">
              E-mail
            </label>
            <input
              id="reset-email"
              type="email"
              required
              value={resetEmail}
              onChange={(e) => setResetEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 text-slate-100 placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition duration-200 min-h-[42px]"
            />
          </div>

          <button
            type="submit"
            disabled={loading || cooldown > 0}
            className="w-full min-h-[42px] py-2.5 px-4 rounded-xl bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white font-medium text-sm shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Enviando...</span>
              </>
            ) : cooldown > 0 ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin text-indigo-300" />
                <span>
                  {cooldownMode === 'ratelimit'
                    ? `Muitas tentativas, aguarde ${cooldown}s`
                    : `Tente novamente em ${cooldown}s`}
                </span>
              </>

            ) : (
              <>
                <Mail className="w-4 h-4" />
                <span>Enviar E-mail de Recuperação</span>
              </>
            )}
          </button>


          <div className="pt-2 text-center">
            <button
              type="button"
              onClick={() => {
                setErrorMsg(null)
                setSuccessMsg(null)
                setMode('login')
              }}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center justify-center gap-1.5 mx-auto transition cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Voltar ao login</span>
            </button>
          </div>
        </form>
      )}
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-4">
      {/* Background radial glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/20 via-slate-950 to-slate-950 pointer-events-none" />
      <Suspense fallback={
        <div className="w-full max-w-md bg-slate-900/80 p-8 rounded-2xl border border-slate-800 text-center text-slate-400">
          Carregando...
        </div>
      }>
        <LoginContent />
      </Suspense>
    </div>
  )
}
