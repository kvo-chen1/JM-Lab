// 使用 Supabase Management API 执行 SQL
// 请访问 https://supabase.com/dashboard/project/pptqdicaaewtnaiflfcs/sql/new
// 复制粘贴 supabase/migrations/20260211000000_enhance_event_participation.sql 内容执行

import fs from 'fs';
import path from 'path';

const sqlFilePath = path.join(process.cwd(), 'supabase', 'migrations', '20260211000000_enhance_event_participation.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

console.log('='.repeat(80));
console.log('Supabase 数据库迁移 SQL');
console.log('='.repeat(80));
console.log('\n请按以下步骤执行迁移：\n');
console.log('1. 访问 Supabase Dashboard:');
console.log('   https://supabase.com/dashboard/project/pptqdicaaewtnaiflfcs/sql/new\n');
console.log('2. 复制以下内容并粘贴到 SQL 编辑器中：\n');
console.log('-'.repeat(80));
console.log(sqlContent);
console.log('-'.repeat(80));
console.log('\n3. 点击 "Run" 按钮执行 SQL\n');
console.log('注意：执行可能需要 1-2 分钟，请耐心等待。');
console.log('='.repeat(80));

// 同时保存到临时文件方便复制
const tempFilePath = path.join(process.cwd(), 'scripts', 'migration-to-apply.sql');
fs.writeFileSync(tempFilePath, sqlContent);
console.log(`\nSQL 内容已保存到: ${tempFilePath}`);
