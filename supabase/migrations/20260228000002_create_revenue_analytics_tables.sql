-- ============================================
-- 收入分析真实数据迁移脚本
-- ============================================
-- 创建会员订阅表、盲盒销售表，添加推广渠道追踪
-- ============================================

-- ============================================
-- 1. 创建会员订阅表
-- ============================================
DROP TABLE IF EXISTS memberships CASCADE;

CREATE TABLE memberships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('monthly', 'quarterly', 'yearly', 'lifetime')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'expired', 'cancelled', 'pending')),
    amount DECIMAL(10,2) NOT NULL,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_memberships_user_id ON memberships(user_id);
CREATE INDEX idx_memberships_status ON memberships(status);
CREATE INDEX idx_memberships_plan_type ON memberships(plan_type);
CREATE INDEX idx_memberships_created_at ON memberships(created_at);

-- 添加列注释
COMMENT ON TABLE memberships IS '会员订阅表';
COMMENT ON COLUMN memberships.user_id IS '用户 ID';
COMMENT ON COLUMN memberships.plan_type IS '套餐类型：monthly(月卡), quarterly(季卡), yearly(年卡), lifetime(终身)';
COMMENT ON COLUMN memberships.status IS '状态：active(有效), expired(过期), cancelled(取消), pending(待支付)';
COMMENT ON COLUMN memberships.amount IS '订阅金额';
COMMENT ON COLUMN memberships.start_date IS '开始日期';
COMMENT ON COLUMN memberships.end_date IS '结束日期';
COMMENT ON COLUMN memberships.payment_method IS '支付方式';
COMMENT ON COLUMN memberships.transaction_id IS '交易 ID';

-- ============================================
-- 2. 创建盲盒销售表
-- ============================================
DROP TABLE IF EXISTS blind_box_sales CASCADE;

CREATE TABLE blind_box_sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    box_type VARCHAR(100) NOT NULL,
    box_name VARCHAR(255) NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    reward_type VARCHAR(50) NOT NULL,
    reward_id UUID,
    reward_value VARCHAR(500),
    status VARCHAR(50) NOT NULL DEFAULT 'completed' CHECK (status IN ('completed', 'refunded', 'pending')),
    payment_method VARCHAR(50),
    transaction_id VARCHAR(255),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_blind_box_sales_user_id ON blind_box_sales(user_id);
CREATE INDEX idx_blind_box_sales_box_type ON blind_box_sales(box_type);
CREATE INDEX idx_blind_box_sales_status ON blind_box_sales(status);
CREATE INDEX idx_blind_box_sales_created_at ON blind_box_sales(created_at);

-- 添加列注释
COMMENT ON TABLE blind_box_sales IS '盲盒销售表';
COMMENT ON COLUMN blind_box_sales.user_id IS '用户 ID';
COMMENT ON COLUMN blind_box_sales.box_type IS '盲盒类型';
COMMENT ON COLUMN blind_box_sales.box_name IS '盲盒名称';
COMMENT ON COLUMN blind_box_sales.price IS '购买价格';
COMMENT ON COLUMN blind_box_sales.reward_type IS '奖励类型';
COMMENT ON COLUMN blind_box_sales.reward_id IS '奖励 ID';
COMMENT ON COLUMN blind_box_sales.reward_value IS '奖励内容';
COMMENT ON COLUMN blind_box_sales.status IS '状态：completed(已完成), refunded(已退款), pending(待开奖)';

-- ============================================
-- 3. 为推广订单表添加渠道追踪字段
-- ============================================
DO $$ 
BEGIN
    -- 添加渠道字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'promotion_orders' AND column_name = 'channel') THEN
        ALTER TABLE promotion_orders ADD COLUMN channel VARCHAR(100);
        COMMENT ON COLUMN promotion_orders.channel IS '推广渠道：feed(信息流), social(社交媒体), search(搜索引擎), kol(KOL 合作), content(内容营销)';
    END IF;

    -- 添加渠道成本字段
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'promotion_orders' AND column_name = 'channel_cost') THEN
        ALTER TABLE promotion_orders ADD COLUMN channel_cost DECIMAL(10,2) DEFAULT 0;
        COMMENT ON COLUMN promotion_orders.channel_cost IS '渠道成本';
    END IF;
END $$;

-- ============================================
-- 4. 创建渠道成本表（用于统计各渠道的投入）
-- ============================================
DROP TABLE IF EXISTS channel_costs CASCADE;

CREATE TABLE channel_costs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    channel VARCHAR(100) NOT NULL,
    cost_type VARCHAR(50) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE,
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 创建索引
CREATE INDEX idx_channel_costs_channel ON channel_costs(channel);
CREATE INDEX idx_channel_costs_start_date ON channel_costs(start_date);

-- 添加列注释
COMMENT ON TABLE channel_costs IS '推广渠道成本表';
COMMENT ON COLUMN channel_costs.channel IS '渠道名称';
COMMENT ON COLUMN channel_costs.cost_type IS '成本类型：advertising(广告费), commission(佣金), cooperation(合作费)';
COMMENT ON COLUMN channel_costs.amount IS '成本金额';
COMMENT ON COLUMN channel_costs.start_date IS '开始日期';
COMMENT ON COLUMN channel_costs.end_date IS '结束日期';

-- ============================================
-- 5. 创建收入统计视图
-- ============================================
CREATE OR REPLACE VIEW daily_revenue_stats AS
SELECT 
    DATE(created_at) as date,
    'membership' as revenue_type,
    COUNT(*) as count,
    SUM(amount) as total_amount
FROM memberships
WHERE status = 'active'
GROUP BY DATE(created_at)

UNION ALL

SELECT 
    DATE(created_at) as date,
    'blind_box' as revenue_type,
    COUNT(*) as count,
    SUM(price) as total_amount
FROM blind_box_sales
WHERE status = 'completed'
GROUP BY DATE(created_at)

UNION ALL

SELECT 
    DATE(created_at) as date,
    'promotion' as revenue_type,
    COUNT(*) as count,
    SUM(final_price) as total_amount
FROM promotion_orders
WHERE status = 'paid'
GROUP BY DATE(created_at);

-- ============================================
-- 6. 插入示例数据
-- ============================================

-- 会员订阅示例数据
INSERT INTO memberships (user_id, plan_type, status, amount, start_date, end_date, payment_method, transaction_id)
SELECT 
    id as user_id,
    (ARRAY['monthly', 'quarterly', 'yearly'])[FLOOR(RANDOM() * 3 + 1)] as plan_type,
    'active' as status,
    (ARRAY[29.9, 79.9, 299.0])[FLOOR(RANDOM() * 3 + 1)] as amount,
    NOW() - (RANDOM() * INTERVAL '90 days') as start_date,
    NOW() + (RANDOM() * INTERVAL '365 days') as end_date,
    (ARRAY['alipay', 'wechat', 'card'])[FLOOR(RANDOM() * 3 + 1)] as payment_method,
    'TXN' || FLOOR(RANDOM() * 1000000) as transaction_id
FROM users
WHERE RANDOM() < 0.3  -- 30% 的用户购买会员
LIMIT 50;

-- 盲盒销售示例数据
INSERT INTO blind_box_sales (user_id, box_type, box_name, price, reward_type, reward_id, reward_value, status, payment_method, transaction_id)
SELECT 
    id as user_id,
    (ARRAY['basic', 'premium', 'vip'])[FLOOR(RANDOM() * 3 + 1)] as box_type,
    (ARRAY['创意盲盒', '素材盲盒', 'VIP 盲盒'])[FLOOR(RANDOM() * 3 + 1)] as box_name,
    (ARRAY[9.9, 19.9, 49.9])[FLOOR(RANDOM() * 3 + 1)] as price,
    'work' as reward_type,
    NULL as reward_id,
    '随机素材' as reward_value,
    'completed' as status,
    (ARRAY['alipay', 'wechat'])[FLOOR(RANDOM() * 2 + 1)] as payment_method,
    'BOX' || FLOOR(RANDOM() * 1000000) as transaction_id
FROM users
WHERE RANDOM() < 0.4  -- 40% 的用户购买盲盒
LIMIT 100;

-- 渠道成本示例数据
INSERT INTO channel_costs (channel, cost_type, amount, start_date, end_date, description)
VALUES 
    ('信息流广告', 'advertising', 50000, NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days', '抖音、快手信息流广告投放'),
    ('社交媒体', 'advertising', 30000, NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days', '微博、小红书推广'),
    ('搜索引擎', 'advertising', 40000, NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days', '百度、谷歌 SEM'),
    ('KOL 合作', 'cooperation', 60000, NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days', '知名博主合作推广'),
    ('内容营销', 'cooperation', 20000, NOW() - INTERVAL '30 days', NOW() + INTERVAL '30 days', '优质内容创作与分发');

-- ============================================
-- 7. 权限设置
-- ============================================
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE blind_box_sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE channel_costs ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的数据
CREATE POLICY "Users can view their own memberships"
    ON memberships FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own blind_box_sales"
    ON blind_box_sales FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- 管理员可以查看所有数据
CREATE POLICY "Admins can view all revenue data"
    ON memberships FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all blind_box_sales"
    ON blind_box_sales FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

CREATE POLICY "Admins can view all channel_costs"
    ON channel_costs FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role = 'admin'
        )
    );

-- ============================================
-- 迁移完成提示
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '收入分析数据库迁移完成！';
    RAISE NOTICE '创建表：memberships, blind_box_sales, channel_costs';
    RAISE NOTICE '修改表：promotion_orders (添加 channel, channel_cost 字段)';
    RAISE NOTICE '创建视图：daily_revenue_stats';
    RAISE NOTICE '插入示例数据：会员 50 条，盲盒 100 条，渠道成本 5 条';
END $$;
