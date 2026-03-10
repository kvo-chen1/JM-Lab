#!/usr/bin/env node
/**
 * 调试浏览量数据
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugViews() {
  console.log('🔍 调试浏览量数据...\n');

  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

  try {
    // 获取用户的所有作品
    const { data: works, error } = await supabase
      .from('works')
      .select('id, title, created_at, views')
      .eq('creator_id', userId);

    if (error) {
      console.log('❌ 查询错误:', error.message);
      return;
    }

    console.log(`✅ 找到 ${works?.length || 0} 个作品`);
    console.log('\n作品浏览量:');

    let totalViews = 0;
    works?.forEach((w, i) => {
      const views = w.views || 0;
      totalViews += views;
      const createdAt = w.created_at;
      const isMs = createdAt > 10000000000;
      const timestamp = isMs ? createdAt : createdAt * 1000;
      const date = new Date(timestamp).toISOString().split('T')[0];

      console.log(`${i + 1}. ${w.title || '无标题'}`);
      console.log(`   - 浏览量: ${views}`);
      console.log(`   - 创建日期: ${date}`);
    });

    console.log(`\n📊 总浏览量: ${totalViews}`);

    // 按日期分组统计
    const viewsByDate = {};
    works?.forEach(w => {
      const createdAt = w.created_at;
      const isMs = createdAt > 10000000000;
      const timestamp = isMs ? createdAt : createdAt * 1000;
      const date = new Date(timestamp).toISOString().split('T')[0];

      if (!viewsByDate[date]) {
        viewsByDate[date] = 0;
      }
      viewsByDate[date] += (w.views || 0);
    });

    console.log('\n📅 按日期分组:');
    Object.entries(viewsByDate).forEach(([date, views]) => {
      console.log(`   ${date}: ${views} 浏览`);
    });

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugViews();
