import pg from 'pg'
const { Pool } = pg

// 数据库连接配置
const pool = new Pool({
  connectionString: 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: { rejectUnauthorized: false },
  max: 3
})

async function checkData() {
  const client = await pool.connect()
  
  try {
    console.log('=== 检查收藏和点赞数据 ===\n')
    
    // 1. 检查 work_favorites 表（本地表）
    console.log('1. work_favorites 表（本地）:')
    const workFavResult = await client.query('SELECT COUNT(*) as count FROM work_favorites')
    console.log('   总记录数:', workFavResult.rows[0].count)
    
    const workFavUsers = await client.query('SELECT user_id, COUNT(*) as count FROM work_favorites GROUP BY user_id')
    console.log('   按用户分组:')
    workFavUsers.rows.forEach(row => {
      console.log(`     - 用户 ${row.user_id}: ${row.count} 条收藏`)
    })
    
    // 2. 检查 works_favorites 表（Supabase表）
    console.log('\n2. works_favorites 表（Supabase）:')
    try {
      const worksFavResult = await client.query('SELECT COUNT(*) as count FROM works_favorites')
      console.log('   总记录数:', worksFavResult.rows[0].count)
      
      const worksFavUsers = await client.query('SELECT user_id, COUNT(*) as count FROM works_favorites GROUP BY user_id')
      console.log('   按用户分组:')
      worksFavUsers.rows.forEach(row => {
        console.log(`     - 用户 ${row.user_id}: ${row.count} 条收藏`)
      })
    } catch (e) {
      console.log('   表不存在或查询失败:', e.message)
    }
    
    // 3. 检查 work_likes 表（本地表）
    console.log('\n3. work_likes 表（本地）:')
    const workLikesResult = await client.query('SELECT COUNT(*) as count FROM work_likes')
    console.log('   总记录数:', workLikesResult.rows[0].count)
    
    const workLikesUsers = await client.query('SELECT user_id, COUNT(*) as count FROM work_likes GROUP BY user_id')
    console.log('   按用户分组:')
    workLikesUsers.rows.forEach(row => {
      console.log(`     - 用户 ${row.user_id}: ${row.count} 条点赞`)
    })
    
    // 4. 检查 works_likes 表（Supabase表）
    console.log('\n4. works_likes 表（Supabase）:')
    try {
      const worksLikesResult = await client.query('SELECT COUNT(*) as count FROM works_likes')
      console.log('   总记录数:', worksLikesResult.rows[0].count)
      
      const worksLikesUsers = await client.query('SELECT user_id, COUNT(*) as count FROM works_likes GROUP BY user_id')
      console.log('   按用户分组:')
      worksLikesUsers.rows.forEach(row => {
        console.log(`     - 用户 ${row.user_id}: ${row.count} 条点赞`)
      })
    } catch (e) {
      console.log('   表不存在或查询失败:', e.message)
    }
    
    // 5. 检查 likes 表（帖子的点赞）
    console.log('\n5. likes 表（帖子点赞）:')
    try {
      const likesResult = await client.query('SELECT COUNT(*) as count FROM likes')
      console.log('   总记录数:', likesResult.rows[0].count)
      
      const likesUsers = await client.query('SELECT user_id, COUNT(*) as count FROM likes GROUP BY user_id')
      console.log('   按用户分组:')
      likesUsers.rows.forEach(row => {
        console.log(`     - 用户 ${row.user_id}: ${row.count} 条点赞`)
      })
    } catch (e) {
      console.log('   表不存在或查询失败:', e.message)
    }
    
    // 6. 查看有哪些用户
    console.log('\n6. 用户列表:')
    const usersResult = await client.query('SELECT id, username, email FROM users LIMIT 10')
    usersResult.rows.forEach(row => {
      console.log(`   - ${row.id}: ${row.username} (${row.email})`)
    })
    
  } catch (error) {
    console.error('查询失败:', error)
  } finally {
    client.release()
    await pool.end()
  }
}

checkData()
