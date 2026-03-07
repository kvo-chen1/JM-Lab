#!/usr/bin/env node
/**
 * 执行 SQL 修复脚本
 * 使用 Node.js pg 客户端执行 SQL 文件
 */

import pg from 'pg';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const { Client } = pg;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local'), override: true });

// 获取数据库连接字符串
const getDatabaseUrl = () => {
  return process.env.POSTGRES_URL_NON_POOLING || 
         process.env.DATABASE_URL || 
         process.env.NEON_DATABASE_URL ||
         process.env.NEON_URL;
};

const databaseUrl = getDatabaseUrl();

if (!databaseUrl) {
  console.error('❌ 错误: 未找到数据库连接字符串');
  console.error('请确保以下环境变量之一已设置:');
  console.error('  - POSTGRES_URL_NON_POOLING');
  console.error('  - DATABASE_URL');
  console.error('  - NEON_DATABASE_URL');
  console.error('  - NEON_URL');
  process.exit(1);
}

console.log('✅ 已找到数据库连接字符串');
console.log(`   数据库: ${databaseUrl.split('@')[1]?.split('/')[0] || 'unknown'}`);

// 创建数据库客户端
const client = new Client({
  connectionString: databaseUrl,
  ssl: {
    rejectUnauthorized: false
  }
});

// 分割 SQL 文件为单独的语句
function splitSqlStatements(sql) {
  const statements = [];
  let currentStatement = '';
  let inFunction = false;
  let functionDepth = 0;
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    // 跳过注释和空行
    if (trimmedLine.startsWith('--') || trimmedLine === '') {
      continue;
    }
    
    // 检测函数开始
    if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || 
        trimmedLine.includes('CREATE FUNCTION')) {
      inFunction = true;
    }
    
    // 检测函数体内的 $$ 标记
    if (trimmedLine.includes('$$')) {
      functionDepth += (trimmedLine.match(/\$\$/g) || []).length;
      if (functionDepth % 2 === 0 && inFunction) {
        inFunction = false;
        functionDepth = 0;
      }
    }
    
    currentStatement += line + '\n';
    
    // 语句结束（分号且不在函数体内）
    if (trimmedLine.endsWith(';') && !inFunction) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
  }
  
  // 处理 DO 语句块
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  return statements.filter(s => s.length > 0);
}

async function executeSqlFile(filePath) {
  const sql = fs.readFileSync(filePath, 'utf-8');
  const statements = splitSqlStatements(sql);
  
  console.log(`📄 执行: ${path.basename(filePath)}`);
  console.log(`   找到 ${statements.length} 个 SQL 语句`);
  
  let successCount = 0;
  let skipCount = 0;
  let errorCount = 0;
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const firstLine = statement.split('\n')[0].trim();
    
    try {
      await client.query(statement);
      successCount++;
      process.stdout.write('.');
    } catch (error) {
      // 忽略已存在的错误
      if (error.message.includes('already exists') || 
          error.message.includes('Duplicate') ||
          error.message.includes('already a member')) {
        skipCount++;
        process.stdout.write('o');
      } else {
        errorCount++;
        process.stdout.write('x');
        console.error(`\n⚠️  语句 ${i + 1} 执行失败:`);
        console.error(`   ${firstLine.substring(0, 80)}...`);
        console.error(`   错误: ${error.message}`);
      }
    }
  }
  
  console.log(`\n   ✅ 成功: ${successCount}, ⏭️  跳过: ${skipCount}, ❌ 错误: ${errorCount}\n`);
  return { successCount, skipCount, errorCount };
}

async function main() {
  try {
    console.log('\n🚀 开始执行 SQL 修复脚本...\n');
    
    // 连接数据库
    await client.connect();
    console.log('✅ 数据库连接成功\n');
    
    // SQL 文件列表
    const sqlFiles = [
      'scripts/create-missing-tables.sql',
      'scripts/create-missing-functions.sql'
    ];
    
    let totalSuccess = 0;
    let totalSkip = 0;
    let totalError = 0;
    
    for (const sqlFile of sqlFiles) {
      const filePath = path.join(__dirname, sqlFile);
      
      if (!fs.existsSync(filePath)) {
        console.error(`❌ 文件不存在: ${sqlFile}\n`);
        continue;
      }
      
      const result = await executeSqlFile(filePath);
      totalSuccess += result.successCount;
      totalSkip += result.skipCount;
      totalError += result.errorCount;
    }
    
    console.log('🎉 所有 SQL 修复脚本执行完成！');
    console.log(`\n📊 总计: ✅ 成功: ${totalSuccess}, ⏭️  跳过: ${totalSkip}, ❌ 错误: ${totalError}`);
    
    if (totalError === 0) {
      console.log('\n📋 已创建的函数:');
      console.log('  - get_user_ip_stats: 获取用户IP统计');
      console.log('  - create_ip_asset_with_stages: 创建IP资产及其阶段');
      console.log('  - update_stage_completion: 更新阶段完成状态');
      console.log('\n📋 已创建的表:');
      console.log('  - ip_partnerships: IP合作表');
    }
    
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
