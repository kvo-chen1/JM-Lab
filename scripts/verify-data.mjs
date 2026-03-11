import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const { Pool } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: resolve(__dirname, '../.env') });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function main() {
  const client = await pool.connect();
  
  console.log('📊 数据库统计:\n');
  
  const tables = [
    { name: 'users', label: '用户' },
    { name: 'works', label: '作品' },
    { name: 'membership_orders', label: '会员订单' },
    { name: 'user_sessions', label: '用户会话' },
    { name: 'user_history', label: '用户历史' },
    { name: 'likes', label: '点赞' },
    { name: 'comments', label: '评论' }
  ];
  
  for (const { name, label } of tables) {
    try {
      const { rows } = await client.query(`SELECT COUNT(*) as count FROM ${name}`);
      console.log(`  ${label}: ${rows[0].count}`);
    } catch (e) {
      console.log(`  ${label}: 查询失败 - ${e.message}`);
    }
  }
  
  console.log('\n📈 最近7天订单统计:');
  try {
    const { rows: orderStats } = await client.query(`
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as count,
        SUM(amount) as revenue
      FROM membership_orders 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
      LIMIT 7
    `);
    
    if (orderStats.length === 0) {
      console.log('  暂无数据');
    } else {
      orderStats.forEach(row => {
        console.log(`  ${row.date}: ${row.count} 单, ¥${row.revenue || 0}`);
      });
    }
  } catch (e) {
    console.log(`  查询失败: ${e.message}`);
  }
  
  console.log('\n📈 最近7天用户活动统计:');
  try {
    const { rows: activityStats } = await client.query(`
      SELECT 
        action_type,
        COUNT(*) as count
      FROM user_history 
      WHERE created_at >= NOW() - INTERVAL '7 days'
      GROUP BY action_type
      ORDER BY count DESC
    `);
    
    if (activityStats.length === 0) {
      console.log('  暂无数据');
    } else {
      activityStats.forEach(row => {
        console.log(`  ${row.action_type}: ${row.count}`);
      });
    }
  } catch (e) {
    console.log(`  查询失败: ${e.message}`);
  }
  
  client.release();
  await pool.end();
}

main().catch(console.error);
