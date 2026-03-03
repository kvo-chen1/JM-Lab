#!/usr/bin/env node
/**
 * 检查 user_sessions 表的实际结构
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
  console.log('========================================')
  console.log('检查 user_sessions 表结构')
  console.log('========================================\n')

  // 尝试直接查询
  const { data: directData, error: directError } = await supabase
    .from('user_sessions')
    .select('*')
    .limit(1)

  if (directError) {
    console.log('直接查询失败:', directError.message)
  } else if (directData && directData.length > 0) {
    console.log('✅ 表存在，字段:')
    console.log(Object.keys(directData[0]))
  } else {
    console.log('表存在但为空')

    // 尝试插入最小数据测试
    const { data: users } = await supabase.from('users').select('id').limit(1)
    if (users && users.length > 0) {
      const { error: insertError } = await supabase
        .from('user_sessions')
        .insert({
          user_id: users[0].id,
          session_start: new Date().toISOString(),
          last_active: new Date().toISOString(),
        })

      if (insertError) {
        console.log('插入测试失败:', insertError.message)
      } else {
        console.log('✅ 最小插入成功')

        // 查询结构
        const { data: newData } = await supabase.from('user_sessions').select('*').limit(1)
        if (newData && newData.length > 0) {
          console.log('\n📋 实际字段:')
          Object.keys(newData[0]).forEach(key => {
            console.log(`  - ${key}`)
          })
        }
      }
    }
  }
}

checkSchema()
