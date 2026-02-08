-- ==========================================================================
-- 积分系统数据库 Schema
-- 支持Supabase实时记录每个用户的积分情况
-- ==========================================================================

-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==========================================================================
-- 1. 用户积分余额表 - 存储每个用户的当前积分余额
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.user_points_balance (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
  total_earned INTEGER NOT NULL DEFAULT 0,
  total_spent INTEGER NOT NULL DEFAULT 0,
  version INTEGER NOT NULL DEFAULT 1, -- 乐观锁版本号
  last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_points_balance_user_id ON public.user_points_balance(user_id);
CREATE INDEX IF NOT EXISTS idx_user_points_balance_balance ON public.user_points_balance(balance);

-- 触发器：自动更新 updated_at
DROP TRIGGER IF EXISTS set_user_points_balance_updated_at ON public.user_points_balance;
CREATE TRIGGER set_user_points_balance_updated_at
BEFORE UPDATE ON public.user_points_balance
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- ==========================================================================
-- 2. 积分记录表 - 记录每笔积分变动
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.points_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL, -- 正数表示获得，负数表示消耗
  type VARCHAR(50) NOT NULL CHECK (type IN ('earned', 'spent', 'adjustment')),
  source VARCHAR(100) NOT NULL, -- 来源：签到、任务、邀请、消费、兑换等
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('achievement', 'task', 'daily', 'consumption', 'exchange', 'system', 'invite', 'checkin')),
  description TEXT NOT NULL,
  balance_after INTEGER NOT NULL, -- 变动后的余额
  related_id UUID, -- 关联记录ID（如订单ID、任务ID等）
  related_type VARCHAR(50), -- 关联记录类型
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, -- 额外信息
  ip_address INET, -- 操作IP地址
  user_agent TEXT, -- 用户代理
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  expires_at TIMESTAMPTZ -- 积分过期时间（如果有）
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_points_records_user_id ON public.points_records(user_id);
CREATE INDEX IF NOT EXISTS idx_points_records_type ON public.points_records(type);
CREATE INDEX IF NOT EXISTS idx_points_records_source_type ON public.points_records(source_type);
CREATE INDEX IF NOT EXISTS idx_points_records_created_at ON public.points_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_points_records_related_id ON public.points_records(related_id);

-- 创建部分索引：未过期积分
CREATE INDEX IF NOT EXISTS idx_points_records_not_expired 
ON public.points_records(user_id, created_at) 
WHERE expires_at IS NULL OR expires_at > NOW();

-- ==========================================================================
-- 3. 积分规则表 - 配置积分获取和消耗规则
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.points_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL UNIQUE,
  description TEXT,
  rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('earn', 'spend', 'limit')),
  source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('achievement', 'task', 'daily', 'consumption', 'exchange', 'system', 'invite', 'checkin')),
  points INTEGER NOT NULL, -- 积分数量（正数表示获得，负数表示消耗）
  min_points INTEGER, -- 最小积分
  max_points INTEGER, -- 最大积分
  ratio DECIMAL(10, 4), -- 比例（如消费返积分比例）
  daily_limit INTEGER, -- 每日限制
  weekly_limit INTEGER, -- 每周限制
  monthly_limit INTEGER, -- 每月限制
  yearly_limit INTEGER, -- 每年限制
  is_active BOOLEAN NOT NULL DEFAULT true,
  priority INTEGER NOT NULL DEFAULT 0, -- 规则优先级
  conditions JSONB NOT NULL DEFAULT '{}'::jsonb, -- 规则条件
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_points_rules_rule_type ON public.points_rules(rule_type);
CREATE INDEX IF NOT EXISTS idx_points_rules_source_type ON public.points_rules(source_type);
CREATE INDEX IF NOT EXISTS idx_points_rules_is_active ON public.points_rules(is_active);

-- 触发器：自动更新 updated_at
DROP TRIGGER IF EXISTS set_points_rules_updated_at ON public.points_rules;
CREATE TRIGGER set_points_rules_updated_at
BEFORE UPDATE ON public.points_rules
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- ==========================================================================
-- 4. 签到记录表 - 记录用户每日签到
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.checkin_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  checkin_date DATE NOT NULL, -- 签到日期
  consecutive_days INTEGER NOT NULL DEFAULT 1, -- 连续签到天数
  points_earned INTEGER NOT NULL DEFAULT 0, -- 获得积分
  is_bonus BOOLEAN NOT NULL DEFAULT false, -- 是否额外奖励
  bonus_points INTEGER NOT NULL DEFAULT 0, -- 额外奖励积分
  is_retroactive BOOLEAN NOT NULL DEFAULT false, -- 是否补签
  retroactive_cost INTEGER NOT NULL DEFAULT 0, -- 补签消耗积分
  ip_address INET,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, checkin_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_checkin_records_user_id ON public.checkin_records(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_checkin_date ON public.checkin_records(checkin_date DESC);
CREATE INDEX IF NOT EXISTS idx_checkin_records_user_date ON public.checkin_records(user_id, checkin_date DESC);

-- ==========================================================================
-- 5. 任务记录表 - 记录用户任务完成情况
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.task_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id VARCHAR(100) NOT NULL, -- 任务ID
  task_type VARCHAR(50) NOT NULL CHECK (task_type IN ('daily', 'weekly', 'monthly', 'event', 'achievement')),
  task_title VARCHAR(255) NOT NULL,
  progress INTEGER NOT NULL DEFAULT 0, -- 当前进度
  target INTEGER NOT NULL, -- 目标数量
  status VARCHAR(50) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
  points_reward INTEGER NOT NULL DEFAULT 0, -- 任务奖励积分
  completed_at TIMESTAMPTZ, -- 完成时间
  expires_at TIMESTAMPTZ, -- 过期时间
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, task_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_task_records_user_id ON public.task_records(user_id);
CREATE INDEX IF NOT EXISTS idx_task_records_task_type ON public.task_records(task_type);
CREATE INDEX IF NOT EXISTS idx_task_records_status ON public.task_records(status);
CREATE INDEX IF NOT EXISTS idx_task_records_completed_at ON public.task_records(completed_at DESC);

-- 触发器：自动更新 updated_at
DROP TRIGGER IF EXISTS set_task_records_updated_at ON public.task_records;
CREATE TRIGGER set_task_records_updated_at
BEFORE UPDATE ON public.task_records
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- ==========================================================================
-- 6. 邀请记录表 - 记录用户邀请好友情况
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.invite_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE, -- 邀请人
  invitee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- 被邀请人
  invite_code VARCHAR(20) NOT NULL UNIQUE, -- 邀请码
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'completed')),
  inviter_points INTEGER NOT NULL DEFAULT 0, -- 邀请人获得积分
  invitee_points INTEGER NOT NULL DEFAULT 0, -- 被邀请人获得积分
  bonus_points INTEGER NOT NULL DEFAULT 0, -- 额外奖励积分
  registered_at TIMESTAMPTZ, -- 注册时间
  completed_at TIMESTAMPTZ, -- 完成时间（被邀请人完成首次任务）
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_invite_records_inviter_id ON public.invite_records(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invite_records_invitee_id ON public.invite_records(invitee_id);
CREATE INDEX IF NOT EXISTS idx_invite_records_invite_code ON public.invite_records(invite_code);
CREATE INDEX IF NOT EXISTS idx_invite_records_status ON public.invite_records(status);

-- ==========================================================================
-- 7. 消费返积分记录表 - 记录消费返积分情况
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.consumption_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id VARCHAR(100) NOT NULL, -- 订单ID
  order_amount DECIMAL(10, 2) NOT NULL, -- 订单金额
  category VARCHAR(50) NOT NULL DEFAULT 'product', -- 消费类别
  points INTEGER NOT NULL, -- 获得积分
  base_points INTEGER NOT NULL, -- 基础积分
  bonus_points INTEGER NOT NULL DEFAULT 0, -- 加成积分
  bonus_rate DECIMAL(3, 2) NOT NULL DEFAULT 1.00, -- 加成比例
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
  confirmed_at TIMESTAMPTZ, -- 确认时间
  cancelled_at TIMESTAMPTZ, -- 取消时间
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_consumption_records_user_id ON public.consumption_records(user_id);
CREATE INDEX IF NOT EXISTS idx_consumption_records_order_id ON public.consumption_records(order_id);
CREATE INDEX IF NOT EXISTS idx_consumption_records_status ON public.consumption_records(status);
CREATE INDEX IF NOT EXISTS idx_consumption_records_created_at ON public.consumption_records(created_at DESC);

-- ==========================================================================
-- 8. 积分兑换记录表 - 记录积分兑换商品情况
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.exchange_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  product_id VARCHAR(100) NOT NULL, -- 商品ID
  product_name VARCHAR(255) NOT NULL, -- 商品名称
  product_category VARCHAR(50) NOT NULL, -- 商品类别
  points_cost INTEGER NOT NULL, -- 消耗积分
  quantity INTEGER NOT NULL DEFAULT 1, -- 兑换数量
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
  shipping_address JSONB, -- 配送地址（实物商品）
  tracking_number VARCHAR(100), -- 物流单号
  delivered_at TIMESTAMPTZ, -- 送达时间
  refunded_at TIMESTAMPTZ, -- 退款时间
  refund_points INTEGER DEFAULT 0, -- 退还积分
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_exchange_records_user_id ON public.exchange_records(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_records_product_id ON public.exchange_records(product_id);
CREATE INDEX IF NOT EXISTS idx_exchange_records_status ON public.exchange_records(status);
CREATE INDEX IF NOT EXISTS idx_exchange_records_created_at ON public.exchange_records(created_at DESC);

-- 触发器：自动更新 updated_at
DROP TRIGGER IF EXISTS set_exchange_records_updated_at ON public.exchange_records;
CREATE TRIGGER set_exchange_records_updated_at
BEFORE UPDATE ON public.exchange_records
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- ==========================================================================
-- 9. 积分抵扣记录表 - 记录订单积分抵扣情况
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.deduction_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  order_id VARCHAR(100) NOT NULL, -- 订单ID
  original_amount DECIMAL(10, 2) NOT NULL, -- 订单原金额
  points_used INTEGER NOT NULL, -- 使用积分
  deduction_amount DECIMAL(10, 2) NOT NULL, -- 抵扣金额
  final_amount DECIMAL(10, 2) NOT NULL, -- 最终支付金额
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'cancelled', 'refunded')),
  applied_at TIMESTAMPTZ, -- 应用时间
  cancelled_at TIMESTAMPTZ, -- 取消时间
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_deduction_records_user_id ON public.deduction_records(user_id);
CREATE INDEX IF NOT EXISTS idx_deduction_records_order_id ON public.deduction_records(order_id);
CREATE INDEX IF NOT EXISTS idx_deduction_records_status ON public.deduction_records(status);

-- ==========================================================================
-- 10. 积分限制记录表 - 记录用户积分获取限制情况
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.points_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  source_type VARCHAR(50) NOT NULL,
  period_type VARCHAR(50) NOT NULL CHECK (period_type IN ('daily', 'weekly', 'monthly', 'yearly')),
  period_start DATE NOT NULL, -- 周期开始日期
  period_end DATE NOT NULL, -- 周期结束日期
  limit_amount INTEGER NOT NULL, -- 限制数量
  used_amount INTEGER NOT NULL DEFAULT 0, -- 已使用数量
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, source_type, period_type, period_start)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_points_limits_user_id ON public.points_limits(user_id);
CREATE INDEX IF NOT EXISTS idx_points_limits_source_type ON public.points_limits(source_type);
CREATE INDEX IF NOT EXISTS idx_points_limits_period ON public.points_limits(period_start, period_end);

-- 触发器：自动更新 updated_at
DROP TRIGGER IF EXISTS set_points_limits_updated_at ON public.points_limits;
CREATE TRIGGER set_points_limits_updated_at
BEFORE UPDATE ON public.points_limits
FOR EACH ROW
EXECUTE PROCEDURE public.set_updated_at();

-- ==========================================================================
-- 11. 积分对账记录表 - 记录积分对账情况
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.reconciliation_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reconcile_date DATE NOT NULL,
  expected_balance INTEGER NOT NULL, -- 预期余额
  actual_balance INTEGER NOT NULL, -- 实际余额
  difference INTEGER NOT NULL, -- 差异
  status VARCHAR(50) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'matched', 'mismatch', 'resolved')),
  details JSONB NOT NULL DEFAULT '{}'::jsonb, -- 详细数据
  issues JSONB NOT NULL DEFAULT '[]'::jsonb, -- 发现的问题
  resolution TEXT, -- 解决方案
  resolved_at TIMESTAMPTZ, -- 解决时间
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_user_id ON public.reconciliation_records(user_id);
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_date ON public.reconciliation_records(reconcile_date DESC);
CREATE INDEX IF NOT EXISTS idx_reconciliation_records_status ON public.reconciliation_records(status);

-- ==========================================================================
-- 函数：初始化用户积分余额
-- ==========================================================================
CREATE OR REPLACE FUNCTION public.initialize_user_points_balance()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_points_balance (user_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 触发器：新用户注册时自动初始化积分余额
DROP TRIGGER IF EXISTS on_auth_user_created_points ON auth.users;
CREATE TRIGGER on_auth_user_created_points
AFTER INSERT ON auth.users
FOR EACH ROW
EXECUTE PROCEDURE public.initialize_user_points_balance();

-- ==========================================================================
-- 函数：更新用户积分余额（带乐观锁）
-- ==========================================================================
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

-- ==========================================================================
-- 函数：获取用户积分统计
-- ==========================================================================
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

-- ==========================================================================
-- 函数：检查积分限制
-- ==========================================================================
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

-- ==========================================================================
-- 启用行级安全策略 (RLS)
-- ==========================================================================
ALTER TABLE public.user_points_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deduction_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reconciliation_records ENABLE ROW LEVEL SECURITY;

-- ==========================================================================
-- 创建 RLS 策略
-- ==========================================================================

-- user_points_balance 策略
CREATE POLICY "Users can view own points balance"
ON public.user_points_balance FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can update points balance"
ON public.user_points_balance FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- points_records 策略
CREATE POLICY "Users can view own points records"
ON public.points_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert points records"
ON public.points_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- points_rules 策略（只读）
CREATE POLICY "Anyone can view active points rules"
ON public.points_rules FOR SELECT
USING (is_active = true);

-- checkin_records 策略
CREATE POLICY "Users can view own checkin records"
ON public.checkin_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkin records"
ON public.checkin_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- task_records 策略
CREATE POLICY "Users can view own task records"
ON public.task_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own task records"
ON public.task_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own task records"
ON public.task_records FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- invite_records 策略
CREATE POLICY "Users can view own invite records"
ON public.invite_records FOR SELECT
USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can insert own invite records"
ON public.invite_records FOR INSERT
WITH CHECK (auth.uid() = inviter_id);

-- consumption_records 策略
CREATE POLICY "Users can view own consumption records"
ON public.consumption_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert consumption records"
ON public.consumption_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- exchange_records 策略
CREATE POLICY "Users can view own exchange records"
ON public.exchange_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own exchange records"
ON public.exchange_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- deduction_records 策略
CREATE POLICY "Users can view own deduction records"
ON public.deduction_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert deduction records"
ON public.deduction_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- points_limits 策略
CREATE POLICY "Users can view own points limits"
ON public.points_limits FOR SELECT
USING (auth.uid() = user_id);

-- reconciliation_records 策略
CREATE POLICY "Users can view own reconciliation records"
ON public.reconciliation_records FOR SELECT
USING (auth.uid() = user_id);

-- ==========================================================================
-- 初始化默认积分规则
-- ==========================================================================
INSERT INTO public.points_rules (name, description, rule_type, source_type, points, daily_limit, is_active)
VALUES 
  ('每日签到', '每日签到获得基础积分', 'earn', 'daily', 5, 1, true),
  ('连续签到3天', '连续签到3天额外奖励', 'earn', 'daily', 10, NULL, true),
  ('连续签到7天', '连续签到7天额外奖励', 'earn', 'daily', 30, NULL, true),
  ('连续签到30天', '连续签到30天超级奖励', 'earn', 'daily', 100, NULL, true),
  ('新手任务', '完成新手引导任务', 'earn', 'task', 50, NULL, true),
  ('发布作品', '发布第一篇作品', 'earn', 'task', 100, NULL, true),
  ('邀请好友', '成功邀请一位好友', 'earn', 'invite', 150, 10, true),
  ('被邀请奖励', '使用邀请码注册', 'earn', 'invite', 50, 1, true),
  ('消费返积分', '每消费1元返1积分', 'earn', 'consumption', 1, 1000, true),
  ('积分兑换', '兑换商品消耗积分', 'spend', 'exchange', -1, NULL, true)
ON CONFLICT (name) DO NOTHING;

-- ==========================================================================
-- 创建视图：用户积分概览
-- ==========================================================================
CREATE OR REPLACE VIEW public.user_points_overview AS
SELECT 
  upb.user_id,
  upb.balance as current_balance,
  upb.total_earned,
  upb.total_spent,
  upb.last_updated_at,
  COALESCE((
    SELECT SUM(points)
    FROM public.points_records
    WHERE user_id = upb.user_id
    AND points > 0
    AND created_at >= DATE_TRUNC('day', NOW())
  ), 0) as today_earned,
  COALESCE((
    SELECT SUM(points)
    FROM public.points_records
    WHERE user_id = upb.user_id
    AND points < 0
    AND created_at >= DATE_TRUNC('day', NOW())
  ), 0) as today_spent,
  (SELECT COUNT(*) FROM public.checkin_records WHERE user_id = upb.user_id) as total_checkins,
  (SELECT COUNT(*) FROM public.task_records WHERE user_id = upb.user_id AND status = 'completed') as completed_tasks,
  (SELECT COUNT(*) FROM public.exchange_records WHERE user_id = upb.user_id AND status = 'completed') as completed_exchanges
FROM public.user_points_balance upb;

-- ==========================================================================
-- 创建视图：积分排行榜
-- ==========================================================================
CREATE OR REPLACE VIEW public.points_leaderboard AS
SELECT 
  upb.user_id,
  u.username,
  u.avatar_url,
  upb.balance,
  upb.total_earned,
  RANK() OVER (ORDER BY upb.balance DESC) as rank
FROM public.user_points_balance upb
JOIN public.users u ON upb.user_id = u.id
WHERE upb.balance > 0
ORDER BY upb.balance DESC;

-- ==========================================================================
-- 创建 Realtime 发布（用于实时订阅）
-- ==========================================================================
-- 确保 realtime 扩展已启用
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'realtime') THEN
    CREATE EXTENSION IF NOT EXISTS "realtime";
  END IF;
END
$$;

-- 将表添加到 realtime 发布
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_points_balance;
ALTER PUBLICATION supabase_realtime ADD TABLE public.points_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.checkin_records;
ALTER PUBLICATION supabase_realtime ADD TABLE public.exchange_records;

-- ==========================================================================
-- 完成
-- ==========================================================================
