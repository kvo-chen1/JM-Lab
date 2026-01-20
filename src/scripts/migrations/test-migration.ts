// 测试迁移脚本
import { migrationManager } from './index';
import migrationScript from './20260120001_import_mock_works';

async function testMigration() {
  console.log('=== 开始测试数据迁移 ===');
  
  try {
    // 注册迁移脚本
    migrationManager.registerScript(migrationScript);
    console.log('迁移脚本注册成功');
    
    // 获取所有迁移脚本
    const scripts = migrationManager.getScripts();
    console.log(`共注册了 ${scripts.length} 个迁移脚本:`);
    scripts.forEach(script => {
      console.log(`  - ${script.version}: ${script.name}`);
    });
    
    // 执行迁移
    console.log('\n=== 开始执行迁移 ===');
    const results = await migrationManager.migrateAll();
    
    console.log('\n=== 迁移执行结果 ===');
    results.forEach((result, index) => {
      console.log(`迁移 ${index + 1}: ${result.success ? '成功' : '失败'}`);
      console.log(`  消息: ${result.message}`);
      console.log(`  影响数据: ${result.affectedCount}`);
      console.log(`  耗时: ${result.duration}ms`);
      if (result.error) {
        console.log(`  错误: ${result.error.message}`);
      }
    });
    
    // 获取迁移记录
    const records = migrationManager.getRecords();
    console.log('\n=== 迁移记录 ===');
    records.forEach(record => {
      console.log(`- ${record.version}: ${record.name} (${record.status})`);
      console.log(`  开始时间: ${record.startedAt}`);
      if (record.endedAt) {
        console.log(`  结束时间: ${record.endedAt}`);
        console.log(`  耗时: ${record.duration}ms`);
      }
      if (record.error) {
        console.log(`  错误: ${record.error}`);
      }
    });
    
    // 获取迁移日志
    const logs = migrationManager.getLog();
    console.log('\n=== 迁移日志 ===');
    logs.forEach(log => {
      console.log(log);
    });
    
    console.log('\n=== 迁移测试完成 ===');
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

// 执行测试
testMigration();
