-- 修复 works bucket 的上传策略，允许认证用户上传作品图片
-- 解决 "new row violates row-level security policy" 错误

-- 1. 确保 works bucket 存在且公开
INSERT INTO storage.buckets (id, name, public)
VALUES ('works', 'works', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. 删除现有的 INSERT 策略（如果有）
DROP POLICY IF EXISTS "Allow authenticated upload to works" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to upload videos" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated insert on works" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to videos folder" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to works root" ON storage.objects;

-- 3. 创建新的 INSERT 策略，允许认证用户上传到 works bucket
CREATE POLICY "Allow authenticated upload to works"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'works'
);

-- 4. 确保 SELECT 策略也存在（用于读取）
DROP POLICY IF EXISTS "Allow public read from works" ON storage.objects;
CREATE POLICY "Allow public read from works"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'works');

-- 5. 确保 UPDATE 策略存在（用于更新）
DROP POLICY IF EXISTS "Allow authenticated update on works" ON storage.objects;
CREATE POLICY "Allow authenticated update on works"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'works')
WITH CHECK (bucket_id = 'works');

-- 6. 确保 DELETE 策略存在（用于删除）
DROP POLICY IF EXISTS "Allow authenticated delete on works" ON storage.objects;
CREATE POLICY "Allow authenticated delete on works"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'works');
