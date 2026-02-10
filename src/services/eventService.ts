import { supabase } from '@/lib/supabase';

// 活动类型定义
export interface Event {
  id: string;
  title: string;
  description: string;
  content: string;
  start_time: string;
  end_time: string;
  location?: string;
  organizer_id: string;
  participants: number;
  max_participants?: number;
  is_public: boolean;
  type: 'online' | 'offline';
  tags: string[];
  thumbnail_url?: string;
  media: any[];
  status: 'draft' | 'pending' | 'published' | 'rejected';
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  created_at: string;
  updated_at: string;
}

// 活动服务类
class EventService {
  // 创建活动
  async createEvent(data: {
    title: string;
    description: string;
    content: string;
    start_time: string;
    end_time: string;
    location?: string;
    type: 'online' | 'offline';
    tags?: string[];
    thumbnail_url?: string;
    media?: any[];
    max_participants?: number;
    is_public?: boolean;
    contact_name?: string;
    contact_phone?: string;
    contact_email?: string;
    status?: 'draft' | 'pending' | 'published';
  }): Promise<Event | null> {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .insert([{
          ...data,
          participants: 0,
          status: data.status || 'draft',
        }])
        .select()
        .single();

      if (error) {
        console.error('创建活动失败:', error);
        // 如果表不存在，使用 localStorage 作为临时存储
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          return this.createEventLocal(data);
        }
        throw error;
      }
      return event;
    } catch (error) {
      console.error('创建活动失败:', error);
      // 使用 localStorage 作为回退
      return this.createEventLocal(data);
    }
  }

  // 使用 localStorage 创建活动（回退方案）
  private createEventLocal(data: any): Event {
    const events = this.getEventsLocal();
    const newEvent: Event = {
      id: `local-${Date.now()}`,
      ...data,
      participants: 0,
      organizer_id: 'local-user',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };
    events.push(newEvent);
    localStorage.setItem('jmzf_events', JSON.stringify(events));
    return newEvent;
  }

  // 从 localStorage 获取活动
  private getEventsLocal(): Event[] {
    try {
      const data = localStorage.getItem('jmzf_events');
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  // 更新活动
  async updateEvent(eventId: string, data: Partial<Event>): Promise<Event | null> {
    try {
      const { data: event, error } = await supabase
        .from('events')
        .update({
          ...data,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId)
        .select()
        .single();

      if (error) throw error;
      return event;
    } catch (error) {
      console.error('更新活动失败:', error);
      return null;
    }
  }

  // 获取活动详情
  async getEvent(eventId: string): Promise<Event | null> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('获取活动详情失败:', error);
      return null;
    }
  }

  // 获取所有活动（管理员用）
  async getAllEvents(options?: {
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<{ events: Event[]; total: number }> {
    try {
      const { status, page = 1, limit = 20 } = options || {};
      
      let query = supabase
        .from('events')
        .select('*', { count: 'exact' });

      if (status && status !== 'all') {
        query = query.eq('status', status);
      }

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      const { data, error, count } = await query
        .order('created_at', { ascending: false })
        .range(from, to);

      if (error) throw error;

      return {
        events: data || [],
        total: count || 0,
      };
    } catch (error) {
      console.error('获取活动列表失败:', error);
      return { events: [], total: 0 };
    }
  }

  // 获取已发布的活动（公开用）
  async getPublishedEvents(): Promise<Event[]> {
    try {
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .eq('status', 'published')
        .gte('end_time', new Date().toISOString())
        .order('start_time', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取已发布活动失败:', error);
      return [];
    }
  }

  // 获取用户的活动
  async getUserEvents(userId: string, options?: {
    status?: string;
    limit?: number;
  }): Promise<Event[]> {
    try {
      let query = supabase
        .from('events')
        .select('*')
        .eq('organizer_id', userId);

      if (options?.status) {
        query = query.eq('status', options.status);
      }

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取用户活动失败:', error);
        // 如果表不存在，使用 localStorage
        if (error.code === '42P01' || error.message?.includes('does not exist')) {
          let events = this.getEventsLocal();
          if (options?.status) {
            events = events.filter(e => e.status === options.status);
          }
          if (options?.limit) {
            events = events.slice(0, options.limit);
          }
          return events;
        }
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error('获取用户活动失败:', error);
      // 使用 localStorage 作为回退
      let events = this.getEventsLocal();
      if (options?.status) {
        events = events.filter(e => e.status === options.status);
      }
      if (options?.limit) {
        events = events.slice(0, options.limit);
      }
      return events;
    }
  }

  // 删除活动
  async deleteEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .delete()
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除活动失败:', error);
      return false;
    }
  }

  // 发布活动（提交审核）
  async publishEvent(eventId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          status: 'pending',
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('发布活动失败:', error);
      return false;
    }
  }

  // 审核活动（管理员用）
  async reviewEvent(eventId: string, status: 'published' | 'rejected', adminNotes?: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('events')
        .update({
          status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', eventId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('审核活动失败:', error);
      return false;
    }
  }

  // 获取活动统计数据
  async getStats(): Promise<{
    totalEvents: number;
    publishedEvents: number;
    pendingEvents: number;
    draftEvents: number;
  }> {
    try {
      const { count: totalEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

      const { count: publishedEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'published');

      const { count: pendingEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending');

      const { count: draftEvents } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'draft');

      return {
        totalEvents: totalEvents || 0,
        publishedEvents: publishedEvents || 0,
        pendingEvents: pendingEvents || 0,
        draftEvents: draftEvents || 0,
      };
    } catch (error) {
      console.error('获取统计数据失败:', error);
      return {
        totalEvents: 0,
        publishedEvents: 0,
        pendingEvents: 0,
        draftEvents: 0,
      };
    }
  }
}

export const eventService = new EventService();
