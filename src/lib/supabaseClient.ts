import { createClient } from '@supabase/supabase-js'

// 根据环境选择 API 地址
const isProduction = import.meta.env.PROD
const apiBaseUrl = isProduction
  ? (import.meta.env.VITE_API_BASE_URL || '')
  : (import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3023')
const proxyUrl = `${apiBaseUrl}/api/db`

console.log(`🔄 [Supabase Client] Environment: ${isProduction ? 'production' : 'development'}`)
console.log('🔄 [Supabase Client] Using API URL:', proxyUrl)

// 根据环境选择密钥
const anonKey = isProduction
  ? (import.meta.env.VITE_SUPABASE_ANON_KEY || 'local-proxy-key')
  : 'local-proxy-key'
const serviceKey = isProduction
  ? (import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || 'local-proxy-key')
  : 'local-proxy-key'

// 创建 Supabase 客户端，但指向 API 代理
const supabaseClient = createClient(
  proxyUrl,
  anonKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    global: {
      headers: {
        'X-Client-Info': 'neon-proxy-js/1.x',
      },
    },
  }
)

export const supabase = supabaseClient

// 服务角色客户端也使用代理
export const supabaseAdmin = createClient(
  proxyUrl,
  serviceKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

// 将 supabase 暴露到 window 对象以便调试
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase
  console.log('[Supabase Client] Initialized with Neon database proxy:', proxyUrl)
}

// Type definitions for Supabase tables
export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string | null;
  bio?: string;
  is_verified?: boolean;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface Post {
  id: string;
  author_id: string;
  title: string;
  content: string;
  category?: string | null;
  attachments?: any[];
  status?: 'draft' | 'published' | 'archived';
  view_count?: number;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  comments_count?: number;
}

export interface UserHistory {
  id: string;
  user_id: string;
  action_type: string;
  content: Record<string, any>;
  session_id?: string | null;
  created_at: string;
  timestamp: number;
  checksum?: string | null;
}

// 示例：获取用户列表
export async function getUsers(): Promise<User[]> {
  try {
    const { data, error } = await (supabase as any).from('users').select('*')
    if (error) {
      console.error('获取用户列表失败:', error)
      return []
    }
    return (data as User[]) || []
  } catch (error) {
    console.error('获取用户列表异常:', error)
    return []
  }
}

// 示例：获取帖子列表
export async function getPosts(): Promise<Post[]> {
  try {
    const { data, error } = await (supabase as any).from('posts').select('*').order('created_at', { ascending: false })
    if (error) {
      console.error('获取帖子列表失败:', error)
      return []
    }
    return (data as Post[]) || []
  } catch (error) {
    console.error('获取帖子列表异常:', error)
    return []
  }
}

// 示例：创建帖子
export async function createPost(postData: Omit<Post, 'id' | 'created_at' | 'updated_at'>): Promise<Post | null> {
  try {
    const { data, error } = await (supabase as any).from('posts').insert([postData]).select('*')
    if (error) {
      console.error('创建帖子失败:', error)
      return null
    }
    return (data as Post[]) ? data[0] : null
  } catch (error) {
    console.error('创建帖子异常:', error)
    return null
  }
}
