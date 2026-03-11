/**
 * 分析真实用户数据，用于生成图表
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

async function analyzeData() {
  console.log('🔍 分析真实用户数据...\n');

  // 1. 检查 user_behavior_logs 表（用户行为日志）
  console.log('1. 用户行为日志 (user_behavior_logs):');
  const { data: behaviorLogs, error: behaviorError } = await supabase
    .from('user_behavior_logs')
    .select('*')
    .limit(5);
  
  if (behaviorError) {
    console.log('   表不存在或无法访问:', behaviorError.message);
  } else {
    console.log(`   样本数据: ${behaviorLogs.length} 条`);
    if (behaviorLogs.length > 0) {
      console.log('   字段:', Object.keys(behaviorLogs[0]).join(', '));
    }
  }

  const { count: behaviorCount } = await supabase
    .from('user_behavior_logs')
    .select('*', { count: 'exact', head: true });
  console.log(`   总记录数: ${behaviorCount || 0}`);

  // 2. 检查 user_history 表（用户历史记录）
  console.log('\n2. 用户历史记录 (user_history):');
  const { data: history, error: historyError } = await supabase
    .from('user_history')
    .select('*')
    .limit(5);
  
  if (historyError) {
    console.log('   表不存在或无法访问:', historyError.message);
  } else {
    console.log(`   样本数据: ${history.length} 条`);
    if (history.length > 0) {
      console.log('   字段:', Object.keys(history[0]).join(', '));
    }
  }

  const { count: historyCount } = await supabase
    .from('user_history')
    .select('*', { count: 'exact', head: true });
  console.log(`   总记录数: ${historyCount || 0}`);

  // 3. 检查 user_activities 表
  console.log('\n3. 用户活动 (user_activities):');
  const { data: activities, error: activitiesError } = await supabase
    .from('user_activities')
    .select('*')
    .limit(5);
  
  if (activitiesError) {
    console.log('   表不存在或无法访问:', activitiesError.message);
  } else {
    console.log(`   样本数据: ${activities.length} 条`);
    if (activities.length > 0) {
      console.log('   字段:', Object.keys(activities[0]).join(', '));
    }
  }

  const { count: activitiesCount } = await supabase
    .from('user_activities')
    .select('*', { count: 'exact', head: true });
  console.log(`   总记录数: ${activitiesCount || 0}`);

  // 4. 检查现有的会员订单数据分布
  console.log('\n4. 会员订单数据分布:');
  const { data: orderStats } = await supabase
    .from('membership_orders')
    .select('status, amount')
    .eq('status', 'completed');
  
  if (orderStats) {
    const totalRevenue = orderStats.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0);
    console.log(`   已完成订单: ${orderStats.length} 条`);
    console.log(`   总营收: ¥${totalRevenue.toLocaleString()}`);
  }

  // 5. 检查用户登录记录
  console.log('\n5. 用户登录记录:');
  const { data: loginLogs, error: loginError } = await supabase
    .from('user_behavior_logs')
    .select('*')
    .eq('behavior_type', 'login')
    .limit(5);
  
  if (!loginError && loginLogs) {
    console.log(`   登录记录样本: ${loginLogs.length} 条`);
  }

  const { count: loginCount } = await supabase
    .from('user_behavior_logs')
    .select('*', { count: 'exact', head: true })
    .eq('behavior_type', 'login');
  console.log(`   登录记录总数: ${loginCount || 0}`);

  console.log('\n📊 总结:');
  console.log(`   - 用户行为日志: ${behaviorCount || 0} 条`);
  console.log(`   - 用户历史记录: ${historyCount || 0} 条`);
  console.log(`   - 用户活动: ${activitiesCount || 0} 条`);
  console.log(`   - 登录记录: ${loginCount || 0} 条`);
  console.log(`   - 已完成订单: ${orderStats?.length || 0} 条`);
}

analyzeData();
