// 修复 comments 表的时间戳字段类型
import { getDB } from './database.mjs';

async function fixCommentsTime() {
  try {
    const db = await getDB();
    
    console.log('[Fix] Checking comments table time columns...');
    
    // 检查 created_at 列的类型
    const checkColumn = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'comments' AND column_name = 'created_at'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('[Fix] created_at column type:', checkColumn.rows[0].data_type);
      
      // 如果是 BIGINT，改为 TIMESTAMP WITH TIME ZONE
      if (checkColumn.rows[0].data_type === 'bigint') {
        console.log('[Fix] Converting BIGINT to TIMESTAMP WITH TIME ZONE...');
        
        // 修改列类型
        await db.query(`
          ALTER TABLE public.comments 
          ALTER COLUMN created_at TYPE TIMESTAMP WITH TIME ZONE 
          USING to_timestamp(created_at)
        `);
        
        await db.query(`
          ALTER TABLE public.comments 
          ALTER COLUMN updated_at TYPE TIMESTAMP WITH TIME ZONE 
          USING to_timestamp(updated_at)
        `);
        
        console.log('[Fix] Columns converted successfully!');
      } else {
        console.log('[Fix] Columns already have correct type');
      }
    }
    
    console.log('[Fix] Done!');
    process.exit(0);
  } catch (error) {
    console.error('[Fix] Error:', error);
    process.exit(1);
  }
}

fixCommentsTime();
