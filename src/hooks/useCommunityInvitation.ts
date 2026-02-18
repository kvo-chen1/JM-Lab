/**
 * 社群邀请与申请 Hook
 * 津脉社区平台
 */

import { useState, useEffect, useCallback, useContext, useRef } from 'react';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import { communityInvitationService } from '@/services/communityInvitationService';
import { notificationService } from '@/services/notificationService';
import type {
  CommunityInvitation,
  CommunityJoinRequest,
  CommunityInviteSettings,
  InviteRateLimit,
  CommunityInviteStats,
  SearchableUser,
  CommunityPermissions,
  CreateInvitationRequest,
  BatchCreateInvitationRequest,
  CreateJoinRequest,
  ReviewJoinRequest,
  UpdateInviteSettings,
} from '@/types/community-invitation';

// ============================================
// 邀请相关 Hook
// ============================================

export function useCommunityInvitations(communityId?: string) {
  const { user } = useContext(AuthContext);
  const [invitations, setInvitations] = useState<CommunityInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [rateLimit, setRateLimit] = useState<InviteRateLimit | null>(null);

  // 获取邀请列表
  const fetchInvitations = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await communityInvitationService.getUserInvitations(user.id, {
        asInviter: true,
      });
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  // 获取频率限制
  const fetchRateLimit = useCallback(async () => {
    if (!user?.id) {
      console.log('[fetchRateLimit] No user ID, skipping');
      return;
    }
    
    try {
      console.log('[fetchRateLimit] Fetching for user:', user.id);
      const data = await communityInvitationService.checkRateLimit(user.id);
      console.log('[fetchRateLimit] Received:', data);
      setRateLimit(data);
    } catch (error) {
      console.error('Error checking rate limit:', error);
    }
  }, [user?.id]);

  // 创建邀请
  const createInvitation = useCallback(async (request: CreateInvitationRequest) => {
    if (!user?.id) {
      toast.error('请先登录');
      return null;
    }

    try {
      const response = await communityInvitationService.createInvitation(request, user.id);
      toast.success('邀请发送成功');
      await fetchInvitations();
      await fetchRateLimit();
      return response;
    } catch (error: any) {
      toast.error(error.message || '发送邀请失败');
      return null;
    }
  }, [user?.id, fetchInvitations, fetchRateLimit]);

  // 批量创建邀请
  const createBatchInvitations = useCallback(async (request: BatchCreateInvitationRequest) => {
    if (!user?.id) {
      toast.error('请先登录');
      return null;
    }

    try {
      const response = await communityInvitationService.createBatchInvitations(request, user.id);
      
      if (response.success.length > 0) {
        toast.success(`成功发送 ${response.success.length} 个邀请`);
      }
      if (response.failed.length > 0) {
        toast.error(`${response.failed.length} 个邀请发送失败`);
      }
      
      await fetchInvitations();
      await fetchRateLimit();
      return response;
    } catch (error: any) {
      toast.error(error.message || '批量发送邀请失败');
      return null;
    }
  }, [user?.id, fetchInvitations, fetchRateLimit]);

  // 取消邀请
  const cancelInvitation = useCallback(async (invitationId: string) => {
    if (!user?.id) {
      toast.error('请先登录');
      return false;
    }

    try {
      await communityInvitationService.cancelInvitation(invitationId, user.id);
      toast.success('邀请已取消');
      await fetchInvitations();
      return true;
    } catch (error: any) {
      toast.error(error.message || '取消邀请失败');
      return false;
    }
  }, [user?.id, fetchInvitations]);

  useEffect(() => {
    fetchInvitations();
    fetchRateLimit();
  }, [fetchInvitations, fetchRateLimit]);

  return {
    invitations,
    loading,
    rateLimit,
    createInvitation,
    createBatchInvitations,
    cancelInvitation,
    refresh: fetchInvitations,
  };
}

// ============================================
// 收到的邀请 Hook
// ============================================

export function useReceivedInvitations() {
  const { user } = useContext(AuthContext);
  const [invitations, setInvitations] = useState<CommunityInvitation[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchInvitations = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await communityInvitationService.getUserInvitations(user.id, {
        asInvitee: true,
      });
      setInvitations(data);
    } catch (error) {
      console.error('Error fetching received invitations:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const acceptInvitation = useCallback(async (invitationId: string) => {
    if (!user?.id) {
      toast.error('请先登录');
      return false;
    }

    try {
      await communityInvitationService.acceptInvitation(invitationId, user.id);
      toast.success('已接受邀请，欢迎加入社群！');
      await fetchInvitations();
      return true;
    } catch (error: any) {
      toast.error(error.message || '接受邀请失败');
      return false;
    }
  }, [user?.id, fetchInvitations]);

  const rejectInvitation = useCallback(async (invitationId: string) => {
    if (!user?.id) {
      toast.error('请先登录');
      return false;
    }

    try {
      await communityInvitationService.rejectInvitation(invitationId, user.id);
      toast.success('已拒绝邀请');
      await fetchInvitations();
      return true;
    } catch (error: any) {
      toast.error(error.message || '拒绝邀请失败');
      return false;
    }
  }, [user?.id, fetchInvitations]);

  useEffect(() => {
    fetchInvitations();
  }, [fetchInvitations]);

  return {
    invitations,
    loading,
    acceptInvitation,
    rejectInvitation,
    refresh: fetchInvitations,
  };
}

// ============================================
// 申请相关 Hook
// ============================================

export function useCommunityJoinRequests(communityId: string) {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState<CommunityJoinRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [total, setTotal] = useState(0);

  const fetchRequests = useCallback(async (status?: string) => {
    setLoading(true);
    try {
      const result = await communityInvitationService.getCommunityJoinRequests(communityId, {
        status: status as any,
      });
      setRequests(result.items);
      setTotal(result.total);
    } catch (error) {
      console.error('Error fetching join requests:', error);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  const submitApplication = useCallback(async (data: CreateJoinRequest) => {
    if (!user?.id) {
      toast.error('请先登录');
      return null;
    }

    try {
      const request = await communityInvitationService.submitJoinRequest(data, user.id);
      toast.success('申请提交成功，请等待审核');
      return request;
    } catch (error: any) {
      toast.error(error.message || '提交申请失败');
      return null;
    }
  }, [user?.id]);

  const reviewApplication = useCallback(async (review: ReviewJoinRequest) => {
    if (!user?.id) {
      toast.error('请先登录');
      return false;
    }

    try {
      await communityInvitationService.approveJoinRequest(review, user.id);
      toast.success(review.action === 'approve' ? '已通过申请' : '已拒绝申请');
      await fetchRequests();
      return true;
    } catch (error: any) {
      toast.error(error.message || '审核失败');
      return false;
    }
  }, [user?.id, fetchRequests]);

  return {
    requests,
    loading,
    total,
    submitApplication,
    reviewApplication,
    refresh: fetchRequests,
  };
}

// ============================================
// 我的申请 Hook
// ============================================

export function useMyJoinRequests() {
  const { user } = useContext(AuthContext);
  const [requests, setRequests] = useState<CommunityJoinRequest[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchRequests = useCallback(async () => {
    if (!user?.id) return;
    
    setLoading(true);
    try {
      const data = await communityInvitationService.getUserJoinRequests(user.id);
      setRequests(data);
    } catch (error) {
      console.error('Error fetching my join requests:', error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  const cancelRequest = useCallback(async (requestId: string) => {
    if (!user?.id) {
      toast.error('请先登录');
      return false;
    }

    try {
      await communityInvitationService.cancelJoinRequest(requestId, user.id);
      toast.success('申请已取消');
      await fetchRequests();
      return true;
    } catch (error: any) {
      toast.error(error.message || '取消申请失败');
      return false;
    }
  }, [user?.id, fetchRequests]);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  return {
    requests,
    loading,
    cancelRequest,
    refresh: fetchRequests,
  };
}

// ============================================
// 社群设置 Hook
// ============================================

export function useCommunityInviteSettings(communityId: string) {
  const { user } = useContext(AuthContext);
  const [settings, setSettings] = useState<CommunityInviteSettings | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await communityInvitationService.getInviteSettings(communityId);
      setSettings(data);
    } catch (error) {
      console.error('Error fetching invite settings:', error);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  const updateSettings = useCallback(async (updates: UpdateInviteSettings) => {
    if (!user?.id) {
      toast.error('请先登录');
      return false;
    }

    try {
      const updated = await communityInvitationService.updateInviteSettings(
        communityId,
        updates,
        user.id
      );
      setSettings(updated);
      toast.success('设置已更新');
      return true;
    } catch (error: any) {
      toast.error(error.message || '更新设置失败');
      return false;
    }
  }, [communityId, user?.id]);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return {
    settings,
    loading,
    updateSettings,
    refresh: fetchSettings,
  };
}

// ============================================
// 权限检查 Hook
// ============================================

export function useCommunityPermissions(communityId: string) {
  const { user } = useContext(AuthContext);
  const [permissions, setPermissions] = useState<CommunityPermissions | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchPermissions = useCallback(async () => {
    if (!user?.id) {
      setPermissions(null);
      return;
    }

    setLoading(true);
    try {
      const data = await communityInvitationService.getUserPermissions(communityId, user.id);
      setPermissions(data);
    } catch (error) {
      console.error('Error fetching permissions:', error);
    } finally {
      setLoading(false);
    }
  }, [communityId, user?.id]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  return {
    permissions,
    loading,
    refresh: fetchPermissions,
  };
}

// ============================================
// 用户搜索 Hook
// ============================================

export function useUserSearch() {
  const [users, setUsers] = useState<SearchableUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const searchUsers = useCallback((query: string, communityId?: string) => {
    // 清除之前的定时器
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (!query.trim()) {
      setUsers([]);
      setError(null);
      return;
    }

    // 防抖处理：延迟 300ms 执行搜索
    searchTimeoutRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);
      try {
        console.log('[useUserSearch] Searching with communityId:', communityId);
        const data = await communityInvitationService.searchUsers({
          query: query.trim(),
          communityId,
          excludeMembers: true,
          limit: 20,
        });
        console.log('[useUserSearch] Search results:', data.length, 'users');
        setUsers(data);
        if (data.length === 0) {
          setError('未找到匹配的用户');
        } else {
          // 检查是否所有结果都是成员
          const allMembers = data.every(user => user.isMember);
          if (allMembers) {
            setError('搜索到的用户都已是该社群成员');
          }
        }
      } catch (err) {
        console.error('Error searching users:', err);
        setError('搜索失败，请稍后重试');
        setUsers([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, []);

  return {
    users,
    loading,
    error,
    searchUsers,
  };
}

// ============================================
// 统计 Hook
// ============================================

export function useCommunityInviteStats(communityId: string) {
  const [stats, setStats] = useState<CommunityInviteStats | null>(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      const data = await communityInvitationService.getCommunityStats(communityId);
      setStats(data);
    } catch (error) {
      console.error('Error fetching invite stats:', error);
    } finally {
      setLoading(false);
    }
  }, [communityId]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  return {
    stats,
    loading,
    refresh: fetchStats,
  };
}

// ============================================
// 通知 Hook
// ============================================

export function useInvitationNotifications() {
  const { user } = useContext(AuthContext);
  const [unreadCount, setUnreadCount] = useState(0);

  const fetchUnreadCount = useCallback(async () => {
    if (!user?.id) return;
    
    try {
      const count = await notificationService.getUnreadCount(user.id);
      setUnreadCount(count);
    } catch (error) {
      console.error('Error fetching unread count:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchUnreadCount();
    
    // 订阅实时通知
    if (user?.id) {
      const unsubscribe = notificationService.subscribeToNotifications(user.id, () => {
        fetchUnreadCount();
      });
      
      return () => {
        unsubscribe();
      };
    }
  }, [user?.id, fetchUnreadCount]);

  return {
    unreadCount,
    refresh: fetchUnreadCount,
  };
}
