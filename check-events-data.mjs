// 检查 events 表数据
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
const SUPABASE_ANON_KEY = envConfig.VITE_SUPABASE_ANON_KEY;

console.log('========================================');
console.log('检查 Events 表数据');
console.log('========================================\n');

// 创建 Supabase 客户端
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkEvents() {
  console.log('🔍 查询 events 表...\n');

  try {
    // 查询所有活动
    const { data: allEvents, error: allError } = await supabase
      .from('events')
      .select('*');
    
    if (allError) {
      console.log('❌ 查询失败:', allError.message);
      console.log('错误码:', allError.code);
      return;
    }

    console.log(`✅ 查询成功，共 ${allEvents?.length || 0} 条活动记录\n`);

    if (allEvents && allEvents.length > 0) {
      console.log('活动列表:');
      allEvents.forEach((event, index) => {
        console.log(`\n[${index + 1}] ${event.title}`);
        console.log('  ID:', event.id);
        console.log('  状态:', event.status);
        console.log('  是否公开:', event.is_public);
        console.log('  开始时间:', event.start_time);
        console.log('  结束时间:', event.end_time);
        console.log('  创建时间:', event.created_at);
      });

      // 检查已发布且公开的活动
      console.log('\n\n--- 检查已发布且公开的活动 ---');
      const { data: publishedEvents, error: pubError } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .eq('is_public', true);
      
      if (pubError) {
        console.log('❌ 查询失败:', pubError.message);
      } else {
        console.log(`✅ 已发布且公开的活动: ${publishedEvents?.length || 0} 条`);
        publishedEvents?.forEach((event, index) => {
          console.log(`\n[${index + 1}] ${event.title}`);
          console.log('  开始时间:', event.start_time);
          console.log('  结束时间:', event.end_time);
        });
      }

      // 检查即将开始的活动（未来7天内）
      console.log('\n\n--- 检查即将开始的活动 ---');
      const now = new Date();
      const nextWeek = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
      
      const upcomingEvents = allEvents.filter(event => {
        const eventStart = new Date(event.start_time);
        return eventStart >= now && eventStart <= nextWeek;
      });
      
      console.log(`✅ 即将开始的活动（未来7天内）: ${upcomingEvents.length} 条`);
      upcomingEvents.forEach((event, index) => {
        console.log(`\n[${index + 1}] ${event.title}`);
        console.log('  开始时间:', event.start_time);
      });

      // 检查进行中的活动
      console.log('\n\n--- 检查进行中的活动 ---');
      const ongoingEvents = allEvents.filter(event => {
        const eventStart = new Date(event.start_time);
        const eventEnd = new Date(event.end_time);
        return eventStart <= now && eventEnd >= now;
      });
      
      console.log(`✅ 进行中的活动: ${ongoingEvents.length} 条`);
      ongoingEvents.forEach((event, index) => {
        console.log(`\n[${index + 1}] ${event.title}`);
        console.log('  开始时间:', event.start_time);
        console.log('  结束时间:', event.end_time);
      });
    } else {
      console.log('⚠️ events 表中没有数据');
    }

  } catch (error) {
    console.error('❌ 查询异常:', error.message);
  }
}

checkEvents();
