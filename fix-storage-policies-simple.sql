-- 修复 works bucket 的 RLS 策略
-- 先删除可能冲突的旧策略，然后创建新的

-- 注意：在 SQL Editor 中运行这些命令可能需要特殊权限
-- 如果失败，请使用 Dashboard UI 手动配置

-- 方法 1: 尝试直接创建策略（如果权限允许）
DO $$
BEGIN
  -- 删除旧的 works 相关策略（如果存在）
  DROP POLICY IF EXISTS "Allow public view 1vgtc2_0" ON storage.objects;
  DROP POLICY IF EXISTS "Allow authenticated upload 1vgtc2_0" ON storage.objects;
  DROP POLICY IF EXISTS "Allow owner delete 1vgtc2_0" ON storage.objects;
  DROP POLICY IF EXISTS "Allow owner delete 1vgtc2_1" ON storage.objects;
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE '删除旧策略时出错: %', SQLERRM;
END $$;

-- 方法 2: 创建新的策略
-- 这些命令在 SQL Editor 中可能会因为权限而失败
-- 如果失败，请按照下方指南在 Dashboard 中手动配置

-- 为 works bucket 创建 SELECT 策略（允许公开读取）
-- CREATE POLICY "Allow public read on works"
-- ON storage.objects FOR SELECT
-- USING (bucket_id = 'works');

-- 为 works bucket 创建 INSERT 策略（允许认证用户上传）
-- CREATE POLICY "Allow authenticated insert on works"
-- ON storage.objects FOR INSERT
-- WITH CHECK (bucket_id = 'works' AND auth.role() = 'authenticated');

-- 为 works bucket 创建 DELETE 策略（允许认证用户删除）
-- CREATE POLICY "Allow authenticated delete on works"
-- ON storage.objects FOR DELETE
-- USING (bucket_id = 'works' AND auth.role() = 'authenticated');

-- 启用 RLS
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
