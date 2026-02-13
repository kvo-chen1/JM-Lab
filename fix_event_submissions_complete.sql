-- 修复 event_submissions 表结构和相关功能

-- 1. 确保 event_submissions 表存在并包含正确的字段
DO $$
BEGIN
    -- 检查字段是否存在，不存在则添加
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_submissions' 
        AND column_name = 'vote_count'
    ) THEN
        ALTER TABLE public.event_submissions ADD COLUMN vote_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_submissions' 
        AND column_name = 'like_count'
    ) THEN
        ALTER TABLE public.event_submissions ADD COLUMN like_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_submissions' 
        AND column_name = 'avg_rating'
    ) THEN
        ALTER TABLE public.event_submissions ADD COLUMN avg_rating DECIMAL(3,2) DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_submissions' 
        AND column_name = 'rating_count'
    ) THEN
        ALTER TABLE public.event_submissions ADD COLUMN rating_count INTEGER DEFAULT 0;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_submissions' 
        AND column_name = 'media_type'
    ) THEN
        ALTER TABLE public.event_submissions ADD COLUMN media_type TEXT DEFAULT 'image';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_submissions' 
        AND column_name = 'cover_image'
    ) THEN
        ALTER TABLE public.event_submissions ADD COLUMN cover_image TEXT;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_submissions' 
        AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.event_submissions ADD COLUMN metadata JSONB DEFAULT '{}';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_submissions' 
        AND column_name = 'reviewed_at'
    ) THEN
        ALTER TABLE public.event_submissions ADD COLUMN reviewed_at TIMESTAMP WITH TIME ZONE;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'event_submissions' 
        AND column_name = 'review_notes'
    ) THEN
        ALTER TABLE public.event_submissions ADD COLUMN review_notes TEXT;
    END IF;
END $$;

-- 2. 创建 submission_ratings 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.submission_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating BETWEEN 1 AND 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

-- 3. 创建 submission_votes 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.submission_votes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

-- 4. 创建 submission_likes 表（如果不存在）
CREATE TABLE IF NOT EXISTS public.submission_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID REFERENCES public.event_submissions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(submission_id, user_id)
);

-- 5. 修复 submission_with_stats 视图
DROP VIEW IF EXISTS public.submission_with_stats;

CREATE OR REPLACE VIEW public.submission_with_stats AS
SELECT 
    es.id,
    es.event_id,
    es.user_id,
    es.participation_id,
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
    COALESCE(es.cover_image, es.work_thumbnail) as cover_image,
    COALESCE(es.media_type, 'image') as media_type,
    e.title as event_title,
    e.start_time as event_start_time,
    e.end_time as event_end_time,
    COALESCE(pu.username, u.raw_user_meta_data->>'username') as creator_name,
    COALESCE(pu.avatar_url, u.raw_user_meta_data->>'avatar_url') as creator_avatar,
    u.raw_user_meta_data->>'full_name' as creator_full_name
FROM public.event_submissions es
JOIN public.events e ON es.event_id = e.id
JOIN auth.users u ON es.user_id = u.id
LEFT JOIN public.users pu ON es.user_id = pu.id;

-- 6. 创建 submit_vote 函数
CREATE OR REPLACE FUNCTION public.submit_vote(
    p_submission_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
    v_action TEXT;
BEGIN
    -- 检查投票是否存在
    SELECT EXISTS(
        SELECT 1 FROM public.submission_votes 
        WHERE submission_id = p_submission_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- 取消投票
        DELETE FROM public.submission_votes 
        WHERE submission_id = p_submission_id AND user_id = p_user_id;
        
        -- 更新投票计数
        UPDATE public.event_submissions 
        SET vote_count = GREATEST(0, vote_count - 1)
        WHERE id = p_submission_id;
        
        v_action := 'removed';
    ELSE
        -- 添加投票
        INSERT INTO public.submission_votes (submission_id, user_id)
        VALUES (p_submission_id, p_user_id);
        
        -- 更新投票计数
        UPDATE public.event_submissions 
        SET vote_count = vote_count + 1
        WHERE id = p_submission_id;
        
        v_action := 'added';
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'action', v_action,
        'message', CASE WHEN v_action = 'added' THEN '投票成功' ELSE '取消投票成功' END
    );
END;
$$;

-- 7. 创建 submit_like 函数
CREATE OR REPLACE FUNCTION public.submit_like(
    p_submission_id UUID,
    p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
    v_action TEXT;
BEGIN
    -- 检查点赞是否存在
    SELECT EXISTS(
        SELECT 1 FROM public.submission_likes 
        WHERE submission_id = p_submission_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- 取消点赞
        DELETE FROM public.submission_likes 
        WHERE submission_id = p_submission_id AND user_id = p_user_id;
        
        -- 更新点赞计数
        UPDATE public.event_submissions 
        SET like_count = GREATEST(0, like_count - 1)
        WHERE id = p_submission_id;
        
        v_action := 'removed';
    ELSE
        -- 添加点赞
        INSERT INTO public.submission_likes (submission_id, user_id)
        VALUES (p_submission_id, p_user_id);
        
        -- 更新点赞计数
        UPDATE public.event_submissions 
        SET like_count = like_count + 1
        WHERE id = p_submission_id;
        
        v_action := 'added';
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'action', v_action,
        'message', CASE WHEN v_action = 'added' THEN '点赞成功' ELSE '取消点赞成功' END
    );
END;
$$;

-- 8. 创建 submit_rating 函数
CREATE OR REPLACE FUNCTION public.submit_rating(
    p_submission_id UUID,
    p_user_id UUID,
    p_rating INTEGER,
    p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_exists BOOLEAN;
    v_old_rating INTEGER;
    v_new_avg DECIMAL(3,2);
    v_new_count INTEGER;
BEGIN
    -- 验证评分范围
    IF p_rating < 1 OR p_rating > 5 THEN
        RETURN jsonb_build_object('success', false, 'message', '评分必须在1-5之间');
    END IF;
    
    -- 检查评分是否存在
    SELECT EXISTS(
        SELECT 1 FROM public.submission_ratings 
        WHERE submission_id = p_submission_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- 更新评分
        UPDATE public.submission_ratings 
        SET rating = p_rating, comment = p_comment, updated_at = NOW()
        WHERE submission_id = p_submission_id AND user_id = p_user_id;
    ELSE
        -- 添加评分
        INSERT INTO public.submission_ratings (submission_id, user_id, rating, comment)
        VALUES (p_submission_id, p_user_id, p_rating, p_comment);
    END IF;
    
    -- 重新计算平均评分
    SELECT 
        AVG(rating)::DECIMAL(3,2),
        COUNT(*)::INTEGER
    INTO v_new_avg, v_new_count
    FROM public.submission_ratings 
    WHERE submission_id = p_submission_id;
    
    -- 更新作品的评分信息
    UPDATE public.event_submissions 
    SET 
        avg_rating = v_new_avg,
        rating_count = v_new_count
    WHERE id = p_submission_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', '评分成功'
    );
END;
$$;

-- 9. 创建 get_user_interactions 函数
CREATE OR REPLACE FUNCTION public.get_user_interactions(
    p_user_id UUID,
    p_submission_ids UUID[]
)
RETURNS JSONB[]
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'submission_id', sr.submission_id,
                'has_voted', EXISTS(
                    SELECT 1 FROM public.submission_votes 
                    WHERE submission_id = sr.submission_id AND user_id = p_user_id
                ),
                'has_liked', EXISTS(
                    SELECT 1 FROM public.submission_likes 
                    WHERE submission_id = sr.submission_id AND user_id = p_user_id
                ),
                'user_rating', (
                    SELECT rating FROM public.submission_ratings 
                    WHERE submission_id = sr.submission_id AND user_id = p_user_id
                )
            )
        ), '[]')
        FROM (
            SELECT DISTINCT unnest(p_submission_ids) as submission_id
        ) sr
    );
END;
$$;

-- 10. 验证所有函数和视图
SELECT 'Functions created:' as message;
SELECT routine_name FROM information_schema.routines 
WHERE routine_schema = 'public' 
AND routine_name IN ('submit_vote', 'submit_like', 'submit_rating', 'get_user_interactions');

SELECT 'View created:' as message;
SELECT table_name FROM information_schema.views 
WHERE table_schema = 'public' 
AND table_name = 'submission_with_stats';
