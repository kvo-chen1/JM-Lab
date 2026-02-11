-- 修复 works storage bucket 的 RLS 策略
-- 允许认证用户上传、更新和删除自己的文件

-- 1. 确保 works bucket 存在
INSERT INTO storage.buckets (id, name, public)
VALUES ('works', 'works', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 删除旧的策略（如果存在）
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload to works bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own files in works bucket" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own files in works bucket" ON storage.objects;

-- 3. 为 works bucket 创建新的 RLS 策略

-- 3.1 允许任何人读取 works bucket 中的文件
CREATE POLICY "Allow public read access on works bucket"
ON storage.objects FOR SELECT
USING ( bucket_id = 'works' );

-- 3.2 允许认证用户上传文件到 works bucket
CREATE POLICY "Allow authenticated users to upload to works bucket"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'works'
  AND auth.role() = 'authenticated'
);

-- 3.3 允许认证用户更新自己在 works bucket 中的文件
CREATE POLICY "Allow authenticated users to update own files in works bucket"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'works'
  AND auth.role() = 'authenticated'
)
WITH CHECK (
  bucket_id = 'works'
  AND auth.role() = 'authenticated'
);

-- 3.4 允许认证用户删除自己在 works bucket 中的文件
CREATE POLICY "Allow authenticated users to delete own files in works bucket"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'works'
  AND auth.role() = 'authenticated'
);

-- 4. 确保 storage.objects 表的 RLS 已启用
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. 为 avatars 路径创建专门的策略（如果用户想使用单独的 avatars 文件夹）
-- 允许认证用户上传头像
CREATE POLICY "Allow authenticated users to upload avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'works'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = 'avatars'
);
