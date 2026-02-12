-- 添加缺失的列到 event_submissions 表

-- 先检查并添加互动统计字段
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

-- 创建投票表
CREATE TABLE IF NOT EXISTS public.submission_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_submission_votes_submission ON public.submission_votes(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_votes_user ON public.submission_votes(user_id);

-- 创建点赞表
CREATE TABLE IF NOT EXISTS public.submission_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_submission_likes_submission ON public.submission_likes(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_likes_user ON public.submission_likes(user_id);

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

CREATE INDEX IF NOT EXISTS idx_submission_ratings_submission ON public.submission_ratings(submission_id);
CREATE INDEX IF NOT EXISTS idx_submission_ratings_user ON public.submission_ratings(user_id);

-- 删除旧视图（如果存在）
DROP VIEW IF EXISTS public.submission_with_stats;

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
    COALESCE(es.vote_count, 0) as vote_count,
    COALESCE(es.like_count, 0) as like_count,
    COALESCE(es.avg_rating, 0) as avg_rating,
    COALESCE(es.rating_count, 0) as rating_count,
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

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Votes are viewable by everyone" ON public.submission_votes;
DROP POLICY IF EXISTS "Authenticated users can create own votes" ON public.submission_votes;
DROP POLICY IF EXISTS "Users can delete own votes" ON public.submission_votes;

DROP POLICY IF EXISTS "Likes are viewable by everyone" ON public.submission_likes;
DROP POLICY IF EXISTS "Authenticated users can create own likes" ON public.submission_likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.submission_likes;

DROP POLICY IF EXISTS "Ratings are viewable by everyone" ON public.submission_ratings;
DROP POLICY IF EXISTS "Authenticated users can create own ratings" ON public.submission_ratings;
DROP POLICY IF EXISTS "Users can update own ratings" ON public.submission_ratings;
DROP POLICY IF EXISTS "Users can delete own ratings" ON public.submission_ratings;

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
