-- ============================================
-- @提及系统数据库迁移
-- 支持帖子、评论、聊天中的@提及功能
-- ============================================

-- 0. 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS pg_trgm; -- 用于模糊搜索

-- ============================================
-- 1. 创建 mentions 表（@提及关系表）
-- ============================================

CREATE TABLE IF NOT EXISTS public.mentions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    -- @者（发送者）
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    -- 被@者（接收者）
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    -- 提及场景类型
    mention_type TEXT NOT NULL CHECK (mention_type IN ('post', 'comment', 'chat', 'reply')),
    -- 关联内容ID
    content_id UUID NOT NULL,
    -- 关联内容类型（与mention_type对应）
    content_type TEXT NOT NULL CHECK (content_type IN ('post', 'comment', 'message')),
    -- 提及在内容中的位置（用于高亮显示）
    mention_position INTEGER,
    -- 提及的原始文本
    mention_text TEXT NOT NULL,
    -- 内容预览（用于通知显示）
    content_preview TEXT,
    -- 社群ID（用于权限控制）
    community_id UUID REFERENCES public.communities(id) ON DELETE CASCADE,
    -- 通知状态
    notification_sent BOOLEAN DEFAULT FALSE,
    notification_read BOOLEAN DEFAULT FALSE,
    -- 时间戳
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_mentions_sender_id ON public.mentions(sender_id);
CREATE INDEX IF NOT EXISTS idx_mentions_receiver_id ON public.mentions(receiver_id);
CREATE INDEX IF NOT EXISTS idx_mentions_content_id ON public.mentions(content_id);
CREATE INDEX IF NOT EXISTS idx_mentions_community_id ON public.mentions(community_id);
CREATE INDEX IF NOT EXISTS idx_mentions_created_at ON public.mentions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_mentions_receiver_read ON public.mentions(receiver_id, notification_read);
-- 复合索引：查询用户在特定社群的提及
CREATE INDEX IF NOT EXISTS idx_mentions_receiver_community ON public.mentions(receiver_id, community_id);

-- 启用 RLS
ALTER TABLE public.mentions ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can view mentions where they are sender or receiver" ON public.mentions
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can create mentions" ON public.mentions
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own mentions" ON public.mentions
    FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================
-- 2. 创建用户搜索视图（用于@提及时的成员搜索）
-- ============================================

CREATE OR REPLACE VIEW public.community_members_search AS
SELECT 
    cm.community_id,
    u.id as user_id,
    u.username,
    u.avatar_url,
    u.bio,
    cm.role as member_role,
    cm.joined_at,
    -- 创建用于搜索的复合文本
    (u.username || ' ' || COALESCE(u.bio, '')) as search_text
FROM public.community_members cm
JOIN public.users u ON cm.user_id = u.id
WHERE u.is_active = TRUE;

-- ============================================
-- 3. 创建搜索用户的函数（支持模糊搜索）
-- ============================================

CREATE OR REPLACE FUNCTION public.search_community_members(
    p_community_id UUID,
    p_search_query TEXT,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    bio TEXT,
    member_role TEXT,
    similarity_score FLOAT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- 如果搜索词为空，返回最近加入的成员
    IF p_search_query IS NULL OR trim(p_search_query) = '' THEN
        RETURN QUERY
        SELECT 
            cms.user_id,
            cms.username::TEXT,
            cms.avatar_url::TEXT,
            cms.bio::TEXT,
            cms.member_role::TEXT,
            1.0::FLOAT as similarity_score
        FROM public.community_members_search cms
        WHERE cms.community_id = p_community_id
        ORDER BY cms.joined_at DESC
        LIMIT p_limit;
        RETURN;
    END IF;

    -- 使用 trigram 相似度进行模糊搜索
    RETURN QUERY
    SELECT 
        cms.user_id,
        cms.username::TEXT,
        cms.avatar_url::TEXT,
        cms.bio::TEXT,
        cms.member_role::TEXT,
        GREATEST(
            similarity(cms.username, p_search_query),
            similarity(COALESCE(cms.bio, ''), p_search_query)
        )::FLOAT as similarity_score
    FROM public.community_members_search cms
    WHERE cms.community_id = p_community_id
        AND (
            cms.username ILIKE '%' || p_search_query || '%'
            OR cms.bio ILIKE '%' || p_search_query || '%'
            OR similarity(cms.username, p_search_query) > 0.3
        )
    ORDER BY similarity_score DESC, cms.username
    LIMIT p_limit;
END;
$$;

-- ============================================
-- 4. 创建解析@提及的函数
-- ============================================

CREATE OR REPLACE FUNCTION public.parse_mentions(p_content TEXT)
RETURNS TABLE (
    username TEXT,
    position INTEGER
)
LANGUAGE plpgsql IMMUTABLE
AS $$
DECLARE
    pattern TEXT := '@([a-zA-Z0-9_\u4e00-\u9fa5]+)';  -- 支持中文用户名
    match RECORD;
    pos INTEGER := 1;
BEGIN
    -- 使用正则表达式提取所有@提及
    FOR match IN 
        SELECT regexp_matches(p_content, pattern, 'g') as matches,
               regexp_match(p_content, pattern, 'g') as full_match
    LOOP
        -- 获取匹配位置
        pos := position(full_match[1] in substring(p_content from pos)) + pos - 1;
        username := match.matches[1];
        position := pos;
        RETURN NEXT;
        pos := pos + length(full_match[1]);
    END LOOP;
END;
$$;

-- ============================================
-- 5. 创建设置@提及的函数
-- ============================================

CREATE OR REPLACE FUNCTION public.create_mention(
    p_sender_id UUID,
    p_receiver_username TEXT,
    p_mention_type TEXT,
    p_content_id UUID,
    p_content_type TEXT,
    p_content_preview TEXT,
    p_community_id UUID DEFAULT NULL,
    p_mention_position INTEGER DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_receiver_id UUID;
    v_mention_id UUID;
BEGIN
    -- 查找接收者ID
    SELECT id INTO v_receiver_id
    FROM public.users
    WHERE username = p_receiver_username;

    IF v_receiver_id IS NULL THEN
        RAISE EXCEPTION 'User not found: %', p_receiver_username;
    END IF;

    -- 检查接收者是否在社群中（如果指定了社群）
    IF p_community_id IS NOT NULL THEN
        IF NOT EXISTS (
            SELECT 1 FROM public.community_members
            WHERE community_id = p_community_id AND user_id = v_receiver_id
        ) THEN
            RAISE EXCEPTION 'User is not a member of this community';
        END IF;
    END IF;

    -- 创建提及记录
    INSERT INTO public.mentions (
        sender_id,
        receiver_id,
        mention_type,
        content_id,
        content_type,
        content_preview,
        community_id,
        mention_position,
        mention_text
    ) VALUES (
        p_sender_id,
        v_receiver_id,
        p_mention_type,
        p_content_id,
        p_content_type,
        p_content_preview,
        p_community_id,
        p_mention_position,
        '@' || p_receiver_username
    )
    RETURNING id INTO v_mention_id;

    -- 发送通知
    PERFORM public.send_mention_notification(v_mention_id);

    RETURN v_mention_id;
END;
$$;

-- ============================================
-- 6. 创建发送@提及通知的函数
-- ============================================

CREATE OR REPLACE FUNCTION public.send_mention_notification(p_mention_id UUID)
RETURNS VOID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_mention RECORD;
    v_sender_name TEXT;
    v_community_name TEXT;
    v_notification_title TEXT;
    v_notification_content TEXT;
    v_link TEXT;
BEGIN
    -- 获取提及信息
    SELECT m.*, u.username as sender_username
    INTO v_mention
    FROM public.mentions m
    JOIN public.users u ON m.sender_id = u.id
    WHERE m.id = p_mention_id;

    IF v_mention IS NULL THEN
        RETURN;
    END IF;

    v_sender_name := v_mention.sender_username;

    -- 获取社群名称
    IF v_mention.community_id IS NOT NULL THEN
        SELECT name INTO v_community_name
        FROM public.communities
        WHERE id = v_mention.community_id;
    END IF;

    -- 构建通知内容
    v_notification_title := v_sender_name || ' 提到了你';
    
    CASE v_mention.mention_type
        WHEN 'post' THEN
            v_notification_content := v_sender_name || ' 在帖子中提到了你';
            v_link := '/community/' || v_mention.community_id || '/post/' || v_mention.content_id;
        WHEN 'comment' THEN
            v_notification_content := v_sender_name || ' 在评论中提到了你';
            v_link := '/community/' || v_mention.community_id || '/post/' || v_mention.content_id;
        WHEN 'reply' THEN
            v_notification_content := v_sender_name || ' 在回复中提到了你';
            v_link := '/community/' || v_mention.community_id || '/post/' || v_mention.content_id;
        WHEN 'chat' THEN
            v_notification_content := v_sender_name || ' 在聊天中提到了你';
            v_link := '/chat/' || v_mention.content_id;
        ELSE
            v_notification_content := v_sender_name || ' 提到了你';
            v_link := '/notifications';
    END CASE;

    IF v_community_name IS NOT NULL THEN
        v_notification_content := v_notification_content || '（在 ' || v_community_name || '）';
    END IF;

    -- 发送通知
    PERFORM public.send_notification(
        v_mention.receiver_id,
        'mention',
        v_notification_title,
        v_notification_content,
        v_mention.sender_id,
        jsonb_build_object(
            'mention_id', v_mention.id,
            'content_id', v_mention.content_id,
            'content_type', v_mention.content_type,
            'community_id', v_mention.community_id
        ),
        v_link
    );

    -- 更新提及记录为已发送通知
    UPDATE public.mentions
    SET notification_sent = TRUE
    WHERE id = p_mention_id;
END;
$$;

-- ============================================
-- 7. 创建批量处理@提及的函数
-- ============================================

CREATE OR REPLACE FUNCTION public.process_content_mentions(
    p_content TEXT,
    p_sender_id UUID,
    p_mention_type TEXT,
    p_content_id UUID,
    p_content_type TEXT,
    p_community_id UUID DEFAULT NULL
)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_mention RECORD;
    v_count INTEGER := 0;
    v_preview TEXT;
BEGIN
    -- 生成内容预览（前100个字符）
    v_preview := substring(p_content, 1, 100);
    IF length(p_content) > 100 THEN
        v_preview := v_preview || '...';
    END IF;

    -- 解析并处理所有@提及
    FOR v_mention IN 
        SELECT * FROM public.parse_mentions(p_content)
    LOOP
        BEGIN
            PERFORM public.create_mention(
                p_sender_id,
                v_mention.username,
                p_mention_type,
                p_content_id,
                p_content_type,
                v_preview,
                p_community_id,
                v_mention.position
            );
            v_count := v_count + 1;
        EXCEPTION WHEN OTHERS THEN
            -- 忽略无效的提及（如用户不存在）
            CONTINUE;
        END;
    END LOOP;

    RETURN v_count;
END;
$$;

-- ============================================
-- 8. 创建获取用户提及列表的函数
-- ============================================

CREATE OR REPLACE FUNCTION public.get_user_mentions(
    p_user_id UUID,
    p_unread_only BOOLEAN DEFAULT FALSE,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    sender_id UUID,
    sender_username TEXT,
    sender_avatar TEXT,
    mention_type TEXT,
    content_id UUID,
    content_type TEXT,
    content_preview TEXT,
    community_id UUID,
    community_name TEXT,
    notification_read BOOLEAN,
    created_at TIMESTAMPTZ
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.sender_id,
        u.username::TEXT as sender_username,
        u.avatar_url::TEXT as sender_avatar,
        m.mention_type,
        m.content_id,
        m.content_type,
        m.content_preview,
        m.community_id,
        c.name::TEXT as community_name,
        m.notification_read,
        m.created_at
    FROM public.mentions m
    JOIN public.users u ON m.sender_id = u.id
    LEFT JOIN public.communities c ON m.community_id = c.id
    WHERE m.receiver_id = p_user_id
        AND (NOT p_unread_only OR m.notification_read = FALSE)
    ORDER BY m.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;

-- ============================================
-- 9. 创建标记提及为已读的函数
-- ============================================

CREATE OR REPLACE FUNCTION public.mark_mention_as_read(
    p_mention_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.mentions
    SET notification_read = TRUE,
        updated_at = NOW()
    WHERE id = p_mention_id
        AND receiver_id = p_user_id;

    RETURN FOUND;
END;
$$;

-- ============================================
-- 10. 创建触发器：自动更新时间戳
-- ============================================

CREATE OR REPLACE TRIGGER update_mentions_updated_at
    BEFORE UPDATE ON public.mentions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 11. 创建获取未读提及数量的函数
-- ============================================

CREATE OR REPLACE FUNCTION public.get_unread_mention_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*)::INTEGER
        FROM public.mentions
        WHERE receiver_id = p_user_id
            AND notification_read = FALSE
    );
END;
$$;

-- ============================================
-- 12. 添加注释
-- ============================================

COMMENT ON TABLE public.mentions IS '存储用户@提及关系';
COMMENT ON COLUMN public.mentions.mention_type IS '提及场景：post(帖子), comment(评论), chat(聊天), reply(回复)';
COMMENT ON COLUMN public.mentions.content_type IS '内容类型：post, comment, message';
COMMENT ON COLUMN public.mentions.mention_position IS '@提及在内容中的字符位置';
COMMENT ON COLUMN public.mentions.notification_sent IS '是否已发送通知';
COMMENT ON COLUMN public.mentions.notification_read IS '接收者是否已读';
