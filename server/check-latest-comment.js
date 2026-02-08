// 检查最新保存的评论
import { getDB } from './database.mjs';

async function checkLatestComment() {
  try {
    const db = await getDB();
    
    // 获取最新的一条评论
    const { rows } = await db.query(`
      SELECT c.*, u.username as author_name, u.avatar_url as author_avatar
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      ORDER BY c.created_at DESC
      LIMIT 1
    `);
    
    if (rows.length > 0) {
      const c = rows[0];
      console.log('[Check] Latest comment:');
      console.log('  ID:', c.id);
      console.log('  Content:', c.content);
      console.log('  User:', c.author_name);
      console.log('  Post ID:', c.post_id);
      console.log('  Created at:', c.created_at);
    } else {
      console.log('[Check] No comments found');
    }
    
    process.exit(0);
  } catch (error) {
    console.error('[Check] Error:', error);
    process.exit(1);
  }
}

checkLatestComment();
