import { supabase, supabaseAdmin } from '@/lib/supabase';

// 举报类型
export type ReportType = 
  | 'spam'           // 垃圾广告
  | 'provocative'    // 引战
  | 'pornographic'   // 色情
  | 'personal_attack'// 人身攻击
  | 'illegal'        // 违法信息
  | 'political_rumor'// 涉政谣言
  | 'social_rumor'   // 涉社会事件谣言
  | 'false_info'     // 虚假不实信息
  | 'external_link'  // 违法信息外链
  | 'other';         // 其他

// 举报状态
export type ReportStatus = 'pending' | 'processing' | 'resolved' | 'rejected';

// 举报目标类型
export type ReportTargetType = 'feed' | 'comment' | 'user' | 'work';

// 举报类型配置
export const REPORT_TYPE_CONFIG: Record<ReportType, { label: string; color: string; description?: string }> = {
  spam: { label: '垃圾广告', color: '#ef4444', description: '包含商业广告、垃圾信息等内容' },
  provocative: { label: '引战', color: '#f59e0b', description: '故意挑起争端、煽动对立情绪' },
  pornographic: { label: '色情', color: '#ec4899', description: '包含色情、淫秽内容' },
  personal_attack: { label: '人身攻击', color: '#8b5cf6', description: '针对特定个人的侮辱、诽谤' },
  illegal: { label: '违法信息', color: '#dc2626', description: '涉及违法犯罪活动的信息' },
  political_rumor: { label: '涉政谣言', color: '#7c3aed', description: '政治相关的虚假信息' },
  social_rumor: { label: '涉社会事件谣言', color: '#0891b2', description: '社会热点事件的虚假信息' },
  false_info: { label: '虚假不实信息', color: '#ea580c', description: '其他类型的虚假信息' },
  external_link: { label: '违法信息外链', color: '#be123c', description: '链接指向违法违规内容' },
  other: { label: '其他', color: '#6b7280', description: '其他违规内容' }
};

// 举报状态配置
export const REPORT_STATUS_CONFIG: Record<ReportStatus, { label: string; color: string; bgColor: string }> = {
  pending: { label: '待处理', color: '#f59e0b', bgColor: 'bg-yellow-100' },
  processing: { label: '处理中', color: '#3b82f6', bgColor: 'bg-blue-100' },
  resolved: { label: '已处理', color: '#10b981', bgColor: 'bg-green-100' },
  rejected: { label: '已驳回', color: '#6b7280', bgColor: 'bg-gray-100' }
};

// 举报数据类型
export interface Report {
  id: string;
  reporter_id: string;
  target_type: ReportTargetType;
  target_id: string;
  target_author_id?: string;
  report_type: ReportType;
  description?: string;
  screenshots?: string[];
  status: ReportStatus;
  admin_id?: string;
  admin_response?: string;
  action_taken?: string;
  created_at: string;
  updated_at: string;
  resolved_at?: string;
  // 关联数据
  reporter?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  target_author?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  admin?: {
    id: string;
    username: string;
  };
  // 目标内容（动态/评论等）
  target_content?: {
    id: string;
    content?: string;
    title?: string;
    media_urls?: string[];
    created_at: string;
  };
}

// 举报统计数据
export interface ReportStats {
  total_count: number;
  pending_count: number;
  processing_count: number;
  resolved_count: number;
  rejected_count: number;
  today_count: number;
  type_distribution: Record<ReportType, number>;
}

// 创建举报
export async function createReport(data: {
  target_type: ReportTargetType;
  target_id: string;
  target_author_id?: string;
  report_type: ReportType;
  description?: string;
  screenshots?: string[];
}): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return { success: false, error: '请先登录' };
    }

    // 检查是否已经举报过
    const { data: existingReport } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('target_type', data.target_type)
      .eq('target_id', data.target_id)
      .maybeSingle();

    if (existingReport) {
      return { success: false, error: '您已经举报过该内容' };
    }

    const { error } = await supabaseAdmin
      .from('reports')
      .insert({
        reporter_id: user.id,
        target_type: data.target_type,
        target_id: data.target_id,
        target_author_id: data.target_author_id,
        report_type: data.report_type,
        description: data.description,
        screenshots: data.screenshots || [],
        status: 'pending'
      });

    if (error) throw error;

    return { success: true };
  } catch (error: any) {
    console.error('创建举报失败:', error);
    return { success: false, error: error.message || '举报失败，请重试' };
  }
}

// 获取举报列表（管理员）
export async function getReports(params: {
  page?: number;
  limit?: number;
  status?: ReportStatus;
  type?: ReportType;
  target_type?: ReportTargetType;
  search?: string;
}): Promise<{ reports: Report[]; total: number }> {
  try {
    const { page = 1, limit = 20, status, type, target_type, search } = params;
    const offset = (page - 1) * limit;

    let query = supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact' });

    if (status) {
      query = query.eq('status', status);
    }
    if (type) {
      query = query.eq('report_type', type);
    }
    if (target_type) {
      query = query.eq('target_type', target_type);
    }
    if (search) {
      query = query.or(`description.ilike.%${search}%,reporter_id.in.(select id from users where username.ilike.%${search}%)`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) throw error;

    // 获取关联数据
    const reports = await enrichReports(data || []);

    return { reports, total: count || 0 };
  } catch (error: any) {
    console.error('获取举报列表失败:', error);
    return { reports: [], total: 0 };
  }
}

// 获取举报详情
export async function getReportById(id: string): Promise<Report | null> {
  try {
    const { data, error } = await supabaseAdmin
      .from('reports')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    if (!data) return null;

    const [enriched] = await enrichReports([data]);
    return enriched;
  } catch (error: any) {
    console.error('获取举报详情失败:', error);
    return null;
  }
}

// 更新举报状态
export async function updateReportStatus(
  reportId: string,
  status: ReportStatus,
  adminId?: string
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      updated_at: new Date().toISOString()
    };

    if (adminId) {
      updateData.admin_id = adminId;
    }

    if (status === 'resolved' || status === 'rejected') {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabaseAdmin
      .from('reports')
      .update(updateData)
      .eq('id', reportId);

    if (error) throw error;

    return true;
  } catch (error: any) {
    console.error('更新举报状态失败:', error);
    return false;
  }
}

// 提交处理结果
export async function submitReportResponse(
  reportId: string,
  response: string,
  actionTaken: string,
  adminId: string
): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('reports')
      .update({
        admin_response: response,
        action_taken: actionTaken,
        admin_id: adminId,
        status: 'resolved',
        resolved_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', reportId);

    if (error) throw error;

    return true;
  } catch (error: any) {
    console.error('提交处理结果失败:', error);
    return false;
  }
}

// 获取举报统计
export async function getReportStats(): Promise<ReportStats> {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // 获取总数统计
    const { data: statusCounts, error: statusError } = await supabaseAdmin
      .from('reports')
      .select('status')
      .then(({ data }) => {
        if (!data) return { data: [] };
        const counts = {
          total: data.length,
          pending: data.filter(r => r.status === 'pending').length,
          processing: data.filter(r => r.status === 'processing').length,
          resolved: data.filter(r => r.status === 'resolved').length,
          rejected: data.filter(r => r.status === 'rejected').length
        };
        return { data: counts };
      });

    // 获取今日统计
    const { count: todayCount } = await supabaseAdmin
      .from('reports')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', today.toISOString());

    // 获取类型分布
    const { data: typeData } = await supabaseAdmin
      .from('reports')
      .select('report_type');

    const typeDistribution: Record<string, number> = {};
    typeData?.forEach((item: any) => {
      typeDistribution[item.report_type] = (typeDistribution[item.report_type] || 0) + 1;
    });

    return {
      total_count: statusCounts?.total || 0,
      pending_count: statusCounts?.pending || 0,
      processing_count: statusCounts?.processing || 0,
      resolved_count: statusCounts?.resolved || 0,
      rejected_count: statusCounts?.rejected || 0,
      today_count: todayCount || 0,
      type_distribution: typeDistribution as Record<ReportType, number>
    };
  } catch (error: any) {
    console.error('获取举报统计失败:', error);
    return {
      total_count: 0,
      pending_count: 0,
      processing_count: 0,
      resolved_count: 0,
      rejected_count: 0,
      today_count: 0,
      type_distribution: {} as Record<ReportType, number>
    };
  }
}

// 删除举报
export async function deleteReport(reportId: string): Promise<boolean> {
  try {
    const { error } = await supabaseAdmin
      .from('reports')
      .delete()
      .eq('id', reportId);

    if (error) throw error;
    return true;
  } catch (error: any) {
    console.error('删除举报失败:', error);
    return false;
  }
}

// 富化举报数据（获取关联信息）
async function enrichReports(reports: any[]): Promise<Report[]> {
  if (reports.length === 0) return [];

  const reporterIds = [...new Set(reports.map(r => r.reporter_id).filter(Boolean))];
  const authorIds = [...new Set(reports.map(r => r.target_author_id).filter(Boolean))];
  const adminIds = [...new Set(reports.map(r => r.admin_id).filter(Boolean))];

  // 获取用户信息
  const { data: users } = await supabaseAdmin
    .from('users')
    .select('id, username, avatar_url')
    .in('id', [...reporterIds, ...authorIds, ...adminIds]);

  const userMap = new Map(users?.map(u => [u.id, u]) || []);

  // 获取目标内容
  const feedIds = reports.filter(r => r.target_type === 'feed').map(r => r.target_id);
  const commentIds = reports.filter(r => r.target_type === 'comment').map(r => r.target_id);

  const { data: feeds } = feedIds.length > 0 ? await supabaseAdmin
    .from('feeds')
    .select('id, content, title, media_urls, created_at')
    .in('id', feedIds) : { data: [] };

  const { data: comments } = commentIds.length > 0 ? await supabaseAdmin
    .from('comments')
    .select('id, content, created_at')
    .in('id', commentIds) : { data: [] };

  const contentMap = new Map([
    ...(feeds?.map(f => [f.id, { ...f, type: 'feed' }]) || []),
    ...(comments?.map(c => [c.id, { ...c, type: 'comment' }]) || [])
  ]);

  return reports.map(report => ({
    ...report,
    reporter: userMap.get(report.reporter_id),
    target_author: report.target_author_id ? userMap.get(report.target_author_id) : undefined,
    admin: report.admin_id ? userMap.get(report.admin_id) : undefined,
    target_content: contentMap.get(report.target_id)
  }));
}

// 检查用户是否已举报
export async function hasReported(targetType: ReportTargetType, targetId: string): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await supabaseAdmin
      .from('reports')
      .select('id')
      .eq('reporter_id', user.id)
      .eq('target_type', targetType)
      .eq('target_id', targetId)
      .maybeSingle();

    return !!data;
  } catch (error) {
    return false;
  }
}
