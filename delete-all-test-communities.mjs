import { getDB } from './server/database.mjs';

async function deleteAllTestCommunities() {
  try {
    const db = await getDB();
    
    let dbType = 'unknown';
    if (db && Array.isArray(db.communities)) {
      dbType = 'memory';
    } else if (db && typeof db.prepare === 'function') {
      dbType = 'sqlite';
    } else if (db && typeof db.query === 'function') {
      dbType = 'postgresql';
    }
    
    console.log('当前数据库类型:', dbType);
    let deletedCount = 0;
    
    switch (dbType) {
      case 'memory':
        console.log('使用内存数据库，当前社群数量:', db.communities.length);
        
        // 过滤出非测试社群
        const realCommunities = db.communities.filter(c => {
          // 测试社群判断条件
          return !c.name.includes('测试') && 
                 !c.name.includes('test') && 
                 c.name.length > 2;
        });
        
        deletedCount = db.communities.length - realCommunities.length;
        db.communities = realCommunities;
        console.log('删除测试社群:', deletedCount, '个');
        console.log('剩余社群数量:', realCommunities.length);
        break;
        
      case 'sqlite':
        // 获取所有社群
        const stmt = db.prepare('SELECT id, name FROM communities');
        const communities = stmt.all();
        console.log('使用SQLite数据库，当前社群数量:', communities.length);
        
        // 删除测试社群
        for (const community of communities) {
          if (community.name.includes('测试') || 
              community.name.includes('test') || 
              community.name.length <= 2) {
            // 删除相关成员
            const deleteMembersStmt = db.prepare('DELETE FROM community_members WHERE community_id = ?');
            deleteMembersStmt.run(community.id);
            
            // 删除社群
            const deleteStmt = db.prepare('DELETE FROM communities WHERE id = ?');
            const result = deleteStmt.run(community.id);
            
            if (result.changes > 0) {
              console.log('删除社群:', community.name, '(ID:', community.id, ')');
              deletedCount++;
            }
          }
        }
        
        console.log('删除测试社群:', deletedCount, '个');
        
        // 检查剩余社群
        const remainingStmt = db.prepare('SELECT COUNT(*) as count FROM communities');
        const remaining = remainingStmt.get();
        console.log('剩余社群数量:', remaining.count);
        break;
        
      case 'postgresql':
        // 获取所有社群
        const result = await db.query('SELECT id, name FROM communities');
        console.log('使用PostgreSQL数据库，当前社群数量:', result.rows.length);
        
        // 删除测试社群
        for (const community of result.rows) {
          if (community.name.includes('测试') || 
              community.name.includes('test') || 
              community.name.length <= 2) {
            // 删除相关成员
            await db.query('DELETE FROM community_members WHERE community_id = $1', [community.id]);
            
            // 删除社群
            const deleteResult = await db.query('DELETE FROM communities WHERE id = $1', [community.id]);
            
            if (deleteResult.rowCount > 0) {
              console.log('删除社群:', community.name, '(ID:', community.id, ')');
              deletedCount++;
            }
          }
        }
        
        console.log('删除测试社群:', deletedCount, '个');
        
        // 检查剩余社群
        const remainingResult = await db.query('SELECT COUNT(*) as count FROM communities');
        console.log('剩余社群数量:', remainingResult.rows[0].count);
        break;
        
      default:
        console.log('不支持的数据库类型:', dbType);
        break;
    }
    
  } catch (error) {
    console.error('删除测试社群时出错:', error);
  }
}

deleteAllTestCommunities();
