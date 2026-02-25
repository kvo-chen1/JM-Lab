-- 创建品牌入驻相关的 storage buckets
-- 用于存储品牌Logo和营业执照等资质文件

-- 使用 SECURITY DEFINER 函数绕过权限检查
CREATE OR REPLACE FUNCTION public.create_brand_storage_buckets()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 1. 创建 brandlogos bucket（如果不存在）
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('brandlogos', 'brandlogos', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
    
    -- 2. 创建 business-licenses bucket（如果不存在）
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('business-licenses', 'business-licenses', true)
    ON CONFLICT (id) DO UPDATE SET public = true;
    
    -- 3. 删除 brandlogos bucket 的所有现有策略（避免重复）
    DROP POLICY IF EXISTS "Allow public read from brandlogos" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated upload to brandlogos" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated update on brandlogos" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated delete on brandlogos" ON storage.objects;

    -- 4. 删除 business-licenses bucket 的所有现有策略（避免重复）
    DROP POLICY IF EXISTS "Allow public read from business-licenses" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated upload to business-licenses" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated update on business-licenses" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated delete on business-licenses" ON storage.objects;

    -- 5. 创建 brandlogos SELECT 策略（允许公开读取）
    CREATE POLICY "Allow public read from brandlogos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'brandlogos');

    -- 6. 创建 brandlogos INSERT 策略（允许认证用户上传）
    CREATE POLICY "Allow authenticated upload to brandlogos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'brandlogos');

    -- 7. 创建 brandlogos UPDATE 策略（允许认证用户更新）
    CREATE POLICY "Allow authenticated update on brandlogos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'brandlogos')
    WITH CHECK (bucket_id = 'brandlogos');

    -- 8. 创建 brandlogos DELETE 策略（允许认证用户删除）
    CREATE POLICY "Allow authenticated delete on brandlogos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'brandlogos');

    -- 9. 创建 business-licenses SELECT 策略（允许公开读取）
    CREATE POLICY "Allow public read from business-licenses"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'business-licenses');

    -- 10. 创建 business-licenses INSERT 策略（允许认证用户上传）
    CREATE POLICY "Allow authenticated upload to business-licenses"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'business-licenses');

    -- 11. 创建 business-licenses UPDATE 策略（允许认证用户更新）
    CREATE POLICY "Allow authenticated update on business-licenses"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'business-licenses')
    WITH CHECK (bucket_id = 'business-licenses');

    -- 12. 创建 business-licenses DELETE 策略（允许认证用户删除）
    CREATE POLICY "Allow authenticated delete on business-licenses"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'business-licenses');

    -- 13. 配置 brandlogos bucket 设置
    UPDATE storage.buckets 
    SET public = true, 
        file_size_limit = 5242880,  -- 5MB
        allowed_mime_types = ARRAY[
            'image/png', 
            'image/jpeg', 
            'image/jpg', 
            'image/webp'
        ]
    WHERE id = 'brandlogos';

    -- 14. 配置 business-licenses bucket 设置
    UPDATE storage.buckets 
    SET public = true, 
        file_size_limit = 5242880,  -- 5MB
        allowed_mime_types = ARRAY[
            'image/png', 
            'image/jpeg', 
            'image/jpg', 
            'image/webp',
            'application/pdf'
        ]
    WHERE id = 'business-licenses';

    -- 15. 确保 storage.objects 表的 RLS 已启用
    ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
    
    RAISE NOTICE 'Brand storage buckets and policies created successfully';
END;
$$;

-- 执行函数
SELECT public.create_brand_storage_buckets();

-- 删除临时函数
DROP FUNCTION IF EXISTS public.create_brand_storage_buckets();

-- 验证创建结果
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
    AND (p.policyname LIKE '%brandlogos%' OR p.policyname LIKE '%business-licenses%')
WHERE b.id IN ('brandlogos', 'business-licenses')
GROUP BY b.id, b.name, b.public, b.file_size_limit, b.allowed_mime_types;
