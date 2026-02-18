-- 创建文化知识库表（如果不存在）
CREATE TABLE IF NOT EXISTS cultural_knowledge (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100) NOT NULL,
    subcategory VARCHAR(100),
    content TEXT NOT NULL,
    image_url VARCHAR(500),
    tags TEXT[] DEFAULT '{}',
    related_items TEXT[] DEFAULT '{}',
    sources TEXT[] DEFAULT '{}',
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'pending')),
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 添加注释
COMMENT ON TABLE cultural_knowledge IS '文化知识库表，存储文化知识条目';
COMMENT ON COLUMN cultural_knowledge.title IS '知识条目标题';
COMMENT ON COLUMN cultural_knowledge.category IS '知识分类';
COMMENT ON COLUMN cultural_knowledge.subcategory IS '子分类';
COMMENT ON COLUMN cultural_knowledge.content IS '知识内容';
COMMENT ON COLUMN cultural_knowledge.image_url IS '封面图片URL';
COMMENT ON COLUMN cultural_knowledge.tags IS '标签数组';
COMMENT ON COLUMN cultural_knowledge.related_items IS '相关条目ID数组';
COMMENT ON COLUMN cultural_knowledge.sources IS '参考来源数组';
COMMENT ON COLUMN cultural_knowledge.status IS '状态：active-已发布, inactive-已下架, pending-待审核';

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_category ON cultural_knowledge(category);
CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_status ON cultural_knowledge(status);
CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_created_at ON cultural_knowledge(created_at DESC);

-- 创建全文搜索索引（用于标题和内容的搜索）
-- 使用 simple 配置支持多语言，包括中文
CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_search ON cultural_knowledge 
USING gin(to_tsvector('simple', title || ' ' || COALESCE(content, '')));

-- 创建更新时间触发器
CREATE OR REPLACE FUNCTION update_cultural_knowledge_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_cultural_knowledge_updated_at ON cultural_knowledge;
CREATE TRIGGER trigger_update_cultural_knowledge_updated_at
    BEFORE UPDATE ON cultural_knowledge
    FOR EACH ROW
    EXECUTE FUNCTION update_cultural_knowledge_updated_at();

-- 创建文化资源存储 bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('cultural-assets', 'cultural-assets', true)
ON CONFLICT (id) DO NOTHING;

-- 设置文化资源存储的 RLS 策略
-- 允许公开读取
DROP POLICY IF EXISTS "Allow public read access on cultural-assets bucket" ON storage.objects;
CREATE POLICY "Allow public read access on cultural-assets bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cultural-assets');

-- 允许认证用户上传
DROP POLICY IF EXISTS "Allow authenticated users to upload cultural-assets" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload cultural-assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cultural-assets');

-- 允许认证用户删除
DROP POLICY IF EXISTS "Allow authenticated users to delete cultural-assets" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete cultural-assets"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'cultural-assets');

-- 允许认证用户更新
DROP POLICY IF EXISTS "Allow authenticated users to update cultural-assets" ON storage.objects;
CREATE POLICY "Allow authenticated users to update cultural-assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'cultural-assets');

-- 设置表的 RLS 策略
ALTER TABLE cultural_knowledge ENABLE ROW LEVEL SECURITY;

-- 允许所有人读取已发布的内容
DROP POLICY IF EXISTS "Allow public read active knowledge" ON cultural_knowledge;
CREATE POLICY "Allow public read active knowledge"
  ON cultural_knowledge FOR SELECT
  USING (status = 'active');

-- 允许认证用户读取所有内容（包括未发布）
DROP POLICY IF EXISTS "Allow authenticated read all knowledge" ON cultural_knowledge;
CREATE POLICY "Allow authenticated read all knowledge"
  ON cultural_knowledge FOR SELECT
  TO authenticated
  USING (true);

-- 允许认证用户插入
DROP POLICY IF EXISTS "Allow authenticated insert knowledge" ON cultural_knowledge;
CREATE POLICY "Allow authenticated insert knowledge"
  ON cultural_knowledge FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 允许认证用户更新
DROP POLICY IF EXISTS "Allow authenticated update knowledge" ON cultural_knowledge;
CREATE POLICY "Allow authenticated update knowledge"
  ON cultural_knowledge FOR UPDATE
  TO authenticated
  USING (true);

-- 允许认证用户删除
DROP POLICY IF EXISTS "Allow authenticated delete knowledge" ON cultural_knowledge;
CREATE POLICY "Allow authenticated delete knowledge"
  ON cultural_knowledge FOR DELETE
  TO authenticated
  USING (true);
