-- ==========================================================================
-- 品牌方任务发布系统 - 数据库迁移
-- 包含：品牌任务表、激励评估表、资金管理表、任务跟踪表
-- ==========================================================================

-- ==========================================================================
-- 1. 品牌任务表 (brand_tasks) - 扩展原有business_tasks
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.brand_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- 基本信息
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    content TEXT, -- 详细任务说明
    
    -- 品牌信息
    brand_id UUID REFERENCES public.brand_partnerships(id),
    brand_name TEXT NOT NULL,
    brand_logo TEXT,
    
    -- 发布方
    publisher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 任务要求
    required_tags JSONB DEFAULT '[]'::jsonb, -- 必须包含的标签，如["海河"]
    required_location TEXT DEFAULT '津脉广场', -- 发布位置要求
    content_requirements JSONB DEFAULT '[]'::jsonb, -- 内容规范要求
    participation_conditions JSONB DEFAULT '[]'::jsonb, -- 参与条件
    
    -- 任务周期
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ NOT NULL,
    
    -- 任务预算
    total_budget DECIMAL(12, 2) NOT NULL, -- 总预算
    remaining_budget DECIMAL(12, 2), -- 剩余预算
    min_reward DECIMAL(10, 2), -- 最低奖励
    max_reward DECIMAL(10, 2), -- 最高奖励
    
    -- 激励计算模型
    incentive_model JSONB DEFAULT '{}'::jsonb, -- 激励计算模型配置
    /*
    {
        "type": "performance_based", -- 按表现计算
        "metrics": {
            "views": { "weight": 0.3, "rate_per_1000": 10 }, -- 每1000浏览10元
            "likes": { "weight": 0.3, "rate_per": 2 }, -- 每个点赞2元
            "favorites": { "weight": 0.2, "rate_per": 5 }, -- 每个收藏5元
            "shares": { "weight": 0.2, "rate_per": 3 } -- 每个分享3元
        },
        "max_reward_per_work": 1000, -- 单个作品最高奖励
        "min_reward_per_work": 50 -- 单个作品最低奖励
    }
    */
    
    -- 参与限制
    max_participants INTEGER DEFAULT 100, -- 最大参与人数
    current_participants INTEGER DEFAULT 0, -- 当前参与人数
    max_works_per_user INTEGER DEFAULT 5, -- 每人最多提交作品数
    
    -- 作品审核设置
    require_approval BOOLEAN DEFAULT true, -- 是否需要审核
    auto_approval_threshold INTEGER, -- 自动通过阈值（如粉丝数>1000自动通过）
    
    -- 任务状态
    status TEXT NOT NULL DEFAULT 'draft' 
        CHECK (status IN ('draft', 'pending', 'published', 'paused', 'completed', 'cancelled')),
    
    -- 审核信息
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    
    -- 统计数据
    total_works INTEGER DEFAULT 0, -- 总作品数
    approved_works INTEGER DEFAULT 0, -- 已审核通过作品数
    total_views INTEGER DEFAULT 0, -- 总浏览量
    total_likes INTEGER DEFAULT 0, -- 总点赞数
    total_favorites INTEGER DEFAULT 0, -- 总收藏数
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    published_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_brand_tasks_brand ON public.brand_tasks(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_tasks_publisher ON public.brand_tasks(publisher_id);
CREATE INDEX IF NOT EXISTS idx_brand_tasks_status ON public.brand_tasks(status);
CREATE INDEX IF NOT EXISTS idx_brand_tasks_dates ON public.brand_tasks(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_brand_tasks_created ON public.brand_tasks(created_at DESC);

-- ==========================================================================
-- 2. 品牌任务参与表 (brand_task_participants)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.brand_task_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    task_id UUID NOT NULL REFERENCES public.brand_tasks(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 参与状态
    status TEXT NOT NULL DEFAULT 'applied'
        CHECK (status IN ('applied', 'approved', 'rejected', 'active', 'completed', 'cancelled')),
    
    -- 提交作品数
    submitted_works INTEGER DEFAULT 0,
    approved_works INTEGER DEFAULT 0,
    
    -- 收益统计
    total_earnings DECIMAL(12, 2) DEFAULT 0,
    pending_earnings DECIMAL(12, 2) DEFAULT 0,
    withdrawn_earnings DECIMAL(12, 2) DEFAULT 0,
    
    -- 申请信息
    application_message TEXT, -- 申请留言
    portfolio_links JSONB DEFAULT '[]'::jsonb, -- 作品集链接
    
    -- 时间戳
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    
    UNIQUE(task_id, creator_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_task_participants_task ON public.brand_task_participants(task_id);
CREATE INDEX IF NOT EXISTS idx_brand_task_participants_creator ON public.brand_task_participants(creator_id);
CREATE INDEX IF NOT EXISTS idx_brand_task_participants_status ON public.brand_task_participants(status);

-- ==========================================================================
-- 3. 品牌任务作品提交表 (brand_task_submissions)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.brand_task_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    task_id UUID NOT NULL REFERENCES public.brand_tasks(id) ON DELETE CASCADE,
    participant_id UUID NOT NULL REFERENCES public.brand_task_participants(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    work_id UUID REFERENCES public.works(id) ON DELETE SET NULL, -- 关联的作品
    
    -- 作品信息
    work_title TEXT NOT NULL,
    work_url TEXT, -- 作品链接
    work_thumbnail TEXT, -- 作品缩略图
    
    -- 提交的内容
    content TEXT, -- 作品内容描述
    tags JSONB DEFAULT '[]'::jsonb, -- 作品标签
    
    -- 审核状态
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'rejected', 'needs_revision')),
    
    -- 审核信息
    reviewed_by UUID REFERENCES public.users(id),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    rejection_reason TEXT,
    
    -- 数据统计（提交时的快照）
    views_at_submit INTEGER DEFAULT 0,
    likes_at_submit INTEGER DEFAULT 0,
    favorites_at_submit INTEGER DEFAULT 0,
    shares_at_submit INTEGER DEFAULT 0,
    
    -- 当前数据统计
    current_views INTEGER DEFAULT 0,
    current_likes INTEGER DEFAULT 0,
    current_favorites INTEGER DEFAULT 0,
    current_shares INTEGER DEFAULT 0,
    
    -- 激励金额
    estimated_reward DECIMAL(10, 2), -- 预估奖励
    final_reward DECIMAL(10, 2), -- 最终奖励
    reward_calculated_at TIMESTAMPTZ, -- 奖励计算时间
    
    -- 时间戳
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_brand_task_submissions_task ON public.brand_task_submissions(task_id);
CREATE INDEX IF NOT EXISTS idx_brand_task_submissions_creator ON public.brand_task_submissions(creator_id);
CREATE INDEX IF NOT EXISTS idx_brand_task_submissions_status ON public.brand_task_submissions(status);
CREATE INDEX IF NOT EXISTS idx_brand_task_submissions_work ON public.brand_task_submissions(work_id);

-- ==========================================================================
-- 4. 品牌资金账户表 (brand_accounts)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.brand_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    brand_id UUID REFERENCES public.brand_partnerships(id),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 账户余额
    total_balance DECIMAL(12, 2) DEFAULT 0, -- 总余额
    available_balance DECIMAL(12, 2) DEFAULT 0, -- 可用余额
    frozen_balance DECIMAL(12, 2) DEFAULT 0, -- 冻结余额（用于进行中任务）
    
    -- 累计统计
    total_deposited DECIMAL(12, 2) DEFAULT 0, -- 累计充值
    total_spent DECIMAL(12, 2) DEFAULT 0, -- 累计支出
    total_withdrawn DECIMAL(12, 2) DEFAULT 0, -- 累计提现
    
    -- 账户状态
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active', 'frozen', 'suspended')),
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(brand_id),
    UNIQUE(user_id)
);

CREATE INDEX IF NOT EXISTS idx_brand_accounts_brand ON public.brand_accounts(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_accounts_user ON public.brand_accounts(user_id);

-- ==========================================================================
-- 5. 品牌资金流水表 (brand_transactions)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.brand_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    account_id UUID NOT NULL REFERENCES public.brand_accounts(id) ON DELETE CASCADE,
    brand_id UUID REFERENCES public.brand_partnerships(id),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 交易类型
    type TEXT NOT NULL
        CHECK (type IN ('deposit', 'withdrawal', 'task_budget', 'task_reward', 'refund', 'fee', 'adjustment')),
    
    -- 交易金额
    amount DECIMAL(12, 2) NOT NULL, -- 正数为收入，负数为支出
    balance_after DECIMAL(12, 2) NOT NULL, -- 交易后余额
    
    -- 关联信息
    task_id UUID REFERENCES public.brand_tasks(id),
    submission_id UUID REFERENCES public.brand_task_submissions(id),
    
    -- 交易详情
    description TEXT,
    payment_method TEXT, -- 支付方式
    payment_reference TEXT, -- 支付参考号
    
    -- 交易状态
    status TEXT NOT NULL DEFAULT 'completed'
        CHECK (status IN ('pending', 'completed', 'failed', 'cancelled')),
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_brand_transactions_account ON public.brand_transactions(account_id);
CREATE INDEX IF NOT EXISTS idx_brand_transactions_brand ON public.brand_transactions(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_transactions_type ON public.brand_transactions(type);
CREATE INDEX IF NOT EXISTS idx_brand_transactions_created ON public.brand_transactions(created_at DESC);

-- ==========================================================================
-- 6. 品牌任务数据统计表 (brand_task_analytics)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.brand_task_analytics (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    task_id UUID NOT NULL REFERENCES public.brand_tasks(id) ON DELETE CASCADE,
    
    -- 日期（按天统计）
    date DATE NOT NULL,
    
    -- 参与数据
    new_participants INTEGER DEFAULT 0,
    new_submissions INTEGER DEFAULT 0,
    approved_submissions INTEGER DEFAULT 0,
    
    -- 互动数据
    views INTEGER DEFAULT 0,
    likes INTEGER DEFAULT 0,
    favorites INTEGER DEFAULT 0,
    shares INTEGER DEFAULT 0,
    comments INTEGER DEFAULT 0,
    
    -- 激励数据
    rewards_paid DECIMAL(12, 2) DEFAULT 0,
    
    -- 唯一约束：每天每个任务一条记录
    UNIQUE(task_id, date)
);

CREATE INDEX IF NOT EXISTS idx_brand_task_analytics_task ON public.brand_task_analytics(task_id);
CREATE INDEX IF NOT EXISTS idx_brand_task_analytics_date ON public.brand_task_analytics(date);

-- ==========================================================================
-- 7. 创作者收益结算表 (creator_earnings)
-- ==========================================================================
CREATE TABLE IF NOT EXISTS public.creator_earnings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    task_id UUID NOT NULL REFERENCES public.brand_tasks(id) ON DELETE CASCADE,
    submission_id UUID REFERENCES public.brand_task_submissions(id),
    
    -- 收益金额
    amount DECIMAL(10, 2) NOT NULL,
    
    -- 收益来源
    source_type TEXT NOT NULL
        CHECK (source_type IN ('task_reward', 'bonus', 'adjustment')),
    
    -- 计算依据
    calculation_basis JSONB DEFAULT '{}'::jsonb,
    /*
    {
        "views": 1000,
        "likes": 50,
        "favorites": 20,
        "shares": 10,
        "rates": { ... }
    }
    */
    
    -- 状态
    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (status IN ('pending', 'approved', 'paid', 'cancelled')),
    
    -- 支付信息
    paid_at TIMESTAMPTZ,
    payment_reference TEXT,
    
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_creator_earnings_creator ON public.creator_earnings(creator_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_task ON public.creator_earnings(task_id);
CREATE INDEX IF NOT EXISTS idx_creator_earnings_status ON public.creator_earnings(status);

-- ==========================================================================
-- RLS 策略
-- ==========================================================================

-- 品牌任务表
ALTER TABLE public.brand_tasks ENABLE ROW LEVEL SECURITY;

-- 任何人可以查看已发布的任务
CREATE POLICY "查看已发布品牌任务" ON public.brand_tasks
    FOR SELECT TO public
    USING (status = 'published');

-- 发布者可以管理自己的任务
CREATE POLICY "发布者管理自己的任务" ON public.brand_tasks
    FOR ALL TO public
    USING (publisher_id = auth.uid());

-- 品牌任务参与表
ALTER TABLE public.brand_task_participants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "查看任务参与者" ON public.brand_task_participants
    FOR SELECT TO public
    USING (creator_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.brand_tasks WHERE id = task_id AND publisher_id = auth.uid()));

CREATE POLICY "创作者申请参与" ON public.brand_task_participants
    FOR INSERT TO public
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "创作者更新自己的参与" ON public.brand_task_participants
    FOR UPDATE TO public
    USING (creator_id = auth.uid());

-- 品牌任务作品提交表
ALTER TABLE public.brand_task_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "查看任务提交" ON public.brand_task_submissions
    FOR SELECT TO public
    USING (creator_id = auth.uid() OR 
           EXISTS (SELECT 1 FROM public.brand_tasks WHERE id = task_id AND publisher_id = auth.uid()));

CREATE POLICY "创作者提交作品" ON public.brand_task_submissions
    FOR INSERT TO public
    WITH CHECK (creator_id = auth.uid());

CREATE POLICY "创作者更新自己的提交" ON public.brand_task_submissions
    FOR UPDATE TO public
    USING (creator_id = auth.uid());

-- 品牌资金账户表
ALTER TABLE public.brand_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "查看自己的品牌账户" ON public.brand_accounts
    FOR SELECT TO public
    USING (user_id = auth.uid());

CREATE POLICY "管理自己的品牌账户" ON public.brand_accounts
    FOR ALL TO public
    USING (user_id = auth.uid());

-- 品牌资金流水表
ALTER TABLE public.brand_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "查看自己的交易记录" ON public.brand_transactions
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 品牌任务数据统计表
ALTER TABLE public.brand_task_analytics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "查看任务统计" ON public.brand_task_analytics
    FOR SELECT TO public
    USING (EXISTS (SELECT 1 FROM public.brand_tasks WHERE id = task_id AND publisher_id = auth.uid()));

-- 创作者收益结算表
ALTER TABLE public.creator_earnings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "查看自己的收益" ON public.creator_earnings
    FOR SELECT TO public
    USING (creator_id = auth.uid());

-- ==========================================================================
-- 触发器函数
-- ==========================================================================

-- 更新时间戳
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 品牌任务表更新触发器
DROP TRIGGER IF EXISTS update_brand_tasks_updated_at ON public.brand_tasks;
CREATE TRIGGER update_brand_tasks_updated_at
    BEFORE UPDATE ON public.brand_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 品牌账户表更新触发器
DROP TRIGGER IF EXISTS update_brand_accounts_updated_at ON public.brand_accounts;
CREATE TRIGGER update_brand_accounts_updated_at
    BEFORE UPDATE ON public.brand_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 品牌任务提交表更新触发器
DROP TRIGGER IF EXISTS update_brand_task_submissions_updated_at ON public.brand_task_submissions;
CREATE TRIGGER update_brand_task_submissions_updated_at
    BEFORE UPDATE ON public.brand_task_submissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创作者收益表更新触发器
DROP TRIGGER IF EXISTS update_creator_earnings_updated_at ON public.creator_earnings;
CREATE TRIGGER update_creator_earnings_updated_at
    BEFORE UPDATE ON public.creator_earnings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- 辅助函数
-- ==========================================================================

-- 计算作品激励金额
CREATE OR REPLACE FUNCTION calculate_work_reward(
    p_views INTEGER,
    p_likes INTEGER,
    p_favorites INTEGER,
    p_shares INTEGER,
    p_incentive_model JSONB
) RETURNS DECIMAL AS $$
DECLARE
    v_reward DECIMAL := 0;
    v_metrics JSONB;
    v_max_reward DECIMAL;
    v_min_reward DECIMAL;
BEGIN
    v_metrics := p_incentive_model->'metrics';
    v_max_reward := (p_incentive_model->>'max_reward_per_work')::DECIMAL;
    v_min_reward := (p_incentive_model->>'min_reward_per_work')::DECIMAL;
    
    -- 计算各项指标的奖励
    IF v_metrics ? 'views' THEN
        v_reward := v_reward + (p_views / 1000.0) * ((v_metrics->'views'->>'rate_per_1000')::DECIMAL);
    END IF;
    
    IF v_metrics ? 'likes' THEN
        v_reward := v_reward + p_likes * ((v_metrics->'likes'->>'rate_per')::DECIMAL);
    END IF;
    
    IF v_metrics ? 'favorites' THEN
        v_reward := v_reward + p_favorites * ((v_metrics->'favorites'->>'rate_per')::DECIMAL);
    END IF;
    
    IF v_metrics ? 'shares' THEN
        v_reward := v_reward + p_shares * ((v_metrics->'shares'->>'rate_per')::DECIMAL);
    END IF;
    
    -- 应用上下限
    IF v_max_reward IS NOT NULL THEN
        v_reward := LEAST(v_reward, v_max_reward);
    END IF;
    
    IF v_min_reward IS NOT NULL THEN
        v_reward := GREATEST(v_reward, v_min_reward);
    END IF;
    
    RETURN ROUND(v_reward, 2);
END;
$$ LANGUAGE plpgsql;

-- 获取品牌任务统计
CREATE OR REPLACE FUNCTION get_brand_task_stats(p_task_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_participants', COUNT(DISTINCT creator_id),
        'total_submissions', COUNT(*),
        'approved_submissions', COUNT(*) FILTER (WHERE status = 'approved'),
        'pending_submissions', COUNT(*) FILTER (WHERE status = 'pending'),
        'total_views', COALESCE(SUM(current_views), 0),
        'total_likes', COALESCE(SUM(current_likes), 0),
        'total_favorites', COALESCE(SUM(current_favorites), 0),
        'total_rewards', COALESCE(SUM(final_reward), 0)
    )
    INTO v_stats
    FROM public.brand_task_submissions
    WHERE task_id = p_task_id;
    
    RETURN v_stats;
END;
$$ LANGUAGE plpgsql;

-- ==========================================================================
-- 示例数据
-- ==========================================================================

-- 插入示例品牌任务（仅用于测试，实际使用时需要真实的brand_id和publisher_id）
-- INSERT INTO public.brand_tasks (
--     title, description, brand_name, publisher_id, 
--     required_tags, required_location, total_budget,
--     start_date, end_date, status
-- ) VALUES (
--     '海河品牌推广任务',
--     '发布带有"海河"标签的品牌相关作品至津脉广场',
--     '海河牛奶',
--     '00000000-0000-0000-0000-000000000000', -- 需要替换为真实用户ID
--     '["海河"]'::jsonb,
--     '津脉广场',
--     10000.00,
--     NOW(),
--     NOW() + INTERVAL '30 days',
--     'published'
-- );

-- 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
