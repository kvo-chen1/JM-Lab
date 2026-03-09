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

const addColumnSQL = `
-- 添加 audit_logs 表缺失的列
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS changed_by uuid REFERENCES public.users(id) ON DELETE SET NULL;
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS changed_at timestamp with time zone DEFAULT now();
ALTER TABLE public.audit_logs ADD COLUMN IF NOT EXISTS severity text DEFAULT 'info';
`;

console.log('🔄 正在添加 audit_logs 表缺失的列...\n');

try {
  const result = execSync(
    `psql "${targetConn}"`,
    {
      input: addColumnSQL,
      env,
      encoding: 'utf-8',
      timeout: 60000,
      maxBuffer: 1024 * 1024 * 10
    }
  );

  console.log('✅ audit_logs 表的列添加成功！');
  console.log('  - changed_by: uuid 类型，关联 users 表');
  console.log('  - changed_at: timestamp 类型');
  console.log('  - severity: text 类型，默认 info');

} catch (error) {
  console.error('❌ 添加失败:', error.message);
  process.exit(1);
}
