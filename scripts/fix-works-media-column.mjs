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
-- 修改 works 表的 media 列为 text[] 类型
ALTER TABLE public.works ALTER COLUMN media TYPE text[] USING media::text[];
`;

console.log('🔄 正在修改 works 表的 media 列类型...\n');

try {
  const result = execSync(
    `psql "${targetConn}"`,
    {
      input: fixSQL,
      env,
      encoding: 'utf-8',
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 10
    }
  );

  console.log('✅ media 列类型修改成功！');

} catch (error) {
  console.error('❌ 修改失败:', error.message);
  process.exit(1);
}
