-- ============================================
-- 活动作品展示系统数据库迁移
-- 包含：投票、点赞、评分功能
-- ============================================

-- 1. 扩展 event_submissions 表，添加互动统计字段
ALTER TABLE public.event_submissions
ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS cover_image TEXT,
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'audio', 'document', 'other'));

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_submissions_vote_count ON public.event_submissions(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_event_submissions_like_count ON public.event_submissions(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_event_submissions_avg_rating ON public.event_submissions(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_event_submissions_media_type ON public.event_submissions(media_type);

-- 2. 创建作品投票表
CREATE TABLE IF NOT EXISTS public.submission_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_submission_votes_submission ON public.submission_votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_votes_user ON public.submission_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_votes_created ON public.submission_votes(created_at DESC);

-- 3. 创建作品点赞表
CREATE TABLE IF NOT EXISTS public.submission_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_submission_likes_submission ON public.submission_likes(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_likes_user ON public.submission_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_likes_created ON public.submission_likes(created_at DESC);

-- 4. 创建作品评分表
CREATE TABLE IF NOT EXISTS public.submission_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 10),
    comment TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_submission_ratings_submission ON public.submission_ratings(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_ratings_user ON public.submission_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_submission_ratings_rating ON public.submission_ratings(rating DESC);
CREATE INDEX IF NOT EXISTS idx_submission_ratings_created ON public.submission_ratings(created_at DESC);

-- 5. 启用 RLS
ALTER TABLE public.submission_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_ratings ENABLE ROW LEVEL SECURITY;

-- 6. RLS 策略 - 投票表
CREATE POLICY "Votes are viewable by everyone" ON public.submission_votes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create own votes" ON public.submission_votes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes" ON public.submission_votes
    FOR DELETE USING (auth.uid() = user_id);

-- 7. RLS 策略 - 点赞表
CREATE POLICY "Likes are viewable by everyone" ON public.submission_likes
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create own likes" ON public.submission_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes" ON public.submission_likes
    FOR DELETE USING (auth.uid() = user_id);

-- 8. RLS 策略 - 评分表
CREATE POLICY "Ratings are viewable by everyone" ON public.submission_ratings
    FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create own ratings" ON public.submission_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.submission_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON public.submission_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- 9. 创建触发器函数：自动更新 updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
DROP TRIGGER IF EXISTS update_submission_ratings_updated_at ON public.submission_ratings;
CREATE TRIGGER update_submission_ratings_updated_at
    BEFORE UPDATE ON public.submission_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 10. 创建函数：更新作品投票数
CREATE OR REPLACE FUNCTION public.update_submission_vote_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.event_submissions
        SET vote_count = vote_count + 1
        WHERE id = NEW.submission_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.event_submissions
        SET vote_count = GREATEST(vote_count - 1, 0)
        WHERE id = OLD.submission_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_vote_count ON public.submission_votes;
CREATE TRIGGER trg_update_vote_count
    AFTER INSERT OR DELETE ON public.submission_votes
    FOR EACH ROW EXECUTE FUNCTION public.update_submission_vote_count();

-- 11. 创建函数：更新作品点赞数
CREATE OR REPLACE FUNCTION public.update_submission_like_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.event_submissions
        SET like_count = like_count + 1
        WHERE id = NEW.submission_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.event_submissions
        SET like_count = GREATEST(like_count - 1, 0)
        WHERE id = OLD.submission_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_like_count ON public.submission_likes;
CREATE TRIGGER trg_update_like_count
    AFTER INSERT OR DELETE ON public.submission_likes
    FOR EACH ROW EXECUTE FUNCTION public.update_submission_like_count();

-- 12. 创建函数：更新作品评分统计
CREATE OR REPLACE FUNCTION public.update_submission_rating_stats()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.event_submissions
        SET 
            avg_rating = (
                SELECT AVG(rating)::DECIMAL(3,2) 
                FROM public.submission_ratings 
                WHERE submission_id = NEW.submission_id
            ),
            rating_count = (
                SELECT COUNT(*) 
                FROM public.submission_ratings 
                WHERE submission_id = NEW.submission_id
            )
        WHERE id = NEW.submission_id;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        UPDATE public.event_submissions
        SET 
            avg_rating = (
                SELECT AVG(rating)::DECIMAL(3,2) 
                FROM public.submission_ratings 
                WHERE submission_id = NEW.submission_id
            )
        WHERE id = NEW.submission_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.event_submissions
        SET 
            avg_rating = COALESCE((
                SELECT AVG(rating)::DECIMAL(3,2) 
                FROM public.submission_ratings 
                WHERE submission_id = OLD.submission_id
            ), 0),
            rating_count = (
                SELECT COUNT(*) 
                FROM public.submission_ratings 
                WHERE submission_id = OLD.submission_id
            )
        WHERE id = OLD.submission_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_rating_stats ON public.submission_ratings;
CREATE TRIGGER trg_update_rating_stats
    AFTER INSERT OR UPDATE OR DELETE ON public.submission_ratings
    FOR EACH ROW EXECUTE FUNCTION public.update_submission_rating_stats();

-- 13. 创建视图：作品完整信息（含创作者信息和统计）
CREATE OR REPLACE VIEW public.submission_with_stats AS
SELECT 
    es.id,
    es.event_id,
    es.user_id,
    es.title,
    es.description,
    es.files,
    es.status,
    es.submitted_at,
    es.reviewed_at,
    es.review_notes,
    es.score,
    es.metadata,
    es.created_at,
    es.updated_at,
    es.vote_count,
    es.like_count,
    es.avg_rating,
    es.rating_count,
    es.cover_image,
    es.media_type,
    e.title as event_title,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    u.raw_user_meta_data->>'username' as creator_name,
    u.raw_user_meta_data->>'avatar_url' as creator_avatar,
    u.raw_user_meta_data->>'full_name' as creator_full_name
FROM public.event_submissions es
JOIN public.events e ON es.event_id = e.id
JOIN auth.users u ON es.user_id = u.id;

-- 14. 创建视图：用户交互状态（用于前端获取当前用户对作品的交互状态）
CREATE OR REPLACE VIEW public.user_submission_interactions AS
SELECT 
    es.id as submission_id,
    es.event_id,
    es.vote_count,
    es.like_count,
    es.avg_rating,
    es.rating_count,
    sv.user_id as voted_user_id,
    sl.user_id as liked_user_id,
    sr.user_id as rated_user_id,
    sr.rating as user_rating
FROM public.event_submissions es
LEFT JOIN public.submission_votes sv ON es.id = sv.submission_id
LEFT JOIN public.submission_likes sl ON es.id = sl.submission_id
LEFT JOIN public.submission_ratings sr ON es.id = sr.submission_id;

-- 15. 创建函数：获取用户对作品的交互状态
CREATE OR REPLACE FUNCTION public.get_user_interactions(
    p_user_id UUID,
    p_submission_ids UUID[]
)
RETURNS TABLE (
    submission_id UUID,
    has_voted BOOLEAN,
    has_liked BOOLEAN,
    user_rating INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    RETURN QUERY
    SELECT 
        es.id,
        EXISTS(SELECT 1 FROM public.submission_votes sv WHERE sv.submission_id = es.id AND sv.user_id = p_user_id) as has_voted,
        EXISTS(SELECT 1 FROM public.submission_likes sl WHERE sl.submission_id = es.id AND sl.user_id = p_user_id) as has_liked,
        (SELECT sr.rating FROM public.submission_ratings sr WHERE sr.submission_id = es.id AND sr.user_id = p_user_id) as user_rating
    FROM public.event_submissions es
    WHERE es.id = ANY(p_submission_ids);
END;
$$;

-- 16. 创建函数：提交投票（带幂等性检查）
CREATE OR REPLACE FUNCTION public.submit_vote(
    p_submission_id UUID,
    p_user_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_result JSONB;
    v_exists BOOLEAN;
BEGIN
    -- 检查是否已经投票
    SELECT EXISTS(
        SELECT 1 FROM public.submission_votes 
        WHERE submission_id = p_submission_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- 取消投票
        DELETE FROM public.submission_votes 
        WHERE submission_id = p_submission_id AND user_id = p_user_id;
        v_result := jsonb_build_object('success', true, 'action', 'removed', 'message', '投票已取消');
    ELSE
        -- 添加投票
        INSERT INTO public.submission_votes (submission_id, user_id)
        VALUES (p_submission_id, p_user_id);
        v_result := jsonb_build_object('success', true, 'action', 'added', 'message', '投票成功');
    END IF;
    
    RETURN v_result;
END;
$$;

-- 17. 创建函数：提交点赞（带幂等性检查）
CREATE OR REPLACE FUNCTION public.submit_like(
    p_submission_id UUID,
    p_user_id UUID
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_result JSONB;
    v_exists BOOLEAN;
BEGIN
    -- 检查是否已经点赞
    SELECT EXISTS(
        SELECT 1 FROM public.submission_likes 
        WHERE submission_id = p_submission_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- 取消点赞
        DELETE FROM public.submission_likes 
        WHERE submission_id = p_submission_id AND user_id = p_user_id;
        v_result := jsonb_build_object('success', true, 'action', 'removed', 'message', '点赞已取消');
    ELSE
        -- 添加点赞
        INSERT INTO public.submission_likes (submission_id, user_id)
        VALUES (p_submission_id, p_user_id);
        v_result := jsonb_build_object('success', true, 'action', 'added', 'message', '点赞成功');
    END IF;
    
    RETURN v_result;
END;
$$;

-- 18. 创建函数：提交评分
CREATE OR REPLACE FUNCTION public.submit_rating(
    p_submission_id UUID,
    p_user_id UUID,
    p_rating INTEGER,
    p_comment TEXT DEFAULT NULL
)
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- 验证评分范围
    IF p_rating < 1 OR p_rating > 10 THEN
        RETURN jsonb_build_object('success', false, 'error', '评分必须在 1-10 之间');
    END IF;
    
    -- 插入或更新评分
    INSERT INTO public.submission_ratings (submission_id, user_id, rating, comment)
    VALUES (p_submission_id, p_user_id, p_rating, p_comment)
    ON CONFLICT (submission_id, user_id)
    DO UPDATE SET 
        rating = EXCLUDED.rating,
        comment = EXCLUDED.comment,
        updated_at = NOW();
    
    RETURN jsonb_build_object('success', true, 'message', '评分已提交');
END;
$$;

-- 19. 添加表注释
COMMENT ON TABLE public.submission_votes IS '作品投票记录表';
COMMENT ON TABLE public.submission_likes IS '作品点赞记录表';
COMMENT ON TABLE public.submission_ratings IS '作品评分记录表';
COMMENT ON VIEW public.submission_with_stats IS '作品完整信息视图（含统计）';
