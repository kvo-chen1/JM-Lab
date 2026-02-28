-- 创建创作者变现相关表
-- 用于存储创作者收入、任务、商单等数据

-- 1. 创作者收入表
CREATE TABLE IF NOT EXISTS public.creator_revenue (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    total_revenue DECIMAL(12, 2) DEFAULT 0,
    monthly_revenue DECIMAL(12, 2) DEFAULT 0,
    pending_revenue DECIMAL(12, 2) DEFAULT 0,
    withdrawable_revenue DECIMAL(12, 2) DEFAULT 0,
    total_withdrawn DECIMAL(12, 2) DEFAULT 0,
    last_month_revenue DECIMAL(12, 2) DEFAULT 0,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. 收入明细表
CREATE TABLE IF NOT EXISTS public.revenue_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('ads', 'sponsorship', 'tipping', 'membership', 'task', 'withdrawal')),
    description TEXT,
    status TEXT NOT NULL DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'cancelled')),
    work_id UUID REFERENCES public.works(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. 品牌任务表
CREATE TABLE IF NOT EXISTS public.business_tasks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    brand_logo TEXT,
    budget_min DECIMAL(10, 2) NOT NULL,
    budget_max DECIMAL(10, 2) NOT NULL,
    deadline TIMESTAMPTZ NOT NULL,
    requirements JSONB DEFAULT '[]'::jsonb,
    tags JSONB DEFAULT '[]'::jsonb,
    type TEXT NOT NULL CHECK (type IN ('design', 'illustration', 'video', 'writing', 'photography', 'other')),
    status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed', 'completed')),
    max_participants INTEGER DEFAULT 1,
    current_participants INTEGER DEFAULT 0,
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. 创作者任务申请/参与表
CREATE TABLE IF NOT EXISTS public.creator_task_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_id UUID NOT NULL REFERENCES public.business_tasks(id) ON DELETE CASCADE,
    creator_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'applied' CHECK (status IN ('applied', 'accepted', 'rejected', 'completed', 'cancelled')),
    deliverables JSONB DEFAULT '[]'::jsonb,
    earnings DECIMAL(10, 2) DEFAULT 0,
    applied_at TIMESTAMPTZ DEFAULT NOW(),
    accepted_at TIMESTAMPTZ,
    completed_at TIMESTAMPTZ,
    UNIQUE(task_id, creator_id)
);

-- 5. 提现记录表
CREATE TABLE IF NOT EXISTS public.withdrawal_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    amount DECIMAL(12, 2) NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'rejected')),
    payment_method TEXT,
    payment_account TEXT,
    processed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_creator_revenue_user ON public.creator_revenue(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_records_user ON public.revenue_records(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_records_type ON public.revenue_records(type);
CREATE INDEX IF NOT EXISTS idx_revenue_records_created ON public.revenue_records(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_business_tasks_status ON public.business_tasks(status);
CREATE INDEX IF NOT EXISTS idx_business_tasks_type ON public.business_tasks(type);
CREATE INDEX IF NOT EXISTS idx_business_tasks_created ON public.business_tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_task_applications_creator ON public.creator_task_applications(creator_id);
CREATE INDEX IF NOT EXISTS idx_task_applications_task ON public.creator_task_applications(task_id);
CREATE INDEX IF NOT EXISTS idx_withdrawal_records_user ON public.withdrawal_records(user_id);

-- 启用 RLS
ALTER TABLE public.creator_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.revenue_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.business_tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.creator_task_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.withdrawal_records ENABLE ROW LEVEL SECURITY;

-- RLS 策略
-- 创作者收入表：用户只能看到自己的数据
CREATE POLICY "用户查看自己的收入" ON public.creator_revenue
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 收入明细表：用户只能看到自己的记录
CREATE POLICY "用户查看自己的收入明细" ON public.revenue_records
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 品牌任务表：任何人可以查看开放的任务
CREATE POLICY "查看开放品牌任务" ON public.business_tasks
    FOR SELECT TO public
    USING (status = 'open');

-- 任务申请表：用户查看自己的申请
CREATE POLICY "用户查看自己的任务申请" ON public.creator_task_applications
    FOR SELECT TO public
    USING (creator_id = auth.uid());

-- 用户可以申请任务
CREATE POLICY "用户申请任务" ON public.creator_task_applications
    FOR INSERT TO public
    WITH CHECK (creator_id = auth.uid());

-- 提现记录表：用户查看自己的提现记录
CREATE POLICY "用户查看自己的提现记录" ON public.withdrawal_records
    FOR SELECT TO public
    USING (user_id = auth.uid());

-- 用户可以创建提现申请
CREATE POLICY "用户创建提现申请" ON public.withdrawal_records
    FOR INSERT TO public
    WITH CHECK (user_id = auth.uid());

-- 创建更新时间触发器
DROP TRIGGER IF EXISTS update_business_tasks_updated_at ON public.business_tasks;
CREATE TRIGGER update_business_tasks_updated_at
    BEFORE UPDATE ON public.business_tasks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 插入示例商单任务
INSERT INTO public.business_tasks (title, description, brand_name, budget_min, budget_max, deadline, requirements, tags, type, status)
VALUES 
    ('天津海河文化宣传海报设计', '为天津海河文化设计系列宣传海报，展现津门文化魅力', '天津文旅集团', 3000, 5000, NOW() + INTERVAL '7 days', '["原创设计", "津门文化元素", "商业授权"]', '["设计创作", "可接单"]', 'design', 'open'),
    ('传统美食插画系列', '创作8张传统美食插画，用于品牌宣传', '老字号品牌联盟', 5000, 8000, NOW() + INTERVAL '14 days', '["8张插画", "传统风格", "可商用"]', '["插画创作", "可接单"]', 'illustration', 'open'),
    ('产品宣传短视频制作', '制作30秒产品宣传短视频', '创意科技公司', 2000, 3500, NOW() + INTERVAL '5 days', '["30秒视频", "产品展示", "配乐"]', '["视频创作", "可接单"]', 'video', 'open')
ON CONFLICT DO NOTHING;

-- 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
