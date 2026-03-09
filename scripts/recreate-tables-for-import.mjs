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

const recreateSQL = `
-- 删除并重新创建 posts 表（使用 bigint 时间戳）
DROP TABLE IF EXISTS public.posts CASCADE;

CREATE TABLE public.posts (
    id uuid PRIMARY KEY,
    community_id uuid,
    user_id uuid,
    title text,
    content text,
    images text[],
    likes integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    views integer DEFAULT 0,
    is_pinned boolean DEFAULT false,
    is_announcement boolean DEFAULT false,
    status text DEFAULT 'published',
    created_at bigint,
    updated_at bigint,
    likes_count integer DEFAULT 0,
    author_id uuid,
    upvotes integer DEFAULT 0,
    videos jsonb DEFAULT '[]',
    audios jsonb DEFAULT '[]'
);

-- 删除并重新创建 works 表
DROP TABLE IF EXISTS public.works CASCADE;

CREATE TABLE public.works (
    id uuid PRIMARY KEY,
    author_id uuid,
    title text,
    description text,
    type text,
    status text DEFAULT 'published',
    created_at bigint,
    updated_at bigint,
    view_count integer DEFAULT 0,
    like_count integer DEFAULT 0,
    comment_count integer DEFAULT 0,
    cover_url text,
    content jsonb DEFAULT '{}',
    tags text[],
    images text[]
);

-- 删除并重新创建 products 表
DROP TABLE IF EXISTS public.products CASCADE;

CREATE TABLE public.products (
    id uuid PRIMARY KEY,
    name text,
    description text,
    points integer DEFAULT 0,
    stock integer DEFAULT 0,
    status text DEFAULT 'active',
    category text,
    tags text[],
    image_url text,
    sort_order integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    max_exchange_per_user integer,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 删除并重新创建 communities 表
DROP TABLE IF EXISTS public.communities CASCADE;

CREATE TABLE public.communities (
    id uuid PRIMARY KEY,
    name text,
    description text,
    cover text,
    tags text[],
    privacy text DEFAULT 'public',
    rules text,
    is_verified boolean DEFAULT false,
    avatar_url text,
    cover_url text,
    member_count integer DEFAULT 0,
    posts_count integer DEFAULT 0,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 删除并重新创建 events 表
DROP TABLE IF EXISTS public.events CASCADE;

CREATE TABLE public.events (
    id uuid PRIMARY KEY,
    title text,
    description text,
    start_time timestamp with time zone,
    end_time timestamp with time zone,
    location text,
    cover_image text,
    max_participants integer,
    current_participants integer DEFAULT 0,
    organizer_id uuid,
    cover_url text,
    status text DEFAULT 'active',
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- 删除并重新创建 comments 表
DROP TABLE IF EXISTS public.comments CASCADE;

CREATE TABLE public.comments (
    id uuid PRIMARY KEY,
    user_id uuid,
    post_id uuid,
    content text,
    images text[],
    likes integer DEFAULT 0,
    parent_id uuid,
    is_deleted boolean DEFAULT false,
    created_at bigint,
    updated_at bigint
);

-- 删除并重新创建 likes 表
DROP TABLE IF EXISTS public.likes CASCADE;

CREATE TABLE public.likes (
    id uuid PRIMARY KEY,
    user_id uuid,
    target_type text,
    target_id uuid,
    created_at bigint
);

-- 删除并重新创建 bookmarks 表
DROP TABLE IF EXISTS public.bookmarks CASCADE;

CREATE TABLE public.bookmarks (
    id uuid PRIMARY KEY,
    user_id uuid,
    target_type text,
    target_id uuid,
    created_at bigint
);

-- 删除并重新创建 follows 表
DROP TABLE IF EXISTS public.follows CASCADE;

CREATE TABLE public.follows (
    id uuid PRIMARY KEY,
    follower_id uuid,
    following_id uuid,
    created_at bigint
);
`;

console.log('🔄 正在重新创建表结构...\n');
console.log('⚠️  警告: 这将删除现有表和数据！\n');

try {
  const result = execSync(
    `psql "${targetConn}"`,
    {
      input: recreateSQL,
      env,
      encoding: 'utf-8',
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 10
    }
  );

  console.log('✅ 表重新创建成功！');
  console.log('\n已重新创建的表:');
  console.log('  - posts (使用 bigint 时间戳)');
  console.log('  - works (使用 bigint 时间戳)');
  console.log('  - products');
  console.log('  - communities');
  console.log('  - events');
  console.log('  - comments');
  console.log('  - likes');
  console.log('  - bookmarks');
  console.log('  - follows');

} catch (error) {
  console.error('❌ 重新创建失败:', error.message);
  process.exit(1);
}
