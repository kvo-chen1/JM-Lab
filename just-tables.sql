-- 纯表创建脚本：只包含表结构，不包含索引、数据插入或RLS策略

-- 1. 创建communities表
CREATE TABLE IF NOT EXISTS communities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover TEXT,
    tags TEXT[],
    members_count INTEGER DEFAULT 0,
    privacy VARCHAR(20) DEFAULT 'public',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建users表
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    avatar TEXT,
    phone VARCHAR(20),
    interests TEXT[],
    is_admin BOOLEAN DEFAULT FALSE,
    age INTEGER,
    tags TEXT[],
    membership_level VARCHAR(20) DEFAULT 'free',
    membership_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    membership_end TIMESTAMP WITH TIME ZONE,
    membership_status VARCHAR(20) DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建community_members表
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR(50) REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    UNIQUE(community_id, user_id)
);

-- 4. 创建posts表
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    community_id VARCHAR(50) REFERENCES communities(id) ON DELETE CASCADE,
    topic VARCHAR(50),
    mode VARCHAR(20),
    selected_value VARCHAR(50),
    upvotes INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建messages表
CREATE TABLE IF NOT EXISTS messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR(50) REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    avatar TEXT,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 创建membership_benefits表
CREATE TABLE IF NOT EXISTS membership_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_level VARCHAR(20),
    benefit TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(membership_level, benefit)
);

-- 验证表创建成功
SELECT '所有表创建完成' AS status;
