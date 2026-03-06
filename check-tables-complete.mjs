import pg from 'pg';
const { Client } = pg;

// 从环境变量读取 Neon 数据库连接信息
const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.POSTGRES_URL ||
                     'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb';

async function checkTablesComplete() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('🔍 数据库表格完整性检查\n');
    console.log('='.repeat(80));

    // 1. 获取所有表
    const tablesResult = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);

    const tables = tablesResult.rows;
    console.log(`\n📊 总计找到 ${tables.length} 个表/视图\n`);

    // 2. 分类统计
    const baseTables = tables.filter(t => t.table_type === 'BASE TABLE');
    const views = tables.filter(t => t.table_type === 'VIEW');
    
    console.log(`   - 基础表 (BASE TABLE): ${baseTables.length} 个`);
    console.log(`   - 视图 (VIEW): ${views.length} 个`);
    console.log('');

    // 3. 检查核心表是否存在
    console.log('='.repeat(80));
    console.log('\n🔑 核心表检查\n');
    
    const coreTables = [
      'users', 'posts', 'works', 'comments', 'likes', 'follows',
      'messages', 'communities', 'community_members', 'events',
      'event_participants', 'event_submissions', 'brand_tasks',
      'brand_accounts', 'user_profiles', 'notifications',
      'generation_tasks', 'ai_generations', 'feeds', 'feed_comments',
      'memberships', 'points', 'points_records', 'invitation_reports',
      'friend_requests', 'friends', 'conversations', 'direct_messages',
      'ip_assets', 'promotion_orders', 'promotion_wallets',
      'lottery_activities', 'lottery_prizes', 'lottery_spin_records'
    ];

    const existingTables = tables.map(t => t.table_name);
    const missingCoreTables = [];
    const existingCoreTables = [];

    for (const table of coreTables) {
      if (existingTables.includes(table)) {
        existingCoreTables.push(table);
        console.log(`   ✅ ${table}`);
      } else {
        missingCoreTables.push(table);
        console.log(`   ❌ ${table} (缺失)`);
      }
    }

    // 4. 检查表结构详情（抽样检查）
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 核心表结构详情（抽样）\n');

    const sampleTables = ['users', 'posts', 'works', 'events', 'brand_tasks'];
    
    for (const tableName of sampleTables) {
      if (!existingTables.includes(tableName)) continue;

      const columnsResult = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName]);

      console.log(`\n   📁 ${tableName} (${columnsResult.rows.length} 列)`);
      console.log('   ' + '-'.repeat(60));
      
      columnsResult.rows.slice(0, 10).forEach(col => {
        const nullable = col.is_nullable === 'YES' ? 'NULL' : 'NOT NULL';
        const defaultVal = col.column_default ? ` DEFAULT ${col.column_default}` : '';
        console.log(`      ${col.column_name.padEnd(20)} ${col.data_type.padEnd(15)} ${nullable}${defaultVal}`);
      });

      if (columnsResult.rows.length > 10) {
        console.log(`      ... 还有 ${columnsResult.rows.length - 10} 列`);
      }
    }

    // 5. 检查索引
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 索引统计\n');

    const indexesResult = await client.query(`
      SELECT 
        tablename,
        indexname,
        indexdef
      FROM pg_indexes
      WHERE schemaname = 'public'
      ORDER BY tablename, indexname
    `);

    console.log(`   总计索引数: ${indexesResult.rows.length}`);

    // 6. 检查外键约束
    console.log('\n' + '='.repeat(80));
    console.log('\n🔗 外键约束统计\n');

    const fkResult = await client.query(`
      SELECT
        tc.table_name,
        kcu.column_name,
        ccu.table_name AS foreign_table_name,
        ccu.column_name AS foreign_column_name
      FROM information_schema.table_constraints AS tc
      JOIN information_schema.key_column_usage AS kcu
        ON tc.constraint_name = kcu.constraint_name
      JOIN information_schema.constraint_column_usage AS ccu
        ON ccu.constraint_name = tc.constraint_name
      WHERE tc.constraint_type = 'FOREIGN KEY'
        AND tc.table_schema = 'public'
      ORDER BY tc.table_name
    `);

    console.log(`   总计外键约束: ${fkResult.rows.length}`);

    // 7. 检查存储过程和函数
    console.log('\n' + '='.repeat(80));
    console.log('\n⚙️ 函数/存储过程统计\n');

    const functionsResult = await client.query(`
      SELECT routine_name, routine_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_type IN ('FUNCTION', 'PROCEDURE')
      ORDER BY routine_type, routine_name
    `);

    const functions = functionsResult.rows.filter(r => r.routine_type === 'FUNCTION');
    const procedures = functionsResult.rows.filter(r => r.routine_type === 'PROCEDURE');

    console.log(`   函数 (FUNCTION): ${functions.length}`);
    console.log(`   存储过程 (PROCEDURE): ${procedures.length}`);

    // 8. 总结
    console.log('\n' + '='.repeat(80));
    console.log('\n📊 检查结果总结\n');
    console.log(`   ✅ 数据库连接: 正常`);
    console.log(`   ✅ 基础表数量: ${baseTables.length}`);
    console.log(`   ✅ 视图数量: ${views.length}`);
    console.log(`   ✅ 核心表存在: ${existingCoreTables.length}/${coreTables.length}`);
    
    if (missingCoreTables.length > 0) {
      console.log(`   ⚠️ 缺失核心表: ${missingCoreTables.length} 个`);
      console.log(`      ${missingCoreTables.join(', ')}`);
    }
    
    console.log(`   ✅ 索引数量: ${indexesResult.rows.length}`);
    console.log(`   ✅ 外键约束: ${fkResult.rows.length}`);
    console.log(`   ✅ 函数/存储过程: ${functionsResult.rows.length}`);

    // 9. 健康评分
    console.log('\n' + '='.repeat(80));
    console.log('\n💯 数据库健康评分\n');
    
    const totalChecks = 5;
    let passedChecks = 5;
    
    if (missingCoreTables.length > 0) passedChecks--;
    if (indexesResult.rows.length < 50) passedChecks--;
    if (fkResult.rows.length < 20) passedChecks--;
    
    const healthScore = Math.round((passedChecks / totalChecks) * 100);
    
    if (healthScore >= 90) {
      console.log(`   🟢 健康评分: ${healthScore}% - 优秀`);
    } else if (healthScore >= 70) {
      console.log(`   🟡 健康评分: ${healthScore}% - 良好`);
    } else {
      console.log(`   🔴 健康评分: ${healthScore}% - 需要关注`);
    }

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ 表格完整性检查完成！\n');

  } catch (error) {
    console.error('\n❌ 检查失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkTablesComplete();
