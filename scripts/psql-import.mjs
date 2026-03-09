import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import readline from 'readline';

const DATA_DIR = 'c:\\git-repo\\import_batches';
const CREATE_TABLES_FILE = 'c:\\git-repo\\create_all_tables_full.sql';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const ask = (q) => new Promise(resolve => rl.question(q, resolve));

async function main() {
  console.log('🚀 Supabase 数据导入工具 (使用 psql)\n');
  console.log('=' .repeat(60));

  // 获取连接信息
  console.log('\n📋 请提供 Supabase 连接信息：');
  console.log('(可以在 Supabase Dashboard -> Settings -> Database 中找到)\n');

  const host = await ask('Host (如: db.xxxxx.supabase.co): ');
  const database = await ask('Database (默认: postgres): ') || 'postgres';
  const port = await ask('Port (默认: 5432): ') || '5432';
  const user = await ask('User (如: postgres): ');
  const password = await ask('Password: ');

  rl.close();

  if (!host || !user || !password) {
    console.log('❌ 错误：必须提供 Host、User 和 Password');
    process.exit(1);
  }

  // 构建连接字符串
  const connectionString = `postgresql://${user}:${password}@${host}:${port}/${database}`;

  console.log('\n✅ 连接信息已配置');
  console.log(`   Host: ${host}`);
  console.log(`   Database: ${database}`);
  console.log(`   User: ${user}\n`);

  // 步骤 1: 创建表结构
  console.log('📦 步骤 1: 创建表结构...');
  try {
    execSync(`psql "${connectionString}" -f "${CREATE_TABLES_FILE}"`, {
      stdio: 'inherit',
      env: { ...process.env, PGPASSWORD: password }
    });
    console.log('✅ 表结构创建成功！\n');
  } catch (error) {
    console.log('⚠️  表结构创建可能已存在或出错，继续导入数据...\n');
  }

  // 步骤 2: 获取所有 SQL 文件并排序
  const sqlFiles = fs.readdirSync(DATA_DIR)
    .filter(f => f.endsWith('.sql') && f !== 'IMPORT_GUIDE.md')
    .sort();

  console.log(`📊 找到 ${sqlFiles.length} 个数据文件需要导入\n`);

  // 步骤 3: 导入数据
  console.log('📦 步骤 2: 导入数据...\n');

  let successCount = 0;
  let failCount = 0;
  const failedFiles = [];

  for (let i = 0; i < sqlFiles.length; i++) {
    const file = sqlFiles[i];
    const filePath = path.join(DATA_DIR, file);

    console.log(`[${i + 1}/${sqlFiles.length}] 导入: ${file}`);

    try {
      execSync(`psql "${connectionString}" -f "${filePath}"`, {
        stdio: 'pipe',
        env: { ...process.env, PGPASSWORD: password }
      });
      console.log(`    ✅ 成功`);
      successCount++;
    } catch (error) {
      console.log(`    ❌ 失败`);
      failCount++;
      failedFiles.push(file);
    }

    // 小延迟，避免过于频繁的请求
    if (i < sqlFiles.length - 1) {
      await new Promise(resolve => setTimeout(resolve, 500));
    }
  }

  // 显示结果
  console.log('\n' + '='.repeat(60));
  console.log('📊 导入完成统计:');
  console.log(`   总计: ${sqlFiles.length}`);
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ❌ 失败: ${failCount}`);

  if (failedFiles.length > 0) {
    console.log('\n❌ 失败的文件:');
    failedFiles.forEach(f => console.log(`   - ${f}`));

    // 保存失败记录
    fs.writeFileSync('failed_imports.txt', failedFiles.join('\n'));
    console.log('\n📝 失败记录已保存到: failed_imports.txt');
  }

  // 步骤 4: 验证数据
  console.log('\n📦 步骤 3: 验证数据...');
  try {
    const result = execSync(`psql "${connectionString}" -c "SELECT tablename, n_tup_ins FROM pg_stat_user_tables WHERE schemaname = 'public' ORDER BY n_tup_ins DESC LIMIT 10;"`, {
      encoding: 'utf-8',
      env: { ...process.env, PGPASSWORD: password }
    });
    console.log('\n📈 数据量统计 (前10):');
    console.log(result);
  } catch (error) {
    console.log('⚠️  无法获取统计数据');
  }

  console.log('\n🎉 导入流程结束！');
}

main().catch(error => {
  console.error('❌ 程序错误:', error.message);
  process.exit(1);
});
