// 检查数据库触发器
import { getDB } from './database.mjs';

async function checkTriggers() {
  try {
    const db = await getDB();
    
    // 检查 follows 表的触发器
    const triggers = await db.query(`
      SELECT 
        trigger_name,
        event_manipulation,
        action_statement
      FROM information_schema.triggers
      WHERE event_object_table = 'follows'
    `);
    
    console.log('[Check] Triggers on follows table:');
    triggers.rows.forEach(t => {
      console.log(`  - ${t.trigger_name}: ${t.event_manipulation}`);
      console.log(`    Action: ${t.action_statement?.substring(0, 100)}...`);
    });
    
    if (triggers.rows.length === 0) {
      console.log('[Check] No triggers found on follows table.');
    }
    
    // 检查 user_activities 表的列
    const columns = await db.query(`
      SELECT column_name, is_nullable, data_type
      FROM information_schema.columns
      WHERE table_name = 'user_activities'
      ORDER BY ordinal_position
    `);
    
    console.log('\n[Check] user_activities columns:');
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
