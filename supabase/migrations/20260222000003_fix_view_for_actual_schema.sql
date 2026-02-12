-- 根据实际表结构修复视图
-- 先添加缺失的列
ALTER TABLE public.event_submissions
ADD COLUMN IF NOT EXISTS vote_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS avg_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS rating_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'audio', 'document', 'other'));

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

-- 删除旧视图（如果存在）
DROP VIEW IF EXISTS public.submission_with_stats;

-- 创建视图：根据实际表结构调整字段名
CREATE OR REPLACE VIEW public.submission_with_stats AS
SELECT 
    es.id,
    es.event_id,
    es.user_id,
    es.work_title as title,
    es.description,
    es.work_thumbnail as cover_image,
    es.status,
    to_timestamp(es.submission_date / 1000.0) as submitted_at,
    es.score,
    es.feedback as review_notes,
    es.updated_at,
    COALESCE(es.vote_count, 0) as vote_count,
    COALESCE(es.like_count, 0) as like_count,
    COALESCE(es.avg_rating, 0) as avg_rating,
    COALESCE(es.rating_count, 0) as rating_count,
    COALESCE(es.media_type, 'image') as media_type,
    e.title as event_title,
    e.start_date as event_start_time,
    e.end_date as event_end_time,
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
