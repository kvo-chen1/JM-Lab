-- ==========================================================================
-- 修复剩余问题
-- ==========================================================================

-- 1. 检查并添加 points_records 表的 source_type 字段
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'points_records' AND column_name = 'source_type'
  ) THEN
    ALTER TABLE public.points_records ADD COLUMN source_type VARCHAR(50);
  END IF;
END
$$;

-- 2. 修复 get_user_points_stats 函数的日期比较问题
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
BEGIN
  RETURN QUERY
  SELECT 
    upb.balance::INTEGER,
    upb.total_earned::INTEGER,
    upb.total_spent::INTEGER,
    COALESCE((
      SELECT SUM(points)::INTEGER
      FROM public.points_records
      WHERE user_id = p_user_id
      AND points > 0
      AND created_at >= (CURRENT_DATE || ' 00:00:00+00')::TIMESTAMPTZ
    ), 0) as today_earned,
    COALESCE((
      SELECT SUM(points)::INTEGER
      FROM public.points_records
      WHERE user_id = p_user_id
      AND points > 0
      AND created_at >= DATE_TRUNC('week', NOW())
    ), 0) as week_earned,
    COALESCE((
      SELECT SUM(points)::INTEGER
      FROM public.points_records
      WHERE user_id = p_user_id
      AND points > 0
      AND created_at >= DATE_TRUNC('month', NOW())
    ), 0) as month_earned,
    COALESCE((
      SELECT jsonb_object_agg(source_type, cnt)
      FROM (
        SELECT source_type, COUNT(*) as cnt
        FROM public.points_records
        WHERE user_id = p_user_id
        GROUP BY source_type
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
