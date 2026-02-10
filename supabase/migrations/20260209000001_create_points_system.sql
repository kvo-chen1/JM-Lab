-- 创建积分系统表结构
-- 包含用户积分余额、积分记录、积分规则、签到记录、任务记录、邀请记录、消费记录、兑换记录等

-- 1. 用户积分余额表
CREATE TABLE IF NOT EXISTS public.user_points_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    balance INTEGER NOT NULL DEFAULT 0 CHECK (balance >= 0),
    total_earned INTEGER NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
    total_spent INTEGER NOT NULL DEFAULT 0 CHECK (total_spent >= 0),
    version INTEGER NOT NULL DEFAULT 1,
    last_updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id)
);

COMMENT ON TABLE public.user_points_balance IS '用户积分余额表';

-- 2. 积分记录表
CREATE TABLE IF NOT EXISTS public.points_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    points INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('earned', 'spent', 'adjustment')),
    source VARCHAR(100) NOT NULL,
    source_type VARCHAR(50) NOT NULL CHECK (source_type IN ('achievement', 'task', 'daily', 'consumption', 'exchange', 'system', 'invite', 'checkin')),
    description TEXT NOT NULL,
    balance_after INTEGER NOT NULL,
    related_id UUID,
    related_type VARCHAR(50),
    metadata JSONB DEFAULT '{}',
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.points_records IS '积分记录表';

-- 3. 积分规则表
CREATE TABLE IF NOT EXISTS public.points_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(100) NOT NULL,
    description TEXT,
    rule_type VARCHAR(20) NOT NULL CHECK (rule_type IN ('earn', 'spend', 'limit')),
    source_type VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL,
    daily_limit INTEGER,
    weekly_limit INTEGER,
    monthly_limit INTEGER,
    yearly_limit INTEGER,
    is_active BOOLEAN NOT NULL DEFAULT true,
    priority INTEGER NOT NULL DEFAULT 0,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.points_rules IS '积分规则表';

-- 4. 签到记录表
CREATE TABLE IF NOT EXISTS public.checkin_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL,
    consecutive_days INTEGER NOT NULL DEFAULT 1,
    points_earned INTEGER NOT NULL DEFAULT 0,
    is_bonus BOOLEAN NOT NULL DEFAULT false,
    bonus_points INTEGER NOT NULL DEFAULT 0,
    is_retroactive BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, checkin_date)
);

COMMENT ON TABLE public.checkin_records IS '签到记录表';

-- 5. 任务记录表
CREATE TABLE IF NOT EXISTS public.task_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id VARCHAR(100) NOT NULL,
    task_type VARCHAR(20) NOT NULL CHECK (task_type IN ('daily', 'weekly', 'monthly', 'event', 'achievement')),
    task_title VARCHAR(200) NOT NULL,
    progress INTEGER NOT NULL DEFAULT 0,
    target INTEGER NOT NULL DEFAULT 1,
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    points_reward INTEGER NOT NULL DEFAULT 0,
    completed_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, task_id)
);

COMMENT ON TABLE public.task_records IS '任务记录表';

-- 6. 邀请记录表
CREATE TABLE IF NOT EXISTS public.invite_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invite_code VARCHAR(50) NOT NULL UNIQUE,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'completed')),
    inviter_points INTEGER NOT NULL DEFAULT 0,
    invitee_points INTEGER NOT NULL DEFAULT 0,
    registered_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.invite_records IS '邀请记录表';

-- 7. 消费返积分记录表
CREATE TABLE IF NOT EXISTS public.consumption_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id VARCHAR(100) NOT NULL,
    order_amount DECIMAL(10, 2) NOT NULL,
    category VARCHAR(50) NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
    confirmed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.consumption_records IS '消费返积分记录表';

-- 8. 积分兑换记录表
CREATE TABLE IF NOT EXISTS public.exchange_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id VARCHAR(100) NOT NULL,
    product_name VARCHAR(200) NOT NULL,
    product_category VARCHAR(50) NOT NULL,
    points_cost INTEGER NOT NULL CHECK (points_cost > 0),
    quantity INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.exchange_records IS '积分兑换记录表';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_points_records_user_id ON public.points_records(user_id);
CREATE INDEX IF NOT EXISTS idx_points_records_created_at ON public.points_records(created_at);
CREATE INDEX IF NOT EXISTS idx_points_records_source_type ON public.points_records(source_type);
CREATE INDEX IF NOT EXISTS idx_checkin_records_user_id ON public.checkin_records(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_date ON public.checkin_records(checkin_date);
CREATE INDEX IF NOT EXISTS idx_task_records_user_id ON public.task_records(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_records_inviter ON public.invite_records(inviter_id);
CREATE INDEX IF NOT EXISTS idx_invite_records_code ON public.invite_records(invite_code);
CREATE INDEX IF NOT EXISTS idx_consumption_user_id ON public.consumption_records(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_user_id ON public.exchange_records(user_id);

-- 启用 RLS
ALTER TABLE public.user_points_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.checkin_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_records ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Users can view own balance" ON public.user_points_balance;
DROP POLICY IF EXISTS "Users can update own balance" ON public.user_points_balance;
DROP POLICY IF EXISTS "Users can insert own balance" ON public.user_points_balance;
DROP POLICY IF EXISTS "Users can view own points records" ON public.points_records;
DROP POLICY IF EXISTS "Users can insert own points records" ON public.points_records;
DROP POLICY IF EXISTS "Anyone can view active rules" ON public.points_rules;
DROP POLICY IF EXISTS "Users can view own checkin" ON public.checkin_records;
DROP POLICY IF EXISTS "Users can insert own checkin" ON public.checkin_records;
DROP POLICY IF EXISTS "Users can view own tasks" ON public.task_records;
DROP POLICY IF EXISTS "Users can upsert own tasks" ON public.task_records;
DROP POLICY IF EXISTS "Users can view own invites" ON public.invite_records;
DROP POLICY IF EXISTS "Users can create invites" ON public.invite_records;
DROP POLICY IF EXISTS "Users can view own consumption" ON public.consumption_records;
DROP POLICY IF EXISTS "Users can view own exchange" ON public.exchange_records;
DROP POLICY IF EXISTS "Users can create exchange" ON public.exchange_records;

-- RLS 策略
-- user_points_balance: 用户只能看到自己的余额
CREATE POLICY "Users can view own balance" ON public.user_points_balance
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own balance" ON public.user_points_balance
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own balance" ON public.user_points_balance
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- points_records: 用户只能看到自己的记录
CREATE POLICY "Users can view own points records" ON public.points_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own points records" ON public.points_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- points_rules: 所有用户可查看活跃规则
CREATE POLICY "Anyone can view active rules" ON public.points_rules
    FOR SELECT USING (is_active = true);

-- checkin_records: 用户只能看到自己的签到记录
CREATE POLICY "Users can view own checkin" ON public.checkin_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own checkin" ON public.checkin_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- task_records: 用户只能看到自己的任务
CREATE POLICY "Users can view own tasks" ON public.task_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can upsert own tasks" ON public.task_records
    FOR ALL USING (auth.uid() = user_id);

-- invite_records: 邀请人可以看到自己的邀请，被邀请人也可以看到
CREATE POLICY "Users can view own invites" ON public.invite_records
    FOR SELECT USING (auth.uid() = inviter_id OR auth.uid() = invitee_id);

CREATE POLICY "Users can create invites" ON public.invite_records
    FOR INSERT WITH CHECK (auth.uid() = inviter_id);

-- consumption_records: 用户只能看到自己的消费记录
CREATE POLICY "Users can view own consumption" ON public.consumption_records
    FOR SELECT USING (auth.uid() = user_id);

-- exchange_records: 用户只能看到自己的兑换记录
CREATE POLICY "Users can view own exchange" ON public.exchange_records
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create exchange" ON public.exchange_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建 RPC 函数: 更新用户积分余额
CREATE OR REPLACE FUNCTION public.update_user_points_balance(
    p_user_id UUID,
    p_points INTEGER,
    p_type VARCHAR(20),
    p_source VARCHAR(100),
    p_source_type VARCHAR(50),
    p_description TEXT,
    p_metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_current_balance INTEGER;
    v_new_balance INTEGER;
    v_total_earned INTEGER;
    v_total_spent INTEGER;
    v_record_id UUID;
    v_result JSONB;
BEGIN
    -- 获取当前余额
    SELECT balance, total_earned, total_spent INTO v_current_balance, v_total_earned, v_total_spent
    FROM public.user_points_balance
    WHERE user_id = p_user_id;

    -- 如果没有记录，创建新记录
    IF v_current_balance IS NULL THEN
        v_current_balance := 0;
        v_total_earned := 0;
        v_total_spent := 0;
        INSERT INTO public.user_points_balance (user_id, balance, total_earned, total_spent)
        VALUES (p_user_id, 0, 0, 0);
    END IF;

    -- 计算新余额
    v_new_balance := v_current_balance + p_points;

    -- 检查余额是否足够（如果是消耗积分）
    IF p_type = 'spent' AND v_new_balance < 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error_message', '积分余额不足'
        );
    END IF;

    -- 更新余额
    IF p_type = 'earned' THEN
        v_total_earned := v_total_earned + p_points;
    ELSIF p_type = 'spent' THEN
        v_total_spent := v_total_spent + ABS(p_points);
    END IF;

    UPDATE public.user_points_balance
    SET balance = v_new_balance,
        total_earned = v_total_earned,
        total_spent = v_total_spent,
        last_updated_at = NOW(),
        version = version + 1
    WHERE user_id = p_user_id;

    -- 创建积分记录
    INSERT INTO public.points_records (
        user_id, points, type, source, source_type, description, 
        balance_after, metadata
    ) VALUES (
        p_user_id, p_points, p_type, p_source, p_source_type, p_description,
        v_new_balance, p_metadata
    )
    RETURNING id INTO v_record_id;

    RETURN jsonb_build_object(
        'success', true,
        'new_balance', v_new_balance,
        'record_id', v_record_id
    );
END;
$$;

-- 删除已存在的函数（如果存在）
DROP FUNCTION IF EXISTS public.get_user_points_stats(UUID);
DROP FUNCTION IF EXISTS public.check_points_limit(UUID, VARCHAR, INTEGER, VARCHAR);

-- 创建 RPC 函数: 获取用户积分统计
CREATE OR REPLACE FUNCTION public.get_user_points_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_balance INTEGER;
    v_total_earned INTEGER;
    v_total_spent INTEGER;
    v_today_earned INTEGER;
    v_week_earned INTEGER;
    v_month_earned INTEGER;
    v_source_stats JSONB;
BEGIN
    -- 获取余额统计
    SELECT balance, total_earned, total_spent 
    INTO v_balance, v_total_earned, v_total_spent
    FROM public.user_points_balance
    WHERE user_id = p_user_id;

    IF v_balance IS NULL THEN
        v_balance := 0;
        v_total_earned := 0;
        v_total_spent := 0;
    END IF;

    -- 今日获得
    SELECT COALESCE(SUM(points), 0) INTO v_today_earned
    FROM public.points_records
    WHERE user_id = p_user_id
      AND type = 'earned'
      AND created_at >= CURRENT_DATE;

    -- 本周获得
    SELECT COALESCE(SUM(points), 0) INTO v_week_earned
    FROM public.points_records
    WHERE user_id = p_user_id
      AND type = 'earned'
      AND created_at >= DATE_TRUNC('week', CURRENT_DATE);

    -- 本月获得
    SELECT COALESCE(SUM(points), 0) INTO v_month_earned
    FROM public.points_records
    WHERE user_id = p_user_id
      AND type = 'earned'
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE);

    -- 来源统计
    SELECT jsonb_object_agg(source_type, total)
    INTO v_source_stats
    FROM (
        SELECT source_type, COALESCE(SUM(points), 0) as total
        FROM public.points_records
        WHERE user_id = p_user_id AND type = 'earned'
        GROUP BY source_type
    ) sub;

    IF v_source_stats IS NULL THEN
        v_source_stats := '{}'::JSONB;
    END IF;

    RETURN jsonb_build_object(
        'current_balance', v_balance,
        'total_earned', v_total_earned,
        'total_spent', v_total_spent,
        'today_earned', v_today_earned,
        'week_earned', v_week_earned,
        'month_earned', v_month_earned,
        'source_stats', v_source_stats
    );
END;
$$;

-- 创建 RPC 函数: 检查积分限制
CREATE OR REPLACE FUNCTION public.check_points_limit(
    p_user_id UUID,
    p_source_type VARCHAR(50),
    p_points INTEGER,
    p_period_type VARCHAR(20) DEFAULT 'daily'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_rule RECORD;
    v_limit INTEGER;
    v_used INTEGER;
    v_start_date TIMESTAMPTZ;
BEGIN
    -- 获取规则
    SELECT * INTO v_rule
    FROM public.points_rules
    WHERE source_type = p_source_type AND is_active = true
    LIMIT 1;

    IF v_rule IS NULL THEN
        RETURN jsonb_build_object(
            'can_add', true,
            'remaining', 999999,
            'limit_amount', 0,
            'used_amount', 0
        );
    END IF;

    -- 根据周期类型确定限制
    CASE p_period_type
        WHEN 'daily' THEN v_limit := v_rule.daily_limit;
        WHEN 'weekly' THEN v_limit := v_rule.weekly_limit;
        WHEN 'monthly' THEN v_limit := v_rule.monthly_limit;
        WHEN 'yearly' THEN v_limit := v_rule.yearly_limit;
        ELSE v_limit := NULL;
    END CASE;

    IF v_limit IS NULL THEN
        RETURN jsonb_build_object(
            'can_add', true,
            'remaining', 999999,
            'limit_amount', 0,
            'used_amount', 0
        );
    END IF;

    -- 计算周期开始时间
    CASE p_period_type
        WHEN 'daily' THEN v_start_date := CURRENT_DATE::TIMESTAMPTZ;
        WHEN 'weekly' THEN v_start_date := DATE_TRUNC('week', CURRENT_DATE);
        WHEN 'monthly' THEN v_start_date := DATE_TRUNC('month', CURRENT_DATE);
        WHEN 'yearly' THEN v_start_date := DATE_TRUNC('year', CURRENT_DATE);
    END CASE;

    -- 计算已使用积分
    SELECT COALESCE(SUM(points), 0) INTO v_used
    FROM public.points_records
    WHERE user_id = p_user_id
      AND source_type = p_source_type
      AND type = 'earned'
      AND created_at >= v_start_date;

    RETURN jsonb_build_object(
        'can_add', (v_used + p_points) <= v_limit,
        'remaining', GREATEST(0, v_limit - v_used),
        'limit_amount', v_limit,
        'used_amount', v_used
    );
END;
$$;

-- 创建视图: 积分排行榜
CREATE OR REPLACE VIEW public.points_leaderboard AS
SELECT 
    user_id,
    balance,
    RANK() OVER (ORDER BY balance DESC) as rank
FROM public.user_points_balance
WHERE balance > 0
ORDER BY balance DESC;

-- 插入默认积分规则
INSERT INTO public.points_rules (name, description, rule_type, source_type, points, daily_limit, is_active, priority)
VALUES 
    ('每日签到', '每日签到获得积分', 'earn', 'checkin', 10, 1, true, 100),
    ('连续签到奖励', '连续签到额外奖励', 'earn', 'checkin', 20, 1, true, 90),
    ('发布作品', '发布新作品获得积分', 'earn', 'achievement', 50, NULL, true, 80),
    ('作品被点赞', '作品被点赞获得积分', 'earn', 'achievement', 5, 100, true, 70),
    ('邀请好友', '邀请新用户注册', 'earn', 'invite', 100, NULL, true, 60),
    ('消费返积分', '消费金额按比例返积分', 'earn', 'consumption', 10, NULL, true, 50)
ON CONFLICT DO NOTHING;
