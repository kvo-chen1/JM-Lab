#!/usr/bin/env node
/**
 * 调试所有作品的时间戳
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugAllWorks() {
  console.log('🔍 调试所有作品的时间戳...\n');

  try {
    // 获取所有作品
    const { data: works, error } = await supabase
      .from('works')
      .select('id, title, created_at, creator_id');

    if (error) {
      console.log('❌ 查询错误:', error.message);
      return;
    }

    console.log(`✅ 找到 ${works?.length || 0} 个作品`);
    console.log('\n作品列表:');

    works?.forEach((w, i) => {
      const createdAt = w.created_at;
      const isMs = createdAt > 10000000000;
      const timestamp = isMs ? createdAt : createdAt * 1000;
      const date = new Date(timestamp);
      const key = date.toISOString().split('T')[0];

      console.log(`${i + 1}. ${w.title || '无标题'}`);
      console.log(`   - created_at: ${createdAt} (${isMs ? '毫秒' : '秒'})`);
      console.log(`   - 日期: ${key}`);
      console.log(`   - 用户: ${w.creator_id}`);
    });

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugAllWorks();
