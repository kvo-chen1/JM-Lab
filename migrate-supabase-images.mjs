/**
 * 迁移 Supabase Storage 图片到本地存储
 * 1. 从数据库中找出所有 Supabase Storage URL
 * 2. 下载这些图片到本地
 * 3. 更新数据库中的 URL
 */

import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import https from 'https';
import http from 'http';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.POSTGRES_URL_NON_POOLING;

// 本地存储路径
const UPLOADS_DIR = path.join(__dirname, 'public', 'uploads', 'migrated');

// 确保上传目录存在
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  console.log('✅ 创建迁移目录:', UPLOADS_DIR);
}

// 下载文件
async function downloadFile(url, destPath) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https:') ? https : http;
    
    const request = protocol.get(url, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // 重定向
        downloadFile(response.headers.location, destPath)
          .then(resolve)
          .catch(reject);
        return;
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`HTTP ${response.statusCode}`));
        return;
      }
      
      const file = fs.createWriteStream(destPath);
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        resolve();
      });
      
      file.on('error', (err) => {
        fs.unlink(destPath, () => {});
        reject(err);
      });
    });
    
    request.on('error', reject);
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('下载超时'));
    });
  });
}

// 生成本地 URL
function generateLocalUrl(filename) {
  return `/uploads/migrated/${filename}`;
}

// 生成安全文件名
function generateSafeFilename(originalUrl) {
  const urlObj = new URL(originalUrl);
  const pathname = urlObj.pathname;
  const ext = path.extname(pathname) || '.jpg';
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 10);
  return `${timestamp}-${random}${ext}`;
}

async function migrateImages() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ 已连接到数据库\n');

    // 1. 查找所有包含 Supabase Storage URL 的表和字段
    console.log('🔍 查找包含 Supabase Storage URL 的记录...\n');
    
    // 检查 works 表的 thumbnail 字段
    const worksResult = await client.query(`
      SELECT id, thumbnail, title
      FROM works
      WHERE thumbnail LIKE '%supabase.co/storage%'
    `);
    console.log(`📊 works 表: ${worksResult.rows.length} 条记录需要迁移`);

    // 检查 users 表的 avatar_url 字段
    const usersResult = await client.query(`
      SELECT id, avatar_url, username
      FROM users
      WHERE avatar_url LIKE '%supabase.co/storage%'
    `);
    console.log(`📊 users 表: ${usersResult.rows.length} 条记录需要迁移`);

    // 检查 cultural_knowledge 表的 image_url 字段
    const knowledgeResult = await client.query(`
      SELECT id, image_url, title
      FROM cultural_knowledge
      WHERE image_url LIKE '%supabase.co/storage%'
    `);
    console.log(`📊 cultural_knowledge 表: ${knowledgeResult.rows.length} 条记录需要迁移`);

    const totalRecords = worksResult.rows.length + usersResult.rows.length + knowledgeResult.rows.length;
    console.log(`\n📈 总计: ${totalRecords} 条记录需要迁移\n`);

    if (totalRecords === 0) {
      console.log('✅ 没有需要迁移的图片');
      return;
    }

    // 2. 迁移 works 表的图片
    console.log('🔄 开始迁移 works 表...');
    let successCount = 0;
    let failCount = 0;
    
    for (const row of worksResult.rows) {
      try {
        const filename = generateSafeFilename(row.thumbnail);
        const localPath = path.join(UPLOADS_DIR, filename);
        const localUrl = generateLocalUrl(filename);
        
        console.log(`  下载: ${row.thumbnail.substring(0, 60)}...`);
        await downloadFile(row.thumbnail, localPath);
        
        // 更新数据库
        await client.query(`
          UPDATE works SET thumbnail = $1 WHERE id = $2
        `, [localUrl, row.id]);
        
        console.log(`  ✅ 成功: ${localUrl}`);
        successCount++;
      } catch (error) {
        console.log(`  ❌ 失败: ${error.message}`);
        failCount++;
      }
    }
    console.log(`  works 表迁移完成: ${successCount} 成功, ${failCount} 失败\n`);

    // 3. 迁移 users 表的图片
    console.log('🔄 开始迁移 users 表...');
    successCount = 0;
    failCount = 0;
    
    for (const row of usersResult.rows) {
      try {
        const filename = generateSafeFilename(row.avatar_url);
        const localPath = path.join(UPLOADS_DIR, filename);
        const localUrl = generateLocalUrl(filename);
        
        console.log(`  下载: ${row.avatar_url.substring(0, 60)}...`);
        await downloadFile(row.avatar_url, localPath);
        
        // 更新数据库
        await client.query(`
          UPDATE users SET avatar_url = $1 WHERE id = $2
        `, [localUrl, row.id]);
        
        console.log(`  ✅ 成功: ${localUrl}`);
        successCount++;
      } catch (error) {
        console.log(`  ❌ 失败: ${error.message}`);
        failCount++;
      }
    }
    console.log(`  users 表迁移完成: ${successCount} 成功, ${failCount} 失败\n`);

    // 4. 迁移 cultural_knowledge 表的图片
    console.log('🔄 开始迁移 cultural_knowledge 表...');
    successCount = 0;
    failCount = 0;
    
    for (const row of knowledgeResult.rows) {
      try {
        const filename = generateSafeFilename(row.image_url);
        const localPath = path.join(UPLOADS_DIR, filename);
        const localUrl = generateLocalUrl(filename);
        
        console.log(`  下载: ${row.image_url.substring(0, 60)}...`);
        await downloadFile(row.image_url, localPath);
        
        // 更新数据库
        await client.query(`
          UPDATE cultural_knowledge SET image_url = $1 WHERE id = $2
        `, [localUrl, row.id]);
        
        console.log(`  ✅ 成功: ${localUrl}`);
        successCount++;
      } catch (error) {
        console.log(`  ❌ 失败: ${error.message}`);
        failCount++;
      }
    }
    console.log(`  cultural_knowledge 表迁移完成: ${successCount} 成功, ${failCount} 失败\n`);

    console.log('='.repeat(60));
    console.log('✅ 迁移完成！');
    console.log(`📁 迁移文件保存在: ${UPLOADS_DIR}`);

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// 运行迁移
migrateImages();
