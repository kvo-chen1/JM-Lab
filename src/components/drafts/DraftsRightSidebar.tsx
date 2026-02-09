import { motion } from 'framer-motion';
import {
  Plus,
  Download,
  Trash2,
  Clock,
  FileText,
  Image,
  Box,
  HardDrive,
  TrendingUp,
  Zap,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

interface StorageStats {
  used: number;
  total: number;
  drafts: number;
  images: number;
  aiWritings: number;
}

interface RecentActivity {
  id: string;
  type: 'edit' | 'create' | 'delete' | 'export';
  title: string;
  time: string;
  toolType?: string;
}

interface DraftsRightSidebarProps {
  isDark: boolean;
  storageStats: StorageStats;
  recentActivities: RecentActivity[];
  onNewDraft: () => void;
  onExportAll: () => void;
  onClearOld: () => void;
  onActivityClick?: (activity: RecentActivity) => void;
}

export default function DraftsRightSidebar({
  isDark,
  storageStats,
  recentActivities,
  onNewDraft,
  onExportAll,
  onClearOld,
  onActivityClick
}: DraftsRightSidebarProps) {
  const usagePercentage = (storageStats.used / storageStats.total) * 100;

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'create':
        return <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
          <Plus className="w-4 h-4 text-green-600 dark:text-green-400" />
        </div>;
      case 'edit':
        return <div className="w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <FileText className="w-4 h-4 text-blue-600 dark:text-blue-400" />
        </div>;
      case 'export':
        return <div className="w-8 h-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
          <Download className="w-4 h-4 text-purple-600 dark:text-purple-400" />
        </div>;
      case 'delete':
        return <div className="w-8 h-8 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
          <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
        </div>;
      default:
        return <div className="w-8 h-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
          <MoreHorizontal className="w-4 h-4 text-gray-600 dark:text-gray-400" />
        </div>;
    }
  };

  const getActivityText = (type: string) => {
    switch (type) {
      case 'create': return '创建了';
      case 'edit': return '编辑了';
      case 'export': return '导出了';
      case 'delete': return '删除了';
      default: return '操作了';
    }
  };

  return (
    <div className="space-y-6">
      {/* 快捷操作 */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">快捷操作</h3>
        <div className="space-y-2">
          <motion.button
            onClick={onNewDraft}
            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 transition-all duration-300"
            whileHover={{ scale: 1.02, y: -2 }}
            whileTap={{ scale: 0.98 }}
          >
            <div className="w-8 h-8 rounded-lg bg-white/20 flex items-center justify-center">
              <Plus className="w-4 h-4" />
            </div>
            <div className="text-left">
              <div className="font-medium text-sm">新建创作</div>
              <div className="text-xs text-white/70">开始新的设计</div>
            </div>
            <ChevronRight className="w-4 h-4 ml-auto" />
          </motion.button>

          <div className="grid grid-cols-2 gap-2">
            <motion.button
              onClick={onExportAll}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Download className="w-4 h-4" />
              <span className="text-sm font-medium">批量导出</span>
            </motion.button>

            <motion.button
              onClick={onClearOld}
              className={`flex items-center justify-center gap-2 p-3 rounded-xl transition-all duration-300 ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-red-900/30 hover:text-red-400'
                  : 'bg-white text-gray-700 hover:bg-red-50 hover:text-red-600 border border-gray-200'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">清理旧稿</span>
            </motion.button>
          </div>
        </div>
      </div>

      {/* 存储统计 */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg`}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <HardDrive className="w-4 h-4 text-primary-500" />
            存储空间
          </h3>
          <span className="text-xs text-gray-500 dark:text-gray-400">
            {storageStats.used}MB / {storageStats.total}MB
          </span>
        </div>

        {/* 进度条 */}
        <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden mb-4`}>
          <motion.div
            className={`h-full rounded-full ${
              usagePercentage > 80
                ? 'bg-gradient-to-r from-red-500 to-orange-500'
                : usagePercentage > 50
                ? 'bg-gradient-to-r from-yellow-400 to-orange-500'
                : 'bg-gradient-to-r from-primary-500 to-primary-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${usagePercentage}%` }}
            transition={{ duration: 1, delay: 0.5 }}
          />
        </div>

        {/* 分类统计 */}
        <div className="grid grid-cols-3 gap-3">
          <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <FileText className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">草稿</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{storageStats.drafts}</div>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Image className="w-3.5 h-3.5 text-purple-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">图片</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{storageStats.images}</div>
          </div>
          <div className={`p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
            <div className="flex items-center gap-1.5 mb-1">
              <Box className="w-3.5 h-3.5 text-emerald-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">AI写作</span>
            </div>
            <div className="text-lg font-bold text-gray-900 dark:text-white">{storageStats.aiWritings}</div>
          </div>
        </div>
      </div>

      {/* 本月统计 */}
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border shadow-lg`}>
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-primary-500" />
          本月创作
        </h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-600 flex items-center justify-center">
              <Zap className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">12</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">新建草稿</div>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center">
              <Clock className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">8.5h</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">创作时长</div>
            </div>
          </div>
        </div>
      </div>

      {/* 最近动态 */}
      {recentActivities.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <Clock className="w-4 h-4 text-primary-500" />
              最近动态
            </h3>
          </div>
          <div className="space-y-3">
            {recentActivities.slice(0, 5).map((activity, index) => (
              <motion.div
                key={activity.id}
                onClick={() => onActivityClick?.(activity)}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all duration-300 ${
                  isDark ? 'hover:bg-gray-800' : 'hover:bg-gray-50'
                }`}
                whileHover={{ x: 4 }}
              >
                {getActivityIcon(activity.type)}
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 dark:text-white truncate">
                    {getActivityText(activity.type)}
                    <span className="font-medium">{activity.title}</span>
                  </div>
                  <div className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
