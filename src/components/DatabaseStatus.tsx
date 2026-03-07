import React, { useState, useEffect, useCallback } from 'react';

// 连接状态类型
interface ConnectionStatus {
  connected: boolean;
  status: 'connected' | 'disconnected' | 'error' | 'timeout' | 'warning';
  responseTime: number;
  latencyLevel: 'good' | 'normal' | 'warning' | 'bad';
  error?: string;
  errorCode?: string;
  database?: {
    type: string;
    version?: string;
    serverTime?: string;
  };
}

// 连接池状态
interface PoolStatus {
  available: boolean;
  pool?: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
  };
  database?: {
    activeConnections: number;
    maxConnections: number;
  };
  error?: string;
}

// 健康检查结果
interface HealthCheckResult {
  healthy: boolean;
  status: string;
  timestamp: string;
  totalCheckTime: number;
  connection: ConnectionStatus;
  pool: PoolStatus;
}

// 组件属性
interface DatabaseStatusProps {
  autoRefresh?: boolean;
  refreshInterval?: number;
  showDetails?: boolean;
  compact?: boolean;
}

// 状态配置
const statusConfig = {
  connected: {
    label: '在线',
    color: 'bg-green-500',
    textColor: 'text-green-600',
    bgColor: 'bg-green-50',
    borderColor: 'border-green-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ),
  },
  disconnected: {
    label: '离线',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    ),
  },
  error: {
    label: '错误',
    color: 'bg-red-500',
    textColor: 'text-red-600',
    bgColor: 'bg-red-50',
    borderColor: 'border-red-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  timeout: {
    label: '超时',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
  },
  warning: {
    label: '警告',
    color: 'bg-yellow-500',
    textColor: 'text-yellow-600',
    bgColor: 'bg-yellow-50',
    borderColor: 'border-yellow-200',
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
      </svg>
    ),
  },
};

// 延迟等级配置
const latencyConfig = {
  good: { color: 'text-green-600', label: '优秀' },
  normal: { color: 'text-blue-600', label: '正常' },
  warning: { color: 'text-yellow-600', label: '较慢' },
  bad: { color: 'text-red-600', label: '缓慢' },
};

export const DatabaseStatus: React.FC<DatabaseStatusProps> = ({
  autoRefresh = true,
  refreshInterval = 30000,
  showDetails = true,
  compact = false,
}) => {
  const [health, setHealth] = useState<HealthCheckResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // 获取健康状态
  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('/api/health/db');
      const data = await response.json();
      setHealth(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : '获取状态失败');
      setHealth(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // 初始加载和自动刷新
  useEffect(() => {
    fetchHealth();

    if (autoRefresh) {
      const interval = setInterval(fetchHealth, refreshInterval);
      return () => clearInterval(interval);
    }
  }, [fetchHealth, autoRefresh, refreshInterval]);

  // 格式化时间
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  // 格式化毫秒
  const formatMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // 获取当前状态配置
  const currentStatus = health?.connection?.status || 'disconnected';
  const status = statusConfig[currentStatus] || statusConfig.disconnected;
  const latency = health?.connection?.latencyLevel
    ? latencyConfig[health.connection.latencyLevel]
    : null;

  // 紧凑模式
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <div className={`w-2 h-2 rounded-full ${status.color} ${loading ? 'animate-pulse' : ''}`} />
        <span className={`text-sm font-medium ${status.textColor}`}>
          {loading ? '检测中...' : status.label}
        </span>
        {health?.connection?.responseTime && (
          <span className="text-xs text-gray-500">
            {formatMs(health.connection.responseTime)}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className={`rounded-lg border ${status.borderColor} ${status.bgColor} p-4`}>
      {/* 头部状态 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-full ${status.color} text-white`}>
            {status.icon}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">数据库连接</h3>
            <p className={`text-sm ${status.textColor}`}>
              {loading ? '正在检测...' : status.label}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {lastUpdated && (
            <span className="text-xs text-gray-500">
              更新于 {formatTime(lastUpdated)}
            </span>
          )}
          <button
            onClick={fetchHealth}
            disabled={loading}
            className="p-2 rounded-full hover:bg-white/50 transition-colors disabled:opacity-50"
            title="刷新"
          >
            <svg
              className={`w-4 h-4 text-gray-600 ${loading ? 'animate-spin' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* 错误信息 */}
      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-200 rounded-lg">
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* 详细信息 */}
      {showDetails && health && (
        <div className="space-y-3">
          {/* 连接信息 */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">响应时间</p>
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-gray-900">
                  {formatMs(health.connection.responseTime)}
                </span>
                {latency && (
                  <span className={`text-xs ${latency.color}`}>{latency.label}</span>
                )}
              </div>
            </div>
            <div className="bg-white/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-1">数据库类型</p>
              <p className="text-lg font-semibold text-gray-900 capitalize">
                {health.connection.database?.type || 'Unknown'}
              </p>
            </div>
          </div>

          {/* 连接池信息 */}
          {health.pool?.available && health.pool.pool && (
            <div className="bg-white/50 rounded-lg p-3">
              <p className="text-xs text-gray-500 mb-2">连接池状态</p>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-lg font-semibold text-gray-900">
                    {health.pool.pool.totalCount}
                  </p>
                  <p className="text-xs text-gray-500">总连接</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">
                    {health.pool.pool.idleCount}
                  </p>
                  <p className="text-xs text-gray-500">空闲</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-blue-600">
                    {health.pool.pool.waitingCount}
                  </p>
                  <p className="text-xs text-gray-500">等待</p>
                </div>
              </div>
              {health.pool.database && (
                <div className="mt-2 pt-2 border-t border-gray-200">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">活跃连接:</span>
                    <span className="font-medium text-gray-900">
                      {health.pool.database.activeConnections} / {health.pool.database.maxConnections}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-500 h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(
                          (health.pool.database.activeConnections / health.pool.database.maxConnections) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 错误详情 */}
          {health.connection.error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3">
              <p className="text-xs text-red-600 font-medium mb-1">错误信息</p>
              <p className="text-sm text-red-700">{health.connection.error}</p>
              {health.connection.errorCode && (
                <p className="text-xs text-red-500 mt-1">
                  错误码: {health.connection.errorCode}
                </p>
              )}
            </div>
          )}

          {/* 数据库版本 */}
          {health.connection.database?.version && (
            <div className="text-xs text-gray-500">
              数据库版本: {health.connection.database.version}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default DatabaseStatus;
