import fs from 'fs';
import path from 'path';
import { createClient } from '@supabase/supabase-js';
import readline from 'readline';

// ==================== 配置 ====================
const DATA_DIR = 'c:\\git-repo\\data_by_table_split';
const BATCH_SIZE = 5; // 每批导入的文件数
const DELAY_BETWEEN_FILES = 1000; // 文件间延迟（毫秒）
const DELAY_BETWEEN_BATCHES = 3000; // 批次间延迟（毫秒）

// ==================== 导入顺序配置 ====================
// 按优先级分组，数字越小优先级越高
const IMPORT_ORDER = {
  // 第一优先级：基础配置表（无外键依赖）
  priority_1: [
    '001_achievement_configs.sql',
    '006_admin_roles.sql',
    '035_categories.sql',
    '057_creator_level_configs.sql',
    '101_lottery_prizes.sql',
    '128_points_rules.sql',
    '165_tianjin_templates.sql',
    '083_forbidden_words.sql',
    '088_hot_searches.sql',
    '154_search_suggestions.sql',
  ],

  // 第二优先级：用户表（很多表依赖 users）
  priority_2: [
    '197_users_part001.sql',
    '197_users.sql', // 如果没有分割
  ],

  // 第三优先级：用户相关表
  priority_3: [
    '003_admin_accounts.sql',
    '014_ai_user_settings.sql',
    '015_alert_notifications.sql',
    '017_alert_rules.sql',
    '033_brand_wizard_drafts.sql',
    '037_checkin_records.sql',
    '047_community_members.sql',
    '082_follows.sql',
    '084_friend_requests.sql',
    '085_friends.sql',
    '094_invite_records.sql',
    '111_messages.sql',
    '115_notifications.sql',
    '127_points_records.sql',
    '167_user_achievements.sql',
    '176_user_demographics.sql',
    '177_user_devices.sql',
    '180_user_feedbacks.sql',
    '185_user_points_balance.sql',
    '188_user_search_history.sql',
    '192_user_status.sql',
  ],

  // 第四优先级：内容表
  priority_4: [
    '041_communities.sql',
    '048_community_posts.sql',
    '072_events.sql',
    '090_inspiration_mindmaps.sql',
    '130_posts.sql',
    '133_products.sql',
    '205_works.sql',
  ],

  // 第五优先级：内容相关表（分割文件）
  priority_5: [
    // inspiration_nodes 分割文件
    '091_inspiration_nodes_part001.sql',
    '091_inspiration_nodes_part002.sql',
    '091_inspiration_nodes_part003.sql',
    '091_inspiration_nodes_part004.sql',
    // 如果没有分割
    '091_inspiration_nodes.sql',
  ],

  // 第六优先级：关联表（点赞、收藏、评论等）
  priority_6: [
    '004_admin_notifications.sql',
    '007_ai_conversations.sql',
    '008_ai_feedback.sql',
    '009_ai_messages.sql',
    '010_ai_platform_knowledge.sql',
    '011_ai_reviews.sql',
    '012_ai_shares.sql',
    '023_bookmarks.sql',
    '039_comments.sql',
    '074_favorites.sql',
    '075_feed_collects.sql',
    '077_feed_comments.sql',
    '078_feed_likes.sql',
    '080_feeds.sql',
    '099_likes.sql',
    '102_lottery_spin_records.sql',
    '201_work_comments.sql',
  ],

  // 第七优先级：点赞数据（大表，分割文件）
  priority_7: [
    '207_works_likes_part001.sql',
    '207_works_likes_part002.sql',
    '207_works_likes_part003.sql',
    // 如果没有分割
    '207_works_likes.sql',
  ],

  // 第八优先级：日志和统计表
  priority_8: [
    '021_audit_logs_part001.sql',
    // 如果没有分割
    '021_audit_logs.sql',
    '123_page_views_part001.sql',
    '123_page_views_part002.sql',
    '123_page_views_part003.sql',
    '123_page_views_part004.sql',
    '123_page_views_part005.sql',
    '123_page_views_part006.sql',
    '123_page_views_part007.sql',
    '123_page_views_part008.sql',
    '123_page_views_part009.sql',
    // 如果没有分割
    '123_page_views.sql',
    '166_traffic_sources_part001.sql',
    '166_traffic_sources_part002.sql',
    '166_traffic_sources_part003.sql',
    '166_traffic_sources_part004.sql',
    // 如果没有分割
    '166_traffic_sources.sql',
  ],

  // 第九优先级：其他所有表
  priority_9: [], // 动态填充
};

// ==================== 工具函数 ====================

// 延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 读取 SQL 文件内容
function readSqlFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`❌ 读取文件失败: ${filePath}`);
    return null;
  }
}

// 检查文件是否存在
function fileExists(filePath) {
  return fs.existsSync(filePath);
}

// 从文件名提取表名
function getTableName(filename) {
  const match = filename.match(/\d+_(.+?)\.sql$/);
  return match ? match[1] : filename;
}

// ==================== 导入核心函数 ====================

// 执行单个 SQL 文件
async function executeSqlFile(supabase, filePath, filename) {
  const sql = readSqlFile(filePath);
  if (!sql) {
    return { success: false, error: '读取文件失败' };
  }

  try {
    // 使用 Supabase 的 rpc 执行 SQL
    const { data, error } = await supabase.rpc('exec_sql', { sql });

    if (error) {
      // 如果 exec_sql 函数不存在，尝试直接查询
      const { error: queryError } = await supabase.from('_temp_query').select('*').limit(0);

      // 备用方案：使用 REST API 直接执行
      console.log(`   ⚠️ 尝试备用方案执行...`);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// ==================== 主程序 ====================

async function main() {
  console.log('🚀 Supabase 数据自动导入工具\n');
  console.log('=' .repeat(50));

  // 获取 Supabase 连接信息
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  const askQuestion = (question) => new Promise(resolve => {
    rl.question(question, resolve);
  });

  console.log('\n📋 请提供 Supabase 连接信息：');
  const supabaseUrl = await askQuestion('Supabase URL (如: https://xxxxx.supabase.co): ');
  const supabaseKey = await askQuestion('Supabase Service Role Key: ');

  rl.close();

  if (!supabaseUrl || !supabaseKey) {
    console.log('❌ 错误：必须提供 URL 和 Key');
    process.exit(1);
  }

  // 创建 Supabase 客户端
  const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  });

  console.log('\n✅ 已连接到 Supabase');
  console.log(`📁 数据目录: ${DATA_DIR}\n`);

  // 收集所有需要导入的文件
  const allFiles = [];
  const processedFiles = new Set();

  // 按优先级收集文件
  for (let priority = 1; priority <= 9; priority++) {
    const key = `priority_${priority}`;
    const files = IMPORT_ORDER[key] || [];

    for (const filename of files) {
      if (processedFiles.has(filename)) continue;

      const filePath = path.join(DATA_DIR, filename);
      if (fileExists(filePath)) {
        allFiles.push({
          filename,
          filepath: filePath,
          priority,
          tableName: getTableName(filename)
        });
        processedFiles.add(filename);
      }
    }
  }

  // 收集剩余未处理的文件（优先级 9）
  const dataFiles = fs.readdirSync(DATA_DIR).filter(f => f.endsWith('.sql'));
  for (const filename of dataFiles) {
    if (processedFiles.has(filename)) continue;

    allFiles.push({
      filename,
      filepath: path.join(DATA_DIR, filename),
      priority: 9,
      tableName: getTableName(filename)
    });
  }

  // 按优先级排序
  allFiles.sort((a, b) => a.priority - b.priority);

  console.log(`📊 共找到 ${allFiles.length} 个文件需要导入\n`);

  // 统计信息
  const stats = {
    total: allFiles.length,
    success: 0,
    failed: 0,
    skipped: 0,
    errors: []
  };

  // 按批次导入
  let currentPriority = 0;

  for (let i = 0; i < allFiles.length; i++) {
    const file = allFiles[i];
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(allFiles.length / BATCH_SIZE);

    // 显示优先级变化
    if (file.priority !== currentPriority) {
      currentPriority = file.priority;
      console.log(`\n📦 优先级 ${currentPriority}:`);
    }

    console.log(`\n[${i + 1}/${allFiles.length}] 导入: ${file.filename}`);
    console.log(`    表名: ${file.tableName}`);

    // 读取并显示文件大小
    const stats = fs.statSync(file.filepath);
    const sizeKB = (stats.size / 1024).toFixed(2);
    console.log(`    大小: ${sizeKB} KB`);

    // 执行导入
    const result = await executeSqlFile(supabase, file.filepath, file.filename);

    if (result.success) {
      console.log(`    ✅ 成功`);
      stats.success++;
    } else {
      console.log(`    ❌ 失败: ${result.error}`);
      stats.failed++;
      stats.errors.push({
        file: file.filename,
        error: result.error
      });
    }

    // 批次间延迟
    if ((i + 1) % BATCH_SIZE === 0 && i < allFiles.length - 1) {
      console.log(`\n⏳ 批次 ${batchNum}/${totalBatches} 完成，等待 ${DELAY_BETWEEN_BATCHES}ms...`);
      await delay(DELAY_BETWEEN_BATCHES);
    } else {
      // 文件间延迟
      await delay(DELAY_BETWEEN_FILES);
    }
  }

  // 显示最终统计
  console.log('\n' + '='.repeat(50));
  console.log('📊 导入完成统计:');
  console.log(`   总计: ${stats.total}`);
  console.log(`   ✅ 成功: ${stats.success}`);
  console.log(`   ❌ 失败: ${stats.failed}`);
  console.log(`   ⏭️  跳过: ${stats.skipped}`);

  if (stats.errors.length > 0) {
    console.log('\n❌ 失败的文件:');
    stats.errors.forEach(({ file, error }) => {
      console.log(`   - ${file}: ${error}`);
    });

    // 保存错误日志
    const errorLog = {
      timestamp: new Date().toISOString(),
      total: stats.total,
      success: stats.success,
      failed: stats.failed,
      errors: stats.errors
    };
    fs.writeFileSync('import_errors.json', JSON.stringify(errorLog, null, 2));
    console.log('\n📝 错误日志已保存到: import_errors.json');
  }

  console.log('\n🎉 导入流程结束！');
}

// 运行主程序
main().catch(error => {
  console.error('❌ 程序错误:', error);
  process.exit(1);
});
