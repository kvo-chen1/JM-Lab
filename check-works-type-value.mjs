import { getDB } from './server/database.mjs';

async function checkWorksTypeValue() {
  console.log('检查最近发布的作品的 type 字段...');
  
  try {
    const db = await getDB();
    
    // 获取最近发布的5个作品
    const { rows: works } = await db.query(`
      SELECT id, title, type, thumbnail
      FROM works
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\n最近发布的作品:');
    works.forEach(w => {
      console.log(`\n  - ID: ${w.id}`);
      console.log(`    标题: ${w.title}`);
      console.log(`    类型: ${w.type}`);
      console.log(`    缩略图: ${w.thumbnail?.substring(0, 100)}...`);
    });
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    process.exit(0);
  }
}

checkWorksTypeValue();
