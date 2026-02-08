// 检查 users 表数据
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
console.log('检查 Users 表数据');
console.log('========================================\n');

async function checkUsersData() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    try {
      // 查询特定用户
      const result = await client.query(
        'SELECT id, username, avatar_url FROM users WHERE id = $1',
        ['a6f38aa1-7281-49f2-b565-2aa93ee89905']
      );
      
      if (result.rows.length > 0) {
        const user = result.rows[0];
        console.log('用户数据:');
        console.log('  ID:', user.id);
        console.log('  username:', user.username);
        console.log('  avatar_url:', user.avatar_url);
      } else {
        console.log('❌ 未找到用户');
      }

      // 查询所有用户
      console.log('\n\n所有用户:');
      const allUsers = await client.query('SELECT id, username FROM users');
      allUsers.rows.forEach((user, index) => {
        console.log(`[${index + 1}] ID: ${user.id}, username: ${user.username}`);
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

checkUsersData();
