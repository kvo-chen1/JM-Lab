-- 扩展活动参与系统数据库结构
-- 包含：活动参与、作品提交、通知中心

-- ============================================
-- 1. 扩展 event_participants 表
-- ============================================

-- 添加新字段到现有表
ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1 CHECK (current_step >= 1 AND current_step <= 4),
ADD COLUMN IF NOT EXISTS submitted_work_id UUID REFERENCES public.works(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS submission_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ranking INTEGER,
ADD COLUMN IF NOT EXISTS award TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS registration_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_participants_progress ON public.event_participants(progress);
CREATE INDEX IF NOT EXISTS idx_event_participants_step ON public.event_participants(current_step);
CREATE INDEX IF NOT EXISTS idx_event_participants_submission ON public.event_participants(submitted_work_id);

-- ============================================
-- 2. 创建 event_submissions 表（作品提交详情）
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participation_id UUID REFERENCES public.event_participants(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    description TEXT,
    files JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'under_review', 'reviewed', 'rejected')),
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    score DECIMAL(5,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_submissions_event ON public.event_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_user ON public.event_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_participation ON public.event_submissions(participation_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON public.event_submissions(status);

-- ============================================
-- 3. 创建 event_notifications 表（活动通知中心）
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN (
        'registration_confirmed',  -- 报名确认
        'submission_reminder',     -- 提交提醒
        'deadline_warning',        -- 截止警告
        'submission_received',     -- 提交已收到
        'review_started',          -- 评审开始
        'review_completed',        -- 评审完成
        'result_published',        -- 结果公布
        'award_received',          -- 获奖通知
        'event_updated',           -- 活动更新
        'event_cancelled'          -- 活动取消
    )),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    is_important BOOLEAN DEFAULT FALSE,
    action_url TEXT,
    action_text TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_notifications_user ON public.event_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_event ON public.event_notifications(event_id);
CREATE INDEX IF NOT EXISTS idx_event_notifications_read ON public.event_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_event_notifications_created ON public.event_notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_notifications_type ON public.event_notifications(type);

-- ============================================
-- 4. 创建 event_works 表（活动作品关联）
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    work_id UUID NOT NULL REFERENCES public.works(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participation_id UUID REFERENCES public.event_participants(id) ON DELETE SET NULL,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'submitted' CHECK (status IN ('submitted', 'qualified', 'finalist', 'winner', 'rejected')),
    prize_rank INTEGER,
    prize_title TEXT,
    prize_reward TEXT,
    judge_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, work_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_works_event ON public.event_works(event_id);
CREATE INDEX IF NOT EXISTS idx_event_works_work ON public.event_works(work_id);
CREATE INDEX IF NOT EXISTS idx_event_works_user ON public.event_works(user_id);
CREATE INDEX IF NOT EXISTS idx_event_works_status ON public.event_works(status);

-- ============================================
-- 5. 启用 RLS 并创建策略
-- ============================================

-- event_submissions RLS
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own submissions" ON public.event_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions" ON public.event_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft submissions" ON public.event_submissions
    FOR UPDATE USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Users can delete own draft submissions" ON public.event_submissions
    FOR DELETE USING (auth.uid() = user_id AND status = 'draft');

-- event_notifications RLS
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notifications" ON public.event_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.event_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.event_notifications
    FOR DELETE USING (auth.uid() = user_id);

-- event_works RLS
ALTER TABLE public.event_works ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Event works are viewable by everyone" ON public.event_works
    FOR SELECT USING (true);

CREATE POLICY "Users can create own event works" ON public.event_works
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. 创建辅助函数
-- ============================================

-- 更新参与进度函数
CREATE OR REPLACE FUNCTION public.update_participation_progress(
    p_participation_id UUID,
    p_step INTEGER,
    p_progress INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    UPDATE public.event_participants
    SET 
        current_step = p_step,
        progress = p_progress,
        updated_at = NOW()
    WHERE id = p_participation_id AND user_id = auth.uid();
    
    IF FOUND THEN
        v_result := jsonb_build_object('success', true);
    ELSE
        v_result := jsonb_build_object('success', false, 'error', 'Participation not found or not authorized');
    END IF;
    
    RETURN v_result;
END;
$$;

-- 创建通知函数
CREATE OR REPLACE FUNCTION public.create_event_notification(
    p_user_id UUID,
    p_event_id UUID,
    p_type TEXT,
    p_title TEXT,
    p_content TEXT,
    p_is_important BOOLEAN DEFAULT FALSE,
    p_action_url TEXT DEFAULT NULL,
    p_action_text TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.event_notifications (
        user_id, event_id, type, title, content, 
        is_important, action_url, action_text
    ) VALUES (
        p_user_id, p_event_id, p_type, p_title, p_content,
        p_is_important, p_action_url, p_action_text
    )
    RETURNING id INTO v_notification_id;
    
    RETURN v_notification_id;
END;
$$;

-- 标记通知已读函数
CREATE OR REPLACE FUNCTION public.mark_notification_read(
    p_notification_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    UPDATE public.event_notifications
    SET is_read = TRUE, read_at = NOW()
    WHERE id = p_notification_id AND user_id = auth.uid();
    
    IF FOUND THEN
        v_result := jsonb_build_object('success', true);
    ELSE
        v_result := jsonb_build_object('success', false, 'error', 'Notification not found or not authorized');
    END IF;
    
    RETURN v_result;
END;
$$;

-- 获取用户未读通知数函数
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM public.event_notifications WHERE user_id = p_user_id AND is_read = FALSE);
END;
$$;

-- 提交作品函数（带事务）
CREATE OR REPLACE FUNCTION public.submit_event_work(
    p_event_id UUID,
    p_user_id UUID,
    p_participation_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_files JSONB
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_submission_id UUID;
    v_participation_exists BOOLEAN;
BEGIN
    -- 检查参与记录是否存在
    SELECT EXISTS(
        SELECT 1 FROM public.event_participants 
        WHERE id = p_participation_id AND user_id = p_user_id AND event_id = p_event_id
    ) INTO v_participation_exists;
    
    IF NOT v_participation_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'Participation not found');
    END IF;
    
    -- 创建提交记录
    INSERT INTO public.event_submissions (
        event_id, user_id, participation_id, title, description, files,
        status, submitted_at
    ) VALUES (
        p_event_id, p_user_id, p_participation_id, p_title, p_description, p_files,
        'submitted', NOW()
    )
    ON CONFLICT (event_id, user_id) 
    DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        files = EXCLUDED.files,
        status = 'submitted',
        submitted_at = NOW(),
        updated_at = NOW()
    RETURNING id INTO v_submission_id;
    
    -- 更新参与记录
    UPDATE public.event_participants
    SET 
        status = 'submitted',
        current_step = 2,
        progress = 50,
        submission_date = NOW(),
        updated_at = NOW()
    WHERE id = p_participation_id;
    
    -- 创建提交确认通知
    PERFORM public.create_event_notification(
        p_user_id,
        p_event_id,
        'submission_received',
        '作品提交成功',
        '您的作品已成功提交，请等待评审结果。',
        false,
        '/my-activities',
        '查看详情'
    );
    
    RETURN jsonb_build_object('success', true, 'submission_id', v_submission_id);
END;
$$;

-- ============================================
-- 7. 创建触发器
-- ============================================

-- 自动更新 updated_at 字段
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_participants_updated_at
    BEFORE UPDATE ON public.event_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_submissions_updated_at
    BEFORE UPDATE ON public.event_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_event_works_updated_at
    BEFORE UPDATE ON public.event_works
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- 8. 创建视图
-- ============================================

-- 用户活动参与完整视图
CREATE OR REPLACE VIEW public.user_participation_details AS
SELECT 
    ep.id,
    ep.user_id,
    ep.event_id,
    ep.status as participation_status,
    ep.progress,
    ep.current_step,
    ep.submitted_work_id,
    ep.submission_date,
    ep.ranking,
    ep.award,
    ep.registration_date,
    ep.notes,
    ep.created_at,
    ep.updated_at,
    e.title as event_title,
    e.description as event_description,
    e.start_time as event_start,
    e.end_time as event_end,
    e.location as event_location,
    e.type as event_type,
    e.status as event_status,
    e.thumbnail_url as event_thumbnail,
    e.participants as event_participants,
    e.max_participants as event_max_participants,
    es.id as submission_id,
    es.title as submission_title,
    es.status as submission_status,
    es.score as submission_score,
    es.review_notes
FROM public.event_participants ep
JOIN public.events e ON ep.event_id = e.id
LEFT JOIN public.event_submissions es ON ep.id = es.participation_id;

-- 用户通知视图
CREATE OR REPLACE VIEW public.user_notification_summary AS
SELECT 
    n.*,
    e.title as event_title,
    e.thumbnail_url as event_thumbnail
FROM public.event_notifications n
LEFT JOIN public.events e ON n.event_id = e.id;

COMMENT ON TABLE public.event_participants IS '活动参与记录表';
COMMENT ON TABLE public.event_submissions IS '活动作品提交表';
COMMENT ON TABLE public.event_notifications IS '活动通知中心表';
COMMENT ON TABLE public.event_works IS '活动作品关联表';
