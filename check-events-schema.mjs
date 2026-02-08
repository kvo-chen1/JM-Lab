// 检查 events 表结构
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
const SUPABASE_SERVICE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('检查 Events 表结构');
console.log('========================================\n');

// 创建 Supabase 客户端（使用 service role key 获取更多信息）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkSchema() {
  try {
    // 查询 events 表的一条记录来查看字段
    const { data, error } = await supabase
      .from('events')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('❌ 查询失败:', error.message);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ events 表字段结构:\n');
      const event = data[0];
      Object.keys(event).forEach(key => {
        const value = event[key];
        const type = Array.isArray(value) ? 'array' : typeof value;
        console.log(`  ${key}: ${type} = ${value === null ? 'null' : value === undefined ? 'undefined' : JSON.stringify(value).substring(0, 50)}`);
      });
    } else {
      console.log('⚠️ events 表中没有数据');
    }

    // 查询所有活动
    console.log('\n\n========================================');
    console.log('所有活动数据');
    console.log('========================================\n');
    
    const { data: allEvents, error: allError } = await supabase
      .from('events')
      .select('*');
    
    if (allError) {
      console.log('❌ 查询失败:', allError.message);
      return;
    }

    console.log(`共 ${allEvents?.length || 0} 条活动记录\n`);
    
    allEvents?.forEach((event, index) => {
      console.log(`\n[${index + 1}] ${event.title || '无标题'}`);
      console.log('  完整数据:', JSON.stringify(event, null, 2));
    });

  } catch (error) {
    console.error('❌ 查询异常:', error.message);
  }
}

checkSchema();
