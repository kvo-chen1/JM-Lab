/**
 * 检查 users 表的列结构
 */

import pg from 'pg';
const { Client } = pg;
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const DATABASE_URL = process.env.DATABASE_URL || 
                     process.env.NEON_DATABASE_URL;

async function checkUsersTable() {
  const client = new Client({
    connectionString: DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('🔍 检查 users 表结构\n');
    console.log('='.repeat(70));

    // 查询 users 表的列
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);

    console.log('\n📋 users 表列结构:\n');
    result.rows.forEach(col => {
      console.log(`  ${col.column_name}: ${col.data_type}`);
    });

    // 查找与头像相关的列
    console.log('\n🔍 头像相关列:\n');
    const avatarCols = result.rows.filter(col => 
      col.column_name.includes('avatar') || 
      col.column_name.includes('photo') ||
      col.column_name.includes('image')
    );
    
    if (avatarCols.length > 0) {
      avatarCols.forEach(col => {
        console.log(`  ✅ ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('  ⚠️ 未找到头像相关列');
    }

    // 检查最近的用户的头像字段
    console.log('\n👤 最近用户的头像信息:\n');
    const usersResult = await client.query(`
      SELECT id, username, avatar_url, metadata->>'avatar' as meta_avatar
      FROM users
      ORDER BY created_at DESC
      LIMIT 3
    `);

    usersResult.rows.forEach(user => {
      console.log(`  用户: ${user.username}`);
      console.log(`    avatar_url: ${user.avatar_url || 'NULL'}`);
      console.log(`    metadata.avatar: ${user.meta_avatar || 'NULL'}`);
    });

    console.log('\n' + '='.repeat(70));

  } catch (error) {
    console.error('❌ 查询失败:', error.message);
  } finally {
    await client.end();
  }
}

checkUsersTable();
