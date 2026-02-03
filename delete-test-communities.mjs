import { getDB, DB_TYPE } from './server/database.mjs';

async function deleteTestCommunities() {
  try {
    const db = await getDB();
    
    // 要删除的社群名称
    const communityNames = [
      '测试社群1770030488359',
      '测试社群1770029869992'
    ];
    
    let deletedCount = 0;
    
    // 检测数据库类型
    let dbType = 'unknown';
    if (db && Array.isArray(db.communities)) {
      dbType = 'memory';
    } else if (db && typeof db.prepare === 'function') {
      dbType = 'sqlite';
    } else if (db && typeof db.query === 'function') {
      dbType = 'postgresql';
    }
    
    console.log('当前数据库类型:', dbType);
    
    switch (dbType) {
      case 'memory':
        // 内存数据库处理
        console.log('使用内存数据库，当前社群数量:', db.communities.length);
        
        for (const name of communityNames) {
          const communityIndex = db.communities.findIndex(c => c.name === name);
          
          if (communityIndex !== -1) {
            const deletedCommunity = db.communities.splice(communityIndex, 1)[0];
            console.log('删除社群:', deletedCommunity.name, '(ID:', deletedCommunity.id, ')');
            deletedCount++;
            
            // 同时删除相关的社群成员
            if (db.community_members) {
              const initialMemberCount = db.community_members.length;
              db.community_members = db.community_members.filter(
                member => member.community_id !== deletedCommunity.id
              );
              const removedMembers = initialMemberCount - db.community_members.length;
              if (removedMembers > 0) {
                console.log('同时删除相关成员:', removedMembers, '个');
              }
            }
          } else {
            console.log('未找到社群:', name);
          }
        }
        
        console.log('删除完成，共删除', deletedCount, '个社群');
        console.log('剩余社群数量:', db.communities.length);
        
        // 保存内存数据库到文件
        try {
          const { saveMemoryStore } = await import('./server/database.mjs');
          if (typeof saveMemoryStore === 'function') {
            saveMemoryStore();
            console.log('数据库已保存');
          }
        } catch (error) {
          console.log('无法保存内存数据库:', error.message);
        }
        break;
        
      case 'sqlite':
        // SQLite数据库处理
        console.log('使用SQLite数据库');
        
        for (const name of communityNames) {
          // 首先查找社群ID
          const findStmt = db.prepare('SELECT id FROM communities WHERE name = ?');
          const community = findStmt.get(name);
          
          if (community) {
            const communityId = community.id;
            
            // 删除相关的社群成员
            const deleteMembersStmt = db.prepare('DELETE FROM community_members WHERE community_id = ?');
            const memberResult = deleteMembersStmt.run(communityId);
            if (memberResult.changes > 0) {
              console.log('同时删除相关成员:', memberResult.changes, '个');
            }
            
            // 删除社群
            const deleteStmt = db.prepare('DELETE FROM communities WHERE id = ?');
            const result = deleteStmt.run(communityId);
            
            if (result.changes > 0) {
              console.log('删除社群:', name, '(ID:', communityId, ')');
              deletedCount++;
            } else {
              console.log('删除社群失败:', name);
            }
          } else {
            console.log('未找到社群:', name);
          }
        }
        
        console.log('删除完成，共删除', deletedCount, '个社群');
        break;
        
      case 'postgresql':
        // PostgreSQL/Supabase数据库处理
        console.log('使用PostgreSQL/Supabase数据库');
        
        for (const name of communityNames) {
          try {
            // 开始事务
            await db.query('BEGIN');
            
            // 查找社群ID
            const findResult = await db.query('SELECT id FROM communities WHERE name = $1', [name]);
            
            if (findResult.rows && findResult.rows.length > 0) {
              const communityId = findResult.rows[0].id;
              
              // 删除相关的社群成员
              const deleteMembersResult = await db.query('DELETE FROM community_members WHERE community_id = $1', [communityId]);
              if (deleteMembersResult.rowCount > 0) {
                console.log('同时删除相关成员:', deleteMembersResult.rowCount, '个');
              }
              
              // 删除社群
              const deleteResult = await db.query('DELETE FROM communities WHERE id = $1', [communityId]);
              
              if (deleteResult.rowCount > 0) {
                console.log('删除社群:', name, '(ID:', communityId, ')');
                deletedCount++;
              } else {
                console.log('删除社群失败:', name);
              }
            } else {
              console.log('未找到社群:', name);
            }
            
            // 提交事务
            await db.query('COMMIT');
          } catch (error) {
            // 回滚事务
            try {
              await db.query('ROLLBACK');
            } catch (rollbackError) {
              // 忽略回滚错误
            }
            console.error('删除社群时出错:', name, error.message);
          }
        }
        
        console.log('删除完成，共删除', deletedCount, '个社群');
        break;
        
      default:
        console.log('不支持的数据库类型:', dbType);
        break;
    }
    
  } catch (error) {
    console.error('删除社群时出错:', error);
  }
}

deleteTestCommunities();