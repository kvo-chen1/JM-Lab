// 添加 author_id 字段到 posts 表
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
console.log('添加 author_id 字段到 posts 表');
console.log('========================================\n');

async function addAuthorIdColumn() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    try {
      // 检查 author_id 字段是否存在
      console.log('🔍 检查 author_id 字段...');
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'author_id'
      `);

      if (checkResult.rows.length > 0) {
        console.log('✅ author_id 字段已存在\n');
      } else {
        console.log('⚠️ author_id 字段不存在，正在添加...\n');
        
        // 添加 author_id 字段
        await client.query(`
          ALTER TABLE posts 
          ADD COLUMN author_id UUID
        `);
        console.log('✅ author_id 字段添加成功');

        // 将 user_id 数据复制到 author_id
        await client.query(`
          UPDATE posts 
          SET author_id = user_id 
          WHERE author_id IS NULL
        `);
        console.log('✅ 已复制 user_id 数据到 author_id');
      }

      // 显示最终的表结构
      console.log('\n📋 posts 表结构:');
      const columnsResult = await client.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns 
        WHERE table_name = 'posts'
        ORDER BY ordinal_position
      `);
      
      columnsResult.rows.forEach(col => {
        console.log(`  ${col.column_name}: ${col.data_type}${col.column_default ? ' (default: ' + col.column_default + ')' : ''}`);
      });

      console.log('\n✅ 修复完成！');

    } finally {
      client.release();
    }

  } catch (error) {
    console.error('❌ 操作失败:', error.message);
    console.error(error.stack);
  } finally {
    await pool.end();
  }
}

addAuthorIdColumn();
