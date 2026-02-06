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

async function check() {
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
    
    console.log('📋 检查 users 表数据:');
    const usersResult = await client.query(`
      SELECT id, username, email 
      FROM users 
      LIMIT 10
    `);
    
    console.log(`找到 ${usersResult.rows.length} 个用户:`);
    for (const user of usersResult.rows) {
      console.log(`  - ${user.id}: ${user.username} (${user.email})`);
    }

    console.log('\n📋 检查 user_status 表数据:');
    const statusResult = await client.query(`
      SELECT user_id, status, last_seen 
      FROM user_status 
      LIMIT 10
    `);
    
    console.log(`找到 ${statusResult.rows.length} 个状态记录:`);
    for (const status of statusResult.rows) {
      console.log(`  - user_id: ${status.user_id}, status: ${status.status}`);
    }

    console.log('\n📋 检查外键约束:');
    const fkResult = await client.query(`
      SELECT 
        tc.constraint_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY' 
        AND tc.table_name = 'user_status'
    `);
    
    for (const fk of fkResult.rows) {
      console.log(`  - ${fk.column_name} -> ${fk.foreign_table_name}(${fk.foreign_column_name})`);
    }

    console.log('\n📋 检查 user_status 中无效的 user_id:');
    const invalidResult = await client.query(`
      SELECT us.user_id 
      FROM user_status us
      LEFT JOIN users u ON us.user_id = u.id
      WHERE u.id IS NULL
    `);
    
    if (invalidResult.rows.length > 0) {
      console.log(`发现 ${invalidResult.rows.length} 个无效的记录:`);
      for (const row of invalidResult.rows) {
        console.log(`  - ${row.user_id}`);
      }
    } else {
      console.log('没有发现无效的记录');
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

check();
