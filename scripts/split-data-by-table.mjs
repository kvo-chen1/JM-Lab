import fs from 'fs';
import path from 'path';

const inputFile = 'c:\\git-repo\\all_public_data.sql';
const outputDir = 'c:\\git-repo\\data_by_table';

// 创建输出目录
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 读取文件
const content = fs.readFileSync(inputFile, 'utf-8');
const lines = content.split('\n');

let currentTable = null;
let currentContent = [];
let tableCount = 0;

// 解析文件，按表分割
for (let i = 0; i < lines.length; i++) {
  const line = lines[i];

  // 检测 COPY 语句开始
  const copyMatch = line.match(/^COPY public\.(\w+) /);
  if (copyMatch) {
    // 保存之前的表
    if (currentTable && currentContent.length > 0) {
      const filename = `${String(tableCount).padStart(3, '0')}_${currentTable}.sql`;
      fs.writeFileSync(path.join(outputDir, filename), currentContent.join('\n'));
      console.log(`✓ 保存: ${filename} (${currentContent.length} 行)`);
    }

    currentTable = copyMatch[1];
    currentContent = [line];
    tableCount++;
    continue;
  }

  // 检测 COPY 结束标记
  if (line === '\\.' && currentTable) {
    currentContent.push(line);

    // 保存当前表
    const filename = `${String(tableCount).padStart(3, '0')}_${currentTable}.sql`;
    fs.writeFileSync(path.join(outputDir, filename), currentContent.join('\n'));
    console.log(`✓ 保存: ${filename} (${currentContent.length} 行)`);

    currentTable = null;
    currentContent = [];
    continue;
  }

  // 添加到当前表内容
  if (currentTable) {
    currentContent.push(line);
  }
}

// 处理最后一个表
if (currentTable && currentContent.length > 0) {
  const filename = `${String(tableCount).padStart(3, '0')}_${currentTable}.sql`;
  fs.writeFileSync(path.join(outputDir, filename), currentContent.join('\n'));
  console.log(`✓ 保存: ${filename} (${currentContent.length} 行)`);
}

console.log(`\n✅ 完成！共分割出 ${tableCount} 个表的数据文件`);
console.log(`📁 文件保存在: ${outputDir}`);
