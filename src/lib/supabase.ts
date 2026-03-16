// 数据库客户端配置 - 使用 Supabase PostgreSQL
import { createClient, SupabaseClient } from '@supabase/supabase-js'

// Supabase 配置 - 从环境变量读取，Vercel部署时会注入
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || ''

// 支持新的 publishable key 格式和旧的 anon key 格式
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
                        import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
                        import.meta.env.VITE_SUPABASE_ANON_KEY ||
                        import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
                        ''

// Service Role Key - 用于管理员操作（绕过 RLS）
// 支持新的 secret key 格式和旧的 JWT 格式
const supabaseServiceKey = import.meta.env.VITE_SUPABASE_SECRET_KEY ||
                           import.meta.env.SUPABASE_SECRET_KEY ||
                           import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY ||
                           import.meta.env.SUPABASE_SERVICE_ROLE_KEY ||
                           ''

console.log('[DB] Environment:', import.meta.env.PROD ? 'production' : 'development')
console.log('[DB] Supabase URL:', supabaseUrl)

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

// 创建标准客户端（使用 anon key）
export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
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
    enabled: true  // 启用 realtime 功能
  }
})

// 创建管理员客户端（使用 service role key，绕过 RLS）
export const supabaseAdmin: SupabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  global: {
    headers: {
      'x-application-name': 'creator-community-admin'
    },
    fetch: fetchWithRetry
  },
  db: {
    schema: 'public'
  },
  realtime: {
    enabled: false
  }
})

console.log('[Supabase] 客户端初始化成功')

// 将客户端暴露到 window 对象以便调试
if (typeof window !== 'undefined') {
  try {
    // 使用 Object.defineProperty 避免被意外覆盖或调用
    Object.defineProperty(window, 'supabase', {
      value: supabase,
      writable: false,
      enumerable: true,
      configurable: false
    });
    Object.defineProperty(window, 'supabaseAdmin', {
      value: supabaseAdmin,
      writable: false,
      enumerable: true,
      configurable: false
    });
    console.log('[Supabase] 已暴露到 window 对象');
  } catch (e) {
    console.error('[Supabase] 暴露到 window 对象失败:', e);
  }
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
