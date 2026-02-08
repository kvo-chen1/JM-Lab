/**
 * 积分全局状态管理 - 提供跨组件的积分状态共享
 */

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import pointsService, { PointsRecord, PointsSource } from '@/services/pointsService';
import { toast } from 'sonner';

// 积分变动类型
interface PointsChangeEvent {
  type: 'earned' | 'spent';
  source: string;
  points: number;
  newBalance: number;
  description?: string;
}

// 积分统计类型
interface PointsStats {
  totalEarned: number;
  totalSpent: number;
  currentBalance: number;
  sourceStats: Record<PointsSource, number>;
}

// Context 类型定义
interface PointsContextType {
  // 当前积分
  currentPoints: number;
  // 积分记录
  records: PointsRecord[];
  // 积分统计
  stats: PointsStats;
  // 是否加载中
  isLoading: boolean;
  // 刷新积分数据
  refreshPoints: () => void;
  // 添加积分
  addPoints: (points: number, source: string, type: PointsSource, description: string) => void;
  // 消耗积分
  consumePoints: (points: number, source: string, type: PointsSource, description: string) => void;
  // 获取积分记录
  getRecords: (limit?: number) => PointsRecord[];
  // 最近变动
  recentChanges: PointsChangeEvent[];
}

// 创建 Context
const PointsContext = createContext<PointsContextType | undefined>(undefined);

// Provider 组件
export const PointsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentPoints, setCurrentPoints] = useState(0);
  const [records, setRecords] = useState<PointsRecord[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [recentChanges, setRecentChanges] = useState<PointsChangeEvent[]>([]);

  // 加载积分数据
  const loadPointsData = useCallback(() => {
    setIsLoading(true);
    try {
      const points = pointsService.getCurrentPoints();
      const recentRecords = pointsService.getRecentPointsRecords(10);
      setCurrentPoints(points);
      setRecords(recentRecords);
    } catch (error) {
      console.error('加载积分数据失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 初始加载
  useEffect(() => {
    loadPointsData();
  }, [loadPointsData]);

  // 监听积分更新事件
  useEffect(() => {
    const handlePointsUpdate = (event: CustomEvent<PointsChangeEvent>) => {
      const detail = event.detail;
      
      // 更新当前积分
      setCurrentPoints(detail.newBalance);
      
      // 添加到最近变动
      setRecentChanges(prev => [detail, ...prev].slice(0, 5));
      
      // 刷新记录
      const recentRecords = pointsService.getRecentPointsRecords(10);
      setRecords(recentRecords);
    };

    window.addEventListener('pointsUpdated', handlePointsUpdate as EventListener);
    return () => window.removeEventListener('pointsUpdated', handlePointsUpdate as EventListener);
  }, []);

  // 刷新积分
  const refreshPoints = useCallback(() => {
    loadPointsData();
  }, [loadPointsData]);

  // 添加积分
  const addPoints = useCallback((
    points: number,
    source: string,
    type: PointsSource,
    description: string
  ) => {
    try {
      const record = pointsService.addPoints(points, source, type, description);
      setCurrentPoints(record.balanceAfter);
      
      // 刷新记录
      const recentRecords = pointsService.getRecentPointsRecords(10);
      setRecords(recentRecords);

      // 触发事件
      window.dispatchEvent(new CustomEvent('pointsUpdated', {
        detail: {
          type: 'earned',
          source,
          points,
          newBalance: record.balanceAfter,
          description
        }
      }));

      toast.success(`获得 ${points} 积分！`);
    } catch (error: any) {
      toast.error(error.message || '添加积分失败');
    }
  }, []);

  // 消耗积分
  const consumePoints = useCallback((
    points: number,
    source: string,
    type: PointsSource,
    description: string
  ) => {
    try {
      const record = pointsService.consumePoints(points, source, type, description);
      setCurrentPoints(record.balanceAfter);
      
      // 刷新记录
      const recentRecords = pointsService.getRecentPointsRecords(10);
      setRecords(recentRecords);

      // 触发事件
      window.dispatchEvent(new CustomEvent('pointsUpdated', {
        detail: {
          type: 'spent',
          source,
          points,
          newBalance: record.balanceAfter,
          description
        }
      }));

      toast.success(`消耗 ${points} 积分`);
    } catch (error: any) {
      toast.error(error.message || '消耗积分失败');
    }
  }, []);

  // 获取积分记录
  const getRecords = useCallback((limit: number = 20) => {
    return pointsService.getPointsRecords(undefined, limit);
  }, []);

  // 计算统计
  const stats: PointsStats = {
    totalEarned: records.filter(r => r.points > 0).reduce((sum, r) => sum + r.points, 0),
    totalSpent: Math.abs(records.filter(r => r.points < 0).reduce((sum, r) => sum + r.points, 0)),
    currentBalance: currentPoints,
    sourceStats: pointsService.getPointsSourceStats()
  };

  return (
    <PointsContext.Provider
      value={{
        currentPoints,
        records,
        stats,
        isLoading,
        refreshPoints,
        addPoints,
        consumePoints,
        getRecords,
        recentChanges
      }}
    >
      {children}
    </PointsContext.Provider>
  );
};

// 自定义 Hook
export const usePoints = (): PointsContextType => {
  const context = useContext(PointsContext);
  if (context === undefined) {
    throw new Error('usePoints must be used within a PointsProvider');
  }
  return context;
};

export default PointsContext;
