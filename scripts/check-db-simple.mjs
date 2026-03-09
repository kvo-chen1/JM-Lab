import pg from 'pg';
const { Client } = pg;

const client = new Client({
  host: 'db.kizgwtrrsmkjeiddotup.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: 'csh200506207837',
  ssl: { rejectUnauthorized: false }
});

console.log('🔍 正在检查数据库状态...\n');

try {
  await client.connect();
  
  // 获取所有表
  const tablesRes = await client.query(`
    SELECT tablename 
    FROM pg_tables 
    WHERE schemaname = 'public' 
    ORDER BY tablename
  `);
  
  console.log('📋 数据库表列表:');
  console.log(`共 ${tablesRes.rows.length} 个表\n`);
  
  // 检查关键表的数据量
  console.log('📊 关键表数据量统计:');
  const keyTables = [
    'users', 'works', 'posts', 'events', 'comments', 
    'likes', 'bookmarks', 'follows', 'communities',
    'achievement_configs', 'admin_roles', 'inspiration_nodes',
    'ai_conversations', 'audit_logs', 'works_likes', 'hot_searches'
  ];
  
  let totalRecords = 0;
  
  for (const table of keyTables) {
    try {
      const countRes = await client.query(`SELECT COUNT(*) FROM "${table}"`);
      const count = parseInt(countRes.rows[0].count);
      totalRecords += count;
      const status = count > 0 ? '✅' : '⚠️';
      console.log(`  ${status} ${table}: ${count} 条记录`);
    } catch (e) {
      console.log(`  ❌ ${table}: 表不存在`);
    }
  }
  
  console.log(`\n📈 总计: ${totalRecords} 条记录`);
  
  // 检查 users 表的样本数据
  console.log('\n👤 users 表样本数据:');
  try {
    const usersRes = await client.query('SELECT id, username, email FROM users LIMIT 3');
    usersRes.rows.forEach((user, i) => {
      console.log(`  ${i + 1}. ${user.username} (${user.email})`);
    });
  } catch (e) {
    console.log('  无法获取 users 数据');
  }
  
  // 检查 works 表的样本数据
  console.log('\n🎨 works 表样本数据:');
  try {
    const worksRes = await client.query('SELECT id, title, author_id FROM works LIMIT 3');
    worksRes.rows.forEach((work, i) => {
      console.log(`  ${i + 1}. ${work.title}`);
    });
  } catch (e) {
    console.log('  无法获取 works 数据');
  }
  
  console.log('\n✅ 数据库检查完成！');
  
} catch (error) {
  console.error('❌ 连接失败:', error.message);
} finally {
  await client.end();
}
