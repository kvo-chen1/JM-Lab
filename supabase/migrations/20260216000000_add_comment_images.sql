-- 为评论表添加图片支持

-- 1. 为 work_comments 表添加图片字段
ALTER TABLE public.work_comments
ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;

-- 2. 为 comments 表添加图片字段（如果存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'comments' AND table_schema = 'public') THEN
        ALTER TABLE public.comments
        ADD COLUMN IF NOT EXISTS images JSONB DEFAULT '[]'::jsonb;
    END IF;
END $$;

-- 3. 创建评论图片存储 bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('comment-images', 'comment-images', true)
ON CONFLICT (id) DO NOTHING;

-- 4. 设置评论图片 bucket 的 RLS 策略
-- 先删除已存在的策略（避免冲突）
DROP POLICY IF EXISTS "Allow public read access on comment-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload comment-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow users to delete their own comment-images" ON storage.objects;

-- 允许任何人查看评论图片
CREATE POLICY "Allow public read access on comment-images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'comment-images');

-- 允许认证用户上传评论图片
CREATE POLICY "Allow authenticated users to upload comment-images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'comment-images');

-- 允许用户删除自己的评论图片
CREATE POLICY "Allow users to delete their own comment-images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'comment-images' AND auth.uid()::text = (storage.foldername(name))[1]);

-- 5. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成：评论表现在支持图片字段
-- ==========================================================================
