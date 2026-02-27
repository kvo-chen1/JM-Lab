/**
 * AI反馈表数据库迁移脚本
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// 加载环境变量
dotenv.config({ path: join(__dirname, '..', '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 错误: 缺少 Supabase 配置');
  console.log('请确保 .env 文件中包含 VITE_SUPABASE_URL 和 VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

console.log('🚀 开始应用 AI 反馈表数据库迁移...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 读取迁移文件
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260226000031_create_ai_feedback_table.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

// 分割 SQL 语句
const statements = migrationSQL
  .split(';')
  .map(s => s.trim())
  .filter(s => s.length > 0 && !s.startsWith('--'));

async function applyMigration() {
  console.log(`📄 找到 ${statements.length} 个 SQL 语句\n`);

  let successCount = 0;
  let errorCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const shortDesc = statement.split('\n')[0].substring(0, 60);

    try {
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });

      if (error) {
        // 如果 exec_sql 函数不存在，尝试直接执行
        const response = await fetch(`${supabaseUrl}/rest/v1/`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${supabaseServiceKey}`,
            'apikey': supabaseServiceKey
          },
          body: JSON.stringify({ query: statement + ';' })
        });

        if (!response.ok) {
          const errorText = await response.text();
          // 忽略 "已存在" 错误
          if (errorText.includes('already exists') || errorText.includes('duplicate')) {
            console.log(`  ⚠️  已存在: ${shortDesc}...`);
            successCount++;
          } else {
            console.error(`  ❌ 失败: ${shortDesc}...`);
            console.error(`     错误: ${errorText.substring(0, 200)}`);
            errorCount++;
          }
        } else {
          console.log(`  ✅ 成功: ${shortDesc}...`);
          successCount++;
        }
      } else {
        console.log(`  ✅ 成功: ${shortDesc}...`);
        successCount++;
      }
    } catch (error) {
      const errorMessage = error.message || String(error);
      // 忽略 "已存在" 错误
      if (errorMessage.includes('already exists') || errorMessage.includes('duplicate')) {
        console.log(`  ⚠️  已存在: ${shortDesc}...`);
        successCount++;
      } else {
        console.error(`  ❌ 失败: ${shortDesc}...`);
        console.error(`     错误: ${errorMessage.substring(0, 200)}`);
        errorCount++;
      }
    }
  }

  console.log(`\n📊 迁移结果:`);
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ❌ 失败: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 迁移完成！');
  } else {
    console.log('\n⚠️  迁移部分完成，请检查错误信息');
    process.exit(1);
  }
}

// 测试连接
async function testConnection() {
  try {
    const { data, error } = await supabase.from('users').select('count', { count: 'exact', head: true });
    if (error) {
      console.error('❌ 数据库连接失败:', error.message);
      process.exit(1);
    }
    console.log('✅ 数据库连接成功\n');
    return true;
  } catch (error) {
    console.error('❌ 数据库连接失败:', error.message);
    process.exit(1);
  }
}

// 主函数
async function main() {
  await testConnection();
  await applyMigration();
}

main().catch(console.error);
