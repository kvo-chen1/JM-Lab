-- 创建函数：获取 auth.users 表中的用户信息
-- 用于在 public.users 表中没有记录时获取用户基本信息

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

-- 添加注释
COMMENT ON FUNCTION get_auth_users_info IS '根据用户ID数组获取 auth.users 表中的用户基本信息';

-- 授予执行权限
GRANT EXECUTE ON FUNCTION get_auth_users_info TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_users_info TO anon;
