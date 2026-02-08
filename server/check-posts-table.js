// 检查 posts 表结构
import { getDB } from './database.mjs';

async function checkPostsTable() {
  try {
    const db = await getDB();
    
    // 检查 posts 表的列
    const columns = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'posts'
      ORDER BY ordinal_position
    `);
    
    console.log('[Check] posts table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('[Check] Error:', error);
    process.exit(1);
  }
}

checkPostsTable();
