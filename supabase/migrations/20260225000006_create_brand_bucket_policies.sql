-- 为 brandlogos 和 business-licenses 存储桶创建访问策略
-- 使用 SECURITY DEFINER 函数绕过权限检查

CREATE OR REPLACE FUNCTION public.create_brand_bucket_policies()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- 删除 brandlogos bucket 的所有现有策略（避免重复）
    DROP POLICY IF EXISTS "Allow public read from brandlogos" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated upload to brandlogos" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated update on brandlogos" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated delete on brandlogos" ON storage.objects;

    -- 删除 business-licenses bucket 的所有现有策略（避免重复）
    DROP POLICY IF EXISTS "Allow public read from business-licenses" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated upload to business-licenses" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated update on business-licenses" ON storage.objects;
    DROP POLICY IF EXISTS "Allow authenticated delete on business-licenses" ON storage.objects;

    -- 创建 brandlogos SELECT 策略（允许公开读取）
    CREATE POLICY "Allow public read from brandlogos"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'brandlogos');

    -- 创建 brandlogos INSERT 策略（允许认证用户上传）
    CREATE POLICY "Allow authenticated upload to brandlogos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'brandlogos');

    -- 创建 brandlogos UPDATE 策略（允许认证用户更新）
    CREATE POLICY "Allow authenticated update on brandlogos"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'brandlogos')
    WITH CHECK (bucket_id = 'brandlogos');

    -- 创建 brandlogos DELETE 策略（允许认证用户删除）
    CREATE POLICY "Allow authenticated delete on brandlogos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'brandlogos');

    -- 创建 business-licenses SELECT 策略（允许公开读取）
    CREATE POLICY "Allow public read from business-licenses"
    ON storage.objects FOR SELECT
    TO public
    USING (bucket_id = 'business-licenses');

    -- 创建 business-licenses INSERT 策略（允许认证用户上传）
    CREATE POLICY "Allow authenticated upload to business-licenses"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'business-licenses');

    -- 创建 business-licenses UPDATE 策略（允许认证用户更新）
    CREATE POLICY "Allow authenticated update on business-licenses"
    ON storage.objects FOR UPDATE
    TO authenticated
    USING (bucket_id = 'business-licenses')
    WITH CHECK (bucket_id = 'business-licenses');

    -- 创建 business-licenses DELETE 策略（允许认证用户删除）
    CREATE POLICY "Allow authenticated delete on business-licenses"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (bucket_id = 'business-licenses');

    -- 配置 brandlogos bucket 设置
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

    -- 配置 business-licenses bucket 设置
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
    
    RAISE NOTICE 'Brand bucket policies created successfully';
END;
$$;

-- 执行函数
SELECT public.create_brand_bucket_policies();

-- 删除临时函数
DROP FUNCTION IF EXISTS public.create_brand_bucket_policies();
