import { getDB } from './server/database.mjs';

async function checkMembersDetail() {
  console.log('详细检查社群成员关系...');
  
  try {
    const db = await getDB();
    
    const userId = 'a6f38aa1-7281-49f2-b565-2aa93ee89905';
    
    // 获取该用户的所有成员关系
    const { rows: userMembers } = await db.query(`
      SELECT * FROM community_members WHERE user_id::text = $1::text
    `, [userId]);
    
    console.log(`\n用户 ${userId} 的成员记录:`);
    userMembers.forEach(m => {
      console.log(`  - 记录ID: ${m.id}, 社群ID: ${m.community_id}, 角色: ${m.role}, 加入时间: ${m.joined_at}`);
    });
    
    // 检查 communities 表中的成员数
    const { rows: communities } = await db.query('SELECT id, name, member_count FROM communities');
    console.log(`\n社群表中的成员数:`);
    communities.forEach(c => {
      console.log(`  - ${c.name} (${c.id}): ${c.member_count}`);
    });
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    process.exit(0);
  }
}

checkMembersDetail();
