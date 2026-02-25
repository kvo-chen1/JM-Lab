-- 创建消息通知系统表
-- 包括：notifications, direct_messages, friend_requests

-- ============================================
-- 1. 创建 notifications 表（消息中心使用）
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK (type IN (
        'private_message', 'direct_message', 'reply', 'comment_reply', 'post_commented',
        'mention', 'at_mention', 'comment_replied',
        'like', 'post_liked', 'comment_liked', 'work_liked',
        'follow', 'user_followed', 'new_follower',
        'system', 'announcement', 'ranking_published', 'feedback_resolved',
        'invitation_received', 'invitation_accepted', 'application_approved', 'application_rejected'
    )),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    data JSONB DEFAULT '{}'::jsonb,
    link TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON public.notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);

-- 启用 RLS
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;

-- RLS 策略
CREATE POLICY "Users can view own notifications" ON public.notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.notifications
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "System can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (true);

-- ============================================
-- 2. 创建 direct_messages 表（私信功能）
-- ============================================

CREATE TABLE IF NOT EXISTS public.direct_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'text' CHECK (type IN ('text', 'image', 'work_share', 'community_invite')),
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_direct_messages_sender ON public.direct_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_receiver ON public.direct_messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_direct_messages_created_at ON public.direct_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_direct_messages_conversation ON public.direct_messages(sender_id, receiver_id);

-- 启用 RLS
ALTER TABLE public.direct_messages ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Users can view messages they sent or received" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can send messages" ON public.direct_messages;
DROP POLICY IF EXISTS "Users can update received messages (mark as read)" ON public.direct_messages;

-- RLS 策略
CREATE POLICY "Users can view messages they sent or received" ON public.direct_messages
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send messages" ON public.direct_messages
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update received messages (mark as read)" ON public.direct_messages
    FOR UPDATE USING (auth.uid() = receiver_id);

-- ============================================
-- 3. 创建 friend_requests 表（好友请求）
-- ============================================

CREATE TABLE IF NOT EXISTS public.friend_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(sender_id, receiver_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_friend_requests_sender ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_receiver ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS idx_friend_requests_status ON public.friend_requests(status);
CREATE INDEX IF NOT EXISTS idx_friend_requests_created_at ON public.friend_requests(created_at DESC);

-- 启用 RLS
ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Users can view own friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update own friend requests" ON public.friend_requests;

-- RLS 策略
CREATE POLICY "Users can view own friend requests" ON public.friend_requests
    FOR SELECT USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

CREATE POLICY "Users can send friend requests" ON public.friend_requests
    FOR INSERT WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update own friend requests" ON public.friend_requests
    FOR UPDATE USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- ============================================
-- 4. 创建触发器函数
-- ============================================

-- 更新时间戳触发器
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 应用到 direct_messages
DROP TRIGGER IF EXISTS update_direct_messages_updated_at ON public.direct_messages;
CREATE TRIGGER update_direct_messages_updated_at
    BEFORE UPDATE ON public.direct_messages
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 应用到 friend_requests
DROP TRIGGER IF EXISTS update_friend_requests_updated_at ON public.friend_requests;
CREATE TRIGGER update_friend_requests_updated_at
    BEFORE UPDATE ON public.friend_requests
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 5. 创建辅助函数
-- ============================================

-- 获取用户未读消息数
CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM public.direct_messages 
        WHERE receiver_id = p_user_id AND is_read = FALSE
    );
END;
$$;

-- 获取用户未读通知数
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM public.notifications 
        WHERE user_id = p_user_id AND is_read = FALSE
    );
END;
$$;

-- 发送通知的函数
CREATE OR REPLACE FUNCTION public.send_notification(
    p_user_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_content TEXT,
    p_sender_id UUID DEFAULT NULL,
    p_data JSONB DEFAULT '{}'::jsonb,
    p_link TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, sender_id, type, title, content, data, link)
    VALUES (p_user_id, p_sender_id, p_type, p_title, p_content, p_data, p_link)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;

-- 发送私信的函数
CREATE OR REPLACE FUNCTION public.send_direct_message(
    p_sender_id UUID,
    p_receiver_id UUID,
    p_content TEXT,
    p_type TEXT DEFAULT 'text'
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    message_id UUID;
BEGIN
    INSERT INTO public.direct_messages (sender_id, receiver_id, content, type)
    VALUES (p_sender_id, p_receiver_id, p_content, p_type)
    RETURNING id INTO message_id;
    
    -- 同时创建一条通知
    PERFORM public.send_notification(
        p_receiver_id,
        'private_message',
        '新私信',
        (SELECT username FROM public.users WHERE id = p_sender_id) || ' 给你发送了一条消息',
        p_sender_id,
        jsonb_build_object('message_id', message_id),
        '/messages'
    );
    
    RETURN message_id;
END;
$$;

-- 获取会话列表的函数
CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id UUID)
RETURNS TABLE (
    user_id UUID,
    username TEXT,
    avatar_url TEXT,
    last_message TEXT,
    last_message_time TIMESTAMPTZ,
    unread_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH conversations AS (
        SELECT 
            CASE 
                WHEN dm.sender_id = p_user_id THEN dm.receiver_id
                ELSE dm.sender_id
            END as other_user_id,
            dm.content,
            dm.created_at,
            CASE 
                WHEN dm.receiver_id = p_user_id AND NOT dm.is_read THEN 1
                ELSE 0
            END as is_unread
        FROM public.direct_messages dm
        WHERE dm.sender_id = p_user_id OR dm.receiver_id = p_user_id
    ),
    latest_messages AS (
        SELECT DISTINCT ON (other_user_id)
            other_user_id,
            content,
            created_at
        FROM conversations
        ORDER BY other_user_id, created_at DESC
    ),
    unread_counts AS (
        SELECT 
            other_user_id,
            SUM(is_unread) as unread
        FROM conversations
        GROUP BY other_user_id
    )
    SELECT 
        u.id,
        u.username,
        u.avatar_url,
        lm.content,
        lm.created_at,
        COALESCE(uc.unread, 0)::BIGINT
    FROM latest_messages lm
    JOIN public.users u ON u.id = lm.other_user_id
    LEFT JOIN unread_counts uc ON uc.other_user_id = lm.other_user_id
    ORDER BY lm.created_at DESC;
END;
$$;
