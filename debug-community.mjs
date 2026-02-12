#!/usr/bin/env node
/**
 * 调试社区数据问题
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function debugCommunity() {
  console.log('🔍 调试社区数据问题...\n');

  try {
    // 1. 获取所有社区
    console.log('1️⃣ 获取社区列表...');
    const { data: communities, error: commError } = await supabase
      .from('communities')
      .select('*')
      .limit(5);

    if (commError) {
      console.log('   ❌ 获取社区失败:', commError.message);
      return;
    }

    console.log(`   ✅ 找到 ${communities?.length || 0} 个社区`);

    if (communities && communities.length > 0) {
      const community = communities[0];
      console.log(`\n   社区: ${community.name} (ID: ${community.id})`);

      // 2. 获取社区成员
      console.log('\n2️⃣ 获取社区成员...');
      const { data: members, error: membersError } = await supabase
        .from('community_members')
        .select('*')
        .eq('community_id', community.id)
        .limit(5);

      if (membersError) {
        console.log('   ❌ 获取成员失败:', membersError.message);
      } else {
        console.log(`   ✅ 找到 ${members?.length || 0} 个成员`);
        
        if (members && members.length > 0) {
          members.forEach((m, i) => {
            console.log(`   ${i + 1}. User ID: ${m.user_id}`);
            console.log(`      - Role: ${m.role}`);
            console.log(`      - Joined at: ${m.joined_at} (类型: ${typeof m.joined_at})`);
            console.log(`      - 转换为日期: ${new Date(m.joined_at * 1000)}`);
          });

          // 3. 获取用户信息
          console.log('\n3️⃣ 获取用户信息...');
          const userIds = members.map(m => m.user_id);
          const { data: users, error: usersError } = await supabase
            .from('users')
            .select('id, username, avatar_url')
            .in('id', userIds);

          if (usersError) {
            console.log('   ❌ 获取用户失败:', usersError.message);
          } else {
            console.log(`   ✅ 找到 ${users?.length || 0} 个用户`);
            
            if (users && users.length > 0) {
              users.forEach((u, i) => {
                console.log(`   ${i + 1}. ID: ${u.id}`);
                console.log(`      - Username: ${u.username}`);
                console.log(`      - Avatar: ${u.avatar_url}`);
              });
            } else {
              console.log('   ⚠️ 没有找到对应的用户数据');
              console.log('   查询的用户IDs:', userIds);
            }
          }
        }
      }
    }

    // 4. 检查 users 表结构
    console.log('\n4️⃣ 检查 users 表...');
    const { data: sampleUsers, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(3);

    if (sampleError) {
      console.log('   ❌ 获取用户样本失败:', sampleError.message);
    } else {
      console.log(`   ✅ 找到 ${sampleUsers?.length || 0} 个用户样本`);
      
      if (sampleUsers && sampleUsers.length > 0) {
        sampleUsers.forEach((u, i) => {
          console.log(`   ${i + 1}. ID: ${u.id}`);
          console.log(`      - Username: ${u.username}`);
          console.log(`      - Email: ${u.email}`);
        });
      }
    }

    console.log('\n✅ 调试完成！');

  } catch (error) {
    console.error('\n❌ 调试失败:', error.message);
  }
}

debugCommunity();
