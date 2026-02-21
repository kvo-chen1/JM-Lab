// 应用奖品表迁移脚本
// 创建 event_prizes 和 prize_winners 表

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Supabase 配置
const supabaseUrl = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 读取 SQL 文件
const sqlFilePath = path.join(process.cwd(), 'supabase', 'migrations', '20250217000001_create_prize_tables.sql');
const sqlContent = fs.readFileSync(sqlFilePath, 'utf-8');

// 分割 SQL 语句（按分号分割，但忽略在字符串中的分号）
function splitSqlStatements(sql) {
  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = null;

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    const prevChar = i > 0 ? sql[i - 1] : null;

    // 处理字符串
    if ((char === "'" || char === '"') && prevChar !== '\\') {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
    }

    // 如果在字符串外遇到分号，则分割
    if (char === ';' && !inString) {
      const stmt = current.trim();
      if (stmt) {
        statements.push(stmt + ';');
      }
      current = '';
    } else {
      current += char;
    }
  }

  // 处理最后一条语句
  const lastStmt = current.trim();
  if (lastStmt) {
    statements.push(lastStmt);
  }

  return statements.filter(stmt => stmt.length > 0);
}

// 执行 SQL 语句
async function executeMigration() {
  console.log('='.repeat(80));
  console.log('开始执行奖品表迁移...');
  console.log('='.repeat(80));

  const statements = splitSqlStatements(sqlContent);
  console.log(`共 ${statements.length} 条 SQL 语句需要执行\n`);

  let successCount = 0;
  let errorCount = 0;
  let skipCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    const stmtPreview = stmt.substring(0, 80).replace(/\n/g, ' ');

    try {
      // 使用 Supabase 的 rpc 执行 SQL
      const { data, error } = await supabase.rpc('exec_sql', { sql: stmt });

      if (error) {
        // 如果 exec_sql 函数不存在，尝试直接执行
        if (error.message.includes('exec_sql')) {
          console.log(`[${i + 1}/${statements.length}] ⚠️  跳过: ${stmtPreview}...`);
          console.log(`    原因: exec_sql 函数不存在`);
          console.log(`    请手动在 Supabase Dashboard 中执行此 SQL\n`);
          skipCount++;
          continue;
        }

        // 忽略 "已存在" 类型的错误
        if (error.message.includes('already exists') ||
            error.message.includes('duplicate') ||
            error.message.includes('AlreadyExists')) {
          console.log(`[${i + 1}/${statements.length}] ⚠️  已存在，跳过: ${stmtPreview}...`);
          skipCount++;
          continue;
        }

        throw error;
      }

      console.log(`[${i + 1}/${statements.length}] ✅ 成功: ${stmtPreview}...`);
      successCount++;
    } catch (error) {
      console.log(`[${i + 1}/${statements.length}] ❌ 失败: ${stmtPreview}...`);
      console.log(`    错误: ${error.message}\n`);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(80));
  console.log('迁移执行完成');
  console.log('='.repeat(80));
  console.log(`✅ 成功: ${successCount} 条`);
  console.log(`⚠️  跳过: ${skipCount} 条 (已存在或不适用)`);
  console.log(`❌ 失败: ${errorCount} 条`);

  if (errorCount > 0 || skipCount > 0) {
    console.log('\n注意: 部分语句执行失败或需要手动执行。');
    console.log('请访问 Supabase Dashboard 手动执行 SQL:');
    console.log('https://supabase.com/dashboard/project/pptqdicaaewtnaiflfcs/sql/new');
    console.log(`\nSQL 文件路径: ${sqlFilePath}`);
  }

  // 验证表是否创建成功
  console.log('\n' + '='.repeat(80));
  console.log('验证表是否存在...');
  console.log('='.repeat(80));

  try {
    const { data, error } = await supabase
      .from('event_prizes')
      .select('id')
      .limit(1);

    if (error) {
      console.log(`❌ event_prizes 表验证失败: ${error.message}`);
    } else {
      console.log(`✅ event_prizes 表已存在并可访问`);
    }
  } catch (e) {
    console.log(`❌ event_prizes 表验证失败: ${e.message}`);
  }

  try {
    const { data, error } = await supabase
      .from('prize_winners')
      .select('id')
      .limit(1);

    if (error) {
      console.log(`❌ prize_winners 表验证失败: ${error.message}`);
    } else {
      console.log(`✅ prize_winners 表已存在并可访问`);
    }
  } catch (e) {
    console.log(`❌ prize_winners 表验证失败: ${e.message}`);
  }
}

executeMigration().catch(console.error);
