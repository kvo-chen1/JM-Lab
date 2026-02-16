-- 完全开放的 Storage RLS 策略（开发环境使用）
-- 允许任何人上传、读取、更新、删除 images bucket 中的文件

-- 1. 先禁用 RLS（最宽松的方式）
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 2. 确保 images bucket 存在且公开
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'images', 
    'images', 
    true, 
    52428800,  -- 50MB
    ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 52428800,
    allowed_mime_types = ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp', 'image/gif'];

-- 3. 删除所有现有策略
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN 
        SELECT policyname 
        FROM pg_policies 
        WHERE schemaname = 'storage' AND tablename = 'objects'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON storage.objects', pol.policyname);
    END LOOP;
END $$;

-- 4. 重新启用 RLS
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 5. 创建完全开放的策略（允许任何人做任何操作）
CREATE POLICY "Allow all operations for everyone"
ON storage.objects
FOR ALL
TO public
USING (true)
WITH CHECK (true);

-- 6. 确保 bucket 是公开的
UPDATE storage.buckets 
SET public = true
WHERE id = 'images';

-- 7. 刷新缓存
NOTIFY pgrst, 'reload schema';
