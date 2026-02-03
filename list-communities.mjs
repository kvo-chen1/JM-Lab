import { getDB } from './server/database.mjs';

async function listCommunities() {
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
    
    switch (dbType) {
      case 'memory':
        console.log('使用内存数据库，当前社群数量:', db.communities.length);
        console.log('\n社群列表:');
        db.communities.forEach(c => {
          console.log(`- ${c.name} (ID: ${c.id})`);
        });
        break;
        
      case 'sqlite':
        const stmt = db.prepare('SELECT id, name, description FROM communities');
        const communities = stmt.all();
        console.log('使用SQLite数据库，当前社群数量:', communities.length);
        console.log('\n社群列表:');
        communities.forEach(c => {
          console.log(`- ${c.name} (ID: ${c.id})`);
        });
        break;
        
      case 'postgresql':
        const result = await db.query('SELECT id, name, description FROM communities');
        console.log('使用PostgreSQL数据库，当前社群数量:', result.rows.length);
        console.log('\n社群列表:');
        result.rows.forEach(c => {
          console.log(`- ${c.name} (ID: ${c.id})`);
        });
        break;
        
      default:
        console.log('不支持的数据库类型:', dbType);
        break;
    }
    
  } catch (error) {
    console.error('列出社群时出错:', error);
  }
}

listCommunities();
