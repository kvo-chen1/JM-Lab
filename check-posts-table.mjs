import { getDB } from './server/database.mjs';

async function checkPostsTable() {
  console.log('检查 posts 表结构...');
  
  try {
    const db = await getDB();
    
    // 获取 posts 表结构
    const { rows: columns } = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'posts'
      ORDER BY ordinal_position
    `);
    
    console.log('\nposts 表结构:');
    columns.forEach(c => {
      console.log(`  - ${c.column_name}: ${c.data_type}`);
    });
    
    // 获取最近发布的5个作品
    const { rows: posts } = await db.query(`
      SELECT *
      FROM posts
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\n最近发布的作品:');
    posts.forEach(p => {
      console.log(`\n  - ID: ${p.id}`);
      console.log(`    标题: ${p.title}`);
      console.log(`    图片: ${JSON.stringify(p.images)}`);
      console.log(`    媒体: ${JSON.stringify(p.media)}`);
      console.log(`    创建时间: ${p.created_at}`);
    });
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    process.exit(0);
  }
}

checkPostsTable();
