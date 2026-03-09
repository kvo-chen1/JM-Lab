import { execSync } from 'child_process';
import fs from 'fs';

const PSQL_PATH = 'C:\\postgresql\\pgsql\\bin';
process.env.PATH = `${process.env.PATH};${PSQL_PATH}`;

const targetHost = 'db.kizgwtrrsmkjeiddotup.supabase.co';
const targetPort = '5432';
const targetDb = 'postgres';
const targetUser = 'postgres';
const targetPass = 'csh200506207837';

const targetConn = `postgresql://${targetUser}:${targetPass}@${targetHost}:${targetPort}/${targetDb}`;
const env = { ...process.env, PGPASSWORD: targetPass };

const filePath = 'c:\\git-repo\\import_batches\\batch_006.sql';

console.log('🔄 正在导入 works 数据...\n');

try {
  const result = execSync(
    `psql "${targetConn}"`,
    {
      input: fs.readFileSync(filePath, 'utf-8'),
      env,
      encoding: 'utf-8',
      timeout: 300000,
      maxBuffer: 1024 * 1024 * 20
    }
  );

  console.log('✅ 导入成功！');
  
  // 检查导入的记录数
  const countResult = execSync(
    `psql "${targetConn}" -c "SELECT COUNT(*) FROM works;"`,
    { env, encoding: 'utf-8', timeout: 10000 }
  );
  console.log('\n📊 works 表记录数:', countResult.match(/\d+/)?.[0] || '0');

} catch (error) {
  console.error('❌ 导入失败:', error.message);
  if (error.stderr) {
    console.error('错误详情:', error.stderr.substring(0, 500));
  }
}
