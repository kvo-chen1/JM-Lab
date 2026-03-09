import fs from 'fs';
import path from 'path';

const BATCH_DIR = 'c:\\git-repo\\import_batches';
const MAX_SIZE = 200 * 1024; // 200KB，Supabase SQL Editor 的安全限制

console.log('🔪 检查并分割超大批次文件...\n');

const files = fs.readdirSync(BATCH_DIR).filter(f => f.endsWith('.sql') && f !== 'IMPORT_GUIDE.md');

for (const filename of files) {
  const filePath = path.join(BATCH_DIR, filename);
  const stats = fs.statSync(filePath);

  if (stats.size > MAX_SIZE) {
    console.log(`📄 ${filename}: ${(stats.size/1024).toFixed(2)} KB (需要分割)`);

    // 读取文件内容
    const content = fs.readFileSync(filePath, 'utf-8');

    // 按 COPY 语句分割
    const copyBlocks = content.split(/(?=COPY public\.)/).filter(block => block.trim());

    console.log(`   包含 ${copyBlocks.length} 个 COPY 块`);

    // 分割成多个小文件
    let partNum = 1;
    let currentContent = '';
    let currentSize = 0;

    for (let i = 0; i < copyBlocks.length; i++) {
      const block = copyBlocks[i];
      const blockSize = Buffer.byteLength(block, 'utf-8');

      // 如果当前块太大，需要进一步分割
      if (blockSize > MAX_SIZE) {
        // 先保存当前内容
        if (currentContent) {
          const partFilename = filename.replace('.sql', `_part${String(partNum).padStart(2, '0')}.sql`);
          fs.writeFileSync(path.join(BATCH_DIR, partFilename), currentContent.trim());
          console.log(`   ✓ 生成: ${partFilename}`);
          partNum++;
          currentContent = '';
          currentSize = 0;
        }

        // 分割大 COPY 块
        const lines = block.split('\n');
        const copyLine = lines[0];
        const endLine = lines[lines.length - 1] === '\\.' ? '\\.' : lines[lines.length - 1];
        const dataLines = lines.slice(1, lines.length - 1);

        let chunkLines = [copyLine];
        let chunkSize = Buffer.byteLength(copyLine, 'utf-8');

        for (const line of dataLines) {
          const lineSize = Buffer.byteLength(line + '\n', 'utf-8');

          if (chunkSize + lineSize > MAX_SIZE && chunkLines.length > 1) {
            // 保存当前 chunk
            chunkLines.push(endLine);
            const partFilename = filename.replace('.sql', `_part${String(partNum).padStart(2, '0')}.sql`);
            fs.writeFileSync(path.join(BATCH_DIR, partFilename), chunkLines.join('\n'));
            console.log(`   ✓ 生成: ${partFilename} (${chunkLines.length - 2} 行数据)`);
            partNum++;

            // 开始新 chunk
            chunkLines = [copyLine, line];
            chunkSize = Buffer.byteLength(copyLine + '\n' + line, 'utf-8');
          } else {
            chunkLines.push(line);
            chunkSize += lineSize;
          }
        }

        // 保存最后一个 chunk
        if (chunkLines.length > 1) {
          chunkLines.push(endLine);
          const partFilename = filename.replace('.sql', `_part${String(partNum).padStart(2, '0')}.sql`);
          fs.writeFileSync(path.join(BATCH_DIR, partFilename), chunkLines.join('\n'));
          console.log(`   ✓ 生成: ${partFilename} (${chunkLines.length - 2} 行数据)`);
          partNum++;
        }
      } else {
        // 正常添加块
        if (currentSize + blockSize > MAX_SIZE && currentContent) {
          // 保存当前文件
          const partFilename = filename.replace('.sql', `_part${String(partNum).padStart(2, '0')}.sql`);
          fs.writeFileSync(path.join(BATCH_DIR, partFilename), currentContent.trim());
          console.log(`   ✓ 生成: ${partFilename}`);
          partNum++;
          currentContent = '';
          currentSize = 0;
        }

        currentContent += block;
        currentSize += blockSize;
      }
    }

    // 保存最后的内容
    if (currentContent) {
      const partFilename = filename.replace('.sql', `_part${String(partNum).padStart(2, '0')}.sql`);
      fs.writeFileSync(path.join(BATCH_DIR, partFilename), currentContent.trim());
      console.log(`   ✓ 生成: ${partFilename}`);
    }

    // 删除原文件
    fs.unlinkSync(filePath);
    console.log(`   🗑️  删除原文件: ${filename}\n`);
  }
}

console.log('✅ 分割完成！');

// 生成新的文件列表
const newFiles = fs.readdirSync(BATCH_DIR)
  .filter(f => f.endsWith('.sql'))
  .sort();

console.log(`\n📊 现在共有 ${newFiles.length} 个批次文件:`);
newFiles.forEach((f, i) => {
  const stats = fs.statSync(path.join(BATCH_DIR, f));
  console.log(`   ${i + 1}. ${f} (${(stats.size/1024).toFixed(2)} KB)`);
});
