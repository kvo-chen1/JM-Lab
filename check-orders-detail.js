import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kizgwtrrsmkjeiddotup.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpemd3dHJyc21ramVpZGRvdHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxOTI2NSwiZXhwIjoyMDg4Mzk1MjY1fQ.Joc5d8ORWUfijvns7szuBONRkoIJubd6_B30fIM8HB0';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkOrdersDetail() {
  const merchantId = 'e381c73e-c219-412b-9693-8cf65b51ce4a';
  
  console.log('📦 检查订单详情\n');
  console.log('═══════════════════════════════════════\n');

  // 1. 检查该商户的所有订单
  console.log('1. 该商户的所有订单');
  const { data: orders, error: ordersError } = await supabaseAdmin
    .from('orders')
    .select('id, order_no, total_amount, status, created_at')
    .eq('seller_id', merchantId)
    .order('created_at', { ascending: false });
  
  if (ordersError) {
    console.log(`   ❌ 错误: ${ordersError.message}`);
  } else {
    console.log(`   ✅ 订单数量: ${orders?.length || 0}`);
    if (orders && orders.length > 0) {
      console.log('\n   订单列表:');
      orders.forEach((order, index) => {
        console.log(`      ${index + 1}. 订单号: ${order.order_no}, 金额: ¥${order.total_amount}, 状态: ${order.status}, 时间: ${order.created_at}`);
      });
      
      // 计算总金额
      const totalAmount = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
      console.log(`\n   订单总金额: ¥${totalAmount.toLocaleString()}`);
    }
  }

  // 2. 检查商户表的累计数据
  console.log('\n2. 商户表中的累计数据');
  const { data: merchant, error: merchantError } = await supabaseAdmin
    .from('merchants')
    .select('total_sales, total_orders')
    .eq('id', merchantId)
    .maybeSingle();
  
  if (merchantError) {
    console.log(`   ❌ 错误: ${merchantError.message}`);
  } else {
    console.log(`   总销售额: ¥${merchant?.total_sales?.toLocaleString() || 0}`);
    console.log(`   总订单数: ${merchant?.total_orders || 0}`);
  }

  // 3. 对比
  console.log('\n3. 数据对比');
  if (orders && merchant) {
    const actualOrderCount = orders.length;
    const actualTotalAmount = orders.reduce((sum, o) => sum + Number(o.total_amount || 0), 0);
    
    console.log(`   实际订单数: ${actualOrderCount}`);
    console.log(`   商户表订单数: ${merchant.total_orders}`);
    console.log(`   差异: ${merchant.total_orders - actualOrderCount}`);
    console.log(`\n   实际订单金额: ¥${actualTotalAmount.toLocaleString()}`);
    console.log(`   商户表销售额: ¥${merchant.total_sales?.toLocaleString() || 0}`);
    console.log(`   差异: ¥${(merchant.total_sales - actualTotalAmount).toLocaleString()}`);
  }

  console.log('\n═══════════════════════════════════════');
}

checkOrdersDetail();
