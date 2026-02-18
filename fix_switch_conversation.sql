-- 修复 switch_user_conversation 函数
CREATE OR REPLACE FUNCTION switch_user_conversation(
    p_user_id UUID,
    p_conversation_id UUID
)
RETURNS TABLE (
    id UUID,
    user_id UUID,
    title TEXT,
    model_id TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    is_active BOOLEAN,
    context_summary TEXT,
    message_count INTEGER,
    metadata JSONB
) AS $$
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
$$ LANGUAGE plpgsql SECURITY DEFINER;
