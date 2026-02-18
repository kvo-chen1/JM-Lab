import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import offlineService, { OfflineData, OfflineStatus } from '@/services/offlineService';
import { toast } from 'sonner';

interface OfflineSyncManagerProps {
  showStatus?: boolean;
  showControls?: boolean;
  showHistory?: boolean;
}

export default function OfflineSyncManager({ 
  showStatus = true, 
  showControls = true, 
  showHistory = true 
}: OfflineSyncManagerProps) {
  const { isDark } = useTheme();
  const [status, setStatus] = useState<OfflineStatus>(offlineService.getStatus());
  const [offlineData, setOfflineData] = useState<OfflineData[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [config, setConfig] = useState(offlineService.getConfig());

  // 监听离线状态变化
  useEffect(() => {
    const unsubscribe = offlineService.addStatusListener((newStatus) => {
      setStatus(newStatus);
    });

    return () => unsubscribe();
  }, []);

  // 加载离线数据
  useEffect(() => {
    const data = offlineService.getAllOfflineData();
    setOfflineData(data);
  }, [status.pendingSync, status.lastSync]);

  // 处理手动同步
  const handleSyncNow = async () => {
    try {
      const success = await offlineService.syncData();
      if (success) {
        toast.success('离线数据同步成功');
      } else {
        toast.error('离线数据同步失败');
      }
    } catch (error) {
      toast.error('离线数据同步失败');
    }
  };

  // 处理重试失败数据
  const handleRetryFailed = () => {
    offlineService.retryFailedData();
    toast.success('已重试失败数据');
  };

  // 处理清除已同步数据
  const handleClearSynced = () => {
    offlineService.clearSyncedData();
    toast.success('已清除已同步数据');
  };

  // 处理更新配置
  const handleUpdateConfig = () => {
    offlineService.updateConfig(config);
    setShowConfig(false);
    toast.success('离线配置已更新');
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN');
  };

  // 获取状态文本
  const getStatusText = () => {
    if (!status.isOnline) {
      return '离线模式';
    } else if (status.syncing) {
      return '正在同步';
    } else if (status.pendingSync > 0) {
      return `待同步: ${status.pendingSync}`;
    } else {
      return '已同步';
    }
  };

  // 获取状态图标
  const getStatusIcon = () => {
    if (!status.isOnline) {
      return 'fa-wifi-slash text-red-500';
    } else if (status.syncing) {
      return 'fa-sync-alt fa-spin text-blue-500';
    } else if (status.pendingSync > 0) {
      return 'fa-exclamation-triangle text-yellow-500';
    } else {
      return 'fa-check-circle text-green-500';
    }
  };

  // 获取数据状态文本
  const getDataStatusText = (status: OfflineData['status']) => {
    const statusMap: Record<OfflineData['status'], string> = {
      pending: '待同步',
      syncing: '正在同步',
      synced: '已同步',
      failed: '同步失败'
    };
    return statusMap[status];
  };

  // 获取数据状态颜色
  const getDataStatusColor = (status: OfflineData['status']) => {
    const colorMap: Record<OfflineData['status'], string> = {
      pending: 'text-yellow-500',
      syncing: 'text-blue-500',
      synced: 'text-green-500',
      failed: 'text-red-500'
    };
    return colorMap[status];
  };

  return (
    <>
      {/* 离线状态指示器 */}
      {showStatus && (
        <motion.div
          className={`flex items-center gap-2 px-3 py-2 rounded-full text-sm cursor-pointer transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'} shadow-sm`}
          onClick={() => setShowModal(true)}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <i className={`fas ${getStatusIcon()}`}></i>
          <span>{getStatusText()}</span>
        </motion.div>
      )}

      {/* 离线管理模态框 */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[70] p-4">
          <motion.div
            className={`rounded-xl overflow-hidden max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'}`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            {/* 模态框头部 */}
            <div className="p-4 border-b border-gray-700 flex justify-between items-center">
              <h3 className="text-xl font-bold">离线同步管理</h3>
              <button
                onClick={() => setShowModal(false)}
                className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
              >
                <i className="fas fa-times"></i>
              </button>
            </div>

            {/* 模态框内容 */}
            <div className="p-4">
              {/* 离线状态概览 */}
              <div className="mb-6">
                <h4 className="font-semibold mb-3">当前状态</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className="text-xs text-gray-500 mb-1">网络状态</p>
                    <div className="flex items-center gap-2">
                      <i className={`fas ${status.isOnline ? 'fa-wifi text-green-500' : 'fa-wifi-slash text-red-500'}`}></i>
                      <span>{status.isOnline ? '在线' : '离线'}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className="text-xs text-gray-500 mb-1">待同步数据</p>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-clock text-yellow-500"></i>
                      <span>{status.pendingSync} 项</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className="text-xs text-gray-500 mb-1">上次同步</p>
                    <div className="flex items-center gap-2">
                      <i className="fas fa-history text-blue-500"></i>
                      <span>{status.lastSync ? formatDate(status.lastSync) : '从未同步'}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                    <p className="text-xs text-gray-500 mb-1">同步状态</p>
                    <div className="flex items-center gap-2">
                      <i className={`fas ${status.syncing ? 'fa-sync-alt fa-spin text-blue-500' : 'fa-check-circle text-green-500'}`}></i>
                      <span>{status.syncing ? '正在同步' : '同步完成'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 离线控制 */}
              {showControls && (
                <div className="mb-6">
                  <h4 className="font-semibold mb-3">同步控制</h4>
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSyncNow}
                      disabled={status.syncing}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white ${status.syncing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      {status.syncing ? '同步中...' : '立即同步'}
                    </button>
                    <button
                      onClick={() => offlineService.retryFailedData()}
                      disabled={status.syncing}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'} ${status.syncing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    >
                      重试失败数据
                    </button>
                    <button
                      onClick={() => offlineService.clearSyncedData()}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      清除已同步数据
                    </button>
                    <button
                      onClick={() => setShowConfig(!showConfig)}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-gray-100 hover:bg-gray-200'}`}
                    >
                      {showConfig ? '隐藏配置' : '配置'}
                    </button>
                  </div>

                  {/* 配置表单 */}
                  {showConfig && (
                    <div className="mt-4 p-4 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                      <h5 className="font-medium mb-3">离线配置</h5>
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <label className="text-sm font-medium">自动同步</label>
                          <input
                            type="checkbox"
                            checked={config.autoSync}
                            onChange={(e) => setConfig({ ...config, autoSync: e.target.checked })}
                            className={`rounded ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'}`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">同步间隔 (秒)</label>
                          <input
                            type="number"
                            min="5"
                            max="3600"
                            value={config.syncInterval / 1000}
                            onChange={(e) => setConfig({ ...config, syncInterval: parseInt(e.target.value) * 1000 })}
                            className={`w-full px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">最大离线数据</label>
                          <input
                            type="number"
                            min="10"
                            max="1000"
                            value={config.maxOfflineData}
                            onChange={(e) => setConfig({ ...config, maxOfflineData: parseInt(e.target.value) })}
                            className={`w-full px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-1">重试延迟 (秒)</label>
                          <input
                            type="number"
                            min="1"
                            max="60"
                            value={config.retryDelay / 1000}
                            onChange={(e) => setConfig({ ...config, retryDelay: parseInt(e.target.value) * 1000 })}
                            className={`w-full px-3 py-2 rounded-lg ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'} border focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          />
                        </div>
                        <div className="flex justify-end">
                          <button
                            onClick={handleUpdateConfig}
                            className="px-4 py-2 rounded-lg font-medium transition-colors bg-blue-600 hover:bg-blue-700 text-white"
                          >
                            保存配置
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* 离线数据历史 */}
              {showHistory && (
                <div>
                  <h4 className="font-semibold mb-3">同步历史</h4>
                  {offlineData.length === 0 ? (
                    <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <i className="fas fa-history text-4xl mb-2"></i>
                      <p>暂无离线数据</p>
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {offlineData.map(item => (
                        <div
                          key={item.id}
                          className={`p-3 rounded-lg ${isDark ? 'bg-gray-800' : 'bg-gray-50'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                {item.type}
                              </span>
                              <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-100'} ${getDataStatusColor(item.status)}`}>
                                {getDataStatusText(item.status)}
                              </span>
                            </div>
                            <span className="text-xs text-gray-500">
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          <div className="text-sm mb-2">
                            <pre className={`whitespace-pre-wrap overflow-x-auto ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              {JSON.stringify(item.data, null, 2)}
                            </pre>
                          </div>
                          {item.error && (
                            <div className="text-xs text-red-500">
                              错误: {item.error}
                            </div>
                          )}
                          {item.syncedAt && (
                            <div className="text-xs text-gray-500">
                              同步时间: {formatDate(item.syncedAt)}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* 模态框底部 */}
            <div className="p-4 border-t border-gray-700 flex justify-end">
              <button
                onClick={() => setShowModal(false)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
              >
                关闭
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </>
  );
}
