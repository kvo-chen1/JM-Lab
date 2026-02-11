-- 在Supabase SQL Editor中手动执行此脚本（修复反馈表的RLS）

-- 1. 删除现有的会导致递归的策略
DROP POLICY IF EXISTS "管理员管理反馈" ON user_feedbacks;
DROP POLICY IF EXISTS "管理员查看处理日志" ON feedback_process_logs;

-- 2. 创建安全定义函数来检查反馈管理权限
CREATE OR REPLACE FUNCTION has_feedback_manage_permission(p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_accounts aa
        JOIN admin_roles ar ON aa.role_id = ar.id
        WHERE aa.user_id = p_user_id
        AND aa.status = 'active'
        AND (ar.permissions @> '[{"permission": "feedback:manage"}]'::jsonb
             OR ar.permissions @> '[{"permission": "admin:manage"}]'::jsonb)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 重新创建策略

-- user_feedbacks 管理策略
CREATE POLICY "管理员管理反馈" ON user_feedbacks
    FOR ALL USING (
        has_feedback_manage_permission(auth.uid())
    );

-- feedback_process_logs 策略
CREATE POLICY "管理员查看处理日志" ON feedback_process_logs
    FOR SELECT USING (
        is_active_admin(auth.uid())
    );
