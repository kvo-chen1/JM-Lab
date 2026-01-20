import { useCallback } from 'react';
import { Event, EventCreateRequest, EventUpdateRequest, EventPublishRequest } from '@/types';
import { apiService } from '@/services/apiService';
import { toast } from 'sonner';

export const useEventService = () => {
  // 创建活动
  const createEvent = useCallback(async (eventData: EventCreateRequest): Promise<Event> => {
    try {
      const response = await apiService.post<Event>('/events', eventData);
      return response.data;
    } catch (error) {
      toast.error('创建活动失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 更新活动
  const updateEvent = useCallback(async (eventId: string, eventData: EventUpdateRequest): Promise<Event> => {
    try {
      const response = await apiService.put<Event>(`/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      toast.error('更新活动失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 获取活动详情
  const getEvent = useCallback(async (eventId: string): Promise<Event> => {
    try {
      const response = await apiService.get<Event>(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      toast.error('获取活动详情失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 获取活动列表
  const getEvents = useCallback(async (params?: any): Promise<Event[]> => {
    try {
      const response = await apiService.get<Event[]>('/events', params);
      return response.data;
    } catch (error) {
      toast.error('获取活动列表失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 删除活动
  const deleteEvent = useCallback(async (eventId: string): Promise<void> => {
    try {
      await apiService.delete(`/events/${eventId}`);
      toast.success('活动已删除');
    } catch (error) {
      toast.error('删除活动失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 发布活动
  const publishEvent = useCallback(async (eventId: string, publishData?: EventPublishRequest): Promise<Event> => {
    try {
      const response = await apiService.post<Event>(`/events/${eventId}/publish`, publishData || { eventId });
      toast.success('活动已提交发布');
      return response.data;
    } catch (error) {
      toast.error('发布活动失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 撤销发布
  const unpublishEvent = useCallback(async (eventId: string): Promise<Event> => {
    try {
      const response = await apiService.post<Event>(`/events/${eventId}/unpublish`);
      toast.success('活动已撤销发布');
      return response.data;
    } catch (error) {
      toast.error('撤销发布失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 审核活动
  const reviewEvent = useCallback(async (eventId: string, status: 'approved' | 'rejected', reason?: string): Promise<Event> => {
    try {
      const response = await apiService.post<Event>(`/events/${eventId}/review`, { status, reason });
      toast.success(`活动已${status === 'approved' ? '通过' : '拒绝'}审核`);
      return response.data;
    } catch (error) {
      toast.error('审核活动失败，请稍后重试');
      throw error;
    }
  }, []);
  
  // 获取用户创建的活动
  const getUserEvents = useCallback(async (userId: string, params?: any): Promise<Event[]> => {
    try {
      const response = await apiService.get<Event[]>(`/users/${userId}/events`, params);
      return response.data;
    } catch (error) {
      toast.error('获取用户活动失败，请稍后重试');
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
    unpublishEvent,
    reviewEvent,
    getUserEvents,
  };
};