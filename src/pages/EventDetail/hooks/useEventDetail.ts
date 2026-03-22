import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { Event } from '@/types';
import { eventService } from '@/services/eventService';

export interface EventDetailData {
  event: Event | null;
  loading: boolean;
  error: string | null;
  viewCount: number;
  participantCount: number;
}

export function useEventDetail(): EventDetailData {
  const { eventId } = useParams<{ eventId: string }>();
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewCount, setViewCount] = useState(0);
  const [participantCount, setParticipantCount] = useState(0);

  useEffect(() => {
    if (!eventId) {
      setError('活动 ID 不存在');
      setLoading(false);
      return;
    }

    loadEventDetail();
  }, [eventId]);

  const loadEventDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('[EventDetail] 加载活动详情，ID:', eventId);

      // 使用 API 获取活动详情
      const eventData = await eventService.get<Event>(`/api/events/${eventId}`);

      console.log('[EventDetail] 活动数据:', eventData.title);

      setEvent(eventData);
      setViewCount((eventData as any).view_count || 0);
      setParticipantCount(eventData.participants || 0);

      // 增加浏览次数（不等待结果）
      supabase
        .from('events')
        .update({ view_count: ((eventData as any).view_count || 0) + 1 })
        .eq('id', eventId)
        .then(({ error }) => {
          if (error) console.error('更新浏览次数失败:', error);
        });

    } catch (err: any) {
      console.error('加载活动详情失败:', err);
      setError(err.message || '活动不存在');
      toast.error(err.message || '加载活动详情失败');
    } finally {
      setLoading(false);
    }
  };

  return {
    event,
    loading,
    error,
    viewCount,
    participantCount
  };
}
