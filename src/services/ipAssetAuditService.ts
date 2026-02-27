// IP资产审核服务
// 连接 ip_assets 表获取真实IP资产数据

import { supabase } from '@/lib/supabase';

// IP资产类型
export type IPAssetType = 'illustration' | 'pattern' | 'design' | '3d_model' | 'digital_collectible';

// IP资产状态
export type IPAssetStatus = 'active' | 'archived' | 'deleted' | 'pending_review' | 'approved' | 'rejected';

// IP资产数据
export interface IPAsset {
  id: string;
  name: string;
  description: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    email: string;
    level: string;
  };
  type: IPAssetType;
  status: IPAssetStatus;
  thumbnail: string;
  commercialValue: number;
  originalWorkId?: string;
  stages: {
    id: string;
    name: string;
    description: string;
    completed: boolean;
    completedAt?: string;
  }[];
  createdAt: string;
  updatedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  reviewNotes?: string;
  reviewReason?: string;
  stats: {
    views: number;
    likes: number;
    comments: number;
    shares: number;
  };
  priority: 'high' | 'medium' | 'low';
  isFeatured: boolean;
  tags: string[];
  culturalElements: string[];
}

// 审核统计
export interface IPAssetAuditStatistics {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  todaySubmitted: number;
  todayReviewed: number;
  avgReviewTime: number;
  approvalRate: number;
}

// 筛选选项
export interface IPAssetFilterOptions {
  status?: IPAssetStatus | 'all';
  type?: IPAssetType | 'all';
  priority?: 'high' | 'medium' | 'low' | 'all';
  searchQuery?: string;
  sortBy?: 'date' | 'priority' | 'value';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 获取审核统计
export async function getIPAssetAuditStatistics(): Promise<IPAssetAuditStatistics> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    // 获取总数
    const { count: total, error: totalError } = await supabase
      .from('ip_assets')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('获取总数失败:', totalError);
    }

    // 获取待审核数
    const { count: pending, error: pendingError } = await supabase
      .from('ip_assets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['pending_review']);

    if (pendingError) {
      console.error('获取待审核数失败:', pendingError);
    }

    // 获取已通过数
    const { count: approved, error: approvedError } = await supabase
      .from('ip_assets')
      .select('*', { count: 'exact', head: true })
      .in('status', ['active', 'approved']);

    if (approvedError) {
      console.error('获取已通过数失败:', approvedError);
    }

    // 获取已驳回数
    const { count: rejected, error: rejectedError } = await supabase
      .from('ip_assets')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    if (rejectedError) {
      console.error('获取已驳回数失败:', rejectedError);
    }

    // 获取今日提交数
    const { count: todaySubmitted, error: todaySubmittedError } = await supabase
      .from('ip_assets')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', todayStr);

    if (todaySubmittedError) {
      console.error('获取今日提交数失败:', todaySubmittedError);
    }

    // 计算通过率和平均审核时间
    const totalReviewed = (approved || 0) + (rejected || 0);
    const approvalRate = totalReviewed > 0 ? ((approved || 0) / totalReviewed) * 100 : 0;

    return {
      total: total || 0,
      pending: pending || 0,
      approved: approved || 0,
      rejected: rejected || 0,
      todaySubmitted: todaySubmitted || 0,
      todayReviewed: 0, // IP资产表没有 reviewed_at 字段
      avgReviewTime: 0,
      approvalRate: Math.round(approvalRate * 10) / 10
    };
  } catch (error) {
    console.error('获取审核统计失败:', error);
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      todaySubmitted: 0,
      todayReviewed: 0,
      avgReviewTime: 0,
      approvalRate: 0
    };
  }
}

// 获取IP资产列表
export async function getIPAssets(options: IPAssetFilterOptions = {}): Promise<{ data: IPAsset[]; total: number }> {
  try {
    const {
      status = 'all',
      type = 'all',
      priority = 'all',
      searchQuery = '',
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = options;

    let query = supabase
      .from('ip_assets')
      .select(`
        *,
        stages:ip_stages(*)
      `, { count: 'exact' });

    // 状态筛选
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    // 类型筛选
    if (type !== 'all') {
      query = query.eq('type', type);
    }

    // 搜索筛选
    if (searchQuery) {
      query = query.or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    // 排序
    let orderColumn = 'created_at';
    switch (sortBy) {
      case 'date':
        orderColumn = 'created_at';
        break;
      case 'value':
        orderColumn = 'commercial_value';
        break;
      default:
        orderColumn = 'created_at';
    }
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // 分页
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // 获取所有用户ID
    const userIds = [...new Set((data || []).map(item => item.user_id))];
    console.log('[ipAssetAuditService] 需要获取的用户ID:', userIds);

    // 批量获取用户信息 - 使用 public.users 表
    let userMap = new Map();
    if (userIds.length > 0) {
      // 首先尝试从 public.users 表获取
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('id, username, avatar_url, email')
        .in('id', userIds);

      if (userError) {
        console.error('从 users 表获取用户信息失败:', userError);
      } else if (userData && userData.length > 0) {
        console.log('[ipAssetAuditService] 从 users 表获取到的用户数据:', userData);
        userMap = new Map(userData.map((u: any) => [u.id, u]));
      } else {
        console.log('[ipAssetAuditService] users 表中没有找到用户数据，尝试使用 RPC');
        // 如果 users 表没有数据，尝试使用 RPC 函数
        try {
          const { data: rpcUserData, error: rpcError } = await supabase
            .rpc('get_auth_users_info', { user_ids: userIds });

          if (rpcError) {
            console.error('从 RPC 获取用户信息失败:', rpcError);
          } else {
            console.log('[ipAssetAuditService] 从 RPC 获取到的用户数据:', rpcUserData);
            userMap = new Map(rpcUserData?.map((u: any) => [u.id, u]) || []);
          }
        } catch (e) {
          console.error('RPC 调用异常:', e);
        }
      }
      console.log('[ipAssetAuditService] 最终用户Map:', Array.from(userMap.entries()));
    }

    // 转换数据格式
    const assets: IPAsset[] = (data || []).map(item => {
      const user = userMap.get(item.user_id);
      
      // 计算完成阶段数
      const stages = item.stages || [];
      const completedStages = stages.filter((s: any) => s.completed).length;
      const totalStages = stages.length;
      
      return {
        id: item.id,
        name: item.name || '未命名IP',
        description: item.description || '',
        creator: {
          id: item.user_id,
          name: user?.username || '未知用户',
          avatar: user?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`,
          email: user?.email || '',
          level: '普通用户'
        },
        type: item.type,
        status: item.status,
        thumbnail: item.thumbnail || 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop',
        commercialValue: item.commercial_value || 0,
        originalWorkId: item.original_work_id,
        stages: stages.map((s: any) => ({
          id: s.id,
          name: s.name,
          description: s.description,
          completed: s.completed,
          completedAt: s.completed_at
        })),
        createdAt: item.created_at,
        updatedAt: item.updated_at,
        stats: {
          views: item.view_count || 0,
          likes: item.like_count || 0,
          comments: 0,
          shares: 0
        },
        priority: item.priority || 'medium',
        isFeatured: item.is_featured || false,
        tags: item.tags || [],
        culturalElements: item.cultural_elements || []
      };
    });

    return {
      data: assets,
      total: count || 0
    };
  } catch (error) {
    console.error('获取IP资产列表失败:', error);
    throw error;
  }
}

// 审核IP资产
export async function reviewIPAsset(
  assetId: string,
  action: 'approve' | 'reject',
  notes?: string,
  adminId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: Record<string, any> = {
      status: action === 'approve' ? 'active' : 'rejected',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase
      .from('ip_assets')
      .update(updates)
      .eq('id', assetId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('审核IP资产失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '审核失败'
    };
  }
}

// 批量审核IP资产
export async function batchReviewIPAssets(
  assetIds: string[],
  action: 'approve' | 'reject',
  notes?: string,
  adminId?: string
): Promise<{ success: boolean; processed: number; error?: string }> {
  try {
    let processed = 0;

    for (const assetId of assetIds) {
      const result = await reviewIPAsset(assetId, action, notes, adminId);
      if (result.success) {
        processed++;
      }
    }

    return {
      success: processed === assetIds.length,
      processed,
      error: processed < assetIds.length ? '部分IP资产审核失败' : undefined
    };
  } catch (error) {
    console.error('批量审核失败:', error);
    return {
      success: false,
      processed: 0,
      error: error instanceof Error ? error.message : '批量审核失败'
    };
  }
}

// 删除IP资产
export async function deleteIPAsset(assetId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('ip_assets')
      .delete()
      .eq('id', assetId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('删除IP资产失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除失败'
    };
  }
}

// 获取IP资产详情
export async function getIPAssetDetail(assetId: string): Promise<IPAsset | null> {
  try {
    const { data, error } = await supabase
      .from('ip_assets')
      .select(`
        *,
        stages:ip_stages(*)
      `)
      .eq('id', assetId)
      .single();

    if (error) throw error;
    if (!data) return null;

    // 获取创作者信息
    const { data: userData } = await supabase
      .from('users')
      .select('id, raw_user_meta_data, email')
      .eq('id', data.user_id)
      .single();

    const meta = userData?.raw_user_meta_data || {};
    const stages = data.stages || [];

    return {
      id: data.id,
      name: data.name || '未命名IP',
      description: data.description || '',
      creator: {
        id: data.user_id,
        name: meta.username || meta.name || '未知用户',
        avatar: meta.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user_id}`,
        email: userData?.email || meta.email || '',
        level: meta.level || '普通用户'
      },
      type: data.type,
      status: data.status,
      thumbnail: data.thumbnail || 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop',
      commercialValue: data.commercial_value || 0,
      originalWorkId: data.original_work_id,
      stages: stages.map((s: any) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        completed: s.completed,
        completedAt: s.completed_at
      })),
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      stats: {
        views: 0,
        likes: 0,
        comments: 0,
        shares: 0
      },
      priority: 'medium',
      isFeatured: false,
      tags: [],
      culturalElements: []
    };
  } catch (error) {
    console.error('获取IP资产详情失败:', error);
    return null;
  }
}
