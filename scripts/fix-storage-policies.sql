-- 修复 event-submissions 存储桶的 RLS 策略
-- 使用 SECURITY DEFINER 绕过权限检查

-- 创建策略配置函数
CREATE OR REPLACE FUNCTION public.configure_event_submissions_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, storage
AS $$
BEGIN
    -- 1. 删除所有已存在的策略（避免冲突）
    DROP POLICY IF EXISTS "Allow public read access on event-submissions bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to upload to event-submissions bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to update own files in event-submissions bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to delete own files in event-submissions bucket" ON storage.objects;
    DROP POLICY IF EXISTS "event_submissions_select" ON storage.objects;
    DROP POLICY IF EXISTS "event_submissions_insert" ON storage.objects;
    DROP POLICY IF EXISTS "event_submissions_update" ON storage.objects;
    DROP POLICY IF EXISTS "event_submissions_delete" ON storage.objects;

    -- 2. 创建 SELECT 策略（允许任何人读取）
    CREATE POLICY "event_submissions_select"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'event-submissions');

    -- 3. 创建 INSERT 策略（允许认证用户上传）
    -- 注意：使用 auth.uid() 检查用户是否已认证
    CREATE POLICY "event_submissions_insert"
    ON storage.objects FOR INSERT
    WITH CHECK (
        bucket_id = 'event-submissions'
        AND auth.uid() IS NOT NULL
    );

    -- 4. 创建 UPDATE 策略（允许认证用户更新自己的文件）
    CREATE POLICY "event_submissions_update"
    ON storage.objects FOR UPDATE
    USING (
        bucket_id = 'event-submissions'
        AND auth.uid() IS NOT NULL
    )
    WITH CHECK (
        bucket_id = 'event-submissions'
        AND auth.uid() IS NOT NULL
    );

    -- 5. 创建 DELETE 策略（允许认证用户删除自己的文件）
    CREATE POLICY "event_submissions_delete"
    ON storage.objects FOR DELETE
    USING (
        bucket_id = 'event-submissions'
        AND auth.uid() IS NOT NULL
    );

    -- 6. 确保 RLS 已启用
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'event-submissions storage policies configured successfully';
END;
$$;

-- 执行策略配置
SELECT public.configure_event_submissions_policies();

-- 删除临时函数
DROP FUNCTION IF EXISTS public.configure_event_submissions_policies();

-- 验证策略是否创建成功
SELECT 
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'storage' 
AND tablename = 'objects'
AND policyname LIKE 'event_submissions%';
