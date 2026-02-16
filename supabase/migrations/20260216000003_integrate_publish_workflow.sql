-- 整合发布流程：发布最终排名时自动发布所有作品结果
-- 执行时间: 2026-02-16

-- 更新发布最终排名函数，增加自动发布所有作品功能
CREATE OR REPLACE FUNCTION public.publish_final_ranking(
    p_event_id uuid,
    p_published_by uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_event_title text;
    v_ranking_data jsonb;
    v_published_count int := 0;
BEGIN
    -- 检查活动是否存在
    SELECT title INTO v_event_title
    FROM public.events
    WHERE id = p_event_id;
    
    IF v_event_title IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '活动不存在'
        );
    END IF;
    
    -- 获取排名数据（按平均分降序）
    SELECT jsonb_agg(
        jsonb_build_object(
            'submission_id', es.id,
            'rank', row_number() OVER (ORDER BY COALESCE(ss.avg_score, 0) DESC, es.submission_date ASC),
            'title', COALESCE(es.work_title, '未命名作品'),
            'creator_id', es.user_id,
            'creator_name', COALESCE(pu.username, u.raw_user_meta_data->>'username', '未知用户'),
            'creator_avatar', COALESCE(pu.avatar_url, u.raw_user_meta_data->>'avatar_url'),
            'avg_score', COALESCE(ss.avg_score, 0),
            'score_count', COALESCE(ss.score_count, 0),
            'judge_count', COALESCE(ss.judge_count, 0),
            'submitted_at', to_timestamp(es.submission_date / 1000.0)
        )
        ORDER BY COALESCE(ss.avg_score, 0) DESC, es.submission_date ASC
    )
    INTO v_ranking_data
    FROM public.event_submissions es
    JOIN auth.users u ON es.user_id = u.id
    LEFT JOIN public.users pu ON es.user_id = pu.id
    LEFT JOIN public.submission_score_summary ss ON es.id = ss.submission_id
    WHERE es.event_id = p_event_id
    AND COALESCE(ss.avg_score, 0) > 0;
    
    -- 如果没有评分数据
    IF v_ranking_data IS NULL OR jsonb_array_length(v_ranking_data) = 0 THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '没有可发布的评分数据'
        );
    END IF;
    
    -- 自动发布所有已评分的作品结果
    UPDATE public.event_submissions
    SET 
        status = 'published',
        published_at = now()
    WHERE event_id = p_event_id
    AND status != 'published'
    AND id IN (
        SELECT submission_id 
        FROM public.submission_score_summary 
        WHERE avg_score > 0
    );
    
    GET DIAGNOSTICS v_published_count = ROW_COUNT;
    
    -- 更新活动表
    UPDATE public.events
    SET 
        final_ranking_published = true,
        final_ranking_published_at = now(),
        final_ranking_published_by = p_published_by,
        final_ranking_data = v_ranking_data
    WHERE id = p_event_id;
    
    -- 插入发布记录
    INSERT INTO public.final_ranking_publishes (
        event_id,
        published_by,
        ranking_data
    ) VALUES (
        p_event_id,
        p_published_by,
        v_ranking_data
    );
    
    -- 返回结果
    RETURN jsonb_build_object(
        'success', true,
        'message', '最终排名发布成功',
        'ranking_data', v_ranking_data,
        'published_at', now(),
        'published_works_count', v_published_count
    );
END;
$$;

-- 添加注释
COMMENT ON FUNCTION public.publish_final_ranking IS '发布活动的最终排名，同时自动发布所有作品结果';
