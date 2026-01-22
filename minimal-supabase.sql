-- 极简版数据库脚本：只包含必要的表创建和数据插入
-- 不包含RLS策略，避免复杂的权限问题

-- 1. 创建communities表（基础表）
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

-- 2. 创建users表（基础表）
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
    membership_level VARCHAR(20) DEFAULT 'free' CHECK (membership_level IN ('free', 'premium', 'vip')),
    membership_start TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    membership_end TIMESTAMP WITH TIME ZONE,
    membership_status VARCHAR(20) DEFAULT 'active' CHECK (membership_status IN ('active', 'expired', 'pending')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 创建community_members表
CREATE TABLE IF NOT EXISTS community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR(50) REFERENCES communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
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
    mode VARCHAR(20) CHECK (mode IN ('style', 'topic')),
    selected_value VARCHAR(50),
    upvotes INTEGER DEFAULT 0,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 创建必要的索引
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_posts_community_id ON posts(community_id);

-- 6. 插入会员权益数据
CREATE TABLE IF NOT EXISTS membership_benefits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    membership_level VARCHAR(20) CHECK (membership_level IN ('free', 'premium', 'vip')),
    benefit TEXT NOT NULL,
    sort_order INTEGER DEFAULT 0,
    UNIQUE(membership_level, benefit)
);

INSERT INTO membership_benefits (membership_level, benefit, sort_order) VALUES
('free', '基础AI创作功能', 1),
('free', '每天限量生成次数', 2),
('free', '基础社区功能', 3),
('free', '基础作品存储', 4),
('premium', '无限AI生成次数', 1),
('premium', '高级AI模型访问', 2),
('premium', '高清作品导出', 3),
('premium', '优先处理队列', 4),
('premium', '专属模板库', 5),
('premium', '去除水印', 6),
('vip', '无限AI生成次数', 1),
('vip', '高级AI模型访问', 2),
('vip', '高清作品导出', 3),
('vip', '优先处理队列', 4),
('vip', '专属模板库', 5),
('vip', '去除水印', 6),
('vip', '专属AI训练模型', 7),
('vip', '一对一设计师服务', 8),
('vip', '商业授权', 9),
('vip', '专属活动邀请', 10)
ON CONFLICT (membership_level, benefit) DO NOTHING;

-- 7. 插入推荐社群数据
INSERT INTO communities (id, name, description, cover, tags, members_count) VALUES
('c-guochao', '国潮设计社群', '讨论国潮视觉、品牌联名与配色体系', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Guochao%20design%20community%20banner', ARRAY['国潮', '联名', '品牌'], 1286),
('c-heritage', '非遗数字化社群', '分享非遗数字化案例与教育传播', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Intangible%20heritage%20digital%20community%20banner', ARRAY['非遗', '教育', '海报'], 986),
('c-ip', 'IP联名与授权', '围绕IP设计与商业授权的合作讨论', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=IP%20collaboration%20and%20licensing%20community%20banner', ARRAY['IP', '联名', '授权'], 742),
('c-peking-opera', '京剧视觉社群', '京剧元素的现代视觉化与海报设计讨论', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Peking%20opera%20visual%20community%20banner%2C%20bold%20graphics', ARRAY['京剧', '戏曲', '海报'], 812),
('c-jingdezhen', '景德镇陶瓷文创社群', '蓝白瓷与陶瓷文创的设计分享与交流', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1920x1080&prompt=Jingdezhen%20ceramics%20community%20banner%2C%20blue%20and%20white', ARRAY['景德镇', '陶瓷', '文创'], 654)
ON CONFLICT (id) DO NOTHING;
