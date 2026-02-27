import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { promotionService, PromotionOrder, PromotionStats, PromotionTrendPoint, UserWorkForPromotion, PromotionCoupon, PromotionWallet, PromotedWork, PromotionSummary } from '@/services/promotionService';

export interface UsePromotionReturn {
  // 数据
  orders: PromotionOrder[];
  stats: PromotionStats;
  trendData: PromotionTrendPoint[];
  userWorks: UserWorkForPromotion[];
  coupons: PromotionCoupon[];
  wallet: PromotionWallet | null;
  promotedWorks: PromotedWork[];
  promotionSummary: PromotionSummary | null;

  // 状态
  loading: boolean;
  error: string | null;

  // 操作
  refresh: () => Promise<void>;
  createOrder: (orderData: Parameters<typeof promotionService.createOrder>[0]) => Promise<PromotionOrder | null>;
  payOrder: (orderId: string, couponId?: string) => Promise<boolean>;

  // 筛选后的订单
  getOrdersByStatus: (status: PromotionOrder['status']) => PromotionOrder[];
}

export function usePromotion(): UsePromotionReturn {
  const { user } = useAuth();
  const userId = user?.id;
  
  const [orders, setOrders] = useState<PromotionOrder[]>([]);
  const [stats, setStats] = useState<PromotionStats>({
    totalSpent: 0,
    totalOrders: 0,
    totalViews: 0,
    totalFans: 0,
    totalInteractions: 0,
    avgClickRate: 0,
    runningOrders: 0,
    completedOrders: 0,
  });
  const [trendData, setTrendData] = useState<PromotionTrendPoint[]>([]);
  const [userWorks, setUserWorks] = useState<UserWorkForPromotion[]>([]);
  const [coupons, setCoupons] = useState<PromotionCoupon[]>([]);
  const [wallet, setWallet] = useState<PromotionWallet | null>(null);
  const [promotedWorks, setPromotedWorks] = useState<PromotedWork[]>([]);
  const [promotionSummary, setPromotionSummary] = useState<PromotionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取所有数据
  const fetchAllData = useCallback(async () => {
    if (!userId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [
        ordersData,
        statsData,
        trendDataResult,
        worksData,
        couponsData,
        walletData,
        promotedWorksData,
        summaryData,
      ] = await Promise.all([
        promotionService.getUserOrders(userId),
        promotionService.getPromotionStats(userId),
        promotionService.getPromotionTrend(userId, 7),
        promotionService.getUserWorksForPromotion(userId),
        promotionService.getUserCoupons(userId),
        promotionService.getPromotionWallet(userId),
        promotionService.getUserPromotedWorks(userId),
        promotionService.getPromotionSummary(userId),
      ]);

      setOrders(ordersData);
      setStats(statsData);
      setTrendData(trendDataResult);
      setUserWorks(worksData);
      setCoupons(couponsData);
      setWallet(walletData);
      setPromotedWorks(promotedWorksData);
      setPromotionSummary(summaryData);
    } catch (err) {
      console.error('获取推广数据失败:', err);
      setError('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  // 初始加载
  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  // 刷新数据
  const refresh = useCallback(async () => {
    await fetchAllData();
  }, [fetchAllData]);

  // 创建订单
  const createOrder = useCallback(async (orderData: Omit<Parameters<typeof promotionService.createOrder>[0], 'userId'>) => {
    if (!userId) {
      console.error('用户未登录');
      return null;
    }
    const result = await promotionService.createOrder({ ...orderData, userId });
    if (result) {
      await refresh();
    }
    return result;
  }, [refresh, userId]);

  // 支付订单
  const payOrder = useCallback(async (orderId: string, couponId?: string) => {
    const result = await promotionService.payOrder(orderId, couponId);
    if (result) {
      await refresh();
    }
    return result;
  }, [refresh]);

  // 根据状态获取订单
  const getOrdersByStatus = useCallback((status: PromotionOrder['status']) => {
    return orders.filter(order => order.status === status);
  }, [orders]);

  return {
    orders,
    stats,
    trendData,
    userWorks,
    coupons,
    wallet,
    promotedWorks,
    promotionSummary,
    loading,
    error,
    refresh,
    createOrder,
    payOrder,
    getOrdersByStatus,
  };
}

export default usePromotion;
