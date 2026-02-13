-- 添加 participation_id 列到 event_submissions 表

-- 方法1: 直接添加列
ALTER TABLE public.event_submissions 
ADD COLUMN participation_id UUID REFERENCES public.event_participants(id) ON DELETE SET NULL;

-- 验证结果
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'event_submissions'
ORDER BY ordinal_position;
