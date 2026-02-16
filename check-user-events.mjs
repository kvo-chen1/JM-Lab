#!/usr/bin/env node
/**
 * 检查用户是否有活动
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

// 需要替换为实际的用户ID
const userId = process.argv[2] || '00000000-0000-0000-0000-000000000000'

const checkSQL = `
-- 检查用户相关的活动
SELECT 
    e.id,
    e.title,
    e.organizer_id,
    e.brand_id,
    e.status
FROM public.events e
WHERE e.organizer_id = '${userId}'
ORDER BY e.created_at DESC;

-- 检查用户的品牌合作关系
SELECT 
    bp.id,
    bp.brand_id,
    bp.user_id,
    bp.status
FROM public.brand_partnerships bp
WHERE bp.user_id = '${userId}'
AND bp.status = 'approved';

-- 检查用户角色
SELECT 
    ur.user_id,
    ur.role
FROM public.user_roles ur
WHERE ur.user_id = '${userId}';
`;

async function main() {
  console.log('========================================')
  console.log('🔍 检查用户活动')
  console.log('========================================\n')
  console.log('用户ID:', userId)
  console.log()

  try {
    const { data, error } = await supabaseAdmin.rpc('exec_sql', { sql: checkSQL })
    
    if (error) {
      console.error('❌ 查询失败:', error.message)
      process.exit(1)
    }
    
    console.log('📋 查询结果:', data)
    
  } catch (err) {
    console.error('❌ 执行异常:', err)
    process.exit(1)
  }
  
  console.log('\n========================================')
}

main()
