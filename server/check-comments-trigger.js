// 检查 comments 表的触发器
import { getDB } from './database.mjs';

async function checkTriggers() {
  try {
    const db = await getDB();
    
    // 检查 comments 表的触发器
    const triggers = await db.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'comments'
    `);
    
    console.log('[Check] Triggers on comments table:');
    triggers.rows.forEach(t => {
      console.log(`  - ${t.trigger_name}: ${t.event_manipulation}`);
      console.log(`    Action: ${t.action_statement?.substring(0, 200)}...`);
    });
    
    if (triggers.rows.length === 0) {
      console.log('[Check] No triggers found on comments table.');
    }
    
    // 检查 comments 表的列类型
    const columns = await db.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'comments'
      ORDER BY ordinal_position
    `);
    
    console.log('\n[Check] comments table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
    });
    
    process.exit(0);
  } catch (error) {
    console.error('[Check] Error:', error);
    process.exit(1);
  }
}

checkTriggers();
