// 重新导出 supabase 客户端（统一入口）
// 所有 supabase 相关导入都应该使用这个文件

export { supabase, supabaseAdmin, supabaseUrl, supabaseAnonKey } from './supabase'
export type { User, Post, UserHistory } from './supabase'
