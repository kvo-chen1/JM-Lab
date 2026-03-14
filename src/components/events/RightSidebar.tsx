import { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Event } from '@/types';
import { AuthContext } from '@/contexts/authContext';
import { 
  Calendar, 
  Clock, 
  ChevronRight, 
  Flame,
  Trophy,
  User,
  MapPin,
  Star,
  Zap,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { userService } from '@/services/userService';
import { toast } from 'sonner';

interface RightSidebarProps {
  events: Event[];
  upcomingEvents: Event[];
  userStats?: {
    registeredCount: number;
    submittedCount: number;
    completedCount: number;
  };
  recommendedCreators?: {
    id: string;
    name: string;
    avatar: string;
    worksCount: number;
    followersCount: number;
    likesCount: number;
  }[];
  onEventClick?: (eventId: string) => void;
  selectedDate?: Date | null;
  onDateSelect?: (date: Date | null) => void;
}

// 迷你日历组件
function MiniCalendar({ 
  events, 
  selectedDate, 
  onDateSelect 
}: { 
  events: Event[]; 
  selectedDate?: Date | null;
  onDateSelect?: (date: Date | null) => void;
}) {
  const { isDark } = useTheme();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  
  const days = [];
  for (let i = 0; i < firstDay; i++) {
    days.push(null);
  }
  for (let i = 1; i <= daysInMonth; i++) {
    days.push(i);
  }

  // 获取有活动的日期（考虑年月）
  const eventDates = events
    .filter(e => {
      const eventDate = new Date(e.startTime);
      return eventDate.getFullYear() === year && eventDate.getMonth() === month;
    })
    .map(e => new Date(e.startTime).getDate());
  
  const today = new Date();
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month;

  // 处理日期点击
  const handleDateClick = (day: number | null) => {
    if (!day || !onDateSelect) return;
    
    // 如果点击已选中的日期，则取消选择
    if (selectedDate && 
        selectedDate.getDate() === day && 
        selectedDate.getMonth() === month && 
        selectedDate.getFullYear() === year) {
      onDateSelect(null);
    } else {
      // 选择新日期
      onDateSelect(new Date(year, month, day));
    }
  };

  // 清除日期筛选
  const clearDateFilter = () => {
    if (onDateSelect) {
      onDateSelect(null);
    }
  };

  return (
    <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'} shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Calendar className="w-5 h-5 text-red-500" />
          活动日历
        </h3>
        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          {year}年{month + 1}月
        </span>
      </div>
      
      <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
        {['日', '一', '二', '三', '四', '五', '六'].map(day => (
          <div key={day} className={`py-1 font-medium ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {day}
          </div>
        ))}
      </div>
      
      <div className="grid grid-cols-7 gap-1">
        {days.map((day, index) => {
          const hasEvent = day && eventDates.includes(day);
          const isToday = isCurrentMonth && day === today.getDate();
          const isSelected = selectedDate && 
                            day === selectedDate.getDate() && 
                            month === selectedDate.getMonth() && 
                            year === selectedDate.getFullYear();
          
          return (
            <motion.div
              key={index}
              onClick={() => handleDateClick(day)}
              whileHover={day ? { scale: 1.1 } : {}}
              whileTap={day ? { scale: 0.95 } : {}}
              className={`
                aspect-square flex items-center justify-center text-sm rounded-lg relative cursor-pointer
                ${isSelected ? 'bg-red-500 text-white font-semibold shadow-lg shadow-red-500/30' : ''}
                ${isToday && !isSelected ? 'bg-red-500 text-white font-semibold' : ''}
                ${hasEvent && !isToday && !isSelected ? 'font-semibold text-red-500' : ''}
                ${!isToday && !isSelected && day ? isDark ? 'text-gray-300 hover:text-red-400 hover:bg-red-500/10' : 'text-gray-700 hover:text-red-500 hover:bg-red-50' : ''}
                ${!day ? 'cursor-default' : ''}
              `}
            >
              {day}
              {hasEvent && !isToday && !isSelected && (
                <div className="absolute bottom-1 w-1 h-1 rounded-full bg-red-500" />
              )}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full flex items-center justify-center">
                  <span className="text-[8px] text-white">✓</span>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
      
      <div className={`mt-4 pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <div className="w-2 h-2 rounded-full bg-red-500" />
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>有活动</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className={`w-2 h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-300'}`} />
              <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>今天</span>
            </div>
          </div>
          {selectedDate && (
            <button
              onClick={clearDateFilter}
              className="text-xs text-red-500 hover:text-red-600 font-medium transition-colors"
            >
              清除筛选
            </button>
          )}
        </div>
        {selectedDate && (
          <div className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            已选择: {selectedDate.getMonth() + 1}月{selectedDate.getDate()}日
          </div>
        )}
      </div>
    </div>
  );
}

// 即将开始的活动
function UpcomingEvents({ events, onEventClick }: { events: Event[]; onEventClick?: (eventId: string) => void }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  if (events.length === 0) return null;
  
  // 处理活动点击
  const handleEventClick = (eventId: string) => {
    if (onEventClick) {
      // 如果有回调函数，使用回调函数（在当前页面打开弹窗）
      onEventClick(eventId);
    } else {
      // 否则跳转到 CulturalEvents 页面
      navigate(`/cultural-events?eventId=${eventId}&openModal=true`);
    }
  };

  // 辅助函数：解析日期值（处理各种日期格式）
  const parseDateValue = (dateValue: any): Date | null => {
    if (dateValue == null) {
      return null;
    }
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    if (typeof dateValue === 'string') {
      // 检查是否是纯数字（时间戳）
      if (/^\d+$/.test(dateValue)) {
        const numValue = parseInt(dateValue, 10);
        // 判断时间戳是秒级还是毫秒级：如果数值小于 1e12，认为是秒级
        const msValue = numValue < 1e12 ? numValue * 1000 : numValue;
        const date = new Date(msValue);
        return isNaN(date.getTime()) ? null : date;
      }
      // ISO日期字符串
      const parsed = new Date(dateValue);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
      return null;
    }
    if (typeof dateValue === 'number') {
      // 判断时间戳是秒级还是毫秒级
      const msValue = dateValue < 1e12 ? dateValue * 1000 : dateValue;
      const date = new Date(msValue);
      return isNaN(date.getTime()) ? null : date;
    }
    // 对于其他类型，尝试解析
    const parsed = new Date(dateValue);
    return isNaN(parsed.getTime()) ? null : parsed;
  };

  const getTimeLeft = (startTime: Date | string | number, endTime?: Date | string | number) => {
    const now = new Date();
    const start = parseDateValue(startTime);
    
    // 如果开始时间无效，返回未知状态
    if (!start || isNaN(start.getTime())) {
      return '时间待定';
    }
    
    const diff = start.getTime() - now.getTime();
    
    // 如果活动已经开始或已结束
    if (diff < 0) {
      // 如果有结束时间，检查活动是否已结束
      if (endTime) {
        const end = parseDateValue(endTime);
        if (end && now > end) {
          return '已结束';
        }
      }
      
      // 计算已经过去的时间
      const absDiff = Math.abs(diff);
      const passedDays = Math.floor(absDiff / (1000 * 60 * 60 * 24));
      const passedHours = Math.floor((absDiff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const passedMinutes = Math.floor((absDiff % (1000 * 60 * 60)) / (1000 * 60));
      
      if (passedDays > 0) return `已开始 ${passedDays} 天`;
      if (passedHours > 0) return `已开始 ${passedHours} 小时`;
      if (passedMinutes > 0) return `已开始 ${passedMinutes} 分钟`;
      return '进行中';
    }
    
    // 活动尚未开始，计算剩余时间
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    // 检查是否是今天
    const isToday = start.toDateString() === now.toDateString();
    
    if (days > 0) return `${days}天后`;
    if (hours > 0) return `${hours}小时后`;
    if (minutes > 0) return isToday ? `${minutes}分钟后` : '即将开始';
    return '即将开始';
  };

  return (
    <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'} shadow-sm`}>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Clock className="w-5 h-5 text-amber-500" />
        即将开始
      </h3>
      
      <div className="space-y-3">
        {events.slice(0, 3).map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleEventClick(event.id)}
            className={`group flex gap-3 p-3 rounded-xl cursor-pointer transition-all ${
              isDark 
                ? 'hover:bg-gray-700/50' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="relative w-16 h-16 flex-shrink-0 rounded-lg overflow-hidden">
              <img
                src={event.media?.[0]?.url || `https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=event&image_size=square`}
                alt={event.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium text-sm line-clamp-1 group-hover:text-red-500 transition-colors ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {event.title}
              </h4>
              <div className={`flex items-center gap-1 mt-1 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <MapPin className="w-3 h-3" />
                <span className="truncate">{event.location || (event.type === 'online' ? '线上活动' : '待定')}</span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                  (() => {
                    const now = new Date();
                    const start = new Date(event.startTime);
                    const end = event.endTime ? new Date(event.endTime) : null;
                    
                    // 已结束
                    if (end && now > end) {
                      return 'bg-gray-100 text-gray-600';
                    }
                    // 进行中
                    if (now >= start) {
                      return 'bg-green-100 text-green-700';
                    }
                    // 即将开始
                    return 'bg-amber-100 text-amber-700';
                  })()
                }`}>
                  {getTimeLeft(event.startTime, event.endTime)}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
      
      {events.length > 3 && (
        <button 
          onClick={() => navigate('/tianjin')}
          className={`w-full mt-4 flex items-center justify-center gap-1 text-sm font-medium transition-colors ${
            isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          查看全部
          <ChevronRight className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// 我的活动统计
function MyActivityStats({ stats }: { stats?: { registeredCount: number; submittedCount: number; completedCount: number } }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  if (!stats) return null;

  const statItems = [
    { label: '已报名', value: stats.registeredCount, icon: User, color: 'text-blue-500', bgColor: 'bg-blue-100' },
    { label: '待提交', value: stats.submittedCount, icon: Clock, color: 'text-amber-500', bgColor: 'bg-amber-100' },
    { label: '已完成', value: stats.completedCount, icon: Trophy, color: 'text-emerald-500', bgColor: 'bg-emerald-100' },
  ];

  return (
    <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'} shadow-sm`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold text-lg flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          我的活动
        </h3>
        <button 
          onClick={() => navigate('/my-activities')}
          className={`text-xs font-medium transition-colors ${
            isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          查看全部
        </button>
      </div>
      
      <div className="grid grid-cols-3 gap-3">
        {statItems.map((item) => {
          const Icon = item.icon;
          return (
            <div 
              key={item.label}
              className={`text-center p-3 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
            >
              <div className={`w-8 h-8 mx-auto mb-2 rounded-lg ${item.bgColor} flex items-center justify-center`}>
                <Icon className={`w-4 h-4 ${item.color}`} />
              </div>
              <div className={`text-xl font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                {item.value}
              </div>
              <div className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// 热门活动排行
function TrendingEvents({ events, onEventClick }: { events: Event[]; onEventClick?: (eventId: string) => void }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  // 按参与人数排序
  const trendingEvents = [...events]
    .sort((a, b) => (b.participants || 0) - (a.participants || 0))
    .slice(0, 5);
  
  if (trendingEvents.length === 0) return null;

  // 处理活动点击
  const handleEventClick = (eventId: string) => {
    if (onEventClick) {
      onEventClick(eventId);
    } else {
      navigate(`/cultural-events?eventId=${eventId}&openModal=true`);
    }
  };

  return (
    <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'} shadow-sm`}>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Flame className="w-5 h-5 text-orange-500" />
        热门活动
      </h3>
      
      <div className="space-y-3">
        {trendingEvents.map((event, index) => (
          <motion.div
            key={event.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            onClick={() => handleEventClick(event.id)}
            className={`group flex items-center gap-3 p-2 rounded-xl cursor-pointer transition-all ${
              isDark 
                ? 'hover:bg-gray-700/50' 
                : 'hover:bg-gray-50'
            }`}
          >
            <div className={`
              w-6 h-6 flex items-center justify-center rounded-lg text-xs font-bold
              ${index < 3 
                ? 'bg-gradient-to-br from-orange-400 to-red-500 text-white' 
                : isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-200 text-gray-600'
              }
            `}>
              {index + 1}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className={`font-medium text-sm line-clamp-1 group-hover:text-red-500 transition-colors ${
                isDark ? 'text-gray-200' : 'text-gray-900'
              }`}>
                {event.title}
              </h4>
              <div className={`flex items-center gap-2 mt-0.5 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                <User className="w-3 h-3" />
                <span>{event.participants || 0} 人参与</span>
              </div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

// 推荐创作者
function RecommendedCreators({ creators }: { creators?: { id: string; name: string; avatar: string; worksCount: number; followersCount: number; likesCount: number }[] }) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  const [followingMap, setFollowingMap] = useState<Record<string, boolean>>({});
  const [loadingMap, setLoadingMap] = useState<Record<string, boolean>>({});
  
  // 格式化数字
  const formatCount = (count: number | undefined | null) => {
    if (count === undefined || count === null) {
      return '0';
    }
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + 'k';
    }
    return count.toString();
  };

  // 如果没有数据，显示空状态
  if (!creators || creators.length === 0) {
    return (
      <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'} shadow-sm`}>
        <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
          <Star className="w-5 h-5 text-purple-500" />
          推荐关注
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          暂无推荐创作者
        </p>
      </div>
    );
  }

  // 处理关注/取消关注
  const handleFollowToggle = async (e: React.MouseEvent, creatorId: string) => {
    e.stopPropagation();
    
    if (!currentUser) {
      toast.error('请先登录');
      navigate('/login');
      return;
    }

    if (currentUser.id === creatorId) {
      toast.error('不能关注自己');
      return;
    }

    const isCurrentlyFollowing = followingMap[creatorId];
    setLoadingMap(prev => ({ ...prev, [creatorId]: true }));

    try {
      let success: boolean;
      if (isCurrentlyFollowing) {
        success = await userService.unfollowUser(creatorId);
        if (success) {
          setFollowingMap(prev => ({ ...prev, [creatorId]: false }));
        }
      } else {
        success = await userService.followUser(creatorId);
        if (success) {
          setFollowingMap(prev => ({ ...prev, [creatorId]: true }));
        }
      }
    } catch (error) {
      console.error('[RightSidebar] handleFollowToggle error:', error);
    } finally {
      setLoadingMap(prev => ({ ...prev, [creatorId]: false }));
    }
  };

  return (
    <div className={`rounded-2xl p-5 ${isDark ? 'bg-gray-800/50 border border-gray-700' : 'bg-white border border-gray-100'} shadow-sm`}>
      <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
        <Star className="w-5 h-5 text-purple-500" />
        推荐关注
      </h3>
      
      <div className="space-y-3">
        {creators.map((creator) => {
          const isFollowing = followingMap[creator.id] || false;
          const isLoading = loadingMap[creator.id] || false;

          return (
            <div
              key={creator.id}
              onClick={() => navigate(`/profile/${creator.id}`)}
              className={`flex items-center gap-3 p-2 rounded-xl cursor-pointer ${
                isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
              }`}
            >
              <img
                src={creator.avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${creator.id}`}
                alt={creator.name}
                className="w-10 h-10 rounded-full object-cover"
              />
              <div className="flex-1 min-w-0">
                <h4 className={`font-medium text-sm ${isDark ? 'text-gray-200' : 'text-gray-900'}`}>
                  {creator.name}
                </h4>
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {formatCount(creator.followersCount)} 关注者 · {creator.worksCount} 作品
                </p>
              </div>
              <button 
                onClick={(e) => handleFollowToggle(e, creator.id)}
                disabled={isLoading}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors flex items-center gap-1 ${
                  isFollowing
                    ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-red-100 dark:hover:bg-red-900/30 hover:text-red-600'
                    : 'bg-red-500 text-white hover:bg-red-600'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {isLoading ? (
                  <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                ) : isFollowing ? (
                  <>
                    <Check className="w-3 h-3" />
                    已关注
                  </>
                ) : (
                  '关注'
                )}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function RightSidebar({ 
  events, 
  upcomingEvents, 
  userStats, 
  recommendedCreators, 
  onEventClick,
  selectedDate,
  onDateSelect 
}: RightSidebarProps) {
  return (
    <aside className="w-full lg:w-[320px] flex-shrink-0 space-y-6">
      <MiniCalendar 
        events={events} 
        selectedDate={selectedDate}
        onDateSelect={onDateSelect}
      />
      <UpcomingEvents events={upcomingEvents} onEventClick={onEventClick} />
      <MyActivityStats stats={userStats} />
      <TrendingEvents events={events} onEventClick={onEventClick} />
      <RecommendedCreators creators={recommendedCreators} />
    </aside>
  );
}
