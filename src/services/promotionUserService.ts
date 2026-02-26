/**
 * 推广用户审核服务
 * 处理推广用户申请、审核、统计等功能
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';

// 申请状态类型
export type ApplicationStatus = 'pending' | 'reviewing' | 'approved' | 'rejected' | 'suspended';

// 申请类型
export type ApplicationType = 'individual' | 'business' | 'creator' | 'brand';

// 推广用户申请接口
export interface PromotionApplication {
  id: string;
  user_id: string;
  application_type: ApplicationType;
  contact_name: string;
  contact_phone?: string;
  contact_email?: string;
  company_name?: string;
  business_license?: string;
  company_address?: string;
  promotion_channels: string[];
  promotion_experience?: string;
  expected_monthly_budget?: number;
  social_accounts: Array<{
    platform: string;
    account: string;
    followers?: number;
  }>;
  status: ApplicationStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  rejection_reason?: string;
  promotion_permissions: Record<string, any>;
  total_orders: number;
  total_spent: number;
  total_views: number;
  total_conversions: number;
  created_at: string;
  updated_at: string;
  approved_at?: string;
  // 关联用户信息
  user_username?: string;
  user_email?: string;
  user_avatar?: string;
  reviewer_username?: string;
  reviewer_avatar?: string;
}

// 审核记录接口
export interface PromotionAuditLog {
  id: string;
  application_id: string;
  user_id: string;
  action: 'submit' | 'review' | 'approve' | 'reject' | 'suspend' | 'reactivate' | 'update';
  previous_status?: string;
  new_status?: string;
  notes?: string;
  reason?: string;
  performed_by?: string;
  performed_by_role: string;
  changes: Record<string, any>;
  created_at: string;
}

// 统计数据接口
export interface PromotionStats {
  totalApplications: number;
  pendingCount: number;
  approvedCount: number;
  rejectedCount: number;
  suspendedCount: number;
  todayNewCount: number;
  totalSpent: number;
  totalOrders: number;
}

// 查询参数接口
export interface GetApplicationsParams {
  status?: string;
  type?: string;
  search?: string;
  startDate?: string;
  endDate?: string;
  sortBy?: 'created_at' | 'reviewed_at';
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

// 审核参数接口
export interface AuditApplicationParams {
  applicationId: string;
  action: 'approve' | 'reject' | 'suspend';
  notes?: string;
  reason?: string;
}

class PromotionUserService {
  /**
   * 获取推广用户申请列表
   */
  async getApplications(params: GetApplicationsParams = {}): Promise<{
    applications: PromotionApplication[];
    total: number;
  }> {
    try {
      const {
        status,
        type,
        search,
        startDate,
        endDate,
        sortBy = 'created_at',
        sortOrder = 'desc',
        page = 1,
        limit = 10,
      } = params;

      // 构建基础查询
      let query = supabaseAdmin
        .from('promotion_applications_detail')
        .select('*', { count: 'exact' });

      // 应用筛选条件
      if (status) {
        query = query.eq('status', status);
      }
      if (type) {
        query = query.eq('application_type', type);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }
      if (search) {
        query = query.or(`user_username.ilike.%${search}%,contact_name.ilike.%${search}%,company_name.ilike.%${search}%,contact_phone.ilike.%${search}%`);
      }

      // 排序和分页
      query = query.order(sortBy, { ascending: sortOrder === 'asc' });
      query = query.range((page - 1) * limit, page * limit - 1);

      const { data, error, count } = await query;

      if (error) {
        console.error('获取推广用户申请失败:', error);
        return { applications: [], total: 0 };
      }

      return {
        applications: (data || []).map(this.transformApplication),
        total: count || 0,
      };
    } catch (err) {
      console.error('获取推广用户申请失败:', err);
      return { applications: [], total: 0 };
    }
  }

  /**
   * 获取单个申请详情
   */
  async getApplicationById(id: string): Promise<PromotionApplication | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('promotion_applications_detail')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        console.error('获取申请详情失败:', error);
        return null;
      }

      return data ? this.transformApplication(data) : null;
    } catch (err) {
      console.error('获取申请详情失败:', err);
      return null;
    }
  }

  /**
   * 获取统计数据
   */
  async getStats(): Promise<PromotionStats> {
    try {
      // 获取今日开始时间
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const [
        { count: totalApplications },
        { count: pendingCount },
        { count: approvedCount },
        { count: rejectedCount },
        { count: suspendedCount },
        { count: todayNewCount },
        { data: spentData },
      ] = await Promise.all([
        supabaseAdmin.from('promotion_applications').select('*', { count: 'exact', head: true }),
        supabaseAdmin.from('promotion_applications').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabaseAdmin.from('promotion_applications').select('*', { count: 'exact', head: true }).eq('status', 'approved'),
        supabaseAdmin.from('promotion_applications').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
        supabaseAdmin.from('promotion_applications').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
        supabaseAdmin.from('promotion_applications').select('*', { count: 'exact', head: true }).gte('created_at', today.toISOString()),
        supabaseAdmin.from('promotion_applications').select('total_spent, total_orders').eq('status', 'approved'),
      ]);

      const totalSpent = spentData?.reduce((sum, item) => sum + (item.total_spent || 0), 0) || 0;
      const totalOrders = spentData?.reduce((sum, item) => sum + (item.total_orders || 0), 0) || 0;

      return {
        totalApplications: totalApplications || 0,
        pendingCount: pendingCount || 0,
        approvedCount: approvedCount || 0,
        rejectedCount: rejectedCount || 0,
        suspendedCount: suspendedCount || 0,
        todayNewCount: todayNewCount || 0,
        totalSpent,
        totalOrders,
      };
    } catch (err) {
      console.error('获取统计数据失败:', err);
      return {
        totalApplications: 0,
        pendingCount: 0,
        approvedCount: 0,
        rejectedCount: 0,
        suspendedCount: 0,
        todayNewCount: 0,
        totalSpent: 0,
        totalOrders: 0,
      };
    }
  }

  /**
   * 获取审核记录
   */
  async getAuditLogs(applicationId: string): Promise<PromotionAuditLog[]> {
    try {
      const { data, error } = await supabaseAdmin
        .from('promotion_audit_logs')
        .select('*')
        .eq('application_id', applicationId)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('获取审核记录失败:', error);
        return [];
      }

      return data || [];
    } catch (err) {
      console.error('获取审核记录失败:', err);
      return [];
    }
  }

  /**
   * 审核申请
   */
  async auditApplication(params: AuditApplicationParams): Promise<boolean> {
    try {
      const { applicationId, action, notes, reason } = params;

      // 获取当前用户信息（管理员）
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('用户未登录');
        return false;
      }

      // 调用数据库函数进行审核
      const { data, error } = await supabaseAdmin.rpc('audit_promotion_application', {
        p_application_id: applicationId,
        p_action: action,
        p_notes: notes || '',
        p_reason: reason || '',
        p_performed_by: user.id,
      });

      if (error) {
        console.error('审核申请失败:', error);
        return false;
      }

      return data === true;
    } catch (err) {
      console.error('审核申请失败:', err);
      return false;
    }
  }

  /**
   * 创建推广申请
   */
  async createApplication(applicationData: Omit<PromotionApplication, 'id' | 'created_at' | 'updated_at' | 'status'>): Promise<PromotionApplication | null> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('用户未登录');
        return null;
      }

      const { data, error } = await supabaseAdmin
        .from('promotion_applications')
        .insert({
          ...applicationData,
          user_id: user.id,
          status: 'pending',
        })
        .select()
        .single();

      if (error) {
        console.error('创建申请失败:', error);
        return null;
      }

      // 记录提交日志
      await supabaseAdmin.from('promotion_audit_logs').insert({
        application_id: data.id,
        user_id: user.id,
        action: 'submit',
        new_status: 'pending',
        performed_by: user.id,
        performed_by_role: 'user',
      });

      return data ? this.transformApplication(data) : null;
    } catch (err) {
      console.error('创建申请失败:', err);
      return null;
    }
  }

  /**
   * 更新推广权限
   */
  async updatePermissions(applicationId: string, permissions: Record<string, any>): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('用户未登录');
        return false;
      }

      const { error } = await supabaseAdmin
        .from('promotion_applications')
        .update({
          promotion_permissions: permissions,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) {
        console.error('更新权限失败:', error);
        return false;
      }

      // 记录更新日志
      await supabaseAdmin.from('promotion_audit_logs').insert({
        application_id: applicationId,
        user_id: user.id,
        action: 'update',
        performed_by: user.id,
        performed_by_role: 'admin',
        changes: { permissions },
      });

      return true;
    } catch (err) {
      console.error('更新权限失败:', err);
      return false;
    }
  }

  /**
   * 暂停/恢复账号
   */
  async toggleAccountStatus(applicationId: string, suspend: boolean): Promise<boolean> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        console.error('用户未登录');
        return false;
      }

      const newStatus = suspend ? 'suspended' : 'approved';
      const action = suspend ? 'suspend' : 'reactivate';

      const { error } = await supabaseAdmin
        .from('promotion_applications')
        .update({
          status: newStatus,
          updated_at: new Date().toISOString(),
        })
        .eq('id', applicationId);

      if (error) {
        console.error('更新账号状态失败:', error);
        return false;
      }

      // 记录日志
      await supabaseAdmin.from('promotion_audit_logs').insert({
        application_id: applicationId,
        user_id: user.id,
        action,
        new_status: newStatus,
        performed_by: user.id,
        performed_by_role: 'admin',
      });

      return true;
    } catch (err) {
      console.error('更新账号状态失败:', err);
      return false;
    }
  }

  /**
   * 导出申请数据
   */
  async exportApplications(params: Omit<GetApplicationsParams, 'page' | 'limit'> = {}): Promise<PromotionApplication[]> {
    try {
      const { status, type, search, startDate, endDate } = params;

      let query = supabaseAdmin
        .from('promotion_applications_detail')
        .select('*');

      if (status) {
        query = query.eq('status', status);
      }
      if (type) {
        query = query.eq('application_type', type);
      }
      if (startDate) {
        query = query.gte('created_at', startDate);
      }
      if (endDate) {
        query = query.lte('created_at', endDate);
      }
      if (search) {
        query = query.or(`user_username.ilike.%${search}%,contact_name.ilike.%${search}%,company_name.ilike.%${search}%`);
      }

      const { data, error } = await query;

      if (error) {
        console.error('导出数据失败:', error);
        return [];
      }

      return (data || []).map(this.transformApplication);
    } catch (err) {
      console.error('导出数据失败:', err);
      return [];
    }
  }

  /**
   * 转换为CSV格式
   */
  convertToCSV(applications: PromotionApplication[]): string {
    const headers = [
      '申请ID',
      '用户名',
      '邮箱',
      '申请类型',
      '联系人',
      '联系电话',
      '公司名称',
      '推广渠道',
      '预期月预算',
      '状态',
      '申请时间',
      '审核时间',
      '审核人',
      '总订单数',
      '总消费',
    ];

    const rows = applications.map(app => [
      app.id,
      app.user_username || '',
      app.user_email || '',
      app.application_type,
      app.contact_name,
      app.contact_phone || '',
      app.company_name || '',
      app.promotion_channels?.join(';') || '',
      app.expected_monthly_budget?.toString() || '',
      app.status,
      app.created_at,
      app.reviewed_at || '',
      app.reviewer_username || '',
      app.total_orders?.toString() || '0',
      app.total_spent?.toString() || '0',
    ]);

    return [headers.join(','), ...rows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
  }

  /**
   * 获取待审核数量（用于通知）
   */
  async getPendingCount(): Promise<number> {
    try {
      const { data, error } = await supabaseAdmin.rpc('get_pending_promotion_applications_count');
      
      if (error) {
        console.error('获取待审核数量失败:', error);
        return 0;
      }

      return data || 0;
    } catch (err) {
      console.error('获取待审核数量失败:', err);
      return 0;
    }
  }

  /**
   * 检查用户是否已有申请
   */
  async hasExistingApplication(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabaseAdmin
        .from('promotion_applications')
        .select('id')
        .eq('user_id', userId)
        .in('status', ['pending', 'approved'])
        .single();

      if (error && error.code !== 'PGRST116') {
        console.error('检查现有申请失败:', error);
        return false;
      }

      return !!data;
    } catch (err) {
      console.error('检查现有申请失败:', err);
      return false;
    }
  }

  /**
   * 获取用户的推广申请
   */
  async getUserApplication(userId: string): Promise<PromotionApplication | null> {
    try {
      const { data, error } = await supabaseAdmin
        .from('promotion_applications_detail')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        console.error('获取用户申请失败:', error);
        return null;
      }

      return data ? this.transformApplication(data) : null;
    } catch (err) {
      console.error('获取用户申请失败:', err);
      return null;
    }
  }

  /**
   * 转换数据库数据为应用数据
   */
  private transformApplication(data: any): PromotionApplication {
    return {
      id: data.id,
      user_id: data.user_id,
      application_type: data.application_type,
      contact_name: data.contact_name,
      contact_phone: data.contact_phone,
      contact_email: data.contact_email,
      company_name: data.company_name,
      business_license: data.business_license,
      company_address: data.company_address,
      promotion_channels: data.promotion_channels || [],
      promotion_experience: data.promotion_experience,
      expected_monthly_budget: data.expected_monthly_budget,
      social_accounts: data.social_accounts || [],
      status: data.status,
      reviewed_by: data.reviewed_by,
      reviewed_at: data.reviewed_at,
      review_notes: data.review_notes,
      rejection_reason: data.rejection_reason,
      promotion_permissions: data.promotion_permissions || {},
      total_orders: data.total_orders || 0,
      total_spent: data.total_spent || 0,
      total_views: data.total_views || 0,
      total_conversions: data.total_conversions || 0,
      created_at: data.created_at,
      updated_at: data.updated_at,
      approved_at: data.approved_at,
      user_username: data.user_username,
      user_email: data.user_email,
      user_avatar: data.user_avatar,
      reviewer_username: data.reviewer_username,
      reviewer_avatar: data.reviewer_avatar,
    };
  }
}

export const promotionUserService = new PromotionUserService();
export default promotionUserService;
