-- 在Supabase SQL Editor中执行此脚本
-- 1. 首先检查当前有哪些角色
SELECT * FROM admin_roles;

-- 2. 检查当前有哪些管理员
SELECT aa.*, ar.name as role_name 
FROM admin_accounts aa
JOIN admin_roles ar ON aa.role_id = ar.id;

-- 3. 如果需要添加当前用户为超级管理员，先获取当前用户的ID，然后执行：
-- INSERT INTO admin_accounts (user_id, username, email, role_id, status)
-- SELECT 
--   '当前用户的UUID',
--   '管理员用户名',
--   '管理员邮箱',
--   (SELECT id FROM admin_roles WHERE name = 'super_admin'),
--   'active'
-- WHERE NOT EXISTS (
--   SELECT 1 FROM admin_accounts WHERE user_id = '当前用户的UUID'
-- );
