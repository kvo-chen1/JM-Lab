-- 批次 1：删除前 5 个不用的表格
-- 请在 Supabase SQL Editor 中执行

DROP TABLE IF EXISTS public.scheduled_posts CASCADE;
DROP TABLE IF EXISTS public.tags CASCADE;
DROP TABLE IF EXISTS public.task_records CASCADE;
DROP TABLE IF EXISTS public.template_favorites CASCADE;
DROP TABLE IF EXISTS public.template_likes CASCADE;

SELECT 'Batch 1 completed: 5 tables dropped' as status;
