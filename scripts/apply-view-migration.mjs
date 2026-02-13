#!/usr/bin/env node
/**
 * 应用视图修复迁移
 * 执行 SQL 文件中的迁移语句
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('❌ 错误: 请设置 SUPABASE_SERVICE_ROLE_KEY 或 VITE_SUPABASE_SERVICE_ROLE_KEY 环境变量');
  console.log('');
  console.log('使用方法:');
  console.log('  set SUPABASE_SERVICE_ROLE_KEY=your_key_here && node scripts/apply-view-migration.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260223000004_fix_submission_full_details_view.sql');

async function applyMigration() {
  try {
    console.log('📖 读取迁移文件:', migrationPath);
    const sql = readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 执行迁移...');
    console.log('');
    
    // 分割 SQL 语句
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`执行语句 ${i + 1}/${statements.length}:`);
      console.log(statement.substring(0, 100) + (statement.length > 100 ? '...' : ''));
      
      // 使用 exec_sql RPC 函数执行 SQL
      const { error } = await supabase.rpc('exec_sql', { sql: statement + ';' });
      
      if (error) {
        console.error(`❌ 语句执行失败:`, error.message);
        // 如果是 "视图不存在" 错误，继续执行
        if (error.message.includes('does not exist') && statement.includes('DROP VIEW')) {
          console.log('   ⚠️  视图不存在，跳过删除操作');
          continue;
        }
        // 其他错误则退出
        process.exit(1);
      }
      
      console.log('   ✅ 成功');
      console.log('');
    }
    
    console.log('✅ 迁移应用成功！');
    
  } catch (error) {
    console.error('❌ 应用迁移失败:', error.message);
    process.exit(1);
  }
}

applyMigration();
