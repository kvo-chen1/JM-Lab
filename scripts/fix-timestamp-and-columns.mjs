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
-- 修复 products 表
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS points integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS stock integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS status text DEFAULT 'active';
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS category text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS tags text[];
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS sort_order integer DEFAULT 0;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS is_featured boolean DEFAULT false;
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS max_exchange_per_user integer;

-- 修改 posts 表的 created_at 和 updated_at 列为 bigint 类型以支持毫秒时间戳
ALTER TABLE public.posts ALTER COLUMN created_at TYPE bigint USING EXTRACT(EPOCH FROM created_at)::bigint;
ALTER TABLE public.posts ALTER COLUMN updated_at TYPE bigint USING EXTRACT(EPOCH FROM updated_at)::bigint;

-- 修改 works 表的 created_at 和 updated_at 列为 bigint 类型
ALTER TABLE public.works ALTER COLUMN created_at TYPE bigint USING EXTRACT(EPOCH FROM created_at)::bigint;
ALTER TABLE public.works ALTER COLUMN updated_at TYPE bigint USING EXTRACT(EPOCH FROM updated_at)::bigint;
`;

console.log('🔄 正在修复时间戳和列问题...\n');

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

  console.log('✅ 修复成功！');

} catch (error) {
  console.error('❌ 修复失败:', error.message);
  process.exit(1);
}
