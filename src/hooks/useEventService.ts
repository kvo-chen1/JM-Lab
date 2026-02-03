import { useCallback } from 'react';
import { Event, EventCreateRequest, EventUpdateRequest, EventPublishRequest } from '@/types';
import { eventService } from '@/services/apiService';
import { toast } from 'sonner';

export const useEventService = () => {
  // 创建活动
  const createEvent = useCallback(async (eventData: EventCreateRequest): Promise<Event> => {
    try {
      return await eventService.post<Event>('/api/events', eventData);
    } catch (error) {
      toast.error('创建活动失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 更新活动
  const updateEvent = useCallback(async (eventId: string, eventData: EventUpdateRequest): Promise<Event> => {
    try {
      return await eventService.put<Event>(`/api/events/${eventId}`, eventData);
    } catch (error) {
      toast.error('更新活动失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 获取活动详情
  const getEvent = useCallback(async (eventId: string): Promise<Event> => {
    try {
      return await eventService.get<Event>(`/api/events/${eventId}`);
    } catch (error) {
      toast.error('获取活动详情失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 获取活动列表
  const getEvents = useCallback(async (params?: any): Promise<Event[]> => {
    try {
      return await eventService.get<Event[]>('/api/events', params);
    } catch (error) {
      toast.error('获取活动列表失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 删除活动
  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    try {
      await eventService.delete(`/api/events/${eventId}`);
      toast.success('活动已删除');
    } catch (error) {
      toast.error('删除活动失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 发布活动
  const publishEvent = useCallback(async (eventId: string, publishData?: EventPublishRequest): Promise<Event> => {
    try {
      const result = await eventService.post<Event>(`/api/events/${eventId}/publish`, publishData || { eventId });
      toast.success('活动已提交发布');
      return result;
    } catch (error) {
      toast.error('发布活动失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 发布到津脉活动平台
  const publishToJinmaiPlatform = useCallback(async (eventId: string, publishData?: any): Promise<{ success: boolean; message: string; platformEventId: string }> => {
    try {
      const result = await eventService.publishToJinmaiPlatform(eventId, publishData || {});
      toast.success('活动已成功发布到津脉活动平台');
      return result;
    } catch (error) {
      toast.error('发布到津脉活动平台失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 撤销发布
  const unpublishEvent = useCallback(async (eventId: string): Promise<Event> => {
    try {
      const result = await eventService.post<Event>(`/api/events/${eventId}/unpublish`);
      toast.success('活动已撤销发布');
      return result;
    } catch (error) {
      toast.error('撤销发布失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 审核活动
  const reviewEvent = useCallback(async (eventId: string, status: 'approved' | 'rejected', reason?: string): Promise<Event> => {
    try {
      const result = await eventService.post<Event>(`/api/events/${eventId}/review`, { status, reason });
      toast.success(`活动已${status === 'approved' ? '通过' : '拒绝'}审核`);
      return result;
    } catch (error) {
      toast.error('审核活动失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 获取用户创建的活动
  const getUserEvents = useCallback(async (userId: string, params?: any): Promise<Event[]> => {
    try {
      return await eventService.get<Event[]>(`/api/users/${userId}/events`, params);
    } catch (error) {
      toast.error('获取用户活动失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 获取活动参与记录
  const getEventParticipants = useCallback(async (eventId: string, params?: any): Promise<any[]> => {
    try {
      return await eventService.getEventParticipants(eventId, params);
    } catch (error) {
      toast.error('获取活动参与记录失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 报名参加活动
  const registerForEvent = useCallback(async (eventId: string, userId: string): Promise<any> => {
    try {
      const result = await eventService.registerForEvent(eventId, userId);
      toast.success('报名成功');
      return result;
    } catch (error) {
      toast.error('报名失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 提交活动作品
  const submitEventWork = useCallback(async (eventId: string, workData: any): Promise<any> => {
    try {
      const result = await eventService.submitEventWork(eventId, workData);
      toast.success('作品提交成功');
      return result;
    } catch (error) {
      toast.error('作品提交失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 审核活动参与者
  const approveParticipant = useCallback(async (eventId: string, registrationId: string): Promise<any> => {
    try {
      const result = await eventService.approveParticipant(eventId, registrationId);
      toast.success('参与者已通过审核');
      return result;
    } catch (error) {
      toast.error('审核参与者失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 拒绝活动参与者
  const rejectParticipant = useCallback(async (eventId: string, registrationId: string, reason: string): Promise<any> => {
    try {
      const result = await eventService.rejectParticipant(eventId, registrationId, reason);
      toast.success('参与者已拒绝');
      return result;
    } catch (error) {
      toast.error('拒绝参与者失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 审核活动提交作品
  const reviewSubmission = useCallback(async (eventId: string, submissionId: string, data: { status: 'approved' | 'rejected'; score?: number; feedback?: string }): Promise<any> => {
    try {
      const result = await eventService.reviewSubmission(eventId, submissionId, data);
      toast.success('作品审核完成');
      return result;
    } catch (error) {
      toast.error('审核作品失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 获取活动提交作品列表
  const getEventSubmissions = useCallback(async (eventId: string, params?: any): Promise<any[]> => {
    try {
      return await eventService.getEventSubmissions(eventId, params);
    } catch (error) {
      toast.error('获取活动提交作品失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 获取活动统计数据
  const getEventStats = useCallback(async (eventId: string): Promise<any> => {
    try {
      return await eventService.getEventStats(eventId);
    } catch (error) {
      toast.error('获取活动统计数据失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 同步活动数据
  const syncEventData = useCallback(async (eventId: string): Promise<any> => {
    try {
      const result = await eventService.syncEventData(eventId);
      toast.success('活动数据同步成功');
      return result;
    } catch (error) {
      toast.error('同步活动数据失败，请稍后重试');
      throw error;
    }
  }, []);
  
  return {
    createEvent,
    updateEvent,
    getEvent,
    getEvents,
    deleteEvent,
    publishEvent,
    publishToJinmaiPlatform,
    unpublishEvent,
    reviewEvent,
    getUserEvents,
    getEventParticipants,
    registerForEvent,
    submitEventWork,
    approveParticipant,
    rejectParticipant,
    reviewSubmission,
    getEventSubmissions,
    getEventStats,
    syncEventData,
  };
};
