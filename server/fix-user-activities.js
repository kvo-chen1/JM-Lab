// 修复 user_activities 表，添加 target_id 列
import { getDB } from './database.mjs';

async function fixUserActivitiesTable() {
  try {
    const db = await getDB();
    
    // 检查 target_id 列是否存在
    const checkColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_activities' AND column_name = 'target_id'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('[Fix] Adding target_id column to user_activities table...');
      
      // 添加 target_id 列
      await db.query(`
        ALTER TABLE public.user_activities 
        ADD COLUMN IF NOT EXISTS target_id UUID REFERENCES public.users(id) ON DELETE CASCADE
      `);
      
      console.log('[Fix] target_id column added successfully!');
    } else {
      console.log('[Fix] target_id column already exists.');
    }
    
    // 检查 follows 表的 created_at 列类型
    const checkFollowsColumn = await db.query(`
      SELECT data_type 
      FROM information_schema.columns 
      WHERE table_name = 'follows' AND column_name = 'created_at'
    `);
    
    if (checkFollowsColumn.rows.length > 0) {
      console.log('[Fix] follows.created_at column type:', checkFollowsColumn.rows[0].data_type);
    }
    
    console.log('[Fix] Database fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('[Fix] Error:', error);
    process.exit(1);
  }
}

fixUserActivitiesTable();
