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
-- 添加缺失的列

-- admin_accounts 表添加 username 列
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS username text;
ALTER TABLE public.admin_accounts ADD COLUMN IF NOT EXISTS password_hash text;

-- communities 表添加 tags 列
ALTER TABLE public.communities ADD COLUMN IF NOT EXISTS tags text[];

-- posts 表添加 user_id 列
ALTER TABLE public.posts ADD COLUMN IF NOT EXISTS user_id uuid REFERENCES public.users(id) ON DELETE CASCADE;

-- inspiration_nodes 表添加 map_id 列
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS map_id uuid;
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS node_type text;
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS position_x integer;
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS position_y integer;
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';

-- ai_conversations 表添加 model_id 列
ALTER TABLE public.ai_conversations ADD COLUMN IF NOT EXISTS model_id text;

-- comments 表添加 likes 列
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0;
ALTER TABLE public.comments ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES public.comments(id) ON DELETE CASCADE;

-- users 表添加缺失的列
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS password_hash text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS role text DEFAULT 'user';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS last_login_at timestamp with time zone;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS email_verified_at timestamp with time zone;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS provider text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS provider_id text;
ALTER TABLE public.users ADD COLUMN IF NOT EXISTS supabase_uid uuid;

-- works 表添加缺失的列
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS content text;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS likes_count integer DEFAULT 0;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS views_count integer DEFAULT 0;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS comments_count integer DEFAULT 0;
ALTER TABLE public.works ADD COLUMN IF NOT EXISTS bookmarks_count integer DEFAULT 0;

-- events 表添加缺失的列
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS location text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS cover_image text;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS max_participants integer;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS current_participants integer DEFAULT 0;

-- notifications 表添加缺失的列
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link text;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS is_clicked boolean DEFAULT false;

-- messages 表添加缺失的列
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS conversation_id uuid;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS message_type text DEFAULT 'text';
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS attachments jsonb DEFAULT '[]';
`;

console.log('🔄 正在添加缺失的列...\n');

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

  console.log('✅ 缺失的列添加成功！');
  console.log('\n已添加的列:');
  console.log('  - admin_accounts: username, password_hash');
  console.log('  - communities: tags');
  console.log('  - posts: user_id');
  console.log('  - inspiration_nodes: map_id, node_type, position_x, position_y, status');
  console.log('  - ai_conversations: model_id');
  console.log('  - comments: likes, parent_id');
  console.log('  - users: password_hash, phone, role, status, last_login_at, email_verified_at, provider, provider_id, supabase_uid');
  console.log('  - works: content, tags, likes_count, views_count, comments_count, bookmarks_count');
  console.log('  - events: location, cover_image, max_participants, current_participants');
  console.log('  - notifications: link, is_clicked');
  console.log('  - messages: conversation_id, message_type, attachments');

} catch (error) {
  console.error('❌ 添加失败:', error.message);
  if (error.stderr) {
    console.error('错误详情:', error.stderr);
  }
  process.exit(1);
}
