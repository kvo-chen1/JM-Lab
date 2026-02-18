-- 创建模板收藏和点赞表
-- 支持模板的收藏和点赞功能

-- ============================================
-- 1. 创建 template_favorites 表（模板收藏）
-- ============================================
CREATE TABLE IF NOT EXISTS public.template_favorites (
  user_id TEXT NOT NULL,
  template_id INTEGER NOT NULL REFERENCES public.tianjin_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, template_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_template_favorites_user_id ON public.template_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_template_id ON public.template_favorites(template_id);

-- 启用 RLS
ALTER TABLE public.template_favorites ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow all operations on template_favorites" ON public.template_favorites;

-- 创建新策略 - 允许所有操作（因为我们在应用层控制权限）
CREATE POLICY "Allow all operations on template_favorites"
  ON public.template_favorites FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 2. 创建 template_likes 表（模板点赞）
-- ============================================
CREATE TABLE IF NOT EXISTS public.template_likes (
  user_id TEXT NOT NULL,
  template_id INTEGER NOT NULL REFERENCES public.tianjin_templates(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, template_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_template_likes_user_id ON public.template_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_template_likes_template_id ON public.template_likes(template_id);

-- 启用 RLS
ALTER TABLE public.template_likes ENABLE ROW LEVEL SECURITY;

-- 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Allow all operations on template_likes" ON public.template_likes;

-- 创建新策略 - 允许所有操作（因为我们在应用层控制权限）
CREATE POLICY "Allow all operations on template_likes"
  ON public.template_likes FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================
-- 3. 添加注释
-- ============================================
COMMENT ON TABLE public.template_favorites IS '模板收藏表';
COMMENT ON TABLE public.template_likes IS '模板点赞表';
