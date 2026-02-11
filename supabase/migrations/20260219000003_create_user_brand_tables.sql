-- 创建用户品牌历史表
-- 记录用户使用品牌的记录

-- 1. 创建用户品牌历史表
CREATE TABLE IF NOT EXISTS public.user_brand_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    brand_image TEXT,
    usage_count INTEGER NOT NULL DEFAULT 1,
    last_used_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, brand_id)
);

-- 2. 添加表注释
COMMENT ON TABLE public.user_brand_history IS '用户品牌使用历史记录';
COMMENT ON COLUMN public.user_brand_history.user_id IS '用户ID';
COMMENT ON COLUMN public.user_brand_history.brand_id IS '品牌ID';
COMMENT ON COLUMN public.user_brand_history.brand_name IS '品牌名称';
COMMENT ON COLUMN public.user_brand_history.brand_image IS '品牌图片URL';
COMMENT ON COLUMN public.user_brand_history.usage_count IS '使用次数';
COMMENT ON COLUMN public.user_brand_history.last_used_at IS '最后使用时间';

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_user_brand_history_user_id ON public.user_brand_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_brand_history_brand_id ON public.user_brand_history(brand_id);
CREATE INDEX IF NOT EXISTS idx_user_brand_history_last_used ON public.user_brand_history(last_used_at DESC);

-- 4. 启用 RLS
ALTER TABLE public.user_brand_history ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略
CREATE POLICY "Users can view own brand history" ON public.user_brand_history
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own brand history" ON public.user_brand_history
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own brand history" ON public.user_brand_history
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own brand history" ON public.user_brand_history
    FOR DELETE USING (auth.uid() = user_id);

-- 6. 创建更新时间触发器
CREATE OR REPLACE FUNCTION public.update_user_brand_history_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_used_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_user_brand_history_timestamp ON public.user_brand_history;

CREATE TRIGGER update_user_brand_history_timestamp
    BEFORE UPDATE ON public.user_brand_history
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_brand_history_timestamp();


-- 创建用户收藏表
-- 记录用户收藏的品牌

-- 1. 创建用户收藏表
CREATE TABLE IF NOT EXISTS public.user_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    brand_image TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, brand_id)
);

-- 2. 添加表注释
COMMENT ON TABLE public.user_favorites IS '用户收藏的品牌';
COMMENT ON COLUMN public.user_favorites.user_id IS '用户ID';
COMMENT ON COLUMN public.user_favorites.brand_id IS '品牌ID';
COMMENT ON COLUMN public.user_favorites.brand_name IS '品牌名称';
COMMENT ON COLUMN public.user_favorites.brand_image IS '品牌图片URL';
COMMENT ON COLUMN public.user_favorites.notes IS '用户备注';

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_user_favorites_user_id ON public.user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_user_favorites_created_at ON public.user_favorites(created_at DESC);

-- 4. 启用 RLS
ALTER TABLE public.user_favorites ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略
CREATE POLICY "Users can view own favorites" ON public.user_favorites
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites" ON public.user_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own favorites" ON public.user_favorites
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites" ON public.user_favorites
    FOR DELETE USING (auth.uid() = user_id);


-- 创建品牌评分表
-- 记录用户对品牌的评分和评价

-- 1. 创建品牌评分表
CREATE TABLE IF NOT EXISTS public.brand_ratings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    brand_id TEXT NOT NULL,
    brand_name TEXT NOT NULL,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id, brand_id)
);

-- 2. 添加表注释
COMMENT ON TABLE public.brand_ratings IS '用户对品牌的评分和评价';
COMMENT ON COLUMN public.brand_ratings.user_id IS '用户ID';
COMMENT ON COLUMN public.brand_ratings.brand_id IS '品牌ID';
COMMENT ON COLUMN public.brand_ratings.brand_name IS '品牌名称';
COMMENT ON COLUMN public.brand_ratings.rating IS '评分（1-5星）';
COMMENT ON COLUMN public.brand_ratings.review IS '评价内容';

-- 3. 创建索引
CREATE INDEX IF NOT EXISTS idx_brand_ratings_user_id ON public.brand_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_brand_ratings_brand_id ON public.brand_ratings(brand_id);
CREATE INDEX IF NOT EXISTS idx_brand_ratings_rating ON public.brand_ratings(rating);
CREATE INDEX IF NOT EXISTS idx_brand_ratings_created_at ON public.brand_ratings(created_at DESC);

-- 4. 启用 RLS
ALTER TABLE public.brand_ratings ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略
CREATE POLICY "Users can view all ratings" ON public.brand_ratings
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own ratings" ON public.brand_ratings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own ratings" ON public.brand_ratings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own ratings" ON public.brand_ratings
    FOR DELETE USING (auth.uid() = user_id);

-- 6. 创建更新时间触发器
CREATE OR REPLACE FUNCTION public.update_brand_ratings_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_brand_ratings_timestamp ON public.brand_ratings;

CREATE TRIGGER update_brand_ratings_timestamp
    BEFORE UPDATE ON public.brand_ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_brand_ratings_timestamp();
