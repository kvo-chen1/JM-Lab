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


ALTER FUNCTION public.get_user_participation_stats(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_user_points_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_points_stats(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_balance INTEGER;
    v_total_earned INTEGER;
    v_total_spent INTEGER;
    v_today_earned INTEGER;
    v_week_earned INTEGER;
    v_month_earned INTEGER;
    v_source_stats JSONB;
BEGIN
    -- 获取余额统计
    SELECT balance, total_earned, total_spent 
    INTO v_balance, v_total_earned, v_total_spent
    FROM public.user_points_balance
    WHERE user_id = p_user_id;

    IF v_balance IS NULL THEN
        v_balance := 0;
        v_total_earned := 0;
        v_total_spent := 0;
    END IF;

    -- 今日获得
    SELECT COALESCE(SUM(points), 0) INTO v_today_earned
    FROM public.points_records
    WHERE user_id = p_user_id
      AND type = 'earned'
      AND created_at >= CURRENT_DATE;

    -- 本周获得
    SELECT COALESCE(SUM(points), 0) INTO v_week_earned
    FROM public.points_records
    WHERE user_id = p_user_id
      AND type = 'earned'
      AND created_at >= DATE_TRUNC('week', CURRENT_DATE);

    -- 本月获得
    SELECT COALESCE(SUM(points), 0) INTO v_month_earned
    FROM public.points_records
    WHERE user_id = p_user_id
      AND type = 'earned'
      AND created_at >= DATE_TRUNC('month', CURRENT_DATE);

    -- 来源统计
    SELECT jsonb_object_agg(source_type, total)
    INTO v_source_stats
    FROM (
        SELECT source_type, COALESCE(SUM(points), 0) as total
        FROM public.points_records
        WHERE user_id = p_user_id AND type = 'earned'
        GROUP BY source_type
    ) sub;

    IF v_source_stats IS NULL THEN
        v_source_stats := '{}'::JSONB;
    END IF;

    RETURN jsonb_build_object(
        'current_balance', v_balance,
        'total_earned', v_total_earned,
        'total_spent', v_total_spent,
        'today_earned', v_today_earned,
        'week_earned', v_week_earned,
        'month_earned', v_month_earned,
        'source_stats', v_source_stats
    );
END;
$$;


ALTER FUNCTION public.get_user_points_stats(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_user_preferences(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_preferences(p_user_id uuid) RETURNS TABLE(tag text, weight numeric)
    LANGUAGE plpgsql STABLE
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        jsonb_object_keys(up.interests) as tag,
        (up.interests ->> jsonb_object_keys(up.interests))::NUMERIC as weight
    FROM user_profiles up
    WHERE up.user_id = p_user_id;
END;
$$;


ALTER FUNCTION public.get_user_preferences(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_user_sync_status(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_user_sync_status(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_last_sync TIMESTAMPTZ;
  v_sync_count BIGINT;
  v_pending_updates JSONB;
BEGIN
  -- 获取最后一次同步时间
  SELECT MAX(synced_at) INTO v_last_sync
  FROM user_sync_logs
  WHERE user_id = p_user_id;

  -- 获取同步次数
  SELECT COUNT(*) INTO v_sync_count
  FROM user_sync_logs
  WHERE user_id = p_user_id;

  -- 获取待处理的更新 (如果有)
  SELECT jsonb_agg(latest_sync.sync_data)
  INTO v_pending_updates
  FROM (
    SELECT sync_data
    FROM user_sync_logs
    WHERE user_id = p_user_id
    ORDER BY synced_at DESC
    LIMIT 1
  ) latest_sync;

  RETURN jsonb_build_object(
    'last_sync', v_last_sync,
    'sync_count', v_sync_count,
    'pending_updates', COALESCE(v_pending_updates, '[]'::jsonb),
    'is_synced', v_last_sync IS NOT NULL
  );
END;
$$;


ALTER FUNCTION public.get_user_sync_status(p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_user_sync_status(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_user_sync_status(p_user_id uuid) IS '获取用户同步状态';


--
-- Name: get_works_for_scoring(uuid, text, text, text, text, text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.get_works_for_scoring(p_event_id uuid DEFAULT NULL::uuid, p_status text DEFAULT 'all'::text, p_score_status text DEFAULT 'all'::text, p_search_query text DEFAULT NULL::text, p_sort_by text DEFAULT 'submitted_at'::text, p_sort_order text DEFAULT 'desc'::text, p_page integer DEFAULT 1, p_limit integer DEFAULT 20) RETURNS jsonb
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


ALTER FUNCTION public.get_works_for_scoring(p_event_id uuid, p_status text, p_score_status text, p_search_query text, p_sort_by text, p_sort_order text, p_page integer, p_limit integer) OWNER TO postgres;

--
-- Name: handle_new_user(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.handle_new_user() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'public'
    AS $$
BEGIN
    INSERT INTO public.users (
        id,
        email,
        username,
        avatar_url,
        metadata,
        created_at,
        updated_at
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(
            NEW.raw_user_meta_data->>'username',
            NEW.raw_user_meta_data->>'name',
            NEW.raw_user_meta_data->>'full_name',
            split_part(NEW.email, '@', 1)
        ),
        NEW.raw_user_meta_data->>'avatar_url',
        COALESCE(NEW.raw_user_meta_data, '{}'::jsonb),
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        username = EXCLUDED.username,
        avatar_url = EXCLUDED.avatar_url,
        metadata = EXCLUDED.metadata,
        updated_at = NOW();

    RETURN NEW;
END;
$$;


ALTER FUNCTION public.handle_new_user() OWNER TO postgres;

--
-- Name: has_feedback_manage_permission(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.has_feedback_manage_permission(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_accounts aa
        JOIN admin_roles ar ON aa.role_id = ar.id
        WHERE aa.user_id = p_user_id
        AND aa.status = 'active'
        AND (ar.permissions @> '[{"permission": "feedback:manage"}]'::jsonb
             OR ar.permissions @> '[{"permission": "admin:manage"}]'::jsonb)
    );
END;
$$;


ALTER FUNCTION public.has_feedback_manage_permission(p_user_id uuid) OWNER TO postgres;

--
-- Name: increment_click_count(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_click_count(p_execution_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE order_executions
  SET click_count = click_count + 1
  WHERE id = p_execution_id;
END;
$$;


ALTER FUNCTION public.increment_click_count(p_execution_id uuid) OWNER TO postgres;

--
-- Name: increment_conversion(uuid, numeric, numeric); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_conversion(p_execution_id uuid, p_sale_amount numeric, p_earnings numeric) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE order_executions
  SET 
    conversion_count = conversion_count + 1,
    total_sales = total_sales + p_sale_amount,
    total_earnings = total_earnings + p_earnings
  WHERE id = p_execution_id;
END;
$$;


ALTER FUNCTION public.increment_conversion(p_execution_id uuid, p_sale_amount numeric, p_earnings numeric) OWNER TO postgres;

--
-- Name: increment_invite_count(text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_invite_count(p_user_id text) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO user_invite_rate_limits (user_id, daily_count, weekly_count, monthly_count, last_invite_at)
    VALUES (p_user_id, 1, 1, 1, NOW())
    ON CONFLICT (user_id) DO UPDATE SET
        daily_count = user_invite_rate_limits.daily_count + 1,
        weekly_count = user_invite_rate_limits.weekly_count + 1,
        monthly_count = user_invite_rate_limits.monthly_count + 1,
        last_invite_at = NOW();
END;
$$;


ALTER FUNCTION public.increment_invite_count(p_user_id text) OWNER TO postgres;

--
-- Name: increment_promotion_clicks(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_promotion_clicks(p_work_id uuid, p_click_count integer DEFAULT 1) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_current_clicks INTEGER;
BEGIN
  -- 获取当前点击量
  SELECT actual_clicks INTO v_current_clicks
  FROM promoted_works
  WHERE id = p_work_id;
  
  IF v_current_clicks IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 更新点击量
  UPDATE promoted_works
  SET 
    actual_clicks = actual_clicks + p_click_count,
    updated_at = NOW()
  WHERE id = p_work_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION public.increment_promotion_clicks(p_work_id uuid, p_click_count integer) OWNER TO postgres;

--
-- Name: FUNCTION increment_promotion_clicks(p_work_id uuid, p_click_count integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.increment_promotion_clicks(p_work_id uuid, p_click_count integer) IS '增加指定推广作品的点击量';


--
-- Name: increment_promotion_views(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_promotion_views(p_work_id uuid, p_view_count integer DEFAULT 1) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_current_views INTEGER;
  v_target_views INTEGER;
  v_progress INTEGER;
BEGIN
  -- 获取当前曝光量
  SELECT actual_views, target_views INTO v_current_views, v_target_views
  FROM promoted_works
  WHERE id = p_work_id;
  
  IF v_current_views IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- 更新曝光量
  UPDATE promoted_works
  SET 
    actual_views = actual_views + p_view_count,
    updated_at = NOW(),
    -- 如果达到目标曝光量，自动标记为完成
    status = CASE 
      WHEN actual_views + p_view_count >= target_views THEN 'completed'::promotion_status
      ELSE status
    END,
    end_time = CASE 
      WHEN actual_views + p_view_count >= target_views THEN NOW()
      ELSE end_time
    END
  WHERE id = p_work_id;
  
  RETURN TRUE;
END;
$$;


ALTER FUNCTION public.increment_promotion_views(p_work_id uuid, p_view_count integer) OWNER TO postgres;

--
-- Name: FUNCTION increment_promotion_views(p_work_id uuid, p_view_count integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.increment_promotion_views(p_work_id uuid, p_view_count integer) IS '增加指定推广作品的曝光量';


--
-- Name: increment_recommendation_click(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_recommendation_click(p_item_id uuid) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE home_recommendations
    SET click_count = COALESCE(click_count, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_item_id;
END;
$$;


ALTER FUNCTION public.increment_recommendation_click(p_item_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION increment_recommendation_click(p_item_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.increment_recommendation_click(p_item_id uuid) IS '增加推荐项点击次数';


--
-- Name: increment_recommendation_impression(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_recommendation_impression(p_item_id uuid, p_count integer DEFAULT 1) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE home_recommendations
    SET impression_count = COALESCE(impression_count, 0) + p_count,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_item_id;
END;
$$;


ALTER FUNCTION public.increment_recommendation_impression(p_item_id uuid, p_count integer) OWNER TO postgres;

--
-- Name: FUNCTION increment_recommendation_impression(p_item_id uuid, p_count integer); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.increment_recommendation_impression(p_item_id uuid, p_count integer) IS '增加推荐项曝光次数';


--
-- Name: increment_work_view_count(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.increment_work_view_count(work_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    new_count INTEGER;
BEGIN
    UPDATE public.works
    SET view_count = view_count + 1
    WHERE id = work_id
    RETURNING view_count INTO new_count;
    
    RETURN new_count;
END;
$$;


ALTER FUNCTION public.increment_work_view_count(work_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION increment_work_view_count(work_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.increment_work_view_count(work_id uuid) IS '增加指定作品的浏览量并返回新的浏览量';


--
-- Name: initialize_user_points_balance(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.initialize_user_points_balance() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.user_points_balance (user_id, balance, total_earned, total_spent)
  VALUES (NEW.id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.initialize_user_points_balance() OWNER TO postgres;

--
-- Name: is_active_admin(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_active_admin(p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_accounts
        WHERE user_id = p_user_id AND status = 'active'
    );
END;
$$;


ALTER FUNCTION public.is_active_admin(p_user_id uuid) OWNER TO postgres;

--
-- Name: is_super_admin(uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.is_super_admin(p_user_id uuid, required_permission text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_accounts aa
        JOIN admin_roles ar ON aa.role_id = ar.id
        WHERE aa.user_id = p_user_id
        AND aa.status = 'active'
        AND ar.permissions @> jsonb_build_array(jsonb_build_object('permission', required_permission))
    );
END;
$$;


ALTER FUNCTION public.is_super_admin(p_user_id uuid, required_permission text) OWNER TO postgres;

--
-- Name: log_audit_event(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_audit_event() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    INSERT INTO public.audit_logs (
        table_name,
        record_id,
        operation,
        old_data,
        new_data,
        changed_by
    )
    VALUES (
        TG_TABLE_NAME,
        COALESCE(NEW.id::text, OLD.id::text),
        TG_OP,
        CASE WHEN TG_OP = 'DELETE' OR TG_OP = 'UPDATE' THEN to_jsonb(OLD) ELSE NULL END,
        CASE WHEN TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN to_jsonb(NEW) ELSE NULL END,
        auth.uid()
    );
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.log_audit_event() OWNER TO postgres;

--
-- Name: log_comment_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_comment_activity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    post_title TEXT;
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 获取帖子标题
        SELECT title INTO post_title FROM public.posts WHERE id = NEW.post_id;
        
        INSERT INTO public.user_activities (user_id, action_type, entity_type, entity_id, details, content)
        VALUES (
            NEW.user_id,
            'create_comment',
            'comment',
            NEW.id::text,
            jsonb_build_object('post_id', NEW.post_id, 'post_title', post_title, 'content', substring(NEW.content from 1 for 100)),
            '评论了作品《' || COALESCE(post_title, '未知作品') || '》'
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_comment_activity() OWNER TO postgres;

--
-- Name: log_feedback_process(uuid, uuid, character varying, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_feedback_process(p_feedback_id uuid, p_admin_id uuid, p_action character varying, p_old_value text DEFAULT NULL::text, p_new_value text DEFAULT NULL::text, p_details jsonb DEFAULT NULL::jsonb) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO feedback_process_logs (feedback_id, admin_id, action, old_value, new_value, details)
    VALUES (p_feedback_id, p_admin_id, p_action, p_old_value, p_new_value, p_details)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$;


ALTER FUNCTION public.log_feedback_process(p_feedback_id uuid, p_admin_id uuid, p_action character varying, p_old_value text, p_new_value text, p_details jsonb) OWNER TO postgres;

--
-- Name: log_like_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_like_activity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE post_title TEXT;
BEGIN
    SELECT title INTO post_title FROM public.posts WHERE id = NEW.post_id;
    INSERT INTO public.user_activities (user_id, activity_type, content, target_id, target_type, target_title)
    VALUES (NEW.user_id, 'like', '点赞了作品', NEW.post_id, 'post', post_title);
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_like_activity() OWNER TO postgres;

--
-- Name: log_post_activity(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_post_activity() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    IF TG_OP = 'INSERT' AND NEW.status = 'published' THEN
        INSERT INTO public.user_activities (user_id, action_type, entity_type, entity_id, details, content)
        VALUES (
            NEW.user_id,
            'create_post',
            'post',
            NEW.id::text,
            jsonb_build_object('title', NEW.title, 'content', substring(NEW.content from 1 for 100)),
            '发布了新作品《' || NEW.title || '》'
        );
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.log_post_activity() OWNER TO postgres;

--
-- Name: log_promotion_audit(uuid, uuid, text, text, text, text, text, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.log_promotion_audit(p_application_id uuid, p_user_id uuid, p_action text, p_previous_status text, p_new_status text, p_notes text, p_reason text, p_performed_by uuid, p_changes jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_log_id UUID;
BEGIN
    INSERT INTO public.promotion_audit_logs (
        application_id, user_id, action, previous_status, new_status,
        notes, reason, performed_by, changes
    ) VALUES (
        p_application_id, p_user_id, p_action, p_previous_status, p_new_status,
        p_notes, p_reason, p_performed_by, p_changes
    )
    RETURNING id INTO v_log_id;
    RETURN v_log_id;
END;
$$;


ALTER FUNCTION public.log_promotion_audit(p_application_id uuid, p_user_id uuid, p_action text, p_previous_status text, p_new_status text, p_notes text, p_reason text, p_performed_by uuid, p_changes jsonb) OWNER TO postgres;

--
-- Name: mark_ai_feedback_as_read(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.mark_ai_feedback_as_read(p_feedback_id uuid, p_admin_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE ai_feedback
    SET is_read = true,
        updated_at = NOW()
    WHERE id = p_feedback_id;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.mark_ai_feedback_as_read(p_feedback_id uuid, p_admin_id uuid) OWNER TO postgres;

--
-- Name: moderate_content(uuid, text, text, text, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.moderate_content(p_content_id uuid, p_content_type text, p_title text, p_description text, p_user_id uuid DEFAULT NULL::uuid) RETURNS TABLE(approved boolean, action text, reason text, matched_words text[], scores jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_full_text TEXT;
    v_matched_words TEXT[] := '{}';
    v_word RECORD;
    v_rule RECORD;
    v_spam_score INTEGER := 0;
    v_ai_risk_score INTEGER := 0;
    v_authenticity_score INTEGER := 0;
    v_max_severity INTEGER := 0;
    v_should_reject BOOLEAN := FALSE;
    v_should_flag BOOLEAN := FALSE;
    v_reason TEXT := '';
BEGIN
    -- 合并文本内容
    v_full_text := COALESCE(p_title, '') || ' ' || COALESCE(p_description, '');
    
    -- ========== 1. 敏感词检测 ==========
    SELECT * INTO v_rule FROM public.moderation_rules 
    WHERE rule_type = 'sensitive_words' AND enabled = TRUE;
    
    IF FOUND THEN
        FOR v_word IN SELECT * FROM public.forbidden_words WHERE is_active = TRUE LOOP
            IF v_word.is_regex THEN
                IF v_full_text ~* v_word.word THEN
                    v_matched_words := array_append(v_matched_words, v_word.word);
                    v_max_severity := GREATEST(v_max_severity, v_word.severity);
                END IF;
            ELSE
                IF v_full_text ILIKE '%' || v_word.word || '%' THEN
                    v_matched_words := array_append(v_matched_words, v_word.word);
                    v_max_severity := GREATEST(v_max_severity, v_word.severity);
                END IF;
            END IF;
        END LOOP;
        
        -- 如果匹配到严重程度>=阈值的违禁词，自动拒绝
        IF v_max_severity >= v_rule.threshold THEN
            v_should_reject := TRUE;
            v_reason := '内容包含违禁词';
        END IF;
    END IF;
    
    -- ========== 2. 垃圾内容评分 ==========
    SELECT * INTO v_rule FROM public.moderation_rules 
    WHERE rule_type = 'spam_detection' AND enabled = TRUE;
    
    IF FOUND THEN
        -- 检查重复字符
        IF v_full_text ~ '(.)\1{4,}' THEN
            v_spam_score := v_spam_score + 20;
        END IF;
        
        -- 检查链接数量
        IF array_length(regexp_matches(v_full_text, 'http', 'g'), 1) > 3 THEN
            v_spam_score := v_spam_score + 15;
        END IF;
        
        -- 检查内容长度
        IF LENGTH(v_full_text) < 20 THEN
            v_spam_score := v_spam_score + 25;
        END IF;
        
        -- 检查特殊字符比例
        IF LENGTH(regexp_replace(v_full_text, '[\w\s\u4e00-\u9fa5]', '', 'g'))::FLOAT / NULLIF(LENGTH(v_full_text), 0) > 0.3 THEN
            v_spam_score := v_spam_score + 15;
        END IF;
        
        v_spam_score := LEAST(v_spam_score, 100);
        
        -- 根据阈值决定操作
        IF v_spam_score >= v_rule.threshold THEN
            IF v_rule.auto_action = 'reject' THEN
                v_should_reject := TRUE;
                v_reason := COALESCE(v_reason || '; ', '') || '垃圾内容风险过高';
            ELSIF v_rule.auto_action = 'flag' THEN
                v_should_flag := TRUE;
            END IF;
        END IF;
    END IF;
    
    -- ========== 3. AI生成风险评分 ==========
    SELECT * INTO v_rule FROM public.moderation_rules 
    WHERE rule_type = 'ai_generated' AND enabled = TRUE;
    
    IF FOUND AND LENGTH(v_full_text) >= COALESCE((v_rule.config->>'min_text_length')::INTEGER, 50) THEN
        -- 检查过于完美的格式
        IF v_full_text ~ '^[\u4e00-\u9fa5]+[，。！？]' AND 
           (LENGTH(regexp_replace(v_full_text, '[^，。！？]', '', 'g'))::FLOAT / NULLIF(LENGTH(v_full_text), 0)) > 0.05 THEN
            v_ai_risk_score := v_ai_risk_score + 20;
        END IF;
        
        -- 检查重复模式
        IF (SELECT COUNT(DISTINCT s) FROM unnest(string_to_array(v_full_text, '。')) s) < 
           (SELECT COUNT(*) FROM unnest(string_to_array(v_full_text, '。')) s) * 0.7 
           AND LENGTH(v_full_text) > 100 THEN
            v_ai_risk_score := v_ai_risk_score + 25;
        END IF;
        
        -- 检查过于通用的表达
        IF v_full_text ~ '(众所周知|不言而喻|总而言之|综上所述|首先.*其次.*最后)' THEN
            v_ai_risk_score := v_ai_risk_score + 15;
        END IF;
        
        v_ai_risk_score := LEAST(v_ai_risk_score, 100);
        
        IF v_ai_risk_score >= v_rule.threshold THEN
            IF v_rule.auto_action = 'reject' THEN
                v_should_reject := TRUE;
                v_reason := COALESCE(v_reason || '; ', '') || '疑似AI生成内容';
            ELSIF v_rule.auto_action = 'flag' THEN
                v_should_flag := TRUE;
            END IF;
        END IF;
    END IF;
    
    -- ========== 4. 文化真实性评分 ==========
    SELECT * INTO v_rule FROM public.moderation_rules 
    WHERE rule_type = 'cultural_authenticity' AND enabled = TRUE;
    
    IF FOUND THEN
        -- 检测文化元素
        IF v_full_text ~* '(京剧|昆曲|书法|国画|剪纸|刺绣|陶瓷|丝绸|茶道|中医|武术|太极|春节|中秋|端午|清明|故宫|长城|敦煌)' THEN
            v_authenticity_score := v_authenticity_score + 30;
        END IF;
        
        IF v_full_text ~* '(龙舟|舞狮|舞龙|花灯|庙会|年画|皮影|木偶戏|杂技|非遗|传统技艺)' THEN
            v_authenticity_score := v_authenticity_score + 25;
        END IF;
        
        IF LENGTH(v_full_text) > 100 THEN
            v_authenticity_score := v_authenticity_score + 10;
        END IF;
        
        v_authenticity_score := LEAST(v_authenticity_score, 100);
    END IF;
    
    -- ========== 5. 记录审核日志 ==========
    INSERT INTO public.moderation_logs (
        content_id, content_type, user_id, action, reason, 
        scores, matched_words
    ) VALUES (
        p_content_id, p_content_type, p_user_id,
        CASE 
            WHEN v_should_reject THEN 'auto_rejected'
            WHEN v_should_flag THEN 'flagged'
            ELSE 'auto_approved'
        END,
        CASE WHEN v_reason = '' THEN NULL ELSE v_reason END,
        jsonb_build_object(
            'spam_score', v_spam_score,
            'ai_risk_score', v_ai_risk_score,
            'authenticity_score', v_authenticity_score,
            'max_severity', v_max_severity
        ),
        v_matched_words
    );
    
    -- ========== 6. 返回结果 ==========
    RETURN QUERY SELECT 
        NOT v_should_reject,
        CASE 
            WHEN v_should_reject THEN 'reject'
            WHEN v_should_flag THEN 'flag'
            ELSE 'approve'
        END,
        CASE 
            WHEN v_reason = '' THEN NULL 
            ELSE v_reason 
        END,
        v_matched_words,
        jsonb_build_object(
            'spam_score', v_spam_score,
            'ai_risk_score', v_ai_risk_score,
            'authenticity_score', v_authenticity_score,
            'max_severity', v_max_severity
        );
END;
$$;


ALTER FUNCTION public.moderate_content(p_content_id uuid, p_content_type text, p_title text, p_description text, p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION moderate_content(p_content_id uuid, p_content_type text, p_title text, p_description text, p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.moderate_content(p_content_id uuid, p_content_type text, p_title text, p_description text, p_user_id uuid) IS '自动审核内容，返回审核结果';


--
-- Name: notify_ranking_participants(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.notify_ranking_participants(p_event_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_event_title text;
    v_participant RECORD;
    v_notification_count int := 0;
BEGIN
    -- 获取活动标题
    SELECT title INTO v_event_title
    FROM public.events
    WHERE id = p_event_id;
    
    IF v_event_title IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '活动不存在'
        );
    END IF;
    
    -- 为每个参与者创建通知
    FOR v_participant IN
        SELECT DISTINCT es.user_id
        FROM public.event_submissions es
        WHERE es.event_id = p_event_id
    LOOP
        -- 插入通知记录（使用新的表结构，包含跳转链接）
        INSERT INTO public.notifications (
            user_id,
            type,
            title,
            content,
            priority,
            link,
            is_read,
            created_at
        ) VALUES (
            v_participant.user_id,
            'ranking_published',
            '活动结果公布',
            format('您参与的 "%s" 活动结果已公布，快去看看吧！', v_event_title),
            'high',
            format('/activities/%s?showRanking=true', p_event_id),
            false,
            now()
        );
        
        v_notification_count := v_notification_count + 1;
    END LOOP;
    
    -- 更新发布记录
    UPDATE public.final_ranking_publishes
    SET 
        notification_sent = true,
        notification_sent_at = now()
    WHERE event_id = p_event_id
    AND notification_sent = false;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', format('已通知 %s 位参与者', v_notification_count),
        'notification_count', v_notification_count
    );
END;
$$;


ALTER FUNCTION public.notify_ranking_participants(p_event_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION notify_ranking_participants(p_event_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.notify_ranking_participants(p_event_id uuid) IS '通知所有参与者排名已发布';


--
-- Name: on_creator_earning_insert_sync(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.on_creator_earning_insert_sync() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_existing_revenue RECORD;
BEGIN
    -- 只在 task_reward 类型时触发
    IF NEW.source_type = 'task_reward' THEN
        -- 创建收入明细记录
        INSERT INTO public.revenue_records (
            user_id,
            amount,
            type,
            description,
            status,
            created_at
        ) VALUES (
            NEW.creator_id,
            NEW.amount,
            'task',
            '品牌任务奖励',
            CASE NEW.status
                WHEN 'paid' THEN 'completed'
                ELSE 'pending'
            END,
            NEW.created_at
        );

        -- 更新或创建 creator_revenue
        SELECT * INTO v_existing_revenue
        FROM public.creator_revenue
        WHERE user_id = NEW.creator_id;

        IF v_existing_revenue IS NOT NULL THEN
            UPDATE public.creator_revenue
            SET 
                total_revenue = total_revenue + NEW.amount,
                monthly_revenue = CASE 
                    WHEN created_at >= DATE_TRUNC('month', NOW()) THEN monthly_revenue + NEW.amount
                    ELSE monthly_revenue
                END,
                pending_revenue = CASE 
                    WHEN NEW.status IN ('pending', 'approved') THEN pending_revenue + NEW.amount
                    ELSE pending_revenue
                END,
                updated_at = NOW()
            WHERE user_id = NEW.creator_id;
        ELSE
            INSERT INTO public.creator_revenue (
                user_id,
                total_revenue,
                monthly_revenue,
                pending_revenue,
                withdrawable_revenue,
                total_withdrawn,
                last_month_revenue,
                created_at,
                updated_at
            ) VALUES (
                NEW.creator_id,
                NEW.amount,
                NEW.amount,
                CASE WHEN NEW.status IN ('pending', 'approved') THEN NEW.amount ELSE 0 END,
                CASE WHEN NEW.status = 'approved' THEN NEW.amount ELSE 0 END,
                0,
                0,
                NOW(),
                NOW()
            );
        END IF;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.on_creator_earning_insert_sync() OWNER TO postgres;

--
-- Name: on_submission_change_sync_participant(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.on_submission_change_sync_participant() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_total_earnings DECIMAL := 0;
    v_pending_earnings DECIMAL := 0;
    v_approved_works INTEGER := 0;
    v_submitted_works INTEGER := 0;
    v_withdrawn_earnings DECIMAL := 0;
BEGIN
    -- 只在状态变为 approved 或 final_reward 更新时触发
    IF (TG_OP = 'UPDATE' AND (
        (NEW.status = 'approved' AND OLD.status != 'approved') OR
        (NEW.final_reward IS DISTINCT FROM OLD.final_reward)
    )) OR (TG_OP = 'INSERT' AND NEW.status = 'approved') THEN
        
        -- 获取参与者当前的提现金额
        SELECT withdrawn_earnings INTO v_withdrawn_earnings
        FROM public.brand_task_participants
        WHERE id = NEW.participant_id;

        -- 重新计算该参与者的统计数据
        SELECT 
            COALESCE(SUM(s.final_reward), 0),
            COUNT(s.id),
            COUNT(s.id)
        INTO 
            v_total_earnings,
            v_approved_works,
            v_submitted_works
        FROM public.brand_task_submissions s
        WHERE s.participant_id = NEW.participant_id
          AND s.status = 'approved'
          AND s.final_reward IS NOT NULL;

        v_pending_earnings := v_total_earnings - COALESCE(v_withdrawn_earnings, 0);

        -- 更新参与者统计
        UPDATE public.brand_task_participants
        SET 
            total_earnings = v_total_earnings,
            pending_earnings = v_pending_earnings,
            approved_works = v_approved_works,
            submitted_works = v_submitted_works
        WHERE id = NEW.participant_id;

        RAISE NOTICE 'Synced participant %: total_earnings=%, approved_works=%', 
            NEW.participant_id, v_total_earnings, v_approved_works;
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.on_submission_change_sync_participant() OWNER TO postgres;

--
-- Name: on_task_completed_add_revenue(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.on_task_completed_add_revenue() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_task_budget DECIMAL;
BEGIN
    -- 只在状态变为 completed 时触发
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        -- 获取任务预算
        SELECT budget_max INTO v_task_budget
        FROM public.business_tasks
        WHERE id = NEW.task_id;
        
        -- 添加收入记录
        PERFORM public.add_revenue_record(
            NEW.creator_id,
            COALESCE(v_task_budget, 0),
            'task',
            '完成任务奖励',
            NULL
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.on_task_completed_add_revenue() OWNER TO postgres;

--
-- Name: on_work_view_add_revenue(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.on_work_view_add_revenue() RETURNS trigger
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_ad_revenue DECIMAL := 0.01; -- 每次浏览0.01元
BEGIN
    -- 每100次浏览产生一次收入记录（避免记录过多）
    IF NEW.view_count % 100 = 0 THEN
        PERFORM public.add_revenue_record(
            NEW.creator_id,
            v_ad_revenue * 100,
            'ads',
            '作品浏览广告分成',
            NEW.id
        );
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.on_work_view_add_revenue() OWNER TO postgres;

--
-- Name: pay_promotion_order(uuid, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.pay_promotion_order(p_order_id uuid, p_payment_method text, p_transaction_id text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_order RECORD;
BEGIN
    SELECT * INTO v_order FROM public.promotion_orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RETURN false;
    END IF;
    IF v_order.status != 'pending' THEN
        RETURN false;
    END IF;

    UPDATE public.promotion_orders
    SET status = 'paid', payment_method = p_payment_method,
        payment_time = NOW(), transaction_id = p_transaction_id, updated_at = NOW()
    WHERE id = p_order_id;

    RETURN true;
END;
$$;


ALTER FUNCTION public.pay_promotion_order(p_order_id uuid, p_payment_method text, p_transaction_id text) OWNER TO postgres;

--
-- Name: publish_final_ranking(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.publish_final_ranking(p_event_id uuid, p_published_by uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_event_title text;
    v_event_status text;
    v_ranking_data jsonb;
    v_published_count int := 0;
    v_already_published boolean;
BEGIN
    -- 检查活动是否存在
    SELECT title, status, final_ranking_published 
    INTO v_event_title, v_event_status, v_already_published
    FROM public.events
    WHERE id = p_event_id;
    
    IF v_event_title IS NULL THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '活动不存在'
        );
    END IF;
    
    -- 检查是否已经发布过最终排名
    IF v_already_published THEN
        RETURN jsonb_build_object(
            'success', false,
            'error', '该活动的最终排名已经发布过，不能重复发布'
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
    
    -- 更新活动表：标记为已发布排名，并将状态设为 completed
    UPDATE public.events
    SET 
        final_ranking_published = true,
        final_ranking_published_at = now(),
        final_ranking_published_by = p_published_by,
        final_ranking_data = v_ranking_data,
        status = 'completed'  -- 发布后自动结束活动
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


ALTER FUNCTION public.publish_final_ranking(p_event_id uuid, p_published_by uuid) OWNER TO postgres;

--
-- Name: FUNCTION publish_final_ranking(p_event_id uuid, p_published_by uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.publish_final_ranking(p_event_id uuid, p_published_by uuid) IS '发布活动的最终排名，限制每个活动只能发布一次，发布后自动结束活动';


--
-- Name: publish_score(uuid, boolean, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.publish_score(p_submission_id uuid, p_publish boolean, p_published_by uuid) RETURNS jsonb
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


ALTER FUNCTION public.publish_score(p_submission_id uuid, p_publish boolean, p_published_by uuid) OWNER TO postgres;

--
-- Name: record_membership_history(uuid, character varying, character varying, character varying, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.record_membership_history(p_user_id uuid, p_action_type character varying, p_from_level character varying DEFAULT NULL::character varying, p_to_level character varying DEFAULT NULL::character varying, p_order_id text DEFAULT NULL::text, p_notes text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_history_id UUID;
BEGIN
    INSERT INTO membership_history (
        user_id, 
        action_type, 
        from_level, 
        to_level, 
        order_id, 
        notes
    ) VALUES (
        p_user_id, 
        p_action_type, 
        p_from_level, 
        p_to_level, 
        p_order_id, 
        p_notes
    )
    RETURNING id INTO v_history_id;
    
    RETURN v_history_id;
END;
$$;


ALTER FUNCTION public.record_membership_history(p_user_id uuid, p_action_type character varying, p_from_level character varying, p_to_level character varying, p_order_id text, p_notes text) OWNER TO postgres;

--
-- Name: record_promotion_click(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.record_promotion_click(p_promoted_work_id uuid, p_viewer_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_order_id UUID;
BEGIN
  -- 调试日志
  RAISE NOTICE 'record_promotion_click called: work_id=%, viewer_id=%', p_promoted_work_id, p_viewer_id;

  -- 检查推广作品是否存在且活跃
  IF NOT EXISTS (
    SELECT 1 FROM promoted_works
    WHERE id = p_promoted_work_id
      AND status = 'active'
      AND end_time > NOW()
  ) THEN
    RAISE NOTICE 'Work not found or not active for click: id=%', p_promoted_work_id;
    RETURN FALSE;
  END IF;

  -- 获取订单ID
  SELECT order_id INTO v_order_id FROM promoted_works WHERE id = p_promoted_work_id;

  -- 更新推广作品的点击统计
  UPDATE promoted_works
  SET
    actual_clicks = COALESCE(actual_clicks, 0) + 1,
    daily_clicks = COALESCE(daily_clicks, 0) + 1,
    updated_at = NOW()
  WHERE id = p_promoted_work_id;

  RAISE NOTICE 'Updated promoted_works actual_clicks for id=%', p_promoted_work_id;

  -- 更新订单的实际点击
  UPDATE promotion_orders
  SET actual_clicks = COALESCE(actual_clicks, 0) + 1
  WHERE id = v_order_id;

  RAISE NOTICE 'Updated promotion_orders actual_clicks for order_id=%', v_order_id;

  -- 记录点击日志
  INSERT INTO promotion_click_logs (
    promoted_work_id,
    viewer_id,
    clicked_at,
    click_type
  ) VALUES (
    p_promoted_work_id,
    p_viewer_id,
    NOW(),
    'square'
  );

  RAISE NOTICE 'Inserted promotion_click_logs record';

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '记录推广点击失败: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION public.record_promotion_click(p_promoted_work_id uuid, p_viewer_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION record_promotion_click(p_promoted_work_id uuid, p_viewer_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.record_promotion_click(p_promoted_work_id uuid, p_viewer_id uuid) IS '记录推广作品点击（带调试日志）';


--
-- Name: record_promotion_view(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.record_promotion_view(p_promoted_work_id uuid, p_viewer_id uuid DEFAULT NULL::uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_work_exists BOOLEAN;
  v_work_status TEXT;
  v_end_time TIMESTAMPTZ;
BEGIN
  -- 调试日志
  RAISE NOTICE 'record_promotion_view called: work_id=%, viewer_id=%', p_promoted_work_id, p_viewer_id;

  -- 检查推广作品是否存在
  SELECT EXISTS(SELECT 1 FROM promoted_works WHERE id = p_promoted_work_id),
         status,
         end_time
  INTO v_work_exists, v_work_status, v_end_time
  FROM promoted_works
  WHERE id = p_promoted_work_id;

  RAISE NOTICE 'Work exists: %, Status: %, End time: %', v_work_exists, v_work_status, v_end_time;

  -- 检查推广作品是否存在且活跃
  IF NOT EXISTS (
    SELECT 1 FROM promoted_works
    WHERE id = p_promoted_work_id
      AND status = 'active'
      AND end_time > NOW()
  ) THEN
    RAISE NOTICE 'Work not found or not active: id=%', p_promoted_work_id;
    RETURN FALSE;
  END IF;

  -- 更新推广作品的曝光统计
  UPDATE promoted_works
  SET
    actual_views = COALESCE(actual_views, 0) + 1,
    daily_views = COALESCE(daily_views, 0) + 1,
    updated_at = NOW()
  WHERE id = p_promoted_work_id;

  RAISE NOTICE 'Updated promoted_works actual_views for id=%', p_promoted_work_id;

  -- 更新订单的实际曝光
  UPDATE promotion_orders
  SET actual_views = COALESCE(actual_views, 0) + 1
  WHERE id = (
    SELECT order_id FROM promoted_works WHERE id = p_promoted_work_id
  );

  RAISE NOTICE 'Updated promotion_orders actual_views';

  -- 记录曝光日志
  INSERT INTO promotion_view_logs (
    promoted_work_id,
    viewer_id,
    viewed_at,
    view_type
  ) VALUES (
    p_promoted_work_id,
    p_viewer_id,
    NOW(),
    'square'
  );

  RAISE NOTICE 'Inserted promotion_view_logs record';

  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE WARNING '记录推广曝光失败: %, SQLSTATE: %', SQLERRM, SQLSTATE;
    RETURN FALSE;
END;
$$;


ALTER FUNCTION public.record_promotion_view(p_promoted_work_id uuid, p_viewer_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION record_promotion_view(p_promoted_work_id uuid, p_viewer_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.record_promotion_view(p_promoted_work_id uuid, p_viewer_id uuid) IS '记录推广作品曝光（带调试日志）';


--
-- Name: record_search_history(uuid, text, character varying, integer, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.record_search_history(p_user_id uuid, p_query text, p_search_type character varying DEFAULT 'general'::character varying, p_result_count integer DEFAULT 0, p_filters jsonb DEFAULT '{}'::jsonb) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_history_id UUID;
BEGIN
    INSERT INTO user_search_history (
        user_id, query, search_type, result_count, search_filters
    ) VALUES (
        p_user_id, p_query, p_search_type, p_result_count, p_filters
    )
    RETURNING id INTO v_history_id;
    
    -- 更新或插入热门搜索
    INSERT INTO hot_searches (query, search_count, last_searched_at)
    VALUES (p_query, 1, NOW())
    ON CONFLICT (query) DO UPDATE SET
        search_count = hot_searches.search_count + 1,
        last_searched_at = NOW();
    
    RETURN v_history_id;
END;
$$;


ALTER FUNCTION public.record_search_history(p_user_id uuid, p_query text, p_search_type character varying, p_result_count integer, p_filters jsonb) OWNER TO postgres;

--
-- Name: register_for_event_transaction(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.register_for_event_transaction(p_event_id uuid, p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_event_status TEXT;
    v_current INTEGER;
    v_max INTEGER;
    v_registration_id UUID;
BEGIN
    -- Lock the event row for update to prevent race conditions
    SELECT status, participants, max_participants 
    INTO v_event_status, v_current, v_max
    FROM public.events 
    WHERE id = p_event_id 
    FOR UPDATE;
    
    -- Check if event exists
    IF v_event_status IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event not found');
    END IF;
    
    -- Check if event is published
    IF v_event_status != 'published' THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event is not open for registration');
    END IF;
    
    -- Check if user is already registered
    IF EXISTS (
        SELECT 1 FROM public.event_participants 
        WHERE event_id = p_event_id AND user_id = p_user_id
    ) THEN
        RETURN jsonb_build_object('success', false, 'error', 'User already registered');
    END IF;
    
    -- Check if event is full
    IF v_max IS NOT NULL AND v_current >= v_max THEN
        RETURN jsonb_build_object('success', false, 'error', 'Event is full');
    END IF;
    
    -- Create registration
    INSERT INTO public.event_participants (event_id, user_id, status)
    VALUES (p_event_id, p_user_id, 'registered')
    RETURNING id INTO v_registration_id;
    
    -- Increment participant count
    UPDATE public.events 
    SET participants = participants + 1,
        updated_at = NOW()
    WHERE id = p_event_id;
    
    RETURN jsonb_build_object('success', true, 'registration_id', v_registration_id);
END;
$$;


ALTER FUNCTION public.register_for_event_transaction(p_event_id uuid, p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION register_for_event_transaction(p_event_id uuid, p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.register_for_event_transaction(p_event_id uuid, p_user_id uuid) IS 'Registers a user for an event with transaction safety';


--
-- Name: rls_auto_enable(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.rls_auto_enable() RETURNS event_trigger
    LANGUAGE plpgsql SECURITY DEFINER
    SET search_path TO 'pg_catalog'
    AS $$
DECLARE
  cmd record;
BEGIN
  FOR cmd IN
    SELECT *
    FROM pg_event_trigger_ddl_commands()
    WHERE command_tag IN ('CREATE TABLE', 'CREATE TABLE AS', 'SELECT INTO')
      AND object_type IN ('table','partitioned table')
  LOOP
     IF cmd.schema_name IS NOT NULL AND cmd.schema_name IN ('public') AND cmd.schema_name NOT IN ('pg_catalog','information_schema') AND cmd.schema_name NOT LIKE 'pg_toast%' AND cmd.schema_name NOT LIKE 'pg_temp%' THEN
      BEGIN
        EXECUTE format('alter table if exists %s enable row level security', cmd.object_identity);
        RAISE LOG 'rls_auto_enable: enabled RLS on %', cmd.object_identity;
      EXCEPTION
        WHEN OTHERS THEN
          RAISE LOG 'rls_auto_enable: failed to enable RLS on %', cmd.object_identity;
      END;
     ELSE
        RAISE LOG 'rls_auto_enable: skip % (either system schema or not in enforced list: %.)', cmd.object_identity, cmd.schema_name;
     END IF;
  END LOOP;
END;
$$;


ALTER FUNCTION public.rls_auto_enable() OWNER TO postgres;

--
-- Name: save_ai_review(uuid, text, text, text, text, text, integer, jsonb, jsonb, jsonb, jsonb, text[], text[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.save_ai_review(p_work_id uuid, p_work_type text, p_work_title text, p_work_description text, p_work_thumbnail text, p_prompt text, p_overall_score integer, p_cultural_fit jsonb, p_creativity jsonb, p_aesthetics jsonb, p_commercial_potential jsonb, p_highlights text[], p_suggestions text[]) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_review_id UUID;
BEGIN
    INSERT INTO public.ai_reviews (
        user_id, work_id, work_type, work_title, work_description,
        work_thumbnail, prompt, overall_score,
        cultural_fit_score, creativity_score, aesthetics_score, commercial_potential_score,
        cultural_fit, creativity, aesthetics, commercial_potential,
        highlights, suggestions
    ) VALUES (
        auth.uid(), p_work_id, p_work_type, p_work_title, p_work_description,
        p_work_thumbnail, p_prompt, p_overall_score,
        (p_cultural_fit->>'score')::INTEGER,
        (p_creativity->>'score')::INTEGER,
        (p_aesthetics->>'score')::INTEGER,
        (p_commercial_potential->>'score')::INTEGER,
        p_cultural_fit, p_creativity, p_aesthetics, p_commercial_potential,
        p_highlights, p_suggestions
    )
    RETURNING id INTO v_review_id;
    
    RETURN v_review_id;
END;
$$;


ALTER FUNCTION public.save_ai_review(p_work_id uuid, p_work_type text, p_work_title text, p_work_description text, p_work_thumbnail text, p_prompt text, p_overall_score integer, p_cultural_fit jsonb, p_creativity jsonb, p_aesthetics jsonb, p_commercial_potential jsonb, p_highlights text[], p_suggestions text[]) OWNER TO postgres;

--
-- Name: save_ai_review(uuid, text, text, text, integer, integer, integer, integer, integer, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, jsonb, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.save_ai_review(p_user_id uuid, p_work_id text, p_prompt text, p_ai_explanation text, p_overall_score integer, p_cultural_fit_score integer, p_creativity_score integer, p_aesthetics_score integer, p_commercial_potential_score integer, p_cultural_fit_details jsonb, p_creativity_details jsonb, p_aesthetics_details jsonb, p_suggestions jsonb, p_highlights jsonb, p_commercial_analysis jsonb, p_recommended_commercial_paths jsonb, p_related_activities jsonb, p_similar_works jsonb, p_work_thumbnail text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_review_id UUID;
BEGIN
    INSERT INTO ai_reviews (
        user_id,
        work_id,
        prompt,
        ai_explanation,
        overall_score,
        cultural_fit_score,
        creativity_score,
        aesthetics_score,
        commercial_potential_score,
        cultural_fit_details,
        creativity_details,
        aesthetics_details,
        suggestions,
        highlights,
        commercial_analysis,
        recommended_commercial_paths,
        related_activities,
        similar_works,
        work_thumbnail
    ) VALUES (
        p_user_id,
        p_work_id,
        p_prompt,
        p_ai_explanation,
        p_overall_score,
        p_cultural_fit_score,
        p_creativity_score,
        p_aesthetics_score,
        p_commercial_potential_score,
        p_cultural_fit_details,
        p_creativity_details,
        p_aesthetics_details,
        p_suggestions,
        p_highlights,
        p_commercial_analysis,
        p_recommended_commercial_paths,
        p_related_activities,
        p_similar_works,
        p_work_thumbnail
    )
    ON CONFLICT (user_id, work_id)
    DO UPDATE SET
        prompt = EXCLUDED.prompt,
        ai_explanation = EXCLUDED.ai_explanation,
        overall_score = EXCLUDED.overall_score,
        cultural_fit_score = EXCLUDED.cultural_fit_score,
        creativity_score = EXCLUDED.creativity_score,
        aesthetics_score = EXCLUDED.aesthetics_score,
        commercial_potential_score = EXCLUDED.commercial_potential_score,
        cultural_fit_details = EXCLUDED.cultural_fit_details,
        creativity_details = EXCLUDED.creativity_details,
        aesthetics_details = EXCLUDED.aesthetics_details,
        suggestions = EXCLUDED.suggestions,
        highlights = EXCLUDED.highlights,
        commercial_analysis = EXCLUDED.commercial_analysis,
        recommended_commercial_paths = EXCLUDED.recommended_commercial_paths,
        related_activities = EXCLUDED.related_activities,
        similar_works = EXCLUDED.similar_works,
        work_thumbnail = EXCLUDED.work_thumbnail,
        updated_at = NOW()
    RETURNING id INTO v_review_id;
    
    RETURN v_review_id;
END;
$$;


ALTER FUNCTION public.save_ai_review(p_user_id uuid, p_work_id text, p_prompt text, p_ai_explanation text, p_overall_score integer, p_cultural_fit_score integer, p_creativity_score integer, p_aesthetics_score integer, p_commercial_potential_score integer, p_cultural_fit_details jsonb, p_creativity_details jsonb, p_aesthetics_details jsonb, p_suggestions jsonb, p_highlights jsonb, p_commercial_analysis jsonb, p_recommended_commercial_paths jsonb, p_related_activities jsonb, p_similar_works jsonb, p_work_thumbnail text) OWNER TO postgres;

--
-- Name: search_platform_knowledge(text, text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.search_platform_knowledge(p_query text, p_category text DEFAULT NULL::text, p_limit integer DEFAULT 5) RETURNS TABLE(id uuid, category text, question text, answer text, related_pages text[], steps jsonb, similarity double precision)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- 更新使用计数
    UPDATE ai_platform_knowledge
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id IN (
        SELECT k.id
        FROM ai_platform_knowledge k
        WHERE k.is_active = true
        AND (p_category IS NULL OR k.category = p_category)
        AND (
            k.question ILIKE '%' || p_query || '%'
            OR k.answer ILIKE '%' || p_query || '%'
            OR EXISTS (
                SELECT 1 FROM unnest(k.keywords) kw
                WHERE kw ILIKE '%' || p_query || '%'
            )
        )
        ORDER BY k.priority DESC, k.usage_count DESC
        LIMIT p_limit
    );

    RETURN QUERY
    SELECT 
        k.id,
        k.category,
        k.question,
        k.answer,
        k.related_pages,
        k.steps,
        CASE 
            WHEN k.question ILIKE '%' || p_query || '%' THEN 1.0
            WHEN EXISTS (
                SELECT 1 FROM unnest(k.keywords) kw
                WHERE kw ILIKE '%' || p_query || '%'
            ) THEN 0.8
            ELSE 0.5
        END::FLOAT as similarity
    FROM ai_platform_knowledge k
    WHERE k.is_active = true
    AND (p_category IS NULL OR k.category = p_category)
    AND (
        k.question ILIKE '%' || p_query || '%'
        OR k.answer ILIKE '%' || p_query || '%'
        OR EXISTS (
            SELECT 1 FROM unnest(k.keywords) kw
            WHERE kw ILIKE '%' || p_query || '%'
        )
    )
    ORDER BY similarity DESC, k.priority DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION public.search_platform_knowledge(p_query text, p_category text, p_limit integer) OWNER TO postgres;

--
-- Name: send_direct_message(uuid, uuid, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.send_direct_message(p_sender_id uuid, p_receiver_id uuid, p_content text, p_type text DEFAULT 'text'::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    message_id UUID;
BEGIN
    INSERT INTO public.direct_messages (sender_id, receiver_id, content, type)
    VALUES (p_sender_id, p_receiver_id, p_content, p_type)
    RETURNING id INTO message_id;
    
    -- 同时创建一条通知
    PERFORM public.send_notification(
        p_receiver_id,
        'private_message',
        '新私信',
        (SELECT username FROM public.users WHERE id = p_sender_id) || ' 给你发送了一条消息',
        p_sender_id,
        jsonb_build_object('message_id', message_id),
        '/messages'
    );
    
    RETURN message_id;
END;
$$;


ALTER FUNCTION public.send_direct_message(p_sender_id uuid, p_receiver_id uuid, p_content text, p_type text) OWNER TO postgres;

--
-- Name: send_notification(uuid, text, text, text, uuid, jsonb, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.send_notification(p_user_id uuid, p_type text, p_title text, p_content text, p_sender_id uuid DEFAULT NULL::uuid, p_data jsonb DEFAULT '{}'::jsonb, p_link text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO public.notifications (user_id, sender_id, type, title, content, data, link)
    VALUES (p_user_id, p_sender_id, p_type, p_title, p_content, p_data, p_link)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;


ALTER FUNCTION public.send_notification(p_user_id uuid, p_type text, p_title text, p_content text, p_sender_id uuid, p_data jsonb, p_link text) OWNER TO postgres;

--
-- Name: send_promotion_notification(uuid, text, text, text, uuid, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.send_promotion_notification(p_user_id uuid, p_type text, p_title text, p_content text, p_related_id uuid DEFAULT NULL::uuid, p_related_type text DEFAULT NULL::text) RETURNS uuid
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_notification_id UUID;
BEGIN
    INSERT INTO public.promotion_notifications (
        user_id, type, title, content, related_id, related_type
    ) VALUES (
        p_user_id, p_type, p_title, p_content, p_related_id, p_related_type
    )
    RETURNING id INTO v_notification_id;
    RETURN v_notification_id;
END;
$$;


ALTER FUNCTION public.send_promotion_notification(p_user_id uuid, p_type text, p_title text, p_content text, p_related_id uuid, p_related_type text) OWNER TO postgres;

--
-- Name: send_user_notification(uuid, character varying, character varying, text, uuid, character varying); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.send_user_notification(p_user_id uuid, p_type character varying, p_title character varying, p_content text, p_related_id uuid DEFAULT NULL::uuid, p_related_type character varying DEFAULT NULL::character varying) RETURNS uuid
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    notification_id UUID;
BEGIN
    INSERT INTO user_notifications (user_id, type, title, content, related_id, related_type)
    VALUES (p_user_id, p_type, p_title, p_content, p_related_id, p_related_type)
    RETURNING id INTO notification_id;
    
    RETURN notification_id;
END;
$$;


ALTER FUNCTION public.send_user_notification(p_user_id uuid, p_type character varying, p_title character varying, p_content text, p_related_id uuid, p_related_type character varying) OWNER TO postgres;

--
-- Name: set_exchange_records_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_exchange_records_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_exchange_records_updated_at() OWNER TO postgres;

--
-- Name: set_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.set_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_updated_at() OWNER TO postgres;

--
-- Name: simulate_promotion_exposure(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.simulate_promotion_exposure() RETURNS TABLE(work_id uuid, work_title text, views_added integer, clicks_added integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_work RECORD;
  v_views INTEGER;
  v_clicks INTEGER;
  v_ctr DECIMAL(5,2);
BEGIN
  -- 遍历所有活跃状态的推广作品
  FOR v_work IN 
    SELECT pw.id, pw.order_id, pw.actual_views, pw.actual_clicks, pw.target_views
    FROM promoted_works pw
    WHERE pw.status = 'active'
    AND pw.end_time > NOW()
  LOOP
    -- 根据目标曝光量计算每次增加的曝光数（模拟不同速度）
    -- 基础曝光：每小时 50-150 次
    v_views := FLOOR(50 + RANDOM() * 100)::INTEGER;
    
    -- 点击率通常在 1%-5% 之间
    v_ctr := 1.0 + RANDOM() * 4.0;
    v_clicks := GREATEST(1, ROUND(v_views * v_ctr / 100))::INTEGER;
    
    -- 检查是否会超过目标曝光量
    IF v_work.actual_views + v_views > v_work.target_views THEN
      v_views := GREATEST(0, v_work.target_views - v_work.actual_views);
      v_clicks := GREATEST(0, ROUND(v_views * v_ctr / 100))::INTEGER;
    END IF;
    
    -- 更新曝光量
    IF v_views > 0 THEN
      UPDATE promoted_works
      SET 
        actual_views = actual_views + v_views,
        actual_clicks = actual_clicks + v_clicks,
        updated_at = NOW(),
        -- 如果达到目标，自动完成
        status = CASE 
          WHEN actual_views + v_views >= target_views THEN 'completed'::promotion_status
          ELSE status
        END,
        end_time = CASE 
          WHEN actual_views + v_views >= target_views THEN NOW()
          ELSE end_time
        END
      WHERE id = v_work.id;
      
      -- 同时更新订单表的统计数据
      UPDATE promotion_orders
      SET 
        actual_views = COALESCE(actual_views, 0) + v_views,
        actual_clicks = COALESCE(actual_clicks, 0) + v_clicks
      WHERE id = v_work.order_id;
      
      -- 返回结果
      work_id := v_work.id;
      views_added := v_views;
      clicks_added := v_clicks;
      
      -- 尝试获取作品标题
      SELECT work_title INTO work_title
      FROM promotion_orders
      WHERE id = v_work.order_id;
      
      RETURN NEXT;
    END IF;
  END LOOP;
  
  RETURN;
END;
$$;


ALTER FUNCTION public.simulate_promotion_exposure() OWNER TO postgres;

--
-- Name: FUNCTION simulate_promotion_exposure(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.simulate_promotion_exposure() IS '模拟推广曝光，为所有活跃推广自动增加曝光和点击';


--
-- Name: spend_points(uuid, integer, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.spend_points(p_user_id uuid, p_points integer, p_source text, p_description text) RETURNS TABLE(success boolean, new_balance integer, message text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- 获取当前积分
    SELECT balance INTO v_balance
    FROM user_points_balance
    WHERE user_id = p_user_id;

    -- 检查积分是否足够
    IF v_balance IS NULL OR v_balance < p_points THEN
        RETURN QUERY SELECT false, COALESCE(v_balance, 0), '积分不足'::TEXT;
        RETURN;
    END IF;

    -- 扣除积分
    UPDATE user_points_balance
    SET balance = balance - p_points,
        total_spent = total_spent + p_points,
        last_updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_new_balance;

    -- 记录积分变动
    INSERT INTO points_records (
        user_id,
        points,
        type,
        source,
        source_type,
        description,
        balance_after,
        related_id,
        created_at
    ) VALUES (
        p_user_id,
        -p_points,
        'spent',
        p_source,
        'exchange',
        p_description,
        v_new_balance,
        NULL,
        NOW()
    );

    RETURN QUERY SELECT true, v_new_balance, '扣除成功'::TEXT;
END;
$$;


ALTER FUNCTION public.spend_points(p_user_id uuid, p_points integer, p_source text, p_description text) OWNER TO postgres;

--
-- Name: FUNCTION spend_points(p_user_id uuid, p_points integer, p_source text, p_description text); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.spend_points(p_user_id uuid, p_points integer, p_source text, p_description text) IS '扣除用户积分并记录交易';


--
-- Name: submit_event_for_review(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.submit_event_for_review(p_event_id uuid, p_organizer_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION public.submit_event_for_review(p_event_id uuid, p_organizer_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION submit_event_for_review(p_event_id uuid, p_organizer_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.submit_event_for_review(p_event_id uuid, p_organizer_id uuid) IS '主办方提交活动进行审核';


--
-- Name: submit_event_work(uuid, uuid, uuid, text, text, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.submit_event_work(p_event_id uuid, p_user_id uuid, p_participation_id uuid, p_title text, p_description text, p_files jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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

    -- 创建提交记录（使用 bigint 时间戳格式）
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

    -- 更新参与记录（使用 bigint 时间戳格式）
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


ALTER FUNCTION public.submit_event_work(p_event_id uuid, p_user_id uuid, p_participation_id uuid, p_title text, p_description text, p_files jsonb) OWNER TO postgres;

--
-- Name: submit_like(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.submit_like(p_submission_id uuid, p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_exists BOOLEAN;
    v_action TEXT;
BEGIN
    -- 检查点赞是否存在
    SELECT EXISTS(
        SELECT 1 FROM public.submission_likes 
        WHERE submission_id = p_submission_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- 取消点赞
        DELETE FROM public.submission_likes 
        WHERE submission_id = p_submission_id AND user_id = p_user_id;
        
        -- 更新点赞计数
        UPDATE public.event_submissions 
        SET like_count = GREATEST(0, like_count - 1)
        WHERE id = p_submission_id;
        
        v_action := 'removed';
    ELSE
        -- 添加点赞
        INSERT INTO public.submission_likes (submission_id, user_id)
        VALUES (p_submission_id, p_user_id);
        
        -- 更新点赞计数
        UPDATE public.event_submissions 
        SET like_count = like_count + 1
        WHERE id = p_submission_id;
        
        v_action := 'added';
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'action', v_action,
        'message', CASE WHEN v_action = 'added' THEN '点赞成功' ELSE '取消点赞成功' END
    );
END;
$$;


ALTER FUNCTION public.submit_like(p_submission_id uuid, p_user_id uuid) OWNER TO postgres;

--
-- Name: submit_rating(text, integer, uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.submit_rating(p_comment text, p_rating integer, p_submission_id uuid, p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
      DECLARE
        v_result JSONB;
        v_existing_rating_id UUID;
      BEGIN
        -- 检查用户是否已经评分过
        SELECT id INTO v_existing_rating_id
        FROM public.submission_ratings
        WHERE submission_id = p_submission_id AND user_id = p_user_id;

        IF v_existing_rating_id IS NOT NULL THEN
          -- 更新现有评分
          UPDATE public.submission_ratings
          SET 
            rating = p_rating,
            comment = p_comment,
            updated_at = NOW()
          WHERE id = v_existing_rating_id;
          
          v_result := jsonb_build_object(
            'success', true,
            'message', '评分已更新',
            'rating_id', v_existing_rating_id,
            'is_update', true
          );
        ELSE
          -- 创建新评分
          INSERT INTO public.submission_ratings (
            submission_id,
            user_id,
            rating,
            comment,
            created_at,
            updated_at
          ) VALUES (
            p_submission_id,
            p_user_id,
            p_rating,
            p_comment,
            NOW(),
            NOW()
          )
          RETURNING id INTO v_existing_rating_id;
          
          v_result := jsonb_build_object(
            'success', true,
            'message', '评分已提交',
            'rating_id', v_existing_rating_id,
            'is_update', false
          );
        END IF;

        -- 更新作品的平均评分和评分数量
        UPDATE public.event_submissions
        SET 
          avg_rating = (
            SELECT AVG(rating)::NUMERIC(3,2)
            FROM public.submission_ratings
            WHERE submission_id = p_submission_id
          ),
          rating_count = (
            SELECT COUNT(*)
            FROM public.submission_ratings
            WHERE submission_id = p_submission_id
          )
        WHERE id = p_submission_id;

        RETURN v_result;
      END;
      $$;


ALTER FUNCTION public.submit_rating(p_comment text, p_rating integer, p_submission_id uuid, p_user_id uuid) OWNER TO postgres;

--
-- Name: submit_rating(uuid, uuid, integer, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.submit_rating(p_submission_id uuid, p_user_id uuid, p_rating integer, p_comment text DEFAULT NULL::text) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_exists BOOLEAN;
    v_old_rating INTEGER;
    v_new_avg DECIMAL(3,2);
    v_new_count INTEGER;
BEGIN
    -- 验证评分范围
    IF p_rating < 1 OR p_rating > 5 THEN
        RETURN jsonb_build_object('success', false, 'message', '评分必须在1-5之间');
    END IF;
    
    -- 检查评分是否存在
    SELECT EXISTS(
        SELECT 1 FROM public.submission_ratings 
        WHERE submission_id = p_submission_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- 更新评分
        UPDATE public.submission_ratings 
        SET rating = p_rating, comment = p_comment, updated_at = NOW()
        WHERE submission_id = p_submission_id AND user_id = p_user_id;
    ELSE
        -- 添加评分
        INSERT INTO public.submission_ratings (submission_id, user_id, rating, comment)
        VALUES (p_submission_id, p_user_id, p_rating, p_comment);
    END IF;
    
    -- 重新计算平均评分
    SELECT 
        AVG(rating)::DECIMAL(3,2),
        COUNT(*)::INTEGER
    INTO v_new_avg, v_new_count
    FROM public.submission_ratings 
    WHERE submission_id = p_submission_id;
    
    -- 更新作品的评分信息
    UPDATE public.event_submissions 
    SET 
        avg_rating = v_new_avg,
        rating_count = v_new_count
    WHERE id = p_submission_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'message', '评分成功'
    );
END;
$$;


ALTER FUNCTION public.submit_rating(p_submission_id uuid, p_user_id uuid, p_rating integer, p_comment text) OWNER TO postgres;

--
-- Name: submit_score(uuid, uuid, numeric, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.submit_score(p_submission_id uuid, p_judge_id uuid, p_score numeric, p_comment text DEFAULT NULL::text) RETURNS jsonb
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


ALTER FUNCTION public.submit_score(p_submission_id uuid, p_judge_id uuid, p_score numeric, p_comment text) OWNER TO postgres;

--
-- Name: submit_vote(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.submit_vote(p_submission_id uuid, p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_exists BOOLEAN;
    v_action TEXT;
BEGIN
    -- 检查投票是否存在
    SELECT EXISTS(
        SELECT 1 FROM public.submission_votes 
        WHERE submission_id = p_submission_id AND user_id = p_user_id
    ) INTO v_exists;
    
    IF v_exists THEN
        -- 取消投票
        DELETE FROM public.submission_votes 
        WHERE submission_id = p_submission_id AND user_id = p_user_id;
        
        -- 更新投票计数
        UPDATE public.event_submissions 
        SET vote_count = GREATEST(0, vote_count - 1)
        WHERE id = p_submission_id;
        
        v_action := 'removed';
    ELSE
        -- 添加投票
        INSERT INTO public.submission_votes (submission_id, user_id)
        VALUES (p_submission_id, p_user_id);
        
        -- 更新投票计数
        UPDATE public.event_submissions 
        SET vote_count = vote_count + 1
        WHERE id = p_submission_id;
        
        v_action := 'added';
    END IF;
    
    RETURN jsonb_build_object(
        'success', true,
        'action', v_action,
        'message', CASE WHEN v_action = 'added' THEN '投票成功' ELSE '取消投票成功' END
    );
END;
$$;


ALTER FUNCTION public.submit_vote(p_submission_id uuid, p_user_id uuid) OWNER TO postgres;

--
-- Name: submit_work_from_ai_writer(uuid, uuid, uuid, text, text, text, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.submit_work_from_ai_writer(p_event_id uuid, p_user_id uuid, p_participation_id uuid, p_title text, p_description text, p_ai_writer_content text, p_ai_writer_history_id uuid, p_files jsonb DEFAULT '[]'::jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_submission_id UUID;
    v_event_type TEXT;
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

    -- 获取活动类型
    SELECT event_type INTO v_event_type
    FROM public.events
    WHERE id = p_event_id;

    -- 创建提交记录（使用 bigint 时间戳格式）
    INSERT INTO public.event_submissions (
        event_id, user_id, participation_id, title, description, files,
        status, submitted_at, submission_type,
        ai_writer_content, ai_writer_history_id, is_from_ai_writer,
        created_at, updated_at
    ) VALUES (
        p_event_id, p_user_id, p_participation_id, p_title, p_description, p_files,
        'submitted', v_now_bigint, COALESCE(v_event_type, 'document'),
        p_ai_writer_content, p_ai_writer_history_id, TRUE,
        v_now_bigint, v_now_bigint
    )
    ON CONFLICT (event_id, user_id)
    DO UPDATE SET
        title = EXCLUDED.title,
        description = EXCLUDED.description,
        files = EXCLUDED.files,
        status = 'submitted',
        submitted_at = v_now_bigint,
        submission_type = EXCLUDED.submission_type,
        ai_writer_content = EXCLUDED.ai_writer_content,
        ai_writer_history_id = EXCLUDED.ai_writer_history_id,
        is_from_ai_writer = TRUE,
        updated_at = v_now_bigint
    RETURNING id INTO v_submission_id;

    -- 更新参与记录（使用 bigint 时间戳格式）
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


ALTER FUNCTION public.submit_work_from_ai_writer(p_event_id uuid, p_user_id uuid, p_participation_id uuid, p_title text, p_description text, p_ai_writer_content text, p_ai_writer_history_id uuid, p_files jsonb) OWNER TO postgres;

--
-- Name: switch_user_conversation(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.switch_user_conversation(p_user_id uuid, p_conversation_id uuid) RETURNS TABLE(id uuid, user_id uuid, title text, model_id text, created_at timestamp with time zone, updated_at timestamp with time zone, is_active boolean, context_summary text, message_count integer, metadata jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- 先将用户的所有对话设为非活跃
    UPDATE ai_conversations
    SET is_active = false
    WHERE ai_conversations.user_id = p_user_id;

    -- 将目标对话设为活跃
    UPDATE ai_conversations
    SET is_active = true
    WHERE ai_conversations.id = p_conversation_id
    AND ai_conversations.user_id = p_user_id;

    -- 返回更新后的对话
    RETURN QUERY
    SELECT 
        c.id,
        c.user_id,
        c.title,
        c.model_id,
        c.created_at,
        c.updated_at,
        c.is_active,
        c.context_summary,
        c.message_count,
        c.metadata
    FROM ai_conversations c
    WHERE c.id = p_conversation_id
    AND c.user_id = p_user_id;
END;
$$;


ALTER FUNCTION public.switch_user_conversation(p_user_id uuid, p_conversation_id uuid) OWNER TO postgres;

--
-- Name: sync_all_submissions_to_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_all_submissions_to_stats() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- 插入所有现有提交作品的统计记录
    INSERT INTO public.work_performance_stats (
        submission_id,
        event_id,
        view_count,
        like_count,
        comment_count,
        share_count,
        avg_score,
        score_count,
        last_updated
    )
    SELECT 
        es.id,
        es.event_id,
        0, -- view_count 默认为0，后续可以通过其他方式统计
        COALESCE(es.like_count, 0),
        0, -- comment_count
        COALESCE(es.vote_count, 0),
        COALESCE(es.score, 0),
        CASE WHEN es.score IS NOT NULL THEN 1 ELSE 0 END,
        NOW()
    FROM public.event_submissions es
    ON CONFLICT (submission_id) 
    DO UPDATE SET
        event_id = EXCLUDED.event_id,
        like_count = EXCLUDED.like_count,
        share_count = EXCLUDED.share_count,
        avg_score = EXCLUDED.avg_score,
        score_count = EXCLUDED.score_count,
        last_updated = NOW();
    
    -- 更新评分数据
    UPDATE public.work_performance_stats wps
    SET 
        avg_score = COALESCE((
            SELECT AVG(rating)::DECIMAL(5,2)
            FROM public.submission_ratings sr
            WHERE sr.submission_id = wps.submission_id
        ), 0),
        score_count = COALESCE((
            SELECT COUNT(*)
            FROM public.submission_ratings sr
            WHERE sr.submission_id = wps.submission_id
        ), 0)
    WHERE EXISTS (
        SELECT 1 FROM public.submission_ratings sr 
        WHERE sr.submission_id = wps.submission_id
    );
    
END;
$$;


ALTER FUNCTION public.sync_all_submissions_to_stats() OWNER TO postgres;

--
-- Name: FUNCTION sync_all_submissions_to_stats(); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sync_all_submissions_to_stats() IS '同步所有提交作品到性能统计表';


--
-- Name: sync_brand_task_to_creator_revenue(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_brand_task_to_creator_revenue() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_earning RECORD;
    v_existing_revenue RECORD;
    v_total_reward DECIMAL := 0;
    v_user_id UUID;
BEGIN
    -- 遍历所有品牌任务收益记录
    FOR v_earning IN 
        SELECT 
            ce.creator_id,
            ce.amount,
            ce.task_id,
            ce.created_at
        FROM public.creator_earnings ce
        WHERE ce.status IN ('pending', 'approved', 'paid')
          AND ce.source_type = 'task_reward'
    LOOP
        v_user_id := v_earning.creator_id;
        v_total_reward := v_earning.amount;

        -- 检查是否已存在对应的 revenue_records 记录
        IF NOT EXISTS (
            SELECT 1 FROM public.revenue_records 
            WHERE user_id = v_user_id
              AND amount = v_total_reward
              AND type = 'task'
              AND created_at::date = v_earning.created_at::date
        ) THEN
            -- 创建收入明细记录
            INSERT INTO public.revenue_records (
                user_id,
                amount,
                type,
                description,
                status,
                created_at
            ) VALUES (
                v_user_id,
                v_total_reward,
                'task',
                '品牌任务奖励',
                'completed',
                v_earning.created_at
            );
            
            RAISE NOTICE 'Created revenue record for user %, amount: %', 
                v_user_id, v_total_reward;
        END IF;
    END LOOP;

    -- 重新计算每个用户的 creator_revenue
    FOR v_user_id IN 
        SELECT DISTINCT creator_id 
        FROM public.creator_earnings
        WHERE status IN ('pending', 'approved', 'paid')
    LOOP
        -- 计算该用户的总收益
        SELECT COALESCE(SUM(amount), 0)
        INTO v_total_reward
        FROM public.creator_earnings
        WHERE creator_id = v_user_id
          AND status IN ('pending', 'approved', 'paid');

        -- 检查是否已有 creator_revenue 记录
        SELECT * INTO v_existing_revenue
        FROM public.creator_revenue
        WHERE user_id = v_user_id;

        IF v_existing_revenue IS NOT NULL THEN
            -- 更新现有记录
            UPDATE public.creator_revenue
            SET 
                total_revenue = v_total_reward,
                monthly_revenue = (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM public.creator_earnings
                    WHERE creator_id = v_user_id
                      AND status IN ('pending', 'approved', 'paid')
                      AND created_at >= DATE_TRUNC('month', NOW())
                ),
                pending_revenue = (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM public.creator_earnings
                    WHERE creator_id = v_user_id
                      AND status IN ('pending', 'approved')
                ),
                withdrawable_revenue = (
                    SELECT COALESCE(SUM(amount), 0)
                    FROM public.creator_earnings
                    WHERE creator_id = v_user_id
                      AND status = 'approved'
                ),
                updated_at = NOW()
            WHERE user_id = v_user_id;

            RAISE NOTICE 'Updated creator_revenue for user %: total_revenue=%', 
                v_user_id, v_total_reward;
        ELSE
            -- 创建新记录
            INSERT INTO public.creator_revenue (
                user_id,
                total_revenue,
                monthly_revenue,
                pending_revenue,
                withdrawable_revenue,
                total_withdrawn,
                last_month_revenue,
                created_at,
                updated_at
            ) VALUES (
                v_user_id,
                v_total_reward,
                v_total_reward, -- 本月收入（简化处理）
                v_total_reward, -- 待结算
                0,              -- 可提现（需要单独处理）
                0,
                0,
                NOW(),
                NOW()
            );

            RAISE NOTICE 'Created creator_revenue for user %: total_revenue=%', 
                v_user_id, v_total_reward;
        END IF;
    END LOOP;
END;
$$;


ALTER FUNCTION public.sync_brand_task_to_creator_revenue() OWNER TO postgres;

--
-- Name: sync_comment_to_performance_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_comment_to_performance_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.work_performance_stats
        SET comment_count = comment_count + 1,
            last_updated = NOW()
        WHERE submission_id = NEW.submission_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.work_performance_stats
        SET comment_count = GREATEST(comment_count - 1, 0),
            last_updated = NOW()
        WHERE submission_id = OLD.submission_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.sync_comment_to_performance_stats() OWNER TO postgres;

--
-- Name: sync_like_to_performance_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_like_to_performance_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        -- 更新 work_performance_stats 的 like_count
        UPDATE public.work_performance_stats
        SET like_count = like_count + 1,
            last_updated = NOW()
        WHERE submission_id = NEW.submission_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.work_performance_stats
        SET like_count = GREATEST(like_count - 1, 0),
            last_updated = NOW()
        WHERE submission_id = OLD.submission_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.sync_like_to_performance_stats() OWNER TO postgres;

--
-- Name: sync_participants_columns(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_participants_columns() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.participants := COALESCE(NEW.participants, 0);
        NEW.current_participants := NEW.participants;
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        IF NEW.participants IS DISTINCT FROM OLD.participants THEN
            NEW.current_participants := NEW.participants;
        ELSIF NEW.current_participants IS DISTINCT FROM OLD.current_participants THEN
            NEW.participants := NEW.current_participants;
        END IF;
        RETURN NEW;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.sync_participants_columns() OWNER TO postgres;

--
-- Name: sync_rating_to_performance_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_rating_to_performance_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_avg_score DECIMAL(5,2);
    v_score_count INTEGER;
BEGIN
    -- 计算新的平均分和评分数量
    SELECT AVG(rating)::DECIMAL(5,2), COUNT(*)
    INTO v_avg_score, v_score_count
    FROM public.submission_ratings
    WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id);
    
    UPDATE public.work_performance_stats
    SET avg_score = COALESCE(v_avg_score, 0),
        score_count = COALESCE(v_score_count, 0),
        last_updated = NOW()
    WHERE submission_id = COALESCE(NEW.submission_id, OLD.submission_id);
    
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$;


ALTER FUNCTION public.sync_rating_to_performance_stats() OWNER TO postgres;

--
-- Name: sync_submission_reward_to_participant(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_submission_reward_to_participant() RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_submission RECORD;
    v_participant RECORD;
    v_total_earnings DECIMAL := 0;
    v_approved_works INTEGER := 0;
BEGIN
    -- 遍历所有已审核通过且有奖励的提交记录
    FOR v_submission IN 
        SELECT 
            s.id,
            s.participant_id,
            s.creator_id,
            s.final_reward,
            s.task_id
        FROM public.brand_task_submissions s
        WHERE s.status = 'approved' 
          AND s.final_reward IS NOT NULL 
          AND s.final_reward > 0
          AND s.participant_id IS NOT NULL
    LOOP
        -- 检查是否已存在对应的收益记录
        IF NOT EXISTS (
            SELECT 1 FROM public.creator_earnings 
            WHERE submission_id = v_submission.id
        ) THEN
            -- 创建收益记录
            INSERT INTO public.creator_earnings (
                creator_id,
                task_id,
                submission_id,
                amount,
                status,
                source_type,
                created_at
            ) VALUES (
                v_submission.creator_id,
                v_submission.task_id,
                v_submission.id,
                v_submission.final_reward,
                'pending',
                'task_reward',
                NOW()
            );
            
            RAISE NOTICE 'Created earnings record for submission %, amount: %', 
                v_submission.id, v_submission.final_reward;
        END IF;
    END LOOP;

    -- 重新计算每个参与者的统计数据
    FOR v_participant IN 
        SELECT 
            p.id,
            p.creator_id,
            p.task_id
        FROM public.brand_task_participants p
    LOOP
        -- 计算该参与者的总收益和通过作品数
        SELECT 
            COALESCE(SUM(s.final_reward), 0),
            COUNT(s.id)
        INTO 
            v_total_earnings,
            v_approved_works
        FROM public.brand_task_submissions s
        WHERE s.participant_id = v_participant.id
          AND s.status = 'approved'
          AND s.final_reward IS NOT NULL;

        -- 更新参与者统计
        UPDATE public.brand_task_participants
        SET 
            total_earnings = v_total_earnings,
            pending_earnings = v_total_earnings - withdrawn_earnings,
            approved_works = v_approved_works,
            submitted_works = (
                SELECT COUNT(*) 
                FROM public.brand_task_submissions s 
                WHERE s.participant_id = v_participant.id
            )
        WHERE id = v_participant.id;

        RAISE NOTICE 'Updated participant %: total_earnings=%, approved_works=%', 
            v_participant.id, v_total_earnings, v_approved_works;
    END LOOP;
END;
$$;


ALTER FUNCTION public.sync_submission_reward_to_participant() OWNER TO postgres;

--
-- Name: sync_submission_to_performance_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_submission_to_performance_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- 插入或更新 work_performance_stats 记录
    INSERT INTO public.work_performance_stats (
        submission_id,
        event_id,
        view_count,
        like_count,
        comment_count,
        share_count,
        avg_score,
        score_count,
        last_updated
    ) VALUES (
        NEW.id,
        NEW.event_id,
        0,
        COALESCE(NEW.like_count, 0),
        0,
        COALESCE(NEW.vote_count, 0),
        COALESCE(NEW.score, 0),
        CASE WHEN NEW.score IS NOT NULL THEN 1 ELSE 0 END,
        NOW()
    )
    ON CONFLICT (submission_id) 
    DO UPDATE SET
        event_id = EXCLUDED.event_id,
        like_count = EXCLUDED.like_count,
        share_count = EXCLUDED.share_count,
        avg_score = EXCLUDED.avg_score,
        score_count = EXCLUDED.score_count,
        last_updated = NOW();
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.sync_submission_to_performance_stats() OWNER TO postgres;

--
-- Name: sync_user_data(uuid, text, jsonb, jsonb, inet); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_user_data(p_user_id uuid, p_sync_type text, p_sync_data jsonb DEFAULT '{}'::jsonb, p_device_info jsonb DEFAULT '{}'::jsonb, p_ip_address inet DEFAULT NULL::inet) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_sync_id UUID;
  v_updated_fields TEXT[];
  v_result JSONB;
BEGIN
  -- 记录同步日志
  INSERT INTO user_sync_logs (
    user_id,
    sync_type,
    sync_data,
    device_info,
    ip_address
  ) VALUES (
    p_user_id,
    p_sync_type,
    p_sync_data,
    p_device_info,
    p_ip_address
  ) RETURNING id INTO v_sync_id;

  -- 根据同步类型更新用户数据
  IF p_sync_type = 'profile_update' THEN
    -- 更新用户资料
    UPDATE users SET
      username = COALESCE((p_sync_data->>'username')::TEXT, username),
      bio = COALESCE((p_sync_data->>'bio')::TEXT, bio),
      location = COALESCE((p_sync_data->>'location')::TEXT, location),
      website = COALESCE((p_sync_data->>'website')::TEXT, website),
      updated_at = NOW()
    WHERE id = p_user_id;

    -- 提取更新的字段
    v_updated_fields := ARRAY['username', 'bio', 'location', 'website'];

  ELSIF p_sync_type = 'avatar_update' THEN
    -- 更新头像
    UPDATE users SET
      avatar_url = COALESCE((p_sync_data->>'avatar')::TEXT, avatar_url),
      updated_at = NOW()
    WHERE id = p_user_id;

    v_updated_fields := ARRAY['avatar_url'];

  ELSIF p_sync_type = 'settings_update' THEN
    -- 更新用户设置
    UPDATE users SET
      settings = COALESCE(p_sync_data->'settings', settings),
      updated_at = NOW()
    WHERE id = p_user_id;

    v_updated_fields := ARRAY['settings'];

  ELSIF p_sync_type = 'full_sync' THEN
    -- 完整同步：更新所有字段
    UPDATE users SET
      username = COALESCE((p_sync_data->>'username')::TEXT, username),
      bio = COALESCE((p_sync_data->>'bio')::TEXT, bio),
      location = COALESCE((p_sync_data->>'location')::TEXT, location),
      website = COALESCE((p_sync_data->>'website')::TEXT, website),
      avatar_url = COALESCE((p_sync_data->>'avatar')::TEXT, avatar_url),
      settings = COALESCE(p_sync_data->'settings', settings),
      updated_at = NOW()
    WHERE id = p_user_id;

    v_updated_fields := ARRAY['username', 'bio', 'location', 'website', 'avatar_url', 'settings'];
  END IF;

  -- 返回结果
  v_result := jsonb_build_object(
    'success', true,
    'sync_id', v_sync_id,
    'updated_fields', v_updated_fields,
    'synced_at', NOW()
  );

  RETURN v_result;
END;
$$;


ALTER FUNCTION public.sync_user_data(p_user_id uuid, p_sync_type text, p_sync_data jsonb, p_device_info jsonb, p_ip_address inet) OWNER TO postgres;

--
-- Name: FUNCTION sync_user_data(p_user_id uuid, p_sync_type text, p_sync_data jsonb, p_device_info jsonb, p_ip_address inet); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.sync_user_data(p_user_id uuid, p_sync_type text, p_sync_data jsonb, p_device_info jsonb, p_ip_address inet) IS '同步用户数据到数据库';


--
-- Name: sync_vote_to_performance_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.sync_vote_to_performance_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.work_performance_stats
        SET share_count = share_count + 1,
            last_updated = NOW()
        WHERE submission_id = NEW.submission_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.work_performance_stats
        SET share_count = GREATEST(share_count - 1, 0),
            last_updated = NOW()
        WHERE submission_id = OLD.submission_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.sync_vote_to_performance_stats() OWNER TO postgres;

--
-- Name: toggle_like_transaction(uuid, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.toggle_like_transaction(p_post_id uuid, p_user_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_exists BOOLEAN;
BEGIN
    -- Check if like exists
    SELECT EXISTS (SELECT 1 FROM public.likes WHERE post_id = p_post_id AND user_id = p_user_id) INTO v_exists;

    IF v_exists THEN
        -- Unlike
        DELETE FROM public.likes WHERE post_id = p_post_id AND user_id = p_user_id;
        -- Decrement count, preventing negative values
        UPDATE public.posts SET likes_count = GREATEST(0, COALESCE(likes_count, 0) - 1) WHERE id = p_post_id;
        RETURN FALSE;
    ELSE
        -- Like
        INSERT INTO public.likes (post_id, user_id) VALUES (p_post_id, p_user_id);
        -- Increment count
        UPDATE public.posts SET likes_count = COALESCE(likes_count, 0) + 1 WHERE id = p_post_id;
        RETURN TRUE;
    END IF;
END;
$$;


ALTER FUNCTION public.toggle_like_transaction(p_post_id uuid, p_user_id uuid) OWNER TO postgres;

--
-- Name: update_ai_reviews_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_ai_reviews_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_ai_reviews_updated_at() OWNER TO postgres;

--
-- Name: update_brand_ratings_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_brand_ratings_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_brand_ratings_timestamp() OWNER TO postgres;

--
-- Name: update_brand_wizard_drafts_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_brand_wizard_drafts_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_brand_wizard_drafts_updated_at() OWNER TO postgres;

--
-- Name: update_conversation_message_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_conversation_message_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE ai_conversations
        SET message_count = message_count + 1,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE ai_conversations
        SET message_count = message_count - 1,
            updated_at = NOW()
        WHERE id = OLD.conversation_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_conversation_message_count() OWNER TO postgres;

--
-- Name: update_creative_profile_on_behavior(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_creative_profile_on_behavior() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- 确保用户画像记录存在
    INSERT INTO public.user_creative_profiles (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 更新创作统计
    CASE NEW.behavior_type
        WHEN 'mindmap_create' THEN
            UPDATE public.user_creative_profiles 
            SET total_mindmaps = total_mindmaps + 1,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        WHEN 'node_create' THEN
            UPDATE public.user_creative_profiles 
            SET total_nodes = total_nodes + 1,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        WHEN 'ai_suggestion_request' THEN
            UPDATE public.user_creative_profiles 
            SET total_ai_suggestions = total_ai_suggestions + 1,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        WHEN 'story_generate' THEN
            UPDATE public.user_creative_profiles 
            SET total_stories = total_stories + 1,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        WHEN 'work_publish' THEN
            UPDATE public.user_creative_profiles 
            SET total_published_works = total_published_works + 1,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
    END CASE;
    
    -- 更新偏好类别
    IF NEW.metadata->>'category' IS NOT NULL THEN
        UPDATE public.user_creative_profiles 
        SET preferred_categories = array_append(preferred_categories, NEW.metadata->>'category')
        WHERE user_id = NEW.user_id
        AND NOT (preferred_categories @> ARRAY[NEW.metadata->>'category']);
    END IF;
    
    -- 更新偏好品牌
    IF NEW.behavior_type = 'brand_inspiration_use' AND NEW.metadata->>'brand_id' IS NOT NULL THEN
        UPDATE public.user_creative_profiles 
        SET preferred_brands = array_append(preferred_brands, NEW.metadata->>'brand_id')
        WHERE user_id = NEW.user_id
        AND NOT (preferred_brands @> ARRAY[NEW.metadata->>'brand_id']);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_creative_profile_on_behavior() OWNER TO postgres;

--
-- Name: update_cultural_knowledge_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_cultural_knowledge_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_cultural_knowledge_updated_at() OWNER TO postgres;

--
-- Name: update_daily_stats_on_behavior(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_daily_stats_on_behavior() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_stat_date DATE;
    v_exists BOOLEAN;
BEGIN
    v_stat_date := DATE(NEW.created_at);
    
    -- 检查是否已存在该日期的统计记录
    SELECT EXISTS(
        SELECT 1 FROM public.user_behavior_daily_stats 
        WHERE user_id = NEW.user_id AND stat_date = v_stat_date
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        -- 创建新的统计记录
        INSERT INTO public.user_behavior_daily_stats (user_id, stat_date)
        VALUES (NEW.user_id, v_stat_date);
    END IF;
    
    -- 更新对应的行为计数
    CASE NEW.behavior_type
        WHEN 'mindmap_create' THEN
            UPDATE public.user_behavior_daily_stats 
            SET mindmap_creates = mindmap_creates + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
        WHEN 'mindmap_edit' THEN
            UPDATE public.user_behavior_daily_stats 
            SET mindmap_edits = mindmap_edits + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
        WHEN 'node_create' THEN
            UPDATE public.user_behavior_daily_stats 
            SET node_creates = node_creates + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
        WHEN 'node_edit' THEN
            UPDATE public.user_behavior_daily_stats 
            SET node_edits = node_edits + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
        WHEN 'ai_suggestion_request' THEN
            UPDATE public.user_behavior_daily_stats 
            SET ai_suggestions = ai_suggestions + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
        WHEN 'story_generate' THEN
            UPDATE public.user_behavior_daily_stats 
            SET stories_generated = stories_generated + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
        WHEN 'work_publish' THEN
            UPDATE public.user_behavior_daily_stats 
            SET works_published = works_published + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
    END CASE;
    
    -- 如果使用了老字号品牌，添加到数组
    IF NEW.behavior_type = 'brand_inspiration_use' AND NEW.metadata->>'brand_id' IS NOT NULL THEN
        UPDATE public.user_behavior_daily_stats 
        SET brands_used = array_append(brands_used, NEW.metadata->>'brand_id')
        WHERE user_id = NEW.user_id AND stat_date = v_stat_date
        AND NOT (brands_used @> ARRAY[NEW.metadata->>'brand_id']);
    END IF;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_daily_stats_on_behavior() OWNER TO postgres;

--
-- Name: update_event_and_resubmit(uuid, uuid, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_event_and_resubmit(p_event_id uuid, p_organizer_id uuid, p_event_data jsonb) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
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
$$;


ALTER FUNCTION public.update_event_and_resubmit(p_event_id uuid, p_organizer_id uuid, p_event_data jsonb) OWNER TO postgres;

--
-- Name: FUNCTION update_event_and_resubmit(p_event_id uuid, p_organizer_id uuid, p_event_data jsonb); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.update_event_and_resubmit(p_event_id uuid, p_organizer_id uuid, p_event_data jsonb) IS '更新活动并重新提交审核，已发布或已拒绝的活动编辑后会变为待审核状态';


--
-- Name: update_event_daily_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_event_daily_stats(p_event_id uuid DEFAULT NULL::uuid) RETURNS void
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    -- 插入或更新每日统计
    INSERT INTO public.event_daily_stats (
        event_id,
        stat_date,
        submissions_count,
        views_count,
        likes_count,
        comments_count
    )
    SELECT 
        es.event_id,
        CURRENT_DATE,
        COUNT(DISTINCT es.id),
        0, -- views 需要单独统计
        COALESCE(SUM(es.like_count), 0),
        0  -- comments 需要单独统计
    FROM public.event_submissions es
    WHERE (p_event_id IS NULL OR es.event_id = p_event_id)
    AND DATE(es.created_at) = CURRENT_DATE
    GROUP BY es.event_id
    ON CONFLICT (event_id, stat_date) 
    DO UPDATE SET
        submissions_count = EXCLUDED.submissions_count,
        likes_count = EXCLUDED.likes_count,
        updated_at = NOW();
END;
$$;


ALTER FUNCTION public.update_event_daily_stats(p_event_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION update_event_daily_stats(p_event_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.update_event_daily_stats(p_event_id uuid) IS '更新事件每日统计数据';


--
-- Name: update_feed_collects_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_feed_collects_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- 注意：这里假设 feeds 表存在且有 collects_count 字段
  -- 如果 feeds 表不存在，需要创建或修改
  IF TG_OP = 'INSERT' THEN
    -- 更新动态的收藏数
    UPDATE public.feeds 
    SET collects_count = collects_count + 1 
    WHERE id = NEW.feed_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 更新动态的收藏数
    UPDATE public.feeds 
    SET collects_count = GREATEST(0, collects_count - 1) 
    WHERE id = OLD.feed_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_feed_collects_count() OWNER TO postgres;

--
-- Name: update_feed_comment_likes_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_feed_comment_likes_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feed_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feed_comments 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_feed_comment_likes_count() OWNER TO postgres;

--
-- Name: update_feed_likes_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_feed_likes_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  -- 注意：这里假设 feeds 表存在且有 likes_count 字段
  -- 如果 feeds 表不存在，需要创建或修改
  IF TG_OP = 'INSERT' THEN
    -- 更新动态的点赞数
    UPDATE public.feeds 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.feed_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    -- 更新动态的点赞数
    UPDATE public.feeds 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.feed_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_feed_likes_count() OWNER TO postgres;

--
-- Name: update_feeds_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_feeds_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_feeds_updated_at() OWNER TO postgres;

--
-- Name: update_generation_tasks_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_generation_tasks_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
begin
  new.updated_at = now();
  return new;
end;
$$;


ALTER FUNCTION public.update_generation_tasks_updated_at() OWNER TO postgres;

--
-- Name: update_home_recommendations_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_home_recommendations_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_home_recommendations_updated_at() OWNER TO postgres;

--
-- Name: update_hot_search_trend_score(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_hot_search_trend_score() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- 计算趋势分数：基于搜索次数、时间衰减（最近7天权重更高）
    NEW.trend_score := (
        NEW.search_count * 1.0 +
        (CASE 
            WHEN NEW.last_searched_at > NOW() - INTERVAL '1 day' THEN 50
            WHEN NEW.last_searched_at > NOW() - INTERVAL '7 days' THEN 20
            ELSE 0
        END)
    ) / (
        EXTRACT(EPOCH FROM (NOW() - NEW.created_at)) / 86400.0 + 1
    );
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_hot_search_trend_score() OWNER TO postgres;

--
-- Name: update_membership_usage_stats(uuid, integer, bigint, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE FUNCTION public.update_membership_usage_stats(p_user_id uuid, p_ai_generations integer DEFAULT 0, p_storage_bytes bigint DEFAULT 0, p_exports integer DEFAULT 0, p_api_calls integer DEFAULT 0) RETURNS void
    LANGUAGE plpgsql
    AS $$
BEGIN
    INSERT INTO membership_usage_stats (
        user_id, 
        stat_date, 
        ai_generations_count, 
        storage_used_bytes, 
        exports_count, 
        api_calls_count
    ) VALUES (
        p_user_id, 
        CURRENT_DATE, 
        p_ai_generations, 
        p_storage_bytes, 
        p_exports, 
        p_api_calls
    )
    ON CONFLICT (user_id, stat_date) DO UPDATE SET
        ai_generations_count = membership_usage_stats.ai_generations_count + p_ai_generations,
        storage_used_bytes = GREATEST(membership_usage_stats.storage_used_bytes, p_storage_bytes),
        exports_count = membership_usage_stats.exports_count + p_exports,
        api_calls_count = membership_usage_stats.api_calls_count + p_api_calls,
        updated_at = NOW();
END;
$$;