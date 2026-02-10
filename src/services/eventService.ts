import { supabase } from '@/lib/supabase';

// 活动类型定义 - 匹配实际数据库结构
export interface Event {
  id: string;
  title: string;
  description?: string;
  content?: string;
  start_time?: string;
  end_time?: string;
  start_date?: number;  // 数据库实际字段
  end_date?: number;    // 数据库实际字段
  location?: string;
  organizer_id?: string;
  participants?: number;
  max_participants?: number;
  is_public?: boolean;
  type?: 'online' | 'offline';
  tags?: string[];
  thumbnail_url?: string;
  media?: any[];
  status?: 'draft' | 'pending' | 'published' | 'rejected';
  contact_name?: string;
  contact_phone?: string;
  contact_email?: string;
  brand_id?: string;
  brand_name?: string;
  created_at?: string | number;
  updated_at?: string | number;
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
    organizer_id?: string;
    brand_id?: string;
    brand_name?: string;
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
      organizer_id: data.organizer_id || 'local-user',
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
    brandId?: string;
  }): Promise<Event[]> {
    try {
      // 尝试使用 RPC 函数获取活动（绕过 RLS）
      console.log('getUserEvents - 尝试使用 RPC 函数获取活动:', userId);
      const { data: rpcData, error: rpcError } = await supabase.rpc('get_user_events_simple', {
        p_user_id: userId
      });

      if (rpcError) {
        console.log('getUserEvents - RPC 函数失败，尝试直接查询:', rpcError.message);
      } else if (rpcData && rpcData.length > 0) {
        console.log('getUserEvents - RPC 函数获取到活动数:', rpcData.length);
        // 将 RPC 返回的数据转换为 Event 格式
        let events = rpcData.map((item: any) => ({
          id: item.id,
          title: item.title,
          description: item.description,
          organizer_id: item.organizer_id,
          status: item.status,
          created_at: item.created_at,
          // 其他字段使用默认值
          content: '',
          start_date: 0,
          end_date: 0,
          location: '',
          type: 'offline',
          tags: [],
          media: [],
          is_public: true,
          max_participants: 0,
        })) as Event[];

        // 如果有状态过滤
        if (options?.status) {
          events = events.filter(e => e.status === options.status);
        }

        return events;
      }

      // 如果 RPC 失败或没有数据，尝试直接查询
      let query = supabase
        .from('events')
        .select('*');

      // 按组织者ID过滤（如果提供了userId）
      if (userId) {
        query = query.eq('organizer_id', userId);
      }

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
      
      let events = data || [];
      
      // 如果没有找到活动且提供了brandId，尝试按品牌ID查询
      if (events.length === 0 && options?.brandId) {
        let brandQuery = supabase
          .from('events')
          .select('*')
          .eq('brand_id', options.brandId);
        
        if (options?.status) {
          brandQuery = brandQuery.eq('status', options.status);
        }
        
        const { data: brandEvents } = await brandQuery
          .order('created_at', { ascending: false });
        
        events = brandEvents || [];
      }
      
      return events;
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

  // 更新活动并重新提交审核（用于已发布/已拒绝的活动编辑）
  async updateEventAndResubmit(
    eventId: string,
    data: Partial<Event>
  ): Promise<{ success: boolean; message: string; newStatus?: string }> {
    try {
      // 使用 RPC 函数来更新并重新提交审核
      const { data: result, error } = await supabase.rpc('update_event_and_resubmit', {
        p_event_id: eventId,
        p_organizer_id: data.organizer_id,
        p_event_data: data,
      });

      if (error) {
        console.error('更新活动并重新提交审核失败:', error);
        return { success: false, message: '操作失败，请稍后重试' };
      }

      return {
        success: result.success,
        message: result.message,
        newStatus: result.new_status,
      };
    } catch (error) {
      console.error('更新活动并重新提交审核失败:', error);
      return { success: false, message: '操作失败，请稍后重试' };
    }
  }

  // 提交活动审核（用于草稿/已拒绝状态的活动）
  async submitEventForReview(eventId: string): Promise<{ success: boolean; message: string }> {
    try {
      const { data: result, error } = await supabase.rpc('submit_event_for_review', {
        p_event_id: eventId,
        p_organizer_id: (await supabase.auth.getUser()).data.user?.id,
      });

      if (error) {
        console.error('提交审核失败:', error);
        return { success: false, message: '提交审核失败，请稍后重试' };
      }

      return {
        success: result.success,
        message: result.message,
      };
    } catch (error) {
      console.error('提交审核失败:', error);
      return { success: false, message: '提交审核失败，请稍后重试' };
    }
  }

  // 获取活动编辑历史
  async getEventEditHistory(eventId: string, limit: number = 10): Promise<any[]> {
    try {
      const { data, error } = await supabase.rpc('get_event_edit_history', {
        p_event_id: eventId,
        p_limit: limit,
      });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取编辑历史失败:', error);
      return [];
    }
  }

  // 检查活动是否可以编辑
  async canEditEvent(eventId: string, userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase.rpc('can_edit_event', {
        p_event_id: eventId,
        p_user_id: userId,
      });

      if (error) throw error;
      return data || false;
    } catch (error) {
      console.error('检查编辑权限失败:', error);
      // 降级方案：直接查询活动
      try {
        const { data: event } = await supabase
          .from('events')
          .select('status, organizer_id')
          .eq('id', eventId)
          .single();
        
        return event?.organizer_id === userId && 
               ['draft', 'rejected', 'pending'].includes(event?.status);
      } catch {
        return false;
      }
    }
  }

  // 获取活动的完整信息（包含审核状态）
  async getEventFullInfo(eventId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('organizer_events_full')
        .select('*')
        .eq('id', eventId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('获取活动完整信息失败:', error);
      // 降级到普通查询
      return this.getEvent(eventId);
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
