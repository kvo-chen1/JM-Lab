-- 热点话题表
-- 学习抖音"热点宝"功能，提供实时热点追踪

CREATE TABLE IF NOT EXISTS trending_topics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,              -- 话题标题
  description TEXT,                 -- 话题描述
  category TEXT NOT NULL,           -- 分类 (tianjin-culture, brand-task, etc.)
  subcategory TEXT,                 -- 子分类
  
  -- 统计数据
  heat_value BIGINT DEFAULT 0,      -- 热度值
  growth_rate DECIMAL(5,2) DEFAULT 0, -- 增长率 (%)
  video_count BIGINT DEFAULT 0,     -- 参与作品数
  view_count BIGINT DEFAULT 0,      -- 总播放量
  like_count BIGINT DEFAULT 0,      -- 总点赞数
  
  -- 趋势
  trend TEXT CHECK (trend IN ('rising', 'falling', 'stable')),
  
  -- 关联信息
  related_tags TEXT[] DEFAULT '{}', -- 相关标签
  related_music TEXT[] DEFAULT '{}', -- 相关音乐
  suggested_angles TEXT[] DEFAULT '{}', -- AI 生成的创作角度
  
  -- 时间信息
  time_range TEXT CHECK (time_range IN ('1h', '24h', '7d', '30d')),
  starts_at TIMESTAMP WITH TIME ZONE,
  peaks_at TIMESTAMP WITH TIME ZONE,
  
  -- 媒体
  cover_image TEXT,
  
  -- 元数据
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引优化查询性能
CREATE INDEX idx_trending_heat_value ON trending_topics(heat_value DESC);
CREATE INDEX idx_trending_growth_rate ON trending_topics(growth_rate DESC);
CREATE INDEX idx_trending_category ON trending_topics(category);
CREATE INDEX idx_trending_trend ON trending_topics(trend);
CREATE INDEX idx_trending_time_range ON trending_topics(time_range);
CREATE INDEX idx_trending_created_at ON trending_topics(created_at DESC);

-- 组合索引
CREATE INDEX idx_trending_category_heat ON trending_topics(category, heat_value DESC);
CREATE INDEX idx_trending_trend_growth ON trending_topics(trend, growth_rate DESC);

-- 全文搜索索引
CREATE INDEX idx_trending_title_search ON trending_topics USING gin(to_tsvector('simple', title));

-- 灵感使用记录表
-- 追踪用户与灵感的互动行为

CREATE TABLE IF NOT EXISTS inspiration_usage_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  inspiration_id UUID,              -- 灵感 ID（可以是 trending_topics.id 或其他）
  inspiration_type TEXT,            -- 'trending' | 'recommendation' | 'ai' | 'manual'
  action_type TEXT CHECK (action_type IN ('view', 'use', 'complete', 'share', 'bookmark', 'like')),
  
  -- 作品关联
  work_id UUID,                     -- 创作的作品 ID
  
  -- 表现数据
  performance_metrics JSONB DEFAULT '{}', -- 作品表现数据 (views, likes, etc.)
  
  -- 上下文信息
  context JSONB DEFAULT '{}',       -- 使用场景上下文
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_inspiration_logs_user ON inspiration_usage_logs(user_id);
CREATE INDEX idx_inspiration_logs_type ON inspiration_usage_logs(inspiration_type);
CREATE INDEX idx_inspiration_logs_action ON inspiration_usage_logs(action_type);
CREATE INDEX idx_inspiration_logs_created ON inspiration_usage_logs(created_at DESC);
CREATE INDEX idx_inspiration_logs_user_created ON inspiration_usage_logs(user_id, created_at DESC);

-- 用户偏好表（用于个性化推荐）
CREATE TABLE IF NOT EXISTS user_preferences (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  
  -- 内容偏好
  favorite_categories TEXT[] DEFAULT '{}',
  content_styles TEXT[] DEFAULT '{}',
  
  -- 最佳发布时间
  best_posting_time TEXT,
  
  -- 粉丝画像
  audience_profile JSONB DEFAULT '{}',
  
  -- 历史表现
  historical_performance JSONB DEFAULT '{}',
  
  -- 推荐权重
  recommendation_weights JSONB DEFAULT '{}',
  
  -- 时间戳
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引
CREATE INDEX idx_user_preferences_user ON user_preferences(user_id);

-- 搜索函数：搜索热点话题
CREATE OR REPLACE FUNCTION search_trending_topics(search_query TEXT, result_limit INTEGER DEFAULT 10)
RETURNS SETOF trending_topics AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM trending_topics
  WHERE title ILIKE '%' || search_query || '%'
     OR description ILIKE '%' || search_query || '%'
     OR related_tags @> ARRAY[search_query]
  ORDER BY heat_value DESC
  LIMIT result_limit;
END;
$$ LANGUAGE plpgsql;

-- 触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为 trending_topics 添加触发器
CREATE TRIGGER update_trending_topics_updated_at
  BEFORE UPDATE ON trending_topics
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 为 user_preferences 添加触发器
CREATE TRIGGER update_user_preferences_updated_at
  BEFORE UPDATE ON user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- 插入示例数据（天津文化特色热点）
INSERT INTO trending_topics (title, description, category, subcategory, heat_value, growth_rate, video_count, view_count, like_count, trend, related_tags, suggested_angles, time_range) VALUES
('狗不理包子制作技艺', '传承百年的天津味道，探索非遗美食的制作工艺', 'tianjin-culture', 'food', 280000000, 15.5, 1563000, 680000, 48000, 'rising', ARRAY['狗不理', '包子', '传统美食', '老字号', '非遗'], ARRAY['拍摄包子制作的 18 个褶细节', '采访老字号传承人讲述历史', '对比传统与现代制作工艺'], '24h'),
('天津之眼夜景航拍', '海河两岸灯火辉煌，展现现代天津的璀璨夜景', 'tianjin-culture', 'river', 190000000, 12.3, 982000, 524000, 36000, 'rising', ARRAY['天津之眼', '夜景', '海河', '航拍', '城市风光'], ARRAY['无人机航拍天津之眼全景', '结合海河游船视角', '延时摄影展现夜景变化'], '24h'),
('天津话方言教学', '听相声学天津话，地道方言趣味教学', 'tianjin-culture', 'dialect', 120000000, 20.8, 678000, 458000, 32000, 'rising', ARRAY['天津话', '方言', '相声', '教学', '传统文化'], ARRAY['相声演员教经典天津话', '外地人学天津话的趣事', '天津话与普通话对比'], '24h'),
('泥人张非遗技艺', '一双手捏出万千世界，传统手工艺的匠心传承', 'tianjin-culture', 'craft', 98000000, 8.5, 345000, 386000, 29000, 'stable', ARRAY['泥人张', '非遗', '手工艺', '泥塑', '传统技艺'], ARRAY['记录泥人张制作全过程', '展示经典作品背后的故事', '年轻传承人创新演绎'], '24h'),
('五大道历史建筑', '百年洋楼故事多，探寻天津的历史印记', 'tianjin-culture', 'history', 75000000, 10.2, 456000, 321000, 23000, 'rising', ARRAY['五大道', '洋楼', '历史', '建筑', '天津故事'], ARRAY['探访五大道名人故居', '讲述建筑背后的历史故事', '四季变换中的五大道美景'], '24h'),
('十八街麻花制作', '酥脆香甜的传统味道，老字号美食的创新之路', 'tianjin-culture', 'food', 62000000, 5.8, 289000, 289000, 21000, 'stable', ARRAY['十八街麻花', '小吃', '传统', '美食', '老字号'], ARRAY['展示麻花制作的独特工艺', '品尝不同口味的麻花', '老字号的创新产品'], '24h'),
('杨柳青年画艺术', '中国传统年画艺术的代表，非遗文化的瑰宝', 'tianjin-culture', 'craft', 58000000, 18.2, 234000, 267000, 19500, 'rising', ARRAY['杨柳青', '年画', '非遗', '传统艺术', '民俗'], ARRAY['展示年画制作工艺', '年画中的吉祥寓意解读', '年画在现代设计中的应用'], '24h'),
('天津相声文化', '津门曲艺的代表，让人捧腹大笑的语言艺术', 'tianjin-culture', 'opera', 52000000, 7.3, 198000, 245000, 18200, 'stable', ARRAY['相声', '曲艺', '天津', '传统艺术', '茶馆'], ARRAY['名家相声经典片段', '茶馆相声现场体验', '相声背后的文化故事'], '24h'),
('海河乳业早餐文化', '天津人的早餐记忆，海河牛奶的 N 种吃法', 'tianjin-culture', 'food', 48000000, 25.6, 176000, 223000, 16800, 'rising', ARRAY['海河乳业', '早餐', '牛奶', '天津味道', '美食'], ARRAY['海河牛奶配煎饼果子', '创意牛奶饮品制作', '天津早餐文化探店'], '24h'),
('古文化街探店', '探寻天津文化地标，体验传统商业街区魅力', 'tianjin-culture', 'tourism', 45000000, 9.8, 167000, 198000, 15600, 'stable', ARRAY['古文化街', '探店', '旅游', '文化', '商业'], ARRAY['古文化街美食地图', '手工艺品店探访', '文化街历史讲解'], '24h');

-- 权限设置（RLS）
ALTER TABLE trending_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE inspiration_usage_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- trending_topics: 所有人可读，管理员可写
CREATE POLICY "trending_topics_public_read" ON trending_topics
  FOR SELECT USING (true);

-- inspiration_usage_logs: 用户只能查看和操作自己的记录
CREATE POLICY "inspiration_logs_user_own" ON inspiration_usage_logs
  FOR ALL USING (auth.uid() = user_id);

-- user_preferences: 用户只能查看和操作自己的偏好
CREATE POLICY "user_preferences_user_own" ON user_preferences
  FOR ALL USING (auth.uid() = user_id);

-- 允许服务端 RPC 调用
GRANT EXECUTE ON FUNCTION search_trending_topics TO authenticated;
GRANT EXECUTE ON FUNCTION search_trending_topics TO anon;
