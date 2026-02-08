import { getDB } from './server/database.mjs';

async function checkWorksType() {
  console.log('检查 works 表是否有 type 字段...');
  
  try {
    const db = await getDB();
    
    // 获取 works 表结构
    const { rows: columns } = await db.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'works'
      ORDER BY ordinal_position
    `);
    
    console.log('\nworks 表结构:');
    columns.forEach(c => {
      console.log(`  - ${c.column_name}: ${c.data_type}`);
    });
    
    // 检查 type 列是否存在
    const typeColumn = columns.find(c => c.column_name === 'type');
    if (typeColumn) {
      console.log('\ntype 列存在:', typeColumn);
    } else {
      console.log('\ntype 列不存在！需要添加');
      
      // 添加 type 列
      console.log('正在添加 type 列...');
      await db.query(`ALTER TABLE works ADD COLUMN type TEXT DEFAULT 'image'`);
      console.log('type 列添加成功！');
    }
    
  } catch (err) {
    console.error('检查失败:', err);
  } finally {
    process.exit(0);
  }
}

checkWorksType();
