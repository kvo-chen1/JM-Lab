import { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import checkinService, { CheckinStatus } from '@/services/checkinService';
import pointsService from '@/services/pointsService';

// 签到奖励类型定义
interface CheckinReward {
  day: number;
  name: string;
  description: string;
  icon: string;
  points: number;
  isClaimed: boolean;
  isAvailable: boolean;
}

// 连续签到奖励配置
const STREAK_REWARDS: CheckinReward[] = [
  { day: 1, name: '基础签到奖励', description: '每日签到获得基础积分', icon: 'gift', points: 5, isClaimed: false, isAvailable: false },
  { day: 3, name: '连续3天奖励', description: '连续签到3天额外奖励', icon: 'star', points: 10, isClaimed: false, isAvailable: false },
  { day: 7, name: '连续7天奖励', description: '连续签到7天额外奖励', icon: 'trophy', points: 30, isClaimed: false, isAvailable: false },
  { day: 15, name: '连续15天奖励', description: '连续签到15天额外奖励', icon: 'crown', points: 50, isClaimed: false, isAvailable: false },
  { day: 30, name: '连续30天奖励', description: '连续签到30天超级奖励', icon: 'gem', points: 100, isClaimed: false, isAvailable: false },
];

export default function DailyCheckin() {
  const { isDark } = useTheme();
  const [currentStreak, setCurrentStreak] = useState<number>(0);
  const [canCheckinToday, setCanCheckinToday] = useState<boolean>(false);
  const [rewards, setRewards] = useState<CheckinReward[]>(STREAK_REWARDS);
  const [totalPoints, setTotalPoints] = useState<number>(0);
  const [checkinHistory, setCheckinHistory] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const userId = 'current-user'; // 实际项目中应从认证上下文获取

  // 加载签到状态
  const loadCheckinStatus = useCallback(() => {
    try {
      const status: CheckinStatus = checkinService.getCheckinStatus(userId);
      setCurrentStreak(status.consecutiveDays);
      setCanCheckinToday(!status.todayChecked);
      setTotalPoints(pointsService.getCurrentPoints());

      // 获取本月签到记录
      const now = new Date();
      const monthlyRecords = checkinService.getUserCheckinRecordsByMonth(userId, now.getFullYear(), now.getMonth() + 1);
      const history = monthlyRecords.map(record => record.date);
      setCheckinHistory(history);

      // 更新奖励状态
      updateRewardsStatus(status.consecutiveDays, status.todayChecked);
    } catch (error) {
      console.error('加载签到状态失败:', error);
      toast.error('加载签到状态失败');
    }
  }, [userId]);

  // 更新奖励状态
  const updateRewardsStatus = (streak: number, todayChecked: boolean) => {
    const updatedRewards = STREAK_REWARDS.map(reward => {
      // 检查是否已领取该奖励
      const isClaimed = checkinService.getUserCheckinRecords(userId).some(
        record => record.consecutiveDays === reward.day && record.isBonus
      );

      // 检查是否可用
      const isAvailable = reward.day <= streak && !isClaimed;

      return {
        ...reward,
        isClaimed,
        isAvailable
      };
    });
    setRewards(updatedRewards);
  };

  // 初始加载
  useEffect(() => {
    loadCheckinStatus();
  }, [loadCheckinStatus]);

  // 处理签到
  const handleCheckin = async () => {
    if (!canCheckinToday || isLoading) return;

    setIsLoading(true);
    try {
      const result = checkinService.checkin(userId);
      
      // 更新状态
      setCurrentStreak(result.record.consecutiveDays);
      setCanCheckinToday(false);
      setTotalPoints(pointsService.getCurrentPoints());

      // 更新签到历史
      setCheckinHistory(prev => [...prev, result.record.date]);

      // 更新奖励状态
      updateRewardsStatus(result.record.consecutiveDays, true);

      // 显示成功消息
      if (result.record.isBonus) {
        toast.success(
          <div>
            <div className="font-bold">🎉 签到成功！</div>
            <div>连续签到 {result.record.consecutiveDays} 天</div>
            <div className="text-yellow-400">获得 {result.totalPoints} 积分（含连续签到奖励）</div>
          </div>
        );
      } else {
        toast.success(
          <div>
            <div className="font-bold">✅ 签到成功！</div>
            <div>连续签到 {result.record.consecutiveDays} 天</div>
            <div>获得 {result.totalPoints} 积分</div>
          </div>
        );
      }

      // 触发自定义事件，通知其他组件积分已更新
      window.dispatchEvent(new CustomEvent('pointsUpdated', { 
        detail: { 
          newBalance: pointsService.getCurrentPoints(),
          change: result.totalPoints,
          type: 'earned'
        }
      }));
    } catch (error: any) {
      console.error('签到失败:', error);
      toast.error(error.message || '签到失败，请稍后重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理补签
  const handleRetroactiveCheckin = async (date: string) => {
    try {
      const cost = checkinService.calculate补签Cost(currentStreak);
      const currentPoints = pointsService.getCurrentPoints();

      if (currentPoints < cost) {
        toast.error(`积分不足，补签需要 ${cost} 积分`);
        return;
      }

      const result = checkinService.补签(userId, date);
      
      // 更新状态
      setTotalPoints(pointsService.getCurrentPoints());
      setCheckinHistory(prev => [...prev, date]);

      toast.success(
        <div>
          <div className="font-bold">✅ 补签成功！</div>
          <div>补签日期：{date}</div>
          <div className="text-red-400">消耗 {result.cost} 积分</div>
        </div>
      );

      // 触发积分更新事件
      window.dispatchEvent(new CustomEvent('pointsUpdated', { 
        detail: { 
          newBalance: pointsService.getCurrentPoints(),
          change: -result.cost,
          type: 'spent'
        }
      }));
    } catch (error: any) {
      console.error('补签失败:', error);
      toast.error(error.message || '补签失败');
    }
  };

  // 计算进度条百分比
  const progressPercentage = Math.min((currentStreak / 30) * 100, 100);

  // 生成日历数据
  const generateCalendarDays = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfMonth = new Date(year, month, 1).getDay();

    const days = [];
    
    // 填充月初空白
    for (let i = 0; i < firstDayOfMonth; i++) {
      days.push({ date: null, isToday: false, isChecked: false, canRetroactive: false });
    }

    // 填充日期
    for (let day = 1; day <= daysInMonth; day++) {
      const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const isToday = day === today.getDate();
      const isChecked = checkinHistory.includes(dateStr);
      const isPast = day < today.getDate();
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

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      {/* 头部信息 */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h3 className="text-xl font-bold">每日签到</h3>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            连续签到可获得额外积分奖励
          </p>
        </div>
        <div className={`flex items-center gap-4`}>
          <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
            isDark ? 'bg-gray-700' : 'bg-gray-100'
          }`}>
            <i className="fas fa-fire text-yellow-500 mr-1"></i>
            <span>连续 {currentStreak} 天</span>
          </div>
          <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
            isDark ? 'bg-red-900 bg-opacity-50' : 'bg-red-100'
          }`}>
            <i className="fas fa-coins text-yellow-500 mr-1"></i>
            <span className="text-red-500 font-medium">{totalPoints} 积分</span>
          </div>
        </div>
      </div>

      {/* 签到按钮 */}
      <div className="flex justify-center mb-8">
        <motion.button
          whileHover={{ scale: canCheckinToday ? 1.05 : 1 }}
          whileTap={{ scale: canCheckinToday ? 0.95 : 1 }}
          onClick={handleCheckin}
          disabled={!canCheckinToday || isLoading}
          className={`px-8 py-4 rounded-full flex items-center gap-2 transition-all ${
            canCheckinToday
              ? 'bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white shadow-lg shadow-red-500/30'
              : isDark
              ? 'bg-gray-700 cursor-not-allowed'
              : 'bg-gray-300 cursor-not-allowed'
          }`}
        >
          {isLoading ? (
            <i className="fas fa-spinner fa-spin"></i>
          ) : (
            <i className={`fas ${canCheckinToday ? 'fa-calendar-check' : 'fa-check-circle'}`}></i>
          )}
          <span className="font-medium">
            {isLoading ? '处理中...' : canCheckinToday ? '立即签到' : '今日已签到'}
          </span>
          {canCheckinToday && <span className="text-sm opacity-90">+5 积分</span>}
        </motion.button>
      </div>

      {/* 进度条 */}
      <div className="mb-8">
        <div className="flex justify-between text-sm mb-2">
          <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>本月进度</span>
          <span className="font-medium">{currentStreak} / 30 天</span>
        </div>
        <div className={`h-3 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} overflow-hidden`}>
          <motion.div
            initial={{ width: '0%' }}
            animate={{ width: `${progressPercentage}%` }}
            transition={{ duration: 0.5 }}
            className="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
          ></motion.div>
        </div>
      </div>

      {/* 日历视图 */}
      <div className={`mb-8 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
        <h4 className="font-medium mb-4">签到日历</h4>
        <div className="grid grid-cols-7 gap-2">
          {/* 星期标题 */}
          {weekDays.map(day => (
            <div key={day} className={`text-center text-sm font-medium py-2 ${
              isDark ? 'text-gray-400' : 'text-gray-600'
            }`}>
              {day}
            </div>
          ))}
          {/* 日期 */}
          {calendarDays.map((day, index) => (
            <div key={index} className="aspect-square">
              {day.date ? (
                <motion.button
                  whileHover={day.canRetroactive ? { scale: 1.1 } : {}}
                  whileTap={day.canRetroactive ? { scale: 0.95 } : {}}
                  onClick={() => day.canRetroactive && handleRetroactiveCheckin(day.dateStr)}
                  disabled={!day.canRetroactive}
                  className={`w-full h-full rounded-lg flex items-center justify-center text-sm font-medium transition-all ${
                    day.isToday
                      ? 'bg-red-500 text-white ring-2 ring-red-300'
                      : day.isChecked
                      ? 'bg-green-500 text-white'
                      : day.canRetroactive
                      ? `${isDark ? 'bg-gray-600 hover:bg-red-600' : 'bg-white hover:bg-red-50'} text-red-500 border border-red-300 border-dashed`
                      : `${isDark ? 'bg-gray-600' : 'bg-white'} ${isDark ? 'text-gray-400' : 'text-gray-600'}`
                  }`}
                  title={day.canRetroactive ? `点击补签 (${checkinService.calculate补签Cost(currentStreak)} 积分)` : ''}
                >
                  {day.isChecked ? (
                    <i className="fas fa-check"></i>
                  ) : day.canRetroactive ? (
                    <span className="text-xs">补</span>
                  ) : (
                    day.date
                  )}
                </motion.button>
              ) : (
                <div></div>
              )}
            </div>
          ))}
        </div>
        <div className={`mt-3 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          <span className="inline-flex items-center mr-4">
            <span className="w-3 h-3 rounded bg-green-500 mr-1"></span> 已签到
          </span>
          <span className="inline-flex items-center mr-4">
            <span className="w-3 h-3 rounded bg-red-500 mr-1"></span> 今日
          </span>
          <span className="inline-flex items-center">
            <span className="w-3 h-3 rounded border border-red-300 border-dashed mr-1"></span> 可补签
          </span>
        </div>
      </div>

      {/* 奖励列表 */}
      <div>
        <h4 className="font-medium mb-4">连续签到奖励</h4>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {rewards.map((reward) => (
            <motion.div
              key={reward.day}
              className={`p-4 rounded-xl border flex flex-col items-center text-center transition-all ${
                reward.isClaimed
                  ? `${isDark ? 'border-gray-700 bg-gray-700 opacity-70' : 'border-gray-200 bg-gray-50 opacity-70'}`
                  : reward.isAvailable
                  ? `${isDark ? 'border-red-500 bg-red-500 bg-opacity-10' : 'border-red-200 bg-red-50'}`
                  : `${isDark ? 'border-gray-700' : 'border-gray-200'}`
              }`}
              whileHover={reward.isAvailable && !reward.isClaimed ? { scale: 1.05 } : {}}
            >
              <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${
                reward.isClaimed
                  ? 'bg-gray-600 text-gray-400'
                  : reward.isAvailable
                  ? 'bg-red-100 text-red-600'
                  : isDark
                  ? 'bg-gray-700 text-gray-400'
                  : 'bg-gray-100 text-gray-600'
              }`}>
                <i className={`fas fa-${reward.icon} text-xl`}></i>
              </div>
              <h5 className="font-medium mb-1 text-sm">{reward.name}</h5>
              <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {reward.day} 天
              </p>
              <span className={`text-xs font-bold ${
                reward.isClaimed ? 'text-gray-400' : 'text-yellow-500'
              }`}>
                +{reward.points} 积分
              </span>
              {reward.isClaimed && (
                <span className={`mt-2 px-2 py-1 rounded-full text-xs ${
                  isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-600'
                }`}>
                  已领取
                </span>
              )}
              {reward.isAvailable && !reward.isClaimed && (
                <span className="mt-2 px-2 py-1 rounded-full text-xs bg-red-500 text-white">
                  可领取
                </span>
              )}
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
