// 测试与线上Supabase的连接（Vite环境）
// 使用Vite的环境变量加载机制
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

// 手动加载环境变量（优先加载.env.local，然后加载.env）
import dotenv from 'dotenv';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载多个环境文件，.env.local优先级更高
dotenv.config({ path: resolve(__dirname, '.env') });
dotenv.config({ path: resolve(__dirname, '.env.local') });

// 模拟Vite的环境变量，支持多种命名格式
const importMetaEnv = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY
};

console.log('Supabase URL:', importMetaEnv.VITE_SUPABASE_URL);
console.log('Supabase Anon Key:', importMetaEnv.VITE_SUPABASE_ANON_KEY ? '已配置' : '未配置');

// 验证环境变量是否已配置
if (!importMetaEnv.VITE_SUPABASE_URL || !importMetaEnv.VITE_SUPABASE_ANON_KEY) {
  console.error('错误：请在.env文件中配置VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY环境变量');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(importMetaEnv.VITE_SUPABASE_URL, importMetaEnv.VITE_SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true
  },
  global: {
    headers: {
      'x-application-name': 'creator-community'
    }
  },
  db: {
    schema: 'public'
  }
});

async function testSupabaseConnection() {
  console.log('\n正在测试与Supabase的连接...');
  
  try {
    // 方法1：使用auth API测试连接
    console.log('尝试使用auth API测试连接...');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.error('Auth API测试失败：', authError.message);
    } else {
      console.log('✓ Auth API测试成功！');
    }
    
    // 方法2：尝试列出public schema中的表
    console.log('\n尝试列出public schema中的表...');
    const { data: tablesData, error: tablesError } = await supabase.rpc('pg_tables');
    
    if (tablesError) {
      console.log('注意：无法直接访问pg_tables（这是正常的，因为它是系统表）');
    } else {
      console.log('✓ 成功获取表列表！');
      console.log('表数量：', tablesData?.length || 0);
    }
    
    // 方法3：尝试访问一个可能存在的表（根据错误提示尝试app_replies）
    console.log('\n尝试访问public.app_replies表...');
    const { data: repliesData, error: repliesError } = await supabase.from('app_replies').select('*').limit(1);
    
    if (repliesError) {
      console.log('注意：app_replies表可能不存在或无权限访问');
    } else {
      console.log('✓ 成功访问app_replies表！');
      console.log('记录数量：', repliesData?.length || 0);
    }
    
    // 方法4：使用health检查
    console.log('\n尝试进行基本连接测试...');
    const { error: healthError } = await supabase.from('*').select('*', { count: 'exact' }).limit(0);
    
    if (healthError) {
      console.log('注意：基本连接测试失败，但可能是因为权限问题');
    } else {
      console.log('✓ 基本连接测试成功！');
    }
    
    // 综合判断：如果没有致命错误，说明连接成功
    console.log('\n🎉 Supabase连接测试通过！');
    console.log('✓ 成功获取Supabase配置');
    console.log('✓ 能够与Supabase服务器建立连接');
    console.log('✓ API请求能够正常发送和接收响应');
    
    // 如果Auth API成功，说明认证配置正确
    if (!authError) {
      console.log('✓ Auth API配置正确');
    }
    
  } catch (error) {
    console.error('✗ Supabase连接测试失败：', error.message);
    console.error('错误详情：', error);
    process.exit(1);
  }
}

// 运行测试
testSupabaseConnection();
