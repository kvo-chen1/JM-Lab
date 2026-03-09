import { execSync } from 'child_process';
import readline from 'readline';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

console.log('🚀 Supabase 直接迁移工具\n');
console.log('=' .repeat(60));
console.log('\n📋 这个方法使用 pg_dump 和 psql 直接迁移数据');
console.log('（需要安装 PostgreSQL 客户端）\n');

async function main() {
  // 获取源数据库信息（旧 Supabase）
  console.log('【源数据库】旧 Supabase 项目：');
  const sourceHost = await ask('Host (如: db.xxxxx.supabase.co): ');
  const sourceDb = await ask('Database (默认: postgres): ') || 'postgres';
  const sourcePort = await ask('Port (默认: 5432): ') || '5432';
  const sourceUser = await ask('User (如: postgres): ');
  const sourcePass = await ask('Password: ');

  console.log('\n【目标数据库】新 Supabase 项目：');
  const targetHost = await ask('Host (如: db.yyyyy.supabase.co): ');
  const targetDb = await ask('Database (默认: postgres): ') || 'postgres';
  const targetPort = await ask('Port (默认: 5432): ') || '5432';
  const targetUser = await ask('User (如: postgres): ');
  const targetPass = await ask('Password: ');

  rl.close();

  // 构建连接字符串
  const sourceConn = `postgresql://${sourceUser}:${sourcePass}@${sourceHost}:${sourcePort}/${sourceDb}`;
  const targetConn = `postgresql://${targetUser}:${targetPass}@${targetHost}:${targetPort}/${targetDb}`;

  console.log('\n' + '='.repeat(60));
  console.log('📝 迁移计划：');
  console.log(`   从: ${sourceHost}`);
  console.log(`   到: ${targetHost}`);
  console.log('\n⚠️  警告：这将覆盖目标数据库中的数据！');

  // 方案选择
  console.log('\n请选择迁移方案：');
  console.log('1. 仅迁移 public schema 的数据（推荐，跳过系统表）');
  console.log('2. 完整迁移所有数据');
  console.log('3. 仅迁移表结构');
  console.log('4. 导出到文件，然后手动导入');

  const choice = await ask('\n选择 (1-4): ');

  try {
    switch(choice) {
      case '1':
        await migratePublicOnly(sourceConn, targetConn, sourcePass, targetPass);
        break;
      case '2':
        await migrateFull(sourceConn, targetConn, sourcePass, targetPass);
        break;
      case '3':
        await migrateSchemaOnly(sourceConn, targetConn, sourcePass, targetPass);
        break;
      case '4':
        await exportToFile(sourceConn, sourcePass);
        break;
      default:
        console.log('❌ 无效选择');
    }
  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    process.exit(1);
  }
}

// 方案 1: 仅迁移 public schema 的数据
async function migratePublicOnly(sourceConn, targetConn, sourcePass, targetPass) {
  console.log('\n📦 方案 1: 迁移 public schema 数据...\n');

  const env = {
    ...process.env,
    PGPASSWORD: sourcePass
  };

  // 步骤 1: 导出 public schema 的表结构
  console.log('1️⃣  导出表结构...');
  execSync(
    `pg_dump "${sourceConn}" --schema=public --schema-only --no-owner --no-privileges > migration_schema.sql`,
    { env, stdio: 'inherit' }
  );
  console.log('✅ 表结构导出完成\n');

  // 步骤 2: 导出 public schema 的数据
  console.log('2️⃣  导出数据...');
  execSync(
    `pg_dump "${sourceConn}" --schema=public --data-only --no-owner --no-privileges > migration_data.sql`,
    { env, stdio: 'inherit' }
  );
  console.log('✅ 数据导出完成\n');

  // 步骤 3: 在目标数据库创建表结构
  console.log('3️⃣  在目标数据库创建表结构...');
  execSync(
    `psql "${targetConn}" -f migration_schema.sql`,
    { env: { ...process.env, PGPASSWORD: targetPass }, stdio: 'inherit' }
  );
  console.log('✅ 表结构创建完成\n');

  // 步骤 4: 导入数据
  console.log('4️⃣  导入数据...');
  execSync(
    `psql "${targetConn}" -f migration_data.sql`,
    { env: { ...process.env, PGPASSWORD: targetPass }, stdio: 'inherit' }
  );
  console.log('✅ 数据导入完成\n');

  // 清理临时文件
  console.log('🧹 清理临时文件...');
  try {
    execSync('del migration_schema.sql migration_data.sql');
  } catch (e) {
    // 忽略清理错误
  }

  console.log('🎉 迁移完成！');
}

// 方案 2: 完整迁移
async function migrateFull(sourceConn, targetConn, sourcePass, targetPass) {
  console.log('\n📦 方案 2: 完整迁移所有数据...\n');

  console.log('⚠️  注意：这会尝试迁移所有 schema，包括 auth、storage 等系统表');
  console.log('   Supabase 可能不允许修改系统表\n');

  const env = { ...process.env, PGPASSWORD: sourcePass };

  console.log('1️⃣  导出完整数据库...');
  execSync(
    `pg_dump "${sourceConn}" --no-owner --no-privileges > migration_full.sql`,
    { env, stdio: 'inherit' }
  );
  console.log('✅ 导出完成\n');

  console.log('2️⃣  导入到目标数据库...');
  execSync(
    `psql "${targetConn}" -f migration_full.sql`,
    { env: { ...process.env, PGPASSWORD: targetPass }, stdio: 'inherit' }
  );
  console.log('✅ 导入完成\n');

  console.log('🎉 迁移完成！');
}

// 方案 3: 仅迁移表结构
async function migrateSchemaOnly(sourceConn, targetConn, sourcePass, targetPass) {
  console.log('\n📦 方案 3: 仅迁移表结构...\n');

  const env = { ...process.env, PGPASSWORD: sourcePass };

  console.log('1️⃣  导出表结构...');
  execSync(
    `pg_dump "${sourceConn}" --schema=public --schema-only --no-owner --no-privileges > migration_schema.sql`,
    { env, stdio: 'inherit' }
  );
  console.log('✅ 导出完成\n');

  console.log('2️⃣  在目标数据库创建表结构...');
  execSync(
    `psql "${targetConn}" -f migration_schema.sql`,
    { env: { ...process.env, PGPASSWORD: targetPass }, stdio: 'inherit' }
  );
  console.log('✅ 创建完成\n');

  console.log('🎉 表结构迁移完成！');
  console.log('   数据需要另外导入');
}

// 方案 4: 导出到文件
async function exportToFile(sourceConn, sourcePass) {
  console.log('\n📦 方案 4: 导出到文件...\n');

  const filename = await ask('导出文件名 (默认: backup_export.sql): ') || 'backup_export.sql';

  const env = { ...process.env, PGPASSWORD: sourcePass };

  console.log(`1️⃣  导出到 ${filename}...`);
  execSync(
    `pg_dump "${sourceConn}" --schema=public --no-owner --no-privileges > "${filename}"`,
    { env, stdio: 'inherit' }
  );

  const stats = require('fs').statSync(filename);
  console.log(`✅ 导出完成！`);
  console.log(`   文件: ${filename}`);
  console.log(`   大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
  console.log(`\n   你可以在 Supabase SQL Editor 中执行这个文件`);
}

main().catch(console.error);
