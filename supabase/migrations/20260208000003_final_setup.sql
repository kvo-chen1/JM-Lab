-- ==========================================================================
-- 积分系统最终设置
-- 包含所有需要手动执行的 SQL
-- ==========================================================================

-- 1. 首先确保表存在（如果不存在则创建）
CREATE TABLE IF NOT EXISTS public.user_points_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1,
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 2. 创建其他必要的表（如果不存在）
CREATE TABLE IF NOT EXISTS public.points_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('earned', 'spent', 'adjustment')),
  source VARCHAR(100) NOT NULL,
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('achievement', 'task', 'daily', 'consumption', 'exchange', 'system', 'invite', 'checkin')),
  description TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  related_id UUID,
  related_type VARCHAR(50),
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.points_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,
  period_type VARCHAR(50) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL,
  period_end DATE NOT NULL,
  limit_amount INTEGER NOT NULL,
  used_amount INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, source_type, period_type, period_start)
);

-- 3. 删除可能存在的旧函数（避免冲突）
-- 注意：set_updated_at 可能被其他触发器依赖，使用 CASCADE
DROP FUNCTION IF EXISTS public.update_user_points_balance(UUID, INTEGER, VARCHAR, VARCHAR, VARCHAR, TEXT, UUID, VARCHAR, JSONB) CASCADE;
DROP FUNCTION IF EXISTS public.get_user_points_stats(UUID) CASCADE;
DROP FUNCTION IF EXISTS public.check_points_limit(UUID, VARCHAR, INTEGER, VARCHAR) CASCADE;
DROP FUNCTION IF EXISTS public.initialize_user_points_balance() CASCADE;
-- set_updated_at 函数保留，因为其他表可能依赖它

-- 4. 创建或更新 set_updated_at 函数（如果已存在则跳过）
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'set_updated_at') THEN
    CREATE FUNCTION public.set_updated_at()
    RETURNS TRIGGER AS $func$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $func$ LANGUAGE plpgsql;
  END IF;
END
$$;

-- 5. 创建 initialize_user_points_balance 函数
CREATE OR REPLACE FUNCTION public.initialize_user_points_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_points_balance (user_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. 创建 update_user_points_balance 函数（简化版，不使用 SEARCH PATH）
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

-- 7. 创建 get_user_points_stats 函数
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

-- 8. 创建 check_points_limit 函数（修复版）
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
  v_period_start := DATE_TRUNC(p_period_type, NOW())::DATE;
  
  -- 根据周期类型计算结束日期
  IF p_period_type = 'daily' THEN
    v_period_end := (v_period_start + INTERVAL '1 day')::DATE - INTERVAL '1 day';
  ELSIF p_period_type = 'weekly' THEN
    v_period_end := (v_period_start + INTERVAL '1 week')::DATE - INTERVAL '1 day';
  ELSIF p_period_type = 'monthly' THEN
    v_period_end := (v_period_start + INTERVAL '1 month')::DATE - INTERVAL '1 day';
  ELSIF p_period_type = 'yearly' THEN
    v_period_end := (v_period_start + INTERVAL '1 year')::DATE - INTERVAL '1 day';
  ELSE
    v_period_end := v_period_start;
  END IF;

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

  -- 如果没有找到记录，使用默认值
  IF v_limit_amount IS NULL THEN
    v_limit_amount := 999999;
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

-- 9. 创建触发器
DROP TRIGGER IF EXISTS on_auth_user_created_points ON auth.users;
CREATE TRIGGER on_auth_user_created_points
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.initialize_user_points_balance();

-- 10. 为现有用户初始化积分余额
INSERT INTO public.user_points_balance (user_id, balance, total_earned, total_spent)
SELECT id, 0, 0, 0
FROM auth.users
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_points_balance WHERE user_id = auth.users.id
);

-- 11. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
