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
      companies: {
        Row: {
          id: string
          name: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          created_at?: string
          updated_at?: string
        }
      }
      user_profiles: {
        Row: {
          id: string
          user_id: string
          company_id: string
          role: 'admin' | 'user'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          company_id: string
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          company_id?: string
          role?: 'admin' | 'user'
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          name: string
          file_path: string
          file_size: number
          mime_type: string
          company_id: string
          uploaded_by: string
          processed: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          file_path: string
          file_size: number
          mime_type: string
          company_id: string
          uploaded_by: string
          processed?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          file_path?: string
          file_size?: number
          mime_type?: string
          company_id?: string
          uploaded_by?: string
          processed?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      chat_sessions: {
        Row: {
          id: string
          company_id: string
          user_id: string
          title: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          company_id: string
          user_id: string
          title: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          company_id?: string
          user_id?: string
          title?: string
          created_at?: string
          updated_at?: string
        }
      }
      chat_messages: {
        Row: {
          id: string
          session_id: string
          content: string
          role: 'user' | 'assistant'
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          content: string
          role: 'user' | 'assistant'
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          content?: string
          role?: 'user' | 'assistant'
          created_at?: string
        }
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