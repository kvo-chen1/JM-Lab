// 创建游戏积分表并插入真实数据
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
console.log('创建游戏积分表并插入真实数据');
console.log('========================================\n');

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupGameTables() {
  // 1. 创建 game_scores 表
  console.log('📊 创建 game_scores 表...\n');
  
  const createGameScoresSQL = `
    CREATE TABLE IF NOT EXISTS game_scores (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      game_type VARCHAR(50) NOT NULL,
      score INTEGER NOT NULL DEFAULT 0,
      play_time INTEGER, -- 游戏时长（秒）
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );
    
    -- 创建索引
    CREATE INDEX IF NOT EXISTS idx_game_scores_user_id ON game_scores(user_id);
    CREATE INDEX IF NOT EXISTS idx_game_scores_game_type ON game_scores(game_type);
    CREATE INDEX IF NOT EXISTS idx_game_scores_score ON game_scores(score DESC);
    
    -- 启用 RLS
    ALTER TABLE game_scores ENABLE ROW LEVEL SECURITY;
    
    -- 创建 RLS 策略
    CREATE POLICY "Users can view all scores" ON game_scores
      FOR SELECT USING (true);
    CREATE POLICY "Users can insert own scores" ON game_scores
      FOR INSERT WITH CHECK (auth.uid() = user_id);
  `;
  
  try {
    const { error } = await supabase.rpc('exec_sql', { sql: createGameScoresSQL });
    if (error) {
      console.log('   ⚠️ 使用 RPC 创建失败:', error.message);
      console.log('   💡 请在 Supabase Dashboard SQL Editor 中手动执行以下 SQL:');
      console.log(createGameScoresSQL);
    } else {
      console.log('   ✅ game_scores 表创建成功');
    }
  } catch (e) {
    console.log('   ⚠️ 创建表失败:', e.message);
  }

  // 2. 获取真实用户
  console.log('\n👥 获取真实用户...\n');
  const { data: users, error: userError } = await supabase
    .from('users')
    .select('id, username, avatar_url')
    .limit(10);
  
  if (userError || !users || users.length === 0) {
    console.log('   ❌ 获取用户失败:', userError?.message || '没有用户');
    return;
  }
  
  console.log(`   ✅ 获取到 ${users.length} 个用户`);

  // 3. 插入模拟的游戏积分数据（基于真实用户）
  console.log('\n🎮 插入游戏积分数据...\n');
  
  const gameTypes = ['cultural-quiz', 'cultural-memory', 'matching-game', 'puzzle-game'];
  const scoresData = [];
  
  // 为每个用户生成不同游戏的积分
  users.forEach((user, userIndex) => {
    gameTypes.forEach((gameType, gameIndex) => {
      // 生成不同的分数（让排行榜有差异）
      const baseScore = 1000 + (users.length - userIndex) * 500;
      const randomBonus = Math.floor(Math.random() * 500);
      const score = baseScore + randomBonus - (gameIndex * 200);
      
      scoresData.push({
        user_id: user.id,
        game_type: gameType,
        score: score,
        play_time: Math.floor(Math.random() * 600) + 60 // 1-10分钟
      });
    });
  });
  
  // 插入数据
  for (const scoreData of scoresData) {
    try {
      const { error } = await supabase
        .from('game_scores')
        .insert(scoreData);
      
      if (error) {
        if (error.code === '42P01') {
          console.log('   ❌ game_scores 表不存在，请先创建表');
          break;
        }
        console.log('   ⚠️ 插入失败:', error.message);
      }
    } catch (e) {
      console.log('   ⚠️ 插入异常:', e.message);
    }
  }
  
  console.log(`   ✅ 尝试插入 ${scoresData.length} 条积分记录`);

  // 4. 验证数据
  console.log('\n✅ 验证数据...\n');
  try {
    const { data: verifyData, error: verifyError } = await supabase
      .from('game_scores')
      .select(`
        user_id,
        game_type,
        score,
        users:user_id (username, avatar_url)
      `)
      .order('score', { ascending: false })
      .limit(10);
    
    if (verifyError) {
      console.log('   ❌ 验证失败:', verifyError.message);
    } else if (verifyData && verifyData.length > 0) {
      console.log(`   ✅ 成功插入 ${verifyData.length} 条记录`);
      console.log('   排行榜预览:');
      verifyData.forEach((entry, i) => {
        const username = entry.users?.username || '未知用户';
        console.log(`      ${i+1}. ${username} - ${entry.game_type}: ${entry.score}分`);
      });
    } else {
      console.log('   ⚠️ 表中没有数据（可能需要手动创建表）');
    }
  } catch (e) {
    console.log('   ❌ 验证异常:', e.message);
  }

  console.log('\n========================================');
  console.log('完成！如果表创建失败，请手动在 Supabase Dashboard 执行 SQL。');
  console.log('========================================');
}

setupGameTables();
