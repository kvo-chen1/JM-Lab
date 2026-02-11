-- 恢复 works bucket 的 INSERT 策略，只允许上传到 videos 文件夹
-- 这是为了区分作品视频和头像上传

-- 注意：由于权限限制，这些 SQL 可能需要在 Supabase Dashboard 中手动执行

-- 1. 删除现有的 INSERT 策略（如果有）
-- DROP POLICY IF EXISTS "Allow authenticated users to upload videos" ON storage.objects;
-- DROP POLICY IF EXISTS "Allow authenticated insert on works" ON storage.objects;

-- 2. 创建新的 INSERT 策略，只允许上传到 videos 文件夹
-- CREATE POLICY "Allow authenticated upload to videos folder"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'works' 
--   AND auth.role() = 'authenticated'
--   AND (storage.foldername(name))[1] = 'videos'
-- );

-- 3. 创建另一个 INSERT 策略，允许上传到 works 根目录（用于作品图片）
-- CREATE POLICY "Allow authenticated upload to works root"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'works' 
--   AND auth.role() = 'authenticated'
--   AND (storage.foldername(name))[1] IS NULL
-- );

-- 或者在 Dashboard 中手动配置：
-- 策略名称: Allow authenticated upload to works
-- 操作: INSERT
-- 角色: authenticated
-- 表达式: bucket_id = 'works' AND auth.role() = 'authenticated'
