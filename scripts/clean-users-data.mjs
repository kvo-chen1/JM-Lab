import fs from 'fs';
import path from 'path';

const inputFile = 'c:\\git-repo\\data_by_table_split\\197_users_part001.sql';
const outputFile = 'c:\\git-repo\\import_batches\\batch_002_users_cleaned.sql';

console.log('🧹 清理 users 数据（移除 base64 图片）...\n');

const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\n');

// 第一行是 COPY 语句
const copyLine = lines[0];
// 最后一行是 \.
const endLine = lines[lines.length - 1];

// 解析列名
const columnMatch = copyLine.match(/COPY public\.users \((.+?)\) FROM stdin;/);
const columns = columnMatch ? columnMatch[1].split(', ') : [];
console.log(`列数: ${columns.length}`);

// 找到 avatar_url 和 cover_image 的索引
const avatarIndex = columns.indexOf('avatar_url');
const coverIndex = columns.indexOf('cover_image');
console.log(`avatar_url 索引: ${avatarIndex}`);
console.log(`cover_image 索引: ${coverIndex}`);

// 处理数据行
const dataLines = lines.slice(1, -1).filter(line => line.trim() !== '' && line !== '\\.');
console.log(`数据行数: ${dataLines.length}\n`);

let cleanedCount = 0;
let totalSaved = 0;

const cleanedLines = dataLines.map(line => {
  const fields = line.split('\t');

  // 检查 avatar_url 是否包含 base64 数据
  if (avatarIndex >= 0 && fields[avatarIndex] && fields[avatarIndex].startsWith('data:image')) {
    const originalLength = fields[avatarIndex].length;
    fields[avatarIndex] = '\\N'; // PostgreSQL NULL
    cleanedCount++;
    totalSaved += originalLength;
  }

  // 检查 cover_image 是否包含 base64 数据
  if (coverIndex >= 0 && fields[coverIndex] && fields[coverIndex].startsWith('data:image')) {
    const originalLength = fields[coverIndex].length;
    fields[coverIndex] = '\\N'; // PostgreSQL NULL
    cleanedCount++;
    totalSaved += originalLength;
  }

  return fields.join('\t');
});

// 写入清理后的文件
const outputContent = [copyLine, ...cleanedLines, endLine].join('\n');
fs.writeFileSync(outputFile, outputContent);

const originalSize = Buffer.byteLength(content, 'utf-8');
const newSize = Buffer.byteLength(outputContent, 'utf-8');

console.log(`✅ 清理完成！`);
console.log(`   清理了 ${cleanedCount} 个 base64 图片字段`);
console.log(`   原始大小: ${(originalSize/1024).toFixed(2)} KB`);
console.log(`   清理后大小: ${(newSize/1024).toFixed(2)} KB`);
console.log(`   节省空间: ${((originalSize - newSize)/1024).toFixed(2)} KB`);
console.log(`\n📁 输出文件: ${outputFile}`);

// 删除旧的超大文件
const oldFiles = [
  'c:\\git-repo\\import_batches\\batch_002_197_users_part001_part01.sql',
  'c:\\git-repo\\import_batches\\batch_002_197_users_part001_part03.sql',
  'c:\\git-repo\\import_batches\\batch_002_users_part01.sql',
  'c:\\git-repo\\import_batches\\batch_002_users_data_part01.sql'
];

for (const file of oldFiles) {
  if (fs.existsSync(file)) {
    fs.unlinkSync(file);
    console.log(`🗑️  删除: ${path.basename(file)}`);
  }
}
