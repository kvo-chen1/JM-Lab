-- ==========================================================================
-- 创建缺失的函数
-- ==========================================================================

-- 1. 创建 update_user_points_balance 函数
CREATE OR REPLACE FUNCTION public.update_user_points_balance(
  p_user_id UUID,
  p_points INTEGER,
  p_type VARCHAR(50),
  p_source VARCHAR(100),
  p_source_type VARCHAR(50),
  p_description TEXT,
  p_related_id UUID DEFAULT NULL,
  p_related_type VARCHAR(50) DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance INTEGER,
  record_id UUID,
  error_message TEXT
) AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_version INTEGER;
  v_record_id UUID;
  v_total_earned INTEGER;
  v_total_spent INTEGER;
BEGIN
  -- 获取当前余额和版本号
  SELECT balance, version, total_earned, total_spent
  INTO v_current_balance, v_version, v_total_earned, v_total_spent
  FROM public.user_points_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 检查用户是否存在
  IF v_current_balance IS NULL THEN
    -- 初始化用户积分余额
    INSERT INTO public.user_points_balance (user_id, balance, total_earned, total_spent)
    VALUES (p_user_id, 0, 0, 0)
    RETURNING balance, version, total_earned, total_spent
    INTO v_current_balance, v_version, v_total_earned, v_total_spent;
  END IF;

  -- 计算新余额
  v_new_balance := v_current_balance + p_points;

  -- 检查余额是否足够（消耗积分时）
  IF p_points < 0 AND v_new_balance < 0 THEN
    RETURN QUERY SELECT false, v_current_balance, NULL::UUID, '积分余额不足'::TEXT;
    RETURN;
  END IF;

  -- 更新余额（带乐观锁）
  UPDATE public.user_points_balance
  SET 
    balance = v_new_balance,
    total_earned = CASE WHEN p_points > 0 THEN v_total_earned + p_points ELSE v_total_earned END,
    total_spent = CASE WHEN p_points < 0 THEN v_total_spent + ABS(p_points) ELSE v_total_spent END,
    version = version + 1,
    last_updated_at = NOW()
  WHERE user_id = p_user_id AND version = v_version;

  -- 检查更新是否成功
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, v_current_balance, NULL::UUID, '并发冲突，请重试'::TEXT;
    RETURN;
  END IF;

  -- 创建积分记录
  INSERT INTO public.points_records (
    user_id, points, type, source, source_type, description,
    balance_after, related_id, related_type, metadata
  ) VALUES (
    p_user_id, p_points, p_type, p_source, p_source_type, p_description,
    v_new_balance, p_related_id, p_related_type, p_metadata
  )
  RETURNING id INTO v_record_id;

  RETURN QUERY SELECT true, v_new_balance, v_record_id, NULL::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 创建 check_points_limit 函数
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
  v_limit INTEGER;
  v_used INTEGER;
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

  -- 获取限制信息（如果不存在则返回默认值）
  SELECT COALESCE(pl.limit_amount, 
    CASE 
      WHEN p_source_type = 'daily' THEN 50
      WHEN p_source_type = 'task' THEN 300
      WHEN p_source_type = 'consumption' THEN 1000
      ELSE 999999
    END),
    COALESCE(pl.used_amount, 0)
  INTO v_limit, v_used
  FROM public.points_limits pl
  WHERE pl.user_id = p_user_id 
  AND pl.source_type = p_source_type 
  AND pl.period_type = p_period_type
  AND pl.period_start = v_period_start;

  -- 如果没有找到记录，使用默认值
  IF v_limit IS NULL THEN
    v_limit := CASE 
      WHEN p_source_type = 'daily' THEN 50
      WHEN p_source_type = 'task' THEN 300
      WHEN p_source_type = 'consumption' THEN 1000
      ELSE 999999
    END;
    v_used := 0;
  END IF;

  -- 计算剩余
  v_remaining := v_limit - v_used - p_points;

  RETURN QUERY SELECT 
    (v_remaining >= 0),
    GREATEST(v_remaining, 0),
    v_limit,
    v_used;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
