// 检查游戏相关数据库表
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// 加载环境变量
const envLocal = readFileSync('.env.local', 'utf-8');
const envConfig = {};
envLocal.split('\n').forEach(line => {
  const match = line.match(/^([^#=]+)=(.*)$/);
  if (match) {
    envConfig[match[1].trim()] = match[2].trim();
  }
});

const SUPABASE_URL = envConfig.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = envConfig.SUPABASE_SERVICE_ROLE_KEY;

console.log('========================================');
console.log('检查游戏相关数据库表');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkTables() {
  // 检查可能的游戏相关表
  const tablesToCheck = [
    'game_scores',
    'game_records',
    'user_games',
    'game_leaderboard',
    'user_achievements',
    'game_stats',
    'user_scores',
    'cultural_game_scores',
    'cultural_quiz_scores'
  ];

  console.log('📋 检查游戏相关表是否存在:\n');
  
  for (const table of tablesToCheck) {
    try {
      const { error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true });
      
      if (error) {
        if (error.code === '42P01') {
          console.log(`   ❌ ${table}: 表不存在`);
        } else {
          console.log(`   ⚠️  ${table}: ${error.message}`);
        }
      } else {
        console.log(`   ✅ ${table}: 表存在`);
      }
    } catch (e) {
      console.log(`   ❌ ${table}: 检查失败`);
    }
  }

  // 检查 users 表中的用户数量
  console.log('\n📊 检查用户数据:\n');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, created_at')
      .limit(10);
    
    if (error) {
      console.log('   ❌ 查询用户失败:', error.message);
    } else {
      console.log(`   ✅ 用户表存在，共查询到 ${users.length} 个用户`);
      users.forEach((user, i) => {
        console.log(`      ${i+1}. ${user.username || '未命名'} (${user.id.substring(0, 8)}...)`);
      });
    }
  } catch (e) {
    console.log('   ❌ 检查用户表失败:', e.message);
  }

  console.log('\n========================================');
  console.log('建议：');
  console.log('1. 如果没有游戏积分表，需要创建 game_scores 表');
  console.log('2. 使用 users 表中的真实用户作为排行榜数据');
  console.log('========================================');
}

checkTables();
