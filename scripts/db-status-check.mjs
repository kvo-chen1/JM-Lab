#!/usr/bin/env node
/**
 * 数据库状态检查脚本
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

console.log('Supabase URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

async function checkAllTables() {
  console.log('========================================')
  console.log('数据库表结构检查报告')
  console.log('========================================\n')

  // 核心表
  const coreTables = [
    'users', 'works', 'posts', 'comments', 'likes', 'follows',
    'conversations', 'messages', 'points', 'achievements'
  ]

  // 功能表
  const featureTables = [
    'events', 'event_submissions', 'cultural_knowledge',
    'ai_generations', 'ip_assets', 'brand_tasks', 'brand_accounts',
    'notifications', 'feeds', 'communities', 'community_members'
  ]

  // 订单/交易表
  const orderTables = [
    'membership_orders', 'promotion_orders', 'lottery_draws',
    'exchange_records', 'coupons', 'user_coupons'
  ]

  // 系统表
  const systemTables = [
    'generation_tasks', 'user_sessions', 'behavior_logs',
    'errors', 'site_settings'
  ]

  async function checkTableGroup(name, tables) {
    console.log(`\n【${name}】`)
    console.log('-'.repeat(40))
    let existing = 0
    let missing = 0

    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })

        if (error) {
          if (error.message.includes('does not exist') || error.code === '42P01') {
            console.log(`  [缺失] ${table}`)
            missing++
          } else {
            console.log(`  [错误] ${table}: ${error.message}`)
          }
        } else {
          console.log(`  [正常] ${table}: ${count || 0} 条记录`)
          existing++
        }
      } catch (err) {
        console.log(`  [异常] ${table}: ${err.message}`)
      }
    }
    return { existing, missing }
  }

  const core = await checkTableGroup('核心表', coreTables)
  const feature = await checkTableGroup('功能表', featureTables)
  const order = await checkTableGroup('订单/交易表', orderTables)
  const system = await checkTableGroup('系统表', systemTables)

  console.log('\n========================================')
  console.log('汇总统计')
  console.log('========================================')
  console.log(`核心表:     ${core.existing} 存在, ${core.missing} 缺失`)
  console.log(`功能表:     ${feature.existing} 存在, ${feature.missing} 缺失`)
  console.log(`订单/交易:  ${order.existing} 存在, ${order.missing} 缺失`)
  console.log(`系统表:     ${system.existing} 存在, ${system.missing} 缺失`)
  console.log('----------------------------------------')
  console.log(`总计: ${core.existing + feature.existing + order.existing + system.existing} 表存在, ${core.missing + feature.missing + order.missing + system.missing} 表缺失`)
}

checkAllTables().catch(console.error)
