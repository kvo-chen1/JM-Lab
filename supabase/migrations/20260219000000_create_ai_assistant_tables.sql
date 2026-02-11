-- AI助手功能完善：创建对话历史、用户记忆、平台知识库表

-- 1. 创建AI对话表
CREATE TABLE IF NOT EXISTS ai_conversations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '新对话',
    model_id TEXT DEFAULT 'qwen',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    context_summary TEXT,
    metadata JSONB DEFAULT '{}',
    message_count INTEGER DEFAULT 0
);

-- 2. 创建AI消息表
CREATE TABLE IF NOT EXISTS ai_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID NOT NULL REFERENCES ai_conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    timestamp TIMESTAMPTZ DEFAULT NOW(),
    is_error BOOLEAN DEFAULT false,
    feedback_rating INTEGER CHECK (feedback_rating >= 1 AND feedback_rating <= 5),
    feedback_comment TEXT,
    metadata JSONB DEFAULT '{}'
);

-- 3. 创建用户长记忆表
CREATE TABLE IF NOT EXISTS ai_user_memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    memory_type TEXT NOT NULL CHECK (memory_type IN ('preference', 'fact', 'habit', 'goal', 'context')),
    content TEXT NOT NULL,
    importance INTEGER DEFAULT 5 CHECK (importance >= 1 AND importance <= 10),
    source_conversation_id UUID REFERENCES ai_conversations(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    expires_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    metadata JSONB DEFAULT '{}'
);

-- 4. 创建平台知识库表
CREATE TABLE IF NOT EXISTS ai_platform_knowledge (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category TEXT NOT NULL CHECK (category IN ('navigation', 'operation', 'feature', 'guide', 'faq')),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    related_pages TEXT[] DEFAULT '{}',
    keywords TEXT[] DEFAULT '{}',
    steps JSONB DEFAULT '[]',
    priority INTEGER DEFAULT 5 CHECK (priority >= 1 AND priority <= 10),
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    usage_count INTEGER DEFAULT 0
);

-- 5. 创建用户AI设置表
CREATE TABLE IF NOT EXISTS ai_user_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    personality TEXT DEFAULT 'friendly',
    theme TEXT DEFAULT 'auto',
    enable_memory BOOLEAN DEFAULT true,
    enable_typing_effect BOOLEAN DEFAULT true,
    auto_scroll BOOLEAN DEFAULT true,
    show_preset_questions BOOLEAN DEFAULT true,
    shortcut_key TEXT DEFAULT 'ctrl+k',
    preferred_model TEXT DEFAULT 'qwen',
    custom_settings JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_ai_conversations_user_id ON ai_conversations(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_conversations_updated_at ON ai_conversations(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_ai_messages_conversation_id ON ai_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_ai_messages_timestamp ON ai_messages(timestamp DESC);
CREATE INDEX IF NOT EXISTS idx_ai_user_memories_user_id ON ai_user_memories(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_user_memories_type ON ai_user_memories(memory_type);
CREATE INDEX IF NOT EXISTS idx_ai_platform_knowledge_category ON ai_platform_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_ai_platform_knowledge_keywords ON ai_platform_knowledge USING GIN(keywords);

-- 启用RLS
ALTER TABLE ai_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_memories ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_platform_knowledge ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_user_settings ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略（使用 DROP IF EXISTS + CREATE 来避免重复创建错误）

-- ai_conversations: 用户只能访问自己的对话
DROP POLICY IF EXISTS "Users can only access their own conversations" ON ai_conversations;
CREATE POLICY "Users can only access their own conversations"
    ON ai_conversations FOR ALL
    USING (user_id = auth.uid());

-- ai_messages: 用户只能访问自己对话中的消息
DROP POLICY IF EXISTS "Users can only access messages in their conversations" ON ai_messages;
CREATE POLICY "Users can only access messages in their conversations"
    ON ai_messages FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM ai_conversations
            WHERE ai_conversations.id = ai_messages.conversation_id
            AND ai_conversations.user_id = auth.uid()
        )
    );

-- ai_user_memories: 用户只能访问自己的记忆
DROP POLICY IF EXISTS "Users can only access their own memories" ON ai_user_memories;
CREATE POLICY "Users can only access their own memories"
    ON ai_user_memories FOR ALL
    USING (user_id = auth.uid());

-- ai_platform_knowledge: 所有用户可读取，但只有管理员可修改
DROP POLICY IF EXISTS "Anyone can read platform knowledge" ON ai_platform_knowledge;
CREATE POLICY "Anyone can read platform knowledge"
    ON ai_platform_knowledge FOR SELECT
    USING (is_active = true);

DROP POLICY IF EXISTS "Only admins can modify platform knowledge" ON ai_platform_knowledge;
CREATE POLICY "Only admins can modify platform knowledge"
    ON ai_platform_knowledge FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM auth.users
            WHERE auth.users.id = auth.uid()
            AND auth.users.role = 'admin'
        )
    );

-- ai_user_settings: 用户只能访问自己的设置
DROP POLICY IF EXISTS "Users can only access their own settings" ON ai_user_settings;
CREATE POLICY "Users can only access their own settings"
    ON ai_user_settings FOR ALL
    USING (user_id = auth.uid());

-- 创建触发器：自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_ai_conversations_updated_at ON ai_conversations;
CREATE TRIGGER update_ai_conversations_updated_at
    BEFORE UPDATE ON ai_conversations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_user_memories_updated_at ON ai_user_memories;
CREATE TRIGGER update_ai_user_memories_updated_at
    BEFORE UPDATE ON ai_user_memories
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_platform_knowledge_updated_at ON ai_platform_knowledge;
CREATE TRIGGER update_ai_platform_knowledge_updated_at
    BEFORE UPDATE ON ai_platform_knowledge
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_ai_user_settings_updated_at ON ai_user_settings;
CREATE TRIGGER update_ai_user_settings_updated_at
    BEFORE UPDATE ON ai_user_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 创建触发器：更新对话的消息计数
CREATE OR REPLACE FUNCTION update_conversation_message_count()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE ai_conversations
        SET message_count = message_count + 1,
            updated_at = NOW()
        WHERE id = NEW.conversation_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE ai_conversations
        SET message_count = message_count - 1,
            updated_at = NOW()
        WHERE id = OLD.conversation_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_message_count ON ai_messages;
CREATE TRIGGER update_message_count
    AFTER INSERT OR DELETE ON ai_messages
    FOR EACH ROW EXECUTE FUNCTION update_conversation_message_count();

-- 插入平台知识库数据（使用 ON CONFLICT 避免重复插入错误）
INSERT INTO ai_platform_knowledge (category, question, answer, related_pages, keywords, steps, priority) VALUES
-- 导航类
('navigation', '如何进入创作中心？', '您可以通过以下方式进入创作中心：', ARRAY['/create', '/creation-workshop'], ARRAY['创作', '开始', '新建', '制作'], '[{"step": 1, "action": "点击左侧导航栏的创作中心", "detail": "或点击首页的「开始创作」按钮"}, {"step": 2, "action": "选择创作类型", "detail": "图文、视频、设计等"}, {"step": 3, "action": "开始您的创作", "detail": "使用AI辅助工具或手动创作"}]'::jsonb, 9),
('navigation', '津脉广场在哪里？', '津脉广场是平台的社区中心，您可以在这里发现热门作品和创作者。', ARRAY['/square'], ARRAY['广场', '社区', '发现', '热门'], '[{"step": 1, "action": "点击左侧导航栏的「津脉广场」", "detail": "或访问 /square 路径"}, {"step": 2, "action": "浏览推荐内容", "detail": "查看热门作品和创作者"}, {"step": 3, "action": "互动参与", "detail": "点赞、评论、关注感兴趣的内容"}]'::jsonb, 9),
('navigation', '如何查看我的作品？', '您可以在「我的作品」页面查看和管理所有创作。', ARRAY['/my-works'], ARRAY['作品', '管理', '查看', '我的'], '[{"step": 1, "action": "点击左侧导航栏的「我的作品」", "detail": "或访问 /my-works 路径"}, {"step": 2, "action": "筛选和排序", "detail": "按类型、时间、状态筛选作品"}, {"step": 3, "action": "管理作品", "detail": "编辑、删除或分享您的作品"}]'::jsonb, 8),

-- 操作类
('operation', '如何发布作品？', '发布作品非常简单，只需几个步骤：', ARRAY['/create', '/my-works'], ARRAY['发布', '上传', '分享', '提交'], '[{"step": 1, "action": "完成创作", "detail": "在创作中心完成您的作品"}, {"step": 2, "action": "点击「发布」按钮", "detail": "位于编辑器右上角"}, {"step": 3, "action": "填写作品信息", "detail": "标题、描述、标签、封面等"}, {"step": 4, "action": "选择发布范围", "detail": "公开、仅粉丝或私密"}, {"step": 5, "action": "确认发布", "detail": "点击「确认发布」即可"}]'::jsonb, 10),
('operation', '如何使用AI生成功能？', '平台提供强大的AI生成能力，包括文本、图像、视频生成。', ARRAY['/create', '/neo'], ARRAY['AI', '生成', '人工智能', '创作'], '[{"step": 1, "action": "进入创作中心", "detail": "点击左侧导航栏的创作中心"}, {"step": 2, "action": "选择AI工具", "detail": "文本生成、图像生成或视频生成"}, {"step": 3, "action": "输入提示词", "detail": "描述您想要生成的内容"}, {"step": 4, "action": "调整参数", "detail": "风格、尺寸、数量等"}, {"step": 5, "action": "生成并保存", "detail": "等待生成完成后保存到作品"}]'::jsonb, 10),
('operation', '如何参与文化活动？', '平台定期举办各类文化活动，参与方式如下：', ARRAY['/cultural-events', '/events'], ARRAY['活动', '参与', '报名', '文化'], '[{"step": 1, "action": "浏览活动列表", "detail": "进入文化活动页面查看当前活动"}, {"step": 2, "action": "选择感兴趣的活动", "detail": "查看活动详情和要求"}, {"step": 3, "action": "点击「参与活动」", "detail": "或根据活动要求提交作品"}, {"step": 4, "action": "等待审核", "detail": "部分活动需要主办方审核"}, {"step": 5, "action": "参与活动", "detail": "按照活动规则完成任务"}]'::jsonb, 8),

-- 功能类
('feature', '文创市集是什么？', '文创市集是平台的电商模块，您可以购买或销售文创产品。', ARRAY['/marketplace'], ARRAY['市集', '购买', '销售', '文创', '商品'], '[{"step": 1, "action": "进入文创市集", "detail": "点击左侧导航栏的文创市集"}, {"step": 2, "action": "浏览商品", "detail": "按分类筛选感兴趣的产品"}, {"step": 3, "action": "购买或开店", "detail": "购买心仪商品或申请成为卖家"}]'::jsonb, 7),
('feature', '什么是灵感引擎？', '灵感引擎是AI驱动的创意辅助工具，帮助您获得创作灵感。', ARRAY['/neo'], ARRAY['灵感', '创意', 'AI', '辅助'], '[{"step": 1, "action": "进入灵感引擎", "detail": "点击左侧导航栏的灵感引擎"}, {"step": 2, "action": "选择灵感类型", "detail": "文案、设计、策划等"}, {"step": 3, "action": "输入关键词", "detail": "描述您的创作方向"}, {"step": 4, "action": "获取灵感", "detail": "AI将为您生成创意建议"}]'::jsonb, 8),
('feature', '如何获得积分？', '平台积分可以通过多种方式获得，用于兑换权益。', ARRAY['/dashboard'], ARRAY['积分', '获取', '奖励', '点数'], '[{"step": 1, "action": "每日签到", "detail": "连续签到可获得更多积分"}, {"step": 2, "action": "发布优质作品", "detail": "获得点赞和收藏可赚取积分"}, {"step": 3, "action": "参与活动", "detail": "完成活动任务获得积分奖励"}, {"step": 4, "action": "社区互动", "detail": "评论、分享、关注也可获得积分"}]'::jsonb, 7),

-- 指南类
('guide', '新手如何快速上手？', '欢迎加入津脉智坊！以下是新手指南：', ARRAY['/'], ARRAY['新手', '入门', '开始', '教程'], '[{"step": 1, "action": "完善个人资料", "detail": "设置头像、昵称、简介"}, {"step": 2, "action": "浏览平台功能", "detail": "了解创作中心、广场、市集等模块"}, {"step": 3, "action": "尝试AI创作", "detail": "使用灵感引擎生成第一个作品"}, {"step": 4, "action": "参与社区互动", "detail": "关注创作者，点赞评论作品"}, {"step": 5, "action": "发布您的作品", "detail": "分享给社区，获得反馈"}]'::jsonb, 10),
('guide', '如何提高作品曝光？', '想要让更多人看到您的作品？试试这些方法：', ARRAY['/square'], ARRAY['曝光', '推广', '热门', '推荐'], '[{"step": 1, "action": "优化作品信息", "detail": "完善标题、描述、标签"}, {"step": 2, "action": "使用高质量封面", "detail": "吸引人的封面能提高点击率"}, {"step": 3, "action": "选择合适发布时间", "detail": "在用户活跃时段发布"}, {"step": 4, "action": "积极互动", "detail": "回复评论，参与话题讨论"}, {"step": 5, "action": "参与活动", "detail": "官方活动可获得额外曝光"}]'::jsonb, 8),

-- FAQ类
('faq', '忘记密码怎么办？', '您可以通过以下方式重置密码：', ARRAY['/settings'], ARRAY['密码', '忘记', '重置', '找回'], '[{"step": 1, "action": "点击登录页面的「忘记密码」", "detail": "进入密码重置流程"}, {"step": 2, "action": "输入注册邮箱或手机号", "detail": "验证您的身份"}, {"step": 3, "action": "获取验证码", "detail": "通过邮件或短信接收"}, {"step": 4, "action": "设置新密码", "detail": "设置安全的新密码"}]'::jsonb, 9),
('faq', '如何联系客服？', '如果您遇到问题，可以通过以下方式联系客服：', ARRAY['/help'], ARRAY['客服', '帮助', '联系', '支持'], '[{"step": 1, "action": "使用AI助手", "detail": "我可以解答大部分常见问题"}, {"step": 2, "action": "查看帮助中心", "detail": "访问 /help 查看详细文档"}, {"step": 3, "action": "提交反馈", "detail": "在设置中提交问题反馈"}, {"step": 4, "action": "邮件联系", "detail": "发送邮件至 support@jinmai.com"}]'::jsonb, 8)
ON CONFLICT (id) DO NOTHING;

-- 创建获取用户对话历史的函数
CREATE OR REPLACE FUNCTION get_user_conversations(
    p_user_id UUID,
    p_limit INTEGER DEFAULT 20,
    p_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
    id UUID,
    title TEXT,
    model_id TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    message_count INTEGER,
    last_message TEXT,
    last_message_time TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.model_id,
        c.created_at,
        c.updated_at,
        c.message_count,
        m.content as last_message,
        m.timestamp as last_message_time
    FROM ai_conversations c
    LEFT JOIN LATERAL (
        SELECT content, timestamp
        FROM ai_messages
        WHERE conversation_id = c.id
        ORDER BY timestamp DESC
        LIMIT 1
    ) m ON true
    WHERE c.user_id = p_user_id
    ORDER BY c.updated_at DESC
    LIMIT p_limit OFFSET p_offset;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建搜索平台知识库的函数
CREATE OR REPLACE FUNCTION search_platform_knowledge(
    p_query TEXT,
    p_category TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 5
)
RETURNS TABLE (
    id UUID,
    category TEXT,
    question TEXT,
    answer TEXT,
    related_pages TEXT[],
    steps JSONB,
    similarity FLOAT
) AS $$
BEGIN
    -- 更新使用计数
    UPDATE ai_platform_knowledge
    SET usage_count = usage_count + 1,
        updated_at = NOW()
    WHERE id IN (
        SELECT k.id
        FROM ai_platform_knowledge k
        WHERE k.is_active = true
        AND (p_category IS NULL OR k.category = p_category)
        AND (
            k.question ILIKE '%' || p_query || '%'
            OR k.answer ILIKE '%' || p_query || '%'
            OR EXISTS (
                SELECT 1 FROM unnest(k.keywords) kw
                WHERE kw ILIKE '%' || p_query || '%'
            )
        )
        ORDER BY k.priority DESC, k.usage_count DESC
        LIMIT p_limit
    );

    RETURN QUERY
    SELECT 
        k.id,
        k.category,
        k.question,
        k.answer,
        k.related_pages,
        k.steps,
        CASE 
            WHEN k.question ILIKE '%' || p_query || '%' THEN 1.0
            WHEN EXISTS (
                SELECT 1 FROM unnest(k.keywords) kw
                WHERE kw ILIKE '%' || p_query || '%'
            ) THEN 0.8
            ELSE 0.5
        END::FLOAT as similarity
    FROM ai_platform_knowledge k
    WHERE k.is_active = true
    AND (p_category IS NULL OR k.category = p_category)
    AND (
        k.question ILIKE '%' || p_query || '%'
        OR k.answer ILIKE '%' || p_query || '%'
        OR EXISTS (
            SELECT 1 FROM unnest(k.keywords) kw
            WHERE kw ILIKE '%' || p_query || '%'
        )
    )
    ORDER BY similarity DESC, k.priority DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建获取用户记忆的函数
CREATE OR REPLACE FUNCTION get_user_memories(
    p_user_id UUID,
    p_memory_type TEXT DEFAULT NULL,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
    id UUID,
    memory_type TEXT,
    content TEXT,
    importance INTEGER,
    created_at TIMESTAMPTZ,
    source_conversation_id UUID
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        m.id,
        m.memory_type,
        m.content,
        m.importance,
        m.created_at,
        m.source_conversation_id
    FROM ai_user_memories m
    WHERE m.user_id = p_user_id
    AND m.is_active = true
    AND (p_memory_type IS NULL OR m.memory_type = p_memory_type)
    AND (m.expires_at IS NULL OR m.expires_at > NOW())
    ORDER BY m.importance DESC, m.updated_at DESC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON TABLE ai_conversations IS 'AI对话会话表，存储用户的对话历史';
COMMENT ON TABLE ai_messages IS 'AI消息表，存储对话中的具体消息';
COMMENT ON TABLE ai_user_memories IS '用户长记忆表，存储AI学习到的用户信息';
COMMENT ON TABLE ai_platform_knowledge IS '平台知识库表，存储平台功能和操作指南';
COMMENT ON TABLE ai_user_settings IS '用户AI设置表，存储个性化的AI助手配置';