-- 创建主办方设置表
CREATE TABLE IF NOT EXISTS organizer_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES brand_partnerships(id) ON DELETE CASCADE,
    brand_info JSONB DEFAULT '{}'::jsonb,
    security_settings JSONB DEFAULT '{}'::jsonb,
    notification_settings JSONB DEFAULT '{}'::jsonb,
    permission_settings JSONB DEFAULT '{}'::jsonb,
    data_management_settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organizer_id)
);

-- 创建主办方备份记录表
CREATE TABLE IF NOT EXISTS organizer_backups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organizer_id UUID NOT NULL REFERENCES brand_partnerships(id) ON DELETE CASCADE,
    type VARCHAR(20) NOT NULL DEFAULT 'manual', -- manual, auto
    size BIGINT DEFAULT 0,
    file_path TEXT,
    download_url TEXT,
    expires_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_organizer_settings_updated_at ON organizer_settings;
CREATE TRIGGER update_organizer_settings_updated_at
    BEFORE UPDATE ON organizer_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用RLS
ALTER TABLE organizer_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizer_backups ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 主办方设置表策略
CREATE POLICY "Allow organizers to read own settings"
    ON organizer_settings
    FOR SELECT
    TO authenticated
    USING (
        organizer_id IN (
            SELECT id FROM brand_partnerships 
            WHERE applicant_id = auth.uid() 
            AND status = 'approved'
        )
    );

CREATE POLICY "Allow organizers to update own settings"
    ON organizer_settings
    FOR UPDATE
    TO authenticated
    USING (
        organizer_id IN (
            SELECT id FROM brand_partnerships 
            WHERE applicant_id = auth.uid() 
            AND status = 'approved'
        )
    )
    WITH CHECK (
        organizer_id IN (
            SELECT id FROM brand_partnerships 
            WHERE applicant_id = auth.uid() 
            AND status = 'approved'
        )
    );

CREATE POLICY "Allow organizers to insert own settings"
    ON organizer_settings
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organizer_id IN (
            SELECT id FROM brand_partnerships 
            WHERE applicant_id = auth.uid() 
            AND status = 'approved'
        )
    );

-- 备份记录表策略
CREATE POLICY "Allow organizers to read own backups"
    ON organizer_backups
    FOR SELECT
    TO authenticated
    USING (
        organizer_id IN (
            SELECT id FROM brand_partnerships 
            WHERE applicant_id = auth.uid() 
            AND status = 'approved'
        )
    );

CREATE POLICY "Allow organizers to create own backups"
    ON organizer_backups
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organizer_id IN (
            SELECT id FROM brand_partnerships 
            WHERE applicant_id = auth.uid() 
            AND status = 'approved'
        )
    );

CREATE POLICY "Allow organizers to delete own backups"
    ON organizer_backups
    FOR DELETE
    TO authenticated
    USING (
        organizer_id IN (
            SELECT id FROM brand_partnerships 
            WHERE applicant_id = auth.uid() 
            AND status = 'approved'
        )
    );

-- 管理员可以访问所有记录
CREATE POLICY "Allow admin full access to organizer_settings"
    ON organizer_settings
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

CREATE POLICY "Allow admin full access to organizer_backups"
    ON organizer_backups
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE id = auth.uid() 
            AND is_admin = true
        )
    );

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_organizer_settings_organizer_id ON organizer_settings(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_backups_organizer_id ON organizer_backups(organizer_id);
CREATE INDEX IF NOT EXISTS idx_organizer_backups_created_at ON organizer_backups(created_at DESC);

-- 创建清理过期备份的函数
CREATE OR REPLACE FUNCTION cleanup_expired_backups()
RETURNS void AS $$
BEGIN
    DELETE FROM organizer_backups 
    WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- 创建RPC函数：创建备份
CREATE OR REPLACE FUNCTION create_organizer_backup(p_organizer_id UUID)
RETURNS JSONB AS $$
DECLARE
    v_backup_id UUID;
    v_download_url TEXT;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- 生成备份ID
    v_backup_id := gen_random_uuid();
    
    -- 设置过期时间（30天后）
    v_expires_at := NOW() + INTERVAL '30 days';
    
    -- 生成下载URL（实际项目中应该使用安全的签名URL）
    v_download_url := '/api/backups/' || v_backup_id::text;
    
    -- 插入备份记录
    INSERT INTO organizer_backups (
        id,
        organizer_id,
        type,
        size,
        download_url,
        expires_at
    ) VALUES (
        v_backup_id,
        p_organizer_id,
        'manual',
        0, -- 实际大小应该在备份完成后更新
        v_download_url,
        v_expires_at
    );
    
    -- 返回备份信息
    RETURN jsonb_build_object(
        'id', v_backup_id,
        'created_at', NOW(),
        'expires_at', v_expires_at,
        'download_url', v_download_url,
        'size', 0
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建RPC函数：导出数据
CREATE OR REPLACE FUNCTION export_organizer_data(
    p_organizer_id UUID,
    p_type TEXT,
    p_format TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_export_id UUID;
    v_download_url TEXT;
BEGIN
    -- 生成导出ID
    v_export_id := gen_random_uuid();
    
    -- 生成下载URL
    v_download_url := '/api/exports/' || v_export_id::text || '.' || p_format;
    
    -- 返回导出信息
    RETURN jsonb_build_object(
        'id', v_export_id,
        'download_url', v_download_url,
        'created_at', NOW()
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON TABLE organizer_settings IS '主办方设置表，存储品牌信息、安全设置、通知偏好等';
COMMENT ON TABLE organizer_backups IS '主办方数据备份记录表';
COMMENT ON COLUMN organizer_settings.brand_info IS '品牌信息，包含名称、Logo、描述、联系方式等';
COMMENT ON COLUMN organizer_settings.security_settings IS '安全设置，包含双因素认证、登录通知、会话超时等';
COMMENT ON COLUMN organizer_settings.notification_settings IS '通知设置，包含邮件、站内信、短信通知配置';
COMMENT ON COLUMN organizer_settings.permission_settings IS '权限设置，包含团队成员和角色配置';
COMMENT ON COLUMN organizer_settings.data_management_settings IS '数据管理设置，包含自动备份、导出格式等';
