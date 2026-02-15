-- 用户行为日志表
-- 用于自动记录用户在津脉脉络中的创作行为
-- 支持AI分析和个性化推荐

-- 1. 用户行为日志主表
CREATE TABLE IF NOT EXISTS public.user_behavior_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 行为类型
    behavior_type TEXT NOT NULL CHECK (
        behavior_type IN (
            'mindmap_create',      -- 创建脉络
            'mindmap_edit',        -- 编辑脉络
            'mindmap_delete',      -- 删除脉络
            'node_create',         -- 创建节点
            'node_edit',           -- 编辑节点
            'node_delete',         -- 删除节点
            'ai_suggestion_request', -- 请求AI建议
            'ai_suggestion_apply',   -- 应用AI建议
            'story_generate',      -- 生成创作故事
            'brand_inspiration_use', -- 使用天津老字号元素
            'work_publish',        -- 发布作品
            'work_save',           -- 保存作品
            'work_share',          -- 分享作品
            'layout_change',       -- 切换布局
            'theme_change',        -- 切换主题
            'export',              -- 导出脉络
            'import'               -- 导入脉络
        )
    ),
    
    -- 目标对象
    target_type TEXT CHECK (target_type IN ('mindmap', 'node', 'brand', 'work', 'story')),
    target_id UUID,
    target_title TEXT,
    
    -- 行为详情
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- AI分析结果
    ai_analysis JSONB DEFAULT '{}'::jsonb,
    ai_tags TEXT[] DEFAULT '{}',
    ai_insights TEXT,
    
    -- 会话信息
    session_id TEXT,
    ip_address INET,
    user_agent TEXT,
    
    -- 时间戳
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. 用户创作画像表
CREATE TABLE IF NOT EXISTS public.user_creative_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES public.users(id) ON DELETE CASCADE,
    
    -- 创作偏好
    preferred_categories TEXT[] DEFAULT '{}',  -- 喜欢的节点类别
    preferred_brands TEXT[] DEFAULT '{}',      -- 喜欢的老字号品牌
    preferred_themes TEXT[] DEFAULT '{}',      -- 喜欢的主题
    
    -- 创作统计
    total_mindmaps INTEGER DEFAULT 0,
    total_nodes INTEGER DEFAULT 0,
    total_ai_suggestions INTEGER DEFAULT 0,
    total_stories INTEGER DEFAULT 0,
    total_published_works INTEGER DEFAULT 0,
    
    -- 创作风格标签（AI生成）
    creative_style_tags TEXT[] DEFAULT '{}',
    creative_strengths TEXT[] DEFAULT '{}',
    creative_improvements TEXT[] DEFAULT '{}',
    
    -- 活跃时段分析
    most_active_hour INTEGER,  -- 最活跃的小时 (0-23)
    most_active_day TEXT,      -- 最活跃的星期
    
    -- 最近更新时间
    last_analyzed_at TIMESTAMPTZ,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 用户行为聚合统计表（按天）
CREATE TABLE IF NOT EXISTS public.user_behavior_daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    stat_date DATE NOT NULL,
    
    -- 每日统计
    mindmap_creates INTEGER DEFAULT 0,
    mindmap_edits INTEGER DEFAULT 0,
    node_creates INTEGER DEFAULT 0,
    node_edits INTEGER DEFAULT 0,
    ai_suggestions INTEGER DEFAULT 0,
    stories_generated INTEGER DEFAULT 0,
    works_published INTEGER DEFAULT 0,
    
    -- 使用的老字号品牌
    brands_used TEXT[] DEFAULT '{}',
    
    -- 活跃时长（分钟）
    active_minutes INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, stat_date)
);

-- 创建索引
CREATE INDEX idx_behavior_logs_user_id ON public.user_behavior_logs(user_id);
CREATE INDEX idx_behavior_logs_behavior_type ON public.user_behavior_logs(behavior_type);
CREATE INDEX idx_behavior_logs_created_at ON public.user_behavior_logs(created_at DESC);
CREATE INDEX idx_behavior_logs_user_type_created ON public.user_behavior_logs(user_id, behavior_type, created_at DESC);
CREATE INDEX idx_behavior_logs_target ON public.user_behavior_logs(target_type, target_id);

CREATE INDEX idx_creative_profiles_user_id ON public.user_creative_profiles(user_id);

CREATE INDEX idx_daily_stats_user_date ON public.user_behavior_daily_stats(user_id, stat_date);
CREATE INDEX idx_daily_stats_date ON public.user_behavior_daily_stats(stat_date);

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_behavior_logs_updated_at ON public.user_behavior_logs;
CREATE TRIGGER update_behavior_logs_updated_at
    BEFORE UPDATE ON public.user_behavior_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_creative_profiles_updated_at ON public.user_creative_profiles;
CREATE TRIGGER update_creative_profiles_updated_at
    BEFORE UPDATE ON public.user_creative_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_daily_stats_updated_at ON public.user_behavior_daily_stats;
CREATE TRIGGER update_daily_stats_updated_at
    BEFORE UPDATE ON public.user_behavior_daily_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 创建行为日志插入触发器 - 自动更新每日统计
CREATE OR REPLACE FUNCTION update_daily_stats_on_behavior()
RETURNS TRIGGER AS $$
DECLARE
    v_stat_date DATE;
    v_exists BOOLEAN;
BEGIN
    v_stat_date := DATE(NEW.created_at);
    
    -- 检查是否已存在该日期的统计记录
    SELECT EXISTS(
        SELECT 1 FROM public.user_behavior_daily_stats 
        WHERE user_id = NEW.user_id AND stat_date = v_stat_date
    ) INTO v_exists;
    
    IF NOT v_exists THEN
        -- 创建新的统计记录
        INSERT INTO public.user_behavior_daily_stats (user_id, stat_date)
        VALUES (NEW.user_id, v_stat_date);
    END IF;
    
    -- 更新对应的行为计数
    CASE NEW.behavior_type
        WHEN 'mindmap_create' THEN
            UPDATE public.user_behavior_daily_stats 
            SET mindmap_creates = mindmap_creates + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
        WHEN 'mindmap_edit' THEN
            UPDATE public.user_behavior_daily_stats 
            SET mindmap_edits = mindmap_edits + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
        WHEN 'node_create' THEN
            UPDATE public.user_behavior_daily_stats 
            SET node_creates = node_creates + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
        WHEN 'node_edit' THEN
            UPDATE public.user_behavior_daily_stats 
            SET node_edits = node_edits + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
        WHEN 'ai_suggestion_request' THEN
            UPDATE public.user_behavior_daily_stats 
            SET ai_suggestions = ai_suggestions + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
        WHEN 'story_generate' THEN
            UPDATE public.user_behavior_daily_stats 
            SET stories_generated = stories_generated + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
        WHEN 'work_publish' THEN
            UPDATE public.user_behavior_daily_stats 
            SET works_published = works_published + 1
            WHERE user_id = NEW.user_id AND stat_date = v_stat_date;
    END CASE;
    
    -- 如果使用了老字号品牌，添加到数组
    IF NEW.behavior_type = 'brand_inspiration_use' AND NEW.metadata->>'brand_id' IS NOT NULL THEN
        UPDATE public.user_behavior_daily_stats 
        SET brands_used = array_append(brands_used, NEW.metadata->>'brand_id')
        WHERE user_id = NEW.user_id AND stat_date = v_stat_date
        AND NOT (brands_used @> ARRAY[NEW.metadata->>'brand_id']);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_daily_stats_on_behavior ON public.user_behavior_logs;
CREATE TRIGGER update_daily_stats_on_behavior
    AFTER INSERT ON public.user_behavior_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_stats_on_behavior();

-- 创建用户创作画像更新触发器
CREATE OR REPLACE FUNCTION update_creative_profile_on_behavior()
RETURNS TRIGGER AS $$
BEGIN
    -- 确保用户画像记录存在
    INSERT INTO public.user_creative_profiles (user_id)
    VALUES (NEW.user_id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 更新创作统计
    CASE NEW.behavior_type
        WHEN 'mindmap_create' THEN
            UPDATE public.user_creative_profiles 
            SET total_mindmaps = total_mindmaps + 1,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        WHEN 'node_create' THEN
            UPDATE public.user_creative_profiles 
            SET total_nodes = total_nodes + 1,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        WHEN 'ai_suggestion_request' THEN
            UPDATE public.user_creative_profiles 
            SET total_ai_suggestions = total_ai_suggestions + 1,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        WHEN 'story_generate' THEN
            UPDATE public.user_creative_profiles 
            SET total_stories = total_stories + 1,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
        WHEN 'work_publish' THEN
            UPDATE public.user_creative_profiles 
            SET total_published_works = total_published_works + 1,
                updated_at = NOW()
            WHERE user_id = NEW.user_id;
    END CASE;
    
    -- 更新偏好类别
    IF NEW.metadata->>'category' IS NOT NULL THEN
        UPDATE public.user_creative_profiles 
        SET preferred_categories = array_append(preferred_categories, NEW.metadata->>'category')
        WHERE user_id = NEW.user_id
        AND NOT (preferred_categories @> ARRAY[NEW.metadata->>'category']);
    END IF;
    
    -- 更新偏好品牌
    IF NEW.behavior_type = 'brand_inspiration_use' AND NEW.metadata->>'brand_id' IS NOT NULL THEN
        UPDATE public.user_creative_profiles 
        SET preferred_brands = array_append(preferred_brands, NEW.metadata->>'brand_id')
        WHERE user_id = NEW.user_id
        AND NOT (preferred_brands @> ARRAY[NEW.metadata->>'brand_id']);
    END IF;
    
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_creative_profile_on_behavior ON public.user_behavior_logs;
CREATE TRIGGER update_creative_profile_on_behavior
    AFTER INSERT ON public.user_behavior_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_creative_profile_on_behavior();

-- 启用RLS
ALTER TABLE public.user_behavior_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_creative_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behavior_daily_stats ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
CREATE POLICY "Users can view own behavior logs"
    ON public.user_behavior_logs FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can insert own behavior logs"
    ON public.user_behavior_logs FOR INSERT
    WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view own creative profile"
    ON public.user_creative_profiles FOR SELECT
    USING (user_id = auth.uid());

CREATE POLICY "Users can view own daily stats"
    ON public.user_behavior_daily_stats FOR SELECT
    USING (user_id = auth.uid());

-- 添加注释
COMMENT ON TABLE public.user_behavior_logs IS '用户行为日志表 - 记录用户在津脉脉络中的创作行为';
COMMENT ON TABLE public.user_creative_profiles IS '用户创作画像表 - AI分析用户的创作偏好和风格';
COMMENT ON TABLE public.user_behavior_daily_stats IS '用户行为每日统计表';
