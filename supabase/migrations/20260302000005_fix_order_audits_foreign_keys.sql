-- 修复 order_audits 表的外键约束问题
-- 移除对 auth.users 的外键引用，避免权限问题

-- ============================================================================
-- 1. 移除外键约束
-- ============================================================================

-- 移除 user_id 的外键约束
ALTER TABLE order_audits
DROP CONSTRAINT IF EXISTS order_audits_user_id_fkey;

-- 移除 audited_by 的外键约束
ALTER TABLE order_audits
DROP CONSTRAINT IF EXISTS order_audits_audited_by_fkey;

-- ============================================================================
-- 2. 添加注释说明
-- ============================================================================

COMMENT ON COLUMN order_audits.user_id IS '发布者 ID - 不再使用外键约束，应用程序层面验证';
COMMENT ON COLUMN order_audits.audited_by IS '审核人 ID - 不再使用外键约束，应用程序层面验证';

-- ============================================================================
-- 3. 启用 RLS 并创建策略（可选，如果需要更细粒度的控制）
-- ============================================================================

-- 启用 RLS
ALTER TABLE order_audits ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "允许所有用户查看已通过的商单" ON order_audits;
DROP POLICY IF EXISTS "允许用户查看自己的商单" ON order_audits;
DROP POLICY IF EXISTS "允许用户创建商单" ON order_audits;
DROP POLICY IF EXISTS "允许管理员查看所有商单" ON order_audits;
DROP POLICY IF EXISTS "允许管理员更新商单" ON order_audits;

-- 创建策略：允许所有用户查看已通过的商单
CREATE POLICY "允许所有用户查看已通过的商单"
ON order_audits FOR SELECT
USING (status = 'approved');

-- 创建策略：允许用户查看自己的商单
CREATE POLICY "允许用户查看自己的商单"
ON order_audits FOR SELECT
USING (auth.uid()::text = user_id::text);

-- 创建策略：允许认证用户创建商单
CREATE POLICY "允许用户创建商单"
ON order_audits FOR INSERT
WITH CHECK (auth.uid()::text = user_id::text);

-- 创建策略：允许管理员查看所有商单
CREATE POLICY "允许管理员查看所有商单"
ON order_audits FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);

-- 创建策略：允许管理员更新所有商单
CREATE POLICY "允许管理员更新商单"
ON order_audits FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_id = auth.uid()
    AND role = 'admin'
  )
);
