-- 修复 admin_accounts 表的 RLS 递归问题

-- 1. 删除现有的会导致递归的策略
DROP POLICY IF EXISTS "允许管理员查看管理员账号" ON admin_accounts;
DROP POLICY IF EXISTS "允许超级管理员管理管理员账号" ON admin_accounts;
DROP POLICY IF EXISTS "允许管理员查看操作日志" ON admin_operation_logs;
DROP POLICY IF EXISTS "允许管理员查看角色" ON admin_roles;
DROP POLICY IF EXISTS "允许超级管理员管理角色" ON admin_roles;

-- 2. 创建安全定义函数来检查管理员身份（绕过RLS）
CREATE OR REPLACE FUNCTION is_active_admin(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_accounts
        WHERE user_id = p_user_id AND status = 'active'
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建安全定义函数来检查超级管理员权限
CREATE OR REPLACE FUNCTION is_super_admin(p_user_id UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_accounts aa
        JOIN admin_roles ar ON aa.role_id = ar.id
        WHERE aa.user_id = p_user_id
        AND aa.status = 'active'
        AND ar.permissions @> jsonb_build_array(jsonb_build_object('permission', required_permission))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 重新创建策略，使用安全定义函数

-- admin_accounts 策略
CREATE POLICY "允许管理员查看管理员账号" ON admin_accounts
    FOR SELECT USING (
        is_active_admin(auth.uid())
    );

CREATE POLICY "允许超级管理员管理管理员账号" ON admin_accounts
    FOR ALL USING (
        is_super_admin(auth.uid(), 'admin:manage')
    );

-- admin_roles 策略
CREATE POLICY "允许管理员查看角色" ON admin_roles
    FOR SELECT USING (
        is_active_admin(auth.uid())
    );

CREATE POLICY "允许超级管理员管理角色" ON admin_roles
    FOR ALL USING (
        is_super_admin(auth.uid(), 'role:manage')
    );

-- admin_operation_logs 策略
CREATE POLICY "允许管理员查看操作日志" ON admin_operation_logs
    FOR SELECT USING (
        is_active_admin(auth.uid())
    );

-- 5. 为反馈管理添加权限到超级管理员角色
UPDATE admin_roles 
SET permissions = permissions || '[{"permission": "feedback:manage", "name": "管理用户反馈"}]'::jsonb
WHERE name = 'super_admin' 
AND NOT (permissions @> '[{"permission": "feedback:manage"}]'::jsonb);

UPDATE admin_roles 
SET permissions = permissions || '[{"permission": "feedback:view", "name": "查看用户反馈"}]'::jsonb
WHERE name = 'admin' 
AND NOT (permissions @> '[{"permission": "feedback:view"}]'::jsonb);
