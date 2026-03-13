import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/hooks/useAuth';
import creatorDashboardService, {
  DashboardMetrics,
  TrendData,
  WorkPerformance,
  AudienceInsight,
  DeviceDistribution,
  DashboardReport,
  TimeGranularity,
} from '@/services/creatorDashboardService';

export type TimePeriod = '7d' | '30d' | '90d' | '1y' | 'all';
export type ReportSchedule = 'daily' | 'weekly' | 'monthly';

interface UseCreatorDashboardReturn {
  metrics: DashboardMetrics | null;
  trendData: TrendData[];
  topWorks: WorkPerformance[];
  audienceInsights: AudienceInsight[];
  deviceDistribution: DeviceDistribution[];
  loading: boolean;
  error: string | null;
  period: TimePeriod;
  granularity: TimeGranularity;
  subscription: { schedule: string; enabled: boolean } | null;
  setPeriod: (period: TimePeriod) => void;
  setGranularity: (granularity: TimeGranularity) => void;
  refresh: () => Promise<void>;
  exportData: (format: 'csv' | 'json' | 'excel') => Promise<void>;
  generateReport: () => Promise<DashboardReport | null>;
  subscribeReport: (schedule: ReportSchedule) => Promise<void>;
  unsubscribeReport: () => Promise<void>;
}

export function useCreatorDashboard(): UseCreatorDashboardReturn {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [trendData, setTrendData] = useState<TrendData[]>([]);
  const [topWorks, setTopWorks] = useState<WorkPerformance[]>([]);
  const [audienceInsights, setAudienceInsights] = useState<AudienceInsight[]>([]);
  const [deviceDistribution, setDeviceDistribution] = useState<DeviceDistribution[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<TimePeriod>('30d');
  const [granularity, setGranularity] = useState<TimeGranularity>('day');
  const [subscription, setSubscription] = useState<{ schedule: string; enabled: boolean } | null>(null);

  const fetchData = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const [metricsData, trendDataResult, topWorksData, audienceData, deviceData, subscriptionData] = await Promise.all([
        creatorDashboardService.getDashboardMetrics(user.id, period),
        creatorDashboardService.getTrendData(user.id, period, granularity),
        creatorDashboardService.getTopWorks(user.id, 5, period),
        creatorDashboardService.getAudienceInsights(user.id),
        creatorDashboardService.getDeviceDistribution(user.id),
        creatorDashboardService.getSubscriptionStatus(user.id),
      ]);

      setMetrics(metricsData);
      setTrendData(trendDataResult);
      setTopWorks(topWorksData);
      setAudienceInsights(audienceData);
      setDeviceDistribution(deviceData);
      setSubscription(subscriptionData);
    } catch (err: any) {
      console.error('获取数据看板数据失败:', err);
      setError(err.message || '获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [user?.id, period, granularity]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const refresh = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const exportData = useCallback(async (format: 'csv' | 'json' | 'excel') => {
    if (trendData.length === 0) return;

    try {
      switch (format) {
        case 'csv':
          await creatorDashboardService.exportToCSV(trendData);
          break;
        case 'json':
          const report = await creatorDashboardService.generateReport(user?.id || '');
          if (report) {
            await creatorDashboardService.exportToJSON(report);
          }
          break;
        case 'excel':
          await creatorDashboardService.exportToExcel(trendData);
          break;
      }
    } catch (err: any) {
      console.error('导出数据失败:', err);
      throw err;
    }
  }, [trendData, user?.id]);

  const generateReport = useCallback(async (): Promise<DashboardReport | null> => {
    if (!user?.id) return null;

    try {
      return await creatorDashboardService.generateReport(user.id, period);
    } catch (err: any) {
      console.error('生成报告失败:', err);
      return null;
    }
  }, [user?.id, period]);

  const subscribeReport = useCallback(async (schedule: ReportSchedule) => {
    if (!user?.id) return;

    try {
      await creatorDashboardService.scheduleReport(user.id, schedule);
      setSubscription({ schedule, enabled: true });
    } catch (err: any) {
      console.error('订阅报告失败:', err);
      throw err;
    }
  }, [user?.id]);

  const unsubscribeReport = useCallback(async () => {
    if (!user?.id) return;

    try {
      await creatorDashboardService.unsubscribeReport(user.id);
      setSubscription(null);
    } catch (err: any) {
      console.error('取消订阅报告失败:', err);
      throw err;
    }
  }, [user?.id]);

  return {
    metrics,
    trendData,
    topWorks,
    audienceInsights,
    deviceDistribution,
    loading,
    error,
    period,
    granularity,
    subscription,
    setPeriod,
    setGranularity,
    refresh,
    exportData,
    generateReport,
    subscribeReport,
    unsubscribeReport,
  };
}

export default useCreatorDashboard;
