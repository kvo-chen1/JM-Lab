-- 修复 event-submissions 存储桶 RLS 策略
-- 执行此脚本到 Supabase SQL Editor

-- 1. 确保 bucket 存在
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-submissions', 'event-submissions', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 删除所有现有策略（避免冲突）
DROP POLICY IF EXISTS "Allow public read access on event-submissions bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload to event-submissions bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to update own files in event-submissions bucket" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to delete own files in event-submissions bucket" ON storage.objects;
DROP POLICY IF EXISTS "event_submissions_all" ON storage.objects;
DROP POLICY IF EXISTS "删除认证 1gip910_0" ON storage.objects;
DROP POLICY IF EXISTS "删除认证 1gip910_1" ON storage.objects;
DROP POLICY IF EXISTS "插入认证 1gip910_0" ON storage.objects;
DROP POLICY IF EXISTS "select_all 1gip910_0" ON storage.objects;
DROP POLICY IF EXISTS "更新认证 1gip910_0" ON storage.objects;
DROP POLICY IF EXISTS "更新认证 1gip910_1" ON storage.objects;

-- 3. 创建宽松策略（允许认证用户进行所有操作）
CREATE POLICY "event_submissions_select"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-submissions');

CREATE POLICY "event_submissions_insert"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'event-submissions' AND auth.role() = 'authenticated');

CREATE POLICY "event_submissions_update"
ON storage.objects FOR UPDATE
USING (bucket_id = 'event-submissions' AND auth.role() = 'authenticated');

CREATE POLICY "event_submissions_delete"
ON storage.objects FOR DELETE
USING (bucket_id = 'event-submissions' AND auth.role() = 'authenticated');

-- 4. 确保 RLS 启用
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. 验证策略
SELECT policyname, cmd, roles::text, qual::text
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE 'event_submissions%';
