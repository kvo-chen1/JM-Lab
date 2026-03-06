/**
 * 检查数据库中 Supabase Storage 图片的数量
 */

import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config();

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.POSTGRES_URL_NON_POOLING;

async function checkSupabaseImages() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 检查数据库中的 Supabase Storage 图片\n');
    console.log('='.repeat(60));

    // 检查 works 表
    const worksResult = await client.query(`
      SELECT COUNT(*) as count
      FROM works
      WHERE thumbnail LIKE '%supabase.co/storage%'
    `);
    console.log(`\n📊 works 表:`);
    console.log(`   Supabase 图片: ${worksResult.rows[0].count} 条`);
    
    // 获取一些示例
    const worksSamples = await client.query(`
      SELECT id, thumbnail, title
      FROM works
      WHERE thumbnail LIKE '%supabase.co/storage%'
      LIMIT 3
    `);
    if (worksSamples.rows.length > 0) {
      console.log('   示例:');
      worksSamples.rows.forEach(row => {
        console.log(`     - ${row.title}: ${row.thumbnail.substring(0, 70)}...`);
      });
    }

    // 检查 users 表
    const usersResult = await client.query(`
      SELECT COUNT(*) as count
      FROM users
      WHERE avatar_url LIKE '%supabase.co/storage%'
    `);
    console.log(`\n📊 users 表:`);
    console.log(`   Supabase 图片: ${usersResult.rows[0].count} 条`);

    // 检查 cultural_knowledge 表
    const knowledgeResult = await client.query(`
      SELECT COUNT(*) as count
      FROM cultural_knowledge
      WHERE image_url LIKE '%supabase.co/storage%'
    `);
    console.log(`\n📊 cultural_knowledge 表:`);
    console.log(`   Supabase 图片: ${knowledgeResult.rows[0].count} 条`);

    // 检查其他可能的表
    const tablesToCheck = [
      { table: 'posts', column: 'attachments' },
      { table: 'messages', column: 'content' },
      { table: 'comments', column: 'content' },
      { table: 'brand_tasks', column: 'cover_image' },
      { table: 'events', column: 'cover_image' },
      { table: 'products', column: 'image_url' },
    ];

    console.log(`\n📋 其他表检查:`);
    for (const { table, column } of tablesToCheck) {
      try {
        const result = await client.query(`
          SELECT COUNT(*) as count
          FROM ${table}
          WHERE ${column}::text LIKE '%supabase.co/storage%'
        `);
        if (result.rows[0].count > 0) {
          console.log(`   ${table}.${column}: ${result.rows[0].count} 条`);
        }
      } catch (e) {
        // 忽略不存在的表或字段
      }
    }

    const totalCount = parseInt(worksResult.rows[0].count) + 
                       parseInt(usersResult.rows[0].count) + 
                       parseInt(knowledgeResult.rows[0].count);

    console.log('\n' + '='.repeat(60));
    console.log(`📈 总计: ${totalCount} 条记录需要迁移`);

    if (totalCount > 0) {
      console.log('\n💡 运行以下命令开始迁移:');
      console.log('   node migrate-supabase-images.mjs');
    } else {
      console.log('\n✅ 没有需要迁移的图片');
    }

  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkSupabaseImages();
