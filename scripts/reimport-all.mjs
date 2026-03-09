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

console.log('🔄 重新导入所有数据...\n');

// 获取所有 SQL 文件
const sqlFiles = fs.readdirSync(batchDir)
  .filter(f => f.endsWith('.sql') && f !== 'IMPORT_GUIDE.md')
  .sort();

console.log(`找到 ${sqlFiles.length} 个文件需要导入\n`);

let successCount = 0;
let failCount = 0;

for (let i = 0; i < sqlFiles.length; i++) {
  const file = sqlFiles[i];
  const filePath = path.join(batchDir, file);

  console.log(`[${i + 1}/${sqlFiles.length}] 导入: ${file}`);

  try {
    // 使用 < 重定向而不是 -f 参数
    // 增加超时时间到 5 分钟，处理大型 SQL 文件
    const result = execSync(
      `psql "${targetConn}" < "${filePath}" 2>&1`,
      { env, encoding: 'utf-8', timeout: 300000, maxBuffer: 1024 * 1024 * 10 }
    );

    // 检查是否包含 COPY 成功信息
    if (result.includes('COPY') || result.includes('INSERT') || result === '') {
      console.log(`    ✅ 成功`);
      successCount++;
    } else {
      console.log(`    ⚠️  可能失败: ${result.substring(0, 100)}`);
      failCount++;
    }
  } catch (error) {
    console.log(`    ❌ 失败: ${error.message.substring(0, 100)}`);
    failCount++;
  }

  // 小延迟
  if (i < sqlFiles.length - 1) {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

console.log('\n' + '='.repeat(60));
console.log('📊 导入统计:');
console.log(`   总计: ${sqlFiles.length}`);
console.log(`   ✅ 成功: ${successCount}`);
console.log(`   ❌ 失败: ${failCount}`);
console.log('\n🎉 完成！请刷新 Supabase Dashboard 查看数据');
