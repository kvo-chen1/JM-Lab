-- 创建作品分享表
-- 用于存储用户之间分享作品的记录

CREATE TABLE IF NOT EXISTS work_shares (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sender_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    receiver_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    work_id UUID NOT NULL,
    work_title TEXT NOT NULL,
    work_thumbnail TEXT,
    work_type TEXT,
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    read_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_work_shares_sender_id ON work_shares(sender_id);
CREATE INDEX IF NOT EXISTS idx_work_shares_receiver_id ON work_shares(receiver_id);
CREATE INDEX IF NOT EXISTS idx_work_shares_work_id ON work_shares(work_id);
CREATE INDEX IF NOT EXISTS idx_work_shares_created_at ON work_shares(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_work_shares_is_read ON work_shares(is_read) WHERE is_read = FALSE;

-- 添加复合索引用于常见查询场景
CREATE INDEX IF NOT EXISTS idx_work_shares_receiver_read ON work_shares(receiver_id, is_read, created_at DESC);

-- 启用行级安全策略
ALTER TABLE work_shares ENABLE ROW LEVEL SECURITY;

-- 创建行级安全策略
-- 用户只能查看自己发送或接收的分享记录
CREATE POLICY "Users can view their own work shares"
    ON work_shares
    FOR SELECT
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 用户只能插入自己发送的分享
CREATE POLICY "Users can create their own work shares"
    ON work_shares
    FOR INSERT
    WITH CHECK (auth.uid() = sender_id);

-- 用户只能更新自己接收的分享（标记已读）
CREATE POLICY "Users can update received work shares"
    ON work_shares
    FOR UPDATE
    USING (auth.uid() = receiver_id)
    WITH CHECK (auth.uid() = receiver_id);

-- 用户只能删除自己发送或接收的分享
CREATE POLICY "Users can delete their own work shares"
    ON work_shares
    FOR DELETE
    USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- 添加表注释
COMMENT ON TABLE work_shares IS '存储用户之间分享作品的记录';
COMMENT ON COLUMN work_shares.sender_id IS '分享发送者ID';
COMMENT ON COLUMN work_shares.receiver_id IS '分享接收者ID';
COMMENT ON COLUMN work_shares.work_id IS '被分享的作品ID';
COMMENT ON COLUMN work_shares.work_title IS '作品标题（冗余存储，防止作品删除后信息丢失）';
COMMENT ON COLUMN work_shares.work_thumbnail IS '作品缩略图URL';
COMMENT ON COLUMN work_shares.work_type IS '作品类型';
COMMENT ON COLUMN work_shares.message IS '附言消息';
COMMENT ON COLUMN work_shares.is_read IS '是否已读';
COMMENT ON COLUMN work_shares.created_at IS '分享时间';
COMMENT ON COLUMN work_shares.read_at IS '阅读时间';
