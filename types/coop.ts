// Tipo do grupo cooperativo
export interface TaskGroup {
  id: string
  name: string
  code: string          // 6 chars uppercase+digits, ex: "AX3K9Z"
  owner_id: string
  created_at: string | null
}

// Membro de grupo
export interface GroupMember {
  group_id: string
  user_id: string
  joined_at: string | null
}

// Tarefa cooperativa — mesmos campos que Todo mas com group_id e created_by
export interface CoopTask {
  id: string
  group_id: string
  created_by: string
  title: string
  description: string | null
  is_complete: boolean | null
  priority: string | null
  category: string | null
  due_date: string | null
  position: number | null
  created_at: string | null
}

// Modo de visualização da dashboard
export type DashboardMode = 'personal' | 'coop'
