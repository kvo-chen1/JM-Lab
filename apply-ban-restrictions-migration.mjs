#!/usr/bin/env node
/**
 * 应用用户禁用限制表迁移
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
  console.log('🔄 应用用户禁用限制表迁移...\n');

  try {
    // 读取迁移文件
    const migrationPath = path.join(__dirname, 'supabase', 'migrations', '20260225000002_add_user_ban_restrictions.sql');
    const migrationSql = fs.readFileSync(migrationPath, 'utf-8');

    console.log('迁移文件内容:');
    console.log(migrationSql);
    console.log('\n---\n');

    // 执行迁移
    console.log('执行迁移...');
    
    // 创建表
    const { error: createError } = await supabase.rpc('exec_sql', { 
      sql: `
        CREATE TABLE IF NOT EXISTS public.user_ban_restrictions (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          disable_login BOOLEAN NOT NULL DEFAULT false,
          disable_post BOOLEAN NOT NULL DEFAULT false,
          disable_comment BOOLEAN NOT NULL DEFAULT false,
          disable_like BOOLEAN NOT NULL DEFAULT false,
          disable_follow BOOLEAN NOT NULL DEFAULT false,
          ban_reason TEXT,
          ban_duration TEXT DEFAULT 'permanent',
          banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          banned_by UUID REFERENCES public.users(id),
          expires_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          UNIQUE(user_id)
        );
      ` 
    });

    if (createError) {
      console.log('⚠️ 创建表时出错 (可能已存在):', createError.message);
    } else {
      console.log('✅ 用户禁用限制表创建成功');
    }

    // 创建索引
    const { error: indexError1 } = await supabase.rpc('exec_sql', { 
      sql: `CREATE INDEX IF NOT EXISTS idx_user_ban_restrictions_user_id ON public.user_ban_restrictions(user_id);` 
    });

    if (indexError1) {
      console.log('⚠️ 创建索引1时出错:', indexError1.message);
    } else {
      console.log('✅ 索引1创建成功');
    }

    const { error: indexError2 } = await supabase.rpc('exec_sql', { 
      sql: `CREATE INDEX IF NOT EXISTS idx_user_ban_restrictions_expires_at ON public.user_ban_restrictions(expires_at);` 
    });

    if (indexError2) {
      console.log('⚠️ 创建索引2时出错:', indexError2.message);
    } else {
      console.log('✅ 索引2创建成功');
    }

    console.log('\n✅ 迁移完成！');

  } catch (error) {
    console.error('❌ 迁移失败:', error.message);
    console.error(error);
    process.exit(1);
  }
}

applyMigration();
