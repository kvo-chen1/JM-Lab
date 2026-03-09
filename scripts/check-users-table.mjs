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

console.log('🔍 检查 users 表...\n');

try {
  // 1. 检查表是否存在
  console.log('1. 检查 users 表是否存在:');
  const tableExists = execSync(
    `psql "${targetConn}" -c "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'users');"`,
    { env, encoding: 'utf-8' }
  );
  console.log(tableExists);

  // 2. 检查 users 表结构
  console.log('\n2. users 表结构:');
  const tableStructure = execSync(
    `psql "${targetConn}" -c "\\d users"`,
    { env, encoding: 'utf-8' }
  );
  console.log(tableStructure);

  // 3. 检查 users 表数据量
  console.log('\n3. users 表数据量:');
  const rowCount = execSync(
    `psql "${targetConn}" -c "SELECT COUNT(*) FROM users;"`,
    { env, encoding: 'utf-8' }
  );
  console.log(rowCount);

  // 4. 检查所有表
  console.log('\n4. 所有表列表:');
  const allTables = execSync(
    `psql "${targetConn}" -c "SELECT tablename FROM pg_tables WHERE schemaname = 'public' ORDER BY tablename;"`,
    { env, encoding: 'utf-8' }
  );
  console.log(allTables);

  // 5. 检查导入时可能的错误
  console.log('\n5. 检查最近的错误日志:');
  try {
    const errors = execSync(
      `psql "${targetConn}" -c "SELECT * FROM pg_stat_user_tables WHERE tablename = 'users';"`,
      { env, encoding: 'utf-8' }
    );
    console.log(errors);
  } catch (e) {
    console.log('无法获取统计信息');
  }

} catch (error) {
  console.error('❌ 查询失败:', error.message);
}
