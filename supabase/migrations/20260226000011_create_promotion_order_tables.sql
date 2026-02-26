-- ==========================================================================
-- 推广订单系统 - 数据库迁移
-- 包含：推广订单表、优惠券表、推广金账户表
-- ==========================================================================

-- ==========================================================================
-- 1. 推广订单表 (promotion_orders)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.promotion_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 订单基本信息
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    order_no TEXT NOT NULL UNIQUE,
    
    -- 推广内容
    work_id UUID REFERENCES public.works(id),
    work_title TEXT,
    work_thumbnail TEXT,
    
    -- 套餐信息
    package_type TEXT NOT NULL
        CHECK (package_type IN ('standard', 'basic', 'long', 'custom')),
    package_name TEXT,
    package_duration INTEGER, -- 推广时长（小时）
    expected_views_min INTEGER, -- 预计最小播放量
    expected_views_max INTEGER, -- 预计最大播放量
    
    -- 推广目标
    target_type TEXT NOT NULL DEFAULT 'account'
        CHECK (target_type IN ('account', 'product', 'live')),
    metric_type TEXT NOT NULL DEFAULT 'views'
        CHECK (metric_type IN ('views', 'followers', 'engagement', 'heat')),
    
    -- 价格信息
    original_price DECIMAL(10, 2) NOT NULL,
    discount_amount DECIMAL(10, 2) DEFAULT 0,
    final_price DECIMAL(10, 2) NOT NULL,
    
    -- 优惠券
    coupon_id UUID,
    coupon_code TEXT,
    coupon_discount DECIMAL(10, 2) DEFAULT 0,
    
    -- 支付信息
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'paid', 'processing', 'active', 'completed', 'cancelled', 'refunded')),
    payment_method TEXT,
    payment_time TIMESTAMPTZ,
    transaction_id TEXT,
    
    -- 推广执行信息
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    actual_views INTEGER DEFAULT 0,
    actual_clicks INTEGER DEFAULT 0,
    actual_conversions INTEGER DEFAULT 0,
    
    -- 退款信息
    refund_amount DECIMAL(10, 2) DEFAULT 0,
    refund_reason TEXT,
    refund_time TIMESTAMPTZ,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 备注
    notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_promotion_orders_user ON public.promotion_orders(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_orders_status ON public.promotion_orders(status);
CREATE INDEX IF NOT EXISTS idx_promotion_orders_package ON public.promotion_orders(package_type);
CREATE INDEX IF NOT EXISTS idx_promotion_orders_created ON public.promotion_orders(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promotion_orders_payment ON public.promotion_orders(payment_time);

-- ==========================================================================
-- 2. 推广优惠券表 (promotion_coupons)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.promotion_coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 优惠券基本信息
    code TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    
    -- 优惠类型
    discount_type TEXT NOT NULL DEFAULT 'percentage'
        CHECK (discount_type IN ('percentage', 'fixed', 'first_order')),
    discount_value DECIMAL(10, 2) NOT NULL, -- 折扣值（百分比或固定金额）
    max_discount DECIMAL(10, 2), -- 最大优惠金额（百分比类型时有效）
    min_order_amount DECIMAL(10, 2) DEFAULT 0, -- 最低订单金额
    
    -- 使用限制
    total_quantity INTEGER DEFAULT -1, -- -1 表示无限
    used_quantity INTEGER DEFAULT 0,
    per_user_limit INTEGER DEFAULT 1, -- 每个用户可使用次数
    
    -- 适用范围
    applicable_packages JSONB DEFAULT '[]'::jsonb, -- 适用的套餐类型，空数组表示全部
    applicable_user_types JSONB DEFAULT '[]'::jsonb, -- 适用的用户类型
    
    -- 时间限制
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    
    -- 状态
    is_active BOOLEAN DEFAULT true,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 创建者
    created_by UUID REFERENCES public.users(id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_promotion_coupons_code ON public.promotion_coupons(code);
CREATE INDEX IF NOT EXISTS idx_promotion_coupons_active ON public.promotion_coupons(is_active);
CREATE INDEX IF NOT EXISTS idx_promotion_coupons_time ON public.promotion_coupons(start_time, end_time);

-- ==========================================================================
-- 3. 用户优惠券使用记录表 (promotion_coupon_usage)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.promotion_coupon_usage (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    coupon_id UUID NOT NULL REFERENCES public.promotion_coupons(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.promotion_orders(id) ON DELETE SET NULL,
    
    -- 使用信息
    used_at TIMESTAMPTZ DEFAULT NOW(),
    discount_amount DECIMAL(10, 2) NOT NULL,
    
    -- 唯一约束：一个订单只能使用一张优惠券
    UNIQUE(user_id, order_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_promotion_coupon_usage_user ON public.promotion_coupon_usage(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_coupon_usage_coupon ON public.promotion_coupon_usage(coupon_id);

-- ==========================================================================
-- 4. 推广金账户表 (promotion_wallets)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.promotion_wallets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 余额
    balance DECIMAL(12, 2) DEFAULT 0,
    frozen_balance DECIMAL(12, 2) DEFAULT 0, -- 冻结金额（待结算）
    total_recharge DECIMAL(12, 2) DEFAULT 0, -- 累计充值
    total_consumption DECIMAL(12, 2) DEFAULT 0, -- 累计消费
    
    -- 状态
    is_active BOOLEAN DEFAULT true,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    last_transaction_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_promotion_wallets_user ON public.promotion_wallets(user_id);

-- ==========================================================================
-- 5. 推广金交易记录表 (promotion_wallet_transactions)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.promotion_wallet_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    wallet_id UUID NOT NULL REFERENCES public.promotion_wallets(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 交易信息
    type TEXT NOT NULL
        CHECK (type IN ('recharge', 'consumption', 'refund', 'bonus', 'withdrawal')),
    amount DECIMAL(12, 2) NOT NULL,
    balance_before DECIMAL(12, 2) NOT NULL,
    balance_after DECIMAL(12, 2) NOT NULL,
    
    -- 关联信息
    order_id UUID REFERENCES public.promotion_orders(id) ON DELETE SET NULL,
    reference_id TEXT, -- 外部交易ID（如支付平台订单号）
    
    -- 描述
    description TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_promotion_wallet_txn_wallet ON public.promotion_wallet_transactions(wallet_id);
CREATE INDEX IF NOT EXISTS idx_promotion_wallet_txn_user ON public.promotion_wallet_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_promotion_wallet_txn_type ON public.promotion_wallet_transactions(type);
CREATE INDEX IF NOT EXISTS idx_promotion_wallet_txn_created ON public.promotion_wallet_transactions(created_at DESC);

-- ==========================================================================
-- RLS 策略
-- ==========================================================================

-- 推广订单表
ALTER TABLE public.promotion_orders ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的订单
CREATE POLICY "用户查看自己的推广订单" ON public.promotion_orders
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 用户可以创建自己的订单
CREATE POLICY "用户创建推广订单" ON public.promotion_orders
    FOR INSERT TO public
    WITH CHECK (user_id = auth.uid());

-- 用户可以更新自己的待支付订单
CREATE POLICY "用户更新自己的推广订单" ON public.promotion_orders
    FOR UPDATE TO public
    USING (user_id = auth.uid());

-- 优惠券表
ALTER TABLE public.promotion_coupons ENABLE ROW LEVEL SECURITY;

-- 所有用户可查看有效的优惠券
CREATE POLICY "用户查看有效优惠券" ON public.promotion_coupons
    FOR SELECT TO public
    USING (is_active = true);

-- 优惠券使用记录表
ALTER TABLE public.promotion_coupon_usage ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的使用记录
CREATE POLICY "用户查看自己的优惠券使用记录" ON public.promotion_coupon_usage
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 推广金账户表
ALTER TABLE public.promotion_wallets ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的账户
CREATE POLICY "用户查看自己的推广金账户" ON public.promotion_wallets
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 交易记录表
ALTER TABLE public.promotion_wallet_transactions ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己的交易记录
CREATE POLICY "用户查看自己的交易记录" ON public.promotion_wallet_transactions
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- ==========================================================================
-- 触发器函数
-- ==========================================================================

-- 更新时间戳
CREATE OR REPLACE FUNCTION update_promotion_order_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 推广订单更新触发器
DROP TRIGGER IF EXISTS update_promotion_orders_updated_at ON public.promotion_orders;
CREATE TRIGGER update_promotion_orders_updated_at
    BEFORE UPDATE ON public.promotion_orders
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_order_updated_at_column();

-- 推广金账户更新触发器
DROP TRIGGER IF EXISTS update_promotion_wallets_updated_at ON public.promotion_wallets;
CREATE TRIGGER update_promotion_wallets_updated_at
    BEFORE UPDATE ON public.promotion_wallets
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_order_updated_at_column();

-- 优惠券更新触发器
DROP TRIGGER IF EXISTS update_promotion_coupons_updated_at ON public.promotion_coupons;
CREATE TRIGGER update_promotion_coupons_updated_at
    BEFORE UPDATE ON public.promotion_coupons
    FOR EACH ROW
    EXECUTE FUNCTION update_promotion_order_updated_at_column();

-- ==========================================================================
-- 辅助函数
-- ==========================================================================

-- 生成订单号
CREATE OR REPLACE FUNCTION generate_promotion_order_no()
RETURNS TEXT AS $$
DECLARE
    v_order_no TEXT;
    v_exists BOOLEAN;
BEGIN
    LOOP
        -- 生成订单号：PRO + 年月日 + 6位随机数
        v_order_no := 'PRO' || TO_CHAR(NOW(), 'YYYYMMDD') || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
        
        -- 检查是否已存在
        SELECT EXISTS(SELECT 1 FROM public.promotion_orders WHERE order_no = v_order_no) INTO v_exists;
        
        EXIT WHEN NOT v_exists;
    END LOOP;
    
    RETURN v_order_no;
END;
$$ LANGUAGE plpgsql;

-- 创建推广订单
CREATE OR REPLACE FUNCTION create_promotion_order(
    p_user_id UUID,
    p_work_id UUID,
    p_package_type TEXT,
    p_target_type TEXT,
    p_metric_type TEXT,
    p_original_price DECIMAL,
    p_discount_amount DECIMAL,
    p_final_price DECIMAL,
    p_coupon_id UUID DEFAULT NULL,
    p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
    v_order_no TEXT;
BEGIN
    -- 生成订单号
    v_order_no := generate_promotion_order_no();
    
    -- 创建订单
    INSERT INTO public.promotion_orders (
        user_id,
        order_no,
        work_id,
        package_type,
        target_type,
        metric_type,
        original_price,
        discount_amount,
        final_price,
        coupon_id,
        metadata,
        status
    ) VALUES (
        p_user_id,
        v_order_no,
        p_work_id,
        p_package_type,
        p_target_type,
        p_metric_type,
        p_original_price,
        p_discount_amount,
        p_final_price,
        p_coupon_id,
        p_metadata,
        'pending'
    )
    RETURNING id INTO v_order_id;
    
    -- 如果使用优惠券，记录使用
    IF p_coupon_id IS NOT NULL THEN
        INSERT INTO public.promotion_coupon_usage (user_id, coupon_id, discount_amount)
        VALUES (p_user_id, p_coupon_id, p_discount_amount);
        
        -- 更新优惠券使用数量
        UPDATE public.promotion_coupons
        SET used_quantity = used_quantity + 1
        WHERE id = p_coupon_id;
    END IF;
    
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- 支付推广订单
CREATE OR REPLACE FUNCTION pay_promotion_order(
    p_order_id UUID,
    p_payment_method TEXT,
    p_transaction_id TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_order RECORD;
BEGIN
    -- 获取订单信息
    SELECT * INTO v_order
    FROM public.promotion_orders
    WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    
    IF v_order.status != 'pending' THEN
        RETURN false;
    END IF;
    
    -- 更新订单状态
    UPDATE public.promotion_orders
    SET 
        status = 'paid',
        payment_method = p_payment_method,
        payment_time = NOW(),
        transaction_id = p_transaction_id,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 获取用户可用优惠券
CREATE OR REPLACE FUNCTION get_available_coupons(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    code TEXT,
    name TEXT,
    description TEXT,
    discount_type TEXT,
    discount_value DECIMAL,
    max_discount DECIMAL,
    min_order_amount DECIMAL
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.code,
        c.name,
        c.description,
        c.discount_type,
        c.discount_value,
        c.max_discount,
        c.min_order_amount
    FROM public.promotion_coupons c
    WHERE c.is_active = true
        AND (c.start_time IS NULL OR c.start_time <= NOW())
        AND (c.end_time IS NULL OR c.end_time >= NOW())
        AND (c.total_quantity = -1 OR c.used_quantity < c.total_quantity)
        AND (
            c.per_user_limit = 0 
            OR (
                SELECT COUNT(*) 
                FROM public.promotion_coupon_usage u 
                WHERE u.coupon_id = c.id AND u.user_id = p_user_id
            ) < c.per_user_limit
        )
    ORDER BY c.discount_value DESC;
END;
$$ LANGUAGE plpgsql;

-- 获取或创建用户推广金账户
CREATE OR REPLACE FUNCTION get_or_create_wallet(p_user_id UUID)
RETURNS UUID AS $$
DECLARE
    v_wallet_id UUID;
BEGIN
    -- 尝试获取现有账户
    SELECT id INTO v_wallet_id
    FROM public.promotion_wallets
    WHERE user_id = p_user_id;
    
    -- 如果不存在，创建新账户
    IF v_wallet_id IS NULL THEN
        INSERT INTO public.promotion_wallets (user_id)
        VALUES (p_user_id)
        RETURNING id INTO v_wallet_id;
    END IF;
    
    RETURN v_wallet_id;
END;
$$ LANGUAGE plpgsql;

-- 充值推广金
CREATE OR REPLACE FUNCTION recharge_wallet(
    p_user_id UUID,
    p_amount DECIMAL,
    p_reference_id TEXT,
    p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_wallet_id UUID;
    v_balance_before DECIMAL;
BEGIN
    -- 获取或创建账户
    v_wallet_id := get_or_create_wallet(p_user_id);
    
    -- 获取当前余额
    SELECT balance INTO v_balance_before
    FROM public.promotion_wallets
    WHERE id = v_wallet_id;
    
    -- 更新账户余额
    UPDATE public.promotion_wallets
    SET 
        balance = balance + p_amount,
        total_recharge = total_recharge + p_amount,
        last_transaction_at = NOW(),
        updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- 记录交易
    INSERT INTO public.promotion_wallet_transactions (
        wallet_id,
        user_id,
        type,
        amount,
        balance_before,
        balance_after,
        reference_id,
        description
    ) VALUES (
        v_wallet_id,
        p_user_id,
        'recharge',
        p_amount,
        v_balance_before,
        v_balance_before + p_amount,
        p_reference_id,
        p_description
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 消费推广金
CREATE OR REPLACE FUNCTION consume_wallet(
    p_user_id UUID,
    p_amount DECIMAL,
    p_order_id UUID,
    p_description TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
    v_wallet_id UUID;
    v_balance DECIMAL;
BEGIN
    -- 获取账户信息
    SELECT id, balance INTO v_wallet_id, v_balance
    FROM public.promotion_wallets
    WHERE user_id = p_user_id;
    
    -- 检查余额
    IF v_wallet_id IS NULL OR v_balance < p_amount THEN
        RETURN false;
    END IF;
    
    -- 更新账户余额
    UPDATE public.promotion_wallets
    SET 
        balance = balance - p_amount,
        total_consumption = total_consumption + p_amount,
        last_transaction_at = NOW(),
        updated_at = NOW()
    WHERE id = v_wallet_id;
    
    -- 记录交易
    INSERT INTO public.promotion_wallet_transactions (
        wallet_id,
        user_id,
        type,
        amount,
        balance_before,
        balance_after,
        order_id,
        description
    ) VALUES (
        v_wallet_id,
        p_user_id,
        'consumption',
        -p_amount,
        v_balance,
        v_balance - p_amount,
        p_order_id,
        p_description
    );
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- ==========================================================================
-- 视图
-- ==========================================================================

-- 推广订单详情视图
CREATE OR REPLACE VIEW promotion_orders_detail AS
SELECT 
    po.*,
    u.username as user_username,
    u.email as user_email,
    u.avatar_url as user_avatar,
    w.title as work_title,
    COALESCE(w.thumbnail_url, w.thumbnail, w.cover_image, po.work_thumbnail) as work_thumbnail
FROM public.promotion_orders po
LEFT JOIN public.users u ON po.user_id = u.id
LEFT JOIN public.works w ON po.work_id = w.id;

-- 用户推广统计视图
CREATE OR REPLACE VIEW promotion_user_statistics AS
SELECT 
    user_id,
    COUNT(*) as total_orders,
    COUNT(*) FILTER (WHERE status = 'pending') as pending_orders,
    COUNT(*) FILTER (WHERE status = 'paid') as paid_orders,
    COUNT(*) FILTER (WHERE status = 'active') as active_orders,
    COUNT(*) FILTER (WHERE status = 'completed') as completed_orders,
    SUM(final_price) as total_spent,
    SUM(actual_views) as total_views
FROM public.promotion_orders
GROUP BY user_id;

-- ==========================================================================
-- 初始化数据：创建默认优惠券
-- ==========================================================================

-- 新人7折券
INSERT INTO public.promotion_coupons (
    code,
    name,
    description,
    discount_type,
    discount_value,
    max_discount,
    min_order_amount,
    total_quantity,
    per_user_limit,
    applicable_packages,
    is_active
) VALUES (
    'NEWUSER30',
    '新人7折优惠',
    '新用户首次推广专享7折优惠，最高减免200元',
    'percentage',
    30,
    200,
    0,
    -1,
    1,
    '[]'::jsonb,
    true
) ON CONFLICT (code) DO NOTHING;

-- 二单8折券
INSERT INTO public.promotion_coupons (
    code,
    name,
    description,
    discount_type,
    discount_value,
    max_discount,
    min_order_amount,
    total_quantity,
    per_user_limit,
    applicable_packages,
    is_active
) VALUES (
    'SECOND20',
    '二单8折优惠',
    '第二次推广专享8折优惠，最高减免100元',
    'percentage',
    20,
    100,
    0,
    -1,
    1,
    '[]'::jsonb,
    true
) ON CONFLICT (code) DO NOTHING;

-- 三单85折券
INSERT INTO public.promotion_coupons (
    code,
    name,
    description,
    discount_type,
    discount_value,
    max_discount,
    min_order_amount,
    total_quantity,
    per_user_limit,
    applicable_packages,
    is_active
) VALUES (
    'THIRD15',
    '三单85折优惠',
    '第三次推广专享85折优惠，最高减免80元',
    'percentage',
    15,
    80,
    0,
    -1,
    1,
    '[]'::jsonb,
    true
) ON CONFLICT (code) DO NOTHING;

-- ==========================================================================
-- 完成
-- ==========================================================================

-- 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';
