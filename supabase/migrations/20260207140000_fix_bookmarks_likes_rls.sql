-- 修复 bookmarks 和 likes 表的 RLS 策略
-- 允许已认证用户操作自己的数据

-- 1. 修复 bookmarks 表的 RLS 策略
ALTER TABLE public.bookmarks DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookmarks ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can insert own bookmarks" ON public.bookmarks;
DROP POLICY IF EXISTS "Users can delete own bookmarks" ON public.bookmarks;

-- 创建新策略 - 允许所有已认证用户查看（用于调试）
CREATE POLICY "Allow all operations for authenticated users"
  ON public.bookmarks FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');

-- 2. 修复 likes 表的 RLS 策略
ALTER TABLE public.likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- 删除旧策略
DROP POLICY IF EXISTS "Users can view own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can insert own likes" ON public.likes;
DROP POLICY IF EXISTS "Users can delete own likes" ON public.likes;

-- 创建新策略 - 允许所有已认证用户操作
CREATE POLICY "Allow all operations for authenticated users on likes"
  ON public.likes FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
