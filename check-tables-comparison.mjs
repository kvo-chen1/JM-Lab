import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 加载环境变量
dotenv.config({ path: path.join(__dirname, '.env') });
const envLocalPath = path.join(__dirname, '.env.local');
if (fs.existsSync(envLocalPath)) {
  const envConfig = dotenv.parse(fs.readFileSync(envLocalPath));
  for (const k in envConfig) {
    process.env[k] = envConfig[k];
  }
}

// 从代码中提取的表名（根据 grep 结果整理）
const tablesFromCode = [
  // 核心用户相关
  'users', 'user_profiles', 'user_devices', 'user_sessions', 'user_activities', 
  'user_status', 'user_ban_restrictions', 'user_history', 'user_feedbacks',
  'user_favorites', 'user_notifications', 'user_similarities', 'user_demographics',
  'user_creative_profiles', 'user_exploration_state', 'user_patterns', 'user_mockup_configs',
  'user_tile_configs', 'user_style_presets', 'user_brand_history', 'user_uploads',
  'user_points_balance', 'user_sync_logs', 'user_search_history', 'user_search_preferences',
  'user_realtime_features', 'user_behavior_events', 'user_behavior_logs', 'user_behavior_daily_stats',
  'user_invite_rate_limits', 'user_participation_details', 'user_achievements',
  
  // 内容相关
  'works', 'posts', 'feeds', 'comments', 'work_comments', 'replies', 'likes', 
  'works_likes', 'bookmarks', 'works_bookmarks', 'work_bookmarks', 'favorites',
  'work_favorites', 'work_shares', 'post_tags', 'tags', 'categories',
  
  // 社区相关
  'communities', 'community_members', 'community_posts', 'community_announcements',
  'community_invitations', 'community_invite_settings', 'community_join_requests',
  'community_invitation_history', 'follows', 'friends', 'friend_requests',
  'messages', 'direct_messages', 'conversations', 'pending_messages', 'notifications',
  
  // 活动和赛事
  'events', 'event_participants', 'event_submissions', 'event_works', 'event_prizes',
  'event_likes', 'event_bookmarks', 'event_notifications', 'event_daily_stats',
  'prize_winners', 'final_ranking_publishes', 'lottery_activities', 'lottery_prizes',
  'lottery_spin_records', 'checkin_records', 'task_records', 'business_tasks',
  'creator_task_applications', 'judge_score_details',
  
  // 品牌任务
  'brand_accounts', 'brand_tasks', 'brand_task_participants', 'brand_task_submissions',
  'brand_partnerships', 'brand_events', 'brand_ratings', 'brand_transactions',
  'brand_task_analytics', 'brand_wizard_drafts',
  
  // IP/版权
  'ip_assets', 'copyright_assets', 'ip_activities', 'ip_stats', 'ip_stages',
  'ip_partnerships', 'ip_asset_audit_stats', 'original_protection_applications',
  
  // 会员和积分
  'memberships', 'membership_orders', 'membership_benefits', 'membership_benefits_config',
  'membership_history', 'membership_coupons', 'membership_coupon_usage', 'membership_usage_stats',
  'points', 'points_records', 'points_rules', 'points_limits', 'points_leaderboard',
  'points_products', 'exchange_records', 'consumption_records',
  
  // 推广和商业化
  'promotion_orders', 'promoted_works', 'promotion_applications', 'promotion_applications_detail',
  'promotion_audit_logs', 'promotion_audit_stats', 'promotion_coupons', 'promotion_coupon_usage',
  'promotion_user_statistics', 'promotion_user_stats', 'promotion_wallets', 
  'promotion_wallet_transactions', 'promotion_notifications', 'commercial_opportunities',
  'blind_box_sales', 'channel_costs', 'conversion_events',
  
  // 商城相关
  'products', 'product_categories', 'product_details', 'product_links', 'product_reviews',
  'shopping_carts', 'orders', 'after_sales_requests', 'reviews', 'merchants',
  'merchant_todos', 'merchant_notifications',
  
  // 创作者收益
  'creator_earnings', 'creator_revenue', 'creator_level_configs', 'withdrawal_records',
  'revenue_records', 'daily_revenue_stats', 'hourly_stats',
  
  // AI相关
  'ai_conversations', 'ai_messages', 'ai_feedback', 'ai_reviews', 'ai_shares',
  'ai_user_memories', 'ai_user_settings', 'ai_platform_knowledge', 'generation_tasks',
  
  // 文化和知识
  'cultural_knowledge', 'inspiration_stories', 'inspiration_nodes', 'inspiration_mindmaps',
  'inspiration_ai_suggestions', 'tianjin_templates', 'template_favorites', 'template_likes',
  
  // 分析和统计
  'analytics_daily_stats', 'analytics_hourly_stats', 'page_views', 'traffic_sources',
  'content_stats', 'work_performance_stats', 'search_behavior_tracking', 'search_suggestions',
  'api_usage', 'active_users_5min', 'cold_start_analytics', 'cold_start_recommendation_logs',
  'recommendation_configs', 'recommendation_history', 'recommendation_metrics',
  'recommendation_operation_logs', 'realtime_recommendation_cache', 'small_traffic_tests',
  'small_traffic_exposures', 'small_traffic_test_analytics', 'new_content_boost_pool',
  'content_quality_assessments', 'content_vectors',
  
  // 管理和审核
  'admin_accounts', 'admin_roles', 'admin_notifications', 'admin_operation_logs',
  'moderation_logs', 'moderation_rules', 'reports', 'forbidden_words', 'audit_logs',
  'feedback_process_logs', 'errors',
  
  // 其他
  'achievements', 'achievement_configs', 'drafts', 'invitation_reports', 'invite_records',
  'organizer_settings', 'organizer_backups', 'video_tasks', 'submission_votes',
  'submission_likes', 'submission_comments', 'submission_ratings', 'submission_scores',
  'submission_score_summary', 'score_audit_logs', 'alert_rules', 'alert_records',
  'alert_notifications', 'order_applications', 'order_audits', 'order_executions',
  'order_execution_clicks', 'order_execution_daily_stats'
];

// 获取连接字符串
function getConnectionString() {
  return process.env.POSTGRES_URL_NON_POOLING || 
         process.env.DATABASE_URL || 
         process.env.POSTGRES_URL ||
         process.env.NEON_DATABASE_URL;
}

async function checkTables() {
  const connectionString = getConnectionString();
  
  if (!connectionString) {
    console.error('❌ 未找到数据库连接字符串');
    process.exit(1);
  }
  
  console.log('=================================');
  console.log('  数据库表结构对比检查');
  console.log('=================================\n');
  
  const pool = new Pool({
    connectionString,
    ssl: {
      rejectUnauthorized: false,
      requestCert: true,
      agent: false
    }
  });
  
  try {
    // 获取数据库中实际存在的表
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const existingTables = result.rows.map(r => r.table_name);
    
    console.log(`📊 数据库中共有 ${existingTables.length} 个表\n`);
    
    // 检查代码中使用的表哪些存在于数据库中
    const existingInCode = [];
    const missingInDB = [];
    
    for (const table of tablesFromCode) {
      if (existingTables.includes(table)) {
        existingInCode.push(table);
      } else {
        missingInDB.push(table);
      }
    }
    
    // 检查数据库中存在的表但代码中可能未使用（额外表）
    const extraTables = existingTables.filter(t => !tablesFromCode.includes(t));
    
    console.log('✅ 代码中使用且数据库中存在的表:');
    console.log(`   共 ${existingInCode.length} 个\n`);
    
    if (missingInDB.length > 0) {
      console.log('⚠️  代码中使用但数据库中缺失的表:');
      console.log(`   共 ${missingInDB.length} 个\n`);
      missingInDB.forEach((table, i) => {
        console.log(`   ${i + 1}. ${table}`);
      });
      console.log('');
    } else {
      console.log('✅ 所有代码中使用的表都在数据库中存在！\n');
    }
    
    if (extraTables.length > 0) {
      console.log('📋 数据库中存在但代码中可能未使用的表:');
      console.log(`   共 ${extraTables.length} 个\n`);
      extraTables.forEach((table, i) => {
        console.log(`   ${i + 1}. ${table}`);
      });
      console.log('');
    }
    
    // 按类别汇总
    console.log('=================================');
    console.log('  汇总统计');
    console.log('=================================');
    console.log(`数据库中总表数: ${existingTables.length}`);
    console.log(`代码中引用的表: ${tablesFromCode.length}`);
    console.log(`已匹配的表: ${existingInCode.length}`);
    console.log(`缺失的表: ${missingInDB.length}`);
    console.log(`额外的表: ${extraTables.length}`);
    
    await pool.end();
    
    return { existingTables, missingInDB, extraTables };
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
    await pool.end();
    process.exit(1);
  }
}

checkTables();
