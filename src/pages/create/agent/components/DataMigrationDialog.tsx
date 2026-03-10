import { useEffect } from 'react';
import { getDataMigrationService } from '../services/dataMigration';
import { toast } from 'sonner';

/**
 * 数据迁移组件 - 自动在后台执行
 * 不显示任何弹窗，静默完成迁移
 */
export default function DataMigrationDialog() {
  const migrationService = getDataMigrationService();

  // 自动执行迁移
  useEffect(() => {
    const autoMigrate = async () => {
      try {
        // 检查是否需要迁移
        const needsMigration = await migrationService.needsMigration();
        if (!needsMigration) return;

        console.log('[DataMigration] 开始自动迁移数据...');

        // 静默执行迁移
        const result = await migrationService.migrate({
          keepLocalStorage: true, // 保留原始数据作为备份
          batchSize: 100,
          skipExisting: true
        });

        if (result.status === 'completed') {
          console.log(`[DataMigration] 迁移完成！共迁移 ${result.completed} 条数据`);
          // 只在控制台显示，不打扰用户
          if (result.completed > 0) {
            toast.success(`数据已自动升级`, {
              description: `成功迁移 ${result.completed} 条数据到新的存储系统`,
              duration: 3000
            });
          }
        } else if (result.status === 'failed') {
          console.error('[DataMigration] 迁移失败:', result.errors);
          // 静默失败，不影响用户体验
        }
      } catch (error) {
        console.error('[DataMigration] 自动迁移失败:', error);
        // 静默失败
      }
    };

    // 延迟执行，避免影响页面加载
    const timer = setTimeout(autoMigrate, 5000);
    return () => clearTimeout(timer);
  }, [migrationService]);

  // 不渲染任何 UI
  return null;
}
