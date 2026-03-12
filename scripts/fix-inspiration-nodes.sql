-- 修复 inspiration_nodes 表结构
-- 添加缺失的列

-- 添加 position 列
ALTER TABLE public.inspiration_nodes 
ADD COLUMN IF NOT EXISTS "position" jsonb;

-- 添加 version 列
ALTER TABLE public.inspiration_nodes 
ADD COLUMN IF NOT EXISTS version integer DEFAULT 1;

-- 添加 history 列
ALTER TABLE public.inspiration_nodes 
ADD COLUMN IF NOT EXISTS history jsonb DEFAULT '[]'::jsonb;

-- 验证表结构
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'inspiration_nodes'
AND table_schema = 'public'
ORDER BY ordinal_position;
