#!/usr/bin/env node
/**
 * 检查 works 表结构
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import fs from 'fs'

if (fs.existsSync('.env.local')) {
  dotenv.config({ path: '.env.local' })
}
dotenv.config()

const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkSchema() {
  // 获取一条数据查看字段
  const { data, error } = await supabase
    .from('works')
    .select('*')
    .limit(1)

  if (error) {
    console.error('查询失败:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('works 表字段:')
    Object.keys(data[0]).forEach(key => {
      console.log(`  - ${key}: ${typeof data[0][key]}`)
    })
  } else {
    console.log('works 表没有数据')
  }
}

checkSchema()
