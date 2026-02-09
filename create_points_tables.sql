-- 创建积分系统相关表

-- 1. 签到记录表
CREATE TABLE IF NOT EXISTS public.checkin_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    checkin_date DATE NOT NULL,
    consecutive_days INTEGER DEFAULT 1,
    points_earned INTEGER DEFAULT 5,
    is_bonus BOOLEAN DEFAULT false,
    bonus_points INTEGER DEFAULT 0,
    is_retroactive BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, checkin_date)
);

-- 2. 任务记录表
CREATE TABLE IF NOT EXISTS public.task_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    task_id TEXT NOT NULL,
    task_type TEXT CHECK (task_type IN ('daily', 'weekly', 'monthly', 'event', 'achievement')),
    task_title TEXT NOT NULL,
    progress INTEGER DEFAULT 0,
    target INTEGER DEFAULT 1,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'expired')),
    points_reward INTEGER DEFAULT 0,
    completed_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, task_id)
);

-- 3. 兑换记录表
CREATE TABLE IF NOT EXISTS public.exchange_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_category TEXT,
    points_cost INTEGER NOT NULL,
    quantity INTEGER DEFAULT 1,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'cancelled', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 邀请记录表
CREATE TABLE IF NOT EXISTS public.invite_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inviter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    invitee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    invite_code TEXT NOT NULL UNIQUE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'registered', 'completed')),
    inviter_points INTEGER DEFAULT 0,
    invitee_points INTEGER DEFAULT 0,
    registered_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 消费返积分记录表
CREATE TABLE IF NOT EXISTS public.consumption_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    order_id TEXT NOT NULL,
    order_amount DECIMAL(10, 2) NOT NULL,
    category TEXT,
    points INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'cancelled', 'refunded')),
    confirmed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 积分规则表
CREATE TABLE IF NOT EXISTS public.points_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    rule_type TEXT CHECK (rule_type IN ('earn', 'spend', 'limit')),
    source_type TEXT NOT NULL,
    points INTEGER DEFAULT 0,
    daily_limit INTEGER,
    weekly_limit INTEGER,
    monthly_limit INTEGER,
    yearly_limit INTEGER,
    is_active BOOLEAN DEFAULT true,
    priority INTEGER DEFAULT 0,
    conditions JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 插入默认积分规则
INSERT INTO public.points_rules (name, description, rule_type, source_type, points, daily_limit, is_active, priority) VALUES
('每日签到', '每日签到获得基础积分', 'earn', 'checkin', 5, 1, true, 100),
('连续3天签到奖励', '连续签到3天额外奖励', 'earn', 'checkin', 10, 1, true, 90),
('连续7天签到奖励', '连续签到7天额外奖励', 'earn', 'checkin', 30, 1, true, 80),
('连续30天签到奖励', '连续签到30天超级奖励', 'earn', 'checkin', 100, 1, true, 70),
('任务完成', '完成任务获得积分', 'earn', 'task', 10, 10, true, 100),
('成就解锁', '解锁成就获得积分', 'earn', 'achievement', 50, NULL, true, 100)
ON CONFLICT DO NOTHING;

-- 启用 RLS
ALTER TABLE public.checkin_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.task_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invite_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.consumption_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.points_rules ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
-- checkin_records 策略
CREATE POLICY "Users can view own checkin records" ON public.checkin_records
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own checkin records" ON public.checkin_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage all checkin records" ON public.checkin_records
    FOR ALL USING (true) WITH CHECK (true);

-- task_records 策略
CREATE POLICY "Users can view own task records" ON public.task_records
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own task records" ON public.task_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage all task records" ON public.task_records
    FOR ALL USING (true) WITH CHECK (true);

-- exchange_records 策略
CREATE POLICY "Users can view own exchange records" ON public.exchange_records
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own exchange records" ON public.exchange_records
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Service role can manage all exchange records" ON public.exchange_records
    FOR ALL USING (true) WITH CHECK (true);

-- invite_records 策略
CREATE POLICY "Users can view own invite records" ON public.invite_records
    FOR SELECT USING (auth.uid() = inviter_id);
CREATE POLICY "Users can insert invite records" ON public.invite_records
    FOR INSERT WITH CHECK (true);
CREATE POLICY "Service role can manage all invite records" ON public.invite_records
    FOR ALL USING (true) WITH CHECK (true);

-- consumption_records 策略
CREATE POLICY "Users can view own consumption records" ON public.consumption_records
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all consumption records" ON public.consumption_records
    FOR ALL USING (true) WITH CHECK (true);

-- points_rules 策略 (所有人可读)
CREATE POLICY "Anyone can view active points rules" ON public.points_rules
    FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage points rules" ON public.points_rules
    FOR ALL USING (true) WITH CHECK (true);

-- 授予权限
GRANT ALL ON public.checkin_records TO anon, authenticated, service_role;
GRANT ALL ON public.task_records TO anon, authenticated, service_role;
GRANT ALL ON public.exchange_records TO anon, authenticated, service_role;
GRANT ALL ON public.invite_records TO anon, authenticated, service_role;
GRANT ALL ON public.consumption_records TO anon, authenticated, service_role;
GRANT ALL ON public.points_rules TO anon, authenticated, service_role;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_checkin_records_user_id ON public.checkin_records(user_id);
CREATE INDEX IF NOT EXISTS idx_checkin_records_date ON public.checkin_records(checkin_date);
CREATE INDEX IF NOT EXISTS idx_task_records_user_id ON public.task_records(user_id);
CREATE INDEX IF NOT EXISTS idx_exchange_records_user_id ON public.exchange_records(user_id);
CREATE INDEX IF NOT EXISTS idx_invite_records_inviter_id ON public.invite_records(inviter_id);
CREATE INDEX IF NOT EXISTS idx_consumption_records_user_id ON public.consumption_records(user_id);

SELECT '积分系统表创建成功' as status;
