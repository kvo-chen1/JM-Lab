/**
 * 检查数据库中的真实数据
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkData() {
  console.log('🔍 检查数据库中的真实数据...\n');

  // 1. 检查 user_sessions 表
  console.log('1. 用户会话数据 (user_sessions):');
  const { data: sessions, error: sessionError } = await supabase
    .from('user_sessions')
    .select('*')
    .limit(5);
  
  if (sessionError) {
    console.error('   错误:', sessionError.message);
  } else {
    console.log(`   样本数据: ${sessions.length} 条`);
    if (sessions.length > 0) {
      console.log('   数据样例:', JSON.stringify(sessions[0], null, 2));
    }
  }

  const { count: sessionCount } = await supabase
    .from('user_sessions')
    .select('*', { count: 'exact', head: true });
  console.log(`   总记录数: ${sessionCount || 0}`);

  // 2. 检查 membership_orders 表
  console.log('\n2. 会员订单数据 (membership_orders):');
  const { data: orders, error: orderError } = await supabase
    .from('membership_orders')
    .select('*')
    .eq('status', 'completed')
    .limit(5);
  
  if (orderError) {
    console.error('   错误:', orderError.message);
  } else {
    console.log(`   已完成订单样本: ${orders.length} 条`);
    if (orders.length > 0) {
      console.log('   数据样例:', JSON.stringify(orders[0], null, 2));
    }
  }

  const { count: orderCount } = await supabase
    .from('membership_orders')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');
  console.log(`   已完成订单总数: ${orderCount || 0}`);

  // 3. 检查 users 表
  console.log('\n3. 用户数据 (users):');
  const { count: userCount } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });
  console.log(`   总用户数: ${userCount || 0}`);

  // 4. 分析数据时间分布
  console.log('\n4. 数据时间分布分析:');
  
  // 会话数据时间范围
  const { data: sessionRange } = await supabase
    .from('user_sessions')
    .select('created_at')
    .order('created_at', { ascending: true })
    .limit(1);
  
  const { data: sessionRangeEnd } = await supabase
    .from('user_sessions')
    .select('created_at')
    .order('created_at', { ascending: false })
    .limit(1);

  if (sessionRange?.[0] && sessionRangeEnd?.[0]) {
    console.log(`   会话数据时间范围: ${new Date(parseInt(sessionRange[0].created_at)).toLocaleString()} 至 ${new Date(parseInt(sessionRangeEnd[0].created_at)).toLocaleString()}`);
  }

  // 订单数据时间范围
  const { data: orderRange } = await supabase
    .from('membership_orders')
    .select('created_at')
    .eq('status', 'completed')
    .order('created_at', { ascending: true })
    .limit(1);
  
  const { data: orderRangeEnd } = await supabase
    .from('membership_orders')
    .select('created_at')
    .eq('status', 'completed')
    .order('created_at', { ascending: false })
    .limit(1);

  if (orderRange?.[0] && orderRangeEnd?.[0]) {
    console.log(`   订单数据时间范围: ${new Date(orderRange[0].created_at).toLocaleString()} 至 ${new Date(orderRangeEnd[0].created_at).toLocaleString()}`);
  }

  console.log('\n📊 总结:');
  console.log(`   - 用户会话: ${sessionCount || 0} 条`);
  console.log(`   - 已完成订单: ${orderCount || 0} 条`);
  console.log(`   - 用户总数: ${userCount || 0} 人`);
  
  if ((sessionCount || 0) === 0 && (orderCount || 0) === 0) {
    console.log('\n⚠️ 数据库中没有相关数据，需要导入测试数据');
  } else {
    console.log('\n✅ 数据库中已有数据，图表应该能正常显示');
    console.log('   如果图表仍不显示，可能是数据格式或查询逻辑问题');
  }
}

checkData();
