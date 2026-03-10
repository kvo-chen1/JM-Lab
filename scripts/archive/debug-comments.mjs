#!/usr/bin/env node
/**
 * 调试 comments 表结构
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugComments() {
  console.log('🔍 调试 comments 表结构...\n');

  try {
    // 获取 comments 表数据
    const { data: comments, error } = await supabase
      .from('comments')
      .select('*')
      .limit(3);

    if (error) {
      console.log('❌ 查询错误:', error.message);
      return;
    }

    console.log(`✅ 找到 ${comments?.length || 0} 条评论`);
    
    if (comments && comments.length > 0) {
      console.log('\n字段列表:', Object.keys(comments[0]).join(', '));
      comments.forEach((c, i) => {
        console.log(`\n${i + 1}. ID: ${c.id}`);
        console.log(`   - post_id: ${c.post_id}`);
        console.log(`   - user_id: ${c.user_id}`);
        console.log(`   - created_at: ${c.created_at} (类型: ${typeof c.created_at})`);
      });
    }

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugComments();
