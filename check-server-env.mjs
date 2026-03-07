/**
 * 检查服务器环境变量
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '.');

console.log('🔍 检查服务器环境变量加载\n');
console.log('='.repeat(70));

// 模拟 local-api.mjs 的加载逻辑
console.log('\n1️⃣ 加载 .env 文件...');
dotenv.config({ path: path.join(projectRoot, '.env') });

console.log('   ✅ .env 文件已加载');

console.log('\n2️⃣ 加载 .env.local 文件...');
const envLocalPath = path.join(projectRoot, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
  console.log('   ✅ .env.local 文件已加载');
} else {
  console.log('   ❌ .env.local 文件未找到');
}

// 检查关键环境变量
console.log('\n3️⃣ 检查关键环境变量:\n');

const varsToCheck = [
  'VITE_STORAGE_TYPE',
  'COS_SECRET_ID',
  'COS_SECRET_KEY',
  'COS_BUCKET',
  'COS_REGION',
  'COS_DOMAIN',
  'DATABASE_URL',
  'DB_TYPE'
];

varsToCheck.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    if (varName.includes('SECRET') || varName.includes('URL')) {
      console.log(`  ✅ ${varName}: ${value.substring(0, 20)}****`);
    } else {
      console.log(`  ✅ ${varName}: ${value}`);
    }
  } else {
    console.log(`  ❌ ${varName}: 未设置`);
  }
});

console.log('\n' + '='.repeat(70));
console.log('检查完成！');
