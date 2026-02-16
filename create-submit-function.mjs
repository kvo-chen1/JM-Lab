#!/usr/bin/env node
/**
 * 创建 submit_event_work 函数
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

const createFunctionSQL = `
-- 创建 submit_event_work 函数
CREATE OR REPLACE FUNCTION public.submit_event_work(
    p_event_id UUID,
    p_user_id UUID,
    p_participation_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_files JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_submission_id UUID;
    v_participation_exists BOOLEAN;
    v_now_bigint BIGINT;
BEGIN
    -- 获取当前时间戳（bigint 格式 - 毫秒）
    v_now_bigint := (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
    
    -- 检查参与记录是否存在
    SELECT EXISTS(
        SELECT 1 FROM public.event_participants 
        WHERE id = p_participation_id AND user_id = p_user_id AND event_id = p_event_id
    ) INTO v_participation_exists;
    
    IF NOT v_participation_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'Participation not found');
    END IF;
    
    -- 创建提交记录（所有时间戳使用 bigint 格式）
    INSERT INTO public.event_submissions (
        event_id, user_id, participation_id, title, description, files,
        status, submitted_at, created_at, updated_at
    ) VALUES (
        p_event_id, p_user_id, p_participation_id, p_title, p_description, p_files,
        'submitted', v_now_bigint, v_now_bigint, v_now_bigint
    )
    ON CONFLICT (event_id, user_id) 
    DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        files = EXCLUDED.files,
        status = 'submitted',
        submitted_at = v_now_bigint,
        updated_at = v_now_bigint
    RETURNING id INTO v_submission_id;
    
    -- 更新参与记录（所有时间戳使用 bigint 格式）
    UPDATE public.event_participants
    SET 
        status = 'submitted',
        current_step = 2,
        progress = 50,
        submission_date = v_now_bigint,
        updated_at = v_now_bigint
    WHERE id = p_participation_id;
    
    RETURN jsonb_build_object('success', true, 'submission_id', v_submission_id);
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION public.submit_event_work(UUID, UUID, UUID, TEXT, TEXT, JSONB) TO authenticated;
GRANT EXECUTE ON FUNCTION public.submit_event_work(UUID, UUID, UUID, TEXT, TEXT, JSONB) TO anon;
GRANT EXECUTE ON FUNCTION public.submit_event_work(UUID, UUID, UUID, TEXT, TEXT, JSONB) TO service_role;

-- 验证函数创建
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'submit_event_work';
`;

async function main() {
  console.log('========================================')
  console.log('🔧 创建 submit_event_work 函数')
  console.log('========================================\n')

  try {
    console.log('📋 执行创建 SQL...\n')
    
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: createFunctionSQL })
    
    if (error) {
      console.error('❌ 创建失败:', error.message)
      console.log('\n💡 请手动在 Supabase SQL Editor 中执行以下 SQL:')
      console.log('---')
      console.log(createFunctionSQL)
      console.log('---')
      process.exit(1)
    }
    
    console.log('✅ 函数创建成功！')
    
    if (data && data.length > 0) {
      console.log('\n📋 函数定义:')
      console.log(data[0].function_definition)
    }
    
  } catch (err) {
    console.error('❌ 执行异常:', err)
    console.log('\n💡 请手动在 Supabase SQL Editor 中执行以下 SQL:')
    console.log('---')
    console.log(createFunctionSQL)
    console.log('---')
    process.exit(1)
  }
  
  console.log('\n========================================')
}

main()
