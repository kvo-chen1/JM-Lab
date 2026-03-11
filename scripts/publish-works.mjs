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

async function publishWorks() {
  const client = await pool.connect();
  
  console.log('=== 将带缩略图的草稿作品发布为公开 ===\n');
  
  // 查找有缩略图的草稿作品
  const draftWorks = await client.query(`
    SELECT id, title, thumbnail 
    FROM works 
    WHERE status = 'draft' 
      AND thumbnail IS NOT NULL 
      AND thumbnail != ''
  `);
  
  console.log(`找到 ${draftWorks.rows.length} 个有缩略图的草稿作品\n`);
  
  if (draftWorks.rows.length === 0) {
    console.log('没有需要发布的作品');
    return;
  }
  
  // 显示这些作品
  draftWorks.rows.forEach(w => {
    console.log(`  - ID: ${w.id}`);
    console.log(`    标题: "${w.title}"`);
    console.log('');
  });
  
  // 更新为已发布状态
  const ids = draftWorks.rows.map(w => w.id);
  const result = await client.query(`
    UPDATE works 
    SET status = 'published', 
        visibility = 'public',
        updated_at = NOW()
    WHERE id = ANY($1)
    RETURNING id, title
  `, [ids]);
  
  console.log(`\n✓ 已成功发布 ${result.rows.length} 个作品:\n`);
  result.rows.forEach(w => {
    console.log(`  - "${w.title}"`);
  });
  
  client.release();
  await pool.end();
}

publishWorks().catch(err => {
  console.error('错误:', err);
  process.exit(1);
});
