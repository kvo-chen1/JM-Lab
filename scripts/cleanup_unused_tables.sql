-- 删除不用的表格以减少 Supabase 出口流量
-- 请在 Supabase SQL Editor 中执行此脚本
-- 注意：请先备份数据，删除后无法恢复

-- 以下表格在代码中没有使用，可以删除：

-- 1. 定时发布相关（未使用）
DROP TABLE IF EXISTS public.scheduled_posts CASCADE;

-- 2. 标签表（代码中使用的是 works.tags 字段，不是单独的表）
DROP TABLE IF EXISTS public.tags CASCADE;

-- 3. 任务记录（可能是旧功能）
DROP TABLE IF EXISTS public.task_records CASCADE;

-- 4. 模板相关（可能是旧功能）
DROP TABLE IF EXISTS public.template_favorites CASCADE;
DROP TABLE IF EXISTS public.template_likes CASCADE;

-- 5. 天津特色相关（可能是测试数据）
DROP TABLE IF EXISTS public.tianjin_hotspots CASCADE;
DROP TABLE IF EXISTS public.tianjin_offline_experiences CASCADE;
DROP TABLE IF EXISTS public.tianjin_templates CASCADE;
DROP TABLE IF EXISTS public.tianjin_traditional_brands CASCADE;

-- 6. 用户成就（代码中使用的是 achievement 系统，不是这个表）
DROP TABLE IF EXISTS public.user_achievements CASCADE;

-- 7. 用户活跃会话（代码中使用的是 user_sessions）
DROP TABLE IF EXISTS public.user_active_conversations CASCADE;

-- 8. 用户历史（未使用）
DROP TABLE IF EXISTS public.user_history CASCADE;

-- 9. 用户积分余额（代码中使用的是 points 系统，可能重复）
DROP TABLE IF EXISTS public.user_points_balance CASCADE;

-- 10. 用户进度（未使用）
DROP TABLE IF EXISTS public.user_progress CASCADE;

-- 11. 用户统计（代码中使用的是其他方式统计）
DROP TABLE IF EXISTS public.user_stats CASCADE;

-- 12. 用户状态（代码中使用的是 users 表中的字段）
DROP TABLE IF EXISTS public.user_status CASCADE;

-- 13. 用户总积分（代码中使用的是 points 系统）
DROP TABLE IF EXISTS public.user_total_points CASCADE;

-- 14. 视频任务（可能是旧功能）
DROP TABLE IF EXISTS public.video_tasks CASCADE;

-- 15. 作品书签（代码中使用的是 work_bookmarks）
DROP TABLE IF EXISTS public.works_bookmarks CASCADE;

-- 16. 作品点赞（代码中使用的是 work_likes）
DROP TABLE IF EXISTS public.works_likes CASCADE;

-- 17. 其他可能的重复表格
DROP TABLE IF EXISTS public.work_comments_backup CASCADE;
DROP TABLE IF EXISTS public.works_backup CASCADE;
DROP TABLE IF EXISTS public.users_backup CASCADE;

-- 清理完成
SELECT 'Unused tables cleanup completed' as status;
