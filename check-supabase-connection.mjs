/**
 * 检查 Supabase 连接和数据库状态
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkConnection() {
  console.log('🔍 检查 Supabase 连接...\n');

  try {
    // 1. 测试基本连接 - 尝试查询 users 表
    console.log('1️⃣ 测试基本连接...');
    const { data: usersData, error: usersError } = await supabase
      .from('users')
      .select('count', { count: 'exact', head: true });

    if (usersError) {
      console.log('   ❌ 连接失败:', usersError.message);
      return;
    }
    console.log('   ✅ 连接成功');

    // 2. 检查 users 表字段
    console.log('\n2️⃣ 检查 users 表...');
    const { data: userSample, error: sampleError } = await supabase
      .from('users')
      .select('*')
      .limit(1);

    if (sampleError) {
      console.log('   ❌ 获取 users 表失败:', sampleError.message);
    } else if (userSample && userSample.length > 0) {
      const columns = Object.keys(userSample[0]);
      console.log(`   ✅ users 表存在，有 ${columns.length} 个字段:`);
      columns.forEach(col => console.log(`      - ${col}`));
    } else {
      console.log('   ✅ users 表存在（暂无数据）');
    }

    // 3. 检查积分系统表
    console.log('\n3️⃣ 检查积分系统表...');
    const pointsTables = [
      'user_points_balance',
      'points_records',
      'points_rules',
      'checkin_records',
      'task_records',
      'invite_records',
      'consumption_records',
      'exchange_records',
      'deduction_records',
      'points_limits',
      'reconciliation_records'
    ];

    let existingTables = [];
    let missingTables = [];

    for (const table of pointsTables) {
      try {
        const { error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
        
        if (error && error.message.includes('does not exist')) {
          console.log(`   ❌ ${table} (未创建)`);
          missingTables.push(table);
        } else {
          console.log(`   ✅ ${table}`);
          existingTables.push(table);
        }
      } catch (e) {
        console.log(`   ❌ ${table} (未创建)`);
        missingTables.push(table);
      }
    }

    console.log(`\n   📊 统计: ${existingTables.length} 个表已存在, ${missingTables.length} 个表需要创建`);

    // 4. 检查 RPC 函数
    console.log('\n4️⃣ 检查 RPC 函数...');
    const rpcFunctions = [
      'update_user_points_balance',
      'get_user_points_stats',
      'check_points_limit'
    ];

    for (const func of rpcFunctions) {
      try {
        const { error } = await supabase.rpc(func, { p_user_id: '00000000-0000-0000-0000-000000000000' });
        if (error && error.message.includes('Could not find the function')) {
          console.log(`   ❌ ${func} (未创建)`);
        } else {
          console.log(`   ✅ ${func}`);
        }
      } catch (e) {
        console.log(`   ❌ ${func} (未创建)`);
      }
    }

    // 5. 检查视图
    console.log('\n5️⃣ 检查视图...');
    const views = ['user_points_overview', 'points_leaderboard'];
    for (const view of views) {
      try {
        const { error } = await supabase
          .from(view)
          .select('count', { count: 'exact', head: true });
        
        if (error && error.message.includes('does not exist')) {
          console.log(`   ❌ ${view} (未创建)`);
        } else {
          console.log(`   ✅ ${view}`);
        }
      } catch (e) {
        console.log(`   ❌ ${view} (未创建)`);
      }
    }

    console.log('\n✅ 检查完成');
    
    if (missingTables.length > 0) {
      console.log(`\n⚠️  需要执行数据库迁移来创建 ${missingTables.length} 个缺失的表`);
      console.log('   执行命令: npx supabase db push');
    }

  } catch (error) {
    console.error('\n❌ 连接失败:', error.message);
    process.exit(1);
  }
}

checkConnection();
