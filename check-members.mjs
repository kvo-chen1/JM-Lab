import { getDB } from './server/database.mjs';

async function checkMembers() {
  console.log('检查 community_members 表...');
  
  try {
    const db = await getDB();
    
    // 获取所有社群成员关系
    const { rows: members } = await db.query(`
      SELECT cm.community_id, cm.user_id, c.name as community_name, u.username
      FROM community_members cm
      JOIN communities c ON cm.community_id::text = c.id::text
      JOIN users u ON cm.user_id::text = u.id::text
    `);
    
    console.log(`\n共有 ${members.length} 条社群成员记录:`);
    members.forEach(m => {
      console.log(`  - 社群: ${m.community_name} (${m.community_id}), 用户: ${m.username} (${m.user_id})`);
    });
    
    // 检查特定用户的成员关系
    const userId = 'a6f38aa1-7281-49f2-b565-2aa93ee89905';
    const { rows: userMembers } = await db.query(`
      SELECT cm.community_id, c.name
      FROM community_members cm
      JOIN communities c ON cm.community_id::text = c.id::text
      WHERE cm.user_id::text = $1::text
    `, [userId]);
    
    console.log(`\n用户 ${userId} 加入了 ${userMembers.length} 个社群:`);
    userMembers.forEach(m => {
      console.log(`  - ${m.name} (${m.community_id})`);
    });
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    process.exit(0);
  }
}

checkMembers();
