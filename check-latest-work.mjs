import { getDB } from './server/database.mjs';

async function checkLatestWork() {
  console.log('检查最新发布的作品...');
  
  try {
    const db = await getDB();
    
    // 获取最新发布的作品
    const { rows: works } = await db.query(`
      SELECT id, title, type, thumbnail, created_at
      FROM works
      ORDER BY created_at DESC
      LIMIT 3
    `);
    
    console.log('\n最新发布的作品:');
    works.forEach(w => {
      console.log(`\n  - ID: ${w.id}`);
      console.log(`    标题: ${w.title}`);
      console.log(`    类型: ${w.type}`);
      console.log(`    缩略图: ${w.thumbnail?.substring(0, 100)}...`);
      console.log(`    创建时间: ${w.created_at}`);
    });
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    process.exit(0);
  }
}

checkLatestWork();
