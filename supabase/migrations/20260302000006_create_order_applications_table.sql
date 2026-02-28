-- 创建接单申请表
-- 用于存储创作者对商单的接单申请

-- ============================================================================
-- 创建接单申请表
-- ============================================================================

CREATE TABLE IF NOT EXISTS order_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES order_audits(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL, -- 创作者ID
    creator_name TEXT, -- 创作者名称
    creator_avatar TEXT, -- 创作者头像
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    message TEXT, -- 申请留言
    portfolio_url TEXT, -- 作品集链接
    review_note TEXT, -- 审核备注
    reviewed_at TIMESTAMPTZ, -- 审核时间
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE order_applications IS '商单接单申请表';
COMMENT ON COLUMN order_applications.order_id IS '关联的商单ID';
COMMENT ON COLUMN order_applications.creator_id IS '申请者（创作者）ID';
COMMENT ON COLUMN order_applications.status IS '申请状态：pending-待审核, approved-已通过, rejected-已拒绝';
COMMENT ON COLUMN order_applications.message IS '申请留言/自我介绍';
COMMENT ON COLUMN order_applications.portfolio_url IS '作品集链接';
COMMENT ON COLUMN order_applications.review_note IS '品牌方审核备注';

-- ============================================================================
-- 创建索引
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_order_applications_order_id ON order_applications(order_id);
CREATE INDEX IF NOT EXISTS idx_order_applications_creator_id ON order_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_order_applications_status ON order_applications(status);
CREATE INDEX IF NOT EXISTS idx_order_applications_created_at ON order_applications(created_at);

-- ============================================================================
-- 启用 RLS
-- ============================================================================

ALTER TABLE order_applications ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- 创建 RLS 策略
-- ============================================================================

-- 策略1：允许所有用户查看自己的申请
DROP POLICY IF EXISTS "允许用户查看自己的申请" ON order_applications;
CREATE POLICY "允许用户查看自己的申请"
ON order_applications FOR SELECT
USING (auth.uid()::text = creator_id::text);

-- 策略2：允许品牌方查看自己商单的所有申请
DROP POLICY IF EXISTS "允许品牌方查看商单申请" ON order_applications;
CREATE POLICY "允许品牌方查看商单申请"
ON order_applications FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM order_audits
        WHERE order_audits.id = order_applications.order_id
        AND order_audits.user_id = auth.uid()
    )
);

-- 策略3：允许用户创建申请
DROP POLICY IF EXISTS "允许用户创建申请" ON order_applications;
CREATE POLICY "允许用户创建申请"
ON order_applications FOR INSERT
WITH CHECK (auth.uid()::text = creator_id::text);

-- 策略4：允许品牌方更新申请状态（审核）
DROP POLICY IF EXISTS "允许品牌方审核申请" ON order_applications;
CREATE POLICY "允许品牌方审核申请"
ON order_applications FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM order_audits
        WHERE order_audits.id = order_applications.order_id
        AND order_audits.user_id = auth.uid()
    )
);

-- 策略5：允许用户删除自己的申请
DROP POLICY IF EXISTS "允许用户删除自己的申请" ON order_applications;
CREATE POLICY "允许用户删除自己的申请"
ON order_applications FOR DELETE
USING (auth.uid()::text = creator_id::text);

-- ============================================================================
-- 创建触发器：自动更新 updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_order_applications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_order_applications_updated_at ON order_applications;
CREATE TRIGGER trigger_update_order_applications_updated_at
    BEFORE UPDATE ON order_applications
    FOR EACH ROW
    EXECUTE FUNCTION update_order_applications_updated_at();
