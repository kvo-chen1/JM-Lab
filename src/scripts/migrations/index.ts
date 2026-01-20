// 数据迁移脚本框架

// 迁移脚本接口
export interface MigrationScript {
  /**
   * 迁移脚本名称
   */
  name: string;
  
  /**
   * 迁移脚本版本
   */
  version: string;
  
  /**
   * 迁移脚本描述
   */
  description: string;
  
  /**
   * 执行迁移
   */
  up: () => Promise<MigrationResult>;
  
  /**
   * 回滚迁移
   */
  down: () => Promise<MigrationResult>;
}

// 迁移结果接口
export interface MigrationResult {
  /**
   * 迁移是否成功
   */
  success: boolean;
  
  /**
   * 迁移消息
   */
  message: string;
  
  /**
   * 迁移影响的数据数量
   */
  affectedCount: number;
  
  /**
   * 迁移耗时（毫秒）
   */
  duration: number;
  
  /**
   * 迁移错误（如果有）
   */
  error?: Error;
  
  /**
   * 迁移详细日志
   */
  logs?: string[];
}

// 迁移状态枚举
export enum MigrationStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  FAILED = 'failed',
  ROLLED_BACK = 'rolled_back'
}

// 迁移记录接口
export interface MigrationRecord {
  /**
   * 迁移记录ID
   */
  id: string;
  
  /**
   * 迁移脚本名称
   */
  name: string;
  
  /**
   * 迁移脚本版本
   */
  version: string;
  
  /**
   * 迁移状态
   */
  status: MigrationStatus;
  
  /**
   * 迁移开始时间
   */
  startedAt: Date;
  
  /**
   * 迁移结束时间
   */
  endedAt?: Date;
  
  /**
   * 迁移耗时（毫秒）
   */
  duration?: number;
  
  /**
   * 迁移影响的数据数量
   */
  affectedCount?: number;
  
  /**
   * 迁移错误（如果有）
   */
  error?: string;
}

// 迁移管理器
class MigrationManager {
  private migrationScripts: MigrationScript[] = [];
  private migrationRecords: MigrationRecord[] = [];
  private migrationLog: string[] = [];

  /**
   * 注册迁移脚本
   */
  registerScript(script: MigrationScript): void {
    // 检查脚本版本是否已存在
    const existingScript = this.migrationScripts.find(s => s.version === script.version);
    if (existingScript) {
      throw new Error(`迁移脚本版本 ${script.version} 已存在`);
    }
    
    this.migrationScripts.push(script);
    this.migrationScripts.sort((a, b) => a.version.localeCompare(b.version));
  }

  /**
   * 获取所有迁移脚本
   */
  getScripts(): MigrationScript[] {
    return [...this.migrationScripts];
  }

  /**
   * 获取所有迁移记录
   */
  getRecords(): MigrationRecord[] {
    return [...this.migrationRecords];
  }

  /**
   * 获取迁移日志
   */
  getLog(): string[] {
    return [...this.migrationLog];
  }

  /**
   * 执行所有待迁移的脚本
   */
  async migrateAll(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    
    // 获取待迁移的脚本
    const pendingScripts = this.migrationScripts.filter(script => {
      const record = this.migrationRecords.find(r => r.version === script.version);
      return !record || record.status === MigrationStatus.FAILED;
    });
    
    this.log(`开始执行 ${pendingScripts.length} 个迁移脚本`);
    
    for (const script of pendingScripts) {
      this.log(`开始执行迁移脚本: ${script.name} (${script.version})`);
      
      // 创建迁移记录
      const record: MigrationRecord = {
        id: this.generateId(),
        name: script.name,
        version: script.version,
        status: MigrationStatus.RUNNING,
        startedAt: new Date()
      };
      this.migrationRecords.push(record);
      
      try {
        // 执行迁移
        const startTime = Date.now();
        const result = await script.up();
        const endTime = Date.now();
        result.duration = endTime - startTime;
        
        // 更新迁移记录
        record.status = MigrationStatus.SUCCESS;
        record.endedAt = new Date();
        record.duration = endTime - startTime;
        record.affectedCount = result.affectedCount;
        
        this.log(`迁移脚本执行成功: ${script.name} (${script.version}) - 影响数据数量: ${result.affectedCount}, 耗时: ${result.duration}ms`);
        results.push(result);
      } catch (error) {
        // 更新迁移记录
        record.status = MigrationStatus.FAILED;
        record.endedAt = new Date();
        record.error = error instanceof Error ? error.message : String(error);
        
        this.log(`迁移脚本执行失败: ${script.name} (${script.version}) - 错误: ${record.error}`);
        
        results.push({
          success: false,
          message: `迁移脚本执行失败: ${script.name}`,
          affectedCount: 0,
          duration: 0,
          error: error instanceof Error ? error : new Error(String(error)),
          logs: [`错误: ${record.error}`]
        });
        
        // 迁移失败，停止后续迁移
        break;
      }
    }
    
    this.log(`迁移执行完成，共执行 ${results.length} 个迁移脚本`);
    return results;
  }

  /**
   * 回滚所有迁移
   */
  async rollbackAll(): Promise<MigrationResult[]> {
    const results: MigrationResult[] = [];
    
    // 获取已成功执行的迁移脚本，按版本倒序排列
    const successScripts = this.migrationScripts
      .filter(script => {
        const record = this.migrationRecords.find(r => r.version === script.version);
        return record && record.status === MigrationStatus.SUCCESS;
      })
      .sort((a, b) => b.version.localeCompare(a.version));
    
    this.log(`开始回滚 ${successScripts.length} 个迁移脚本`);
    
    for (const script of successScripts) {
      this.log(`开始回滚迁移脚本: ${script.name} (${script.version})`);
      
      // 查找迁移记录
      const record = this.migrationRecords.find(r => r.version === script.version);
      if (!record) {
        this.log(`未找到迁移记录: ${script.name} (${script.version})`);
        continue;
      }
      
      try {
        // 执行回滚
        const startTime = Date.now();
        const result = await script.down();
        const endTime = Date.now();
        result.duration = endTime - startTime;
        
        // 更新迁移记录
        record.status = MigrationStatus.ROLLED_BACK;
        
        this.log(`迁移脚本回滚成功: ${script.name} (${script.version}) - 影响数据数量: ${result.affectedCount}, 耗时: ${result.duration}ms`);
        results.push(result);
      } catch (error) {
        this.log(`迁移脚本回滚失败: ${script.name} (${script.version}) - 错误: ${error instanceof Error ? error.message : String(error)}`);
        
        results.push({
          success: false,
          message: `迁移脚本回滚失败: ${script.name}`,
          affectedCount: 0,
          duration: 0,
          error: error instanceof Error ? error : new Error(String(error)),
          logs: [`错误: ${error instanceof Error ? error.message : String(error)}`]
        });
        
        // 回滚失败，停止后续回滚
        break;
      }
    }
    
    this.log(`回滚执行完成，共回滚 ${results.length} 个迁移脚本`);
    return results;
  }

  /**
   * 回滚指定版本的迁移
   */
  async rollback(version: string): Promise<MigrationResult | null> {
    const script = this.migrationScripts.find(s => s.version === version);
    if (!script) {
      this.log(`未找到迁移脚本: ${version}`);
      return null;
    }
    
    // 查找迁移记录
    const record = this.migrationRecords.find(r => r.version === version);
    if (!record || record.status !== MigrationStatus.SUCCESS) {
      this.log(`迁移脚本未执行或执行失败: ${version}`);
      return null;
    }
    
    this.log(`开始回滚迁移脚本: ${script.name} (${script.version})`);
    
    try {
      // 执行回滚
      const startTime = Date.now();
      const result = await script.down();
      const endTime = Date.now();
      result.duration = endTime - startTime;
      
      // 更新迁移记录
      record.status = MigrationStatus.ROLLED_BACK;
      
      this.log(`迁移脚本回滚成功: ${script.name} (${script.version}) - 影响数据数量: ${result.affectedCount}, 耗时: ${result.duration}ms`);
      return result;
    } catch (error) {
      this.log(`迁移脚本回滚失败: ${script.name} (${script.version}) - 错误: ${error instanceof Error ? error.message : String(error)}`);
      
      return {
        success: false,
        message: `迁移脚本回滚失败: ${script.name}`,
        affectedCount: 0,
        duration: 0,
        error: error instanceof Error ? error : new Error(String(error)),
        logs: [`错误: ${error instanceof Error ? error.message : String(error)}`]
      };
    }
  }

  /**
   * 执行指定版本的迁移
   */
  async migrate(version: string): Promise<MigrationResult | null> {
    const script = this.migrationScripts.find(s => s.version === version);
    if (!script) {
      this.log(`未找到迁移脚本: ${version}`);
      return null;
    }
    
    // 检查迁移记录
    const record = this.migrationRecords.find(r => r.version === version);
    if (record && record.status === MigrationStatus.SUCCESS) {
      this.log(`迁移脚本已执行: ${version}`);
      return null;
    }
    
    this.log(`开始执行迁移脚本: ${script.name} (${script.version})`);
    
    // 创建迁移记录
    const newRecord: MigrationRecord = {
      id: this.generateId(),
      name: script.name,
      version: script.version,
      status: MigrationStatus.RUNNING,
      startedAt: new Date()
    };
    this.migrationRecords.push(newRecord);
    
    try {
      // 执行迁移
      const startTime = Date.now();
      const result = await script.up();
      const endTime = Date.now();
      result.duration = endTime - startTime;
      
      // 更新迁移记录
      newRecord.status = MigrationStatus.SUCCESS;
      newRecord.endedAt = new Date();
      newRecord.duration = endTime - startTime;
      newRecord.affectedCount = result.affectedCount;
      
      this.log(`迁移脚本执行成功: ${script.name} (${script.version}) - 影响数据数量: ${result.affectedCount}, 耗时: ${result.duration}ms`);
      return result;
    } catch (error) {
      // 更新迁移记录
      newRecord.status = MigrationStatus.FAILED;
      newRecord.endedAt = new Date();
      newRecord.error = error instanceof Error ? error.message : String(error);
      
      this.log(`迁移脚本执行失败: ${script.name} (${script.version}) - 错误: ${newRecord.error}`);
      
      return {
        success: false,
        message: `迁移脚本执行失败: ${script.name}`,
        affectedCount: 0,
        duration: 0,
        error: error instanceof Error ? error : new Error(String(error)),
        logs: [`错误: ${newRecord.error}`]
      };
    }
  }

  /**
   * 生成唯一ID
   */
  private generateId(): string {
    return `mig_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 记录日志
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}`;
    this.migrationLog.push(logMessage);
    console.log(logMessage);
  }
}

// 导出单例实例
export const migrationManager = new MigrationManager();

// 导出迁移管理器类型
export type { MigrationManager };
