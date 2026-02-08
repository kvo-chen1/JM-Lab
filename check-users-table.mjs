import { getDB } from './server/database.mjs';

async function checkUsersTable() {
  console.log('检查 users 表结构...');
  
  try {
    const db = await getDB();
    
    // 获取 users 表结构
    const { rows: columns } = await db.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'users'
      ORDER BY ordinal_position
    `);
    
    console.log('\nusers 表结构:');
    columns.forEach(c => {
      console.log(`  - ${c.column_name}: ${c.data_type} ${c.is_nullable === 'NO' ? 'NOT NULL' : ''} ${c.column_default ? `DEFAULT ${c.column_default}` : ''}`);
    });
    
    // 检查 cover_image 列是否存在
    const coverImageColumn = columns.find(c => c.column_name === 'cover_image');
    if (coverImageColumn) {
      console.log('\ncover_image 列存在:', coverImageColumn);
    } else {
      console.log('\ncover_image 列不存在！');
    }
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    process.exit(0);
  }
}

checkUsersTable();
