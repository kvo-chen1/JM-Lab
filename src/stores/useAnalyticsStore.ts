import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { supabase } from '@/lib/supabaseClient';
import analyticsService, { DataPoint, DataStats, AnalyticsQueryParams } from '@/services/analyticsService';
import { signRequest } from '@/utils/security';

interface AnalyticsState {
  dataPoints: DataPoint[];
  stats: DataStats;
  isLoading: boolean;
  error: string | null;
  isOnline: boolean;
  lastSyncTime: number;
  // 待同步的离线操作队列
  pendingActions: Array<{
    id: string;
    type: string;
    payload: any;
    timestamp: number;
    signature?: string;
  }>;

  // Actions
  fetchData: (params: AnalyticsQueryParams) => Promise<void>;
  subscribeToRealtime: () => void;
  unsubscribeFromRealtime: () => void;
  logUserAction: (actionType: string, payload: any) => Promise<void>;
  setOnlineStatus: (status: boolean) => void;
  syncOfflineData: () => Promise<void>;
}

export const useAnalyticsStore = create<AnalyticsState>()(
  persist(
    (set, get) => ({
      dataPoints: [],
      stats: {
        total: 0,
        average: 0,
        growth: 0,
        peak: 0,
        trough: 0,
        trend: 'stable'
      },
      isLoading: false,
      error: null,
      isOnline: navigator.onLine,
      lastSyncTime: 0,
      pendingActions: [],

      fetchData: async (params) => {
        set({ isLoading: true, error: null });
        try {
          // 模拟从后端获取数据，实际项目中应调用 Supabase 或 API
          // Simulate fetching data from backend
          // const { data, error } = await supabase.from('analytics').select('*');
          
          // 暂时使用 service 中的逻辑获取 mock 数据
          const data = analyticsService.getMetricsData(params);
          const stats = analyticsService.getMetricsStats(data);
          
          set({ dataPoints: data, stats, isLoading: false, lastSyncTime: Date.now() });
        } catch (err: any) {
          set({ error: err.message, isLoading: false });
        }
      },

      subscribeToRealtime: () => {
        // 建立实时数据通道 (WebSocket/SSE)
        // Setup Realtime Data Channel
        const channel = supabase
          .channel('analytics-realtime')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'analytics' },
            (payload) => {
              console.log('Realtime update received:', payload);
              // 增量更新算法：收到新数据时，直接更新本地状态，避免全量刷新
              // Incremental update: update local state directly on new data
              const newData = payload.new as DataPoint;
              if (newData) {
                set((state) => {
                  const updatedPoints = [...state.dataPoints, newData];
                  
                  // 增量聚合逻辑 (Incremental Aggregation)
                  // 仅基于新数据更新统计指标，而不是全量重算
                  // Only update stats based on new data, avoid full recalculation
                  const prevStats = state.stats;
                  const newTotal = prevStats.total + newData.value;
                  const newCount = state.dataPoints.length + 1;
                  const newAverage = newTotal / newCount;
                  
                  // 更新峰值和谷值
                  const newPeak = Math.max(prevStats.peak, newData.value);
                  const newTrough = Math.min(prevStats.trough, newData.value);
                  
                  // 趋势判断 (简单移动平均)
                  // Trend detection (Simple Moving Average)
                  const newTrend = newData.value > prevStats.average ? 'up' : newData.value < prevStats.average ? 'down' : 'stable';

                  return {
                    dataPoints: updatedPoints,
                    stats: {
                      ...prevStats,
                      total: newTotal,
                      average: newAverage,
                      peak: newPeak,
                      trough: newTrough,
                      trend: newTrend
                    }
                  };
                });
              }
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('已连接到实时分析频道 (Connected to realtime analytics channel)');
            }
          });

        // 监听网络状态
        window.addEventListener('online', () => get().setOnlineStatus(true));
        window.addEventListener('offline', () => get().setOnlineStatus(false));
      },

      unsubscribeFromRealtime: () => {
        supabase.channel('analytics-realtime').unsubscribe();
        window.removeEventListener('online', () => get().setOnlineStatus(true));
        window.removeEventListener('offline', () => get().setOnlineStatus(false));
      },

      logUserAction: async (actionType, payload) => {
        // 数据校验与防篡改 (Data Integrity & Anti-tampering)
        // 使用 HMAC 签名
        const signedPayload = await signRequest(payload);
        
        const action = {
          id: crypto.randomUUID(),
          type: actionType,
          payload: signedPayload,
          timestamp: Date.now(),
          signature: signedPayload._sig
        };

        // 如果在线，尝试直接发送
        if (get().isOnline) {
          try {
            // 模拟发送到后端
            // await supabase.from('user_logs').insert(action);
            console.log('Action logged online:', action);
            
            // 乐观更新：立即在本地反映变化（如果适用）
          } catch (error) {
            console.error('Failed to log action, queuing offline:', error);
            set((state) => ({
              pendingActions: [...state.pendingActions, action]
            }));
          }
        } else {
          // 离线状态，存入队列
          console.log('Offline: Action queued:', action);
          set((state) => ({
            pendingActions: [...state.pendingActions, action]
          }));
        }
      },

      setOnlineStatus: (status) => {
        set({ isOnline: status });
        if (status) {
          // 恢复网络后自动合并离线数据
          get().syncOfflineData();
        }
      },

      syncOfflineData: async () => {
        const { pendingActions } = get();
        if (pendingActions.length === 0) return;

        console.log(`Syncing ${pendingActions.length} offline actions...`);
        
        // 批量发送离线数据
        // Batch send offline data
        try {
          // 模拟批量提交
          // await supabase.from('user_logs').insert(pendingActions);
          
          // 模拟处理耗时
          await new Promise(resolve => setTimeout(resolve, 500));
          
          console.log('Offline actions synced successfully');
          set({ pendingActions: [] });
        } catch (error) {
          console.error('Sync failed:', error);
          // 可以在这里实现重试策略
        }
      }
    }),
    {
      name: 'analytics-storage', // 本地存储 Key
      storage: createJSONStorage(() => localStorage), // 使用 LocalStorage
      partialize: (state) => ({ 
        // 只持久化数据和待处理操作，不持久化加载状态
        dataPoints: state.dataPoints, 
        stats: state.stats,
        pendingActions: state.pendingActions 
      }),
    }
  )
);
