/**
 * 检查当前用户的使用记录
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

async function checkMyActivity() {
  console.log('🔍 检查平台使用记录...\n');

  // 1. 获取所有用户
  const { data: users } = await supabase.from('users').select('id, username, email').limit(20);
  console.log(`平台用户数: ${users?.length || 0}`);
  if (users && users.length > 0) {
    console.log('\n用户列表:');
    users.forEach((u, i) => {
      console.log(`  ${i + 1}. ${u.username || u.email || u.id.substring(0, 8)}`);
    });
  }

  // 2. 检查 works 表（作品创建记录）
  console.log('\n📊 作品数据:');
  const { count: worksCount } = await supabase.from('works').select('*', { count: 'exact', head: true });
  console.log(`  总作品数: ${worksCount || 0}`);

  const { data: recentWorks } = await supabase
    .from('works')
    .select('created_at, creator_id')
    .order('created_at', { ascending: false })
    .limit(5);
  
  if (recentWorks && recentWorks.length > 0) {
    console.log('  最近作品创建时间:');
    recentWorks.forEach(w => {
      console.log(`    - ${new Date(w.created_at).toLocaleString()}`);
    });
  }

  // 3. 检查 comments 表（评论记录）
  console.log('\n💬 评论数据:');
  const { count: commentsCount } = await supabase.from('comments').select('*', { count: 'exact', head: true });
  console.log(`  总评论数: ${commentsCount || 0}`);

  // 4. 检查 likes 表（点赞记录）
  console.log('\n👍 点赞数据:');
  const { count: likesCount } = await supabase.from('likes').select('*', { count: 'exact', head: true });
  console.log(`  总点赞数: ${likesCount || 0}`);

  // 5. 检查 posts 表（社区帖子）
  console.log('\n📝 社区帖子:');
  const { count: postsCount } = await supabase.from('posts').select('*', { count: 'exact', head: true });
  console.log(`  总帖子数: ${postsCount || 0}`);

  // 6. 检查 follows 表（关注记录）
  console.log('\n👥 关注数据:');
  const { count: followsCount } = await supabase.from('follows').select('*', { count: 'exact', head: true });
  console.log(`  总关注数: ${followsCount || 0}`);

  // 7. 检查 generation_tasks 表（AI生成任务）
  console.log('\n🤖 AI生成任务:');
  const { count: tasksCount } = await supabase.from('generation_tasks').select('*', { count: 'exact', head: true });
  console.log(`  总任务数: ${tasksCount || 0}`);

  // 8. 分析用户活跃时间段
  console.log('\n⏰ 用户活跃时间分析:');
  const { data: worksByHour } = await supabase
    .from('works')
    .select('created_at')
    .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
  
  if (worksByHour && worksByHour.length > 0) {
    const hourCounts = {};
    worksByHour.forEach(w => {
      const hour = new Date(w.created_at).getHours();
      hourCounts[hour] = (hourCounts[hour] || 0) + 1;
    });
    
    console.log('  最近7天作品创建时间分布:');
    Object.entries(hourCounts)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .forEach(([hour, count]) => {
        console.log(`    ${hour}:00 - ${count} 个作品`);
      });
  }

  console.log('\n📈 总结:');
  console.log(`  这是一个 ${worksCount > 0 || postsCount > 0 ? '有真实使用数据' : '全新的'} 平台`);
  console.log(`  用户数: ${users?.length || 0}`);
  console.log(`  作品数: ${worksCount || 0}`);
  console.log(`  互动数: ${(commentsCount || 0) + (likesCount || 0) + (followsCount || 0)}`);
}

checkMyActivity();
