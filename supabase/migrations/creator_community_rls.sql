-- 中文注释：启用必要的扩展（可选，用于全文检索与相似度）
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 中文注释：通用触发器函数，自动更新updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 中文注释：为users、posts表添加更新触发器
DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS posts_set_updated_at ON posts;
CREATE TRIGGER posts_set_updated_at
BEFORE UPDATE ON posts
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

-- 中文注释：为follows添加自关注校验约束
ALTER TABLE follows
  DROP CONSTRAINT IF EXISTS follows_self_follow_check;
ALTER TABLE follows
  ADD CONSTRAINT follows_self_follow_check CHECK (follower_id <> following_id);

-- 中文注释：启用行级安全（RLS）
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 中文注释：删除已有策略，避免重复创建失败
DROP POLICY IF EXISTS users_select_all ON users;
DROP POLICY IF EXISTS users_update_self ON users;
DROP POLICY IF EXISTS users_insert_self ON users;

DROP POLICY IF EXISTS posts_select_published_or_owner ON posts;
DROP POLICY IF EXISTS posts_write_owner ON posts;

DROP POLICY IF EXISTS comments_select_all ON comments;
DROP POLICY IF EXISTS comments_write_owner ON comments;

DROP POLICY IF EXISTS follows_select_all ON follows;
DROP POLICY IF EXISTS follows_write_owner ON follows;

DROP POLICY IF EXISTS likes_select_all ON likes;
DROP POLICY IF EXISTS likes_write_owner ON likes;

-- 中文注释：users策略
CREATE POLICY users_select_all ON users
  FOR SELECT
  USING (true);

CREATE POLICY users_update_self ON users
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY users_insert_self ON users
  FOR INSERT
  WITH CHECK (auth.uid() = id);

-- 中文注释：posts策略（已发布可读，作者可读写）
CREATE POLICY posts_select_published_or_owner ON posts
  FOR SELECT
  USING (status = 'published' OR auth.uid() = author_id);

CREATE POLICY posts_write_owner ON posts
  FOR ALL
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 中文注释：comments策略（所有可读，作者可写改删）
CREATE POLICY comments_select_all ON comments
  FOR SELECT
  USING (true);

CREATE POLICY comments_write_owner ON comments
  FOR ALL
  USING (auth.uid() = author_id)
  WITH CHECK (auth.uid() = author_id);

-- 中文注释：follows策略（所有可读，只有自己能写/删自己的关注）
CREATE POLICY follows_select_all ON follows
  FOR SELECT
  USING (true);

CREATE POLICY follows_write_owner ON follows
  FOR ALL
  USING (auth.uid() = follower_id)
  WITH CHECK (auth.uid() = follower_id);

-- 中文注释：likes策略（所有可读，只有自己能写/删自己的点赞）
CREATE POLICY likes_select_all ON likes
  FOR SELECT
  USING (true);

CREATE POLICY likes_write_owner ON likes
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 中文注释：帖子全文检索索引（简体中文可先用simple解析器）
DROP INDEX IF EXISTS idx_posts_fulltext;
CREATE INDEX idx_posts_fulltext ON posts
USING GIN (to_tsvector('simple', coalesce(title,'') || ' ' || coalesce(content,'')));

-- 中文注释：聚合统计视图（点赞数与评论数）
CREATE OR REPLACE VIEW post_stats AS
SELECT p.id AS post_id,
       COALESCE(lc.likes_count, 0) AS likes_count,
       COALESCE(cc.comments_count, 0) AS comments_count
FROM posts p
LEFT JOIN (
  SELECT post_id, COUNT(*) AS likes_count
  FROM likes
  GROUP BY post_id
) lc ON lc.post_id = p.id
LEFT JOIN (
  SELECT post_id, COUNT(*) AS comments_count
  FROM comments
  GROUP BY post_id
) cc ON cc.post_id = p.id;

-- 中文注释：用户统计视图（粉丝、关注、发布帖子数）
CREATE OR REPLACE VIEW user_stats AS
SELECT u.id AS user_id,
       COALESCE(fans.cnt, 0) AS followers_count,
       COALESCE(following.cnt, 0) AS following_count,
       COALESCE(posts_cnt.cnt, 0) AS posts_count
FROM users u
LEFT JOIN (
  SELECT following_id AS user_id, COUNT(*) AS cnt
  FROM follows
  GROUP BY following_id
) fans ON fans.user_id = u.id
LEFT JOIN (
  SELECT follower_id AS user_id, COUNT(*) AS cnt
  FROM follows
  GROUP BY follower_id
) following ON following.user_id = u.id
LEFT JOIN (
  SELECT author_id AS user_id, COUNT(*) AS cnt
  FROM posts
  WHERE status = 'published'
  GROUP BY author_id
) posts_cnt ON posts_cnt.user_id = u.id;

