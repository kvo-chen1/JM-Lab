import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

// 获取连接字符串
function getConnectionString() {
  return process.env.POSTGRES_URL_NON_POOLING || 
         process.env.DATABASE_URL || 
         process.env.POSTGRES_URL ||
         process.env.NEON_DATABASE_URL;
}

async function checkImageUrls() {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    console.error('❌ 未找到数据库连接字符串');
    process.exit(1);
  }
  
  console.log('=================================');
  console.log('  检查图片URL');
  console.log('=================================\n');
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
    }
  });
  
  try {
    // 获取前10条记录的thumbnail和cover_url
    const result = await pool.query(`
      SELECT 
        w.id,
        w.title,
        w.thumbnail,
        w.cover_url,
        w.created_at
      FROM works w 
      WHERE (w.source = '津脉广场' OR w.source IS NULL)
        AND LENGTH(COALESCE(w.title, '')) >= 3
        AND COALESCE(w.thumbnail, w.cover_url, '') <> ''
        AND COALESCE(w.thumbnail, w.cover_url, '') <> 'EMPTY'
        AND LOWER(COALESCE(w.thumbnail, w.cover_url, '')) NOT LIKE '%empty%'
        AND (w.hidden_in_square = FALSE OR w.hidden_in_square IS NULL)
      ORDER BY w.created_at DESC 
      LIMIT 10 OFFSET 0
    `);
    
    console.log(`📊 找到 ${result.rows.length} 条记录\n`);
    
    for (const row of result.rows) {
      console.log('----------------------------------------');
      console.log(`📝 作品: ${row.title}`);
      console.log(`   ID: ${row.id}`);
      console.log(`   创建时间: ${row.created_at}`);
      
      // 检查 thumbnail
      if (row.thumbnail) {
        console.log(`\n   📷 thumbnail:`);
        console.log(`      长度: ${row.thumbnail.length}`);
        console.log(`      内容: ${row.thumbnail.substring(0, 100)}${row.thumbnail.length > 100 ? '...' : ''}`);
        
        // 检查URL类型
        if (row.thumbnail.startsWith('data:')) {
          console.log(`      类型: Base64 Data URL`);
        } else if (row.thumbnail.startsWith('http')) {
          console.log(`      类型: HTTP URL`);
          // 检查是否是腾讯COS
          if (row.thumbnail.includes('cos') || row.thumbnail.includes('myqcloud.com')) {
            console.log(`      ⚠️  腾讯COS URL`);
          }
          // 检查是否是Supabase
          if (row.thumbnail.includes('supabase.co')) {
            console.log(`      ⚠️  Supabase URL (可能已失效)`);
          }
        } else if (row.thumbnail.startsWith('/')) {
          console.log(`      类型: 相对路径`);
        } else {
          console.log(`      类型: 其他`);
        }
      } else {
        console.log(`\n   📷 thumbnail: (空)`);
      }
      
      // 检查 cover_url
      if (row.cover_url) {
        console.log(`\n   🖼️  cover_url:`);
        console.log(`      长度: ${row.cover_url.length}`);
        console.log(`      内容: ${row.cover_url.substring(0, 100)}${row.cover_url.length > 100 ? '...' : ''}`);
        
        // 检查URL类型
        if (row.cover_url.startsWith('data:')) {
          console.log(`      类型: Base64 Data URL`);
        } else if (row.cover_url.startsWith('http')) {
          console.log(`      类型: HTTP URL`);
          // 检查是否是腾讯COS
          if (row.cover_url.includes('cos') || row.cover_url.includes('myqcloud.com')) {
            console.log(`      ⚠️  腾讯COS URL`);
          }
          // 检查是否是Supabase
          if (row.cover_url.includes('supabase.co')) {
            console.log(`      ⚠️  Supabase URL (可能已失效)`);
          }
        } else if (row.cover_url.startsWith('/')) {
          console.log(`      类型: 相对路径`);
        } else {
          console.log(`      类型: 其他`);
        }
      } else {
        console.log(`\n   🖼️  cover_url: (空)`);
      }
      
      console.log('');
    }
    
    // 统计URL类型
    console.log('\n=================================');
    console.log('  URL类型统计');
    console.log('=================================\n');
    
    const statsResult = await pool.query(`
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN thumbnail LIKE 'data:%' OR cover_url LIKE 'data:%' THEN 1 END) as base64_count,
        COUNT(CASE WHEN thumbnail LIKE 'http%' OR cover_url LIKE 'http%' THEN 1 END) as http_count,
        COUNT(CASE WHEN (thumbnail LIKE '%supabase.co%' OR cover_url LIKE '%supabase.co%') THEN 1 END) as supabase_count,
        COUNT(CASE WHEN (thumbnail LIKE '%cos%' OR cover_url LIKE '%cos%' OR thumbnail LIKE '%myqcloud.com%' OR cover_url LIKE '%myqcloud.com%') THEN 1 END) as tencent_cos_count,
        COUNT(CASE WHEN (thumbnail LIKE '/uploads/%' OR cover_url LIKE '/uploads/%') THEN 1 END) as local_upload_count
      FROM works w 
      WHERE (w.source = '津脉广场' OR w.source IS NULL)
        AND LENGTH(COALESCE(w.title, '')) >= 3
        AND COALESCE(w.thumbnail, w.cover_url, '') <> ''
        AND COALESCE(w.thumbnail, w.cover_url, '') <> 'EMPTY'
        AND LOWER(COALESCE(w.thumbnail, w.cover_url, '')) NOT LIKE '%empty%'
        AND (w.hidden_in_square = FALSE OR w.hidden_in_square IS NULL)
    `);
    
    const stats = statsResult.rows[0];
    console.log(`总记录数: ${stats.total}`);
    console.log(`Base64 Data URL: ${stats.base64_count}`);
    console.log(`HTTP URL: ${stats.http_count}`);
    console.log(`  - Supabase URL: ${stats.supabase_count}`);
    console.log(`  - 腾讯COS URL: ${stats.tencent_cos_count}`);
    console.log(`本地上传路径: ${stats.local_upload_count}`);
    
    await pool.end();
    
    console.log('\n=================================');
    console.log('  ✅ 检查完成');
    console.log('=================================');
    
  } catch (error) {
    console.error('\n❌ 检查失败!');
    console.error(`   错误信息: ${error.message}`);
    console.error(`   错误堆栈:`, error.stack);
    await pool.end();
    process.exit(1);
  }
}

checkImageUrls();
