import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useEventService } from '@/hooks/useEventService';
import { Event, ActivityParticipation } from '@/types';
import eventBus from '@/services/enhancedEventBus';

interface EventContextType {
  events: Event[];
  userParticipations: ActivityParticipation[];
  isLoading: boolean;
  error: string | null;
  refreshEvents: () => Promise<void>;
  refreshUserParticipations: () => Promise<void>;
  createEvent: (eventData: any) => Promise<Event>;
  updateEvent: (eventId: string, eventData: any) => Promise<Event>;
  registerForEvent: (eventId: string, userId: string) => Promise<any>;
  submitEventWork: (eventId: string, workData: any) => Promise<any>;
  getEventById: (eventId: string) => Event | undefined;
}

const EventContext = createContext<EventContextType | undefined>(undefined);

export const useEventContext = () => {
  const context = useContext(EventContext);
  if (!context) {
    throw new Error('useEventContext must be used within an EventProvider');
  }
  return context;
};

interface EventProviderProps {
  children: ReactNode;
}

export const EventProvider: React.FC<EventProviderProps> = ({ children }) => {
  const [events, setEvents] = useState<Event[]>([]);
  const [userParticipations, setUserParticipations] = useState<ActivityParticipation[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const { 
    getEvents, 
    getUserEvents, 
    getEventParticipants, 
    createEvent, 
    updateEvent, 
    registerForEvent, 
    submitEventWork 
  } = useEventService();

  // 刷新活动列表
  const refreshEvents = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const eventList = await getEvents();
      setEvents(eventList);
    } catch (err) {
      setError('获取活动列表失败');
      console.error('刷新活动列表失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, [getEvents]);

  // 刷新用户参与记录
  const refreshUserParticipations = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        // 这里应该调用获取用户参与记录的API
        // 暂时使用模拟数据
        const participations = await fetch('/api/activities/participations', {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token') || ''}`,
          }
        }).then(res => res.json()).then(data => data.data || []);
        setUserParticipations(participations);
      }
    } catch (err) {
      setError('获取用户参与记录失败');
      console.error('刷新用户参与记录失败:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // 根据ID获取活动
  const getEventById = useCallback((eventId: string): Event | undefined => {
    return events.find(event => event.id === eventId);
  }, [events]);

  // 初始化数据
  useEffect(() => {
    refreshEvents();
    refreshUserParticipations();
  }, [refreshEvents, refreshUserParticipations]);

  // 监听事件总线
  useEffect(() => {
    const handleEventCreated = () => refreshEvents();
    const handleEventUpdated = () => refreshEvents();
    const handleEventRegistered = () => refreshUserParticipations();
    const handleWorkSubmitted = () => refreshUserParticipations();

    eventBus.on('event:created', handleEventCreated);
    eventBus.on('event:updated', handleEventUpdated);
    eventBus.on('event:registered', handleEventRegistered);
    eventBus.on('event:work_submitted', handleWorkSubmitted);

    return () => {
      eventBus.off('event:created', handleEventCreated);
      eventBus.off('event:updated', handleEventUpdated);
      eventBus.off('event:registered', handleEventRegistered);
      eventBus.off('event:work_submitted', handleWorkSubmitted);
    };
  }, [refreshEvents, refreshUserParticipations]);

  const value: EventContextType = {
    events,
    userParticipations,
    isLoading,
    error,
    refreshEvents,
    refreshUserParticipations,
    createEvent,
    updateEvent,
    registerForEvent,
    submitEventWork,
    getEventById,
  };

  return <EventContext.Provider value={value}>{children}</EventContext.Provider>;
};
