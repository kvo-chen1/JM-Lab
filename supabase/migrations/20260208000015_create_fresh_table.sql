-- ==========================================================================
-- 创建全新的 points_records 表（不复制旧数据）
-- ==========================================================================

-- 1. 直接删除旧表（不保留数据）
DROP TABLE IF EXISTS public.points_records CASCADE;

-- 2. 创建全新的表
CREATE TABLE public.points_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  points INTEGER NOT NULL,
  type VARCHAR(50) NOT NULL CHECK (type IN ('earned', 'spent', 'adjustment')),
  source VARCHAR(100) NOT NULL,
  source_type VARCHAR(50),
  description TEXT NOT NULL,
  balance_after INTEGER NOT NULL,
  related_id UUID,
  related_type VARCHAR(50),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ
);

-- 3. 创建索引
CREATE INDEX idx_points_records_user_id ON public.points_records(user_id);
CREATE INDEX idx_points_records_type ON public.points_records(type);
CREATE INDEX idx_points_records_source_type ON public.points_records(source_type);
CREATE INDEX idx_points_records_created_at ON public.points_records(created_at DESC);

-- 4. 启用 RLS
ALTER TABLE public.points_records ENABLE ROW LEVEL SECURITY;

-- 5. 创建 RLS 策略
CREATE POLICY "Users can view own points records"
ON public.points_records FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "System can insert points records"
ON public.points_records FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- 6. 将表添加到 realtime 发布
ALTER PUBLICATION supabase_realtime ADD TABLE public.points_records;

-- 7. 确保 user_points_balance 表的时间字段有默认值
ALTER TABLE public.user_points_balance 
ALTER COLUMN created_at SET DEFAULT NOW();

ALTER TABLE public.user_points_balance 
ALTER COLUMN updated_at SET DEFAULT NOW();

ALTER TABLE public.user_points_balance 
ALTER COLUMN last_updated_at SET DEFAULT NOW();

-- 8. 刷新 PostgREST 缓存
NOTIFY pgrst, 'reload schema';

-- ==========================================================================
-- 完成
-- ==========================================================================
