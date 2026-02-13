-- 修复 event_submissions 表缺失的列
-- 请在 Supabase SQL Editor 中执行此文件

-- 添加缺失的 participation_id 列
ALTER TABLE public.event_submissions
ADD COLUMN IF NOT EXISTS participation_id UUID REFERENCES public.event_participants(id) ON DELETE SET NULL;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_submissions_participation ON public.event_submissions(participation_id);

-- 验证列是否添加成功
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'event_submissions'
ORDER BY ordinal_position;
