import { supabase, supabaseAdmin } from '@/lib/supabase';

// ============================================================================
// 类型定义
// ============================================================================

export interface OrderExecution {
  id: string;
  order_id: string;
  user_id: string;
  work_id?: string;
  order_title: string;
  brand_name: string;
  product_name: string;
  product_url: string;
  product_image?: string;
  commission_rate: number; // 佣金比例（%）
  status: 'active' | 'paused' | 'ended';
  click_count: number;
  conversion_count: number;
  total_sales: number;
  total_earnings: number;
  created_at: string;
  updated_at: string;
}

export interface OrderExecutionStats {
  totalOrders: number;
  activeOrders: number;
  totalClicks: number;
  totalConversions: number;
  totalEarnings: number;
}

export interface OrderExecutionDetail extends OrderExecution {
  daily_stats: DailyStat[];
  recent_clicks: ClickRecord[];
}

export interface DailyStat {
  date: string;
  clicks: number;
  conversions: number;
  sales: number;
  earnings: number;
}

export interface ClickRecord {
  id: string;
  execution_id: string;
  user_id?: string;
  clicked_at: string;
  converted: boolean;
  sale_amount?: number;
}

export interface ProductLink {
  id: string;
  work_id: string;
  order_id?: string;
  product_name: string;
  product_url: string;
  product_image?: string;
  price?: number;
  commission_rate?: number;
  click_count: number;
  conversion_count: number;
  created_at: string;
}

// ============================================================================
// 获取创作者的商单执行列表
// ============================================================================

export const getCreatorOrderExecutions = async (userId: string): Promise<OrderExecution[]> => {
  try {
    // 使用 supabaseAdmin 绕过 RLS
    const { data, error } = await supabaseAdmin
      .from('order_executions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取商单执行列表失败:', error);
    return [];
  }
};

// ============================================================================
// 获取品牌方的商单执行列表
// ============================================================================

export const getBrandOrderExecutions = async (brandName: string): Promise<OrderExecution[]> => {
  try {
    const { data, error } = await supabase
      .from('order_executions')
      .select('*')
      .eq('brand_name', brandName)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取品牌商单执行失败:', error);
    return [];
  }
};

// ============================================================================
// 获取商单执行详情
// ============================================================================

export const getOrderExecutionDetail = async (executionId: string): Promise<OrderExecutionDetail | null> => {
  try {
    // 获取基本信息
    const { data: execution, error: execError } = await supabase
      .from('order_executions')
      .select('*')
      .eq('id', executionId)
      .single();

    if (execError) throw execError;

    // 获取每日统计
    const { data: dailyStats } = await supabase
      .from('order_execution_daily_stats')
      .select('*')
      .eq('execution_id', executionId)
      .order('date', { ascending: false })
      .limit(30);

    // 获取最近点击记录
    const { data: recentClicks } = await supabase
      .from('order_execution_clicks')
      .select('*')
      .eq('execution_id', executionId)
      .order('clicked_at', { ascending: false })
      .limit(20);

    return {
      ...execution,
      daily_stats: dailyStats || [],
      recent_clicks: recentClicks || [],
    };
  } catch (error) {
    console.error('获取商单执行详情失败:', error);
    return null;
  }
};

// ============================================================================
// 创建商单执行（创作者接单并添加链接）
// ============================================================================

export const createOrderExecution = async (data: {
  order_id: string;
  user_id: string;
  order_title: string;
  brand_name: string;
  product_name: string;
  product_url: string;
  product_image?: string;
  commission_rate: number;
}): Promise<string | null> => {
  try {
    // 使用 supabaseAdmin 绕过 RLS
    const { data: result, error } = await supabaseAdmin
      .from('order_executions')
      .insert([
        {
          ...data,
          status: 'active',
          click_count: 0,
          conversion_count: 0,
          total_sales: 0,
          total_earnings: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select('id')
      .single();

    if (error) throw error;
    return result?.id || null;
  } catch (error) {
    console.error('创建商单执行失败:', error);
    return null;
  }
};

// ============================================================================
// 记录点击
// ============================================================================

export const recordClick = async (executionId: string, userId?: string): Promise<boolean> => {
  try {
    // 记录点击
    await supabase
      .from('order_execution_clicks')
      .insert([
        {
          execution_id: executionId,
          user_id: userId,
          clicked_at: new Date().toISOString(),
          converted: false,
        },
      ]);

    // 更新点击计数
    await supabase.rpc('increment_click_count', {
      p_execution_id: executionId,
    });

    return true;
  } catch (error) {
    console.error('记录点击失败:', error);
    return false;
  }
};

// ============================================================================
// 记录转化
// ============================================================================

export const recordConversion = async (
  executionId: string,
  saleAmount: number,
  userId?: string
): Promise<boolean> => {
  try {
    // 获取佣金比例
    const { data: execution } = await supabase
      .from('order_executions')
      .select('commission_rate')
      .eq('id', executionId)
      .single();

    if (!execution) return false;

    const earnings = saleAmount * (execution.commission_rate / 100);

    // 记录转化
    await supabase
      .from('order_execution_clicks')
      .insert([
        {
          execution_id: executionId,
          user_id: userId,
          clicked_at: new Date().toISOString(),
          converted: true,
          sale_amount: saleAmount,
        },
      ]);

    // 更新转化数据
    await supabase.rpc('increment_conversion', {
      p_execution_id: executionId,
      p_sale_amount: saleAmount,
      p_earnings: earnings,
    });

    return true;
  } catch (error) {
    console.error('记录转化失败:', error);
    return false;
  }
};

// ============================================================================
// 获取统计数据
// ============================================================================

export const getOrderExecutionStats = async (userId: string): Promise<OrderExecutionStats> => {
  try {
    const { data, error } = await supabase
      .from('order_executions')
      .select('*')
      .eq('user_id', userId);

    if (error) throw error;

    const stats: OrderExecutionStats = {
      totalOrders: data?.length || 0,
      activeOrders: data?.filter(item => item.status === 'active').length || 0,
      totalClicks: data?.reduce((sum, item) => sum + (item.click_count || 0), 0) || 0,
      totalConversions: data?.reduce((sum, item) => sum + (item.conversion_count || 0), 0) || 0,
      totalEarnings: data?.reduce((sum, item) => sum + (item.total_earnings || 0), 0) || 0,
    };

    return stats;
  } catch (error) {
    console.error('获取统计数据失败:', error);
    return {
      totalOrders: 0,
      activeOrders: 0,
      totalClicks: 0,
      totalConversions: 0,
      totalEarnings: 0,
    };
  }
};

// ============================================================================
// 获取作品的商单链接
// ============================================================================

export const getWorkProductLinks = async (workId: string): Promise<ProductLink[]> => {
  try {
    const { data, error } = await supabase
      .from('product_links')
      .select('*')
      .eq('work_id', workId)
      .order('created_at', { ascending: false });

    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('获取作品链接失败:', error);
    return [];
  }
};

// ============================================================================
// 添加作品商单链接
// ============================================================================

export const addWorkProductLink = async (data: {
  work_id: string;
  order_id?: string;
  product_name: string;
  product_url: string;
  product_image?: string;
  price?: number;
  commission_rate?: number;
}): Promise<string | null> => {
  try {
    const { data: result, error } = await supabase
      .from('product_links')
      .insert([
        {
          ...data,
          click_count: 0,
          conversion_count: 0,
          created_at: new Date().toISOString(),
        },
      ])
      .select('id')
      .single();

    if (error) throw error;
    return result?.id || null;
  } catch (error) {
    console.error('添加作品链接失败:', error);
    return null;
  }
};

// ============================================================================
// 实时更新监听
// ============================================================================

export const subscribeToOrderExecutions = (callback: (payload: any) => void) => {
  const channel = supabase
    .channel('order_executions_changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'order_executions',
      },
      callback
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};
