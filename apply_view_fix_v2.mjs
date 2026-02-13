/**
 * 修复 submission 视图中的 creator_avatar 字段
 * 通过 Supabase API 执行 SQL
 */

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBwdHFkaWNhYWV3dG5haWZsZmNzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NjQ5MTUzMiwiZXhwIjoyMDgyMDY3NTMyfQ.Plz64E2BkfbgiyaBNyL2L2grVTPO-U8fcdDxa-MjgX4';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixViews() {
  console.log('🔧 开始修复视图...\n');
  
  try {
    // 先检查 event_submissions 表的实际结构
    console.log('📋 检查 event_submissions 表结构...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'event_submissions');
    
    if (columnsError) {
      console.error('❌ 无法获取表结构:', columnsError.message);
    } else {
      console.log('表字段:', columns.map(c => c.column_name).join(', '));
    }
    
    // 修复 submission_with_stats 视图 - 使用动态字段
    console.log('\n📝 修复 submission_with_stats 视图...');
    
    const fixViewSQL = `
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
`;

    // 使用 supabase 的 REST API 执行 SQL
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseKey}`,
        'apikey': supabaseKey,
      },
      body: JSON.stringify({ sql: fixViewSQL }),
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('⚠️ 直接执行SQL失败:', errorText);
      console.log('\n💡 请手动在 Supabase SQL Editor 中执行以下 SQL:');
      console.log('===============================================');
      console.log(fixViewSQL);
      console.log('===============================================');
    } else {
      console.log('✅ 视图修复成功！');
    }
    
    // 验证修复结果
    console.log('\n📊 验证修复结果...');
    const { data: submissions, error: queryError } = await supabase
      .from('submission_with_stats')
      .select('id, user_id, creator_name, creator_avatar')
      .limit(5);
    
    if (queryError) {
      console.error('❌ 查询失败:', queryError.message);
    } else {
      console.log('修复后的数据:');
      submissions.forEach(s => {
        console.log(`  - ${s.creator_name}: ${s.creator_avatar ? '✅ 有头像' : '❌ 无头像'}`);
      });
    }
    
  } catch (err) {
    console.error('❌ 执行失败:', err.message);
  }
}

// 运行修复
fixViews();
