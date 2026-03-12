-- ============================================
-- 津币会员体系数据库表创建脚本
-- ============================================

-- 1. 津币余额表
CREATE TABLE IF NOT EXISTS public.user_jinbi_balance (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    total_balance INTEGER NOT NULL DEFAULT 0,
    available_balance INTEGER NOT NULL DEFAULT 0,
    frozen_balance INTEGER NOT NULL DEFAULT 0,
    total_earned INTEGER NOT NULL DEFAULT 0,
    total_spent INTEGER NOT NULL DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- 2. 津币记录表
CREATE TABLE IF NOT EXISTS public.jinbi_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('grant', 'earn', 'spend', 'purchase', 'refund', 'expire')),
    source TEXT NOT NULL,
    source_type TEXT,
    description TEXT NOT NULL DEFAULT '',
    balance_after INTEGER NOT NULL,
    related_id UUID,
    related_type TEXT,
    expires_at TIMESTAMP WITH TIME ZONE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 津币消费明细表
CREATE TABLE IF NOT EXISTS public.jinbi_consumption_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    record_id UUID REFERENCES public.jinbi_records(id),
    service_type TEXT NOT NULL,
    service_params JSONB DEFAULT '{}',
    jinbi_cost INTEGER NOT NULL,
    actual_cost INTEGER NOT NULL,
    status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 津币套餐表
CREATE TABLE IF NOT EXISTS public.jinbi_packages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    jinbi_amount INTEGER NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'CNY',
    bonus_jinbi INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 会员津币配置表
CREATE TABLE IF NOT EXISTS public.membership_jinbi_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    level TEXT NOT NULL UNIQUE,
    monthly_grant INTEGER NOT NULL,
    daily_checkin_base INTEGER DEFAULT 50,
    daily_checkin_max INTEGER DEFAULT 200,
    concurrent_limit INTEGER NOT NULL,
    discount_rate DECIMAL(3,2) DEFAULT 1.00,
    storage_gb INTEGER,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 服务计费标准表
CREATE TABLE IF NOT EXISTS public.service_pricing (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    service_type TEXT NOT NULL,
    service_subtype TEXT,
    name TEXT NOT NULL,
    description TEXT,
    base_cost INTEGER NOT NULL,
    params JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================
-- 插入默认数据
-- ============================================

-- 津币套餐默认数据
INSERT INTO public.jinbi_packages (name, description, jinbi_amount, price, bonus_jinbi, sort_order) VALUES
('小额充值', '适合轻度用户', 500, 5.00, 0, 1),
('标准充值', '性价比之选', 1100, 10.00, 100, 2),
('大额充值', '赠送100津币', 2600, 20.00, 100, 3),
('超值充值', '赠送400津币', 5400, 50.00, 400, 4),
('至尊充值', '赠送1500津币', 11500, 100.00, 1500, 5)
ON CONFLICT DO NOTHING;

-- 会员津币配置默认数据
INSERT INTO public.membership_jinbi_config 
(level, monthly_grant, daily_checkin_base, daily_checkin_max, concurrent_limit, discount_rate, storage_gb) VALUES
('free', 0, 10, 50, 1, 1.00, 1),
('base', 1000, 50, 200, 3, 0.95, 10),
('pro', 3000, 50, 200, 5, 0.90, 50),
('star', 8000, 50, 200, 10, 0.85, 200),
('vip', 20000, 50, 200, 20, 0.80, NULL)
ON CONFLICT DO NOTHING;

-- 服务计费标准默认数据
INSERT INTO public.service_pricing (service_type, service_subtype, name, description, base_cost, params, sort_order) VALUES
('agent_chat', NULL, 'Agent对话', '津小脉Agent每轮对话', 10, '{}', 1),
('image_gen', 'standard', '标准图像', '1024x1024标准图像生成', 50, '{"width": 1024, "height": 1024}', 1),
('image_gen', 'hd', '高清图像', '2048x2048高清图像生成', 100, '{"width": 2048, "height": 2048}', 2),
('image_gen', 'ultra', '超清图像', '4096x4096超清图像生成', 200, '{"width": 4096, "height": 4096}', 3),
('video_gen', '5s_720p', '5秒视频720p', '5秒720p视频生成', 200, '{"duration": 5, "resolution": "720p"}', 1),
('video_gen', '10s_1080p', '10秒视频1080p', '10秒1080p视频生成', 400, '{"duration": 10, "resolution": "1080p"}', 2),
('video_gen', '30s_1080p', '30秒视频1080p', '30秒1080p视频生成', 1000, '{"duration": 30, "resolution": "1080p"}', 3),
('text_gen', NULL, '文案生成', 'AI文案生成', 20, '{}', 1),
('audio_gen', NULL, '音频生成', '30秒内音频生成', 100, '{"max_duration": 30}', 1),
('export', 'hd', '高清导出', '高清无水印导出', 50, '{"resolution": "1080p"}', 1),
('export', '4k', '4K导出', '4K超清导出', 100, '{"resolution": "4K"}', 2)
ON CONFLICT DO NOTHING;

-- ============================================
-- 启用 RLS
-- ============================================

ALTER TABLE public.user_jinbi_balance ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jinbi_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jinbi_consumption_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jinbi_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.membership_jinbi_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_pricing ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 创建 RLS 策略
-- ============================================

-- user_jinbi_balance 策略
CREATE POLICY "Users can view own jinbi balance" ON public.user_jinbi_balance
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all jinbi balance" ON public.user_jinbi_balance
    FOR ALL USING (true) WITH CHECK (true);

-- jinbi_records 策略
CREATE POLICY "Users can view own jinbi records" ON public.jinbi_records
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all jinbi records" ON public.jinbi_records
    FOR ALL USING (true) WITH CHECK (true);

-- jinbi_consumption_details 策略
CREATE POLICY "Users can view own consumption details" ON public.jinbi_consumption_details
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Service role can manage all consumption details" ON public.jinbi_consumption_details
    FOR ALL USING (true) WITH CHECK (true);

-- jinbi_packages 策略 (所有人可读)
CREATE POLICY "Anyone can view active jinbi packages" ON public.jinbi_packages
    FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage jinbi packages" ON public.jinbi_packages
    FOR ALL USING (true) WITH CHECK (true);

-- membership_jinbi_config 策略 (所有人可读)
CREATE POLICY "Anyone can view membership jinbi config" ON public.membership_jinbi_config
    FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage membership jinbi config" ON public.membership_jinbi_config
    FOR ALL USING (true) WITH CHECK (true);

-- service_pricing 策略 (所有人可读)
CREATE POLICY "Anyone can view active service pricing" ON public.service_pricing
    FOR SELECT USING (is_active = true);
CREATE POLICY "Service role can manage service pricing" ON public.service_pricing
    FOR ALL USING (true) WITH CHECK (true);

-- ============================================
-- 授予权限
-- ============================================

GRANT ALL ON public.user_jinbi_balance TO anon, authenticated, service_role;
GRANT ALL ON public.jinbi_records TO anon, authenticated, service_role;
GRANT ALL ON public.jinbi_consumption_details TO anon, authenticated, service_role;
GRANT ALL ON public.jinbi_packages TO anon, authenticated, service_role;
GRANT ALL ON public.membership_jinbi_config TO anon, authenticated, service_role;
GRANT ALL ON public.service_pricing TO anon, authenticated, service_role;

-- ============================================
-- 创建索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_jinbi_records_user_id ON public.jinbi_records(user_id);
CREATE INDEX IF NOT EXISTS idx_jinbi_records_created_at ON public.jinbi_records(created_at);
CREATE INDEX IF NOT EXISTS idx_jinbi_records_type ON public.jinbi_records(type);
CREATE INDEX IF NOT EXISTS idx_jinbi_consumption_details_user_id ON public.jinbi_consumption_details(user_id);
CREATE INDEX IF NOT EXISTS idx_jinbi_consumption_details_service_type ON public.jinbi_consumption_details(service_type);

-- ============================================
-- 修改现有表添加津币字段
-- ============================================

-- 修改 users 表
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS jinbi_balance INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_jinbi_earned INTEGER DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS total_jinbi_spent INTEGER DEFAULT 0;

-- 修改 membership_orders 表
ALTER TABLE public.membership_orders ADD COLUMN IF NOT EXISTS jinbi_granted INTEGER DEFAULT 0;
ALTER TABLE public.membership_orders ADD COLUMN IF NOT EXISTS jinbi_bonus INTEGER DEFAULT 0;
ALTER TABLE public.membership_orders ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT NULL;
ALTER TABLE public.membership_orders ADD COLUMN IF NOT EXISTS payment_data JSONB DEFAULT NULL;

SELECT '津币系统表创建成功' as status;
