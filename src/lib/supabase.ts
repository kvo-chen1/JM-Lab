// Supabase 客户端配置
import { createClient } from '@supabase/supabase-js'

// 从环境变量获取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''

// 增强的 fetch，带有重试逻辑
const fetchWithRetry = async (url: RequestInfo | URL, options?: RequestInit, retries = 3, backoff = 300): Promise<Response> => {
  try {
    const response = await fetch(url, options);
    // 只有 5xx 错误或网络错误才重试，4xx 错误通常是客户端请求问题，不应重试
    if (!response.ok && retries > 0 && response.status >= 500) {
      throw new Error(`Server error: ${response.status}`);
    }
    return response;
  } catch (error) {
    if (retries > 0) {
      await new Promise(resolve => setTimeout(resolve, backoff));
      return fetchWithRetry(url, options, retries - 1, backoff * 2);
    }
    throw error;
  }
};

// 创建 Supabase 客户端 - 带错误处理
export let supabase: ReturnType<typeof createClient>;

try {
  if (supabaseUrl && supabaseAnonKey) {
    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      },
      global: {
        headers: {
          'x-application-name': 'creator-community'
        },
        fetch: fetchWithRetry // 使用带重试的 fetch
      },
      db: {
        schema: 'public'
      }
    })
  } else {
    // 如果环境变量不存在，创建一个安全的模拟客户端
    console.warn('Supabase environment variables not found, using mock client')
    supabase = {
      from: () => ({
        select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }) }),
        insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
        update: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) }),
        delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) })
      }),
      channel: () => ({
        on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
        subscribe: () => ({ unsubscribe: () => {} })
      }),
      auth: {
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Mock client: login failed') }),
        signInWithOtp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Mock client: OTP login failed') }),
        verifyOtp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Mock client: verify failed') }),
        signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Mock client: signup failed') }),
        signOut: () => Promise.resolve({ error: null }),
        updateUser: () => Promise.resolve({ data: { user: null }, error: new Error('Mock client: update failed') }),
        resetPasswordForEmail: () => Promise.resolve({ data: {}, error: new Error('Mock client: reset failed') }),
      }
    } as any
  }
} catch (error) {
  console.error('Error creating Supabase client:', error)
  // 创建一个安全的模拟客户端
  supabase = {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: null }) }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: new Error('Supabase not configured') }) }) }),
      update: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: new Error('Supabase not configured') }) })
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      getUser: () => Promise.resolve({ data: { user: null }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Mock client: login failed') }),
      signInWithOtp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Mock client: OTP login failed') }),
      verifyOtp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Mock client: verify failed') }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: new Error('Mock client: signup failed') }),
      signOut: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ data: { user: null }, error: new Error('Mock client: update failed') }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: new Error('Mock client: reset failed') }),
    }
  } as any
}

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
          community_id: string | null
          sender_id: string
          receiver_id: string | null
          content: string
          status: string
          type: string
          metadata: Record<string, any>
          retry_count: number
          is_read: boolean
          delivered_at: string | null
          read_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          channel_id?: string
          community_id?: string | null
          sender_id: string
          receiver_id?: string | null
          content: string
          status?: string
          type?: string
          metadata?: Record<string, any>
          retry_count?: number
          is_read?: boolean
          delivered_at?: string | null
          read_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          channel_id?: string
          community_id?: string | null
          sender_id?: string
          receiver_id?: string | null
          content?: string
          status?: string
          type?: string
          metadata?: Record<string, any>
          retry_count?: number
          is_read?: boolean
          delivered_at?: string | null
          read_at?: string | null
          created_at?: string
        }
      }
      friend_requests: {
        Row: {
          id: string
          sender_id: string
          receiver_id: string
          status: 'pending' | 'accepted' | 'rejected'
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          sender_id: string
          receiver_id: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          sender_id?: string
          receiver_id?: string
          status?: 'pending' | 'accepted' | 'rejected'
          created_at?: string
          updated_at?: string
        }
      }
      user_status: {
        Row: {
          user_id: string
          status: 'online' | 'offline' | 'away'
          last_seen: string
          updated_at: string
        }
        Insert: {
          user_id: string
          status?: 'online' | 'offline' | 'away'
          last_seen?: string
          updated_at?: string
        }
        Update: {
          user_id?: string
          status?: 'online' | 'offline' | 'away'
          last_seen?: string
          updated_at?: string
        }
      }
      user_history: {
        Row: {
          id: string
          user_id: string
          action_type: string
          content: Record<string, any>
          session_id: string | null
          created_at: string
          timestamp: number
          checksum: string | null
        }
        Insert: {
          id?: string
          user_id: string
          action_type: string
          content?: Record<string, any>
          session_id?: string | null
          created_at?: string
          timestamp: number
          checksum?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          action_type?: string
          content?: Record<string, any>
          session_id?: string | null
          created_at?: string
          timestamp?: number
          checksum?: string | null
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
