-- 添加邮箱验证码登录相关字段到 users 表
-- 创建时间: 2026-02-20

-- 添加邮箱登录验证码字段
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_login_code VARCHAR(10),
ADD COLUMN IF NOT EXISTS email_login_expires TIMESTAMPTZ;

-- 添加索引以加速验证码查询
CREATE INDEX IF NOT EXISTS idx_users_email_login_code ON public.users(email_login_code) 
WHERE email_login_code IS NOT NULL;

-- 添加注释说明字段用途
COMMENT ON COLUMN public.users.email_login_code IS '邮箱登录验证码';
COMMENT ON COLUMN public.users.email_login_expires IS '邮箱登录验证码过期时间';
