import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kizgwtrrsmkjeiddotup.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpemd3dHJyc21ramVpZGRvdHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxOTI2NSwiZXhwIjoyMDg4Mzk1MjY1fQ.Joc5d8ORWUfijvns7szuBONRkoIJubd6_B30fIM8HB0';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  }
});

async function testConnection() {
  console.log('🧪 测试 Supabase Admin 连接\n');
  console.log('═══════════════════════════════════════\n');

  try {
    // 测试 1: 获取用户数量
    console.log('📊 测试 1: 获取用户数量');
    const { count: userCount, error: userError } = await supabaseAdmin
      .from('users')
      .select('*', { count: 'exact', head: true });
    
    if (userError) {
      console.log(`   ❌ 错误: ${userError.message}`);
    } else {
      console.log(`   ✅ 成功: ${userCount} 个用户`);
    }

    // 测试 2: 获取作品数量
    console.log('\n📊 测试 2: 获取作品数量');
    const { count: worksCount, error: worksError } = await supabaseAdmin
      .from('works')
      .select('*', { count: 'exact', head: true });
    
    if (worksError) {
      console.log(`   ❌ 错误: ${worksError.message}`);
    } else {
      console.log(`   ✅ 成功: ${worksCount} 个作品`);
    }

    // 测试 3: 获取推广订单数量
    console.log('\n📊 测试 3: 获取推广订单数量');
    const { count: ordersCount, error: ordersError } = await supabaseAdmin
      .from('promotion_orders')
      .select('*', { count: 'exact', head: true });
    
    if (ordersError) {
      console.log(`   ❌ 错误: ${ordersError.message}`);
    } else {
      console.log(`   ✅ 成功: ${ordersCount} 个订单`);
    }

    // 测试 4: 获取品牌任务数量
    console.log('\n📊 测试 4: 获取品牌任务数量');
    const { count: tasksCount, error: tasksError } = await supabaseAdmin
      .from('brand_tasks')
      .select('*', { count: 'exact', head: true });
    
    if (tasksError) {
      console.log(`   ❌ 错误: ${tasksError.message}`);
    } else {
      console.log(`   ✅ 成功: ${tasksCount} 个任务`);
    }

    console.log('\n═══════════════════════════════════════');
    console.log('✅ 测试完成');

  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
  }
}

testConnection();
