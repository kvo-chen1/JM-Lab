import React, { useState, useEffect } from 'react';
import { offlineService } from '@/services/offlineService';

interface PWAStatusIndicatorProps {
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  showDetails?: boolean;
}

const PWAStatusIndicator: React.FC<PWAStatusIndicatorProps> = ({ 
  position = 'top-right',
  showDetails = false 
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isPWA, setIsPWA] = useState(false);
  const [storageInfo, setStorageInfo] = useState({
    total: 0,
    used: 0,
    available: 0,
    usagePercentage: 0
  });
  const [syncQueueLength, setSyncQueueLength] = useState(0);
  const [showTooltip, setShowTooltip] = useState(false);

  // 检查PWA状态
  useEffect(() => {
    const checkPWAStatus = () => {
      setIsPWA(window.matchMedia('(display-mode: standalone)').matches);
    };

    checkPWAStatus();
    
    // 监听显示模式变化
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    const handleChange = () => {
      setIsPWA(mediaQuery.matches);
    };
    
    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  // 检查网络状态
  useEffect(() => {
    setIsOnline(navigator.onLine);
    
    offlineService.addNetworkListener((online) => {
      setIsOnline(online);
    });
  }, []);

  // 获取存储信息
  useEffect(() => {
    const updateStorageInfo = async () => {
      try {
        const info = await offlineService.getStorageInfo();
        setStorageInfo(info);
      } catch (error) {
        console.error('获取存储信息失败:', error);
      }
    };

    updateStorageInfo();
    
    // 每30秒更新一次存储信息
    const interval = setInterval(updateStorageInfo, 30000);
    return () => clearInterval(interval);
  }, []);

  // 获取同步队列长度
  useEffect(() => {
    const updateSyncQueue = async () => {
      try {
        const queue = await offlineService.getSyncQueue();
        setSyncQueueLength(queue.length);
      } catch (error) {
        console.error('获取同步队列失败:', error);
      }
    };

    updateSyncQueue();
    
    // 每10秒更新一次同步队列
    const interval = setInterval(updateSyncQueue, 10000);
    return () => clearInterval(interval);
  }, []);

  // 处理同步队列
  const handleSync = async () => {
    if (!isOnline) return;
    
    try {
      await offlineService.processSyncQueue();
      const queue = await offlineService.getSyncQueue();
      setSyncQueueLength(queue.length);
    } catch (error) {
      console.error('同步失败:', error);
    }
  };

  // 格式化存储大小
  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const positionClasses = {
    'top-left': 'top-4 left-4',
    'top-right': 'top-4 right-4',
    'bottom-left': 'bottom-28 left-4',
    'bottom-right': 'bottom-28 right-4'
  };

  return (
    <div className={`fixed ${positionClasses[position]} z-50 flex flex-col gap-2`}>
      {/* 主状态指示器 */}
      <div 
        className="relative"
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
      >
        <button
          className={`w-10 h-10 rounded-full flex items-center justify-center shadow-lg transition-all duration-300 ${
            isOnline 
              ? isPWA 
                ? 'bg-green-500 hover:bg-green-600' 
                : 'bg-blue-500 hover:bg-blue-600'
              : 'bg-yellow-500 hover:bg-yellow-600'
          }`}
          onClick={handleSync}
          title={isOnline ? '点击同步数据' : '网络已断开'}
        >
          <div className="text-white text-lg">
            {isPWA ? '📱' : isOnline ? '🌐' : '📴'}
          </div>
          
          {/* 同步队列提示 */}
          {syncQueueLength > 0 && isOnline && (
            <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
              {syncQueueLength}
            </div>
          )}
        </button>

        {/* 详细状态提示 */}
        {showTooltip && (
          <div className="absolute left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="space-y-3">
              {/* 应用模式 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">应用模式:</span>
                <span className={`text-sm font-medium ${
                  isPWA ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {isPWA ? 'PWA应用' : '浏览器'}
                </span>
              </div>

              {/* 网络状态 */}
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-300">网络状态:</span>
                <span className={`text-sm font-medium ${
                  isOnline ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {isOnline ? '在线' : '离线'}
                </span>
              </div>

              {/* 存储使用情况 */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">存储使用:</span>
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.total)}
                  </span>
                </div>
                
                {/* 进度条 */}
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full transition-all duration-300 ${
                      storageInfo.usagePercentage > 90 ? 'bg-red-500' :
                      storageInfo.usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                    }`}
                    style={{ width: `${Math.min(storageInfo.usagePercentage, 100)}%` }}
                  />
                </div>
              </div>

              {/* 同步队列 */}
              {syncQueueLength > 0 && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-300">待同步:</span>
                  <span className="text-sm font-medium text-red-600">
                    {syncQueueLength} 项
                  </span>
                </div>
              )}

              {/* 操作按钮 */}
              <div className="flex gap-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                <button
                  onClick={handleSync}
                  disabled={!isOnline || syncQueueLength === 0}
                  className="flex-1 px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
                >
                  同步数据
                </button>
                
                {isPWA && (
                  <button
                    onClick={() => window.close()}
                    className="px-3 py-1 bg-gray-500 text-white text-sm rounded hover:bg-gray-600 transition-colors"
                  >
                    关闭应用
                  </button>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 详细状态面板 */}
      {showDetails && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <h3 className="font-medium text-gray-900 dark:text-white">应用状态</h3>
            
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-gray-600 dark:text-gray-300">模式:</span>
                <span className={`ml-2 font-medium ${
                  isPWA ? 'text-green-600' : 'text-blue-600'
                }`}>
                  {isPWA ? 'PWA' : 'Web'}
                </span>
              </div>
              
              <div>
                <span className="text-gray-600 dark:text-gray-300">网络:</span>
                <span className={`ml-2 font-medium ${
                  isOnline ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {isOnline ? '在线' : '离线'}
                </span>
              </div>
              
              <div>
                <span className="text-gray-600 dark:text-gray-300">存储:</span>
                <span className="ml-2 font-medium">
                  {formatBytes(storageInfo.used)}
                </span>
              </div>
              
              <div>
                <span className="text-gray-600 dark:text-gray-300">待同步:</span>
                <span className={`ml-2 font-medium ${
                  syncQueueLength > 0 ? 'text-red-600' : 'text-green-600'
                }`}>
                  {syncQueueLength}
                </span>
              </div>
            </div>
            
            {/* 存储使用进度条 */}
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-gray-500">
                <span>存储使用率</span>
                <span>{storageInfo.usagePercentage.toFixed(1)}%</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    storageInfo.usagePercentage > 90 ? 'bg-red-500' :
                    storageInfo.usagePercentage > 70 ? 'bg-yellow-500' : 'bg-green-500'
                  }`}
                  style={{ width: `${Math.min(storageInfo.usagePercentage, 100)}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PWAStatusIndicator;