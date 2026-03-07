/**
 * 修复 COS URL 缺少 https:// 前缀的问题
 */

import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL;

async function fixCosUrls() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔧 修复 COS URL\n');
    console.log('='.repeat(70));

    // 1. 修复 user_uploads 表
    console.log('\n1️⃣ 修复 user_uploads 表...');
    
    // 查找缺少 https:// 的 COS URL
    const uploadsResult = await client.query(`
      SELECT id, file_url, thumbnail_url
      FROM user_uploads
      WHERE file_url LIKE 'jinmai-images-%.cos.%'
         OR thumbnail_url LIKE 'jinmai-images-%.cos.%'
    `);
    
    console.log(`   找到 ${uploadsResult.rows.length} 条需要修复的记录`);
    
    let fixedCount = 0;
    for (const row of uploadsResult.rows) {
      let fileUrl = row.file_url;
      let thumbnailUrl = row.thumbnail_url;
      let needsUpdate = false;
      
      // 修复 file_url
      if (fileUrl && fileUrl.startsWith('jinmai-images-')) {
        fileUrl = 'https://' + fileUrl;
        needsUpdate = true;
      }
      
      // 修复 thumbnail_url
      if (thumbnailUrl && thumbnailUrl.startsWith('jinmai-images-')) {
        thumbnailUrl = 'https://' + thumbnailUrl;
        needsUpdate = true;
      }
      
      if (needsUpdate) {
        await client.query(`
          UPDATE user_uploads
          SET file_url = $1, thumbnail_url = $2
          WHERE id = $3
        `, [fileUrl, thumbnailUrl, row.id]);
        fixedCount++;
      }
    }
    
    console.log(`   ✅ 已修复 ${fixedCount} 条记录`);

    // 2. 修复 works 表
    console.log('\n2️⃣ 修复 works 表...');
    
    const worksResult = await client.query(`
      SELECT id, thumbnail
      FROM works
      WHERE thumbnail LIKE 'jinmai-images-%.cos.%'
    `);
    
    console.log(`   找到 ${worksResult.rows.length} 条需要修复的记录`);
    
    fixedCount = 0;
    for (const row of worksResult.rows) {
      const thumbnailUrl = 'https://' + row.thumbnail;
      
      await client.query(`
        UPDATE works
        SET thumbnail = $1
        WHERE id = $2
      `, [thumbnailUrl, row.id]);
      fixedCount++;
    }
    
    console.log(`   ✅ 已修复 ${fixedCount} 条记录`);

    // 3. 验证修复结果
    console.log('\n3️⃣ 验证修复结果...');
    
    const verifyUploads = await client.query(`
      SELECT COUNT(*) as count
      FROM user_uploads
      WHERE file_url LIKE 'https://jinmai-images-%.cos.%'
    `);
    
    const verifyWorks = await client.query(`
      SELECT COUNT(*) as count
      FROM works
      WHERE thumbnail LIKE 'https://jinmai-images-%.cos.%'
    `);
    
    console.log(`   ✅ user_uploads 表: ${verifyUploads.rows[0].count} 条正确格式的 COS URL`);
    console.log(`   ✅ works 表: ${verifyWorks.rows[0].count} 条正确格式的 COS URL`);

    console.log('\n' + '='.repeat(70));
    console.log('✅ 修复完成！');

  } catch (error) {
    console.error('❌ 修复失败:', error.message);
  } finally {
    await client.end();
  }
}

fixCosUrls();
