-- 修复反馈表的 user_id 关联问题
-- 问题：已登录用户提交反馈时 user_id 为 NULL

-- 1. 先删除旧的插入策略
DROP POLICY IF EXISTS "用户提交反馈" ON user_feedbacks;

-- 2. 创建新的插入策略 - 允许任何用户提交反馈，并正确设置 user_id
-- 方案A：使用当前认证用户的 ID 作为 user_id（如果已登录）
CREATE POLICY "用户提交反馈" ON user_feedbacks
    FOR INSERT WITH CHECK (
        -- 已登录用户：user_id 必须等于当前认证用户 ID
        (auth.uid() IS NOT NULL AND user_id = auth.uid())
        OR
        -- 未登录用户：user_id 必须为 NULL
        (auth.uid() IS NULL AND user_id IS NULL)
    );

-- 方案B（备选）：如果需要允许前端传递任意 user_id，可以使用 SECURITY DEFINER 的函数
-- 或者创建一个服务角色策略

-- 3. 验证现有数据
-- SELECT id, user_id, contact_info, created_at 
-- FROM user_feedbacks 
-- WHERE user_id IS NULL AND contact_info IS NOT NULL;

-- 4. 如果需要修复历史数据，可以通过 contact_info 关联 users 表更新 user_id
-- UPDATE user_feedbacks uf
-- SET user_id = (
--     SELECT id FROM users u 
--     WHERE u.email = uf.contact_info 
--     OR u.phone = uf.contact_info
--     LIMIT 1
-- )
-- WHERE uf.user_id IS NULL 
-- AND uf.contact_info IS NOT NULL;
