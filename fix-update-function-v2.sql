-- ============================================
-- 修复 update_updated_at_column 函数 - 版本 2
-- 使用 CREATE OR REPLACE 而不是 DROP + CREATE
-- ============================================

-- 1. 直接替换函数（不删除）
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    -- 使用 bigint 时间戳（毫秒）
    NEW.updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
    RETURN NEW;
END;
$$;

-- 2. 授予执行权限
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO anon;
GRANT EXECUTE ON FUNCTION public.update_updated_at_column() TO service_role;

-- 3. 验证函数修改
SELECT 
    p.proname as function_name,
    pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public'
AND p.proname = 'update_updated_at_column';
