-- 删除现有函数
DROP FUNCTION IF EXISTS get_user_conversations(UUID, INTEGER, INTEGER);

-- 创建新函数
CREATE OR REPLACE FUNCTION get_user_conversations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    model_id TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_active BOOLEAN,
    message_count INTEGER,
    last_message TEXT,
    last_message_time TIMESTAMPTZ
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
