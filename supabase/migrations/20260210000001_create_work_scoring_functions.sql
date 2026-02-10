-- ============================================
-- 作品管理与评分系统 RPC 函数
-- ============================================

-- 1. 获取作品评分统计
CREATE OR REPLACE FUNCTION public.get_submission_score_stats(p_submission_id UUID)
RETURNS TABLE (
    avg_score DECIMAL(5,2),
    max_score DECIMAL(5,2),
    min_score DECIMAL(5,2),
    score_count INTEGER,
    judge_count INTEGER
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(AVG(score), 0)::DECIMAL(5,2) as avg_score,
        COALESCE(MAX(score), 0)::DECIMAL(5,2) as max_score,
        COALESCE(MIN(score), 0)::DECIMAL(5,2) as min_score,
        COUNT(*)::INTEGER as score_count,
        COUNT(DISTINCT judge_id)::INTEGER as judge_count
    FROM public.submission_scores
    WHERE submission_id = p_submission_id;
END;
$$;

-- 2. 提交评分
CREATE OR REPLACE FUNCTION public.submit_score(
    p_submission_id UUID,
    p_judge_id UUID,
    p_score DECIMAL(5,2),
    p_comment TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
    v_old_score DECIMAL(5,2);
BEGIN
    -- 检查是否已评分
    SELECT score INTO v_old_score
    FROM public.submission_scores
    WHERE submission_id = p_submission_id AND judge_id = p_judge_id;
    
    IF v_old_score IS NOT NULL THEN
        -- 更新现有评分
        UPDATE public.submission_scores
        SET score = p_score,
            comment = p_comment,
            updated_at = NOW()
        WHERE submission_id = p_submission_id AND judge_id = p_judge_id;
        
        -- 记录日志
        INSERT INTO public.score_audit_logs (submission_id, judge_id, action, old_score, new_score, comment)
        VALUES (p_submission_id, p_judge_id, 'update_score', v_old_score, p_score, p_comment);
        
        v_result := jsonb_build_object(
            'success', true,
            'action', 'updated',
            'message', '评分已更新'
        );
    ELSE
        -- 创建新评分
        INSERT INTO public.submission_scores (submission_id, judge_id, score, comment)
        VALUES (p_submission_id, p_judge_id, p_score, p_comment);
        
        -- 记录日志
        INSERT INTO public.score_audit_logs (submission_id, judge_id, action, new_score, comment)
        VALUES (p_submission_id, p_judge_id, 'score', p_score, p_comment);
        
        v_result := jsonb_build_object(
            'success', true,
            'action', 'created',
            'message', '评分已提交'
        );
    END IF;
    
    RETURN v_result;
EXCEPTION WHEN OTHERS THEN
    RETURN jsonb_build_object(
        'success', false,
        'error', SQLERRM
    );
END;
$$;

-- 3. 批量发布评分结果
CREATE OR REPLACE FUNCTION public.batch_publish_scores(
    p_submission_ids UUID[],
    p_published_by UUID
)
RETURNS TABLE (
    submission_id UUID, 
    success BOOLEAN, 
    error TEXT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_submission_id UUID;
BEGIN
    FOREACH v_submission_id IN ARRAY p_submission_ids
    LOOP
        BEGIN
            -- 检查作品是否存在且已评分
            IF NOT EXISTS (
                SELECT 1 FROM public.event_submissions 
                WHERE id = v_submission_id 
                AND status = 'submitted'
            ) THEN
                RETURN QUERY SELECT v_submission_id, FALSE, '作品不存在或未提交'::TEXT;
                CONTINUE;
            END IF;
            
            -- 更新发布状态
            UPDATE public.event_submissions
            SET is_published = TRUE,
                published_at = NOW(),
                published_by = p_published_by,
                status = 'reviewed'
            WHERE id = v_submission_id;
            
            -- 记录日志
            INSERT INTO public.score_audit_logs (submission_id, judge_id, action, comment)
            VALUES (v_submission_id, p_published_by, 'publish', '批量发布评分结果');
            
            RETURN QUERY SELECT v_submission_id, TRUE, NULL::TEXT;
        EXCEPTION WHEN OTHERS THEN
            RETURN QUERY SELECT v_submission_id, FALSE, SQLERRM::TEXT;
        END;
    END LOOP;
END;
$$;

-- 4. 单个发布/取消发布评分
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
        SET is_published = TRUE,
            published_at = NOW(),
            published_by = p_published_by,
            status = 'reviewed'
        WHERE id = p_submission_id;
        
        v_action := 'publish';
    ELSE
        -- 取消发布
        UPDATE public.event_submissions
        SET is_published = FALSE,
            published_at = NULL,
            published_by = NULL
        WHERE id = p_submission_id;
        
        v_action := 'unpublish';
    END IF;
    
    -- 记录日志
    INSERT INTO public.score_audit_logs (submission_id, judge_id, action, comment)
    VALUES (p_submission_id, p_published_by, v_action, 
            CASE WHEN p_publish THEN '发布评分结果' ELSE '取消发布评分结果' END);
    
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

-- 5. 获取品牌方的活动列表（用于筛选）
CREATE OR REPLACE FUNCTION public.get_brand_events(p_user_id UUID)
RETURNS TABLE (
    id UUID,
    title TEXT,
    start_time TIMESTAMPTZ,
    end_time TIMESTAMPTZ,
    status TEXT,
    submission_count BIGINT
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.start_time,
        e.end_time,
        e.status,
        COUNT(es.id) as submission_count
    FROM public.events e
    LEFT JOIN public.brand_partnerships bp ON e.brand_id = bp.brand_id AND bp.user_id = p_user_id AND bp.status = 'approved'
    LEFT JOIN public.event_submissions es ON e.id = es.event_id
    WHERE (
        -- 用户是活动的组织者
        e.organizer_id = p_user_id
        OR 
        -- 用户有品牌合作关系
        (bp.user_id = p_user_id AND bp.status = 'approved')
        OR
        -- 用户是管理员
        EXISTS (
            SELECT 1 FROM public.user_roles ur
            WHERE ur.user_id = p_user_id AND ur.role = 'admin'
        )
    )
    GROUP BY e.id, e.title, e.start_time, e.end_time, e.status
    ORDER BY e.created_at DESC;
END;
$$;

-- 6. 获取作品列表（带筛选和分页）
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
        OR (p_score_status = 'published' AND sfd.is_published = TRUE)
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
            'is_published', sfd.is_published,
            'avg_score', sfd.avg_score,
            'score_count', sfd.score_count,
            'judge_count', sfd.judge_count
        ) ORDER BY 
            CASE 
                WHEN p_sort_by = 'submitted_at' AND p_sort_order = 'desc' THEN sfd.submitted_at
            END DESC,
            CASE 
                WHEN p_sort_by = 'submitted_at' AND p_sort_order = 'asc' THEN sfd.submitted_at
            END ASC,
            CASE 
                WHEN p_sort_by = 'score' AND p_sort_order = 'desc' THEN sfd.avg_score
            END DESC NULLS LAST,
            CASE 
                WHEN p_sort_by = 'score' AND p_sort_order = 'asc' THEN sfd.avg_score
            END ASC NULLS LAST,
            CASE 
                WHEN p_sort_by = 'title' AND p_sort_order = 'desc' THEN sfd.title
            END DESC,
            CASE 
                WHEN p_sort_by = 'title' AND p_sort_order = 'asc' THEN sfd.title
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
            OR (p_score_status = 'published' AND sfd.is_published = TRUE)
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

-- 7. 获取作品评分详情
CREATE OR REPLACE FUNCTION public.get_submission_scores(p_submission_id UUID)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_scores JSONB;
    v_stats JSONB;
BEGIN
    -- 获取所有评分
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', jsd.id,
            'judge_id', jsd.judge_id,
            'judge_name', jsd.judge_name,
            'judge_avatar', jsd.judge_avatar,
            'score', jsd.score,
            'comment', jsd.comment,
            'created_at', jsd.created_at,
            'updated_at', jsd.updated_at
        ) ORDER BY jsd.created_at DESC
    ) INTO v_scores
    FROM public.judge_score_details jsd
    WHERE jsd.submission_id = p_submission_id;
    
    -- 获取统计
    SELECT jsonb_build_object(
        'avg_score', avg_score,
        'max_score', max_score,
        'min_score', min_score,
        'score_count', score_count,
        'judge_count', judge_count
    ) INTO v_stats
    FROM public.get_submission_score_stats(p_submission_id) gs;
    
    RETURN jsonb_build_object(
        'scores', COALESCE(v_scores, '[]'::jsonb),
        'stats', v_stats
    );
END;
$$;

-- 8. 获取评分操作日志
CREATE OR REPLACE FUNCTION public.get_score_audit_logs(
    p_submission_id UUID DEFAULT NULL,
    p_limit INTEGER DEFAULT 50
)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
    v_logs JSONB;
BEGIN
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', sal.id,
            'submission_id', sal.submission_id,
            'judge_id', sal.judge_id,
            'judge_name', u.raw_user_meta_data->>'username',
            'action', sal.action,
            'old_score', sal.old_score,
            'new_score', sal.new_score,
            'comment', sal.comment,
            'created_at', sal.created_at
        ) ORDER BY sal.created_at DESC
    ) INTO v_logs
    FROM public.score_audit_logs sal
    JOIN auth.users u ON sal.judge_id = u.id
    WHERE (p_submission_id IS NULL OR sal.submission_id = p_submission_id)
    LIMIT p_limit;
    
    RETURN COALESCE(v_logs, '[]'::jsonb);
END;
$$;
