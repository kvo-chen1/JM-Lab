// Supabase 客户端配置
import { createClient } from '@supabase/supabase-js'

// 从环境变量获取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 创建 Supabase 客户端
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'creator-community'
    }
  },
  db: {
    schema: 'public'
  }
})

// 数据库表类型定义
export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          username: string
          avatar_url: string | null
          bio: string | null
          is_verified: boolean
          metadata: Record<string, any>
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email: string
          username: string
          avatar_url?: string | null
          bio?: string | null
          is_verified?: boolean
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          username?: string
          avatar_url?: string | null
          bio?: string | null
          is_verified?: boolean
          metadata?: Record<string, any>
          created_at?: string
          updated_at?: string
        }
      }
      posts: {
        Row: {
          id: string
          author_id: string
          title: string
          content: string
          attachments: any[]
          status: 'draft' | 'published' | 'archived'
          view_count: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          author_id: string
          title: string
          content: string
          attachments?: any[]
          status?: 'draft' | 'published' | 'archived'
          view_count?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          author_id?: string
          title?: string
          content?: string
          attachments?: any[]
          status?: 'draft' | 'published' | 'archived'
          view_count?: number
          created_at?: string
          updated_at?: string
        }
      }
      comments: {
        Row: {
          id: string
          post_id: string
          author_id: string
          content: string
          parent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          post_id: string
          author_id: string
          content: string
          parent_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          post_id?: string
          author_id?: string
          content?: string
          parent_id?: string | null
          created_at?: string
        }
      }
      follows: {
        Row: {
          follower_id: string
          following_id: string
          created_at: string
        }
        Insert: {
          follower_id: string
          following_id: string
          created_at?: string
        }
        Update: {
          follower_id?: string
          following_id?: string
          created_at?: string
        }
      }
      likes: {
        Row: {
          user_id: string
          post_id: string
          created_at: string
        }
        Insert: {
          user_id: string
          post_id: string
          created_at?: string
        }
        Update: {
          user_id?: string
          post_id?: string
          created_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          channel_id: string
          sender_id: string
          content: string
          created_at: string
        }
        Insert: {
          id?: string
          channel_id: string
          sender_id: string
          content: string
          created_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          sender_id?: string
          content?: string
          created_at?: string
        }
      }
    }
  }
}

// 导出类型
export type Tables = Database['public']['Tables']
export type User = Tables['users']['Row']
export type Post = Tables['posts']['Row']
export type Comment = Tables['comments']['Row']
export type Follow = Tables['follows']['Row']
export type Like = Tables['likes']['Row']
export type Message = Tables['messages']['Row']

// 用户资料类型（包含统计信息）
export interface UserProfile extends User {
  followers_count?: number
  following_count?: number
  posts_count?: number
  is_following?: boolean
}

// 帖子类型（包含作者信息和统计）
export interface PostWithAuthor extends Post {
  author: UserProfile
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
}

// 评论类型（包含作者信息）
export interface CommentWithAuthor extends Comment {
  author: UserProfile
  replies?: CommentWithAuthor[]
}

// 消息类型（包含发送者信息）
export interface MessageWithSender extends Message {
  sender: UserProfile
}