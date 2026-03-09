import fs from 'fs';
import path from 'path';

const filePath = 'c:\\git-repo\\import_batches\\batch_002_197_users_part001_part02.sql';
const outputDir = 'c:\\git-repo\\import_batches';
const MAX_SIZE = 150 * 1024; // 150KB

console.log('🔪 分割超大 users 文件...\n');

const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// 第一行是 COPY 语句
const copyLine = lines[0];
// 最后一行是 \.
const endLine = lines[lines.length - 1];
// 数据行
const dataLines = lines.slice(1, -1).filter(line => line.trim() !== '');

console.log(`总行数: ${lines.length}`);
console.log(`数据行数: ${dataLines.length}`);
console.log(`COPY 语句长度: ${Buffer.byteLength(copyLine, 'utf-8')} bytes`);

// 按大小分割
let partNum = 1;
let currentLines = [copyLine];
let currentSize = Buffer.byteLength(copyLine, 'utf-8');

for (const line of dataLines) {
  const lineSize = Buffer.byteLength(line + '\n', 'utf-8');

  if (currentSize + lineSize > MAX_SIZE && currentLines.length > 1) {
    // 保存当前部分
    currentLines.push(endLine);
    const partFilename = `batch_002_users_part${String(partNum).padStart(2, '0')}.sql`;
    fs.writeFileSync(path.join(outputDir, partFilename), currentLines.join('\n'));
    console.log(`✓ 生成: ${partFilename} (${currentLines.length - 2} 行数据, ${(currentSize/1024).toFixed(2)} KB)`);

    // 开始新部分
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
  const partFilename = `batch_002_users_part${String(partNum).padStart(2, '0')}.sql`;
  fs.writeFileSync(path.join(outputDir, partFilename), currentLines.join('\n'));
  console.log(`✓ 生成: ${partFilename} (${currentLines.length - 2} 行数据, ${(currentSize/1024).toFixed(2)} KB)`);
}

// 删除原文件
fs.unlinkSync(filePath);
console.log(`\n🗑️  删除原文件`);
console.log(`✅ 共分割成 ${partNum} 个文件`);
