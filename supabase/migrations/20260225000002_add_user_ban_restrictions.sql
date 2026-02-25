-- 创建用户禁用限制表
CREATE TABLE IF NOT EXISTS public.user_ban_restrictions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  disable_login BOOLEAN NOT NULL DEFAULT false,
  disable_post BOOLEAN NOT NULL DEFAULT false,
  disable_comment BOOLEAN NOT NULL DEFAULT false,
  disable_like BOOLEAN NOT NULL DEFAULT false,
  disable_follow BOOLEAN NOT NULL DEFAULT false,
  ban_reason TEXT,
  ban_duration TEXT DEFAULT 'permanent', -- 'permanent', '1day', '7days', '30days'
  banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  banned_by UUID REFERENCES public.users(id),
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id)
);

-- 添加索引
CREATE INDEX IF NOT EXISTS idx_user_ban_restrictions_user_id ON public.user_ban_restrictions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_ban_restrictions_expires_at ON public.user_ban_restrictions(expires_at);

-- 添加注释
COMMENT ON TABLE public.user_ban_restrictions IS '用户禁用限制表，存储用户的细粒度禁用配置';
COMMENT ON COLUMN public.user_ban_restrictions.disable_login IS '禁止登录';
COMMENT ON COLUMN public.user_ban_restrictions.disable_post IS '禁止发布作品';
COMMENT ON COLUMN public.user_ban_restrictions.disable_comment IS '禁止评论';
COMMENT ON COLUMN public.user_ban_restrictions.disable_like IS '禁止点赞';
COMMENT ON COLUMN public.user_ban_restrictions.disable_follow IS '禁止关注';
COMMENT ON COLUMN public.user_ban_restrictions.ban_duration IS '禁用时长: permanent(永久), 1day(1天), 7days(7天), 30days(30天)';
