-- 创建举报表
CREATE TABLE IF NOT EXISTS reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reporter_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    target_type VARCHAR(20) NOT NULL CHECK (target_type IN ('feed', 'comment', 'user', 'work')),
    target_id UUID NOT NULL,
    target_author_id UUID REFERENCES users(id) ON DELETE SET NULL,
    report_type VARCHAR(30) NOT NULL CHECK (report_type IN ('spam', 'provocative', 'pornographic', 'personal_attack', 'illegal', 'political_rumor', 'social_rumor', 'false_info', 'external_link', 'other')),
    description TEXT,
    screenshots JSONB DEFAULT '[]'::jsonb,
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'resolved', 'rejected')),
    admin_id UUID REFERENCES users(id) ON DELETE SET NULL,
    admin_response TEXT,
    action_taken VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    resolved_at TIMESTAMP WITH TIME ZONE
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_reports_reporter_id ON reports(reporter_id);
CREATE INDEX IF NOT EXISTS idx_reports_target_type_target_id ON reports(target_type, target_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);
CREATE INDEX IF NOT EXISTS idx_reports_report_type ON reports(report_type);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON reports(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_target_author_id ON reports(target_author_id);

-- 创建唯一索引，防止重复举报
CREATE UNIQUE INDEX IF NOT EXISTS idx_reports_unique ON reports(reporter_id, target_type, target_id);

-- 添加表注释
COMMENT ON TABLE reports IS '用户举报表，存储所有用户举报记录';
COMMENT ON COLUMN reports.reporter_id IS '举报人ID';
COMMENT ON COLUMN reports.target_type IS '举报目标类型：feed-动态, comment-评论, user-用户, work-作品';
COMMENT ON COLUMN reports.target_id IS '举报目标ID';
COMMENT ON COLUMN reports.target_author_id IS '被举报内容作者ID';
COMMENT ON COLUMN reports.report_type IS '举报类型';
COMMENT ON COLUMN reports.description IS '举报详细描述';
COMMENT ON COLUMN reports.screenshots IS '举报截图URL数组';
COMMENT ON COLUMN reports.status IS '举报状态：pending-待处理, processing-处理中, resolved-已处理, rejected-已驳回';
COMMENT ON COLUMN reports.admin_id IS '处理该举报的管理员ID';
COMMENT ON COLUMN reports.admin_response IS '管理员处理回复';
COMMENT ON COLUMN reports.action_taken IS '处理措施：none-暂不处理, warn-警告, delete_content-删除内容, ban_user-封禁用户, ban_temp-临时封禁';

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_reports_updated_at ON reports;
CREATE TRIGGER update_reports_updated_at
    BEFORE UPDATE ON reports
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 设置 RLS 策略
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Users can create their own reports" ON reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON reports;
DROP POLICY IF EXISTS "Admins can view all reports" ON reports;
DROP POLICY IF EXISTS "Admins can update reports" ON reports;
DROP POLICY IF EXISTS "Admins can delete reports" ON reports;

-- 创建新的 RLS 策略
-- 用户只能创建自己的举报
CREATE POLICY "Users can create their own reports"
    ON reports FOR INSERT
    WITH CHECK (auth.uid() = reporter_id);

-- 用户只能查看自己的举报
CREATE POLICY "Users can view their own reports"
    ON reports FOR SELECT
    USING (auth.uid() = reporter_id);

-- 管理员可以查看所有举报
CREATE POLICY "Admins can view all reports"
    ON reports FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- 管理员可以更新所有举报
CREATE POLICY "Admins can update reports"
    ON reports FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );

-- 管理员可以删除举报
CREATE POLICY "Admins can delete reports"
    ON reports FOR DELETE
    USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.role = 'admin'
        )
    );
