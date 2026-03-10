/**
 * 测试积分系统
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testPointsSystem() {
  console.log('🧪 测试积分系统...\n');

  // 1. 获取一个真实用户
  console.log('1️⃣ 获取测试用户...');
  const { data: users, error: usersError } = await supabase
    .from('users')
    .select('id, username')
    .limit(1);

  if (usersError || !users || users.length === 0) {
    console.log('   ❌ 没有找到用户，创建测试用户...');
    // 创建测试用户
    const { data: newUser, error: createError } = await supabase.auth.signUp({
      email: 'test-points@example.com',
      password: 'testpassword123'
    });
    
    if (createError) {
      console.log('   ❌ 创建用户失败:', createError.message);
      return;
    }
    
    console.log('   ✅ 创建测试用户:', newUser.user.id);
    var testUserId = newUser.user.id;
  } else {
    console.log('   ✅ 找到用户:', users[0].id);
    var testUserId = users[0].id;
  }

  // 2. 测试 get_user_points_stats
  console.log('\n2️⃣ 测试 get_user_points_stats...');
  const { data: stats, error: statsError } = await supabase.rpc('get_user_points_stats', {
    p_user_id: testUserId
  });

  if (statsError) {
    console.log('   ❌ 失败:', statsError.message);
  } else {
    console.log('   ✅ 成功');
    console.log('   📊 统计:', JSON.stringify(stats, null, 2));
  }

  // 3. 测试 check_points_limit
  console.log('\n3️⃣ 测试 check_points_limit...');
  const { data: limit, error: limitError } = await supabase.rpc('check_points_limit', {
    p_user_id: testUserId,
    p_source_type: 'daily',
    p_points: 5
  });

  if (limitError) {
    console.log('   ❌ 失败:', limitError.message);
  } else {
    console.log('   ✅ 成功');
    console.log('   📊 限制:', JSON.stringify(limit, null, 2));
  }

  // 4. 测试 update_user_points_balance（添加积分）
  console.log('\n4️⃣ 测试 update_user_points_balance（添加积分）...');
  const { data: addResult, error: addError } = await supabase.rpc('update_user_points_balance', {
    p_user_id: testUserId,
    p_points: 10,
    p_type: 'earned',
    p_source: '测试',
    p_source_type: 'daily',
    p_description: '测试添加积分'
  });

  if (addError) {
    console.log('   ❌ 失败:', addError.message);
  } else {
    console.log('   ✅ 成功');
    console.log('   📊 结果:', JSON.stringify(addResult, null, 2));
  }

  // 5. 再次获取统计
  console.log('\n5️⃣ 再次获取统计...');
  const { data: stats2, error: statsError2 } = await supabase.rpc('get_user_points_stats', {
    p_user_id: testUserId
  });

  if (statsError2) {
    console.log('   ❌ 失败:', statsError2.message);
  } else {
    console.log('   ✅ 成功');
    console.log('   📊 新统计:', JSON.stringify(stats2, null, 2));
  }

  console.log('\n✅ 测试完成');
}

testPointsSystem();
