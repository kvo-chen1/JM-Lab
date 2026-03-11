#!/usr/bin/env node
/**
 * 检查数据库表和函数完整性
 */

import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'http://localhost:3030/api/db'
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'local-proxy-key'

console.log('==========================================')
console.log('   数据库表和函数完整性检查')
console.log('==========================================\n')

console.log('Supabase URL:', supabaseUrl)

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// 关键表列表
const criticalTables = [
  'users',
  'posts',
  'comments',
  'likes',
  'favorites',
  'works',
  'works_likes',
  'works_bookmarks',
  'communities',
  'community_posts',
  'events',
  'event_participants',
  'friend_requests',
  'friends',
  'direct_messages',
  'notifications',
  'user_status',
  'points_records',
  'user_achievements',
  'messages',
  'categories',
  'tags',
  'brands',
  'products',
  'commercial_applications',
  'promotion_orders',
  'ai_shares',
  'video_tasks'
]

// 关键函数列表
const criticalFunctions = [
  'get_user_profile',
  'get_user_points_stats',
  'update_user_points_balance',
  'check_points_limit',
  'get_active_promoted_works',
  'record_promotion_view',
  'record_promotion_click',
  'increment_promotion_views',
  'increment_promotion_clicks',
  'get_square_works_with_promotion',
  'switch_user_conversation',
  'get_user_conversations',
  'get_user_memories',
  'get_brand_events',
  'get_works_for_scoring',
  'submit_score',
  'publish_score',
  'batch_publish_scores',
  'get_submission_scores',
  'get_score_audit_logs',
  'search_trending_topics',
  'get_personalized_recommendations',
  'pay_promotion_order',
  'activate_promotion_order',
  'get_promotion_summary',
  'audit_promotion_order',
  'audit_promotion_application',
  'get_pending_promotion_applications_count',
  'increment_product_view',
  'exchange_product',
  'check_admin_permission',
  'get_admin_permissions',
  'log_admin_operation',
  'create_organizer_backup',
  'get_alert_stats',
  'record_promotion_impression'
]

async function checkTables() {
  console.log('\n📋 检查关键表...')
  console.log('-'.repeat(50))

  const existingTables = []
  const missingTables = []

  for (const table of criticalTables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count', { count: 'exact', head: true })

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('not found')) {
          missingTables.push(table)
          console.log(`  ❌ ${table}: 不存在`)
        } else {
          existingTables.push(table)
          console.log(`  ✅ ${table}: 存在 (查询出错: ${error.message})`)
        }
      } else {
        existingTables.push(table)
        console.log(`  ✅ ${table}: 存在`)
      }
    } catch (e) {
      missingTables.push(table)
      console.log(`  ❌ ${table}: 检查失败 - ${e.message}`)
    }
  }

  return { existingTables, missingTables }
}

async function checkFunctions() {
  console.log('\n📋 检查关键函数...')
  console.log('-'.repeat(50))

  const existingFunctions = []
  const missingFunctions = []

  for (const func of criticalFunctions) {
    try {
      const { data, error } = await supabase.rpc(func, {})

      if (error) {
        if (error.message.includes('does not exist') || error.message.includes('not found') || error.message.includes('Unknown function')) {
          missingFunctions.push(func)
          console.log(`  ❌ ${func}: 不存在`)
        } else {
          // 函数存在但参数错误或执行错误
          existingFunctions.push(func)
          console.log(`  ✅ ${func}: 存在 (参数/执行错误: ${error.message})`)
        }
      } else {
        existingFunctions.push(func)
        console.log(`  ✅ ${func}: 存在`)
      }
    } catch (e) {
      if (e.message && (e.message.includes('does not exist') || e.message.includes('not found'))) {
        missingFunctions.push(func)
        console.log(`  ❌ ${func}: 不存在`)
      } else {
        existingFunctions.push(func)
        console.log(`  ✅ ${func}: 存在 (检查异常: ${e.message})`)
      }
    }
  }

  return { existingFunctions, missingFunctions }
}

async function main() {
  try {
    // 检查表
    const { existingTables, missingTables } = await checkTables()

    // 检查函数
    const { existingFunctions, missingFunctions } = await checkFunctions()

    // 汇总报告
    console.log('\n')
    console.log('==========================================')
    console.log('           检查报告汇总')
    console.log('==========================================')
    console.log(`\n📊 表检查:`)
    console.log(`   总数: ${criticalTables.length}`)
    console.log(`   存在: ${existingTables.length}`)
    console.log(`   缺失: ${missingTables.length}`)

    if (missingTables.length > 0) {
      console.log(`   缺失表: ${missingTables.join(', ')}`)
    }

    console.log(`\n📊 函数检查:`)
    console.log(`   总数: ${criticalFunctions.length}`)
    console.log(`   存在: ${existingFunctions.length}`)
    console.log(`   缺失: ${missingFunctions.length}`)

    if (missingFunctions.length > 0) {
      console.log(`   缺失函数: ${missingFunctions.join(', ')}`)
    }

    console.log('\n')

    if (missingTables.length === 0 && missingFunctions.length === 0) {
      console.log('✅ 所有关键表和函数都存在！')
    } else {
      console.log('⚠️ 发现缺失的表或函数，请检查数据库结构')
    }

  } catch (error) {
    console.error('\n❌ 检查失败:', error.message)
  }
}

main()
