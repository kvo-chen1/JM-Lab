-- 创作者社区数据库初始化脚本
-- 创建时间：2026-01-20

-- 用户表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    username VARCHAR(50) UNIQUE NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    is_verified BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 帖子表
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    attachments JSONB DEFAULT '[]',
    status VARCHAR(20) DEFAULT 'published' CHECK (status IN ('draft', 'published', 'archived')),
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 评论表
CREATE TABLE IF NOT EXISTS comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    author_id UUID REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_id UUID REFERENCES comments(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 关注关系表
CREATE TABLE IF NOT EXISTS follows (
    follower_id UUID REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

-- 点赞表
CREATE TABLE IF NOT EXISTS likes (
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_posts_author_id ON posts(author_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_status ON posts(status);
CREATE INDEX IF NOT EXISTS idx_comments_post_id ON comments(post_id);
CREATE INDEX IF NOT EXISTS idx_comments_author_id ON comments(author_id);
CREATE INDEX IF NOT EXISTS idx_follows_follower ON follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_follows_following ON follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_user_id ON likes(user_id);
CREATE INDEX IF NOT EXISTS idx_likes_post_id ON likes(post_id);

-- 设置权限
GRANT SELECT ON users TO anon;
GRANT SELECT ON posts TO anon;
GRANT SELECT ON comments TO anon;
GRANT SELECT ON follows TO anon;
GRANT SELECT ON likes TO anon;

GRANT ALL ON users TO authenticated;
GRANT ALL ON posts TO authenticated;
GRANT ALL ON comments TO authenticated;
GRANT ALL ON follows TO authenticated;
GRANT ALL ON likes TO authenticated;

-- 创建 RLS 策略
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;

-- 用户表 RLS 策略
CREATE POLICY "用户可查看所有用户资料" ON users FOR SELECT USING (true);
CREATE POLICY "用户只能更新自己的资料" ON users FOR UPDATE USING (auth.uid() = id);

-- 帖子表 RLS 策略
CREATE POLICY "所有人可查看已发布帖子" ON posts FOR SELECT USING (status = 'published');
CREATE POLICY "认证用户可创建帖子" ON posts FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "作者可更新自己的帖子" ON posts FOR UPDATE USING (auth.uid() = author_id);
CREATE POLICY "作者可删除自己的帖子" ON posts FOR DELETE USING (auth.uid() = author_id);

-- 评论表 RLS 策略
CREATE POLICY "所有人可查看评论" ON comments FOR SELECT USING (true);
CREATE POLICY "认证用户可创建评论" ON comments FOR INSERT WITH CHECK (auth.uid() = author_id);
CREATE POLICY "用户可删除自己的评论" ON comments FOR DELETE USING (auth.uid() = author_id);

-- 关注表 RLS 策略
CREATE POLICY "所有人可查看关注关系" ON follows FOR SELECT USING (true);
CREATE POLICY "认证用户可关注他人" ON follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "用户可取消自己的关注" ON follows FOR DELETE USING (auth.uid() = follower_id);

-- 点赞表 RLS 策略
CREATE POLICY "所有人可查看点赞" ON likes FOR SELECT USING (true);
CREATE POLICY "认证用户可点赞" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "用户可取消自己的点赞" ON likes FOR DELETE USING (auth.uid() = user_id);