-- 修复 users 表外键约束问题
-- 问题：public.users.id 有外键约束 REFERENCES auth.users(id)
-- 导致后端无法直接创建用户

-- 1. 删除外键约束（如果不存在则忽略错误）
DO $$
BEGIN
    -- 删除可能存在的触发器
    DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
    
    -- 删除外键约束
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_id_fkey;
    
    -- 删除主键约束并重新创建（不带外键）
    ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_pkey;
    ALTER TABLE public.users ADD PRIMARY KEY (id);
EXCEPTION
    WHEN OTHERS THEN
        RAISE NOTICE 'Error dropping constraints: %', SQLERRM;
END $$;

-- 2. 确保 id 列没有外键引用 auth.users
-- 注意：这会允许在 public.users 中创建独立用户，不依赖 Supabase Auth

-- 3. 添加一个函数来同步用户到 auth.users（可选）
CREATE OR REPLACE FUNCTION public.sync_user_to_auth()
RETURNS TRIGGER AS $$
BEGIN
    -- 尝试在 auth.users 中创建用户（如果不存在）
    -- 注意：这需要 supabase_admin 权限，通常无法直接执行
    -- 这里只是占位，实际同步需要通过 Supabase Auth API 完成
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建触发器来尝试同步（可选）
DROP TRIGGER IF EXISTS sync_user_to_auth_trigger ON public.users;
-- CREATE TRIGGER sync_user_to_auth_trigger
-- AFTER INSERT ON public.users
-- FOR EACH ROW
-- EXECUTE FUNCTION public.sync_user_to_auth();

-- 5. 验证约束已移除
DO $$
DECLARE
    constraint_exists BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE table_name = 'users' 
        AND constraint_type = 'FOREIGN KEY'
    ) INTO constraint_exists;
    
    IF constraint_exists THEN
        RAISE NOTICE 'Warning: Foreign key constraints still exist on users table';
    ELSE
        RAISE NOTICE 'Success: Foreign key constraints removed from users table';
    END IF;
END $$;
