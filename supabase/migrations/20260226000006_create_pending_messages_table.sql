-- 待发送消息表
-- 用于保存用户未发送的消息草稿，类似于微信的草稿功能
CREATE TABLE IF NOT EXISTS pending_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    context TEXT, -- 消息上下文，如页面路径、来源等
    metadata JSONB DEFAULT '{}', -- 额外元数据
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(user_id) -- 每个用户只有一条待发送消息
);

-- 添加RLS策略
ALTER TABLE pending_messages ENABLE ROW LEVEL SECURITY;

-- 用户只能查看自己的待发送消息
CREATE POLICY "用户只能查看自己的待发送消息"
    ON pending_messages
    FOR SELECT
    USING (user_id = auth.uid());

-- 用户只能插入自己的待发送消息
CREATE POLICY "用户只能插入自己的待发送消息"
    ON pending_messages
    FOR INSERT
    WITH CHECK (user_id = auth.uid());

-- 用户只能更新自己的待发送消息
CREATE POLICY "用户只能更新自己的待发送消息"
    ON pending_messages
    FOR UPDATE
    USING (user_id = auth.uid())
    WITH CHECK (user_id = auth.uid());

-- 用户只能删除自己的待发送消息
CREATE POLICY "用户只能删除自己的待发送消息"
    ON pending_messages
    FOR DELETE
    USING (user_id = auth.uid());

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_pending_messages_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_pending_messages_updated_at
    BEFORE UPDATE ON pending_messages
    FOR EACH ROW
    EXECUTE FUNCTION update_pending_messages_updated_at();

-- 创建索引
CREATE INDEX idx_pending_messages_user_id ON pending_messages(user_id);
CREATE INDEX idx_pending_messages_updated_at ON pending_messages(updated_at);

-- 添加注释
COMMENT ON TABLE pending_messages IS '用户待发送消息草稿表，类似于微信的草稿功能';
COMMENT ON COLUMN pending_messages.content IS '消息内容';
COMMENT ON COLUMN pending_messages.context IS '消息上下文，如页面路径、来源等';
COMMENT ON COLUMN pending_messages.metadata IS '额外元数据，JSON格式存储';
