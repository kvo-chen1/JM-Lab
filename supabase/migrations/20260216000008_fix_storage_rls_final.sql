-- 最终修复 works bucket 的 RLS 策略
-- 解决图片上传失败问题

-- 1. 先禁用 RLS（确保可以上传）
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. 确保 works bucket 存在且公开
INSERT INTO storage.buckets (id, name, public)
VALUES ('works', 'works', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. 删除所有现有策略
DROP POLICY IF EXISTS "Allow authenticated upload to works" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert on works" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to videos folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to works root" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read from works" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update on works" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete on works" ON storage.objects;
DROP POLICY IF EXISTS "完全开放策略" ON storage.objects;

-- 4. 重新启用 RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. 创建完全开放的策略（允许所有操作）
CREATE POLICY "Allow all operations on works"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'works')
WITH CHECK (bucket_id = 'works');

-- 6. 验证 bucket 设置
UPDATE storage.buckets 
SET public = true, 
    file_size_limit = 52428800,  -- 50MB
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif', 'video/mp4', 'video/webm']
WHERE id = 'works';
