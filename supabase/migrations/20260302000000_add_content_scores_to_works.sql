-- ==========================================================================
-- 为 works 表添加内容评分字段
-- 用于存储 AI 计算的真实性、风险评分
-- ==========================================================================

-- 1. 添加真实性评分字段
ALTER TABLE public.works
ADD COLUMN IF NOT EXISTS authenticity_score INTEGER DEFAULT 0 CHECK (authenticity_score >= 0 AND authenticity_score <= 100);

-- 2. 添加 AI 生成风险评分字段
ALTER TABLE public.works
ADD COLUMN IF NOT EXISTS ai_risk_score INTEGER DEFAULT 0 CHECK (ai_risk_score >= 0 AND ai_risk_score <= 100);

-- 3. 添加垃圾内容风险评分字段
ALTER TABLE public.works
ADD COLUMN IF NOT EXISTS spam_score INTEGER DEFAULT 0 CHECK (spam_score >= 0 AND spam_score <= 100);

-- 4. 添加文化元素标签字段（JSONB 格式存储数组）
ALTER TABLE public.works
ADD COLUMN IF NOT EXISTS cultural_elements JSONB DEFAULT '[]'::jsonb;

-- 5. 添加评分更新时间字段
ALTER TABLE public.works
ADD COLUMN IF NOT EXISTS scores_updated_at TIMESTAMPTZ;

-- 6. 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_works_authenticity_score ON public.works(authenticity_score DESC);
CREATE INDEX IF NOT EXISTS idx_works_ai_risk_score ON public.works(ai_risk_score DESC);
CREATE INDEX IF NOT EXISTS idx_works_spam_score ON public.works(spam_score DESC);

-- 7. 添加注释
COMMENT ON COLUMN public.works.authenticity_score IS '文化真实性评分 (0-100)，越高表示越真实';
COMMENT ON COLUMN public.works.ai_risk_score IS 'AI生成内容风险评分 (0-100)，越高表示越可能是AI生成';
COMMENT ON COLUMN public.works.spam_score IS '垃圾内容风险评分 (0-100)，越高表示越可能是垃圾内容';
COMMENT ON COLUMN public.works.cultural_elements IS '检测到的文化元素标签数组';
COMMENT ON COLUMN public.works.scores_updated_at IS '评分最后更新时间';

-- ==========================================================================
-- 创建自动更新 scores_updated_at 的触发器
-- ==========================================================================
CREATE OR REPLACE FUNCTION update_works_scores_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.scores_updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除旧触发器（如果存在）
DROP TRIGGER IF EXISTS trigger_update_works_scores ON public.works;

-- 创建新触发器
CREATE TRIGGER trigger_update_works_scores
    BEFORE UPDATE OF authenticity_score, ai_risk_score, spam_score ON public.works
    FOR EACH ROW
    EXECUTE FUNCTION update_works_scores_timestamp();

-- ==========================================================================
-- 创建计算内容评分的 RPC 函数
-- ==========================================================================
CREATE OR REPLACE FUNCTION calculate_content_scores(
    p_work_id UUID,
    p_content TEXT,
    p_title TEXT,
    p_description TEXT
)
RETURNS TABLE (
    authenticity_score INTEGER,
    ai_risk_score INTEGER,
    spam_score INTEGER,
    cultural_elements JSONB
) AS $$
DECLARE
    v_authenticity INTEGER := 0;
    v_ai_risk INTEGER := 0;
    v_spam INTEGER := 0;
    v_cultural JSONB := '[]'::jsonb;
    v_full_text TEXT;
BEGIN
    -- 合并文本内容
    v_full_text := COALESCE(p_title, '') || ' ' || COALESCE(p_description, '') || ' ' || COALESCE(p_content, '');
    
    -- ========== 计算垃圾内容评分 ==========
    -- 检查敏感词
    IF v_full_text ~* '(暴力|色情|赌博|毒品|诈骗|反动|违禁)' THEN
        v_spam := v_spam + 40;
    END IF;
    
    -- 检查重复字符
    IF v_full_text ~ '(.)1{4,}' THEN
        v_spam := v_spam + 20;
    END IF;
    
    -- 检查链接数量
    IF array_length(regexp_matches(v_full_text, 'http', 'g'), 1) > 3 THEN
        v_spam := v_spam + 15;
    END IF;
    
    -- 检查内容长度
    IF LENGTH(v_full_text) < 20 THEN
        v_spam := v_spam + 25;
    END IF;
    
    -- 检查特殊字符比例
    IF LENGTH(regexp_replace(v_full_text, '[\w\s\u4e00-\u9fa5]', '', 'g'))::FLOAT / NULLIF(LENGTH(v_full_text), 0) > 0.3 THEN
        v_spam := v_spam + 15;
    END IF;
    
    v_spam := LEAST(v_spam, 100);
    
    -- ========== 计算 AI 生成风险评分 ==========
    -- 检查过于完美的格式
    IF v_full_text ~ '^[\u4e00-\u9fa5]+[，。！？]' AND 
       (LENGTH(regexp_replace(v_full_text, '[^，。！？]', '', 'g'))::FLOAT / NULLIF(LENGTH(v_full_text), 0)) > 0.05 THEN
        v_ai_risk := v_ai_risk + 20;
    END IF;
    
    -- 检查重复模式
    IF (SELECT COUNT(DISTINCT s) FROM unnest(string_to_array(v_full_text, '。')) s) < 
       (SELECT COUNT(*) FROM unnest(string_to_array(v_full_text, '。')) s) * 0.7 
       AND LENGTH(v_full_text) > 100 THEN
        v_ai_risk := v_ai_risk + 25;
    END IF;
    
    -- 检查过于通用的表达
    IF v_full_text ~ '(众所周知|不言而喻|总而言之|综上所述|首先.*其次.*最后)' THEN
        v_ai_risk := v_ai_risk + 15;
    END IF;
    
    v_ai_risk := LEAST(v_ai_risk, 100);
    
    -- ========== 计算真实性评分 ==========
    -- 检测文化元素
    v_cultural := '[]'::jsonb;
    
    -- 传统文化关键词
    IF v_full_text ~* '(京剧|昆曲|书法|国画|剪纸|刺绣|陶瓷|丝绸|茶道|中医|武术|太极|春节|中秋|端午|清明)' THEN
        v_authenticity := v_authenticity + 25;
        v_cultural := v_cultural || '["传统艺术"]'::jsonb;
    END IF;
    
    -- 历史文化关键词
    IF v_full_text ~* '(故宫|长城|兵马俑|敦煌|丝绸之路|大运河|颐和园|天坛|孔庙)' THEN
        v_authenticity := v_authenticity + 25;
        v_cultural := v_cultural || '["历史遗迹"]'::jsonb;
    END IF;
    
    -- 民俗文化关键词
    IF v_full_text ~* '(龙舟|舞狮|舞龙|花灯|庙会|年画|皮影|木偶戏|杂技)' THEN
        v_authenticity := v_authenticity + 20;
        v_cultural := v_cultural || '["民俗文化"]'::jsonb;
    END IF;
    
    -- 地方特色关键词
    IF v_full_text ~* '(天津|北京|上海|广州|成都|西安|杭州|苏州|南京)' THEN
        v_authenticity := v_authenticity + 15;
        v_cultural := v_cultural || '["地方文化"]'::jsonb;
    END IF;
    
    -- 手工艺关键词
    IF v_full_text ~* '(手工|工艺|匠心|传承|非遗|民间艺术|传统技艺)' THEN
        v_authenticity := v_authenticity + 15;
        v_cultural := v_cultural || '["手工艺"]'::jsonb;
    END IF;
    
    -- 内容长度加分
    IF LENGTH(v_full_text) > 200 THEN
        v_authenticity := v_authenticity + 10;
    END IF;
    
    -- 有图片/视频加分（通过描述判断）
    IF v_full_text ~* '(图|图片|视频|作品|设计|创作)' THEN
        v_authenticity := v_authenticity + 10;
    END IF;
    
    v_authenticity := LEAST(v_authenticity, 100);
    
    -- 去重文化元素
    SELECT jsonb_agg(DISTINCT elem) INTO v_cultural
    FROM jsonb_array_elements_text(v_cultural) elem;
    
    -- 返回结果
    RETURN QUERY SELECT v_authenticity, v_ai_risk, v_spam, COALESCE(v_cultural, '[]'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION calculate_content_scores IS '计算作品内容的真实性、AI风险和垃圾内容评分';

-- ==========================================================================
-- 创建更新作品评分的 RPC 函数
-- ==========================================================================
CREATE OR REPLACE FUNCTION update_work_scores(p_work_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
    v_work RECORD;
    v_scores RECORD;
BEGIN
    -- 获取作品信息
    SELECT * INTO v_work FROM public.works WHERE id = p_work_id;
    
    IF NOT FOUND THEN
        RETURN FALSE;
    END IF;
    
    -- 计算评分
    SELECT * INTO v_scores FROM calculate_content_scores(
        p_work_id,
        v_work.content,
        v_work.title,
        v_work.description
    );
    
    -- 更新作品评分
    UPDATE public.works
    SET 
        authenticity_score = v_scores.authenticity_score,
        ai_risk_score = v_scores.ai_risk_score,
        spam_score = v_scores.spam_score,
        cultural_elements = v_scores.cultural_elements,
        scores_updated_at = NOW()
    WHERE id = p_work_id;
    
    RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
    RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION update_work_scores IS '更新指定作品的评分';

-- ==========================================================================
-- 完成
-- ==========================================================================
NOTIFY pgrst, 'reload schema';
