-- ==========================================================================
-- 最终修复
-- ==========================================================================

-- 1. 修复 points_records 表的 created_at 默认值
ALTER TABLE public.points_records 
ALTER COLUMN created_at SET DEFAULT NOW();

-- 2. 修复 get_user_points_stats 函数的日期比较问题（使用显式类型转换）
DROP FUNCTION IF EXISTS public.get_user_points_stats(UUID) CASCADE;

CREATE OR REPLACE FUNCTION public.get_user_points_stats(p_user_id UUID)
RETURNS TABLE (
  current_balance INTEGER,
  total_earned INTEGER,
  total_spent INTEGER,
  today_earned INTEGER,
  week_earned INTEGER,
  month_earned INTEGER,
  source_stats JSONB
) AS $$
DECLARE
  v_today_start TIMESTAMPTZ;
  v_week_start TIMESTAMPTZ;
  v_month_start TIMESTAMPTZ;
BEGIN
  -- 计算时间范围（确保类型一致）
  v_today_start := DATE_TRUNC('day', NOW());
  v_week_start := DATE_TRUNC('week', NOW());
  v_month_start := DATE_TRUNC('month', NOW());

  RETURN QUERY
  SELECT 
    upb.balance::INTEGER,
    upb.total_earned::INTEGER,
    upb.total_spent::INTEGER,
    COALESCE((
      SELECT SUM(pr.points)::INTEGER
      FROM public.points_records pr
      WHERE pr.user_id = p_user_id
      AND pr.points > 0
      AND pr.created_at >= v_today_start
    ), 0) as today_earned,
    COALESCE((
      SELECT SUM(pr.points)::INTEGER
      FROM public.points_records pr
      WHERE pr.user_id = p_user_id
      AND pr.points > 0
      AND pr.created_at >= v_week_start
    ), 0) as week_earned,
    COALESCE((
      SELECT SUM(pr.points)::INTEGER
      FROM public.points_records pr
      WHERE pr.user_id = p_user_id
      AND pr.points > 0
      AND pr.created_at >= v_month_start
    ), 0) as month_earned,
    COALESCE((
      SELECT jsonb_object_agg(pr.source_type, cnt)
      FROM (
        SELECT pr.source_type, COUNT(*) as cnt
        FROM public.points_records pr
        WHERE pr.user_id = p_user_id
        GROUP BY pr.source_type
      ) sub
    ), '{}'::jsonb) as source_stats
  FROM public.user_points_balance upb
  WHERE upb.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
