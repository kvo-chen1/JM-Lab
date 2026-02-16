-- 在 Supabase SQL Editor 中执行此文件
-- 步骤：
-- 1. 登录 Supabase 控制台
-- 2. 进入 SQL Editor
-- 3. 复制以下所有内容并粘贴
-- 4. 点击 Run 执行

-- ============================================
-- 第一部分：创建表和字段
-- ============================================

-- 为 events 表添加最终排名发布相关字段
ALTER TABLE public.events 
ADD COLUMN IF NOT EXISTS final_ranking_published boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS final_ranking_published_at timestamptz,
ADD COLUMN IF NOT EXISTS final_ranking_published_by uuid REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS final_ranking_data jsonb;

-- 创建最终排名发布记录表
CREATE TABLE IF NOT EXISTS public.final_ranking_publishes (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    published_by uuid NOT NULL REFERENCES auth.users(id),
    published_at timestamptz DEFAULT now(),
    ranking_data jsonb NOT NULL,
    notification_sent boolean DEFAULT false,
    notification_sent_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- 删除旧的通知表（如果存在且结构不正确）
-- 注意：这会删除现有数据，请确保已备份
DROP TABLE IF EXISTS public.notifications CASCADE;

-- 创建新的通知表（匹配前端代码期望的结构）
CREATE TABLE IF NOT EXISTS public.notifications (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    type text NOT NULL,
    title text NOT NULL,
    content text,
    sender_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
    sender_name text,
    community_id uuid,
    post_id uuid,
    comment_id uuid,
    priority text DEFAULT 'medium',
    link text,
    is_read boolean DEFAULT false,
    read_at timestamptz,
    created_at timestamptz DEFAULT now()
);

-- ============================================
-- 第二部分：添加索引
-- ============================================

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON public.notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_is_read ON public.notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON public.notifications(type);
CREATE INDEX IF NOT EXISTS idx_final_ranking_publishes_event_id ON public.final_ranking_publishes(event_id);

-- ============================================
-- 第三部分：启用 RLS 并创建策略
-- ============================================

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.final_ranking_publishes ENABLE ROW LEVEL SECURITY;

-- 通知表策略
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
    ON public.notifications
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert notifications" ON public.notifications;
CREATE POLICY "Users can insert notifications"
    ON public.notifications
    FOR INSERT
    WITH CHECK (auth.uid() = user_id OR auth.uid() IN (
        SELECT id FROM auth.users WHERE raw_user_meta_data->>'role' = 'admin'
    ));

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
    ON public.notifications
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;
CREATE POLICY "Users can delete their own notifications"
    ON public.notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- 最终排名发布表策略
DROP POLICY IF EXISTS "Organizers can view ranking publishes" ON public.final_ranking_publishes;
CREATE POLICY "Organizers can view ranking publishes"
    ON public.final_ranking_publishes
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.events e
            WHERE e.id = final_ranking_publishes.event_id
            AND e.organizer_id = auth.uid()
        )
    );

-- ============================================
-- 第四部分：创建 RPC 函数
-- ============================================

-- 函数1：发布最终排名
CREATE OR REPLACE FUNCTION public.publish_final_ranking(
    p_event_id uuid,
    p_published_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_title text;
    v_ranking_data jsonb;
    v_published_count int := 0;
BEGIN
    -- 检查活动是否存在
    SELECT title INTO v_event_title
    FROM public.events
    WHERE id = p_event_id;
    
    IF v_event_title IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '活动不存在'
        );
    END IF;
    
    -- 获取排名数据（按平均分降序）
    SELECT jsonb_agg(
        jsonb_build_object(
            'submission_id', es.id,
            'rank', row_number() OVER (ORDER BY COALESCE(ss.avg_score, 0) DESC, es.submission_date ASC),
            'title', COALESCE(es.work_title, '未命名作品'),
            'creator_id', es.user_id,
            'creator_name', COALESCE(pu.username, u.raw_user_meta_data->>'username', '未知用户'),
            'creator_avatar', COALESCE(pu.avatar_url, u.raw_user_meta_data->>'avatar_url'),
            'avg_score', COALESCE(ss.avg_score, 0),
            'score_count', COALESCE(ss.score_count, 0),
            'judge_count', COALESCE(ss.judge_count, 0),
            'submitted_at', to_timestamp(es.submission_date / 1000.0)
        )
        ORDER BY COALESCE(ss.avg_score, 0) DESC, es.submission_date ASC
    )
    INTO v_ranking_data
    FROM public.event_submissions es
    JOIN auth.users u ON es.user_id = u.id
    LEFT JOIN public.users pu ON es.user_id = pu.id
    LEFT JOIN public.submission_score_summary ss ON es.id = ss.submission_id
    WHERE es.event_id = p_event_id
    AND COALESCE(ss.avg_score, 0) > 0;
    
    -- 如果没有评分数据
    IF v_ranking_data IS NULL OR jsonb_array_length(v_ranking_data) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '没有可发布的评分数据'
        );
    END IF;
    
    -- 自动发布所有已评分的作品结果
    UPDATE public.event_submissions
    SET 
        status = 'published',
        published_at = now()
    WHERE event_id = p_event_id
    AND status != 'published'
    AND id IN (
        SELECT submission_id 
        FROM public.submission_score_summary 
        WHERE avg_score > 0
    );
    
    GET DIAGNOSTICS v_published_count = ROW_COUNT;
    
    -- 更新活动表
    UPDATE public.events
    SET 
        final_ranking_published = true,
        final_ranking_published_at = now(),
        final_ranking_published_by = p_published_by,
        final_ranking_data = v_ranking_data
    WHERE id = p_event_id;
    
    -- 插入发布记录
    INSERT INTO public.final_ranking_publishes (
        event_id,
        published_by,
        ranking_data
    ) VALUES (
        p_event_id,
        p_published_by,
        v_ranking_data
    );
    
    -- 返回结果
    RETURN jsonb_build_object(
        'success', true,
        'message', '最终排名发布成功',
        'ranking_data', v_ranking_data,
        'published_at', now(),
        'published_works_count', v_published_count
    );
END;
$$;

-- 函数2：获取最终排名
CREATE OR REPLACE FUNCTION public.get_final_ranking(
    p_event_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_ranking_data jsonb;
    v_is_published boolean;
BEGIN
    -- 检查排名是否已发布
    SELECT final_ranking_published, final_ranking_data
    INTO v_is_published, v_ranking_data
    FROM public.events
    WHERE id = p_event_id;
    
    IF NOT v_is_published OR v_ranking_data IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '最终排名尚未发布'
        );
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'ranking_data', v_ranking_data
    );
END;
$$;

-- 函数3：通知所有参与者
CREATE OR REPLACE FUNCTION public.notify_ranking_participants(
    p_event_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_title text;
    v_participant RECORD;
    v_notification_count int := 0;
BEGIN
    -- 获取活动标题
    SELECT title INTO v_event_title
    FROM public.events
    WHERE id = p_event_id;
    
    IF v_event_title IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '活动不存在'
        );
    END IF;
    
    -- 为每个参与者创建通知
    FOR v_participant IN
        SELECT DISTINCT es.user_id
        FROM public.event_submissions es
        WHERE es.event_id = p_event_id
    LOOP
        -- 插入通知记录（使用新的表结构，包含跳转链接）
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            content,
            priority,
            link,
            is_read,
            created_at
        ) VALUES (
            v_participant.user_id,
            'ranking_published',
            '活动结果公布',
            format('您参与的 "%s" 活动结果已公布，快去看看吧！', v_event_title),
            'high',
            format('/activities/%s?showRanking=true', p_event_id),
            false,
            now()
        );
        
        v_notification_count := v_notification_count + 1;
    END LOOP;
    
    -- 更新发布记录
    UPDATE public.final_ranking_publishes
    SET 
        notification_sent = true,
        notification_sent_at = now()
    WHERE event_id = p_event_id
    AND notification_sent = false;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('已通知 %s 位参与者', v_notification_count),
        'notification_count', v_notification_count
    );
END;
$$;

-- ============================================
-- 第五部分：添加注释
-- ============================================

COMMENT ON TABLE public.final_ranking_publishes IS '最终排名发布记录表';
COMMENT ON TABLE public.notifications IS '用户通知表';
COMMENT ON COLUMN public.events.final_ranking_published IS '最终排名是否已发布';
COMMENT ON COLUMN public.events.final_ranking_published_at IS '最终排名发布时间';
COMMENT ON COLUMN public.events.final_ranking_data IS '最终排名数据快照';
COMMENT ON FUNCTION public.publish_final_ranking IS '发布活动的最终排名，同时自动发布所有作品结果';
COMMENT ON FUNCTION public.get_final_ranking IS '获取活动的最终排名';
COMMENT ON FUNCTION public.notify_ranking_participants IS '通知所有参与者排名已发布';

-- ============================================
-- 执行完成！
-- ============================================
