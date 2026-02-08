// 检查最新的 posts 数据
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
console.log('检查最新的 Posts 数据');
console.log('========================================\n');

async function checkLatestPosts() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    try {
      // 查询所有 posts，按创建时间倒序
      const result = await client.query('SELECT * FROM posts ORDER BY created_at DESC');
      
      console.log(`📊 共有 ${result.rows.length} 条帖子\n`);
      
      result.rows.forEach((post, index) => {
        console.log(`[${index + 1}] ${post.title}`);
        console.log('  ID:', post.id);
        console.log('  user_id:', post.user_id);
        console.log('  author_id:', post.author_id);
        console.log('  status:', post.status);
        console.log('  likes_count:', post.likes_count);
        console.log('  created_at:', post.created_at, `(日期: ${new Date(post.created_at * 1000).toLocaleDateString('zh-CN')})`);
        console.log('');
      });

      // 查询本周的数据
      console.log('\n📅 本周的数据（时间戳 >= ' + Math.floor(Date.now() / 1000 - 7 * 24 * 60 * 60) + '）:');
      const weekAgo = Math.floor(Date.now() / 1000 - 7 * 24 * 60 * 60);
      const weekResult = await client.query(
        'SELECT * FROM posts WHERE created_at >= $1 ORDER BY created_at DESC',
        [weekAgo]
      );
      console.log(`找到 ${weekResult.rows.length} 条本周的帖子`);
      weekResult.rows.forEach((post, index) => {
        console.log(`  [${index + 1}] ${post.title} - ${new Date(post.created_at * 1000).toLocaleDateString('zh-CN')}`);
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

checkLatestPosts();
