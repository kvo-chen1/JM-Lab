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

const addColumnsSQL = `
-- 添加更多缺失的列

-- admin_accounts 表
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS role text;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS is_super_admin boolean DEFAULT false;

-- communities 表
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS members_count integer DEFAULT 0;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS posts_count integer DEFAULT 0;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS avatar text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS is_public boolean DEFAULT true;

-- posts 表
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS images text[];
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;

-- inspiration_nodes 表
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS description text;
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS source_url text;
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS tags text[];

-- ai_conversations 表
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS is_active boolean DEFAULT true;
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS context jsonb DEFAULT '{}';

-- comments 表
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS images text[];
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS is_deleted boolean DEFAULT false;

-- users 表 - 更多列
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS display_name text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS gender text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS birthday date;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS followers_count integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS following_count integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS works_count integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS level integer DEFAULT 1;

-- works 表 - 更多列
ALTER TABLE public.workS ADD COLUMN IF NOT EXISTS author_name text;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS category_id integer;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS is_premium boolean DEFAULT false;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS price numeric(10, 2) DEFAULT 0;

-- events 表 - 更多列
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS type text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS is_online boolean DEFAULT false;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS online_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_name text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_contact text;
`;

console.log('🔄 正在添加更多缺失的列...\n');

try {
  const result = execSync(
    `psql "${targetConn}"`,
    {
      input: addColumnsSQL,
      env,
      encoding: 'utf-8',
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 10
    }
  );

  console.log('✅ 更多缺失的列添加成功！');

} catch (error) {
  console.error('❌ 添加失败:', error.message);
  if (error.stderr) {
    console.error('错误详情:', error.stderr);
  }
  process.exit(1);
}
