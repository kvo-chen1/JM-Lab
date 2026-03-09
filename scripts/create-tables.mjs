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

const sqlFile = 'c:\\git-repo\\create_tables_only.sql';

console.log('🔄 正在创建数据库表结构...\n');

try {
  const sqlContent = fs.readFileSync(sqlFile, 'utf-8');

  const result = execSync(
    `psql "${targetConn}"`,
    {
      input: sqlContent,
      env,
      encoding: 'utf-8',
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 10
    }
  );

  console.log('✅ 表结构创建成功！');
  console.log('\n创建的表:');
  console.log('  - users');
  console.log('  - works');
  console.log('  - posts');
  console.log('  - events');
  console.log('  - comments');
  console.log('  - likes');
  console.log('  - bookmarks');
  console.log('  - follows');
  console.log('  - messages');
  console.log('  - notifications');
  console.log('  - communities');
  console.log('  - community_members');
  console.log('  - products');
  console.log('  - points_records');
  console.log('  - checkin_records');

} catch (error) {
  console.error('❌ 创建失败:', error.message);
  process.exit(1);
}
