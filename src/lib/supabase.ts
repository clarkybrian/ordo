import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL and Anon Key must be provided')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Types pour la base de données
export interface User {
  id: string
  email: string
  created_at: string
  subscription_type: 'free' | 'pro' | 'premium'
}

export interface Email {
  id: string
  user_id: string
  gmail_id: string
  subject: string
  sender: string
  body: string
  received_at: string
  category_id: string | null
  is_important: boolean
  attachments?: EmailAttachment[]
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  created_at: string
}

export interface EmailAttachment {
  id: string
  email_id: string
  filename: string
  content_type: string
  size: number
  storage_path: string
}
