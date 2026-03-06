/**
 * 数据库代理路由 - 将 Supabase 风格的请求转换为 PostgreSQL 查询
 * 用于替代 Supabase 服务
 */

import { Router } from 'express'
import { Pool } from 'pg'

const router = Router()

// 创建 PostgreSQL 连接池
const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 
                    process.env.NEON_DATABASE_URL || 
                    process.env.POSTGRES_URL_NON_POOLING,
  ssl: {
    rejectUnauthorized: false
  }
})

// 表名到主键的映射
const tablePrimaryKeys = {
  'users': 'id',
  'posts': 'id',
  'brand_partnerships': 'id',
  'user_points_balance': 'id',
  'hot_themes': 'id',
  'points_records': 'id',
  'checkin_records': 'id',
  'works': 'id',
  'events': 'id',
  'products': 'id',
  'comments': 'id',
  'likes': 'id',
  'favorites': 'id',
  'bookmarks': 'id',
  'follows': 'id',
  'messages': 'id',
  'notifications': 'id',
  'conversations': 'id',
  'communities': 'id',
  'community_members': 'id',
  'community_posts': 'id',
  'drafts': 'id',
  'achievements': 'id',
  'user_achievements': 'id',
  'tasks': 'id',
  'task_records': 'id',
  'exchange_records': 'id',
  'invite_records': 'id',
  'consumption_records': 'id',
  'lottery_activities': 'id',
  'lottery_prizes': 'id',
  'lottery_spin_records': 'id',
  'memberships': 'id',
  'membership_orders': 'id',
  'promotion_orders': 'id',
  'promotion_wallets': 'id',
  'creator_revenue': 'id',
  'ip_assets': 'id',
  'copyright_assets': 'id',
  'business_tasks': 'id',
  'brand_tasks': 'id',
  'brand_events': 'id',
  'brand_accounts': 'id',
  'feeds': 'id',
  'feed_comments': 'id',
  'feed_likes': 'id',
  'ai_conversations': 'id',
  'ai_messages': 'id',
  'search_history': 'id',
  'user_search_history': 'id',
  'user_sessions': 'id',
  'user_profiles': 'id',
  'user_behavior_logs': 'id',
  'analytics_daily_stats': 'id',
  'analytics_hourly_stats': 'id',
  'page_views': 'id',
  'api_usage': 'id',
  'errors': 'id',
  'audit_logs': 'id',
  'moderation_logs': 'id',
  'admin_accounts': 'id',
  'admin_roles': 'id',
  'admin_operation_logs': 'id',
  'admin_notifications': 'id',
  'email_verification_codes': 'id',
  'sms_verification_codes': 'id',
  'oauth_connections': 'id',
  'user_devices': 'id',
  'user_uploads': 'id',
  'generation_tasks': 'id',
  'template_favorites': 'id',
  'template_likes': 'id',
  'tianjin_templates': 'id',
  'cultural_knowledge': 'id',
  'inspiration_nodes': 'id',
  'inspiration_mindmaps': 'id',
  'inspiration_stories': 'id',
  'inspiration_ai_suggestions': 'id',
  'user_style_presets': 'id',
  'user_mockup_configs': 'id',
  'user_tile_configs': 'id',
  'product_links': 'id',
  'order_applications': 'id',
  'order_audits': 'id',
  'order_executions': 'id',
  'order_execution_clicks': 'id',
  'revenue_records': 'id',
  'withdrawal_records': 'id',
  'channel_costs': 'id',
  'daily_revenue_stats': 'id',
  'creator_earnings': 'id',
  'creator_level_configs': 'id',
  'blind_box_sales': 'id',
  'event_participants': 'id',
  'event_works': 'id',
  'event_prizes': 'id',
  'prize_winners': 'id',
  'submission_scores': 'id',
  'submission_votes': 'id',
  'submission_comments': 'id',
  'submission_likes': 'id',
  'submission_ratings': 'id',
  'judge_score_details': 'id',
  'final_ranking_publishes': 'id',
  'work_performance_stats': 'id',
  'work_shares': 'id',
  'work_bookmarks': 'id',
  'work_comments': 'id',
  'work_comment_likes': 'id',
  'work_favorites': 'id',
  'content_stats': 'id',
  'content_vectors': 'id',
  'content_quality_assessments': 'id',
  'cold_start_analytics': 'id',
  'cold_start_recommendation_logs': 'id',
  'new_content_boost_pool': 'id',
  'new_content_performance': 'id',
  'small_traffic_tests': 'id',
  'small_traffic_exposures': 'id',
  'small_traffic_test_analytics': 'id',
  'recommendation_configs': 'id',
  'recommendation_history': 'id',
  'recommendation_metrics': 'id',
  'recommendation_operation_logs': 'id',
  'home_recommendations': 'id',
  'realtime_recommendation_cache': 'id',
  'user_similarities': 'id',
  'user_patterns': 'id',
  'user_exploration_state': 'id',
  'user_realtime_features': 'id',
  'user_demographics': 'id',
  'user_activities': 'id',
  'user_behavior_daily_stats': 'id',
  'user_behavior_events': 'id',
  'user_creative_profiles': 'id',
  'user_brand_history': 'id',
  'user_favorites': 'id',
  'user_feedbacks': 'id',
  'user_notifications': 'id',
  'user_sync_logs': 'id',
  'user_invite_rate_limits': 'id',
  'user_ban_restrictions': 'id',
  'user_status': 'id',
  'membership_benefits': 'id',
  'membership_benefits_config': 'id',
  'membership_coupons': 'id',
  'membership_coupon_usage': 'id',
  'membership_usage_stats': 'id',
  'promotion_coupons': 'id',
  'promotion_coupon_usage': 'id',
  'promotion_user_statistics': 'id',
  'promotion_user_stats': 'id',
  'promotion_wallet_transactions': 'id',
  'promotion_audit_logs': 'id',
  'promotion_audit_stats': 'id',
  'promotion_notifications': 'id',
  'forbidden_words': 'id',
  'moderation_rules': 'id',
  'alert_rules': 'id',
  'alert_records': 'id',
  'alert_notifications': 'id',
  'feedback_process_logs': 'id',
  'conversion_events': 'id',
  'traffic_sources': 'id',
  'search_behavior_tracking': 'id',
  'search_suggestions': 'id',
  'hot_searches': 'id',
  'active_users_5min': 'id',
  'hourly_stats': 'id',
  'event_daily_stats': 'id',
  'event_bookmarks': 'id',
  'event_likes': 'id',
  'event_notifications': 'id',
  'brand_ratings': 'id',
  'brand_transactions': 'id',
  'brand_wizard_drafts': 'id',
  'brand_task_participants': 'id',
  'brand_task_submissions': 'id',
  'brand_task_analytics': 'id',
  'ip_partnerships': 'id',
  'ip_stages': 'id',
  'ip_stats': 'id',
  'ip_activities': 'id',
  'ip_asset_audit_stats': 'id',
  'commercial_opportunities': 'id',
  'organizer_settings': 'id',
  'organizer_backups': 'id',
  'creator_task_applications': 'id',
  'ai_feedback': 'id',
  'ai_reviews': 'id',
  'ai_shares': 'id',
  'ai_user_memories': 'id',
  'ai_user_settings': 'id',
  'ai_platform_knowledge': 'id',
  'pending_messages': 'id',
  'direct_messages': 'id',
  'friend_requests': 'id',
  'friends': 'id',
  'community_invitations': 'id',
  'community_invite_settings': 'id',
  'community_join_requests': 'id',
  'community_invitation_history': 'id',
  'community_announcements': 'id',
  'reports': 'id',
  'score_audit_logs': 'id',
  'submission_full_details': 'id',
  'submission_with_stats': 'id',
  'submission_score_summary': 'id',
  'points_leaderboard': 'id',
  'points_limits': 'id',
  'points_rules': 'id',
  'achievement_configs': 'id',
  'categories': 'id',
  'post_tags': 'id',
  'tags': 'id',
  'replies': 'id',
  'feed_collects': 'id',
  'feed_comment_likes': 'id',
  'invitation_reports': 'id',
  'event_submissions': 'id',
  'lottery_spin_records_with_users': 'id',
  'update_user_points_balance': 'id',
  'get_user_points_stats': 'id',
  'initialize_user_points_balance': 'id',
  'handle_invite_registration': 'id',
  'process_checkin': 'id',
  'spend_points': 'id',
  'record_consumption': 'id',
  'record_exchange': 'id',
  'record_task_completion': 'id',
  'record_invite': 'id',
  'update_achievement_progress': 'id',
  'check_and_award_achievements': 'id',
  'get_leaderboard': 'id',
  'get_user_rank': 'id',
  'get_nearby_users': 'id',
  'get_recommendation': 'id',
  'record_behavior': 'id',
  'get_user_features': 'id',
  'update_user_features': 'id',
  'get_cold_start_recommendation': 'id',
  'record_content_view': 'id',
  'record_content_interaction': 'id',
  'get_content_stats': 'id',
  'update_content_quality_score': 'id',
  'get_search_suggestions': 'id',
  'record_search': 'id',
  'get_hot_searches': 'id',
  'get_analytics_stats': 'id',
  'get_realtime_stats': 'id',
  'get_user_growth_stats': 'id',
  'get_content_growth_stats': 'id',
  'get_engagement_stats': 'id',
  'get_revenue_stats': 'id',
  'get_moderation_stats': 'id',
  'get_system_health': 'id',
  'send_notification': 'id',
  'mark_notification_read': 'id',
  'get_unread_notification_count': 'id',
  'create_conversation': 'id',
  'get_conversation_messages': 'id',
  'send_message': 'id',
  'mark_messages_read': 'id',
  'get_unread_message_count': 'id',
  'apply_for_community': 'id',
  'approve_community_application': 'id',
  'reject_community_application': 'id',
  'join_community': 'id',
  'leave_community': 'id',
  'create_community_post': 'id',
  'get_community_posts': 'id',
  'create_event': 'id',
  'update_event': 'id',
  'delete_event': 'id',
  'publish_event': 'id',
  'unpublish_event': 'id',
  'register_for_event': 'id',
  'cancel_event_registration': 'id',
  'submit_event_work': 'id',
  'score_event_submission': 'id',
  'vote_for_submission': 'id',
  'comment_on_submission': 'id',
  'like_submission': 'id',
  'get_event_ranking': 'id',
  'publish_event_ranking': 'id',
  'create_product': 'id',
  'update_product': 'id',
  'delete_product': 'id',
  'create_lottery': 'id',
  'update_lottery': 'id',
  'delete_lottery': 'id',
  'spin_lottery': 'id',
  'get_lottery_result': 'id',
  'create_promotion_order': 'id',
  'update_promotion_order': 'id',
  'cancel_promotion_order': 'id',
  'pay_for_promotion': 'id',
  'get_promotion_wallet_balance': 'id',
  'recharge_promotion_wallet': 'id',
  'withdraw_from_promotion_wallet': 'id',
  'get_promotion_stats': 'id',
  'create_membership_order': 'id',
  'pay_for_membership': 'id',
  'cancel_membership_order': 'id',
  'activate_membership': 'id',
  'deactivate_membership': 'id',
  'get_membership_benefits': 'id',
  'use_membership_benefit': 'id',
  'create_ip_asset': 'id',
  'update_ip_asset': 'id',
  'delete_ip_asset': 'id',
  'audit_ip_asset': 'id',
  'publish_ip_asset': 'id',
  'unpublish_ip_asset': 'id',
  'create_ip_partnership': 'id',
  'update_ip_partnership': 'id',
  'delete_ip_partnership': 'id',
  'create_business_task': 'id',
  'update_business_task': 'id',
  'delete_business_task': 'id',
  'publish_business_task': 'id',
  'unpublish_business_task': 'id',
  'apply_for_business_task': 'id',
  'approve_business_task_application': 'id',
  'reject_business_task_application': 'id',
  'submit_business_task_work': 'id',
  'audit_business_task_work': 'id',
  'create_brand_task': 'id',
  'update_brand_task': 'id',
  'delete_brand_task': 'id',
  'publish_brand_task': 'id',
  'unpublish_brand_task': 'id',
  'participate_in_brand_task': 'id',
  'submit_brand_task_work': 'id',
  'audit_brand_task_submission': 'id',
  'create_brand_event': 'id',
  'update_brand_event': 'id',
  'delete_brand_event': 'id',
  'publish_brand_event': 'id',
  'unpublish_brand_event': 'id',
  'register_for_brand_event': 'id',
  'create_feed': 'id',
  'update_feed': 'id',
  'delete_feed': 'id',
  'like_feed': 'id',
  'unlike_feed': 'id',
  'collect_feed': 'id',
  'uncollect_feed': 'id',
  'comment_on_feed': 'id',
  'delete_feed_comment': 'id',
  'like_feed_comment': 'id',
  'unlike_feed_comment': 'id',
  'create_ai_conversation': 'id',
  'delete_ai_conversation': 'id',
  'send_ai_message': 'id',
  'get_ai_conversation_history': 'id',
  'create_inspiration_mindmap': 'id',
  'update_inspiration_mindmap': 'id',
  'delete_inspiration_mindmap': 'id',
  'create_inspiration_node': 'id',
  'update_inspiration_node': 'id',
  'delete_inspiration_node': 'id',
  'create_inspiration_story': 'id',
  'update_inspiration_story': 'id',
  'delete_inspiration_story': 'id',
  'generate_ai_suggestion': 'id',
  'apply_ai_suggestion': 'id',
  'create_template': 'id',
  'update_template': 'id',
  'delete_template': 'id',
  'favorite_template': 'id',
  'unfavorite_template': 'id',
  'like_template': 'id',
  'unlike_template': 'id',
  'use_template': 'id',
  'create_work': 'id',
  'update_work': 'id',
  'delete_work': 'id',
  'publish_work': 'id',
  'unpublish_work': 'id',
  'share_work': 'id',
  'bookmark_work': 'id',
  'unbookmark_work': 'id',
  'like_work': 'id',
  'unlike_work': 'id',
  'favorite_work': 'id',
  'unfavorite_work': 'id',
  'comment_on_work': 'id',
  'delete_work_comment': 'id',
  'like_work_comment': 'id',
  'unlike_work_comment': 'id',
  'create_draft': 'id',
  'update_draft': 'id',
  'delete_draft': 'id',
  'publish_draft': 'id',
  'get_user_works': 'id',
  'get_user_drafts': 'id',
  'get_user_favorites': 'id',
  'get_user_bookmarks': 'id',
  'get_user_history': 'id',
  'get_user_stats': 'id',
  'follow_user': 'id',
  'unfollow_user': 'id',
  'get_followers': 'id',
  'get_following': 'id',
  'get_user_profile': 'id',
  'update_user_profile': 'id',
  'upload_avatar': 'id',
  'change_password': 'id',
  'bind_email': 'id',
  'bind_phone': 'id',
  'bind_oauth': 'id',
  'unbind_oauth': 'id',
  'delete_account': 'id',
  'get_achievement_list': 'id',
  'get_user_achievements': 'id',
  'check_achievement': 'id',
  'claim_achievement_reward': 'id',
  'get_task_list': 'id',
  'get_user_tasks': 'id',
  'claim_task_reward': 'id',
  'get_points_history': 'id',
  'get_points_rules': 'id',
  'get_exchange_list': 'id',
  'exchange_points': 'id',
  'get_exchange_history': 'id',
  'get_invite_info': 'id',
  'generate_invite_code': 'id',
  'get_invite_records': 'id',
  'get_consumption_records': 'id',
  'get_lottery_list': 'id',
  'get_lottery_detail': 'id',
  'get_membership_plans': 'id',
  'get_current_membership': 'id',
  'get_membership_history': 'id',
  'get_promotion_plans': 'id',
  'get_current_promotion': 'id',
  'get_promotion_history': 'id',
  'get_ip_list': 'id',
  'get_ip_detail': 'id',
  'get_my_ip_assets': 'id',
  'get_ip_partnerships': 'id',
  'get_brand_list': 'id',
  'get_brand_detail': 'id',
  'get_my_brand_tasks': 'id',
  'get_brand_events': 'id',
  'get_feed_list': 'id',
  'get_feed_detail': 'id',
  'get_recommendation_list': 'id',
  'get_search_result': 'id',
  'get_hot_search_list': 'id',
  'get_notification_list': 'id',
  'get_message_list': 'id',
  'get_conversation_list': 'id',
  'get_community_list': 'id',
  'get_community_detail': 'id',
  'get_my_communities': 'id',
  'get_event_list': 'id',
  'get_event_detail': 'id',
  'get_my_events': 'id',
  'get_product_list': 'id',
  'get_product_detail': 'id',
  'get_template_list': 'id',
  'get_template_detail': 'id',
  'get_work_list': 'id',
  'get_work_detail': 'id',
  'get_user_detail': 'id',
  'get_ranking_list': 'id',
  'get_analytics_overview': 'id',
  'get_content_analytics': 'id',
  'get_user_analytics': 'id',
  'get_revenue_analytics': 'id',
  'get_system_status': 'id',
  'get_health_check': 'id',
  'admin_login': 'id',
  'admin_logout': 'id',
  'admin_get_dashboard': 'id',
  'admin_get_users': 'id',
  'admin_get_user_detail': 'id',
  'admin_update_user': 'id',
  'admin_delete_user': 'id',
  'admin_ban_user': 'id',
  'admin_unban_user': 'id',
  'admin_get_contents': 'id',
  'admin_get_content_detail': 'id',
  'admin_audit_content': 'id',
  'admin_delete_content': 'id',
  'admin_get_orders': 'id',
  'admin_get_order_detail': 'id',
  'admin_update_order': 'id',
  'admin_refund_order': 'id',
  'admin_get_finance_stats': 'id',
  'admin_get_withdrawal_requests': 'id',
  'admin_approve_withdrawal': 'id',
  'admin_reject_withdrawal': 'id',
  'admin_get_system_settings': 'id',
  'admin_update_system_settings': 'id',
  'admin_get_operation_logs': 'id',
  'admin_send_announcement': 'id',
  'admin_get_data_report': 'id',
  'admin_export_data': 'id'
}

// 解析 select 参数
function parseSelect(select) {
  if (!select || select === '*') return '*'
  return select
}

// 构建 WHERE 子句
function buildWhere(filters) {
  const conditions = []
  const values = []
  let paramIndex = 1

  for (const [key, value] of Object.entries(filters)) {
    if (key === 'or' || key === 'and') continue
    
    if (typeof value === 'object' && value !== null) {
      // 处理操作符，如 eq, gt, lt, gte, lte, neq, like, ilike, in, is
      for (const [op, val] of Object.entries(value)) {
        switch (op) {
          case 'eq':
            conditions.push(`${key} = $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'neq':
            conditions.push(`${key} != $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'gt':
            conditions.push(`${key} > $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'gte':
            conditions.push(`${key} >= $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'lt':
            conditions.push(`${key} < $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'lte':
            conditions.push(`${key} <= $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'like':
            conditions.push(`${key} LIKE $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'ilike':
            conditions.push(`${key} ILIKE $${paramIndex}`)
            values.push(val)
            paramIndex++
            break
          case 'in':
            const inPlaceholders = Array.isArray(val) 
              ? val.map((_, i) => `$${paramIndex + i}`).join(', ')
              : `$${paramIndex}`
            conditions.push(`${key} IN (${inPlaceholders})`)
            if (Array.isArray(val)) {
              values.push(...val)
              paramIndex += val.length
            } else {
              values.push(val)
              paramIndex++
            }
            break
          case 'is':
            if (val === null) {
              conditions.push(`${key} IS NULL`)
            } else {
              conditions.push(`${key} = $${paramIndex}`)
              values.push(val)
              paramIndex++
            }
            break
        }
      }
    } else {
      conditions.push(`${key} = $${paramIndex}`)
      values.push(value)
      paramIndex++
    }
  }

  return { where: conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '', values, paramIndex }
}

// 构建 ORDER BY 子句
function buildOrder(order) {
  if (!order) return ''
  const { column, ascending = true } = order
  return `ORDER BY ${column} ${ascending ? 'ASC' : 'DESC'}`
}

// 构建 LIMIT 和 OFFSET
function buildRange(range) {
  if (!range) return ''
  const { start = 0, end = 999999 } = range
  const limit = end - start + 1
  return `LIMIT ${limit} OFFSET ${start}`
}

// GET /rest/v1/:table - 查询数据
router.get('/:table', async (req, res) => {
  try {
    const { table } = req.params
    const { select = '*', ...filters } = req.query

    // 解析查询参数
    const columns = parseSelect(select)
    const { where, values } = buildWhere(filters)
    const order = buildOrder(req.query.order)
    const range = buildRange(req.query.range)

    // 构建 SQL 查询
    let sql = `SELECT ${columns} FROM ${table}`
    if (where) sql += ` ${where}`
    if (order) sql += ` ${order}`
    if (range) sql += ` ${range}`

    const result = await pool.query(sql, values)
    
    res.json(result.rows)
  } catch (error) {
    console.error('Database query error:', error)
    res.status(500).json({ error: error.message })
  }
})

// POST /rest/v1/:table - 插入数据
router.post('/:table', async (req, res) => {
  try {
    const { table } = req.params
    const data = Array.isArray(req.body) ? req.body : [req.body]

    if (data.length === 0) {
      return res.status(400).json({ error: 'No data provided' })
    }

    const columns = Object.keys(data[0])
    const placeholders = data.map((_, rowIndex) => 
      `(${columns.map((_, colIndex) => `$${rowIndex * columns.length + colIndex + 1}`).join(', ')})`
    ).join(', ')

    const values = data.flatMap(row => columns.map(col => row[col]))

    const sql = `INSERT INTO ${table} (${columns.join(', ')}) VALUES ${placeholders} RETURNING *`

    const result = await pool.query(sql, values)
    
    res.status(201).json(result.rows)
  } catch (error) {
    console.error('Database insert error:', error)
    res.status(500).json({ error: error.message })
  }
})

// PATCH /rest/v1/:table - 更新数据
router.patch('/:table', async (req, res) => {
  try {
    const { table } = req.params
    const { ...filters } = req.query
    const data = req.body

    const setClause = Object.keys(data).map((key, index) => `${key} = $${index + 1}`).join(', ')
    const setValues = Object.values(data)

    const { where, values, paramIndex } = buildWhere(filters)
    const allValues = [...setValues, ...values]

    let sql = `UPDATE ${table} SET ${setClause}`
    if (where) sql += ` ${where}`
    sql += ` RETURNING *`

    const result = await pool.query(sql, allValues)
    
    res.json(result.rows)
  } catch (error) {
    console.error('Database update error:', error)
    res.status(500).json({ error: error.message })
  }
})

// DELETE /rest/v1/:table - 删除数据
router.delete('/:table', async (req, res) => {
  try {
    const { table } = req.params
    const { ...filters } = req.query

    const { where, values } = buildWhere(filters)

    let sql = `DELETE FROM ${table}`
    if (where) sql += ` ${where}`
    sql += ` RETURNING *`

    const result = await pool.query(sql, values)
    
    res.json(result.rows)
  } catch (error) {
    console.error('Database delete error:', error)
    res.status(500).json({ error: error.message })
  }
})

// RPC 调用
router.post('/rpc/:function', async (req, res) => {
  try {
    const { function: funcName } = req.params
    const params = req.body

    // 构建函数调用
    const paramNames = Object.keys(params)
    const paramPlaceholders = paramNames.map((_, i) => `$${i + 1}`).join(', ')
    const values = Object.values(params)

    const sql = `SELECT ${funcName}(${paramPlaceholders})`

    const result = await pool.query(sql, values)
    
    res.json(result.rows[0][funcName])
  } catch (error) {
    console.error('RPC call error:', error)
    res.status(500).json({ error: error.message })
  }
})

export default router
