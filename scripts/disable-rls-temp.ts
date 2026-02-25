/**
 * 临时禁用 brand_tasks 表的 RLS
 */
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function disableRLS() {
  console.log('临时禁用 brand_tasks 表的 RLS...\n');

  try {
    // 尝试使用 service role 直接执行
    const { error } = await supabase.rpc('exec_sql', {
      sql: 'ALTER TABLE public.brand_tasks DISABLE ROW LEVEL SECURITY;'
    });

    if (error) {
      console.error('禁用 RLS 失败:', error.message);
      console.log('\n请手动在 Supabase Dashboard 执行:');
      console.log('ALTER TABLE public.brand_tasks DISABLE ROW LEVEL SECURITY;');
    } else {
      console.log('✓ RLS 已临时禁用');
      console.log('现在可以创建任务了');
    }
  } catch (error: any) {
    console.error('错误:', error.message);
  }
}

disableRLS();
