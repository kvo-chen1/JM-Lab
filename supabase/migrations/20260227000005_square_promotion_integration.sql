-- 广场推广集成 - 将推广作品展示到广场

-- 函数：获取广场作品列表（包含推广作品）
CREATE OR REPLACE FUNCTION get_square_works_with_promotion(
  p_limit INTEGER DEFAULT 20,
  p_offset INTEGER DEFAULT 0,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE(
  id UUID,
  work_type TEXT,  -- 'normal' 或 'promoted'
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
  -- 计算需要插入的推广作品数量（约20%）
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
  
  -- 返回推广作品
  RETURN QUERY
  SELECT 
    pw.work_id as id,
    'promoted'::TEXT as work_type,
    po.work_title as title,
    COALESCE(po.work_thumbnail, '') as thumbnail,
    ''::TEXT as video_url,  -- 推广作品可能不需要视频
    pw.user_id as creator_id,
    u.username as creator_username,
    u.avatar_url as creator_avatar,
    COALESCE(pw.actual_views, 0) as views,
    0 as likes,  -- 推广作品不显示真实点赞
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
    -- 如果指定了用户ID，排除该用户的推广（不给自己推）
    AND (p_user_id IS NULL OR pw.user_id != p_user_id)
  ORDER BY pw.promotion_weight DESC, pw.priority_score DESC
  LIMIT v_promoted_count;
END;
$$;

-- 函数：记录推广曝光（用户真正看到时调用）
CREATE OR REPLACE FUNCTION record_promotion_view(
  p_promoted_work_id UUID,
  p_viewer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 更新推广作品的曝光统计
  UPDATE promoted_works
  SET 
    actual_views = actual_views + 1,
    daily_views = daily_views + 1,
    updated_at = NOW()
  WHERE id = p_promoted_work_id
    AND status = 'active';
  
  -- 记录曝光日志（用于分析）
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
    RETURN FALSE;
END;
$$;

-- 函数：记录推广点击（用户点击时调用）
CREATE OR REPLACE FUNCTION record_promotion_click(
  p_promoted_work_id UUID,
  p_viewer_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- 更新推广作品的点击统计
  UPDATE promoted_works
  SET 
    actual_clicks = actual_clicks + 1,
    daily_clicks = daily_clicks + 1,
    updated_at = NOW()
  WHERE id = p_promoted_work_id
    AND status = 'active';
  
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
    RETURN FALSE;
END;
$$;

-- 创建曝光日志表
CREATE TABLE IF NOT EXISTS promotion_view_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoted_work_id UUID NOT NULL REFERENCES promoted_works(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  viewed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  view_type TEXT NOT NULL DEFAULT 'square',  -- square, feed, search, etc.
  ip_address TEXT,
  user_agent TEXT
);

-- 创建点击日志表
CREATE TABLE IF NOT EXISTS promotion_click_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  promoted_work_id UUID NOT NULL REFERENCES promoted_works(id) ON DELETE CASCADE,
  viewer_id UUID REFERENCES users(id) ON DELETE SET NULL,
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  click_type TEXT NOT NULL DEFAULT 'square',
  ip_address TEXT,
  user_agent TEXT
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_promotion_view_logs_work_id ON promotion_view_logs(promoted_work_id);
CREATE INDEX IF NOT EXISTS idx_promotion_view_logs_viewed_at ON promotion_view_logs(viewed_at);
CREATE INDEX IF NOT EXISTS idx_promotion_click_logs_work_id ON promotion_click_logs(promoted_work_id);
CREATE INDEX IF NOT EXISTS idx_promotion_click_logs_clicked_at ON promotion_click_logs(clicked_at);

-- 添加RLS策略
ALTER TABLE promotion_view_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE promotion_click_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow all view logs insert" ON promotion_view_logs
  FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "Allow admin view logs select" ON promotion_view_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Allow all click logs insert" ON promotion_click_logs
  FOR INSERT TO authenticated, anon WITH CHECK (true);

CREATE POLICY "Allow admin click logs select" ON promotion_click_logs
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin')
  );

-- 添加注释
COMMENT ON FUNCTION get_square_works_with_promotion IS '获取广场作品列表，包含推广作品';
COMMENT ON FUNCTION record_promotion_view IS '记录推广作品被用户看到（真实曝光）';
COMMENT ON FUNCTION record_promotion_click IS '记录用户点击推广作品';
