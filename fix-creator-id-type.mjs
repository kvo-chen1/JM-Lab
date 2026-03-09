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

async function fixCreatorIdType() {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    console.error('❌ 未找到数据库连接字符串');
    process.exit(1);
  }
  
  console.log('=================================');
  console.log('  修复 creator_id 类型问题');
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
    // 检查 users 表的 id 类型
    const userIdResult = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'users' 
      AND column_name = 'id'
    `);
    
    console.log(`📋 users.id 类型: ${userIdResult.rows[0]?.data_type || '未找到'}\n`);
    
    // 检查 works 表的 creator_id 类型
    const creatorIdResult = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'works' 
      AND column_name = 'creator_id'
    `);
    
    console.log(`📋 works.creator_id 类型: ${creatorIdResult.rows[0]?.data_type || '未找到'}\n`);
    
    // 修改 works.creator_id 类型为 uuid
    console.log('🔄 修改 works.creator_id 类型为 uuid...');
    await pool.query(`
      ALTER TABLE works 
      ALTER COLUMN creator_id TYPE uuid 
      USING creator_id::uuid
    `);
    console.log('✅ 类型修改成功\n');
    
    // 验证修改
    const verifyResult = await pool.query(`
      SELECT data_type 
      FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'works' 
      AND column_name = 'creator_id'
    `);
    
    console.log(`📋 修改后 works.creator_id 类型: ${verifyResult.rows[0]?.data_type}\n`);
    
    // 测试 JOIN 查询
    console.log('🔄 测试 JOIN 查询:');
    const testResult = await pool.query(`
      SELECT 
        w.id, 
        w.title, 
        w.creator_id,
        u.username, 
        u.avatar_url
      FROM works w 
      LEFT JOIN users u ON w.creator_id = u.id 
      LIMIT 3
    `);
    
    console.log(`✅ JOIN 查询成功，返回 ${testResult.rows.length} 条记录\n`);
    
    if (testResult.rows.length > 0) {
      console.log('📄 示例记录:');
      testResult.rows.forEach((row, i) => {
        console.log(`   ${i + 1}. ${row.title} (by ${row.username || 'Unknown'})`);
      });
    }
    
    await pool.end();
    
    console.log('\n=================================');
    console.log('  ✅ 修复完成！');
    console.log('=================================');
    
  } catch (error) {
    console.error('\n❌ 修复失败!');
    console.error(`   错误信息: ${error.message}`);
    
    if (error.message.includes('invalid input syntax for type uuid')) {
      console.log('\n💡 提示: 某些 creator_id 值可能不是有效的 UUID 格式。');
      console.log('   需要清理或转换这些数据。');
    }
    
    await pool.end();
    process.exit(1);
  }
}

fixCreatorIdType();
