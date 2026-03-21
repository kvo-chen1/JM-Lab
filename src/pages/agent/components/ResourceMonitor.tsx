import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { getResourceManager, ResourceUsage } from '../services/resourceManager';
import { HardDrive, MemoryStick, Trash2, Activity, ChevronDown, AlertTriangle } from 'lucide-react';
import { toast } from 'sonner';

export default function ResourceMonitor() {
  const { isDark } = useTheme();
  const [isExpanded, setIsExpanded] = useState(false);
  const [usage, setUsage] = useState<ResourceUsage | null>(null);
  const [isCleaning, setIsCleaning] = useState(false);

  const resourceManager = getResourceManager();

  // 监听资源使用情况
  useEffect(() => {
    const updateUsage = () => {
      const currentUsage = resourceManager.getUsage();
      setUsage(currentUsage);
    };

    // 初始更新
    updateUsage();

    // 定期更新
    const interval = setInterval(updateUsage, 5000);

    return () => clearInterval(interval);
  }, []);

  // 手动清理
  const handleCleanup = async () => {
    setIsCleaning(true);
    try {
      await resourceManager.forceCleanup();
      toast.success('资源清理完成');
      // 更新显示
      const currentUsage = resourceManager.getUsage();
      setUsage(currentUsage);
    } catch (error) {
      toast.error('清理失败');
    } finally {
      setIsCleaning(false);
    }
  };

  // 如果没有数据，不显示
  if (!usage) {
    return null;
  }

  // 计算使用率
  const getUsagePercent = (current: number, max: number) => {
    return Math.min(100, Math.round((current / max) * 100));
  };

  // 获取使用率颜色
  const getUsageColor = (percent: number) => {
    if (percent >= 90) return 'bg-red-500';
    if (percent >= 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  // 资源项配置
  const resourceItems = [
    { key: 'messages', label: '消息', icon: Activity, max: 100 },
    { key: 'behaviorRecords', label: '行为记录', icon: Activity, max: 500 },
    { key: 'cachedResponses', label: '缓存响应', icon: MemoryStick, max: 50 },
    { key: 'generatedContent', label: '生成内容', icon: HardDrive, max: 20 },
    { key: 'tasks', label: '任务', icon: Activity, max: 100 }
  ];

  // 检查是否有高使用率
  const hasHighUsage = resourceItems.some(item => 
    getUsagePercent(usage[item.key as keyof ResourceUsage] as number, item.max) >= 80
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
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
        <div className="flex items-center gap-2">
          <HardDrive className={`w-4 h-4 ${hasHighUsage ? 'text-yellow-500' : 'text-blue-500'}`} />
          <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-700'}`}>
            资源使用
          </span>
          {hasHighUsage && (
            <AlertTriangle className="w-3.5 h-3.5 text-yellow-500" />
          )}
        </div>
        
        <div className="flex items-center gap-2">
          {/* 内存估算 */}
          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {usage.memoryEstimate.toFixed(1)} MB
          </span>
          <motion.div
            animate={{ rotate: isExpanded ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            <ChevronDown className="w-4 h-4 text-gray-400" />
          </motion.div>
        </div>
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
            <div className="space-y-2 pt-3">
              {resourceItems.map((item) => {
                const value = usage[item.key as keyof ResourceUsage] as number;
                const percent = getUsagePercent(value, item.max);
                const Icon = item.icon;

                return (
                  <div key={item.key} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5">
                        <Icon className="w-3.5 h-3.5 text-gray-400" />
                        <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>
                          {item.label}
                        </span>
                      </div>
                      <span className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {value} / {item.max}
                      </span>
                    </div>
                    {/* 进度条 */}
                    <div className={`h-1.5 rounded-full overflow-hidden ${
                      isDark ? 'bg-gray-700' : 'bg-gray-200'
                    }`}>
                      <motion.div
                        className={`h-full ${getUsageColor(percent)}`}
                        initial={{ width: 0 }}
                        animate={{ width: `${percent}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 清理按钮 */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleCleanup();
              }}
              disabled={isCleaning}
              className={`w-full mt-3 flex items-center justify-center gap-2 py-2 rounded-lg text-sm transition-colors ${
                isDark 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              } disabled:opacity-50`}
            >
              <Trash2 className={`w-4 h-4 ${isCleaning ? 'animate-spin' : ''}`} />
              {isCleaning ? '清理中...' : '立即清理'}
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
