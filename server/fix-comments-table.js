// 修复 comments 表结构
import { getDB } from './database.mjs';

async function fixCommentsTable() {
  try {
    const db = await getDB();
    
    console.log('[Fix] Checking comments table structure...');
    
    // 检查现有的 comments 表
    const checkTable = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'comments'
      ORDER BY ordinal_position
    `);
    
    console.log('[Fix] Current comments table columns:');
    checkTable.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    // 如果 id 列是 integer 而不是 uuid，需要重建表
    const idColumn = checkTable.rows.find(col => col.column_name === 'id');
    if (idColumn && idColumn.data_type === 'integer') {
      console.log('[Fix] Found old comments table with integer ID, need to recreate...');
      
      // 删除旧的触发器
      await db.query(`DROP TRIGGER IF EXISTS audit_comments_changes ON comments`);
      await db.query(`DROP TRIGGER IF EXISTS log_comment_activity_trigger ON comments`);
      console.log('[Fix] Old triggers dropped');
      
      // 备份旧数据（如果有）
      const { rows: oldData } = await db.query(`SELECT * FROM comments LIMIT 1`);
      if (oldData.length > 0) {
        console.log('[Fix] Backing up old comments data...');
        await db.query(`CREATE TABLE IF NOT EXISTS comments_backup AS SELECT * FROM comments`);
        console.log('[Fix] Old data backed up to comments_backup');
      }
      
      // 删除旧表
      await db.query(`DROP TABLE IF EXISTS comments CASCADE`);
      console.log('[Fix] Old comments table dropped');
      
      // 创建新表
      await db.query(`
        CREATE TABLE IF NOT EXISTS public.comments (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
          user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
          content TEXT NOT NULL,
          parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
          likes INTEGER DEFAULT 0,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
        )
      `);
      console.log('[Fix] New comments table created with UUID columns');
      
      // 创建索引
      await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_post_id ON public.comments(post_id)`);
      await db.query(`CREATE INDEX IF NOT EXISTS idx_comments_user_id ON public.comments(user_id)`);
      console.log('[Fix] Indexes created');
    } else {
      console.log('[Fix] Comments table already has correct structure');
    }
    
    console.log('[Fix] Done!');
    process.exit(0);
  } catch (error) {
    console.error('[Fix] Error:', error);
    process.exit(1);
  }
}

fixCommentsTable();
