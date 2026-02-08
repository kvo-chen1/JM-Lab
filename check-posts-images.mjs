// 检查 posts 表的图片数据
import pg from 'pg';
const { Pool } = pg;
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

const DATABASE_URL = envConfig.DATABASE_URL;

console.log('========================================');
console.log('检查 Posts 表的图片数据');
console.log('========================================\n');

async function checkPostsImages() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    try {
      // 查询所有 posts 的图片数据
      const result = await client.query('SELECT id, title, images FROM posts');
      
      console.log(`📊 共有 ${result.rows.length} 条帖子\n`);
      
      result.rows.forEach((post, index) => {
        console.log(`[${index + 1}] ${post.title}`);
        console.log('  ID:', post.id);
        console.log('  images:', post.images);
        console.log('  images 类型:', typeof post.images);
        if (post.images && Array.isArray(post.images)) {
          console.log('  images 长度:', post.images.length);
          console.log('  images[0]:', post.images[0]);
        }
        console.log('');
      });

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  } finally {
    await pool.end();
  }
}

checkPostsImages();
