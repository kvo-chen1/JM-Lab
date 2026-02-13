-- 最终修复 event_submissions 表的时间戳列
-- 处理有默认值的列类型转换

-- 1. 修复 updated_at 列
DO $$
BEGIN
    -- 检查列是否存在
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'event_submissions' AND column_name = 'updated_at') THEN
        
        -- 检查列类型
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'event_submissions' 
                   AND column_name = 'updated_at' 
                   AND data_type = 'bigint') THEN
            
            -- 删除默认值
            ALTER TABLE public.event_submissions ALTER COLUMN updated_at DROP DEFAULT;
            
            -- 修改类型（如果有数据，转换为时间戳）
            ALTER TABLE public.event_submissions 
            ALTER COLUMN updated_at TYPE TIMESTAMPTZ 
            USING CASE 
                WHEN updated_at IS NOT NULL THEN to_timestamp(updated_at / 1000.0)
                ELSE NOW()
            END;
            
            -- 重新设置默认值
            ALTER TABLE public.event_submissions ALTER COLUMN updated_at SET DEFAULT NOW();
            
            RAISE NOTICE 'Fixed updated_at column';
        END IF;
    ELSE
        -- 列不存在，直接添加
        ALTER TABLE public.event_submissions ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added updated_at column';
    END IF;
END $$;

-- 2. 修复 created_at 列
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'event_submissions' AND column_name = 'created_at') THEN
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'event_submissions' 
                   AND column_name = 'created_at' 
                   AND data_type = 'bigint') THEN
            
            ALTER TABLE public.event_submissions ALTER COLUMN created_at DROP DEFAULT;
            
            ALTER TABLE public.event_submissions 
            ALTER COLUMN created_at TYPE TIMESTAMPTZ 
            USING CASE 
                WHEN created_at IS NOT NULL THEN to_timestamp(created_at / 1000.0)
                ELSE NOW()
            END;
            
            ALTER TABLE public.event_submissions ALTER COLUMN created_at SET DEFAULT NOW();
            
            RAISE NOTICE 'Fixed created_at column';
        END IF;
    ELSE
        ALTER TABLE public.event_submissions ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Added created_at column';
    END IF;
END $$;

-- 3. 修复 submitted_at 列
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'event_submissions' AND column_name = 'submitted_at') THEN
        
        IF EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'event_submissions' 
                   AND column_name = 'submitted_at' 
                   AND data_type = 'bigint') THEN
            
            ALTER TABLE public.event_submissions 
            ALTER COLUMN submitted_at TYPE TIMESTAMPTZ 
            USING CASE 
                WHEN submitted_at IS NOT NULL THEN to_timestamp(submitted_at / 1000.0)
                ELSE NULL
            END;
            
            RAISE NOTICE 'Fixed submitted_at column';
        END IF;
    ELSE
        ALTER TABLE public.event_submissions ADD COLUMN submitted_at TIMESTAMPTZ;
        RAISE NOTICE 'Added submitted_at column';
    END IF;
END $$;

-- 4. 验证结果
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'event_submissions'
ORDER BY ordinal_position;
