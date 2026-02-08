import { getDB } from './server/database.mjs';

async function checkWorksTable() {
  console.log('检查 works 表结构...');
  
  try {
    const db = await getDB();
    
    // 获取 works 表结构
    const { rows: columns } = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'works'
      ORDER BY ordinal_position
    `);
    
    console.log('\nworks 表结构:');
    columns.forEach(c => {
      console.log(`  - ${c.column_name}: ${c.data_type}`);
    });
    
    // 获取最近发布的5个作品
    const { rows: works } = await db.query(`
      SELECT *
      FROM works
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\n最近发布的作品:');
    works.forEach(w => {
      console.log(`\n  - ID: ${w.id}`);
      console.log(`    标题: ${w.title}`);
      console.log(`    类型: ${w.type}`);
      console.log(`    缩略图: ${w.thumbnail}`);
      console.log(`    媒体: ${JSON.stringify(w.media)}`);
      console.log(`    创建时间: ${w.created_at}`);
    });
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    process.exit(0);
  }
}

checkWorksTable();
