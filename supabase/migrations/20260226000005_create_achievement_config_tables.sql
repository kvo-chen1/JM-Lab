-- 成就配置表
-- 用于存储管理员配置的成就定义
CREATE TABLE IF NOT EXISTS achievement_configs (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    description TEXT NOT NULL,
    icon VARCHAR(50) NOT NULL DEFAULT 'star',
    rarity VARCHAR(20) NOT NULL CHECK (rarity IN ('common', 'rare', 'epic', 'legendary')),
    category VARCHAR(20) NOT NULL CHECK (category IN ('creation', 'community', 'special')),
    criteria TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 创作者等级配置表
-- 用于存储创作者等级体系配置
CREATE TABLE IF NOT EXISTS creator_level_configs (
    id SERIAL PRIMARY KEY,
    level INTEGER NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    required_points INTEGER NOT NULL DEFAULT 0,
    benefits TEXT[] NOT NULL DEFAULT '{}',
    description TEXT NOT NULL,
    color VARCHAR(20),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 添加RLS策略
ALTER TABLE achievement_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE creator_level_configs ENABLE ROW LEVEL SECURITY;

-- 所有人可以读取活跃的成就配置
CREATE POLICY "任何人可以读取成就配置"
    ON achievement_configs
    FOR SELECT
    USING (is_active = true);

-- 所有人可以读取活跃的等级配置
CREATE POLICY "任何人可以读取等级配置"
    ON creator_level_configs
    FOR SELECT
    USING (is_active = true);

-- 只有管理员可以修改成就配置
CREATE POLICY "只有管理员可以修改成就配置"
    ON achievement_configs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- 只有管理员可以修改等级配置
CREATE POLICY "只有管理员可以修改等级配置"
    ON creator_level_configs
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM users 
            WHERE users.id = auth.uid() 
            AND users.role IN ('admin', 'super_admin')
        )
    );

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_achievement_configs_updated_at
    BEFORE UPDATE ON achievement_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_creator_level_configs_updated_at
    BEFORE UPDATE ON creator_level_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建索引
CREATE INDEX idx_achievement_configs_is_active ON achievement_configs(is_active);
CREATE INDEX idx_achievement_configs_category ON achievement_configs(category);
CREATE INDEX idx_achievement_configs_rarity ON achievement_configs(rarity);
CREATE INDEX idx_creator_level_configs_is_active ON creator_level_configs(is_active);
CREATE INDEX idx_creator_level_configs_level ON creator_level_configs(level);

-- 插入默认成就配置
INSERT INTO achievement_configs (id, name, description, icon, rarity, category, criteria, points, is_active)
VALUES 
    (1, '初次创作', '完成第一篇创作作品', 'star', 'common', 'creation', '完成1篇作品', 10, true),
    (2, '活跃创作者', '连续7天登录平台', 'fire', 'common', 'community', '连续登录7天', 20, true),
    (3, '人气王', '获得100个点赞', 'thumbs-up', 'rare', 'community', '获得100个点赞', 50, true),
    (4, '文化传播者', '使用5种不同文化元素', 'book', 'rare', 'creation', '使用5种不同文化元素', 40, true),
    (5, '作品达人', '发布10篇作品', 'image', 'rare', 'creation', '发布10篇作品', 80, true),
    (6, '商业成功', '作品被品牌采纳', 'handshake', 'epic', 'special', '作品被品牌采纳1次', 200, true),
    (7, '传统文化大师', '精通传统文化知识', 'graduation-cap', 'legendary', 'special', '完成10个文化知识问答', 300, true),
    (8, '创作新手', '发布3篇作品', 'pen-tool', 'common', 'creation', '发布3篇作品', 15, true),
    (9, '多产作者', '发布50篇作品', 'layers', 'rare', 'creation', '发布50篇作品', 100, true),
    (10, '创作狂人', '发布100篇作品', 'zap', 'epic', 'creation', '发布100篇作品', 200, true),
    (11, '创作传奇', '发布500篇作品', 'crown', 'legendary', 'creation', '发布500篇作品', 1000, true),
    (12, '点赞新手', '获得10个点赞', 'heart', 'common', 'community', '获得10个点赞', 10, true),
    (13, '受欢迎', '获得500个点赞', 'award', 'rare', 'community', '获得500个点赞', 80, true),
    (14, '超级明星', '获得1000个点赞', 'star', 'epic', 'community', '获得1000个点赞', 150, true),
    (15, '评论达人', '发表评论50次', 'message-circle', 'rare', 'community', '发表评论50次', 60, true),
    (16, '收藏专家', '收藏100个作品', 'bookmark', 'rare', 'community', '收藏100个作品', 70, true),
    (17, '分享大使', '分享作品30次', 'share-2', 'rare', 'community', '分享作品30次', 50, true),
    (18, '坚持就是胜利', '连续登录30天', 'calendar', 'rare', 'community', '连续登录30天', 100, true),
    (19, '忠实用户', '连续登录100天', 'calendar-check', 'epic', 'community', '连续登录100天', 300, true),
    (20, '年度用户', '连续登录365天', 'calendar-days', 'legendary', 'community', '连续登录365天', 1000, true),
    (21, 'AI探索者', '使用AI生成10张图片', 'cpu', 'common', 'creation', '使用AI生成10张图片', 20, true),
    (22, 'AI创作者', '使用AI生成100张图片', 'sparkles', 'rare', 'creation', '使用AI生成100张图片', 100, true),
    (23, '视频创作者', '发布10个视频作品', 'video', 'rare', 'creation', '发布10个视频作品', 80, true),
    (24, '视频大师', '发布50个视频作品', 'film', 'epic', 'creation', '发布50个视频作品', 250, true),
    (25, '文化守护者', '使用10种不同文化元素', 'shield', 'epic', 'special', '使用10种不同文化元素', 150, true),
    (26, '津门传承者', '创作20个天津文化相关作品', 'landmark', 'epic', 'special', '创作20个天津文化相关作品', 200, true),
    (27, '完美主义者', '获得10个作品评分超过90分', 'target', 'epic', 'special', '获得10个作品评分超过90分', 180, true),
    (28, '社交达人', '获得100个粉丝', 'users', 'rare', 'community', '获得100个粉丝', 100, true),
    (29, '意见领袖', '获得1000个粉丝', 'user-check', 'epic', 'community', '获得1000个粉丝', 300, true),
    (30, '津脉之星', '登上排行榜前10名', 'trophy', 'legendary', 'special', '登上排行榜前10名', 500, true)
ON CONFLICT (id) DO UPDATE SET
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    icon = EXCLUDED.icon,
    rarity = EXCLUDED.rarity,
    category = EXCLUDED.category,
    criteria = EXCLUDED.criteria,
    points = EXCLUDED.points,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();

-- 插入默认等级配置
INSERT INTO creator_level_configs (id, level, name, icon, required_points, benefits, description, color, is_active)
VALUES 
    (1, 1, '创作新手', '🌱', 0, ARRAY['基础创作工具', '作品发布权限', '社区评论权限', '每日签到奖励'], '刚刚开始创作之旅的新手', '#6B7280', true),
    (2, 2, '创作爱好者', '✏️', 100, ARRAY['高级创作工具', '模板库访问', '作品打赏权限', '积分商城9折'], '热爱创作的积极用户', '#10B981', true),
    (3, 3, '创作达人', '🌟', 300, ARRAY['AI创意助手', '专属客服支持', '作品推广机会', '积分商城8折', '徽章解锁权限'], '创作能力突出的达人', '#3B82F6', true),
    (4, 4, '创作精英', '🏆', 600, ARRAY['精英创作工具', '优先活动邀请', '作品商业化机会', '积分商城7折', '专属创作空间'], '创作领域的精英人物', '#8B5CF6', true),
    (5, 5, '创作大师', '🎨', 1000, ARRAY['大师创作工具', '线下活动邀请', '品牌合作机会', '积分商城6折', '大师认证标识'], '创作领域的大师级人物', '#F59E0B', true),
    (6, 6, '创作宗师', '👑', 2000, ARRAY['宗师创作工具', '全球作品展示', '平台顾问身份', '积分商城5折', '定制化创作工具'], '创作界的宗师级人物', '#EF4444', true),
    (7, 7, '创作传奇', '💎', 5000, ARRAY['传奇创作工具', 'IP孵化支持', '平台荣誉殿堂', '积分商城4折', '专属商务合作'], '创作界的传奇人物', '#EAB308', true)
ON CONFLICT (id) DO UPDATE SET
    level = EXCLUDED.level,
    name = EXCLUDED.name,
    icon = EXCLUDED.icon,
    required_points = EXCLUDED.required_points,
    benefits = EXCLUDED.benefits,
    description = EXCLUDED.description,
    color = EXCLUDED.color,
    is_active = EXCLUDED.is_active,
    updated_at = NOW();
