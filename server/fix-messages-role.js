// 修复 messages 表 - role 列允许为空或设置默认值
import { getDB } from './database.mjs';

async function fixMessagesTable() {
  try {
    const db = await getDB();
    
    // 检查 role 列是否存在
    const checkColumn = await db.query(`
      SELECT column_name, is_nullable, column_default
      FROM information_schema.columns 
      WHERE table_name = 'messages' AND column_name = 'role'
    `);
    
    if (checkColumn.rows.length > 0) {
      console.log('[Fix] role column exists:', checkColumn.rows[0]);
      
      // 如果 role 列不允许为空且没有默认值，修改它
      if (checkColumn.rows[0].is_nullable === 'NO' && !checkColumn.rows[0].column_default) {
        console.log('[Fix] Setting default value for role column...');
        await db.query(`
          ALTER TABLE public.messages 
          ALTER COLUMN role SET DEFAULT 'user'
        `);
        console.log('[Fix] Default value set!');
      }
    } else {
      console.log('[Fix] role column does not exist, adding it...');
      await db.query(`
        ALTER TABLE public.messages 
        ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user'
      `);
      console.log('[Fix] role column added!');
    }
    
    // 列出 messages 表的所有列
    const columns = await db.query(`
      SELECT column_name, is_nullable, data_type, column_default
      FROM information_schema.columns 
      WHERE table_name = 'messages'
      ORDER BY ordinal_position
    `);
    
    console.log('\n[Fix] messages table columns:');
    columns.rows.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable}, default: ${col.column_default})`);
    });
    
    console.log('\n[Fix] Database fix completed!');
    process.exit(0);
  } catch (error) {
    console.error('[Fix] Error:', error);
    process.exit(1);
  }
}

fixMessagesTable();
