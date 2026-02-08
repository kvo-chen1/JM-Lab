// 修复 comments 表结构 - 添加 author_id 列
import { getDB } from './database.mjs';

async function fixCommentsSchema() {
  try {
    const db = await getDB();
    
    console.log('[Fix] Checking comments table schema...');
    
    // 检查 comments 表的列
    const { rows: columns } = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'comments'
    `);
    
    const columnNames = columns.map(c => c.column_name);
    console.log('[Fix] Current columns:', columnNames);
    
    // 检查是否有 author_id 列
    if (!columnNames.includes('author_id')) {
      console.log('[Fix] Adding author_id column...');
      await db.query(`
        ALTER TABLE comments 
        ADD COLUMN author_id UUID REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('[Fix] author_id column added');
    } else {
      console.log('[Fix] author_id column already exists');
    }
    
    // 检查是否有 user_id 列
    if (!columnNames.includes('user_id')) {
      console.log('[Fix] Adding user_id column...');
      await db.query(`
        ALTER TABLE comments 
        ADD COLUMN user_id UUID REFERENCES users(id) ON DELETE CASCADE
      `);
      console.log('[Fix] user_id column added');
    } else {
      console.log('[Fix] user_id column already exists');
    }
    
    console.log('[Fix] Done!');
    process.exit(0);
  } catch (error) {
    console.error('[Fix] Error:', error);
    process.exit(1);
  }
}

fixCommentsSchema();
