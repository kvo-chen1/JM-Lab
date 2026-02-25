-- 添加 users 表的 status 字段
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active'
CHECK (status IN ('active', 'inactive', 'banned', 'pending'));

-- 添加索引以优化查询性能
CREATE INDEX IF NOT EXISTS idx_users_status ON public.users(status);

-- 更新现有用户的状态为 active（如果还没有设置）
UPDATE public.users
SET status = 'active'
WHERE status IS NULL;

-- 添加注释
COMMENT ON COLUMN public.users.status IS '用户状态: active(活跃), inactive(未激活), banned(禁用), pending(待审核)';
