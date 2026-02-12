-- 添加模板浏览量字段
ALTER TABLE tianjin_templates
ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0;

-- 创建索引优化查询性能
CREATE INDEX IF NOT EXISTS idx_tianjin_templates_view_count ON tianjin_templates(view_count DESC);

-- 添加注释
COMMENT ON COLUMN tianjin_templates.view_count IS '模板浏览次数';
