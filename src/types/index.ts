export interface User {
  id: string
  email: string
  created_at: string
  subscription_type: 'free' | 'pro' | 'premium'
  gmail_connected: boolean
  sync_frequency: number // heures entre chaque sync
  last_sync: string | null
}

export interface Email {
  id: string
  user_id: string
  gmail_id: string
  thread_id: string
  subject: string
  sender_name: string
  sender_email: string
  body_text: string
  snippet: string
  received_at: string
  category_id: string | null
  category?: Category
  is_important: boolean
  is_read: boolean
  attachments?: EmailAttachment[]
  labels: string[]
}

export interface Category {
  id: string
  user_id: string
  name: string
  color: string
  icon: string
  description?: string
  is_default?: boolean
  is_auto_generated?: boolean
  created_at: string
  updated_at?: string
  emails_count?: number
}

export interface EmailAttachment {
  id: string
  email_id: string
  filename: string
  content_type: string
  size: number
  storage_path: string
}

export interface SubscriptionPlan {
  type: 'free' | 'pro' | 'premium'
  price: number
  features: string[]
  limits: {
    emails_per_day: number
    categories: number
    ocr_enabled: boolean
    advanced_search: boolean
    instant_notifications: boolean
  }
}

// API Response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

// UI State types
export interface EmailFilters {
  category_id?: string
  is_important?: boolean
  date_range?: {
    start: string
    end: string
  }
  search_query?: string
}
