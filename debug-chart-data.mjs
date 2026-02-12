#!/usr/bin/env node
/**
 * 调试图表数据
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugChartData() {
  console.log('🔍 调试图表数据...\n');

  const userId = 'f3dedf79-5c5e-40fd-9513-d0fb0995d429';

  // 计算30天前的时间戳
  const now = new Date();
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(now.getDate() - 30);
  const startTimeSeconds = Math.floor(thirtyDaysAgo.getTime() / 1000);
  const endTimeSeconds = Math.floor(now.getTime() / 1000);

  try {
    // 获取用户的所有作品
    const { data: works, error } = await supabase
      .from('works')
      .select('created_at, category, creator_id')
      .eq('creator_id', userId);

    if (error) {
      console.log('❌ 查询错误:', error.message);
      return;
    }

    // 在内存中过滤时间范围
    const filteredWorks = (works || []).filter(w => {
      const createdAt = w.created_at;
      const createdAtSeconds = createdAt > 10000000000 ? Math.floor(createdAt / 1000) : createdAt;
      return createdAtSeconds >= startTimeSeconds && createdAtSeconds <= endTimeSeconds;
    });

    console.log(`✅ 找到 ${filteredWorks.length} 个作品`);

    // 按天分组
    const groupedData = {};

    filteredWorks.forEach(item => {
      const createdAt = item.created_at;
      const timestamp = createdAt > 10000000000 ? createdAt : createdAt * 1000;
      const date = new Date(timestamp);
      const key = date.toISOString().split('T')[0];

      if (!groupedData[key]) {
        groupedData[key] = { value: 0, count: 0 };
      }
      groupedData[key].value += 1;
      groupedData[key].count += 1;
    });

    // 格式化返回
    const result = Object.entries(groupedData).map(([key, { value, count }]) => ({
      timestamp: new Date(key).getTime(),
      value,
      label: key,
      count
    })).sort((a, b) => a.timestamp - b.timestamp);

    console.log('\n📊 分组数据:');
    result.forEach((item, i) => {
      console.log(`  ${i + 1}. label: ${item.label}, timestamp: ${item.timestamp}, value: ${item.value}, count: ${item.count}`);
      console.log(`     日期: ${new Date(item.timestamp).toISOString()}`);
    });

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugChartData();
