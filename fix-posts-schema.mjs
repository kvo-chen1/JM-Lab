// 修复 posts 表结构 - 添加 likes_count 字段
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
console.log('修复 posts 表结构');
console.log('========================================\n');

async function fixPostsSchema() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔌 连接到数据库...\n');
    const client = await pool.connect();

    try {
      // 检查 likes_count 字段是否存在
      console.log('🔍 检查 likes_count 字段...');
      const checkResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'likes_count'
      `);

      if (checkResult.rows.length > 0) {
        console.log('✅ likes_count 字段已存在\n');
      } else {
        console.log('⚠️ likes_count 字段不存在，正在添加...\n');
        
        // 添加 likes_count 字段
        await client.query(`
          ALTER TABLE posts 
          ADD COLUMN likes_count INTEGER DEFAULT 0
        `);
        console.log('✅ likes_count 字段添加成功');

        // 复制现有的 likes 数据到 likes_count
        await client.query(`
          UPDATE posts 
          SET likes_count = COALESCE(likes, 0) 
          WHERE likes_count IS NULL OR likes_count = 0
        `);
        console.log('✅ 已复制现有 likes 数据到 likes_count');
      }

      // 检查 comments_count 字段
      console.log('\n🔍 检查 comments_count 字段...');
      const commentsCheckResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'posts' AND column_name = 'comments_count'
      `);

      if (commentsCheckResult.rows.length > 0) {
        console.log('✅ comments_count 字段已存在\n');
      } else {
        console.log('⚠️ comments_count 字段不存在，正在添加...\n');
        
        await client.query(`
          ALTER TABLE posts 
          ADD COLUMN comments_count INTEGER DEFAULT 0
        `);
        console.log('✅ comments_count 字段添加成功');
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

fixPostsSchema();
