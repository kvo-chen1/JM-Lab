// 数据库客户端配置 - 使用 Supabase PostgreSQL（通过本地代理）
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// 根据环境选择 API 地址
const isProduction = import.meta.env.PROD

// 生产环境使用当前域名，开发环境使用 localhost
let apiBaseUrl: string
if (isProduction) {
  const configuredUrl = import.meta.env.VITE_API_BASE_URL
  if (configuredUrl && configuredUrl.startsWith('http')) {
    apiBaseUrl = configuredUrl
  } else {
    apiBaseUrl = typeof window !== 'undefined'
      ? `${window.location.protocol}//${window.location.host}`
      : ''
  }
} else {
  apiBaseUrl = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3023'
}

const proxyUrl = `${apiBaseUrl}/api/db`

console.log('[DB] Environment:', import.meta.env.PROD ? 'production' : 'development')
console.log('[DB] API URL:', proxyUrl)

// Supabase 配置（使用代理）
const supabaseUrl = proxyUrl
const supabaseAnonKey = 'local-proxy-key'

// 导出配置供其他模块使用
export { supabaseUrl, supabaseAnonKey }

// 增强的 fetch，带有重试逻辑
const fetchWithRetry = async (url: RequestInfo | URL, options?: RequestInit, retries = 3, backoff = 300): Promise<Response> => {
  try {
    const response = await fetch(url, options);
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

// 导入降级方案
import { createRealtimeChannel } from '@/services/realtimeFallback'

// 创建 Supabase 客户端
export let supabase: SupabaseClient
export let supabaseAdmin: SupabaseClient

try {
  // 验证 URL 格式
  if (supabaseUrl) {
    try {
      new URL(supabaseUrl)
    } catch {
      console.error('[Supabase] URL 格式无效:', supabaseUrl)
    }
  }

  supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
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
      enabled: false  // 禁用 realtime，因为代理不支持
    }
  })

  // 覆盖 channel 方法，使用降级方案
  const originalChannel = supabase.channel.bind(supabase)
  supabase.channel = (name: string) => {
    // 使用降级方案替代原生 realtime
    return createRealtimeChannel(name) as any
  }

  console.log('[Supabase] 客户端初始化成功（通过代理，使用轮询替代 realtime）')
} catch (error) {
  console.error('[Supabase] 客户端初始化失败:', error)
  // 创建一个空的客户端避免崩溃
  supabase = {} as SupabaseClient
}

// 导出配置检查函数
export const isDatabaseConfigured = (): boolean => {
  return !!supabaseUrl && !!supabaseAnonKey
}

// 导出连接测试函数
export const testDatabaseConnection = async (): Promise<{ success: boolean; error?: string }> => {
  try {
    const { error } = await supabase.from('users').select('count', { count: 'exact', head: true })
    if (error) {
      return { success: false, error: error.message }
    }
    return { success: true }
  } catch (err) {
    return { success: false, error: String(err) }
  }
}

// 保持向后兼容的别名
export const isSupabaseConfigured = isDatabaseConfigured
export const testSupabaseConnection = testDatabaseConnection

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
    }
  }
}

// 导出类型
export type Tables = Database['public']['Tables']
export type User = Tables['users']['Row']
export type Post = Tables['posts']['Row']

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
