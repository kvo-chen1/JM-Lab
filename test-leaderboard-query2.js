import pg from 'pg';
const { Pool } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env' });

const pool = new Pool({
  connectionString: process.env.NEON_DATABASE_URL || process.env.NEON_URL,
  ssl: { rejectUnauthorized: false },
  max: 10,
  min: 2,
  idleTimeoutMillis: 60000,
  connectionTimeoutMillis: 30000
});

async function testQuery() {
  console.log('Testing optimized leaderboard query...\n');
  
  const client = await pool.connect();
  console.log('Connected to database');
  
  try {
    // 测试简化查询 - 先获取积分记录
    console.log('\n--- Test 1: Simple points aggregation ---');
    let start = Date.now();
    const { rows: pointsRows } = await client.query(`
      SELECT user_id, SUM(points) as total_points
      FROM points_records
      GROUP BY user_id
      HAVING SUM(points) > 0
      ORDER BY total_points DESC
      LIMIT 10
    `);
    console.log(`Points query: ${Date.now() - start}ms, ${pointsRows.length} rows`);
    
    if (pointsRows.length === 0) {
      console.log('No points data found');
      return;
    }
    
    // 获取用户 ID 列表
    const userIds = pointsRows.map(r => r.user_id);
    console.log('User IDs:', userIds);
    
    // 获取用户信息
    console.log('\n--- Test 2: Get user info ---');
    start = Date.now();
    const { rows: userRows } = await client.query(`
      SELECT id, username, avatar_url
      FROM users
      WHERE id = ANY($1)
    `, [userIds]);
    console.log(`Users query: ${Date.now() - start}ms, ${userRows.length} rows`);
    
    // 获取成就统计
    console.log('\n--- Test 3: Get achievements count ---');
    start = Date.now();
    const { rows: achievementRows } = await client.query(`
      SELECT user_id, COUNT(DISTINCT achievement_id) as achievements_count
      FROM user_achievements
      WHERE user_id = ANY($1) AND is_unlocked = true
      GROUP BY user_id
    `, [userIds]);
    console.log(`Achievements query: ${Date.now() - start}ms, ${achievementRows.length} rows`);
    
    // 合并结果
    console.log('\n--- Merging results ---');
    const userMap = new Map(userRows.map(u => [u.id, u]));
    const achievementMap = new Map(achievementRows.map(a => [a.user_id, a.achievements_count]));
    
    const leaderboard = pointsRows.map((row, index) => ({
      rank: index + 1,
      userId: row.user_id,
      userName: userMap.get(row.user_id)?.username || '匿名用户',
      avatar: userMap.get(row.user_id)?.avatar_url || '',
      achievementsCount: parseInt(achievementMap.get(row.user_id)) || 0,
      totalPoints: parseInt(row.total_points) || 0
    }));
    
    console.log('\nFinal leaderboard:', JSON.stringify(leaderboard, null, 2));
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testQuery();
