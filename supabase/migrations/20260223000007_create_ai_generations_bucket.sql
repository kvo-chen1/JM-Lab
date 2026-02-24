-- 创建 ai-generations 存储桶用于保存AI生成的图片和视频
-- 解决AI生成内容临时URL过期问题

-- 1. 创建 ai-generations bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('ai-generations', 'ai-generations', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. 删除 ai-generations bucket 的所有现有策略（避免重复）
DROP POLICY IF EXISTS "Allow public read from ai-generations" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated upload to ai-generations" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated update on ai-generations" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated delete on ai-generations" ON storage.objects;

-- 3. 创建 SELECT 策略（允许公开读取）
CREATE POLICY "Allow public read from ai-generations"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ai-generations');

-- 4. 创建 INSERT 策略（允许认证用户上传）
CREATE POLICY "Allow authenticated upload to ai-generations"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ai-generations');

-- 5. 创建 UPDATE 策略（允许认证用户更新）
CREATE POLICY "Allow authenticated update on ai-generations"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'ai-generations')
WITH CHECK (bucket_id = 'ai-generations');

-- 6. 创建 DELETE 策略（允许认证用户删除）
CREATE POLICY "Allow authenticated delete on ai-generations"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'ai-generations');

-- 7. 配置 bucket 设置
UPDATE storage.buckets 
SET public = true, 
    file_size_limit = 104857600,  -- 100MB，支持视频文件
    allowed_mime_types = ARRAY[
        'image/png', 
        'image/jpeg', 
        'image/jpg', 
        'image/webp', 
        'image/gif',
        'video/mp4',
        'video/webm',
        'video/quicktime'
    ]
WHERE id = 'ai-generations';

-- 8. 刷新缓存
NOTIFY pgrst, 'reload schema';

-- 9. 验证创建结果
SELECT 
    b.id as bucket_id,
    b.name,
    b.public,
    b.file_size_limit,
    b.allowed_mime_types,
    COUNT(p.policyname) as policy_count
FROM storage.buckets b
LEFT JOIN pg_policies p ON p.schemaname = 'storage' 
    AND p.tablename = 'objects' 
    AND p.policyname LIKE '%ai-generations%'
WHERE b.id = 'ai-generations'
GROUP BY b.id, b.name, b.public, b.file_size_limit, b.allowed_mime_types;
