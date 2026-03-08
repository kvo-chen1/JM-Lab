/**
 * 版权授权服务模块
 * 提供品牌授权需求和申请管理功能
 */

import apiClient from '@/lib/apiClient';
import type {
  LicenseRequest,
  LicenseApplication,
  LicensedProduct,
  BrandStats,
  CreateLicenseRequestDTO,
  SubmitApplicationDTO,
  ApproveApplicationDTO,
  ContactInfo,
  RequestFilters,
  ApplicationFilters
} from '@/types/copyright-license';

// 获取当前用户ID的辅助函数
const getCurrentUserId = (): string | null => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return user.id || user.userId || null;
    }
  } catch (e) {
    console.error('获取用户ID失败:', e);
  }
  return null;
};

class CopyrightLicenseService {
  // ==================== 品牌方方法 ====================

  /**
   * 获取品牌方的授权需求列表
   */
  async getBrandRequests(): Promise<LicenseRequest[]> {
    const userId = getCurrentUserId();
    if (!userId) {
      console.warn('未找到用户ID，返回空数组');
      return [];
    }
    const response = await apiClient.get(`/api/copyright/brand/requests?brandId=${userId}`);
    return response.data;
  }

  /**
   * 创建新的授权需求
   */
  async createRequest(data: CreateLicenseRequestDTO): Promise<LicenseRequest> {
    const response = await apiClient.post('/api/copyright/brand/requests', data);
    return response.data;
  }

  /**
   * 更新授权需求
   */
  async updateRequest(id: string, data: Partial<CreateLicenseRequestDTO>): Promise<LicenseRequest> {
    const response = await apiClient.put(`/api/copyright/brand/requests/${id}`, data);
    return response.data;
  }

  /**
   * 删除授权需求
   */
  async deleteRequest(id: string): Promise<void> {
    await apiClient.delete(`/api/copyright/brand/requests/${id}`);
  }

  /**
   * 暂停/恢复授权需求
   */
  async toggleRequestStatus(id: string, status: 'open' | 'paused' | 'closed'): Promise<LicenseRequest> {
    const response = await apiClient.put(`/api/copyright/brand/requests/${id}/status`, { status });
    return response.data;
  }

  /**
   * 获取收到的授权申请
   */
  async getBrandApplications(filters?: ApplicationFilters): Promise<LicenseApplication[]> {
    const userId = getCurrentUserId();
    if (!userId) {
      console.warn('未找到用户ID，返回空数组');
      return [];
    }
    const params = new URLSearchParams();
    params.append('brandId', userId);
    if (filters?.status) params.append('status', filters.status);
    if (filters?.requestId) params.append('requestId', filters.requestId);
    
    const response = await apiClient.get(`/api/copyright/brand/applications?${params.toString()}`);
    return response.data;
  }

  /**
   * 获取申请详情
   */
  async getApplicationById(id: string): Promise<LicenseApplication> {
    const response = await apiClient.get(`/api/copyright/brand/applications/${id}`);
    return response.data;
  }

  /**
   * 同意授权申请
   */
  async approveApplication(id: string, data: ApproveApplicationDTO): Promise<LicenseApplication> {
    const response = await apiClient.put(`/api/copyright/brand/applications/${id}/approve`, data);
    return response.data;
  }

  /**
   * 拒绝授权申请
   */
  async rejectApplication(id: string, reason: string): Promise<LicenseApplication> {
    const response = await apiClient.put(`/api/copyright/brand/applications/${id}/reject`, { reason });
    return response.data;
  }

  /**
   * 分享联系方式
   */
  async shareContact(id: string, contactInfo: ContactInfo): Promise<LicenseApplication> {
    const response = await apiClient.put(`/api/copyright/brand/applications/${id}/contact`, contactInfo);
    return response.data;
  }

  /**
   * 获取品牌方授权统计
   */
  async getBrandStats(): Promise<BrandStats> {
    const userId = getCurrentUserId();
    if (!userId) {
      console.warn('未找到用户ID，返回默认统计');
      return {
        totalRequests: 0,
        activeRequests: 0,
        totalApplications: 0,
        pendingApplications: 0,
        approvedApplications: 0,
        totalProducts: 0,
        onSaleProducts: 0,
        totalRevenue: 0,
        totalLicenseFees: 0
      };
    }
    const response = await apiClient.get(`/api/copyright/brand/stats?brandId=${userId}`);
    return response.data;
  }

  // ==================== 创作者方法 ====================

  /**
   * 获取所有可申请的授权需求（公开）
   */
  async getAvailableRequests(filters?: RequestFilters): Promise<LicenseRequest[]> {
    const params = new URLSearchParams();
    if (filters?.ipCategories?.length) {
      filters.ipCategories.forEach(cat => params.append('categories', cat));
    }
    if (filters?.licenseType) params.append('licenseType', filters.licenseType);
    if (filters?.minFee) params.append('minFee', filters.minFee.toString());
    if (filters?.maxFee) params.append('maxFee', filters.maxFee.toString());
    if (filters?.sortBy) params.append('sortBy', filters.sortBy);
    
    const response = await apiClient.get(`/api/copyright/requests?${params.toString()}`);
    return response.data;
  }

  /**
   * 获取授权需求详情
   */
  async getRequestById(id: string): Promise<LicenseRequest> {
    const response = await apiClient.get(`/api/copyright/requests/${id}`);
    return response.data;
  }

  /**
   * 提交授权申请
   */
  async submitApplication(data: SubmitApplicationDTO): Promise<LicenseApplication> {
    const response = await apiClient.post('/api/copyright/applications', data);
    return response.data;
  }

  /**
   * 获取我的申请列表
   */
  async getMyApplications(): Promise<LicenseApplication[]> {
    const userId = getCurrentUserId();
    if (!userId) {
      console.warn('未找到用户ID，返回空数组');
      return [];
    }
    const response = await apiClient.get(`/api/copyright/my-applications?userId=${userId}`);
    return response.data;
  }

  /**
   * 取消申请
   */
  async cancelApplication(id: string): Promise<LicenseApplication> {
    const response = await apiClient.put(`/api/copyright/applications/${id}/cancel`);
    return response.data;
  }

  /**
   * 获取已获得的授权列表
   */
  async getMyLicenses(): Promise<LicenseApplication[]> {
    const userId = getCurrentUserId();
    if (!userId) {
      console.warn('未找到用户ID，返回空数组');
      return [];
    }
    const response = await apiClient.get(`/api/copyright/my-licenses?userId=${userId}`);
    return response.data;
  }

  // ==================== 辅助方法 ====================

  /**
   * 获取授权类型标签
   */
  getLicenseTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      exclusive: '独家授权',
      non_exclusive: '非独家授权',
      sole: '排他授权',
    };
    return labels[type] || type;
  }

  /**
   * 获取授权需求状态标签
   */
  getRequestStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      open: '进行中',
      closed: '已结束',
      paused: '已暂停',
    };
    return labels[status] || status;
  }

  /**
   * 获取申请状态标签
   */
  getApplicationStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      pending: '审核中',
      approved: '已通过',
      rejected: '已拒绝',
      contacted: '已联系',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status] || status;
  }

  // ==================== 文创产品方法 ====================

  /**
   * 创建授权IP产品
   */
  async createLicensedProduct(data: {
    applicationId: string;
    productName: string;
    productDescription?: string;
    productImages?: string[];
    productCategory?: string;
    price: number;
    stock: number;
  }): Promise<LicensedProduct> {
    const response = await apiClient.post('/api/copyright/products', data);
    return response.data;
  }

  /**
   * 获取授权IP产品列表
   */
  async getLicensedProducts(): Promise<LicensedProduct[]> {
    const response = await apiClient.get('/api/copyright/products');
    return response.data;
  }

  /**
   * 更新产品信息
   */
  async updateLicensedProduct(id: string, data: Partial<LicensedProduct>): Promise<LicensedProduct> {
    const response = await apiClient.put(`/api/copyright/products/${id}`, data);
    return response.data;
  }

  /**
   * 提交审核
   */
  async submitProductForReview(id: string): Promise<LicensedProduct> {
    const response = await apiClient.put(`/api/copyright/products/${id}/submit`);
    return response.data;
  }

  /**
   * 上架产品
   */
  async publishProduct(id: string): Promise<LicensedProduct> {
    const response = await apiClient.put(`/api/copyright/products/${id}/publish`);
    return response.data;
  }
}

export const copyrightLicenseService = new CopyrightLicenseService();
export default copyrightLicenseService;
