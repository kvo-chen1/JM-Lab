#!/usr/bin/env node
/**
 * 调试在线用户统计
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugOnline() {
  console.log('🔍 调试在线用户统计...\n');

  try {
    // 获取社区ID
    const { data: communities } = await supabase
      .from('communities')
      .select('id, name')
      .limit(1);

    if (!communities || communities.length === 0) {
      console.log('❌ 没有找到社区');
      return;
    }

    const communityId = communities[0].id;
    console.log('社区:', communities[0].name, '(ID:', communityId + ')');

    // 1. 检查 community_members 表结构
    console.log('\n1️⃣ 检查 community_members 表...');
    const { data: members, error: membersError } = await supabase
      .from('community_members')
      .select('*')
      .eq('community_id', communityId);

    if (membersError) {
      console.log('   ❌ 查询错误:', membersError.message);
    } else {
      console.log(`   ✅ 找到 ${members?.length || 0} 个成员`);
      if (members && members.length > 0) {
        console.log('   字段:', Object.keys(members[0]).join(', '));
        members.forEach((m, i) => {
          console.log(`   ${i + 1}. User ID: ${m.user_id}`);
          console.log(`      - last_active: ${m.last_active} (类型: ${typeof m.last_active})`);
          console.log(`      - joined_at: ${m.joined_at}`);
        });
      }
    }

    // 2. 测试更新 last_active
    console.log('\n2️⃣ 测试更新 last_active...');
    if (members && members.length > 0) {
      const testUserId = members[0].user_id;
      const now = Math.floor(Date.now() / 1000);
      
      const { data: updateResult, error: updateError } = await supabase
        .from('community_members')
        .update({ last_active: now })
        .eq('community_id', communityId)
        .eq('user_id', testUserId)
        .select();

      if (updateError) {
        console.log('   ❌ 更新失败:', updateError.message);
      } else {
        console.log('   ✅ 更新成功');
        console.log('   结果:', updateResult);
      }
    }

    // 3. 检查在线人数（最近5分钟）
    console.log('\n3️⃣ 检查在线人数...');
    const fiveMinutesAgo = Math.floor(Date.now() / 1000) - 300;
    const { data: onlineUsers, error: onlineError } = await supabase
      .from('community_members')
      .select('*')
      .eq('community_id', communityId)
      .gte('last_active', fiveMinutesAgo);

    if (onlineError) {
      console.log('   ❌ 查询错误:', onlineError.message);
    } else {
      console.log(`   ✅ 最近5分钟有 ${onlineUsers?.length || 0} 个活跃用户`);
      if (onlineUsers && onlineUsers.length > 0) {
        onlineUsers.forEach((u, i) => {
          console.log(`   ${i + 1}. User ID: ${u.user_id}, last_active: ${u.last_active}`);
        });
      }
    }

    console.log('\n✅ 调试完成！');

  } catch (error) {
    console.error('\n❌ 调试失败:', error.message);
  }
}

debugOnline();
