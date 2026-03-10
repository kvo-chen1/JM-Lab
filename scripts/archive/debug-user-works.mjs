#!/usr/bin/env node
/**
 * 调试特定用户的作品数
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugUserWorks() {
  console.log('🔍 调试用户作品数...\n');

  try {
    // 获取所有用户
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username')
      .limit(10);

    if (usersError) {
      console.log('❌ 获取用户失败:', usersError.message);
      return;
    }

    console.log('用户列表:');
    for (const user of users || []) {
      // 统计每个用户的作品数
      const { count, error: countError } = await supabase
        .from('works')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', user.id);

      if (countError) {
        console.log(`  ${user.username}: 查询失败`);
      } else {
        console.log(`  ${user.username} (${user.id}): ${count} 个作品`);
      }
    }

    // 统计总作品数
    const { count: totalCount, error: totalError } = await supabase
      .from('works')
      .select('*', { count: 'exact', head: true });

    if (!totalError) {
      console.log(`\n📊 总作品数: ${totalCount}`);
    }

  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugUserWorks();
