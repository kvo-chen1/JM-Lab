-- ==========================================================================
-- 修复推广系统 - 确保真实流量统计可用
-- ==========================================================================

-- ==========================================================================
-- 第一部分：修复获取广场作品函数（确保推广作品正确混合）
-- ==========================================================================

CREATE OR REPLACE FUNCTION get_square_works_with_promotion(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  work_type TEXT,
  title TEXT,
  thumbnail TEXT,
  video_url TEXT,
  creator_id UUID,
  creator_username TEXT,
  creator_avatar TEXT,
  views INTEGER,
  likes INTEGER,
  comments INTEGER,
  created_at TIMESTAMPTZ,
  is_promoted BOOLEAN,
  promoted_work_id UUID,
  package_type TEXT,
  promotion_weight DECIMAL(3,2)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_promoted_count INTEGER;
  v_normal_limit INTEGER;
BEGIN
  -- 计算需要插入的推广作品数量（约20%，至少1个）
  v_promoted_count := GREATEST(1, ROUND(p_limit * 0.2));
  v_normal_limit := p_limit - v_promoted_count;

  -- 返回正常作品
  RETURN QUERY
  SELECT
    w.id,
    'normal'::TEXT as work_type,
    w.title,
    COALESCE(w.thumbnail, w.cover_url, '') as thumbnail,
    COALESCE(w.video_url, '') as video_url,
    w.creator_id,
    u.username as creator_username,
    u.avatar_url as creator_avatar,
    COALESCE(w.views, 0) as views,
    COALESCE(w.likes, 0) as likes,
    COALESCE(w.comments, 0) as comments,
    w.created_at,
    FALSE as is_promoted,
    NULL::UUID as promoted_work_id,
    NULL::TEXT as package_type,
    NULL::DECIMAL as promotion_weight
  FROM works w
  LEFT JOIN users u ON w.creator_id = u.id
  WHERE w.status = 'published'
    AND w.deleted_at IS NULL
  ORDER BY w.created_at DESC
  LIMIT v_normal_limit
  OFFSET p_offset;

  -- 返回推广作品（确保有活跃的推广）
  RETURN QUERY
  SELECT
    pw.work_id::UUID as id,
    'promoted'::TEXT as work_type,
    po.work_title as title,
    COALESCE(po.work_thumbnail, '') as thumbnail,
    ''::TEXT as video_url,
    pw.user_id as creator_id,
    u.username as creator_username,
    u.avatar_url as creator_avatar,
    COALESCE(pw.actual_views, 0) as views,
    0 as likes,
    0 as comments,
    pw.created_at,
    TRUE as is_promoted,
    pw.id as promoted_work_id,
    pw.package_type::TEXT,
    pw.promotion_weight
  FROM promoted_works pw
  JOIN promotion_orders po ON pw.order_id = po.id
  LEFT JOIN users u ON pw.user_id = u.id
  WHERE pw.status = 'active'
    AND pw.end_time > NOW()
    AND (p_user_id IS NULL OR pw.user_id != p_user_id)
  ORDER BY pw.promotion_weight DESC, pw.priority_score DESC
  LIMIT v_promoted_count;
END;
$$;

-- ==========================================================================
-- 第二部分：修复记录曝光函数（确保真实记录）
-- ==========================================================================

CREATE OR REPLACE FUNCTION record_promotion_view(
  p_promoted_work_id UUID,
  p_viewer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查推广作品是否存在且活跃
  IF NOT EXISTS (
    SELECT 1 FROM promoted_works
    WHERE id = p_promoted_work_id
      AND status = 'active'
      AND end_time > NOW()
  ) THEN
    RETURN FALSE;
  END IF;

  -- 更新推广作品的曝光统计
  UPDATE promoted_works
  SET
    actual_views = COALESCE(actual_views, 0) + 1,
    daily_views = COALESCE(daily_views, 0) + 1,
    updated_at = NOW()
  WHERE id = p_promoted_work_id;

  -- 更新订单的实际曝光
  UPDATE promotion_orders
  SET actual_views = COALESCE(actual_views, 0) + 1
  WHERE id = (
    SELECT order_id FROM promoted_works WHERE id = p_promoted_work_id
  );

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

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '记录推广曝光失败: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- ==========================================================================
-- 第三部分：修复记录点击函数（确保真实记录）
-- ==========================================================================

CREATE OR REPLACE FUNCTION record_promotion_click(
  p_promoted_work_id UUID,
  p_viewer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 检查推广作品是否存在且活跃
  IF NOT EXISTS (
    SELECT 1 FROM promoted_works
    WHERE id = p_promoted_work_id
      AND status = 'active'
      AND end_time > NOW()
  ) THEN
    RETURN FALSE;
  END IF;

  -- 更新推广作品的点击统计
  UPDATE promoted_works
  SET
    actual_clicks = COALESCE(actual_clicks, 0) + 1,
    daily_clicks = COALESCE(daily_clicks, 0) + 1,
    updated_at = NOW()
  WHERE id = p_promoted_work_id;

  -- 更新订单的实际点击
  UPDATE promotion_orders
  SET actual_clicks = COALESCE(actual_clicks, 0) + 1
  WHERE id = (
    SELECT order_id FROM promoted_works WHERE id = p_promoted_work_id
  );

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

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '记录推广点击失败: %', SQLERRM;
    RETURN FALSE;
END;
$$;

-- ==========================================================================
-- 第四部分：创建测试数据生成函数（用于测试）
-- ==========================================================================

CREATE OR REPLACE FUNCTION create_test_promotion_data()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_work_id TEXT;
  v_order_id UUID;
  v_promoted_work_id UUID;
BEGIN
  -- 获取第一个用户作为测试用户
  SELECT id INTO v_user_id FROM users LIMIT 1;

  IF v_user_id IS NULL THEN
    RETURN '错误: 没有找到用户，请先创建用户';
  END IF;

  -- 获取第一个作品作为测试作品
  SELECT id::TEXT INTO v_work_id FROM works WHERE status = 'published' LIMIT 1;

  IF v_work_id IS NULL THEN
    RETURN '错误: 没有找到已发布作品，请先创建作品';
  END IF;

  -- 检查是否已有活跃推广
  SELECT id INTO v_promoted_work_id
  FROM promoted_works
  WHERE work_id = v_work_id AND status = 'active';

  IF v_promoted_work_id IS NOT NULL THEN
    RETURN '已存在活跃推广: ' || v_promoted_work_id::TEXT;
  END IF;

  -- 创建推广订单
  INSERT INTO promotion_orders (
    user_id,
    order_no,
    work_id,
    work_title,
    work_thumbnail,
    package_type,
    target_type,
    metric_type,
    original_price,
    discount_amount,
    final_price,
    status,
    payment_time,
    start_at,
    end_at
  ) VALUES (
    v_user_id,
    'TEST' || TO_CHAR(NOW(), 'YYYYMMDDHH24MISS'),
    v_work_id,
    '测试推广作品',
    '',
    'standard',
    'account',
    'views',
    98,
    0,
    98,
    'active',
    NOW(),
    NOW(),
    NOW() + INTERVAL '24 hours'
  )
  RETURNING id INTO v_order_id;

  -- 创建推广作品记录
  INSERT INTO promoted_works (
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
    status,
    actual_views,
    actual_clicks
  ) VALUES (
    v_order_id,
    v_work_id,
    v_user_id,
    'standard',
    'account',
    'views',
    NOW(),
    NOW() + INTERVAL '24 hours',
    1000,
    50,
    1.0,
    100,
    'active',
    0,
    0
  )
  RETURNING id INTO v_promoted_work_id;

  RETURN '成功创建测试推广数据: ' || v_promoted_work_id::TEXT;
END;
$$;

-- ==========================================================================
-- 第五部分：添加注释
-- ==========================================================================

COMMENT ON FUNCTION get_square_works_with_promotion IS '获取广场作品列表，包含推广作品（约20%混合比例）';
COMMENT ON FUNCTION record_promotion_view IS '记录推广作品被用户看到（真实曝光统计）';
COMMENT ON FUNCTION record_promotion_click IS '记录用户点击推广作品（真实点击统计）';
COMMENT ON FUNCTION create_test_promotion_data IS '创建测试推广数据，用于验证功能';

-- ==========================================================================
-- 第六部分：执行测试数据创建（可选，取消注释以执行）
-- ==========================================================================

-- SELECT create_test_promotion_data();

NOTIFY pgrst, 'reload schema';
