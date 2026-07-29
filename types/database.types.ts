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
      task_groups: {
        Row: {
          id: string
          name: string
          code: string
          owner_id: string
          created_at: string | null
        }
        Insert: {
          id?: string
          name: string
          code: string
          owner_id: string
          created_at?: string | null
        }
        Update: {
          id?: string
          name?: string
          code?: string
          owner_id?: string
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "task_groups_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      group_members: {
        Row: {
          group_id: string
          user_id: string
          joined_at: string | null
        }
        Insert: {
          group_id: string
          user_id: string
          joined_at?: string | null
        }
        Update: {
          group_id?: string
          user_id?: string
          joined_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "task_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "group_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      coop_tasks: {
        Row: {
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
        Insert: {
          id?: string
          group_id: string
          created_by: string
          title: string
          description?: string | null
          is_complete?: boolean | null
          priority?: string | null
          category?: string | null
          due_date?: string | null
          position?: number | null
          created_at?: string | null
        }
        Update: {
          id?: string
          group_id?: string
          created_by?: string
          title?: string
          description?: string | null
          is_complete?: boolean | null
          priority?: string | null
          category?: string | null
          due_date?: string | null
          position?: number | null
          created_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coop_tasks_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "task_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coop_tasks_created_by_fkey"
            columns: ["created_by"]
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
      is_group_member: {
        Args: { gid: string }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
