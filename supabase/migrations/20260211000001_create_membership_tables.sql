-- 会员中心相关表结构
-- 创建时间: 2026-02-11

-- 1. 会员订单表
CREATE TABLE IF NOT EXISTS membership_orders (
    id TEXT PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    plan VARCHAR(20) NOT NULL CHECK (plan IN ('free', 'premium', 'vip')),
    plan_name VARCHAR(50) NOT NULL,
    period VARCHAR(20) NOT NULL CHECK (period IN ('monthly', 'quarterly', 'yearly')),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'CNY',
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'cancelled', 'refunded')),
    payment_method VARCHAR(20),
    payment_data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    paid_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE,
    refund_amount DECIMAL(10, 2),
    metadata JSONB DEFAULT '{}'
);

-- 订单表索引
CREATE INDEX IF NOT EXISTS idx_membership_orders_user_id ON membership_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_orders_status ON membership_orders(status);
CREATE INDEX IF NOT EXISTS idx_membership_orders_created_at ON membership_orders(created_at DESC);

-- 2. 会员使用统计表
CREATE TABLE IF NOT EXISTS membership_usage_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ai_generations_count INTEGER DEFAULT 0,
    storage_used_bytes BIGINT DEFAULT 0,
    exports_count INTEGER DEFAULT 0,
    api_calls_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, stat_date)
);

-- 使用统计表索引
CREATE INDEX IF NOT EXISTS idx_membership_usage_stats_user_id ON membership_usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_usage_stats_date ON membership_usage_stats(stat_date);

-- 3. 会员权益配置表
CREATE TABLE IF NOT EXISTS membership_benefits_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level VARCHAR(20) NOT NULL UNIQUE CHECK (level IN ('free', 'premium', 'vip')),
    name VARCHAR(50) NOT NULL,
    description TEXT,
    features JSONB NOT NULL DEFAULT '[]',
    limits JSONB NOT NULL DEFAULT '{}',
    pricing JSONB NOT NULL DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 用户会员历史记录表
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

-- 历史记录表索引
CREATE INDEX IF NOT EXISTS idx_membership_history_user_id ON membership_history(user_id);
CREATE INDEX IF NOT EXISTS idx_membership_history_created_at ON membership_history(created_at DESC);

-- 5. 会员优惠券表
CREATE TABLE IF NOT EXISTS membership_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10, 2) NOT NULL,
    min_purchase_amount DECIMAL(10, 2) DEFAULT 0,
    max_discount_amount DECIMAL(10, 2),
    applicable_plans JSONB DEFAULT '["premium", "vip"]',
    usage_limit INTEGER,
    usage_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 用户优惠券使用记录表
CREATE TABLE IF NOT EXISTS membership_coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    coupon_id UUID NOT NULL REFERENCES membership_coupons(id),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    order_id TEXT REFERENCES membership_orders(id),
    discount_amount DECIMAL(10, 2) NOT NULL,
    used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认会员权益配置
INSERT INTO membership_benefits_config (level, name, description, features, limits, pricing) VALUES
('free', '免费会员', '基础AI创作体验', 
 '[
   {"id": "ai_generation", "name": "AI生成次数", "value": "10次/天", "icon": "Wand2"},
   {"id": "ai_model", "name": "AI模型访问", "value": "基础模型", "icon": "Zap"},
   {"id": "image_generation", "name": "图像生成", "value": true, "icon": "Image"},
   {"id": "video_generation", "name": "视频生成", "value": false, "icon": "Video"},
   {"id": "audio_generation", "name": "音频生成", "value": false, "icon": "Music"},
   {"id": "text_generation", "name": "文案生成", "value": true, "icon": "FileText"},
   {"id": "templates", "name": "模板库", "value": "基础模板", "icon": "Palette"},
   {"id": "layers", "name": "图层编辑", "value": "基础功能", "icon": "Layers"},
   {"id": "export", "name": "导出功能", "value": "带水印", "icon": "Download"},
   {"id": "storage", "name": "云存储空间", "value": "1GB", "icon": "Cloud"},
   {"id": "priority", "name": "优先处理", "value": false, "icon": "Clock"},
   {"id": "commercial", "name": "商业授权", "value": false, "icon": "Shield"}
 ]'::jsonb,
 '{"aiGenerationsPerDay": 10, "storageGB": 1, "exportsPerMonth": 5, "maxResolution": "1080p", "watermark": true}'::jsonb,
 '{"monthly": {"price": 0, "period": "永久"}}'::jsonb
),
('premium', '高级会员', '解锁高级AI创作功能',
 '[
   {"id": "ai_generation", "name": "AI生成次数", "value": "无限", "icon": "Wand2"},
   {"id": "ai_model", "name": "AI模型访问", "value": "高级模型", "icon": "Zap"},
   {"id": "image_generation", "name": "图像生成", "value": true, "icon": "Image"},
   {"id": "video_generation", "name": "视频生成", "value": true, "icon": "Video"},
   {"id": "audio_generation", "name": "音频生成", "value": true, "icon": "Music"},
   {"id": "text_generation", "name": "文案生成", "value": true, "icon": "FileText"},
   {"id": "templates", "name": "模板库", "value": "专属模板库", "icon": "Palette"},
   {"id": "layers", "name": "图层编辑", "value": "完整功能", "icon": "Layers"},
   {"id": "export", "name": "导出功能", "value": "高清无水印", "icon": "Download"},
   {"id": "storage", "name": "云存储空间", "value": "50GB", "icon": "Cloud"},
   {"id": "priority", "name": "优先处理", "value": true, "icon": "Clock"},
   {"id": "commercial", "name": "商业授权", "value": false, "icon": "Shield"}
 ]'::jsonb,
 '{"aiGenerationsPerDay": null, "storageGB": 50, "exportsPerMonth": 100, "maxResolution": "4K", "watermark": false}'::jsonb,
 '{"monthly": {"price": 99, "period": "月"}, "quarterly": {"price": 269, "period": "季度", "discount": "9折", "originalPrice": 297}, "yearly": {"price": 899, "period": "年", "discount": "7.6折", "originalPrice": 1188}}'::jsonb
),
('vip', 'VIP会员', '享受顶级AI创作体验',
 '[
   {"id": "ai_generation", "name": "AI生成次数", "value": "无限", "icon": "Wand2"},
   {"id": "ai_model", "name": "AI模型访问", "value": "专属模型", "icon": "Zap"},
   {"id": "image_generation", "name": "图像生成", "value": true, "icon": "Image"},
   {"id": "video_generation", "name": "视频生成", "value": true, "icon": "Video"},
   {"id": "audio_generation", "name": "音频生成", "value": true, "icon": "Music"},
   {"id": "text_generation", "name": "文案生成", "value": true, "icon": "FileText"},
   {"id": "templates", "name": "模板库", "value": "全部模板", "icon": "Palette"},
   {"id": "layers", "name": "图层编辑", "value": "完整功能", "icon": "Layers"},
   {"id": "export", "name": "导出功能", "value": "超高清无水印", "icon": "Download"},
   {"id": "storage", "name": "云存储空间", "value": "无限", "icon": "Cloud"},
   {"id": "priority", "name": "优先处理", "value": "最高优先级", "icon": "Clock"},
   {"id": "commercial", "name": "商业授权", "value": true, "icon": "Shield"}
 ]'::jsonb,
 '{"aiGenerationsPerDay": null, "storageGB": null, "exportsPerMonth": null, "maxResolution": "8K", "watermark": false}'::jsonb,
 '{"monthly": {"price": 199, "period": "月"}, "quarterly": {"price": 539, "period": "季度", "discount": "9折", "originalPrice": 597}, "yearly": {"price": 1799, "period": "年", "discount": "7.5折", "originalPrice": 2388}}'::jsonb
)
ON CONFLICT (level) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    limits = EXCLUDED.limits,
    pricing = EXCLUDED.pricing,
    updated_at = NOW();

-- 设置RLS策略
ALTER TABLE membership_orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_coupon_usage ENABLE ROW LEVEL SECURITY;

-- 订单表策略：用户只能看到自己的订单
CREATE POLICY "Users can view own orders" ON membership_orders
    FOR SELECT USING (auth.uid() = user_id);

-- 使用统计策略：用户只能看到自己的统计
CREATE POLICY "Users can view own usage stats" ON membership_usage_stats
    FOR SELECT USING (auth.uid() = user_id);

-- 历史记录策略：用户只能看到自己的历史
CREATE POLICY "Users can view own history" ON membership_history
    FOR SELECT USING (auth.uid() = user_id);

-- 优惠券使用记录策略
CREATE POLICY "Users can view own coupon usage" ON membership_coupon_usage
    FOR SELECT USING (auth.uid() = user_id);

-- 创建更新使用统计的函数
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

-- 创建记录会员历史记录的函数
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

-- 添加注释
COMMENT ON TABLE membership_orders IS '会员订单表';
COMMENT ON TABLE membership_usage_stats IS '会员使用统计表';
COMMENT ON TABLE membership_benefits_config IS '会员权益配置表';
COMMENT ON TABLE membership_history IS '会员历史记录表';
COMMENT ON TABLE membership_coupons IS '会员优惠券表';
COMMENT ON TABLE membership_coupon_usage IS '优惠券使用记录表';
