-- ==========================================================================
-- 调试推广函数 - 添加详细日志
-- ==========================================================================

-- 函数：记录推广曝光（带调试日志）
CREATE OR REPLACE FUNCTION record_promotion_view(
  p_promoted_work_id UUID,
  p_viewer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_work_exists BOOLEAN;
  v_work_status TEXT;
  v_end_time TIMESTAMPTZ;
BEGIN
  -- 调试日志
  RAISE NOTICE 'record_promotion_view called: work_id=%, viewer_id=%', p_promoted_work_id, p_viewer_id;

  -- 检查推广作品是否存在
  SELECT EXISTS(SELECT 1 FROM promoted_works WHERE id = p_promoted_work_id),
         status,
         end_time
  INTO v_work_exists, v_work_status, v_end_time
  FROM promoted_works
  WHERE id = p_promoted_work_id;

  RAISE NOTICE 'Work exists: %, Status: %, End time: %', v_work_exists, v_work_status, v_end_time;

  -- 检查推广作品是否存在且活跃
  IF NOT EXISTS (
    SELECT 1 FROM promoted_works
    WHERE id = p_promoted_work_id
      AND status = 'active'
      AND end_time > NOW()
  ) THEN
    RAISE NOTICE 'Work not found or not active: id=%', p_promoted_work_id;
    RETURN FALSE;
  END IF;

  -- 更新推广作品的曝光统计
  UPDATE promoted_works
  SET
    actual_views = COALESCE(actual_views, 0) + 1,
    daily_views = COALESCE(daily_views, 0) + 1,
    updated_at = NOW()
  WHERE id = p_promoted_work_id;

  RAISE NOTICE 'Updated promoted_works actual_views for id=%', p_promoted_work_id;

  -- 更新订单的实际曝光
  UPDATE promotion_orders
  SET actual_views = COALESCE(actual_views, 0) + 1
  WHERE id = (
    SELECT order_id FROM promoted_works WHERE id = p_promoted_work_id
  );

  RAISE NOTICE 'Updated promotion_orders actual_views';

  -- 记录曝光日志
  INSERT INTO promotion_view_logs (
    promoted_work_id,
    viewer_id,
    viewed_at,
    view_type
  ) VALUES (
    p_promoted_work_id,
    p_viewer_id,
    NOW(),
    'square'
  );

  RAISE NOTICE 'Inserted promotion_view_logs record';

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '记录推广曝光失败: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$$;

-- 函数：记录推广点击（带调试日志）
CREATE OR REPLACE FUNCTION record_promotion_click(
  p_promoted_work_id UUID,
  p_viewer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- 调试日志
  RAISE NOTICE 'record_promotion_click called: work_id=%, viewer_id=%', p_promoted_work_id, p_viewer_id;

  -- 检查推广作品是否存在且活跃
  IF NOT EXISTS (
    SELECT 1 FROM promoted_works
    WHERE id = p_promoted_work_id
      AND status = 'active'
      AND end_time > NOW()
  ) THEN
    RAISE NOTICE 'Work not found or not active for click: id=%', p_promoted_work_id;
    RETURN FALSE;
  END IF;

  -- 获取订单ID
  SELECT order_id INTO v_order_id FROM promoted_works WHERE id = p_promoted_work_id;

  -- 更新推广作品的点击统计
  UPDATE promoted_works
  SET
    actual_clicks = COALESCE(actual_clicks, 0) + 1,
    daily_clicks = COALESCE(daily_clicks, 0) + 1,
    updated_at = NOW()
  WHERE id = p_promoted_work_id;

  RAISE NOTICE 'Updated promoted_works actual_clicks for id=%', p_promoted_work_id;

  -- 更新订单的实际点击
  UPDATE promotion_orders
  SET actual_clicks = COALESCE(actual_clicks, 0) + 1
  WHERE id = v_order_id;

  RAISE NOTICE 'Updated promotion_orders actual_clicks for order_id=%', v_order_id;

  -- 记录点击日志
  INSERT INTO promotion_click_logs (
    promoted_work_id,
    viewer_id,
    clicked_at,
    click_type
  ) VALUES (
    p_promoted_work_id,
    p_viewer_id,
    NOW(),
    'square'
  );

  RAISE NOTICE 'Inserted promotion_click_logs record';

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '记录推广点击失败: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$$;

-- 函数：获取推广统计数据（用于验证）
CREATE OR REPLACE FUNCTION get_promotion_debug_info(p_promoted_work_id UUID)
RETURNS TABLE(
  work_id UUID,
  status TEXT,
  end_time TIMESTAMPTZ,
  is_active BOOLEAN,
  actual_views INTEGER,
  actual_clicks INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pw.id as work_id,
    pw.status,
    pw.end_time,
    (pw.status = 'active' AND pw.end_time > NOW()) as is_active,
    pw.actual_views,
    pw.actual_clicks
  FROM promoted_works pw
  WHERE pw.id = p_promoted_work_id;
END;
$$;

-- 添加注释
COMMENT ON FUNCTION record_promotion_view IS '记录推广作品曝光（带调试日志）';
COMMENT ON FUNCTION record_promotion_click IS '记录推广作品点击（带调试日志）';
COMMENT ON FUNCTION get_promotion_debug_info IS '获取推广作品调试信息';

NOTIFY pgrst, 'reload schema';
