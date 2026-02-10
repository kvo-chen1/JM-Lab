-- 批次 4：删除其他不用的表格和视图
-- 请在 Supabase SQL Editor 中执行

DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.user_status CASCADE;
DROP VIEW IF EXISTS public.user_total_points CASCADE;
DROP TABLE IF EXISTS public.video_tasks CASCADE;
DROP TABLE IF EXISTS public.works_bookmarks CASCADE;
DROP TABLE IF EXISTS public.works_likes CASCADE;

SELECT 'Batch 4 completed: 6 tables/views dropped' as status;
