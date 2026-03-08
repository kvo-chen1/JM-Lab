import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';

export type NavItemType =
  | 'feedback'
  | 'eventAudit'
  | 'contentAudit'
  | 'userAudit'
  | 'permissions'
  | 'productManagement'
  | 'notificationManagement'
  | 'jinmaiCommunity'
  | 'campaigns'
  | 'users'
  | 'creators'
  | 'workSubmissionAudit'
  | 'promotionUserManagement'
  | 'marketplace';

export interface NavNotificationState {
  count: number;
  hasNew: boolean;
  lastViewedAt: Date | null;
}

export type NavNotificationsMap = Record<NavItemType, NavNotificationState>;

const initialState: NavNotificationState = {
  count: 0,
  hasNew: false,
  lastViewedAt: null,
};

const STORAGE_KEY = 'admin_nav_notifications';

export interface UseNavNotificationsReturn {
  notifications: NavNotificationsMap;
  markAsViewed: (navItem: NavItemType) => void;
  markAllAsViewed: () => void;
  refreshNotifications: () => Promise<void>;
  isLoading: boolean;
  lastUpdated: Date | null;
  totalUnreadCount: number;
}

export const useNavNotifications = (): UseNavNotificationsReturn => {
  const [notifications, setNotifications] = useState<NavNotificationsMap>(() => {
    // 从 localStorage 恢复状态
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
          const parsed = JSON.parse(saved);
          return Object.keys(parsed).reduce((acc, key) => {
            acc[key as NavItemType] = {
              ...parsed[key],
              lastViewedAt: parsed[key].lastViewedAt ? new Date(parsed[key].lastViewedAt) : null,
            };
            return acc;
          }, {} as NavNotificationsMap);
        }
      } catch {
        // 忽略解析错误
      }
    }
    return {
      feedback: { ...initialState },
      eventAudit: { ...initialState },
      contentAudit: { ...initialState },
      userAudit: { ...initialState },
      permissions: { ...initialState },
      productManagement: { ...initialState },
      notificationManagement: { ...initialState },
      jinmaiCommunity: { ...initialState },
      campaigns: { ...initialState },
      users: { ...initialState },
      creators: { ...initialState },
      workSubmissionAudit: { ...initialState },
      promotionUserManagement: { ...initialState },
    };
  });

  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 保存到 localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
      } catch {
        // 忽略存储错误
      }
    }
  }, [notifications]);

  // 获取各模块的待处理数量
  const fetchNotificationCounts = useCallback(async () => {
    setIsLoading(true);
    try {
      const newNotifications = { ...notifications };

      // 并行获取各模块数据
      const [
        feedbackResult,
        eventAuditResult,
        contentAuditResult,
        userAuditResult,
        ordersResult,
        communitiesResult,
        usersResult,
      ] = await Promise.allSettled([
        // 反馈管理 - 待处理反馈
        supabase
          .from('user_feedback')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // 活动审核 - 待审核活动
        supabase
          .from('events')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // 内容审核 - 待审核内容
        supabase
          .from('content_moderation')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // 用户审计 - 异常行为记录
        supabase
          .from('user_audit_logs')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending_review'),

        // 商品管理/订单 - 待处理订单
        supabase
          .from('exchange_records')
          .select('id', { count: 'exact', head: true })
          .in('status', ['pending', 'processing']),

        // 社群管理 - 待审核加入请求
        supabase
          .from('community_join_requests')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),

        // 用户管理 - 待审核用户
        supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true })
          .eq('verification_status', 'pending'),

        // 推广用户管理 - 待审核申请
        supabase
          .from('promotion_applications')
          .select('id', { count: 'exact', head: true })
          .eq('status', 'pending'),
      ]);

      // 处理反馈管理结果
      if (feedbackResult.status === 'fulfilled' && feedbackResult.value.count !== null) {
        const count = feedbackResult.value.count;
        newNotifications.feedback = {
          ...newNotifications.feedback,
          count,
          hasNew: count > 0 && (!newNotifications.feedback.lastViewedAt || 
            Date.now() - newNotifications.feedback.lastViewedAt.getTime() < 300000),
        };
      }

      // 处理活动审核结果
      if (eventAuditResult.status === 'fulfilled' && eventAuditResult.value.count !== null) {
        const count = eventAuditResult.value.count;
        newNotifications.eventAudit = {
          ...newNotifications.eventAudit,
          count,
          hasNew: count > 0 && (!newNotifications.eventAudit.lastViewedAt || 
            Date.now() - newNotifications.eventAudit.lastViewedAt.getTime() < 300000),
        };
      }

      // 处理内容审核结果
      if (contentAuditResult.status === 'fulfilled' && contentAuditResult.value.count !== null) {
        const count = contentAuditResult.value.count;
        newNotifications.contentAudit = {
          ...newNotifications.contentAudit,
          count,
          hasNew: count > 0 && (!newNotifications.contentAudit.lastViewedAt || 
            Date.now() - newNotifications.contentAudit.lastViewedAt.getTime() < 300000),
        };
      }

      // 处理用户审计结果
      if (userAuditResult.status === 'fulfilled' && userAuditResult.value.count !== null) {
        const count = userAuditResult.value.count;
        newNotifications.userAudit = {
          ...newNotifications.userAudit,
          count,
          hasNew: count > 0 && (!newNotifications.userAudit.lastViewedAt || 
            Date.now() - newNotifications.userAudit.lastViewedAt.getTime() < 300000),
        };
      }

      // 处理商品管理/订单结果
      if (ordersResult.status === 'fulfilled' && ordersResult.value.count !== null) {
        const count = ordersResult.value.count;
        newNotifications.productManagement = {
          ...newNotifications.productManagement,
          count,
          hasNew: count > 0 && (!newNotifications.productManagement.lastViewedAt ||
            Date.now() - newNotifications.productManagement.lastViewedAt.getTime() < 300000),
        };
      }

      // 处理津脉社区管理结果
      if (communitiesResult.status === 'fulfilled' && communitiesResult.value.count !== null) {
        const count = communitiesResult.value.count;
        newNotifications.jinmaiCommunity = {
          ...newNotifications.jinmaiCommunity,
          count,
          hasNew: count > 0 && (!newNotifications.jinmaiCommunity.lastViewedAt ||
            Date.now() - newNotifications.jinmaiCommunity.lastViewedAt.getTime() < 300000),
        };
      }

      // 处理用户管理结果
      if (usersResult.status === 'fulfilled' && usersResult.value.count !== null) {
        const count = usersResult.value.count;
        newNotifications.users = {
          ...newNotifications.users,
          count,
          hasNew: count > 0 && (!newNotifications.users.lastViewedAt || 
            Date.now() - newNotifications.users.lastViewedAt.getTime() < 300000),
        };
      }

      // 处理推广用户管理结果
      const promotionUserResult = results[7];
      if (promotionUserResult.status === 'fulfilled' && promotionUserResult.value.count !== null) {
        const count = promotionUserResult.value.count;
        newNotifications.promotionUserManagement = {
          ...newNotifications.promotionUserManagement,
          count,
          hasNew: count > 0 && (!newNotifications.promotionUserManagement.lastViewedAt || 
            Date.now() - newNotifications.promotionUserManagement.lastViewedAt.getTime() < 300000),
        };
      }

      setNotifications(newNotifications);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('获取通知数量失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 标记某个导航项为已查看
  const markAsViewed = useCallback((navItem: NavItemType) => {
    setNotifications((prev) => ({
      ...prev,
      [navItem]: {
        ...prev[navItem],
        hasNew: false,
        lastViewedAt: new Date(),
      },
    }));
  }, []);

  // 标记所有为已查看
  const markAllAsViewed = useCallback(() => {
    setNotifications((prev) => {
      const newState = { ...prev };
      Object.keys(newState).forEach((key) => {
        newState[key as NavItemType] = {
          ...newState[key as NavItemType],
          hasNew: false,
          lastViewedAt: new Date(),
        };
      });
      return newState;
    });
  }, []);

  // 设置实时订阅
  useEffect(() => {
    // 初始加载
    fetchNotificationCounts();

    // 设置轮询（每30秒刷新一次）
    pollingRef.current = setInterval(() => {
      fetchNotificationCounts();
    }, 30000);

    // Realtime 功能已禁用 - 本地开发环境不支持 WebSocket
    // Realtime disabled - WebSocket not supported in local dev environment
    console.log('[NavNotifications] Realtime subscriptions skipped (not supported in local environment)');

    // 清理函数
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [fetchNotificationCounts]);

  // 计算总未读数
  const totalUnreadCount = Object.values(notifications).reduce(
    (sum, item) => sum + (item.hasNew ? item.count : 0),
    0
  );

  return {
    notifications,
    markAsViewed,
    markAllAsViewed,
    refreshNotifications: fetchNotificationCounts,
    isLoading,
    lastUpdated,
    totalUnreadCount,
  };
};

export default useNavNotifications;
