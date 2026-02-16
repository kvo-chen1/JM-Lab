import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import {
  eventNotificationService,
  type EventNotification,
  type NotificationType,
} from '@/services/eventNotificationService';
import { toast } from 'sonner';
import { Trophy, Medal, Award, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface ActivityNotificationPanelProps {
  userId: string;
}

export const ActivityNotificationPanel: React.FC<ActivityNotificationPanelProps> = ({
  userId,
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<EventNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);
  const [awards, setAwards] = useState<any[]>([]);
  const [isLoadingAwards, setIsLoadingAwards] = useState(true);

  // 加载通知和获奖数据
  useEffect(() => {
    loadNotifications();
    loadUnreadCount();
    loadAwards();

    // 订阅实时通知
    const unsubscribe = eventNotificationService.subscribeToNotifications(userId, {
      onInsert: (notification) => {
        setNotifications((prev) => [notification, ...prev]);
        setUnreadCount((prev) => prev + 1);
        toast.info(notification.title, {
          description: notification.content,
        });
      },
      onUpdate: (notification) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === notification.id ? notification : n))
        );
      },
      onDelete: (notificationId) => {
        setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      },
    });

    return () => {
      unsubscribe();
    };
  }, [userId]);

  // 加载获奖数据 - 使用 RPC 函数获取最终排名
  const loadAwards = async () => {
    try {
      setIsLoadingAwards(true);
      
      console.log('[获奖展示] 开始加载用户获奖数据, userId:', userId);
      
      // 首先获取用户参与的所有活动
      const { data: participations, error: participationsError } = await supabase
        .from('event_participants')
        .select('event_id')
        .eq('user_id', userId);
      
      if (participationsError) {
        console.error('[获奖展示] 查询参与记录失败:', participationsError);
        return loadAwardsFromParticipants();
      }
      
      console.log('[获奖展示] 用户的参与活动:', participations);
      
      if (!participations || participations.length === 0) {
        console.log('[获奖展示] 用户没有参与活动');
        setAwards([]);
        return;
      }
      
      // 对每个活动查询最终排名
      const userAwards: any[] = [];
      const eventIds = participations.map((p: any) => p.event_id);
      
      for (const eventId of eventIds) {
        try {
          const { data: rankingData, error: rankingError } = await supabase.rpc('get_final_ranking', {
            p_event_id: eventId
          });
          
          if (rankingError) {
            console.log(`[获奖展示] 活动 ${eventId} 排名查询失败:`, rankingError);
            continue;
          }
          
          if (rankingData?.success && rankingData.ranking_data) {
            // 在排名数据中找到当前用户
            const userRanking = rankingData.ranking_data.find((item: any) => item.creator_id === userId);
            
            if (userRanking) {
              console.log(`[获奖展示] 在活动 ${eventId} 中找到用户排名:`, userRanking);
              
              // 获取活动信息
              const { data: eventData } = await supabase
                .from('events')
                .select('id, title, description, start_time, end_time')
                .eq('id', eventId)
                .single();
              
              userAwards.push({
                id: `${eventId}-${userId}`,
                eventId: eventId,
                ranking: userRanking.rank,
                award: userRanking.award || `第 ${userRanking.rank} 名`,
                event: eventData
              });
            }
          }
        } catch (err) {
          console.log(`[获奖展示] 查询活动 ${eventId} 排名时出错:`, err);
        }
      }
      
      console.log('[获奖展示] 用户的获奖记录:', userAwards);
      
      // 只取前3条
      setAwards(userAwards.slice(0, 3));
    } catch (error) {
      console.error('[获奖展示] 加载获奖数据失败:', error);
      // 出错时尝试备用方案
      return loadAwardsFromParticipants();
    } finally {
      setIsLoadingAwards(false);
    }
  };

  // 备用方案：从 event_participants 表查询
  const loadAwardsFromParticipants = async () => {
    try {
      console.log('[获奖展示] 尝试从 event_participants 查询');
      
      const { data, error } = await supabase
        .from('event_participants')
        .select(`
          id,
          event_id,
          ranking,
          award,
          status,
          created_at
        `)
        .eq('user_id', userId)
        .or('ranking.not.is.null,award.not.is.null')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) {
        console.error('[获奖展示] 从 participants 查询失败:', error);
        setAwards([]);
        return;
      }

      console.log('[获奖展示] 从 participants 查询到的记录:', data);

      if (!data || data.length === 0) {
        setAwards([]);
        return;
      }

      // 获取活动信息
      const eventIds = data.map((item: any) => item.event_id);
      const { data: eventsData, error: eventsError } = await supabase
        .from('events')
        .select('id, title, description, start_time, end_time')
        .in('id', eventIds);

      if (eventsError) {
        console.error('[获奖展示] 查询活动信息失败:', eventsError);
      }

      const eventsMap = new Map();
      eventsData?.forEach((event: any) => {
        eventsMap.set(event.id, event);
      });

      const formattedAwards = data.map((item: any) => ({
        id: item.id,
        eventId: item.event_id,
        ranking: item.ranking,
        award: item.award,
        status: item.status,
        event: eventsMap.get(item.event_id) || null
      }));

      setAwards(formattedAwards);
    } catch (error) {
      console.error('[获奖展示] 备用查询失败:', error);
      setAwards([]);
    }
  };

  const loadNotifications = async () => {
    try {
      setIsLoading(true);
      const { data } = await eventNotificationService.getUserNotifications(userId, {}, { pageSize: 5 });
      setNotifications(data);
    } catch (error) {
      console.error('加载通知失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUnreadCount = async () => {
    try {
      const count = await eventNotificationService.getUnreadCount(userId);
      setUnreadCount(count);
    } catch (error) {
      console.error('加载未读数失败:', error);
    }
  };

  const handleMarkAsRead = async (notificationId: string) => {
    try {
      const success = await eventNotificationService.markAsRead(notificationId);
      if (success) {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === notificationId ? { ...n, isRead: true, readAt: new Date().toISOString() } : n
          )
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  const handleNotificationClick = async (notification: EventNotification) => {
    // 标记为已读
    if (!notification.isRead) {
      await handleMarkAsRead(notification.id);
    }

    // 如果有跳转链接，则跳转
    if (notification.actionUrl) {
      navigate(notification.actionUrl);
    } else if (notification.eventId) {
      // 根据类型生成默认跳转链接
      navigate(`/activities/${notification.eventId}`);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      const success = await eventNotificationService.markAllAsRead(userId);
      if (success) {
        setNotifications((prev) =>
          prev.map((n) => ({ ...n, isRead: true, readAt: new Date().toISOString() }))
        );
        setUnreadCount(0);
        toast.success('已全部标记为已读');
      }
    } catch (error) {
      console.error('标记全部已读失败:', error);
    }
  };

  const getNotificationIcon = (type: NotificationType) => {
    const config = eventNotificationService.getNotificationTypeConfig(type);
    return config.icon;
  };

  const getNotificationColor = (type: NotificationType) => {
    const config = eventNotificationService.getNotificationTypeConfig(type);
    return config.color;
  };

  const getNotificationBgColor = (type: NotificationType) => {
    const config = eventNotificationService.getNotificationTypeConfig(type);
    return config.bgColor;
  };

  const displayedNotifications = showAll ? notifications : notifications.slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 通知中心 */}
      <div className={`rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} flex items-center justify-between`}>
          <div className="flex items-center gap-2">
            <h3 className="font-semibold text-sm">通知中心</h3>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={handleMarkAllAsRead}
              className={`text-xs ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
            >
              全部已读
            </button>
          )}
        </div>

        <div className="max-h-[400px] overflow-y-auto">
          {isLoading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className={`h-16 rounded-lg animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center">
              <i className="fas fa-bell-slash text-3xl text-gray-400 mb-2"></i>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>暂无通知</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              <AnimatePresence>
                {displayedNotifications.map((notification) => (
                  <motion.div
                    key={notification.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className={`p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors cursor-pointer ${
                      !notification.isRead ? (isDark ? 'bg-gray-700/30' : 'bg-blue-50/50') : ''
                    }`}
                    onClick={() => handleNotificationClick(notification)}
                  >
                    <div className="flex gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${getNotificationBgColor(notification.type)}`}>
                        <i className={`fas ${getNotificationIcon(notification.type)} ${getNotificationColor(notification.type)} text-sm`}></i>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p className={`text-sm font-medium truncate ${!notification.isRead ? 'text-gray-900 dark:text-white' : 'text-gray-600 dark:text-gray-400'}`}>
                            {notification.title}
                          </p>
                          {!notification.isRead && (
                            <span className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className={`text-xs mt-0.5 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {notification.content}
                        </p>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          {eventNotificationService.formatTimeAgo(notification.createdAt)}
                        </p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {notifications.length > 5 && (
          <div className={`p-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-100'} text-center`}>
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-red-500 hover:text-red-600 font-medium"
            >
              {showAll ? '收起' : `查看全部 (${notifications.length})`}
            </button>
          </div>
        )}
      </div>

      {/* 活动日历 */}
      <div className={`rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className="font-semibold text-sm">活动日历</h3>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-7 gap-1 text-center text-xs mb-2">
            {['日', '一', '二', '三', '四', '五', '六'].map((day) => (
              <div key={day} className={`py-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: 35 }, (_, i) => {
              const day = i - 5; // 偏移以显示完整的日历
              const isToday = day === new Date().getDate();
              const hasEvent = [5, 12, 18, 25].includes(day);
              return (
                <div
                  key={i}
                  className={`aspect-square flex items-center justify-center text-xs rounded-lg ${
                    day < 1 || day > 31
                      ? 'invisible'
                      : isToday
                      ? 'bg-red-500 text-white'
                      : hasEvent
                      ? isDark
                        ? 'bg-red-500/20 text-red-400'
                        : 'bg-red-50 text-red-600'
                      : isDark
                      ? 'text-gray-300 hover:bg-gray-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {day > 0 && day <= 31 ? day : ''}
                  {hasEvent && !isToday && (
                    <span className="absolute bottom-0.5 w-1 h-1 bg-red-500 rounded-full"></span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 获奖展示 */}
      <div className={`rounded-xl shadow-sm ${isDark ? 'bg-gray-800' : 'bg-white'} overflow-hidden`}>
        <div className={`px-4 py-3 border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
          <h3 className="font-semibold text-sm">获奖展示</h3>
        </div>
        <div className="p-4">
          {isLoadingAwards ? (
            <div className="py-6 space-y-3">
              {[1, 2].map((i) => (
                <div key={i} className={`h-16 rounded-lg animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`} />
              ))}
            </div>
          ) : awards.length === 0 ? (
            <div className="flex items-center justify-center py-6">
              <div className="text-center">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3 ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Trophy className="w-8 h-8 text-gray-400" />
                </div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  暂无获奖记录
                </p>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  参与活动并获奖后将在此展示
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              {awards.slice(0, 3).map((award, index) => (
                <motion.div
                  key={award.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  onClick={() => navigate(`/ranking/${award.eventId}`)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                    isDark
                      ? 'bg-yellow-500/10 hover:bg-yellow-500/20 border border-yellow-500/20'
                      : 'bg-yellow-50 hover:bg-yellow-100 border border-yellow-200'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                    index === 0
                      ? 'bg-gradient-to-r from-yellow-400 to-amber-500'
                      : index === 1
                      ? 'bg-gradient-to-r from-gray-300 to-gray-400'
                      : 'bg-gradient-to-r from-amber-500 to-orange-600'
                  }`}>
                    {index === 0 ? (
                      <Trophy className="w-5 h-5 text-white" />
                    ) : index === 1 ? (
                      <Medal className="w-5 h-5 text-white" />
                    ) : (
                      <Award className="w-5 h-5 text-white" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {award.event?.title || '未知活动'}
                    </p>
                    <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {award.award || '获奖'} {award.ranking ? `· 第 ${award.ranking} 名` : ''}
                    </p>
                  </div>
                  <ChevronRight className={`w-4 h-4 flex-shrink-0 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                </motion.div>
              ))}
              <button
                onClick={() => navigate('/my-activities?filter=awarded')}
                className="w-full text-center text-xs text-red-500 hover:text-red-600 mt-2 py-2 transition-colors"
              >
                查看全部 →
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ActivityNotificationPanel;
