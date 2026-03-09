import fs from 'fs';
import path from 'path';

const inputFile = 'c:\\git-repo\\data_by_table_split\\197_users_part001.sql';
const outputDir = 'c:\\git-repo\\import_batches';
const MAX_SIZE = 100 * 1024; // 100KB

console.log('🧹 清理所有 base64 数据...\n');

const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\n');

const copyLine = lines[0];
const endLine = lines[lines.length - 1];
const dataLines = lines.slice(1, -1).filter(line => line.trim() !== '');

console.log(`数据行数: ${dataLines.length}\n`);

// 清理 base64 数据的函数
function cleanBase64Data(line) {
  // 移除所有 data:image 开头的 base64 数据
  // 匹配 data:image/xxx;base64,xxxx 模式
  const base64Pattern = /data:image\/[^;]+;base64,[A-Za-z0-9+/=]+/g;

  let cleaned = line;
  let match;
  let count = 0;

  while ((match = base64Pattern.exec(line)) !== null) {
    count++;
  }

  if (count > 0) {
    cleaned = line.replace(base64Pattern, '');
    console.log(`   清理了 ${count} 个 base64 图片`);
  }

  return cleaned;
}

// 处理每一行数据
const cleanedLines = [];
for (let i = 0; i < dataLines.length; i++) {
  const line = dataLines[i];
  const originalSize = Buffer.byteLength(line, 'utf-8');

  const cleanedLine = cleanBase64Data(line);
  const newSize = Buffer.byteLength(cleanedLine, 'utf-8');

  if (originalSize !== newSize) {
    console.log(`行 ${i + 1}: ${(originalSize/1024).toFixed(2)} KB → ${(newSize/1024).toFixed(2)} KB`);
  }

  cleanedLines.push(cleanedLine);
}

// 分割成小文件
let partNum = 1;
let currentLines = [copyLine];
let currentSize = Buffer.byteLength(copyLine, 'utf-8');

for (const line of cleanedLines) {
  const lineSize = Buffer.byteLength(line + '\n', 'utf-8');

  if (currentSize + lineSize > MAX_SIZE && currentLines.length > 1) {
    currentLines.push(endLine);
    const partFilename = `batch_002_users_v2_part${String(partNum).padStart(2, '0')}.sql`;
    fs.writeFileSync(path.join(outputDir, partFilename), currentLines.join('\n'));
    console.log(`\n✓ 生成: ${partFilename} (${currentLines.length - 2} 行, ${(currentSize/1024).toFixed(2)} KB)`);

    partNum++;
    currentLines = [copyLine, line];
    currentSize = Buffer.byteLength(copyLine + '\n' + line, 'utf-8');
  } else {
    currentLines.push(line);
    currentSize += lineSize;
  }
}

// 保存最后一部分
if (currentLines.length > 1) {
  currentLines.push(endLine);
  const partFilename = `batch_002_users_v2_part${String(partNum).padStart(2, '0')}.sql`;
  fs.writeFileSync(path.join(outputDir, partFilename), currentLines.join('\n'));
  console.log(`\n✓ 生成: ${partFilename} (${currentLines.length - 2} 行, ${(currentSize/1024).toFixed(2)} KB)`);
}

console.log(`\n✅ 共生成 ${partNum} 个文件`);

// 删除所有旧的 users 文件
const files = fs.readdirSync(outputDir);
for (const file of files) {
  if (file.includes('users') && file.includes('part') && !file.includes('v2')) {
    fs.unlinkSync(path.join(outputDir, file));
    console.log(`🗑️  删除: ${file}`);
  }
}
