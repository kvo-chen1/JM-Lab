// 检查 posts 表的状态分布
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
console.log('检查 Posts 表状态分布');
console.log('========================================\n');

async function checkPostsStatus() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    try {
      // 查询所有 posts 的状态
      const result = await client.query('SELECT id, title, status, created_at FROM posts ORDER BY created_at DESC');
      
      console.log(`📊 共有 ${result.rows.length} 条帖子\n`);
      
      // 统计状态分布
      const statusCount = {};
      result.rows.forEach(post => {
        statusCount[post.status] = (statusCount[post.status] || 0) + 1;
      });
      
      console.log('状态分布:');
      Object.entries(statusCount).forEach(([status, count]) => {
        console.log(`  ${status}: ${count}`);
      });
      
      console.log('\n详细数据:');
      result.rows.forEach((post, index) => {
        console.log(`[${index + 1}] ${post.title}`);
        console.log('  ID:', post.id);
        console.log('  status:', post.status);
        console.log('  created_at:', new Date(post.created_at * 1000).toLocaleDateString('zh-CN'));
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

checkPostsStatus();
