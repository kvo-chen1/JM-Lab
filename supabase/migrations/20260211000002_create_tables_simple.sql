-- 简化版迁移 - 先创建表，再添加外键

-- ============================================
-- 1. 扩展 event_participants 表
-- ============================================

-- 确保 id 列存在
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'event_participants' AND column_name = 'id'
    ) THEN
        ALTER TABLE public.event_participants ADD COLUMN id UUID DEFAULT gen_random_uuid();
        ALTER TABLE public.event_participants ADD PRIMARY KEY (id);
    END IF;
END $$;

-- 添加其他列
ALTER TABLE public.event_participants 
ADD COLUMN IF NOT EXISTS progress INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS current_step INTEGER DEFAULT 1,
ADD COLUMN IF NOT EXISTS submission_data JSONB DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS submission_date TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS ranking INTEGER,
ADD COLUMN IF NOT EXISTS award TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT,
ADD COLUMN IF NOT EXISTS registration_date TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 添加外键（如果 works 表存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'works') THEN
        ALTER TABLE public.event_participants 
        ADD COLUMN IF NOT EXISTS submitted_work_id UUID REFERENCES public.works(id) ON DELETE SET NULL;
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_participants_progress ON public.event_participants(progress);
CREATE INDEX IF NOT EXISTS idx_event_participants_step ON public.event_participants(current_step);

-- ============================================
-- 2. 创建 event_submissions 表
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    user_id UUID NOT NULL,
    participation_id UUID,
    title TEXT NOT NULL,
    description TEXT,
    files JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'draft',
    submitted_at TIMESTAMPTZ,
    reviewed_at TIMESTAMPTZ,
    review_notes TEXT,
    score DECIMAL(5,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, user_id)
);

-- 添加外键约束
ALTER TABLE public.event_submissions 
    ADD CONSTRAINT fk_event_submissions_event 
    FOREIGN KEY (event_id) REFERENCES public.events(id) ON DELETE CASCADE;

ALTER TABLE public.event_submissions 
    ADD CONSTRAINT fk_event_submissions_user 
    FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- 注意：participation_id 外键稍后添加，确保 event_participants 表已完全创建

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_submissions_event ON public.event_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_user ON public.event_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON public.event_submissions(status);

-- ============================================
-- 3. 创建 event_notifications 表
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID REFERENCES public.events(id) ON DELETE CASCADE,
    type TEXT NOT NULL,
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

-- ============================================
-- 4. 创建 event_works 表
-- ============================================

CREATE TABLE IF NOT EXISTS public.event_works (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    work_id UUID NOT NULL,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    participation_id UUID,
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'submitted',
    prize_rank INTEGER,
    prize_title TEXT,
    prize_reward TEXT,
    judge_notes TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(event_id, work_id)
);

-- 添加 work_id 外键（如果 works 表存在）
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'works') THEN
        ALTER TABLE public.event_works 
        ADD CONSTRAINT fk_event_works_work 
        FOREIGN KEY (work_id) REFERENCES public.works(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_works_event ON public.event_works(event_id);
CREATE INDEX IF NOT EXISTS idx_event_works_user ON public.event_works(user_id);

-- ============================================
-- 5. 启用 RLS
-- ============================================

ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_works ENABLE ROW LEVEL SECURITY;

-- RLS 策略
CREATE POLICY "Users can view own submissions" ON public.event_submissions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own submissions" ON public.event_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own draft submissions" ON public.event_submissions
    FOR UPDATE USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Users can delete own draft submissions" ON public.event_submissions
    FOR DELETE USING (auth.uid() = user_id AND status = 'draft');

CREATE POLICY "Users can view own notifications" ON public.event_notifications
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON public.event_notifications
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own notifications" ON public.event_notifications
    FOR DELETE USING (auth.uid() = user_id);

CREATE POLICY "Event works are viewable by everyone" ON public.event_works
    FOR SELECT USING (true);

CREATE POLICY "Users can create own event works" ON public.event_works
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 6. 创建函数
-- ============================================

CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 触发器（使用 IF NOT EXISTS）
DROP TRIGGER IF EXISTS update_event_participants_updated_at ON public.event_participants;
CREATE TRIGGER update_event_participants_updated_at
    BEFORE UPDATE ON public.event_participants
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_submissions_updated_at ON public.event_submissions;
CREATE TRIGGER update_event_submissions_updated_at
    BEFORE UPDATE ON public.event_submissions
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_event_works_updated_at ON public.event_works;
CREATE TRIGGER update_event_works_updated_at
    BEFORE UPDATE ON public.event_works
    FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 辅助函数
CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN (SELECT COUNT(*) FROM public.event_notifications WHERE user_id = p_user_id AND is_read = FALSE);
END;
$$;

-- ============================================
-- 7. 创建视图
-- ============================================

CREATE OR REPLACE VIEW public.user_participation_details AS
SELECT 
    ep.id,
    ep.user_id,
    ep.event_id,
    ep.status as participation_status,
    ep.progress,
    ep.current_step,
    ep.submission_date,
    ep.ranking,
    ep.award,
    ep.registration_date,
    ep.notes,
    ep.created_at,
    ep.updated_at,
    e.title as event_title,
    e.description as event_description,
    e.start_date as event_start,
    e.end_date as event_end,
    e.location as event_location,
    e.status as event_status,
    e.image_url as event_thumbnail,
    COALESCE(e.max_participants, 100) as event_max_participants
FROM public.event_participants ep
JOIN public.events e ON ep.event_id = e.id;

CREATE OR REPLACE VIEW public.user_notification_summary AS
SELECT 
    n.*,
    e.title as event_title,
    e.image_url as event_thumbnail
FROM public.event_notifications n
LEFT JOIN public.events e ON n.event_id = e.id;
