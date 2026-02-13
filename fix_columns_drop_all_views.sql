-- 修复 event_submissions 表的时间戳列（删除所有依赖视图）

-- 1. 删除所有可能依赖的视图
DROP VIEW IF EXISTS public.submission_with_stats;
DROP VIEW IF EXISTS public.submission_full_details;
DROP VIEW IF EXISTS public.user_participation_details;
DROP VIEW IF EXISTS public.user_notification_summary;

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

-- 5. 验证结果
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'event_submissions'
ORDER BY ordinal_position;
