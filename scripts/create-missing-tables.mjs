import { execSync } from 'child_process';

const PSQL_PATH = 'C:\\postgresql\\pgsql\\bin';
process.env.PATH = `${process.env.PATH};${PSQL_PATH}`;

const targetHost = 'db.kizgwtrrsmkjeiddotup.supabase.co';
const targetPort = '5432';
const targetDb = 'postgres';
const targetUser = 'postgres';
const targetPass = 'csh200506207837';

const targetConn = `postgresql://${targetUser}:${targetPass}@${targetHost}:${targetPort}/${targetDb}`;
const env = { ...process.env, PGPASSWORD: targetPass };

const createTablesSQL = `
-- 创建缺失的表

-- achievement_configs 表
CREATE TABLE IF NOT EXISTS public.achievement_configs (
    id integer PRIMARY KEY,
    name text NOT NULL,
    description text,
    icon text,
    rarity text,
    category text,
    criteria text,
    points integer,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- achievements 表
CREATE TABLE IF NOT EXISTS public.achievements (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    config_id integer REFERENCES public.achievement_configs(id),
    unlocked_at timestamp with time zone DEFAULT now()
);

-- admin_roles 表
CREATE TABLE IF NOT EXISTS public.admin_roles (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    name text NOT NULL,
    description text,
    permissions jsonb DEFAULT '[]',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- admin_accounts 表
CREATE TABLE IF NOT EXISTS public.admin_accounts (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    role_id uuid REFERENCES public.admin_roles(id),
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- categories 表
CREATE TABLE IF NOT EXISTS public.categories (
    id integer PRIMARY KEY,
    name text NOT NULL,
    description text,
    created_at bigint,
    updated_at bigint
);

-- creator_level_configs 表
CREATE TABLE IF NOT EXISTS public.creator_level_configs (
    id integer PRIMARY KEY,
    level integer NOT NULL,
    name text NOT NULL,
    icon text,
    required_points integer,
    benefits text[],
    description text,
    color text,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- inspiration_nodes 表
CREATE TABLE IF NOT EXISTS public.inspiration_nodes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    content text,
    author_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    parent_id uuid REFERENCES public.inspiration_nodes(id) ON DELETE CASCADE,
    likes_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- ai_conversations 表
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    title text,
    model text,
    messages jsonb DEFAULT '[]',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- audit_logs 表
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE SET NULL,
    action text NOT NULL,
    target_type text,
    target_id text,
    details jsonb,
    ip_address text,
    created_at timestamp with time zone DEFAULT now()
);

-- works_likes 表
CREATE TABLE IF NOT EXISTS public.works_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    work_id uuid REFERENCES public.works(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, work_id)
);

-- hot_searches 表
CREATE TABLE IF NOT EXISTS public.hot_searches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword text NOT NULL,
    search_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- lottery_activities 表
CREATE TABLE IF NOT EXISTS public.lottery_activities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- promotion_user_stats 表
CREATE TABLE IF NOT EXISTS public.promotion_user_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    promotion_code text,
    invite_count integer DEFAULT 0,
    reward_points integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 添加 comments 表的 user_id 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'comments' AND column_name = 'user_id') THEN
        ALTER TABLE public.comments ADD COLUMN user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;
    END IF;
END $$;

-- 添加 communities 表的 cover 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'communities' AND column_name = 'cover') THEN
        ALTER TABLE public.communities ADD COLUMN cover text;
    END IF;
END $$;

-- 添加 posts 表的 community_id 列（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name = 'posts' AND column_name = 'community_id') THEN
        ALTER TABLE public.posts ADD COLUMN community_id uuid REFERENCES public.communities(id) ON DELETE SET NULL;
    END IF;
END $$;
`;

console.log('🔄 正在创建缺失的表...\n');

try {
  const result = execSync(
    `psql "${targetConn}"`,
    {
      input: createTablesSQL,
      env,
      encoding: 'utf-8',
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 10
    }
  );

  console.log('✅ 缺失的表创建成功！');
  console.log('\n创建的表:');
  console.log('  - achievement_configs');
  console.log('  - achievements');
  console.log('  - admin_roles');
  console.log('  - admin_accounts');
  console.log('  - categories');
  console.log('  - creator_level_configs');
  console.log('  - inspiration_nodes');
  console.log('  - ai_conversations');
  console.log('  - audit_logs');
  console.log('  - works_likes');
  console.log('  - hot_searches');
  console.log('  - lottery_activities');
  console.log('  - promotion_user_stats');
  console.log('\n修改的表:');
  console.log('  - comments (添加 user_id 列)');
  console.log('  - communities (添加 cover 列)');
  console.log('  - posts (添加 community_id 列)');

} catch (error) {
  console.error('❌ 创建失败:', error.message);
  if (error.stderr) {
    console.error('错误详情:', error.stderr);
  }
  process.exit(1);
}
