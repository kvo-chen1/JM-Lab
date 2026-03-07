/**
 * 修复上传失败的占位图
 * 将 "Upload Fai" 的 base64 SVG 图片设为 NULL
 */

import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL;

async function fixUploadFailImages() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔧 修复上传失败的占位图\n');
    console.log('='.repeat(70));

    // 查找包含 "Upload Fai" 的 base64 SVG 图片
    const result = await client.query(`
      SELECT id, title, thumbnail
      FROM works
      WHERE thumbnail LIKE '%Upload Fai%'
         OR thumbnail LIKE 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCI%'
    `);

    console.log(`\n📊 找到 ${result.rows.length} 个带有 "Upload Fai" 占位图的作品\n`);

    if (result.rows.length === 0) {
      console.log('✅ 没有需要修复的作品');
      return;
    }

    // 显示这些作品
    result.rows.forEach((work, index) => {
      console.log(`${index + 1}. ${work.title}`);
      console.log(`   ID: ${work.id}`);
      console.log(`   缩略图: ${work.thumbnail.substring(0, 50)}...`);
    });

    // 修复这些作品 - 将失败的占位图设为 NULL
    console.log('\n🔄 开始修复...\n');
    
    const fixResult = await client.query(`
      UPDATE works
      SET thumbnail = NULL
      WHERE thumbnail LIKE '%Upload Fai%'
         OR thumbnail LIKE 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAwIiBoZWlnaHQ9IjQwMCI%'
      RETURNING id, title
    `);

    console.log(`✅ 已修复 ${fixResult.rows.length} 个作品:\n`);
    fixResult.rows.forEach((work, index) => {
      console.log(`  ${index + 1}. ${work.title}`);
    });

    // 统计修复后的情况
    console.log('\n📈 修复后统计:\n');
    
    const stats = await client.query(`
      SELECT 
        COUNT(*) FILTER (WHERE thumbnail IS NULL) as null_count,
        COUNT(*) FILTER (WHERE thumbnail LIKE '%Upload Fai%') as fail_count,
        COUNT(*) as total
      FROM works
    `);

    console.log(`  总计作品: ${stats.rows[0].total}`);
    console.log(`  无缩略图: ${stats.rows[0].null_count}`);
    console.log(`  失败占位图: ${stats.rows[0].fail_count}`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ 修复完成！');
    console.log('\n💡 说明:');
    console.log('   - 失败的占位图已设为 NULL');
    console.log('   - 前端会显示默认占位图');
    console.log('   - 新上传的图片将保存到腾讯云 COS');

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await client.end();
  }
}

fixUploadFailImages();
