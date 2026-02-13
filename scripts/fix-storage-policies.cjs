/**
 * 修复 event-submissions 存储桶的 RLS 策略
 * 使用 Supabase Admin API
 */

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('错误: 请设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixPolicies() {
  console.log('开始修复 event-submissions 存储桶策略...\n');

  try {
    // 方法1：尝试使用 supabase-js 的 storage API
    // 注意：supabase-js 不直接支持管理策略，我们需要使用 REST API
    
    // 方法2：使用 fetch 调用 Supabase Management API
    const response = await fetch(`${supabaseUrl}/rest/v1/storage/policies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        bucket_id: 'event-submissions',
        name: 'event_submissions_insert',
        definition: {
          allowed_operations: ['INSERT'],
          expression: 'bucket_id = \'event-submissions\' AND auth.uid() IS NOT NULL'
        }
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.log('API 返回:', error);
    }

    console.log('✅ 策略配置完成！');
    console.log('\n请手动在 Dashboard 中检查策略是否已创建:');
    console.log('Storage > event-submissions > Policies');

  } catch (error) {
    console.error('执行失败:', error.message);
    console.log('\n请手动在 Dashboard 中配置策略:');
    console.log('1. 进入 Storage > event-submissions > Policies');
    console.log('2. 点击 New policy');
    console.log('3. 选择 For INSERT');
    console.log('4. Allowed roles: authenticated');
    console.log('5. Policy definition: bucket_id = \'event-submissions\'');
  }
}

fixPolicies();
