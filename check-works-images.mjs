/**
 * 检查作品的图片 URL
 */

import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL;

async function checkWorksImages() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 检查作品图片 URL\n');
    console.log('='.repeat(70));

    // 查询最近的作品
    const result = await client.query(`
      SELECT id, title, thumbnail, created_at
      FROM works
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`\n📊 最近 ${result.rows.length} 个作品:\n`);

    result.rows.forEach((work, index) => {
      console.log(`${index + 1}. ${work.title}`);
      console.log(`   ID: ${work.id}`);
      console.log(`   缩略图: ${work.thumbnail || 'NULL'}`);
      
      if (work.thumbnail) {
        if (work.thumbnail.includes('supabase.co')) {
          console.log(`   ⚠️  仍使用 Supabase URL`);
        } else if (work.thumbnail.includes('localhost')) {
          console.log(`   ℹ️  本地 URL`);
        } else if (work.thumbnail.includes('myqcloud.com')) {
          console.log(`   ✅ COS URL`);
        } else if (work.thumbnail.startsWith('/uploads/')) {
          console.log(`   ℹ️  相对路径`);
        } else {
          console.log(`   ❓ 未知类型`);
        }
      } else {
        console.log(`   ⚠️  无缩略图`);
      }
      console.log('');
    });

    // 统计各种类型的 URL
    console.log('\n📈 URL 类型统计:\n');
    
    const stats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE thumbnail IS NULL) as null_count,
        COUNT(*) FILTER (WHERE thumbnail LIKE '%supabase.co%') as supabase_count,
        COUNT(*) FILTER (WHERE thumbnail LIKE '%myqcloud.com%') as cos_count,
        COUNT(*) FILTER (WHERE thumbnail LIKE '/uploads/%') as local_count,
        COUNT(*) FILTER (WHERE thumbnail LIKE 'http://localhost%') as localhost_count,
        COUNT(*) as total
      FROM works
    `);

    console.log(`  总计作品: ${stats.rows[0].total}`);
    console.log(`  无缩略图: ${stats.rows[0].null_count}`);
    console.log(`  Supabase: ${stats.rows[0].supabase_count}`);
    console.log(`  腾讯云 COS: ${stats.rows[0].cos_count}`);
    console.log(`  本地路径: ${stats.rows[0].local_count}`);
    console.log(`  localhost: ${stats.rows[0].localhost_count}`);

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await client.end();
  }
}

checkWorksImages();
