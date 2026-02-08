// 检查 posts 表数据详情
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
console.log('检查 Posts 表数据详情');
console.log('========================================\n');

async function checkPostsData() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    try {
      // 查询所有 posts 数据
      const result = await client.query('SELECT * FROM posts');
      
      console.log(`📊 共有 ${result.rows.length} 条帖子\n`);
      
      result.rows.forEach((post, index) => {
        console.log(`[${index + 1}] ${post.title}`);
        console.log('  ID:', post.id);
        console.log('  user_id:', post.user_id);
        console.log('  author_id:', post.author_id);
        console.log('  images:', post.images);
        console.log('  created_at:', post.created_at, `(日期: ${new Date(post.created_at * 1000).toLocaleDateString('zh-CN')})`);
        console.log('  likes_count:', post.likes_count);
        console.log('  views:', post.views);
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

checkPostsData();
