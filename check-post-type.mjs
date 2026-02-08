import { getDB } from './server/database.mjs';

async function checkPostType() {
  console.log('检查最近发布的作品...');
  
  try {
    const db = await getDB();
    
    // 获取最近发布的5个作品
    const { rows: posts } = await db.query(`
      SELECT id, title, attachments, images, created_at
      FROM posts
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\n最近发布的作品:');
    posts.forEach(p => {
      console.log(`\n  - ID: ${p.id}`);
      console.log(`    标题: ${p.title}`);
      console.log(`    附件: ${JSON.stringify(p.attachments)}`);
      console.log(`    图片: ${JSON.stringify(p.images)}`);
      console.log(`    创建时间: ${p.created_at}`);
    });
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    process.exit(0);
  }
}

checkPostType();
