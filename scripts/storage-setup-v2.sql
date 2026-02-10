-- ============================================
-- Supabase Storage 存储桶配置 V2
-- 修复 RLS 策略问题
-- ============================================

-- 1. 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 配置存储桶为公开访问
UPDATE storage.buckets
SET public = true
WHERE id = 'brand-logos';

-- 3. 删除所有已存在的策略
DROP POLICY IF EXISTS "允许认证用户上传品牌Logo" ON storage.objects;
DROP POLICY IF EXISTS "允许任何人上传品牌Logo" ON storage.objects;
DROP POLICY IF EXISTS "允许公开访问品牌Logo" ON storage.objects;
DROP POLICY IF EXISTS "允许认证用户更新自己的品牌Logo" ON storage.objects;
DROP POLICY IF EXISTS "允许认证用户删除自己的品牌Logo" ON storage.objects;
DROP POLICY IF EXISTS "允许任何人更新品牌Logo" ON storage.objects;
DROP POLICY IF EXISTS "允许任何人删除品牌Logo" ON storage.objects;

-- 4. 允许任何人（包括匿名用户）上传文件
-- 注意：这里使用 true 条件，允许所有请求
CREATE POLICY "允许任何人上传品牌Logo" ON storage.objects
    FOR INSERT TO public
    WITH CHECK (bucket_id = 'brand-logos');

-- 5. 允许任何人查看文件
CREATE POLICY "允许任何人查看品牌Logo" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'brand-logos');

-- 6. 允许任何人更新文件
CREATE POLICY "允许任何人更新品牌Logo" ON storage.objects
    FOR UPDATE TO public
    USING (bucket_id = 'brand-logos');

-- 7. 允许任何人删除文件
CREATE POLICY "允许任何人删除品牌Logo" ON storage.objects
    FOR DELETE TO public
    USING (bucket_id = 'brand-logos');

-- 8. 临时禁用 RLS（如果上述策略仍不生效）
-- 注意：这会使存储桶完全公开，生产环境请谨慎使用
-- ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 存储桶配置完成！
-- ============================================
