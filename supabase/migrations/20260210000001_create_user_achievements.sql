-- 创建用户成就表
CREATE TABLE IF NOT EXISTS public.user_achievements (
  user_id UUID NOT NULL,
  achievement_id INTEGER NOT NULL,
  progress INTEGER DEFAULT 0,
  is_unlocked BOOLEAN DEFAULT FALSE,
  unlocked_at BIGINT,
  PRIMARY KEY (user_id, achievement_id),
  FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE
);

-- 添加注释
COMMENT ON TABLE public.user_achievements IS '用户成就表，记录用户的成就进度和解锁状态';

-- 启用 RLS
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

-- 删除已存在的策略（如果存在）
DROP POLICY IF EXISTS "Users can view own achievements" ON public.user_achievements;
DROP POLICY IF EXISTS "Service role can manage all achievements" ON public.user_achievements;

-- 创建策略：用户只能查看自己的成就
CREATE POLICY "Users can view own achievements"
  ON public.user_achievements
  FOR SELECT
  USING (auth.uid() = user_id);

-- 创建策略：认证用户可以插入自己的成就
CREATE POLICY "Users can insert own achievements"
  ON public.user_achievements
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 创建策略：认证用户可以更新自己的成就
CREATE POLICY "Users can update own achievements"
  ON public.user_achievements
  FOR UPDATE
  USING (auth.uid() = user_id);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_user_achievements_user_id ON public.user_achievements(user_id);
CREATE INDEX IF NOT EXISTS idx_user_achievements_achievement_id ON public.user_achievements(achievement_id);
