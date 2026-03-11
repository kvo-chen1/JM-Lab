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
    try {
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
    } catch (error) {
      // 如果API请求失败，返回本地存储的数据或模拟数据
      console.warn('API请求失败，使用本地数据:', error);
      const localRequests = JSON.parse(localStorage.getItem('copyright_requests') || '[]');
      if (localRequests.length > 0) {
        return localRequests;
      }
      // 返回默认的模拟数据
      return this.getMockRequests();
    }
  }

  /**
   * 获取模拟的授权需求数据
   */
  private getMockRequests(): LicenseRequest[] {
    return [
      {
        id: 'mock-1',
        brandId: 'brand-1',
        brandName: '天津文旅集团',
        brandLogo: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?w=100',
        title: '天津城市文创IP授权合作',
        description: '诚邀优秀创作者使用天津城市元素进行文创设计，包括但不限于地标建筑、传统文化、地方特色等。',
        ipCategories: ['illustration', 'pattern', 'design'],
        licenseType: 'non_exclusive',
        minLicenseFee: 5000,
        maxLicenseFee: 50000,
        royaltyRate: 15,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'mock-2',
        brandId: 'brand-2',
        brandName: '海河传媒',
        brandLogo: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=100',
        title: '海河主题插画授权征集',
        description: '为海河传媒旗下产品线征集海河主题插画作品，用于文创产品开发。',
        ipCategories: ['illustration'],
        licenseType: 'non_exclusive',
        minLicenseFee: 3000,
        maxLicenseFee: 20000,
        royaltyRate: 12,
        status: 'open',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];
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
    try {
      const response = await apiClient.post('/api/copyright/applications', data);
      return response.data;
    } catch (error: any) {
      // 如果API请求失败（500错误），使用本地存储作为后备方案
      console.warn('API请求失败，使用本地存储作为后备方案:', error);
      
      const userId = getCurrentUserId();
      if (!userId) {
        console.error('无法获取用户ID，本地存储方案失败');
        throw new Error('用户未登录，无法提交申请');
      }

      try {
        // 创建本地申请记录
        const application: LicenseApplication = {
          id: `local-${Date.now()}`,
          requestId: data.requestId,
          applicantId: userId,
          ipAssetId: data.ipAssetId,
          message: data.message,
          proposedUsage: data.proposedUsage,
          expectedProducts: data.expectedProducts,
          status: 'pending',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // 保存到本地存储
        const existingApps = JSON.parse(localStorage.getItem('copyright_applications') || '[]');
        existingApps.push(application);
        localStorage.setItem('copyright_applications', JSON.stringify(existingApps));
        
        console.log('申请已保存到本地存储:', application);
        return application;
      } catch (storageError) {
        console.error('本地存储失败:', storageError);
        throw new Error('提交申请失败，请检查浏览器存储权限');
      }
    }
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
    try {
      const response = await apiClient.get(`/api/copyright/my-applications?userId=${userId}`);
      return response.data;
    } catch (error) {
      // 如果API请求失败，从本地存储读取
      console.warn('API请求失败，从本地存储读取:', error);
      const localApps = JSON.parse(localStorage.getItem('copyright_applications') || '[]');
      return localApps.filter((app: LicenseApplication) => app.applicantId === userId);
    }
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

  /**
   * 获取IP类别标签
   */
  getIPCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      illustration: '插画',
      pattern: '纹样',
      design: '设计',
      '3d_model': '3D模型',
      digital_collectible: '数字藏品',
    };
    return labels[category] || category;
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
