#!/usr/bin/env node
/**
 * 应用 users 表 status 字段迁移
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });
dotenv.config({ path: path.join(__dirname, '.env.local') });

// 从环境变量或默认值获取 Supabase 配置
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ 错误: 未设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  console.error('请在 .env.local 文件中设置 VITE_SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function applyMigration() {
  console.log('🔄 应用 users 表 status 字段迁移...\n');

  try {
    // 读取迁移文件
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260225000001_add_users_status_column.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('迁移文件内容:');
    console.log(migrationSql);
    console.log('\n---\n');

    // 尝试直接执行 SQL
    console.log('执行迁移...');
    
    // 1. 添加 status 字段
    const { error: alterError } = await supabase.rpc('exec_sql', { 
      sql: `ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'banned', 'pending'));` 
    });

    if (alterError) {
      console.log('⚠️ 添加字段时出错 (可能已存在):', alterError.message);
    } else {
      console.log('✅ status 字段添加成功');
    }

    // 2. 设置默认值为 'active'
    const { error: updateError } = await supabase.rpc('exec_sql', { 
      sql: `UPDATE public.users SET status = 'active' WHERE status IS NULL;` 
    });

    if (updateError) {
      console.log('⚠️ 更新现有数据时出错:', updateError.message);
    } else {
      console.log('✅ 现有用户状态已更新为 active');
    }

    // 3. 添加索引
    const { error: indexError } = await supabase.rpc('exec_sql', { 
      sql: `CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);` 
    });

    if (indexError) {
      console.log('⚠️ 创建索引时出错:', indexError.message);
    } else {
      console.log('✅ 索引创建成功');
    }

    // 4. 验证迁移结果
    console.log('\n验证迁移结果...');
    const { data: columns, error: checkError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, column_default')
      .eq('table_schema', 'public')
      .eq('table_name', 'users')
      .eq('column_name', 'status');

    if (checkError) {
      console.error('❌ 验证失败:', checkError.message);
      return;
    }

    if (columns && columns.length > 0) {
      console.log('✅ status 字段已成功添加到 users 表');
      console.log('字段信息:', columns[0]);
    } else {
      console.error('❌ status 字段未找到');
    }

    // 5. 检查现有用户的状态
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, username, status')
      .limit(5);

    if (usersError) {
      console.error('❌ 查询用户失败:', usersError.message);
    } else {
      console.log('\n现有用户状态示例:');
      users?.forEach(u => {
        console.log(`  - ${u.username}: ${u.status}`);
      });
    }

    console.log('\n✅ 迁移完成！');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

applyMigration();
