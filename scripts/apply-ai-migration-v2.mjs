/**
 * AI助手功能数据库迁移脚本 V2
 * 使用 Supabase Management API 执行 SQL
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

console.log('🚀 开始应用 AI 助手数据库迁移...\n');
console.log('📍 Supabase URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 读取迁移文件
const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260219000000_create_ai_assistant_tables.sql');
const migrationSQL = readFileSync(migrationPath, 'utf-8');

// 提取项目引用
const projectRef = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)?.[1];

if (!projectRef) {
  console.error('❌ 无法从 URL 提取项目引用');
  process.exit(1);
}

async function applyMigration() {
  try {
    console.log('📤 正在发送 SQL 到 Supabase...\n');

    // 使用 Supabase Management API 执行 SQL
    const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseServiceKey}`
      },
      body: JSON.stringify({
        query: migrationSQL
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('❌ 迁移失败:', errorData);
      
      // 尝试分步执行
      console.log('\n⚠️ 尝试分步执行 SQL...\n');
      await applyMigrationStepByStep();
      return;
    }

    const result = await response.json();
    console.log('✅ 迁移成功！');
    console.log('📊 结果:', JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error('❌ 迁移异常:', error.message);
    console.log('\n⚠️ 尝试分步执行 SQL...\n');
    await applyMigrationStepByStep();
  }
}

async function applyMigrationStepByStep() {
  // 分割 SQL 语句
  const statements = migrationSQL
    .split(/;\s*(?=CREATE|ALTER|INSERT|UPDATE|DELETE|DROP|SELECT|GRANT|REVOKE|COMMENT)/i)
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📄 找到 ${statements.length} 个 SQL 语句\n`);

  let successCount = 0;
  let errorCount = 0;
  let skippedCount = 0;

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i] + ';';
    const shortDesc = statement.split('\n')[0].substring(0, 60);
    
    try {
      const response = await fetch(`https://api.supabase.com/v1/projects/${projectRef}/database/sql`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({
          query: statement
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        const errorMessage = errorData.message || JSON.stringify(errorData);
        
        // 忽略 "已存在" 错误
        if (errorMessage.includes('already exists') || 
            errorMessage.includes('duplicate') ||
            errorMessage.includes('AlreadyExists')) {
          console.log(`  ⚠️  已存在: ${shortDesc}...`);
          skippedCount++;
        } else {
          console.error(`  ❌ 失败: ${shortDesc}...`);
          console.error(`     错误: ${errorMessage.substring(0, 200)}`);
          errorCount++;
        }
      } else {
        console.log(`  ✅ 成功: ${shortDesc}...`);
        successCount++;
      }
      
      // 添加小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 100));
      
    } catch (error) {
      const errorMessage = error.message || String(error);
      
      // 忽略 "已存在" 错误
      if (errorMessage.includes('already exists') || 
          errorMessage.includes('duplicate') ||
          errorMessage.includes('AlreadyExists')) {
        console.log(`  ⚠️  已存在: ${shortDesc}...`);
        skippedCount++;
      } else {
        console.error(`  ❌ 失败: ${shortDesc}...`);
        console.error(`     错误: ${errorMessage.substring(0, 200)}`);
        errorCount++;
      }
    }
  }

  console.log(`\n📊 迁移结果:`);
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ⚠️  已存在: ${skippedCount}`);
  console.log(`   ❌ 失败: ${errorCount}`);

  if (errorCount === 0) {
    console.log('\n🎉 迁移完成！');
  } else {
    console.log('\n⚠️  迁移部分完成，请检查错误信息');
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
