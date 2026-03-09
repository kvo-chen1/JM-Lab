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
-- 修复 references 列名（使用双引号）
ALTER TABLE public.inspiration_nodes ADD COLUMN IF NOT EXISTS "references" text[];
`;

console.log('🔄 正在修复 references 列...\n');

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

  console.log('✅ references 列添加成功！');

} catch (error) {
  console.error('❌ 添加失败:', error.message);
  process.exit(1);
}
