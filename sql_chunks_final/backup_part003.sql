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

CREATE OR REPLACE FUNCTION public.send_promotion_notification(p_user_id uuid, p_type text, p_title text, p_content text, p_related_id uuid DEFAULT NULL::uuid, p_related_type text DEFAULT NULL::text) RETURNS uuid
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

CREATE OR REPLACE FUNCTION public.send_user_notification(p_user_id uuid, p_type character varying, p_title character varying, p_content text, p_related_id uuid DEFAULT NULL::uuid, p_related_type character varying DEFAULT NULL::character varying) RETURNS uuid
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

CREATE OR REPLACE FUNCTION public.set_exchange_records_updated_at() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.set_updated_at() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.simulate_promotion_exposure() RETURNS TABLE(work_id uuid, work_title text, views_added integer, clicks_added integer)
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

CREATE OR REPLACE FUNCTION public.spend_points(p_user_id uuid, p_points integer, p_source text, p_description text) RETURNS TABLE(success boolean, new_balance integer, message text)
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

CREATE OR REPLACE FUNCTION public.submit_event_for_review(p_event_id uuid, p_organizer_id uuid) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.submit_event_work(p_event_id uuid, p_user_id uuid, p_participation_id uuid, p_title text, p_description text, p_files jsonb) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.submit_like(p_submission_id uuid, p_user_id uuid) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.submit_rating(p_comment text, p_rating integer, p_submission_id uuid, p_user_id uuid) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.submit_rating(p_submission_id uuid, p_user_id uuid, p_rating integer, p_comment text DEFAULT NULL::text) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.submit_score(p_submission_id uuid, p_judge_id uuid, p_score numeric, p_comment text DEFAULT NULL::text) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.submit_vote(p_submission_id uuid, p_user_id uuid) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.submit_work_from_ai_writer(p_event_id uuid, p_user_id uuid, p_participation_id uuid, p_title text, p_description text, p_ai_writer_content text, p_ai_writer_history_id uuid, p_files jsonb DEFAULT '[]'::jsonb) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.switch_user_conversation(p_user_id uuid, p_conversation_id uuid) RETURNS TABLE(id uuid, user_id uuid, title text, model_id text, created_at timestamp with time zone, updated_at timestamp with time zone, is_active boolean, context_summary text, message_count integer, metadata jsonb)
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

CREATE OR REPLACE FUNCTION public.sync_all_submissions_to_stats() RETURNS void
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

CREATE OR REPLACE FUNCTION public.sync_brand_task_to_creator_revenue() RETURNS void
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

CREATE OR REPLACE FUNCTION public.sync_comment_to_performance_stats() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.sync_like_to_performance_stats() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.sync_participants_columns() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.sync_rating_to_performance_stats() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.sync_submission_reward_to_participant() RETURNS void
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

CREATE OR REPLACE FUNCTION public.sync_submission_to_performance_stats() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.sync_user_data(p_user_id uuid, p_sync_type text, p_sync_data jsonb DEFAULT '{}'::jsonb, p_device_info jsonb DEFAULT '{}'::jsonb, p_ip_address inet DEFAULT NULL::inet) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.sync_vote_to_performance_stats() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.toggle_like_transaction(p_post_id uuid, p_user_id uuid) RETURNS boolean
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

CREATE OR REPLACE FUNCTION public.update_ai_reviews_updated_at() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_brand_ratings_timestamp() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_brand_wizard_drafts_updated_at() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_conversation_message_count() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_creative_profile_on_behavior() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_cultural_knowledge_updated_at() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_daily_stats_on_behavior() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_event_and_resubmit(p_event_id uuid, p_organizer_id uuid, p_event_data jsonb) RETURNS jsonb
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

CREATE OR REPLACE FUNCTION public.update_event_daily_stats(p_event_id uuid DEFAULT NULL::uuid) RETURNS void
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

CREATE OR REPLACE FUNCTION public.update_feed_collects_count() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_feed_comment_likes_count() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_feed_likes_count() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_feeds_updated_at() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_generation_tasks_updated_at() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_home_recommendations_updated_at() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_hot_search_trend_score() RETURNS trigger
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

CREATE OR REPLACE FUNCTION public.update_membership_usage_stats(p_user_id uuid, p_ai_generations integer DEFAULT 0, p_storage_bytes bigint DEFAULT 0, p_exports integer DEFAULT 0, p_api_calls integer DEFAULT 0) RETURNS void
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


ALTER FUNCTION public.update_membership_usage_stats(p_user_id uuid, p_ai_generations integer, p_storage_bytes bigint, p_exports integer, p_api_calls integer) OWNER TO postgres;

--
-- Name: update_mindmap_stats(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_mindmap_stats() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    UPDATE inspiration_mindmaps
    SET stats = jsonb_build_object(
        'totalNodes', (SELECT COUNT(*) FROM inspiration_nodes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id)),
        'maxDepth', COALESCE((SELECT MAX((position->>'level')::int) FROM inspiration_nodes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id)), 0),
        'aiGeneratedNodes', (SELECT COUNT(*) FROM inspiration_nodes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id) AND category = 'ai_generate'),
        'cultureNodes', (SELECT COUNT(*) FROM inspiration_nodes WHERE map_id = COALESCE(NEW.map_id, OLD.map_id) AND category = 'culture'),
        'lastActivityAt', NOW()::text
    ),
    updated_at = NOW()
    WHERE id = COALESCE(NEW.map_id, OLD.map_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$;


ALTER FUNCTION public.update_mindmap_stats() OWNER TO postgres;

--
-- Name: update_moderation_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_moderation_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_moderation_timestamp() OWNER TO postgres;

--
-- Name: update_order_applications_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_order_applications_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_order_applications_updated_at() OWNER TO postgres;

--
-- Name: update_pending_messages_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_pending_messages_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_pending_messages_updated_at() OWNER TO postgres;

--
-- Name: update_products_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_products_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_products_updated_at() OWNER TO postgres;

--
-- Name: update_promoted_works_updated_at(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_promoted_works_updated_at() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_promoted_works_updated_at() OWNER TO postgres;

--
-- Name: update_promotion_order_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_promotion_order_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_promotion_order_updated_at_column() OWNER TO postgres;

--
-- Name: update_promotion_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_promotion_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_promotion_updated_at_column() OWNER TO postgres;

--
-- Name: update_small_traffic_test_metrics(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_small_traffic_test_metrics() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    -- 更新测试统计
    UPDATE small_traffic_tests
    SET 
        exposure_count = exposure_count + 1,
        click_count = click_count + CASE WHEN NEW.clicked THEN 1 ELSE 0 END,
        like_count = like_count + CASE WHEN NEW.liked THEN 1 ELSE 0 END,
        sample_size = sample_size + 1,
        ctr = CASE 
            WHEN exposure_count + 1 > 0 
            THEN (click_count + CASE WHEN NEW.clicked THEN 1 ELSE 0 END)::DECIMAL / (exposure_count + 1)
            ELSE 0 
        END,
        engagement_rate = CASE 
            WHEN exposure_count + 1 > 0 
            THEN (like_count + CASE WHEN NEW.liked THEN 1 ELSE 0 END)::DECIMAL / (exposure_count + 1)
            ELSE 0 
        END,
        updated_at = NOW()
    WHERE id = NEW.test_id;
    
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_small_traffic_test_metrics() OWNER TO postgres;

--
-- Name: update_stage_completion(uuid, boolean); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_stage_completion(p_stage_id uuid, p_completed boolean) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE ip_stages 
    SET 
        completed = p_completed,
        completed_at = CASE WHEN p_completed THEN NOW() ELSE NULL END
    WHERE id = p_stage_id;
    
    -- 创建活动记录
    IF p_completed THEN
        INSERT INTO ip_activities (user_id, type, title, description)
        SELECT 
            a.user_id,
            'progress',
            '阶段完成: ' || s.name,
            '您的IP资产"' || a.name || '"已完成' || s.name || '阶段'
        FROM ip_stages s
        JOIN ip_assets a ON s.ip_asset_id = a.id
        WHERE s.id = p_stage_id;
    END IF;
    
    RETURN FOUND;
END;
$$;


ALTER FUNCTION public.update_stage_completion(p_stage_id uuid, p_completed boolean) OWNER TO postgres;

--
-- Name: update_task_participants_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_task_participants_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
      BEGIN
        IF TG_OP = 'INSERT' THEN
          UPDATE public.brand_tasks
          SET current_participants = current_participants + 1
          WHERE id = NEW.task_id;
          RETURN NEW;
        ELSIF TG_OP = 'DELETE' THEN
          UPDATE public.brand_tasks
          SET current_participants = current_participants - 1
          WHERE id = OLD.task_id;
          RETURN OLD;
        END IF;
        RETURN NULL;
      END;
      $$;


ALTER FUNCTION public.update_task_participants_count() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--
-- Name: update_updated_at_column_bigint(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_updated_at_column_bigint() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = EXTRACT(EPOCH FROM NOW())::BIGINT * 1000;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column_bigint() OWNER TO postgres;

--
-- Name: update_user_avatar(uuid, text, text); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_user_avatar(p_user_id uuid, p_avatar_url text, p_cover_image text DEFAULT NULL::text) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
BEGIN
    UPDATE public.users
    SET 
        avatar_url = COALESCE(p_avatar_url, avatar_url),
        cover_image = COALESCE(p_cover_image, cover_image),
        updated_at = NOW()
    WHERE id = p_user_id;
    
    IF FOUND THEN
        RETURN TRUE;
    ELSE
        RETURN FALSE;
    END IF;
END;
$$;


ALTER FUNCTION public.update_user_avatar(p_user_id uuid, p_avatar_url text, p_cover_image text) OWNER TO postgres;

--
-- Name: update_user_brand_history_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_user_brand_history_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.last_used_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_user_brand_history_timestamp() OWNER TO postgres;

--
-- Name: update_user_last_synced(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_user_last_synced() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  UPDATE users
  SET updated_at = NEW.synced_at
  WHERE id = NEW.user_id;
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_user_last_synced() OWNER TO postgres;

--
-- Name: update_user_points_balance(uuid, integer, character varying, character varying, character varying, text, uuid, character varying, jsonb); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_user_points_balance(p_user_id uuid, p_points integer, p_type character varying, p_source character varying, p_source_type character varying, p_description text, p_related_id uuid DEFAULT NULL::uuid, p_related_type character varying DEFAULT NULL::character varying, p_metadata jsonb DEFAULT '{}'::jsonb) RETURNS TABLE(success boolean, new_balance integer, record_id uuid, error_message text)
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
  v_current_balance INTEGER;
  v_new_balance INTEGER;
  v_version INTEGER;
  v_record_id UUID;
  v_total_earned INTEGER;
  v_total_spent INTEGER;
BEGIN
  -- 获取当前余额和版本号
  SELECT balance, version, total_earned, total_spent
  INTO v_current_balance, v_version, v_total_earned, v_total_spent
  FROM public.user_points_balance
  WHERE user_id = p_user_id
  FOR UPDATE;

  -- 检查用户是否存在
  IF v_current_balance IS NULL THEN
    -- 初始化用户积分余额
    INSERT INTO public.user_points_balance (user_id, balance, total_earned, total_spent, version, last_updated_at)
    VALUES (p_user_id, 0, 0, 0, 1, NOW())
    RETURNING balance, version, total_earned, total_spent
    INTO v_current_balance, v_version, v_total_earned, v_total_spent;
  END IF;

  -- 计算新余额
  v_new_balance := v_current_balance + p_points;

  -- 检查余额是否足够（消耗积分时）
  IF p_points < 0 AND v_new_balance < 0 THEN
    RETURN QUERY SELECT false, v_current_balance, NULL::UUID, '积分余额不足'::TEXT;
    RETURN;
  END IF;

  -- 更新余额（带乐观锁）
  UPDATE public.user_points_balance
  SET 
    balance = v_new_balance,
    total_earned = CASE WHEN p_points > 0 THEN v_total_earned + p_points ELSE v_total_earned END,
    total_spent = CASE WHEN p_points < 0 THEN v_total_spent + ABS(p_points) ELSE v_total_spent END,
    version = version + 1,
    last_updated_at = NOW()
  WHERE user_id = p_user_id AND version = v_version;

  -- 检查更新是否成功
  IF NOT FOUND THEN
    RETURN QUERY SELECT false, v_current_balance, NULL::UUID, '并发冲突，请重试'::TEXT;
    RETURN;
  END IF;

  -- 创建积分记录
  INSERT INTO public.points_records (
    user_id, points, type, source, source_type, description,
    balance_after, related_id, related_type, metadata
  ) VALUES (
    p_user_id, p_points, p_type, p_source, p_source_type, p_description,
    v_new_balance, p_related_id, p_related_type, p_metadata
  )
  RETURNING id INTO v_record_id;

  RETURN QUERY SELECT true, v_new_balance, v_record_id, NULL::TEXT;
END;
$$;


ALTER FUNCTION public.update_user_points_balance(p_user_id uuid, p_points integer, p_type character varying, p_source character varying, p_source_type character varying, p_description text, p_related_id uuid, p_related_type character varying, p_metadata jsonb) OWNER TO postgres;

--
-- Name: update_work_comment_likes_count(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_work_comment_likes_count() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.work_comments 
    SET likes_count = likes_count + 1 
    WHERE id = NEW.comment_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.work_comments 
    SET likes_count = GREATEST(0, likes_count - 1) 
    WHERE id = OLD.comment_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$;


ALTER FUNCTION public.update_work_comment_likes_count() OWNER TO postgres;

--
-- Name: update_work_scores(uuid); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_work_scores(p_work_id uuid) RETURNS boolean
    LANGUAGE plpgsql SECURITY DEFINER
    AS $$
DECLARE
    v_work RECORD;
    v_scores RECORD;
BEGIN
    -- 获取作品信息
    SELECT * INTO v_work FROM public.works WHERE id = p_work_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 计算评分
    SELECT * INTO v_scores FROM calculate_content_scores(
        p_work_id,
        v_work.content,
        v_work.title,
        v_work.description
    );
    
    -- 更新作品评分
    UPDATE public.works
    SET 
        authenticity_score = v_scores.authenticity_score,
        ai_risk_score = v_scores.ai_risk_score,
        spam_score = v_scores.spam_score,
        cultural_elements = v_scores.cultural_elements,
        scores_updated_at = NOW()
    WHERE id = p_work_id;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$;


ALTER FUNCTION public.update_work_scores(p_work_id uuid) OWNER TO postgres;

--
-- Name: FUNCTION update_work_scores(p_work_id uuid); Type: COMMENT; Schema: public; Owner: postgres
--

COMMENT ON FUNCTION public.update_work_scores(p_work_id uuid) IS '更新指定作品的评分';


--
-- Name: update_works_scores_timestamp(); Type: FUNCTION; Schema: public; Owner: postgres
--

CREATE OR REPLACE FUNCTION public.update_works_scores_timestamp() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.scores_updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_works_scores_timestamp() OWNER TO postgres;

--
-- Name: apply_rls(jsonb, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer DEFAULT (1024 * 1024)) RETURNS SETOF realtime.wal_rls
    LANGUAGE plpgsql
    AS $$
declare
-- Regclass of the table e.g. public.notes
entity_ regclass = (quote_ident(wal ->> 'schema') || '.' || quote_ident(wal ->> 'table'))::regclass;

-- I, U, D, T: insert, update ...
action realtime.action = (
    case wal ->> 'action'
        when 'I' then 'INSERT'
        when 'U' then 'UPDATE'
        when 'D' then 'DELETE'
        else 'ERROR'
    end
);

-- Is row level security enabled for the table
is_rls_enabled bool = relrowsecurity from pg_class where oid = entity_;

subscriptions realtime.subscription[] = array_agg(subs)
    from
        realtime.subscription subs
    where
        subs.entity = entity_
        -- Filter by action early - only get subscriptions interested in this action
        -- action_filter column can be: '*' (all), 'INSERT', 'UPDATE', or 'DELETE'
        and (subs.action_filter = '*' or subs.action_filter = action::text);

-- Subscription vars
roles regrole[] = array_agg(distinct us.claims_role::text)
    from
        unnest(subscriptions) us;

working_role regrole;
claimed_role regrole;
claims jsonb;

subscription_id uuid;
subscription_has_access bool;
visible_to_subscription_ids uuid[] = '{}';

-- structured info for wal's columns
columns realtime.wal_column[];
-- previous identity values for update/delete
old_columns realtime.wal_column[];

error_record_exceeds_max_size boolean = octet_length(wal::text) > max_record_bytes;

-- Primary jsonb output for record
output jsonb;

begin
perform set_config('role', null, true);

columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'columns') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

old_columns =
    array_agg(
        (
            x->>'name',
            x->>'type',
            x->>'typeoid',
            realtime.cast(
                (x->'value') #>> '{}',
                coalesce(
                    (x->>'typeoid')::regtype, -- null when wal2json version <= 2.4
                    (x->>'type')::regtype
                )
            ),
            (pks ->> 'name') is not null,
            true
        )::realtime.wal_column
    )
    from
        jsonb_array_elements(wal -> 'identity') x
        left join jsonb_array_elements(wal -> 'pk') pks
            on (x ->> 'name') = (pks ->> 'name');

for working_role in select * from unnest(roles) loop

    -- Update `is_selectable` for columns and old_columns
    columns =
        array_agg(
            (
                c.name,
                c.type_name,
                c.type_oid,
                c.value,
                c.is_pkey,
                pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
            )::realtime.wal_column
        )
        from
            unnest(columns) c;

    old_columns =
            array_agg(
                (
                    c.name,
                    c.type_name,
                    c.type_oid,
                    c.value,
                    c.is_pkey,
                    pg_catalog.has_column_privilege(working_role, entity_, c.name, 'SELECT')
                )::realtime.wal_column
            )
            from
                unnest(old_columns) c;

    if action <> 'DELETE' and count(1) = 0 from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            -- subscriptions is already filtered by entity
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 400: Bad Request, no primary key']
        )::realtime.wal_rls;

    -- The claims role does not have SELECT permission to the primary key of entity
    elsif action <> 'DELETE' and sum(c.is_selectable::int) <> count(1) from unnest(columns) c where c.is_pkey then
        return next (
            jsonb_build_object(
                'schema', wal ->> 'schema',
                'table', wal ->> 'table',
                'type', action
            ),
            is_rls_enabled,
            (select array_agg(s.subscription_id) from unnest(subscriptions) as s where claims_role = working_role),
            array['Error 401: Unauthorized']
        )::realtime.wal_rls;

    else
        output = jsonb_build_object(
            'schema', wal ->> 'schema',
            'table', wal ->> 'table',
            'type', action,
            'commit_timestamp', to_char(
                ((wal ->> 'timestamp')::timestamptz at time zone 'utc'),
                'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'
            ),
            'columns', (
                select
                    jsonb_agg(
                        jsonb_build_object(
                            'name', pa.attname,
                            'type', pt.typname
                        )
                        order by pa.attnum asc
                    )
                from
                    pg_attribute pa
                    join pg_type pt
                        on pa.atttypid = pt.oid
                where
                    attrelid = entity_
                    and attnum > 0
                    and pg_catalog.has_column_privilege(working_role, entity_, pa.attname, 'SELECT')
            )
        )
        -- Add "record" key for insert and update
        || case
            when action in ('INSERT', 'UPDATE') then
                jsonb_build_object(
                    'record',
                    (
                        select
                            jsonb_object_agg(
                                -- if unchanged toast, get column name and value from old record
                                coalesce((c).name, (oc).name),
                                case
                                    when (c).name is null then (oc).value
                                    else (c).value
                                end
                            )
                        from
                            unnest(columns) c
                            full outer join unnest(old_columns) oc
                                on (c).name = (oc).name
                        where
                            coalesce((c).is_selectable, (oc).is_selectable)
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                    )
                )
            else '{}'::jsonb
        end
        -- Add "old_record" key for update and delete
        || case
            when action = 'UPDATE' then
                jsonb_build_object(
                        'old_record',
                        (
                            select jsonb_object_agg((c).name, (c).value)
                            from unnest(old_columns) c
                            where
                                (c).is_selectable
                                and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                        )
                    )
            when action = 'DELETE' then
                jsonb_build_object(
                    'old_record',
                    (
                        select jsonb_object_agg((c).name, (c).value)
                        from unnest(old_columns) c
                        where
                            (c).is_selectable
                            and ( not error_record_exceeds_max_size or (octet_length((c).value::text) <= 64))
                            and ( not is_rls_enabled or (c).is_pkey ) -- if RLS enabled, we can't secure deletes so filter to pkey
                    )
                )
            else '{}'::jsonb
        end;

        -- Create the prepared statement
        if is_rls_enabled and action <> 'DELETE' then
            if (select 1 from pg_prepared_statements where name = 'walrus_rls_stmt' limit 1) > 0 then
                deallocate walrus_rls_stmt;
            end if;
            execute realtime.build_prepared_statement_sql('walrus_rls_stmt', entity_, columns);
        end if;

        visible_to_subscription_ids = '{}';

        for subscription_id, claims in (
                select
                    subs.subscription_id,
                    subs.claims
                from
                    unnest(subscriptions) subs
                where
                    subs.entity = entity_
                    and subs.claims_role = working_role
                    and (
                        realtime.is_visible_through_filters(columns, subs.filters)
                        or (
                          action = 'DELETE'
                          and realtime.is_visible_through_filters(old_columns, subs.filters)
                        )
                    )
        ) loop

            if not is_rls_enabled or action = 'DELETE' then
                visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
            else
                -- Check if RLS allows the role to see the record
                perform
                    -- Trim leading and trailing quotes from working_role because set_config
                    -- doesn't recognize the role as valid if they are included
                    set_config('role', trim(both '"' from working_role::text), true),
                    set_config('request.jwt.claims', claims::text, true);

                execute 'execute walrus_rls_stmt' into subscription_has_access;

                if subscription_has_access then
                    visible_to_subscription_ids = visible_to_subscription_ids || subscription_id;
                end if;
            end if;
        end loop;

        perform set_config('role', null, true);

        return next (
            output,
            is_rls_enabled,
            visible_to_subscription_ids,
            case
                when error_record_exceeds_max_size then array['Error 413: Payload Too Large']
                else '{}'
            end
        )::realtime.wal_rls;

    end if;
end loop;

perform set_config('role', null, true);
end;
$$;


ALTER FUNCTION realtime.apply_rls(wal jsonb, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: broadcast_changes(text, text, text, text, text, record, record, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text DEFAULT 'ROW'::text) RETURNS void
    LANGUAGE plpgsql
    AS $$
DECLARE
    -- Declare a variable to hold the JSONB representation of the row
    row_data jsonb := '{}'::jsonb;
BEGIN
    IF level = 'STATEMENT' THEN
        RAISE EXCEPTION 'function can only be triggered for each row, not for each statement';
    END IF;
    -- Check the operation type and handle accordingly
    IF operation = 'INSERT' OR operation = 'UPDATE' OR operation = 'DELETE' THEN
        row_data := jsonb_build_object('old_record', OLD, 'record', NEW, 'operation', operation, 'table', table_name, 'schema', table_schema);
        PERFORM realtime.send (row_data, event_name, topic_name);
    ELSE
        RAISE EXCEPTION 'Unexpected operation type: %', operation;
    END IF;
EXCEPTION
    WHEN OTHERS THEN
        RAISE EXCEPTION 'Failed to process the row: %', SQLERRM;
END;

$$;


ALTER FUNCTION realtime.broadcast_changes(topic_name text, event_name text, operation text, table_name text, table_schema text, new record, old record, level text) OWNER TO supabase_admin;

--
-- Name: build_prepared_statement_sql(text, regclass, realtime.wal_column[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) RETURNS text
    LANGUAGE sql
    AS $$
      /*
      Builds a sql string that, if executed, creates a prepared statement to
      tests retrive a row from *entity* by its primary key columns.
      Example
          select realtime.build_prepared_statement_sql('public.notes', '{"id"}'::text[], '{"bigint"}'::text[])
      */
          select
      'prepare ' || prepared_statement_name || ' as
          select
              exists(
                  select
                      1
                  from
                      ' || entity || '
                  where
                      ' || string_agg(quote_ident(pkc.name) || '=' || quote_nullable(pkc.value #>> '{}') , ' and ') || '
              )'
          from
              unnest(columns) pkc
          where
              pkc.is_pkey
          group by
              entity
      $$;


ALTER FUNCTION realtime.build_prepared_statement_sql(prepared_statement_name text, entity regclass, columns realtime.wal_column[]) OWNER TO supabase_admin;

--
-- Name: cast(text, regtype); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION realtime."cast"(val text, type_ regtype) RETURNS jsonb
    LANGUAGE plpgsql IMMUTABLE
    AS $$
declare
  res jsonb;
begin
  if type_::text = 'bytea' then
    return to_jsonb(val);
  end if;
  execute format('select to_jsonb(%L::'|| type_::text || ')', val) into res;
  return res;
end
$$;


ALTER FUNCTION realtime."cast"(val text, type_ regtype) OWNER TO supabase_admin;

--
-- Name: check_equality_op(realtime.equality_op, regtype, text, text); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) RETURNS boolean
    LANGUAGE plpgsql IMMUTABLE
    AS $$
      /*
      Casts *val_1* and *val_2* as type *type_* and check the *op* condition for truthiness
      */
      declare
          op_symbol text = (
              case
                  when op = 'eq' then '='
                  when op = 'neq' then '!='
                  when op = 'lt' then '<'
                  when op = 'lte' then '<='
                  when op = 'gt' then '>'
                  when op = 'gte' then '>='
                  when op = 'in' then '= any'
                  else 'UNKNOWN OP'
              end
          );
          res boolean;
      begin
          execute format(
              'select %L::'|| type_::text || ' ' || op_symbol
              || ' ( %L::'
              || (
                  case
                      when op = 'in' then type_::text || '[]'
                      else type_::text end
              )
              || ')', val_1, val_2) into res;
          return res;
      end;
      $$;


ALTER FUNCTION realtime.check_equality_op(op realtime.equality_op, type_ regtype, val_1 text, val_2 text) OWNER TO supabase_admin;

--
-- Name: is_visible_through_filters(realtime.wal_column[], realtime.user_defined_filter[]); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) RETURNS boolean
    LANGUAGE sql IMMUTABLE
    AS $_$
    /*
    Should the record be visible (true) or filtered out (false) after *filters* are applied
    */
        select
            -- Default to allowed when no filters present
            $2 is null -- no filters. this should not happen because subscriptions has a default
            or array_length($2, 1) is null -- array length of an empty array is null
            or bool_and(
                coalesce(
                    realtime.check_equality_op(
                        op:=f.op,
                        type_:=coalesce(
                            col.type_oid::regtype, -- null when wal2json version <= 2.4
                            col.type_name::regtype
                        ),
                        -- cast jsonb to text
                        val_1:=col.value #>> '{}',
                        val_2:=f.value
                    ),
                    false -- if null, filter does not match
                )
            )
        from
            unnest(filters) f
            join unnest(columns) col
                on f.column_name = col.name;
    $_$;


ALTER FUNCTION realtime.is_visible_through_filters(columns realtime.wal_column[], filters realtime.user_defined_filter[]) OWNER TO supabase_admin;

--
-- Name: list_changes(name, name, integer, integer); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) RETURNS SETOF realtime.wal_rls
    LANGUAGE sql
    SET log_min_messages TO 'fatal'
    AS $$
      with pub as (
        select
          concat_ws(
            ',',
            case when bool_or(pubinsert) then 'insert' else null end,
            case when bool_or(pubupdate) then 'update' else null end,
            case when bool_or(pubdelete) then 'delete' else null end
          ) as w2j_actions,
          coalesce(
            string_agg(
              realtime.quote_wal2json(format('%I.%I', schemaname, tablename)::regclass),
              ','
            ) filter (where ppt.tablename is not null and ppt.tablename not like '% %'),
            ''
          ) w2j_add_tables
        from
          pg_publication pp
          left join pg_publication_tables ppt
            on pp.pubname = ppt.pubname
        where
          pp.pubname = publication
        group by
          pp.pubname
        limit 1
      ),
      w2j as (
        select
          x.*, pub.w2j_add_tables
        from
          pub,
          pg_logical_slot_get_changes(
            slot_name, null, max_changes,
            'include-pk', 'true',
            'include-transaction', 'false',
            'include-timestamp', 'true',
            'include-type-oids', 'true',
            'format-version', '2',
            'actions', pub.w2j_actions,
            'add-tables', pub.w2j_add_tables
          ) x
      )
      select
        xyz.wal,
        xyz.is_rls_enabled,
        xyz.subscription_ids,
        xyz.errors
      from
        w2j,
        realtime.apply_rls(
          wal := w2j.data::jsonb,
          max_record_bytes := max_record_bytes
        ) xyz(wal, is_rls_enabled, subscription_ids, errors)
      where
        w2j.w2j_add_tables <> ''
        and xyz.subscription_ids[1] is not null
    $$;


ALTER FUNCTION realtime.list_changes(publication name, slot_name name, max_changes integer, max_record_bytes integer) OWNER TO supabase_admin;

--
-- Name: quote_wal2json(regclass); Type: FUNCTION; Schema: realtime; Owner: supabase_admin
--

CREATE OR REPLACE FUNCTION realtime.quote_wal2json(entity regclass) RETURNS text
    LANGUAGE sql IMMUTABLE STRICT
    AS $$
      select
        (
          select string_agg('' || ch,'')
          from unnest(string_to_array(nsp.nspname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
        )
        || '.'
        || (
          select string_agg('' || ch,'')
          from unnest(string_to_array(pc.relname::text, null)) with ordinality x(ch, idx)
          where
            not (x.idx = 1 and x.ch = '"')
            and not (
              x.idx = array_length(string_to_array(nsp.nspname::text, null), 1)
              and x.ch = '"'
            )
          )
      from
        pg_class pc
        join pg_namespace nsp
          on pc.relnamespace = nsp.oid
      where
        pc.oid = entity
    $$;

