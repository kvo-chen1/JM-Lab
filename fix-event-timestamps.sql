-- ============================================
-- 修复活动时间戳格式（秒级转毫秒级）
-- ============================================

-- 检查当前时间戳数据
SELECT 
    id,
    title,
    start_date,
    end_date,
    created_at,
    updated_at,
    -- 判断时间戳是否为秒级（小于 2000000000 表示秒级时间戳）
    CASE 
        WHEN start_date < 2000000000 THEN '秒级' 
        ELSE '毫秒级' 
    END as start_date_unit,
    CASE 
        WHEN end_date < 2000000000 THEN '秒级' 
        ELSE '毫秒级' 
    END as end_date_unit
FROM events;

-- 修复秒级时间戳为毫秒级
UPDATE events
SET 
    start_date = start_date * 1000,
    end_date = end_date * 1000,
    created_at = created_at * 1000,
    updated_at = updated_at * 1000
WHERE start_date < 2000000000;  -- 只修复秒级时间戳（小于20亿的是秒级）

-- 验证修复结果
SELECT 
    id,
    title,
    to_timestamp(start_date / 1000) as start_date_readable,
    to_timestamp(end_date / 1000) as end_date_readable,
    to_timestamp(created_at / 1000) as created_at_readable
FROM events;
