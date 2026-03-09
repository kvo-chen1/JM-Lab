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

console.log('🔄 重新导入 users 表数据...\n');

// 先清空 users 表
console.log('1. 清空 users 表...');
try {
  execSync(
    `echo "TRUNCATE TABLE users CASCADE;" | psql "${targetConn}"`,
    { env, stdio: 'inherit' }
  );
  console.log('✅ 已清空\n');
} catch (error) {
  console.log('⚠️  清空失败或表不存在\n');
}

// 导入 users 数据
console.log('2. 导入 users 数据...');
const usersFile = 'c:\\git-repo\\import_batches\\batch_002_users_v2_part01.sql';

try {
  execSync(
    `psql "${targetConn}" < "${usersFile}"`,
    { env, stdio: 'inherit' }
  );
  console.log('✅ users 数据导入完成！\n');
} catch (error) {
  console.log('❌ 导入失败');
  console.log(error.message);
}

// 验证
console.log('3. 验证数据...');
try {
  const result = execSync(
    `echo "SELECT COUNT(*) FROM users;" | psql "${targetConn}"`,
    { env, encoding: 'utf-8' }
  );
  console.log('Users 表行数:', result);
} catch (error) {
  console.log('无法验证');
}
