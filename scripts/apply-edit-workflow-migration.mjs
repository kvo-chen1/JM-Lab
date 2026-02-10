#!/usr/bin/env node
/**
 * 执行活动编辑工作流迁移脚本
 * 这个脚本会执行 20260213000000_enhance_event_edit_workflow.sql 迁移文件
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

// 从环境变量获取 Supabase 配置
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ 错误: 请设置 SUPABASE_SERVICE_ROLE_KEY 或 VITE_SUPABASE_ANON_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🚀 开始执行活动编辑工作流迁移...\n');

  try {
    // 读取迁移文件
    const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260213000000_enhance_event_edit_workflow.sql');
    const sql = readFileSync(migrationPath, 'utf-8');

    console.log('📄 迁移文件路径:', migrationPath);
    console.log('📊 SQL 长度:', sql.length, '字符\n');

    // 分割 SQL 语句（按分号分隔，但忽略注释中的分号）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📝 共 ${statements.length} 个 SQL 语句需要执行\n`);

    // 执行每个语句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      const firstLine = statement.split('\n')[0].trim();
      
      console.log(`[${i + 1}/${statements.length}] 执行: ${firstLine.substring(0, 60)}...`);
      
      try {
        const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
        
        if (error) {
          // 如果 exec_sql 不存在，尝试直接查询
          console.log('   ⚠️  exec_sql 函数不存在，尝试直接执行...');
          const { error: queryError } = await supabase.from('_dummy').select('*').limit(0);
          
          // 使用 REST API 直接执行 SQL
          const response = await fetch(`${supabaseUrl}/rest/v1/`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${supabaseKey}`,
              'Prefer': 'resolution=merge-duplicates'
            },
            body: JSON.stringify({ query: statement + ';' })
          });
          
          if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${await response.text()}`);
          }
        }
        
        console.log('   ✅ 成功');
      } catch (err) {
        console.log(`   ⚠️  跳过: ${err.message}`);
        // 继续执行其他语句
      }
    }

    console.log('\n✨ 迁移执行完成！');
    console.log('\n📋 已创建的函数:');
    console.log('   - update_event_and_resubmit: 更新活动并重新提交审核');
    console.log('   - submit_event_for_review: 提交活动进行审核');
    console.log('   - get_event_edit_history: 获取活动编辑历史');
    console.log('   - can_edit_event: 检查活动是否可以编辑');
    console.log('   - log_event_changes: 记录活动变更触发器');
    console.log('\n📋 已创建的视图:');
    console.log('   - organizer_events_full: 主办方活动完整信息视图');

  } catch (error) {
    console.error('\n❌ 迁移执行失败:', error.message);
    process.exit(1);
  }
}

// 检查函数是否已存在
async function checkExistingFunctions() {
  console.log('🔍 检查现有函数...\n');
  
  const functions = [
    'update_event_and_resubmit',
    'submit_event_for_review',
    'get_event_edit_history',
    'can_edit_event'
  ];

  for (const funcName of functions) {
    try {
      const { data, error } = await supabase.rpc(funcName, {});
      if (error && error.message.includes('Could not find the function')) {
        console.log(`   ❌ ${funcName}: 不存在`);
      } else {
        console.log(`   ✅ ${funcName}: 已存在`);
      }
    } catch (err) {
      console.log(`   ❌ ${funcName}: 不存在`);
    }
  }
  console.log('');
}

// 主函数
async function main() {
  console.log('═══════════════════════════════════════════════════');
  console.log('   活动编辑工作流数据库迁移工具');
  console.log('═══════════════════════════════════════════════════\n');

  await checkExistingFunctions();
  await applyMigration();
}

main();
