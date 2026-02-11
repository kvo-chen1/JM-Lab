-- 设计工坊功能相关数据库表
-- 创建用户上传作品、纹样收藏、风格预设、平铺配置等表

-- 1. 用户上传作品表
CREATE TABLE IF NOT EXISTS user_uploads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_url TEXT NOT NULL,
  file_name TEXT,
  file_type TEXT,
  file_size INTEGER,
  thumbnail_url TEXT,
  title TEXT,
  description TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 用户纹样收藏表
CREATE TABLE IF NOT EXISTS user_patterns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pattern_id INTEGER,
  custom_pattern_url TEXT,
  name TEXT,
  category TEXT,
  is_custom BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 用户风格预设表
CREATE TABLE IF NOT EXISTS user_style_presets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  styles TEXT[], -- 存储风格ID数组
  blend_ratio JSONB, -- 混合比例
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. 用户平铺图案配置表
CREATE TABLE IF NOT EXISTS user_tile_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  base_image_url TEXT,
  tile_mode TEXT, -- repeat, mirror, etc.
  spacing INTEGER DEFAULT 0,
  rotation INTEGER DEFAULT 0,
  scale FLOAT DEFAULT 1.0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 5. 用户模型预览配置表
CREATE TABLE IF NOT EXISTS user_mockup_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT,
  design_image_url TEXT,
  mockup_type TEXT, -- 模型类型：tshirt, poster, packaging等
  mockup_config JSONB, -- 模型配置参数
  preview_url TEXT, -- 预览图URL
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_user_uploads_user_id ON user_uploads(user_id);
CREATE INDEX IF NOT EXISTS idx_user_uploads_created_at ON user_uploads(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_patterns_user_id ON user_patterns(user_id);
CREATE INDEX IF NOT EXISTS idx_user_patterns_pattern_id ON user_patterns(pattern_id);

CREATE INDEX IF NOT EXISTS idx_user_style_presets_user_id ON user_style_presets(user_id);
CREATE INDEX IF NOT EXISTS idx_user_style_presets_created_at ON user_style_presets(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_tile_configs_user_id ON user_tile_configs(user_id);

CREATE INDEX IF NOT EXISTS idx_user_mockup_configs_user_id ON user_mockup_configs(user_id);
CREATE INDEX IF NOT EXISTS idx_user_mockup_configs_mockup_type ON user_mockup_configs(mockup_type);

-- 启用RLS (Row Level Security)
ALTER TABLE user_uploads ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_style_presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_tile_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_mockup_configs ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Users can view own uploads" ON user_uploads;
DROP POLICY IF EXISTS "Users can insert own uploads" ON user_uploads;
DROP POLICY IF EXISTS "Users can update own uploads" ON user_uploads;
DROP POLICY IF EXISTS "Users can delete own uploads" ON user_uploads;

DROP POLICY IF EXISTS "Users can view own patterns" ON user_patterns;
DROP POLICY IF EXISTS "Users can insert own patterns" ON user_patterns;
DROP POLICY IF EXISTS "Users can update own patterns" ON user_patterns;
DROP POLICY IF EXISTS "Users can delete own patterns" ON user_patterns;

DROP POLICY IF EXISTS "Users can view own style presets" ON user_style_presets;
DROP POLICY IF EXISTS "Users can insert own style presets" ON user_style_presets;
DROP POLICY IF EXISTS "Users can update own style presets" ON user_style_presets;
DROP POLICY IF EXISTS "Users can delete own style presets" ON user_style_presets;

DROP POLICY IF EXISTS "Users can view own tile configs" ON user_tile_configs;
DROP POLICY IF EXISTS "Users can insert own tile configs" ON user_tile_configs;
DROP POLICY IF EXISTS "Users can update own tile configs" ON user_tile_configs;
DROP POLICY IF EXISTS "Users can delete own tile configs" ON user_tile_configs;

DROP POLICY IF EXISTS "Users can view own mockup configs" ON user_mockup_configs;
DROP POLICY IF EXISTS "Users can insert own mockup configs" ON user_mockup_configs;
DROP POLICY IF EXISTS "Users can update own mockup configs" ON user_mockup_configs;
DROP POLICY IF EXISTS "Users can delete own mockup configs" ON user_mockup_configs;

-- 创建RLS策略 - 用户只能访问自己的数据

-- user_uploads 策略
CREATE POLICY "Users can view own uploads" ON user_uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own uploads" ON user_uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own uploads" ON user_uploads
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own uploads" ON user_uploads
  FOR DELETE USING (auth.uid() = user_id);

-- user_patterns 策略
CREATE POLICY "Users can view own patterns" ON user_patterns
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own patterns" ON user_patterns
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own patterns" ON user_patterns
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own patterns" ON user_patterns
  FOR DELETE USING (auth.uid() = user_id);

-- user_style_presets 策略
CREATE POLICY "Users can view own style presets" ON user_style_presets
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own style presets" ON user_style_presets
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own style presets" ON user_style_presets
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own style presets" ON user_style_presets
  FOR DELETE USING (auth.uid() = user_id);

-- user_tile_configs 策略
CREATE POLICY "Users can view own tile configs" ON user_tile_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own tile configs" ON user_tile_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own tile configs" ON user_tile_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own tile configs" ON user_tile_configs
  FOR DELETE USING (auth.uid() = user_id);

-- user_mockup_configs 策略
CREATE POLICY "Users can view own mockup configs" ON user_mockup_configs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own mockup configs" ON user_mockup_configs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own mockup configs" ON user_mockup_configs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own mockup configs" ON user_mockup_configs
  FOR DELETE USING (auth.uid() = user_id);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 删除已存在的触发器（如果存在）
DROP TRIGGER IF EXISTS update_user_uploads_updated_at ON user_uploads;
DROP TRIGGER IF EXISTS update_user_style_presets_updated_at ON user_style_presets;
DROP TRIGGER IF EXISTS update_user_mockup_configs_updated_at ON user_mockup_configs;

-- 为需要更新时间的表创建触发器
CREATE TRIGGER update_user_uploads_updated_at
  BEFORE UPDATE ON user_uploads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_style_presets_updated_at
  BEFORE UPDATE ON user_style_presets
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_mockup_configs_updated_at
  BEFORE UPDATE ON user_mockup_configs
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 添加注释
COMMENT ON TABLE user_uploads IS '用户上传的作品文件';
COMMENT ON TABLE user_patterns IS '用户收藏的纹样';
COMMENT ON TABLE user_style_presets IS '用户保存的风格预设';
COMMENT ON TABLE user_tile_configs IS '用户保存的图案平铺配置';
COMMENT ON TABLE user_mockup_configs IS '用户保存的模型预览配置';
