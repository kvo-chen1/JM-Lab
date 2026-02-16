-- ============================================
-- 修复 event_participants 表的时间戳类型
-- ============================================

-- 1. 检查当前表结构
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'event_participants'
AND column_name IN ('updated_at', 'submission_date', 'created_at');

-- 2. 修改 updated_at 字段类型为 bigint（如果当前是 timestamptz）
DO $$
BEGIN
    -- 检查 updated_at 列的当前类型
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'event_participants' 
        AND column_name = 'updated_at'
        AND data_type = 'timestamp with time zone'
    ) THEN
        -- 修改列类型为 bigint
        ALTER TABLE public.event_participants 
        ALTER COLUMN updated_at TYPE BIGINT 
        USING EXTRACT(EPOCH FROM updated_at)::BIGINT * 1000;
        
        -- 设置默认值为 bigint 格式
        ALTER TABLE public.event_participants 
        ALTER COLUMN updated_at SET DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
        
        RAISE NOTICE 'updated_at 列已修改为 bigint 类型';
    ELSE
        RAISE NOTICE 'updated_at 列已经是 bigint 类型或不存在';
    END IF;
END $$;

-- 3. 修改 submission_date 字段类型为 bigint（如果当前是 timestamptz）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'event_participants' 
        AND column_name = 'submission_date'
        AND data_type = 'timestamp with time zone'
    ) THEN
        ALTER TABLE public.event_participants 
        ALTER COLUMN submission_date TYPE BIGINT 
        USING EXTRACT(EPOCH FROM submission_date)::BIGINT * 1000;
        
        RAISE NOTICE 'submission_date 列已修改为 bigint 类型';
    ELSE
        RAISE NOTICE 'submission_date 列已经是 bigint 类型或不存在';
    END IF;
END $$;

-- 4. 修改 created_at 字段类型为 bigint（如果当前是 timestamptz）
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'event_participants' 
        AND column_name = 'created_at'
        AND data_type = 'timestamp with time zone'
    ) THEN
        ALTER TABLE public.event_participants 
        ALTER COLUMN created_at TYPE BIGINT 
        USING EXTRACT(EPOCH FROM created_at)::BIGINT * 1000;
        
        ALTER TABLE public.event_participants 
        ALTER COLUMN created_at SET DEFAULT (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT;
        
        RAISE NOTICE 'created_at 列已修改为 bigint 类型';
    ELSE
        RAISE NOTICE 'created_at 列已经是 bigint 类型或不存在';
    END IF;
END $$;

-- 5. 验证修改结果
SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_schema = 'public'
AND table_name = 'event_participants'
AND column_name IN ('updated_at', 'submission_date', 'created_at');
