// 检查当前数据库配置
import fs from 'fs';
import path from 'path';

// 加载环境变量
if (fs.existsSync('.env')) {
  const dotenv = await import('dotenv');
  dotenv.config();
}

console.log('=== 数据库配置检查 ===');
console.log('DB_TYPE:', process.env.DB_TYPE);
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('POSTGRES_URL:', process.env.POSTGRES_URL);
console.log('SUPABASE_URL:', process.env.SUPABASE_URL);

// 检查数据库模块
const databasePath = path.join(__dirname, 'server', 'database.mjs');
if (fs.existsSync(databasePath)) {
  console.log('\n=== 数据库模块信息 ===');
  console.log('数据库模块存在');
  
  // 读取数据库配置部分
  const databaseContent = fs.readFileSync(databasePath, 'utf8');
  
  // 提取数据库类型检测逻辑
  const detectDbTypeMatch = databaseContent.match(/const detectDbType = \(\) => \{[\s\S]*?\}/);
  if (detectDbTypeMatch) {
    console.log('数据库类型检测逻辑:');
    console.log(detectDbTypeMatch[0]);
  }
  
  // 提取当前数据库类型
  const currentDbTypeMatch = databaseContent.match(/const currentDbType = detectDbType\(\)/);
  if (currentDbTypeMatch) {
    console.log('\n当前数据库类型检测:');
    console.log(currentDbTypeMatch[0]);
  }
  
} else {
  console.log('数据库模块不存在');
}

// 测试数据库连接
console.log('\n=== 数据库连接测试 ===');
try {
  const database = require('./server/database.mjs');
  console.log('数据库模块加载成功');
  
  // 尝试获取数据库连接
  database.getDB().then(db => {
    console.log('数据库连接成功');
    console.log('数据库类型:', database.DB_TYPE.POSTGRESQL);
  }).catch(error => {
    console.log('数据库连接失败:', error.message);
  });
} catch (error) {
  console.log('数据库模块加载失败:', error.message);
}
