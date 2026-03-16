import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kizgwtrrsmkjeiddotup.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtpemd3dHJyc21ramVpZGRvdHVwIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MjgxOTI2NSwiZXhwIjoyMDg4Mzk1MjY1fQ.Joc5d8ORWUfijvns7szuBONRkoIJubd6_B30fIM8HB0';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function checkTodayOrders() {
  const merchantId = 'e381c73e-c219-412b-9693-8cf65b51ce4a';
  
  // 获取今天的日期
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  
  console.log('📅 日期检查\n');
  console.log('═══════════════════════════════════════\n');
  console.log(`今天: ${today}`);
  console.log(`昨天: ${yesterday}\n`);

  // 1. 检查今日订单
  console.log('1. 今日订单');
  const { data: todayOrders, error: todayError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('seller_id', merchantId)
    .gte('created_at', today)
    .lte('created_at', today + 'T23:59:59');
  
  console.log(`   数量: ${todayOrders?.length || 0}`);
  if (todayOrders && todayOrders.length > 0) {
    todayOrders.forEach(o => console.log(`   - ${o.order_no}: ¥${o.total_amount}`));
  }

  // 2. 检查昨日订单
  console.log('\n2. 昨日订单');
  const { data: yesterdayOrders, error: yestError } = await supabaseAdmin
    .from('orders')
    .select('*')
    .eq('seller_id', merchantId)
    .gte('created_at', yesterday)
    .lte('created_at', yesterday + 'T23:59:59');
  
  console.log(`   数量: ${yesterdayOrders?.length || 0}`);
  if (yesterdayOrders && yesterdayOrders.length > 0) {
    yesterdayOrders.forEach(o => console.log(`   - ${o.order_no}: ¥${o.total_amount} (${o.created_at})`));
  }

  // 3. 所有订单
  console.log('\n3. 所有订单');
  const { data: allOrders } = await supabaseAdmin
    .from('orders')
    .select('order_no, total_amount, created_at')
    .eq('seller_id', merchantId)
    .order('created_at', { ascending: false });
  
  console.log(`   数量: ${allOrders?.length || 0}`);
  if (allOrders && allOrders.length > 0) {
    allOrders.forEach(o => {
      const date = o.created_at.split('T')[0];
      console.log(`   - ${o.order_no}: ¥${o.total_amount} (${date})`);
    });
  }

  console.log('\n═══════════════════════════════════════');
}

checkTodayOrders();
