import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';

const PSQL_PATH = 'C:\\postgresql\\pgsql\\bin';
process.env.PATH = `${process.env.PATH};${PSQL_PATH}`;

const targetHost = 'db.kizgwtrrsmkjeiddotup.supabase.co';
const targetPort = '5432';
const targetDb = 'postgres';
const targetUser = 'postgres';
const targetPass = 'csh200506207837';

const targetConn = `postgresql://${targetUser}:${targetPass}@${targetHost}:${targetPort}/${targetDb}`;
const env = { ...process.env, PGPASSWORD: targetPass };

const batchDir = 'c:\\git-repo\\import_batches';

// 核心表及其对应的文件
const coreTables = {
  'batch_002_users_v2_part01.sql': ['users'],
  'batch_003.sql': ['admin_accounts', 'ai_user_settings', 'checkin_records', 'community_members'],
  'batch_004.sql': ['follows', 'friend_requests', 'friends', 'messages'],
  'batch_005.sql': ['communities', 'community_posts', 'events', 'inspiration_mindmaps'],
  'batch_006.sql': ['posts', 'products', 'works'],
  'batch_007_part01.sql': ['inspiration_nodes'],
  'batch_007_part02.sql': ['inspiration_nodes'],
  'batch_007_part03.sql': ['inspiration_nodes'],
  'batch_008_part01.sql': ['inspiration_nodes'],
  'batch_008_part02.sql': ['inspiration_nodes'],
  'batch_008_part03.sql': ['inspiration_nodes'],
  'batch_009.sql': ['ai_conversations', 'ai_feedback', 'ai_messages', 'bookmarks'],
  'batch_010.sql': ['comments', 'favorites', 'feed_comments', 'feeds'],
  'batch_011.sql': ['likes', 'work_comments'],
};

console.log('🔄 重新导入核心表数据...\n');

let successCount = 0;
let failCount = 0;

for (const [file, tables] of Object.entries(coreTables)) {
  const filePath = path.join(batchDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  文件不存在: ${file}`);
    continue;
  }
  
  console.log(`[${successCount + failCount + 1}/${Object.keys(coreTables).length}] 导入: ${file}`);
  console.log(`    包含表: ${tables.join(', ')}`);
  
  try {
    const result = execSync(
      `psql "${targetConn}"`,
      {
        input: fs.readFileSync(filePath, 'utf-8'),
        env,
        encoding: 'utf-8',
        timeout: 300000, // 5分钟
        maxBuffer: 1024 * 1024 * 20 // 20MB
      }
    );
    
    console.log(`    ✅ 成功`);
    successCount++;
    
  } catch (error) {
    console.log(`    ❌ 失败: ${error.message.substring(0, 100)}`);
    failCount++;
  }
  
  // 小延迟
  await new Promise(resolve => setTimeout(resolve, 500));
}

console.log('\n' + '='.repeat(60));
console.log('📊 导入统计:');
console.log(`   总计: ${Object.keys(coreTables).length}`);
console.log(`   ✅ 成功: ${successCount}`);
console.log(`   ❌ 失败: ${failCount}`);
console.log('\n🎉 完成！请刷新 Supabase Dashboard 查看数据');
