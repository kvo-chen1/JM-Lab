import fs from 'fs';
import path from 'path';

const batchDir = 'c:\\git-repo\\import_batches';

console.log('🔍 正在检查导入文件内容...\n');

// 获取所有 SQL 文件
const sqlFiles = fs.readdirSync(batchDir)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`找到 ${sqlFiles.length} 个 SQL 文件\n`);

// 检查每个文件包含哪些表
const tableFiles = {};

for (const file of sqlFiles) {
  const filePath = path.join(batchDir, file);
  const content = fs.readFileSync(filePath, 'utf-8');
  
  // 查找 COPY 语句中的表名
  const copyMatches = content.match(/COPY\s+public\.(\w+)/g);
  if (copyMatches) {
    const tables = copyMatches.map(m => m.replace('COPY public.', ''));
    console.log(`${file}:`);
    tables.forEach(table => {
      console.log(`  - ${table}`);
      if (!tableFiles[table]) {
        tableFiles[table] = [];
      }
      tableFiles[table].push(file);
    });
    console.log('');
  }
}

console.log('\n📊 表数据分布统计:');
Object.entries(tableFiles)
  .sort((a, b) => b[1].length - a[1].length)
  .forEach(([table, files]) => {
    console.log(`  - ${table}: ${files.length} 个文件`);
  });
