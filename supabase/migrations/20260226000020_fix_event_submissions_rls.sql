-- 修复 event_submissions 表的 RLS 策略
-- 允许管理员访问所有数据

-- 确保表存在
CREATE TABLE IF NOT EXISTS public.event_submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    files JSONB DEFAULT '[]'::jsonb,
    status TEXT DEFAULT 'submitted' CHECK (status IN ('draft', 'submitted', 'under_review', 'reviewed', 'rejected', 'published')),
    submitted_at TIMESTAMPTZ DEFAULT NOW(),
    reviewed_at TIMESTAMPTZ,
    reviewed_by UUID,
    review_notes TEXT,
    score DECIMAL(5,2),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    vote_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    avg_rating DECIMAL(3,2) DEFAULT 0,
    rating_count INTEGER DEFAULT 0,
    cover_image TEXT,
    media_type TEXT DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'audio', 'document', 'other')),
    is_published BOOLEAN DEFAULT false,
    published_at TIMESTAMPTZ,
    published_by UUID
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_event_submissions_event ON public.event_submissions(event_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_user ON public.event_submissions(user_id);
CREATE INDEX IF NOT EXISTS idx_event_submissions_status ON public.event_submissions(status);
CREATE INDEX IF NOT EXISTS idx_event_submissions_submitted_at ON public.event_submissions(submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_event_submissions_reviewed_at ON public.event_submissions(reviewed_at DESC);

-- 启用 RLS
ALTER TABLE public.event_submissions ENABLE ROW LEVEL SECURITY;

-- 删除现有策略（如果存在）
DROP POLICY IF EXISTS "event_submissions_select_all" ON public.event_submissions;
DROP POLICY IF EXISTS "event_submissions_insert_own" ON public.event_submissions;
DROP POLICY IF EXISTS "event_submissions_update_own" ON public.event_submissions;
DROP POLICY IF EXISTS "event_submissions_delete_own" ON public.event_submissions;
DROP POLICY IF EXISTS "event_submissions_all" ON public.event_submissions;
DROP POLICY IF EXISTS "event_submissions_admin_update" ON public.event_submissions;
DROP POLICY IF EXISTS "event_submissions_admin_delete" ON public.event_submissions;

-- 创建新的 RLS 策略
-- 允许所有人查看（包括未认证用户）
CREATE POLICY "event_submissions_select_all" ON public.event_submissions
    FOR SELECT USING (true);

-- 允许认证用户插入自己的作品
CREATE POLICY "event_submissions_insert_own" ON public.event_submissions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 允许用户更新自己的作品（仅草稿或提交状态）
CREATE POLICY "event_submissions_update_own" ON public.event_submissions
    FOR UPDATE USING (
        auth.uid() = user_id 
        AND status IN ('draft', 'submitted', 'under_review')
    );

-- 允许用户删除自己的作品（仅草稿状态）
CREATE POLICY "event_submissions_delete_own" ON public.event_submissions
    FOR DELETE USING (
        auth.uid() = user_id 
        AND status = 'draft'
    );

-- 允许管理员更新任何作品（用于审核）
-- 检查用户是否为管理员（通过 raw_user_meta_data 中的 role 字段）
CREATE POLICY "event_submissions_admin_update" ON public.event_submissions
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND (
                raw_user_meta_data->>'role' IN ('admin', 'moderator', 'organizer')
                OR raw_user_meta_data->>'is_admin' = 'true'
            )
        )
    );

-- 允许管理员删除任何作品
CREATE POLICY "event_submissions_admin_delete" ON public.event_submissions
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE id = auth.uid()
            AND (
                raw_user_meta_data->>'role' IN ('admin', 'moderator')
                OR raw_user_meta_data->>'is_admin' = 'true'
            )
        )
    );

-- 添加评论
COMMENT ON TABLE public.event_submissions IS '活动作品提交表';
COMMENT ON COLUMN public.event_submissions.status IS '作品状态: draft-草稿, submitted-已提交, under_review-审核中, reviewed-已审核, rejected-已驳回, published-已发布';
COMMENT ON COLUMN public.event_submissions.metadata IS '扩展元数据，包含标签、文化元素、优先级等';
