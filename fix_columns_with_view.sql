-- 修复 event_submissions 表的时间戳列（处理视图依赖）
-- 先删除视图，修改列，再重建视图

-- 1. 删除依赖的视图
DROP VIEW IF EXISTS public.submission_with_stats;
DROP VIEW IF EXISTS public.user_participation_details;

-- 2. 修复 updated_at 列
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'event_submissions' 
               AND column_name = 'updated_at' 
               AND data_type = 'bigint') THEN
        
        ALTER TABLE public.event_submissions ALTER COLUMN updated_at DROP DEFAULT;
        
        ALTER TABLE public.event_submissions 
        ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
        USING to_timestamp(updated_at / 1000.0);
        
        ALTER TABLE public.event_submissions ALTER COLUMN updated_at SET DEFAULT NOW();
        
        RAISE NOTICE 'Fixed updated_at column';
    END IF;
END $$;

-- 3. 修复 created_at 列
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'event_submissions' 
               AND column_name = 'created_at' 
               AND data_type = 'bigint') THEN
        
        ALTER TABLE public.event_submissions ALTER COLUMN created_at DROP DEFAULT;
        
        ALTER TABLE public.event_submissions 
        ALTER COLUMN created_at TYPE TIMESTAMPTZ 
        USING to_timestamp(created_at / 1000.0);
        
        ALTER TABLE public.event_submissions ALTER COLUMN created_at SET DEFAULT NOW();
        
        RAISE NOTICE 'Fixed created_at column';
    END IF;
END $$;

-- 4. 修复 submitted_at 列
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'event_submissions' 
               AND column_name = 'submitted_at' 
               AND data_type = 'bigint') THEN
        
        ALTER TABLE public.event_submissions 
        ALTER COLUMN submitted_at TYPE TIMESTAMPTZ 
        USING to_timestamp(submitted_at / 1000.0);
        
        RAISE NOTICE 'Fixed submitted_at column';
    END IF;
END $$;

-- 5. 重建视图
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

-- 6. 验证结果
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'event_submissions'
ORDER BY ordinal_position;
