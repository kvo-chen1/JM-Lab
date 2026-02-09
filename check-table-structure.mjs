// 检查 tianjin_templates 表结构
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// 加载环境变量
const envLocal = readFileSync('.env.local', 'utf-8');
const envConfig = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envConfig[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envConfig.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('检查 tianjin_templates 表结构');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkStructure() {
  // 查询一条数据查看所有字段
  const { data, error } = await supabase
    .from('tianjin_templates')
    .select('*')
    .limit(1)
    .single();
  
  if (error) {
    console.log('❌ 查询失败:', error.message);
    return;
  }
  
  console.log('✅ 表字段:');
  console.log(Object.keys(data).join(', '));
  
  console.log('\n✅ 第一条数据:');
  console.log(JSON.stringify(data, null, 2));
}

checkStructure();
