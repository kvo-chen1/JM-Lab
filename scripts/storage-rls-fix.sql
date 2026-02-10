-- 完全禁用 storage.objects 表的 RLS（临时解决方案）
-- 注意：这会使所有存储桶完全公开，仅用于开发测试

-- 方法1：禁用 RLS
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;

-- 方法2：如果方法1不生效，尝试删除所有策略并重新创建
-- 先删除所有现有策略
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

-- 创建一个完全开放的策略
CREATE POLICY "完全开放策略" ON storage.objects
    FOR ALL TO public
    USING (true)
    WITH CHECK (true);

-- 确保存储桶存在且公开
INSERT INTO storage.buckets (id, name, public)
VALUES ('brand-logos', 'brand-logos', true)
ON CONFLICT (id) DO UPDATE SET public = true;
