import React, { useState, useEffect } from 'react';
import { DatabaseStatus } from '../components/DatabaseStatus';

// API 响应类型
interface NeonHealthResponse {
  status: string;
  database: {
    type: string;
    connected: boolean;
  };
  timestamp: string;
  connection?: {
    status: string;
    responseTime: number;
    latencyLevel: string;
    version: string;
    serverTime: string;
  };
  pool?: {
    totalCount: number;
    idleCount: number;
    waitingCount: number;
    database: {
      activeConnections: number;
      maxConnections: number;
    };
  };
  tables?: {
    total: number;
    criticalTables: Record<string, number>;
  };
  error?: {
    message: string;
    code: string;
  };
}

interface DiagnosticsResponse {
  timestamp: string;
  totalCheckTime: number;
  environment: {
    nodeEnv: string;
    isVercel: boolean;
    vercelEnv?: string;
  };
  health: {
    healthy: boolean;
    status: string;
    timestamp: string;
    totalCheckTime: number;
    connection: {
      connected: boolean;
      status: string;
      responseTime: number;
      latencyLevel: string;
      database?: {
        type: string;
        version: string;
        serverTime: string;
      };
    };
    pool: {
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
    };
  };
  tables: {
    totalTables: number;
    tables: string[];
    criticalTables: Record<string, number>;
  };
}

const SystemStatus: React.FC = () => {
  const [neonHealth, setNeonHealth] = useState<NeonHealthResponse | null>(null);
  const [diagnostics, setDiagnostics] = useState<DiagnosticsResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'neon' | 'diagnostics'>('overview');

  // 获取 Neon 健康状态
  const fetchNeonHealth = async () => {
    try {
      const response = await fetch('/api/health/neon');
      const data = await response.json();
      setNeonHealth(data);
    } catch (error) {
      console.error('获取 Neon 健康状态失败:', error);
    }
  };

  // 获取完整诊断信息
  const fetchDiagnostics = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/health/diagnostics');
      const data = await response.json();
      setDiagnostics(data);
    } catch (error) {
      console.error('获取诊断信息失败:', error);
    } finally {
      setLoading(false);
    }
  };

  // 刷新所有数据
  const refreshAll = async () => {
    setLoading(true);
    await Promise.all([fetchNeonHealth(), fetchDiagnostics()]);
    setLoading(false);
  };

  // 初始加载
  useEffect(() => {
    refreshAll();
  }, []);

  // 格式化时间
  const formatTime = (isoString: string) => {
    return new Date(isoString).toLocaleString('zh-CN');
  };

  // 格式化毫秒
  const formatMs = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  // 获取状态颜色
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'ok':
      case 'connected':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'error':
      case 'disconnected':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">系统状态</h1>
              <p className="mt-2 text-gray-600">监控平台与 Neon 数据库的连接状态</p>
            </div>
            <button
              onClick={refreshAll}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg shadow-sm hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              <svg
                className={`w-5 h-5 text-gray-600 ${loading ? 'animate-spin' : ''}`}
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
              <span className="text-gray-700">刷新</span>
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className="mb-6 border-b border-gray-200">
          <nav className="flex gap-8">
            {[
              { id: 'overview', label: '概览' },
              { id: 'neon', label: 'Neon 数据库' },
              { id: 'diagnostics', label: '完整诊断' },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`pb-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* 概览标签 */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 数据库状态卡片 */}
            <DatabaseStatus />

            {/* 快速统计 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">快速统计</h2>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">数据库类型</p>
                  <p className="text-xl font-semibold text-gray-900 mt-1">
                    {neonHealth?.database?.type === 'neon' ? 'Neon PostgreSQL' : 'PostgreSQL'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">连接状态</p>
                  <p
                    className={`text-xl font-semibold mt-1 ${
                      neonHealth?.database?.connected ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {neonHealth?.database?.connected ? '已连接' : '未连接'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">响应时间</p>
                  <p className="text-xl font-semibold text-gray-900 mt-1">
                    {neonHealth?.connection?.responseTime
                      ? formatMs(neonHealth.connection.responseTime)
                      : '-'}
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-500">总表数</p>
                  <p className="text-xl font-semibold text-gray-900 mt-1">
                    {diagnostics?.tables?.totalTables || '-'}
                  </p>
                </div>
              </div>
            </div>

            {/* 环境信息 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 lg:col-span-2">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">环境信息</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Node 环境</p>
                    <p className="font-medium text-gray-900">{diagnostics?.environment?.nodeEnv || '未知'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">Vercel 环境</p>
                    <p className="font-medium text-gray-900">
                      {diagnostics?.environment?.isVercel ? '是' : '否'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm text-gray-500">最后检查</p>
                    <p className="font-medium text-gray-900">
                      {diagnostics?.timestamp ? formatTime(diagnostics.timestamp) : '-'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Neon 数据库标签 */}
        {activeTab === 'neon' && (
          <div className="space-y-6">
            {/* Neon 连接状态 */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">Neon 数据库连接</h2>
              {neonHealth ? (
                <div className="space-y-4">
                  <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg border ${getStatusColor(neonHealth.status)}`}>
                    <div className={`w-2 h-2 rounded-full ${neonHealth.database.connected ? 'bg-green-500' : 'bg-red-500'}`} />
                    <span className="font-medium">
                      {neonHealth.database.connected ? '已连接' : '未连接'}
                    </span>
                  </div>

                  {neonHealth.connection && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">数据库版本</p>
                        <p className="font-medium text-gray-900 mt-1">{neonHealth.connection.version}</p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">服务器时间</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {formatTime(neonHealth.connection.serverTime)}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">响应时间</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {formatMs(neonHealth.connection.responseTime)}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500">延迟等级</p>
                        <p className="font-medium text-gray-900 mt-1 capitalize">
                          {neonHealth.connection.latencyLevel}
                        </p>
                      </div>
                    </div>
                  )}

                  {neonHealth.error && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <p className="text-sm text-red-600 font-medium">错误信息</p>
                      <p className="text-red-700 mt-1">{neonHealth.error.message}</p>
                      <p className="text-xs text-red-500 mt-1">错误码: {neonHealth.error.code}</p>
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-gray-500">加载中...</p>
              )}
            </div>

            {/* 连接池状态 */}
            {neonHealth?.pool && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">连接池状态</h2>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="p-4 bg-gray-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-gray-900">{neonHealth.pool.totalCount}</p>
                    <p className="text-sm text-gray-500 mt-1">总连接数</p>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-green-600">{neonHealth.pool.idleCount}</p>
                    <p className="text-sm text-gray-500 mt-1">空闲连接</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-blue-600">{neonHealth.pool.waitingCount}</p>
                    <p className="text-sm text-gray-500 mt-1">等待连接</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <p className="text-2xl font-bold text-purple-600">
                      {neonHealth.pool.database.activeConnections}
                    </p>
                    <p className="text-sm text-gray-500 mt-1">活跃连接</p>
                  </div>
                </div>
              </div>
            )}

            {/* 表结构 */}
            {neonHealth?.tables && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">表结构</h2>
                <p className="text-gray-600 mb-4">总表数: {neonHealth.tables.total}</p>
                {neonHealth.tables.criticalTables && (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(neonHealth.tables.criticalTables).map(([table, count]) => (
                      <div key={table} className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-500 capitalize">{table}</p>
                        <p className={`text-xl font-semibold mt-1 ${count >= 0 ? 'text-gray-900' : 'text-red-600'}`}>
                          {count >= 0 ? `${count} 条记录` : '表不存在'}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* 完整诊断标签 */}
        {activeTab === 'diagnostics' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">完整诊断信息</h2>
              <p className="text-gray-600 mt-1">详细的系统和数据库诊断数据</p>
            </div>
            <div className="p-6">
              {diagnostics ? (
                <pre className="bg-gray-900 text-gray-100 p-4 rounded-lg overflow-auto text-sm">
                  {JSON.stringify(diagnostics, null, 2)}
                </pre>
              ) : (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                  <span className="ml-3 text-gray-600">加载诊断信息...</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SystemStatus;
