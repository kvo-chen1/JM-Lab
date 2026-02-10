-- ============================================
-- Supabase Storage 存储桶配置（修复版）
-- 用于品牌Logo上传
-- ============================================

-- 1. 创建存储桶（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO NOTHING;

-- 2. 配置存储桶为公开访问
UPDATE storage.buckets
SET public = true
WHERE id = 'brand-logos';

-- 3. 删除已存在的策略（避免冲突）
DROP POLICY IF EXISTS "允许认证用户上传品牌Logo" ON storage.objects;
DROP POLICY IF EXISTS "允许任何人上传品牌Logo" ON storage.objects;
DROP POLICY IF EXISTS "允许公开访问品牌Logo" ON storage.objects;
DROP POLICY IF EXISTS "允许认证用户更新自己的品牌Logo" ON storage.objects;
DROP POLICY IF EXISTS "允许认证用户删除自己的品牌Logo" ON storage.objects;

-- 4. 允许任何人上传文件到 brand-logos 存储桶（为了品牌入驻申请）
CREATE POLICY "允许任何人上传品牌Logo" ON storage.objects
    FOR INSERT TO public
    WITH CHECK (bucket_id = 'brand-logos');

-- 5. 允许任何人查看 brand-logos 存储桶中的文件
CREATE POLICY "允许公开访问品牌Logo" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'brand-logos');

-- 6. 允许任何人更新文件（简化策略）
CREATE POLICY "允许任何人更新品牌Logo" ON storage.objects
    FOR UPDATE TO public
    USING (bucket_id = 'brand-logos');

-- 7. 允许任何人删除文件（简化策略）
CREATE POLICY "允许任何人删除品牌Logo" ON storage.objects
    FOR DELETE TO public
    USING (bucket_id = 'brand-logos');

-- ============================================
-- 存储桶配置完成！
-- ============================================
