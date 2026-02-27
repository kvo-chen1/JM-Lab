/**
 * 检查趋势数据 - 用户和作品的创建时间分布
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

async function checkTrendData() {
  console.log('=== 检查趋势数据 ===\n');

  // 1. 检查用户创建时间分布
  console.log('1. 用户创建时间分布:');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, created_at');

  if (userError) {
    console.error('查询用户失败:', userError);
  } else {
    console.log(`   总用户数: ${users?.length || 0}`);
    
    // 按日期分组
    const dateMap = new Map();
    users?.forEach(user => {
      const date = new Date(user.created_at);
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
    });
    
    console.log('   按日期分布:');
    dateMap.forEach((count, date) => {
      console.log(`     - ${date}: ${count}人`);
    });
  }

  // 2. 检查作品创建时间分布
  console.log('\n2. 作品创建时间分布:');
  const { data: works, error: workError } = await supabase
    .from('works')
    .select('id, created_at, views, likes');

  if (workError) {
    console.error('查询作品失败:', workError);
  } else {
    console.log(`   总作品数: ${works?.length || 0}`);
    
    // 按日期分组
    const dateMap = new Map();
    let totalViews = 0;
    let totalLikes = 0;
    
    works?.forEach(work => {
      const date = new Date(work.created_at);
      const dateStr = date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
      dateMap.set(dateStr, (dateMap.get(dateStr) || 0) + 1);
      totalViews += work.views || 0;
      totalLikes += work.likes || 0;
    });
    
    console.log('   按日期分布:');
    dateMap.forEach((count, date) => {
      console.log(`     - ${date}: ${count}个作品`);
    });
    console.log(`   总浏览量: ${totalViews}`);
    console.log(`   总点赞数: ${totalLikes}`);
  }

  // 3. 检查 user_activities 表
  console.log('\n3. user_activities 表:');
  const { data: activities, error: activityError } = await supabase
    .from('user_activities')
    .select('*');

  if (activityError) {
    console.log(`   表可能不存在或查询失败: ${activityError.message}`);
  } else {
    console.log(`   总活动记录: ${activities?.length || 0}`);
  }

  // 4. 检查 page_views 表
  console.log('\n4. page_views 表:');
  const { data: pageViews, error: pvError } = await supabase
    .from('page_views')
    .select('*');

  if (pvError) {
    console.log(`   表可能不存在或查询失败: ${pvError.message}`);
  } else {
    console.log(`   总页面浏览记录: ${pageViews?.length || 0}`);
  }
}

checkTrendData().catch(console.error);
