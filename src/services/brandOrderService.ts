import { supabase, supabaseAdmin } from '@/lib/supabase';
import type { OrderAudit } from './orderAuditService';
import type { OrderExecution } from './orderExecutionService';

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

// ============================================================================
// 获取品牌方的商单列表
// ============================================================================

export const getBrandOrders = async (
  userId: string,
  filter: BrandOrderFilter = {}
): Promise<BrandOrder[]> => {
  try {
    let query = supabaseAdmin
      .from('order_audits')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    // 状态筛选
    if (filter.status) {
      query = query.eq('status', filter.status);
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
    console.error('获取品牌方商单列表失败:', error);
    return [];
  }
};

// ============================================================================
// 获取品牌方商单统计数据
// ============================================================================

export const getBrandOrderStats = async (userId: string): Promise<BrandOrderStats> => {
  try {
    const { data, error } = await supabaseAdmin
      .from('order_audits')
      .select('status')
      .eq('user_id', userId);

    if (error) throw error;

    // 获取接单申请统计
    const { data: applications, error: appError } = await supabaseAdmin
      .from('order_applications')
      .select('status')
      .in('order_id', data?.map(d => d.id) || []);

    if (appError) throw appError;

    const stats: BrandOrderStats = {
      total: data?.length || 0,
      pending: data?.filter(item => item.status === 'pending').length || 0,
      approved: data?.filter(item => item.status === 'approved').length || 0,
      rejected: data?.filter(item => item.status === 'rejected').length || 0,
      totalApplications: applications?.length || 0,
      pendingApplications: applications?.filter(a => a.status === 'pending').length || 0,
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
    const { data, error } = await supabaseAdmin
      .from('order_applications')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
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
    const { error } = await supabaseAdmin
      .from('order_applications')
      .update({
        status,
        review_note: reviewNote,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (error) throw error;
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
    const { error } = await supabaseAdmin
      .from('order_applications')
      .update({
        status,
        review_note: reviewNote,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .in('id', applicationIds);

    if (error) throw error;
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
    // 获取商单基本信息
    const { data: order, error: orderError } = await supabaseAdmin
      .from('order_audits')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) throw orderError;

    // 获取接单申请
    const { data: applications, error: appError } = await supabaseAdmin
      .from('order_applications')
      .select('*')
      .eq('order_id', orderId)
      .order('created_at', { ascending: false });

    if (appError) throw appError;

    return {
      ...order,
      applications: applications || [],
      application_count: applications?.length || 0,
    };
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
    const { error } = await supabaseAdmin
      .from('order_audits')
      .update({
        ...updates,
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;
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
    const { error } = await supabaseAdmin
      .from('order_audits')
      .update({
        status: 'closed',
        updated_at: new Date().toISOString(),
      })
      .eq('id', orderId);

    if (error) throw error;
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
    const { error } = await supabaseAdmin
      .from('order_audits')
      .delete()
      .eq('id', orderId);

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('删除商单失败:', error);
    return false;
  }
};

// ============================================================================
// 实时更新监听
// ============================================================================

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
