import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

const envPath = path.resolve(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
} else {
  dotenv.config();
}

const dbUrl = process.env.DATABASE_URL;

async function fix() {
  let connectionString = dbUrl;
  try {
    const urlObj = new URL(dbUrl);
    urlObj.searchParams.delete('sslmode');
    connectionString = urlObj.toString();
  } catch (e) {}

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    
    console.log('🔧 检查并修复用户同步问题...\n');

    // 检查 users 表中的用户
    const usersResult = await client.query(`
      SELECT id, email, username FROM users LIMIT 10
    `);
    
    console.log('📋 users 表中的用户:');
    for (const user of usersResult.rows) {
      console.log(`  - ${user.id}: ${user.username} (${user.email})`);
    }

    // 检查 user_status 中无效的用户
    const invalidStatus = await client.query(`
      SELECT us.user_id 
      FROM user_status us
      LEFT JOIN users u ON us.user_id = u.id
      WHERE u.id IS NULL
    `);
    
    if (invalidStatus.rows.length > 0) {
      console.log(`\n⚠️  发现 ${invalidStatus.rows.length} 个无效的 user_status 记录，正在清理...`);
      for (const row of invalidStatus.rows) {
        await client.query(`DELETE FROM user_status WHERE user_id = $1`, [row.user_id]);
        console.log(`  - 已删除: ${row.user_id}`);
      }
    }

    console.log('\n✅ 修复完成！');
    
    // 提示使用默认验证码
    console.log('\n💡 提示：开发测试时可以使用默认验证码 123456 登录');

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

fix();
