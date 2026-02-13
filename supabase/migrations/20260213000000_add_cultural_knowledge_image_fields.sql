-- 为 cultural_knowledge 表添加图片生成相关字段
-- 用于支持文化知识库图片预生成与缓存功能

-- 1. 添加图片生成相关字段
ALTER TABLE cultural_knowledge
ADD COLUMN IF NOT EXISTS image_prompt TEXT,
ADD COLUMN IF NOT EXISTS image_generated_at TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS image_generation_status VARCHAR(50) DEFAULT 'pending';

-- 2. 添加约束：图片生成状态只能是特定值
ALTER TABLE cultural_knowledge
DROP CONSTRAINT IF EXISTS chk_image_generation_status;

ALTER TABLE cultural_knowledge
ADD CONSTRAINT chk_image_generation_status 
CHECK (image_generation_status IN ('pending', 'generating', 'completed', 'failed'));

-- 3. 添加索引：按图片生成状态查询
CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_image_status 
ON cultural_knowledge(image_generation_status) 
WHERE image_generation_status IN ('pending', 'failed');

-- 4. 添加索引：按图片生成时间查询（用于清理旧图片）
CREATE INDEX IF NOT EXISTS idx_cultural_knowledge_image_generated_at 
ON cultural_knowledge(image_generated_at);

-- 5. 创建文化知识图片存储 bucket（如果不存在）
INSERT INTO storage.buckets (id, name, public)
VALUES ('cultural-knowledge', 'cultural-knowledge', true)
ON CONFLICT (id) DO NOTHING;

-- 6. 设置文化知识图片存储的 RLS 策略
-- 允许公开读取
CREATE POLICY "Allow public read access on cultural-knowledge bucket"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'cultural-knowledge');

-- 允许认证用户上传
CREATE POLICY "Allow authenticated users to upload cultural-knowledge images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'cultural-knowledge');

-- 允许认证用户删除
CREATE POLICY "Allow authenticated users to delete cultural-knowledge images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'cultural-knowledge');

-- 7. 创建批量更新图片生成状态的函数
CREATE OR REPLACE FUNCTION update_cultural_knowledge_image_status(
  p_id INTEGER,
  p_status VARCHAR(50),
  p_image_url VARCHAR(255) DEFAULT NULL,
  p_prompt TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE cultural_knowledge
  SET 
    image_generation_status = p_status,
    image_url = COALESCE(p_image_url, image_url),
    image_prompt = COALESCE(p_prompt, image_prompt),
    image_generated_at = CASE 
      WHEN p_status = 'completed' THEN NOW()
      ELSE image_generated_at
    END,
    updated_at = NOW()
  WHERE id = p_id;
END;
$$;

-- 8. 创建获取需要生成图片的文化知识列表函数
CREATE OR REPLACE FUNCTION get_pending_cultural_knowledge_images(
  p_limit INTEGER DEFAULT 10
)
RETURNS TABLE (
  id INTEGER,
  title VARCHAR(255),
  content TEXT,
  category VARCHAR(100),
  tags TEXT[],
  image_url VARCHAR(255)
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ck.id,
    ck.title,
    ck.content,
    ck.category,
    ck.tags,
    ck.image_url
  FROM cultural_knowledge ck
  WHERE ck.image_generation_status IN ('pending', 'failed')
     OR (ck.image_url IS NULL AND ck.image_generation_status = 'pending')
  ORDER BY ck.created_at ASC
  LIMIT p_limit;
END;
$$;

COMMENT ON TABLE cultural_knowledge IS '文化知识库表，支持图片预生成与缓存';
COMMENT ON COLUMN cultural_knowledge.image_prompt IS '生成图片使用的prompt';
COMMENT ON COLUMN cultural_knowledge.image_generated_at IS '图片生成时间';
COMMENT ON COLUMN cultural_knowledge.image_generation_status IS '图片生成状态：pending/generating/completed/failed';
