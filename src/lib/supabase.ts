// Supabase 客户端配置
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 从环境变量获取配置
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''

// 导出配置供其他模块使用
export { supabaseUrl, supabaseAnonKey }

// 检查是否在浏览器环境
const isBrowser = typeof window !== 'undefined'

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

// 创建模拟客户端的工厂函数
const createMockClient = (reason: string): SupabaseClient => {
  const mockError = new Error(`${reason} - 请检查 Supabase 配置`)

  return {
    from: () => ({
      select: () => ({ eq: () => ({ order: () => ({ limit: () => Promise.resolve({ data: [], error: mockError }) }) }) }),
      insert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: mockError }) }) }),
      update: () => ({ eq: () => Promise.resolve({ error: mockError }) }),
      delete: () => ({ eq: () => Promise.resolve({ error: mockError }) }),
      upsert: () => ({ select: () => ({ single: () => Promise.resolve({ data: null, error: mockError }) }) }),
    }),
    channel: () => ({
      on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }),
      subscribe: () => ({ unsubscribe: () => {} }),
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: mockError }),
      getUser: () => Promise.resolve({ data: { user: null }, error: mockError }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signInWithPassword: () => Promise.resolve({ data: { user: null, session: null }, error: mockError }),
      signInWithOtp: () => Promise.resolve({ data: { user: null, session: null }, error: mockError }),
      verifyOtp: () => Promise.resolve({ data: { user: null, session: null }, error: mockError }),
      signUp: () => Promise.resolve({ data: { user: null, session: null }, error: mockError }),
      signOut: () => Promise.resolve({ error: null }),
      updateUser: () => Promise.resolve({ data: { user: null }, error: mockError }),
      resetPasswordForEmail: () => Promise.resolve({ data: {}, error: mockError }),
    },
    storage: {
      from: () => ({
        upload: () => Promise.resolve({ data: null, error: mockError }),
        download: () => Promise.resolve({ data: null, error: mockError }),
        getPublicUrl: () => ({ data: { publicUrl: '' } }),
        remove: () => Promise.resolve({ data: null, error: mockError }),
      }),
    },
  } as unknown as SupabaseClient
}

// 服务角色密钥（用于绕过 RLS 的管理员操作）
// 注意：这个密钥有完全的数据库访问权限，只能在服务器端或受信任的环境中使用
// 必须通过环境变量 VITE_SUPABASE_SERVICE_ROLE_KEY 注入

// 创建 Supabase 客户端 - 带错误处理
export let supabase: SupabaseClient
export let supabaseAdmin: SupabaseClient

try {
  if (!supabaseUrl || !supabaseAnonKey) {
    // 如果环境变量不存在，创建一个安全的模拟客户端
    console.warn('[Supabase] 环境变量未配置，使用模拟客户端')
    supabase = createMockClient('Supabase 环境变量未配置')
    supabaseAdmin = supabase
  } else {
    // 验证 URL 格式
    try {
      new URL(supabaseUrl)
    } catch {
      console.error('[Supabase] URL 格式无效:', supabaseUrl)
      supabase = createMockClient('Supabase URL 格式无效')
      supabaseAdmin = supabase
    }

    supabase = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
        storageKey: 'sb-auth-token',
      },
      global: {
        headers: {
          'x-application-name': 'creator-community'
        },
        fetch: fetchWithRetry
      },
      db: {
        schema: 'public'
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

    // 创建管理员客户端（绕过 RLS）
    if (supabaseServiceKey) {
      supabaseAdmin = createClient(
        supabaseUrl,
        supabaseServiceKey,
        {
          auth: {
            autoRefreshToken: false,
            persistSession: false
          }
        }
      )
    } else {
      supabaseAdmin = supabase
    }

    // 将 supabase 暴露到 window 对象以便调试（仅开发环境）
    if (isBrowser && import.meta.env.DEV) {
      (window as any).supabase = supabase
    }

    console.log('[Supabase] 客户端初始化成功')
  }
} catch (error) {
  console.error('[Supabase] 客户端初始化失败:', error)
  supabase = createMockClient('Supabase 客户端初始化失败')
  supabaseAdmin = supabase
}

// 导出配置检查函数
export const isSupabaseConfigured = (): boolean => {
  return !!(supabaseUrl && supabaseAnonKey)
}

// 导出连接测试函数
export const testSupabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    if (!isSupabaseConfigured()) {
      return { success: false, error: 'Supabase 未配置' }
    }
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
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
      generation_tasks: {
        Row: {
          id: string
          user_id: string
          type: 'image' | 'video'
          status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          params: Record<string, any>
          progress: number
          result: Record<string, any> | null
          error: string | null
          error_type: 'content_policy' | 'timeout' | 'auth' | 'general' | 'network' | null
          created_at: string
          updated_at: string
          started_at: string | null
          completed_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          type: 'image' | 'video'
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          params?: Record<string, any>
          progress?: number
          result?: Record<string, any> | null
          error?: string | null
          error_type?: 'content_policy' | 'timeout' | 'auth' | 'general' | 'network' | null
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          type?: 'image' | 'video'
          status?: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
          params?: Record<string, any>
          progress?: number
          result?: Record<string, any> | null
          error?: string | null
          error_type?: 'content_policy' | 'timeout' | 'auth' | 'general' | 'network' | null
          created_at?: string
          updated_at?: string
          started_at?: string | null
          completed_at?: string | null
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
export type GenerationTask = Tables['generation_tasks']['Row']

// 用户资料类型（包含统计信息）
export interface UserProfile extends User {
  followers_count?: number
  following_count?: number
  posts_count?: number
  is_following?: boolean
  avatar?: string
  avatar_url?: string
  location?: string
  is_verified?: boolean
  bio?: string
}

// 帖子类型（包含作者信息和统计）
export interface PostWithAuthor extends Post {
  author: UserProfile
  likes_count?: number
  comments_count?: number
  is_liked?: boolean
  user_id?: string
  author_id?: string
  type?: string
  video_url?: string
  attachments?: Array<{ type: string; url: string }>
  thumbnail?: string
  cover_url?: string
}

// 评论类型（包含作者信息）
export interface CommentWithAuthor extends Comment {
  author: UserProfile
  replies?: CommentWithAuthor[]
  likes_count?: number
  is_edited?: boolean
}

// 消息类型（包含发送者信息）
export interface MessageWithSender extends Message {
  sender: UserProfile
}

/**
 * 统一 API 调用封装
 * 提供错误处理、自动重试和类型安全
 */
export async function callSupabase<T>(
  operationFactory: () => Promise<{ data: T | null; error: any }>,
  options: {
    retries?: number;
    fallbackValue?: T;
    errorMessage?: string;
    idempotencyKey?: string;
  } = {}
): Promise<T | null> {
  const { retries = 3, fallbackValue, errorMessage, idempotencyKey } = options;

  try {
    // 如果提供了幂等性 Key，虽然 Supabase JS SDK 不直接支持注入 Header，
    // 但在实际业务 RPC 调用中，调用方应确保将其作为参数传递。
    // 这里保留该参数用于统一接口签名。
    
    const { data, error } = await operationFactory();

    if (error) {
      throw error;
    }

    return data;
  } catch (err: any) {
    // 网络错误或 5xx 错误进行重试
    if (retries > 0 && (err.message?.includes('fetch') || err.status >= 500)) {
      console.warn(`Supabase Operation Failed, Retrying... (${retries} attempts left). Error: ${err.message}`);
      await new Promise(resolve => setTimeout(resolve, 500 * (4 - retries))); // Exponential Backoff-ish
      return callSupabase(operationFactory, { ...options, retries: retries - 1 });
    }
    
    console.error(`Supabase Operation Failed: ${errorMessage || err.message}`, err);

    if (fallbackValue !== undefined) {
      return fallbackValue;
    }

    throw new Error(errorMessage || err.message || 'Supabase operation failed');
  }
}

/**
 * 辅助函数：生成幂等性 Key
 */
export function generateIdempotencyKey(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Date.now().toString(36) + Math.random().toString(36).substring(2);
}
