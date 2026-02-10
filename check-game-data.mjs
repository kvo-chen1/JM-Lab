// 检查游戏数据详情
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
console.log('检查游戏数据详情');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkGameData() {
  // 1. 检查 game_scores 表结构和数据
  console.log('📊 game_scores 表:\n');
  try {
    const { data: scores, error, count } = await supabase
      .from('game_scores')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
    } else {
      console.log(`   ✅ 共有 ${count || scores.length} 条记录`);
      if (scores && scores.length > 0) {
        console.log('   字段:', Object.keys(scores[0]).join(', '));
        console.log('   示例数据:');
        scores.forEach((s, i) => {
          console.log(`      ${i+1}. 用户:${s.user_id?.substring(0,8)}... 游戏:${s.game_type} 分数:${s.score}`);
        });
      } else {
        console.log('   ⚠️ 表中没有数据');
      }
    }
  } catch (e) {
    console.log('   ❌ 查询异常:', e.message);
  }

  // 2. 检查 game_records 表
  console.log('\n📊 game_records 表:\n');
  try {
    const { data: records, error, count } = await supabase
      .from('game_records')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
    } else {
      console.log(`   ✅ 共有 ${count || records.length} 条记录`);
      if (records && records.length > 0) {
        console.log('   字段:', Object.keys(records[0]).join(', '));
      } else {
        console.log('   ⚠️ 表中没有数据');
      }
    }
  } catch (e) {
    console.log('   ❌ 查询异常:', e.message);
  }

  // 3. 检查 user_games 表
  console.log('\n📊 user_games 表:\n');
  try {
    const { data: userGames, error, count } = await supabase
      .from('user_games')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
    } else {
      console.log(`   ✅ 共有 ${count || userGames.length} 条记录`);
      if (userGames && userGames.length > 0) {
        console.log('   字段:', Object.keys(userGames[0]).join(', '));
      } else {
        console.log('   ⚠️ 表中没有数据');
      }
    }
  } catch (e) {
    console.log('   ❌ 查询异常:', e.message);
  }

  // 4. 获取用户排行榜数据（基于 game_scores）
  console.log('\n🏆 用户排行榜（基于 game_scores）:\n');
  try {
    const { data: leaderboard, error } = await supabase
      .from('game_scores')
      .select(`
        user_id,
        score,
        users:user_id (username, avatar_url)
      `)
      .order('score', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
    } else if (leaderboard && leaderboard.length > 0) {
      console.log('   排行榜数据:');
      leaderboard.forEach((entry, i) => {
        const username = entry.users?.username || '未知用户';
        console.log(`      ${i+1}. ${username}: ${entry.score} 分`);
      });
    } else {
      console.log('   ⚠️ 没有排行榜数据');
    }
  } catch (e) {
    console.log('   ❌ 查询异常:', e.message);
  }

  // 5. 获取真实的用户数据作为备选
  console.log('\n👥 真实用户数据（备选）:\n');
  try {
    const { data: users, error } = await supabase
      .from('users')
      .select('id, username, avatar_url, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (error) {
      console.log('   ❌ 查询失败:', error.message);
    } else if (users && users.length > 0) {
      console.log(`   ✅ 共 ${users.length} 个用户`);
      users.forEach((user, i) => {
        console.log(`      ${i+1}. ${user.username || '未命名用户'} (${user.id.substring(0, 8)}...)`);
      });
    } else {
      console.log('   ⚠️ 没有用户数据');
    }
  } catch (e) {
    console.log('   ❌ 查询异常:', e.message);
  }

  console.log('\n========================================');
}

checkGameData();
