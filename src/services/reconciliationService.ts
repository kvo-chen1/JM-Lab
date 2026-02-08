/**
 * 积分对账服务 - 提供积分数据校验、对账和异常处理功能
 */

import pointsService, { PointsChange } from './pointsService';

// 对账记录类型
export interface ReconciliationRecord {
  id: string;
  date: string; // 对账日期
  userId: string;
  expectedBalance: number; // 预期余额
  actualBalance: number; // 实际余额
  difference: number; // 差异
  status: 'pending' | 'matched' | 'mismatch' | 'resolved';
  details: {
    totalEarned: number;
    totalSpent: number;
    recordCount: number;
  };
  issues: ReconciliationIssue[];
  createdAt: number;
  resolvedAt?: number;
  resolution?: string;
}

// 对账问题类型
export interface ReconciliationIssue {
  type: 'missing_record' | 'duplicate_record' | 'amount_mismatch' | 'balance_error';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  recordId?: string;
  expectedValue?: number;
  actualValue?: number;
}

// 对账配置
const RECONCILIATION_CONFIG = {
  // 自动对账时间（每天凌晨）
  autoReconcileHour: 2,
  // 差异阈值（超过此值视为异常）
  differenceThreshold: 1,
  // 保留对账记录天数
  retentionDays: 90,
  // 最大问题数量
  maxIssues: 100
};

// 对账服务类
class ReconciliationService {
  private reconciliationRecords: ReconciliationRecord[] = [];
  private readonly RECORDS_KEY = 'RECONCILIATION_RECORDS';
  private readonly LAST_RECONCILE_KEY = 'LAST_RECONCILIATION';

  constructor() {
    this.loadRecords();
    this.scheduleAutoReconciliation();
  }

  /**
   * 从本地存储加载对账记录
   */
  private loadRecords() {
    try {
      const stored = localStorage.getItem(this.RECORDS_KEY);
      if (stored) {
        this.reconciliationRecords = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load reconciliation records:', error);
      this.reconciliationRecords = [];
    }
  }

  /**
   * 保存对账记录到本地存储
   */
  private saveRecords() {
    try {
      localStorage.setItem(this.RECORDS_KEY, JSON.stringify(this.reconciliationRecords));
    } catch (error) {
      console.error('Failed to save reconciliation records:', error);
    }
  }

  /**
   * 执行对账
   */
  reconcile(userId: string): ReconciliationRecord {
    const today = new Date().toISOString().split('T')[0];
    
    // 获取所有积分记录
    const allRecords = pointsService.getPointsRecords(undefined, 1000);
    
    // 计算预期余额
    const expectedBalance = allRecords.reduce((sum, record) => sum + record.points, 0);
    
    // 获取实际余额
    const actualBalance = pointsService.getCurrentPoints();
    
    // 计算差异
    const difference = actualBalance - expectedBalance;
    
    // 计算统计
    const totalEarned = allRecords
      .filter(r => r.points > 0)
      .reduce((sum, r) => sum + r.points, 0);
    
    const totalSpent = Math.abs(allRecords
      .filter(r => r.points < 0)
      .reduce((sum, r) => sum + r.points, 0));

    // 检查问题
    const issues = this.checkIssues(allRecords, expectedBalance, actualBalance);

    // 确定状态
    const status = Math.abs(difference) <= RECONCILIATION_CONFIG.differenceThreshold && issues.length === 0
      ? 'matched'
      : 'mismatch';

    // 创建对账记录
    const record: ReconciliationRecord = {
      id: `recon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      date: today,
      userId,
      expectedBalance,
      actualBalance,
      difference,
      status,
      details: {
        totalEarned,
        totalSpent,
        recordCount: allRecords.length
      },
      issues,
      createdAt: Date.now()
    };

    // 保存对账记录
    this.reconciliationRecords.push(record);
    
    // 清理旧记录
    this.cleanupOldRecords();
    
    this.saveRecords();

    // 保存最后对账时间
    localStorage.setItem(this.LAST_RECONCILE_KEY, Date.now().toString());

    return record;
  }

  /**
   * 检查对账问题
   */
  private checkIssues(
    records: PointsChange[],
    expectedBalance: number,
    actualBalance: number
  ): ReconciliationIssue[] {
    const issues: ReconciliationIssue[] = [];

    // 检查余额差异
    if (Math.abs(actualBalance - expectedBalance) > RECONCILIATION_CONFIG.differenceThreshold) {
      issues.push({
        type: 'balance_error',
        severity: 'high',
        description: `余额不匹配：预期 ${expectedBalance}，实际 ${actualBalance}，差异 ${actualBalance - expectedBalance}`,
        expectedValue: expectedBalance,
        actualValue: actualBalance
      });
    }

    // 检查重复记录
    const recordIds = new Map<string, number>();
    records.forEach(record => {
      const count = recordIds.get(record.id.toString()) || 0;
      recordIds.set(record.id.toString(), count + 1);
    });

    recordIds.forEach((count, id) => {
      if (count > 1) {
        issues.push({
          type: 'duplicate_record',
          severity: 'medium',
          description: `发现重复记录 ID: ${id}，出现 ${count} 次`,
          recordId: id
        });
      }
    });

    // 检查记录连续性
    let lastBalance = 0;
    records.forEach((record, index) => {
      const expectedBalance = lastBalance + record.points;
      if (index > 0 && record.balanceAfter !== expectedBalance) {
        issues.push({
          type: 'amount_mismatch',
          severity: 'high',
          description: `记录 ${record.id} 余额不匹配：预期 ${expectedBalance}，记录 ${record.balanceAfter}`,
          recordId: record.id.toString(),
          expectedValue: expectedBalance,
          actualValue: record.balanceAfter
        });
      }
      lastBalance = record.balanceAfter;
    });

    return issues.slice(0, RECONCILIATION_CONFIG.maxIssues);
  }

  /**
   * 清理旧的对账记录
   */
  private cleanupOldRecords() {
    const cutoffDate = Date.now() - (RECONCILIATION_CONFIG.retentionDays * 24 * 60 * 60 * 1000);
    this.reconciliationRecords = this.reconciliationRecords.filter(
      record => record.createdAt > cutoffDate
    );
  }

  /**
   * 获取对账记录
   */
  getReconciliationRecords(userId: string, limit: number = 30): ReconciliationRecord[] {
    return this.reconciliationRecords
      .filter(record => record.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  /**
   * 获取最新的对账记录
   */
  getLatestReconciliation(userId: string): ReconciliationRecord | null {
    const records = this.getReconciliationRecords(userId, 1);
    return records.length > 0 ? records[0] : null;
  }

  /**
   * 解决对账问题
   */
  resolveIssue(recordId: string, resolution: string): ReconciliationRecord | null {
    const record = this.reconciliationRecords.find(r => r.id === recordId);
    if (!record) return null;

    record.status = 'resolved';
    record.resolvedAt = Date.now();
    record.resolution = resolution;

    this.saveRecords();
    return record;
  }

  /**
   * 修复余额（强制同步）
   */
  fixBalance(userId: string): {
    success: boolean;
    message: string;
    oldBalance: number;
    newBalance: number;
  } {
    const allRecords = pointsService.getPointsRecords(undefined, 1000);
    const correctBalance = allRecords.reduce((sum, record) => sum + record.points, 0);
    const currentBalance = pointsService.getCurrentPoints();

    if (correctBalance === currentBalance) {
      return {
        success: true,
        message: '余额正确，无需修复',
        oldBalance: currentBalance,
        newBalance: currentBalance
      };
    }

    // 创建调整记录
    const difference = correctBalance - currentBalance;
    pointsService.addPoints(
      difference,
      '余额修正',
      'system',
      `系统对账修正，调整 ${difference > 0 ? '增加' : '减少'} ${Math.abs(difference)} 积分`
    );

    return {
      success: true,
      message: `余额已修复：${currentBalance} → ${correctBalance}`,
      oldBalance: currentBalance,
      newBalance: correctBalance
    };
  }

  /**
   * 获取对账统计
   */
  getReconciliationStats(userId: string): {
    totalReconciliations: number;
    matchedCount: number;
    mismatchCount: number;
    resolvedCount: number;
    lastReconciliationDate: string | null;
    averageDifference: number;
  } {
    const userRecords = this.reconciliationRecords.filter(r => r.userId === userId);
    
    const matchedCount = userRecords.filter(r => r.status === 'matched').length;
    const mismatchCount = userRecords.filter(r => r.status === 'mismatch').length;
    const resolvedCount = userRecords.filter(r => r.status === 'resolved').length;
    
    const totalDifference = userRecords.reduce((sum, r) => sum + Math.abs(r.difference), 0);

    return {
      totalReconciliations: userRecords.length,
      matchedCount,
      mismatchCount,
      resolvedCount,
      lastReconciliationDate: userRecords.length > 0 
        ? new Date(userRecords[0].createdAt).toISOString()
        : null,
      averageDifference: userRecords.length > 0 ? totalDifference / userRecords.length : 0
    };
  }

  /**
   * 检查是否需要对账
   */
  needsReconciliation(): boolean {
    const lastReconcile = localStorage.getItem(this.LAST_RECONCILE_KEY);
    if (!lastReconcile) return true;

    const lastDate = new Date(parseInt(lastReconcile));
    const today = new Date();
    
    return lastDate.toISOString().split('T')[0] !== today.toISOString().split('T')[0];
  }

  /**
   * 安排自动对账
   */
  private scheduleAutoReconciliation() {
    // 每小时检查一次是否需要对账
    setInterval(() => {
      const now = new Date();
      if (now.getHours() === RECONCILIATION_CONFIG.autoReconcileHour && this.needsReconciliation()) {
        console.log('执行自动对账...');
        this.reconcile('current-user');
      }
    }, 60 * 60 * 1000); // 每小时检查一次
  }

  /**
   * 导出对账报告
   */
  exportReport(userId: string): string {
    const records = this.getReconciliationRecords(userId, 30);
    const stats = this.getReconciliationStats(userId);

    const report = {
      generatedAt: new Date().toISOString(),
      userId,
      summary: stats,
      records: records.map(r => ({
        date: r.date,
        status: r.status,
        expectedBalance: r.expectedBalance,
        actualBalance: r.actualBalance,
        difference: r.difference,
        issues: r.issues
      }))
    };

    return JSON.stringify(report, null, 2);
  }

  /**
   * 验证积分记录完整性
   */
  validateRecords(userId: string): {
    valid: boolean;
    issues: ReconciliationIssue[];
  } {
    const records = pointsService.getPointsRecords(undefined, 1000);
    const expectedBalance = records.reduce((sum, r) => sum + r.points, 0);
    const actualBalance = pointsService.getCurrentPoints();

    const issues = this.checkIssues(records, expectedBalance, actualBalance);

    return {
      valid: issues.length === 0 && Math.abs(expectedBalance - actualBalance) <= RECONCILIATION_CONFIG.differenceThreshold,
      issues
    };
  }

  /**
   * 重置服务（用于测试）
   */
  reset(): void {
    this.reconciliationRecords = [];
    localStorage.removeItem(this.RECORDS_KEY);
    localStorage.removeItem(this.LAST_RECONCILE_KEY);
  }

  /**
   * 获取对账配置
   */
  getConfig(): typeof RECONCILIATION_CONFIG {
    return { ...RECONCILIATION_CONFIG };
  }
}

// 导出单例实例
const service = new ReconciliationService();
export default service;
