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
  console.log('  set SUPABASE_SERVICE_ROLE_KEY=your_key_here && node scripts/apply-view-fix.mjs');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

const migrationPath = join(__dirname, '..', 'supabase', 'migrations', '20260223000007_fix_submission_score_summary_view.sql');

async function applyMigration() {
  try {
    console.log('📖 读取迁移文件:', migrationPath);
    const sql = readFileSync(migrationPath, 'utf8');
    
    console.log('🔄 执行迁移...');
    console.log('');
    
    // 执行整个 SQL 文件
    console.log('执行 SQL...');
    const { error } = await supabase.rpc('exec_sql', { sql });
    
    if (error) {
      console.error('❌ SQL 执行失败:', error.message);
      process.exit(1);
    }
    
    console.log('✅ 迁移应用成功！');
    
  } catch (error) {
    console.error('❌ 应用迁移失败:', error.message);
    process.exit(1);
  }
}

applyMigration();
