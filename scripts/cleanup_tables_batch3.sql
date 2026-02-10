-- 批次 3：删除用户相关重复表格和视图
-- 请在 Supabase SQL Editor 中执行

DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP VIEW IF EXISTS public.user_active_conversations CASCADE;
DROP TABLE IF EXISTS public.user_history CASCADE;
DROP TABLE IF EXISTS public.user_points_balance CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;

SELECT 'Batch 3 completed: 5 tables/views dropped' as status;
