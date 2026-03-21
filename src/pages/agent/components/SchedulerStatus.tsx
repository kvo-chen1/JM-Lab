import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { agentScheduler } from '../services/agentScheduler';
import { networkMonitor } from '../services/networkMonitor';
import { Wifi, WifiOff, Activity, Clock, Layers, ChevronDown } from 'lucide-react';

export default function SchedulerStatus() {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [stats, setStats] = useState({
    activeTasks: 0,
    pendingTasks: 0,
    completedTasks: 0,
    networkStatus: 'online' as 'online' | 'offline' | 'degraded'
  });

  // 监听状态变化
  useEffect(() => {
    const updateStats = () => {
      const schedulerStats = agentScheduler.getStats();
      setStats({
        activeTasks: schedulerStats.activeTasks || 0,
        pendingTasks: schedulerStats.pendingTasks || 0,
        completedTasks: schedulerStats.completedTasks || 0,
        networkStatus: networkMonitor.getStatus()
      });
    };

    // 初始更新
    updateStats();

    // 定期更新
    const interval = setInterval(updateStats, 2000);

    // 监听网络状态变化
    const unsubscribe = networkMonitor.on('status-change', () => {
      updateStats();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  // 获取网络状态图标
  const getNetworkIcon = () => {
    switch (stats.networkStatus) {
      case 'online':
        return <Wifi className="w-4 h-4 text-green-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-red-500" />;
      case 'degraded':
        return <Wifi className="w-4 h-4 text-yellow-500" />;
      default:
        return <Wifi className="w-4 h-4 text-gray-400" />;
    }
  };

  // 获取网络状态文本
  const getNetworkText = () => {
    switch (stats.networkStatus) {
      case 'online':
        return '在线';
      case 'offline':
        return '离线';
      case 'degraded':
        return '网络较差';
      default:
        return '未知';
    }
  };

  // 如果没有活跃任务且网络正常，显示简化状态
  if (stats.activeTasks === 0 && stats.pendingTasks === 0 && stats.networkStatus === 'online') {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs ${
          isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
        }`}
      >
        {getNetworkIcon()}
        <span>{getNetworkText()}</span>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className={`rounded-lg border overflow-hidden ${
        isDark 
          ? 'bg-gray-800/80 border-gray-700' 
          : 'bg-white/80 border-gray-200'
      }`}
    >
      {/* 头部 */}
      <div 
        className="flex items-center justify-between px-3 py-2 cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          {/* 网络状态 */}
          <div className="flex items-center gap-1.5">
            {getNetworkIcon()}
            <span className={`text-xs ${
              stats.networkStatus === 'online' ? 'text-green-500' :
              stats.networkStatus === 'offline' ? 'text-red-500' :
              'text-yellow-500'
            }`}>
              {getNetworkText()}
            </span>
          </div>

          {/* 任务统计 */}
          {stats.activeTasks > 0 && (
            <div className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
              <span className="text-xs text-blue-500">
                {stats.activeTasks} 个活跃任务
              </span>
            </div>
          )}

          {stats.pendingTasks > 0 && (
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-orange-500" />
              <span className="text-xs text-orange-500">
                {stats.pendingTasks} 个等待中
              </span>
            </div>
          )}
        </div>

        <motion.div
          animate={{ rotate: isExpanded ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronDown className="w-4 h-4 text-gray-400" />
        </motion.div>
      </div>

      {/* 详细信息 */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`px-3 pb-3 border-t ${
              isDark ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            <div className="grid grid-cols-3 gap-2 pt-3">
              {/* 活跃任务 */}
              <div className={`p-2 rounded-lg text-center ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Activity className="w-3.5 h-3.5 text-blue-500" />
                </div>
                <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stats.activeTasks}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  活跃任务
                </div>
              </div>

              {/* 等待任务 */}
              <div className={`p-2 rounded-lg text-center ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stats.pendingTasks}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  等待中
                </div>
              </div>

              {/* 已完成 */}
              <div className={`p-2 rounded-lg text-center ${
                isDark ? 'bg-gray-700/50' : 'bg-gray-50'
              }`}>
                <div className="flex items-center justify-center gap-1 mb-1">
                  <Layers className="w-3.5 h-3.5 text-green-500" />
                </div>
                <div className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stats.completedTasks}
                </div>
                <div className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  已完成
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
