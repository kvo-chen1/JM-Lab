import { createClient } from '@supabase/supabase-js'

// 使用 import.meta.env 获取环境变量 (Vite)
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || ''
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || ''
const shouldLogDetails = import.meta.env.DEV

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase environment variables are missing. Please check your .env file.')
}

// 普通客户端（受 RLS 限制）
export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
)

// 服务角色客户端（绕过 RLS，仅用于服务器端操作）
// 注意：这个客户端有完全的数据库访问权限，只能在服务器端或受信任的环境中使用
// 必须通过环境变量 VITE_SUPABASE_SERVICE_ROLE_KEY 注入
export const supabaseAdmin = supabaseServiceKey
  ? createClient(
      supabaseUrl,
      supabaseServiceKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )
  : supabase

// 将 supabase 暴露到 window 对象以便调试
if (typeof window !== 'undefined') {
  (window as any).supabase = supabase
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
  if (!supabase) {
    if (shouldLogDetails) {
      console.warn('⚠️ Supabase客户端未配置，返回空用户列表');
    }
    return []
  }
  try {
    // 使用更直接的类型断言
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
  if (!supabase) {
    if (shouldLogDetails) {
      console.warn('⚠️ Supabase客户端未配置，返回空帖子列表');
    }
    return []
  }
  try {
    // 使用更直接的类型断言
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
  if (!supabase) {
    if (shouldLogDetails) {
      console.warn('⚠️ Supabase客户端未配置，无法创建帖子');
    }
    return null
  }
  try {
    // 使用更直接的类型断言
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
