/**
 * 详细检查函数状态
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkFunctions() {
  console.log('🔍 详细检查 RPC 函数...\n');

  const functions = [
    {
      name: 'update_user_points_balance',
      params: {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_points: 10,
        p_type: 'earned',
        p_source: '测试',
        p_source_type: 'daily',
        p_description: '测试添加积分'
      }
    },
    {
      name: 'get_user_points_stats',
      params: {
        p_user_id: '00000000-0000-0000-0000-000000000000'
      }
    },
    {
      name: 'check_points_limit',
      params: {
        p_user_id: '00000000-0000-0000-0000-000000000000',
        p_source_type: 'daily',
        p_points: 5
      }
    }
  ];

  for (const func of functions) {
    console.log(`⏳ 测试函数: ${func.name}...`);
    try {
      const { data, error } = await supabase.rpc(func.name, func.params);
      
      if (error) {
        if (error.message.includes('Could not find the function')) {
          console.log(`   ❌ ${func.name} - 函数不存在`);
        } else if (error.message.includes('permission denied')) {
          console.log(`   ⚠️  ${func.name} - 权限问题: ${error.message}`);
        } else {
          console.log(`   ⚠️  ${func.name} - 其他错误: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${func.name} - 调用成功`);
        if (data) {
          console.log(`   📊 返回数据:`, JSON.stringify(data, null, 2).substring(0, 200));
        }
      }
    } catch (error) {
      console.error(`   ❌ ${func.name} - 异常:`, error.message);
    }
    console.log('');
  }

  console.log('✅ 检查完成');
}

checkFunctions();
