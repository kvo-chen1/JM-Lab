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

async function checkWorksTable() {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    console.error('❌ 未找到数据库连接字符串');
    process.exit(1);
  }
  
  console.log('=================================');
  console.log('  检查 works 表');
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
    // 检查 works 表是否存在
    const tableResult = await pool.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'works'
      );
    `);
    
    if (!tableResult.rows[0].exists) {
      console.error('❌ works 表不存在！');
      await pool.end();
      process.exit(1);
    }
    
    console.log('✅ works 表存在\n');
    
    // 获取表结构
    console.log('📋 works 表结构:');
    const columnsResult = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'works'
      ORDER BY ordinal_position;
    `);
    
    columnsResult.rows.forEach(col => {
      console.log(`   ${col.column_name}: ${col.data_type} ${col.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
    console.log('');
    
    // 检查数据量
    const countResult = await pool.query('SELECT COUNT(*) as count FROM works');
    console.log(`📊 works 表数据量: ${countResult.rows[0].count} 条记录\n`);
    
    // 尝试执行 getWorks 类似的查询
    console.log('🔄 测试查询 (类似 getWorks):');
    const testQuery = `
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
      LIMIT 5 OFFSET 0
    `;
    
    const testResult = await pool.query(testQuery);
    console.log(`✅ 查询成功，返回 ${testResult.rows.length} 条记录\n`);
    
    if (testResult.rows.length > 0) {
      console.log('📄 第一条记录示例:');
      const firstRow = testResult.rows[0];
      console.log(`   id: ${firstRow.id}`);
      console.log(`   title: ${firstRow.title}`);
      console.log(`   creator_id: ${firstRow.creator_id}`);
      console.log(`   username: ${firstRow.username}`);
      console.log(`   created_at: ${firstRow.created_at}`);
    }
    
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

checkWorksTable();
