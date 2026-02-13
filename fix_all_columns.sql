-- 完整修复 event_submissions 表的所有缺失列
-- 首先检查现有列，然后添加缺失的列

-- 1. 添加 created_at 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'event_submissions' AND column_name = 'created_at') THEN
        ALTER TABLE public.event_submissions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    ELSE
        -- 如果存在但类型不对，修改类型
        ALTER TABLE public.event_submissions 
        ALTER COLUMN created_at TYPE TIMESTAMPTZ USING to_timestamp(created_at / 1000.0);
        RAISE NOTICE 'Modified created_at column type';
    END IF;
END $$;

-- 2. 添加 updated_at 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'event_submissions' AND column_name = 'updated_at') THEN
        ALTER TABLE public.event_submissions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    ELSE
        -- 如果存在但类型不对，修改类型
        ALTER TABLE public.event_submissions 
        ALTER COLUMN updated_at TYPE TIMESTAMPTZ USING to_timestamp(updated_at / 1000.0);
        RAISE NOTICE 'Modified updated_at column type';
    END IF;
END $$;

-- 3. 添加 submitted_at 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'event_submissions' AND column_name = 'submitted_at') THEN
        ALTER TABLE public.event_submissions ADD COLUMN submitted_at TIMESTAMPTZ;
        RAISE NOTICE 'Added submitted_at column';
    ELSE
        -- 如果存在但类型不对，修改类型
        ALTER TABLE public.event_submissions 
        ALTER COLUMN submitted_at TYPE TIMESTAMPTZ USING to_timestamp(submitted_at / 1000.0);
        RAISE NOTICE 'Modified submitted_at column type';
    END IF;
END $$;

-- 4. 验证结果
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'event_submissions'
ORDER BY ordinal_position;
