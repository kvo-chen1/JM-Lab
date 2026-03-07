/**
 * 检查 user_uploads 表中的上传作品
 */

import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL;

async function checkUserUploads() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 检查 user_uploads 表\n');
    console.log('='.repeat(70));

    // 查询最近的上传作品
    const result = await client.query(`
      SELECT id, user_id, file_url, thumbnail_url, title, created_at
      FROM user_uploads
      ORDER BY created_at DESC
      LIMIT 10
    `);

    console.log(`\n📊 最近 ${result.rows.length} 个上传作品:\n`);

    result.rows.forEach((upload, index) => {
      console.log(`${index + 1}. ${upload.title || '无标题'}`);
      console.log(`   ID: ${upload.id}`);
      console.log(`   用户ID: ${upload.user_id}`);
      console.log(`   file_url: ${upload.file_url || 'NULL'}`);
      console.log(`   thumbnail_url: ${upload.thumbnail_url || 'NULL'}`);
      
      if (upload.file_url) {
        if (upload.file_url.includes('myqcloud.com')) {
          console.log(`   ✅ COS URL`);
        } else if (upload.file_url.startsWith('http')) {
          console.log(`   ℹ️  其他URL`);
        } else {
          console.log(`   ❓ 未知格式`);
        }
      } else {
        console.log(`   ⚠️  无文件URL`);
      }
      console.log('');
    });

    // 统计
    const stats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE file_url LIKE '%myqcloud.com%') as cos_count,
        COUNT(*) FILTER (WHERE file_url IS NULL) as null_count,
        COUNT(*) as total
      FROM user_uploads
    `);

    console.log(`\n📈 统计:`);
    console.log(`  总计上传: ${stats.rows[0].total}`);
    console.log(`  COS 图片: ${stats.rows[0].cos_count}`);
    console.log(`  无URL: ${stats.rows[0].null_count}`);

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await client.end();
  }
}

checkUserUploads();
