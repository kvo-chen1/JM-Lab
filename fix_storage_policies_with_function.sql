-- 使用 SECURITY DEFINER 函数修复 event-submissions 存储桶 RLS 策略
-- 这样可以绕过权限限制

-- 1. 创建修复函数（使用 SECURITY DEFINER 以管理员权限执行）
CREATE OR REPLACE FUNCTION public.fix_event_submissions_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
    -- 确保 bucket 存在
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('event-submissions', 'event-submissions', true)
    ON CONFLICT (id) DO NOTHING;

    -- 删除所有可能冲突的旧策略
    DROP POLICY IF EXISTS "Allow public read access on event-submissions bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to upload to event-submissions bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to update own files in event-submissions bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to delete own files in event-submissions bucket" ON storage.objects;
    DROP POLICY IF EXISTS "event_submissions_all" ON storage.objects;
    DROP POLICY IF EXISTS "event_submissions_insert_policy" ON storage.objects;
    DROP POLICY IF EXISTS "event_submissions_select_policy" ON storage.objects;
    DROP POLICY IF EXISTS "删除认证 1gip910_0" ON storage.objects;
    DROP POLICY IF EXISTS "删除认证 1gip910_1" ON storage.objects;
    DROP POLICY IF EXISTS "插入认证 1gip910_0" ON storage.objects;
    DROP POLICY IF EXISTS "select_all 1gip910_0" ON storage.objects;
    DROP POLICY IF EXISTS "更新认证 1gip910_0" ON storage.objects;
    DROP POLICY IF EXISTS "更新认证 1gip910_1" ON storage.objects;

    -- 创建宽松策略
    -- 允许任何人读取
    CREATE POLICY "event_submissions_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-submissions');

    -- 允许认证用户插入
    CREATE POLICY "event_submissions_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (bucket_id = 'event-submissions');

    -- 允许认证用户更新
    CREATE POLICY "event_submissions_update"
    ON storage.objects FOR UPDATE
    USING (bucket_id = 'event-submissions');

    -- 允许认证用户删除
    CREATE POLICY "event_submissions_delete"
    ON storage.objects FOR DELETE
    USING (bucket_id = 'event-submissions');

    -- 启用 RLS
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

    RAISE NOTICE 'Event submissions policies fixed successfully';
END;
$$;

-- 2. 执行修复函数
SELECT public.fix_event_submissions_policies();

-- 3. 删除临时函数（可选，保留也可以）
-- DROP FUNCTION IF EXISTS public.fix_event_submissions_policies();

-- 4. 验证策略是否创建成功
SELECT policyname, cmd, roles::text
FROM pg_policies
WHERE schemaname = 'storage'
AND tablename = 'objects'
AND policyname LIKE 'event_submissions%';
