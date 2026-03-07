/**
 * 检查最近上传的作品
 */

import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL;

async function checkLatestWorks() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 检查最近上传的作品\n');
    console.log('='.repeat(70));

    // 查询最近的作品（包括草稿）
    const result = await client.query(`
      SELECT id, title, thumbnail, created_at, status
      FROM works
      ORDER BY created_at DESC
      LIMIT 5
    `);

    console.log(`\n📊 最近 ${result.rows.length} 个作品:\n`);

    result.rows.forEach((work, index) => {
      console.log(`${index + 1}. ${work.title || '无标题'}`);
      console.log(`   ID: ${work.id}`);
      console.log(`   状态: ${work.status}`);
      console.log(`   缩略图: ${work.thumbnail || 'NULL'}`);
      
      if (work.thumbnail) {
        if (work.thumbnail.includes('myqcloud.com')) {
          console.log(`   ✅ COS URL`);
        } else if (work.thumbnail.startsWith('http')) {
          console.log(`   ℹ️  其他URL: ${work.thumbnail.substring(0, 50)}`);
        } else {
          console.log(`   ❓ 未知格式`);
        }
      } else {
        console.log(`   ⚠️  无缩略图`);
      }
      console.log('');
    });

    // 检查是否有 COS URL 的作品
    const cosResult = await client.query(`
      SELECT COUNT(*) as count
      FROM works
      WHERE thumbnail LIKE '%myqcloud.com%'
    `);

    console.log(`\n📈 统计:`);
    console.log(`  使用 COS 图片的作品: ${cosResult.rows[0].count}`);

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await client.end();
  }
}

checkLatestWorks();
