-- 会员中心体系增强迁移
-- 创建时间: 2026-02-21
-- 包含：成长体系、积分系统、优惠券、会员历史记录等

-- 1. 扩展用户表，添加会员相关字段
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS total_spent DECIMAL(10, 2) DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_start TIMESTAMP WITH TIME ZONE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS membership_end TIMESTAMP WITH TIME ZONE;

-- 2. 积分记录表
CREATE TABLE IF NOT EXISTS points_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type VARCHAR(10) NOT NULL CHECK (type IN ('earn', 'spend')),
    source VARCHAR(50) NOT NULL,
    description TEXT,
    related_id TEXT,
    balance_after INTEGER NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 积分记录表索引
CREATE INDEX IF NOT EXISTS idx_points_records_user_id ON points_records(user_id);
CREATE INDEX IF NOT EXISTS idx_points_records_created_at ON points_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_records_type ON points_records(type);

-- 3. 会员权益配置表扩展
-- 添加成长体系字段
ALTER TABLE membership_benefits_config 
ADD COLUMN IF NOT EXISTS growth JSONB DEFAULT '{
    "minPoints": 0,
    "maxPoints": 0,
    "upgradeConditions": [],
    "maintainConditions": []
}'::jsonb;

-- 4. 优惠券表
CREATE TABLE IF NOT EXISTS membership_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    applicable_plans JSONB DEFAULT '["premium", "vip"]'::jsonb,
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 优惠券表索引
CREATE INDEX IF NOT EXISTS idx_membership_coupons_code ON membership_coupons(code);
CREATE INDEX IF NOT EXISTS idx_membership_coupons_valid_until ON membership_coupons(valid_until);

-- 5. 用户优惠券使用记录表
CREATE TABLE IF NOT EXISTS membership_coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES membership_coupons(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES membership_orders(id),
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 优惠券使用记录索引
CREATE INDEX IF NOT EXISTS idx_membership_coupon_usage_user_id ON membership_coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_coupon_usage_coupon_id ON membership_coupon_usage(coupon_id);

-- 6. 会员历史记录表
CREATE TABLE IF NOT EXISTS membership_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action_type VARCHAR(50) NOT NULL CHECK (action_type IN ('upgrade', 'downgrade', 'renew', 'cancel', 'expire', 'refund')),
    from_level VARCHAR(20),
    to_level VARCHAR(20),
    order_id TEXT REFERENCES membership_orders(id),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 会员历史记录索引
CREATE INDEX IF NOT EXISTS idx_membership_history_user_id ON membership_history(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_history_created_at ON membership_history(created_at DESC);

-- 7. 用户成长值记录表
CREATE TABLE IF NOT EXISTS membership_growth_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    points_change INTEGER NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    balance_after INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 成长值记录索引
CREATE INDEX IF NOT EXISTS idx_membership_growth_records_user_id ON membership_growth_records(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_growth_records_created_at ON membership_growth_records(created_at DESC);

-- 8. 创建更新会员使用统计的函数
CREATE OR REPLACE FUNCTION update_membership_usage_stats(
    p_user_id UUID,
    p_ai_generations INTEGER DEFAULT 0,
    p_storage_bytes BIGINT DEFAULT 0,
    p_exports INTEGER DEFAULT 0,
    p_api_calls INTEGER DEFAULT 0
) RETURNS VOID AS $$
BEGIN
    INSERT INTO membership_usage_stats (
        user_id, 
        stat_date, 
        ai_generations_count, 
        storage_used_bytes, 
        exports_count, 
        api_calls_count
    ) VALUES (
        p_user_id, 
        CURRENT_DATE, 
        p_ai_generations, 
        p_storage_bytes, 
        p_exports, 
        p_api_calls
    )
    ON CONFLICT (user_id, stat_date) DO UPDATE SET
        ai_generations_count = membership_usage_stats.ai_generations_count + p_ai_generations,
        storage_used_bytes = GREATEST(membership_usage_stats.storage_used_bytes, p_storage_bytes),
        exports_count = membership_usage_stats.exports_count + p_exports,
        api_calls_count = membership_usage_stats.api_calls_count + p_api_calls,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql;

-- 9. 创建记录会员历史记录的函数
CREATE OR REPLACE FUNCTION record_membership_history(
    p_user_id UUID,
    p_action_type VARCHAR,
    p_from_level VARCHAR DEFAULT NULL,
    p_to_level VARCHAR DEFAULT NULL,
    p_order_id TEXT DEFAULT NULL,
    p_notes TEXT DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_history_id UUID;
BEGIN
    INSERT INTO membership_history (
        user_id, 
        action_type, 
        from_level, 
        to_level, 
        order_id, 
        notes
    ) VALUES (
        p_user_id, 
        p_action_type, 
        p_from_level, 
        p_to_level, 
        p_order_id, 
        p_notes
    )
    RETURNING id INTO v_history_id;
    
    RETURN v_history_id;
END;
$$ LANGUAGE plpgsql;

-- 10. 创建添加积分函数
CREATE OR REPLACE FUNCTION add_membership_points(
    p_user_id UUID,
    p_points INTEGER,
    p_source VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_related_id TEXT DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_current_points INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- 获取当前积分
    SELECT membership_points INTO v_current_points
    FROM users WHERE id = p_user_id;
    
    v_new_balance := COALESCE(v_current_points, 0) + p_points;
    
    -- 创建积分记录
    INSERT INTO points_records (
        user_id,
        points,
        type,
        source,
        description,
        related_id,
        balance_after,
        expires_at
    ) VALUES (
        p_user_id,
        p_points,
        'earn',
        p_source,
        p_description,
        p_related_id,
        v_new_balance,
        NOW() + INTERVAL '1 year'
    );
    
    -- 更新用户积分
    UPDATE users SET membership_points = v_new_balance WHERE id = p_user_id;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql;

-- 11. 创建消耗积分函数
CREATE OR REPLACE FUNCTION spend_membership_points(
    p_user_id UUID,
    p_points INTEGER,
    p_source VARCHAR,
    p_description TEXT DEFAULT NULL,
    p_related_id TEXT DEFAULT NULL
) RETURNS TABLE(success BOOLEAN, error_message TEXT) AS $$
DECLARE
    v_current_points INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- 获取当前积分
    SELECT membership_points INTO v_current_points
    FROM users WHERE id = p_user_id;
    
    -- 检查积分是否足够
    IF COALESCE(v_current_points, 0) < p_points THEN
        RETURN QUERY SELECT FALSE, '积分不足'::TEXT;
        RETURN;
    END IF;
    
    v_new_balance := v_current_points - p_points;
    
    -- 创建积分记录
    INSERT INTO points_records (
        user_id,
        points,
        type,
        source,
        description,
        related_id,
        balance_after
    ) VALUES (
        p_user_id,
        -p_points,
        'spend',
        p_source,
        p_description,
        p_related_id,
        v_new_balance
    );
    
    -- 更新用户积分
    UPDATE users SET membership_points = v_new_balance WHERE id = p_user_id;
    
    RETURN QUERY SELECT TRUE, NULL::TEXT;
END;
$$ LANGUAGE plpgsql;

-- 12. 创建检查会员过期函数
CREATE OR REPLACE FUNCTION check_membership_expiry()
RETURNS VOID AS $$
DECLARE
    v_record RECORD;
BEGIN
    -- 查找已过期的会员
    FOR v_record IN 
        SELECT id, membership_level, membership_end 
        FROM users 
        WHERE membership_end < NOW() 
        AND membership_status = 'active'
        AND membership_level != 'free'
    LOOP
        -- 更新会员状态
        UPDATE users 
        SET membership_status = 'expired',
            membership_level = 'free'
        WHERE id = v_record.id;
        
        -- 记录历史
        INSERT INTO membership_history (
            user_id,
            action_type,
            from_level,
            to_level,
            notes
        ) VALUES (
            v_record.id,
            'expire',
            v_record.membership_level,
            'free',
            '会员到期自动降级'
        );
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 13. 创建触发器：订单完成时自动更新会员信息
CREATE OR REPLACE FUNCTION on_membership_order_completed()
RETURNS TRIGGER AS $$
DECLARE
    v_duration INTERVAL;
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 计算会员时长
        CASE NEW.period
            WHEN 'monthly' THEN v_duration := INTERVAL '1 month';
            WHEN 'quarterly' THEN v_duration := INTERVAL '3 months';
            WHEN 'yearly' THEN v_duration := INTERVAL '1 year';
            ELSE v_duration := INTERVAL '1 month';
        END CASE;
        
        -- 更新用户会员信息
        UPDATE users SET
            membership_level = NEW.plan,
            membership_status = 'active',
            membership_start = COALESCE(users.membership_start, NOW()),
            membership_end = GREATEST(COALESCE(users.membership_end, NOW()), NOW()) + v_duration,
            total_spent = total_spent + NEW.amount,
            updated_at = NOW()
        WHERE id = NEW.user_id;
        
        -- 添加消费积分（1元=1积分）
        PERFORM add_membership_points(
            NEW.user_id,
            FLOOR(NEW.amount)::INTEGER,
            'consumption',
            '会员消费返积分，订单号：' || NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_membership_order_completed ON membership_orders;
CREATE TRIGGER trg_membership_order_completed
    AFTER UPDATE ON membership_orders
    FOR EACH ROW
    EXECUTE FUNCTION on_membership_order_completed();

-- 14. 设置RLS策略
-- 积分记录表策略
ALTER TABLE points_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own points records" ON points_records
    FOR SELECT USING (auth.uid() = user_id);

-- 优惠券表策略（只读）
ALTER TABLE membership_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view active coupons" ON membership_coupons
    FOR SELECT USING (is_active = true);

-- 优惠券使用记录策略
ALTER TABLE membership_coupon_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own coupon usage" ON membership_coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

-- 成长值记录策略
ALTER TABLE membership_growth_records ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own growth records" ON membership_growth_records
    FOR SELECT USING (auth.uid() = user_id);

-- 15. 插入默认优惠券
INSERT INTO membership_coupons (code, name, description, discount_type, discount_value, min_purchase_amount, max_discount_amount, applicable_plans, valid_from, valid_until)
VALUES 
    ('WELCOME2026', '新用户欢迎券', '新用户专享8折优惠', 'percentage', 20, 0, 50, '["premium", "vip"]', NOW(), NOW() + INTERVAL '30 days'),
    ('SAVE50', '立减50元', '满100减50', 'fixed', 50, 100, 50, '["premium", "vip"]', NOW(), NOW() + INTERVAL '60 days'),
    ('YEARLY30', '年付特惠', '年付套餐7折', 'percentage', 30, 0, 300, '["premium", "vip"]', NOW(), NOW() + INTERVAL '90 days')
ON CONFLICT (code) DO NOTHING;

-- 16. 更新默认会员配置的成长体系
UPDATE membership_benefits_config 
SET growth = '{
    "minPoints": 0,
    "maxPoints": 0,
    "upgradeConditions": [],
    "maintainConditions": []
}'::jsonb
WHERE level = 'free';

UPDATE membership_benefits_config 
SET growth = '{
    "minPoints": 0,
    "maxPoints": 5000,
    "upgradeConditions": ["累计消费满1000元", "使用天数满30天"],
    "maintainConditions": ["保持活跃使用"]
}'::jsonb
WHERE level = 'premium';

UPDATE membership_benefits_config 
SET growth = '{
    "minPoints": 5000,
    "maxPoints": 999999,
    "upgradeConditions": ["累计消费满5000元", "邀请3位好友"],
    "maintainConditions": ["年度消费满2000元"]
}'::jsonb
WHERE level = 'vip';

-- 17. 添加注释
COMMENT ON TABLE points_records IS '积分记录表';
COMMENT ON TABLE membership_coupons IS '会员优惠券表';
COMMENT ON TABLE membership_coupon_usage IS '优惠券使用记录表';
COMMENT ON TABLE membership_history IS '会员历史记录表';
COMMENT ON TABLE membership_growth_records IS '会员成长值记录表';
COMMENT ON COLUMN users.membership_points IS '会员积分';
COMMENT ON COLUMN users.total_spent IS '累计消费金额';
