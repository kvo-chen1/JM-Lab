-- ============================================
-- 活动编辑和重新审核流程 - 简化版
-- 直接在 Supabase SQL Editor 中执行
-- ============================================

-- 1. 创建函数：更新活动并重新提交审核
CREATE OR REPLACE FUNCTION public.update_event_and_resubmit(
    p_event_id UUID,
    p_organizer_id UUID,
    p_event_data JSONB
)
RETURNS JSONB AS $$
DECLARE
    v_current_status TEXT;
    v_result JSONB;
BEGIN
    -- 检查活动是否存在且属于该主办方
    SELECT status INTO v_current_status
    FROM public.events
    WHERE id = p_event_id AND organizer_id = p_organizer_id;

    IF v_current_status IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '活动不存在或无权限编辑'
        );
    END IF;

    -- 更新活动数据
    UPDATE public.events
    SET
        title = COALESCE(p_event_data->>'title', title),
        description = COALESCE(p_event_data->>'description', description),
        content = COALESCE(p_event_data->>'content', content),
        start_date = COALESCE((p_event_data->>'start_date')::BIGINT, start_date),
        end_date = COALESCE((p_event_data->>'end_date')::BIGINT, end_date),
        location = COALESCE(p_event_data->>'location', location),
        type = COALESCE(p_event_data->>'type', type),
        tags = COALESCE((p_event_data->'tags')::TEXT[], tags),
        media = COALESCE(p_event_data->'media', media),
        is_public = COALESCE((p_event_data->>'is_public')::BOOLEAN, is_public),
        max_participants = COALESCE((p_event_data->>'max_participants')::INTEGER, max_participants),
        updated_at = NOW(),
        -- 如果原状态是 published 或 rejected，改为 pending 重新审核
        status = CASE 
            WHEN v_current_status IN ('published', 'rejected') THEN 'pending'
            ELSE v_current_status
        END
    WHERE id = p_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', CASE 
            WHEN v_current_status IN ('published', 'rejected') THEN '活动已更新并重新提交审核'
            ELSE '活动已更新'
        END,
        'new_status', CASE 
            WHEN v_current_status IN ('published', 'rejected') THEN 'pending'
            ELSE v_current_status
        END
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. 创建函数：提交活动审核
CREATE OR REPLACE FUNCTION public.submit_event_for_review(
    p_event_id UUID,
    p_organizer_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_current_status TEXT;
    v_event_title TEXT;
BEGIN
    SELECT status, title INTO v_current_status, v_event_title
    FROM public.events
    WHERE id = p_event_id AND organizer_id = p_organizer_id;

    IF v_current_status IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '活动不存在或无权限操作'
        );
    END IF;

    IF v_current_status NOT IN ('draft', 'rejected') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '当前状态不允许提交审核'
        );
    END IF;

    UPDATE public.events
    SET 
        status = 'pending',
        updated_at = NOW()
    WHERE id = p_event_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', '活动已提交审核',
        'event_title', v_event_title
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建函数：检查活动是否可以编辑
CREATE OR REPLACE FUNCTION public.can_edit_event(
    p_event_id UUID,
    p_user_id UUID
)
RETURNS BOOLEAN AS $$
DECLARE
    v_status TEXT;
    v_organizer_id UUID;
BEGIN
    SELECT status, organizer_id INTO v_status, v_organizer_id
    FROM public.events
    WHERE id = p_event_id;

    RETURN v_organizer_id = p_user_id 
        AND v_status IN ('draft', 'rejected', 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 添加注释
COMMENT ON FUNCTION public.update_event_and_resubmit IS '更新活动并重新提交审核，已发布或已拒绝的活动编辑后会变为待审核状态';
COMMENT ON FUNCTION public.submit_event_for_review IS '主办方提交活动进行审核';
COMMENT ON FUNCTION public.can_edit_event IS '检查活动是否可以编辑';

-- 5. 验证函数是否创建成功
SELECT 
    'update_event_and_resubmit' as function_name,
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_event_and_resubmit') 
        THEN '✅ 创建成功' 
        ELSE '❌ 创建失败' 
    END as status
UNION ALL
SELECT 
    'submit_event_for_review',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'submit_event_for_review') 
        THEN '✅ 创建成功' 
        ELSE '❌ 创建失败' 
    END
UNION ALL
SELECT 
    'can_edit_event',
    CASE 
        WHEN EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'can_edit_event') 
        THEN '✅ 创建成功' 
        ELSE '❌ 创建失败' 
    END;
