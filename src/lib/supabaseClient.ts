import { createClient } from '@supabase/supabase-js'

// 使用process.env代替import.meta.env，以支持Jest测试环境
const env = typeof process !== 'undefined' && process.env ? process.env : {} as any
const supabaseUrl = env.VITE_SUPABASE_URL || ''
const supabaseKey = env.VITE_SUPABASE_ANON_KEY || ''
const shouldLogDetails = env.NODE_ENV === 'development'

if (!supabaseUrl || !supabaseKey) {
  console.warn('⚠️ Supabase environment variables are missing. Please check your .env file.')
}

export const supabase = createClient(
  supabaseUrl || 'https://placeholder.supabase.co',
  supabaseKey || 'placeholder-key'
)

// Type definitions for Supabase tables
export interface User {
  id: string;
  username: string;
  email: string;
  avatar_url?: string;
  bio?: string;
  created_at: string;
  updated_at: string;
  last_login?: string;
  role: 'user' | 'admin' | 'moderator';
  is_active: boolean;
}

export interface Post {
  id: string;
  user_id: string;
  title: string;
  content: string;
  created_at: string;
  updated_at: string;
  likes_count?: number;
  comments_count?: number;
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
