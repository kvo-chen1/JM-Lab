import type { OrderAudit } from './orderAuditService';

// API 基础 URL
const API_BASE_URL = import.meta.env.VITE_LOCAL_API_URL || 'http://localhost:3030';

// ============================================================================
// 类型定义
// ============================================================================

export interface BrandOrder extends OrderAudit {
  applications?: OrderApplication[];
  application_count?: number;
}

export interface OrderApplication {
  id: string;
  order_id: string;
  creator_id: string;
  creator_name?: string;
  creator_avatar?: string;
  status: 'pending' | 'approved' | 'rejected';
  message?: string;
  portfolio_url?: string;
  created_at: string;
  updated_at: string;
}

export interface BrandOrderStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  totalApplications: number;
  pendingApplications: number;
}

export interface BrandOrderFilter {
  status?: 'pending' | 'approved' | 'rejected';
  keyword?: string;
  startDate?: string;
  endDate?: string;
}

// 获取当前用户的 JWT token
function getAuthToken(): string | null {
  // 尝试从 Supabase 存储中获取 token
  const session = localStorage.getItem('sb-kizgwtrrsmkjeiddotup-auth-token');
  if (session) {
    try {
      const parsed = JSON.parse(session);
      return parsed.access_token || null;
    } catch {
      return null;
    }
  }
  // 尝试从自定义存储中获取 token
  const token = localStorage.getItem('token');
  return token || null;
}

// ============================================================================
// 获取品牌方的商单列表
// ============================================================================

export const getBrandOrders = async (
  userId: string,
  filter: BrandOrderFilter = {}
): Promise<BrandOrder[]> => {
  try {
    const params = new URLSearchParams();
    params.append('user_id', userId);
    
    if (filter.status) {
      params.append('status', filter.status);
    }
    if (filter.keyword) {
      params.append('keyword', filter.keyword);
    }
    if (filter.startDate) {
      params.append('start_date', filter.startDate);
    }
    if (filter.endDate) {
      params.append('end_date', filter.endDate);
    }

    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-audits?${params.toString()}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('获取品牌方商单列表失败:', error);
    return [];
  }
};

// ============================================================================
// 获取品牌方商单统计数据
// ============================================================================

export const getBrandOrderStats = async (userId: string): Promise<BrandOrderStats> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-audits?user_id=${userId}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    const data = result.data || [];
    
    // 计算统计数据
    const stats: BrandOrderStats = {
      total: data.length,
      pending: data.filter((item: any) => item.status === 'pending').length,
      approved: data.filter((item: any) => item.status === 'approved').length,
      rejected: data.filter((item: any) => item.status === 'rejected').length,
      totalApplications: 0,
      pendingApplications: 0,
    };
    
    return stats;
  } catch (error) {
    console.error('获取品牌方商单统计失败:', error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      totalApplications: 0,
      pendingApplications: 0,
    };
  }
};

// ============================================================================
// 获取商单的接单申请列表
// ============================================================================

export const getOrderApplications = async (orderId: string): Promise<OrderApplication[]> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-applications?order_id=${orderId}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || [];
  } catch (error) {
    console.error('获取接单申请列表失败:', error);
    return [];
  }
};

// ============================================================================
// 审核接单申请
// ============================================================================

export const reviewApplication = async (
  applicationId: string,
  status: 'approved' | 'rejected',
  reviewNote?: string
): Promise<boolean> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-applications/${applicationId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status,
        review_note: reviewNote,
        reviewed_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('审核接单申请失败:', error);
    return false;
  }
};

// ============================================================================
// 批量审核接单申请
// ============================================================================

export const batchReviewApplications = async (
  applicationIds: string[],
  status: 'approved' | 'rejected',
  reviewNote?: string
): Promise<boolean> => {
  try {
    const token = getAuthToken();
    // 逐个审核
    for (const id of applicationIds) {
      const response = await fetch(`${API_BASE_URL}/api/order-applications/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status,
          review_note: reviewNote,
          reviewed_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    }

    return true;
  } catch (error) {
    console.error('批量审核接单申请失败:', error);
    return false;
  }
};

// ============================================================================
// 获取商单详情（包含接单申请）
// ============================================================================

export const getBrandOrderDetail = async (orderId: string): Promise<BrandOrder | null> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-audits/${orderId}`, {
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.data || null;
  } catch (error) {
    console.error('获取商单详情失败:', error);
    return null;
  }
};

// ============================================================================
// 更新商单信息
// ============================================================================

export const updateBrandOrder = async (
  orderId: string,
  updates: Partial<OrderAudit>
): Promise<boolean> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-audits/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(updates),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('更新商单失败:', error);
    return false;
  }
};

// ============================================================================
// 关闭/结束商单
// ============================================================================

export const closeBrandOrder = async (orderId: string): Promise<boolean> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-audits/${orderId}`, {
      method: 'PUT',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        status: 'closed',
        updated_at: new Date().toISOString(),
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('关闭商单失败:', error);
    return false;
  }
};

// ============================================================================
// 删除商单
// ============================================================================

export const deleteBrandOrder = async (orderId: string): Promise<boolean> => {
  try {
    const token = getAuthToken();
    const response = await fetch(`${API_BASE_URL}/api/order-audits/${orderId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': token ? `Bearer ${token}` : '',
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return true;
  } catch (error) {
    console.error('删除商单失败:', error);
    return false;
  }
};

// ============================================================================
// 实时更新监听（使用 Supabase Realtime）
// ============================================================================

import { supabase } from '@/lib/supabase';

export const subscribeToBrandOrders = (
  userId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel('brand_orders_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_audits',
        filter: `user_id=eq.${userId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

export const subscribeToOrderApplications = (
  orderId: string,
  callback: (payload: any) => void
) => {
  const channel = supabase
    .channel('order_applications_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_applications',
        filter: `order_id=eq.${orderId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
