-- ==========================================================================
-- 推广作品功能增强
-- 实现真实的推广曝光、排序等功能
-- ==========================================================================

-- ==========================================================================
-- 第一部分：创建推广作品表（记录正在推广中的作品）
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.promoted_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.promotion_orders(id) ON DELETE CASCADE,
    work_id TEXT NOT NULL, -- 作品ID（支持非UUID格式）
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 推广配置
    package_type TEXT NOT NULL CHECK (package_type IN ('standard', 'basic', 'long', 'custom')),
    target_type TEXT NOT NULL DEFAULT 'account' CHECK (target_type IN ('account', 'product', 'live')),
    metric_type TEXT NOT NULL DEFAULT 'views' CHECK (metric_type IN ('views', 'followers', 'engagement', 'heat')),
    
    -- 推广时间
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ NOT NULL,
    
    -- 推广目标与进度
    target_views INTEGER DEFAULT 0, -- 目标曝光量
    actual_views INTEGER DEFAULT 0, -- 实际曝光量
    target_clicks INTEGER DEFAULT 0, -- 目标点击量
    actual_clicks INTEGER DEFAULT 0, -- 实际点击量
    
    -- 推广权重（用于排序）
    promotion_weight DECIMAL(10, 2) DEFAULT 1.0, -- 推广权重，越高越靠前
    priority_score DECIMAL(10, 2) DEFAULT 0, -- 综合优先级分数
    
    -- 推广位置
    display_position INTEGER DEFAULT 0, -- 显示位置（0表示正常流，1-10表示置顶位置）
    is_featured BOOLEAN DEFAULT false, -- 是否精选推广
    
    -- 状态
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'expired')),
    
    -- 统计
    daily_views INTEGER DEFAULT 0, -- 今日曝光
    daily_clicks INTEGER DEFAULT 0, -- 今日点击
    total_cost DECIMAL(10, 2) DEFAULT 0, -- 累计消耗
    
    -- 元数据
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- 唯一约束：一个作品同一时间只能有一个活跃推广
    UNIQUE(work_id, status) WHERE status = 'active'
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_promoted_works_order ON public.promoted_works(order_id);
CREATE INDEX IF NOT EXISTS idx_promoted_works_work ON public.promoted_works(work_id);
CREATE INDEX IF NOT EXISTS idx_promoted_works_user ON public.promoted_works(user_id);
CREATE INDEX IF NOT EXISTS idx_promoted_works_status ON public.promoted_works(status);
CREATE INDEX IF NOT EXISTS idx_promoted_works_active ON public.promoted_works(status, end_time) WHERE status = 'active';
CREATE INDEX IF NOT EXISTS idx_promoted_works_weight ON public.promoted_works(promotion_weight DESC);
CREATE INDEX IF NOT EXISTS idx_promoted_works_priority ON public.promoted_works(priority_score DESC);
CREATE INDEX IF NOT EXISTS idx_promoted_works_position ON public.promoted_works(display_position);

-- ==========================================================================
-- 第二部分：创建推广曝光记录表
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.promotion_impressions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoted_work_id UUID NOT NULL REFERENCES public.promoted_works(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.promotion_orders(id) ON DELETE CASCADE,
    work_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE, -- 推广购买者
    
    -- 曝光信息
    viewer_id UUID REFERENCES public.users(id) ON DELETE SET NULL, -- 观看者（可能未登录）
    viewer_ip TEXT, -- 观看者IP
    source_page TEXT, -- 来源页面
    source_position INTEGER DEFAULT 0, -- 在列表中的位置
    
    -- 互动信息
    is_clicked BOOLEAN DEFAULT false, -- 是否点击
    clicked_at TIMESTAMPTZ, -- 点击时间
    is_converted BOOLEAN DEFAULT false, -- 是否转化（点赞、收藏等）
    converted_at TIMESTAMPTZ, -- 转化时间
    
    -- 设备信息
    user_agent TEXT,
    device_type TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_promotion_impressions_promoted_work ON public.promotion_impressions(promoted_work_id);
CREATE INDEX IF NOT EXISTS idx_promotion_impressions_order ON public.promotion_impressions(order_id);
CREATE INDEX IF NOT EXISTS idx_promotion_impressions_work ON public.promotion_impressions(work_id);
CREATE INDEX IF NOT EXISTS idx_promotion_impressions_created ON public.promotion_impressions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_promotion_impressions_viewer ON public.promotion_impressions(viewer_id) WHERE viewer_id IS NOT NULL;

-- ==========================================================================
-- 第三部分：创建推广效果统计表（按天统计）
-- ==========================================================================

CREATE TABLE IF NOT EXISTS public.promotion_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    promoted_work_id UUID NOT NULL REFERENCES public.promoted_works(id) ON DELETE CASCADE,
    order_id UUID NOT NULL REFERENCES public.promotion_orders(id) ON DELETE CASCADE,
    work_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    date DATE NOT NULL,
    
    -- 曝光统计
    impressions INTEGER DEFAULT 0, -- 曝光次数
    unique_viewers INTEGER DEFAULT 0, -- 独立观看者
    clicks INTEGER DEFAULT 0, -- 点击次数
    ctr DECIMAL(5, 4) DEFAULT 0, -- 点击率
    
    -- 互动统计
    likes INTEGER DEFAULT 0,
    bookmarks INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    follows INTEGER DEFAULT 0, -- 新增关注
    
    -- 消耗统计
    cost DECIMAL(10, 2) DEFAULT 0, -- 当日消耗
    avg_cpm DECIMAL(10, 2) DEFAULT 0, -- 千次曝光成本
    avg_cpc DECIMAL(10, 2) DEFAULT 0, -- 单次点击成本
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(promoted_work_id, date)
);

CREATE INDEX IF NOT EXISTS idx_promotion_daily_stats_promoted_work ON public.promotion_daily_stats(promoted_work_id);
CREATE INDEX IF NOT EXISTS idx_promotion_daily_stats_date ON public.promotion_daily_stats(date);
CREATE INDEX IF NOT EXISTS idx_promotion_daily_stats_user ON public.promotion_daily_stats(user_id);

-- ==========================================================================
-- 第四部分：RLS策略
-- ==========================================================================

-- 推广作品表
ALTER TABLE public.promoted_works ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用户查看自己的推广作品" ON public.promoted_works;
CREATE POLICY "用户查看自己的推广作品" ON public.promoted_works 
    FOR SELECT TO public USING (user_id = auth.uid());

DROP POLICY IF EXISTS "系统管理推广作品" ON public.promoted_works;
CREATE POLICY "系统管理推广作品" ON public.promoted_works 
    FOR ALL TO public USING (true) WITH CHECK (true);

-- 曝光记录表
ALTER TABLE public.promotion_impressions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用户查看自己作品的曝光记录" ON public.promotion_impressions;
CREATE POLICY "用户查看自己作品的曝光记录" ON public.promotion_impressions 
    FOR SELECT TO public USING (user_id = auth.uid());

-- 日统计表
ALTER TABLE public.promotion_daily_stats ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "用户查看自己作品的推广统计" ON public.promotion_daily_stats;
CREATE POLICY "用户查看自己作品的推广统计" ON public.promotion_daily_stats 
    FOR SELECT TO public USING (user_id = auth.uid());

-- ==========================================================================
-- 第五部分：触发器函数
-- ==========================================================================

-- 更新时间戳
CREATE OR REPLACE FUNCTION update_promoted_works_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_promoted_works_updated_at ON public.promoted_works;
CREATE TRIGGER update_promoted_works_updated_at
    BEFORE UPDATE ON public.promoted_works
    FOR EACH ROW EXECUTE FUNCTION update_promoted_works_updated_at();

DROP TRIGGER IF EXISTS update_promotion_daily_stats_updated_at ON public.promotion_daily_stats;
CREATE TRIGGER update_promotion_daily_stats_updated_at
    BEFORE UPDATE ON public.promotion_daily_stats
    FOR EACH ROW EXECUTE FUNCTION update_promoted_works_updated_at();

-- ==========================================================================
-- 第六部分：核心功能函数
-- ==========================================================================

-- 激活推广订单（支付后调用）
CREATE OR REPLACE FUNCTION activate_promotion_order(
    p_order_id UUID,
    p_start_time TIMESTAMPTZ DEFAULT NOW()
)
RETURNS UUID AS $$
DECLARE
    v_order RECORD;
    v_promoted_work_id UUID;
    v_end_time TIMESTAMPTZ;
    v_target_views INTEGER;
    v_package_duration INTEGER;
BEGIN
    -- 获取订单信息
    SELECT * INTO v_order FROM public.promotion_orders WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '订单不存在';
    END IF;
    
    IF v_order.status != 'paid' THEN
        RAISE EXCEPTION '订单未支付';
    END IF;
    
    -- 计算推广时长和目标曝光量
    CASE v_order.package_type
        WHEN 'standard' THEN 
            v_package_duration := 24; -- 24小时
            v_target_views := 1000;
        WHEN 'basic' THEN 
            v_package_duration := 24;
            v_target_views := 2500;
        WHEN 'long' THEN 
            v_package_duration := 48;
            v_target_views := 7500;
        ELSE 
            v_package_duration := 24;
            v_target_views := 1000;
    END CASE;
    
    v_end_time := p_start_time + (v_package_duration || ' hours')::INTERVAL;
    
    -- 创建推广作品记录
    INSERT INTO public.promoted_works (
        order_id,
        work_id,
        user_id,
        package_type,
        target_type,
        metric_type,
        start_time,
        end_time,
        target_views,
        target_clicks,
        promotion_weight,
        priority_score,
        display_position,
        status,
        metadata
    ) VALUES (
        p_order_id,
        v_order.work_id,
        v_order.user_id,
        v_order.package_type,
        v_order.target_type,
        v_order.metric_type,
        p_start_time,
        v_end_time,
        v_target_views,
        ROUND(v_target_views * 0.05), -- 预计5%的点击率
        CASE v_order.package_type
            WHEN 'standard' THEN 1.0
            WHEN 'basic' THEN 1.5
            WHEN 'long' THEN 2.0
            ELSE 1.0
        END,
        0, -- 初始优先级分数，后续计算
        0, -- 默认不置顶
        'active',
        jsonb_build_object(
            'order_no', v_order.order_no,
            'final_price', v_order.final_price,
            'expected_views', v_order.expected_views_min || '-' || v_order.expected_views_max
        )
    )
    RETURNING id INTO v_promoted_work_id;
    
    -- 更新订单状态为推广中
    UPDATE public.promotion_orders
    SET 
        status = 'active',
        start_time = p_start_time,
        end_time = v_end_time,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    RETURN v_promoted_work_id;
END;
$$ LANGUAGE plpgsql;

-- 记录推广曝光
CREATE OR REPLACE FUNCTION record_promotion_impression(
    p_promoted_work_id UUID,
    p_viewer_id UUID DEFAULT NULL,
    p_viewer_ip TEXT DEFAULT NULL,
    p_source_page TEXT DEFAULT NULL,
    p_source_position INTEGER DEFAULT 0,
    p_user_agent TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_impression_id UUID;
    v_promoted_work RECORD;
    v_device_type TEXT;
BEGIN
    -- 获取推广作品信息
    SELECT * INTO v_promoted_work FROM public.promoted_works WHERE id = p_promoted_work_id;
    
    IF NOT FOUND OR v_promoted_work.status != 'active' THEN
        RETURN NULL;
    END IF;
    
    -- 检测设备类型
    v_device_type := CASE 
        WHEN p_user_agent LIKE '%Mobile%' THEN 'mobile'
        WHEN p_user_agent LIKE '%Tablet%' THEN 'tablet'
        ELSE 'desktop'
    END;
    
    -- 创建曝光记录
    INSERT INTO public.promotion_impressions (
        promoted_work_id,
        order_id,
        work_id,
        user_id,
        viewer_id,
        viewer_ip,
        source_page,
        source_position,
        user_agent,
        device_type
    ) VALUES (
        p_promoted_work_id,
        v_promoted_work.order_id,
        v_promoted_work.work_id,
        v_promoted_work.user_id,
        p_viewer_id,
        p_viewer_ip,
        p_source_page,
        p_source_position,
        p_user_agent,
        v_device_type
    )
    RETURNING id INTO v_impression_id;
    
    -- 更新推广作品的曝光统计
    UPDATE public.promoted_works
    SET 
        actual_views = actual_views + 1,
        daily_views = daily_views + 1,
        updated_at = NOW()
    WHERE id = p_promoted_work_id;
    
    -- 更新订单的实际曝光
    UPDATE public.promotion_orders
    SET actual_views = actual_views + 1
    WHERE id = v_promoted_work.order_id;
    
    RETURN v_impression_id;
END;
$$ LANGUAGE plpgsql;

-- 记录推广点击
CREATE OR REPLACE FUNCTION record_promotion_click(
    p_impression_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_impression RECORD;
BEGIN
    SELECT * INTO v_impression FROM public.promotion_impressions WHERE id = p_impression_id;
    
    IF NOT FOUND OR v_impression.is_clicked THEN
        RETURN false;
    END IF;
    
    -- 更新曝光记录
    UPDATE public.promotion_impressions
    SET is_clicked = true, clicked_at = NOW()
    WHERE id = p_impression_id;
    
    -- 更新推广作品点击统计
    UPDATE public.promoted_works
    SET 
        actual_clicks = actual_clicks + 1,
        daily_clicks = daily_clicks + 1
    WHERE id = v_impression.promoted_work_id;
    
    -- 更新订单点击统计
    UPDATE public.promotion_orders
    SET actual_clicks = COALESCE(actual_clicks, 0) + 1
    WHERE id = v_impression.order_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 更新推广优先级分数（定时任务调用）
CREATE OR REPLACE FUNCTION update_promotion_priority_scores()
RETURNS INTEGER AS $$
DECLARE
    v_updated_count INTEGER := 0;
BEGIN
    UPDATE public.promoted_works
    SET priority_score = calculate_promotion_priority_score(id),
        updated_at = NOW()
    WHERE status = 'active';
    
    GET DIAGNOSTICS v_updated_count = ROW_COUNT;
    RETURN v_updated_count;
END;
$$ LANGUAGE plpgsql;

-- 计算单个推广的优先级分数
CREATE OR REPLACE FUNCTION calculate_promotion_priority_score(p_promoted_work_id UUID)
RETURNS DECIMAL AS $$
DECLARE
    v_promoted_work RECORD;
    v_score DECIMAL := 0;
    v_time_factor DECIMAL := 1;
    v_performance_factor DECIMAL := 1;
    v_package_factor DECIMAL := 1;
BEGIN
    SELECT * INTO v_promoted_work FROM public.promoted_works WHERE id = p_promoted_work_id;
    
    IF NOT FOUND THEN
        RETURN 0;
    END IF;
    
    -- 基础分：推广权重
    v_score := v_promoted_work.promotion_weight * 100;
    
    -- 时间因子：新推广有加成
    v_time_factor := GREATEST(0.5, 1 - (EXTRACT(EPOCH FROM (NOW() - v_promoted_work.start_time)) / 86400) * 0.1);
    
    -- 效果因子：点击率高的推广有加成
    IF v_promoted_work.actual_views > 0 THEN
        v_performance_factor := 1 + (v_promoted_work.actual_clicks::DECIMAL / v_promoted_work.actual_views) * 10;
    END IF;
    
    -- 套餐因子：高价套餐有加成
    v_package_factor := CASE v_promoted_work.package_type
        WHEN 'custom' THEN 2.0
        WHEN 'long' THEN 1.5
        WHEN 'basic' THEN 1.2
        ELSE 1.0
    END;
    
    -- 置顶加成
    IF v_promoted_work.display_position > 0 THEN
        v_score := v_score + (v_promoted_work.display_position * 50);
    END IF;
    
    RETURN ROUND(v_score * v_time_factor * v_performance_factor * v_package_factor, 2);
END;
$$ LANGUAGE plpgsql;

-- 获取活跃推广作品列表（用于作品列表展示）
CREATE OR REPLACE FUNCTION get_active_promoted_works(
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    promoted_work_id UUID,
    order_id UUID,
    work_id TEXT,
    user_id UUID,
    promotion_weight DECIMAL,
    priority_score DECIMAL,
    display_position INTEGER,
    is_featured BOOLEAN,
    package_type TEXT,
    remaining_hours INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pw.id as promoted_work_id,
        pw.order_id,
        pw.work_id,
        pw.user_id,
        pw.promotion_weight,
        pw.priority_score,
        pw.display_position,
        pw.is_featured,
        pw.package_type,
        EXTRACT(EPOCH FROM (pw.end_time - NOW())) / 3600::INTEGER as remaining_hours
    FROM public.promoted_works pw
    WHERE pw.status = 'active'
      AND pw.end_time > NOW()
    ORDER BY 
        pw.display_position DESC, -- 置顶优先
        pw.priority_score DESC,   -- 高分优先
        pw.promotion_weight DESC,
        pw.start_time DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 检查并更新过期推广
CREATE OR REPLACE FUNCTION check_and_expire_promotions()
RETURNS INTEGER AS $$
DECLARE
    v_expired_count INTEGER := 0;
BEGIN
    -- 将过期推广标记为completed
    UPDATE public.promoted_works
    SET 
        status = 'completed',
        updated_at = NOW()
    WHERE status = 'active'
      AND end_time < NOW();
    
    GET DIAGNOSTICS v_expired_count = ROW_COUNT;
    
    -- 同步更新订单状态
    UPDATE public.promotion_orders
    SET 
        status = 'completed',
        updated_at = NOW()
    WHERE status = 'active'
      AND end_time < NOW();
    
    RETURN v_expired_count;
END;
$$ LANGUAGE plpgsql;

-- 获取推广统计摘要
CREATE OR REPLACE FUNCTION get_promotion_summary(p_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_summary JSONB;
BEGIN
    SELECT jsonb_build_object(
        'active_promotions', COUNT(*) FILTER (WHERE status = 'active'),
        'total_impressions', COALESCE(SUM(actual_views), 0),
        'total_clicks', COALESCE(SUM(actual_clicks), 0),
        'avg_ctr', CASE 
            WHEN COALESCE(SUM(actual_views), 0) > 0 
            THEN ROUND((SUM(actual_clicks)::DECIMAL / SUM(actual_views)) * 100, 2)
            ELSE 0 
        END,
        'total_spent', COALESCE((SELECT SUM(final_price) FROM public.promotion_orders WHERE user_id = p_user_id AND status IN ('active', 'completed')), 0),
        'today_impressions', COALESCE(SUM(daily_views), 0),
        'today_clicks', COALESCE(SUM(daily_clicks), 0)
    )
    INTO v_summary
    FROM public.promoted_works
    WHERE user_id = p_user_id;
    
    RETURN v_summary;
END;
$$ LANGUAGE plpgsql;

-- ==========================================================================
-- 第七部分：视图
-- ==========================================================================

CREATE OR REPLACE VIEW promoted_works_detail AS
SELECT 
    pw.*,
    u.username as user_username,
    u.avatar_url as user_avatar,
    po.work_title,
    po.work_thumbnail,
    po.final_price,
    po.order_no,
    CASE 
        WHEN pw.actual_views > 0 THEN ROUND((pw.actual_clicks::DECIMAL / pw.actual_views) * 100, 2)
        ELSE 0 
    END as ctr,
    CASE 
        WHEN pw.target_views > 0 THEN ROUND((pw.actual_views::DECIMAL / pw.target_views) * 100, 2)
        ELSE 0 
    END as progress_percent
FROM public.promoted_works pw
LEFT JOIN public.users u ON pw.user_id = u.id
LEFT JOIN public.promotion_orders po ON pw.order_id = po.id;

-- ==========================================================================
-- 第八部分：初始化数据（可选）
-- ==========================================================================

-- 创建定时任务扩展（如果尚未创建）
-- 注意：需要在 Supabase 控制台手动启用 pg_cron 扩展
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 定时任务：每分钟更新推广优先级分数
-- SELECT cron.schedule('update-promotion-scores', '* * * * *', 'SELECT update_promotion_priority_scores()');

-- 定时任务：每小时检查过期推广
-- SELECT cron.schedule('expire-promotions', '0 * * * *', 'SELECT check_and_expire_promotions()');

NOTIFY pgrst, 'reload schema';
