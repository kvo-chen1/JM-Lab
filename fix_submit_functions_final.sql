-- ==========================================================================
-- 最终修复：解决 submit_event_work 和 submit_work_from_ai_writer 函数
-- 移除对 create_event_notification 的依赖（该函数可能不存在）
-- ==========================================================================

-- ============================================
-- 1. 删除旧的触发器（防止触发器干扰）
-- ============================================
DROP TRIGGER IF EXISTS update_event_submissions_updated_at ON public.event_submissions;
DROP TRIGGER IF EXISTS update_event_participants_updated_at ON public.event_participants;

-- ============================================
-- 2. 创建新的触发器函数（使用 bigint 时间戳）
-- ============================================
CREATE OR REPLACE FUNCTION public.update_updated_at_column_bigint()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- 3. 重新创建触发器
-- ============================================
CREATE TRIGGER update_event_submissions_updated_at
    BEFORE UPDATE ON public.event_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_bigint();

CREATE TRIGGER update_event_participants_updated_at
    BEFORE UPDATE ON public.event_participants
    FOR EACH ROW
    EXECUTE FUNCTION public.update_updated_at_column_bigint();

-- ============================================
-- 4. 修复 submit_event_work 函数（移除通知功能）
-- ============================================
DROP FUNCTION IF EXISTS public.submit_event_work(UUID, UUID, UUID, TEXT, TEXT, JSONB);

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
    v_now_bigint BIGINT;
BEGIN
    -- 获取当前时间戳（bigint 格式 - 毫秒）
    v_now_bigint := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;

    -- 检查参与记录是否存在
    SELECT EXISTS(
        SELECT 1 FROM public.event_participants
        WHERE id = p_participation_id AND user_id = p_user_id AND event_id = p_event_id
    ) INTO v_participation_exists;

    IF NOT v_participation_exists THEN
        RETURN jsonb_build_object('success', false, 'error', 'Participation not found');
    END IF;

    -- 创建提交记录（使用 bigint 时间戳格式）
    INSERT INTO public.event_submissions (
        event_id, user_id, participation_id, title, description, files,
        status, submitted_at, created_at, updated_at
    ) VALUES (
        p_event_id, p_user_id, p_participation_id, p_title, p_description, p_files,
        'submitted', v_now_bigint, v_now_bigint, v_now_bigint
    )
    ON CONFLICT (event_id, user_id)
    DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        files = EXCLUDED.files,
        status = 'submitted',
        submitted_at = v_now_bigint,
        updated_at = v_now_bigint
    RETURNING id INTO v_submission_id;

    -- 更新参与记录（使用 bigint 时间戳格式）
    UPDATE public.event_participants
    SET
        status = 'submitted',
        current_step = 2,
        progress = 50,
        submission_date = v_now_bigint,
        updated_at = v_now_bigint
    WHERE id = p_participation_id;

    RETURN jsonb_build_object('success', true, 'submission_id', v_submission_id);
END;
$$;

-- ============================================
-- 5. 修复 submit_work_from_ai_writer 函数（移除通知功能）
-- ============================================
DROP FUNCTION IF EXISTS public.submit_work_from_ai_writer(UUID, UUID, UUID, TEXT, TEXT, TEXT, UUID, JSONB);

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
    v_now_bigint BIGINT;
BEGIN
    -- 获取当前时间戳（bigint 格式 - 毫秒）
    v_now_bigint := EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;

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

    -- 创建提交记录（使用 bigint 时间戳格式）
    INSERT INTO public.event_submissions (
        event_id, user_id, participation_id, title, description, files,
        status, submitted_at, submission_type,
        ai_writer_content, ai_writer_history_id, is_from_ai_writer,
        created_at, updated_at
    ) VALUES (
        p_event_id, p_user_id, p_participation_id, p_title, p_description, p_files,
        'submitted', v_now_bigint, COALESCE(v_event_type, 'document'),
        p_ai_writer_content, p_ai_writer_history_id, TRUE,
        v_now_bigint, v_now_bigint
    )
    ON CONFLICT (event_id, user_id)
    DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        files = EXCLUDED.files,
        status = 'submitted',
        submitted_at = v_now_bigint,
        submission_type = EXCLUDED.submission_type,
        ai_writer_content = EXCLUDED.ai_writer_content,
        ai_writer_history_id = EXCLUDED.ai_writer_history_id,
        is_from_ai_writer = TRUE,
        updated_at = v_now_bigint
    RETURNING id INTO v_submission_id;

    -- 更新参与记录（使用 bigint 时间戳格式）
    UPDATE public.event_participants
    SET
        status = 'submitted',
        current_step = 2,
        progress = 50,
        submission_date = v_now_bigint,
        updated_at = v_now_bigint
    WHERE id = p_participation_id;

    RETURN jsonb_build_object('success', true, 'submission_id', v_submission_id);
END;
$$;

-- ============================================
-- 6. 验证修复结果
-- ============================================
SELECT 
    'Functions' as check_type,
    routine_name as name,
    routine_type as type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN ('submit_event_work', 'submit_work_from_ai_writer')
UNION ALL
SELECT 
    'Triggers' as check_type,
    trigger_name as name,
    event_manipulation as type
FROM information_schema.triggers
WHERE trigger_schema = 'public'
AND event_object_table IN ('event_submissions', 'event_participants')
ORDER BY check_type, name;

-- ==========================================================================
-- 完成 - 请在 Supabase SQL Editor 中执行此脚本
-- ==========================================================================
