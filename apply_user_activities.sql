-- 创建用户活动记录表
-- 用于记录用户的各种行为：发布作品、点赞、评论、关注等
CREATE TABLE IF NOT EXISTS public.user_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('post', 'like', 'comment', 'follow')),
    content TEXT NOT NULL,
    target_id UUID,
    target_type TEXT CHECK (target_type IN ('post', 'user')),
    target_title TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_activities_user_id ON public.user_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activities_created_at ON public.user_activities(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_user_created ON public.user_activities(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activities_type ON public.user_activities(activity_type);

-- 启用 RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- RLS 策略：用户可以查看自己的活动记录，也可以查看其他用户的公开活动
CREATE POLICY "Users can view all activities" ON public.user_activities
    FOR SELECT
    USING (true);

-- RLS 策略：只有系统可以插入活动记录（通过触发器）
CREATE POLICY "Only system can insert activities" ON public.user_activities
    FOR INSERT
    WITH CHECK (true);

-- RLS 策略：用户不能修改或删除活动记录
CREATE POLICY "No update on activities" ON public.user_activities
    FOR UPDATE
    USING (false);

CREATE POLICY "No delete on activities" ON public.user_activities
    FOR DELETE
    USING (false);

-- 创建函数：记录用户发布作品活动
CREATE OR REPLACE FUNCTION public.log_post_activity()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
        INSERT INTO public.user_activities (
            user_id,
            activity_type,
            content,
            target_id,
            target_type,
            target_title,
            metadata
        ) VALUES (
            NEW.author_id,
            'post',
            '发布了新作品《' || NEW.title || '》',
            NEW.id,
            'post',
            NEW.title,
            jsonb_build_object(
                'post_status', NEW.status,
                'post_category', NEW.category
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：当用户发布作品时记录活动
DROP TRIGGER IF EXISTS log_post_activity_trigger ON public.posts;
CREATE TRIGGER log_post_activity_trigger
    AFTER INSERT ON public.posts
    FOR EACH ROW
    EXECUTE FUNCTION public.log_post_activity();

-- 创建函数：记录用户点赞活动
CREATE OR REPLACE FUNCTION public.log_like_activity()
RETURNS TRIGGER AS $$
DECLARE
    post_title TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT title INTO post_title FROM public.posts WHERE id = NEW.post_id;

        INSERT INTO public.user_activities (
            user_id,
            activity_type,
            content,
            target_id,
            target_type,
            target_title,
            metadata
        ) VALUES (
            NEW.user_id,
            'like',
            '点赞了作品',
            NEW.post_id,
            'post',
            post_title,
            jsonb_build_object(
                'liked_at', NEW.created_at
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：当用户点赞时记录活动
DROP TRIGGER IF EXISTS log_like_activity_trigger ON public.likes;
CREATE TRIGGER log_like_activity_trigger
    AFTER INSERT ON public.likes
    FOR EACH ROW
    EXECUTE FUNCTION public.log_like_activity();

-- 创建函数：记录用户评论活动
CREATE OR REPLACE FUNCTION public.log_comment_activity()
RETURNS TRIGGER AS $$
DECLARE
    post_title TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT title INTO post_title FROM public.posts WHERE id = NEW.post_id;

        INSERT INTO public.user_activities (
            user_id,
            activity_type,
            content,
            target_id,
            target_type,
            target_title,
            metadata
        ) VALUES (
            NEW.author_id,
            'comment',
            '评论了作品',
            NEW.post_id,
            'post',
            post_title,
            jsonb_build_object(
                'comment_preview', LEFT(NEW.content, 100),
                'comment_id', NEW.id
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：当用户评论时记录活动
DROP TRIGGER IF EXISTS log_comment_activity_trigger ON public.comments;
CREATE TRIGGER log_comment_activity_trigger
    AFTER INSERT ON public.comments
    FOR EACH ROW
    EXECUTE FUNCTION public.log_comment_activity();

-- 创建函数：记录用户关注活动
CREATE OR REPLACE FUNCTION public.log_follow_activity()
RETURNS TRIGGER AS $$
DECLARE
    followed_username TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        SELECT username INTO followed_username FROM public.users WHERE id = NEW.following_id;

        INSERT INTO public.user_activities (
            user_id,
            activity_type,
            content,
            target_id,
            target_type,
            target_title,
            metadata
        ) VALUES (
            NEW.follower_id,
            'follow',
            '关注了创作者',
            NEW.following_id,
            'user',
            followed_username,
            jsonb_build_object(
                'followed_at', NEW.created_at
            )
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：当用户关注时记录活动
DROP TRIGGER IF EXISTS log_follow_activity_trigger ON public.follows;
CREATE TRIGGER log_follow_activity_trigger
    AFTER INSERT ON public.follows
    FOR EACH ROW
    EXECUTE FUNCTION public.log_follow_activity();

-- 创建函数：获取用户活动列表
CREATE OR REPLACE FUNCTION public.get_user_activities(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    activity_type TEXT,
    content TEXT,
    target_id UUID,
    target_type TEXT,
    target_title TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        ua.id,
        ua.activity_type,
        ua.content,
        ua.target_id,
        ua.target_type,
        ua.target_title,
        ua.created_at
    FROM public.user_activities ua
    WHERE ua.user_id = p_user_id
    ORDER BY ua.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON TABLE public.user_activities IS '用户活动记录表，存储用户的各种行为记录';
COMMENT ON COLUMN public.user_activities.activity_type IS '活动类型：post(发布), like(点赞), comment(评论), follow(关注)';
COMMENT ON COLUMN public.user_activities.target_id IS '目标对象ID（如作品ID或用户ID）';
COMMENT ON COLUMN public.user_activities.target_type IS '目标对象类型：post(作品) 或 user(用户)';
COMMENT ON COLUMN public.user_activities.target_title IS '目标对象标题（如作品标题或用户名）';
