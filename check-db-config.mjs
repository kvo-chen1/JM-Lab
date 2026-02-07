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
console.log('VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL);

// 检查数据库模块
const databasePath = path.join(process.cwd(), 'server', 'database.mjs');
if (fs.existsSync(databasePath)) {
  console.log('\n=== 数据库模块信息 ===');
  console.log('数据库模块存在');
  
  // 读取数据库配置部分
  const databaseContent = fs.readFileSync(databasePath, 'utf8');
  
  // 提取当前数据库类型
  const configMatch = databaseContent.match(/const config = \{[\s\S]*?dbType: [^,]+,[\s\S]*?\}/);
  if (configMatch) {
    console.log('数据库配置:');
    console.log(configMatch[0]);
  }
  
  // 提取数据库类型检测逻辑
  const detectMatch = databaseContent.match(/const detectDbType = \(\) => \{[\s\S]*?\}/);
  if (detectMatch) {
    console.log('\n数据库类型检测逻辑:');
    console.log(detectMatch[0]);
  }
  
} else {
  console.log('数据库模块不存在');
}

// 检查 Supabase 配置
const supabaseClientPath = path.join(process.cwd(), 'src', 'lib', 'supabaseClient.ts');
if (fs.existsSync(supabaseClientPath)) {
  console.log('\n=== Supabase 客户端配置 ===');
  console.log('Supabase 客户端配置存在');
  const supabaseContent = fs.readFileSync(supabaseClientPath, 'utf8');
  console.log('Supabase 配置内容:');
  console.log(supabaseContent);
} else {
  console.log('Supabase 客户端配置不存在');
}

// 检查环境变量文件
console.log('\n=== 环境变量文件检查 ===');
const envFiles = ['.env', '.env.local', '.env.development', '.env.production'];
envFiles.forEach(file => {
  if (fs.existsSync(file)) {
    console.log(`✓ ${file} 存在`);
    const content = fs.readFileSync(file, 'utf8');
    console.log(`${file} 内容:`);
    console.log(content);
  } else {
    console.log(`✗ ${file} 不存在`);
  }
});
