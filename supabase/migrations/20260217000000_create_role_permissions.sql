-- 创建角色表
CREATE TABLE IF NOT EXISTS admin_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(50) NOT NULL UNIQUE,
    description TEXT,
    permissions JSONB NOT NULL DEFAULT '[]'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建管理员账号表
CREATE TABLE IF NOT EXISTS admin_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role_id UUID REFERENCES admin_roles(id) ON DELETE SET NULL,
    username VARCHAR(50) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(20),
    avatar_url TEXT,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    last_login_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- 创建操作日志表
CREATE TABLE IF NOT EXISTS admin_operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID REFERENCES admin_accounts(id) ON DELETE SET NULL,
    action VARCHAR(50) NOT NULL,
    resource_type VARCHAR(50) NOT NULL,
    resource_id TEXT,
    details JSONB,
    ip_address INET,
    user_agent TEXT,
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

DROP TRIGGER IF EXISTS update_admin_roles_updated_at ON admin_roles;
CREATE TRIGGER update_admin_roles_updated_at
    BEFORE UPDATE ON admin_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_admin_accounts_updated_at ON admin_accounts;
CREATE TRIGGER update_admin_accounts_updated_at
    BEFORE UPDATE ON admin_accounts
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 启用RLS
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_operation_logs ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "允许管理员查看角色" ON admin_roles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_accounts
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "允许超级管理员管理角色" ON admin_roles
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_accounts aa
            JOIN admin_roles ar ON aa.role_id = ar.id
            WHERE aa.user_id = auth.uid()
            AND aa.status = 'active'
            AND ar.permissions @> '[{"permission": "role:manage"}]'::jsonb
        )
    );

CREATE POLICY "允许管理员查看管理员账号" ON admin_accounts
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_accounts
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

CREATE POLICY "允许超级管理员管理管理员账号" ON admin_accounts
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM admin_accounts aa
            JOIN admin_roles ar ON aa.role_id = ar.id
            WHERE aa.user_id = auth.uid()
            AND aa.status = 'active'
            AND ar.permissions @> '[{"permission": "admin:manage"}]'::jsonb
        )
    );

CREATE POLICY "允许管理员查看操作日志" ON admin_operation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM admin_accounts
            WHERE user_id = auth.uid() AND status = 'active'
        )
    );

-- 插入默认角色
INSERT INTO admin_roles (name, description, permissions) VALUES
('super_admin', '超级管理员', '[
    {"permission": "dashboard:view", "name": "查看控制台"},
    {"permission": "users:manage", "name": "管理用户"},
    {"permission": "works:audit", "name": "审核作品"},
    {"permission": "events:manage", "name": "管理活动"},
    {"permission": "analytics:view", "name": "查看数据分析"},
    {"permission": "brand:manage", "name": "管理品牌合作"},
    {"permission": "creators:manage", "name": "管理创作者"},
    {"permission": "orders:manage", "name": "管理订单"},
    {"permission": "role:manage", "name": "管理角色"},
    {"permission": "admin:manage", "name": "管理管理员账号"},
    {"permission": "settings:manage", "name": "管理系统设置"},
    {"permission": "content:moderate", "name": "内容审核"},
    {"permission": "logs:view", "name": "查看操作日志"}
]'::jsonb),
('admin', '管理员', '[
    {"permission": "dashboard:view", "name": "查看控制台"},
    {"permission": "users:view", "name": "查看用户"},
    {"permission": "works:audit", "name": "审核作品"},
    {"permission": "events:view", "name": "查看活动"},
    {"permission": "analytics:view", "name": "查看数据分析"},
    {"permission": "brand:view", "name": "查看品牌合作"},
    {"permission": "creators:view", "name": "查看创作者"},
    {"permission": "orders:view", "name": "查看订单"},
    {"permission": "content:moderate", "name": "内容审核"}
]'::jsonb),
('moderator', '审核员', '[
    {"permission": "dashboard:view", "name": "查看控制台"},
    {"permission": "works:audit", "name": "审核作品"},
    {"permission": "content:moderate", "name": "内容审核"},
    {"permission": "orders:view", "name": "查看订单"}
]'::jsonb),
('operator', '运营', '[
    {"permission": "dashboard:view", "name": "查看控制台"},
    {"permission": "users:view", "name": "查看用户"},
    {"permission": "events:manage", "name": "管理活动"},
    {"permission": "analytics:view", "name": "查看数据分析"},
    {"permission": "brand:view", "name": "查看品牌合作"},
    {"permission": "creators:view", "name": "查看创作者"},
    {"permission": "orders:manage", "name": "管理订单"}
]'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- 创建获取管理员权限的函数
CREATE OR REPLACE FUNCTION get_admin_permissions(admin_user_id UUID)
RETURNS JSONB AS $$
DECLARE
    perms JSONB;
BEGIN
    SELECT ar.permissions INTO perms
    FROM admin_accounts aa
    JOIN admin_roles ar ON aa.role_id = ar.id
    WHERE aa.user_id = admin_user_id AND aa.status = 'active';
    
    RETURN COALESCE(perms, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建检查权限的函数
CREATE OR REPLACE FUNCTION check_admin_permission(admin_user_id UUID, required_permission TEXT)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM admin_accounts aa
        JOIN admin_roles ar ON aa.role_id = ar.id
        WHERE aa.user_id = admin_user_id
        AND aa.status = 'active'
        AND ar.permissions @> jsonb_build_array(jsonb_build_object('permission', required_permission))
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建记录操作日志的函数
CREATE OR REPLACE FUNCTION log_admin_operation(
    p_admin_id UUID,
    p_action VARCHAR,
    p_resource_type VARCHAR,
    p_resource_id TEXT DEFAULT NULL,
    p_details JSONB DEFAULT NULL
)
RETURNS UUID AS $$
DECLARE
    log_id UUID;
BEGIN
    INSERT INTO admin_operation_logs (admin_id, action, resource_type, resource_id, details)
    VALUES (p_admin_id, p_action, p_resource_type, p_resource_id, p_details)
    RETURNING id INTO log_id;
    
    RETURN log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
