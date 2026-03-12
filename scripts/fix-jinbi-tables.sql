-- 修复津币相关表结构

-- 1. 修复 jinbi_records 表
ALTER TABLE public.jinbi_records 
ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT now();

-- 2. 修复 user_jinbi_balance 表
ALTER TABLE public.user_jinbi_balance 
ADD COLUMN IF NOT EXISTS total_consumed integer DEFAULT 0;

-- 3. 确保所有必要列都存在
ALTER TABLE public.user_jinbi_balance 
ADD COLUMN IF NOT EXISTS frozen_balance integer DEFAULT 0;

-- 4. 验证表结构
SELECT 
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_name IN ('jinbi_records', 'user_jinbi_balance')
AND table_schema = 'public'
ORDER BY table_name, ordinal_position;
