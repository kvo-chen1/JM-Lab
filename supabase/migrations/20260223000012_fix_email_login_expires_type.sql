-- 修复 email_login_expires 字段类型
-- 问题：字段可能是 bigint 类型，但代码中存储的是 TIMESTAMPTZ

-- 检查并修复 email_login_expires 字段类型
DO $$
BEGIN
    -- 检查 email_login_expires 是否为 bigint 类型
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'users' 
        AND column_name = 'email_login_expires'
        AND data_type = 'bigint'
    ) THEN
        -- 将 bigint 转换为 TIMESTAMPTZ
        ALTER TABLE public.users 
        ALTER COLUMN email_login_expires TYPE TIMESTAMPTZ 
        USING to_timestamp(email_login_expires / 1000.0);
        
        RAISE NOTICE 'Fixed users.email_login_expires column type from BIGINT to TIMESTAMPTZ';
    ELSE
        RAISE NOTICE 'users.email_login_expires column is already correct type or does not exist';
    END IF;
END $$;

-- 确保字段存在（如果不存在则添加）
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS email_login_expires TIMESTAMPTZ;

-- 添加注释
COMMENT ON COLUMN public.users.email_login_expires IS '邮箱登录验证码过期时间 (TIMESTAMPTZ)';
