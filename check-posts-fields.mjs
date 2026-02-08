// 检查 posts 表的完整字段
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
console.log('检查 Posts 表完整字段');
console.log('========================================\n');

async function checkPostsFields() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    try {
      // 显示 posts 表的所有字段
      console.log('📋 posts 表所有字段:');
      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns 
        WHERE table_name = 'posts'
        ORDER BY ordinal_position
      `);
      
      columnsResult.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? 'NOT NULL' : ''} ${col.column_default ? 'DEFAULT ' + col.column_default : ''}`);
      });

      // 查询一条完整数据
      console.log('\n📊 示例数据（所有字段）:');
      const dataResult = await client.query('SELECT * FROM posts LIMIT 1');
      
      if (dataResult.rows.length > 0) {
        const post = dataResult.rows[0];
        Object.keys(post).forEach(key => {
          console.log(`  ${key}: ${post[key]}`);
        });
      } else {
        console.log('  没有数据');
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

checkPostsFields();
