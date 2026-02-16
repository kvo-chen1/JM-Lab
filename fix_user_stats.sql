-- 修复用户活动统计问题
-- 1. 创建 user_participation_details 视图
-- 2. 创建获取用户统计的函数

-- ============================================
-- 1. 创建/更新 user_participation_details 视图
-- ============================================
DROP VIEW IF EXISTS public.user_participation_details;

CREATE OR REPLACE VIEW public.user_participation_details AS
SELECT 
    ep.id,
    ep.user_id,
    ep.event_id,
    ep.status as participation_status,
    ep.progress,
    ep.current_step,
    ep.submitted_work_id,
    ep.submission_date,
    ep.ranking,
    ep.award,
    ep.registration_date,
    ep.notes,
    ep.created_at,
    ep.updated_at,
    e.title as event_title,
    e.description as event_description,
    e.start_time as event_start,
    e.end_time as event_end,
    e.location as event_location,
    e.type as event_type,
    e.status as event_status,
    e.image_url as event_thumbnail,
    COALESCE(e.max_participants, 100) as event_max_participants,
    e.current_participants as event_current_participants
FROM public.event_participants ep
JOIN public.events e ON ep.event_id = e.id;

-- ============================================
-- 2. 创建获取用户参与统计的函数
-- ============================================
CREATE OR REPLACE FUNCTION public.get_user_participation_stats(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_total INTEGER;
    v_total_votes INTEGER;
    v_total_likes INTEGER;
    v_submission_ids UUID[];
BEGIN
    -- 获取用户参与的活动数量
    SELECT COUNT(*) INTO v_total
    FROM public.event_participants
    WHERE user_id = p_user_id;

    -- 获取用户的所有作品提交ID
    SELECT ARRAY_AGG(id) INTO v_submission_ids
    FROM public.event_submissions
    WHERE user_id = p_user_id;

    -- 统计投票数
    IF v_submission_ids IS NOT NULL AND array_length(v_submission_ids, 1) > 0 THEN
        SELECT COUNT(*) INTO v_total_votes
        FROM public.submission_votes
        WHERE submission_id = ANY(v_submission_ids);

        -- 统计点赞数
        SELECT COUNT(*) INTO v_total_likes
        FROM public.submission_likes
        WHERE submission_id = ANY(v_submission_ids);
    ELSE
        v_total_votes := 0;
        v_total_likes := 0;
    END IF;

    RETURN jsonb_build_object(
        'total', v_total,
        'totalVotes', v_total_votes,
        'totalLikes', v_total_likes
    );
END;
$$;

-- ============================================
-- 3. 授予权限
-- ============================================
GRANT SELECT ON public.user_participation_details TO authenticated;
GRANT SELECT ON public.user_participation_details TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_participation_stats(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_participation_stats(UUID) TO anon;

-- ============================================
-- 4. 验证视图和函数
-- ============================================
SELECT 'user_participation_details view created' as status;
SELECT 'get_user_participation_stats function created' as status;
