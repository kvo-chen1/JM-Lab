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
  
  console.log('=== 查询标题包含"作品"的作品 ===');
  const result = await client.query("SELECT id, title, thumbnail FROM works WHERE title LIKE '作品%'");
  console.log(`找到 ${result.rows.length} 个作品:`);
  result.rows.forEach(w => {
    const hasThumbnail = w.thumbnail ? '有图' : '无图';
    console.log(`  - ID: ${w.id}`);
    console.log(`    标题: "${w.title}"`);
    console.log(`    缩略图: ${hasThumbnail}`);
  });
  
  client.release();
  await pool.end();
}

check();
