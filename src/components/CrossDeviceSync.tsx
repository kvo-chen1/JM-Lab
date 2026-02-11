import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import dataSyncService, { SyncEventType } from '@/services/dataSyncService';
import eventBus from '@/services/enhancedEventBus';

// 设备类型定义
interface Device {
  id: number;
  name: string;
  type: string;
  lastActive: string;
  status: 'online' | 'offline' | 'syncing';
  lastSynced?: string;
  batteryLevel?: number;
}

// 最近同步的内容类型定义
interface SyncedContent {
  id: number;
  title: string;
  type: string;
  device: string;
  syncedAt: string;
  thumbnail: string;
}

export default function CrossDeviceSync() {
  const { isDark } = useTheme();
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [recentSyncs, setRecentSyncs] = useState<SyncedContent[]>([]);
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced'>('idle');
  const [offlineWorks, setOfflineWorks] = useState<number>(3);
  const [isLoading, setIsLoading] = useState(true);

  // 模拟加载数据
  useEffect(() => {
    setIsLoading(true);
    
    const updateStats = () => {
        const queue = dataSyncService.getQueue();
        setOfflineWorks(queue.length);
        const stats = dataSyncService.getStats();
        // Update recent syncs from stats or queue if needed
    };

    updateStats();

    // Subscribe to sync events
    const queueSub = eventBus.on(SyncEventType.SYNC_QUEUE_UPDATED, updateStats);
    const syncStartSub = eventBus.on(SyncEventType.SYNC_STARTED, () => setSyncStatus('syncing'));
    const syncCompleteSub = eventBus.on(SyncEventType.SYNC_COMPLETED, () => {
        setSyncStatus('synced');
        updateStats();
        setTimeout(() => setSyncStatus('idle'), 5000);
    });
    const syncFailSub = eventBus.on(SyncEventType.SYNC_FAILED, () => {
        setSyncStatus('idle'); // Or 'failed' if we had that state
        toast.error('同步失败');
    });

    // 模拟API请求延迟
    setTimeout(() => {
      // 模拟已连接设备数据
      setConnectedDevices([
        {
          id: 1,
          name: '当前设备',
          type: 'computer',
          lastActive: '刚刚',
          status: 'online',
          lastSynced: new Date().toLocaleTimeString(),
          batteryLevel: 100
        },
        // ... Keep other mock devices for demo purposes
      ]);

      // 模拟最近同步内容数据
      setRecentSyncs([
        {
          id: 1,
          title: '国潮插画设计',
          type: '插画',
          device: '我的MacBook',
          syncedAt: '今天 14:30',
          thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Synced%20content%20example%201'
        },
        {
          id: 2,
          title: '传统纹样创新',
          type: '纹样',
          device: '我的iPad',
          syncedAt: '今天 12:45',
          thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Synced%20content%20example%202'
        },
        {
          id: 3,
          title: '老字号品牌视觉',
          type: '品牌设计',
          device: '我的iPhone',
          syncedAt: '今天 14:15',
          thumbnail: 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?image_size=1024x1024&prompt=Synced%20content%20example%203'
        }
      ]);

      setIsLoading(false);
    }, 800);

    return () => {
        queueSub.unsubscribe?.();
        syncStartSub.unsubscribe?.();
        syncCompleteSub.unsubscribe?.();
        syncFailSub.unsubscribe?.();
    };
  }, []);

  const handleManualSync = async () => {
    setSyncStatus('syncing');
    
    try {
        await dataSyncService.sync();
        toast.success('所有设备同步完成！');
    } catch (error) {
        toast.error('同步失败，请检查网络');
    }
  };

  // 获取设备图标
  const getDeviceIcon = (type: string) => {
    switch(type) {
      case 'computer':
        return 'laptop';
      case 'mobile':
        return 'mobile-alt';
      case 'tablet':
        return 'tablet-alt';
      default:
        return 'device';
    }
  };

  // 获取设备状态颜色
  const getStatusColor = (status: string) => {
    switch(status) {
      case 'online':
        return 'bg-green-500';
      case 'offline':
        return 'bg-gray-500';
      case 'syncing':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="space-y-6">
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className={`h-12 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center p-3 rounded-xl bg-gray-100 dark:bg-gray-700 animate-pulse">
                <div className="h-12 w-12 rounded-full bg-gray-300 dark:bg-gray-600 mr-4"></div>
                <div className="flex-1">
                  <div className="h-4 w-1/3 bg-gray-300 dark:bg-gray-600 rounded mb-2"></div>
                  <div className="h-3 w-1/4 bg-gray-300 dark:bg-gray-600 rounded"></div>
                </div>
              </div>
            ))}
          </div>
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className={`h-32 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-4 w-2/3 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">多终端协同</h3>
        <button 
          onClick={handleManualSync}
          disabled={syncStatus === 'syncing'}
          className={`px-4 py-2 rounded-lg text-sm flex items-center transition-colors ${
            syncStatus === 'syncing'
              ? 'bg-gray-500 cursor-not-allowed'
              : 'bg-blue-600 hover:bg-blue-700 text-white'
          }`}
        >
          {syncStatus === 'syncing' ? (
            <>
              <i className="fas fa-spinner fa-spin mr-2"></i>
              同步中...
            </>
          ) : syncStatus === 'synced' ? (
            <>
              <i className="fas fa-check mr-2"></i>
              已同步
            </>
          ) : (
            <>
              <i className="fas fa-sync-alt mr-2"></i>
              立即同步
            </>
          )}
        </button>
      </div>

      {/* 同步状态卡片 */}
      <motion.div
        className={`p-4 rounded-xl mb-8 ${
          syncStatus === 'syncing' 
            ? 'bg-blue-500 bg-opacity-10 border border-blue-200' 
            : syncStatus === 'synced'
              ? 'bg-green-500 bg-opacity-10 border border-green-200' 
              : isDark 
                ? 'bg-gray-700 border border-gray-600' 
                : 'bg-gray-50 border border-gray-200'
        }`}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="flex items-center mb-4 md:mb-0">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center mr-3 ${
              syncStatus === 'syncing' 
                ? 'bg-blue-100 text-blue-600' 
                : syncStatus === 'synced'
                  ? 'bg-green-100 text-green-600' 
                  : isDark 
                    ? 'bg-gray-600' 
                    : 'bg-gray-200'
            }`}>
              {syncStatus === 'syncing' ? (
                <i className="fas fa-spinner fa-spin"></i>
              ) : syncStatus === 'synced' ? (
                <i className="fas fa-check"></i>
              ) : (
                <i className="fas fa-cloud-sync-alt"></i>
              )}
            </div>
            <div>
              <h4 className="font-medium mb-1">
                {syncStatus === 'syncing' ? '正在同步数据...' : 
                 syncStatus === 'synced' ? '所有设备已同步' : '数据同步就绪'}
              </h4>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {syncStatus === 'syncing' ? '请勿关闭此页面，等待同步完成' : 
                 syncStatus === 'synced' ? '最近同步时间: 今天 14:30' : '上次同步: 今天 14:30'}
              </p>
            </div>
          </div>
          
          <div className={`flex items-center px-3 py-1.5 rounded-full text-sm ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <i className="fas fa-paper-plane mr-1.5 text-blue-500"></i>
            <span>{offlineWorks} 个作品待同步</span>
          </div>
        </div>
      </motion.div>

      {/* 已连接设备列表 */}
      <h4 className="font-medium mb-4">已连接设备</h4>
      <div className="space-y-4 mb-8">
        {connectedDevices.map((device) => (
          <motion.div
            key={device.id}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${
              isDark ? 'border-gray-600' : 'border-gray-200'
            } transition-all hover:shadow-md`}
            whileHover={{ y: -2 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="relative mr-4">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isDark ? 'bg-gray-600' : 'bg-gray-100'
                  }`}>
                    <i className={`fas fa-${getDeviceIcon(device.type)} text-xl`}></i>
                  </div>
                  <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${getStatusColor(device.status)}`}></span>
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center mb-1">
                    <h5 className="font-medium mr-2">{device.name}</h5>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isDark ? 'bg-gray-600' : 'bg-gray-100'
                    }`}>
                      {device.type === 'computer' ? '电脑' : device.type === 'mobile' ? '手机' : '平板'}
                    </span>
                  </div>
                  
                  <div className="flex text-xs opacity-70">
                    <span className="mr-3">最后活跃: {device.lastActive}</span>
                    {device.lastSynced && <span>最后同步: {device.lastSynced}</span>}
                  </div>
                </div>
                
                {device.batteryLevel !== undefined && (
                  <div className="flex flex-col items-end">
                    <div className="text-sm mb-1">
                      <i className={`fas fa-battery-${device.batteryLevel > 70 ? 'three-quarters' : 
                        device.batteryLevel > 50 ? 'half' : 
                        device.batteryLevel > 20 ? 'quarter' : 'empty'
                      } ${
                        device.batteryLevel < 20 ? 'text-red-500' : ''
                      }`}></i>
                      <span className="ml-1">{device.batteryLevel}%</span>
                    </div>
                    <button className={`px-3 py-1 rounded-lg text-xs ${
                      isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                    } transition-colors`}>
                      同步
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 最近同步内容 */}
      <h4 className="font-medium mb-4">最近同步内容</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {recentSyncs.map((content) => (
          <motion.div
            key={content.id}
            className={`rounded-xl overflow-hidden shadow-md border ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
            whileHover={{ y: -5 }}
          >
            <img 
              src={content.thumbnail} 
              alt={content.title} 
              className="w-full h-32 object-cover"
            />
            <div className={`p-3 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
              <h5 className="font-medium mb-1">{content.title}</h5>
              <div className="flex justify-between text-xs opacity-70">
                <span>{content.type}</span>
                <span>{content.device}</span>
              </div>
              <div className="text-xs opacity-70 mt-1">
                {content.syncedAt}
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
