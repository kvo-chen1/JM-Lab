-- ==========================================================================
-- 创建自动化内容审核系统
-- 包含违禁词库、审核规则配置、审核日志
-- ==========================================================================

-- 1. 创建违禁词库表
CREATE TABLE IF NOT EXISTS public.forbidden_words (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    word TEXT NOT NULL UNIQUE,
    category TEXT NOT NULL DEFAULT 'general', -- general, violence, pornography, politics, spam, etc.
    severity INTEGER NOT NULL DEFAULT 1 CHECK (severity >= 1 AND severity <= 5), -- 1-5级严重程度
    is_regex BOOLEAN DEFAULT FALSE, -- 是否为正则表达式
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_forbidden_words_category ON public.forbidden_words(category);
CREATE INDEX IF NOT EXISTS idx_forbidden_words_active ON public.forbidden_words(is_active);

-- 添加注释
COMMENT ON TABLE public.forbidden_words IS '违禁词库';
COMMENT ON COLUMN public.forbidden_words.severity IS '严重程度 1-5，5级最严重';

-- 2. 创建审核规则配置表
CREATE TABLE IF NOT EXISTS public.moderation_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    rule_type TEXT NOT NULL CHECK (rule_type IN ('sensitive_words', 'spam_detection', 'ai_generated', 'cultural_authenticity')),
    enabled BOOLEAN DEFAULT TRUE,
    threshold INTEGER NOT NULL CHECK (threshold >= 0 AND threshold <= 100),
    auto_action TEXT NOT NULL DEFAULT 'flag' CHECK (auto_action IN ('none', 'flag', 'reject')),
    config JSONB DEFAULT '{}'::jsonb, -- 额外配置参数
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建唯一索引，确保每种规则类型只有一条记录
CREATE UNIQUE INDEX IF NOT EXISTS idx_moderation_rules_type ON public.moderation_rules(rule_type);

COMMENT ON TABLE public.moderation_rules IS '内容审核规则配置';

-- 3. 创建内容审核日志表
CREATE TABLE IF NOT EXISTS public.moderation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('work', 'post', 'comment', 'activity')),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL CHECK (action IN ('auto_approved', 'auto_rejected', 'manual_approved', 'manual_rejected', 'flagged')),
    reason TEXT,
    scores JSONB DEFAULT '{}'::jsonb, -- 存储各项评分
    matched_words TEXT[] DEFAULT '{}', -- 匹配到的违禁词
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_moderation_logs_content ON public.moderation_logs(content_id, content_type);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_user ON public.moderation_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_action ON public.moderation_logs(action);
CREATE INDEX IF NOT EXISTS idx_moderation_logs_created ON public.moderation_logs(created_at DESC);

COMMENT ON TABLE public.moderation_logs IS '内容审核日志';

-- 4. 插入默认违禁词
INSERT INTO public.forbidden_words (word, category, severity, is_regex) VALUES
-- 暴力相关
('暴力', 'violence', 4, FALSE),
('杀人', 'violence', 5, FALSE),
('血腥', 'violence', 4, FALSE),
('武器', 'violence', 3, FALSE),
('炸弹', 'violence', 5, FALSE),
('枪支', 'violence', 4, FALSE),
-- 色情相关
('色情', 'pornography', 4, FALSE),
('淫秽', 'pornography', 5, FALSE),
('裸体', 'pornography', 4, FALSE),
('性服务', 'pornography', 5, FALSE),
-- 政治敏感
('反动', 'politics', 5, FALSE),
('颠覆', 'politics', 4, FALSE),
('分裂', 'politics', 4, FALSE),
('邪教', 'politics', 5, FALSE),
-- 垃圾信息
('刷单', 'spam', 3, FALSE),
('兼职赚钱', 'spam', 3, FALSE),
('快速致富', 'spam', 3, FALSE),
('免费领', 'spam', 2, FALSE),
('点击领取', 'spam', 2, FALSE),
('限时抢购', 'spam', 1, FALSE)
ON CONFLICT (word) DO NOTHING;

-- 5. 插入默认审核规则
INSERT INTO public.moderation_rules (name, rule_type, enabled, threshold, auto_action, config) VALUES
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

DROP TRIGGER IF EXISTS trigger_update_forbidden_words ON public.forbidden_words;
CREATE TRIGGER trigger_update_forbidden_words
    BEFORE UPDATE ON public.forbidden_words
    FOR EACH ROW EXECUTE FUNCTION update_moderation_timestamp();

DROP TRIGGER IF EXISTS trigger_update_moderation_rules ON public.moderation_rules;
CREATE TRIGGER trigger_update_moderation_rules
    BEFORE UPDATE ON public.moderation_rules
    FOR EACH ROW EXECUTE FUNCTION update_moderation_timestamp();

-- 7. 创建内容审核函数
CREATE OR REPLACE FUNCTION moderate_content(
    p_content_id UUID,
    p_content_type TEXT,
    p_title TEXT,
    p_description TEXT,
    p_user_id UUID DEFAULT NULL
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
    -- 合并文本内容
    v_full_text := COALESCE(p_title, '') || ' ' || COALESCE(p_description, '');
    
    -- ========== 1. 敏感词检测 ==========
    SELECT * INTO v_rule FROM public.moderation_rules 
    WHERE rule_type = 'sensitive_words' AND enabled = TRUE;
    
    IF FOUND THEN
        FOR v_word IN SELECT * FROM public.forbidden_words WHERE is_active = TRUE LOOP
            IF v_word.is_regex THEN
                IF v_full_text ~* v_word.word THEN
                    v_matched_words := array_append(v_matched_words, v_word.word);
                    v_max_severity := GREATEST(v_max_severity, v_word.severity);
                END IF;
            ELSE
                IF v_full_text ILIKE '%' || v_word.word || '%' THEN
                    v_matched_words := array_append(v_matched_words, v_word.word);
                    v_max_severity := GREATEST(v_max_severity, v_word.severity);
                END IF;
            END IF;
        END LOOP;
        
        -- 如果匹配到严重程度>=阈值的违禁词，自动拒绝
        IF v_max_severity >= v_rule.threshold THEN
            v_should_reject := TRUE;
            v_reason := '内容包含违禁词';
        END IF;
    END IF;
    
    -- ========== 2. 垃圾内容评分 ==========
    SELECT * INTO v_rule FROM public.moderation_rules 
    WHERE rule_type = 'spam_detection' AND enabled = TRUE;
    
    IF FOUND THEN
        -- 检查重复字符
        IF v_full_text ~ '(.)\1{4,}' THEN
            v_spam_score := v_spam_score + 20;
        END IF;
        
        -- 检查链接数量
        IF array_length(regexp_matches(v_full_text, 'http', 'g'), 1) > 3 THEN
            v_spam_score := v_spam_score + 15;
        END IF;
        
        -- 检查内容长度
        IF LENGTH(v_full_text) < 20 THEN
            v_spam_score := v_spam_score + 25;
        END IF;
        
        -- 检查特殊字符比例
        IF LENGTH(regexp_replace(v_full_text, '[\w\s\u4e00-\u9fa5]', '', 'g'))::FLOAT / NULLIF(LENGTH(v_full_text), 0) > 0.3 THEN
            v_spam_score := v_spam_score + 15;
        END IF;
        
        v_spam_score := LEAST(v_spam_score, 100);
        
        -- 根据阈值决定操作
        IF v_spam_score >= v_rule.threshold THEN
            IF v_rule.auto_action = 'reject' THEN
                v_should_reject := TRUE;
                v_reason := COALESCE(v_reason || '; ', '') || '垃圾内容风险过高';
            ELSIF v_rule.auto_action = 'flag' THEN
                v_should_flag := TRUE;
            END IF;
        END IF;
    END IF;
    
    -- ========== 3. AI生成风险评分 ==========
    SELECT * INTO v_rule FROM public.moderation_rules 
    WHERE rule_type = 'ai_generated' AND enabled = TRUE;
    
    IF FOUND AND LENGTH(v_full_text) >= COALESCE((v_rule.config->>'min_text_length')::INTEGER, 50) THEN
        -- 检查过于完美的格式
        IF v_full_text ~ '^[\u4e00-\u9fa5]+[，。！？]' AND 
           (LENGTH(regexp_replace(v_full_text, '[^，。！？]', '', 'g'))::FLOAT / NULLIF(LENGTH(v_full_text), 0)) > 0.05 THEN
            v_ai_risk_score := v_ai_risk_score + 20;
        END IF;
        
        -- 检查重复模式
        IF (SELECT COUNT(DISTINCT s) FROM unnest(string_to_array(v_full_text, '。')) s) < 
           (SELECT COUNT(*) FROM unnest(string_to_array(v_full_text, '。')) s) * 0.7 
           AND LENGTH(v_full_text) > 100 THEN
            v_ai_risk_score := v_ai_risk_score + 25;
        END IF;
        
        -- 检查过于通用的表达
        IF v_full_text ~ '(众所周知|不言而喻|总而言之|综上所述|首先.*其次.*最后)' THEN
            v_ai_risk_score := v_ai_risk_score + 15;
        END IF;
        
        v_ai_risk_score := LEAST(v_ai_risk_score, 100);
        
        IF v_ai_risk_score >= v_rule.threshold THEN
            IF v_rule.auto_action = 'reject' THEN
                v_should_reject := TRUE;
                v_reason := COALESCE(v_reason || '; ', '') || '疑似AI生成内容';
            ELSIF v_rule.auto_action = 'flag' THEN
                v_should_flag := TRUE;
            END IF;
        END IF;
    END IF;
    
    -- ========== 4. 文化真实性评分 ==========
    SELECT * INTO v_rule FROM public.moderation_rules 
    WHERE rule_type = 'cultural_authenticity' AND enabled = TRUE;
    
    IF FOUND THEN
        -- 检测文化元素
        IF v_full_text ~* '(京剧|昆曲|书法|国画|剪纸|刺绣|陶瓷|丝绸|茶道|中医|武术|太极|春节|中秋|端午|清明|故宫|长城|敦煌)' THEN
            v_authenticity_score := v_authenticity_score + 30;
        END IF;
        
        IF v_full_text ~* '(龙舟|舞狮|舞龙|花灯|庙会|年画|皮影|木偶戏|杂技|非遗|传统技艺)' THEN
            v_authenticity_score := v_authenticity_score + 25;
        END IF;
        
        IF LENGTH(v_full_text) > 100 THEN
            v_authenticity_score := v_authenticity_score + 10;
        END IF;
        
        v_authenticity_score := LEAST(v_authenticity_score, 100);
    END IF;
    
    -- ========== 5. 记录审核日志 ==========
    INSERT INTO public.moderation_logs (
        content_id, content_type, user_id, action, reason, 
        scores, matched_words
    ) VALUES (
        p_content_id, p_content_type, p_user_id,
        CASE 
            WHEN v_should_reject THEN 'auto_rejected'
            WHEN v_should_flag THEN 'flagged'
            ELSE 'auto_approved'
        END,
        CASE WHEN v_reason = '' THEN NULL ELSE v_reason END,
        jsonb_build_object(
            'spam_score', v_spam_score,
            'ai_risk_score', v_ai_risk_score,
            'authenticity_score', v_authenticity_score,
            'max_severity', v_max_severity
        ),
        v_matched_words
    );
    
    -- ========== 6. 返回结果 ==========
    RETURN QUERY SELECT 
        NOT v_should_reject,
        CASE 
            WHEN v_should_reject THEN 'reject'
            WHEN v_should_flag THEN 'flag'
            ELSE 'approve'
        END,
        CASE 
            WHEN v_reason = '' THEN NULL 
            ELSE v_reason 
        END,
        v_matched_words,
        jsonb_build_object(
            'spam_score', v_spam_score,
            'ai_risk_score', v_ai_risk_score,
            'authenticity_score', v_authenticity_score,
            'max_severity', v_max_severity
        );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION moderate_content IS '自动审核内容，返回审核结果';

-- 8. 确保 users 表有 role 列
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE public.users ADD COLUMN role VARCHAR(50) DEFAULT 'user';
    END IF;
END $$;

-- 9. 启用 RLS
ALTER TABLE public.forbidden_words ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.moderation_logs ENABLE ROW LEVEL SECURITY;

-- 10. 删除旧策略（如果存在）
DROP POLICY IF EXISTS "Admin can manage forbidden words" ON public.forbidden_words;
DROP POLICY IF EXISTS "Admin can manage moderation rules" ON public.moderation_rules;
DROP POLICY IF EXISTS "Admin can view moderation logs" ON public.moderation_logs;

-- 11. 创建 RLS 策略（仅允许服务角色或管理员访问）
-- 对于服务角色（server-side），绕过 RLS
-- 对于普通用户，需要是管理员

CREATE POLICY "Admin can manage forbidden words" ON public.forbidden_words
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin can manage moderation rules" ON public.moderation_rules
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

CREATE POLICY "Admin can view moderation logs" ON public.moderation_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.users 
            WHERE id = auth.uid() 
            AND role = 'admin'
        )
    );

-- 12. 完成
NOTIFY pgrst, 'reload schema';
