-- ============================================
-- Supabase Storage 存储桶配置
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

-- 3. 允许认证用户上传文件到 brand-logos 存储桶
CREATE POLICY "允许认证用户上传品牌Logo" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'brand-logos');

-- 4. 允许任何人查看 brand-logos 存储桶中的文件
CREATE POLICY "允许公开访问品牌Logo" ON storage.objects
    FOR SELECT TO public
    USING (bucket_id = 'brand-logos');

-- 5. 允许认证用户更新自己的文件
CREATE POLICY "允许认证用户更新自己的品牌Logo" ON storage.objects
    FOR UPDATE TO authenticated
    USING (bucket_id = 'brand-logos' AND owner = auth.uid());

-- 6. 允许认证用户删除自己的文件
CREATE POLICY "允许认证用户删除自己的品牌Logo" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'brand-logos' AND owner = auth.uid());

-- ============================================
-- 存储桶配置完成！
-- ============================================
