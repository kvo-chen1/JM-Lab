import { getDB } from './server/database.mjs';

async function checkTableStructure() {
  console.log('检查 community_members 表结构...');
  
  try {
    const db = await getDB();
    
    // 获取表结构
    const { rows: columns } = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'community_members'
      ORDER BY ordinal_position
    `);
    
    console.log('\ncommunity_members 表结构:');
    columns.forEach(c => {
      console.log(`  - ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''} ${c.column_default ? `DEFAULT ${c.column_default}` : ''}`);
    });
    
    // 检查表约束
    const { rows: constraints } = await db.query(`
      SELECT conname, contype, pg_get_constraintdef(oid) as def
      FROM pg_constraint
      WHERE conrelid = 'community_members'::regclass
    `);
    
    console.log('\n表约束:');
    constraints.forEach(c => {
      console.log(`  - ${c.conname}: ${c.def}`);
    });
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    process.exit(0);
  }
}

checkTableStructure();
