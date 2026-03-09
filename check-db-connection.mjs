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

// 获取连接字符串（按优先级）
function getConnectionString() {
  const connStr = process.env.POSTGRES_URL_NON_POOLING || 
                  process.env.DATABASE_URL || 
                  process.env.POSTGRES_URL ||
                  process.env.NEON_DATABASE_URL;
  
  if (!connStr) {
    console.error('❌ 错误: 未找到数据库连接字符串');
    console.error('请确保 .env 文件中包含以下任一变量:');
    console.error('  - POSTGRES_URL_NON_POOLING');
    console.error('  - DATABASE_URL');
    console.error('  - POSTGRES_URL');
    console.error('  - NEON_DATABASE_URL');
    return null;
  }
  
  return connStr;
}

// 解析连接字符串（隐藏密码）
function maskConnectionString(connStr) {
  try {
    const url = new URL(connStr);
    return `${url.protocol}//${url.username}:****@${url.hostname}:${url.port}${url.pathname}`;
  } catch {
    return '无法解析连接字符串';
  }
}

// 测试数据库连接
async function testConnection() {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    process.exit(1);
  }
  
  console.log('=================================');
  console.log('  数据库连接检查');
  console.log('=================================\n');
  
  console.log('📋 连接配置:');
  console.log(`   连接字符串: ${maskConnectionString(connectionString)}`);
  console.log(`   数据库类型: PostgreSQL (Neon)`);
  console.log('');
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
    },
    max: 5,
    min: 1,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 30000
  });
  
  try {
    console.log('🔄 正在连接数据库...');
    const client = await pool.connect();
    console.log('✅ 数据库连接成功!\n');
    
    // 测试基本查询
    console.log('🔄 执行测试查询 (SELECT 1)...');
    const result = await client.query('SELECT 1 as test');
    console.log('✅ 查询执行成功!');
    console.log(`   结果: ${JSON.stringify(result.rows[0])}\n`);
    
    // 获取数据库版本
    console.log('🔄 获取数据库版本...');
    const versionResult = await client.query('SELECT version()');
    console.log(`✅ 数据库版本: ${versionResult.rows[0].version.split(' ')[0]} ${versionResult.rows[0].version.split(' ')[1]}\n`);
    
    // 获取当前数据库名
    console.log('🔄 获取当前数据库信息...');
    const dbResult = await client.query('SELECT current_database() as db, current_user as user');
    console.log(`✅ 当前数据库: ${dbResult.rows[0].db}`);
    console.log(`   当前用户: ${dbResult.rows[0].user}\n`);
    
    // 获取表列表
    console.log('🔄 获取表列表...');
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    if (tablesResult.rows.length > 0) {
      console.log(`✅ 找到 ${tablesResult.rows.length} 个表:`);
      tablesResult.rows.forEach((row, index) => {
        console.log(`   ${index + 1}. ${row.table_name}`);
      });
    } else {
      console.log('⚠️  数据库中没有表');
    }
    
    client.release();
    await pool.end();
    
    console.log('\n=================================');
    console.log('  ✅ 所有检查通过!');
    console.log('=================================');
    
    return true;
  } catch (error) {
    console.error('\n❌ 数据库连接失败!');
    console.error(`   错误信息: ${error.message}`);
    
    if (error.message.includes('password authentication failed')) {
      console.error('\n💡 可能的原因:');
      console.error('   - 密码错误或已过期');
      console.error('   - 数据库用户不存在');
    } else if (error.message.includes('connect ETIMEDOUT') || error.message.includes('Connection timed out')) {
      console.error('\n💡 可能的原因:');
      console.error('   - 网络连接问题');
      console.error('   - 数据库服务器不可达');
      console.error('   - 防火墙阻止连接');
    } else if (error.message.includes('database') && error.message.includes('does not exist')) {
      console.error('\n💡 可能的原因:');
      console.error('   - 数据库不存在');
      console.error('   - 连接字符串中的数据库名称错误');
    }
    
    await pool.end();
    
    console.log('\n=================================');
    console.log('  ❌ 连接检查失败!');
    console.log('=================================');
    
    return false;
  }
}

testConnection().then(success => {
  process.exit(success ? 0 : 1);
});
