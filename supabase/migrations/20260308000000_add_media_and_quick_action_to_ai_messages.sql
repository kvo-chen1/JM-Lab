-- 为 ai_messages 表添加媒体内容和快捷操作卡片字段

-- 添加 media 字段用于存储图片/视频等媒体内容
ALTER TABLE ai_messages 
ADD COLUMN IF NOT EXISTS media JSONB DEFAULT NULL;

-- 添加 quick_action 字段用于存储快捷操作卡片信息
ALTER TABLE ai_messages 
ADD COLUMN IF NOT EXISTS quick_action JSONB DEFAULT NULL;

-- 添加注释
COMMENT ON COLUMN ai_messages.media IS '存储媒体内容（图片、视频等）的JSON数组';
COMMENT ON COLUMN ai_messages.quick_action IS '存储快捷操作卡片信息的JSON对象';
