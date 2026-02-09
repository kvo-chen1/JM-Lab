-- 创建模板收藏表
CREATE TABLE IF NOT EXISTS template_favorites (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, template_id)
);

-- 创建模板点赞表
CREATE TABLE IF NOT EXISTS template_likes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    template_id INTEGER NOT NULL REFERENCES tianjin_templates(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, template_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_template_favorites_user_id ON template_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_template_favorites_template_id ON template_favorites(template_id);
CREATE INDEX IF NOT EXISTS idx_template_likes_user_id ON template_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_template_likes_template_id ON template_likes(template_id);

-- 启用 RLS (Row Level Security)
ALTER TABLE template_favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE template_likes ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略 - 用户只能查看自己的收藏
CREATE POLICY "Users can view own favorites" ON template_favorites
    FOR SELECT USING (auth.uid() = user_id);

-- 创建 RLS 策略 - 用户只能插入自己的收藏
CREATE POLICY "Users can insert own favorites" ON template_favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建 RLS 策略 - 用户只能删除自己的收藏
CREATE POLICY "Users can delete own favorites" ON template_favorites
    FOR DELETE USING (auth.uid() = user_id);

-- 创建 RLS 策略 - 用户只能查看自己的点赞
CREATE POLICY "Users can view own likes" ON template_likes
    FOR SELECT USING (auth.uid() = user_id);

-- 创建 RLS 策略 - 用户只能插入自己的点赞
CREATE POLICY "Users can insert own likes" ON template_likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 创建 RLS 策略 - 用户只能删除自己的点赞
CREATE POLICY "Users can delete own likes" ON template_likes
    FOR DELETE USING (auth.uid() = user_id);

-- 创建函数：获取模板的收藏数
CREATE OR REPLACE FUNCTION get_template_favorite_count(template_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM template_favorites WHERE template_favorites.template_id = $1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：获取模板的点赞数
CREATE OR REPLACE FUNCTION get_template_like_count(template_id INTEGER)
RETURNS INTEGER AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM template_likes WHERE template_likes.template_id = $1);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON TABLE template_favorites IS '用户模板收藏表';
COMMENT ON TABLE template_likes IS '用户模板点赞表';
