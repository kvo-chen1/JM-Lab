// 修复 user_activities 表，添加所有缺失的列
import { getDB } from './database.mjs';

async function fixUserActivitiesTable() {
  try {
    const db = await getDB();
    
    // 需要添加的列
    const columnsToAdd = [
      { name: 'target_id', type: 'UUID REFERENCES public.users(id) ON DELETE CASCADE' },
      { name: 'target_type', type: 'TEXT' },
      { name: 'target_title', type: 'TEXT' },
      { name: 'activity_type', type: 'TEXT' },
      { name: 'ip_address', type: 'TEXT' },
      { name: 'user_agent', type: 'TEXT' }
    ];
    
    for (const col of columnsToAdd) {
      const checkColumn = await db.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'user_activities' AND column_name = '${col.name}'
      `);
      
      if (checkColumn.rows.length === 0) {
        console.log(`[Fix] Adding ${col.name} column...`);
        await db.query(`
          ALTER TABLE public.user_activities 
          ADD COLUMN IF NOT EXISTS ${col.name} ${col.type}
        `);
        console.log(`[Fix] ${col.name} column added!`);
      } else {
        console.log(`[Fix] ${col.name} column already exists.`);
      }
    }
    
    // 列出 user_activities 表的所有列
    const columns = await db.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_activities'
      ORDER BY ordinal_position
    `);
    
    console.log('\n[Fix] user_activities table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });
    
    console.log('\n[Fix] Database fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('[Fix] Error:', error);
    process.exit(1);
  }
}

fixUserActivitiesTable();
