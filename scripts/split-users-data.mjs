import fs from 'fs';
import path from 'path';

const filePath = 'c:\\git-repo\\import_batches\\batch_002_users_part01.sql';
const outputDir = 'c:\\git-repo\\import_batches';
const MAX_SIZE = 100 * 1024; // 100KB

console.log('🔪 分割 users 数据（处理 base64 图片）...\n');

const content = fs.readFileSync(filePath, 'utf-8');
const lines = content.split('\n');

// 第一行是 COPY 语句
const copyLine = lines[0];
// 最后一行是 \.
const endLine = lines[lines.length - 1];

// 解析 COPY 语句获取列名
const columnMatch = copyLine.match(/COPY public\.users \((.+?)\) FROM stdin;/);
const columns = columnMatch ? columnMatch[1].split(', ') : [];
console.log(`列数: ${columns.length}`);
console.log(`列名: ${columns.join(', ')}`);

// 数据行 - users 表的数据是用 tab 分隔的
const dataLines = lines.slice(1, -1).filter(line => line.trim() !== '' && line !== '\\.');

console.log(`\n数据行数: ${dataLines.length}`);

// 分割数据行
let partNum = 1;
let currentLines = [copyLine];
let currentSize = Buffer.byteLength(copyLine, 'utf-8');

for (const line of dataLines) {
  const lineSize = Buffer.byteLength(line + '\n', 'utf-8');

  // 如果单行就超过限制，需要截断（这种情况不应该发生）
  if (lineSize > MAX_SIZE * 2) {
    console.log(`⚠️ 警告: 发现超大行 (${(lineSize/1024).toFixed(2)} KB)，尝试截断...`);
    // 截断 base64 数据
    const fields = line.split('\t');
    if (fields.length > 10) {
      // 假设 avatar_url 或 cover_image 包含 base64 数据
      fields[5] = 'NULL'; // avatar_url
      fields[32] = 'NULL'; // cover_image
      const truncatedLine = fields.join('\t');
      const truncatedSize = Buffer.byteLength(truncatedLine + '\n', 'utf-8');

      if (currentSize + truncatedSize > MAX_SIZE && currentLines.length > 1) {
        currentLines.push(endLine);
        const partFilename = `batch_002_users_data_part${String(partNum).padStart(2, '0')}.sql`;
        fs.writeFileSync(path.join(outputDir, partFilename), currentLines.join('\n'));
        console.log(`✓ 生成: ${partFilename} (${currentLines.length - 2} 行)`);
        partNum++;
        currentLines = [copyLine, truncatedLine];
        currentSize = Buffer.byteLength(copyLine + '\n' + truncatedLine, 'utf-8');
      } else {
        currentLines.push(truncatedLine);
        currentSize += truncatedSize;
      }
      continue;
    }
  }

  if (currentSize + lineSize > MAX_SIZE && currentLines.length > 1) {
    // 保存当前部分
    currentLines.push(endLine);
    const partFilename = `batch_002_users_data_part${String(partNum).padStart(2, '0')}.sql`;
    fs.writeFileSync(path.join(outputDir, partFilename), currentLines.join('\n'));
    console.log(`✓ 生成: ${partFilename} (${currentLines.length - 2} 行, ${(currentSize/1024).toFixed(2)} KB)`);

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
  const partFilename = `batch_002_users_data_part${String(partNum).padStart(2, '0')}.sql`;
  fs.writeFileSync(path.join(outputDir, partFilename), currentLines.join('\n'));
  console.log(`✓ 生成: ${partFilename} (${currentLines.length - 2} 行, ${(currentSize/1024).toFixed(2)} KB)`);
}

// 删除原文件
fs.unlinkSync(filePath);
console.log(`\n🗑️  删除原文件`);
console.log(`✅ 共分割成 ${partNum} 个文件`);
