// 修复 communityDB.addComment 函数的时间戳格式
import { readFileSync, writeFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const filePath = join(__dirname, 'database.mjs');
let content = readFileSync(filePath, 'utf8');

// 修复 communityDB.addComment 函数
const oldCode = `  async addComment(postId, userId, content, parentId = null) {
    const db = await getDB()
    const now = Math.floor(Date.now() / 1000)
    const id = randomUUID()
    
    const { rows } = await db.query(\`
      INSERT INTO comments (id, post_id, user_id, content, parent_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    \`, [id, postId, userId, content, parentId, now, now])
    
    // 更新帖子的评论数
    await db.query(\`
      UPDATE posts SET comments_count = comments_count + 1, updated_at = $1 WHERE id = $2
    \`, [now, postId])
    
    return rows[0]
  },`;

const newCode = `  async addComment(postId, userId, content, parentId = null) {
    const db = await getDB()
    const now = new Date().toISOString()
    const id = randomUUID()
    
    const { rows } = await db.query(\`
      INSERT INTO comments (id, post_id, user_id, content, parent_id, created_at, updated_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    \`, [id, postId, userId, content, parentId, now, now])
    
    // 更新帖子的评论数
    await db.query(\`
      UPDATE posts SET comments_count = comments_count + 1, updated_at = $1 WHERE id = $2
    \`, [now, postId])
    
    return rows[0]
  },`;

if (content.includes(oldCode)) {
  content = content.replace(oldCode, newCode);
  writeFileSync(filePath, content);
  console.log('[Fix] communityDB.addComment function updated successfully!');
} else {
  console.log('[Fix] Could not find the exact code to replace.');
}
