// 检查数据库连接状态的测试脚本
import { getDBStatus, getDB } from './server/database.mjs';

async function checkDatabaseConnection() {
  console.log('开始检查数据库连接状态...');
  
  try {
    // 获取数据库连接状态
    const status = await getDBStatus();
    console.log('\n=== 数据库连接状态 ===');
    console.log(`当前数据库类型: ${status.currentDbType}`);
    console.log('连接状态:', JSON.stringify(status.status, null, 2));
    console.log('重试计数:', status.retryCounts);
    console.log('检查时间:', new Date(status.timestamp).toLocaleString());
    
    // 尝试获取数据库实例，验证连接是否正常
    console.log('\n=== 尝试获取数据库实例 ===');
    const db = await getDB();
    console.log('数据库实例获取成功:', typeof db);
    
    // 根据数据库类型，执行简单的测试操作
    if (status.currentDbType === 'memory') {
      console.log('\n=== 内存数据库测试 ===');
      console.log('内存存储结构:', Object.keys(db));
      console.log('用户数量:', db.users.length);
      console.log('作品数量:', db.works.length);
    } else if (status.currentDbType === 'postgresql' || status.currentDbType === 'supabase') {
      console.log('\n=== PostgreSQL/Supabase 数据库测试 ===');
      console.log('数据库实例类型:', db.constructor.name);
      
      // 尝试执行简单的查询
      try {
        const result = await db.query('SELECT 1 as test');
        console.log('查询测试成功:', result.rows[0]);
      } catch (queryError) {
        console.log('查询测试失败:', queryError.message);
      }
    }
    
    console.log('\n✅ 数据库连接检查完成');
  } catch (error) {
    console.error('\n❌ 数据库连接检查失败:', error.message);
  }
}

// 运行检查
checkDatabaseConnection();
