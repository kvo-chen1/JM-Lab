-- ==========================================================================
-- 积分系统 RPC 函数
-- 手动执行此文件创建必要的函数
-- ==========================================================================

-- 1. 设置 updated_at 触发器函数
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. 初始化用户积分余额（新用户注册时触发）
CREATE OR REPLACE FUNCTION public.initialize_user_points_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_points_balance (user_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 更新用户积分余额（带乐观锁）
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

-- 4. 获取用户积分统计
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
    upb.balance,
    upb.total_earned,
    upb.total_spent,
    COALESCE((
      SELECT SUM(points)
      FROM public.points_records
      WHERE user_id = p_user_id
      AND points > 0
      AND created_at >= DATE_TRUNC('day', NOW())
    ), 0)::INTEGER as today_earned,
    COALESCE((
      SELECT SUM(points)
      FROM public.points_records
      WHERE user_id = p_user_id
      AND points > 0
      AND created_at >= DATE_TRUNC('week', NOW())
    ), 0)::INTEGER as week_earned,
    COALESCE((
      SELECT SUM(points)
      FROM public.points_records
      WHERE user_id = p_user_id
      AND points > 0
      AND created_at >= DATE_TRUNC('month', NOW())
    ), 0)::INTEGER as month_earned,
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

-- 5. 检查积分限制
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
  -- 计算周期
  v_period_start := DATE_TRUNC(p_period_type, NOW())::DATE;
  v_period_end := (v_period_start + INTERVAL '1 ' || p_period_type)::DATE - INTERVAL '1 day';

  -- 获取或创建限制记录
  INSERT INTO public.points_limits (user_id, source_type, period_type, period_start, period_end, limit_amount)
  SELECT p_user_id, p_source_type, p_period_type, v_period_start, v_period_end, 
    CASE 
      WHEN p_source_type = 'daily' THEN 50
      WHEN p_source_type = 'task' THEN 300
      WHEN p_source_type = 'consumption' THEN 1000
      ELSE 999999
    END
  WHERE NOT EXISTS (
    SELECT 1 FROM public.points_limits
    WHERE user_id = p_user_id 
    AND source_type = p_source_type 
    AND period_type = p_period_type
    AND period_start = v_period_start
  );

  -- 获取限制信息
  SELECT limit_amount, used_amount
  INTO v_limit_amount, v_used_amount
  FROM public.points_limits
  WHERE user_id = p_user_id 
  AND source_type = p_source_type 
  AND period_type = p_period_type
  AND period_start = v_period_start;

  -- 计算剩余
  v_remaining := v_limit_amount - v_used_amount - p_points;

  RETURN QUERY SELECT 
    (v_remaining >= 0),
    GREATEST(v_remaining, 0),
    v_limit_amount,
    v_used_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 为新用户注册添加触发器
DROP TRIGGER IF EXISTS on_auth_user_created_points ON auth.users;
CREATE TRIGGER on_auth_user_created_points
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.initialize_user_points_balance();

-- ==========================================================================
-- 完成
-- ==========================================================================
