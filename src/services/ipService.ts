/**
 * IP孵化服务模块 - 提供IP孵化相关功能
 * 已接入 Neon PostgreSQL 数据库（通过后端 API）
 */

import apiClient from '@/lib/apiClient';

// IP资产类型定义
export interface IPAsset {
  id: string;
  name: string;
  description: string;
  type: 'illustration' | 'pattern' | 'design' | '3d_model' | 'digital_collectible';
  originalWorkId: string;
  stages: IPStage[];
  commercialValue: number;
  createdAt: string;
  updatedAt: string;
  thumbnail: string;
  status: 'active' | 'archived' | 'deleted' | 'pending_review';
}

// IP孵化阶段类型定义
export interface IPStage {
  id: string;
  name: string;
  description: string;
  orderIndex: number;
  completed: boolean;
  completedAt?: string;
}

// 商业合作类型定义
export interface CommercialPartnership {
  id: string;
  brandName: string;
  brandLogo: string;
  description: string;
  reward: string;
  status: 'pending' | 'negotiating' | 'approved' | 'rejected' | 'completed';
  ipAssetId: string;
  opportunityId?: string;
  applicantName?: string;
  applicantEmail?: string;
  message?: string;
  createdAt: string;
  updatedAt: string;
}

// 商业机会类型定义
export interface CommercialOpportunity {
  id: string;
  brandName: string;
  brandLogo?: string;
  name: string;
  description: string;
  reward: string;
  requirements?: string;
  deadline?: string;
  status: 'open' | 'matched' | 'closed';
  matchCriteria?: Record<string, any>;
  viewCount?: number;
  applicationCount?: number;
  type?: string;
  rewardMin?: number;
  rewardMax?: number;
  contactInfo?: string;
  createdAt: string;
  updatedAt: string;
}

// 版权资产类型定义
export interface CopyrightAsset {
  id: string;
  name: string;
  thumbnail?: string;
  type: string;
  status: 'registered' | 'licensed' | 'expired';
  canLicense: boolean;
  licensePrice?: number;
  certificateUrl?: string;
  registeredAt?: string;
  expiresAt?: string;
  createdAt: string;
  updatedAt: string;
}

// IP活动类型定义
export interface IPActivity {
  id: string;
  type: 'progress' | 'opportunity' | 'milestone' | 'alert';
  title: string;
  description?: string;
  ipAssetId?: string;
  isRead: boolean;
  createdAt: string;
}

// IP统计类型
export interface IPStats {
  totalAssets: number;
  completedAssets: number;
  inProgressAssets: number;
  totalPartnerships: number;
  activePartnerships: number;
  totalEstimatedValue: number;
}

// 示例IP资产类型
export interface SampleIPAsset {
  id: string;
  name: string;
  description: string;
  type: 'illustration' | 'pattern' | 'design' | '3d_model' | 'digital_collectible';
  stages: IPStage[];
  commercialValue: number;
  thumbnail: string;
  createdAt: string;
  category: string;
  highlights: string[];
}

// 示例IP资产数据
const sampleIPAssets: SampleIPAsset[] = [
  {
    id: 'sample-1',
    name: '津门古韵·杨柳青年画创新',
    description: '将传统杨柳青年画元素与现代插画风格融合，创作出具有天津特色的国潮插画系列，适用于文创产品、包装设计等多种商业场景。',
    type: 'illustration',
    category: '国潮插画',
    stages: [
      { id: 's1-1', name: '创意设计', description: '完成原创设计作品', orderIndex: 1, completed: true, completedAt: '2026-01-15T10:00:00Z' },
      { id: 's1-2', name: '版权存证', description: '完成作品版权存证', orderIndex: 2, completed: true, completedAt: '2026-01-20T14:30:00Z' },
      { id: 's1-3', name: 'IP孵化', description: '将设计转化为IP资产', orderIndex: 3, completed: false },
      { id: 's1-4', name: '商业合作', description: '对接品牌合作机会', orderIndex: 4, completed: false },
      { id: 's1-5', name: '收益分成', description: '获得作品收益分成', orderIndex: 5, completed: false }
    ],
    commercialValue: 15000,
    thumbnail: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=400&h=300&fit=crop',
    createdAt: '2026-01-15T10:00:00Z',
    highlights: ['已获版权存证', '适合文创产品', '预估价值 ¥15,000']
  },
  {
    id: 'sample-2',
    name: '海河印象·纹样设计',
    description: '提取海河两岸建筑轮廓与传统纹样，设计出具有地域特色的装饰纹样，可应用于家居用品、服装面料、包装纸等领域。',
    type: 'pattern',
    category: '装饰纹样',
    stages: [
      { id: 's2-1', name: '创意设计', description: '完成原创设计作品', orderIndex: 1, completed: true, completedAt: '2026-01-10T09:00:00Z' },
      { id: 's2-2', name: '版权存证', description: '完成作品版权存证', orderIndex: 2, completed: true, completedAt: '2026-01-12T16:00:00Z' },
      { id: 's2-3', name: 'IP孵化', description: '将设计转化为IP资产', orderIndex: 3, completed: true, completedAt: '2026-01-18T11:00:00Z' },
      { id: 's2-4', name: '商业合作', description: '对接品牌合作机会', orderIndex: 4, completed: false },
      { id: 's2-5', name: '收益分成', description: '获得作品收益分成', orderIndex: 5, completed: false }
    ],
    commercialValue: 25000,
    thumbnail: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=400&h=300&fit=crop',
    createdAt: '2026-01-10T09:00:00Z',
    highlights: ['已匹配商业机会', '多场景应用', '预估价值 ¥25,000']
  },
  {
    id: 'sample-3',
    name: '泥人张·3D数字藏品',
    description: '以天津泥人张传统技艺为灵感，创作3D数字艺术藏品，结合区块链技术，打造具有收藏价值的数字艺术品。',
    type: '3d_model',
    category: '数字藏品',
    stages: [
      { id: 's3-1', name: '创意设计', description: '完成原创设计作品', orderIndex: 1, completed: true, completedAt: '2026-02-01T10:00:00Z' },
      { id: 's3-2', name: '版权存证', description: '完成作品版权存证', orderIndex: 2, completed: false },
      { id: 's3-3', name: 'IP孵化', description: '将设计转化为IP资产', orderIndex: 3, completed: false },
      { id: 's3-4', name: '商业合作', description: '对接品牌合作机会', orderIndex: 4, completed: false },
      { id: 's3-5', name: '收益分成', description: '获得作品收益分成', orderIndex: 5, completed: false }
    ],
    commercialValue: 35000,
    thumbnail: 'https://images.unsplash.com/photo-1633356122544-f134324a6cee?w=400&h=300&fit=crop',
    createdAt: '2026-02-01T10:00:00Z',
    highlights: ['数字藏品热门', '区块链存证', '预估价值 ¥35,000']
  }
];

// IP孵化服务类
class IPService {
  private baseUrl = '/api/ip';

  // ============================================
  // IP 资产相关方法
  // ============================================

  /**
   * 获取当前用户的所有IP资产
   */
  async getAllIPAssets(userId?: string): Promise<IPAsset[]> {
    try {
      const url = userId ? `${this.baseUrl}/assets?userId=${userId}` : `${this.baseUrl}/assets`;
      const response = await apiClient.get<IPAsset[]>(url);
      
      if (!response.ok) {
        console.warn('[ipService.getAllIPAssets] 获取失败:', response.error);
        return [];
      }
      
      return response.data || [];
    } catch (error) {
      console.error('[ipService.getAllIPAssets] 错误:', error);
      return [];
    }
  }

  /**
   * 获取单个IP资产详情
   */
  async getIPAssetById(id: string): Promise<IPAsset | null> {
    try {
      const response = await apiClient.get<IPAsset>(`${this.baseUrl}/assets/${id}`);
      
      if (!response.ok) {
        console.warn('[ipService.getIPAssetById] 获取失败:', response.error);
        return null;
      }
      
      return response.data || null;
    } catch (error) {
      console.error('[ipService.getIPAssetById] 错误:', error);
      return null;
    }
  }

  /**
   * 创建新的IP资产
   */
  async createIPAsset(
    asset: Omit<IPAsset, 'id' | 'createdAt' | 'updatedAt' | 'stages'>,
    userId?: string
  ): Promise<IPAsset> {
    const response = await apiClient.post<IPAsset, any>(`${this.baseUrl}/assets`, {
      ...asset,
      userId
    });
    
    if (!response.ok) {
      throw new Error(response.error || '创建IP资产失败');
    }
    
    return response.data!;
  }

  /**
   * 更新IP资产信息
   */
  async updateIPAsset(id: string, updates: Partial<Omit<IPAsset, 'id' | 'createdAt' | 'stages'>>): Promise<boolean> {
    const response = await apiClient.put<boolean, any>(`${this.baseUrl}/assets/${id}`, updates);
    return response.ok;
  }

  /**
   * 删除IP资产（软删除）
   */
  async deleteIPAsset(id: string): Promise<boolean> {
    const response = await apiClient.delete<boolean>(`${this.baseUrl}/assets/${id}`);
    return response.ok;
  }

  // ============================================
  // IP 阶段相关方法
  // ============================================

  /**
   * 更新IP资产阶段完成状态
   */
  async updateIPStage(ipId: string, stageId: string, completed: boolean): Promise<boolean> {
    try {
      const response = await apiClient.put<boolean, any>(`${this.baseUrl}/assets/${ipId}/stages/${stageId}`, {
        completed
      });
      return response.ok;
    } catch (error) {
      console.error('[ipService.updateIPStage] 错误:', error);
      return false;
    }
  }

  // ============================================
  // 搜索和筛选方法
  // ============================================

  /**
   * 搜索IP资产
   */
  async searchIPAssets(query: string): Promise<IPAsset[]> {
    const response = await apiClient.get<IPAsset[]>(`${this.baseUrl}/assets/search?q=${encodeURIComponent(query)}`);
    return response.data || [];
  }

  /**
   * 筛选IP资产
   */
  async filterIPAssets(filters: {
    type?: IPAsset['type'];
    status?: 'in-progress' | 'completed' | 'pending';
    minValue?: number;
  }): Promise<IPAsset[]> {
    const params = new URLSearchParams();
    if (filters.type) params.append('type', filters.type);
    if (filters.status) params.append('status', filters.status);
    if (filters.minValue) params.append('minValue', filters.minValue.toString());
    
    const response = await apiClient.get<IPAsset[]>(`${this.baseUrl}/assets/filter?${params.toString()}`);
    return response.data || [];
  }

  // ============================================
  // 统计数据方法
  // ============================================

  /**
   * 获取IP资产价值趋势
   */
  async getIPValueTrend(userId?: string): Promise<{ timestamp: string; value: number }[]> {
    const url = userId 
      ? `${this.baseUrl}/stats/value-trend?userId=${userId}` 
      : `${this.baseUrl}/stats/value-trend`;
    const response = await apiClient.get<{ timestamp: string; value: number }[]>(url);
    return response.data || [];
  }

  /**
   * 获取IP资产类型分布
   */
  async getIPTypeDistribution(userId?: string): Promise<{ type: IPAsset['type']; count: number; percentage: number }[]> {
    const url = userId 
      ? `${this.baseUrl}/stats/type-distribution?userId=${userId}` 
      : `${this.baseUrl}/stats/type-distribution`;
    const response = await apiClient.get<{ type: IPAsset['type']; count: number; percentage: number }[]>(url);
    return response.data || [];
  }

  /**
   * 获取IP孵化统计
   */
  async getIPStats(userId?: string): Promise<IPStats> {
    try {
      const url = userId 
        ? `${this.baseUrl}/stats?userId=${userId}` 
        : `${this.baseUrl}/stats`;
      const response = await apiClient.get<IPStats>(url);
      
      if (!response.ok || !response.data) {
        return {
          totalAssets: 0,
          completedAssets: 0,
          inProgressAssets: 0,
          totalPartnerships: 0,
          activePartnerships: 0,
          totalEstimatedValue: 0
        };
      }
      
      return response.data;
    } catch (error) {
      console.error('[ipService.getIPStats] 错误:', error);
      return {
        totalAssets: 0,
        completedAssets: 0,
        inProgressAssets: 0,
        totalPartnerships: 0,
        activePartnerships: 0,
        totalEstimatedValue: 0
      };
    }
  }

  // ============================================
  // 商业合作相关方法
  // ============================================

  /**
   * 获取所有商业机会
   */
  async getAllOpportunities(): Promise<CommercialOpportunity[]> {
    try {
      const response = await apiClient.get<CommercialOpportunity[]>(`${this.baseUrl}/opportunities`);
      return response.data || [];
    } catch (error) {
      console.error('[ipService.getAllOpportunities] 错误:', error);
      return [];
    }
  }

  /**
   * 获取所有商业合作
   */
  async getAllPartnerships(): Promise<CommercialPartnership[]> {
    const response = await apiClient.get<CommercialPartnership[]>(`${this.baseUrl}/partnerships`);
    return response.data || [];
  }

  /**
   * 获取与特定IP相关的商业合作
   */
  async getPartnershipsByIPId(ipId: string): Promise<CommercialPartnership[]> {
    const response = await apiClient.get<CommercialPartnership[]>(`${this.baseUrl}/partnerships?ipAssetId=${ipId}`);
    return response.data || [];
  }

  /**
   * 创建新的商业合作申请
   */
  async createPartnership(partnership: Omit<CommercialPartnership, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommercialPartnership | null> {
    const response = await apiClient.post<CommercialPartnership, any>(`${this.baseUrl}/partnerships`, partnership);
    return response.data || null;
  }

  /**
   * 更新商业合作状态
   */
  async updatePartnershipStatus(partnershipId: string, status: CommercialPartnership['status']): Promise<boolean> {
    const response = await apiClient.put<boolean, any>(`${this.baseUrl}/partnerships/${partnershipId}/status`, { status });
    return response.ok;
  }

  /**
   * 申请商业机会
   */
  async applyOpportunity(opportunityId: string, ipAssetId: string): Promise<boolean> {
    try {
      const response = await apiClient.post<boolean, any>(`${this.baseUrl}/opportunities/${opportunityId}/apply`, {
        ipAssetId
      });
      return response.ok;
    } catch (error) {
      console.error('[ipService.applyOpportunity] 错误:', error);
      return false;
    }
  }

  // ============================================
  // 版权资产相关方法
  // ============================================

  /**
   * 获取用户的版权资产
   */
  async getCopyrightAssets(userId?: string): Promise<CopyrightAsset[]> {
    try {
      const url = userId 
        ? `${this.baseUrl}/copyright?userId=${userId}` 
        : `${this.baseUrl}/copyright`;
      const response = await apiClient.get<CopyrightAsset[]>(url);
      return response.data || [];
    } catch (error) {
      console.error('[ipService.getCopyrightAssets] 错误:', error);
      return [];
    }
  }

  /**
   * 创建版权资产
   */
  async createCopyrightAsset(asset: Omit<CopyrightAsset, 'id' | 'createdAt' | 'updatedAt'>): Promise<CopyrightAsset | null> {
    const response = await apiClient.post<CopyrightAsset, any>(`${this.baseUrl}/copyright`, asset);
    return response.data || null;
  }

  /**
   * 更新版权授权状态
   */
  async updateCopyrightLicense(id: string, canLicense: boolean): Promise<boolean> {
    const response = await apiClient.put<boolean, any>(`${this.baseUrl}/copyright/${id}/license`, { canLicense });
    return response.ok;
  }

  // ============================================
  // IP 活动相关方法
  // ============================================

  /**
   * 获取用户的IP活动/动态
   */
  async getIPActivities(limit: number = 10): Promise<IPActivity[]> {
    try {
      const response = await apiClient.get<IPActivity[]>(`${this.baseUrl}/activities?limit=${limit}`);
      return response.data || [];
    } catch (error) {
      console.error('[ipService.getIPActivities] 错误:', error);
      return [];
    }
  }

  /**
   * 标记活动为已读
   */
  async markActivityAsRead(activityId: string): Promise<boolean> {
    const response = await apiClient.put<boolean, any>(`${this.baseUrl}/activities/${activityId}/read`, {});
    return response.ok;
  }

  /**
   * 标记所有活动为已读
   */
  async markAllActivitiesAsRead(): Promise<boolean> {
    const response = await apiClient.put<boolean, any>(`${this.baseUrl}/activities/read-all`, {});
    return response.ok;
  }

  // ============================================
  // 实时订阅方法 (使用轮询模拟)
  // ============================================

  private pollingIntervals: Map<string, number> = new Map();

  /**
   * 订阅IP资产变化（使用轮询模拟）
   */
  subscribeToIPAssets(callback: (payload: any) => void): { unsubscribe: () => void } {
    const intervalId = window.setInterval(async () => {
      const assets = await this.getAllIPAssets();
      callback({ new: assets });
    }, 30000); // 每30秒轮询一次
    
    this.pollingIntervals.set('ip_assets', intervalId);
    
    return {
      unsubscribe: () => {
        const id = this.pollingIntervals.get('ip_assets');
        if (id) {
          clearInterval(id);
          this.pollingIntervals.delete('ip_assets');
        }
      }
    };
  }

  /**
   * 订阅IP活动变化（使用轮询模拟）
   */
  subscribeToActivities(callback: (payload: any) => void): { unsubscribe: () => void } {
    const intervalId = window.setInterval(async () => {
      const activities = await this.getIPActivities(10);
      callback({ new: activities });
    }, 30000); // 每30秒轮询一次
    
    this.pollingIntervals.set('activities', intervalId);
    
    return {
      unsubscribe: () => {
        const id = this.pollingIntervals.get('activities');
        if (id) {
          clearInterval(id);
          this.pollingIntervals.delete('activities');
        }
      }
    };
  }

  /**
   * 取消所有订阅
   */
  unsubscribeAll(): void {
    this.pollingIntervals.forEach((id) => {
      clearInterval(id);
    });
    this.pollingIntervals.clear();
  }

  // ============================================
  // 示例数据方法
  // ============================================

  /**
   * 获取示例IP资产列表
   */
  getSampleIPAssets(): SampleIPAsset[] {
    return sampleIPAssets;
  }

  /**
   * 获取单个示例IP资产
   */
  getSampleIPAssetById(id: string): SampleIPAsset | undefined {
    return sampleIPAssets.find(asset => asset.id === id);
  }

  /**
   * 计算示例资产的孵化进度
   */
  calculateSampleProgress(stages: IPStage[]): number {
    const completedStages = stages?.filter(stage => stage.completed).length || 0;
    const totalStages = stages?.length || 1;
    return Math.round((completedStages / totalStages) * 100);
  }

  // ============================================
  // 商业机会管理方法 (主办方视角)
  // ============================================

  /**
   * 获取主办方自己的商业机会列表
   */
  async getOrganizerOpportunities(): Promise<CommercialOpportunity[]> {
    try {
      const response = await apiClient.get<CommercialOpportunity[]>(`${this.baseUrl}/opportunities/organizer`);
      return response.data || [];
    } catch (error) {
      console.error('[ipService.getOrganizerOpportunities] 错误:', error);
      return [];
    }
  }

  /**
   * 创建商业机会
   */
  async createOpportunity(opportunity: Omit<CommercialOpportunity, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommercialOpportunity | null> {
    try {
      const response = await apiClient.post<CommercialOpportunity, any>(`${this.baseUrl}/opportunities`, opportunity);
      if (response.ok && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('[ipService.createOpportunity] 错误:', error);
      return null;
    }
  }

  /**
   * 更新商业机会
   */
  async updateOpportunity(id: string, opportunity: Partial<CommercialOpportunity>): Promise<CommercialOpportunity | null> {
    try {
      const response = await apiClient.put<CommercialOpportunity, any>(`${this.baseUrl}/opportunities/${id}`, opportunity);
      if (response.ok && response.data) {
        return response.data;
      }
      return null;
    } catch (error) {
      console.error('[ipService.updateOpportunity] 错误:', error);
      return null;
    }
  }

  /**
   * 删除商业机会
   */
  async deleteOpportunity(id: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`${this.baseUrl}/opportunities/${id}`);
      return response.ok;
    } catch (error) {
      console.error('[ipService.deleteOpportunity] 错误:', error);
      return false;
    }
  }

  /**
   * 更新商业机会状态 (开启/关闭)
   */
  async updateOpportunityStatus(id: string, status: 'open' | 'closed'): Promise<boolean> {
    try {
      const response = await apiClient.put<boolean, any>(`${this.baseUrl}/opportunities/${id}/status`, { status });
      return response.ok;
    } catch (error) {
      console.error('[ipService.updateOpportunityStatus] 错误:', error);
      return false;
    }
  }

  /**
   * 获取商业机会的申请者列表 (主办方视角)
   */
  async getOpportunityApplications(opportunityId: string): Promise<CommercialPartnership[]> {
    try {
      const response = await apiClient.get<CommercialPartnership[]>(`${this.baseUrl}/opportunities/${opportunityId}/applications`);
      return response.data || [];
    } catch (error) {
      console.error('[ipService.getOpportunityApplications] 错误:', error);
      return [];
    }
  }

  /**
   * 审核申请 (通过/拒绝)
   */
  async reviewApplication(applicationId: string, status: 'approved' | 'rejected', message?: string): Promise<boolean> {
    try {
      const response = await apiClient.put<boolean, any>(`${this.baseUrl}/partnerships/${applicationId}/review`, { status, message });
      return response.ok;
    } catch (error) {
      console.error('[ipService.reviewApplication] 错误:', error);
      return false;
    }
  }
}

// 导出单例实例
export default new IPService();
