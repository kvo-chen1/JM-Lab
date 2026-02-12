#!/usr/bin/env node
/**
 * 调试所有指标数据
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAllMetrics() {
  console.log('🔍 调试所有指标数据...\n');

  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

  try {
    // 获取用户的所有作品
    const { data: works, error } = await supabase
      .from('works')
      .select('id, title, created_at, views, likes, comments, shares')
      .eq('creator_id', userId);

    if (error) {
      console.log('❌ 查询错误:', error.message);
      return;
    }

    console.log(`✅ 找到 ${works?.length || 0} 个作品\n`);

    // 统计各项指标
    let totalViews = 0;
    let totalLikes = 0;
    let totalComments = 0;
    let totalShares = 0;

    const metricsByDate = {};

    works?.forEach(w => {
      const views = w.views || 0;
      const likes = w.likes || 0;
      const comments = w.comments || 0;
      const shares = w.shares || 0;

      totalViews += views;
      totalLikes += likes;
      totalComments += comments;
      totalShares += shares;

      const createdAt = w.created_at;
      const isMs = createdAt > 10000000000;
      const timestamp = isMs ? createdAt : createdAt * 1000;
      const date = new Date(timestamp).toISOString().split('T')[0];

      if (!metricsByDate[date]) {
        metricsByDate[date] = { views: 0, likes: 0, comments: 0, shares: 0 };
      }
      metricsByDate[date].views += views;
      metricsByDate[date].likes += likes;
      metricsByDate[date].comments += comments;
      metricsByDate[date].shares += shares;
    });

    console.log('📊 总指标统计:');
    console.log(`   - 作品数: ${works?.length || 0}`);
    console.log(`   - 浏览量: ${totalViews}`);
    console.log(`   - 点赞数: ${totalLikes}`);
    console.log(`   - 评论数: ${totalComments}`);
    console.log(`   - 分享数: ${totalShares}`);

    console.log('\n📅 按日期分组:');
    Object.entries(metricsByDate).forEach(([date, metrics]) => {
      console.log(`   ${date}:`);
      console.log(`     - 浏览量: ${metrics.views}`);
      console.log(`     - 点赞数: ${metrics.likes}`);
      console.log(`     - 评论数: ${metrics.comments}`);
      console.log(`     - 分享数: ${metrics.shares}`);
    });

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugAllMetrics();
