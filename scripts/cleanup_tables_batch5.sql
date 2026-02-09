-- 批次 5：删除备份表格
-- 请在 Supabase SQL Editor 中执行

DROP TABLE IF EXISTS public.work_comments_backup CASCADE;
DROP TABLE IF EXISTS public.works_backup CASCADE;
DROP TABLE IF EXISTS public.users_backup CASCADE;

SELECT 'Batch 5 completed: 3 tables dropped' as status;
