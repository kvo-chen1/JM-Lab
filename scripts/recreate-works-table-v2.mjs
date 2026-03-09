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
-- 删除并重新创建 works 表（完整结构，匹配 SQL 文件）
DROP TABLE IF EXISTS public.works CASCADE;

CREATE TABLE public.works (
    id uuid PRIMARY KEY,
    creator_id uuid,
    title text,
    description text,
    thumbnail text,
    duration text,
    status text DEFAULT 'draft',
    visibility text DEFAULT 'private',
    category text,
    tags text[],
    cultural_elements text[],
    created_at bigint,
    updated_at bigint,
    published_at bigint,
    scheduled_publish_date text,
    moderation_status text DEFAULT 'pending',
    rejection_reason text,
    reviewer_id uuid,
    reviewed_at timestamp with time zone,
    views integer DEFAULT 0,
    likes integer DEFAULT 0,
    comments integer DEFAULT 0,
    shares integer DEFAULT 0,
    downloads integer DEFAULT 0,
    engagement_rate integer DEFAULT 0,
    is_featured boolean DEFAULT false,
    likes_count integer DEFAULT 0,
    comments_count integer DEFAULT 0,
    type text DEFAULT 'image',
    video_url text,
    cover_url text,
    media text[],
    votes integer DEFAULT 0,
    creator text,
    view_count integer DEFAULT 0,
    authenticity_score integer DEFAULT 0,
    ai_risk_score integer DEFAULT 0,
    spam_score integer DEFAULT 0,
    scores_updated_at timestamp with time zone,
    source text,
    event_id uuid,
    hot_score integer DEFAULT 0,
    category_id uuid,
    embedding text,
    community_id uuid
);
`;

console.log('🔄 正在重新创建 works 表（完整结构）...\n');

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

  console.log('✅ works 表重新创建成功！');
  console.log('  - media 列使用 text[] 类型');
  console.log('  - 支持完整的数据导入');

} catch (error) {
  console.error('❌ 重新创建失败:', error.message);
  process.exit(1);
}
