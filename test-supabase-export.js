// 测试 supabase 导出
import { createClient } from '@supabase/supabase-js';

// 模拟环境变量
const supabaseUrl = 'https://kizgwtrrsmkjeiddotup.supabase.co';
const supabaseAnonKey = 'sb_publishable_OAHzcMje8KUmtnsjznszkg_fub4kT0i';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpemd3dHJyc21ramVpZGRvdHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxOTI2NSwiZXhwIjoyMDg4Mzk1MjY1fQ.Joc5d8ORWUfijvns7szuBONRkoIJubd6_B30fIM8HB0';

// 创建客户端
const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

console.log('Testing supabase export...');
console.log('supabase type:', typeof supabase);
console.log('supabaseAdmin type:', typeof supabaseAdmin);
console.log('supabase has from method:', typeof supabase.from === 'function');
console.log('supabaseAdmin has from method:', typeof supabaseAdmin.from === 'function');
console.log('supabase has auth:', typeof supabase.auth === 'object');

// 测试查询
async function testQuery() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (error) {
      console.log('Query error:', error.message);
    } else {
      console.log('Query success, count:', data);
    }
  } catch (err) {
    console.log('Query exception:', err.message);
  }
}

testQuery();
