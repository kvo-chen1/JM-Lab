-- 创建内容审核系统（简化版，移除 Supabase 特定依赖）

-- 1. 创建违禁词库表
CREATE TABLE IF NOT EXISTS forbidden_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'general',
    severity INTEGER NOT NULL DEFAULT 1 CHECK (severity >= 1 AND severity <= 5),
    is_regex BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_forbidden_words_category ON forbidden_words(category);
CREATE INDEX IF NOT EXISTS idx_forbidden_words_active ON forbidden_words(is_active);

-- 2. 创建审核规则配置表
CREATE TABLE IF NOT EXISTS moderation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('sensitive_words', 'spam_detection', 'ai_generated', 'cultural_authenticity')),
    enabled BOOLEAN DEFAULT TRUE,
    threshold INTEGER NOT NULL CHECK (threshold >= 0 AND threshold <= 100),
    auto_action TEXT NOT NULL DEFAULT 'flag' CHECK (auto_action IN ('none', 'flag', 'reject')),
    config JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_moderation_rules_type ON moderation_rules(rule_type);

-- 3. 创建内容审核日志表
CREATE TABLE IF NOT EXISTS moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id TEXT NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('work', 'post', 'comment', 'activity')),
    user_id TEXT,
    action TEXT NOT NULL CHECK (action IN ('auto_approved', 'auto_rejected', 'manual_approved', 'manual_rejected', 'flagged')),
    reason TEXT,
    scores JSONB DEFAULT '{}'::jsonb,
    matched_words TEXT[] DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_content ON moderation_logs(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_user ON moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action ON moderation_logs(action);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON moderation_logs(created_at DESC);

-- 4. 插入默认违禁词
INSERT INTO forbidden_words (word, category, severity, is_regex) VALUES
('暴力', 'violence', 4, FALSE),
('杀人', 'violence', 5, FALSE),
('血腥', 'violence', 4, FALSE),
('武器', 'violence', 3, FALSE),
('炸弹', 'violence', 5, FALSE),
('枪支', 'violence', 4, FALSE),
('色情', 'pornography', 4, FALSE),
('淫秽', 'pornography', 5, FALSE),
('裸体', 'pornography', 4, FALSE),
('性服务', 'pornography', 5, FALSE),
('反动', 'politics', 5, FALSE),
('颠覆', 'politics', 4, FALSE),
('分裂', 'politics', 4, FALSE),
('邪教', 'politics', 5, FALSE),
('刷单', 'spam', 3, FALSE),
('兼职赚钱', 'spam', 3, FALSE),
('快速致富', 'spam', 3, FALSE),
('免费领', 'spam', 2, FALSE),
('点击领取', 'spam', 2, FALSE),
('限时抢购', 'spam', 1, FALSE)
ON CONFLICT (word) DO NOTHING;

-- 5. 插入默认审核规则
INSERT INTO moderation_rules (name, rule_type, enabled, threshold, auto_action, config) VALUES
('敏感词检测', 'sensitive_words', TRUE, 1, 'reject', '{"match_mode": "exact", "case_sensitive": false}'),
('垃圾内容识别', 'spam_detection', TRUE, 70, 'flag', '{"check_patterns": ["repetitive", "url_spam", "short_content"]}'),
('AI生成内容检测', 'ai_generated', TRUE, 85, 'flag', '{"min_text_length": 50}'),
('文化真实性评估', 'cultural_authenticity', TRUE, 60, 'flag', '{"min_cultural_score": 30}')
ON CONFLICT (rule_type) DO UPDATE SET
    name = EXCLUDED.name,
    enabled = EXCLUDED.enabled,
    threshold = EXCLUDED.threshold,
    auto_action = EXCLUDED.auto_action,
    config = EXCLUDED.config;

-- 6. 创建自动更新时间戳的函数和触发器
CREATE OR REPLACE FUNCTION update_moderation_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_forbidden_words ON forbidden_words;
CREATE TRIGGER trigger_update_forbidden_words
    BEFORE UPDATE ON forbidden_words
    FOR EACH ROW EXECUTE FUNCTION update_moderation_timestamp();

DROP TRIGGER IF EXISTS trigger_update_moderation_rules ON moderation_rules;
CREATE TRIGGER trigger_update_moderation_rules
    BEFORE UPDATE ON moderation_rules
    FOR EACH ROW EXECUTE FUNCTION update_moderation_timestamp();

-- 7. 创建内容审核函数
CREATE OR REPLACE FUNCTION moderate_content(
    p_content_id TEXT,
    p_content_type TEXT,
    p_title TEXT,
    p_description TEXT,
    p_user_id TEXT DEFAULT NULL
)
RETURNS TABLE (
    approved BOOLEAN,
    action TEXT,
    reason TEXT,
    matched_words TEXT[],
    scores JSONB
) AS $$
DECLARE
    v_full_text TEXT;
    v_matched_words TEXT[] := '{}';
    v_word RECORD;
    v_rule RECORD;
    v_spam_score INTEGER := 0;
    v_ai_risk_score INTEGER := 0;
    v_authenticity_score INTEGER := 0;
    v_max_severity INTEGER := 0;
    v_should_reject BOOLEAN := FALSE;
    v_should_flag BOOLEAN := FALSE;
    v_reason TEXT := '';
BEGIN
    -- 合并标题和描述
    v_full_text := COALESCE(p_title, '') || ' ' || COALESCE(p_description, '');
    
    -- 检查敏感词
    FOR v_word IN 
        SELECT word, severity 
        FROM forbidden_words 
        WHERE is_active = TRUE 
        AND (
            (is_regex = FALSE AND v_full_text ILIKE '%' || word || '%')
            OR 
            (is_regex = TRUE AND v_full_text ~* word)
        )
    LOOP
        v_matched_words := array_append(v_matched_words, v_word.word);
        v_max_severity := GREATEST(v_max_severity, v_word.severity);
    END LOOP;
    
    -- 根据匹配结果判断操作
    IF v_max_severity >= 4 THEN
        v_should_reject := TRUE;
        v_reason := '内容包含严重违禁词: ' || array_to_string(v_matched_words, ', ');
    ELSIF array_length(v_matched_words, 1) > 0 THEN
        v_should_flag := TRUE;
        v_reason := '内容包含敏感词: ' || array_to_string(v_matched_words, ', ');
    END IF;
    
    -- 计算各项评分（简化版）
    v_spam_score := LEAST(100, array_length(v_matched_words, 1) * 20);
    v_ai_risk_score := 0;
    v_authenticity_score := 80;
    
    -- 记录审核日志
    INSERT INTO moderation_logs (
        content_id, content_type, user_id, action, reason, scores, matched_words
    ) VALUES (
        p_content_id,
        p_content_type,
        p_user_id,
        CASE 
            WHEN v_should_reject THEN 'auto_rejected'
            WHEN v_should_flag THEN 'flagged'
            ELSE 'auto_approved'
        END,
        v_reason,
        jsonb_build_object(
            'spam_score', v_spam_score,
            'ai_risk_score', v_ai_risk_score,
            'authenticity_score', v_authenticity_score,
            'max_severity', v_max_severity
        ),
        v_matched_words
    );
    
    -- 返回结果
    RETURN QUERY SELECT 
        NOT v_should_reject,
        CASE 
            WHEN v_should_reject THEN 'reject'::TEXT
            WHEN v_should_flag THEN 'flag'::TEXT
            ELSE 'approve'::TEXT
        END,
        v_reason,
        v_matched_words,
        jsonb_build_object(
            'spam_score', v_spam_score,
            'ai_risk_score', v_ai_risk_score,
            'authenticity_score', v_authenticity_score,
            'max_severity', v_max_severity
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

SELECT '内容审核系统创建完成!' as result;
