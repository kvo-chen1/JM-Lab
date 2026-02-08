import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAnalyticsStore } from '@/stores/useAnalyticsStore';
import { 
  Download, 
  FileJson, 
  FileSpreadsheet,
  Share2,
  Printer,
  Bell,
  TrendingUp,
  Flame,
  Users,
  Hash,
  RefreshCw
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { WorkPerformance, UserActivity, ThemeTrend, ExportFormat } from '@/services/analyticsService';
import analyticsService from '@/services/analyticsService';

interface RightSidebarProps {
  onExport: (format: ExportFormat) => void;
}

type TabType = 'works' | 'users' | 'themes';

export default function RightSidebar({ onExport }: RightSidebarProps) {
  const { isDark } = useTheme();
  const { isOnline, pendingActions, lastSyncTime } = useAnalyticsStore();
  const [activeTab, setActiveTab] = useState<TabType>('works');
  const [selectedItem, setSelectedItem] = useState<WorkPerformance | UserActivity | ThemeTrend | null>(null);
  
  // 排行榜数据状态
  const [topWorks, setTopWorks] = useState<WorkPerformance[]>([]);
  const [topUsers, setTopUsers] = useState<UserActivity[]>([]);
  const [topThemes, setTopThemes] = useState<ThemeTrend[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const cardClass = `${isDark ? 'bg-slate-800 border-slate-700' : 'bg-white border-slate-200'} border rounded-2xl overflow-hidden`;

  // 加载排行榜数据
  useEffect(() => {
    const loadRankingData = async () => {
      setIsLoading(true);
      try {
        const [works, users, themes] = await Promise.all([
          analyticsService.getWorksPerformance(5),
          analyticsService.getUserActivity(5),
          analyticsService.getThemeTrends(5),
        ]);
        setTopWorks(works);
        setTopUsers(users);
        setTopThemes(themes);
      } catch (error) {
        console.error('Failed to load ranking data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadRankingData();
  }, []);

  const formatNumber = (num: number) => {
    return num.toLocaleString('zh-CN');
  };

  return (
    <div className="space-y-4">
      {/* 实时状态监控 */}
      <div className={cardClass}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <RefreshCw className={`w-4 h-4 ${isOnline ? 'text-green-500' : 'text-red-500'}`} />
            实时状态
          </h3>
        </div>
        <div className="p-4 space-y-3">
          {/* 在线状态 */}
          <div className="flex items-center justify-between">
            <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>连接状态</span>
            <motion.div 
              className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-xs font-medium ${
                isOnline 
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' 
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
              }`}
            >
              <motion.span
                animate={isOnline ? { scale: [1, 1.2, 1] } : {}}
                transition={{ repeat: Infinity, duration: 2 }}
                className={`w-1.5 h-1.5 rounded-full ${isOnline ? 'bg-green-500' : 'bg-red-500'}`}
              />
              {isOnline ? '实时连接' : '离线模式'}
            </motion.div>
          </div>

          {/* 待同步操作 */}
          <AnimatePresence>
            {pendingActions.length > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center justify-between"
              >
                <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>待同步</span>
                <span className="px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400">
                  {pendingActions.length} 个操作
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* 最后更新时间 */}
          {lastSyncTime > 0 && (
            <div className="flex items-center justify-between">
              <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>最后更新</span>
              <span className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                {new Date(lastSyncTime).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* 快捷操作 */}
      <div className={cardClass}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Download className="w-4 h-4 text-blue-500" />
            快捷操作
          </h3>
        </div>
        <div className="p-3 grid grid-cols-2 gap-2">
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onExport('json')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isDark 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileJson className="w-4 h-4" />
            导出 JSON
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onExport('csv')}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isDark 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            导出 CSV
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isDark 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Share2 className="w-4 h-4" />
            分享报表
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-colors ${
              isDark 
                ? 'bg-slate-700 text-slate-300 hover:bg-slate-600' 
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Printer className="w-4 h-4" />
            打印视图
          </motion.button>
        </div>
      </div>

      {/* 热门排行榜 */}
      <div className={cardClass}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Flame className="w-4 h-4 text-orange-500" />
            热门排行
          </h3>
        </div>
        
        {/* Tab 切换 */}
        <div className={`flex border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          {[
            { id: 'works' as TabType, label: '作品', icon: Flame },
            { id: 'users' as TabType, label: '创作者', icon: Users },
            { id: 'themes' as TabType, label: '主题', icon: Hash },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 flex items-center justify-center gap-1 py-2 text-xs font-medium transition-colors ${
                  isActive
                    ? 'text-red-500 border-b-2 border-red-500'
                    : `${isDark ? 'text-slate-400 hover:text-slate-300' : 'text-slate-500 hover:text-slate-700'}`
                }`}
              >
                <Icon className="w-3 h-3" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* 排行榜内容 */}
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-6 h-6 border-2 border-red-200 border-t-red-500 rounded-full"
              />
            </div>
          ) : (
            <AnimatePresence mode="wait">
              {activeTab === 'works' && (
                <motion.div
                  key="works"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-1"
                >
                  {topWorks.map((work, index) => (
                    <motion.div
                      key={work.workId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 2 }}
                      className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedItem(work)}
                    >
                      <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                        index < 3 
                          ? 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' 
                          : `${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`
                      }`}>
                        {index + 1}
                      </span>
                      <img src={work.thumbnail} alt={work.title} className="w-8 h-8 rounded-lg object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{work.title}</p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatNumber(work.metrics.views)} 浏览
                        </p>
                      </div>
                      <span className={`text-xs ${
                        work.trend === 'up' ? 'text-green-500' : 
                        work.trend === 'down' ? 'text-red-500' : 'text-slate-400'
                      }`}>
                        {work.trend === 'up' ? '↑' : work.trend === 'down' ? '↓' : '→'}
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'users' && (
                <motion.div
                  key="users"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-1"
                >
                  {topUsers.map((user, index) => (
                    <motion.div
                      key={user.userId}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 2 }}
                      className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedItem(user)}
                    >
                      <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                        index < 3 
                          ? 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' 
                          : `${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`
                      }`}>
                        {index + 1}
                      </span>
                      <img src={user.avatar} alt={user.username} className="w-8 h-8 rounded-full object-cover" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{user.username}</p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          活跃度 {user.engagementScore}
                        </p>
                      </div>
                      <span className="text-xs text-slate-400">
                        {formatNumber(user.metrics.worksCreated)} 作品
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}

              {activeTab === 'themes' && (
                <motion.div
                  key="themes"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="space-y-1"
                >
                  {topThemes.map((theme, index) => (
                    <motion.div
                      key={theme.theme}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ x: 2 }}
                      className={`flex items-center gap-2 p-2 rounded-xl cursor-pointer transition-colors ${
                        isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-50'
                      }`}
                      onClick={() => setSelectedItem(theme)}
                    >
                      <span className={`w-5 h-5 flex items-center justify-center rounded text-xs font-bold ${
                        index < 3 
                          ? 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400' 
                          : `${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-100 text-slate-500'}`
                      }`}>
                        {index + 1}
                      </span>
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                        <Hash className="w-4 h-4 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">{theme.theme}</p>
                        <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                          {formatNumber(theme.worksCount)} 作品
                        </p>
                      </div>
                      <span className={`text-xs ${theme.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
                        {theme.growth > 0 ? '↑' : '↓'} {Math.abs(theme.growth)}%
                      </span>
                    </motion.div>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* 数据洞察 */}
      <div className={cardClass}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-slate-700' : 'border-slate-100'}`}>
          <h3 className="font-semibold text-sm flex items-center gap-2">
            <Bell className="w-4 h-4 text-yellow-500" />
            数据洞察
          </h3>
        </div>
        <div className="p-4 space-y-3">
          <div className={`flex items-start gap-2 p-2 rounded-lg ${isDark ? 'bg-green-900/20' : 'bg-green-50'}`}>
            <TrendingUp className="w-4 h-4 text-green-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>浏览量增长</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                本周浏览量较上周增长 23.5%
              </p>
            </div>
          </div>
          <div className={`flex items-start gap-2 p-2 rounded-lg ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
            <Users className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
            <div>
              <p className={`text-xs font-medium ${isDark ? 'text-blue-400' : 'text-blue-700'}`}>用户活跃</p>
              <p className={`text-[10px] ${isDark ? 'text-slate-400' : 'text-slate-500'} mt-0.5`}>
                今日活跃用户达到 1,234 人
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
