import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 缺少 Supabase 环境变量');
  console.error('请确保 .env 文件中包含 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkRpcFunctions() {
  console.log('检查 RPC 函数状态...\n');

  const functions = [
    'get_brand_events',
    'get_works_for_scoring',
    'get_submission_scores',
    'submit_score',
    'publish_score',
    'batch_publish_scores',
    'get_score_audit_logs'
  ];

  for (const funcName of functions) {
    try {
      // 尝试调用函数（使用测试参数）
      let result;
      switch (funcName) {
        case 'get_brand_events':
          result = await supabase.rpc(funcName, { p_user_id: '00000000-0000-0000-0000-000000000000' });
          break;
        case 'get_works_for_scoring':
          result = await supabase.rpc(funcName, {
            p_event_id: null,
            p_status: 'all',
            p_score_status: 'all',
            p_search_query: null,
            p_sort_by: 'submitted_at',
            p_sort_order: 'desc',
            p_page: 1,
            p_limit: 20
          });
          break;
        default:
          result = { data: null, error: null };
      }

      if (result.error) {
        console.log(`❌ ${funcName}: ${result.error.message}`);
      } else {
        console.log(`✅ ${funcName}: 正常`);
      }
    } catch (error) {
      console.log(`❌ ${funcName}: ${error.message}`);
    }
  }

  // 检查用户登录状态
  console.log('\n检查用户登录状态...');
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.log('❌ 用户未登录');
  } else {
    console.log(`✅ 已登录用户: ${user.email} (ID: ${user.id})`);
    
    // 测试 get_brand_events 使用真实用户ID
    console.log('\n测试 get_brand_events 使用真实用户ID...');
    const { data: eventsData, error: eventsError } = await supabase.rpc('get_brand_events', { 
      p_user_id: user.id 
    });
    
    if (eventsError) {
      console.log(`❌ 调用失败: ${eventsError.message}`);
      console.log('错误详情:', eventsError);
    } else {
      console.log(`✅ 调用成功，返回 ${eventsData?.length || 0} 个活动`);
      if (eventsData && eventsData.length > 0) {
        console.log('活动列表:', eventsData.map(e => e.title));
      }
    }
  }
}

checkRpcFunctions();
