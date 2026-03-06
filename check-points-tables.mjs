import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.POSTGRES_URL ||
                     'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb';

async function checkPointsTables() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('🔍 积分相关表检查\n');
    console.log('='.repeat(80));

    // 1. 检查所有与积分、用户统计相关的表
    const pointsTablesResult = await client.query(`
      SELECT table_name, table_type
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND (
          table_name LIKE '%point%'
          OR table_name LIKE '%user%stats%'
          OR table_name LIKE '%user_points%'
          OR table_name LIKE '%pgmq%'
        )
      ORDER BY table_name
    `);

    console.log('\n📊 找到的相关表/视图:');
    if (pointsTablesResult.rows.length === 0) {
      console.log('   没有找到相关表');
    } else {
      pointsTablesResult.rows.forEach(row => {
        console.log(`   ${row.table_type === 'VIEW' ? '👁️' : '📁'} ${row.table_name} (${row.table_type})`);
      });
    }

    // 2. 特别检查 pgmq_user_points_stats
    console.log('\n' + '='.repeat(80));
    console.log('\n🔍 检查 pgmq_user_points_stats 表:\n');
    
    const pgmqCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'pgmq_user_points_stats'
      ) as exists
    `);

    if (pgmqCheck.rows[0].exists) {
      console.log('   ✅ pgmq_user_points_stats 表存在');
      
      const columns = await client.query(`
        SELECT column_name, data_type, is_nullable
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'pgmq_user_points_stats'
        ORDER BY ordinal_position
      `);
      console.log(`   列数: ${columns.rows.length}`);
      columns.rows.forEach(col => {
        console.log(`      ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('   ❌ pgmq_user_points_stats 表不存在！');
    }

    // 3. 检查 points 相关表
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 积分系统核心表:\n');
    
    const corePointsTables = ['points', 'points_records', 'points_rules', 'points_limits'];
    
    for (const table of corePointsTables) {
      const exists = await client.query(`
        SELECT EXISTS (
          SELECT 1 FROM information_schema.tables 
          WHERE table_schema = 'public' AND table_name = $1
        ) as exists
      `, [table]);
      
      if (exists.rows[0].exists) {
        const count = await client.query(`SELECT COUNT(*) as cnt FROM "${table}"`);
        console.log(`   ✅ ${table}: ${count.rows[0].cnt} 条记录`);
      } else {
        console.log(`   ❌ ${table}: 不存在`);
      }
    }

    // 4. 检查 user_points_balance 视图
    console.log('\n' + '='.repeat(80));
    console.log('\n👁️ 检查 user_points_balance 视图:\n');
    
    const viewCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.views 
        WHERE table_schema = 'public' AND table_name = 'user_points_balance'
      ) as exists
    `);

    if (viewCheck.rows[0].exists) {
      console.log('   ✅ user_points_balance 视图存在');
      const viewDef = await client.query(`
        SELECT pg_get_viewdef('user_points_balance', true) as def
      `);
      console.log('   定义:', viewDef.rows[0].def.substring(0, 200) + '...');
    } else {
      console.log('   ❌ user_points_balance 视图不存在');
    }

    // 5. 检查 lottery_prizes 表
    console.log('\n' + '='.repeat(80));
    console.log('\n🎰 检查 lottery_prizes 表:\n');
    
    const lotteryCheck = await client.query(`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'lottery_prizes'
      ) as exists
    `);

    if (lotteryCheck.rows[0].exists) {
      const count = await client.query(`SELECT COUNT(*) as cnt FROM lottery_prizes`);
      console.log(`   ✅ lottery_prizes: ${count.rows[0].cnt} 条记录`);
      
      const columns = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'lottery_prizes'
        ORDER BY ordinal_position
      `);
      console.log('   列:', columns.rows.map(c => c.column_name).join(', '));
    } else {
      console.log('   ❌ lottery_prizes 表不存在');
    }

    // 6. 搜索可能相关的 migration 文件
    console.log('\n' + '='.repeat(80));
    console.log('\n📁 建议检查以下 migration 文件:\n');
    console.log('   - 包含 pgmq 或 user_points_stats 的 migration');
    console.log('   - 积分系统相关的 migration');

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ 检查完成！\n');

  } catch (error) {
    console.error('\n❌ 检查失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkPointsTables();
