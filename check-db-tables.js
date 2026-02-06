// 检查 Supabase/PostgreSQL 数据库表格完整性的脚本
import { getDB, getDBStatus } from './server/database.mjs';

// 代码中定义的表格列表
const expectedTables = [
  'users',
  'favorites',
  'video_tasks',
  'communities',
  'community_members',
  'works',
  'categories',
  'tags',
  'posts',
  'post_tags',
  'comments',
  'likes',
  'user_achievements',
  'points_records',
  'direct_messages',
  'friend_requests',
  'friends',
  'user_status',
  'user_activities'
];

async function checkDatabaseTables() {
  console.log('开始检查数据库表格完整性...');
  
  try {
    // 获取数据库状态
    const status = await getDBStatus();
    console.log(`\n=== 数据库状态 ===`);
    console.log(`当前数据库类型: ${status.currentDbType}`);
    
    if (status.currentDbType !== 'postgresql' && status.currentDbType !== 'supabase') {
      console.log('❌ 不是 PostgreSQL/Supabase 数据库，无法检查表格完整性');
      return;
    }
    
    // 获取数据库实例
    const db = await getDB();
    console.log('✅ 数据库连接成功');
    
    // 查询所有表格
    console.log(`\n=== 检查数据库表格 ===`);
    const result = await db.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    const actualTables = result.rows.map(row => row.table_name);
    console.log(`数据库中存在的表格 (${actualTables.length}):`);
    actualTables.forEach(table => console.log(`  - ${table}`));
    
    // 检查表格完整性
    console.log(`\n=== 表格完整性检查 ===`);
    
    // 检查缺失的表格
    const missingTables = expectedTables.filter(table => !actualTables.includes(table));
    if (missingTables.length > 0) {
      console.log(`❌ 缺失的表格 (${missingTables.length}):`);
      missingTables.forEach(table => console.log(`  - ${table}`));
    } else {
      console.log(`✅ 所有预期表格都存在`);
    }
    
    // 检查多余的表格
    const extraTables = actualTables.filter(table => !expectedTables.includes(table));
    if (extraTables.length > 0) {
      console.log(`⚠️  额外的表格 (${extraTables.length}):`);
      extraTables.forEach(table => console.log(`  - ${table}`));
    }
    
    // 检查关键表格的结构
    console.log(`\n=== 关键表格结构检查 ===`);
    const keyTables = ['users', 'works', 'posts', 'communities'];
    
    for (const table of keyTables) {
      if (actualTables.includes(table)) {
        console.log(`\n--- 表格: ${table} ---`);
        const columnsResult = await db.query(`
          SELECT column_name, data_type, is_nullable 
          FROM information_schema.columns 
          WHERE table_schema = 'public' AND table_name = $1 
          ORDER BY ordinal_position
        `, [table]);
        
        console.log(`列数: ${columnsResult.rows.length}`);
        console.log(`列结构:`);
        columnsResult.rows.forEach(col => {
          console.log(`  - ${col.column_name} (${col.data_type}, ${col.is_nullable === 'YES' ? '可空' : '非空'})`);
        });
      } else {
        console.log(`\n--- 表格: ${table} ---`);
        console.log(`❌ 表格不存在`);
      }
    }
    
    // 检查索引
    console.log(`\n=== 索引检查 ===`);
    const indexResult = await db.query(`
      SELECT tablename, indexname 
      FROM pg_indexes 
      WHERE schemaname = 'public' 
      ORDER BY tablename, indexname
    `);
    
    console.log(`索引数量: ${indexResult.rows.length}`);
    const indexesByTable = {};
    indexResult.rows.forEach(row => {
      if (!indexesByTable[row.tablename]) {
        indexesByTable[row.tablename] = [];
      }
      indexesByTable[row.tablename].push(row.indexname);
    });
    
    Object.entries(indexesByTable).forEach(([table, indexes]) => {
      console.log(`\n表格 ${table} 的索引 (${indexes.length}):`);
      indexes.forEach(index => console.log(`  - ${index}`));
    });
    
    console.log(`\n=== 检查完成 ===`);
    if (missingTables.length === 0) {
      console.log('✅ 数据库表格结构完整');
    } else {
      console.log(`❌ 数据库表格结构不完整，缺失 ${missingTables.length} 个表格`);
    }
    
  } catch (error) {
    console.error('\n❌ 检查过程中出错:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行检查
checkDatabaseTables();
