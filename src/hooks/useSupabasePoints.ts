/**
 * Supabase 积分 Hook - 用于管理积分状态和实时更新
 * 支持实时记录每个用户的积分情况，真实反应且持久性保存
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import supabasePointsService, {
  UserPointsBalance,
  PointsRecord,
  PointsStats,
  CheckinRecord,
  TaskRecord,
  ExchangeRecord,
  InviteRecord,
  ConsumptionRecord
} from '@/services/supabasePointsService';
import { toast } from 'sonner';

// Hook 返回类型
interface UseSupabasePointsReturn {
  // 状态
  balance: UserPointsBalance | null;
  records: PointsRecord[];
  stats: PointsStats | null;
  isLoading: boolean;
  error: string | null;

  // 签到相关
  todayCheckin: CheckinRecord | null;
  hasCheckinToday: boolean;
  checkinRecords: CheckinRecord[];

  // 任务相关
  taskRecords: TaskRecord[];

  // 兑换相关
  exchangeRecords: ExchangeRecord[];

  // 邀请相关
  inviteStats: {
    totalInvites: number;
    registeredCount: number;
    completedCount: number;
    totalPoints: number;
  };

  // 方法
  refreshBalance: () => Promise<void>;
  refreshRecords: (limit?: number) => Promise<void>;
  refreshStats: () => Promise<void>;
  addPoints: (
    points: number,
    source: string,
    sourceType: PointsRecord['source_type'],
    description: string,
    metadata?: Record<string, any>
  ) => Promise<boolean>;
  consumePoints: (
    points: number,
    source: string,
    sourceType: PointsRecord['source_type'],
    description: string,
    metadata?: Record<string, any>
  ) => Promise<boolean>;
  checkin: () => Promise<{ success: boolean; points?: number; consecutiveDays?: number }>;
  exchangeProduct: (
    productId: string,
    productName: string,
    productCategory: string,
    pointsCost: number
  ) => Promise<boolean>;

  // 实时订阅控制
  isSubscribed: boolean;
  toggleSubscription: () => void;
}

export function useSupabasePoints(): UseSupabasePointsReturn {
  const { user } = useAuth();
  const userId = user?.id;

  // 状态
  const [balance, setBalance] = useState<UserPointsBalance | null>(null);
  const [records, setRecords] = useState<PointsRecord[]>([]);
  const [stats, setStats] = useState<PointsStats | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(true);

  // 签到相关
  const [todayCheckin, setTodayCheckin] = useState<CheckinRecord | null>(null);
  const [hasCheckinToday, setHasCheckinToday] = useState(false);
  const [checkinRecords, setCheckinRecords] = useState<CheckinRecord[]>([]);

  // 任务相关
  const [taskRecords, setTaskRecords] = useState<TaskRecord[]>([]);

  // 兑换相关
  const [exchangeRecords, setExchangeRecords] = useState<ExchangeRecord[]>([]);

  // 邀请相关
  const [inviteStats, setInviteStats] = useState({
    totalInvites: 0,
    registeredCount: 0,
    completedCount: 0,
    totalPoints: 0
  });

  // 用于保存取消订阅函数
  const unsubscribeBalanceRef = useRef<(() => void) | null>(null);
  const unsubscribeRecordsRef = useRef<(() => void) | null>(null);

  // ==================== 数据获取 ====================

  const refreshBalance = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await supabasePointsService.getUserBalance(userId);
      setBalance(data);
    } catch (err: any) {
      console.error('刷新积分余额失败:', err);
      setError(err.message);
    }
  }, [userId]);

  const refreshRecords = useCallback(async (limit: number = 20) => {
    if (!userId) return;
    try {
      const { records: data } = await supabasePointsService.getPointsRecords(userId, { limit });
      setRecords(data);
    } catch (err: any) {
      console.error('刷新积分记录失败:', err);
      setError(err.message);
    }
  }, [userId]);

  const refreshStats = useCallback(async () => {
    if (!userId) return;
    try {
      const data = await supabasePointsService.getUserPointsStats(userId);
      setStats(data);
    } catch (err: any) {
      console.error('刷新积分统计失败:', err);
      setError(err.message);
    }
  }, [userId]);

  const refreshCheckinStatus = useCallback(async () => {
    if (!userId) return;
    try {
      const { hasCheckin, record } = await supabasePointsService.getTodayCheckinStatus(userId);
      setHasCheckinToday(hasCheckin);
      setTodayCheckin(record || null);

      // 获取最近签到记录
      const checkins = await supabasePointsService.getUserCheckinRecords(userId, 30);
      setCheckinRecords(checkins);
    } catch (err: any) {
      console.error('刷新签到状态失败:', err);
    }
  }, [userId]);

  const refreshTaskRecords = useCallback(async () => {
    if (!userId) return;
    try {
      const tasks = await supabasePointsService.getUserTaskRecords(userId);
      setTaskRecords(tasks);
    } catch (err: any) {
      console.error('刷新任务记录失败:', err);
    }
  }, [userId]);

  const refreshExchangeRecords = useCallback(async () => {
    if (!userId) return;
    try {
      const exchanges = await supabasePointsService.getUserExchangeRecords(userId);
      setExchangeRecords(exchanges);
    } catch (err: any) {
      console.error('刷新兑换记录失败:', err);
    }
  }, [userId]);

  const refreshInviteStats = useCallback(async () => {
    if (!userId) return;
    try {
      const stats = await supabasePointsService.getUserInviteStats(userId);
      setInviteStats(stats);
    } catch (err: any) {
      console.error('刷新邀请统计失败:', err);
    }
  }, [userId]);

  // ==================== 初始化加载 ====================

  useEffect(() => {
    if (!userId) {
      setBalance(null);
      setRecords([]);
      setStats(null);
      return;
    }

    const loadInitialData = async () => {
      setIsLoading(true);
      setError(null);

      try {
        await Promise.all([
          refreshBalance(),
          refreshRecords(),
          refreshStats(),
          refreshCheckinStatus(),
          refreshTaskRecords(),
          refreshExchangeRecords(),
          refreshInviteStats()
        ]);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialData();
  }, [userId]);

  // ==================== 实时订阅 ====================

  useEffect(() => {
    if (!userId || !isSubscribed) {
      // 取消订阅
      unsubscribeBalanceRef.current?.();
      unsubscribeRecordsRef.current?.();
      return;
    }

    // 订阅余额变化
    unsubscribeBalanceRef.current = supabasePointsService.subscribeToBalanceChanges(
      userId,
      (newBalance) => {
        setBalance(newBalance);
        // 触发全局事件
        window.dispatchEvent(new CustomEvent('pointsUpdated', {
          detail: {
            newBalance: newBalance.balance,
            totalEarned: newBalance.total_earned,
            totalSpent: newBalance.total_spent
          }
        }));
      }
    );

    // 订阅积分记录变化
    unsubscribeRecordsRef.current = supabasePointsService.subscribeToPointsRecords(
      userId,
      (newRecord) => {
        setRecords((prev) => [newRecord, ...prev]);
        // 显示通知
        if (newRecord.points > 0) {
          toast.success(`获得 ${newRecord.points} 积分！`, {
            description: newRecord.description
          });
        }
      }
    );

    return () => {
      unsubscribeBalanceRef.current?.();
      unsubscribeRecordsRef.current?.();
    };
  }, [userId, isSubscribed]);

  // ==================== 操作方法 ====================

  const addPoints = useCallback(async (
    points: number,
    source: string,
    sourceType: PointsRecord['source_type'],
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> => {
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await supabasePointsService.addPoints(
        userId,
        points,
        source,
        sourceType,
        description,
        metadata
      );

      if (result.success) {
        toast.success(`成功获得 ${points} 积分！`);
        await refreshBalance();
        await refreshRecords();
        await refreshStats();
        return true;
      } else {
        toast.error(result.error || '添加积分失败');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || '添加积分失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, refreshBalance, refreshRecords, refreshStats]);

  const consumePoints = useCallback(async (
    points: number,
    source: string,
    sourceType: PointsRecord['source_type'],
    description: string,
    metadata: Record<string, any> = {}
  ): Promise<boolean> => {
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    setIsLoading(true);
    try {
      const result = await supabasePointsService.consumePoints(
        userId,
        points,
        source,
        sourceType,
        description,
        metadata
      );

      if (result.success) {
        toast.success(`消耗 ${points} 积分`);
        await refreshBalance();
        await refreshRecords();
        await refreshStats();
        return true;
      } else {
        toast.error(result.error || '消耗积分失败');
        return false;
      }
    } catch (err: any) {
      toast.error(err.message || '消耗积分失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, refreshBalance, refreshRecords, refreshStats]);

  const checkin = useCallback(async (): Promise<{ success: boolean; points?: number; consecutiveDays?: number }> => {
    if (!userId) {
      toast.error('请先登录');
      return { success: false };
    }

    if (hasCheckinToday) {
      toast.info('今日已签到');
      return { success: false };
    }

    setIsLoading(true);
    try {
      // 计算连续签到天数
      const consecutiveDays = checkinRecords.length > 0
        ? checkinRecords[0].consecutive_days + 1
        : 1;

      // 计算签到积分
      let pointsEarned = 5; // 基础积分
      let bonusPoints = 0;

      // 连续签到奖励
      if (consecutiveDays === 3) bonusPoints = 10;
      else if (consecutiveDays === 7) bonusPoints = 30;
      else if (consecutiveDays === 30) bonusPoints = 100;

      const totalPoints = pointsEarned + bonusPoints;

      // 创建签到记录
      const checkinRecord = await supabasePointsService.createCheckinRecord({
        user_id: userId,
        checkin_date: new Date().toISOString().split('T')[0],
        consecutive_days: consecutiveDays,
        points_earned: totalPoints,
        is_bonus: bonusPoints > 0,
        bonus_points: bonusPoints,
        is_retroactive: false
      });

      if (!checkinRecord) {
        throw new Error('创建签到记录失败');
      }

      // 添加积分
      const result = await supabasePointsService.addPoints(
        userId,
        totalPoints,
        '每日签到',
        'daily',
        bonusPoints > 0
          ? `连续签到 ${consecutiveDays} 天，获得 ${totalPoints} 积分（含 ${bonusPoints} 额外奖励）`
          : `每日签到获得 ${totalPoints} 积分`
      );

      if (result.success) {
        toast.success(
          bonusPoints > 0
            ? `🎉 连续签到 ${consecutiveDays} 天！获得 ${totalPoints} 积分`
            : `✅ 签到成功！获得 ${totalPoints} 积分`
        );
        await refreshCheckinStatus();
        await refreshBalance();
        return { success: true, points: totalPoints, consecutiveDays };
      } else {
        throw new Error(result.error || '添加积分失败');
      }
    } catch (err: any) {
      toast.error(err.message || '签到失败');
      return { success: false };
    } finally {
      setIsLoading(false);
    }
  }, [userId, hasCheckinToday, checkinRecords, refreshCheckinStatus, refreshBalance]);

  const exchangeProduct = useCallback(async (
    productId: string,
    productName: string,
    productCategory: string,
    pointsCost: number
  ): Promise<boolean> => {
    if (!userId) {
      toast.error('请先登录');
      return false;
    }

    // 检查余额
    if (!balance || balance.balance < pointsCost) {
      toast.error('积分余额不足');
      return false;
    }

    setIsLoading(true);
    try {
      // 先消耗积分
      const consumeResult = await supabasePointsService.consumePoints(
        userId,
        pointsCost,
        productName,
        'exchange',
        `兑换商品：${productName}`
      );

      if (!consumeResult.success) {
        throw new Error(consumeResult.error || '积分扣除失败');
      }

      // 创建兑换记录
      const exchangeRecord = await supabasePointsService.createExchangeRecord({
        user_id: userId,
        product_id: productId,
        product_name: productName,
        product_category: productCategory,
        points_cost: pointsCost,
        quantity: 1,
        status: 'pending'
      });

      if (!exchangeRecord) {
        throw new Error('创建兑换记录失败');
      }

      toast.success(`成功兑换 ${productName}！`);
      await refreshExchangeRecords();
      await refreshBalance();
      return true;
    } catch (err: any) {
      toast.error(err.message || '兑换失败');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId, balance, refreshExchangeRecords, refreshBalance]);

  const toggleSubscription = useCallback(() => {
    setIsSubscribed((prev) => !prev);
  }, []);

  return {
    // 状态
    balance,
    records,
    stats,
    isLoading,
    error,

    // 签到相关
    todayCheckin,
    hasCheckinToday,
    checkinRecords,

    // 任务相关
    taskRecords,

    // 兑换相关
    exchangeRecords,

    // 邀请相关
    inviteStats,

    // 方法
    refreshBalance,
    refreshRecords,
    refreshStats,
    addPoints,
    consumePoints,
    checkin,
    exchangeProduct,

    // 实时订阅控制
    isSubscribed,
    toggleSubscription
  };
}

export default useSupabasePoints;
