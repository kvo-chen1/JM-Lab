const { createClient } = require('@supabase/supabase-js');

// 从 run-migration.js 获取配置
const SUPABASE_URL = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.log('❌ 未找到 SUPABASE_SERVICE_KEY 环境变量');
  console.log('请设置环境变量: $env:SUPABASE_SERVICE_KEY="your-service-key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.log('❌ 连接失败:', error.message);
      process.exit(1);
    }
    console.log('✅ Supabase 连接成功!');
    console.log('📊 数据库连接正常');
  } catch (err) {
    console.log('❌ 连接错误:', err.message);
    process.exit(1);
  }
}

testConnection();
