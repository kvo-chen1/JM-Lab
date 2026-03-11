/**
 * 测试周同比数据
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

async function testWeeklyData() {
  console.log('🔍 测试周同比数据查询...\n');

  const currentTime = new Date();
  const oneWeekAgo = new Date(currentTime);
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const twoWeeksAgo = new Date(currentTime);
  twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);

  const oneWeekAgoStr = oneWeekAgo.toISOString();
  const twoWeeksAgoStr = twoWeeksAgo.toISOString();

  console.log('时间范围:');
  console.log(`  本周: ${oneWeekAgoStr} 至现在`);
  console.log(`  上周: ${twoWeeksAgoStr} 至 ${oneWeekAgoStr}`);

  // 查询本周作品
  const { data: currentWeekWorks, error: worksError } = await supabase
    .from('works')
    .select('creator_id, created_at')
    .gte('created_at', oneWeekAgoStr);
  
  console.log(`\n本周作品: ${currentWeekWorks?.length || 0} 条`);
  if (worksError) console.error('错误:', worksError.message);

  // 查询上周作品
  const { data: lastWeekWorks } = await supabase
    .from('works')
    .select('creator_id')
    .gte('created_at', twoWeeksAgoStr)
    .lt('created_at', oneWeekAgoStr);
  
  console.log(`上周作品: ${lastWeekWorks?.length || 0} 条`);

  // 查询本周评论
  const { data: currentWeekComments } = await supabase
    .from('comments')
    .select('user_id')
    .gte('created_at', oneWeekAgoStr);
  
  console.log(`\n本周评论: ${currentWeekComments?.length || 0} 条`);

  // 查询上周评论
  const { data: lastWeekComments } = await supabase
    .from('comments')
    .select('user_id')
    .gte('created_at', twoWeeksAgoStr)
    .lt('created_at', oneWeekAgoStr);
  
  console.log(`上周评论: ${lastWeekComments?.length || 0} 条`);

  // 查询本周订单收入
  const { data: currentWeekRevenue } = await supabase
    .from('membership_orders')
    .select('amount')
    .eq('status', 'completed')
    .gte('created_at', oneWeekAgoStr);
  
  const currentRevenue = currentWeekRevenue?.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0) || 0;
  console.log(`\n本周收入: ¥${currentRevenue.toLocaleString()}`);

  // 查询上周订单收入
  const { data: lastWeekRevenue } = await supabase
    .from('membership_orders')
    .select('amount')
    .eq('status', 'completed')
    .gte('created_at', twoWeeksAgoStr)
    .lt('created_at', oneWeekAgoStr);
  
  const lastRevenue = lastWeekRevenue?.reduce((sum, o) => sum + (parseFloat(o.amount) || 0), 0) || 0;
  console.log(`上周收入: ¥${lastRevenue.toLocaleString()}`);

  // 计算活跃用户
  const currentActiveUsers = new Set([
    ...(currentWeekWorks?.map(w => w.creator_id) || []),
    ...(currentWeekComments?.map(c => c.user_id) || []),
  ]).size;

  const lastActiveUsers = new Set([
    ...(lastWeekWorks?.map(w => w.creator_id) || []),
    ...(lastWeekComments?.map(c => c.user_id) || []),
  ]).size;

  console.log(`\n本周活跃用户: ${currentActiveUsers} 人`);
  console.log(`上周活跃用户: ${lastActiveUsers} 人`);
}

testWeeklyData();
