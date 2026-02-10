#!/usr/bin/env node
/**
 * 检查所有社区相关数据
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL?.replace(':5432/', ':6543/') || 
  'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

console.log('\n========================================');
console.log('检查所有社区相关数据');
console.log('========================================\n');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function checkData() {
  const client = await pool.connect();
  
  try {
    // 1. 获取所有社区
    console.log('1. 获取社区列表...');
    const communitiesResult = await client.query('SELECT id, name FROM communities');
    console.log(`   找到 ${communitiesResult.rows.length} 个社区`);
    
    // 2. 检查所有社区的成员
    console.log('\n2. 检查所有社区的成员...');
    for (const community of communitiesResult.rows) {
      const membersResult = await client.query(
        'SELECT COUNT(*) as count FROM community_members WHERE community_id = $1',
        [community.id]
      );
      console.log(`   ${community.name}: ${membersResult.rows[0].count} 成员`);
    }
    
    // 3. 检查所有社区的公告
    console.log('\n3. 检查所有社区的公告...');
    for (const community of communitiesResult.rows) {
      const announcementsResult = await client.query(
        'SELECT COUNT(*) as count FROM community_announcements WHERE community_id = $1',
        [community.id]
      );
      console.log(`   ${community.name}: ${announcementsResult.rows[0].count} 公告`);
    }
    
    // 4. 检查 posts 表是否有社区关联
    console.log('\n4. 检查 posts 表的社区关联...');
    const postsResult = await client.query('SELECT COUNT(*) as count FROM posts WHERE community_id IS NOT NULL');
    console.log(`   有关联社区的帖子: ${postsResult.rows[0].count}`);
    
    // 5. 检查 community_members 表结构
    console.log('\n5. 检查 community_members 表结构...');
    const columnsResult = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = 'community_members'
      ORDER BY ordinal_position;
    `);
    console.log('   字段:');
    columnsResult.rows.forEach(col => {
      console.log(`     - ${col.column_name}: ${col.data_type}`);
    });
    
    // 6. 检查是否有用户数据
    console.log('\n6. 检查 users 表...');
    const usersResult = await client.query('SELECT COUNT(*) as count FROM users');
    console.log(`   用户数量: ${usersResult.rows[0].count}`);
    
    if (usersResult.rows[0].count > 0) {
      const sampleUsers = await client.query('SELECT id, username FROM users LIMIT 3');
      console.log('   示例用户:');
      sampleUsers.rows.forEach(u => console.log(`     - ${u.username} (${u.id})`));
    }
    
    console.log('\n========================================');
    console.log('检查完成');
    console.log('========================================');
    
  } catch (error) {
    console.error('\n❌ 执行失败:', error.message);
    console.error(error);
  } finally {
    client.release();
    await pool.end();
  }
}

checkData();
