import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { Navbar } from '@/components/Navbar'
import { TodoList } from '@/components/TodoList'
import { Todo } from '@/types/todo'

export const runtime = 'edge'
export const revalidate = 0 // Dynamic SSR page

export default async function DashboardPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  // 1. Initial 10 todos for page 1
  const { data: initialTodos, error } = await supabase
    .from('todos')
    .select('id, title, description, is_complete, user_id, created_at, priority, category, due_date, position')
    .eq('user_id', user.id)
    .order('position', { ascending: true })
    .order('created_at', { ascending: false })
    .range(0, 9)



  if (error) {
    console.error('Erro ao buscar tarefas no Server Component:', error.message)
  }

  // 2. Count total todos for this user (head: true for 0 bytes payload)
  const { count: initialTotalCount } = await supabase
    .from('todos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  // 3. Count completed todos for this user
  const { count: initialCompletedCount } = await supabase
    .from('todos')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)
    .eq('is_complete', true)

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Radial background glow */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-900/15 via-slate-950 to-slate-950 pointer-events-none" />

      {/* Header / Navbar */}
      <Navbar userEmail={user.email} />

      {/* Main Container */}
      <main className="relative flex-1 w-full max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
        <TodoList
          initialTodos={(initialTodos as Todo[]) || []}
          initialTotalCount={initialTotalCount || 0}
          initialCompletedCount={initialCompletedCount || 0}
          userId={user.id}
        />
      </main>


      {/* Footer */}
      <footer className="relative border-t border-slate-800/80 py-6 text-center text-xs text-slate-500">
        <p>TaskFlow &copy; {new Date().getFullYear()} — Lista de Tarefas Fullstack com Next.js & Supabase RLS</p>
      </footer>
    </div>
  )
}
