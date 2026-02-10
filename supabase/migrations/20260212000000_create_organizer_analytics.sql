-- ============================================
-- 主办方数据分析系统数据库迁移
-- ============================================

-- 1. 创建活动每日统计表
CREATE TABLE IF NOT EXISTS public.event_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    submissions_count INTEGER DEFAULT 0,
    views_count INTEGER DEFAULT 0,
    likes_count INTEGER DEFAULT 0,
    comments_count INTEGER DEFAULT 0,
    unique_visitors INTEGER DEFAULT 0,
    avg_score DECIMAL(5,2),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, stat_date)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_daily_stats_event_id ON public.event_daily_stats(event_id);
CREATE INDEX IF NOT EXISTS idx_event_daily_stats_date ON public.event_daily_stats(stat_date);

-- 2. 创建作品表现统计表
CREATE TABLE IF NOT EXISTS public.work_performance_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    view_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    comment_count INTEGER DEFAULT 0,
    share_count INTEGER DEFAULT 0,
    avg_score DECIMAL(5,2),
    score_count INTEGER DEFAULT 0,
    engagement_rate DECIMAL(5,2) GENERATED ALWAYS AS (
        CASE 
            WHEN view_count > 0 THEN ROUND(((like_count + comment_count)::DECIMAL / view_count) * 100, 2)
            ELSE 0
        END
    ) STORED,
    ranking INTEGER,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_work_performance_stats_event ON public.work_performance_stats(event_id);
CREATE INDEX IF NOT EXISTS idx_work_performance_stats_ranking ON public.work_performance_stats(ranking);
CREATE INDEX IF NOT EXISTS idx_work_performance_stats_engagement ON public.work_performance_stats(engagement_rate DESC);

-- 3. 创建实时活动日志表
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action_type TEXT NOT NULL CHECK (action_type IN ('submission', 'view', 'like', 'comment', 'share', 'score', 'publish')),
    target_id UUID, -- 关联的作品ID或其他目标ID
    target_type TEXT, -- 目标类型：submission, work等
    metadata JSONB, -- 额外信息
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_activity_logs_event ON public.activity_logs(event_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created ON public.activity_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_logs_action ON public.activity_logs(action_type);

-- 4. 启用 RLS
ALTER TABLE public.event_daily_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.work_performance_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- 5. RLS 策略
-- event_daily_stats 表策略
CREATE POLICY "Organizers can view own event stats" ON public.event_daily_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_daily_stats.event_id
            AND e.organizer_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- work_performance_stats 表策略
CREATE POLICY "Organizers can view own work stats" ON public.work_performance_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = work_performance_stats.event_id
            AND e.organizer_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- activity_logs 表策略
CREATE POLICY "Organizers can view own activity logs" ON public.activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = activity_logs.event_id
            AND e.organizer_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = auth.uid()
            AND ur.role = 'admin'
        )
    );

-- 6. 创建触发器函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS update_event_daily_stats_updated_at ON public.event_daily_stats;
CREATE TRIGGER update_event_daily_stats_updated_at
    BEFORE UPDATE ON public.event_daily_stats
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7. 创建函数：获取主办方概览统计数据
CREATE OR REPLACE FUNCTION public.get_organizer_dashboard_stats(
    p_organizer_id UUID,
    p_start_date DATE DEFAULT NULL,
    p_end_date DATE DEFAULT NULL
)
RETURNS TABLE (
    total_events BIGINT,
    total_submissions BIGINT,
    total_views BIGINT,
    total_likes BIGINT,
    total_comments BIGINT,
    avg_score DECIMAL(5,2),
    published_works BIGINT,
    pending_review BIGINT,
    daily_submissions JSONB,
    top_works JSONB
) AS $$
BEGIN
    -- 设置默认日期范围（最近30天）
    IF p_start_date IS NULL THEN
        p_start_date := CURRENT_DATE - INTERVAL '30 days';
    END IF;
    IF p_end_date IS NULL THEN
        p_end_date := CURRENT_DATE;
    END IF;

    RETURN QUERY
    WITH organizer_events AS (
        SELECT e.id as event_id
        FROM public.events e
        WHERE e.organizer_id = p_organizer_id
    ),
    stats AS (
        SELECT 
            COUNT(DISTINCT oe.event_id) as total_events,
            COUNT(DISTINCT es.id) as total_submissions,
            COALESCE(SUM(wps.view_count), 0) as total_views,
            COALESCE(SUM(wps.like_count), 0) as total_likes,
            COALESCE(SUM(wps.comment_count), 0) as total_comments,
            AVG(wps.avg_score)::DECIMAL(5,2) as avg_score,
            COUNT(DISTINCT CASE WHEN es.is_published THEN es.id END) as published_works,
            COUNT(DISTINCT CASE WHEN NOT es.is_published AND es.score IS NOT NULL THEN es.id END) as pending_review
        FROM organizer_events oe
        LEFT JOIN public.event_submissions es ON oe.event_id = es.event_id
        LEFT JOIN public.work_performance_stats wps ON es.id = wps.submission_id
    ),
    daily_stats AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'date', eds.stat_date,
                'count', eds.submissions_count
            ) ORDER BY eds.stat_date
        ) as daily_data
        FROM public.event_daily_stats eds
        JOIN organizer_events oe ON eds.event_id = oe.event_id
        WHERE eds.stat_date BETWEEN p_start_date AND p_end_date
    ),
    top_works_data AS (
        SELECT jsonb_agg(
            jsonb_build_object(
                'id', es.id,
                'title', es.title,
                'views', wps.view_count,
                'likes', wps.like_count,
                'score', wps.avg_score
            ) ORDER BY wps.view_count DESC
        ) as works_data
        FROM public.event_submissions es
        JOIN public.work_performance_stats wps ON es.id = wps.submission_id
        JOIN organizer_events oe ON es.event_id = oe.event_id
        LIMIT 5
    )
    SELECT 
        s.total_events,
        s.total_submissions,
        s.total_views,
        s.total_likes,
        s.total_comments,
        s.avg_score,
        s.published_works,
        s.pending_review,
        COALESCE(ds.daily_data, '[]'::jsonb) as daily_submissions,
        COALESCE(tw.works_data, '[]'::jsonb) as top_works
    FROM stats s
    CROSS JOIN daily_stats ds
    CROSS JOIN top_works_data tw;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 创建函数：获取作品趋势数据
CREATE OR REPLACE FUNCTION public.get_works_trend(
    p_organizer_id UUID,
    p_event_id UUID DEFAULT NULL,
    p_days INTEGER DEFAULT 30
)
RETURNS TABLE (
    stat_date DATE,
    submissions_count BIGINT,
    views_count BIGINT,
    likes_count BIGINT,
    comments_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    WITH date_series AS (
        SELECT generate_series(
            CURRENT_DATE - (p_days - 1) * INTERVAL '1 day',
            CURRENT_DATE,
            INTERVAL '1 day'
        )::DATE as date_val
    ),
    organizer_events AS (
        SELECT e.id as event_id
        FROM public.events e
        WHERE e.organizer_id = p_organizer_id
        AND (p_event_id IS NULL OR e.id = p_event_id)
    )
    SELECT 
        ds.date_val as stat_date,
        COALESCE(SUM(eds.submissions_count), 0) as submissions_count,
        COALESCE(SUM(eds.views_count), 0) as views_count,
        COALESCE(SUM(eds.likes_count), 0) as likes_count,
        COALESCE(SUM(eds.comments_count), 0) as comments_count
    FROM date_series ds
    LEFT JOIN public.event_daily_stats eds ON ds.date_val = eds.stat_date
    LEFT JOIN organizer_events oe ON eds.event_id = oe.event_id
    GROUP BY ds.date_val
    ORDER BY ds.date_val;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. 创建函数：获取评分分布数据
CREATE OR REPLACE FUNCTION public.get_score_distribution(
    p_organizer_id UUID,
    p_event_id UUID DEFAULT NULL
)
RETURNS TABLE (
    score_range TEXT,
    count BIGINT,
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH organizer_events AS (
        SELECT e.id as event_id
        FROM public.events e
        WHERE e.organizer_id = p_organizer_id
        AND (p_event_id IS NULL OR e.id = p_event_id)
    ),
    scored_submissions AS (
        SELECT 
            es.id,
            CASE 
                WHEN wps.avg_score >= 9 THEN '9-10分 (优秀)'
                WHEN wps.avg_score >= 7 THEN '7-8分 (良好)'
                WHEN wps.avg_score >= 5 THEN '5-6分 (一般)'
                WHEN wps.avg_score >= 3 THEN '3-4分 (较差)'
                ELSE '0-2分 (差)'
            END as score_range
        FROM public.event_submissions es
        JOIN public.work_performance_stats wps ON es.id = wps.submission_id
        JOIN organizer_events oe ON es.event_id = oe.event_id
        WHERE wps.avg_score IS NOT NULL
    ),
    distribution AS (
        SELECT 
            ss.score_range,
            COUNT(*) as count
        FROM scored_submissions ss
        GROUP BY ss.score_range
    ),
    total AS (
        SELECT SUM(d.count) as total_count FROM distribution d
    )
    SELECT 
        d.score_range,
        d.count,
        CASE 
            WHEN t.total_count > 0 THEN ROUND((d.count::DECIMAL / t.total_count) * 100, 2)
            ELSE 0
        END as percentage
    FROM distribution d
    CROSS JOIN total t
    ORDER BY d.score_range;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 创建函数：获取热门作品排行
CREATE OR REPLACE FUNCTION public.get_top_works(
    p_organizer_id UUID,
    p_event_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 10,
    p_sort_by TEXT DEFAULT 'views'
)
RETURNS TABLE (
    work_id UUID,
    title TEXT,
    creator_name TEXT,
    views BIGINT,
    likes BIGINT,
    comments BIGINT,
    score DECIMAL(5,2),
    engagement_rate DECIMAL(5,2),
    submitted_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    WITH organizer_events AS (
        SELECT e.id as event_id
        FROM public.events e
        WHERE e.organizer_id = p_organizer_id
        AND (p_event_id IS NULL OR e.id = p_event_id)
    )
    SELECT 
        es.id as work_id,
        es.title,
        u.raw_user_meta_data->>'username' as creator_name,
        wps.view_count as views,
        wps.like_count as likes,
        wps.comment_count as comments,
        wps.avg_score as score,
        wps.engagement_rate,
        es.created_at as submitted_at
    FROM public.event_submissions es
    JOIN public.work_performance_stats wps ON es.id = wps.submission_id
    JOIN organizer_events oe ON es.event_id = oe.event_id
    JOIN auth.users u ON es.user_id = u.id
    ORDER BY 
        CASE p_sort_by
            WHEN 'views' THEN wps.view_count
            WHEN 'likes' THEN wps.like_count
            WHEN 'score' THEN wps.avg_score::BIGINT
            WHEN 'engagement' THEN wps.engagement_rate::BIGINT
            ELSE wps.view_count
        END DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. 创建函数：获取实时活动流
CREATE OR REPLACE FUNCTION public.get_recent_activities(
    p_organizer_id UUID,
    p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
    activity_id UUID,
    action_type TEXT,
    user_name TEXT,
    user_avatar TEXT,
    target_title TEXT,
    target_type TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id as activity_id,
        al.action_type,
        u.raw_user_meta_data->>'username' as user_name,
        u.raw_user_meta_data->>'avatar_url' as user_avatar,
        COALESCE(es.title, e.title) as target_title,
        al.target_type,
        al.metadata,
        al.created_at
    FROM public.activity_logs al
    JOIN public.events e ON al.event_id = e.id
    LEFT JOIN public.event_submissions es ON al.target_id = es.id
    JOIN auth.users u ON al.user_id = u.id
    WHERE e.organizer_id = p_organizer_id
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. 创建函数：记录活动日志
CREATE OR REPLACE FUNCTION public.log_activity(
    p_event_id UUID,
    p_user_id UUID,
    p_action_type TEXT,
    p_target_id UUID DEFAULT NULL,
    p_target_type TEXT DEFAULT NULL,
    p_metadata JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.activity_logs (event_id, user_id, action_type, target_id, target_type, metadata)
    VALUES (p_event_id, p_user_id, p_action_type, p_target_id, p_target_type, p_metadata);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 13. 创建视图：主办方活动汇总
CREATE OR REPLACE VIEW public.organizer_event_summary AS
SELECT 
    e.id as event_id,
    e.title as event_title,
    e.organizer_id,
    e.status,
    e.start_date,
    e.end_date,
    COUNT(DISTINCT es.id) as total_submissions,
    COUNT(DISTINCT CASE WHEN es.is_published THEN es.id END) as published_count,
    AVG(wps.avg_score)::DECIMAL(5,2) as avg_score,
    SUM(wps.view_count) as total_views,
    SUM(wps.like_count) as total_likes,
    MAX(e.created_at) as created_at
FROM public.events e
LEFT JOIN public.event_submissions es ON e.id = es.event_id
LEFT JOIN public.work_performance_stats wps ON es.id = wps.submission_id
GROUP BY e.id, e.title, e.organizer_id, e.status, e.start_date, e.end_date;

-- 添加注释
COMMENT ON TABLE public.event_daily_stats IS '活动每日统计数据';
COMMENT ON TABLE public.work_performance_stats IS '作品表现统计表';
COMMENT ON TABLE public.activity_logs IS '实时活动日志表';
