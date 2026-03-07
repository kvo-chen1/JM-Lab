#!/usr/bin/env node
/**
 * 检查 Neon 数据库连接和缺失的表/函数
 */

import { Pool } from 'pg'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

// 获取连接字符串
const getConnectionString = () => {
  return process.env.POSTGRES_URL_NON_POOLING ||
         process.env.DATABASE_URL ||
         process.env.POSTGRES_URL ||
         process.env.NEON_DATABASE_URL ||
         process.env.NEON_URL ||
         process.env.NEON_POSTGRES_URL
}

const connectionString = getConnectionString()

if (!connectionString) {
  console.error('❌ 错误: 找不到数据库连接字符串')
  console.error('请确保以下环境变量之一已设置:')
  console.error('  - POSTGRES_URL_NON_POOLING')
  console.error('  - DATABASE_URL')
  console.error('  - POSTGRES_URL')
  console.error('  - NEON_DATABASE_URL')
  console.error('  - NEON_URL')
  process.exit(1)
}

console.log('🔌 正在连接数据库...')
console.log('连接字符串:', connectionString.replace(/:[^:@]+@/, ':***@'))

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
})

// 期望的表列表
const expectedTables = [
  'users',
  'works',
  'posts',
  'events',
  'event_participants',
  'comments',
  'likes',
  'favorites',
  'bookmarks',
  'follows',
  'messages',
  'conversations',
  'notifications',
  'communities',
  'community_members',
  'community_posts',
  'drafts',
  'achievements',
  'user_achievements',
  'tasks',
  'task_records',
  'points_records',
  'checkin_records',
  'products',
  'orders',
  'memberships',
  'membership_orders',
  'lottery_activities',
  'lottery_prizes',
  'lottery_spin_records',
  'promotion_orders',
  'promotion_wallets',
  'creator_revenue',
  'ip_assets',
  'copyright_assets',
  'business_tasks',
  'brand_tasks',
  'brand_events',
  'brand_partnerships',
  'feeds',
  'feed_comments',
  'feed_likes',
  'ai_conversations',
  'ai_messages',
  'search_history',
  'user_search_history',
  'user_sessions',
  'user_profiles',
  'analytics_daily_stats',
  'analytics_hourly_stats',
  'page_views',
  'api_usage',
  'errors',
  'audit_logs',
  'moderation_logs',
  'admin_accounts',
  'admin_roles',
  'admin_operation_logs',
  'email_verification_codes',
  'sms_verification_codes',
  'oauth_connections',
  'user_devices',
  'user_uploads',
  'generation_tasks',
  'template_favorites',
  'template_likes',
  'tianjin_templates',
  'cultural_knowledge',
  'inspiration_nodes',
  'inspiration_mindmaps',
  'inspiration_stories',
  'friend_requests',
  'direct_messages',
  'user_points_balance',
  'hot_themes',
  'exchange_records',
  'invite_records',
  'consumption_records'
]

// 期望的 RPC 函数
const expectedFunctions = [
  'get_unread_notification_count',
  'get_user_participation_stats',
  'get_active_promoted_works',
  'get_hot_searches',
  'get_analytics_stats',
  'get_realtime_stats',
  'get_user_growth_stats',
  'get_content_growth_stats',
  'get_engagement_stats',
  'get_revenue_stats',
  'get_moderation_stats',
  'get_system_health',
  'send_notification',
  'mark_notification_read',
  'create_conversation',
  'get_conversation_messages',
  'send_message',
  'mark_messages_read',
  'get_unread_message_count',
  'apply_for_community',
  'approve_community_application',
  'reject_community_application',
  'join_community',
  'leave_community',
  'create_community_post',
  'get_community_posts',
  'create_event',
  'update_event',
  'delete_event',
  'publish_event',
  'unpublish_event',
  'register_for_event',
  'cancel_event_registration',
  'submit_event_work',
  'score_event_submission',
  'vote_for_submission',
  'comment_on_submission',
  'like_submission',
  'get_event_ranking',
  'publish_event_ranking',
  'create_product',
  'update_product',
  'delete_product',
  'create_lottery',
  'update_lottery',
  'delete_lottery',
  'spin_lottery',
  'get_lottery_result',
  'create_promotion_order',
  'update_promotion_order',
  'cancel_promotion_order',
  'pay_for_promotion'
]

async function checkDatabase() {
  try {
    // 测试连接
    const client = await pool.connect()
    console.log('✅ 数据库连接成功!')
    
    // 获取数据库版本
    const versionResult = await client.query('SELECT version()')
    console.log('\n📊 数据库版本:')
    console.log('  ', versionResult.rows[0].version.split(' ').slice(0, 3).join(' '))
    
    // 检查现有表
    console.log('\n📋 检查数据库表...')
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `)
    
    const existingTables = tablesResult.rows.map(r => r.table_name)
    const missingTables = expectedTables.filter(t => !existingTables.includes(t))
    
    console.log(`\n✅ 已存在的表 (${existingTables.length}):`)
    existingTables.forEach(t => console.log(`   ✓ ${t}`))
    
    if (missingTables.length > 0) {
      console.log(`\n❌ 缺失的表 (${missingTables.length}):`)
      missingTables.forEach(t => console.log(`   ✗ ${t}`))
    } else {
      console.log('\n✅ 所有期望的表都已存在!')
    }
    
    // 检查 RPC 函数
    console.log('\n🔧 检查 RPC 函数...')
    const functionsResult = await client.query(`
      SELECT routine_name 
      FROM information_schema.routines 
      WHERE routine_schema = 'public' 
      AND routine_type = 'FUNCTION'
      ORDER BY routine_name
    `)
    
    const existingFunctions = functionsResult.rows.map(r => r.routine_name)
    const missingFunctions = expectedFunctions.filter(f => !existingFunctions.includes(f))
    
    console.log(`\n✅ 已存在的函数 (${existingFunctions.length}):`)
    existingFunctions.forEach(f => console.log(`   ✓ ${f}`))
    
    if (missingFunctions.length > 0) {
      console.log(`\n❌ 缺失的函数 (${missingFunctions.length}):`)
      missingFunctions.forEach(f => console.log(`   ✗ ${f}`))
    } else {
      console.log('\n✅ 所有期望的函数都已存在!')
    }
    
    // 检查表中的记录数
    console.log('\n📈 表记录数:')
    for (const table of existingTables.slice(0, 20)) {
      try {
        const countResult = await client.query(`SELECT COUNT(*) FROM "${table}"`)
        const count = countResult.rows[0].count
        if (parseInt(count) > 0) {
          console.log(`   ${table}: ${count} 条记录`)
        }
      } catch (e) {
        // 忽略错误
      }
    }
    
    client.release()
    
    return { missingTables, missingFunctions }
  } catch (error) {
    console.error('❌ 数据库检查失败:', error.message)
    throw error
  } finally {
    await pool.end()
  }
}

checkDatabase()
  .then(({ missingTables, missingFunctions }) => {
    console.log('\n' + '='.repeat(50))
    console.log('检查完成!')
    console.log('='.repeat(50))
    
    if (missingTables.length === 0 && missingFunctions.length === 0) {
      console.log('✅ 数据库结构完整，无需修复')
    } else {
      console.log(`⚠️ 发现 ${missingTables.length} 个缺失的表和 ${missingFunctions.length} 个缺失的函数`)
      console.log('请运行相应的 SQL 迁移脚本创建缺失的表和函数')
    }
  })
  .catch(err => {
    console.error('检查失败:', err)
    process.exit(1)
  })
