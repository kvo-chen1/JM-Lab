// API 配置

/**
 * 获取本地 API 服务器地址
 */
export function getLocalApiUrl(): string {
  // 优先使用环境变量
  if (import.meta.env.VITE_LOCAL_API_URL) {
    return import.meta.env.VITE_LOCAL_API_URL;
  }
  
  // 默认使用 localhost:3030
  return 'http://localhost:3030';
}

/**
 * 获取 Supabase URL
 */
export function getSupabaseUrl(): string {
  return import.meta.env.VITE_SUPABASE_URL || '';
}

/**
 * 获取 Supabase Anon Key
 */
export function getSupabaseAnonKey(): string {
  return import.meta.env.VITE_SUPABASE_ANON_KEY || '';
}
