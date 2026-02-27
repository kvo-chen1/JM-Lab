/**
 * 每日统计数据回填脚本
 * 基于现有用户和作品数据生成每日统计
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('错误: 缺少 Supabase 配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function backfillDailyStats() {
  console.log('=== 开始生成每日统计数据 ===\n');

  // 1. 获取所有用户
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, created_at');

  if (userError) {
    console.error('查询用户失败:', userError);
    return;
  }

  // 2. 获取所有作品
  const { data: works, error: workError } = await supabase
    .from('works')
    .select('id, created_at, views, likes');

  if (workError) {
    console.error('查询作品失败:', workError);
    return;
  }

  console.log(`总用户数: ${users?.length || 0}`);
  console.log(`总作品数: ${works?.length || 0}`);

  // 3. 按日期统计
  const dailyStats = new Map();

  // 统计每日新用户
  users?.forEach(user => {
    const date = new Date(user.created_at);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyStats.has(dateStr)) {
      dailyStats.set(dateStr, { users: 0, works: 0, views: 0, likes: 0 });
    }
    dailyStats.get(dateStr).users += 1;
  });

  // 统计每日新作品、浏览量、点赞数
  works?.forEach(work => {
    const date = new Date(work.created_at);
    const dateStr = date.toISOString().split('T')[0]; // YYYY-MM-DD
    
    if (!dailyStats.has(dateStr)) {
      dailyStats.set(dateStr, { users: 0, works: 0, views: 0, likes: 0 });
    }
    const stats = dailyStats.get(dateStr);
    stats.works += 1;
    stats.views += work.views || 0;
    stats.likes += work.likes || 0;
  });

  // 4. 打印统计结果
  console.log('\n每日统计数据:');
  const sortedDates = Array.from(dailyStats.keys()).sort();
  sortedDates.forEach(date => {
    const stats = dailyStats.get(date);
    console.log(`  ${date}: 新用户${stats.users}人, 新作品${stats.works}个, 浏览量${stats.views}, 点赞数${stats.likes}`);
  });

  // 5. 生成最近30天的完整数据（包括没有数据的日期）
  console.log('\n=== 生成最近30天完整数据 ===');
  const today = new Date();
  const thirtyDaysAgo = new Date(today);
  thirtyDaysAgo.setDate(today.getDate() - 29);

  const completeStats = [];
  for (let i = 29; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const stats = dailyStats.get(dateStr) || { users: 0, works: 0, views: 0, likes: 0 };
    completeStats.push({
      date: dateStr,
      ...stats
    });
  }

  console.log('\n最近30天完整数据:');
  completeStats.forEach(stat => {
    console.log(`  ${stat.date}: 新用户${stat.users}人, 新作品${stat.works}个, 浏览量${stat.views}, 点赞数${stat.likes}`);
  });

  // 6. 计算累计值
  console.log('\n=== 计算累计值 ===');
  let cumulativeUsers = 0;
  let cumulativeWorks = 0;
  
  // 先计算今天之前的累计值
  const allDates = Array.from(dailyStats.keys()).sort();
  const datesBefore30Days = allDates.filter(d => d < thirtyDaysAgo.toISOString().split('T')[0]);
  datesBefore30Days.forEach(date => {
    const stats = dailyStats.get(date);
    cumulativeUsers += stats.users;
    cumulativeWorks += stats.works;
  });

  console.log(`30天前累计: 用户${cumulativeUsers}人, 作品${cumulativeWorks}个`);

  // 计算最近30天的累计值
  const statsWithCumulative = completeStats.map(stat => {
    cumulativeUsers += stat.users;
    cumulativeWorks += stat.works;
    return {
      ...stat,
      cumulativeUsers,
      cumulativeWorks
    };
  });

  console.log('\n最近30天数据（含累计）:');
  statsWithCumulative.forEach(stat => {
    console.log(`  ${stat.date}: 新用户${stat.users}, 新作品${stat.works}, 累计用户${stat.cumulativeUsers}, 累计作品${stat.cumulativeWorks}`);
  });

  console.log('\n=== 完成 ===');
  console.log('数据已经存在于 users 和 works 表中，不需要额外回填。');
  console.log('详细数据表格会自动从这两个表查询数据。');
}

backfillDailyStats().catch(console.error);
