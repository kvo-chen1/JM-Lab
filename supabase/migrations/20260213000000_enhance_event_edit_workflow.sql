-- ============================================
-- 完善活动编辑和重新审核流程
-- ============================================

-- 1. 创建函数：更新活动并重新提交审核
-- 当已发布的活动被编辑后，需要重新提交审核
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
        -- 如果原状态是 published，改为 pending 重新审核
        -- 如果原状态是 rejected，改为 pending 重新审核
        -- draft 保持 draft
        status = CASE 
            WHEN v_current_status IN ('published', 'rejected') THEN 'pending'
            ELSE v_current_status
        END
    WHERE id = p_event_id;

    -- 如果状态变为 pending，记录审核日志
    IF v_current_status IN ('published', 'rejected') THEN
        INSERT INTO public.audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values
        ) VALUES (
            p_organizer_id,
            'resubmit_for_review',
            'events',
            p_event_id,
            jsonb_build_object('status', v_current_status),
            jsonb_build_object('status', 'pending')
        );
    END IF;

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

-- 2. 创建函数：主办方提交活动审核
CREATE OR REPLACE FUNCTION public.submit_event_for_review(
    p_event_id UUID,
    p_organizer_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_current_status TEXT;
    v_event_title TEXT;
BEGIN
    -- 检查活动是否存在且属于该主办方
    SELECT status, title INTO v_current_status, v_event_title
    FROM public.events
    WHERE id = p_event_id AND organizer_id = p_organizer_id;

    IF v_current_status IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '活动不存在或无权限操作'
        );
    END IF;

    -- 检查当前状态是否允许提交审核
    IF v_current_status NOT IN ('draft', 'rejected') THEN
        RETURN jsonb_build_object(
            'success', false,
            'message', '当前状态不允许提交审核'
        );
    END IF;

    -- 更新状态为 pending
    UPDATE public.events
    SET 
        status = 'pending',
        updated_at = NOW()
    WHERE id = p_event_id;

    -- 记录审核日志
    INSERT INTO public.audit_logs (
        user_id,
        action,
        table_name,
        record_id,
        old_values,
        new_values
    ) VALUES (
        p_organizer_id,
        'submit_for_review',
        'events',
        p_event_id,
        jsonb_build_object('status', v_current_status),
        jsonb_build_object('status', 'pending')
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', '活动已提交审核',
        'event_title', v_event_title
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. 创建函数：获取活动的编辑历史
CREATE OR REPLACE FUNCTION public.get_event_edit_history(
    p_event_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    edit_id UUID,
    edited_by UUID,
    editor_name TEXT,
    editor_avatar TEXT,
    action TEXT,
    changes JSONB,
    edited_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        al.id as edit_id,
        al.user_id as edited_by,
        u.raw_user_meta_data->>'username' as editor_name,
        u.raw_user_meta_data->>'avatar_url' as editor_avatar,
        al.action,
        jsonb_build_object(
            'old', al.old_values,
            'new', al.new_values
        ) as changes,
        al.created_at as edited_at
    FROM public.audit_logs al
    JOIN auth.users u ON al.user_id = u.id
    WHERE al.table_name = 'events'
    AND al.record_id = p_event_id
    AND al.action IN ('update', 'resubmit_for_review', 'submit_for_review')
    ORDER BY al.created_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. 创建视图：主办方活动完整信息（包含审核状态）
CREATE OR REPLACE VIEW public.organizer_events_full AS
SELECT 
    e.id,
    e.title,
    e.description,
    e.content,
    e.start_date,
    e.end_date,
    e.location,
    e.type,
    e.tags,
    e.media,
    e.is_public,
    e.max_participants,
    e.status,
    e.organizer_id,
    e.brand_id,
    e.brand_name,
    e.created_at,
    e.updated_at,
    -- 审核相关信息
    CASE 
        WHEN e.status = 'pending' THEN '审核中'
        WHEN e.status = 'published' THEN '已发布'
        WHEN e.status = 'rejected' THEN '已拒绝'
        WHEN e.status = 'draft' THEN '草稿'
        ELSE e.status
    END as status_label,
    -- 是否可以编辑
    e.status IN ('draft', 'rejected') as can_edit,
    -- 是否可以提交审核
    e.status IN ('draft', 'rejected') as can_submit,
    -- 是否需要重新审核（已发布被编辑后）
    e.status = 'pending' AND EXISTS (
        SELECT 1 FROM public.audit_logs al
        WHERE al.table_name = 'events'
        AND al.record_id = e.id
        AND al.action = 'resubmit_for_review'
    ) as is_resubmitted,
    -- 统计信息
    COUNT(DISTINCT es.id) as submission_count,
    COUNT(DISTINCT CASE WHEN es.is_published THEN es.id END) as published_count
FROM public.events e
LEFT JOIN public.event_submissions es ON e.id = es.event_id
GROUP BY e.id, e.title, e.description, e.content, e.start_date, e.end_date,
         e.location, e.type, e.tags, e.media, e.is_public, e.max_participants,
         e.status, e.organizer_id, e.brand_id, e.brand_name, e.created_at, e.updated_at;

-- 5. 添加注释
COMMENT ON FUNCTION public.update_event_and_resubmit IS '更新活动并重新提交审核，已发布或已拒绝的活动编辑后会变为待审核状态';
COMMENT ON FUNCTION public.submit_event_for_review IS '主办方提交活动进行审核';
COMMENT ON FUNCTION public.get_event_edit_history IS '获取活动的编辑历史记录';
COMMENT ON VIEW public.organizer_events_full IS '主办方活动完整信息视图，包含审核状态和操作权限';

-- 6. 创建触发器：自动记录活动更新历史
CREATE OR REPLACE FUNCTION public.log_event_changes()
RETURNS TRIGGER AS $$
BEGIN
    -- 只记录特定字段的变化
    IF OLD.title IS DISTINCT FROM NEW.title OR
       OLD.description IS DISTINCT FROM NEW.description OR
       OLD.content IS DISTINCT FROM NEW.content OR
       OLD.start_date IS DISTINCT FROM NEW.start_date OR
       OLD.end_date IS DISTINCT FROM NEW.end_date OR
       OLD.location IS DISTINCT FROM NEW.location OR
       OLD.status IS DISTINCT FROM NEW.status THEN
        
        INSERT INTO public.audit_logs (
            user_id,
            action,
            table_name,
            record_id,
            old_values,
            new_values
        ) VALUES (
            auth.uid(),
            'update',
            'events',
            NEW.id,
            jsonb_build_object(
                'title', OLD.title,
                'description', OLD.description,
                'content', OLD.content,
                'start_date', OLD.start_date,
                'end_date', OLD.end_date,
                'location', OLD.location,
                'status', OLD.status
            ),
            jsonb_build_object(
                'title', NEW.title,
                'description', NEW.description,
                'content', NEW.content,
                'start_date', NEW.start_date,
                'end_date', NEW.end_date,
                'location', NEW.location,
                'status', NEW.status
            )
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除已存在的触发器（如果有）
DROP TRIGGER IF EXISTS trigger_log_event_changes ON public.events;

-- 创建触发器
CREATE TRIGGER trigger_log_event_changes
    AFTER UPDATE ON public.events
    FOR EACH ROW
    EXECUTE FUNCTION public.log_event_changes();

-- 7. 创建函数：检查活动是否可以编辑
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

    -- 检查权限和状态
    RETURN v_organizer_id = p_user_id 
        AND v_status IN ('draft', 'rejected', 'pending');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
