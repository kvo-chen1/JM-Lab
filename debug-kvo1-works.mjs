#!/usr/bin/env node
/**
 * 调试 kvo1 的作品时间分布
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugKvo1Works() {
  console.log('🔍 调试 kvo1 的作品时间分布...\n');

  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

  // 计算30天前的时间戳
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const thirtyDaysAgoTimestamp = Math.floor(thirtyDaysAgo.getTime() / 1000);
  const nowTimestamp = Math.floor(now.getTime() / 1000);

  console.log('当前时间:', now.toISOString());
  console.log('30天前:', thirtyDaysAgo.toISOString());
  console.log('30天前时间戳:', thirtyDaysAgoTimestamp);
  console.log('');

  try {
    // 获取 kvo1 的所有作品
    const { data: works, error } = await supabase
      .from('works')
      .select('id, title, created_at')
      .eq('creator_id', userId);

    if (error) {
      console.log('❌ 查询错误:', error.message);
      return;
    }

    console.log(`✅ 找到 ${works?.length || 0} 个作品`);
    console.log('\n作品列表:');

    let recentCount = 0;
    works?.forEach((w, i) => {
      const createdAt = new Date(w.created_at * (w.created_at > 10000000000 ? 1 : 1000));
      const isRecent = w.created_at >= thirtyDaysAgoTimestamp;
      if (isRecent) recentCount++;

      console.log(`${i + 1}. ${w.title || '无标题'}`);
      console.log(`   - created_at: ${w.created_at}`);
      console.log(`   - 日期: ${createdAt.toISOString()}`);
      console.log(`   - 最近30天: ${isRecent ? '✅' : '❌'}`);
    });

    console.log(`\n📊 统计:`);
    console.log(`   - 总作品数: ${works?.length || 0}`);
    console.log(`   - 最近30天: ${recentCount}`);

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugKvo1Works();
