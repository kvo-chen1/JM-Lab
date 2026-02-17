/**
 * 会员中心 Hook
 * 提供会员信息、权益、积分、订单等数据的获取和管理
 * 实现数据缓存和实时同步
 */

import { useState, useEffect, useCallback, useRef, useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';
import membershipService, {
  MembershipLevel,
  MembershipLevelConfig,
  MembershipInfo,
  UsageStats,
  MembershipOrder,
  PointsRecord,
  MembershipCoupon,
  MembershipHistory,
} from '@/services/membershipService';
import eventBus from '@/lib/eventBus';

// ==================== 类型定义 ====================

interface UseMembershipReturn {
  // 数据
  membershipInfo: MembershipInfo | null;
  membershipLevels: MembershipLevelConfig[];
  currentLevelConfig: MembershipLevelConfig | null;
  usageStats: UsageStats | null;
  orders: MembershipOrder[];
  ordersTotal: number;
  pointsRecords: PointsRecord[];
  pointsBalance: number;
  availableCoupons: MembershipCoupon[];
  membershipHistory: MembershipHistory[];
  growthProgress: {
    currentPoints: number;
    currentLevel: MembershipLevel;
    nextLevel: MembershipLevel | null;
    progress: number;
    requirements: string[];
  } | null;

  // 加载状态
  loading: {
    info: boolean;
    levels: boolean;
    usage: boolean;
    orders: boolean;
    points: boolean;
    coupons: boolean;
    history: boolean;
  };

  // 错误状态
  error: {
    info: Error | null;
    levels: Error | null;
    usage: Error | null;
    orders: Error | null;
    points: Error | null;
    coupons: Error | null;
    history: Error | null;
  };

  // 操作方法
  refreshMembershipInfo: () => Promise<void>;
  refreshUsageStats: () => Promise<void>;
  refreshOrders: (page?: number, limit?: number) => Promise<void>;
  refreshPointsRecords: (page?: number, limit?: number) => Promise<void>;
  refreshAvailableCoupons: () => Promise<void>;
  refreshMembershipHistory: () => Promise<void>;
  refreshGrowthProgress: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // 订单操作
  createOrder: (
    plan: MembershipLevel,
    period: 'monthly' | 'quarterly' | 'yearly',
    couponCode?: string
  ) => Promise<{ success: boolean; order?: MembershipOrder; error?: string }>;

  // 积分操作
  addPoints: (points: number, source: string, description: string) => Promise<boolean>;
  spendPoints: (points: number, source: string, description: string) => Promise<{ success: boolean; error?: string }>;

  // 工具方法
  checkBenefitAccess: (benefitId: string) => Promise<{ allowed: boolean; reason?: string }>;
  validateCoupon: (code: string, plan: MembershipLevel) => Promise<{
    valid: boolean;
    discount?: { amount: number; finalAmount: number };
    error?: string;
  }>;
  getExpiryReminder: () => Promise<{
    needsReminder: boolean;
    daysUntilExpiry: number;
    message: string;
  }>;

  // 缓存控制
  clearCache: () => void;
}

// ==================== Hook实现 ====================

export function useMembership(): UseMembershipReturn {
  const { user } = useContext(AuthContext);
  const userId = user?.id || null;

  // 数据状态
  const [membershipInfo, setMembershipInfo] = useState<MembershipInfo | null>(null);
  const [membershipLevels, setMembershipLevels] = useState<MembershipLevelConfig[]>([]);
  const [usageStats, setUsageStats] = useState<UsageStats | null>(null);
  const [orders, setOrders] = useState<MembershipOrder[]>([]);
  const [ordersTotal, setOrdersTotal] = useState(0);
  const [pointsRecords, setPointsRecords] = useState<PointsRecord[]>([]);
  const [pointsBalance, setPointsBalance] = useState(0);
  const [availableCoupons, setAvailableCoupons] = useState<MembershipCoupon[]>([]);
  const [membershipHistory, setMembershipHistory] = useState<MembershipHistory[]>([]);
  const [growthProgress, setGrowthProgress] = useState<UseMembershipReturn['growthProgress']>(null);

  // 加载状态
  const [loading, setLoading] = useState({
    info: false,
    levels: false,
    usage: false,
    orders: false,
    points: false,
    coupons: false,
    history: false,
  });

  // 错误状态
  const [error, setError] = useState({
    info: null as Error | null,
    levels: null as Error | null,
    usage: null as Error | null,
    orders: null as Error | null,
    points: null as Error | null,
    coupons: null as Error | null,
    history: null as Error | null,
  });

  // 用于防止重复请求的ref
  const fetchingRef = useRef<{
    info: boolean;
    levels: boolean;
    usage: boolean;
    orders: boolean;
    points: boolean;
    coupons: boolean;
    history: boolean;
  }>({
    info: false,
    levels: false,
    usage: false,
    orders: false,
    points: false,
    coupons: false,
    history: false,
  });

  // 计算当前等级配置
  const currentLevelConfig = membershipLevels.find(
    (level) => level.level === membershipInfo?.level
  ) || null;

  // ==================== 数据获取方法 ====================

  const refreshMembershipInfo = useCallback(async () => {
    if (!userId || fetchingRef.current.info) return;

    fetchingRef.current.info = true;
    setLoading((prev) => ({ ...prev, info: true }));
    setError((prev) => ({ ...prev, info: null }));

    try {
      const info = await membershipService.getMembershipInfo(userId);
      setMembershipInfo(info);
    } catch (err) {
      setError((prev) => ({ ...prev, info: err as Error }));
    } finally {
      setLoading((prev) => ({ ...prev, info: false }));
      fetchingRef.current.info = false;
    }
  }, [userId]);

  const refreshMembershipLevels = useCallback(async () => {
    if (fetchingRef.current.levels) return;

    fetchingRef.current.levels = true;
    setLoading((prev) => ({ ...prev, levels: true }));
    setError((prev) => ({ ...prev, levels: null }));

    try {
      const levels = await membershipService.getMembershipLevels();
      setMembershipLevels(levels);
    } catch (err) {
      setError((prev) => ({ ...prev, levels: err as Error }));
    } finally {
      setLoading((prev) => ({ ...prev, levels: false }));
      fetchingRef.current.levels = false;
    }
  }, []);

  const refreshUsageStats = useCallback(async () => {
    if (!userId || fetchingRef.current.usage) return;

    fetchingRef.current.usage = true;
    setLoading((prev) => ({ ...prev, usage: true }));
    setError((prev) => ({ ...prev, usage: null }));

    try {
      const stats = await membershipService.getUsageStats(userId);
      setUsageStats(stats);
    } catch (err) {
      setError((prev) => ({ ...prev, usage: err as Error }));
    } finally {
      setLoading((prev) => ({ ...prev, usage: false }));
      fetchingRef.current.usage = false;
    }
  }, [userId]);

  const refreshOrders = useCallback(async (page = 1, limit = 10) => {
    if (!userId || fetchingRef.current.orders) return;

    fetchingRef.current.orders = true;
    setLoading((prev) => ({ ...prev, orders: true }));
    setError((prev) => ({ ...prev, orders: null }));

    try {
      const { orders, total } = await membershipService.getOrders(userId, { page, limit });
      setOrders(orders);
      setOrdersTotal(total);
    } catch (err) {
      setError((prev) => ({ ...prev, orders: err as Error }));
    } finally {
      setLoading((prev) => ({ ...prev, orders: false }));
      fetchingRef.current.orders = false;
    }
  }, [userId]);

  const refreshPointsRecords = useCallback(async (page = 1, limit = 20) => {
    if (!userId || fetchingRef.current.points) return;

    fetchingRef.current.points = true;
    setLoading((prev) => ({ ...prev, points: true }));
    setError((prev) => ({ ...prev, points: null }));

    try {
      const { records, balance } = await membershipService.getPointsRecords(userId, { page, limit });
      setPointsRecords(records);
      setPointsBalance(balance);
    } catch (err) {
      setError((prev) => ({ ...prev, points: err as Error }));
    } finally {
      setLoading((prev) => ({ ...prev, points: false }));
      fetchingRef.current.points = false;
    }
  }, [userId]);

  const refreshAvailableCoupons = useCallback(async () => {
    if (!userId || fetchingRef.current.coupons) return;

    fetchingRef.current.coupons = true;
    setLoading((prev) => ({ ...prev, coupons: true }));
    setError((prev) => ({ ...prev, coupons: null }));

    try {
      const coupons = await membershipService.getAvailableCoupons(userId);
      setAvailableCoupons(coupons);
    } catch (err) {
      setError((prev) => ({ ...prev, coupons: err as Error }));
    } finally {
      setLoading((prev) => ({ ...prev, coupons: false }));
      fetchingRef.current.coupons = false;
    }
  }, [userId]);

  const refreshMembershipHistory = useCallback(async () => {
    if (!userId || fetchingRef.current.history) return;

    fetchingRef.current.history = true;
    setLoading((prev) => ({ ...prev, history: true }));
    setError((prev) => ({ ...prev, history: null }));

    try {
      const history = await membershipService.getMembershipHistory(userId);
      setMembershipHistory(history);
    } catch (err) {
      setError((prev) => ({ ...prev, history: err as Error }));
    } finally {
      setLoading((prev) => ({ ...prev, history: false }));
      fetchingRef.current.history = false;
    }
  }, [userId]);

  const refreshGrowthProgress = useCallback(async () => {
    if (!userId) return;

    try {
      const progress = await membershipService.getGrowthProgress(userId);
      setGrowthProgress(progress);
    } catch (err) {
      console.error('获取成长进度失败:', err);
    }
  }, [userId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshMembershipInfo(),
      refreshMembershipLevels(),
      refreshUsageStats(),
      refreshOrders(),
      refreshPointsRecords(),
      refreshAvailableCoupons(),
      refreshMembershipHistory(),
      refreshGrowthProgress(),
    ]);
  }, [
    refreshMembershipInfo,
    refreshMembershipLevels,
    refreshUsageStats,
    refreshOrders,
    refreshPointsRecords,
    refreshAvailableCoupons,
    refreshMembershipHistory,
    refreshGrowthProgress,
  ]);

  // ==================== 操作方法 ====================

  const createOrder = useCallback(
    async (plan: MembershipLevel, period: 'monthly' | 'quarterly' | 'yearly', couponCode?: string) => {
      if (!userId) return { success: false, error: '用户未登录' };

      const result = await membershipService.createOrder(userId, plan, period, couponCode);

      if (result.success) {
        // 刷新订单列表
        await refreshOrders();
      }

      return result;
    },
    [userId, refreshOrders]
  );

  const addPoints = useCallback(
    async (points: number, source: string, description: string) => {
      if (!userId) return false;

      const success = await membershipService.addPoints(userId, points, source, description);

      if (success) {
        // 刷新积分记录和会员信息
        await Promise.all([refreshPointsRecords(), refreshMembershipInfo(), refreshGrowthProgress()]);
      }

      return success;
    },
    [userId, refreshPointsRecords, refreshMembershipInfo, refreshGrowthProgress]
  );

  const spendPoints = useCallback(
    async (points: number, source: string, description: string) => {
      if (!userId) return { success: false, error: '用户未登录' };

      const result = await membershipService.spendPoints(userId, points, source, description);

      if (result.success) {
        // 刷新积分记录和会员信息
        await Promise.all([refreshPointsRecords(), refreshMembershipInfo(), refreshGrowthProgress()]);
      }

      return result;
    },
    [userId, refreshPointsRecords, refreshMembershipInfo, refreshGrowthProgress]
  );

  const checkBenefitAccess = useCallback(
    async (benefitId: string) => {
      if (!userId) return { allowed: false, reason: '用户未登录' };
      return membershipService.checkBenefitAccess(userId, benefitId);
    },
    [userId]
  );

  const validateCoupon = useCallback(
    async (code: string, plan: MembershipLevel) => {
      return membershipService.validateCoupon(code, plan);
    },
    []
  );

  const getExpiryReminder = useCallback(async () => {
    if (!userId) {
      return { needsReminder: false, daysUntilExpiry: 0, message: '' };
    }
    return membershipService.getExpiryReminder(userId);
  }, [userId]);

  const clearCache = useCallback(() => {
    membershipService.clearCache();
  }, []);

  // ==================== 副作用 ====================

  // 初始加载
  useEffect(() => {
    if (userId) {
      refreshAll();
    }
  }, [userId, refreshAll]);

  // 监听数据变化事件
  useEffect(() => {
    const handleDataChange = (data: any) => {
      switch (data.type) {
        case 'info':
          refreshMembershipInfo();
          break;
        case 'usage':
          refreshUsageStats();
          break;
        case 'orders':
          refreshOrders();
          break;
        case 'points':
          refreshPointsRecords();
          break;
      }
    };

    const listenerId = eventBus.subscribe('membership:dataChanged', handleDataChange);

    return () => {
      // 清理订阅
      eventBus.unsubscribe('membership:dataChanged', listenerId);
    };
  }, [refreshMembershipInfo, refreshUsageStats, refreshOrders, refreshPointsRecords]);

  // 定时刷新使用统计（每30秒）
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      refreshUsageStats();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, refreshUsageStats]);

  return {
    // 数据
    membershipInfo,
    membershipLevels,
    currentLevelConfig,
    usageStats,
    orders,
    ordersTotal,
    pointsRecords,
    pointsBalance,
    availableCoupons,
    membershipHistory,
    growthProgress,

    // 加载状态
    loading,

    // 错误状态
    error,

    // 操作方法
    refreshMembershipInfo,
    refreshUsageStats,
    refreshOrders,
    refreshPointsRecords,
    refreshAvailableCoupons,
    refreshMembershipHistory,
    refreshGrowthProgress,
    refreshAll,

    // 订单操作
    createOrder,

    // 积分操作
    addPoints,
    spendPoints,

    // 工具方法
    checkBenefitAccess,
    validateCoupon,
    getExpiryReminder,

    // 缓存控制
    clearCache,
  };
}

export default useMembership;
