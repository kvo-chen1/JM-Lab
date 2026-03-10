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

async function fixWorksId() {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    console.error('❌ 未找到数据库连接字符串');
    process.exit(1);
  }
  
  console.log('=================================');
  console.log('  修复 works 表 id 列');
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
    // 检查 id 列的默认值
    const columnResult = await pool.query(`
      SELECT column_name, data_type, column_default, is_nullable
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'works' 
      AND column_name = 'id'
    `);
    
    if (columnResult.rows.length === 0) {
      console.error('❌ 未找到 id 列');
      await pool.end();
      process.exit(1);
    }
    
    const idColumn = columnResult.rows[0];
    console.log('📋 当前 id 列信息:');
    console.log(`   类型: ${idColumn.data_type}`);
    console.log(`   默认值: ${idColumn.column_default || '无'}`);
    console.log(`   可空: ${idColumn.is_nullable}\n`);
    
    // 如果 id 列没有默认值，添加 gen_random_uuid() 默认值
    if (!idColumn.column_default) {
      console.log('🔄 为 id 列添加默认值 gen_random_uuid()...');
      await pool.query(`
        ALTER TABLE works 
        ALTER COLUMN id SET DEFAULT gen_random_uuid()
      `);
      console.log('✅ 默认值添加成功\n');
    } else {
      console.log('✅ id 列已有默认值，跳过\n');
    }
    
    // 验证修复
    const verifyResult = await pool.query(`
      SELECT column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'works' 
      AND column_name = 'id'
    `);
    
    console.log(`📋 修复后默认值: ${verifyResult.rows[0].column_default}\n`);
    
    // 测试插入（不指定 id）
    console.log('🔄 测试插入（不指定 id）...');
    const testResult = await pool.query(`
      INSERT INTO works (title, description, creator_id, status, created_at, updated_at)
      VALUES ('测试作品', '测试描述', 'f3dedf79-5c5e-40fd-9513-d0fb0995d429', 'published', 0, 0)
      RETURNING id, title
    `);
    
    console.log(`✅ 测试插入成功！`);
    console.log(`   生成的 ID: ${testResult.rows[0].id}`);
    console.log(`   标题: ${testResult.rows[0].title}\n`);
    
    // 删除测试数据
    await pool.query(`
      DELETE FROM works WHERE title = '测试作品'
    `);
    console.log('✅ 测试数据已清理\n');
    
    await pool.end();
    
    console.log('=================================');
    console.log('  ✅ 修复完成！');
    console.log('=================================');
    
  } catch (error) {
    console.error('\n❌ 修复失败!');
    console.error(`   错误信息: ${error.message}`);
    await pool.end();
    process.exit(1);
  }
}

fixWorksId();
