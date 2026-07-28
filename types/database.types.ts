export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      todos: {
        Row: {
          id: string
          title: string
          description: string | null
          is_complete: boolean | null
          user_id: string | null
          created_at: string | null
          priority: string | null
          category: string | null
          due_date: string | null
          position: number | null
        }
        Insert: {
          id?: string
          title: string
          description?: string | null
          is_complete?: boolean | null
          user_id?: string | null
          created_at?: string | null
          priority?: string | null
          category?: string | null
          due_date?: string | null
          position?: number | null
        }
        Update: {
          id?: string
          title?: string
          description?: string | null
          is_complete?: boolean | null
          user_id?: string | null
          created_at?: string | null
          priority?: string | null
          category?: string | null
          due_date?: string | null
          position?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "todos_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
