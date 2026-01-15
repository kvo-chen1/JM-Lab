import { createClient } from '@supabase/supabase-js'

// 环境变量清理函数，处理可能的空格、引号和反引号
const cleanEnvValue = (value: string | undefined): string => {
  if (!value) return '';
  // 移除前后空格、引号、反引号
  return value.trim().replace(/^[\s"'`]+|[\s"'`]+$/g, '');
};

// 检查是否在测试环境中
const isTestEnvironment = (): boolean => {
  try {
    // 优先检查import.meta.env
    if (typeof import.meta !== 'undefined') {
      return (import.meta as any).env?.NODE_ENV === 'test' || (import.meta as any).env?.MODE === 'test';
    } 
    // 然后检查window.env
    else if (typeof window !== 'undefined' && (window as any).env) {
      return (window as any).env.NODE_ENV === 'test';
    }
    // 最后检查process.env（仅用于Node.js和测试环境）
    else if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'test';
    }
  } catch (error) {
    // 忽略任何错误
  }
  return false;
};

// 获取环境变量，处理不同环境的差异
const getEnvValue = (key: string): string | undefined => {
  try {
    // 优先使用import.meta.env（Vite环境）
    if (typeof import.meta !== 'undefined') {
      return (import.meta as any).env?.[key];
    }
    // 然后使用window.env（浏览器环境）
    else if (typeof window !== 'undefined' && (window as any).env) {
      return (window as any).env[key];
    }
    // 最后使用process.env（Node.js和测试环境）
    else if (typeof process !== 'undefined' && process.env) {
      return process.env[key];
    }
  } catch (error) {
    // 忽略任何错误
  }
  return undefined;
};

// 获取环境变量，优先使用NEXT_PUBLIC_前缀，因为Vercel配置的是这个前缀
const supabaseUrl = cleanEnvValue(getEnvValue('NEXT_PUBLIC_SUPABASE_URL')) || 
                   cleanEnvValue(getEnvValue('VITE_SUPABASE_URL')) || 
                   cleanEnvValue(getEnvValue('SUPABASE_URL'))

// 优先使用旧格式的JWT密钥，因为当前SDK版本可能不支持新格式的Publishable key
const supabaseKey = cleanEnvValue(getEnvValue('NEXT_PUBLIC_SUPABASE_ANON_KEY')) || 
                   cleanEnvValue(getEnvValue('VITE_SUPABASE_ANON_KEY')) || 
                   cleanEnvValue(getEnvValue('SUPABASE_ANON_KEY')) || 
                   // 旧格式密钥不可用时，才使用新格式的Publishable key
                   cleanEnvValue(getEnvValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY')) || 
                   cleanEnvValue(getEnvValue('VITE_SUPABASE_PUBLISHABLE_DEFAULT_KEY')) || 
                   cleanEnvValue(getEnvValue('NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY')) || 
                   cleanEnvValue(getEnvValue('SUPABASE_PUBLISHABLE_KEY'))

// 检查是否为开发环境的辅助函数
const isDevelopment = (): boolean => {
  try {
    // 优先使用import.meta.env.DEV（Vite环境）
    if (typeof import.meta !== 'undefined') {
      return (import.meta as any).env?.DEV === true || (import.meta as any).env?.MODE === 'development';
    }
    // 然后使用window.env（浏览器环境）
    else if (typeof window !== 'undefined' && (window as any).env) {
      return (window as any).env.NODE_ENV === 'development';
    }
    // 最后使用process.env（Node.js和测试环境）
    else if (typeof process !== 'undefined' && process.env) {
      return process.env.NODE_ENV === 'development';
    }
  } catch (error) {
    // 忽略任何错误
  }
  return false;
};

// 验证环境变量是否完整
if (!supabaseUrl && isDevelopment()) {
  console.warn('⚠️ Supabase URL未配置，将使用模拟数据');
}

if (!supabaseKey && isDevelopment()) {
  console.warn('⚠️ Supabase密钥未配置，将使用模拟数据');
}

if (supabaseUrl && supabaseKey && isDevelopment()) {
  console.log('✅ Supabase环境变量配置完整');
}

// 创建并导出Supabase客户端实例
// 只有在环境变量有效的情况下才创建客户端
export let supabase: ReturnType<typeof createClient> | null = null

// 仅在非测试环境和开发环境下输出详细日志
const shouldLogDetails = isDevelopment() && !isTestEnvironment();

try {
  if (supabaseUrl && supabaseKey) {
    // 验证URL格式
    let isValidUrl = false;
    try {
      new URL(supabaseUrl);
      isValidUrl = true;
    } catch (error) {
      isValidUrl = false;
    }
    
    if (isValidUrl && supabaseKey.length >= 30) {
      try {
        // 根据密钥格式调整配置
        const isNewKeyFormat = supabaseKey.startsWith('sb_publishable_') || supabaseKey.startsWith('sb_secret_');

        // 为新格式密钥配置正确的客户端选项
        const clientOptions = {
          auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
          },
          // 减少不必要的日志输出
          logger: {
            log: shouldLogDetails ? (message) => console.log('[Supabase]', message) : () => {},
            error: (error) => console.error('[Supabase Error]', error),
            warn: (warning) => console.warn('[Supabase Warning]', warning),
            debug: shouldLogDetails ? (message) => console.debug('[Supabase Debug]', message) : () => {}
          }
        };

        supabase = createClient(supabaseUrl, supabaseKey, clientOptions);
        
        if (shouldLogDetails) {
          console.log('✅ Supabase客户端创建成功');
        }
      } catch (clientError) {
        console.error('❌ 创建Supabase客户端失败:', clientError);
        supabase = null;
      }
    } else {
      // 处理无效URL或密钥长度不足的情况
      if (!isValidUrl) {
        console.error('❌ Supabase URL格式不正确:', supabaseUrl);
      }
      
      if (supabaseKey.length < 30) {
        console.error('❌ Supabase密钥长度过短，可能是无效密钥');
      }
      
      supabase = null;
    }
  } else {
    if (shouldLogDetails) {
      console.warn('⚠️ 无法创建Supabase客户端，环境变量不完整，将使用模拟数据');
    }
  }
} catch (error) {
  console.error('❌ 创建Supabase客户端失败:', error);
  supabase = null;
}

// 确保supabase不会被tree-shaking移除
if (typeof window !== 'undefined') {
  // @ts-ignore
  window.__SUPABASE__ = supabase
}

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
