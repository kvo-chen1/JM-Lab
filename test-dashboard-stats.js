import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kizgwtrrsmkjeiddotup.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpemd3dHJyc21ramVpZGRvdHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxOTI2NSwiZXhwIjoyMDg4Mzk1MjY1fQ.Joc5d8ORWUfijvns7szuBONRkoIJubd6_B30fIM8HB0';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function testDashboardStats() {
  const merchantId = 'e381c73e-c219-412b-9693-8cf65b51ce4a';
  
  console.log('Testing getDashboardStats for merchant:', merchantId);
  console.log('═══════════════════════════════════════\n');

  // 1. 测试 RPC 函数
  console.log('1. Testing RPC function...');
  try {
    const { data, error } = await supabaseAdmin
      .rpc('get_merchant_dashboard_stats', { merchant_id: merchantId });
    
    console.log('   RPC result:', { data, error });
    
    if (error) {
      console.log('   RPC failed:', error.message);
    } else {
      console.log('   RPC success!');
    }
  } catch (err) {
    console.log('   RPC exception:', err.message);
  }

  // 2. 测试直接查询 merchants 表
  console.log('\n2. Testing direct query to merchants table...');
  const { data: merchantData, error: merchantError } = await supabaseAdmin
    .from('merchants')
    .select('total_sales, total_orders')
    .eq('id', merchantId)
    .maybeSingle();
  
  console.log('   Merchant data:', { merchantData, merchantError });

  // 3. 测试查询 orders 表
  console.log('\n3. Testing orders query...');
  const today = new Date().toISOString().split('T')[0];
  const { data: todayOrders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('total_amount, status')
    .eq('seller_id', merchantId)
    .gte('created_at', today)
    .lte('created_at', today + 'T23:59:59');
  
  console.log('   Today orders:', { count: todayOrders?.length || 0, ordersError });

  console.log('\n═══════════════════════════════════════');
}

testDashboardStats();
