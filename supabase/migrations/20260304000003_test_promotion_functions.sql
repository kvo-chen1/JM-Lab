-- ==========================================================================
-- 测试推广函数 - 验证功能是否正常
-- ==========================================================================

-- 测试函数：手动触发曝光记录（用于调试）
CREATE OR REPLACE FUNCTION test_record_promotion_view(
  p_promoted_work_id TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  before_views INTEGER,
  after_views INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_work_id UUID;
  v_before_views INTEGER;
  v_after_views INTEGER;
  v_result BOOLEAN;
BEGIN
  -- 尝试将输入转换为 UUID
  BEGIN
    v_work_id := p_promoted_work_id::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT FALSE, '无效的UUID格式: ' || p_promoted_work_id, 0, 0;
      RETURN;
  END;

  -- 获取当前曝光数
  SELECT actual_views INTO v_before_views
  FROM promoted_works
  WHERE id = v_work_id;

  IF v_before_views IS NULL THEN
    RETURN QUERY SELECT FALSE, '推广作品不存在: ' || p_promoted_work_id, 0, 0;
    RETURN;
  END IF;

  -- 调用曝光记录函数
  SELECT record_promotion_view(v_work_id, NULL) INTO v_result;

  -- 获取更新后的曝光数
  SELECT actual_views INTO v_after_views
  FROM promoted_works
  WHERE id = v_work_id;

  IF v_result THEN
    RETURN QUERY SELECT TRUE, '曝光记录成功', v_before_views, v_after_views;
  ELSE
    RETURN QUERY SELECT FALSE, '曝光记录失败（函数返回FALSE）', v_before_views, v_after_views;
  END IF;
END;
$$;

-- 测试函数：手动触发点击记录（用于调试）
CREATE OR REPLACE FUNCTION test_record_promotion_click(
  p_promoted_work_id TEXT
)
RETURNS TABLE(
  success BOOLEAN,
  message TEXT,
  before_clicks INTEGER,
  after_clicks INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_work_id UUID;
  v_before_clicks INTEGER;
  v_after_clicks INTEGER;
  v_result BOOLEAN;
BEGIN
  -- 尝试将输入转换为 UUID
  BEGIN
    v_work_id := p_promoted_work_id::UUID;
  EXCEPTION
    WHEN OTHERS THEN
      RETURN QUERY SELECT FALSE, '无效的UUID格式: ' || p_promoted_work_id, 0, 0;
      RETURN;
  END;

  -- 获取当前点击数
  SELECT actual_clicks INTO v_before_clicks
  FROM promoted_works
  WHERE id = v_work_id;

  IF v_before_clicks IS NULL THEN
    RETURN QUERY SELECT FALSE, '推广作品不存在: ' || p_promoted_work_id, 0, 0;
    RETURN;
  END IF;

  -- 调用点击记录函数
  SELECT record_promotion_click(v_work_id, NULL) INTO v_result;

  -- 获取更新后的点击数
  SELECT actual_clicks INTO v_after_clicks
  FROM promoted_works
  WHERE id = v_work_id;

  IF v_result THEN
    RETURN QUERY SELECT TRUE, '点击记录成功', v_before_clicks, v_after_clicks;
  ELSE
    RETURN QUERY SELECT FALSE, '点击记录失败（函数返回FALSE）', v_before_clicks, v_after_clicks;
  END IF;
END;
$$;

-- 函数：获取所有活跃推广（用于前端调试）
CREATE OR REPLACE FUNCTION get_active_promotions_for_debug()
RETURNS TABLE(
  promoted_work_id TEXT,
  work_id TEXT,
  title TEXT,
  status TEXT,
  is_active BOOLEAN,
  actual_views INTEGER,
  actual_clicks INTEGER,
  end_time TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    pw.id::TEXT as promoted_work_id,
    pw.work_id::TEXT as work_id,
    po.work_title as title,
    pw.status,
    (pw.status = 'active' AND pw.end_time > NOW()) as is_active,
    pw.actual_views,
    pw.actual_clicks,
    pw.end_time
  FROM promoted_works pw
  JOIN promotion_orders po ON pw.order_id = po.id
  WHERE pw.status = 'active'
  ORDER BY pw.created_at DESC
  LIMIT 10;
END;
$$;

-- 添加注释
COMMENT ON FUNCTION test_record_promotion_view IS '测试曝光记录功能';
COMMENT ON FUNCTION test_record_promotion_click IS '测试点击记录功能';
COMMENT ON FUNCTION get_active_promotions_for_debug IS '获取活跃推广列表（调试用）';

-- 显示当前活跃推广
-- SELECT * FROM get_active_promotions_for_debug();

NOTIFY pgrst, 'reload schema';
