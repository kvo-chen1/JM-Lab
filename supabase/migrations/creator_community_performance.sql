-- 中文注释：为帖子添加生成列search并建立GIN索引，提升全文检索性能
ALTER TABLE posts
  ADD COLUMN IF NOT EXISTS search tsvector GENERATED ALWAYS AS (
    to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,''))
  ) STORED;

DROP INDEX IF EXISTS idx_posts_fulltext;
CREATE INDEX IF NOT EXISTS idx_posts_search ON posts USING GIN (search);

-- 中文注释：为likes表添加便于按post_id与user_id查询的索引
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);

-- 中文注释：为comments表添加便于按author_id查询的索引（post_id索引已存在）
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);

-- 中文注释：提供安全的浏览量自增函数，可供Edge Function或RPC调用
CREATE OR REPLACE FUNCTION increment_post_view(p_post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts SET view_count = COALESCE(view_count, 0) + 1 WHERE id = p_post_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

