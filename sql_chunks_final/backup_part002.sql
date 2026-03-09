
--
-- Name: get_pending_promotion_applications_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_pending_promotion_applications_count() RETURNS integer
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count FROM public.promotion_applications WHERE status = 'pending';
    RETURN v_count;
END;
$$;


ALTER FUNCTION public.get_pending_promotion_applications_count() OWNER TO postgres;

--
-- Name: get_personalized_suggestions(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_personalized_suggestions(p_user_id uuid, p_query text, p_limit integer DEFAULT 10) RETURNS TABLE(id uuid, keyword text, category character varying, weight integer, is_hot boolean, relevance_score numeric)
    LANGUAGE plpgsql
    AS $$
BEGIN
    RETURN QUERY
    WITH user_preferences AS (
        SELECT preferred_categories, preferred_tags
        FROM user_search_preferences
        WHERE user_id = p_user_id
    ),
    user_history AS (
        SELECT query, COUNT(*) as search_count
        FROM user_search_history
        WHERE user_id = p_user_id
        AND created_at > NOW() - INTERVAL '30 days'
        GROUP BY query
    )
    SELECT 
        s.id,
        s.keyword,
        s.category,
        s.weight,
        s.is_hot,
        (
            s.weight * 1.0 +
            (CASE WHEN s.is_hot THEN 50 ELSE 0 END) +
            (CASE 
                WHEN s.category = ANY(SELECT preferred_categories FROM user_preferences) THEN 30
                ELSE 0
            END) +
            (CASE 
                WHEN s.keyword ILIKE '%' || p_query || '%' THEN 100
                ELSE 0
            END) +
            COALESCE((SELECT search_count FROM user_history WHERE query = s.keyword), 0) * 5
        )::DECIMAL as relevance_score
    FROM search_suggestions s
    WHERE s.is_active = true
    AND (s.keyword ILIKE '%' || p_query || '%' OR p_query = '')
    ORDER BY relevance_score DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION public.get_personalized_suggestions(p_user_id uuid, p_query text, p_limit integer) OWNER TO postgres;

--
-- Name: get_products(character varying, character varying, text, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_products(p_category character varying DEFAULT NULL::character varying, p_status character varying DEFAULT 'active'::character varying, p_search text DEFAULT NULL::text, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_total INTEGER;
    v_products JSONB;
BEGIN
    -- 获取总数
    SELECT COUNT(*) INTO v_total
    FROM public.products
    WHERE (p_status IS NULL OR status = p_status)
      AND (p_category IS NULL OR category = p_category)
      AND (p_search IS NULL OR 
           name ILIKE '%' || p_search || '%' OR 
           description ILIKE '%' || p_search || '%' OR
           EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE '%' || p_search || '%'));

    -- 获取商品列表
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', id,
            'name', name,
            'description', description,
            'points', points,
            'stock', stock,
            'status', status,
            'category', category,
            'tags', tags,
            'image_url', image_url,
            'is_featured', is_featured,
            'created_at', created_at
        ) ORDER BY sort_order ASC, created_at DESC
    ) INTO v_products
    FROM (
        SELECT *
        FROM public.products
        WHERE (p_status IS NULL OR status = p_status)
          AND (p_category IS NULL OR category = p_category)
          AND (p_search IS NULL OR 
               name ILIKE '%' || p_search || '%' OR 
               description ILIKE '%' || p_search || '%' OR
               EXISTS (SELECT 1 FROM unnest(tags) t WHERE t ILIKE '%' || p_search || '%'))
        ORDER BY sort_order ASC, created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) sub;

    RETURN jsonb_build_object(
        'total', v_total,
        'products', COALESCE(v_products, '[]'::JSONB),
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$;


ALTER FUNCTION public.get_products(p_category character varying, p_status character varying, p_search text, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_promotion_debug_info(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_promotion_debug_info(p_promoted_work_id uuid) RETURNS TABLE(work_id uuid, status text, end_time timestamp with time zone, is_active boolean, actual_views integer, actual_clicks integer)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    pw.id as work_id,
    pw.status,
    pw.end_time,
    (pw.status = 'active' AND pw.end_time > NOW()) as is_active,
    pw.actual_views,
    pw.actual_clicks
  FROM promoted_works pw
  WHERE pw.id = p_promoted_work_id;
END;
$$;


ALTER FUNCTION public.get_promotion_debug_info(p_promoted_work_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_promotion_debug_info(p_promoted_work_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_promotion_debug_info(p_promoted_work_id uuid) IS '获取推广作品调试信息';


--
-- Name: get_promotion_user_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_promotion_user_stats(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql
    AS $$
DECLARE
    v_stats JSONB;
BEGIN
    SELECT jsonb_build_object(
        'total_applications', COUNT(*),
        'pending_applications', COUNT(*) FILTER (WHERE status = 'pending'),
        'approved_applications', COUNT(*) FILTER (WHERE status = 'approved'),
        'rejected_applications', COUNT(*) FILTER (WHERE status = 'rejected'),
        'total_spent', COALESCE(SUM(total_spent), 0),
        'total_orders', COALESCE(SUM(total_orders), 0),
        'total_views', COALESCE(SUM(total_views), 0)
    )
    INTO v_stats
    FROM public.promotion_applications
    WHERE user_id = p_user_id;
    
    RETURN v_stats;
END;
$$;


ALTER FUNCTION public.get_promotion_user_stats(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_score_audit_logs(uuid, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_score_audit_logs(p_submission_id uuid DEFAULT NULL::uuid, p_limit integer DEFAULT 50) RETURNS jsonb
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


ALTER FUNCTION public.get_score_audit_logs(p_submission_id uuid, p_limit integer) OWNER TO postgres;

--
-- Name: get_square_works_with_promotion(integer, integer, uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_square_works_with_promotion(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0, p_user_id uuid DEFAULT NULL::uuid) RETURNS TABLE(id uuid, work_type text, title text, thumbnail text, video_url text, creator_id uuid, creator_username text, creator_avatar text, views integer, likes integer, comments integer, created_at timestamp with time zone, is_promoted boolean, promoted_work_id uuid, package_type text, promotion_weight numeric)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_promoted_count INTEGER;
  v_normal_limit INTEGER;
BEGIN
  -- 计算需要插入的推广作品数量（约20%，至少1个）
  v_promoted_count := GREATEST(1, ROUND(p_limit * 0.2));
  v_normal_limit := p_limit - v_promoted_count;

  -- 使用 UNION ALL 合并普通作品和推广作品，确保返回统一的结果集
  RETURN QUERY
  WITH normal_works AS (
    -- 普通作品
    SELECT
      w.id::UUID as id,
      'normal'::TEXT as work_type,
      w.title::TEXT as title,
      COALESCE(w.thumbnail, w.cover_url, '')::TEXT as thumbnail,
      COALESCE(w.video_url, '')::TEXT as video_url,
      w.creator_id::UUID as creator_id,
      u.username::TEXT as creator_username,
      u.avatar_url::TEXT as creator_avatar,
      COALESCE(w.views, 0)::INTEGER as views,
      COALESCE(w.likes, 0)::INTEGER as likes,
      COALESCE(w.comments, 0)::INTEGER as comments,
      to_timestamp(w.created_at::bigint / 1000.0)::TIMESTAMPTZ as created_at,
      FALSE as is_promoted,
      NULL::UUID as promoted_work_id,
      NULL::TEXT as package_type,
      NULL::DECIMAL as promotion_weight
    FROM works w
    LEFT JOIN users u ON w.creator_id = u.id
    WHERE w.status = 'published'
    ORDER BY w.created_at DESC
    LIMIT v_normal_limit
    OFFSET p_offset
  ),
  promoted_works_list AS (
    -- 推广作品
    SELECT
      pw.work_id::UUID as id,
      'promoted'::TEXT as work_type,
      po.work_title::TEXT as title,
      COALESCE(po.work_thumbnail, '')::TEXT as thumbnail,
      ''::TEXT as video_url,
      pw.user_id::UUID as creator_id,
      u.username::TEXT as creator_username,
      u.avatar_url::TEXT as creator_avatar,
      COALESCE(pw.actual_views, 0)::INTEGER as views,
      0::INTEGER as likes,
      0::INTEGER as comments,
      pw.created_at::TIMESTAMPTZ as created_at,
      TRUE as is_promoted,
      pw.id::UUID as promoted_work_id,
      pw.package_type::TEXT as package_type,
      pw.promotion_weight::DECIMAL(3,2) as promotion_weight
    FROM promoted_works pw
    JOIN promotion_orders po ON pw.order_id = po.id
    LEFT JOIN users u ON pw.user_id = u.id
    WHERE pw.status = 'active'
      AND pw.end_time > NOW()
      AND (p_user_id IS NULL OR pw.user_id != p_user_id)
    ORDER BY pw.promotion_weight DESC, pw.priority_score DESC
    LIMIT v_promoted_count
  )
  -- 合并结果：先推广作品，再普通作品
  SELECT * FROM promoted_works_list
  UNION ALL
  SELECT * FROM normal_works
  -- 最终排序：推广作品优先，然后按时间倒序
  ORDER BY 
    CASE WHEN is_promoted THEN 1 ELSE 0 END DESC,
    created_at DESC;
END;
$$;


ALTER FUNCTION public.get_square_works_with_promotion(p_limit integer, p_offset integer, p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_square_works_with_promotion(p_limit integer, p_offset integer, p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_square_works_with_promotion(p_limit integer, p_offset integer, p_user_id uuid) IS '获取广场作品列表，包含推广作品（使用UNION ALL修复版）';


--
-- Name: get_submission_score_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_submission_score_stats(p_submission_id uuid) RETURNS TABLE(avg_score numeric, max_score numeric, min_score numeric, score_count integer, judge_count integer)
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


ALTER FUNCTION public.get_submission_score_stats(p_submission_id uuid) OWNER TO postgres;

--
-- Name: get_submission_scores(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_submission_scores(p_submission_id uuid) RETURNS jsonb
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


ALTER FUNCTION public.get_submission_scores(p_submission_id uuid) OWNER TO postgres;

--
-- Name: get_template_favorite_count(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_template_favorite_count(template_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
BEGIN
    RETURN (SELECT COUNT(*) FROM template_favorites WHERE template_favorites.template_id = $1);
END;
$_$;


ALTER FUNCTION public.get_template_favorite_count(template_id integer) OWNER TO postgres;

--
-- Name: get_template_like_count(integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_template_like_count(template_id integer) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $_$
BEGIN
    RETURN (SELECT COUNT(*) FROM template_likes WHERE template_likes.template_id = $1);
END;
$_$;


ALTER FUNCTION public.get_template_like_count(template_id integer) OWNER TO postgres;

--
-- Name: get_unread_message_count(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_unread_message_count(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM public.direct_messages 
        WHERE receiver_id = p_user_id AND is_read = FALSE
    );
END;
$$;


ALTER FUNCTION public.get_unread_message_count(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_unread_notification_count(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_unread_notification_count(p_user_id uuid) RETURNS integer
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COUNT(*) 
        FROM public.notifications 
        WHERE user_id = p_user_id AND is_read = FALSE
    );
END;
$$;


ALTER FUNCTION public.get_unread_notification_count(p_user_id uuid) OWNER TO postgres;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: generation_tasks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE IF NOT EXISTS public.generation_tasks (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    type text NOT NULL,
    status text DEFAULT 'pending'::text NOT NULL,
    params jsonb DEFAULT '{}'::jsonb NOT NULL,
    progress integer DEFAULT 0,
    result jsonb,
    error text,
    error_type text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    started_at timestamp with time zone,
    completed_at timestamp with time zone,
    CONSTRAINT generation_tasks_error_type_check CHECK ((error_type = ANY (ARRAY['content_policy'::text, 'timeout'::text, 'auth'::text, 'general'::text, 'network'::text]))),
    CONSTRAINT generation_tasks_progress_check CHECK (((progress >= 0) AND (progress <= 100))),
    CONSTRAINT generation_tasks_status_check CHECK ((status = ANY (ARRAY['pending'::text, 'processing'::text, 'completed'::text, 'failed'::text, 'cancelled'::text]))),
    CONSTRAINT generation_tasks_type_check CHECK ((type = ANY (ARRAY['image'::text, 'video'::text])))
);


ALTER TABLE public.generation_tasks OWNER TO postgres;

--
-- Name: TABLE generation_tasks; Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON TABLE public.generation_tasks IS 'AI生成任务表，支持后台生成';


--
-- Name: get_user_active_generation_tasks(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_active_generation_tasks(p_user_id uuid) RETURNS SETOF public.generation_tasks
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  return query
  select *
  from generation_tasks
  where user_id = p_user_id
    and status in ('pending', 'processing')
  order by created_at desc;
end;
$$;


ALTER FUNCTION public.get_user_active_generation_tasks(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_user_ai_reviews(integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_ai_reviews(p_limit integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, work_id uuid, work_type text, work_title text, work_thumbnail text, overall_score integer, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.work_id,
        ar.work_type,
        ar.work_title,
        ar.work_thumbnail,
        ar.overall_score,
        ar.created_at
    FROM public.ai_reviews ar
    WHERE ar.user_id = auth.uid()
    ORDER BY ar.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION public.get_user_ai_reviews(p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_user_ai_reviews(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_ai_reviews(p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, work_id text, prompt text, overall_score integer, cultural_fit_score integer, creativity_score integer, aesthetics_score integer, commercial_potential_score integer, highlights jsonb, work_thumbnail text, created_at timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ar.id,
        ar.work_id,
        ar.prompt,
        ar.overall_score,
        ar.cultural_fit_score,
        ar.creativity_score,
        ar.aesthetics_score,
        ar.commercial_potential_score,
        ar.highlights,
        ar.work_thumbnail,
        ar.created_at
    FROM ai_reviews ar
    WHERE ar.user_id = p_user_id
    ORDER BY ar.created_at DESC
    LIMIT p_limit
    OFFSET p_offset;
END;
$$;


ALTER FUNCTION public.get_user_ai_reviews(p_user_id uuid, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_user_conversations(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid) RETURNS TABLE(user_id uuid, username text, avatar_url text, last_message text, last_message_time timestamp with time zone, unread_count bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    WITH conversations AS (
        SELECT 
            CASE 
                WHEN dm.sender_id = p_user_id THEN dm.receiver_id
                ELSE dm.sender_id
            END as other_user_id,
            dm.content,
            dm.created_at,
            CASE 
                WHEN dm.receiver_id = p_user_id AND NOT dm.is_read THEN 1
                ELSE 0
            END as is_unread
        FROM public.direct_messages dm
        WHERE dm.sender_id = p_user_id OR dm.receiver_id = p_user_id
    ),
    latest_messages AS (
        SELECT DISTINCT ON (other_user_id)
            other_user_id,
            content,
            created_at
        FROM conversations
        ORDER BY other_user_id, created_at DESC
    ),
    unread_counts AS (
        SELECT 
            other_user_id,
            SUM(is_unread) as unread
        FROM conversations
        GROUP BY other_user_id
    )
    SELECT 
        u.id,
        u.username,
        u.avatar_url,
        lm.content,
        lm.created_at,
        COALESCE(uc.unread, 0)::BIGINT
    FROM latest_messages lm
    JOIN public.users u ON u.id = lm.other_user_id
    LEFT JOIN unread_counts uc ON uc.other_user_id = lm.other_user_id
    ORDER BY lm.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_user_conversations(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_user_conversations(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_conversations(p_user_id uuid, p_limit integer DEFAULT 20, p_offset integer DEFAULT 0) RETURNS TABLE(id uuid, title text, model_id text, created_at timestamp with time zone, updated_at timestamp with time zone, is_active boolean, message_count integer, last_message text, last_message_time timestamp with time zone)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.model_id,
        c.created_at,
        c.updated_at,
        c.is_active,
        c.message_count,
        m.content as last_message,
        m.timestamp as last_message_time
    FROM ai_conversations c
    LEFT JOIN LATERAL (
        SELECT content, timestamp
        FROM ai_messages
        WHERE conversation_id = c.id
        ORDER BY timestamp DESC
        LIMIT 1
    ) m ON true
    WHERE c.user_id = p_user_id
    ORDER BY c.updated_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;


ALTER FUNCTION public.get_user_conversations(p_user_id uuid, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_user_events_simple(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_events_simple(p_user_id uuid) RETURNS TABLE(id uuid, title text, description text, organizer_id uuid, status text, created_at bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.description,
        e.organizer_id,
        e.status,
        e.created_at
    FROM public.events e
    WHERE e.organizer_id = p_user_id
    ORDER BY e.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_user_events_simple(p_user_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION get_user_events_simple(p_user_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.get_user_events_simple(p_user_id uuid) IS '获取指定用户的基本活动信息，绕过 RLS';


--
-- Name: get_user_exchange_records_with_products(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_exchange_records_with_products(p_user_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_total INTEGER;
    v_records JSONB;
BEGIN
    -- 获取总数
    SELECT COUNT(*) INTO v_total
    FROM public.exchange_records
    WHERE user_id = p_user_id;

    -- 获取记录列表
    SELECT jsonb_agg(
        jsonb_build_object(
            'id', er.id,
            'product_id', er.product_id,
            'product_name', er.product_name,
            'product_category', er.product_category,
            'points_cost', er.points_cost,
            'quantity', er.quantity,
            'status', er.status,
            'created_at', er.created_at,
            'product_image', p.image_url
        ) ORDER BY er.created_at DESC
    ) INTO v_records
    FROM (
        SELECT *
        FROM public.exchange_records
        WHERE user_id = p_user_id
        ORDER BY created_at DESC
        LIMIT p_limit OFFSET p_offset
    ) er
    LEFT JOIN public.products p ON p.id = er.product_id::UUID;

    RETURN jsonb_build_object(
        'total', v_total,
        'records', COALESCE(v_records, '[]'::JSONB),
        'limit', p_limit,
        'offset', p_offset
    );
END;
$$;


ALTER FUNCTION public.get_user_exchange_records_with_products(p_user_id uuid, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_user_generation_history(uuid, integer, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_generation_history(p_user_id uuid, p_limit integer DEFAULT 50, p_offset integer DEFAULT 0) RETURNS SETOF public.generation_tasks
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
begin
  return query
  select *
  from generation_tasks
  where user_id = p_user_id
    and status in ('completed', 'failed', 'cancelled')
  order by created_at desc
  limit p_limit
  offset p_offset;
end;
$$;


ALTER FUNCTION public.get_user_generation_history(p_user_id uuid, p_limit integer, p_offset integer) OWNER TO postgres;

--
-- Name: get_user_interactions(uuid, uuid[]); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_interactions(p_user_id uuid, p_submission_ids uuid[]) RETURNS jsonb[]
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN (
        SELECT COALESCE(jsonb_agg(
            jsonb_build_object(
                'submission_id', sr.submission_id,
                'has_voted', EXISTS(
                    SELECT 1 FROM public.submission_votes 
                    WHERE submission_id = sr.submission_id AND user_id = p_user_id
                ),
                'has_liked', EXISTS(
                    SELECT 1 FROM public.submission_likes 
                    WHERE submission_id = sr.submission_id AND user_id = p_user_id
                ),
                'user_rating', (
                    SELECT rating FROM public.submission_ratings 
                    WHERE submission_id = sr.submission_id AND user_id = p_user_id
                )
            )
        ), '[]')
        FROM (
            SELECT DISTINCT unnest(p_submission_ids) as submission_id
        ) sr
    );
END;
$$;


ALTER FUNCTION public.get_user_interactions(p_user_id uuid, p_submission_ids uuid[]) OWNER TO postgres;

--
-- Name: get_user_ip_assets(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_ip_assets(p_user_id uuid) RETURNS TABLE(id uuid, user_id uuid, name character varying, description text, type character varying, original_work_id uuid, commercial_value integer, thumbnail text, status character varying, created_at timestamp with time zone, updated_at timestamp with time zone, stages jsonb)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        a.id,
        a.user_id,
        a.name,
        a.description,
        a.type,
        a.original_work_id,
        a.commercial_value,
        a.thumbnail,
        a.status,
        a.created_at,
        a.updated_at,
        COALESCE(
            (SELECT jsonb_agg(
                jsonb_build_object(
                    'id', s.id,
                    'name', s.name,
                    'description', s.description,
                    'order_index', s.order_index,
                    'completed', s.completed,
                    'completed_at', s.completed_at,
                    'created_at', s.created_at,
                    'updated_at', s.updated_at
                ) ORDER BY s.order_index
            )
            FROM ip_stages s
            WHERE s.ip_asset_id = a.id
            ), '[]'::jsonb
        ) as stages
    FROM ip_assets a
    WHERE a.user_id = p_user_id 
      AND a.status = 'active'
    ORDER BY a.created_at DESC;
END;
$$;


ALTER FUNCTION public.get_user_ip_assets(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_user_ip_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_ip_stats(p_user_id uuid) RETURNS TABLE(total_assets bigint, completed_assets bigint, in_progress_assets bigint, total_partnerships bigint, active_partnerships bigint, total_estimated_value bigint)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(s.total_assets, 0)::BIGINT,
        COALESCE(s.completed_assets, 0)::BIGINT,
        COALESCE(s.in_progress_assets, 0)::BIGINT,
        COALESCE(p.total_partnerships, 0)::BIGINT,
        COALESCE(p.active_partnerships, 0)::BIGINT,
        COALESCE(s.total_estimated_value, 0)::BIGINT
    FROM 
        (SELECT 
            COUNT(*) as total_assets,
            COUNT(*) FILTER (WHERE NOT EXISTS (
                SELECT 1 FROM ip_stages 
                WHERE ip_stages.ip_asset_id = ip_assets.id 
                AND ip_stages.completed = FALSE
            )) as completed_assets,
            COUNT(*) FILTER (WHERE EXISTS (
                SELECT 1 FROM ip_stages 
                WHERE ip_stages.ip_asset_id = ip_assets.id 
                AND ip_stages.completed = FALSE
            )) as in_progress_assets,
            SUM(commercial_value) as total_estimated_value
        FROM ip_assets 
        WHERE user_id = p_user_id AND status = 'active') s
    CROSS JOIN
        (SELECT 
            COUNT(*) as total_partnerships,
            COUNT(*) FILTER (WHERE status IN ('pending', 'negotiating')) as active_partnerships
        FROM ip_partnerships 
        WHERE user_id = p_user_id) p;
END;
$$;


ALTER FUNCTION public.get_user_ip_stats(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_user_memories(uuid, text, integer); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_memories(p_user_id uuid, p_memory_type text DEFAULT NULL::text, p_limit integer DEFAULT 10) RETURNS TABLE(id uuid, memory_type text, content text, importance integer, created_at timestamp with time zone, source_conversation_id uuid)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.memory_type,
        m.content,
        m.importance,
        m.created_at,
        m.source_conversation_id
    FROM ai_user_memories m
    WHERE m.user_id = p_user_id
    AND m.is_active = true
    AND (p_memory_type IS NULL OR m.memory_type = p_memory_type)
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    ORDER BY m.importance DESC, m.updated_at DESC
    LIMIT p_limit;
END;
$$;


ALTER FUNCTION public.get_user_memories(p_user_id uuid, p_memory_type text, p_limit integer) OWNER TO postgres;

--
-- Name: get_user_participation_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_participation_stats(p_user_id uuid) RETURNS jsonb
    LANGUAGE plpgsql SECURITY DEFINER
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


ALTER FUNCTION public.get_user_participation_stats(p_user_id uuid) OWNER TO postgres;

--
-- Name: get_user_points_stats(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.get_user_points_stats(p_user_id uuid) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.get_user_preferences(p_user_id uuid) RETURNS TABLE(tag text, weight numeric)
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

CREATE OR REPLACE FUNCTION public.get_user_sync_status(p_user_id uuid) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.get_works_for_scoring(p_event_id uuid DEFAULT NULL::uuid, p_status text DEFAULT 'all'::text, p_score_status text DEFAULT 'all'::text, p_search_query text DEFAULT NULL::text, p_sort_by text DEFAULT 'submitted_at'::text, p_sort_order text DEFAULT 'desc'::text, p_page integer DEFAULT 1, p_limit integer DEFAULT 20) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.has_feedback_manage_permission(p_user_id uuid) RETURNS boolean
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

CREATE OR REPLACE FUNCTION public.increment_click_count(p_execution_id uuid) RETURNS void
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

CREATE OR REPLACE FUNCTION public.increment_conversion(p_execution_id uuid, p_sale_amount numeric, p_earnings numeric) RETURNS void
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

CREATE OR REPLACE FUNCTION public.increment_invite_count(p_user_id text) RETURNS void
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

CREATE OR REPLACE FUNCTION public.increment_promotion_clicks(p_work_id uuid, p_click_count integer DEFAULT 1) RETURNS boolean
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

CREATE OR REPLACE FUNCTION public.increment_promotion_views(p_work_id uuid, p_view_count integer DEFAULT 1) RETURNS boolean
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

CREATE OR REPLACE FUNCTION public.increment_recommendation_click(p_item_id uuid) RETURNS void
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

CREATE OR REPLACE FUNCTION public.increment_recommendation_impression(p_item_id uuid, p_count integer DEFAULT 1) RETURNS void
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

CREATE OR REPLACE FUNCTION public.increment_work_view_count(work_id uuid) RETURNS integer
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

CREATE OR REPLACE FUNCTION public.initialize_user_points_balance() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.is_active_admin(p_user_id uuid) RETURNS boolean
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

CREATE OR REPLACE FUNCTION public.is_super_admin(p_user_id uuid, required_permission text) RETURNS boolean
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

CREATE OR REPLACE FUNCTION public.log_audit_event() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.log_comment_activity() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.log_feedback_process(p_feedback_id uuid, p_admin_id uuid, p_action character varying, p_old_value text DEFAULT NULL::text, p_new_value text DEFAULT NULL::text, p_details jsonb DEFAULT NULL::jsonb) RETURNS uuid
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

CREATE OR REPLACE FUNCTION public.log_like_activity() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.log_post_activity() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.log_promotion_audit(p_application_id uuid, p_user_id uuid, p_action text, p_previous_status text, p_new_status text, p_notes text, p_reason text, p_performed_by uuid, p_changes jsonb DEFAULT '{}'::jsonb) RETURNS uuid
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

CREATE OR REPLACE FUNCTION public.mark_ai_feedback_as_read(p_feedback_id uuid, p_admin_id uuid DEFAULT NULL::uuid) RETURNS boolean
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

CREATE OR REPLACE FUNCTION public.moderate_content(p_content_id uuid, p_content_type text, p_title text, p_description text, p_user_id uuid DEFAULT NULL::uuid) RETURNS TABLE(approved boolean, action text, reason text, matched_words text[], scores jsonb)
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

CREATE OR REPLACE FUNCTION public.notify_ranking_participants(p_event_id uuid) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.on_creator_earning_insert_sync() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.on_submission_change_sync_participant() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.on_task_completed_add_revenue() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.on_work_view_add_revenue() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.pay_promotion_order(p_order_id uuid, p_payment_method text, p_transaction_id text DEFAULT NULL::text) RETURNS boolean
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

CREATE OR REPLACE FUNCTION public.publish_final_ranking(p_event_id uuid, p_published_by uuid) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.publish_score(p_submission_id uuid, p_publish boolean, p_published_by uuid) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.record_membership_history(p_user_id uuid, p_action_type character varying, p_from_level character varying DEFAULT NULL::character varying, p_to_level character varying DEFAULT NULL::character varying, p_order_id text DEFAULT NULL::text, p_notes text DEFAULT NULL::text) RETURNS uuid
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

CREATE OR REPLACE FUNCTION public.record_promotion_click(p_promoted_work_id uuid, p_viewer_id uuid DEFAULT NULL::uuid) RETURNS boolean
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

CREATE OR REPLACE FUNCTION public.record_promotion_view(p_promoted_work_id uuid, p_viewer_id uuid DEFAULT NULL::uuid) RETURNS boolean
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

CREATE OR REPLACE FUNCTION public.record_search_history(p_user_id uuid, p_query text, p_search_type character varying DEFAULT 'general'::character varying, p_result_count integer DEFAULT 0, p_filters jsonb DEFAULT '{}'::jsonb) RETURNS uuid
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

CREATE OR REPLACE FUNCTION public.register_for_event_transaction(p_event_id uuid, p_user_id uuid) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.rls_auto_enable() RETURNS event_trigger
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

CREATE OR REPLACE FUNCTION public.save_ai_review(p_work_id uuid, p_work_type text, p_work_title text, p_work_description text, p_work_thumbnail text, p_prompt text, p_overall_score integer, p_cultural_fit jsonb, p_creativity jsonb, p_aesthetics jsonb, p_commercial_potential jsonb, p_highlights text[], p_suggestions text[]) RETURNS uuid
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

CREATE OR REPLACE FUNCTION public.save_ai_review(p_user_id uuid, p_work_id text, p_prompt text, p_ai_explanation text, p_overall_score integer, p_cultural_fit_score integer, p_creativity_score integer, p_aesthetics_score integer, p_commercial_potential_score integer, p_cultural_fit_details jsonb, p_creativity_details jsonb, p_aesthetics_details jsonb, p_suggestions jsonb, p_highlights jsonb, p_commercial_analysis jsonb, p_recommended_commercial_paths jsonb, p_related_activities jsonb, p_similar_works jsonb, p_work_thumbnail text) RETURNS uuid
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

CREATE OR REPLACE FUNCTION public.search_platform_knowledge(p_query text, p_category text DEFAULT NULL::text, p_limit integer DEFAULT 5) RETURNS TABLE(id uuid, category text, question text, answer text, related_pages text[], steps jsonb, similarity double precision)
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

CREATE OR REPLACE FUNCTION public.send_direct_message(p_sender_id uuid, p_receiver_id uuid, p_content text, p_type text DEFAULT 'text'::text) RETURNS uuid
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
