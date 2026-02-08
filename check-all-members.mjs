import { getDB } from './server/database.mjs';

async function checkAllMembers() {
  console.log('检查所有社群成员关系...');
  
  try {
    const db = await getDB();
    
    // 获取所有社群成员关系（不使用 JOIN，避免类型问题）
    const { rows: allMembers } = await db.query('SELECT * FROM community_members');
    
    console.log(`\n共有 ${allMembers.length} 条社群成员记录:`);
    allMembers.forEach(m => {
      console.log(`  - ID: ${m.id}, 社群ID: ${m.community_id}, 用户ID: ${m.user_id}, 角色: ${m.role}`);
    });
    
    // 检查每个社群的成员数
    const { rows: communityStats } = await db.query(`
      SELECT 
        c.id,
        c.name,
        c.member_count,
        (SELECT COUNT(*) FROM community_members cm WHERE cm.community_id::text = c.id::text) as actual_count
      FROM communities c
    `);
    
    console.log(`\n社群成员数统计:`);
    communityStats.forEach(c => {
      console.log(`  - ${c.name} (${c.id}): 记录数 ${c.member_count}, 实际 ${c.actual_count}`);
    });
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    process.exit(0);
  }
}

checkAllMembers();
