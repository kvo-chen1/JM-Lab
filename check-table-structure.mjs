import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('检查 events 表结构...\n');

  // 直接查询数据，看看有哪些列
  const { data: eventData, error: eventError } = await supabase
    .from('events')
    .select('*')
    .limit(1);

  if (eventError) {
    console.error('查询失败:', eventError);
    return;
  }

  if (eventData && eventData.length > 0) {
    console.log('events 表列名:');
    Object.keys(eventData[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof eventData[0][key]}`);
    });
    console.log('\n示例数据:', eventData[0]);
  } else {
    console.log('events 表没有数据');
  }
}

checkTableStructure();
