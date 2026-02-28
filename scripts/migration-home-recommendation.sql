-- 首页推荐位管理功能数据库迁移脚本
-- 创建时间：2026-02-28
-- 功能：支持首页推荐内容的可视化拖拽排序管理

-- ============================================
-- 1. 创建首页推荐表
-- ============================================
CREATE TABLE IF NOT EXISTS home_recommendations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_id VARCHAR(255) NOT NULL,
    item_type VARCHAR(50) NOT NULL,
    title VARCHAR(500) NOT NULL,
    description TEXT,
    thumbnail VARCHAR(1000),
    order_index INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    start_date TIMESTAMP,
    end_date TIMESTAMP,
    click_count INTEGER DEFAULT 0,
    impression_count INTEGER DEFAULT 0,
    created_by VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    metadata JSONB DEFAULT '{}'::jsonb,
    
    -- 索引
    CONSTRAINT unique_item UNIQUE (item_id, item_type)
);

-- 添加列注释
COMMENT ON COLUMN home_recommendations.item_id IS '推荐项 ID（作品 ID、活动 ID、模板 ID 等）';
COMMENT ON COLUMN home_recommendations.item_type IS '推荐项类型：work, event, template, challenge';
COMMENT ON COLUMN home_recommendations.title IS '推荐项标题';
COMMENT ON COLUMN home_recommendations.description IS '推荐项描述';
COMMENT ON COLUMN home_recommendations.thumbnail IS '缩略图 URL';
COMMENT ON COLUMN home_recommendations.order_index IS '排序索引，数值越小越靠前';
COMMENT ON COLUMN home_recommendations.is_active IS '是否激活';
COMMENT ON COLUMN home_recommendations.start_date IS '开始显示时间';
COMMENT ON COLUMN home_recommendations.end_date IS '结束显示时间';
COMMENT ON COLUMN home_recommendations.click_count IS '点击次数';
COMMENT ON COLUMN home_recommendations.impression_count IS '曝光次数';
COMMENT ON COLUMN home_recommendations.created_by IS '创建人 ID';
COMMENT ON COLUMN home_recommendations.created_at IS '创建时间';
COMMENT ON COLUMN home_recommendations.updated_at IS '更新时间';
COMMENT ON COLUMN home_recommendations.metadata IS '额外元数据';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_home_recommendations_order ON home_recommendations(order_index);
CREATE INDEX IF NOT EXISTS idx_home_recommendations_active ON home_recommendations(is_active);
CREATE INDEX IF NOT EXISTS idx_home_recommendations_type ON home_recommendations(item_type);
CREATE INDEX IF NOT EXISTS idx_home_recommendations_dates ON home_recommendations(start_date, end_date);
CREATE INDEX IF NOT EXISTS idx_home_recommendations_created_by ON home_recommendations(created_by);

-- 添加注释
COMMENT ON TABLE home_recommendations IS '首页推荐位配置表';
COMMENT ON COLUMN home_recommendations.id IS '推荐项主键';
COMMENT ON COLUMN home_recommendations.item_id IS '推荐项 ID（作品 ID、活动 ID、模板 ID 等）';
COMMENT ON COLUMN home_recommendations.item_type IS '推荐项类型：work(作品), event(活动), template(模板), challenge(挑战)';
COMMENT ON COLUMN home_recommendations.title IS '推荐项标题';
COMMENT ON COLUMN home_recommendations.description IS '推荐项描述';
COMMENT ON COLUMN home_recommendations.thumbnail IS '缩略图 URL';
COMMENT ON COLUMN home_recommendations.order_index IS '排序索引，数值越小越靠前';
COMMENT ON COLUMN home_recommendations.is_active IS '是否激活';
COMMENT ON COLUMN home_recommendations.start_date IS '开始显示时间';
COMMENT ON COLUMN home_recommendations.end_date IS '结束显示时间';
COMMENT ON COLUMN home_recommendations.click_count IS '点击次数';
COMMENT ON COLUMN home_recommendations.impression_count IS '曝光次数';
COMMENT ON COLUMN home_recommendations.created_by IS '创建人 ID';
COMMENT ON COLUMN home_recommendations.created_at IS '创建时间';
COMMENT ON COLUMN home_recommendations.updated_at IS '更新时间';
COMMENT ON COLUMN home_recommendations.metadata IS '额外元数据';

-- ============================================
-- 2. 创建推荐操作日志表
-- ============================================
CREATE TABLE IF NOT EXISTS recommendation_operation_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    operation_type VARCHAR(50) NOT NULL,
    item_id VARCHAR(255) NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    operated_by VARCHAR(255) NOT NULL,
    operated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    notes TEXT
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_rec_logs_operation_type ON recommendation_operation_logs(operation_type);
CREATE INDEX IF NOT EXISTS idx_rec_logs_item_id ON recommendation_operation_logs(item_id);
CREATE INDEX IF NOT EXISTS idx_rec_logs_operated_by ON recommendation_operation_logs(operated_by);
CREATE INDEX IF NOT EXISTS idx_rec_logs_operated_at ON recommendation_operation_logs(operated_at);

-- 添加注释
COMMENT ON TABLE recommendation_operation_logs IS '推荐位操作日志表';
COMMENT ON COLUMN recommendation_operation_logs.id IS '日志主键';
COMMENT ON COLUMN recommendation_operation_logs.operation_type IS '操作类型：create, update, delete, reorder, activate, deactivate';
COMMENT ON COLUMN recommendation_operation_logs.item_id IS '推荐项 ID';
COMMENT ON COLUMN recommendation_operation_logs.previous_value IS '操作前的值';
COMMENT ON COLUMN recommendation_operation_logs.new_value IS '操作后的值';
COMMENT ON COLUMN recommendation_operation_logs.operated_by IS '操作人 ID';
COMMENT ON COLUMN recommendation_operation_logs.operated_at IS '操作时间';
COMMENT ON COLUMN recommendation_operation_logs.notes IS '操作备注';

-- ============================================
-- 3. 创建点击统计函数
-- ============================================
-- 删除已存在的函数（如果存在）
DROP FUNCTION IF EXISTS increment_recommendation_click(UUID);

CREATE OR REPLACE FUNCTION increment_recommendation_click(p_item_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE home_recommendations
    SET click_count = COALESCE(click_count, 0) + 1,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_recommendation_click IS '增加推荐项点击次数';

-- ============================================
-- 4. 创建曝光统计函数
-- ============================================
-- 删除已存在的函数（如果存在）
DROP FUNCTION IF EXISTS increment_recommendation_impression(UUID, INTEGER);

CREATE OR REPLACE FUNCTION increment_recommendation_impression(p_item_id UUID, p_count INTEGER DEFAULT 1)
RETURNS VOID AS $$
BEGIN
    UPDATE home_recommendations
    SET impression_count = COALESCE(impression_count, 0) + p_count,
        updated_at = CURRENT_TIMESTAMP
    WHERE id = p_item_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION increment_recommendation_impression IS '增加推荐项曝光次数';

-- ============================================
-- 5. 创建自动更新 updated_at 的触发器
-- ============================================
-- 先删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS trg_update_home_recommendations_updated_at ON home_recommendations;

-- 删除已存在的函数（如果存在）
DROP FUNCTION IF EXISTS update_home_recommendations_updated_at();

-- 创建函数
CREATE OR REPLACE FUNCTION update_home_recommendations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 创建触发器
CREATE TRIGGER trg_update_home_recommendations_updated_at
    BEFORE UPDATE ON home_recommendations
    FOR EACH ROW
    EXECUTE FUNCTION update_home_recommendations_updated_at();

-- ============================================
-- 6. 插入示例数据（可选）
-- ============================================
-- 注意：实际使用时请根据实际情况调整或删除此部分
INSERT INTO home_recommendations (item_id, item_type, title, description, thumbnail, order_index, is_active, metadata)
VALUES 
    ('demo_1', 'work', '津门文化创意设计', '展示天津传统文化与现代设计的完美结合', '/api/placeholder/400/200', 0, true, '{"category": "culture"}'::jsonb),
    ('demo_2', 'event', '2026 文化创意大赛', '年度最具影响力的文化创意赛事', '/api/placeholder/400/200', 1, true, '{"start_date": "2026-03-01"}'::jsonb),
    ('demo_3', 'template', '国潮风格模板', '融合中国传统元素的现代设计模板', '/api/placeholder/400/200', 2, true, '{"category": "design"}'::jsonb),
    ('demo_4', 'work', '传统工艺现代演绎', '非遗工艺在现代设计中的创新应用', '/api/placeholder/400/200', 3, true, '{"category": "craft"}'::jsonb),
    ('demo_5', 'challenge', '城市印象创作挑战', '用创意记录城市美好瞬间', '/api/placeholder/400/200', 4, false, '{"category": "city"}'::jsonb)
ON CONFLICT (item_id, item_type) DO NOTHING;

-- ============================================
-- 7. 权限设置（如果需要）
-- ============================================
-- 注意：根据实际数据库权限配置调整
-- GRANT ALL PRIVILEGES ON home_recommendations TO admin;
-- GRANT SELECT ON home_recommendations TO readonly;
-- GRANT ALL PRIVILEGES ON recommendation_operation_logs TO admin;

-- ============================================
-- 迁移完成提示
-- ============================================
DO $$
BEGIN
    RAISE NOTICE '首页推荐位管理功能数据库迁移完成！';
    RAISE NOTICE '表 home_recommendations: 已创建或已存在';
    RAISE NOTICE '表 recommendation_operation_logs: 已创建或已存在';
    RAISE NOTICE '函数 increment_recommendation_click: 已创建或已更新';
    RAISE NOTICE '函数 increment_recommendation_impression: 已创建或已更新';
    RAISE NOTICE '触发器 trg_update_home_recommendations_updated_at: 已创建或已更新';
    RAISE NOTICE '示例数据：已插入（如存在冲突则跳过）';
END $$;
