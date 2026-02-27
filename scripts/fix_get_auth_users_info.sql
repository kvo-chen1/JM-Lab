-- 修复 get_auth_users_info 函数
-- 用于解决 IP 资产审核页面无法获取用户信息的问题

-- 1. 先删除现有的函数（如果存在）
DROP FUNCTION IF EXISTS get_auth_users_info(UUID[]);

-- 2. 重新创建函数
CREATE OR REPLACE FUNCTION get_auth_users_info(user_ids UUID[])
RETURNS TABLE (
    id UUID,
    email TEXT,
    username TEXT,
    avatar_url TEXT
) 
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        au.id,
        au.email,
        COALESCE(
            au.raw_user_meta_data->>'username',
            au.raw_user_meta_data->>'name',
            SPLIT_PART(au.email, '@', 1)
        ) as username,
        au.raw_user_meta_data->>'avatar_url' as avatar_url
    FROM auth.users au
    WHERE au.id = ANY(user_ids);
END;
$$ LANGUAGE plpgsql;

-- 3. 授予执行权限
GRANT EXECUTE ON FUNCTION get_auth_users_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_users_info TO anon;
GRANT EXECUTE ON FUNCTION get_auth_users_info TO service_role;

-- 4. 添加注释
COMMENT ON FUNCTION get_auth_users_info IS '根据用户ID数组获取 auth.users 表中的用户基本信息';

-- 5. 验证函数是否正常工作
DO $$
DECLARE
    test_user_id UUID;
    result RECORD;
BEGIN
    -- 获取第一个用户ID进行测试
    SELECT id INTO test_user_id FROM auth.users LIMIT 1;
    
    IF test_user_id IS NULL THEN
        RAISE NOTICE '没有找到用户，跳过测试';
        RETURN;
    END IF;
    
    RAISE NOTICE '测试用户ID: %', test_user_id;
    
    -- 测试函数
    SELECT * INTO result FROM get_auth_users_info(ARRAY[test_user_id]);
    
    IF result.id IS NOT NULL THEN
        RAISE NOTICE '函数测试成功: id=%, username=%, email=%', result.id, result.username, result.email;
    ELSE
        RAISE NOTICE '函数测试失败: 没有返回数据';
    END IF;
END $$;

-- 6. 显示所有可用的函数
SELECT 
    proname as function_name,
    pg_get_function_arguments(oid) as arguments
FROM pg_proc 
WHERE proname = 'get_auth_users_info';
