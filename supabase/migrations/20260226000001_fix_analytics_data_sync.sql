-- ============================================
-- 修复数据分析数据同步问题
-- 创建触发器自动同步统计数据到 work_performance_stats 表
-- ============================================

-- 1. 首先确保 work_performance_stats 表存在
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

-- 启用 RLS
ALTER TABLE public.work_performance_stats ENABLE ROW LEVEL SECURITY;

-- RLS 策略
DROP POLICY IF EXISTS "Organizers can view own work stats" ON public.work_performance_stats;
CREATE POLICY "Organizers can view own work stats" ON public.work_performance_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = work_performance_stats.event_id
            AND e.organizer_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- 2. 确保 event_daily_stats 表存在
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

-- 启用 RLS
ALTER TABLE public.event_daily_stats ENABLE ROW LEVEL SECURITY;

-- RLS 策略
DROP POLICY IF EXISTS "Organizers can view own event stats" ON public.event_daily_stats;
CREATE POLICY "Organizers can view own event stats" ON public.event_daily_stats
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = event_daily_stats.event_id
            AND e.organizer_id = auth.uid()
        )
        OR
        EXISTS (
            SELECT 1 FROM public.users u
            WHERE u.id = auth.uid()
            AND u.role = 'admin'
        )
    );

-- 3. 创建触发器函数：当作品提交创建时，自动创建性能统计记录
CREATE OR REPLACE FUNCTION public.sync_submission_to_performance_stats()
RETURNS TRIGGER AS $$
BEGIN
    -- 插入或更新 work_performance_stats 记录
    INSERT INTO public.work_performance_stats (
        submission_id,
        event_id,
        view_count,
        like_count,
        comment_count,
        share_count,
        avg_score,
        score_count,
        last_updated
    ) VALUES (
        NEW.id,
        NEW.event_id,
        0,
        COALESCE(NEW.like_count, 0),
        0,
        COALESCE(NEW.vote_count, 0),
        COALESCE(NEW.score, 0),
        CASE WHEN NEW.score IS NOT NULL THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (submission_id) 
    DO UPDATE SET
        event_id = EXCLUDED.event_id,
        like_count = EXCLUDED.like_count,
        share_count = EXCLUDED.share_count,
        avg_score = EXCLUDED.avg_score,
        score_count = EXCLUDED.score_count,
        last_updated = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器：在插入或更新 event_submissions 时同步
DROP TRIGGER IF EXISTS trg_sync_submission_stats ON public.event_submissions;
CREATE TRIGGER trg_sync_submission_stats
    AFTER INSERT OR UPDATE ON public.event_submissions
    FOR EACH ROW EXECUTE FUNCTION public.sync_submission_to_performance_stats();

-- 4. 创建触发器函数：当点赞数变化时同步
CREATE OR REPLACE FUNCTION public.sync_like_to_performance_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 更新 work_performance_stats 的 like_count
        UPDATE public.work_performance_stats
        SET like_count = like_count + 1,
            last_updated = NOW()
        WHERE submission_id = NEW.submission_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.work_performance_stats
        SET like_count = GREATEST(like_count - 1, 0),
            last_updated = NOW()
        WHERE submission_id = OLD.submission_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_sync_likes_to_stats ON public.submission_likes;
CREATE TRIGGER trg_sync_likes_to_stats
    AFTER INSERT OR DELETE ON public.submission_likes
    FOR EACH ROW EXECUTE FUNCTION public.sync_like_to_performance_stats();

-- 5. 创建触发器函数：当投票数变化时同步（投票视为分享/互动）
CREATE OR REPLACE FUNCTION public.sync_vote_to_performance_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.work_performance_stats
        SET share_count = share_count + 1,
            last_updated = NOW()
        WHERE submission_id = NEW.submission_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.work_performance_stats
        SET share_count = GREATEST(share_count - 1, 0),
            last_updated = NOW()
        WHERE submission_id = OLD.submission_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_sync_votes_to_stats ON public.submission_votes;
CREATE TRIGGER trg_sync_votes_to_stats
    AFTER INSERT OR DELETE ON public.submission_votes
    FOR EACH ROW EXECUTE FUNCTION public.sync_vote_to_performance_stats();

-- 6. 创建触发器函数：当评分变化时同步
CREATE OR REPLACE FUNCTION public.sync_rating_to_performance_stats()
RETURNS TRIGGER AS $$
DECLARE
    v_avg_score DECIMAL(5,2);
    v_score_count INTEGER;
BEGIN
    -- 计算新的平均分和评分数量
    SELECT AVG(rating)::DECIMAL(5,2), COUNT(*)
    INTO v_avg_score, v_score_count
    FROM public.submission_ratings
    WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id);
    
    UPDATE public.work_performance_stats
    SET avg_score = COALESCE(v_avg_score, 0),
        score_count = COALESCE(v_score_count, 0),
        last_updated = NOW()
    WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id);
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_sync_ratings_to_stats ON public.submission_ratings;
CREATE TRIGGER trg_sync_ratings_to_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.submission_ratings
    FOR EACH ROW EXECUTE FUNCTION public.sync_rating_to_performance_stats();

-- 7. 创建函数：手动同步所有现有数据（用于初始化）
CREATE OR REPLACE FUNCTION public.sync_all_submissions_to_stats()
RETURNS VOID AS $$
BEGIN
    -- 插入所有现有提交作品的统计记录
    INSERT INTO public.work_performance_stats (
        submission_id,
        event_id,
        view_count,
        like_count,
        comment_count,
        share_count,
        avg_score,
        score_count,
        last_updated
    )
    SELECT 
        es.id,
        es.event_id,
        0, -- view_count 默认为0，后续可以通过其他方式统计
        COALESCE(es.like_count, 0),
        0, -- comment_count
        COALESCE(es.vote_count, 0),
        COALESCE(es.score, 0),
        CASE WHEN es.score IS NOT NULL THEN 1 ELSE 0 END,
        NOW()
    FROM public.event_submissions es
    ON CONFLICT (submission_id) 
    DO UPDATE SET
        event_id = EXCLUDED.event_id,
        like_count = EXCLUDED.like_count,
        share_count = EXCLUDED.share_count,
        avg_score = EXCLUDED.avg_score,
        score_count = EXCLUDED.score_count,
        last_updated = NOW();
    
    -- 更新评分数据
    UPDATE public.work_performance_stats wps
    SET 
        avg_score = COALESCE((
            SELECT AVG(rating)::DECIMAL(5,2)
            FROM public.submission_ratings sr
            WHERE sr.submission_id = wps.submission_id
        ), 0),
        score_count = COALESCE((
            SELECT COUNT(*)
            FROM public.submission_ratings sr
            WHERE sr.submission_id = wps.submission_id
        ), 0)
    WHERE EXISTS (
        SELECT 1 FROM public.submission_ratings sr 
        WHERE sr.submission_id = wps.submission_id
    );
    
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. 执行同步，初始化现有数据
SELECT public.sync_all_submissions_to_stats();

-- 9. 创建函数：更新事件每日统计（可以通过定时任务调用）
CREATE OR REPLACE FUNCTION public.update_event_daily_stats(
    p_event_id UUID DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
    -- 插入或更新每日统计
    INSERT INTO public.event_daily_stats (
        event_id,
        stat_date,
        submissions_count,
        views_count,
        likes_count,
        comments_count
    )
    SELECT 
        es.event_id,
        CURRENT_DATE,
        COUNT(DISTINCT es.id),
        0, -- views 需要单独统计
        COALESCE(SUM(es.like_count), 0),
        0  -- comments 需要单独统计
    FROM public.event_submissions es
    WHERE (p_event_id IS NULL OR es.event_id = p_event_id)
    AND DATE(es.created_at) = CURRENT_DATE
    GROUP BY es.event_id
    ON CONFLICT (event_id, stat_date) 
    DO UPDATE SET
        submissions_count = EXCLUDED.submissions_count,
        likes_count = EXCLUDED.likes_count,
        updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 创建评论表（如果不存在）并添加同步触发器
CREATE TABLE IF NOT EXISTS public.submission_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES public.submission_comments(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_submission_comments_submission ON public.submission_comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_comments_user ON public.submission_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_comments_parent ON public.submission_comments(parent_id);

-- 启用 RLS
ALTER TABLE public.submission_comments ENABLE ROW LEVEL SECURITY;

-- RLS 策略
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.submission_comments;
CREATE POLICY "Comments are viewable by everyone" ON public.submission_comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can create comments" ON public.submission_comments;
CREATE POLICY "Authenticated users can create comments" ON public.submission_comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own comments" ON public.submission_comments;
CREATE POLICY "Users can update own comments" ON public.submission_comments
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own comments" ON public.submission_comments;
CREATE POLICY "Users can delete own comments" ON public.submission_comments
    FOR DELETE USING (auth.uid() = user_id);

-- 评论同步触发器函数
CREATE OR REPLACE FUNCTION public.sync_comment_to_performance_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.work_performance_stats
        SET comment_count = comment_count + 1,
            last_updated = NOW()
        WHERE submission_id = NEW.submission_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.work_performance_stats
        SET comment_count = GREATEST(comment_count - 1, 0),
            last_updated = NOW()
        WHERE submission_id = OLD.submission_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS trg_sync_comments_to_stats ON public.submission_comments;
CREATE TRIGGER trg_sync_comments_to_stats
    AFTER INSERT OR DELETE ON public.submission_comments
    FOR EACH ROW EXECUTE FUNCTION public.sync_comment_to_performance_stats();

-- 添加表注释
COMMENT ON TABLE public.submission_comments IS '作品评论表';
COMMENT ON FUNCTION public.sync_all_submissions_to_stats() IS '同步所有提交作品到性能统计表';
COMMENT ON FUNCTION public.update_event_daily_stats(UUID) IS '更新事件每日统计数据';
