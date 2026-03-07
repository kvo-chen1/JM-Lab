import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();
dotenv.config({ path: '.env.local', override: true });

const pool = new Pool({
  connectionString: process.env.POSTGRES_URL_NON_POOLING || process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  try {
    // 获取最新的作品
    const result = await pool.query(
      'SELECT id, title, thumbnail, cover_url, creator_id, created_at FROM works ORDER BY created_at DESC LIMIT 5'
    );
    
    console.log('最新的5个作品:');
    result.rows.forEach((row, i) => {
      console.log(`\n[${i + 1}] ${row.title}`);
      console.log('  ID:', row.id);
      console.log('  Thumbnail:', row.thumbnail);
      console.log('  Cover URL:', row.cover_url);
      console.log('  Creator:', row.creator_id);
      console.log('  Created:', new Date(row.created_at * 1000).toLocaleString());
    });
    
  } catch (err) {
    console.error('错误:', err.message);
  } finally {
    pool.end();
  }
}

check();
