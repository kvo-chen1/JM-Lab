-- 修复 moderation_logs 表的所有列类型

-- 先删除现有数据（避免类型转换错误）
TRUNCATE TABLE moderation_logs;

-- 修改列类型
ALTER TABLE moderation_logs 
    ALTER COLUMN content_id TYPE TEXT,
    ALTER COLUMN user_id TYPE TEXT;

-- 重新创建 moderate_content 函数
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

SELECT 'moderation_logs 表修复完成!' as result;
