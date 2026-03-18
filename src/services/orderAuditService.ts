import { supabase } from '@/lib/supabase';

// API 基础 URL
const API_BASE_URL = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3030';

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

// 获取当前用户的 JWT token
function getAuthToken(): string | null {
  const session = localStorage.getItem('sb-kizgwtrrsmkjeiddotup-auth-token');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      return parsed.access_token || null;
    } catch {
      return null;
    }
  }
  return null;
}

// ============================================================================
// 获取商单列表
// ============================================================================

export const getOrderAudits = async (filter: AuditFilter = {}): Promise<OrderAudit[]> => {
  try {
    const params = new URLSearchParams();
    
    if (filter.status) {
      params.append('status', filter.status);
    }
    
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-audits?${params.toString()}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取商单审核列表失败');
    }
    
    const result = await response.json();
    let data = result.data || [];
    
    // 在前端进行额外的筛选（因为后端 API 可能不支持所有筛选条件）
    if (filter.type) {
      data = data.filter((item: OrderAudit) => item.type === filter.type);
    }
    
    if (filter.keyword) {
      const keyword = filter.keyword.toLowerCase();
      data = data.filter((item: OrderAudit) => 
        item.title.toLowerCase().includes(keyword) ||
        item.brand_name.toLowerCase().includes(keyword)
      );
    }
    
    if (filter.startDate) {
      data = data.filter((item: OrderAudit) => item.created_at >= filter.startDate!);
    }
    
    if (filter.endDate) {
      data = data.filter((item: OrderAudit) => item.created_at <= filter.endDate!);
    }
    
    return data;
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
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-audits`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '获取统计数据失败');
    }
    
    const result = await response.json();
    const data = result.data || [];
    
    const stats: AuditStats = {
      total: data.length,
      pending: data.filter((item: OrderAudit) => item.status === 'pending').length,
      approved: data.filter((item: OrderAudit) => item.status === 'approved').length,
      rejected: data.filter((item: OrderAudit) => item.status === 'rejected').length,
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
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-audits/${orderId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify({
        status,
        audit_opinion: auditOpinion,
      }),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '审核商单失败');
    }
    
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
    const token = getAuthToken();
    const results = await Promise.all(
      orderIds.map(id =>
        fetch(`${API_BASE_URL}/api/order-audits/${id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': token ? `Bearer ${token}` : '',
          },
          body: JSON.stringify({
            status,
            audit_opinion: auditOpinion,
          }),
        })
      )
    );
    
    return results.every(res => res.ok);
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
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-audits/${orderId}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
      },
    });
    
    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      const error = await response.json();
      throw new Error(error.message || '获取商单详情失败');
    }
    
    const result = await response.json();
    return result.data;
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
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-audits`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': token ? `Bearer ${token}` : '',
      },
      body: JSON.stringify(orderData),
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || '提交商单审核失败');
    }
    
    const result = await response.json();
    return result.data?.id || null;
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
    return await getOrderAudits({ status: 'approved' });
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
