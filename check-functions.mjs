import pg from 'pg';
const { Client } = pg;

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL || 
                     process.env.POSTGRES_URL ||
                     'postgresql://neondb_owner:npg_fV0Tzot3RCxh@ep-shy-bar-ajp9o0kn-pooler.c-3.us-east-2.aws.neon.tech/neondb';

async function checkFunctions() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    connectionTimeoutMillis: 10000,
  });

  try {
    await client.connect();
    console.log('🔍 数据库函数检查\n');
    console.log('='.repeat(80));

    // 1. 检查 get_user_points_stats 函数
    console.log('\n📋 检查 get_user_points_stats 函数:\n');
    
    const funcCheck = await client.query(`
      SELECT 
        routine_name,
        routine_type,
        data_type as return_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name = 'get_user_points_stats'
    `);

    if (funcCheck.rows.length > 0) {
      console.log('   ✅ get_user_points_stats 函数存在');
      console.log('   返回类型:', funcCheck.rows[0].return_type);
      
      // 获取函数定义
      const funcDef = await client.query(`
        SELECT pg_get_functiondef(p.oid) as def
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'public'
          AND p.proname = 'get_user_points_stats'
      `);
      
      if (funcDef.rows.length > 0) {
        console.log('\n   函数定义预览:');
        console.log('   ', funcDef.rows[0].def.substring(0, 300) + '...');
      }
    } else {
      console.log('   ❌ get_user_points_stats 函数不存在！');
    }

    // 2. 检查所有 points 相关的函数
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 所有 points 相关函数:\n');
    
    const pointsFuncs = await client.query(`
      SELECT 
        routine_name,
        routine_type,
        data_type as return_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND (
          routine_name LIKE '%point%'
          OR routine_name LIKE '%points%'
        )
      ORDER BY routine_name
    `);

    if (pointsFuncs.rows.length === 0) {
      console.log('   没有找到 points 相关函数');
    } else {
      pointsFuncs.rows.forEach(func => {
        console.log(`   ${func.routine_type}: ${func.routine_name}() -> ${func.return_type}`);
      });
    }

    // 3. 检查所有 lottery 相关的函数
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 所有 lottery 相关函数:\n');
    
    const lotteryFuncs = await client.query(`
      SELECT 
        routine_name,
        routine_type,
        data_type as return_type
      FROM information_schema.routines
      WHERE routine_schema = 'public'
        AND routine_name LIKE '%lottery%'
      ORDER BY routine_name
    `);

    if (lotteryFuncs.rows.length === 0) {
      console.log('   没有找到 lottery 相关函数');
    } else {
      lotteryFuncs.rows.forEach(func => {
        console.log(`   ${func.routine_type}: ${func.routine_name}() -> ${func.return_type}`);
      });
    }

    // 4. 检查 pgmq 扩展
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 检查 pgmq 扩展:\n');
    
    const extCheck = await client.query(`
      SELECT extname, extversion
      FROM pg_extension
      WHERE extname LIKE '%pgmq%'
    `);

    if (extCheck.rows.length === 0) {
      console.log('   ⚠️ pgmq 扩展未安装');
    } else {
      extCheck.rows.forEach(ext => {
        console.log(`   ✅ ${ext.extname} v${ext.extversion}`);
      });
    }

    // 5. 检查所有已安装扩展
    console.log('\n' + '='.repeat(80));
    console.log('\n📋 所有已安装扩展:\n');
    
    const allExts = await client.query(`
      SELECT extname, extversion
      FROM pg_extension
      ORDER BY extname
    `);

    allExts.rows.forEach(ext => {
      console.log(`   ${ext.extname} v${ext.extversion}`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n✅ 函数检查完成！\n');

  } catch (error) {
    console.error('\n❌ 检查失败:', error.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

checkFunctions();
