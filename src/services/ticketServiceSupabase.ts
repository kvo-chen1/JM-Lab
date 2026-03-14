import { supabase } from '@/lib/supabase';

// 工单状态类型
export type TicketStatus = 'pending' | 'processing' | 'resolved' | 'closed';
export type TicketPriority = 'low' | 'medium' | 'high';
export type TicketType = 'bug' | 'feature' | 'inquiry' | 'other';

// 工单类型
export interface Ticket {
  id: string;
  user_id: string;
  username: string;
  email: string;
  type: TicketType;
  title: string;
  description: string;
  screenshot?: string;
  status: TicketStatus;
  priority: TicketPriority;
  assigned_to?: string;
  resolution?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  // 关联数据
  assignee?: {
    id: string;
    username: string;
  };
  comments?: TicketComment[];
}

// 工单评论类型
export interface TicketComment {
  id: string;
  ticket_id: string;
  user_id?: string;
  admin_id?: string;
  username: string;
  content: string;
  is_internal: boolean;
  created_at: string;
}

// 工单统计类型
export interface TicketStats {
  total_count: number;
  pending_count: number;
  processing_count: number;
  resolved_count: number;
  closed_count: number;
  low_priority_count: number;
  medium_priority_count: number;
  high_priority_count: number;
  avg_resolution_hours: number;
}

class TicketServiceSupabase {
  private readonly TABLE = 'tickets';
  private readonly COMMENTS_TABLE = 'ticket_comments';
  private localTickets: Ticket[] = [];
  private readonly STORAGE_KEY = 'tickets_local';

  constructor() {
    // 从 localStorage 加载数据
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        try {
          this.localTickets = JSON.parse(stored);
        } catch (e) {
          console.error('[TicketService] 解析本地工单数据失败:', e);
        }
      }
    }
  }

  private saveToLocalStorage() {
    if (typeof window !== 'undefined') {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.localTickets));
    }
  }

  /**
   * 创建工单
   */
  async createTicket(ticketData: {
    userId: string;
    username: string;
    email: string;
    type: string;
    title: string;
    description: string;
    priority?: TicketPriority;
    screenshot?: string;
  }): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .insert({
          user_id: ticketData.userId,
          username: ticketData.username,
          email: ticketData.email,
          type: ticketData.type as TicketType,
          title: ticketData.title,
          description: ticketData.description,
          priority: ticketData.priority || 'medium',
          screenshot: ticketData.screenshot,
          status: 'pending'
        })
        .select()
        .single();

      if (error) {
        console.error('[TicketService] 创建工单失败:', error);
        // 降级到本地存储
        return this.createLocalTicket(ticketData);
      }

      return data;
    } catch (error) {
      console.error('[TicketService] 创建工单异常:', error);
      return this.createLocalTicket(ticketData);
    }
  }

  /**
   * 获取用户的所有工单
   */
  async getUserTickets(userId: string): Promise<Ticket[]> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select(`
          *,
          assignee:assigned_to(id, username)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('[TicketService] 获取工单列表失败:', error);
        // 返回本地数据
        return this.getLocalTickets(userId);
      }

      // 获取每个工单的评论
      const ticketsWithComments = await Promise.all(
        (data || []).map(async (ticket) => {
          const comments = await this.getTicketComments(ticket.id);
          return { ...ticket, comments };
        })
      );

      return ticketsWithComments;
    } catch (error) {
      console.error('[TicketService] 获取工单列表异常:', error);
      return this.getLocalTickets(userId);
    }
  }

  /**
   * 获取单个工单详情
   */
  async getTicketById(ticketId: string): Promise<Ticket | null> {
    try {
      const { data, error } = await supabase
        .from(this.TABLE)
        .select(`
          *,
          assignee:assigned_to(id, username)
        `)
        .eq('id', ticketId)
        .single();

      if (error) {
        console.error('[TicketService] 获取工单详情失败:', error);
        return this.getLocalTicketById(ticketId);
      }

      // 获取评论
      const comments = await this.getTicketComments(ticketId);
      return { ...data, comments };
    } catch (error) {
      console.error('[TicketService] 获取工单详情异常:', error);
      return this.getLocalTicketById(ticketId);
    }
  }

  /**
   * 添加工单评论
   */
  async addComment(
    ticketId: string,
    content: string,
    username: string,
    userId?: string
  ): Promise<TicketComment | null> {
    try {
      const { data, error } = await supabase
        .from(this.COMMENTS_TABLE)
        .insert({
          ticket_id: ticketId,
          user_id: userId,
          username,
          content,
          is_internal: false
        })
        .select()
        .single();

      if (error) {
        console.error('[TicketService] 添加评论失败:', error);
        return null;
      }

      return data;
    } catch (error) {
      console.error('[TicketService] 添加评论异常:', error);
      return null;
    }
  }

  /**
   * 获取工单评论
   */
  async getTicketComments(ticketId: string): Promise<TicketComment[]> {
    try {
      const { data, error } = await supabase
        .from(this.COMMENTS_TABLE)
        .select('*')
        .eq('ticket_id', ticketId)
        .eq('is_internal', false)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('[TicketService] 获取评论失败:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('[TicketService] 获取评论异常:', error);
      return [];
    }
  }

  /**
   * 获取工单统计
   */
  async getTicketStats(userId?: string): Promise<Partial<TicketStats>> {
    try {
      let query = supabase.from(this.TABLE).select('*', { count: 'exact' });

      if (userId) {
        query = query.eq('user_id', userId);
      }

      const { data, error } = await query;

      if (error) {
        console.error('[TicketService] 获取统计失败:', error);
        return this.getLocalStats(userId);
      }

      const tickets = data || [];
      return {
        total_count: tickets.length,
        pending_count: tickets.filter(t => t.status === 'pending').length,
        processing_count: tickets.filter(t => t.status === 'processing').length,
        resolved_count: tickets.filter(t => t.status === 'resolved').length,
        closed_count: tickets.filter(t => t.status === 'closed').length
      };
    } catch (error) {
      console.error('[TicketService] 获取统计异常:', error);
      return this.getLocalStats(userId);
    }
  }

  // ============ 本地存储方法（降级方案） ============

  private createLocalTicket(ticketData: {
    userId: string;
    username: string;
    email: string;
    type: string;
    title: string;
    description: string;
    priority?: TicketPriority;
    screenshot?: string;
  }): Ticket {
    const ticket: Ticket = {
      id: `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: ticketData.userId,
      username: ticketData.username,
      email: ticketData.email,
      type: ticketData.type as TicketType,
      title: ticketData.title,
      description: ticketData.description,
      priority: ticketData.priority || 'medium',
      screenshot: ticketData.screenshot,
      status: 'pending',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      comments: []
    };

    this.localTickets.unshift(ticket);
    this.saveToLocalStorage();
    return ticket;
  }

  private getLocalTickets(userId: string): Ticket[] {
    return this.localTickets
      .filter(t => t.user_id === userId)
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  private getLocalTicketById(ticketId: string): Ticket | null {
    return this.localTickets.find(t => t.id === ticketId) || null;
  }

  private getLocalStats(userId?: string): Partial<TicketStats> {
    let tickets = this.localTickets;
    if (userId) {
      tickets = tickets.filter(t => t.user_id === userId);
    }

    return {
      total_count: tickets.length,
      pending_count: tickets.filter(t => t.status === 'pending').length,
      processing_count: tickets.filter(t => t.status === 'processing').length,
      resolved_count: tickets.filter(t => t.status === 'resolved').length,
      closed_count: tickets.filter(t => t.status === 'closed').length
    };
  }
}

export const ticketServiceSupabase = new TicketServiceSupabase();
export default ticketServiceSupabase;
