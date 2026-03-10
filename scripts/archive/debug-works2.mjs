#!/usr/bin/env node
/**
 * 调试 works 表数据
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugWorks() {
  console.log('🔍 调试 works 表数据...\n');

  try {
    // 获取 works 表数据
    const { data: works, error } = await supabase
      .from('works')
      .select('*')
      .limit(10);

    if (error) {
      console.log('❌ 查询错误:', error.message);
      return;
    }

    console.log(`✅ 找到 ${works?.length || 0} 条作品记录`);
    
    if (works && works.length > 0) {
      console.log('\n字段列表:', Object.keys(works[0]).join(', '));
      works.forEach((w, i) => {
        console.log(`\n${i + 1}. ID: ${w.id}`);
        console.log(`   - 标题: ${w.title || '无标题'}`);
        console.log(`   - creator_id: ${w.creator_id}`);
        console.log(`   - created_at: ${w.created_at}`);
        console.log(`   - likes: ${w.likes || 0}`);
        console.log(`   - views: ${w.views || 0}`);
      });
    }

    // 统计总数
    const { count, error: countError } = await supabase
      .from('works')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log('\n❌ 统计错误:', countError.message);
    } else {
      console.log(`\n📊 作品总数: ${count}`);
    }

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugWorks();
