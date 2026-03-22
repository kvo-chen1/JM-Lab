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
// ⚠️ 警告：Service Role Key 绝对不应该在前端使用！
// 这是严重的安全风险，会导致数据库被完全暴露
// 
// 正确的做法：
// 1. 所有需要绕过 RLS 的操作都应该通过后端 API 进行
// 2. 前端只使用普通 supabase 客户端，受 RLS 保护
// 3. Service Role Key 只在服务器端使用
//
// 为了安全，我们始终返回空字符串，禁用前端的 supabaseAdmin
const supabaseServiceKey = ''  // 前端禁用 Service Role Key

console.log('[DB] Environment:', import.meta.env.PROD ? 'production' : 'development')
console.log('[DB] Supabase URL:', supabaseUrl)

// 导出配置供其他模块使用
export { supabaseUrl, supabaseAnonKey }

// 增强的 fetch，带有重试逻辑
// 注意：不在此处添加认证头，因为 supabase 客户端会自动处理
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



// ⚠️ 重要安全提示：
// Service Role Key 绝对不应该在前端使用！这会导致严重的安全漏洞。
// 所有需要管理员权限的操作都应该通过后端 API 进行。
// 
// 前端代码中的 supabaseAdmin 现在被强制指向普通 supabase 客户端，
// 这意味着它受 RLS 策略保护。如果需要绕过 RLS，请调用后端 API。
//
// 后端 API 地址：${import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3030'}/api/...

// 导出 supabaseAdmin，但强制使用普通 supabase 客户端（安全降级）
// 这样可以防止意外使用 Service Role Key，同时保持代码兼容性
export const supabaseAdmin: SupabaseClient = supabase;

console.warn('[Supabase] supabaseAdmin 已安全降级为普通客户端（受 RLS 保护）。如需管理员操作，请使用后端 API。')

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
    // 不再暴露 supabaseAdmin 到 window 对象（安全考虑）
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
