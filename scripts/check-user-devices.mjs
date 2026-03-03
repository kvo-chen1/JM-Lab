#!/usr/bin/env node
/**
 * 检查用户设备数据
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

async function checkUserDevices() {
  // 检查 user_devices 表
  const { data, error } = await supabase
    .from('user_devices')
    .select('*')
    .limit(5)

  if (error) {
    console.log('user_devices 表查询失败:', error.message)
  } else if (data && data.length > 0) {
    console.log('user_devices 表存在，数据示例:')
    console.log(data[0])
  } else {
    console.log('user_devices 表为空或不存在')
  }

  // 检查 users 表是否有 device 相关字段
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('*')
    .limit(1)

  if (userError) {
    console.log('users 表查询失败:', userError.message)
  } else if (userData && userData.length > 0) {
    console.log('\nusers 表字段:')
    const fields = Object.keys(userData[0])
    const deviceFields = fields.filter(f => f.includes('device') || f.includes('agent') || f.includes('platform'))
    console.log('设备相关字段:', deviceFields.length > 0 ? deviceFields : '无')
  }

  // 检查 user_history 表
  const { data: historyData, error: historyError } = await supabase
    .from('user_history')
    .select('*')
    .limit(1)

  if (historyError) {
    console.log('user_history 表查询失败:', historyError.message)
  } else if (historyData && historyData.length > 0) {
    console.log('\nuser_history 表字段:')
    const fields = Object.keys(historyData[0])
    const deviceFields = fields.filter(f => f.includes('device') || f.includes('agent') || f.includes('platform'))
    console.log('设备相关字段:', deviceFields.length > 0 ? deviceFields : '无')
  }
}

checkUserDevices()
