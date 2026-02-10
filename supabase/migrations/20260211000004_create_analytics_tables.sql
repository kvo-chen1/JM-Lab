-- 创建用户设备统计表
-- 用于记录用户访问设备信息
CREATE TABLE IF NOT EXISTS public.user_devices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    device_type TEXT NOT NULL CHECK (device_type IN ('desktop', 'mobile', 'tablet')),
    user_agent TEXT,
    ip_address TEXT,
    first_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    visit_count INTEGER DEFAULT 1
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_devices_user_id ON public.user_devices(user_id);
CREATE INDEX IF NOT EXISTS idx_user_devices_type ON public.user_devices(device_type);
CREATE INDEX IF NOT EXISTS idx_user_devices_first_seen ON public.user_devices(first_seen_at);

-- 启用 RLS
ALTER TABLE public.user_devices ENABLE ROW LEVEL SECURITY;

-- RLS 策略：只有管理员可以查看设备统计
CREATE POLICY "Only admins can view device stats" ON public.user_devices
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- 创建流量来源统计表
CREATE TABLE IF NOT EXISTS public.traffic_sources (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE,
    source_type TEXT NOT NULL CHECK (source_type IN ('direct', 'search', 'social', 'referral')),
    source_detail TEXT, -- 具体来源，如百度、微信、微博等
    landing_page TEXT,
    referrer_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_traffic_sources_user_id ON public.traffic_sources(user_id);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_type ON public.traffic_sources(source_type);
CREATE INDEX IF NOT EXISTS idx_traffic_sources_created_at ON public.traffic_sources(created_at);

-- 启用 RLS
ALTER TABLE public.traffic_sources ENABLE ROW LEVEL SECURITY;

-- RLS 策略：只有管理员可以查看流量来源
CREATE POLICY "Only admins can view traffic sources" ON public.traffic_sources
    FOR SELECT
    USING (auth.jwt() ->> 'role' = 'admin');

-- 创建函数：记录用户设备信息
CREATE OR REPLACE FUNCTION public.log_user_device(
    p_user_id UUID,
    p_device_type TEXT,
    p_user_agent TEXT DEFAULT NULL,
    p_ip_address TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- 尝试更新现有记录
    UPDATE public.user_devices
    SET 
        last_seen_at = NOW(),
        visit_count = visit_count + 1
    WHERE user_id = p_user_id AND device_type = p_device_type;
    
    -- 如果没有找到记录，插入新记录
    IF NOT FOUND THEN
        INSERT INTO public.user_devices (user_id, device_type, user_agent, ip_address)
        VALUES (p_user_id, p_device_type, p_user_agent, p_ip_address);
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：记录流量来源
CREATE OR REPLACE FUNCTION public.log_traffic_source(
    p_user_id UUID,
    p_source_type TEXT,
    p_source_detail TEXT DEFAULT NULL,
    p_landing_page TEXT DEFAULT NULL,
    p_referrer_url TEXT DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.traffic_sources (user_id, source_type, source_detail, landing_page, referrer_url)
    VALUES (p_user_id, p_source_type, p_source_detail, p_landing_page, p_referrer_url);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：获取设备分布统计
CREATE OR REPLACE FUNCTION public.get_device_distribution(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    device_type TEXT,
    user_count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH device_stats AS (
        SELECT 
            ud.device_type,
            COUNT(DISTINCT ud.user_id) as user_count
        FROM public.user_devices ud
        WHERE (p_start_date IS NULL OR ud.first_seen_at >= p_start_date)
          AND (p_end_date IS NULL OR ud.first_seen_at <= p_end_date)
        GROUP BY ud.device_type
    ),
    total AS (
        SELECT SUM(user_count) as total_count FROM device_stats
    )
    SELECT 
        ds.device_type,
        ds.user_count,
        CASE 
            WHEN t.total_count > 0 THEN ROUND((ds.user_count::NUMERIC / t.total_count) * 100, 2)
            ELSE 0
        END as percentage
    FROM device_stats ds, total t
    ORDER BY ds.user_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：获取流量来源统计
CREATE OR REPLACE FUNCTION public.get_traffic_source_distribution(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    source_type TEXT,
    visit_count BIGINT,
    percentage NUMERIC
) AS $$
BEGIN
    RETURN QUERY
    WITH source_stats AS (
        SELECT 
            ts.source_type,
            COUNT(*) as visit_count
        FROM public.traffic_sources ts
        WHERE (p_start_date IS NULL OR ts.created_at >= p_start_date)
          AND (p_end_date IS NULL OR ts.created_at <= p_end_date)
        GROUP BY ts.source_type
    ),
    total AS (
        SELECT SUM(visit_count) as total_count FROM source_stats
    )
    SELECT 
        ss.source_type,
        ss.visit_count,
        CASE 
            WHEN t.total_count > 0 THEN ROUND((ss.visit_count::NUMERIC / t.total_count) * 100, 2)
            ELSE 0
        END as percentage
    FROM source_stats ss, total t
    ORDER BY ss.visit_count DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON TABLE public.user_devices IS '用户设备信息表，用于统计设备分布';
COMMENT ON TABLE public.traffic_sources IS '流量来源表，用于统计用户访问来源';
