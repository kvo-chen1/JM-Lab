-- 添加活动作品类型支持和AI写作一键参赛功能
-- ============================================

-- 1. 为 events 表添加活动类型字段
-- ============================================
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'document' CHECK (event_type IN ('document', 'image_description', 'other'));

COMMENT ON COLUMN public.events.event_type IS '活动类型: document-文档型, image_description-图片加描述型, other-其他类型';

-- 2. 为 events 表添加作品要求配置字段
-- ============================================
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS submission_requirements JSONB DEFAULT '{
  "document": {
    "formats": ["pdf", "doc", "docx"],
    "maxSize": 20971520,
    "maxFiles": 5,
    "description": "请上传商业计划书、文章或报告等文档"
  },
  "image_description": {
    "formats": ["jpg", "jpeg", "png", "webp"],
    "maxSize": 10485760,
    "maxFiles": 10,
    "description": "请上传图片并添加描述说明"
  }
}'::jsonb;

COMMENT ON COLUMN public.events.submission_requirements IS '作品上传要求配置，根据event_type动态变化';

-- 3. 为 events 表添加作品模板字段
-- ============================================
ALTER TABLE public.events
ADD COLUMN IF NOT EXISTS submission_templates JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN public.events.submission_templates IS '作品模板列表，包含模板名称、描述和下载链接';

-- 4. 为 event_submissions 表添加作品类型字段
-- ============================================
ALTER TABLE public.event_submissions
ADD COLUMN IF NOT EXISTS submission_type TEXT DEFAULT 'document' CHECK (submission_type IN ('document', 'image_description', 'other'));

COMMENT ON COLUMN public.event_submissions.submission_type IS '作品提交类型';

-- 5. 为 event_submissions 表添加AI写作关联字段
-- ============================================
ALTER TABLE public.event_submissions
ADD COLUMN IF NOT EXISTS ai_writer_content TEXT,
ADD COLUMN IF NOT EXISTS ai_writer_history_id UUID,
ADD COLUMN IF NOT EXISTS is_from_ai_writer BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.event_submissions.ai_writer_content IS 'AI写作生成的内容';
COMMENT ON COLUMN public.event_submissions.ai_writer_history_id IS '关联的AI写作历史记录ID';
COMMENT ON COLUMN public.event_submissions.is_from_ai_writer IS '是否来自AI写作';

-- 6. 创建活动类型配置表
-- ============================================
CREATE TABLE IF NOT EXISTS public.event_type_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type_code TEXT NOT NULL UNIQUE CHECK (type_code IN ('document', 'image_description', 'other')),
    type_name TEXT NOT NULL,
    type_description TEXT,
    icon TEXT,
    default_requirements JSONB NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 插入默认活动类型配置
INSERT INTO public.event_type_configs (type_code, type_name, type_description, icon, default_requirements)
VALUES
    ('document', '文档型活动', '适用于商业计划书、文章、报告等文档类作品', 'FileText', '{
        "formats": ["pdf", "doc", "docx", "txt", "md"],
        "formatLabels": {"pdf": "PDF文档", "doc": "Word文档", "docx": "Word文档", "txt": "文本文件", "md": "Markdown文档"},
        "maxSize": 20971520,
        "maxSizeLabel": "20MB",
        "maxFiles": 5,
        "description": "请上传商业计划书、文章、报告等文档类作品",
        "uploadGuide": "支持 PDF、Word、文本等格式，单个文件最大20MB，最多上传5个文件",
        "templateAvailable": true
    }'::jsonb),
    ('image_description', '图文型活动', '适用于需要图片配合文字描述的作品', 'Image', '{
        "formats": ["jpg", "jpeg", "png", "webp", "gif"],
        "formatLabels": {"jpg": "JPG图片", "jpeg": "JPEG图片", "png": "PNG图片", "webp": "WebP图片", "gif": "GIF动图"},
        "maxSize": 10485760,
        "maxSizeLabel": "10MB",
        "maxFiles": 10,
        "description": "请上传图片并添加详细的文字描述",
        "uploadGuide": "支持 JPG、PNG、WebP等图片格式，单个文件最大10MB，最多上传10张图片",
        "requireDescription": true,
        "templateAvailable": true
    }'::jsonb),
    ('other', '其他类型', '适用于其他特殊类型的活动作品', 'MoreHorizontal', '{
        "formats": ["*"],
        "formatLabels": {"*": "所有格式"},
        "maxSize": 52428800,
        "maxSizeLabel": "50MB",
        "maxFiles": 10,
        "description": "请按照活动要求上传作品",
        "uploadGuide": "支持各种格式，单个文件最大50MB，最多上传10个文件",
        "templateAvailable": false
    }'::jsonb)
ON CONFLICT (type_code) DO UPDATE SET
    type_name = EXCLUDED.type_name,
    type_description = EXCLUDED.type_description,
    icon = EXCLUDED.icon,
    default_requirements = EXCLUDED.default_requirements,
    updated_at = NOW();

-- 7. 创建AI写作历史记录与活动关联表
-- ============================================
CREATE TABLE IF NOT EXISTS public.ai_writer_event_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
    ai_writer_history_id UUID,
    content TEXT,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'submitted')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, event_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_writer_event_links_user ON public.ai_writer_event_links(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_writer_event_links_event ON public.ai_writer_event_links(event_id);

-- 启用RLS
ALTER TABLE public.ai_writer_event_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own AI writer event links" ON public.ai_writer_event_links
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own AI writer event links" ON public.ai_writer_event_links
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own AI writer event links" ON public.ai_writer_event_links
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own AI writer event links" ON public.ai_writer_event_links
    FOR DELETE USING (auth.uid() = user_id);

-- 8. 创建获取活动类型配置的函数
-- ============================================
CREATE OR REPLACE FUNCTION public.get_event_type_config(p_type_code TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_config JSONB;
BEGIN
    SELECT jsonb_build_object(
        'id', id,
        'typeCode', type_code,
        'typeName', type_name,
        'typeDescription', type_description,
        'icon', icon,
        'defaultRequirements', default_requirements,
        'isActive', is_active
    ) INTO v_config
    FROM public.event_type_configs
    WHERE type_code = p_type_code AND is_active = TRUE;

    RETURN v_config;
END;
$$;

-- 9. 创建获取所有活动类型配置的函数
-- ============================================
CREATE OR REPLACE FUNCTION public.get_all_event_type_configs()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_configs JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'typeCode', type_code,
            'typeName', type_name,
            'typeDescription', type_description,
            'icon', icon,
            'defaultRequirements', default_requirements,
            'isActive', is_active
        )
    ) INTO v_configs
    FROM public.event_type_configs
    WHERE is_active = TRUE;

    RETURN COALESCE(v_configs, '[]'::jsonb);
END;
$$;

-- 10. 创建从AI写作提交作品函数
-- ============================================
CREATE OR REPLACE FUNCTION public.submit_work_from_ai_writer(
    p_event_id UUID,
    p_user_id UUID,
    p_participation_id UUID,
    p_title TEXT,
    p_description TEXT,
    p_ai_writer_content TEXT,
    p_ai_writer_history_id UUID,
    p_files JSONB DEFAULT '[]'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_submission_id UUID;
    v_event_type TEXT;
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

    -- 获取活动类型
    SELECT event_type INTO v_event_type
    FROM public.events
    WHERE id = p_event_id;

    -- 创建提交记录
    INSERT INTO public.event_submissions (
        event_id, user_id, participation_id, title, description, files,
        status, submitted_at, submission_type,
        ai_writer_content, ai_writer_history_id, is_from_ai_writer
    ) VALUES (
        p_event_id, p_user_id, p_participation_id, p_title, p_description, p_files,
        'submitted', NOW(), COALESCE(v_event_type, 'document'),
        p_ai_writer_content, p_ai_writer_history_id, TRUE
    )
    ON CONFLICT (event_id, user_id)
    DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        files = EXCLUDED.files,
        status = 'submitted',
        submitted_at = NOW(),
        submission_type = EXCLUDED.submission_type,
        ai_writer_content = EXCLUDED.ai_writer_content,
        ai_writer_history_id = EXCLUDED.ai_writer_history_id,
        is_from_ai_writer = TRUE,
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
        'AI写作作品提交成功',
        '您的AI写作作品已成功提交参赛，请等待评审结果。',
        false,
        '/my-activities',
        '查看详情'
    );

    -- 更新或创建AI写作关联记录
    INSERT INTO public.ai_writer_event_links (
        user_id, event_id, ai_writer_history_id, content, status
    ) VALUES (
        p_user_id, p_event_id, p_ai_writer_history_id, p_ai_writer_content, 'submitted'
    )
    ON CONFLICT (user_id, event_id)
    DO UPDATE SET
        ai_writer_history_id = EXCLUDED.ai_writer_history_id,
        content = EXCLUDED.content,
        status = 'submitted',
        updated_at = NOW();

    RETURN jsonb_build_object('success', true, 'submission_id', v_submission_id);
END;
$$;

-- 11. 创建触发器自动更新 updated_at
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_event_type_configs_updated_at
    BEFORE UPDATE ON public.event_type_configs
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_ai_writer_event_links_updated_at
    BEFORE UPDATE ON public.ai_writer_event_links
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column();

-- 12. 更新视图以包含新字段
-- ============================================
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
    e.event_type as event_submission_type,
    e.status as event_status,
    e.thumbnail_url as event_thumbnail,
    e.participants as event_participants,
    e.max_participants as event_max_participants,
    e.submission_requirements as event_submission_requirements,
    es.id as submission_id,
    es.title as submission_title,
    es.status as submission_status,
    es.score as submission_score,
    es.review_notes,
    es.is_from_ai_writer,
    es.ai_writer_history_id
FROM public.event_participants ep
JOIN public.events e ON ep.event_id = e.id
LEFT JOIN public.event_submissions es ON ep.id = es.participation_id;

COMMENT ON VIEW public.user_participation_details IS '用户活动参与完整视图，包含活动类型和AI写作关联信息';
