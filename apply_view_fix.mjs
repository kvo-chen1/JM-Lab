/**
 * 修复 submission 视图中的 creator_avatar 字段
 * 通过 Supabase RPC 执行 SQL
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

const fixViewsSQL = `
-- 修复 submission_with_stats 视图
DROP VIEW IF EXISTS public.submission_with_stats;

CREATE OR REPLACE VIEW public.submission_with_stats AS
SELECT 
    es.id,
    es.event_id,
    es.user_id,
    es.title,
    es.description,
    es.files,
    es.status,
    es.submitted_at,
    es.reviewed_at,
    es.review_notes,
    es.score,
    es.metadata,
    es.created_at,
    es.updated_at,
    es.vote_count,
    es.like_count,
    es.avg_rating,
    es.rating_count,
    es.cover_image,
    es.media_type,
    e.title as event_title,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    COALESCE(pu.username, u.raw_user_meta_data->>'username') as creator_name,
    COALESCE(pu.avatar_url, u.raw_user_meta_data->>'avatar_url') as creator_avatar,
    COALESCE(pu.full_name, u.raw_user_meta_data->>'full_name') as creator_full_name
FROM public.event_submissions es
JOIN public.events e ON es.event_id = e.id
JOIN auth.users u ON es.user_id = u.id
LEFT JOIN public.users pu ON es.user_id = pu.id;

-- 修复 submission_full_details 视图
DROP VIEW IF EXISTS public.submission_full_details;

CREATE OR REPLACE VIEW public.submission_full_details AS
SELECT 
    es.*,
    e.title as event_title,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    e.location as event_location,
    e.organizer_id as event_organizer_id,
    e.max_participants as event_max_participants,
    e.current_participants as event_current_participants,
    e.status as event_status,
    e.image_url as event_image_url,
    COALESCE(pu.username, u.raw_user_meta_data->>'username') as creator_name,
    COALESCE(pu.avatar_url, u.raw_user_meta_data->>'avatar_url') as creator_avatar,
    COALESCE(pu.email, u.raw_user_meta_data->>'email') as creator_email,
    COALESCE(pu.full_name, u.raw_user_meta_data->>'full_name') as creator_full_name,
    COALESCE(ss.score_count, 0) as score_count,
    COALESCE(ss.avg_score, 0) as avg_score,
    COALESCE(ss.max_score, 0) as max_score,
    COALESCE(ss.min_score, 0) as min_score,
    COALESCE(ss.judge_count, 0) as judge_count
FROM public.event_submissions es
JOIN public.events e ON es.event_id = e.id
JOIN auth.users u ON es.user_id = u.id
LEFT JOIN public.users pu ON es.user_id = pu.id
LEFT JOIN public.submission_score_summary ss ON es.id = ss.submission_id;
`;

async function fixViews() {
  console.log('🔧 开始修复视图...\n');
  
  try {
    // 尝试执行 SQL
    const { error } = await supabase.rpc('exec_sql', { sql: fixViewsSQL });
    
    if (error) {
      console.log('⚠️ RPC 方法不可用，尝试直接查询...');
      console.log('错误:', error.message);
      
      // 检查当前视图数据
      console.log('\n📊 检查当前 submission_with_stats 视图数据...');
      const { data: submissions, error: queryError } = await supabase
        .from('submission_with_stats')
        .select('id, user_id, creator_name, creator_avatar')
        .limit(5);
      
      if (queryError) {
        console.error('❌ 查询失败:', queryError.message);
      } else {
        console.log('当前数据:', submissions);
      }
      
      // 检查 public.users 表中的头像
      console.log('\n📊 检查 public.users 表中的头像...');
      const { data: users, error: usersError } = await supabase
        .from('users')
        .select('id, username, avatar_url')
        .limit(5);
      
      if (usersError) {
        console.error('❌ 查询 users 表失败:', usersError.message);
      } else {
        console.log('Users 表数据:', users);
      }
      
    } else {
      console.log('✅ 视图修复成功！');
    }
  } catch (err) {
    console.error('❌ 执行失败:', err.message);
  }
}

// 运行修复
fixViews();
