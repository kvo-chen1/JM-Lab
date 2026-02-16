-- ============================================
-- 修复 get_works_for_scoring 函数（移除 is_published 依赖）
-- ============================================

CREATE OR REPLACE FUNCTION public.get_works_for_scoring(
    p_event_id UUID DEFAULT NULL,
    p_status TEXT DEFAULT 'all',
    p_score_status TEXT DEFAULT 'all',
    p_search_query TEXT DEFAULT NULL,
    p_sort_by TEXT DEFAULT 'submitted_at',
    p_sort_order TEXT DEFAULT 'desc',
    p_page INTEGER DEFAULT 1,
    p_limit INTEGER DEFAULT 20
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_offset INTEGER;
    v_total INTEGER;
    v_works JSONB;
BEGIN
    v_offset := (p_page - 1) * p_limit;
    
    -- 获取总数
    SELECT COUNT(*) INTO v_total
    FROM public.submission_full_details sfd
    WHERE (p_event_id IS NULL OR sfd.event_id = p_event_id)
    AND (p_status = 'all' OR sfd.status = p_status)
    AND (
        p_score_status = 'all' 
        OR (p_score_status = 'unscored' AND sfd.score_count = 0)
        OR (p_score_status = 'scored' AND sfd.score_count > 0)
    )
    AND (
        p_search_query IS NULL 
        OR sfd.title ILIKE '%' || p_search_query || '%'
        OR sfd.creator_name ILIKE '%' || p_search_query || '%'
    );
    
    -- 获取作品列表
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', sfd.id,
            'event_id', sfd.event_id,
            'event_title', sfd.event_title,
            'user_id', sfd.user_id,
            'creator_name', sfd.creator_name,
            'creator_avatar', sfd.creator_avatar,
            'title', sfd.title,
            'description', sfd.description,
            'files', sfd.files,
            'submitted_at', sfd.submitted_at,
            'status', sfd.status,
            'avg_score', sfd.avg_score,
            'score_count', sfd.score_count,
            'judge_count', sfd.judge_count
        ) ORDER BY 
            CASE 
                WHEN p_sort_by = 'submitted_at' AND p_sort_order = 'desc' THEN sfd.submitted_at
            END DESC,
            CASE 
                WHEN p_sort_by = 'submitted_at' AND p_sort_order = 'asc' THEN sfd.submitted_at
            END ASC
    ) INTO v_works
    FROM (
        SELECT * FROM public.submission_full_details sfd
        WHERE (p_event_id IS NULL OR sfd.event_id = p_event_id)
        AND (p_status = 'all' OR sfd.status = p_status)
        AND (
            p_score_status = 'all' 
            OR (p_score_status = 'unscored' AND sfd.score_count = 0)
            OR (p_score_status = 'scored' AND sfd.score_count > 0)
        )
        AND (
            p_search_query IS NULL 
            OR sfd.title ILIKE '%' || p_search_query || '%'
            OR sfd.creator_name ILIKE '%' || p_search_query || '%'
        )
        LIMIT p_limit
        OFFSET v_offset
    ) sfd;
    
    RETURN jsonb_build_object(
        'works', COALESCE(v_works, '[]'::jsonb),
        'total', v_total,
        'page', p_page,
        'limit', p_limit,
        'total_pages', CEIL(v_total::DECIMAL / p_limit)
    );
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION public.get_works_for_scoring TO authenticated;

-- 验证
SELECT 'get_works_for_scoring function updated' as status;
