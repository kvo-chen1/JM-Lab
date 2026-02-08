/**
 * 数据库诊断脚本
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function diagnose() {
  console.log('🔍 数据库诊断...\n');

  // 1. 检查表是否存在
  console.log('1️⃣ 检查 user_points_balance 表...');
  try {
    const { data, error } = await supabase
      .from('user_points_balance')
      .select('count', { count: 'exact', head: true });
    
    if (error) {
      console.log('   ❌ 表访问错误:', error.message);
      console.log('   💡 可能原因: 表不存在或权限不足');
    } else {
      console.log('   ✅ 表存在，可以访问');
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 2. 尝试直接查询表
  console.log('\n2️⃣ 尝试直接查询...');
  try {
    const { data, error } = await supabase
      .from('user_points_balance')
      .select('*')
      .limit(1);
    
    if (error) {
      console.log('   ❌ 查询错误:', error.message);
    } else {
      console.log('   ✅ 查询成功');
      if (data && data.length > 0) {
        console.log('   📊 数据:', JSON.stringify(data[0], null, 2));
      } else {
        console.log('   📊 表为空');
      }
    }
  } catch (e) {
    console.log('   ❌ 异常:', e.message);
  }

  // 3. 检查函数是否存在
  console.log('\n3️⃣ 检查函数是否存在...');
  const functions = [
    'update_user_points_balance',
    'get_user_points_stats',
    'check_points_limit',
    'set_updated_at',
    'initialize_user_points_balance'
  ];

  for (const funcName of functions) {
    try {
      // 尝试获取函数信息
      const { data, error } = await supabase
        .rpc('get_function_info', { func_name: funcName });
      
      if (error) {
        if (error.message.includes('Could not find the function')) {
          console.log(`   ❌ ${funcName} - 不存在`);
        } else {
          console.log(`   ⚠️  ${funcName} - 检查失败:`, error.message);
        }
      } else {
        console.log(`   ✅ ${funcName} - 存在`);
      }
    } catch (e) {
      console.log(`   ❓ ${funcName} - 无法检查`);
    }
  }

  // 4. 检查所有表
  console.log('\n4️⃣ 检查所有积分相关表...');
  const tables = [
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

  for (const table of tables) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        console.log(`   ❌ ${table} - ${error.message}`);
      } else {
        console.log(`   ✅ ${table}`);
      }
    } catch (e) {
      console.log(`   ❌ ${table} - 异常`);
    }
  }

  console.log('\n✅ 诊断完成');
}

diagnose();
