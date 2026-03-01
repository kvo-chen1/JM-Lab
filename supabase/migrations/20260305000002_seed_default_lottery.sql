-- 创建默认转盘活动和奖品
-- 在 lottery_spin_records 表创建后执行

-- 检查是否已存在默认活动
DO $$
DECLARE
    v_activity_id UUID;
    v_prize_id UUID;
BEGIN
    -- 检查是否已存在默认活动
    SELECT id INTO v_activity_id FROM lottery_activities WHERE name = '幸运大转盘' LIMIT 1;
    
    IF v_activity_id IS NULL THEN
        -- 创建默认活动
        INSERT INTO lottery_activities (
            name,
            description,
            status,
            start_time,
            end_time,
            spin_cost,
            daily_limit,
            total_limit,
            created_by
        ) VALUES (
            '幸运大转盘',
            '消耗积分参与抽奖，赢取丰厚奖励',
            'active',
            NOW(),
            NOW() + INTERVAL '1 year',
            50,
            -1,
            -1,
            NULL
        )
        RETURNING id INTO v_activity_id;
        
        RAISE NOTICE 'Created default lottery activity with ID: %', v_activity_id;
        
        -- 创建奖品
        -- 1. 谢谢参与 (15%)
        INSERT INTO lottery_prizes (activity_id, name, description, probability, points, stock, sort_order, is_enabled, is_rare)
        VALUES (v_activity_id, '谢谢参与', '很遗憾，这次没有中奖', 0.15, 0, -1, 0, true, false);
        
        -- 2. 虚拟红包 (20%)
        INSERT INTO lottery_prizes (activity_id, name, description, probability, points, stock, sort_order, is_enabled, is_rare)
        VALUES (v_activity_id, '虚拟红包', '价值10积分的虚拟红包', 0.20, 10, -1, 1, true, false);
        
        -- 3. 创室贴纸包 (18%)
        INSERT INTO lottery_prizes (activity_id, name, description, probability, points, stock, sort_order, is_enabled, is_rare)
        VALUES (v_activity_id, '创室贴纸包', '创意工作室贴纸包', 0.18, 50, 1000, 2, true, false);
        
        -- 4. AI 创作工具包 (12%)
        INSERT INTO lottery_prizes (activity_id, name, description, probability, points, stock, sort_order, is_enabled, is_rare)
        VALUES (v_activity_id, 'AI 创作工具包', 'AI创作工具包，助力创作', 0.12, 100, 500, 3, true, false);
        
        -- 5. 谢谢参与 (15%)
        INSERT INTO lottery_prizes (activity_id, name, description, probability, points, stock, sort_order, is_enabled, is_rare)
        VALUES (v_activity_id, '谢谢参与', '很遗憾，这次没有中奖', 0.15, 0, -1, 4, true, false);
        
        -- 6. 专属成就徽章 (5%)
        INSERT INTO lottery_prizes (activity_id, name, description, probability, points, stock, sort_order, is_enabled, is_rare)
        VALUES (v_activity_id, '专属成就徽章', '限量版专属成就徽章', 0.05, 500, 100, 5, true, true);
        
        -- 7. 数字壁纸 (12%)
        INSERT INTO lottery_prizes (activity_id, name, description, probability, points, stock, sort_order, is_enabled, is_rare)
        VALUES (v_activity_id, '数字壁纸', '精美数字壁纸', 0.12, 20, 2000, 6, true, false);
        
        -- 8. ￥10 红包 (3%)
        INSERT INTO lottery_prizes (activity_id, name, description, probability, points, stock, sort_order, is_enabled, is_rare)
        VALUES (v_activity_id, '￥10 红包', '价值1000积分的现金红包', 0.03, 1000, 50, 7, true, true);
        
        RAISE NOTICE 'Created 8 prizes for default lottery activity';
    ELSE
        RAISE NOTICE 'Default lottery activity already exists with ID: %', v_activity_id;
    END IF;
END $$;

-- 创建获取默认活动ID的函数
CREATE OR REPLACE FUNCTION get_default_lottery_activity_id()
RETURNS UUID AS $$
DECLARE
    v_activity_id UUID;
BEGIN
    SELECT id INTO v_activity_id FROM lottery_activities WHERE name = '幸运大转盘' LIMIT 1;
    RETURN v_activity_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
