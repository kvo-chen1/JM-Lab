import { useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, Link } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { toast } from 'sonner';
import { useSupabasePoints } from '@/hooks/useSupabasePoints';
import achievementService from '@/services/achievementService';
import {
  Bookmark,
  Heart,
  Settings,
  FileText,
  Users,
  Bell,
  Award,
  Zap,
  Crown,
  Star,
  Gift,
  CheckCircle2,
  ChevronRight,
  Eye,
  ThumbsUp,
  Image,
  Flame,
  LogOut,
  Edit3,
  Palette,
  Shield,
  HelpCircle,
  Moon,
  Sun,
  Sparkles,
  TrendingUp,
  Clock,
  Target,
  Menu,
  X
} from 'lucide-react';

// 动画配置
const ANIMATION_CONFIG = {
  spring: { type: 'spring' as const, stiffness: 400, damping: 30 },
  springSoft: { type: 'spring' as const, stiffness: 300, damping: 25 },
  fadeInUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  scale: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } },
  stagger: { staggerChildren: 0.05 }
};

// 卡片组件
const Card = ({ children, className = '', onClick, delay = 0 }: { 
  children: React.ReactNode; 
  className?: string; 
  onClick?: () => void;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ ...ANIMATION_CONFIG.springSoft, delay }}
    whileHover={{ scale: onClick ? 1.01 : 1 }}
    whileTap={{ scale: onClick ? 0.98 : 1 }}
    onClick={onClick}
    className={`
      bg-white dark:bg-gray-800/80 
      backdrop-blur-xl 
      rounded-2xl 
      shadow-sm 
      border border-gray-100 dark:border-gray-700/50
      overflow-hidden
      ${onClick ? 'cursor-pointer active:scale-[0.98] transition-transform' : ''}
      ${className}
    `}
  >
    {children}
  </motion.div>
);

// 菜单项组件
const MenuItem = ({ 
  icon: Icon, 
  label, 
  value, 
  badge, 
  onClick, 
  color = 'blue',
  delay = 0 
}: { 
  icon: any; 
  label: string; 
  value?: string | number; 
  badge?: number;
  onClick?: () => void;
  color?: 'blue' | 'purple' | 'pink' | 'orange' | 'green' | 'red' | 'amber' | 'cyan';
  delay?: number;
}) => {
  const colorMap = {
    blue: 'from-blue-500 to-cyan-500',
    purple: 'from-purple-500 to-violet-500',
    pink: 'from-pink-500 to-rose-500',
    orange: 'from-orange-500 to-amber-500',
    green: 'from-emerald-500 to-teal-500',
    red: 'from-red-500 to-rose-500',
    amber: 'from-amber-500 to-yellow-500',
    cyan: 'from-cyan-500 to-blue-500'
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ ...ANIMATION_CONFIG.spring, delay }}
      whileHover={{ x: 4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="
        w-full flex items-center gap-4 p-4 
        min-h-[56px]
        hover:bg-gray-50 dark:hover:bg-gray-700/50 
        transition-colors
        active:bg-gray-100 dark:active:bg-gray-600/50
      "
    >
      <div className={`
        w-10 h-10 rounded-xl 
        bg-gradient-to-br ${colorMap[color]} 
        flex items-center justify-center 
        text-white shadow-lg shadow-${color}-500/20
        flex-shrink-0
      `}>
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 text-left">
        <span className="font-medium text-gray-900 dark:text-gray-100">{label}</span>
        {value && (
          <span className="ml-2 text-sm text-gray-500 dark:text-gray-400">{value}</span>
        )}
      </div>
      {badge !== undefined && badge > 0 && (
        <span className="
          px-2 py-0.5 
          bg-red-500 text-white 
          text-xs font-bold 
          rounded-full
          min-w-[20px] text-center
        ">
          {badge > 99 ? '99+' : badge}
        </span>
      )}
      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
    </motion.button>
  );
};

// 统计卡片组件
const StatCard = ({
  icon: Icon,
  label,
  value,
  trend,
  color,
  delay = 0
}: {
  icon: any;
  label: string;
  value: number;
  trend?: number;
  color: string;
  delay?: number;
}) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ ...ANIMATION_CONFIG.spring, delay }}
    whileHover={{ y: -4, scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className="
      bg-white dark:bg-gray-800/80
      backdrop-blur-xl
      rounded-2xl
      p-3 sm:p-4
      shadow-sm
      border border-gray-100 dark:border-gray-700/50
      min-h-[90px] sm:min-h-[100px]
      flex flex-col justify-between
    "
  >
    <div className="flex items-start justify-between">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 mb-0.5 sm:mb-1 truncate">{label}</p>
        <p className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">{value.toLocaleString()}</p>
      </div>
      <div className={`
        w-8 h-8 sm:w-9 sm:h-9 rounded-xl
        bg-gradient-to-br ${color}
        flex items-center justify-center
        text-white shadow-lg
        flex-shrink-0 ml-2
      `}>
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
    </div>
    {trend !== undefined && (
      <div className="flex items-center gap-1 mt-1 sm:mt-2">
        <span className={`text-[10px] sm:text-xs font-medium ${trend >= 0 ? 'text-green-500' : 'text-red-500'}`}>
          {trend >= 0 ? '↑' : '↓'} {Math.abs(trend)}%
        </span>
        <span className="text-[10px] sm:text-xs text-gray-400">较上月</span>
      </div>
    )}
  </motion.div>
);

// 成就徽章组件
const AchievementBadge = ({ icon, name, points, delay = 0 }: { icon: string; name: string; points: number; delay?: number }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ ...ANIMATION_CONFIG.spring, delay }}
    whileHover={{ y: -4, scale: 1.05 }}
    className="
      flex flex-col items-center p-2 sm:p-3
      bg-gradient-to-br from-amber-50 to-orange-50
      dark:from-amber-500/10 dark:to-orange-500/10
      rounded-xl border border-amber-100 dark:border-amber-500/20
      min-w-[70px] sm:min-w-[80px]
    "
  >
    <div className="
      w-8 h-8 sm:w-10 sm:h-10 rounded-xl
      bg-amber-100 dark:bg-amber-500/20
      flex items-center justify-center
      text-lg sm:text-xl mb-1 sm:mb-2
    ">
      <i className={`fas fa-${icon} text-amber-500`} />
    </div>
    <p className="text-[10px] sm:text-xs font-medium text-gray-700 dark:text-gray-300 text-center truncate w-full">{name}</p>
    <p className="text-[9px] sm:text-[10px] text-amber-500 mt-0.5">+{points}</p>
  </motion.div>
);

interface MobileDashboardProps {
  user: any;
  isDark: boolean;
  onLogout: () => void;
  stats?: {
    views: number;
    likes: number;
    works: number;
    followers: number;
  };
  quickNavCounts?: {
    bookmarks: number;
    likes: number;
    drafts: number;
    friends: number;
    notifications: number;
  };
  comparisonData?: {
    viewsChange: number;
    likesChange: number;
    worksChange: number;
    followersChange?: number;
  };
}

export default function MobileDashboard({
  user,
  isDark,
  onLogout,
  stats: propStats,
  quickNavCounts: propQuickNavCounts,
  comparisonData: propComparisonData
}: MobileDashboardProps) {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [creatorLevelInfo, setCreatorLevelInfo] = useState(() => achievementService.getCreatorLevelInfo());
  const [achievements, setAchievements] = useState(() => achievementService.getUnlockedAchievements());
  const [isCheckInAnimating, setIsCheckInAnimating] = useState(false);
  const [showAllMenu, setShowAllMenu] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);

  const {
    balance,
    stats: pointsStats,
    hasCheckinToday,
    checkinRecords,
    checkin
  } = useSupabasePoints();

  // 使用传入的真实数据或默认值
  const stats = propStats || {
    views: 0,
    likes: 0,
    works: 0,
    followers: 0
  };

  const quickNavCounts = propQuickNavCounts || {
    bookmarks: 0,
    likes: 0,
    drafts: 0,
    friends: 0,
    notifications: 0
  };

  const comparisonData = propComparisonData || {
    viewsChange: 0,
    likesChange: 0,
    worksChange: 0,
    followersChange: 0
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        await achievementService.initialize();
        setCreatorLevelInfo(achievementService.getCreatorLevelInfo());
        setAchievements(achievementService.getUnlockedAchievements());
      } catch (error) {
        console.error('Failed to load achievement data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  const handleCheckIn = async () => {
    if (hasCheckinToday) return;
    setIsCheckInAnimating(true);
    const result = await checkin();
    if (result.success) {
      setTimeout(() => setIsCheckInAnimating(false), 1000);
    } else {
      setIsCheckInAnimating(false);
    }
  };

  const handleLogout = () => {
    if (window.confirm('确定要退出登录吗？')) {
      onLogout();
      toast.success('已退出登录');
      navigate('/login');
    }
  };

  // 主菜单项 - 使用真实数据
  const mainMenuItems = [
    { icon: Bookmark, label: '我的收藏', value: quickNavCounts.bookmarks.toString(), badge: 0, color: 'amber' as const, path: '/collection' },
    { icon: Heart, label: '我的点赞', value: quickNavCounts.likes.toString(), badge: 0, color: 'pink' as const, path: '/collection?tab=likes' },
    { icon: FileText, label: '草稿箱', value: quickNavCounts.drafts.toString(), badge: quickNavCounts.drafts > 0 ? quickNavCounts.drafts : 0, color: 'purple' as const, path: '/drafts' },
    { icon: Users, label: '我的好友', value: quickNavCounts.friends.toString(), badge: 0, color: 'green' as const, path: '/friends' },
    { icon: Bell, label: '消息通知', value: '', badge: quickNavCounts.notifications, color: 'blue' as const, path: '/notifications' },
  ];

  // 更多菜单项
  const moreMenuItems = [
    { icon: Award, label: '成就中心', color: 'orange' as const, path: '/achievement-museum' },
    { icon: TrendingUp, label: '数据分析', color: 'cyan' as const, path: '/analytics' },
    { icon: Crown, label: '会员中心', color: 'amber' as const, path: '/membership' },
    { icon: Zap, label: '积分商城', color: 'purple' as const, path: '/points-mall' },
    { icon: Target, label: '任务中心', color: 'green' as const, path: '/checkin' },
  ];

  // 设置菜单项
  const settingsMenuItems = [
    { icon: Edit3, label: '编辑资料', color: 'blue' as const, path: '/profile/edit' },
    { icon: Palette, label: '外观设置', color: 'purple' as const, path: '/settings' },
    { icon: Shield, label: '账号安全', color: 'green' as const, path: '/account/security' },
    { icon: HelpCircle, label: '帮助反馈', color: 'orange' as const, path: '/help' },
  ];

  if (isLoading) {
    return (
      <div className={`min-h-screen flex items-center justify-center ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
        <div className="text-center">
          <motion.div 
            className="inline-block rounded-full h-12 w-12 border-t-2 border-b-2 border-red-500 mb-4"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p className={`text-lg ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen pb-8 ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f8f9fc]'}`}>
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-20 -right-20 w-60 h-60 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/4 -left-20 w-40 h-40 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-0 w-48 h-48 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 px-3 sm:px-4 py-4 space-y-3 sm:space-y-4">
        {/* 顶部导航栏 */}
        <div className="flex items-center justify-between px-1 mb-2">
          <h1 className="text-lg font-bold text-gray-900 dark:text-white">个人中心</h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowSidebar(true)}
            className="
              w-12 h-12 rounded-full
              bg-white dark:bg-gray-800
              shadow-md border border-gray-100 dark:border-gray-700
              flex items-center justify-center
              text-gray-600 dark:text-gray-300
              hover:bg-gray-50 dark:hover:bg-gray-700
              transition-colors
            "
            aria-label="打开菜单"
          >
            <Menu className="w-6 h-6" />
          </motion.button>
        </div>

        {/* 用户信息卡片 */}
        <Card delay={0}>
          <div className="p-4 sm:p-5">
            <div className="flex items-center gap-3 sm:gap-4">
              {/* 头像 */}
              <motion.div
                className="relative flex-shrink-0"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full p-1 bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500">
                  {user?.avatar && user.avatar.trim() ? (
                    <img
                      src={user.avatar}
                      alt={user.username}
                      className="w-full h-full rounded-full object-cover border-2 sm:border-3 border-white dark:border-gray-800"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xl sm:text-2xl font-bold border-2 sm:border-3 border-white dark:border-gray-800">
                      {user?.username?.charAt(0) || 'U'}
                    </div>
                  )}
                </div>
                {/* 等级徽章 */}
                <motion.div
                  className="absolute -bottom-0.5 -right-0.5 w-6 h-6 sm:w-7 sm:h-7 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 10 }}
                >
                  <Crown className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </motion.div>
                {/* 在线状态 */}
                <div className="absolute top-0.5 right-0.5 w-3.5 h-3.5 sm:w-4 sm:h-4 bg-green-500 rounded-full border-2 border-white dark:border-gray-800">
                  <div className="w-full h-full rounded-full bg-green-500 animate-ping opacity-75" />
                </div>
              </motion.div>

              {/* 用户信息 */}
              <div className="flex-1 min-w-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white truncate">
                  {user?.username || '用户'}
                </h2>
                <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                  {creatorLevelInfo.currentLevel.name}
                </p>
                {/* 积分标签 */}
                <motion.div
                  className="inline-flex items-center gap-1 sm:gap-1.5 mt-1.5 sm:mt-2 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20"
                  whileHover={{ scale: 1.05 }}
                >
                  <Star className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-amber-500" />
                  <span className="text-xs sm:text-sm font-semibold text-amber-600 dark:text-amber-400">
                    {balance?.balance || 0} 积分
                  </span>
                </motion.div>
              </div>

              {/* 编辑按钮 */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => navigate('/profile/edit')}
                className="
                  p-2 sm:p-2.5 rounded-xl
                  bg-gray-100 dark:bg-gray-700
                  text-gray-600 dark:text-gray-300
                  hover:bg-gray-200 dark:hover:bg-gray-600
                  transition-colors
                  flex-shrink-0
                "
              >
                <Edit3 className="w-4 h-4 sm:w-5 sm:h-5" />
              </motion.button>
            </div>

            {/* 等级进度 */}
            <div className="mt-4 sm:mt-5">
              <div className="flex justify-between text-[10px] sm:text-xs mb-1.5 sm:mb-2">
                <span className="text-gray-500 dark:text-gray-400">等级进度</span>
                <span className="text-gray-700 dark:text-gray-300 font-medium">
                  {Math.min(100, Math.round(((balance?.balance || 0) / (creatorLevelInfo.nextLevel?.requiredPoints || 100)) * 100))}%
                </span>
              </div>
              <div className="h-2 sm:h-2.5 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, ((balance?.balance || 0) / (creatorLevelInfo.nextLevel?.requiredPoints || 100)) * 100)}%` }}
                  transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-red-500 to-orange-500"
                />
              </div>
              <p className="text-[10px] sm:text-xs text-gray-400 mt-1.5 sm:mt-2">
                距离 {creatorLevelInfo.nextLevel?.name || '下一级'} 还需 {Math.max(0, (creatorLevelInfo.nextLevel?.requiredPoints || 100) - (balance?.balance || 0))} 积分
              </p>
            </div>
          </div>
        </Card>

        {/* 每日签到卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...ANIMATION_CONFIG.springSoft, delay: 0.1 }}
        >
          <Card
            className="bg-gradient-to-br from-purple-500/5 to-blue-500/5 dark:from-purple-500/10 dark:to-blue-500/10 border-purple-200/50 dark:border-purple-500/20"
            onClick={hasCheckinToday ? () => navigate('/checkin') : handleCheckIn}
          >
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-purple-500 to-blue-500 flex items-center justify-center text-white shadow-lg flex-shrink-0">
                    <Gift className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">每日签到</h3>
                    <p className="text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate">
                      连续 {checkinRecords[0]?.consecutive_days || 0} 天 · 今日{hasCheckinToday ? '已' : '未'}签到
                    </p>
                  </div>
                </div>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  disabled={hasCheckinToday}
                  className={`
                    px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs sm:text-sm font-medium
                    flex-shrink-0
                    ${hasCheckinToday
                      ? 'bg-green-500 text-white'
                      : 'bg-gradient-to-r from-purple-500 to-blue-500 text-white shadow-lg shadow-purple-500/25'
                    }
                    transition-all
                  `}
                >
                  {hasCheckinToday ? (
                    <span className="flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden sm:inline">已签到</span>
                      <span className="sm:hidden">已签</span>
                    </span>
                  ) : (
                    '+5 积分'
                  )}
                </motion.button>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* 数据统计 */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard
            icon={Eye}
            label="总浏览量"
            value={stats.views}
            trend={comparisonData.viewsChange}
            color="from-blue-500 to-cyan-500"
            delay={0.15}
          />
          <StatCard
            icon={ThumbsUp}
            label="获赞总数"
            value={stats.likes}
            trend={comparisonData.likesChange}
            color="from-rose-500 to-pink-500"
            delay={0.2}
          />
          <StatCard
            icon={Image}
            label="作品总数"
            value={stats.works}
            trend={comparisonData.worksChange}
            color="from-emerald-500 to-teal-500"
            delay={0.25}
          />
          <StatCard
            icon={Users}
            label="粉丝数量"
            value={stats.followers}
            trend={comparisonData.followersChange || 0}
            color="from-amber-500 to-orange-500"
            delay={0.3}
          />
        </div>

        {/* 主功能菜单 */}
        <Card delay={0.35}>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {mainMenuItems.map((item, index) => (
              <MenuItem
                key={item.label}
                {...item}
                onClick={() => navigate(item.path)}
                delay={0.35 + index * 0.05}
              />
            ))}
          </div>
        </Card>

        {/* 更多功能 */}
        <Card delay={0.5}>
          <div className="p-3 sm:p-4">
            <div className="flex items-center justify-between mb-2 sm:mb-3">
              <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">更多功能</h3>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setShowAllMenu(!showAllMenu)}
                className="text-xs sm:text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                {showAllMenu ? '收起' : '展开'}
              </motion.button>
            </div>
            <motion.div
              className="grid grid-cols-5 sm:grid-cols-5 gap-2 sm:gap-3"
              initial={false}
              animate={{ height: showAllMenu ? 'auto' : '80px' }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
              style={{ overflow: 'hidden' }}
            >
              {moreMenuItems.map((item, index) => (
                <motion.button
                  key={item.label}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.5 + index * 0.05 }}
                  whileHover={{ y: -4, scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => navigate(item.path)}
                  className="flex flex-col items-center gap-1 sm:gap-2 p-2 sm:p-3 rounded-xl hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className={`
                    w-9 h-9 sm:w-11 sm:h-11 rounded-xl
                    bg-gradient-to-br from-${item.color}-500 to-${item.color === 'amber' ? 'yellow' : item.color === 'cyan' ? 'blue' : item.color}-600
                    flex items-center justify-center
                    text-white shadow-lg
                  `}>
                    <item.icon className="w-4 h-4 sm:w-5 sm:h-5" />
                  </div>
                  <span className="text-[10px] sm:text-xs text-gray-600 dark:text-gray-400 truncate w-full text-center">{item.label}</span>
                </motion.button>
              ))}
            </motion.div>
          </div>
        </Card>

        {/* 最近成就 */}
        {achievements.length > 0 && (
          <Card delay={0.6}>
            <div className="p-3 sm:p-4">
              <div className="flex items-center justify-between mb-3 sm:mb-4">
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm sm:text-base">最近成就</h3>
                <Link to="/achievement-museum" className="text-xs sm:text-sm text-amber-500 hover:text-amber-600">
                  查看全部
                </Link>
              </div>
              <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-1 px-1">
                {achievements.slice(0, 4).map((achievement, index) => (
                  <AchievementBadge
                    key={achievement.id}
                    icon={achievement.icon}
                    name={achievement.name}
                    points={achievement.points}
                    delay={0.6 + index * 0.05}
                  />
                ))}
              </div>
            </div>
          </Card>
        )}

        {/* 设置菜单 */}
        <Card delay={0.7}>
          <div className="divide-y divide-gray-100 dark:divide-gray-700/50">
            {settingsMenuItems.map((item, index) => (
              <MenuItem
                key={item.label}
                {...item}
                onClick={() => navigate(item.path)}
                delay={0.7 + index * 0.05}
              />
            ))}
          </div>
        </Card>

        {/* 退出登录 */}
        <motion.button
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ ...ANIMATION_CONFIG.springSoft, delay: 0.8 }}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleLogout}
          className="
            w-full flex items-center justify-center gap-2 
            p-4 rounded-2xl 
            bg-red-50 dark:bg-red-500/10 
            text-red-600 dark:text-red-400 
            font-medium
            border border-red-100 dark:border-red-500/20
            hover:bg-red-100 dark:hover:bg-red-500/20
            transition-colors
            min-h-[56px]
          "
        >
          <LogOut className="w-5 h-5" />
          退出登录
        </motion.button>

        {/* 版本信息 */}
        <motion.p 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9 }}
          className="text-center text-xs text-gray-400 py-4"
        >
          津脉智坊 v1.0.0
        </motion.p>
      </div>

      {/* 右侧侧边栏 */}
      <AnimatePresence>
        {showSidebar && (
          <>
            {/* 遮罩层 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowSidebar(false)}
              className="fixed inset-0 bg-black/50 z-50"
            />
            {/* 侧边栏内容 - 从右侧滑入 */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`
                fixed top-0 right-0 bottom-0 w-[85%] max-w-[360px] z-50
                ${isDark ? 'bg-gray-900' : 'bg-white'}
                shadow-2xl overflow-y-auto
              `}
            >
              {/* 侧边栏头部 */}
              <div className={`
                sticky top-0 z-10 px-4 py-3 flex items-center justify-between
                ${isDark ? 'bg-gray-900/95 border-b border-gray-800' : 'bg-white/95 border-b border-gray-200'}
                backdrop-blur-xl
              `}>
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-white font-bold text-sm">
                    智
                  </div>
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>津脉智坊</span>
                </div>
                <button
                  onClick={() => setShowSidebar(false)}
                  className={`
                    w-9 h-9 rounded-full flex items-center justify-center
                    ${isDark ? 'text-gray-400 hover:bg-gray-800' : 'text-gray-600 hover:bg-gray-100'}
                    transition-colors
                  `}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 导航菜单 */}
              <div className="p-4 space-y-2">
                {/* 平台首页 */}
                <SidebarSection title="平台首页" isDark={isDark}>
                  <SidebarItem icon="fas fa-home" label="首页" onClick={() => { navigate('/'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-th-large" label="津脉广场" onClick={() => { navigate('/square'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-robot" label="津小脉AI助手" onClick={() => { navigate('/ai-assistant'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-users" label="津脉社区" onClick={() => { navigate('/community'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-user" label="个人中心" onClick={() => { setShowSidebar(false); }} isDark={isDark} active />
                </SidebarSection>

                {/* 作品与社区 */}
                <SidebarSection title="作品与社区" isDark={isDark}>
                  <SidebarItem icon="fas fa-tools" label="创作中心" onClick={() => { navigate('/create'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-hat-wizard" label="品牌向导" onClick={() => { navigate('/wizard'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-pen-nib" label="AI智作文案" onClick={() => { navigate('/ai-writer'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-calendar-alt" label="文化活动" onClick={() => { navigate('/cultural-events'); setShowSidebar(false); }} isDark={isDark} />
                </SidebarSection>

                {/* 天津特色 */}
                <SidebarSection title="天津特色" isDark={isDark}>
                  <SidebarItem icon="fas fa-landmark" label="津脉作品" onClick={() => { navigate('/tianjin'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-project-diagram" label="津脉脉络" onClick={() => { navigate('/inspiration-mindmap'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-book" label="文化知识" onClick={() => { navigate('/knowledge'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-star" label="津脉活动" onClick={() => { navigate('/events'); setShowSidebar(false); }} isDark={isDark} />
                </SidebarSection>

                {/* 激励与福利 */}
                <SidebarSection title="激励与福利" isDark={isDark}>
                  <SidebarItem icon="fas fa-chart-line" label="人气排行" onClick={() => { navigate('/leaderboard'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-gift" label="积分商城" onClick={() => { navigate('/points-mall'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-trophy" label="成就博物馆" onClick={() => { navigate('/achievement-museum'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-calendar-check" label="每日签到" onClick={() => { navigate('/checkin'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-gamepad" label="趣味游戏" onClick={() => { navigate('/games'); setShowSidebar(false); }} isDark={isDark} />
                </SidebarSection>

                {/* 商务与支持 */}
                <SidebarSection title="商务与支持" isDark={isDark}>
                  <SidebarItem icon="fas fa-handshake" label="商业合作" onClick={() => { navigate('/business'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-building" label="主办方中心" onClick={() => { navigate('/organizer'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-lightbulb" label="IP孵化中心" onClick={() => { navigate('/ip-incubation'); setShowSidebar(false); }} isDark={isDark} />
                  <SidebarItem icon="fas fa-info-circle" label="帮助中心" onClick={() => { navigate('/help'); setShowSidebar(false); }} isDark={isDark} />
                </SidebarSection>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

// 侧边栏分组组件
const SidebarSection = ({ title, children, isDark }: { title: string; children: React.ReactNode; isDark: boolean }) => (
  <div className="mb-4">
    <h3 className={`text-xs font-semibold uppercase tracking-wider mb-2 px-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
      {title}
    </h3>
    <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800/50' : 'bg-gray-50'}`}>
      {children}
    </div>
  </div>
);

// 侧边栏菜单项组件
const SidebarItem = ({ 
  icon, 
  label, 
  onClick, 
  isDark, 
  active = false 
}: { 
  icon: string; 
  label: string; 
  onClick: () => void; 
  isDark: boolean;
  active?: boolean;
}) => (
  <button
    onClick={onClick}
    className={`
      w-full flex items-center gap-3 px-3 py-3 text-left
      transition-colors min-h-[48px]
      ${active 
        ? (isDark ? 'bg-blue-600/20 text-blue-400' : 'bg-blue-50 text-blue-600')
        : (isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100')
      }
    `}
  >
    <i className={`${icon} w-5 text-center ${active ? 'text-blue-500' : ''}`}></i>
    <span className="font-medium text-sm">{label}</span>
    {active && <div className="ml-auto w-1.5 h-1.5 rounded-full bg-blue-500" />}
  </button>
);
