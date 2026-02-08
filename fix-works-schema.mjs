// 修复 works 表结构 - 添加缺失的字段
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
console.log('修复 Works 表结构');
console.log('========================================\n');

async function fixWorksSchema() {
  const pool = new Pool({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    const client = await pool.connect();

    try {
      // 检查 likes_count 字段是否存在
      console.log('🔍 检查 likes_count 字段...');
      const likesResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'likes_count'
      `);

      if (likesResult.rows.length > 0) {
        console.log('✅ likes_count 字段已存在\n');
      } else {
        console.log('⚠️ likes_count 字段不存在，正在添加...\n');
        
        // 添加 likes_count 字段
        await client.query(`
          ALTER TABLE works 
          ADD COLUMN likes_count INTEGER DEFAULT 0
        `);
        console.log('✅ likes_count 字段添加成功');

        // 将现有的 likes 数据复制到 likes_count
        await client.query(`
          UPDATE works 
          SET likes_count = COALESCE(likes, 0) 
          WHERE likes_count IS NULL OR likes_count = 0
        `);
        console.log('✅ 已复制现有 likes 数据到 likes_count');
      }

      // 检查 comments_count 字段是否存在
      console.log('\n🔍 检查 comments_count 字段...');
      const commentsResult = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'works' AND column_name = 'comments_count'
      `);

      if (commentsResult.rows.length > 0) {
        console.log('✅ comments_count 字段已存在\n');
      } else {
        console.log('⚠️ comments_count 字段不存在，正在添加...\n');
        
        await client.query(`
          ALTER TABLE works 
          ADD COLUMN comments_count INTEGER DEFAULT 0
        `);
        console.log('✅ comments_count 字段添加成功');

        // 将现有的 comments 数据复制到 comments_count
        await client.query(`
          UPDATE works 
          SET comments_count = COALESCE(comments, 0) 
          WHERE comments_count IS NULL OR comments_count = 0
        `);
        console.log('✅ 已复制现有 comments 数据到 comments_count');
      }

      // 显示最终的表结构
      console.log('\n📋 works 表结构:');
      const columnsResult = await client.query(`
        SELECT column_name, data_type, column_default
        FROM information_schema.columns 
        WHERE table_name = 'works'
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

fixWorksSchema();
