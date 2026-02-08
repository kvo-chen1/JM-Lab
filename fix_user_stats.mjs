// 修复用户统计数据脚本
// 将 works 表中的统计数据同步到 users 表

import pg from 'pg';
const { Pool } = pg;

// 使用 Supabase 连接字符串（与后端一致）
const pool = new Pool({
  connectionString: 'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true',
  ssl: {
    rejectUnauthorized: false
  }
});

async function fixUserStats() {
  const client = await pool.connect();
  
  try {
    console.log('开始修复用户统计数据...');
    
    // 1. 修复作品数量 (posts_count)
    console.log('\n1. 修复作品数量...');
    const postsResult = await client.query(`
      UPDATE users u
      SET posts_count = (
        SELECT COUNT(*) 
        FROM works w 
        WHERE w.creator_id = u.id
      )
      WHERE EXISTS (
        SELECT 1 FROM works w WHERE w.creator_id = u.id
      )
    `);
    console.log(`✓ 更新了 ${postsResult.rowCount} 个用户的作品数量`);
    
    // 2. 修复获赞数量 (likes_count)
    console.log('\n2. 修复获赞数量...');
    const likesResult = await client.query(`
      UPDATE users u
      SET likes_count = (
        SELECT COALESCE(SUM(likes), 0)
        FROM works w 
        WHERE w.creator_id = u.id
      )
      WHERE EXISTS (
        SELECT 1 FROM works w WHERE w.creator_id = u.id
      )
    `);
    console.log(`✓ 更新了 ${likesResult.rowCount} 个用户的获赞数量`);
    
    // 3. 修复浏览数量 (views)
    console.log('\n3. 修复浏览数量...');
    const viewsResult = await client.query(`
      UPDATE users u
      SET views = (
        SELECT COALESCE(SUM(views), 0)
        FROM works w 
        WHERE w.creator_id = u.id
      )
      WHERE EXISTS (
        SELECT 1 FROM works w WHERE w.creator_id = u.id
      )
    `);
    console.log(`✓ 更新了 ${viewsResult.rowCount} 个用户的浏览数量`);
    
    // 4. 显示修复后的统计
    console.log('\n4. 修复后的用户统计：');
    const { rows } = await client.query(`
      SELECT username, posts_count, likes_count, views
      FROM users
      WHERE posts_count > 0 OR likes_count > 0 OR views > 0
      ORDER BY posts_count DESC
    `);
    
    rows.forEach(user => {
      console.log(`  - ${user.username}: 作品 ${user.posts_count}, 获赞 ${user.likes_count}, 浏览 ${user.views}`);
    });
    
    console.log('\n✅ 用户统计数据修复完成！');
    
  } catch (error) {
    console.error('修复失败:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

fixUserStats();
