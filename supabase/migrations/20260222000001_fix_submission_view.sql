-- 修复 submission_with_stats 视图
-- 先检查 event_submissions 表是否存在，如果不存在则创建

-- 创建 event_submissions 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.event_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    files JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'reviewed', 'rejected')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    score DECIMAL(5,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    -- 互动统计字段
    vote_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    cover_image TEXT,
    media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'audio', 'document', 'other'))
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_submissions_event ON public.event_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_user ON public.event_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON public.event_submissions(status);
CREATE INDEX IF NOT EXISTS idx_event_submissions_vote_count ON public.event_submissions(vote_count DESC);
CREATE INDEX IF NOT EXISTS idx_event_submissions_like_count ON public.event_submissions(like_count DESC);
CREATE INDEX IF NOT EXISTS idx_event_submissions_avg_rating ON public.event_submissions(avg_rating DESC);
CREATE INDEX IF NOT EXISTS idx_event_submissions_media_type ON public.event_submissions(media_type);

-- 创建投票表
CREATE TABLE IF NOT EXISTS public.submission_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

-- 创建点赞表
CREATE TABLE IF NOT EXISTS public.submission_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

-- 创建评分表
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

-- 创建视图：作品完整信息
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

-- 启用 RLS
ALTER TABLE public.submission_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submission_ratings ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Votes are viewable by everyone" ON public.submission_votes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create own votes" ON public.submission_votes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own votes" ON public.submission_votes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Likes are viewable by everyone" ON public.submission_likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create own likes" ON public.submission_likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own likes" ON public.submission_likes FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Ratings are viewable by everyone" ON public.submission_ratings FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create own ratings" ON public.submission_ratings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own ratings" ON public.submission_ratings FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own ratings" ON public.submission_ratings FOR DELETE USING (auth.uid() = user_id);
