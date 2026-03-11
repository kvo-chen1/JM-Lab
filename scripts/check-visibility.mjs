import pg from 'pg';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, '..', '.env') });

const { Pool } = pg;
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function check() {
  const client = await pool.connect();
  
  console.log('=== 查询所有作品的可见性状态 ===');
  const result = await client.query(`
    SELECT id, title, status, visibility, thumbnail 
    FROM works 
    ORDER BY created_at DESC
  `);
  
  console.log(`找到 ${result.rows.length} 个作品:\n`);
  
  result.rows.forEach(w => {
    console.log(`ID: ${w.id}`);
    console.log(`  标题: "${w.title}"`);
    console.log(`  状态: ${w.status}`);
    console.log(`  可见性: ${w.visibility}`);
    console.log(`  缩略图: ${w.thumbnail ? '有' : '无'}`);
    console.log('');
  });
  
  // 统计
  const published = result.rows.filter(w => w.status === 'published').length;
  const publicWorks = result.rows.filter(w => w.visibility === 'public').length;
  const withThumbnail = result.rows.filter(w => w.thumbnail).length;
  
  console.log('=== 统计 ===');
  console.log(`总作品数: ${result.rows.length}`);
  console.log(`已发布: ${published}`);
  console.log(`公开可见: ${publicWorks}`);
  console.log(`有缩略图: ${withThumbnail}`);
  
  client.release();
  await pool.end();
}

check();
