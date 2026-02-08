// 修复 user_activities 表，添加缺失的列
import { getDB } from './database.mjs';

async function fixUserActivitiesTable() {
  try {
    const db = await getDB();
    
    // 检查 target_type 列是否存在
    const checkColumn = await db.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'user_activities' AND column_name = 'target_type'
    `);
    
    if (checkColumn.rows.length === 0) {
      console.log('[Fix] Adding target_type column to user_activities table...');
      
      // 添加 target_type 列
      await db.query(`
        ALTER TABLE public.user_activities 
        ADD COLUMN IF NOT EXISTS target_type TEXT
      `);
      
      console.log('[Fix] target_type column added successfully!');
    } else {
      console.log('[Fix] target_type column already exists.');
    }
    
    // 列出 user_activities 表的所有列
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_activities'
      ORDER BY ordinal_position
    `);
    
    console.log('[Fix] user_activities table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('[Fix] Database fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('[Fix] Error:', error);
    process.exit(1);
  }
}

fixUserActivitiesTable();
