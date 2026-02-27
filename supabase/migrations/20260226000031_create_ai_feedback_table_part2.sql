-- 这部分需要在 Supabase Dashboard 的 SQL Editor 中手动执行
-- 因为包含 RLS 策略和函数，无法通过 HTTP API 执行

-- 启用RLS
ALTER TABLE ai_feedback ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 用户可以查看自己的反馈
DROP POLICY IF EXISTS "Users can view own feedback" ON ai_feedback;
CREATE POLICY "Users can view own feedback"
    ON ai_feedback FOR SELECT
    USING (user_id = auth.uid());

-- 用户可以创建自己的反馈
DROP POLICY IF EXISTS "Users can create own feedback" ON ai_feedback;
CREATE POLICY "Users can create own feedback"
    ON ai_feedback FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 管理员可以查看所有反馈
DROP POLICY IF EXISTS "Admins can view all feedback" ON ai_feedback;
CREATE POLICY "Admins can view all feedback"
    ON ai_feedback FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM admin_accounts
            WHERE admin_accounts.id = auth.uid()
        )
    );

-- 管理员可以更新反馈（标记已读等）
DROP POLICY IF EXISTS "Admins can update feedback" ON ai_feedback;
CREATE POLICY "Admins can update feedback"
    ON ai_feedback FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM admin_accounts
            WHERE admin_accounts.id = auth.uid()
        )
    );

-- 创建触发器：自动更新 updated_at
DROP TRIGGER IF EXISTS update_ai_feedback_updated_at ON ai_feedback;
CREATE TRIGGER update_ai_feedback_updated_at
    BEFORE UPDATE ON ai_feedback
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建获取AI反馈统计数据的函数
CREATE OR REPLACE FUNCTION get_ai_feedback_stats(
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE (
    total_count BIGINT,
    avg_rating NUMERIC,
    unread_count BIGINT,
    rating_5_count BIGINT,
    rating_4_count BIGINT,
    rating_3_count BIGINT,
    rating_2_count BIGINT,
    rating_1_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        COUNT(*)::BIGINT as total_count,
        COALESCE(AVG(rating), 0)::NUMERIC as avg_rating,
        COUNT(*) FILTER (WHERE is_read = false)::BIGINT as unread_count,
        COUNT(*) FILTER (WHERE rating = 5)::BIGINT as rating_5_count,
        COUNT(*) FILTER (WHERE rating = 4)::BIGINT as rating_4_count,
        COUNT(*) FILTER (WHERE rating = 3)::BIGINT as rating_3_count,
        COUNT(*) FILTER (WHERE rating = 2)::BIGINT as rating_2_count,
        COUNT(*) FILTER (WHERE rating = 1)::BIGINT as rating_1_count
    FROM ai_feedback
    WHERE (p_start_date IS NULL OR created_at >= p_start_date)
      AND (p_end_date IS NULL OR created_at <= p_end_date);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取AI反馈列表的函数（带分页和筛选）
CREATE OR REPLACE FUNCTION get_ai_feedback_list(
    p_rating INTEGER DEFAULT NULL,
    p_feedback_type TEXT DEFAULT NULL,
    p_is_read BOOLEAN DEFAULT NULL,
    p_search_query TEXT DEFAULT NULL,
    p_start_date TIMESTAMPTZ DEFAULT NULL,
    p_end_date TIMESTAMPTZ DEFAULT NULL,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    user_name TEXT,
    user_avatar TEXT,
    session_id TEXT,
    conversation_id UUID,
    message_id UUID,
    rating INTEGER,
    feedback_type TEXT,
    comment TEXT,
    ai_model TEXT,
    ai_response TEXT,
    user_query TEXT,
    created_at TIMESTAMPTZ,
    is_read BOOLEAN,
    tags TEXT[],
    total_count BIGINT
) AS $$
DECLARE
    v_total_count BIGINT;
BEGIN
    -- 计算总数
    SELECT COUNT(*) INTO v_total_count
    FROM ai_feedback f
    WHERE (p_rating IS NULL OR f.rating = p_rating)
      AND (p_feedback_type IS NULL OR f.feedback_type = p_feedback_type)
      AND (p_is_read IS NULL OR f.is_read = p_is_read)
      AND (p_start_date IS NULL OR f.created_at >= p_start_date)
      AND (p_end_date IS NULL OR f.created_at <= p_end_date)
      AND (
          p_search_query IS NULL 
          OR f.user_name ILIKE '%' || p_search_query || '%'
          OR f.comment ILIKE '%' || p_search_query || '%'
          OR f.user_query ILIKE '%' || p_search_query || '%'
      );

    RETURN QUERY
    SELECT
        f.id,
        f.user_id,
        f.user_name,
        f.user_avatar,
        f.session_id,
        f.conversation_id,
        f.message_id,
        f.rating,
        f.feedback_type,
        f.comment,
        f.ai_model,
        f.ai_response,
        f.user_query,
        f.created_at,
        f.is_read,
        f.tags,
        v_total_count as total_count
    FROM ai_feedback f
    WHERE (p_rating IS NULL OR f.rating = p_rating)
      AND (p_feedback_type IS NULL OR f.feedback_type = p_feedback_type)
      AND (p_is_read IS NULL OR f.is_read = p_is_read)
      AND (p_start_date IS NULL OR f.created_at >= p_start_date)
      AND (p_end_date IS NULL OR f.created_at <= p_end_date)
      AND (
          p_search_query IS NULL 
          OR f.user_name ILIKE '%' || p_search_query || '%'
          OR f.comment ILIKE '%' || p_search_query || '%'
          OR f.user_query ILIKE '%' || p_search_query || '%'
      )
    ORDER BY f.created_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建标记AI反馈为已读的函数
CREATE OR REPLACE FUNCTION mark_ai_feedback_as_read(
    p_feedback_id UUID,
    p_admin_id UUID DEFAULT NULL
)
RETURNS BOOLEAN AS $$
BEGIN
    UPDATE ai_feedback
    SET is_read = true,
        updated_at = NOW()
    WHERE id = p_feedback_id;
    
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
