import fs from 'fs';
import path from 'path';

const inputDir = 'c:\\git-repo\\data_by_table';
const outputDir = 'c:\\git-repo\\data_by_table_split';

// 创建输出目录
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

// 需要分割的大文件列表
const largeFiles = [
  { file: '021_audit_logs.sql', chunkSize: 500 },      // 5.98MB, 每500行分割
  { file: '197_users.sql', chunkSize: 100 },           // 1.50MB, 每100行分割
  { file: '123_page_views.sql', chunkSize: 500 },      // 1.10MB, 每500行分割
  { file: '207_works_likes.sql', chunkSize: 5000 },    // 893KB, 每5000行分割
  { file: '091_inspiration_nodes.sql', chunkSize: 100 }, // 621KB
  { file: '166_traffic_sources.sql', chunkSize: 500 },  // 364KB
];

function splitFile(filename, chunkSize) {
  const inputPath = path.join(inputDir, filename);
  const baseName = path.basename(filename, '.sql');

  if (!fs.existsSync(inputPath)) {
    console.log(`⚠️ 文件不存在: ${filename}`);
    return;
  }

  const content = fs.readFileSync(inputPath, 'utf-8');
  const lines = content.split('\n');

  // 第一行是 COPY 语句
  const copyLine = lines[0];
  // 最后一行是 \.
  const endLine = lines[lines.length - 1];

  // 数据行（去掉第一行和最后一行）
  const dataLines = lines.slice(1, -1).filter(line => line.trim() !== '');

  console.log(`\n📄 ${filename}:`);
  console.log(`   总行数: ${lines.length}`);
  console.log(`   数据行数: ${dataLines.length}`);
  console.log(`   分割大小: ${chunkSize} 行/文件`);

  // 计算需要分割成多少个文件
  const totalChunks = Math.ceil(dataLines.length / chunkSize);

  for (let i = 0; i < totalChunks; i++) {
    const start = i * chunkSize;
    const end = Math.min((i + 1) * chunkSize, dataLines.length);
    const chunkData = dataLines.slice(start, end);

    const chunkContent = [
      copyLine,
      ...chunkData,
      endLine
    ].join('\n');

    const chunkFilename = `${baseName}_part${String(i + 1).padStart(3, '0')}.sql`;
    fs.writeFileSync(path.join(outputDir, chunkFilename), chunkContent);
    console.log(`   ✓ 保存: ${chunkFilename} (${chunkData.length} 行数据)`);
  }

  console.log(`   ✅ 共分割成 ${totalChunks} 个文件`);
}

// 处理每个大文件
console.log('🔪 开始分割大文件...\n');
for (const { file, chunkSize } of largeFiles) {
  splitFile(file, chunkSize);
}

// 复制小文件（不需要分割的）
console.log('\n📋 复制小文件...');
const allFiles = fs.readdirSync(inputDir);
const largeFileNames = largeFiles.map(f => f.file);

let copiedCount = 0;
for (const file of allFiles) {
  if (!largeFileNames.includes(file)) {
    fs.copyFileSync(
      path.join(inputDir, file),
      path.join(outputDir, file)
    );
    copiedCount++;
  }
}
console.log(`   ✅ 复制了 ${copiedCount} 个小文件`);

console.log(`\n🎉 完成！所有文件已保存到: ${outputDir}`);
