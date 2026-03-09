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
-- 添加最终缺失的列

-- communities 表
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS privacy text DEFAULT 'public';
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS rules text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS is_verified boolean DEFAULT false;

-- posts 表
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS shares integer DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;

-- inspiration_nodes 表
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS style text;
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS cultural_elements text[];
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS color_palette text[];
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS references text[];

-- ai_conversations 表
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS context_summary text;
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS total_tokens integer DEFAULT 0;
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS prompt_tokens integer DEFAULT 0;
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS completion_tokens integer DEFAULT 0;

-- audit_logs 表
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS table_name text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS record_id text;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS old_data jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS new_data jsonb;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS operation text;

-- works_likes 表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS public.works_likes (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    work_id uuid REFERENCES public.works(id) ON DELETE CASCADE,
    created_at timestamp with time zone DEFAULT now(),
    UNIQUE(user_id, work_id)
);

-- hot_searches 表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS public.hot_searches (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    keyword text NOT NULL,
    count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- lottery_activities 表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS public.lottery_activities (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    title text NOT NULL,
    description text,
    prize text,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- promotion_user_stats 表（如果不存在则创建）
CREATE TABLE IF NOT EXISTS public.promotion_user_stats (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id uuid REFERENCES public.users(id) ON DELETE CASCADE,
    code text,
    total_invites integer DEFAULT 0,
    total_rewards integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
`;

console.log('🔄 正在添加最终缺失的列和表...\n');

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

  console.log('✅ 最终缺失的列和表添加成功！');
  console.log('\n已添加的列:');
  console.log('  - communities: privacy, rules, is_verified');
  console.log('  - posts: likes, shares, is_pinned, is_featured');
  console.log('  - inspiration_nodes: category, style, cultural_elements, color_palette, references');
  console.log('  - ai_conversations: context_summary, total_tokens, prompt_tokens, completion_tokens');
  console.log('  - audit_logs: table_name, record_id, old_data, new_data, operation');
  console.log('\n已创建的表:');
  console.log('  - works_likes');
  console.log('  - hot_searches');
  console.log('  - lottery_activities');
  console.log('  - promotion_user_stats');

} catch (error) {
  console.error('❌ 添加失败:', error.message);
  if (error.stderr) {
    console.error('错误详情:', error.stderr);
  }
  process.exit(1);
}
