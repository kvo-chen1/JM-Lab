-- 修复 ai_conversations 表结构
-- 添加缺失的 message_count 列

-- 检查并添加 message_count 列
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'ai_conversations' 
        AND column_name = 'message_count'
    ) THEN
        ALTER TABLE public.ai_conversations 
        ADD COLUMN message_count INTEGER DEFAULT 0;
        
        RAISE NOTICE 'Added message_count column to ai_conversations table';
    ELSE
        RAISE NOTICE 'message_count column already exists in ai_conversations table';
    END IF;
END $$;

-- 更新现有记录的 message_count（基于实际消息数量）
UPDATE public.ai_conversations c
SET message_count = (
    SELECT COUNT(*) 
    FROM public.ai_messages m 
    WHERE m.conversation_id = c.id
)
WHERE message_count IS NULL OR message_count = 0;

-- 重新创建 switch_user_conversation 函数
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
        COALESCE(c.message_count, 0) as message_count,
        c.metadata
    FROM ai_conversations c
    WHERE c.id = p_conversation_id
    AND c.user_id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建更新 message_count 的触发器函数
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE ai_conversations
        SET message_count = COALESCE(message_count, 0) + 1
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE ai_conversations
        SET message_count = GREATEST(COALESCE(message_count, 0) - 1, 0)
        WHERE id = OLD.conversation_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS trg_update_message_count ON public.ai_messages;

-- 创建新触发器
CREATE TRIGGER trg_update_message_count
AFTER INSERT OR DELETE ON public.ai_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_message_count();

-- 验证修复结果
SELECT 
    'ai_conversations table columns' as check_item,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'ai_conversations';

SELECT 
    column_name,
    data_type,
    column_default
FROM information_schema.columns 
WHERE table_name = 'ai_conversations'
ORDER BY ordinal_position;
