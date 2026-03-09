import fs from 'fs';
import path from 'path';

// ==================== 配置 ====================
const DATA_DIR = 'c:\\git-repo\\data_by_table_split';
const OUTPUT_DIR = 'c:\\git-repo\\import_batches';
const BATCH_SIZE = 10; // 每个批次文件包含的表数量
const MAX_FILE_SIZE = 500 * 1024; // 500KB，超过则单独成文件

// 创建输出目录
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// ==================== 导入顺序配置 ====================
const IMPORT_ORDER = [
  // 第一优先级：基础配置表
  ['001_achievement_configs.sql', '006_admin_roles.sql', '035_categories.sql', '057_creator_level_configs.sql'],

  // 第二优先级：用户表
  ['197_users_part001.sql', '197_users.sql'],

  // 第三优先级：用户相关表
  ['003_admin_accounts.sql', '014_ai_user_settings.sql', '037_checkin_records.sql', '047_community_members.sql'],
  ['082_follows.sql', '084_friend_requests.sql', '085_friends.sql', '111_messages.sql'],

  // 第四优先级：内容表
  ['041_communities.sql', '048_community_posts.sql', '072_events.sql', '090_inspiration_mindmaps.sql'],
  ['130_posts.sql', '133_products.sql', '205_works.sql'],

  // 第五优先级：内容相关表
  ['091_inspiration_nodes_part001.sql', '091_inspiration_nodes_part002.sql', '091_inspiration_nodes_part003.sql', '091_inspiration_nodes_part004.sql'],

  // 第六优先级：关联表
  ['007_ai_conversations.sql', '008_ai_feedback.sql', '009_ai_messages.sql', '023_bookmarks.sql'],
  ['039_comments.sql', '074_favorites.sql', '077_feed_comments.sql', '080_feeds.sql'],
  ['099_likes.sql', '201_work_comments.sql'],

  // 第七优先级：点赞数据
  ['207_works_likes_part001.sql', '207_works_likes_part002.sql', '207_works_likes_part003.sql'],

  // 第八优先级：日志和统计表
  ['021_audit_logs_part001.sql'],
  ['123_page_views_part001.sql', '123_page_views_part002.sql', '123_page_views_part003.sql'],
  ['123_page_views_part004.sql', '123_page_views_part005.sql', '123_page_views_part006.sql'],
  ['123_page_views_part007.sql', '123_page_views_part008.sql', '123_page_views_part009.sql'],
  ['166_traffic_sources_part001.sql', '166_traffic_sources_part002.sql', '166_traffic_sources_part003.sql', '166_traffic_sources_part004.sql'],
];

// ==================== 工具函数 ====================

function getFileSize(filePath) {
  try {
    return fs.statSync(filePath).size;
  } catch {
    return 0;
  }
}

function readFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// ==================== 主程序 ====================

console.log('🚀 生成批量导入文件...\n');

const processedFiles = new Set();
const batchFiles = [];
let batchNumber = 1;

// 按优先级处理文件
for (const group of IMPORT_ORDER) {
  let currentBatch = [];
  let currentBatchSize = 0;

  for (const filename of group) {
    if (processedFiles.has(filename)) continue;

    const filePath = path.join(DATA_DIR, filename);
    if (!fileExists(filePath)) continue;

    const fileSize = getFileSize(filePath);

    // 如果文件太大，单独成一个批次
    if (fileSize > MAX_FILE_SIZE) {
      // 先保存当前批次
      if (currentBatch.length > 0) {
        const batchContent = currentBatch.map(f => readFile(path.join(DATA_DIR, f))).join('\n\n');
        const batchFilename = `batch_${String(batchNumber).padStart(3, '0')}.sql`;
        fs.writeFileSync(path.join(OUTPUT_DIR, batchFilename), batchContent);
        batchFiles.push({
          filename: batchFilename,
          tables: [...currentBatch],
          size: currentBatchSize
        });
        console.log(`✅ 生成: ${batchFilename} (${currentBatch.length} 个表)`);
        batchNumber++;
        currentBatch = [];
        currentBatchSize = 0;
      }

      // 单独保存大文件
      const content = readFile(filePath);
      const batchFilename = `batch_${String(batchNumber).padStart(3, '0')}_${filename}`;
      fs.writeFileSync(path.join(OUTPUT_DIR, batchFilename), content);
      batchFiles.push({
        filename: batchFilename,
        tables: [filename],
        size: fileSize
      });
      console.log(`✅ 生成: ${batchFilename} (大文件单独处理, ${(fileSize/1024).toFixed(2)} KB)`);
      batchNumber++;
      processedFiles.add(filename);
      continue;
    }

    // 检查是否超出批次大小限制
    if (currentBatchSize + fileSize > MAX_FILE_SIZE && currentBatch.length > 0) {
      // 保存当前批次
      const batchContent = currentBatch.map(f => readFile(path.join(DATA_DIR, f))).join('\n\n');
      const batchFilename = `batch_${String(batchNumber).padStart(3, '0')}.sql`;
      fs.writeFileSync(path.join(OUTPUT_DIR, batchFilename), batchContent);
      batchFiles.push({
        filename: batchFilename,
        tables: [...currentBatch],
        size: currentBatchSize
      });
      console.log(`✅ 生成: ${batchFilename} (${currentBatch.length} 个表)`);
      batchNumber++;
      currentBatch = [];
      currentBatchSize = 0;
    }

    currentBatch.push(filename);
    currentBatchSize += fileSize;
    processedFiles.add(filename);
  }

  // 保存最后一个批次
  if (currentBatch.length > 0) {
    const batchContent = currentBatch.map(f => readFile(path.join(DATA_DIR, f))).join('\n\n');
    const batchFilename = `batch_${String(batchNumber).padStart(3, '0')}.sql`;
    fs.writeFileSync(path.join(OUTPUT_DIR, batchFilename), batchContent);
    batchFiles.push({
      filename: batchFilename,
      tables: [...currentBatch],
      size: currentBatchSize
    });
    console.log(`✅ 生成: ${batchFilename} (${currentBatch.length} 个表)`);
    batchNumber++;
  }
}

// 处理剩余未处理的文件
const remainingFiles = fs.readdirSync(DATA_DIR)
  .filter(f => f.endsWith('.sql') && !processedFiles.has(f));

if (remainingFiles.length > 0) {
  console.log(`\n📦 处理剩余 ${remainingFiles.length} 个文件...`);

  let currentBatch = [];
  let currentBatchSize = 0;

  for (const filename of remainingFiles) {
    const filePath = path.join(DATA_DIR, filename);
    const fileSize = getFileSize(filePath);

    if (currentBatchSize + fileSize > MAX_FILE_SIZE && currentBatch.length > 0) {
      const batchContent = currentBatch.map(f => readFile(path.join(DATA_DIR, f))).join('\n\n');
      const batchFilename = `batch_${String(batchNumber).padStart(3, '0')}.sql`;
      fs.writeFileSync(path.join(OUTPUT_DIR, batchFilename), batchContent);
      batchFiles.push({
        filename: batchFilename,
        tables: [...currentBatch],
        size: currentBatchSize
      });
      console.log(`✅ 生成: ${batchFilename} (${currentBatch.length} 个表)`);
      batchNumber++;
      currentBatch = [];
      currentBatchSize = 0;
    }

    currentBatch.push(filename);
    currentBatchSize += fileSize;
  }

  if (currentBatch.length > 0) {
    const batchContent = currentBatch.map(f => readFile(path.join(DATA_DIR, f))).join('\n\n');
    const batchFilename = `batch_${String(batchNumber).padStart(3, '0')}.sql`;
    fs.writeFileSync(path.join(OUTPUT_DIR, batchFilename), batchContent);
    batchFiles.push({
      filename: batchFilename,
      tables: [...currentBatch],
      size: currentBatchSize
    });
    console.log(`✅ 生成: ${batchFilename} (${currentBatch.length} 个表)`);
  }
}

// 生成导入指南
const guideContent = `# Supabase 数据导入指南

## 📊 批次文件统计

共生成 ${batchFiles.length} 个批次文件，保存在 \`${OUTPUT_DIR}\` 目录。

## 📋 批次文件列表

| 批次文件 | 包含表数 | 大小 | 说明 |
|---------|---------|------|------|
${batchFiles.map((b, i) => `| ${b.filename} | ${b.tables.length} | ${(b.size/1024).toFixed(2)} KB | ${i < 5 ? '优先导入' : ''} |`).join('\n')}

## 🔧 导入步骤

### 步骤 1: 创建表结构
在 Supabase SQL Editor 中执行：
\`\`\`sql
-- 执行 create_all_tables_full.sql
\`\`\`

### 步骤 2: 按顺序导入批次文件

**重要：必须按顺序导入！**

1. 打开 Supabase SQL Editor
2. 逐个上传并执行批次文件：
   - batch_001.sql (基础配置表)
   - batch_002.sql (用户表)
   - batch_003.sql (用户相关表)
   - ...以此类推

### 步骤 3: 验证导入

导入完成后，执行以下 SQL 检查数据：

\`\`\`sql
-- 检查用户表
SELECT COUNT(*) FROM users;

-- 检查作品表
SELECT COUNT(*) FROM works;

-- 检查所有表的数据量
SELECT 
  schemaname,
  tablename,
  n_tup_ins as inserted_rows
FROM pg_stat_user_tables 
WHERE schemaname = 'public'
ORDER BY n_tup_ins DESC;
\`\`\`

## ⚠️ 注意事项

1. **必须按顺序导入**，因为存在外键依赖关系
2. **如果某个批次导入失败**，检查错误信息后，可以单独重新导入该批次
3. **users 表必须先导入**，其他很多表依赖它
4. **大文件已单独分割**，避免 SQL Editor 大小限制

## 🐛 常见问题

### 问题 1: "Query is too large"
**解决**: 使用已分割的小批次文件，每个文件不超过 500KB

### 问题 2: "foreign key constraint violation"
**解决**: 确保按顺序导入，先导入被引用的表（如 users）

### 问题 3: "duplicate key value violates unique constraint"
**解决**: 数据已存在，可以跳过或清空表后重新导入

## 📁 文件位置

- 原始数据文件: \`${DATA_DIR}\`
- 批次导入文件: \`${OUTPUT_DIR}\`
`;

fs.writeFileSync(path.join(OUTPUT_DIR, 'IMPORT_GUIDE.md'), guideContent);

console.log('\n' + '='.repeat(50));
console.log('✅ 批量导入文件生成完成！');
console.log(`📊 共生成 ${batchFiles.length} 个批次文件`);
console.log(`📁 文件位置: ${OUTPUT_DIR}`);
console.log('📖 导入指南: IMPORT_GUIDE.md');
console.log('\n📝 使用步骤:');
console.log('1. 先在 Supabase SQL Editor 执行 create_all_tables_full.sql');
console.log('2. 按顺序逐个执行 batch_001.sql, batch_002.sql, ...');
console.log('='.repeat(50));
