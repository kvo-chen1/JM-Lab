import { MigrationScript, MigrationResult } from './index';

/**
 * 注意：此迁移脚本已禁用
 * 为商业化部署，模拟数据导入功能已移除
 * 系统现在使用真实数据API
 */
const importMockWorksMigration: MigrationScript = {
  name: 'import-mock-works',
  version: '20260120001',
  description: '模拟数据导入功能已禁用 - 系统使用真实数据API',

  /**
   * 执行迁移 - 已禁用
   */
  async up(): Promise<MigrationResult> {
    console.warn('importMockWorksMigration: 模拟数据导入已禁用，系统使用真实数据API');

    return {
      success: true,
      message: '模拟数据导入已禁用，系统使用真实数据API',
      affectedCount: 0,
      duration: 0,
      logs: ['模拟数据导入功能已禁用，系统现在使用真实数据API']
    };
  },

  /**
   * 回滚迁移 - 已禁用
   */
  async down(): Promise<MigrationResult> {
    console.warn('importMockWorksMigration: 模拟数据回滚已禁用');

    return {
      success: true,
      message: '模拟数据回滚已禁用',
      affectedCount: 0,
      duration: 0,
      logs: ['模拟数据回滚功能已禁用']
    };
  }
};

export default importMockWorksMigration;
