#!/usr/bin/env node
/**
 * 检查并修复 event_submissions 表的时间戳类型
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

// 加载环境变量
if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' })
}
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 配置')
  process.exit(1)
}

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

// 修复 SQL - 将 bigint 时间戳改为 TIMESTAMPTZ
const fixSQL = `
-- 检查并修复 event_submissions 表的时间戳类型
DO $$
BEGIN
    -- 检查 created_at 列的类型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'event_submissions' 
        AND column_name = 'created_at'
        AND data_type = 'bigint'
    ) THEN
        -- 修改 created_at 列类型
        ALTER TABLE public.event_submissions ALTER COLUMN created_at DROP DEFAULT;
        ALTER TABLE public.event_submissions ALTER COLUMN created_at TYPE TIMESTAMPTZ 
        USING to_timestamp(created_at / 1000);
        ALTER TABLE public.event_submissions ALTER COLUMN created_at SET DEFAULT NOW();
        RAISE NOTICE 'Fixed created_at column type from bigint to TIMESTAMPTZ';
    END IF;
    
    -- 检查 updated_at 列的类型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'event_submissions' 
        AND column_name = 'updated_at'
        AND data_type = 'bigint'
    ) THEN
        -- 修改 updated_at 列类型
        ALTER TABLE public.event_submissions ALTER COLUMN updated_at DROP DEFAULT;
        ALTER TABLE public.event_submissions ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
        USING to_timestamp(updated_at / 1000);
        ALTER TABLE public.event_submissions ALTER COLUMN updated_at SET DEFAULT NOW();
        RAISE NOTICE 'Fixed updated_at column type from bigint to TIMESTAMPTZ';
    END IF;
    
    -- 检查 submitted_at 列的类型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'event_submissions' 
        AND column_name = 'submitted_at'
        AND data_type = 'bigint'
    ) THEN
        -- 修改 submitted_at 列类型
        ALTER TABLE public.event_submissions ALTER COLUMN submitted_at TYPE TIMESTAMPTZ 
        USING to_timestamp(submitted_at / 1000);
        RAISE NOTICE 'Fixed submitted_at column type from bigint to TIMESTAMPTZ';
    END IF;
END $$;

-- 检查 event_participants 表的 submission_date 列
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'event_participants' 
        AND column_name = 'submission_date'
        AND data_type = 'bigint'
    ) THEN
        ALTER TABLE public.event_participants ALTER COLUMN submission_date TYPE TIMESTAMPTZ 
        USING to_timestamp(submission_date / 1000);
        RAISE NOTICE 'Fixed event_participants.submission_date column type from bigint to TIMESTAMPTZ';
    END IF;
END $$;

-- 验证修复结果
SELECT 
    table_name,
    column_name,
    data_type
FROM information_schema.columns 
WHERE table_name IN ('event_submissions', 'event_participants')
AND column_name IN ('created_at', 'updated_at', 'submitted_at', 'submission_date')
ORDER BY table_name, column_name;
`;

async function main() {
  console.log('========================================')
  console.log('🔧 检查并修复 event_submissions 表时间戳类型')
  console.log('========================================\n')

  try {
    console.log('📋 执行修复 SQL...\n')
    
    // 使用 exec_sql RPC 执行
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: fixSQL })
    
    if (error) {
      console.error('❌ 执行失败:', error.message)
      console.log('\n💡 请手动在 Supabase SQL Editor 中执行以下 SQL:')
      console.log('---')
      console.log(fixSQL)
      console.log('---')
      process.exit(1)
    }
    
    console.log('✅ 修复成功！')
    console.log('\n📊 修复内容:')
    console.log('  - 检查并修复了 event_submissions 表的时间戳列')
    console.log('  - 检查并修复了 event_participants 表的 submission_date 列')
    
    if (data) {
      console.log('\n📋 当前表结构:')
      console.log(data)
    }
    
  } catch (err) {
    console.error('❌ 执行异常:', err)
    console.log('\n💡 请手动在 Supabase SQL Editor 中执行以下 SQL:')
    console.log('---')
    console.log(fixSQL)
    console.log('---')
    process.exit(1)
  }
  
  console.log('\n========================================')
}

main()
