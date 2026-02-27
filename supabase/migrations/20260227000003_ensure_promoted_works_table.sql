-- ==========================================================================
-- 确保 promoted_works 表存在
-- 修复审核功能依赖的表
-- ==========================================================================

-- 创建推广作品表（如果不存在）
CREATE TABLE IF NOT EXISTS public.promoted_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL REFERENCES public.promotion_orders(id) ON DELETE CASCADE,
    work_id TEXT NOT NULL,
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 推广配置
    package_type TEXT NOT NULL CHECK (package_type IN ('standard', 'basic', 'long', 'custom')),
    target_type TEXT NOT NULL DEFAULT 'account' CHECK (target_type IN ('account', 'product', 'live')),
    metric_type TEXT NOT NULL DEFAULT 'views' CHECK (metric_type IN ('views', 'followers', 'engagement', 'heat')),
    
    -- 推广时间
    start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    end_time TIMESTAMPTZ NOT NULL,
    
    -- 推广目标与进度
    target_views INTEGER DEFAULT 0,
    actual_views INTEGER DEFAULT 0,
    target_clicks INTEGER DEFAULT 0,
    actual_clicks INTEGER DEFAULT 0,
    
    -- 推广权重
    promotion_weight DECIMAL(10, 2) DEFAULT 1.0,
    priority_score DECIMAL(10, 2) DEFAULT 0,
    
    -- 推广位置
    display_position INTEGER DEFAULT 0,
    is_featured BOOLEAN DEFAULT false,
    
    -- 状态
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'expired')),
    
    -- 统计
    daily_views INTEGER DEFAULT 0,
    daily_clicks INTEGER DEFAULT 0,
    total_cost DECIMAL(10, 2) DEFAULT 0,
    
    -- 元数据
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_promoted_works_order ON public.promoted_works(order_id);
CREATE INDEX IF NOT EXISTS idx_promoted_works_work ON public.promoted_works(work_id);
CREATE INDEX IF NOT EXISTS idx_promoted_works_user ON public.promoted_works(user_id);
CREATE INDEX IF NOT EXISTS idx_promoted_works_status ON public.promoted_works(status);
CREATE INDEX IF NOT EXISTS idx_promoted_works_active ON public.promoted_works(status, end_time) WHERE status = 'active';

-- 启用 RLS
ALTER TABLE public.promoted_works ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
DROP POLICY IF EXISTS "系统管理推广作品" ON public.promoted_works;
CREATE POLICY "系统管理推广作品" ON public.promoted_works 
    FOR ALL TO public USING (true) WITH CHECK (true);

-- 更新时间戳触发器
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

-- ==========================================================================
-- 添加审核相关字段到 promotion_orders 表
-- ==========================================================================

-- 添加审核相关字段（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'promotion_orders' AND column_name = 'audit_notes') THEN
        ALTER TABLE public.promotion_orders ADD COLUMN audit_notes TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'promotion_orders' AND column_name = 'audited_at') THEN
        ALTER TABLE public.promotion_orders ADD COLUMN audited_at TIMESTAMPTZ;
    END IF;
END $$;

-- ==========================================================================
-- 创建审核订单的函数
-- ==========================================================================

CREATE OR REPLACE FUNCTION audit_promotion_order(
    p_order_id UUID,
    p_approved BOOLEAN,
    p_notes TEXT DEFAULT ''
)
RETURNS BOOLEAN AS $$
DECLARE
    v_order RECORD;
    v_package_duration INTEGER;
    v_target_views INTEGER;
    v_promotion_weight DECIMAL(10, 2);
BEGIN
    -- 获取订单信息
    SELECT * INTO v_order FROM public.promotion_orders WHERE id = p_order_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION '订单不存在';
    END IF;
    
    IF v_order.status != 'paid' THEN
        RAISE EXCEPTION '订单状态不正确，无法审核';
    END IF;
    
    -- 根据套餐类型设置参数
    CASE v_order.package_type
        WHEN 'standard' THEN
            v_package_duration := 24;
            v_target_views := 1000;
            v_promotion_weight := 1.0;
        WHEN 'basic' THEN
            v_package_duration := 24;
            v_target_views := 2500;
            v_promotion_weight := 1.5;
        WHEN 'long' THEN
            v_package_duration := 48;
            v_target_views := 7500;
            v_promotion_weight := 2.0;
        WHEN 'custom' THEN
            v_package_duration := 72;
            v_target_views := 15000;
            v_promotion_weight := 3.0;
        ELSE
            v_package_duration := 24;
            v_target_views := 1000;
            v_promotion_weight := 1.0;
    END CASE;
    
    IF p_approved THEN
        -- 审核通过：创建推广作品记录
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
            is_featured,
            status
        ) VALUES (
            p_order_id,
            v_order.work_id,
            v_order.user_id,
            v_order.package_type,
            COALESCE(v_order.target_type, 'account'),
            COALESCE(v_order.metric_type, 'views'),
            NOW(),
            NOW() + (v_package_duration || ' hours')::INTERVAL,
            v_target_views,
            ROUND(v_target_views * 0.05),
            v_promotion_weight,
            v_order.package_type IN ('long', 'custom'),
            'active'
        );
        
        -- 更新订单状态
        UPDATE public.promotion_orders 
        SET 
            status = 'active',
            audit_notes = p_notes,
            audited_at = NOW(),
            start_time = NOW(),
            end_time = NOW() + (v_package_duration || ' hours')::INTERVAL,
            updated_at = NOW()
        WHERE id = p_order_id;
    ELSE
        -- 审核拒绝：更新订单状态
        UPDATE public.promotion_orders 
        SET 
            status = 'refunded',
            audit_notes = p_notes,
            audited_at = NOW(),
            updated_at = NOW()
        WHERE id = p_order_id;
    END IF;
    
    RETURN TRUE;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING '审核订单失败: %', SQLERRM;
        RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION audit_promotion_order(UUID, BOOLEAN, TEXT) TO PUBLIC;
