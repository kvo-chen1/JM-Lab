import { supabase, supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// 类型定义
// ============================================================================

export interface OrderAudit {
  id: string;
  order_id: string;
  user_id: string;
  title: string;
  brand_name: string;
  type: string;
  description: string;
  budget_min: number;
  budget_max: number;
  deadline: string;
  duration: string;
  location: string;
  max_applicants: number;
  difficulty: string;
  requirements: string[];
  tags: string[];
  attachments?: string[];
  status: 'pending' | 'approved' | 'rejected';
  audit_opinion?: string;
  audited_by?: string;
  audited_at?: string;
  created_at: string;
  updated_at: string;
}

export interface AuditStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
}

export interface AuditFilter {
  status?: 'pending' | 'approved' | 'rejected';
  type?: string;
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

// ============================================================================
// 获取商单列表
// ============================================================================

export const getOrderAudits = async (filter: AuditFilter = {}): Promise<OrderAudit[]> => {
  try {
    // 使用 supabaseAdmin 获取所有数据（绕过 RLS）
    let query = supabaseAdmin
      .from('order_audits')
      .select('*')
      .order('created_at', { ascending: false });

    // 状态筛选
    if (filter.status) {
      query = query.eq('status', filter.status);
    }

    // 类型筛选
    if (filter.type) {
      query = query.eq('type', filter.type);
    }

    // 关键词搜索
    if (filter.keyword) {
      query = query.or(`title.ilike.%${filter.keyword}%,brand_name.ilike.%${filter.keyword}%`);
    }

    // 时间范围筛选
    if (filter.startDate) {
      query = query.gte('created_at', filter.startDate);
    }
    if (filter.endDate) {
      query = query.lte('created_at', filter.endDate);
    }

    const { data, error } = await query;

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取商单审核列表失败:', error);
    return [];
  }
};

// ============================================================================
// 获取统计数据
// ============================================================================

export const getAuditStats = async (): Promise<AuditStats> => {
  try {
    // 使用 supabaseAdmin 获取所有数据（绕过 RLS）
    const { data, error } = await supabaseAdmin
      .from('order_audits')
      .select('status', { count: 'exact' });

    if (error) throw error;

    const stats: AuditStats = {
      total: data?.length || 0,
      pending: data?.filter(item => item.status === 'pending').length || 0,
      approved: data?.filter(item => item.status === 'approved').length || 0,
      rejected: data?.filter(item => item.status === 'rejected').length || 0,
    };

    return stats;
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return { total: 0, pending: 0, approved: 0, rejected: 0 };
  }
};

// ============================================================================
// 审核商单
// ============================================================================

export const auditOrder = async (
  orderId: string,
  status: 'approved' | 'rejected',
  auditOpinion: string,
  auditorId: string
): Promise<boolean> => {
  try {
    // 使用 supabaseAdmin 绕过 RLS
    const { error } = await supabaseAdmin
      .from('order_audits')
      .update({
        status,
        audit_opinion: auditOpinion,
        audited_by: auditorId,
        audited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('审核商单失败:', error);
    return false;
  }
};

// ============================================================================
// 批量审核
// ============================================================================

export const batchAuditOrders = async (
  orderIds: string[],
  status: 'approved' | 'rejected',
  auditOpinion: string,
  auditorId: string
): Promise<boolean> => {
  try {
    // 使用 supabaseAdmin 绕过 RLS
    const { error } = await supabaseAdmin
      .from('order_audits')
      .update({
        status,
        audit_opinion: auditOpinion,
        audited_by: auditorId,
        audited_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', orderIds);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('批量审核失败:', error);
    return false;
  }
};

// ============================================================================
// 获取单个商单详情
// ============================================================================

export const getOrderAuditDetail = async (orderId: string): Promise<OrderAudit | null> => {
  try {
    // 使用 supabaseAdmin 绕过 RLS
    const { data, error } = await supabaseAdmin
      .from('order_audits')
      .select('*')
      .eq('id', orderId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('获取商单详情失败:', error);
    return null;
  }
};

// ============================================================================
// 提交商单（用户发布商单时调用）
// ============================================================================

export const submitOrderForAudit = async (orderData: Partial<OrderAudit>): Promise<string | null> => {
  try {
    // 使用 supabaseAdmin 绕过 RLS 和外键约束检查
    const { data, error } = await supabaseAdmin
      .from('order_audits')
      .insert([
        {
          ...orderData,
          status: 'pending',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select('id')
      .single();

    if (error) throw error;
    return data?.id || null;
  } catch (error) {
    console.error('提交商单审核失败:', error);
    return null;
  }
};

// ============================================================================
// 获取审核通过的商单（用于商单广场）
// ============================================================================

export const getApprovedOrders = async (): Promise<OrderAudit[]> => {
  try {
    // 使用 supabaseAdmin 绕过 RLS
    const { data, error } = await supabaseAdmin
      .from('order_audits')
      .select('*')
      .eq('status', 'approved')
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取已通过商单失败:', error);
    return [];
  }
};

// ============================================================================
// 实时更新监听
// ============================================================================

export const subscribeToOrderAudits = (
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel('order_audits_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_audits',
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
