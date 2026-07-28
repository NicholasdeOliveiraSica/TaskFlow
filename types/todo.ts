import { Database } from './database.types'

export type TodoRow = Database['public']['Tables']['todos']['Row']

export type PriorityLevel = 'high' | 'medium' | 'low'
export type CategoryType = 'Trabalho' | 'Pessoal' | 'Estudos' | 'Foco'

export interface Todo {
  id: string
  title: string
  description: string | null
  is_complete: boolean | null
  user_id: string | null
  created_at?: string | null
  priority?: PriorityLevel | string | null
  category?: CategoryType | string | null
  due_date?: string | null
  position?: number | null
}

export type FilterStatus = 'all' | 'pending' | 'completed'

export interface ToastMessage {
  id: string
  type: 'success' | 'error'
  message: string
}
