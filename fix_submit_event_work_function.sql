-- 修复 submit_event_work 函数，统一使用 bigint 时间戳
-- 删除旧函数，创建新函数

-- 1. 删除旧函数
DROP FUNCTION IF EXISTS public.submit_event_work(
    UUID, UUID, UUID, TEXT, TEXT, JSONB
);

-- 2. 创建新函数（所有时间戳统一使用 bigint 格式）
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
    
    -- 创建提交记录（所有时间戳使用 bigint 格式）
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
    
    -- 更新参与记录（所有时间戳使用 bigint 格式）
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

-- 3. 验证函数
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name = 'submit_event_work';
