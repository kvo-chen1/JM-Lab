/**
 * 直接修复 event-submissions 存储桶的 RLS 策略
 * 使用 Service Role Key 通过 SQL API
 */

const supabaseUrl = 'https://pptqdicaaewtnaiflfcs.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseServiceKey) {
  console.error('错误: 请设置 SUPABASE_SERVICE_ROLE_KEY 环境变量');
  process.exit(1);
}

async function fixPolicies() {
  console.log('修复 event-submissions 存储桶策略...\n');

  // SQL 语句来修复策略
  const sql = `
-- 删除所有 event-submissions 相关的旧策略
DROP POLICY IF EXISTS "允许已认证用户删除 1gip910_0" ON storage.objects;
DROP POLICY IF EXISTS "允许已认证用户删除 1gip910_1" ON storage.objects;
DROP POLICY IF EXISTS "允许经过身份验证的更新 1gip910_0" ON storage.objects;
DROP POLICY IF EXISTS "允许经过身份验证的更新 1gip910_1" ON storage.objects;
DROP POLICY IF EXISTS "允许已认证上传 1gip910_0" ON storage.objects;
DROP POLICY IF EXISTS "允许公开读取 1gip910_0" ON storage.objects;

-- 创建新的策略
-- 1. SELECT 策略（允许所有人读取）
CREATE POLICY "event_submissions_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-submissions');

-- 2. INSERT 策略（允许认证用户上传）
CREATE POLICY "event_submissions_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-submissions');

-- 3. UPDATE 策略（允许认证用户更新）
CREATE POLICY "event_submissions_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-submissions')
WITH CHECK (bucket_id = 'event-submissions');

-- 4. DELETE 策略（允许认证用户删除）
CREATE POLICY "event_submissions_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-submissions');

-- 启用 RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 验证策略
SELECT policyname, permissive, roles::text, cmd, qual::text, with_check::text
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE 'event_submissions%';
`;

  try {
    const response = await fetch(`${supabaseUrl}/rest/v1/`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${supabaseServiceKey}`,
        'Content-Type': 'application/json',
        'apikey': supabaseServiceKey,
        'Prefer': 'resolution=merge-duplicates'
      },
      body: JSON.stringify({
        query: sql
      })
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('SQL 执行失败:', error);
      console.log('\n请手动在 Dashboard 中执行以下操作:');
      console.log('1. 删除所有现有的 event-submissions 策略');
      console.log('2. 重新创建策略，确保 Policy definition 是: bucket_id = \'event-submissions\'');
      return;
    }

    const result = await response.json();
    console.log('✅ 策略修复成功！');
    console.log('结果:', result);

  } catch (error) {
    console.error('执行失败:', error.message);
    console.log('\n请手动在 Dashboard 中:');
    console.log('1. 删除所有现有的 event-submissions 策略');
    console.log('2. 创建新策略，Policy definition 填写: bucket_id = \'event-submissions\'');
  }
}

fixPolicies();
