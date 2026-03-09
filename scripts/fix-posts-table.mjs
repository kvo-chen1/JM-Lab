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

const fixSQL = `
-- 修复 posts 表结构以匹配导入数据
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS community_id uuid;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS user_id uuid;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS views integer DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_pinned boolean DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS is_announcement boolean DEFAULT false;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS upvotes integer DEFAULT 0;
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS videos jsonb DEFAULT '[]';
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS audios jsonb DEFAULT '[]';

-- 修复 works 表结构
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS view_count integer DEFAULT 0;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS like_count integer DEFAULT 0;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS comment_count integer DEFAULT 0;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS content jsonb DEFAULT '{}';

-- 修复 communities 表结构
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS member_count integer DEFAULT 0;

-- 修复 events 表结构
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS organizer_id uuid;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_participants integer;
`;

console.log('🔄 正在修复表结构以匹配导入数据...\n');

try {
  const result = execSync(
    `psql "${targetConn}"`,
    {
      input: fixSQL,
      env,
      encoding: 'utf-8',
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 10
    }
  );

  console.log('✅ 表结构修复成功！');
  console.log('\n已添加的列:');
  console.log('  - posts: community_id, user_id, likes, comments_count, views, is_pinned, is_announcement, upvotes, videos, audios');
  console.log('  - works: view_count, like_count, comment_count, cover_url, content');
  console.log('  - communities: avatar_url, cover_url, member_count');
  console.log('  - events: organizer_id, cover_url, max_participants');

} catch (error) {
  console.error('❌ 修复失败:', error.message);
  process.exit(1);
}
