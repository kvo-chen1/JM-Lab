// 删除虚假的示例活动
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
console.log('删除虚假示例活动');
console.log('========================================\n');

// 创建 Supabase 客户端（使用 service role key）
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function deleteFakeEvents() {
  try {
    // 查询所有活动
    const { data: allEvents, error: fetchError } = await supabase
      .from('events')
      .select('*');
    
    if (fetchError) {
      console.log('❌ 查询失败:', fetchError.message);
      return;
    }

    console.log(`📊 当前共有 ${allEvents?.length || 0} 个活动\n`);

    if (!allEvents || allEvents.length === 0) {
      console.log('ℹ️ 没有活动需要删除');
      return;
    }

    // 显示所有活动
    console.log('活动列表:');
    allEvents.forEach((event, index) => {
      console.log(`\n[${index + 1}] ${event.title}`);
      console.log('  ID:', event.id);
      console.log('  创建时间:', event.created_at);
      console.log('  组织者ID:', event.organizer_id);
    });

    // 删除所有现有活动（因为这些都是系统生成的示例数据）
    console.log('\n\n⚠️ 正在删除所有活动...\n');
    
    for (const event of allEvents) {
      const { error: deleteError } = await supabase
        .from('events')
        .delete()
        .eq('id', event.id);
      
      if (deleteError) {
        console.log(`❌ 删除失败 [${event.title}]:`, deleteError.message);
      } else {
        console.log(`✅ 已删除: ${event.title}`);
      }
    }

    // 验证删除结果
    const { data: remainingEvents, error: checkError } = await supabase
      .from('events')
      .select('*');
    
    if (checkError) {
      console.log('\n❌ 验证失败:', checkError.message);
    } else {
      console.log(`\n✅ 删除完成！剩余活动数量: ${remainingEvents?.length || 0}`);
    }

  } catch (error) {
    console.error('❌ 操作异常:', error.message);
  }
}

deleteFakeEvents();
