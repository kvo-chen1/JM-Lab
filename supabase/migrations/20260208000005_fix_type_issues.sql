-- ==========================================================================
-- 修复类型和外键问题
-- ==========================================================================

-- 1. 修复 get_user_points_stats 函数的日期比较问题
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
      AND created_at >= CURRENT_DATE::TIMESTAMPTZ
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

-- 2. 修复 check_points_limit 函数，移除外键依赖
DROP FUNCTION IF EXISTS public.check_points_limit(UUID, VARCHAR, INTEGER, VARCHAR) CASCADE;

CREATE OR REPLACE FUNCTION public.check_points_limit(
  p_user_id UUID,
  p_source_type VARCHAR(50),
  p_points INTEGER,
  p_period_type VARCHAR(50) DEFAULT 'daily'
)
RETURNS TABLE (
  can_add BOOLEAN,
  remaining INTEGER,
  limit_amount INTEGER,
  used_amount INTEGER
) AS $$
DECLARE
  v_period_start DATE;
  v_period_end DATE;
  v_limit_amount INTEGER;
  v_used_amount INTEGER;
  v_remaining INTEGER;
BEGIN
  -- 计算周期开始日期
  v_period_start := CASE 
    WHEN p_period_type = 'daily' THEN CURRENT_DATE
    WHEN p_period_type = 'weekly' THEN DATE_TRUNC('week', NOW())::DATE
    WHEN p_period_type = 'monthly' THEN DATE_TRUNC('month', NOW())::DATE
    WHEN p_period_type = 'yearly' THEN DATE_TRUNC('year', NOW())::DATE
    ELSE CURRENT_DATE
  END;
  
  -- 根据周期类型计算结束日期
  v_period_end := CASE 
    WHEN p_period_type = 'daily' THEN v_period_start + 1
    WHEN p_period_type = 'weekly' THEN v_period_start + 7
    WHEN p_period_type = 'monthly' THEN v_period_start + 30
    WHEN p_period_type = 'yearly' THEN v_period_start + 365
    ELSE v_period_start + 1
  END;

  -- 获取限制信息（如果不存在则返回默认值）
  SELECT COALESCE(limit_amount, 
    CASE 
      WHEN p_source_type = 'daily' THEN 50
      WHEN p_source_type = 'task' THEN 300
      WHEN p_source_type = 'consumption' THEN 1000
      ELSE 999999
    END),
    COALESCE(used_amount, 0)
  INTO v_limit_amount, v_used_amount
  FROM public.points_limits
  WHERE user_id = p_user_id 
  AND source_type = p_source_type 
  AND period_type = p_period_type
  AND period_start = v_period_start;

  -- 如果没有找到记录，使用默认值
  IF v_limit_amount IS NULL THEN
    v_limit_amount := CASE 
      WHEN p_source_type = 'daily' THEN 50
      WHEN p_source_type = 'task' THEN 300
      WHEN p_source_type = 'consumption' THEN 1000
      ELSE 999999
    END;
    v_used_amount := 0;
  END IF;

  -- 计算剩余
  v_remaining := v_limit_amount - v_used_amount - p_points;

  RETURN QUERY SELECT 
    (v_remaining >= 0),
    GREATEST(v_remaining, 0),
    v_limit_amount,
    v_used_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 修改 points_limits 表，移除外键约束（如果存在）
DO $$
BEGIN
  -- 检查并移除外键约束
  IF EXISTS (
    SELECT 1 FROM information_schema.table_constraints 
    WHERE constraint_name = 'points_limits_user_id_fkey' 
    AND table_name = 'points_limits'
  ) THEN
    ALTER TABLE public.points_limits DROP CONSTRAINT points_limits_user_id_fkey;
  END IF;
EXCEPTION WHEN OTHERS THEN
  NULL;
END
$$;

-- 4. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
