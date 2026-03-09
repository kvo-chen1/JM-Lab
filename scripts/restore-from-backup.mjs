import { execSync } from 'child_process';
import fs from 'fs';

const PSQL_PATH = 'C:\\postgresql\\pgsql\\bin';
process.env.PATH = `${process.env.PATH};${PSQL_PATH}`;

const targetHost = 'db.kizgwtrrsmkjeiddotup.supabase.co';
const targetPort = '5432';
const targetDb = 'postgres';
const targetUser = 'postgres';
const targetPass = 'csh200506207837';

const targetConn = `postgresql://${targetUser}:${targetPass}@${targetHost}:${targetPort}/${targetDb}`;
const env = { ...process.env, PGPASSWORD: targetPass };

const backupFile = 'c:\\git-repo\\backup.sql';

console.log('🔄 正在从备份文件恢复数据库...');
console.log(`📁 备份文件: ${backupFile}`);
console.log(`🎯 目标数据库: ${targetHost}`);
console.log('');

// 检查备份文件是否存在
if (!fs.existsSync(backupFile)) {
  console.error('❌ 备份文件不存在:', backupFile);
  process.exit(1);
}

const stats = fs.statSync(backupFile);
console.log(`📊 备份文件大小: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);
console.log('');

console.log('⚠️  警告: 这将删除现有表并重新创建！');
console.log('⏳ 开始恢复，请耐心等待...\n');

try {
  // 使用 psql 执行备份文件
  const result = execSync(
    `psql "${targetConn}"`,
    {
      input: fs.readFileSync(backupFile, 'utf-8'),
      env,
      encoding: 'utf-8',
      timeout: 600000, // 10分钟超时
      maxBuffer: 1024 * 1024 * 50 // 50MB 缓冲区
    }
  );

  console.log('✅ 数据库恢复成功！');
  console.log('');
  console.log('📋 恢复内容:');
  console.log('  - 所有表结构');
  console.log('  - 所有数据');
  console.log('  - 索引和约束');
  console.log('  - 函数和触发器');
  console.log('  - RLS 策略');
  console.log('');
  console.log('🎉 请刷新 Supabase Dashboard 查看数据');

} catch (error) {
  console.error('❌ 恢复失败:', error.message);
  if (error.stderr) {
    console.error('错误详情:', error.stderr.substring(0, 500));
  }
  process.exit(1);
}
