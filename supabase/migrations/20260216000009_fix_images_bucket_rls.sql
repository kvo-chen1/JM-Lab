-- 修复 images bucket 的 RLS 策略
-- 解决作品图片上传失败问题

-- 1. 确保 images bucket 存在且公开
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. 删除 images bucket 的所有现有策略
DROP POLICY IF EXISTS "Allow public read from images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update on images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete on images" ON storage.objects;

-- 3. 创建 SELECT 策略（允许公开读取）
CREATE POLICY "Allow public read from images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- 4. 创建 INSERT 策略（允许认证用户上传）
CREATE POLICY "Allow authenticated upload to images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- 5. 创建 UPDATE 策略（允许认证用户更新）
CREATE POLICY "Allow authenticated update on images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- 6. 创建 DELETE 策略（允许认证用户删除）
CREATE POLICY "Allow authenticated delete on images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- 7. 验证 bucket 设置
UPDATE storage.buckets 
SET public = true, 
    file_size_limit = 52428800,  -- 50MB
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
WHERE id = 'images';

-- 8. 刷新缓存
NOTIFY pgrst, 'reload schema';
