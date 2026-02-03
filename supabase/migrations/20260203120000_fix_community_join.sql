-- 修复社群加入功能相关的数据库表结构

-- 1. 确保 communities 表存在 join_approval_required 字段
DO $$
BEGIN
    -- 添加 join_approval_required 列 (如果不存在)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'join_approval_required') THEN
        ALTER TABLE public.communities ADD COLUMN join_approval_required BOOLEAN DEFAULT false;
    END IF;

    -- 确保 member_count 列存在 (如果不存在)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'member_count') THEN
        ALTER TABLE public.communities ADD COLUMN member_count INTEGER DEFAULT 0;
    END IF;

    -- 确保 members_count 列存在 (向后兼容，有些代码可能使用这个字段名)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'communities' AND column_name = 'members_count') THEN
        ALTER TABLE public.communities ADD COLUMN members_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. 确保 community_members 表存在且结构正确
DO $$
BEGIN
    -- 确保 community_members 表存在
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'community_members') THEN
        CREATE TABLE public.community_members (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            community_id VARCHAR(50) REFERENCES public.communities(id) ON DELETE CASCADE,
            user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
            role VARCHAR(20) DEFAULT 'member',
            status VARCHAR(20) DEFAULT 'pending',
            joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            is_muted BOOLEAN DEFAULT FALSE,
            is_pinned BOOLEAN DEFAULT FALSE,
            UNIQUE(community_id, user_id)
        );
    ELSE
        -- 确保 status 列存在
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_members' AND column_name = 'status') THEN
            ALTER TABLE public.community_members ADD COLUMN status VARCHAR(20) DEFAULT 'pending';
        END IF;

        -- 确保 user_id 是 UUID 类型
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'community_members' AND column_name = 'user_id' AND data_type != 'uuid') THEN
            ALTER TABLE public.community_members DROP COLUMN IF EXISTS user_id;
            ALTER TABLE public.community_members ADD COLUMN user_id UUID REFERENCES auth.users(id);
        END IF;

        -- 确保唯一约束存在
        ALTER TABLE public.community_members DROP CONSTRAINT IF EXISTS community_members_user_id_community_id_key;
        CREATE UNIQUE INDEX IF NOT EXISTS idx_community_members_unique ON public.community_members(community_id, user_id);
    END IF;
END $$;

-- 3. 启用 RLS 并添加策略
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_members ENABLE ROW LEVEL SECURITY;

-- Communities: 所有人可读
DO $$ BEGIN
    CREATE POLICY "Communities are viewable by everyone" ON public.communities FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Communities: 登录用户可创建
DO $$ BEGIN
    CREATE POLICY "Users can create communities" ON public.communities FOR INSERT WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Community Members: 所有人可读
DO $$ BEGIN
    CREATE POLICY "Community members are viewable by everyone" ON public.community_members FOR SELECT USING (true);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Community Members: 用户可以加入
DO $$ BEGIN
    CREATE POLICY "Users can join communities" ON public.community_members FOR INSERT WITH CHECK (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Community Members: 用户可以退出
DO $$ BEGIN
    CREATE POLICY "Users can leave communities" ON public.community_members FOR DELETE USING (auth.uid() = user_id);
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 4. 创建索引以提高性能
CREATE INDEX IF NOT EXISTS idx_community_members_community_id ON public.community_members(community_id);
CREATE INDEX IF NOT EXISTS idx_community_members_user_id ON public.community_members(user_id);
CREATE INDEX IF NOT EXISTS idx_communities_created_at ON public.communities(created_at);
