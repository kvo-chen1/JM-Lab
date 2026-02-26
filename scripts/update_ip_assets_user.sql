-- 更新 IP 资产的创作者信息，使用实际存在的用户
-- 在 Supabase Studio 的 SQL Editor 中执行

-- 1. 查看当前 IP 资产数据
SELECT id, name, user_id, status FROM ip_assets;

-- 2. 查看可用的用户
SELECT id, email, raw_user_meta_data->>'username' as username 
FROM auth.users 
LIMIT 5;

-- 3. 更新所有 IP 资产使用第一个可用用户
DO $$
DECLARE
    first_user_id UUID;
BEGIN
    -- 获取第一个用户ID
    SELECT id INTO first_user_id FROM auth.users LIMIT 1;
    
    IF first_user_id IS NULL THEN
        RAISE NOTICE '没有找到用户';
        RETURN;
    END IF;
    
    RAISE NOTICE '使用用户ID: %', first_user_id;
    
    -- 更新所有 IP 资产的 user_id
    UPDATE ip_assets SET user_id = first_user_id;
    
    RAISE NOTICE '已更新 % 条 IP 资产记录', (SELECT COUNT(*) FROM ip_assets);
END $$;

-- 4. 验证更新结果
SELECT 
    ia.id, 
    ia.name, 
    ia.user_id,
    au.email as creator_email,
    au.raw_user_meta_data->>'username' as creator_username,
    au.raw_user_meta_data->>'avatar_url' as creator_avatar
FROM ip_assets ia
JOIN auth.users au ON ia.user_id = au.id;
