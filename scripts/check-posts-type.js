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
    
    // 检查 posts 表结构
    console.log('📋 posts 表结构:');
    const postsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'posts' AND table_schema = 'public'
      ORDER BY ordinal_position
    `);
    
    for (const col of postsResult.rows) {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    }

    // 检查其他关键表的主键类型
    const tables = ['users', 'communities', 'posts', 'messages', 'comments'];
    console.log('\n📋 各表主键类型:');
    
    for (const table of tables) {
      const pkResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_name = $1 
          AND table_schema = 'public'
          AND column_name = 'id'
      `, [table]);
      
      if (pkResult.rows.length > 0) {
        console.log(`  - ${table}.id: ${pkResult.rows[0].data_type}`);
      }
    }

  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await client.end();
  }
}

check();
