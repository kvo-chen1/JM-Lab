/**
 * 津币 Hook
 * 提供津币余额、记录、消费等功能的React Hook封装
 */

import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { AuthContext } from '@/contexts/authContext';
import jinbiService, {
  JinbiBalance,
  JinbiRecord,
  JinbiConsumptionDetail,
  JinbiPackage,
  ServicePricing,
  JinbiRecordType,
  ConsumeResult,
  SERVICE_TYPES,
} from '@/services/jinbiService';
import eventBus from '@/lib/eventBus';

// ==================== 类型定义 ====================

interface UseJinbiReturn {
  // 数据
  balance: JinbiBalance | null;
  records: JinbiRecord[];
  consumptionDetails: JinbiConsumptionDetail[];
  packages: JinbiPackage[];
  pricing: ServicePricing[];
  monthlyStats: {
    earned: number;
    spent: number;
    netChange: number;
  };

  // 加载状态
  loading: {
    balance: boolean;
    records: boolean;
    consumption: boolean;
    packages: boolean;
    pricing: boolean;
    stats: boolean;
    consuming: boolean;
  };

  // 错误状态
  error: {
    balance: Error | null;
    records: Error | null;
    consumption: Error | null;
    packages: Error | null;
    pricing: Error | null;
    stats: Error | null;
  };

  // 分页
  pagination: {
    records: { page: number; limit: number; total: number };
    consumption: { page: number; limit: number; total: number };
  };

  // 操作方法
  refreshBalance: () => Promise<void>;
  refreshRecords: (page?: number, limit?: number, type?: JinbiRecordType) => Promise<void>;
  refreshConsumptionDetails: (page?: number, limit?: number, serviceType?: string) => Promise<void>;
  refreshPackages: () => Promise<void>;
  refreshPricing: () => Promise<void>;
  refreshMonthlyStats: () => Promise<void>;
  refreshAll: () => Promise<void>;

  // 消费操作
  consumeJinbi: (
    amount: number,
    serviceType: string,
    description: string,
    options?: {
      serviceParams?: Record<string, any>;
      relatedId?: string;
    }
  ) => Promise<ConsumeResult>;

  checkBalance: (requiredAmount: number) => Promise<{ sufficient: boolean; balance?: number; error?: string }>;

  // 工具方法
  getServiceCost: (serviceType: string, serviceSubtype?: string) => Promise<number>;
  calculateActualCost: (baseCost: number) => Promise<number>;

  // 缓存控制
  clearCache: () => void;
}

// ==================== Hook实现 ====================

export function useJinbi(): UseJinbiReturn {
  const { user } = useContext(AuthContext);
  const userId = user?.id || null;

  // 数据状态
  const [balance, setBalance] = useState<JinbiBalance | null>(null);
  const [records, setRecords] = useState<JinbiRecord[]>([]);
  const [consumptionDetails, setConsumptionDetails] = useState<JinbiConsumptionDetail[]>([]);
  const [packages, setPackages] = useState<JinbiPackage[]>([]);
  const [pricing, setPricing] = useState<ServicePricing[]>([]);
  const [monthlyStats, setMonthlyStats] = useState({ earned: 0, spent: 0, netChange: 0 });

  // 加载状态
  const [loading, setLoading] = useState({
    balance: false,
    records: false,
    consumption: false,
    packages: false,
    pricing: false,
    stats: false,
    consuming: false,
  });

  // 错误状态
  const [error, setError] = useState({
    balance: null as Error | null,
    records: null as Error | null,
    consumption: null as Error | null,
    packages: null as Error | null,
    pricing: null as Error | null,
    stats: null as Error | null,
  });

  // 分页状态
  const [pagination, setPagination] = useState({
    records: { page: 1, limit: 20, total: 0 },
    consumption: { page: 1, limit: 20, total: 0 },
  });

  // 用于防止重复请求的ref
  const fetchingRef = useRef<{
    balance: boolean;
    records: boolean;
    consumption: boolean;
    packages: boolean;
    pricing: boolean;
    stats: boolean;
  }>({
    balance: false,
    records: false,
    consumption: false,
    packages: false,
    pricing: false,
    stats: false,
  });

  // ==================== 数据获取方法 ====================

  const refreshBalance = useCallback(async () => {
    if (!userId || fetchingRef.current.balance) return;

    fetchingRef.current.balance = true;
    setLoading((prev) => ({ ...prev, balance: true }));
    setError((prev) => ({ ...prev, balance: null }));

    try {
      const data = await jinbiService.getBalance(userId);
      setBalance(data);
    } catch (err) {
      setError((prev) => ({ ...prev, balance: err as Error }));
    } finally {
      setLoading((prev) => ({ ...prev, balance: false }));
      fetchingRef.current.balance = false;
    }
  }, [userId]);

  const refreshRecords = useCallback(
    async (page = 1, limit = 20, type?: JinbiRecordType) => {
      if (!userId || fetchingRef.current.records) return;

      fetchingRef.current.records = true;
      setLoading((prev) => ({ ...prev, records: true }));
      setError((prev) => ({ ...prev, records: null }));

      try {
        const { records: data, total } = await jinbiService.getRecords(userId, {
          page,
          limit,
          type,
        });
        setRecords(data);
        setPagination((prev) => ({
          ...prev,
          records: { ...prev.records, page, limit, total },
        }));
      } catch (err) {
        setError((prev) => ({ ...prev, records: err as Error }));
      } finally {
        setLoading((prev) => ({ ...prev, records: false }));
        fetchingRef.current.records = false;
      }
    },
    [userId]
  );

  const refreshConsumptionDetails = useCallback(
    async (page = 1, limit = 20, serviceType?: string) => {
      if (!userId || fetchingRef.current.consumption) return;

      fetchingRef.current.consumption = true;
      setLoading((prev) => ({ ...prev, consumption: true }));
      setError((prev) => ({ ...prev, consumption: null }));

      try {
        const { details, total } = await jinbiService.getConsumptionDetails(userId, {
          page,
          limit,
          serviceType,
        });
        setConsumptionDetails(details);
        setPagination((prev) => ({
          ...prev,
          consumption: { ...prev.consumption, page, limit, total },
        }));
      } catch (err) {
        setError((prev) => ({ ...prev, consumption: err as Error }));
      } finally {
        setLoading((prev) => ({ ...prev, consumption: false }));
        fetchingRef.current.consumption = false;
      }
    },
    [userId]
  );

  const refreshPackages = useCallback(async () => {
    if (fetchingRef.current.packages) return;

    fetchingRef.current.packages = true;
    setLoading((prev) => ({ ...prev, packages: true }));
    setError((prev) => ({ ...prev, packages: null }));

    try {
      const data = await jinbiService.getPackages();
      setPackages(data);
    } catch (err) {
      setError((prev) => ({ ...prev, packages: err as Error }));
    } finally {
      setLoading((prev) => ({ ...prev, packages: false }));
      fetchingRef.current.packages = false;
    }
  }, []);

  const refreshPricing = useCallback(async () => {
    if (fetchingRef.current.pricing) return;

    fetchingRef.current.pricing = true;
    setLoading((prev) => ({ ...prev, pricing: true }));
    setError((prev) => ({ ...prev, pricing: null }));

    try {
      const data = await jinbiService.getServicePricing();
      setPricing(data);
    } catch (err) {
      setError((prev) => ({ ...prev, pricing: err as Error }));
    } finally {
      setLoading((prev) => ({ ...prev, pricing: false }));
      fetchingRef.current.pricing = false;
    }
  }, []);

  const refreshMonthlyStats = useCallback(async () => {
    if (!userId || fetchingRef.current.stats) return;

    fetchingRef.current.stats = true;
    setLoading((prev) => ({ ...prev, stats: true }));
    setError((prev) => ({ ...prev, stats: null }));

    try {
      const stats = await jinbiService.getMonthlyStats(userId);
      setMonthlyStats(stats);
    } catch (err) {
      setError((prev) => ({ ...prev, stats: err as Error }));
    } finally {
      setLoading((prev) => ({ ...prev, stats: false }));
      fetchingRef.current.stats = false;
    }
  }, [userId]);

  const refreshAll = useCallback(async () => {
    await Promise.all([
      refreshBalance(),
      refreshRecords(),
      refreshConsumptionDetails(),
      refreshPackages(),
      refreshPricing(),
      refreshMonthlyStats(),
    ]);
  }, [
    refreshBalance,
    refreshRecords,
    refreshConsumptionDetails,
    refreshPackages,
    refreshPricing,
    refreshMonthlyStats,
  ]);

  // ==================== 消费操作 ====================

  const consumeJinbi = useCallback(
    async (
      amount: number,
      serviceType: string,
      description: string,
      options: {
        serviceParams?: Record<string, any>;
        relatedId?: string;
      } = {}
    ): Promise<ConsumeResult> => {
      if (!userId) {
        return { success: false, error: '用户未登录' };
      }

      setLoading((prev) => ({ ...prev, consuming: true }));

      try {
        const result = await jinbiService.consumeJinbi(
          userId,
          amount,
          serviceType,
          description,
          options
        );

        if (result.success) {
          // 刷新余额和记录
          await Promise.all([refreshBalance(), refreshRecords(), refreshMonthlyStats()]);
        }

        return result;
      } catch (error: any) {
        return { success: false, error: error.message };
      } finally {
        setLoading((prev) => ({ ...prev, consuming: false }));
      }
    },
    [userId, refreshBalance, refreshRecords, refreshMonthlyStats]
  );

  const checkBalance = useCallback(
    async (requiredAmount: number): Promise<{ sufficient: boolean; balance?: number; error?: string }> => {
      if (!userId) {
        return { sufficient: false, error: '用户未登录' };
      }

      const result = await jinbiService.checkBalance(userId, requiredAmount);
      return result;
    },
    [userId]
  );

  // ==================== 工具方法 ====================

  const getServiceCost = useCallback(
    async (serviceType: string, serviceSubtype?: string): Promise<number> => {
      return jinbiService.getServiceCost(serviceType, serviceSubtype);
    },
    []
  );

  const calculateActualCost = useCallback(
    async (baseCost: number): Promise<number> => {
      if (!userId) return baseCost;
      return jinbiService.calculateActualCost(userId, baseCost);
    },
    [userId]
  );

  const clearCache = useCallback(() => {
    jinbiService.clearCache();
  }, []);

  // ==================== 副作用 ====================

  // 初始加载
  useEffect(() => {
    if (userId) {
      refreshAll();
    }
  }, [userId, refreshAll]);

  // 监听津币变化事件
  useEffect(() => {
    const handleJinbiChanged = (data: any) => {
      if (data.userId === userId) {
        refreshBalance();
        refreshMonthlyStats();
      }
    };

    const unsubscribeConsumed = eventBus.on('jinbi:consumed', handleJinbiChanged);
    const unsubscribeGranted = eventBus.on('jinbi:granted', handleJinbiChanged);

    return () => {
      unsubscribeConsumed();
      unsubscribeGranted();
    };
  }, [userId, refreshBalance, refreshMonthlyStats]);

  // 定时刷新余额（每30秒）
  useEffect(() => {
    if (!userId) return;

    const interval = setInterval(() => {
      refreshBalance();
    }, 30000);

    return () => clearInterval(interval);
  }, [userId, refreshBalance]);

  return {
    // 数据
    balance,
    records,
    consumptionDetails,
    packages,
    pricing,
    monthlyStats,

    // 加载状态
    loading,

    // 错误状态
    error,

    // 分页
    pagination,

    // 操作方法
    refreshBalance,
    refreshRecords,
    refreshConsumptionDetails,
    refreshPackages,
    refreshPricing,
    refreshMonthlyStats,
    refreshAll,

    // 消费操作
    consumeJinbi,
    checkBalance,

    // 工具方法
    getServiceCost,
    calculateActualCost,

    // 缓存控制
    clearCache,
  };
}

export default useJinbi;

// 导出服务类型常量
export { SERVICE_TYPES };
