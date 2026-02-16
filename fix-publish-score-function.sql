-- ============================================
-- 修复 publish_score 函数，同时更新活动状态
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
BEGIN
    -- 获取活动ID
    SELECT event_id INTO v_event_id
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
        
        -- 检查是否所有作品都已评审，如果是，更新活动状态为已完成
        IF NOT EXISTS (
            SELECT 1 FROM public.event_submissions
            WHERE event_id = v_event_id
            AND status NOT IN ('reviewed', 'draft')
        ) THEN
            UPDATE public.events
            SET status = 'completed'
            WHERE id = v_event_id;
        END IF;
        
        v_action := 'publish';
    ELSE
        -- 取消发布
        UPDATE public.event_submissions
        SET status = 'submitted'
        WHERE id = p_submission_id;
        
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
