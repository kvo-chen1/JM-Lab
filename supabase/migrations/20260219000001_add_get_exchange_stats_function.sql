-- 创建获取兑换订单统计的 RPC 函数
-- 用于订单管理页面的统计数据展示

CREATE OR REPLACE FUNCTION public.get_exchange_stats(
    p_user_id UUID DEFAULT NULL,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INTEGER;
    v_pending INTEGER;
    v_processing INTEGER;
    v_completed INTEGER;
    v_cancelled INTEGER;
    v_refunded INTEGER;
    v_total_points BIGINT;
    v_today_orders INTEGER;
    v_today_date DATE;
BEGIN
    -- 获取今天的日期
    v_today_date := CURRENT_DATE;

    -- 计算总订单数
    SELECT COUNT(*) INTO v_total
    FROM public.exchange_records
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND (p_start_date IS NULL OR created_at::DATE >= p_start_date)
      AND (p_end_date IS NULL OR created_at::DATE <= p_end_date);

    -- 计算各状态订单数
    SELECT 
        COUNT(*) FILTER (WHERE status = 'pending'),
        COUNT(*) FILTER (WHERE status = 'processing'),
        COUNT(*) FILTER (WHERE status = 'completed'),
        COUNT(*) FILTER (WHERE status = 'cancelled'),
        COUNT(*) FILTER (WHERE status = 'refunded')
    INTO v_pending, v_processing, v_completed, v_cancelled, v_refunded
    FROM public.exchange_records
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND (p_start_date IS NULL OR created_at::DATE >= p_start_date)
      AND (p_end_date IS NULL OR created_at::DATE <= p_end_date);

    -- 计算总积分消耗
    SELECT COALESCE(SUM(points_cost), 0) INTO v_total_points
    FROM public.exchange_records
    WHERE (p_user_id IS NULL OR user_id = p_user_id)
      AND (p_start_date IS NULL OR created_at::DATE >= p_start_date)
      AND (p_end_date IS NULL OR created_at::DATE <= p_end_date)
      AND status IN ('completed', 'pending', 'processing');

    -- 计算今日订单数
    SELECT COUNT(*) INTO v_today_orders
    FROM public.exchange_records
    WHERE created_at::DATE = v_today_date
      AND (p_user_id IS NULL OR user_id = p_user_id);

    RETURN jsonb_build_object(
        'total', v_total,
        'pending', v_pending,
        'processing', v_processing,
        'completed', v_completed,
        'cancelled', v_cancelled,
        'refunded', v_refunded,
        'totalPoints', v_total_points,
        'todayOrders', v_today_orders
    );
END;
$$;

-- 添加函数注释
COMMENT ON FUNCTION public.get_exchange_stats IS '获取兑换订单统计数据，支持按用户和日期范围筛选';
