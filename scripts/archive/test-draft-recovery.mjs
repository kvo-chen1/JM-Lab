#!/usr/bin/env node
/**
 * 测试草稿恢复逻辑
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
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 配置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

console.log('========================================')
console.log('🧪 测试草稿恢复逻辑')
console.log('========================================\n')

// 模拟浏览器 localStorage 检查
console.log('📋 请在浏览器控制台执行以下代码检查草稿数据：')
console.log(`
// 检查 localStorage 中的草稿数据
const draftKey = 'draft_event_submission_' + window.location.pathname.split('/')[2];
const draftData = localStorage.getItem(draftKey);
console.log('草稿键名:', draftKey);
console.log('草稿数据:', draftData);

if (draftData) {
  const parsed = JSON.parse(draftData);
  console.log('解析后的数据:', parsed);
  console.log('formData:', parsed.formData);
  console.log('files:', parsed.files);
}
`)

console.log('\n========================================')
console.log('💡 常见问题：')
console.log('1. 草稿数据可能保存在 localStorage 中')
console.log('2. 如果 formData 为空，可能是保存时数据未正确传入')
console.log('3. 检查 useDraftWithFiles 的 formData 配置是否正确')
console.log('========================================')
