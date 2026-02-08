// 检查 works 表的数据
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
console.log('检查 Works 表数据');
console.log('========================================\n');

async function checkWorksData() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    try {
      // 查询所有 works
      const result = await client.query('SELECT id, title, status, visibility, created_at FROM works ORDER BY created_at DESC');
      
      console.log(`📊 共有 ${result.rows.length} 条作品\n`);
      
      result.rows.forEach((work, index) => {
        console.log(`[${index + 1}] ${work.title}`);
        console.log('  ID:', work.id);
        console.log('  status:', work.status);
        console.log('  visibility:', work.visibility);
        console.log('  created_at:', new Date(work.created_at * 1000).toLocaleDateString('zh-CN'));
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

checkWorksData();
