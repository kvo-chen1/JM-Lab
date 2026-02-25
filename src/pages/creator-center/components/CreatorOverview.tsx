import React from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2,
  TrendingUp,
  Award,
  Zap,
  Target,
  ArrowRight,
  Sparkles,
  Loader2
} from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';
import { useCreatorCenter } from '@/hooks/useCreatorCenter';
import { Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';

const quickActions = [
  { label: '发布作品', desc: '分享你的创意', icon: Sparkles, color: 'from-blue-500 to-blue-600', path: '/create' },
  { label: '查看数据', desc: '分析作品表现', icon: TrendingUp, color: 'from-green-500 to-green-600', path: '/creator-center/analytics' },
  { label: '参与活动', desc: '赢取奖励', icon: Award, color: 'from-orange-500 to-orange-600', path: '/cultural-events' },
  { label: '提升等级', desc: '解锁更多权益', icon: Zap, color: 'from-purple-500 to-purple-600', path: '/achievements' },
];

const tasks = [
  { title: '完善个人资料', reward: '+50 积分', progress: 80 },
  { title: '发布首个作品', reward: '+100 积分', progress: 100, completed: true },
  { title: '获得10个赞', reward: '+30 积分', progress: 60 },
  { title: '关注5位创作者', reward: '+20 积分', progress: 40 },
];

// 格式化数字
const formatNumber = (num: number): string => {
  if (num >= 10000) {
    return (num / 10000).toFixed(1) + '万';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// 格式化日期
const formatDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  
  if (hours < 1) return '刚刚';
  if (hours < 24) return `${hours}小时前`;
  if (days < 7) return `${days}天前`;
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
};

const CreatorOverview: React.FC = () => {
  const { isDark } = useTheme();
  const { stats, works, level, loading, error, refresh } = useCreatorCenter();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; light: string }> = {
      blue: { bg: 'bg-blue-500', text: 'text-blue-500', light: 'bg-blue-50' },
      red: { bg: 'bg-red-500', text: 'text-red-500', light: 'bg-red-50' },
      green: { bg: 'bg-green-500', text: 'text-green-500', light: 'bg-green-50' },
      purple: { bg: 'bg-purple-500', text: 'text-purple-500', light: 'bg-purple-50' },
    };
    return colors[color] || colors.blue;
  };

  // 构建统计数据
  const statsData = stats ? [
    { label: '总浏览量', value: formatNumber(stats.totalViews), change: `+${stats.viewsChange}%`, icon: Eye, color: 'blue' },
    { label: '获赞数', value: formatNumber(stats.totalLikes), change: `+${stats.likesChange}%`, icon: Heart, color: 'red' },
    { label: '评论数', value: formatNumber(stats.totalComments), change: `+${stats.commentsChange}%`, icon: MessageCircle, color: 'green' },
    { label: '分享数', value: formatNumber(stats.totalShares), change: `+${stats.sharesChange}%`, icon: Share2, color: 'purple' },
  ] : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-96">
        <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          加载失败，请刷新重试
        </p>
      </div>
    );
  }

  // 等待认证状态检查
  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
      </div>
    );
  }

  // 未登录状态显示提示
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center h-96 space-y-4">
        <div className={`p-6 rounded-2xl text-center ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <Sparkles className="w-12 h-12 mx-auto mb-4 text-blue-500" />
          <h2 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            欢迎来到创作者中心
          </h2>
          <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            登录后即可查看你的创作数据、等级和收益
          </p>
          <Link to="/login">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium"
            >
              立即登录
            </motion.button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
            欢迎回来，创作者！
          </h1>
          <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {works.length > 0 ? `你已发布 ${works.length} 个作品，继续创作吧！` : '开始你的创作之旅，发布第一个作品吧！'}
          </p>
        </div>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg font-medium shadow-lg shadow-blue-500/25"
        >
          <Target className="w-4 h-4" />
          查看目标
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsData.map((stat, index) => {
          const colors = getColorClasses(stat.color);
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className={`p-5 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
                isDark ? 'border-gray-700' : 'border-gray-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`p-3 rounded-xl ${colors.light} ${isDark ? 'bg-opacity-10' : ''}`}>
                  <Icon className={`w-5 h-5 ${colors.text}`} />
                </div>
                <span className="text-xs font-medium text-green-500 bg-green-50 px-2 py-1 rounded-full">
                  {stat.change}
                </span>
              </div>
              <div className="mt-4">
                <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {stat.value}
                </p>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {stat.label}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
            isDark ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              快捷操作
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const Icon = action.icon;
                return (
                  <Link key={action.label} to={action.path}>
                    <motion.button
                      whileHover={{ y: -4 }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      className={`w-full p-4 rounded-xl text-left transition-all ${
                        isDark 
                          ? 'bg-gray-700/50 hover:bg-gray-700' 
                          : 'bg-gray-50 hover:bg-gray-100'
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-lg bg-gradient-to-br ${action.color} flex items-center justify-center mb-3`}>
                        <Icon className="w-5 h-5 text-white" />
                      </div>
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {action.label}
                      </p>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {action.desc}
                      </p>
                    </motion.button>
                  </Link>
                );
              })}
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
            isDark ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <div className="flex items-center justify-between mb-4">
              <h2 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                最近作品
              </h2>
              <Link to="/dashboard">
                <button className={`text-sm font-medium flex items-center gap-1 ${
                  isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'
                }`}>
                  查看全部
                  <ArrowRight className="w-4 h-4" />
                </button>
              </Link>
            </div>
            <div className="space-y-4">
              {works.length > 0 ? works.slice(0, 5).map((work, index) => (
                <motion.div
                  key={work.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`flex items-center gap-4 p-4 rounded-xl ${
                    isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'
                  } transition-colors cursor-pointer`}
                >
                  <div className={`w-16 h-16 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-200'} flex-shrink-0 overflow-hidden`}>
                    {work.thumbnail ? (
                      <img src={work.thumbnail} alt={work.title} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full rounded-lg bg-gradient-to-br from-blue-400 to-purple-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className={`font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {work.title}
                    </h3>
                    <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {formatDate(work.createdAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Eye className="w-4 h-4" />
                      {formatNumber(work.views)}
                    </div>
                    <div className={`flex items-center gap-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Heart className="w-4 h-4" />
                      {formatNumber(work.likes)}
                    </div>
                  </div>
                </motion.div>
              )) : (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <p>还没有发布作品，快去创作吧！</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
            isDark ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              创作者等级
            </h2>
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mx-auto">
                  <span className="text-3xl font-bold text-white">LV.{level?.level || 1}</span>
                </div>
                <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center">
                  <Award className="w-4 h-4 text-white" />
                </div>
              </div>
              <h3 className={`mt-4 font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {level?.name || '创作新手'}
              </h3>
              <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                距离下一等级还需 {level ? level.nextLevelXP - level.currentXP : 100} 积分
              </p>
              <div className="mt-4">
                <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-blue-500 to-purple-600 transition-all duration-500"
                    style={{ width: `${level?.progress || 0}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-500">
                  <span>{level?.currentXP || 0}/{level?.nextLevelXP || 100} 积分</span>
                  <span>LV.{(level?.level || 1) + 1}</span>
                </div>
              </div>
            </div>
          </div>

          <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm border ${
            isDark ? 'border-gray-700' : 'border-gray-100'
          }`}>
            <h2 className={`text-lg font-semibold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              每日任务
            </h2>
            <div className="space-y-4">
              {tasks.map((task, index) => (
                <div key={task.title} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                        task.completed
                          ? 'bg-green-500 border-green-500'
                          : isDark
                          ? 'border-gray-600'
                          : 'border-gray-300'
                      }`}>
                        {task.completed && <Zap className="w-3 h-3 text-white" />}
                      </div>
                      <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {task.title}
                      </span>
                    </div>
                    <span className="text-xs text-green-500 font-medium">{task.reward}</span>
                  </div>
                  <div className={`h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${task.progress}%` }}
                      transition={{ delay: index * 0.1, duration: 0.5 }}
                      className={`h-full rounded-full ${
                        task.completed
                          ? 'bg-green-500'
                          : 'bg-gradient-to-r from-blue-500 to-purple-500'
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreatorOverview;
