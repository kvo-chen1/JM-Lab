/**
 * 商家申请服务层
 * 处理商家入驻申请相关的所有API调用和数据操作
 */

import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/userUtils';

// ==================== 类型定义 ====================

export interface MerchantApplication {
  id: string;
  user_id: string;
  
  // 店铺信息
  store_name: string;
  store_description?: string;
  store_logo?: string;
  
  // 联系人信息
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  
  // 资质文件
  business_license?: string;
  id_card_front?: string;
  id_card_back?: string;
  
  // 申请状态
  status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
  
  // 审核信息
  reviewed_by?: string;
  reviewed_at?: string;
  
  // 时间戳
  created_at: string;
  updated_at: string;
}

export interface ApplicationFormData {
  store_name: string;
  store_description?: string;
  store_logo?: string;
  contact_name: string;
  contact_phone: string;
  contact_email?: string;
  business_license?: string;
  id_card_front?: string;
  id_card_back?: string;
}

export interface ApplicationFilter {
  status?: 'pending' | 'approved' | 'rejected';
  page?: number;
  limit?: number;
}

// ==================== 商家申请服务类 ====================

class MerchantApplicationService {
  
  // ==================== 用户端接口 ====================
  
  /**
   * 提交商家入驻申请
   */
  async submitApplication(data: ApplicationFormData): Promise<MerchantApplication> {
    const user = getCurrentUser();
    console.log('[MerchantApply] 当前用户:', user?.id);
    if (!user?.id) throw new Error('用户未登录');

    // 检查是否已有申请
    const existingApp = await this.getMyApplication();
    console.log('[MerchantApply] 已有申请:', existingApp);
    if (existingApp && existingApp.status !== 'rejected') {
      throw new Error('您已提交过申请，请勿重复提交');
    }

    const applicationData = {
      user_id: user.id,
      store_name: data.store_name,
      store_description: data.store_description || '',
      store_logo: data.store_logo || '',
      contact_name: data.contact_name,
      contact_phone: data.contact_phone,
      contact_email: data.contact_email || user.email || '',
      business_license: data.business_license || '',
      id_card_front: data.id_card_front || '',
      id_card_back: data.id_card_back || '',
      status: 'pending',
    };

    const { data: result, error } = await supabase
      .from('merchant_applications')
      .insert(applicationData)
      .select()
      .single();

    if (error) {
      console.error('提交申请失败:', error);
      throw new Error('提交申请失败: ' + error.message);
    }

    return result;
  }

  /**
   * 获取当前用户的申请状态
   */
  async getMyApplication(): Promise<MerchantApplication | null> {
    const user = getCurrentUser();
    console.log('[MerchantApply] getMyApplication - 用户ID:', user?.id);
    if (!user?.id) return null;

    const { data, error } = await supabase
      .from('merchant_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1);

    console.log('[MerchantApply] getMyApplication - 查询结果:', { data, error });

    if (error) {
      console.error('获取申请状态失败:', error);
      throw new Error('获取申请状态失败');
    }

    // 返回第一条记录或 null
    return data && data.length > 0 ? data[0] : null;
  }

  /**
   * 检查用户是否可以申请
   */
  async canApply(): Promise<{ canApply: boolean; reason?: string }> {
    const application = await this.getMyApplication();
    
    if (!application) {
      return { canApply: true };
    }

    if (application.status === 'pending') {
      return { canApply: false, reason: '您的申请正在审核中，请耐心等待' };
    }

    if (application.status === 'approved') {
      return { canApply: false, reason: '您已通过审核，可以进入商家工作台' };
    }

    if (application.status === 'rejected') {
      return { canApply: true }; // 被拒绝后可以重新申请
    }

    return { canApply: true };
  }

  /**
   * 更新待审核的申请
   */
  async updateApplication(id: string, data: Partial<ApplicationFormData>): Promise<MerchantApplication> {
    const user = getCurrentUser();
    if (!user?.id) throw new Error('用户未登录');

    const { data: result, error } = await supabase
      .from('merchant_applications')
      .update(data)
      .eq('id', id)
      .eq('user_id', user.id)
      .eq('status', 'pending')
      .select()
      .single();

    if (error) {
      console.error('更新申请失败:', error);
      throw new Error('更新申请失败');
    }

    return result;
  }

  // ==================== 管理端接口 ====================
  
  /**
   * 获取申请列表（管理员用）- 使用本地API
   */
  async getApplications(filter: ApplicationFilter = {}): Promise<{ data: MerchantApplication[]; total: number }> {
    const { status, page = 1, limit = 20 } = filter;
    
    // 构建查询参数
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', String(page));
    params.append('limit', String(limit));
    
    const response = await fetch(`/api/admin/merchant-applications?${params.toString()}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('获取申请列表失败:', error);
      throw new Error(error.message || '获取申请列表失败');
    }
    
    const result = await response.json();
    return { data: result.data || [], total: result.total || 0 };
  }

  /**
   * 获取申请详情（管理员用）
   */
  async getApplicationById(id: string): Promise<MerchantApplication> {
    const { data, error } = await supabase
      .from('merchant_applications')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取申请详情失败:', error);
      throw new Error('获取申请详情失败');
    }

    return data;
  }

  /**
   * 审核申请（管理员用）- 使用本地API
   */
  async reviewApplication(
    id: string, 
    status: 'approved' | 'rejected', 
    rejectionReason?: string
  ): Promise<void> {
    const response = await fetch(`/api/admin/merchant-applications/${id}/review`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      },
      body: JSON.stringify({
        status,
        rejection_reason: rejectionReason
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('审核申请失败:', error);
      throw new Error(error.message || '审核申请失败');
    }
  }

  /**
   * 从申请创建商家记录
   */
  private async createMerchantFromApplication(applicationId: string): Promise<void> {
    // 获取申请详情
    const { data: application, error: fetchError } = await supabase
      .from('merchant_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (fetchError || !application) {
      console.error('获取申请详情失败:', fetchError);
      throw new Error('创建商家记录失败');
    }

    // 检查是否已存在商家记录
    const { data: existingMerchant } = await supabase
      .from('merchants')
      .select('id')
      .eq('user_id', application.user_id)
      .single();

    if (existingMerchant) {
      console.log('商家记录已存在，跳过创建');
      return;
    }

    // 创建商家记录
    const merchantData = {
      user_id: application.user_id,
      application_id: applicationId,
      store_name: application.store_name,
      store_description: application.store_description,
      store_logo: application.store_logo,
      contact_name: application.contact_name,
      contact_phone: application.contact_phone,
      contact_email: application.contact_email,
      business_license: application.business_license,
      id_card_front: application.id_card_front,
      id_card_back: application.id_card_back,
      status: 'approved',
      rating: 5.0,
      total_sales: 0,
      total_orders: 0,
    };

    const { error: insertError } = await supabase
      .from('merchants')
      .insert(merchantData);

    if (insertError) {
      console.error('创建商家记录失败:', insertError);
      throw new Error('创建商家记录失败');
    }

    console.log('商家记录创建成功');
  }

  /**
   * 获取申请统计数据（管理员用）- 使用本地API
   */
  async getApplicationStats(): Promise<{
    total: number;
    pending: number;
    approved: number;
    rejected: number;
  }> {
    const response = await fetch('/api/admin/merchant-applications/stats', {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
      }
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('获取统计数据失败:', error);
      throw new Error(error.message || '获取统计数据失败');
    }
    
    const result = await response.json();
    return result.data || { total: 0, pending: 0, approved: 0, rejected: 0 };
  }
}

export const merchantApplicationService = new MerchantApplicationService();
