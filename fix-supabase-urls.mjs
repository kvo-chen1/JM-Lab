/**
 * 修复 Supabase Storage URL - 由于 Supabase 已不可用，将 URL 设为 null 或使用占位图
 */

import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.POSTGRES_URL_NON_POOLING;

// 占位图 URL（使用 dicebear 生成头像，或使用默认占位图）
const PLACEHOLDER_AVATAR = 'https://api.dicebear.com/7.x/avataaars/svg?seed=default';
const PLACEHOLDER_IMAGE = '/uploads/placeholder.png';

async function fixSupabaseUrls() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔧 修复 Supabase Storage URL\n');
    console.log('='.repeat(60));

    // 1. 修复 works 表 - 将 Supabase URL 设为 null，让前端使用 fallback
    console.log('\n🔄 修复 works 表...');
    const worksResult = await client.query(`
      UPDATE works
      SET thumbnail = NULL
      WHERE thumbnail LIKE '%supabase.co/storage%'
      RETURNING id, title
    `);
    console.log(`   ✅ 已修复 ${worksResult.rows.length} 条记录`);
    if (worksResult.rows.length > 0) {
      console.log('   示例:');
      worksResult.rows.slice(0, 3).forEach(row => {
        console.log(`     - ${row.title}`);
      });
    }

    // 2. 修复 users 表 - 使用占位头像
    console.log('\n🔄 修复 users 表...');
    const usersResult = await client.query(`
      UPDATE users
      SET avatar_url = $1
      WHERE avatar_url LIKE '%supabase.co/storage%'
      RETURNING id, username
    `, [PLACEHOLDER_AVATAR]);
    console.log(`   ✅ 已修复 ${usersResult.rows.length} 条记录`);
    if (usersResult.rows.length > 0) {
      console.log('   示例:');
      usersResult.rows.forEach(row => {
        console.log(`     - ${row.username}`);
      });
    }

    // 3. 修复 brand_tasks 表
    console.log('\n🔄 修复 brand_tasks 表...');
    const brandTasksResult = await client.query(`
      UPDATE brand_tasks
      SET cover_image = NULL
      WHERE cover_image LIKE '%supabase.co/storage%'
      RETURNING id, title
    `);
    console.log(`   ✅ 已修复 ${brandTasksResult.rows.length} 条记录`);

    // 4. 检查是否还有其他表需要修复
    console.log('\n🔍 检查其他表...');
    const tablesToCheck = [
      { table: 'posts', column: 'attachments' },
      { table: 'messages', column: 'content' },
      { table: 'comments', column: 'content' },
      { table: 'events', column: 'cover_image' },
      { table: 'products', column: 'image_url' },
    ];

    for (const { table, column } of tablesToCheck) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count
          FROM ${table}
          WHERE ${column}::text LIKE '%supabase.co/storage%'
        `);
        if (result.rows[0].count > 0) {
          console.log(`   ${table}.${column}: ${result.rows[0].count} 条需要修复`);
          
          // 修复这些记录
          await client.query(`
            UPDATE ${table}
            SET ${column} = NULL
            WHERE ${column}::text LIKE '%supabase.co/storage%'
          `);
          console.log(`   ✅ ${table} 表已修复`);
        }
      } catch (e) {
        // 忽略不存在的表或字段
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('✅ 修复完成！');
    console.log('\n💡 说明:');
    console.log('   - works.thumbnail 设为 NULL，前端会显示占位图');
    console.log('   - users.avatar_url 使用默认头像');
    console.log('   - 新上传的图片将使用本地存储');

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

fixSupabaseUrls();
