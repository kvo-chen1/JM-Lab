import { useState, useEffect, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import {
  Calendar,
  ChevronLeft,
  ChevronRight,
  Gift,
  Flame,
  Star,
  Trophy,
  Crown,
  Gem,
  CheckCircle2,
  Clock,
  TrendingUp,
  Zap,
  History,
  Sparkles,
  ArrowRight,
  Home,
  Compass,
  MessageCircle,
  Award,
  Bookmark,
  Heart,
  FileText,
  Users,
  Bell,
  Settings,
  Target,
  Coins
} from 'lucide-react';
import checkinService, { CheckinStatus, CheckinRecord } from '@/services/checkinService';
import { useSupabasePoints } from '@/hooks/useSupabasePoints';
import achievementService from '@/services/achievementService';

// 签到奖励配置
interface StreakReward {
  day: number;
  name: string;
  description: string;
  icon: React.ElementType;
  points: number;
  gradient: string;
}

const STREAK_REWARDS: StreakReward[] = [
  { day: 1, name: '每日签到', description: '基础签到奖励', icon: Gift, points: 5, gradient: 'from-blue-500 to-cyan-500' },
  { day: 3, name: '连续3天', description: '坚持就是胜利', icon: Star, points: 10, gradient: 'from-yellow-400 to-orange-500' },
  { day: 7, name: '一周达人', description: '周签到里程碑', icon: Trophy, points: 30, gradient: 'from-purple-500 to-pink-500' },
  { day: 15, name: '半月成就', description: '半月签到大师', icon: Crown, points: 50, gradient: 'from-amber-500 to-red-500' },
  { day: 30, name: '月度传奇', description: '全勤签到王者', icon: Gem, points: 100, gradient: 'from-emerald-500 to-teal-500' },
];

// 导航菜单
const navItems = [
  { icon: Home, label: '首页', href: '/' },
  { icon: Compass, label: '广场', href: '/square' },
  { icon: Sparkles, label: '创作', href: '/create' },
  { icon: MessageCircle, label: '社区', href: '/community' },
  { icon: Award, label: '成就', href: '/achievement-museum' },
];

// 快捷操作
const quickActions = [
  { icon: Bookmark, label: '收藏', href: '/collection', color: 'from-amber-400 to-orange-500' },
  { icon: Heart, label: '点赞', href: '/collection?tab=likes', color: 'from-rose-400 to-pink-500' },
  { icon: FileText, label: '草稿', href: '/drafts', color: 'from-violet-400 to-purple-500' },
  { icon: Users, label: '好友', href: '/friends', color: 'from-emerald-400 to-teal-500' },
];

export default function Checkin() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useContext(AuthContext);
  
  // 使用 Supabase 积分服务
  const {
    balance,
    hasCheckinToday,
    checkinRecords,
    checkin,
    isLoading: pointsLoading
  } = useSupabasePoints();

  const [currentDate, setCurrentDate] = useState(new Date());
  const [checkinHistory, setCheckinHistory] = useState<string[]>([]);
  const [isCheckInAnimating, setIsCheckInAnimating] = useState(false);
  const [creatorLevelInfo, setCreatorLevelInfo] = useState(() => achievementService.getCreatorLevelInfo());
  const [showConfetti, setShowConfetti] = useState(false);

  // 获取连续签到天数
  const consecutiveDays = checkinRecords[0]?.consecutive_days || 0;
  const totalCheckins = checkinRecords.length;

  // 加载签到历史
  useEffect(() => {
    const history = checkinRecords.map(record => record.date);
    setCheckinHistory(history);
  }, [checkinRecords]);

  // 处理签到
  const handleCheckIn = async () => {
    if (hasCheckinToday || isCheckInAnimating) return;
    
    setIsCheckInAnimating(true);
    const result = await checkin();
    
    if (result.success) {
      setShowConfetti(true);
      toast.success(
        <div className="flex flex-col gap-1">
          <span className="font-bold text-lg">🎉 签到成功！</span>
          <span className="text-sm opacity-90">获得 {result.points} 积分</span>
        </div>,
        { duration: 3000 }
      );
      
      setTimeout(() => {
        setIsCheckInAnimating(false);
        setShowConfetti(false);
      }, 1500);
    } else {
      setIsCheckInAnimating(false);
      toast.error(result.error || '签到失败');
    }
  };

  // 生成日历数据
  const generateCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();
    const today = new Date();

    const days = [];
    
    // 填充月初空白
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ date: null, isToday: false, isChecked: false, canRetroactive: false });
    }

    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = day === today.getDate() && month === today.getMonth() && year === today.getFullYear();
      const isChecked = checkinHistory.includes(dateStr);
      const isPast = new Date(year, month, day) < new Date(today.getFullYear(), today.getMonth(), today.getDate());
      const canRetroactive = isPast && !isChecked;

      days.push({
        date: day,
        dateStr,
        isToday,
        isChecked,
        canRetroactive
      });
    }

    return days;
  };

  const calendarDays = generateCalendarDays();
  const weekDays = ['日', '一', '二', '三', '四', '五', '六'];

  // 切换月份
  const changeMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  // 获取下一个奖励
  const getNextReward = () => {
    return STREAK_REWARDS.find(reward => reward.day > consecutiveDays) || STREAK_REWARDS[STREAK_REWARDS.length - 1];
  };

  const nextReward = getNextReward();
  const daysToNextReward = nextReward.day - consecutiveDays;

  // 计算本月进度
  const currentMonthDays = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const currentMonthCheckins = checkinHistory.filter(date => {
    const d = new Date(date);
    return d.getMonth() === currentDate.getMonth() && d.getFullYear() === currentDate.getFullYear();
  }).length;
  const monthProgress = (currentMonthCheckins / currentMonthDays) * 100;

  if (!isAuthenticated) {
    navigate('/login');
    return null;
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f8f9fc]'} transition-colors duration-300`}>
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-purple-500/10 to-pink-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 left-1/3 w-96 h-96 bg-gradient-to-br from-amber-500/10 to-orange-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-[1600px] mx-auto px-4 py-6">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/dashboard')}
              className={`p-3 rounded-2xl ${isDark ? 'bg-gray-800/60 hover:bg-gray-700/60' : 'bg-white/80 hover:bg-white'} backdrop-blur-xl border ${isDark ? 'border-gray-700/50' : 'border-white/50'} shadow-lg transition-all`}
            >
              <ChevronLeft className="w-5 h-5" />
            </motion.button>
            <div>
              <h1 className={`text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r ${isDark ? 'from-white to-gray-400' : 'from-gray-900 to-gray-600'}`}>
                每日签到
              </h1>
              <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                坚持签到，解锁丰厚奖励
              </p>
            </div>
          </div>
        </motion.div>

        {/* 三栏式主体布局 */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* 左侧栏 - 用户信息和导航 */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* 用户卡片 */}
            <div className={`p-6 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <div className="flex flex-col items-center text-center">
                {/* 头像 */}
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full p-1 bg-gradient-to-br from-purple-500 via-pink-500 to-orange-500">
                    {user?.avatar && user.avatar.trim() ? (
                      <img
                        src={user.avatar}
                        alt={user.username}
                        className="w-full h-full rounded-full object-cover border-4 border-white dark:border-gray-800"
                      />
                    ) : (
                      <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold border-4 border-white dark:border-gray-800">
                        {user?.username?.charAt(0) || 'U'}
                      </div>
                    )}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg">
                    <Crown className="w-4 h-4" />
                  </div>
                </div>

                {/* 用户信息 */}
                <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  {user?.username}
                </h2>
                <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {creatorLevelInfo.currentLevel.name}
                </p>

                {/* 积分 */}
                <div className="flex items-center gap-2 mt-3 px-4 py-2 rounded-full bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20">
                  <Coins className="w-4 h-4 text-yellow-500" />
                  <span className={`font-semibold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>
                    {pointsLoading ? '...' : (balance?.balance || 0)} 积分
                  </span>
                </div>

                {/* 等级进度 */}
                <div className="w-full mt-6">
                  <div className="flex justify-between text-xs mb-2">
                    <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>等级进度</span>
                    <span className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                      {Math.min(100, Math.round(((balance?.balance || 0) / (creatorLevelInfo.nextLevel?.requiredPoints || 100)) * 100))}%
                    </span>
                  </div>
                  <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, ((balance?.balance || 0) / (creatorLevelInfo.nextLevel?.requiredPoints || 100)) * 100)}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 主导航 */}
            <div className={`p-4 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <nav className="space-y-1">
                {navItems.map((item, index) => {
                  const Icon = item.icon;
                  const isActive = item.label === '首页';
                  return (
                    <motion.div
                      key={item.label}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      whileHover={{ x: 4 }}
                      className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all cursor-pointer ${
                        isActive
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                          : isDark
                            ? 'text-gray-300 hover:bg-gray-700/50'
                            : 'text-gray-600 hover:bg-gray-100/50'
                      }`}
                      onClick={() => navigate(item.href)}
                    >
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </motion.div>
                  );
                })}
              </nav>
            </div>

            {/* 快捷操作 */}
            <div className={`p-6 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <h3 className={`font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-900'}`}>快捷操作</h3>
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action, index) => {
                  const Icon = action.icon;
                  return (
                    <motion.div
                      key={action.label}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.05 * index }}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className="flex flex-col items-center p-4 rounded-2xl hover:bg-gray-100 dark:hover:bg-gray-700/50 transition-colors cursor-pointer"
                      onClick={() => navigate(action.href)}
                    >
                      <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${action.color} flex items-center justify-center text-white shadow-lg mb-2`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className={`text-xs font-medium ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                        {action.label}
                      </span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* 中间主内容区 */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-6 space-y-6"
          >
            {/* 签到状态卡片 */}
            <div className={`p-8 rounded-3xl ${isDark
              ? 'bg-gradient-to-br from-purple-900/40 to-pink-900/40 backdrop-blur-xl border border-purple-500/20'
              : 'bg-gradient-to-br from-purple-50 to-pink-50 backdrop-blur-xl border border-purple-100'
              }`}>
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    连续签到 {consecutiveDays} 天
                  </h2>
                  <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    再签到 {daysToNextReward} 天可获得 {nextReward.points} 积分奖励
                  </p>
                </div>
                <div className={`p-4 rounded-2xl ${isDark ? 'bg-purple-500/20' : 'bg-purple-100'}`}>
                  <Flame className={`w-8 h-8 ${isDark ? 'text-purple-400' : 'text-purple-600'}`} />
                </div>
              </div>

              {/* 签到按钮 */}
              <div className="relative">
                <motion.button
                  onClick={handleCheckIn}
                  whileHover={{ scale: hasCheckinToday ? 1 : 1.02 }}
                  whileTap={{ scale: hasCheckinToday ? 1 : 0.98 }}
                  disabled={hasCheckinToday || isCheckInAnimating}
                  className={`w-full py-6 rounded-2xl font-bold text-xl transition-all relative overflow-hidden ${
                    hasCheckinToday
                      ? 'bg-gradient-to-r from-green-500 to-emerald-500 cursor-default'
                      : isCheckInAnimating
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                        : 'bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500 hover:from-purple-600 hover:via-pink-600 hover:to-orange-600'
                  } text-white shadow-xl shadow-purple-500/25`}
                >
                  <AnimatePresence mode="wait">
                    {hasCheckinToday ? (
                      <motion.span
                        key="checked"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-6 h-6" />
                        今日已签到
                      </motion.span>
                    ) : isCheckInAnimating ? (
                      <motion.span
                        key="checking"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.2 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Sparkles className="w-6 h-6 animate-spin" />
                        签到中...
                      </motion.span>
                    ) : (
                      <motion.span
                        key="checkin"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex items-center justify-center gap-2"
                      >
                        <Gift className="w-6 h-6" />
                        立即签到 +5 积分
                      </motion.span>
                    )}
                  </AnimatePresence>
                  
                  {/* 按钮光效 */}
                  {!hasCheckinToday && (
                    <motion.div
                      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                      animate={{ x: ['-100%', '100%'] }}
                      transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                    />
                  )}
                </motion.button>

                {/* 彩纸效果 */}
                <AnimatePresence>
                  {showConfetti && (
                    <>
                      {[...Array(20)].map((_, i) => (
                        <motion.div
                          key={i}
                          initial={{ 
                            opacity: 1, 
                            y: 0, 
                            x: 0,
                            scale: 1
                          }}
                          animate={{ 
                            opacity: 0, 
                            y: -100 - Math.random() * 100,
                            x: (Math.random() - 0.5) * 200,
                            scale: 0,
                            rotate: Math.random() * 360
                          }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 1, ease: 'easeOut' }}
                          className="absolute top-1/2 left-1/2 w-3 h-3 rounded-full"
                          style={{
                            backgroundColor: ['#f472b6', '#a78bfa', '#34d399', '#fbbf24', '#60a5fa'][i % 5]
                          }}
                        />
                      ))}
                    </>
                  )}
                </AnimatePresence>
              </div>

              {/* 连续签到进度 */}
              <div className="mt-6">
                <div className="flex justify-between text-sm mb-2">
                  <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>连续签到进度</span>
                  <span className={`font-medium ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
                    {consecutiveDays} / {nextReward.day} 天
                  </span>
                </div>
                <div className={`h-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(100, (consecutiveDays / nextReward.day) * 100)}%` }}
                    transition={{ duration: 0.8, ease: 'easeOut' }}
                    className="h-full rounded-full bg-gradient-to-r from-purple-500 via-pink-500 to-orange-500"
                  />
                </div>
              </div>
            </div>

            {/* 签到日历 */}
            <div className={`p-6 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              {/* 日历头部 */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl ${isDark ? 'bg-blue-500/20' : 'bg-blue-100'}`}>
                    <Calendar className={`w-5 h-5 ${isDark ? 'text-blue-400' : 'text-blue-600'}`} />
                  </div>
                  <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>签到日历</h3>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => changeMonth('prev')}
                    className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </motion.button>
                  <span className={`font-medium min-w-[100px] text-center ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {currentDate.getFullYear()}年{currentDate.getMonth() + 1}月
                  </span>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => changeMonth('next')}
                    className={`p-2 rounded-xl ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <ChevronRight className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              {/* 星期标题 */}
              <div className="grid grid-cols-7 gap-2 mb-3">
                {weekDays.map(day => (
                  <div key={day} className={`text-center text-sm font-medium py-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {day}
                  </div>
                ))}
              </div>

              {/* 日期网格 */}
              <div className="grid grid-cols-7 gap-2">
                {calendarDays.map((day, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.01 }}
                    className="aspect-square"
                  >
                    {day.date ? (
                      <motion.button
                        whileHover={day.canRetroactive ? { scale: 1.1 } : {}}
                        whileTap={day.canRetroactive ? { scale: 0.95 } : {}}
                        disabled={!day.canRetroactive}
                        className={`w-full h-full rounded-xl flex items-center justify-center text-sm font-medium transition-all ${
                          day.isToday
                            ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/30'
                            : day.isChecked
                              ? 'bg-gradient-to-br from-green-500 to-emerald-500 text-white'
                              : day.canRetroactive
                                ? `${isDark ? 'bg-gray-700 hover:bg-red-500/20' : 'bg-gray-100 hover:bg-red-50'} text-red-500 border-2 border-dashed border-red-300`
                                : `${isDark ? 'bg-gray-700/50' : 'bg-gray-100'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`
                        }`}
                      >
                        {day.isChecked ? (
                          <CheckCircle2 className="w-5 h-5" />
                        ) : day.canRetroactive ? (
                          <span className="text-xs">补</span>
                        ) : (
                          day.date
                        )}
                      </motion.button>
                    ) : (
                      <div />
                    )}
                  </motion.div>
                ))}
              </div>

              {/* 图例 */}
              <div className={`flex items-center justify-center gap-6 mt-4 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-green-500 to-emerald-500" />
                  <span>已签到</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-lg bg-gradient-to-br from-purple-500 to-pink-500" />
                  <span>今日</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 rounded-lg border-2 border-dashed border-red-300" />
                  <span>可补签</span>
                </div>
              </div>
            </div>

            {/* 本月统计 */}
            <div className="grid grid-cols-3 gap-4">
              {[
                { label: '本月签到', value: currentMonthCheckins, icon: Calendar, color: 'from-blue-500 to-cyan-500' },
                { label: '连续天数', value: consecutiveDays, icon: Flame, color: 'from-orange-500 to-red-500' },
                { label: '累计签到', value: totalCheckins, icon: Trophy, color: 'from-purple-500 to-pink-500' },
              ].map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`p-5 rounded-2xl ${isDark
                      ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
                      : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
                      }`}
                  >
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center text-white shadow-lg mb-3`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{stat.value}</p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* 右侧栏 - 奖励和记录 */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="lg:col-span-3 space-y-6"
          >
            {/* 今日奖励 */}
            <div className={`p-6 rounded-3xl ${isDark
              ? 'bg-gradient-to-br from-amber-900/20 to-orange-900/20 backdrop-blur-xl border border-amber-500/20'
              : 'bg-gradient-to-br from-amber-50 to-orange-50 backdrop-blur-xl border border-amber-100'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <Gift className="w-5 h-5" />
                </div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>今日奖励</h3>
              </div>
              
              <div className={`p-4 rounded-2xl ${isDark ? 'bg-gray-800/50' : 'bg-white/60'} backdrop-blur-sm`}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white">
                    <Coins className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={`font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>每日签到</p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>基础积分奖励</p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <span className={`text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-orange-500`}>
                    +5 积分
                  </span>
                  <span className={`text-xs px-2 py-1 rounded-full ${hasCheckinToday ? 'bg-green-500/20 text-green-400' : 'bg-amber-500/20 text-amber-400'}`}>
                    {hasCheckinToday ? '已领取' : '待领取'}
                  </span>
                </div>
              </div>
            </div>

            {/* 连续签到奖励 */}
            <div className={`p-6 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                  <Trophy className="w-5 h-5" />
                </div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>连续签到奖励</h3>
              </div>

              <div className="space-y-3">
                {STREAK_REWARDS.map((reward, index) => {
                  const Icon = reward.icon;
                  const isAchieved = consecutiveDays >= reward.day;
                  const isNext = consecutiveDays < reward.day && (index === 0 || consecutiveDays >= STREAK_REWARDS[index - 1].day);
                  
                  return (
                    <motion.div
                      key={reward.day}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`p-4 rounded-2xl transition-all ${
                        isAchieved
                          ? `${isDark ? 'bg-green-500/10 border border-green-500/30' : 'bg-green-50 border border-green-200'}`
                          : isNext
                            ? `${isDark ? 'bg-purple-500/10 border border-purple-500/30' : 'bg-purple-50 border border-purple-200'}`
                            : `${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${reward.gradient} flex items-center justify-center text-white shadow-lg ${!isAchieved && !isNext ? 'opacity-50' : ''}`}>
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-900'} ${!isAchieved && !isNext ? 'opacity-50' : ''}`}>
                              {reward.name}
                            </p>
                            {isAchieved && (
                              <CheckCircle2 className="w-4 h-4 text-green-500" />
                            )}
                          </div>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'} ${!isAchieved && !isNext ? 'opacity-50' : ''}`}>
                            {reward.day} 天 · {reward.points} 积分
                          </p>
                        </div>
                      </div>
                      
                      {isNext && (
                        <div className="mt-3">
                          <div className={`h-1.5 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${Math.min(100, (consecutiveDays / reward.day) * 100)}%` }}
                              transition={{ duration: 0.5 }}
                              className={`h-full rounded-full bg-gradient-to-r ${reward.gradient}`}
                            />
                          </div>
                          <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            还差 {reward.day - consecutiveDays} 天
                          </p>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>

            {/* 最近签到记录 */}
            <div className={`p-6 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg shadow-gray-200/30'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 text-white">
                  <History className="w-5 h-5" />
                </div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>最近记录</h3>
              </div>

              <div className="space-y-3">
                {checkinRecords.slice(0, 5).map((record, index) => (
                  <motion.div
                    key={record.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gray-700/30' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-lg ${isDark ? 'bg-green-500/20' : 'bg-green-100'} flex items-center justify-center`}>
                        <CheckCircle2 className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
                      </div>
                      <div>
                        <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
                          {record.date}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          连续 {record.consecutive_days} 天
                        </p>
                      </div>
                    </div>
                    <span className={`text-sm font-bold ${isDark ? 'text-green-400' : 'text-green-600'}`}>
                      +{record.points}
                    </span>
                  </motion.div>
                ))}
                
                {checkinRecords.length === 0 && (
                  <div className={`text-center py-6 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    <History className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">暂无签到记录</p>
                  </div>
                )}
              </div>
            </div>

            {/* 积分获取方式 */}
            <div className={`p-6 rounded-3xl ${isDark
              ? 'bg-gradient-to-br from-blue-900/20 to-cyan-900/20 backdrop-blur-xl border border-blue-500/20'
              : 'bg-gradient-to-br from-blue-50 to-cyan-50 backdrop-blur-xl border border-blue-100'
              }`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 text-white">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>获取积分</h3>
              </div>

              <div className="space-y-3">
                {[
                  { icon: Calendar, text: '每日签到', points: '+5', color: 'from-purple-500 to-pink-500' },
                  { icon: FileText, text: '发布作品', points: '+10', color: 'from-blue-500 to-cyan-500' },
                  { icon: Heart, text: '获得点赞', points: '+2', color: 'from-rose-500 to-pink-500' },
                  { icon: Target, text: '完成任务', points: '+20', color: 'from-amber-500 to-orange-500' },
                ].map((item, index) => {
                  const Icon = item.icon;
                  return (
                    <motion.div
                      key={item.text}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className={`flex items-center justify-between p-3 rounded-xl ${isDark ? 'bg-gray-800/50' : 'bg-white/60'}`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${item.color} flex items-center justify-center text-white`}>
                          <Icon className="w-4 h-4" />
                        </div>
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{item.text}</span>
                      </div>
                      <span className={`text-sm font-bold ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>{item.points}</span>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
