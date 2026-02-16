-- ============================================
-- 修复 publish_score 函数，同时更新参与记录状态
-- ============================================

CREATE OR REPLACE FUNCTION public.publish_score(
    p_submission_id UUID,
    p_publish BOOLEAN,
    p_published_by UUID
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_action TEXT;
    v_event_id UUID;
    v_user_id UUID;
BEGIN
    -- 获取活动ID和用户ID
    SELECT event_id, user_id INTO v_event_id, v_user_id
    FROM public.event_submissions
    WHERE id = p_submission_id;
    
    IF v_event_id IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '作品不存在'
        );
    END IF;
    
    IF p_publish THEN
        -- 发布评分结果
        UPDATE public.event_submissions
        SET status = 'reviewed'
        WHERE id = p_submission_id;
        
        -- 更新参与记录状态为已完成
        UPDATE public.event_participants
        SET 
            status = 'completed',
            current_step = 4,
            progress = 100,
            updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
        WHERE event_id = v_event_id 
        AND user_id = v_user_id;
        
        v_action := 'publish';
    ELSE
        -- 取消发布
        UPDATE public.event_submissions
        SET status = 'submitted'
        WHERE id = p_submission_id;
        
        -- 恢复参与记录状态为评审中
        UPDATE public.event_participants
        SET 
            status = 'reviewing',
            current_step = 3,
            progress = 75,
            updated_at = (EXTRACT(EPOCH FROM NOW()) * 1000)::BIGINT
        WHERE event_id = v_event_id 
        AND user_id = v_user_id;
        
        v_action := 'unpublish';
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'action', v_action,
        'message', CASE WHEN p_publish THEN '评分结果已发布' ELSE '评分结果已取消发布' END
    );
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION public.publish_score(UUID, BOOLEAN, UUID) TO authenticated;

-- 验证
SELECT 'publish_score function updated' as status;
