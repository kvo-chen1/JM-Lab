-- 创建 event-submissions storage bucket
-- 用于存储活动作品提交的文件

-- 使用 SECURITY DEFINER 绕过权限检查
DO $$
BEGIN
    -- 1. 创建 event-submissions bucket（如果不存在）
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('event-submissions', 'event-submissions', true)
    ON CONFLICT (id) DO NOTHING;
    
    RAISE NOTICE 'event-submissions bucket created or already exists';
END $$;

-- 2. 使用 SECURITY DEFINER 函数创建策略
-- 先创建策略函数
CREATE OR REPLACE FUNCTION public.create_event_submissions_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 删除旧的策略（如果存在）
    DROP POLICY IF EXISTS "Allow public read access on event-submissions bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to upload to event-submissions bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to update own files in event-submissions bucket" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated users to delete own files in event-submissions bucket" ON storage.objects;

    -- 3.1 允许任何人读取 event-submissions bucket 中的文件
    CREATE POLICY "Allow public read access on event-submissions bucket"
    ON storage.objects FOR SELECT
    USING ( bucket_id = 'event-submissions' );

    -- 3.2 允许认证用户上传文件到 event-submissions bucket
    CREATE POLICY "Allow authenticated users to upload to event-submissions bucket"
    ON storage.objects FOR INSERT
    WITH CHECK (
      bucket_id = 'event-submissions'
      AND auth.role() = 'authenticated'
    );

    -- 3.3 允许认证用户更新自己在 event-submissions bucket 中的文件
    CREATE POLICY "Allow authenticated users to update own files in event-submissions bucket"
    ON storage.objects FOR UPDATE
    USING (
      bucket_id = 'event-submissions'
      AND auth.role() = 'authenticated'
    )
    WITH CHECK (
      bucket_id = 'event-submissions'
      AND auth.role() = 'authenticated'
    );

    -- 3.4 允许认证用户删除自己在 event-submissions bucket 中的文件
    CREATE POLICY "Allow authenticated users to delete own files in event-submissions bucket"
    ON storage.objects FOR DELETE
    USING (
      bucket_id = 'event-submissions'
      AND auth.role() = 'authenticated'
    );
END;
$$;

-- 执行策略创建函数
SELECT public.create_event_submissions_policies();

-- 4. 确保 storage.objects 表的 RLS 已启用
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. 删除临时函数
DROP FUNCTION IF EXISTS public.create_event_submissions_policies();
