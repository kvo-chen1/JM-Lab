-- 修复 event-submissions 存储桶 RLS 策略（最终版）
-- 策略已存在，直接验证是否工作正常

-- 1. 确保 bucket 存在
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-submissions', 'event-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 删除现有策略（如果存在）
DROP POLICY IF EXISTS "event_submissions_insert" ON storage.objects;
DROP POLICY IF EXISTS "event_submissions_select" ON storage.objects;
DROP POLICY IF EXISTS "event_submissions_update" ON storage.objects;
DROP POLICY IF EXISTS "event_submissions_delete" ON storage.objects;

-- 3. 重新创建策略
-- 允许任何人读取
CREATE POLICY "event_submissions_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-submissions');

-- 允许插入
CREATE POLICY "event_submissions_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-submissions');

-- 允许更新
CREATE POLICY "event_submissions_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-submissions');

-- 允许删除
CREATE POLICY "event_submissions_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-submissions');

-- 4. 启用 RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. 验证策略
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE 'event_submissions%'
ORDER BY policyname;
