-- 添加 message_count 列到 ai_conversations 表
-- 如果列不存在则添加

DO $$
BEGIN
    -- 检查 message_count 列是否存在
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ai_conversations'
        AND column_name = 'message_count'
    ) THEN
        -- 添加列
        ALTER TABLE public.ai_conversations
        ADD COLUMN message_count integer DEFAULT 0;

        -- 添加注释
        COMMENT ON COLUMN public.ai_conversations.message_count IS '对话消息数量';

        -- 更新现有数据
        UPDATE public.ai_conversations
        SET message_count = 0
        WHERE message_count IS NULL;

        RAISE NOTICE 'message_count 列已添加';
    ELSE
        RAISE NOTICE 'message_count 列已存在';
    END IF;

    -- 检查 metadata 列是否存在
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ai_conversations'
        AND column_name = 'metadata'
    ) THEN
        -- 添加列
        ALTER TABLE public.ai_conversations
        ADD COLUMN metadata jsonb DEFAULT '{}'::jsonb;

        -- 添加注释
        COMMENT ON COLUMN public.ai_conversations.metadata IS '对话元数据';

        -- 更新现有数据
        UPDATE public.ai_conversations
        SET metadata = '{}'::jsonb
        WHERE metadata IS NULL;

        RAISE NOTICE 'metadata 列已添加';
    ELSE
        RAISE NOTICE 'metadata 列已存在';
    END IF;

    -- 检查 context_summary 列是否存在
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name = 'ai_conversations'
        AND column_name = 'context_summary'
    ) THEN
        -- 添加列
        ALTER TABLE public.ai_conversations
        ADD COLUMN context_summary text;

        -- 添加注释
        COMMENT ON COLUMN public.ai_conversations.context_summary IS '上下文摘要';

        RAISE NOTICE 'context_summary 列已添加';
    ELSE
        RAISE NOTICE 'context_summary 列已存在';
    END IF;
END $$;

-- 确保 RPC 函数存在且正确
CREATE OR REPLACE FUNCTION public.switch_user_conversation(
    p_user_id uuid,
    p_conversation_id uuid
) RETURNS TABLE(
    id uuid,
    user_id uuid,
    title text,
    model_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_active boolean,
    context_summary text,
    message_count integer,
    metadata jsonb
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
    -- 先将用户的所有对话设为非活跃
    UPDATE public.ai_conversations
    SET is_active = false
    WHERE ai_conversations.user_id = p_user_id;

    -- 将目标对话设为活跃
    UPDATE public.ai_conversations
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
    FROM public.ai_conversations c
    WHERE c.id = p_conversation_id
    AND c.user_id = p_user_id;
END;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION public.switch_user_conversation(uuid, uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.switch_user_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.switch_user_conversation(uuid, uuid) TO service_role;

-- 确保 get_user_conversations 函数也存在且正确
CREATE OR REPLACE FUNCTION public.get_user_conversations(
    p_user_id uuid,
    p_limit integer DEFAULT 20,
    p_offset integer DEFAULT 0
) RETURNS TABLE(
    id uuid,
    title text,
    model_id text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    is_active boolean,
    message_count integer,
    last_message text,
    last_message_time timestamp with time zone
)
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
    FROM public.ai_conversations c
    LEFT JOIN LATERAL (
        SELECT content, timestamp
        FROM public.ai_messages
        WHERE conversation_id = c.id
        ORDER BY timestamp DESC
        LIMIT 1
    ) m ON true
    WHERE c.user_id = p_user_id
    ORDER BY c.updated_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$;

-- 授予 get_user_conversations 执行权限
GRANT EXECUTE ON FUNCTION public.get_user_conversations(uuid, integer, integer) TO anon;
GRANT EXECUTE ON FUNCTION public.get_user_conversations(uuid, integer, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_conversations(uuid, integer, integer) TO service_role;

-- 创建/更新触发器函数：自动更新 message_count
CREATE OR REPLACE FUNCTION public.update_conversation_message_count()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.ai_conversations
        SET message_count = message_count + 1,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.ai_conversations
        SET message_count = message_count - 1,
            updated_at = NOW()
        WHERE id = OLD.conversation_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$;

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS update_message_count ON public.ai_messages;

-- 创建触发器
CREATE TRIGGER update_message_count
    AFTER INSERT OR DELETE ON public.ai_messages
    FOR EACH ROW
    EXECUTE FUNCTION public.update_conversation_message_count();

-- 授予触发器函数执行权限
GRANT EXECUTE ON FUNCTION public.update_conversation_message_count() TO anon;
GRANT EXECUTE ON FUNCTION public.update_conversation_message_count() TO authenticated;
GRANT EXECUTE ON FUNCTION public.update_conversation_message_count() TO service_role;
