// 测试与线上Supabase的连接
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();

// 从环境变量获取Supabase连接信息
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Anon Key:', supabaseAnonKey ? '已配置' : '未配置');

// 验证环境变量是否已配置
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('错误：请在.env文件中配置VITE_SUPABASE_URL和VITE_SUPABASE_ANON_KEY环境变量');
  process.exit(1);
}

// 创建Supabase客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testSupabaseConnection() {
  console.log('\n正在测试与Supabase的连接...');
  
  try {
    // 尝试执行一个简单的查询，比如列出所有表
    const { data, error } = await supabase.from('pg_tables').select('tablename').limit(5);
    
    if (error) {
      if (error.code === '42501') {
        console.log('连接成功，但没有权限访问pg_tables表');
        console.log('这是正常现象，因为匿名用户通常没有这个权限');
        console.log('✓ Supabase连接测试成功！');
      } else {
        throw error;
      }
    } else {
      console.log('✓ Supabase连接测试成功！');
      console.log('查询结果：', data);
    }
  } catch (error) {
    console.error('✗ Supabase连接测试失败：', error.message);
    console.error('错误详情：', error);
    process.exit(1);
  }
}

// 运行测试
testSupabaseConnection();
