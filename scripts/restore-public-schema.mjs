import { execSync } from 'child_process';
import fs from 'fs';
import readline from 'readline';

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

console.log('🔄 正在从备份文件恢复 public schema 数据...');
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

console.log('⏳ 正在读取备份文件并过滤 public schema...\n');

// 读取备份文件并只保留 public schema 的内容
const fileStream = fs.createReadStream(backupFile);
const rl = readline.createInterface({
  input: fileStream,
  crlfDelay: Infinity
});

let publicSection = false;
let skipSection = false;
const publicLines = [];

// 添加必要的设置
publicLines.push('SET statement_timeout = 0;');
publicLines.push('SET lock_timeout = 0;');
publicLines.push('SET client_encoding = \'UTF8\';');
publicLines.push('SET standard_conforming_strings = on;');
publicLines.push('SET check_function_bodies = false;');
publicLines.push('SET client_min_messages = warning;');
publicLines.push('SET row_security = off;');
publicLines.push('');

for await (const line of rl) {
  // 检测 schema 开始
  if (line.includes('Schema: public') || line.includes('CREATE SCHEMA public')) {
    publicSection = true;
    skipSection = false;
    publicLines.push(line);
    continue;
  }
  
  // 检测其他 schema 开始，跳过
  if (line.match(/Schema: (auth|extensions|graphql|graphql_public|pgbouncer|realtime|storage|supabase_migrations|vault)/)) {
    publicSection = false;
    skipSection = true;
    continue;
  }
  
  // 跳过其他 schema 的 CREATE SCHEMA 语句
  if (line.match(/CREATE SCHEMA (auth|extensions|graphql|graphql_public|pgbouncer|realtime|storage|supabase_migrations|vault)/)) {
    skipSection = true;
    continue;
  }
  
  // 跳过 ALTER SCHEMA ... OWNER 语句
  if (line.match(/ALTER SCHEMA .* OWNER TO/)) {
    continue;
  }
  
  // 跳过权限相关的语句
  if (line.includes('GRANT') || line.includes('REVOKE')) {
    continue;
  }
  
  // 跳过 OWNER TO 语句
  if (line.includes('OWNER TO')) {
    continue;
  }
  
  // 如果在 public section 中，保留该行
  if (publicSection && !skipSection) {
    publicLines.push(line);
  }
  
  // 检测表数据部分 - public schema 的表数据
  if (line.includes('public.')) {
    publicLines.push(line);
  }
}

console.log(`✅ 过滤完成，共 ${publicLines.length} 行 public schema 数据`);
console.log('⏳ 开始导入到数据库...\n');

// 分批导入，避免内存问题
const batchSize = 1000;
let importedLines = 0;

for (let i = 0; i < publicLines.length; i += batchSize) {
  const batch = publicLines.slice(i, i + batchSize).join('\n');
  
  try {
    execSync(
      `psql "${targetConn}"`,
      {
        input: batch,
        env,
        encoding: 'utf-8',
        timeout: 300000, // 5分钟
        maxBuffer: 1024 * 1024 * 20 // 20MB
      }
    );
    
    importedLines += batchSize;
    const progress = Math.min((importedLines / publicLines.length) * 100, 100);
    console.log(`📊 进度: ${progress.toFixed(1)}% (${Math.min(importedLines, publicLines.length)}/${publicLines.length} 行)`);
    
  } catch (error) {
    console.error(`❌ 批次导入失败 (行 ${i}-${i + batchSize}):`, error.message.substring(0, 200));
    // 继续下一批
  }
}

console.log('');
console.log('✅ 导入完成！');
console.log('🎉 请刷新 Supabase Dashboard 查看数据');
