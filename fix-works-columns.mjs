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

async function fixWorksColumns() {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    console.error('❌ 未找到数据库连接字符串');
    process.exit(1);
  }
  
  console.log('=================================');
  console.log('  修复 works 表缺失的列');
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
    // 获取当前 works 表的列
    const columnsResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'works'
      ORDER BY ordinal_position;
    `);
    
    const existingColumns = columnsResult.rows.map(r => r.column_name);
    console.log(`📋 当前 works 表有 ${existingColumns.length} 个列\n`);
    
    // 需要添加的列
    const columnsToAdd = [
      { name: 'hidden_in_square', type: 'BOOLEAN DEFAULT FALSE' },
      { name: 'favorites', type: 'INTEGER DEFAULT 0' },
      { name: 'shares', type: 'INTEGER DEFAULT 0' }
    ];
    
    for (const col of columnsToAdd) {
      if (!existingColumns.includes(col.name)) {
        console.log(`🔄 添加列: ${col.name} (${col.type})`);
        await pool.query(`
          ALTER TABLE works 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
        `);
        console.log(`✅ ${col.name} 添加成功\n`);
      } else {
        console.log(`✅ 列 ${col.name} 已存在，跳过\n`);
      }
    }
    
    // 验证修复
    console.log('🔄 验证修复:');
    const verifyResult = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'works'
      AND column_name IN ('hidden_in_square', 'favorites', 'shares')
      ORDER BY column_name;
    `);
    
    console.log(`✅ 已添加的列:`);
    verifyResult.rows.forEach(r => {
      console.log(`   - ${r.column_name}`);
    });
    
    // 测试查询
    console.log('\n🔄 测试 getWorks 查询:');
    const testResult = await pool.query(`
      SELECT 
        w.*, 
        u.username, 
        u.avatar_url,
        COALESCE((SELECT COUNT(*)::INTEGER FROM works_likes wl WHERE wl.work_id = w.id), 0) as likes
      FROM works w 
      LEFT JOIN users u ON w.creator_id = u.id 
      WHERE (w.source = '津脉广场' OR w.source IS NULL)
        AND LENGTH(COALESCE(w.title, '')) >= 3
        AND COALESCE(w.thumbnail, w.cover_url, '') <> ''
        AND COALESCE(w.thumbnail, w.cover_url, '') <> 'EMPTY'
        AND LOWER(COALESCE(w.thumbnail, w.cover_url, '')) NOT LIKE '%empty%'
        AND (w.hidden_in_square = FALSE OR w.hidden_in_square IS NULL)
      ORDER BY w.created_at DESC 
      LIMIT 3 OFFSET 0
    `);
    
    console.log(`✅ 查询成功，返回 ${testResult.rows.length} 条记录`);
    
    await pool.end();
    
    console.log('\n=================================');
    console.log('  ✅ 修复完成！');
    console.log('=================================');
    
  } catch (error) {
    console.error('\n❌ 修复失败!');
    console.error(`   错误信息: ${error.message}`);
    await pool.end();
    process.exit(1);
  }
}

fixWorksColumns();
