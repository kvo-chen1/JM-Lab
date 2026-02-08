// 检查活动数据来源
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
console.log('检查 Supabase 中的活动数据');
console.log('========================================\n');

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkEvents() {
  try {
    const { data: events, error } = await supabase
      .from('events')
      .select('*');
    
    if (error) {
      console.log('❌ 查询失败:', error.message);
      return;
    }

    console.log(`📊 Supabase 中共有 ${events?.length || 0} 个活动\n`);

    if (events && events.length > 0) {
      events.forEach((event, index) => {
        console.log(`[${index + 1}] ${event.title}`);
        console.log('  ID:', event.id);
        console.log('  创建时间:', event.created_at);
        console.log('  组织者ID:', event.organizer_id);
        console.log('');
      });
    } else {
      console.log('✅ Supabase 中没有活动数据');
    }

  } catch (error) {
    console.error('❌ 查询异常:', error.message);
  }
}

checkEvents();
