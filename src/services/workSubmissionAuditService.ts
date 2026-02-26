// IP孵化作品审核服务
// 连接 event_submissions 表获取真实数据

import { supabase } from '@/lib/supabase';

// 定义类型
export type SubmissionStatus = 'draft' | 'pending' | 'approved' | 'rejected';
export type IPProjectType = 'character' | 'story' | 'illustration' | 'design' | 'other';
export type WorkType = 'image' | 'video' | 'audio' | 'document' | 'other';

export interface WorkSubmission {
  id: string;
  title: string;
  description: string;
  creator: {
    id: string;
    name: string;
    avatar: string;
    email: string;
    level: string;
  };
  projectType: IPProjectType;
  workType: WorkType;
  status: SubmissionStatus;
  thumbnail: string;
  files: string[];
  tags: string[];
  culturalElements: string[];
  submittedAt: string;
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
  isReported: boolean;
  reportReason?: string;
}

// 审核统计
export interface AuditStatistics {
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
export interface WorkFilterOptions {
  status?: SubmissionStatus | 'all';
  projectType?: IPProjectType | 'all';
  priority?: 'high' | 'medium' | 'low' | 'all';
  searchQuery?: string;
  sortBy?: 'date' | 'priority' | 'views';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 将数据库状态映射到组件状态
const mapDbStatusToComponent = (dbStatus: string): SubmissionStatus => {
  const statusMap: Record<string, SubmissionStatus> = {
    'draft': 'draft',
    'submitted': 'pending',
    'under_review': 'pending',
    'reviewed': 'approved',
    'published': 'approved',
    'rejected': 'rejected'
  };
  return statusMap[dbStatus] || 'pending';
};

// 将组件状态映射到数据库状态
const mapComponentStatusToDb = (status: SubmissionStatus): string => {
  const statusMap: Record<SubmissionStatus, string> = {
    'draft': 'draft',
    'pending': 'under_review',
    'approved': 'reviewed',
    'rejected': 'rejected'
  };
  return statusMap[status];
};

// 获取审核统计
export async function getAuditStatistics(): Promise<AuditStatistics> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayStr = today.toISOString();

    // 使用视图查询统计数据
    // 获取总数
    const { count: total, error: totalError } = await supabase
      .from('submission_full_details')
      .select('*', { count: 'exact', head: true });

    if (totalError) {
      console.error('获取总数失败:', totalError);
    }

    // 获取待审核数 (submitted + under_review)
    const { count: pending, error: pendingError } = await supabase
      .from('submission_full_details')
      .select('*', { count: 'exact', head: true })
      .in('status', ['submitted', 'under_review']);

    if (pendingError) {
      console.error('获取待审核数失败:', pendingError);
    }

    // 获取已通过数 (reviewed + published)
    const { count: approved, error: approvedError } = await supabase
      .from('submission_full_details')
      .select('*', { count: 'exact', head: true })
      .in('status', ['reviewed', 'published']);

    if (approvedError) {
      console.error('获取已通过数失败:', approvedError);
    }

    // 获取已驳回数
    const { count: rejected, error: rejectedError } = await supabase
      .from('submission_full_details')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'rejected');

    if (rejectedError) {
      console.error('获取已驳回数失败:', rejectedError);
    }

    // 获取今日提交数
    const { count: todaySubmitted, error: todaySubmittedError } = await supabase
      .from('submission_full_details')
      .select('*', { count: 'exact', head: true })
      .gte('submitted_at', todayStr);

    if (todaySubmittedError) {
      console.error('获取今日提交数失败:', todaySubmittedError);
    }

    // 获取今日审核数 (reviewed_at 在今天且状态不是pending)
    const { count: todayReviewed, error: todayReviewedError } = await supabase
      .from('submission_full_details')
      .select('*', { count: 'exact', head: true })
      .gte('reviewed_at', todayStr)
      .in('status', ['reviewed', 'published', 'rejected']);

    if (todayReviewedError) {
      console.error('获取今日审核数失败:', todayReviewedError);
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
      todayReviewed: todayReviewed || 0,
      avgReviewTime: 4.5, // 可以从数据库计算
      approvalRate: Math.round(approvalRate * 10) / 10
    };
  } catch (error) {
    console.error('获取审核统计失败:', error);
    // 返回默认值而不是抛出错误
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

// 获取作品列表
export async function getWorkSubmissions(options: WorkFilterOptions = {}): Promise<{ data: WorkSubmission[]; total: number }> {
  try {
    const {
      status = 'all',
      projectType = 'all',
      priority = 'all',
      searchQuery = '',
      sortBy = 'date',
      sortOrder = 'desc',
      page = 1,
      limit = 20
    } = options;

    let query = supabase
      .from('submission_full_details')
      .select('*', { count: 'exact' });

    // 状态筛选
    if (status !== 'all') {
      const dbStatus = mapComponentStatusToDb(status as SubmissionStatus);
      if (status === 'pending') {
        query = query.in('status', ['submitted', 'under_review']);
      } else if (status === 'approved') {
        query = query.in('status', ['reviewed', 'published']);
      } else {
        query = query.eq('status', dbStatus);
      }
    }

    // 搜索筛选
    if (searchQuery) {
      query = query.or(`title.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
    }

    // 排序
    let orderColumn = 'submitted_at';
    switch (sortBy) {
      case 'date':
        orderColumn = 'submitted_at';
        break;
      case 'views':
        orderColumn = 'vote_count';
        break;
      default:
        orderColumn = 'submitted_at';
    }
    query = query.order(orderColumn, { ascending: sortOrder === 'asc' });

    // 分页
    const from = (page - 1) * limit;
    const to = from + limit - 1;
    query = query.range(from, to);

    const { data, error, count } = await query;

    if (error) throw error;

    // 转换数据格式（视图已经包含创作者信息）
    const submissions: WorkSubmission[] = (data || []).map(item => {
      return {
        id: item.id,
        title: item.title || '未命名作品',
        description: item.description || '',
        creator: {
          id: item.user_id,
          name: item.creator_name || item.creator_full_name || '未知用户',
          avatar: item.creator_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${item.user_id}`,
          email: item.creator_email || '',
          level: '普通用户'
        },
        projectType: (item.metadata?.project_type as IPProjectType) || 'other',
        workType: (item.media_type as WorkType) || 'other',
        status: mapDbStatusToComponent(item.status),
        thumbnail: item.cover_image || 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop',
        files: item.files || [],
        tags: item.metadata?.tags || [],
        culturalElements: item.metadata?.cultural_elements || [],
        submittedAt: item.submitted_at || item.created_at,
        reviewedAt: item.reviewed_at,
        reviewedBy: item.reviewed_by,
        reviewNotes: item.review_notes,
        reviewReason: item.metadata?.reject_reason,
        stats: {
          views: item.vote_count || 0,
          likes: item.like_count || 0,
          comments: item.metadata?.comment_count || 0,
          shares: item.metadata?.share_count || 0
        },
        priority: item.metadata?.priority || 'medium',
        isFeatured: item.is_published || false,
        isReported: item.metadata?.is_reported || false,
        reportReason: item.metadata?.report_reason
      };
    });

    return {
      data: submissions,
      total: count || 0
    };
  } catch (error) {
    console.error('获取作品列表失败:', error);
    throw error;
  }
}

// 审核作品
export async function reviewWork(
  workId: string,
  action: 'approve' | 'reject',
  notes?: string,
  adminId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const updates: Record<string, any> = {
      status: action === 'approve' ? 'reviewed' : 'rejected',
      reviewed_at: new Date().toISOString(),
      reviewed_by: adminId,
      review_notes: notes
    };

    if (action === 'approve') {
      updates.is_published = true;
      updates.published_at = new Date().toISOString();
      updates.published_by = adminId;
    } else {
      // 保存驳回原因到metadata
      const { data: current } = await supabase
        .from('event_submissions')
        .select('metadata')
        .eq('id', workId)
        .single();

      updates.metadata = {
        ...current?.metadata,
        reject_reason: notes
      };
    }

    const { error } = await supabase
      .from('event_submissions')
      .update(updates)
      .eq('id', workId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('审核作品失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '审核失败'
    };
  }
}

// 批量审核作品
export async function batchReviewWorks(
  workIds: string[],
  action: 'approve' | 'reject',
  notes?: string,
  adminId?: string
): Promise<{ success: boolean; processed: number; error?: string }> {
  try {
    let processed = 0;

    for (const workId of workIds) {
      const result = await reviewWork(workId, action, notes, adminId);
      if (result.success) {
        processed++;
      }
    }

    return {
      success: processed === workIds.length,
      processed,
      error: processed < workIds.length ? '部分作品审核失败' : undefined
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

// 删除作品
export async function deleteWork(workId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('event_submissions')
      .delete()
      .eq('id', workId);

    if (error) throw error;

    return { success: true };
  } catch (error) {
    console.error('删除作品失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '删除失败'
    };
  }
}

// 获取作品详情
export async function getWorkDetail(workId: string): Promise<WorkSubmission | null> {
  try {
    const { data, error } = await supabase
      .from('submission_full_details')
      .select('*')
      .eq('id', workId)
      .single();

    if (error) throw error;
    if (!data) return null;

    return {
      id: data.id,
      title: data.title || '未命名作品',
      description: data.description || '',
      creator: {
        id: data.user_id,
        name: data.creator_name || data.creator_full_name || '未知用户',
        avatar: data.creator_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.user_id}`,
        email: data.creator_email || '',
        level: '普通用户'
      },
      projectType: (data.metadata?.project_type as IPProjectType) || 'other',
      workType: (data.media_type as WorkType) || 'other',
      status: mapDbStatusToComponent(data.status),
      thumbnail: data.cover_image || 'https://images.unsplash.com/photo-1561214115-f2f134cc4912?w=400&h=300&fit=crop',
      files: data.files || [],
      tags: data.metadata?.tags || [],
      culturalElements: data.metadata?.cultural_elements || [],
      submittedAt: data.submitted_at || data.created_at,
      reviewedAt: data.reviewed_at,
      reviewedBy: data.reviewed_by,
      reviewNotes: data.review_notes,
      reviewReason: data.metadata?.reject_reason,
      stats: {
        views: data.vote_count || 0,
        likes: data.like_count || 0,
        comments: data.metadata?.comment_count || 0,
        shares: data.metadata?.share_count || 0
      },
      priority: data.metadata?.priority || 'medium',
      isFeatured: data.is_published || false,
      isReported: data.metadata?.is_reported || false,
      reportReason: data.metadata?.report_reason
    };
  } catch (error) {
    console.error('获取作品详情失败:', error);
    return null;
  }
}
