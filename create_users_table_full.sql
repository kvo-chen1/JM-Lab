-- 创建完整的 users 表（包含所有列）
-- 用于导入 CSV 数据

-- 删除已存在的表（如果存在）
DROP TABLE IF EXISTS public.users CASCADE;

-- 创建完整的 users 表
CREATE TABLE public.users (
    id uuid PRIMARY KEY,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text,
    phone text,
    avatar_url text,
    interests text,
    age integer,
    tags text,
    created_at timestamp with time zone,
    updated_at timestamp with time zone,
    github_id text,
    github_username text,
    auth_provider text,
    is_new_user boolean DEFAULT false,
    membership_level text,
    membership_status text,
    membership_start timestamp with time zone,
    membership_end timestamp with time zone,
    posts_count integer DEFAULT 0,
    likes_count integer DEFAULT 0,
    views integer DEFAULT 0,
    followers_count integer DEFAULT 0,
    following_count integer DEFAULT 0,
    email_login_code text,
    email_login_expires timestamp with time zone,
    bio text,
    location text,
    occupation text,
    website text,
    social_links jsonb DEFAULT '{}',
    github text,
    twitter text,
    cover_image text,
    metadata jsonb DEFAULT '{}',
    is_admin boolean DEFAULT false,
    role text DEFAULT 'user',
    is_verified boolean DEFAULT false,
    status text DEFAULT 'active'
);

-- 启用 RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
DROP POLICY IF EXISTS "Users are viewable by everyone" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile" ON public.users;

CREATE POLICY "Users are viewable by everyone" ON public.users FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.users FOR UPDATE USING (auth.uid() = id);
