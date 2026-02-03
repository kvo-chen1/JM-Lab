-- 修复社区功能的数据库脚本
-- 请在 Supabase Dashboard 的 SQL Editor 中运行此脚本

-- 1. 确保 communities 表存在
CREATE TABLE IF NOT EXISTS public.communities (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    cover TEXT,
    tags TEXT[],
    members_count INTEGER DEFAULT 0,
    topic TEXT,
    avatar TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    is_special BOOLEAN DEFAULT FALSE,
    theme JSONB DEFAULT '{}'::jsonb,
    layout_type VARCHAR(20) DEFAULT 'standard',
    enabled_modules JSONB DEFAULT '{"posts": true, "chat": true, "members": true, "announcements": true}'::jsonb,
    creator_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 确保 community_members 表存在
CREATE TABLE IF NOT EXISTS public.community_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    community_id VARCHAR(50) REFERENCES public.communities(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    role VARCHAR(20) DEFAULT 'member',
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_muted BOOLEAN DEFAULT FALSE,
    is_pinned BOOLEAN DEFAULT FALSE,
    UNIQUE(community_id, user_id)
);

-- 3. 启用 RLS
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- 4. 添加 RLS 策略 (如果不存在)

-- Communities: 所有人可读
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Communities are viewable by everyone') THEN
        CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
    END IF;
END $$;

-- Communities: 登录用户可创建
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Authenticated users can create communities') THEN
        CREATE POLICY "Authenticated users can create communities" ON public.communities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
    END IF;
END $$;

-- Communities: 创建者可更新
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'communities' AND policyname = 'Creators can update their communities') THEN
        CREATE POLICY "Creators can update their communities" ON public.communities FOR UPDATE USING (auth.uid() = creator_id);
    END IF;
END $$;

-- Community Members: 所有人可读 (为了显示成员列表)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Community members are viewable by everyone') THEN
        CREATE POLICY "Community members are viewable by everyone" ON public.community_members FOR SELECT USING (true);
    END IF;
END $$;

-- Community Members: 用户可以加入 (INSERT)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Users can join communities') THEN
        CREATE POLICY "Users can join communities" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;

-- Community Members: 用户可以退出 (DELETE)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'community_members' AND policyname = 'Users can leave communities') THEN
        CREATE POLICY "Users can leave communities" ON public.community_members FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. 确保索引存在以提高性能
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
