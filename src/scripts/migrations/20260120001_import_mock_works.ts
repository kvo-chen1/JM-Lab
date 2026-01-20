import { MigrationScript, MigrationResult } from './index';
import { originalWorks, Work } from '../../mock/works';
import { workService } from '../../services/apiService';

/**
 * 导入模拟作品数据到数据库的迁移脚本
 */
const importMockWorksMigration: MigrationScript = {
  name: 'import-mock-works',
  version: '20260120001',
  description: '将模拟作品数据从mock/works.ts导入到数据库',
  
  /**
   * 执行迁移
   */
  async up(): Promise<MigrationResult> {
    const logs: string[] = [];
    let importedCount = 0;
    const startTime = Date.now();
    
    try {
      logs.push('开始导入模拟作品数据...');
      logs.push(`共找到 ${originalWorks.length} 个模拟作品`);
      
      // 关闭模拟数据模式，确保数据写入真实数据库
      const useMockData = workService.getUseMockData();
      workService.setUseMockData(false);
      
      // 导入每个作品
      for (const mockWork of originalWorks) {
        try {
          // 检查作品是否已存在
          const existingWork = await workService.getWorkById(mockWork.id).catch(() => null);
          
          if (!existingWork) {
            // 导入新作品
            await workService.createWork(mockWork);
            importedCount++;
            logs.push(`成功导入作品: ${mockWork.title} (ID: ${mockWork.id})`);
          } else {
            logs.push(`作品已存在，跳过导入: ${mockWork.title} (ID: ${mockWork.id})`);
          }
        } catch (error) {
          logs.push(`导入作品失败: ${mockWork.title} (ID: ${mockWork.id}) - 错误: ${error instanceof Error ? error.message : String(error)}`);
          // 继续导入其他作品，不中断整个迁移过程
        }
      }
      
      // 恢复模拟数据模式设置
      workService.setUseMockData(useMockData);
      
      const duration = Date.now() - startTime;
      logs.push(`模拟作品数据导入完成！`);
      logs.push(`成功导入: ${importedCount} 个作品`);
      logs.push(`耗时: ${duration}ms`);
      
      return {
        success: true,
        message: `成功导入 ${importedCount} 个模拟作品到数据库`,
        affectedCount: importedCount,
        duration,
        logs
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logs.push(`迁移执行失败: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        message: `导入模拟作品数据失败`,
        affectedCount: importedCount,
        duration,
        error: error instanceof Error ? error : new Error(String(error)),
        logs
      };
    }
  },
  
  /**
   * 回滚迁移
   */
  async down(): Promise<MigrationResult> {
    const logs: string[] = [];
    let deletedCount = 0;
    const startTime = Date.now();
    
    try {
      logs.push('开始回滚模拟作品数据导入...');
      logs.push(`准备删除 ${originalWorks.length} 个模拟作品`);
      
      // 关闭模拟数据模式，确保操作真实数据库
      const useMockData = workService.getUseMockData();
      workService.setUseMockData(false);
      
      // 删除每个导入的作品
      for (const mockWork of originalWorks) {
        try {
          await workService.deleteWork(mockWork.id);
          deletedCount++;
          logs.push(`成功删除作品: ${mockWork.title} (ID: ${mockWork.id})`);
        } catch (error) {
          logs.push(`删除作品失败: ${mockWork.title} (ID: ${mockWork.id}) - 错误: ${error instanceof Error ? error.message : String(error)}`);
          // 继续删除其他作品，不中断整个回滚过程
        }
      }
      
      // 恢复模拟数据模式设置
      workService.setUseMockData(useMockData);
      
      const duration = Date.now() - startTime;
      logs.push(`模拟作品数据回滚完成！`);
      logs.push(`成功删除: ${deletedCount} 个作品`);
      logs.push(`耗时: ${duration}ms`);
      
      return {
        success: true,
        message: `成功回滚 ${deletedCount} 个模拟作品的导入`,
        affectedCount: deletedCount,
        duration,
        logs
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      logs.push(`回滚执行失败: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        message: `回滚模拟作品数据导入失败`,
        affectedCount: deletedCount,
        duration,
        error: error instanceof Error ? error : new Error(String(error)),
        logs
      };
    }
  }
};

export default importMockWorksMigration;
