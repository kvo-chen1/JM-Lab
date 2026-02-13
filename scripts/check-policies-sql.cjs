/**
 * 查询 event-submissions 的 RLS 策略
 */

const supabaseUrl = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('错误: 请设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

async function checkPolicies() {
  console.log('查询 event-submissions 存储桶策略...\n');

  try {
    // 使用 RPC 或直接查询
    const response = await fetch(`${supabaseUrl}/rest/v1/rpc/get_policies`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey
      },
      body: JSON.stringify({
        bucket_name: 'event-submissions'
      })
    });

    if (!response.ok) {
      // 如果 RPC 不存在，直接查询 pg_policies
      const sqlResponse = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${supabaseServiceKey}`,
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey
        },
        body: JSON.stringify({
          query: `
            SELECT 
              policyname,
              permissive,
              roles::text,
              cmd,
              qual::text as using_expression,
              with_check::text
            FROM pg_policies 
            WHERE schemaname = 'storage' 
            AND tablename = 'objects'
            AND (
              policyname LIKE '%event%submission%'
              OR qual::text LIKE '%event-submissions%'
              OR with_check::text LIKE '%event-submissions%'
            )
            ORDER BY policyname;
          `
        })
      });

      if (!sqlResponse.ok) {
        const error = await sqlResponse.text();
        console.log('无法查询策略:', error);
        console.log('\n请手动在 Dashboard 中检查:');
        console.log('Storage > event-submissions > Policies');
        return;
      }

      const policies = await sqlResponse.json();
      console.log('当前策略:');
      console.log(JSON.stringify(policies, null, 2));
    } else {
      const data = await response.json();
      console.log('策略:', data);
    }

  } catch (error) {
    console.error('查询失败:', error.message);
    console.log('\n请手动检查 Dashboard:');
    console.log('1. 进入 Storage > event-submissions > Policies');
    console.log('2. 点击每个策略查看详情');
    console.log('3. 确保 Policy definition 是: bucket_id = \'event-submissions\'');
  }
}

checkPolicies();
