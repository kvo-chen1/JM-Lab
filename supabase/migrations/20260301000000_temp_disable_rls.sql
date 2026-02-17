-- 临时禁用 RLS 以允许前端直接操作数据库
-- 注意：这是一个临时解决方案，生产环境应该使用后端 API

-- 禁用 likes 表的 RLS
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;

-- 禁用 bookmarks 表的 RLS
ALTER TABLE public.bookmarks DISABLE ROW LEVEL SECURITY;

-- 禁用 works_likes 表的 RLS
ALTER TABLE public.works_likes DISABLE ROW LEVEL SECURITY;

-- 禁用 works_bookmarks 表的 RLS
ALTER TABLE public.works_bookmarks DISABLE ROW LEVEL SECURITY;

-- 添加注释说明
COMMENT ON TABLE public.likes IS '社区帖子点赞表（RLS 已临时禁用）';
COMMENT ON TABLE public.bookmarks IS '社区帖子收藏表（RLS 已临时禁用）';
COMMENT ON TABLE public.works_likes IS '广场作品点赞表（RLS 已临时禁用）';
COMMENT ON TABLE public.works_bookmarks IS '广场作品收藏表（RLS 已临时禁用）';
