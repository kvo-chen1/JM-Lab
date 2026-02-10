#!/usr/bin/env node
/**
 * 检查特定社区的成员数据
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL?.replace(':5432/', ':6543/') || 
  'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

console.log('\n========================================');
console.log('检查甲骨文交流社区的成员数据');
console.log('========================================\n');

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
  max: 1,
});

async function checkData() {
  const client = await pool.connect();
  
  try {
    // 1. 找到甲骨文交流社区
    const communityResult = await client.query(
      "SELECT id, name FROM communities WHERE name = '甲骨文交流'"
    );
    
    if (communityResult.rows.length === 0) {
      console.log('❌ 未找到甲骨文交流社区');
      return;
    }
    
    const communityId = communityResult.rows[0].id;
    console.log(`社区ID: ${communityId}`);
    console.log(`社区名称: ${communityResult.rows[0].name}`);
    
    // 2. 获取该社区的成员
    console.log('\n2. 获取社区成员...');
    const membersResult = await client.query(
      `SELECT cm.community_id, cm.user_id, cm.role, cm.joined_at, 
              u.username, u.avatar_url 
       FROM community_members cm
       LEFT JOIN users u ON cm.user_id = u.id::text
       WHERE cm.community_id = $1`,
      [communityId]
    );
    
    console.log(`   成员数量: ${membersResult.rows.length}`);
    membersResult.rows.forEach(m => {
      console.log(`   - ${m.username || '未知'} (${m.role}) - 用户ID: ${m.user_id}`);
    });
    
    // 3. 检查 community_members 表的 user_id 类型
    console.log('\n3. 检查 community_members 表 user_id 字段...');
    const userIdResult = await client.query(
      `SELECT data_type 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'community_members'
       AND column_name = 'user_id'`
    );
    console.log(`   user_id 类型: ${userIdResult.rows[0]?.data_type}`);
    
    // 4. 检查 users 表的 id 类型
    console.log('\n4. 检查 users 表 id 字段...');
    const usersIdResult = await client.query(
      `SELECT data_type 
       FROM information_schema.columns 
       WHERE table_schema = 'public' 
       AND table_name = 'users'
       AND column_name = 'id'`
    );
    console.log(`   users.id 类型: ${usersIdResult.rows[0]?.data_type}`);
    
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
