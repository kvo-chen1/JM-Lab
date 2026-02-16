-- ============================================
-- 创建 publish_score 函数
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
BEGIN
    IF p_publish THEN
        -- 发布
        UPDATE public.event_submissions
        SET status = 'reviewed'
        WHERE id = p_submission_id;
        
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
SELECT 'publish_score function created' as status;
