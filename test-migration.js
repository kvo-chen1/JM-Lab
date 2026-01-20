// 测试数据迁移流程

import { migrationManager } from './src/scripts/migrations/index';
import { importMockWorks } from './src/scripts/migrations/20260120001_import_mock_works';

async function testMigration() {
  console.log('开始测试数据迁移流程...');
  
  try {
    // 1. 注册迁移脚本
    console.log('\n1. 注册迁移脚本:');
    
    // 获取模拟数据迁移脚本
    const mockWorksMigration = importMockWorks;
    console.log('   迁移脚本名称:', mockWorksMigration.name);
    console.log('   迁移脚本版本:', mockWorksMigration.version);
    console.log('   迁移脚本描述:', mockWorksMigration.description);
    
    // 注册迁移脚本
    migrationManager.registerScript(mockWorksMigration);
    console.log('   迁移脚本注册成功');
    
    // 2. 执行迁移
    console.log('\n2. 执行迁移:');
    const migrateResult = await migrationManager.migrate(mockWorksMigration.version);
    if (migrateResult) {
      console.log('   迁移执行结果:', migrateResult.success ? '成功' : '失败');
      console.log('   迁移消息:', migrateResult.message);
      console.log('   影响数据数量:', migrateResult.affectedCount);
      console.log('   迁移耗时:', migrateResult.duration, 'ms');
      if (migrateResult.logs) {
        console.log('   迁移日志:', migrateResult.logs);
      }
    } else {
      console.log('   迁移执行失败，未返回结果');
    }
    
    // 3. 测试回滚
    console.log('\n3. 测试回滚:');
    const rollbackResult = await migrationManager.rollback(mockWorksMigration.version);
    if (rollbackResult) {
      console.log('   回滚执行结果:', rollbackResult.success ? '成功' : '失败');
      console.log('   回滚消息:', rollbackResult.message);
      console.log('   影响数据数量:', rollbackResult.affectedCount);
      console.log('   回滚耗时:', rollbackResult.duration, 'ms');
      if (rollbackResult.logs) {
        console.log('   回滚日志:', rollbackResult.logs);
      }
    } else {
      console.log('   回滚执行失败，未返回结果');
    }
    
    console.log('\n✅ 数据迁移流程测试完成！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

testMigration();
