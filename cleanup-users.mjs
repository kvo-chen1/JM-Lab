// 清理重复/格式错误的用户账号
import { Pool } from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.POSTGRES_URL_NON_POOLING || 
                         process.env.NEON_DATABASE_URL || 
                         process.env.DATABASE_URL;

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function cleanupUsers() {
  const client = await pool.connect();
  
  try {
    console.log('========================================');
    console.log('清理重复/格式错误的用户账号');
    console.log('========================================');
    
    // 1. 查找所有包含 "1530592463" 的邮箱用户
    const { rows: users } = await client.query(`
      SELECT id, username, email, created_at 
      FROM users 
      WHERE email LIKE '%1530592463%'
      ORDER BY created_at DESC
    `);
    
    console.log('\n找到以下相关用户:');
    console.log('----------------------------------------');
    users.forEach((u, i) => {
      console.log(`${i + 1}. ID: ${u.id}`);
      console.log(`   用户名: ${u.username}`);
      console.log(`   邮箱: ${u.email}`);
      console.log(`   创建时间: ${u.created_at}`);
      console.log('');
    });
    
    // 2. 找出格式错误的邮箱
    const invalidEmails = [
      '1530592463@kvo@gmail.com',
      '153059246369kvo@gmail.com'
    ];
    
    console.log('\n将要删除的格式错误账号:');
    console.log('----------------------------------------');
    
    for (const email of invalidEmails) {
      const { rows } = await client.query(`
        SELECT id, username, email FROM users WHERE email = $1
      `, [email]);
      
      if (rows.length > 0) {
        console.log(`- ${email} (ID: ${rows[0].id})`);
        
        const userId = rows[0].id;
        
        // 尝试删除用户（如果外键约束允许）
        try {
          await client.query('DELETE FROM users WHERE id = $1', [userId]);
          console.log(`  ✅ 已删除用户 ${email}`);
        } catch (deleteError) {
          console.log(`  ⚠️  无法直接删除，错误: ${deleteError.message}`);
          console.log(`  建议: 在数据库管理工具中手动删除此用户`);
        }
      } else {
        console.log(`- ${email} (不存在)`);
      }
    }
    
    // 3. 保留正确的邮箱账号
    console.log('\n----------------------------------------');
    console.log('保留的正确账号:');
    const { rows: correctUser } = await client.query(`
      SELECT id, username, email, created_at 
      FROM users 
      WHERE email = '1530592463@gmail.com'
    `);
    
    if (correctUser.length > 0) {
      console.log(`✅ ${correctUser[0].email}`);
      console.log(`   ID: ${correctUser[0].id}`);
      console.log(`   用户名: ${correctUser[0].username}`);
    }
    
    console.log('\n========================================');
    console.log('清理完成！');
    console.log('========================================');
    
  } catch (error) {
    console.error('清理失败:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

cleanupUsers();
