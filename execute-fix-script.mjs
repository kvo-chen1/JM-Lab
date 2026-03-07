#!/usr/bin/env node
/**
 * 执行单个 SQL 修复文件
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

const databaseUrl = process.env.POSTGRES_URL_NON_POOLING || 
                   process.env.DATABASE_URL || 
                   process.env.NEON_DATABASE_URL ||
                   process.env.NEON_URL;

if (!databaseUrl) {
  console.error('❌ 错误: 未找到数据库连接字符串');
  process.exit(1);
}

const client = new Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false }
});

function splitSqlStatements(sql) {
  const statements = [];
  let currentStatement = '';
  let inFunction = false;
  let inDoBlock = false;
  let dollarQuote = '';
  
  const lines = sql.split('\n');
  
  for (const line of lines) {
    const trimmedLine = line.trim();
    
    if (trimmedLine.startsWith('--') || trimmedLine === '') {
      continue;
    }
    
    // 检测 DO 语句块开始
    if (trimmedLine.match(/^DO\s*\$\$/)) {
      inDoBlock = true;
      dollarQuote = '$$';
    }
    // 检测函数开始
    else if (trimmedLine.includes('CREATE OR REPLACE FUNCTION') || 
             trimmedLine.includes('CREATE FUNCTION')) {
      inFunction = true;
    }
    
    // 检测 $$ 标记
    if (trimmedLine.includes('$$')) {
      const matches = trimmedLine.match(/\$\$/g);
      if (matches) {
        if (inDoBlock && trimmedLine.endsWith('$$;')) {
          inDoBlock = false;
        }
      }
    }
    
    currentStatement += line + '\n';
    
    // 语句结束
    if (trimmedLine.endsWith(';') && !inFunction && !inDoBlock) {
      statements.push(currentStatement.trim());
      currentStatement = '';
    }
    // 函数结束
    else if (trimmedLine.match(/^\$\$\s*LANGUAGE/) && inFunction) {
      inFunction = false;
    }
  }
  
  if (currentStatement.trim()) {
    statements.push(currentStatement.trim());
  }
  
  return statements.filter(s => s.length > 0);
}

async function main() {
  const sqlFile = process.argv[2] || 'scripts/fix-ip-partnerships.sql';
  const filePath = path.join(__dirname, sqlFile);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ 文件不存在: ${sqlFile}`);
    process.exit(1);
  }
  
  try {
    await client.connect();
    console.log('✅ 数据库连接成功\n');
    
    const sql = fs.readFileSync(filePath, 'utf-8');
    const statements = splitSqlStatements(sql);
    
    console.log(`📄 执行: ${sqlFile}`);
    console.log(`   找到 ${statements.length} 个 SQL 语句\n`);
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const firstLine = statement.split('\n')[0].trim();
      
      try {
        await client.query(statement);
        process.stdout.write('✅');
      } catch (error) {
        if (error.message.includes('already exists')) {
          process.stdout.write('⏭️');
        } else {
          process.stdout.write('❌');
          console.error(`\n⚠️  语句 ${i + 1} 执行失败:`);
          console.error(`   错误: ${error.message}`);
        }
      }
    }
    
    console.log('\n\n🎉 执行完成！');
    
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

main();
