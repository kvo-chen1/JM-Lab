// 检查 comments 表数据
import { getDB } from './database.mjs';

async function checkCommentsData() {
  try {
    const db = await getDB();
    
    // 获取所有评论
    const { rows } = await db.query(`
      SELECT c.*, u.username as author_name, u.avatar_url as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 10
    `);
    
    console.log('[Check] Latest 10 comments:');
    rows.forEach(c => {
      console.log(`  - ID: ${c.id}`);
      console.log(`    Content: ${c.content}`);
      console.log(`    User: ${c.author_name}`);
      console.log(`    Post ID: ${c.post_id}`);
      console.log('');
    });
    
    process.exit(0);
  } catch (error) {
    console.error('[Check] Error:', error);
    process.exit(1);
  }
}

checkCommentsData();
