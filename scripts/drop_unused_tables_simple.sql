-- 直接删除确定不用的表格（无需备份，免费套餐不支持备份）
-- 这些表格在代码中没有使用，可以安全删除

-- 执行方式：在 Supabase SQL Editor 中逐个执行以下命令
-- 如果某个表格不存在，会显示 "table does not exist"，这是正常的

-- 1. 删除定时发布表
DROP TABLE IF EXISTS public.scheduled_posts CASCADE;

-- 2. 删除标签表（代码中使用 works.tags 字段）
DROP TABLE IF EXISTS public.tags CASCADE;

-- 3. 删除任务记录表
DROP TABLE IF EXISTS public.task_records CASCADE;

-- 4. 删除模板相关表
DROP TABLE IF EXISTS public.template_favorites CASCADE;
DROP TABLE IF EXISTS public.template_likes CASCADE;

-- 5. 删除天津特色相关表（测试数据）
DROP TABLE IF EXISTS public.tianjin_hotspots CASCADE;
DROP TABLE IF EXISTS public.tianjin_offline_experiences CASCADE;
DROP TABLE IF EXISTS public.tianjin_templates CASCADE;
DROP TABLE IF EXISTS public.tianjin_traditional_brands CASCADE;

-- 6. 删除重复的用户相关表
DROP TABLE IF EXISTS public.user_achievements CASCADE;
DROP TABLE IF EXISTS public.user_active_conversations CASCADE;
DROP TABLE IF EXISTS public.user_history CASCADE;
DROP TABLE IF EXISTS public.user_points_balance CASCADE;
DROP TABLE IF EXISTS public.user_progress CASCADE;
DROP TABLE IF EXISTS public.user_stats CASCADE;
DROP TABLE IF EXISTS public.user_status CASCADE;
DROP TABLE IF EXISTS public.user_total_points CASCADE;

-- 7. 删除视频任务表
DROP TABLE IF EXISTS public.video_tasks CASCADE;

-- 8. 删除重复的作品表（代码中使用 work_bookmarks, work_likes）
DROP TABLE IF EXISTS public.works_bookmarks CASCADE;
DROP TABLE IF EXISTS public.works_likes CASCADE;

-- 9. 删除备份表
DROP TABLE IF EXISTS public.work_comments_backup CASCADE;
DROP TABLE IF EXISTS public.works_backup CASCADE;
DROP TABLE IF EXISTS public.users_backup CASCADE;

-- 查看剩余表格数量
SELECT COUNT(*) as remaining_tables 
FROM information_schema.tables 
WHERE table_schema = 'public';
