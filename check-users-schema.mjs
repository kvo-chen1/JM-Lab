// 检查 users 表结构
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
console.log('检查 Users 表结构');
console.log('========================================\n');

async function checkUsersSchema() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    try {
      // 显示 users 表的所有字段
      console.log('📋 users 表所有字段:');
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'users'
        ORDER BY ordinal_position
      `);
      
      columnsResult.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
      });

      // 检查是否有 likes_count, views, posts_count 字段
      const requiredFields = ['likes_count', 'views', 'posts_count'];
      console.log('\n🔍 检查排行榜所需字段:');
      
      for (const field of requiredFields) {
        const result = await client.query(`
          SELECT column_name 
          FROM information_schema.columns 
          WHERE table_name = 'users' AND column_name = $1
        `, [field]);
        
        if (result.rows.length > 0) {
          console.log(`  ✅ ${field} 字段存在`);
        } else {
          console.log(`  ❌ ${field} 字段不存在`);
        }
      }

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
  } finally {
    await pool.end();
  }
}

checkUsersSchema();
