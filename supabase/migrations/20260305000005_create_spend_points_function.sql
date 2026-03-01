-- 创建 spend_points 函数用于扣除用户积分

CREATE OR REPLACE FUNCTION spend_points(
    p_user_id UUID,
    p_points INTEGER,
    p_source TEXT,
    p_description TEXT
)
RETURNS TABLE (
    success BOOLEAN,
    new_balance INTEGER,
    message TEXT
) AS $$
DECLARE
    v_balance INTEGER;
    v_new_balance INTEGER;
BEGIN
    -- 获取当前积分
    SELECT balance INTO v_balance
    FROM user_points_balance
    WHERE user_id = p_user_id;

    -- 检查积分是否足够
    IF v_balance IS NULL OR v_balance < p_points THEN
        RETURN QUERY SELECT false, COALESCE(v_balance, 0), '积分不足'::TEXT;
        RETURN;
    END IF;

    -- 扣除积分
    UPDATE user_points_balance
    SET balance = balance - p_points,
        total_spent = total_spent + p_points,
        last_updated_at = NOW()
    WHERE user_id = p_user_id
    RETURNING balance INTO v_new_balance;

    -- 记录积分变动
    INSERT INTO points_records (
        user_id,
        points,
        type,
        source,
        source_type,
        description,
        balance_after,
        related_id,
        created_at
    ) VALUES (
        p_user_id,
        -p_points,
        'spent',
        p_source,
        'exchange',
        p_description,
        v_new_balance,
        NULL,
        NOW()
    );

    RETURN QUERY SELECT true, v_new_balance, '扣除成功'::TEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 添加注释
COMMENT ON FUNCTION spend_points IS '扣除用户积分并记录交易';
