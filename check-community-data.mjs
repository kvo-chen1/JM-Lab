#!/usr/bin/env node
/**
 * 检查社区成员和公告数据
 */

import pg from 'pg';
import dotenv from 'dotenv';

const { Pool } = pg;

dotenv.config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL?.replace(':5432/', ':6543/') || 
  'postgres://postgres.pptqdicaaewtnaiflfcs:csh200506207837@aws-1-ap-southeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

console.log('\n========================================');
console.log('检查社区成员和公告数据');
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
    const communitiesResult = await client.query('SELECT id, name FROM communities LIMIT 5');
    console.log(`   找到 ${communitiesResult.rows.length} 个社区`);
    communitiesResult.rows.forEach(c => console.log(`   - ${c.name} (${c.id})`));
    
    if (communitiesResult.rows.length === 0) {
      console.log('   没有社区数据');
      return;
    }
    
    const communityId = communitiesResult.rows[0].id;
    console.log(`\n   使用社区: ${communitiesResult.rows[0].name} (${communityId})`);
    
    // 2. 检查 community_members 表
    console.log('\n2. 检查 community_members 表...');
    const membersTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'community_members'
      );
    `);
    console.log(`   表存在: ${membersTableResult.rows[0].exists ? '✅' : '❌'}`);
    
    if (membersTableResult.rows[0].exists) {
      const membersResult = await client.query(
        'SELECT COUNT(*) as count FROM community_members WHERE community_id = $1',
        [communityId]
      );
      console.log(`   成员数量: ${membersResult.rows[0].count}`);
      
      if (membersResult.rows[0].count > 0) {
        const sampleMembers = await client.query(
          `SELECT cm.id, cm.user_id, cm.role, cm.joined_at, u.username, u.avatar_url 
           FROM community_members cm
           LEFT JOIN users u ON cm.user_id = u.id
           WHERE cm.community_id = $1
           LIMIT 3`,
          [communityId]
        );
        console.log('   示例成员:');
        sampleMembers.rows.forEach(m => {
          console.log(`     - ${m.username || '未知'} (${m.role})`);
        });
      }
    }
    
    // 3. 检查 community_announcements 表
    console.log('\n3. 检查 community_announcements 表...');
    const announcementsTableResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'community_announcements'
      );
    `);
    console.log(`   表存在: ${announcementsTableResult.rows[0].exists ? '✅' : '❌'}`);
    
    if (announcementsTableResult.rows[0].exists) {
      const announcementsResult = await client.query(
        'SELECT COUNT(*) as count FROM community_announcements WHERE community_id = $1',
        [communityId]
      );
      console.log(`   公告数量: ${announcementsResult.rows[0].count}`);
      
      if (announcementsResult.rows[0].count > 0) {
        const sampleAnnouncements = await client.query(
          `SELECT id, title, content, is_pinned, created_at 
           FROM community_announcements 
           WHERE community_id = $1
           LIMIT 2`,
          [communityId]
        );
        console.log('   示例公告:');
        sampleAnnouncements.rows.forEach(a => {
          console.log(`     - ${a.title} ${a.is_pinned ? '(置顶)' : ''}`);
        });
      }
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
