-- ==========================================================================
-- 修复 users 表缺少 role 列的问题
-- ==========================================================================

-- 1. 添加 role 列到 users 表（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'role'
    ) THEN
        ALTER TABLE public.users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
        RAISE NOTICE 'Added role column to users table';
    ELSE
        RAISE NOTICE 'role column already exists in users table';
    END IF;
END $$;

-- 2. 更新现有用户的默认角色
UPDATE public.users 
SET role = 'user' 
WHERE role IS NULL;

-- 3. 验证修改
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_schema = 'public' 
AND table_name = 'users' 
AND column_name = 'role';

-- 4. 完成
NOTIFY pgrst, 'reload schema';
