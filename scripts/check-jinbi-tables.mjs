#!/usr/bin/env node
/**
 * 检查津币相关数据库表
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY

console.log('==========================================')
console.log('   津币系统数据库表检查')
console.log('==========================================\n')

console.log('Supabase URL:', supabaseUrl)
console.log('Supabase Key:', supabaseKey ? supabaseKey.substring(0, 30) + '...' : '未设置')

if (!supabaseUrl || !supabaseKey) {
  console.error('\n❌ 错误: 环境变量未设置')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 津币系统相关表
const jinbiTables = [
  'user_jinbi_balance',
  'jinbi_records',
  'jinbi_consumption_details',
  'jinbi_packages',
  'membership_jinbi_config',
  'service_pricing'
]

async function checkTables() {
  console.log('\n🔍 检查津币相关表...\n')
  
  const results = []
  
  for (const table of jinbiTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })
      
      if (error) {
        if (error.message.includes('does not exist')) {
          console.log(`❌ ${table}: 表不存在`)
          results.push({ table, exists: false, error: '表不存在' })
        } else {
          console.log(`⚠️  ${table}: 查询错误 - ${error.message}`)
          results.push({ table, exists: true, error: error.message })
        }
      } else {
        console.log(`✅ ${table}: 表存在`)
        results.push({ table, exists: true, error: null })
      }
    } catch (error) {
      console.log(`❌ ${table}: 检查失败 - ${error.message}`)
      results.push({ table, exists: false, error: error.message })
    }
  }
  
  return results
}

async function checkServicePricing() {
  console.log('\n📋 检查服务计费标准...\n')
  
  try {
    const { data, error } = await supabase
      .from('service_pricing')
      .select('*')
      .eq('is_active', true)
    
    if (error) {
      console.log(`❌ 获取计费标准失败: ${error.message}`)
      return
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️  暂无计费标准数据')
      return
    }
    
    console.log(`找到 ${data.length} 条计费标准:\n`)
    data.forEach(item => {
      console.log(`  • ${item.name} (${item.service_type}): ${item.base_cost} 津币`)
    })
  } catch (error) {
    console.log(`❌ 检查计费标准失败: ${error.message}`)
  }
}

async function checkJinbiPackages() {
  console.log('\n📦 检查津币套餐...\n')
  
  try {
    const { data, error } = await supabase
      .from('jinbi_packages')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true })
    
    if (error) {
      console.log(`❌ 获取套餐失败: ${error.message}`)
      return
    }
    
    if (!data || data.length === 0) {
      console.log('⚠️  暂无津币套餐数据')
      return
    }
    
    console.log(`找到 ${data.length} 个套餐:\n`)
    data.forEach(item => {
      console.log(`  • ${item.name}: ${item.jinbi_amount} 津币 / ¥${item.price}`)
      if (item.bonus_jinbi > 0) {
        console.log(`    赠送: ${item.bonus_jinbi} 津币`)
      }
    })
  } catch (error) {
    console.log(`❌ 检查套餐失败: ${error.message}`)
  }
}

async function main() {
  const results = await checkTables()
  
  const existingTables = results.filter(r => r.exists).length
  const missingTables = results.filter(r => !r.exists).length
  
  console.log('\n==========================================')
  console.log('   检查结果汇总')
  console.log('==========================================')
  console.log(`✅ 已存在: ${existingTables} 个表`)
  console.log(`❌ 缺失: ${missingTables} 个表`)
  
  if (missingTables > 0) {
    console.log('\n缺失的表:')
    results.filter(r => !r.exists).forEach(r => {
      console.log(`  - ${r.table}`)
    })
  }
  
  // 检查计费标准和套餐
  await checkServicePricing()
  await checkJinbiPackages()
  
  console.log('\n==========================================')
  console.log('   检查完成')
  console.log('==========================================')
}

main().catch(console.error)
