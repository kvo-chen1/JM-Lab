-- 修复 event_participants 表的时间戳列
-- 统一为 bigint 类型

-- 1. 修改 created_at 列（删除默认值，修改类型，重新设置默认值）
ALTER TABLE public.event_participants ALTER COLUMN created_at DROP DEFAULT;
ALTER TABLE public.event_participants 
ALTER COLUMN created_at TYPE BIGINT USING EXTRACT(EPOCH FROM created_at)::BIGINT * 1000;
ALTER TABLE public.event_participants ALTER COLUMN created_at SET DEFAULT (EXTRACT(EPOCH FROM NOW())::BIGINT * 1000);

-- 2. 修改 submission_date 列（没有默认值，直接修改）
ALTER TABLE public.event_participants 
ALTER COLUMN submission_date TYPE BIGINT USING CASE 
    WHEN submission_date IS NOT NULL THEN EXTRACT(EPOCH FROM submission_date)::BIGINT * 1000
    ELSE NULL
END;

-- 3. 验证结果
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'event_participants'
AND column_name IN ('submission_date', 'updated_at', 'created_at')
ORDER BY column_name;
