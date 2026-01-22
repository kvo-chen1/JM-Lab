-- 测试脚本：检查community_id字段是否存在

-- 1. 先创建必要的基础表
CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover TEXT,
    tags TEXT[],
    members_count INTEGER DEFAULT 0,
    privacy VARCHAR(20) DEFAULT 'public' CHECK (privacy IN ('public', 'private')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 检查communities表是否创建成功
SELECT * FROM communities LIMIT 1;

-- 3. 检查表结构，确认id字段存在
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'communities';

-- 4. 尝试创建依赖表
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR(50) REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    UNIQUE(community_id, user_id)
);

-- 5. 检查community_members表结构
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'community_members';
