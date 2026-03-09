/**
 * Supabase Realtime 降级方案
 * 当 realtime 禁用时，使用轮询作为替代方案
 */

import { supabase } from '@/lib/supabase';

interface RealtimeChannelOptions {
  event: 'INSERT' | 'UPDATE' | 'DELETE' | '*';
  schema: string;
  table: string;
  filter?: string;
}

type RealtimeCallback = (payload: any) => void;

interface Channel {
  on: (event: string, options: RealtimeChannelOptions, callback: RealtimeCallback) => Channel;
  subscribe: (callback?: (status: string, err?: Error) => void) => () => void;
  unsubscribe: () => void;
}

// 检查 realtime 是否启用
const isRealtimeEnabled = () => {
  // 检查 Supabase 客户端配置
  return false; // 当前配置为禁用
};

// 轮询管理器
class PollingManager {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  start(
    channelName: string,
    table: string,
    filter: string | undefined,
    callback: RealtimeCallback,
    interval: number = 3000
  ) {
    // 停止现有的轮询
    this.stop(channelName);

    let lastCheck = new Date().toISOString();

    const poll = async () => {
      try {
        // 构建查询
        let query = supabase
          .from(table)
          .select('*')
          .gt('created_at', lastCheck)
          .order('created_at', { ascending: true });

        // 应用过滤器
        if (filter) {
          const [column, operator, value] = filter.split('=');
          if (column && operator && value) {
            const cleanValue = value.replace(/^eq\./, '');
            query = query.eq(column, cleanValue);
          }
        }

        const { data, error } = await query;

        if (error) {
          console.warn('[PollingManager] 查询失败:', error);
          return;
        }

        // 触发回调
        if (data && data.length > 0) {
          data.forEach((record) => {
            callback({
              new: record,
              old: null,
              eventType: 'INSERT',
            });
          });

          // 更新最后检查时间
          lastCheck = data[data.length - 1].created_at;
        }
      } catch (error) {
        console.error('[PollingManager] 轮询错误:', error);
      }
    };

    // 立即执行一次
    poll();

    // 设置定时轮询
    const intervalId = setInterval(poll, interval);
    this.intervals.set(channelName, intervalId);

    console.log(`[PollingManager] 开始轮询: ${channelName}`);
  }

  stop(channelName: string) {
    const intervalId = this.intervals.get(channelName);
    if (intervalId) {
      clearInterval(intervalId);
      this.intervals.delete(channelName);
      console.log(`[PollingManager] 停止轮询: ${channelName}`);
    }
  }

  stopAll() {
    this.intervals.forEach((intervalId, channelName) => {
      clearInterval(intervalId);
      console.log(`[PollingManager] 停止轮询: ${channelName}`);
    });
    this.intervals.clear();
  }
}

const pollingManager = new PollingManager();

// 创建兼容的 channel
export function createRealtimeChannel(channelName: string): Channel {
  const callbacks: Array<{ options: RealtimeChannelOptions; callback: RealtimeCallback }> = [];
  let isSubscribed = false;

  const channel: Channel = {
    on: (event: string, options: RealtimeChannelOptions, callback: RealtimeCallback) => {
      callbacks.push({ options, callback });
      return channel;
    },

    subscribe: (callback?: (status: string, err?: Error) => void) => {
      if (isRealtimeEnabled()) {
        // 使用原生 Supabase realtime
        try {
          const nativeChannel = supabase.channel(channelName);
          callbacks.forEach(({ options, callback: cb }) => {
            nativeChannel.on('postgres_changes', options, cb);
          });

          nativeChannel.subscribe((status, err) => {
            if (callback) callback(status, err);
          });

          isSubscribed = true;

          return () => {
            if (nativeChannel && typeof nativeChannel.unsubscribe === 'function') {
              nativeChannel.unsubscribe();
            }
            isSubscribed = false;
          };
        } catch (error) {
          console.warn('[RealtimeFallback] 原生 realtime 失败，使用轮询:', error);
        }
      }

      // 使用轮询作为降级方案
      console.log(`[RealtimeFallback] 使用轮询替代 realtime: ${channelName}`);

      callbacks.forEach(({ options, callback }) => {
        if (options.event === 'INSERT' || options.event === '*') {
          pollingManager.start(
            channelName,
            options.table,
            options.filter,
            callback,
            3000 // 3秒轮询间隔
          );
        }
      });

      isSubscribed = true;
      if (callback) callback('SUBSCRIBED');

      return () => {
        pollingManager.stop(channelName);
        isSubscribed = false;
      };
    },

    unsubscribe: () => {
      pollingManager.stop(channelName);
      isSubscribed = false;
    },
  };

  return channel;
}

// 清理所有轮询
export function stopAllPolling() {
  pollingManager.stopAll();
}

console.log('[RealtimeFallback] 模块已加载');
