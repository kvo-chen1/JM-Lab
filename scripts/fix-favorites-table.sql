-- 修复 favorites 表结构
-- 由于类型转换复杂，我们采用重建表的方式

-- 1. 创建新表
CREATE TABLE favorites_new (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, post_id)
);

-- 2. 迁移数据（如果有的话）
-- INSERT INTO favorites_new (user_id, created_at)
-- SELECT user_id, to_timestamp(created_at / 1000.0)
-- FROM favorites;

-- 3. 删除旧表
DROP TABLE favorites CASCADE;

-- 4. 重命名新表
ALTER TABLE favorites_new RENAME TO favorites;

-- 5. 创建索引
CREATE INDEX idx_favorites_user_id ON favorites(user_id);
CREATE INDEX idx_favorites_post_id ON favorites(post_id);

-- 6. 启用 RLS
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;

-- 7. 创建 RLS 策略
CREATE POLICY "Users can view their own favorites" 
    ON favorites FOR SELECT 
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites" 
    ON favorites FOR INSERT 
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites" 
    ON favorites FOR DELETE 
    USING (auth.uid() = user_id);
