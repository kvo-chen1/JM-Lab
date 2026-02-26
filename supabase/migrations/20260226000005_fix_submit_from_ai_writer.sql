-- ==========================================================================
-- 修复 submit_work_from_ai_writer 函数的时间戳格式问题
-- 问题：函数使用 TIMESTAMPTZ 时间戳 (NOW())，但数据库表使用 bigint 类型
-- ==========================================================================

-- 1. 删除旧函数
DROP FUNCTION IF EXISTS public.submit_work_from_ai_writer(
    UUID, UUID, UUID, TEXT, TEXT, TEXT, UUID, JSONB
);

-- 2. 创建新函数（使用 bigint 时间戳格式，与表结构一致）
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

    RETURN jsonb_build_object('success', true, 'submission_id', v_submission_id);
END;
$$;

-- 3. 验证函数
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'submit_work_from_ai_writer';

-- ==========================================================================
-- 完成
-- ==========================================================================
