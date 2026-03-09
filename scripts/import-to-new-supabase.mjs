#!/usr/bin/env node
/**
 * 批量导入 CSV 到新的 Supabase 项目
 */

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import dotenv from 'dotenv'

dotenv.config()
dotenv.config({ path: '.env.local', override: true })

console.log('==========================================')
console.log('   批量导入 CSV 到 Supabase')
console.log('==========================================\n')

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 错误: Supabase 配置不完整')
  console.error('请检查 VITE_SUPABASE_URL 和 SUPABASE_SERVICE_ROLE_KEY')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
})

// CSV 文件目录
const importDir = path.join(process.cwd(), 'supabase_exports')

if (!fs.existsSync(importDir)) {
  console.error('❌ 错误: 找不到导出目录', importDir)
  process.exit(1)
}

// 解析 CSV 文件
function parseCSV(content) {
  const lines = content.trim().split('\n')
  if (lines.length < 2) return []
  
  const headers = lines[0].split(',').map(h => h.trim())
  const rows = []
  
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split(',').map(v => v.trim())
    const row = {}
    headers.forEach((header, index) => {
      let value = values[index]
      // 处理引号包裹的值
      if (value && value.startsWith('"') && value.endsWith('"')) {
        value = value.slice(1, -1).replace(/""/g, '"')
      }
      // 处理空值
      if (value === '' || value === 'NULL') {
        value = null
      }
      // 尝试解析 JSON
      if (value && (value.startsWith('{') || value.startsWith('['))) {
        try {
          value = JSON.parse(value)
        } catch (e) {
          // 保持原样
        }
      }
      row[header] = value
    })
    rows.push(row)
  }
  
  return rows
}

// 导入单个表
async function importTable(tableName) {
  const filePath = path.join(importDir, `${tableName}.csv`)
  
  if (!fs.existsSync(filePath)) {
    console.log(`⏭️  跳过 ${tableName}: 文件不存在`)
    return { success: true, count: 0, skipped: true }
  }
  
  try {
    console.log(`\n📥 导入表: ${tableName}`)
    
    // 读取 CSV
    const content = fs.readFileSync(filePath, 'utf-8')
    const rows = parseCSV(content)
    
    if (rows.length === 0) {
      console.log(`   ℹ️ 文件为空，跳过`)
      return { success: true, count: 0 }
    }
    
    console.log(`   读取了 ${rows.length} 条记录`)
    
    // 分批导入（每批 1000 条）
    const batchSize = 1000
    let insertedCount = 0
    let failedCount = 0
    
    for (let i = 0; i < rows.length; i += batchSize) {
      const batch = rows.slice(i, i + batchSize)
      
      const { error } = await supabase
        .from(tableName)
        .upsert(batch, { 
          onConflict: 'id',
          ignoreDuplicates: false 
        })
      
      if (error) {
        console.error(`   ❌ 批次 ${Math.floor(i/batchSize) + 1} 失败: ${error.message}`)
        failedCount += batch.length
      } else {
        insertedCount += batch.length
        process.stdout.write(`   进度: ${insertedCount}/${rows.length}\r`)
      }
    }
    
    console.log(`   ✅ 成功导入 ${insertedCount} 条记录${failedCount > 0 ? `, 失败 ${failedCount} 条` : ''}`)
    return { success: true, count: insertedCount, failed: failedCount }
    
  } catch (error) {
    console.error(`   ❌ 导入失败: ${error.message}`)
    return { success: false, count: 0, error: error.message }
  }
}

// 主函数
async function importAll() {
  console.log('Supabase URL:', supabaseUrl)
  console.log('导入目录:', importDir)
  
  // 按依赖顺序排序表（先导入基础表）
  const importOrder = [
    // 基础表
    'users',
    'categories',
    'creator_level_configs',
    'points_rules',
    'forbidden_words',
    'recommendation_configs',
    'admin_roles',
    'alert_rules',
    'moderation_rules',
    'membership_benefits_config',
    
    // 用户相关
    'user_profiles',
    'user_devices',
    'user_status',
    'user_points_balance',
    'memberships',
    'membership_benefits',
    'membership_orders',
    
    // 内容表
    'works',
    'posts',
    'events',
    'products',
    'communities',
    'cultural_knowledge',
    'tianjin_templates',
    'inspiration_mindmaps',
    'inspiration_nodes',
    
    // 互动表
    'comments',
    'work_comments',
    'feed_comments',
    'likes',
    'works_likes',
    'event_likes',
    'submission_likes',
    'favorites',
    'template_favorites',
    'template_likes',
    'bookmarks',
    'event_bookmarks',
    'follows',
    
    // 社区相关
    'community_members',
    'community_posts',
    'community_invite_settings',
    
    // 消息通知
    'messages',
    'direct_messages',
    'notifications',
    'admin_notifications',
    
    // 业务表
    'event_participants',
    'event_submissions',
    'submission_votes',
    'submission_ratings',
    'submission_scores',
    'final_ranking_publishes',
    'checkin_records',
    'points_records',
    'user_achievements',
    'achievements',
    'achievement_configs',
    
    // 品牌任务
    'brand_accounts',
    'brand_tasks',
    'brand_task_participants',
    'brand_task_submissions',
    'brand_partnerships',
    'brand_transactions',
    'business_tasks',
    
    // IP 相关
    'ip_assets',
    'ip_stages',
    'ip_activities',
    
    // 推广
    'promotion_orders',
    'promotion_coupons',
    'promoted_works',
    'order_executions',
    'order_audits',
    
    // 抽奖
    'lottery_activities',
    'lottery_prizes',
    'lottery_spin_records',
    
    // 盲盒
    'blind_box_sales',
    
    // 创作者收益
    'creator_earnings',
    'creator_revenue',
    'revenue_records',
    
    // 内容生成
    'generation_tasks',
    'ai_conversations',
    'ai_messages',
    'ai_user_memories',
    'ai_user_settings',
    'ai_platform_knowledge',
    'ai_reviews',
    'ai_shares',
    'ai_feedback',
    
    // Feed
    'feeds',
    'feed_collects',
    'hot_searches',
    'search_suggestions',
    'user_search_history',
    
    // 审核日志
    'audit_logs',
    'moderation_logs',
    'score_audit_logs',
    'reports',
    
    // 用户行为
    'user_activities',
    'user_feedbacks',
    'user_brand_history',
    'user_invite_rate_limits',
    'user_uploads',
    
    // 流量统计
    'page_views',
    'traffic_sources',
    'work_performance_stats',
    'channel_costs',
    
    // 其他
    'commercial_opportunities',
    'exchange_records',
    'inspiration_stories',
    'organizer_settings',
    'admin_operation_logs',
    'admin_accounts'
  ]
  
  console.log('\n【开始导入】')
  console.log('------------------------------------------')
  
  let totalRecords = 0
  let successTables = 0
  let failedTables = 0
  let skippedTables = 0
  
  for (const table of importOrder) {
    const result = await importTable(table)
    
    if (result.skipped) {
      skippedTables++
    } else if (result.success && result.count > 0) {
      totalRecords += result.count
      successTables++
    } else if (!result.success) {
      failedTables++
    }
  }
  
  console.log('\n------------------------------------------')
  console.log('【导入完成】')
  console.log(`✅ 成功: ${successTables} 个表`)
  console.log(`⏭️  跳过: ${skippedTables} 个表`)
  console.log(`❌ 失败: ${failedTables} 个表`)
  console.log(`📊 总记录数: ${totalRecords}`)
  
  if (failedTables > 0) {
    console.log('\n💡 提示: 部分表导入失败，可能是因为：')
    console.log('   1. 表结构不存在（需要先创建表）')
    console.log('   2. 外键约束冲突')
    console.log('   3. 数据格式不匹配')
    console.log('\n建议先在 Supabase SQL Editor 中执行 database-schema.sql 创建表结构')
  }
}

importAll()
  .then(() => {
    console.log('\n==========================================')
    console.log('   导入完成!')
    console.log('==========================================')
    process.exit(0)
  })
  .catch(err => {
    console.error('\n==========================================')
    console.error('   导入失败!')
    console.error('==========================================')
    console.error(err)
    process.exit(1)
  })
