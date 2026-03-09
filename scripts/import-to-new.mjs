import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

console.log('🚀 导入数据到新 Supabase 项目\n');
console.log('=' .repeat(60));

async function main() {
  // 新数据库连接信息（用户提供）
  const targetHost = 'aws-1-ap-southeast-1.pooler.supabase.com';
  const targetPort = '6543';
  const targetDb = 'postgres';
  const targetUser = 'postgres.kizgwtrrsmkjeiddotup';
  const targetPass = '7XpgH64EZXLhMhBX';

  console.log('\n📋 目标数据库信息：');
  console.log(`   Host: ${targetHost}`);
  console.log(`   Port: ${targetPort}`);
  console.log(`   Database: ${targetDb}`);
  console.log(`   User: ${targetUser}`);

  const targetConn = `postgresql://${targetUser}:${targetPass}@${targetHost}:${targetPort}/${targetDb}?sslmode=require`;

  // 选择导入方式
  console.log('\n请选择导入方式：');
  console.log('1. 使用 backup.sql 完整导入（可能太大）');
  console.log('2. 使用 import_batches/ 分批导入（推荐）');
  console.log('3. 仅创建表结构');

  const choice = await ask('\n选择 (1-3): ');

  switch(choice) {
    case '1':
      await importFullBackup(targetConn, targetPass);
      break;
    case '2':
      await importBatches(targetConn, targetPass);
      break;
    case '3':
      await createSchemaOnly(targetConn, targetPass);
      break;
    default:
      console.log('❌ 无效选择');
  }

  rl.close();
}

// 方案 1: 完整导入 backup.sql
async function importFullBackup(targetConn, targetPass) {
  console.log('\n📦 使用 backup.sql 完整导入...');
  console.log('⚠️  文件较大（12.4 MB），可能会失败\n');

  const env = { ...process.env, PGPASSWORD: targetPass };

  try {
    execSync(
      `psql "${targetConn}" -f "c:\\git-repo\\backup.sql"`,
      { env, stdio: 'inherit' }
    );
    console.log('\n✅ 导入完成！');
  } catch (error) {
    console.log('\n❌ 导入失败，文件可能太大');
    console.log('   建议使用分批导入（选项 2）');
  }
}

// 方案 2: 分批导入
async function importBatches(targetConn, targetPass) {
  const batchDir = 'c:\\git-repo\\import_batches';

  console.log('\n📦 分批导入数据...\n');

  // 获取所有 SQL 文件
  const sqlFiles = fs.readdirSync(batchDir)
    .filter(f => f.endsWith('.sql') && f !== 'IMPORT_GUIDE.md')
    .sort();

  console.log(`找到 ${sqlFiles.length} 个批次文件\n`);

  const env = { ...process.env, PGPASSWORD: targetPass };
  let successCount = 0;
  let failCount = 0;

  for (let i = 0; i < sqlFiles.length; i++) {
    const file = sqlFiles[i];
    const filePath = path.join(batchDir, file);

    console.log(`[${i + 1}/${sqlFiles.length}] 导入: ${file}`);

    try {
      execSync(
        `psql "${targetConn}" -f "${filePath}"`,
        { env, stdio: 'pipe' }
      );
      console.log(`    ✅ 成功`);
      successCount++;
    } catch (error) {
      console.log(`    ❌ 失败`);
      failCount++;
    }

    // 小延迟
    if (i < sqlFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 导入统计:');
  console.log(`   总计: ${sqlFiles.length}`);
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ❌ 失败: ${failCount}`);

  // 验证
  console.log('\n📊 验证数据...');
  try {
    const result = execSync(
      `psql "${targetConn}" -c "SELECT tablename, n_tup_ins FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY n_tup_ins DESC LIMIT 10;"`,
      { env, encoding: 'utf-8' }
    );
    console.log('\n数据量统计:');
    console.log(result);
  } catch (error) {
    console.log('⚠️  无法获取统计数据');
  }
}

// 方案 3: 仅创建表结构
async function createSchemaOnly(targetConn, targetPass) {
  console.log('\n📦 仅创建表结构...\n');

  const env = { ...process.env, PGPASSWORD: targetPass };

  try {
    execSync(
      `psql "${targetConn}" -f "c:\\git-repo\\create_all_tables_full.sql"`,
      { env, stdio: 'inherit' }
    );
    console.log('\n✅ 表结构创建完成！');
  } catch (error) {
    console.log('\n❌ 创建失败');
    console.log(error.message);
  }
}

main().catch(console.error);
