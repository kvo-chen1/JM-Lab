import pg from 'pg'
const { Pool } = pg

// 数据库连接配置
const pool = new Pool({
  connectionString: 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false },
  max: 3
})

async function checkTables() {
  const client = await pool.connect()
  
  try {
    console.log('=== 检查所有相关表 ===\n')
    
    // 获取所有表名
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      AND table_name LIKE '%like%' OR table_name LIKE '%fav%' OR table_name LIKE '%bookmark%'
      ORDER BY table_name
    `)
    
    console.log('找到的收藏/点赞相关表:')
    tablesResult.rows.forEach(row => {
      console.log(`  - ${row.table_name}`)
    })
    
    // 检查每个表的结构和数据
    for (const row of tablesResult.rows) {
      const tableName = row.table_name
      console.log(`\n--- 表: ${tableName} ---`)
      
      // 获取表结构
      const columnsResult = await client.query(`
        SELECT column_name, data_type
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `, [tableName])
      
      console.log('  结构:')
      columnsResult.rows.forEach(col => {
        console.log(`    ${col.column_name}: ${col.data_type}`)
      })
      
      // 获取数据量
      const countResult = await client.query(`SELECT COUNT(*) as count FROM ${tableName}`)
      console.log(`  记录数: ${countResult.rows[0].count}`)
      
      // 如果有数据，显示前5条
      if (countResult.rows[0].count > 0) {
        const dataResult = await client.query(`SELECT * FROM ${tableName} LIMIT 5`)
        console.log('  前5条数据:')
        dataResult.rows.forEach((r, i) => {
          console.log(`    [${i + 1}]`, JSON.stringify(r).substring(0, 200))
        })
      }
    }
    
  } catch (error) {
    console.error('查询失败:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

checkTables()
