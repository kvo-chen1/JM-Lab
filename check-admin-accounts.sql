-- 在Supabase SQL Editor中执行此脚本
-- 查看所有管理员账号及其角色

SELECT 
    aa.id,
    aa.user_id,
    aa.username,
    aa.email,
    aa.status,
    ar.name as role_name,
    ar.description as role_description
FROM admin_accounts aa
JOIN admin_roles ar ON aa.role_id = ar.id;
