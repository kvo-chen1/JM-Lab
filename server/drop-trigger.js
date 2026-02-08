// 删除 follows 表的触发器
import { getDB } from './database.mjs';

async function dropTrigger() {
  try {
    const db = await getDB();
    
    // 删除触发器
    await db.query(`
      DROP TRIGGER IF EXISTS log_follow_activity_trigger ON follows
    `);
    
    console.log('[Drop] Trigger log_follow_activity_trigger dropped successfully!');
    
    // 同时删除函数
    await db.query(`
      DROP FUNCTION IF EXISTS log_follow_activity()
    `);
    
    console.log('[Drop] Function log_follow_activity dropped successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('[Drop] Error:', error);
    process.exit(1);
  }
}

dropTrigger();
