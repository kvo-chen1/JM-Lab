-- 删除有问题的旧表（如果存在）
-- 这些表已经被新的 works_bookmarks 和 works_likes 表替代

-- 删除旧的工作流收藏表
DROP TABLE IF EXISTS public.work_favorites CASCADE;

-- 删除旧的工作流点赞表
DROP TABLE IF EXISTS public.work_likes CASCADE;

-- 添加注释说明
COMMENT ON TABLE public.works_bookmarks IS '广场作品收藏表（已替换旧表 work_favorites）';
COMMENT ON TABLE public.works_likes IS '广场作品点赞表（已替换旧表 work_likes）';
