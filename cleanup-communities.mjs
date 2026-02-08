import { communityDB, getDB } from './server/database.mjs';

async function cleanupCommunities() {
  console.log('开始清理无效的社群...');
  
  try {
    const db = await getDB();
    
    // 1. 获取所有社群
    const { rows: allCommunities } = await db.query('SELECT id, name, creator_id FROM communities');
    console.log(`数据库中共有 ${allCommunities.length} 个社群`);
    
    // 2. 获取所有有效的用户ID
    const { rows: allUsers } = await db.query('SELECT id, username FROM users');
    const validUserIds = new Set(allUsers.map(u => u.id));
    console.log(`数据库中共有 ${allUsers.length} 个用户`);
    console.log('有效用户ID列表:', Array.from(validUserIds).slice(0, 10), '...');
    
    // 3. 找出创建者无效的社群
    const invalidCommunities = allCommunities.filter(c => {
      // 如果 creator_id 为 null 或者不在有效用户列表中，则认为是无效社群
      return !c.creator_id || !validUserIds.has(c.creator_id);
    });
    
    console.log(`\n找到 ${invalidCommunities.length} 个无效社群（创建者不存在）:`);
    invalidCommunities.forEach(c => {
      console.log(`  - ID: ${c.id}, 名称: ${c.name}, 创建者ID: ${c.creator_id || 'null'}`);
    });
    
    // 4. 删除无效社群
    if (invalidCommunities.length > 0) {
      console.log('\n开始删除无效社群...');
      
      for (const community of invalidCommunities) {
        try {
          // 先删除关联的 community_members 记录
          await db.query('DELETE FROM community_members WHERE community_id = $1', [community.id]);
          console.log(`  已删除社群 ${community.id} 的成员记录`);
          
          // 删除社群
          await db.query('DELETE FROM communities WHERE id = $1', [community.id]);
          console.log(`  已删除社群: ${community.name} (${community.id})`);
        } catch (err) {
          console.error(`  删除社群 ${community.id} 失败:`, err.message);
        }
      }
      
      console.log('\n清理完成！');
    } else {
      console.log('\n没有需要删除的无效社群。');
    }
    
    // 5. 显示剩余的社群
    const { rows: remainingCommunities } = await db.query(`
      SELECT c.id, c.name, c.creator_id, u.username as creator_name
      FROM communities c
      JOIN users u ON c.creator_id = u.id
    `);
    console.log(`\n剩余有效社群数量: ${remainingCommunities.length}`);
    remainingCommunities.forEach(c => {
      console.log(`  - ${c.name} (创建者: ${c.creator_name})`);
    });
    
  } catch (err) {
    console.error('清理过程中出错:', err);
  } finally {
    process.exit(0);
  }
}

cleanupCommunities();
