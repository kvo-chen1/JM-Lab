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
  console.log('Testing leaderboard query...\n');
  
  const client = await pool.connect();
  console.log('Connected to database');
  
  try {
    const start = Date.now();
    
    const { rows } = await client.query(`
      SELECT u.id, u.username, u.avatar_url,
             COALESCE(pr.total_points, 0) as total_points,
             COALESCE(ua.achievements_count, 0) as achievements_count
      FROM users u
      LEFT JOIN (
        SELECT user_id, SUM(points) as total_points
        FROM points_records
        GROUP BY user_id
        HAVING SUM(points) > 0
      ) pr ON u.id = pr.user_id
      LEFT JOIN (
        SELECT user_id, COUNT(DISTINCT achievement_id) as achievements_count
        FROM user_achievements
        WHERE is_unlocked = true
        GROUP BY user_id
      ) ua ON u.id = ua.user_id
      WHERE pr.total_points IS NOT NULL
      ORDER BY total_points DESC
      LIMIT 10
    `);
    
    const duration = Date.now() - start;
    console.log(`Query completed in ${duration}ms`);
    console.log(`Results: ${rows.length} rows`);
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    client.release();
    await pool.end();
  }
}

testQuery();
