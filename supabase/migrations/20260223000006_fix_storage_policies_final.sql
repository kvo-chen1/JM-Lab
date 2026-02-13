-- 最终修复 event-submissions 存储桶策略
-- 使用最简单的方法：删除所有策略，创建宽松的新策略

-- 1. 删除所有现有策略
DROP POLICY IF EXISTS "删除认证 1gip910_0" ON storage.objects;
DROP POLICY IF EXISTS "删除认证 1gip910_1" ON storage.objects;
DROP POLICY IF EXISTS "插入认证 1gip910_0" ON storage.objects;
DROP POLICY IF EXISTS "select_all 1gip910_0" ON storage.objects;
DROP POLICY IF EXISTS "更新认证 1gip910_0" ON storage.objects;
DROP POLICY IF EXISTS "更新认证 1gip910_1" ON storage.objects;

-- 2. 创建最简单的策略
-- 允许所有人进行所有操作（仅用于测试，生产环境应该更严格）
CREATE POLICY "event_submissions_all"
ON storage.objects FOR ALL
USING (bucket_id = 'event-submissions')
WITH CHECK (bucket_id = 'event-submissions');

-- 3. 启用 RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. 验证
SELECT policyname, cmd, roles::text
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname = 'event_submissions_all';
