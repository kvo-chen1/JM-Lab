-- 创建缺失的 RPC 函数
-- 执行: psql $DATABASE_URL -f create-missing-functions.sql

-- 1. 获取活跃推广作品
CREATE OR REPLACE FUNCTION get_active_promoted_works(p_limit INTEGER DEFAULT 10, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    work_id TEXT,
    user_id TEXT,
    promoted_work_id UUID,
    promotion_weight INTEGER,
    priority_score DECIMAL,
    display_position INTEGER,
    is_featured BOOLEAN,
    package_type TEXT,
    remaining_hours INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pw.work_id::TEXT,
        pw.user_id::TEXT,
        pw.id as promoted_work_id,
        pw.promotion_weight,
        pw.priority_score,
        pw.display_position,
        pw.is_featured,
        pw.package_type,
        EXTRACT(EPOCH FROM (pw.end_time - NOW())) / 3600::INTEGER as remaining_hours
    FROM promoted_works pw
    WHERE pw.status = 'active'
        AND pw.start_time <= NOW()
        AND pw.end_time >= NOW()
    ORDER BY pw.priority_score DESC, pw.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 2. 标记通知已读
CREATE OR REPLACE FUNCTION mark_notification_read(p_user_id TEXT, p_notification_id UUID DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    IF p_notification_id IS NULL THEN
        -- 标记所有通知为已读
        UPDATE notifications 
        SET is_read = true, updated_at = NOW()
        WHERE user_id = p_user_id AND is_read = false;
    ELSE
        -- 标记特定通知为已读
        UPDATE notifications 
        SET is_read = true, updated_at = NOW()
        WHERE id = p_notification_id AND user_id = p_user_id;
    END IF;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 3. 创建对话
CREATE OR REPLACE FUNCTION create_conversation(p_user_id TEXT, p_participant_ids TEXT[], p_title TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    v_conversation_id UUID;
    v_participant_id TEXT;
BEGIN
    -- 创建对话
    INSERT INTO conversations (title, created_by, participant_count)
    VALUES (p_title, p_user_id, array_length(p_participant_ids, 1) + 1)
    RETURNING id INTO v_conversation_id;
    
    -- 添加参与者
    FOREACH v_participant_id IN ARRAY p_participant_ids
    LOOP
        INSERT INTO conversation_participants (conversation_id, user_id)
        VALUES (v_conversation_id, v_participant_id);
    END LOOP;
    
    -- 添加创建者
    INSERT INTO conversation_participants (conversation_id, user_id, is_admin)
    VALUES (v_conversation_id, p_user_id, true);
    
    RETURN v_conversation_id;
END;
$$ LANGUAGE plpgsql;

-- 4. 获取对话消息
CREATE OR REPLACE FUNCTION get_conversation_messages(p_conversation_id UUID, p_limit INTEGER DEFAULT 50, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    id UUID,
    conversation_id UUID,
    sender_id TEXT,
    content TEXT,
    created_at TIMESTAMPTZ,
    is_read BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT m.id, m.conversation_id, m.sender_id, m.content, m.created_at, m.is_read
    FROM messages m
    WHERE m.conversation_id = p_conversation_id
    ORDER BY m.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 5. 发送消息
CREATE OR REPLACE FUNCTION send_message(p_conversation_id UUID, p_sender_id TEXT, p_content TEXT)
RETURNS UUID AS $$
DECLARE
    v_message_id UUID;
BEGIN
    INSERT INTO messages (conversation_id, sender_id, content, created_at)
    VALUES (p_conversation_id, p_sender_id, p_content, NOW())
    RETURNING id INTO v_message_id;
    
    -- 更新对话最后消息时间
    UPDATE conversations 
    SET last_message_at = NOW(), last_message = p_content
    WHERE id = p_conversation_id;
    
    RETURN v_message_id;
END;
$$ LANGUAGE plpgsql;

-- 6. 标记消息已读
CREATE OR REPLACE FUNCTION mark_messages_read(p_conversation_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE messages 
    SET is_read = true
    WHERE conversation_id = p_conversation_id 
        AND sender_id != p_user_id 
        AND is_read = false;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 7. 获取未读消息数
CREATE OR REPLACE FUNCTION get_unread_message_count(p_user_id TEXT)
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO v_count
    FROM messages m
    JOIN conversation_participants cp ON m.conversation_id = cp.conversation_id
    WHERE cp.user_id = p_user_id
        AND m.sender_id != p_user_id
        AND m.is_read = false;
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- 8. 申请加入社区
CREATE OR REPLACE FUNCTION apply_for_community(p_community_id UUID, p_user_id TEXT, p_message TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    v_application_id UUID;
BEGIN
    INSERT INTO community_join_requests (community_id, user_id, message, status, created_at)
    VALUES (p_community_id, p_user_id, p_message, 'pending', NOW())
    RETURNING id INTO v_application_id;
    RETURN v_application_id;
END;
$$ LANGUAGE plpgsql;

-- 9. 批准社区申请
CREATE OR REPLACE FUNCTION approve_community_application(p_application_id UUID, p_admin_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE community_join_requests 
    SET status = 'approved', updated_at = NOW()
    WHERE id = p_application_id;
    
    -- 添加成员
    INSERT INTO community_members (community_id, user_id, role, joined_at)
    SELECT community_id, user_id, 'member', NOW()
    FROM community_join_requests
    WHERE id = p_application_id;
    
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 10. 拒绝社区申请
CREATE OR REPLACE FUNCTION reject_community_application(p_application_id UUID, p_admin_id TEXT, p_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE community_join_requests 
    SET status = 'rejected', rejection_reason = p_reason, updated_at = NOW()
    WHERE id = p_application_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 11. 加入社区
CREATE OR REPLACE FUNCTION join_community(p_community_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO community_members (community_id, user_id, role, joined_at)
    VALUES (p_community_id, p_user_id, 'member', NOW())
    ON CONFLICT (community_id, user_id) DO NOTHING;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 12. 离开社区
CREATE OR REPLACE FUNCTION leave_community(p_community_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM community_members 
    WHERE community_id = p_community_id AND user_id = p_user_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 13. 创建社区帖子
CREATE OR REPLACE FUNCTION create_community_post(p_community_id UUID, p_user_id TEXT, p_title TEXT, p_content TEXT, p_images JSONB DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    v_post_id UUID;
BEGIN
    INSERT INTO community_posts (community_id, user_id, title, content, images, created_at)
    VALUES (p_community_id, p_user_id, p_title, p_content, p_images, NOW())
    RETURNING id INTO v_post_id;
    RETURN v_post_id;
END;
$$ LANGUAGE plpgsql;

-- 14. 获取社区帖子
CREATE OR REPLACE FUNCTION get_community_posts(p_community_id UUID, p_limit INTEGER DEFAULT 20, p_offset INTEGER DEFAULT 0)
RETURNS TABLE (
    id UUID,
    community_id UUID,
    user_id TEXT,
    title TEXT,
    content TEXT,
    images JSONB,
    likes_count INTEGER,
    comments_count INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT cp.id, cp.community_id, cp.user_id, cp.title, cp.content, cp.images, cp.likes_count, cp.comments_count, cp.created_at
    FROM community_posts cp
    WHERE cp.community_id = p_community_id
    ORDER BY cp.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql;

-- 15. 创建活动
CREATE OR REPLACE FUNCTION create_event(
    p_title TEXT, 
    p_description TEXT, 
    p_organizer_id TEXT, 
    p_start_time TIMESTAMPTZ, 
    p_end_time TIMESTAMPTZ,
    p_location TEXT DEFAULT NULL,
    p_cover_image TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_event_id UUID;
BEGIN
    INSERT INTO events (title, description, organizer_id, start_time, end_time, location, cover_image, status, created_at)
    VALUES (p_title, p_description, p_organizer_id, p_start_time, p_end_time, p_location, p_cover_image, 'draft', NOW())
    RETURNING id INTO v_event_id;
    RETURN v_event_id;
END;
$$ LANGUAGE plpgsql;

-- 16. 更新活动
CREATE OR REPLACE FUNCTION update_event(
    p_event_id UUID,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_start_time TIMESTAMPTZ DEFAULT NULL,
    p_end_time TIMESTAMPTZ DEFAULT NULL,
    p_location TEXT DEFAULT NULL,
    p_cover_image TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE events SET
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        start_time = COALESCE(p_start_time, start_time),
        end_time = COALESCE(p_end_time, end_time),
        location = COALESCE(p_location, location),
        cover_image = COALESCE(p_cover_image, cover_image),
        updated_at = NOW()
    WHERE id = p_event_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 17. 删除活动
CREATE OR REPLACE FUNCTION delete_event(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM events WHERE id = p_event_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 18. 发布活动
CREATE OR REPLACE FUNCTION publish_event(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE events SET status = 'published', updated_at = NOW() WHERE id = p_event_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 19. 取消发布活动
CREATE OR REPLACE FUNCTION unpublish_event(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE events SET status = 'draft', updated_at = NOW() WHERE id = p_event_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 20. 报名活动
CREATE OR REPLACE FUNCTION register_for_event(p_event_id UUID, p_user_id TEXT)
RETURNS UUID AS $$
DECLARE
    v_participant_id UUID;
BEGIN
    INSERT INTO event_participants (event_id, user_id, status, registered_at)
    VALUES (p_event_id, p_user_id, 'registered', NOW())
    RETURNING id INTO v_participant_id;
    RETURN v_participant_id;
END;
$$ LANGUAGE plpgsql;

-- 21. 取消报名
CREATE OR REPLACE FUNCTION cancel_event_registration(p_event_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM event_participants WHERE event_id = p_event_id AND user_id = p_user_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 22. 提交作品
CREATE OR REPLACE FUNCTION submit_event_work(p_event_id UUID, p_user_id TEXT, p_work_id TEXT, p_title TEXT, p_description TEXT)
RETURNS UUID AS $$
DECLARE
    v_submission_id UUID;
BEGIN
    INSERT INTO event_submissions (event_id, user_id, work_id, title, description, status, submitted_at)
    VALUES (p_event_id, p_user_id, p_work_id, p_title, p_description, 'submitted', NOW())
    RETURNING id INTO v_submission_id;
    
    -- 更新参与者状态
    UPDATE event_participants 
    SET status = 'submitted', work_submitted = true
    WHERE event_id = p_event_id AND user_id = p_user_id;
    
    RETURN v_submission_id;
END;
$$ LANGUAGE plpgsql;

-- 23. 评分
CREATE OR REPLACE FUNCTION score_event_submission(p_submission_id UUID, p_judge_id TEXT, p_score DECIMAL, p_comment TEXT DEFAULT NULL)
RETURNS UUID AS $$
DECLARE
    v_score_id UUID;
BEGIN
    INSERT INTO submission_scores (submission_id, judge_id, score, comment, created_at)
    VALUES (p_submission_id, p_judge_id, p_score, p_comment, NOW())
    RETURNING id INTO v_score_id;
    RETURN v_score_id;
END;
$$ LANGUAGE plpgsql;

-- 24. 投票
CREATE OR REPLACE FUNCTION vote_for_submission(p_submission_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO submission_votes (submission_id, user_id, created_at)
    VALUES (p_submission_id, p_user_id, NOW())
    ON CONFLICT (submission_id, user_id) DO NOTHING;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 25. 评论提交作品
CREATE OR REPLACE FUNCTION comment_on_submission(p_submission_id UUID, p_user_id TEXT, p_content TEXT)
RETURNS UUID AS $$
DECLARE
    v_comment_id UUID;
BEGIN
    INSERT INTO submission_comments (submission_id, user_id, content, created_at)
    VALUES (p_submission_id, p_user_id, p_content, NOW())
    RETURNING id INTO v_comment_id;
    RETURN v_comment_id;
END;
$$ LANGUAGE plpgsql;

-- 26. 点赞提交作品
CREATE OR REPLACE FUNCTION like_submission(p_submission_id UUID, p_user_id TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    INSERT INTO submission_likes (submission_id, user_id, created_at)
    VALUES (p_submission_id, p_user_id, NOW())
    ON CONFLICT (submission_id, user_id) DO NOTHING;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 27. 获取活动排名
CREATE OR REPLACE FUNCTION get_event_ranking(p_event_id UUID)
RETURNS TABLE (
    submission_id UUID,
    user_id TEXT,
    work_id TEXT,
    title TEXT,
    average_score DECIMAL,
    vote_count BIGINT,
    rank BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        es.id as submission_id,
        es.user_id,
        es.work_id,
        es.title,
        COALESCE(AVG(ss.score), 0) as average_score,
        COUNT(DISTINCT sv.id) as vote_count,
        ROW_NUMBER() OVER (ORDER BY COALESCE(AVG(ss.score), 0) DESC, COUNT(DISTINCT sv.id) DESC) as rank
    FROM event_submissions es
    LEFT JOIN submission_scores ss ON es.id = ss.submission_id
    LEFT JOIN submission_votes sv ON es.id = sv.submission_id
    WHERE es.event_id = p_event_id
    GROUP BY es.id, es.user_id, es.work_id, es.title
    ORDER BY average_score DESC, vote_count DESC;
END;
$$ LANGUAGE plpgsql;

-- 28. 发布最终排名
CREATE OR REPLACE FUNCTION publish_final_ranking(p_event_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE events SET status = 'completed', ranking_published_at = NOW() WHERE id = p_event_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 29. 创建产品
CREATE OR REPLACE FUNCTION create_product(
    p_name TEXT,
    p_description TEXT,
    p_price DECIMAL,
    p_stock INTEGER DEFAULT 0,
    p_category TEXT DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    v_product_id UUID;
BEGIN
    INSERT INTO products (name, description, price, stock, category, created_at)
    VALUES (p_name, p_description, p_price, p_stock, p_category, NOW())
    RETURNING id INTO v_product_id;
    RETURN v_product_id;
END;
$$ LANGUAGE plpgsql;

-- 30. 更新产品
CREATE OR REPLACE FUNCTION update_product(
    p_product_id UUID,
    p_name TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_price DECIMAL DEFAULT NULL,
    p_stock INTEGER DEFAULT NULL,
    p_category TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE products SET
        name = COALESCE(p_name, name),
        description = COALESCE(p_description, description),
        price = COALESCE(p_price, price),
        stock = COALESCE(p_stock, stock),
        category = COALESCE(p_category, category),
        updated_at = NOW()
    WHERE id = p_product_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 31. 删除产品
CREATE OR REPLACE FUNCTION delete_product(p_product_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM products WHERE id = p_product_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 32. 创建抽奖活动
CREATE OR REPLACE FUNCTION create_lottery(
    p_title TEXT,
    p_description TEXT,
    p_start_time TIMESTAMPTZ,
    p_end_time TIMESTAMPTZ,
    p_created_by TEXT
)
RETURNS UUID AS $$
DECLARE
    v_lottery_id UUID;
BEGIN
    INSERT INTO lottery_activities (title, description, start_time, end_time, created_by, status, created_at)
    VALUES (p_title, p_description, p_start_time, p_end_time, p_created_by, 'active', NOW())
    RETURNING id INTO v_lottery_id;
    RETURN v_lottery_id;
END;
$$ LANGUAGE plpgsql;

-- 33. 更新抽奖活动
CREATE OR REPLACE FUNCTION update_lottery(
    p_lottery_id UUID,
    p_title TEXT DEFAULT NULL,
    p_description TEXT DEFAULT NULL,
    p_start_time TIMESTAMPTZ DEFAULT NULL,
    p_end_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE lottery_activities SET
        title = COALESCE(p_title, title),
        description = COALESCE(p_description, description),
        start_time = COALESCE(p_start_time, start_time),
        end_time = COALESCE(p_end_time, end_time),
        updated_at = NOW()
    WHERE id = p_lottery_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 34. 删除抽奖活动
CREATE OR REPLACE FUNCTION delete_lottery(p_lottery_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    DELETE FROM lottery_activities WHERE id = p_lottery_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 35. 抽奖
CREATE OR REPLACE FUNCTION spin_lottery(p_lottery_id UUID, p_user_id TEXT)
RETURNS TABLE (
    prize_id UUID,
    prize_name TEXT,
    prize_level INTEGER,
    is_winner BOOLEAN
) AS $$
DECLARE
    v_prize RECORD;
    v_random DECIMAL;
    v_total_probability DECIMAL;
BEGIN
    -- 获取所有奖品
    SELECT SUM(probability) INTO v_total_probability
    FROM lottery_prizes
    WHERE lottery_id = p_lottery_id;
    
    -- 随机选择
    v_random := random() * v_total_probability;
    
    FOR v_prize IN
        SELECT id, name, level, probability
        FROM lottery_prizes
        WHERE lottery_id = p_lottery_id
        ORDER BY level
    LOOP
        v_random := v_random - v_prize.probability;
        IF v_random <= 0 THEN
            -- 记录中奖
            INSERT INTO lottery_spin_records (lottery_id, user_id, prize_id, created_at)
            VALUES (p_lottery_id, p_user_id, v_prize.id, NOW());
            
            RETURN QUERY SELECT v_prize.id, v_prize.name, v_prize.level, true;
            RETURN;
        END IF;
    END LOOP;
    
    -- 未中奖
    RETURN QUERY SELECT NULL::UUID, '谢谢参与'::TEXT, 0::INTEGER, false;
END;
$$ LANGUAGE plpgsql;

-- 36. 获取抽奖结果
CREATE OR REPLACE FUNCTION get_lottery_result(p_lottery_id UUID, p_user_id TEXT)
RETURNS TABLE (
    prize_id UUID,
    prize_name TEXT,
    prize_level INTEGER,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT lp.id, lp.name, lp.level, lsr.created_at
    FROM lottery_spin_records lsr
    JOIN lottery_prizes lp ON lsr.prize_id = lp.id
    WHERE lsr.lottery_id = p_lottery_id AND lsr.user_id = p_user_id
    ORDER BY lsr.created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- 37. 创建推广订单
CREATE OR REPLACE FUNCTION create_promotion_order(
    p_user_id TEXT,
    p_work_id TEXT,
    p_package_type TEXT,
    p_duration_hours INTEGER,
    p_total_amount DECIMAL
)
RETURNS UUID AS $$
DECLARE
    v_order_id UUID;
BEGIN
    INSERT INTO promotion_orders (
        user_id, work_id, package_type, duration_hours, total_amount, 
        status, created_at, order_no
    )
    VALUES (
        p_user_id, p_work_id, p_package_type, p_duration_hours, p_total_amount,
        'pending', NOW(), 'PO' || EXTRACT(EPOCH FROM NOW())::BIGINT
    )
    RETURNING id INTO v_order_id;
    RETURN v_order_id;
END;
$$ LANGUAGE plpgsql;

-- 38. 更新推广订单
CREATE OR REPLACE FUNCTION update_promotion_order(
    p_order_id UUID,
    p_status TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE promotion_orders SET
        status = COALESCE(p_status, status),
        updated_at = NOW()
    WHERE id = p_order_id;
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 39. 取消推广订单
CREATE OR REPLACE FUNCTION cancel_promotion_order(p_order_id UUID, p_reason TEXT DEFAULT NULL)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE promotion_orders SET
        status = 'cancelled',
        cancel_reason = p_reason,
        updated_at = NOW()
    WHERE id = p_order_id AND status = 'pending';
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 40. 支付推广订单
CREATE OR REPLACE FUNCTION pay_for_promotion(p_order_id UUID, p_payment_method TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE promotion_orders SET
        status = 'paid',
        payment_method = p_payment_method,
        paid_at = NOW(),
        updated_at = NOW()
    WHERE id = p_order_id AND status = 'pending';
    RETURN true;
END;
$$ LANGUAGE plpgsql;

-- 41. 获取热门搜索
CREATE OR REPLACE FUNCTION get_hot_searches(p_limit INTEGER DEFAULT 10)
RETURNS TABLE (
    query TEXT,
    count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT sh.query, COUNT(*) as count
    FROM search_history sh
    WHERE sh.created_at > NOW() - INTERVAL '7 days'
    GROUP BY sh.query
    ORDER BY count DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- 42. 获取分析统计
CREATE OR REPLACE FUNCTION get_analytics_stats(p_start_date DATE, p_end_date DATE)
RETURNS TABLE (
    date DATE,
    page_views BIGINT,
    unique_visitors BIGINT,
    new_users BIGINT,
    active_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        ads.date,
        ads.page_views,
        ads.unique_visitors,
        ads.new_users,
        ads.active_users
    FROM analytics_daily_stats ads
    WHERE ads.date BETWEEN p_start_date AND p_end_date
    ORDER BY ads.date;
END;
$$ LANGUAGE plpgsql;

-- 43. 获取实时统计
CREATE OR REPLACE FUNCTION get_realtime_stats()
RETURNS TABLE (
    active_users_5min BIGINT,
    active_users_1hour BIGINT,
    total_page_views_today BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(DISTINCT user_id) FROM page_views WHERE created_at > NOW() - INTERVAL '5 minutes'),
        (SELECT COUNT(DISTINCT user_id) FROM page_views WHERE created_at > NOW() - INTERVAL '1 hour'),
        (SELECT COUNT(*) FROM page_views WHERE created_at::DATE = CURRENT_DATE);
END;
$$ LANGUAGE plpgsql;

-- 44. 获取用户增长统计
CREATE OR REPLACE FUNCTION get_user_growth_stats(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    new_users BIGINT,
    total_users BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        created_at::DATE as date,
        COUNT(*) as new_users,
        SUM(COUNT(*)) OVER (ORDER BY created_at::DATE) as total_users
    FROM users
    WHERE created_at > NOW() - INTERVAL '1 day' * p_days
    GROUP BY created_at::DATE
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- 45. 获取内容增长统计
CREATE OR REPLACE FUNCTION get_content_growth_stats(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    new_works BIGINT,
    new_posts BIGINT,
    total_content BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COALESCE(w.date, p.date) as date,
        COALESCE(w.count, 0) as new_works,
        COALESCE(p.count, 0) as new_posts,
        COALESCE(w.count, 0) + COALESCE(p.count, 0) as total_content
    FROM (
        SELECT created_at::DATE as date, COUNT(*) as count
        FROM works
        WHERE created_at > NOW() - INTERVAL '1 day' * p_days
        GROUP BY created_at::DATE
    ) w
    FULL OUTER JOIN (
        SELECT created_at::DATE as date, COUNT(*) as count
        FROM posts
        WHERE created_at > NOW() - INTERVAL '1 day' * p_days
        GROUP BY created_at::DATE
    ) p ON w.date = p.date
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

-- 46. 获取参与度统计
CREATE OR REPLACE FUNCTION get_engagement_stats(p_days INTEGER DEFAULT 30)
RETURNS TABLE (
    date DATE,
    likes BIGINT,
    comments BIGINT,
    shares BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        created_at::DATE as date,
        COUNT(*) FILTER (WHERE table_name = 'likes') as likes,
        COUNT(*) FILTER (WHERE table_name = 'comments') as comments,
        COUNT(*) FILTER (WHERE table_name = 'shares') as shares
    FROM (
        SELECT created_at, 'likes' as table_name FROM likes WHERE created_at > NOW() - INTERVAL '1 day' * p_days
        UNION ALL
        SELECT created_at, 'comments' as table_name FROM comments WHERE created_at > NOW() - INTERVAL '1 day' * p_days
        UNION ALL
        SELECT created_at, 'shares' as table_name FROM work_shares WHERE created_at > NOW() - INTERVAL '1 day' * p_days
    ) combined
    GROUP BY created_at::DATE
    ORDER BY date;
END;
$$ LANGUAGE plpgsql;

SELECT '缺失的 RPC 函数创建完成!' as result;
