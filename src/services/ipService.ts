/**
 * IP孵化服务模块 - 提供IP孵化相关功能
 * 已接入 Supabase 真实数据库
 */

import { supabase, supabaseAdmin } from '@/lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

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
  status: 'active' | 'archived' | 'deleted';
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
  private realtimeChannels: RealtimeChannel[] = [];

  // ============================================
  // IP 资产相关方法
  // ============================================

  /**
   * 获取当前用户的所有IP资产
   */
  async getAllIPAssets(): Promise<IPAsset[]> {
    const { data, error } = await supabase
      .from('ip_assets')
      .select(`
        *,
        stages:ip_stages(*)
      `)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取IP资产失败:', error);
      throw new Error(error.message);
    }

    return this.transformIPAssets(data || []);
  }

  /**
   * 获取单个IP资产详情
   */
  async getIPAssetById(id: string): Promise<IPAsset | null> {
    const { data, error } = await supabase
      .from('ip_assets')
      .select(`
        *,
        stages:ip_stages(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('获取IP资产详情失败:', error);
      return null;
    }

    return this.transformIPAsset(data);
  }

  /**
   * 创建新的IP资产
   */
  async createIPAsset(asset: Omit<IPAsset, 'id' | 'createdAt' | 'updatedAt' | 'stages'>): Promise<IPAsset> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('用户未登录');
    }

    // 使用RPC函数创建IP资产并初始化阶段
    const { data: assetId, error: rpcError } = await supabase
      .rpc('create_ip_asset_with_stages', {
        p_user_id: userData.user.id,
        p_name: asset.name,
        p_description: asset.description,
        p_type: asset.type,
        p_original_work_id: asset.originalWorkId || null,
        p_commercial_value: asset.commercialValue,
        p_thumbnail: asset.thumbnail
      });

    if (rpcError) {
      console.error('创建IP资产失败:', rpcError);
      throw new Error(rpcError.message);
    }

    // 获取创建的资产详情
    const newAsset = await this.getIPAssetById(assetId);
    if (!newAsset) {
      throw new Error('创建IP资产后无法获取详情');
    }

    return newAsset;
  }

  /**
   * 更新IP资产信息
   */
  async updateIPAsset(id: string, updates: Partial<Omit<IPAsset, 'id' | 'createdAt' | 'stages'>>): Promise<boolean> {
    const { error } = await supabase
      .from('ip_assets')
      .update({
        name: updates.name,
        description: updates.description,
        type: updates.type,
        commercial_value: updates.commercialValue,
        thumbnail: updates.thumbnail,
        status: updates.status,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('更新IP资产失败:', error);
      return false;
    }

    return true;
  }

  /**
   * 删除IP资产（软删除）
   */
  async deleteIPAsset(id: string): Promise<boolean> {
    const { error } = await supabase
      .from('ip_assets')
      .update({ status: 'deleted' })
      .eq('id', id);

    if (error) {
      console.error('删除IP资产失败:', error);
      return false;
    }

    return true;
  }

  // ============================================
  // IP 阶段相关方法
  // ============================================

  /**
   * 更新IP资产阶段完成状态
   */
  async updateIPStage(ipId: string, stageId: string, completed: boolean): Promise<boolean> {
    const { error } = await supabase
      .rpc('update_stage_completion', {
        p_stage_id: stageId,
        p_completed: completed
      });

    if (error) {
      console.error('更新阶段状态失败:', error);
      return false;
    }

    return true;
  }

  // ============================================
  // 搜索和筛选方法
  // ============================================

  /**
   * 搜索IP资产
   */
  async searchIPAssets(query: string): Promise<IPAsset[]> {
    const { data, error } = await supabase
      .from('ip_assets')
      .select(`
        *,
        stages:ip_stages(*)
      `)
      .eq('status', 'active')
      .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('搜索IP资产失败:', error);
      return [];
    }

    return this.transformIPAssets(data || []);
  }

  /**
   * 筛选IP资产
   */
  async filterIPAssets(filters: {
    type?: IPAsset['type'];
    status?: 'in-progress' | 'completed' | 'pending';
    minValue?: number;
  }): Promise<IPAsset[]> {
    let query = supabase
      .from('ip_assets')
      .select(`
        *,
        stages:ip_stages(*)
      `)
      .eq('status', 'active');

    if (filters.type) {
      query = query.eq('type', filters.type);
    }

    if (filters.minValue) {
      query = query.gte('commercial_value', filters.minValue);
    }

    const { data, error } = await query.order('created_at', { ascending: false });

    if (error) {
      console.error('筛选IP资产失败:', error);
      return [];
    }

    let assets = this.transformIPAssets(data || []);

    // 按完成状态筛选（需要在内存中处理）
    if (filters.status) {
      assets = assets.filter(asset => {
        const isCompleted = asset.stages.every(stage => stage.completed);
        const isInProgress = asset.stages.some(stage => stage.completed) && !isCompleted;

        if (filters.status === 'completed') return isCompleted;
        if (filters.status === 'in-progress') return isInProgress;
        if (filters.status === 'pending') return !isCompleted;
        return true;
      });
    }

    return assets;
  }

  // ============================================
  // 统计数据方法
  // ============================================

  /**
   * 获取IP资产价值趋势
   */
  async getIPValueTrend(): Promise<{ timestamp: string; value: number }[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
      .from('ip_assets')
      .select('created_at, commercial_value')
      .eq('user_id', userData.user.id)
      .eq('status', 'active')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('获取IP价值趋势失败:', error);
      return [];
    }

    // 按月份分组统计
    const monthlyValues: Record<string, number> = {};
    let cumulativeValue = 0;

    data?.forEach(asset => {
      const monthKey = asset.created_at.slice(0, 7); // YYYY-MM
      cumulativeValue += asset.commercial_value || 0;
      monthlyValues[monthKey] = cumulativeValue;
    });

    return Object.entries(monthlyValues).map(([timestamp, value]) => ({
      timestamp,
      value
    }));
  }

  /**
   * 获取IP资产类型分布
   */
  async getIPTypeDistribution(): Promise<{ type: IPAsset['type']; count: number; percentage: number }[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
      .from('ip_assets')
      .select('type')
      .eq('user_id', userData.user.id)
      .eq('status', 'active');

    if (error) {
      console.error('获取IP类型分布失败:', error);
      return [];
    }

    const typeCounts: Record<string, number> = {};
    data?.forEach(asset => {
      typeCounts[asset.type] = (typeCounts[asset.type] || 0) + 1;
    });

    const total = data?.length || 0;
    return Object.entries(typeCounts).map(([type, count]) => ({
      type: type as IPAsset['type'],
      count,
      percentage: total > 0 ? Math.round((count / total) * 100) : 0
    }));
  }

  /**
   * 获取IP孵化统计
   */
  async getIPStats(): Promise<IPStats> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      return {
        totalAssets: 0,
        completedAssets: 0,
        inProgressAssets: 0,
        totalPartnerships: 0,
        activePartnerships: 0,
        totalEstimatedValue: 0
      };
    }

    const { data, error } = await supabase
      .rpc('get_user_ip_stats', {
        p_user_id: userData.user.id
      });

    if (error) {
      console.error('获取IP统计失败:', error);
      return {
        totalAssets: 0,
        completedAssets: 0,
        inProgressAssets: 0,
        totalPartnerships: 0,
        activePartnerships: 0,
        totalEstimatedValue: 0
      };
    }

    if (data && data.length > 0) {
      const stats = data[0];
      return {
        totalAssets: Number(stats.total_assets) || 0,
        completedAssets: Number(stats.completed_assets) || 0,
        inProgressAssets: Number(stats.in_progress_assets) || 0,
        totalPartnerships: Number(stats.total_partnerships) || 0,
        activePartnerships: Number(stats.active_partnerships) || 0,
        totalEstimatedValue: Number(stats.total_estimated_value) || 0
      };
    }

    return {
      totalAssets: 0,
      completedAssets: 0,
      inProgressAssets: 0,
      totalPartnerships: 0,
      activePartnerships: 0,
      totalEstimatedValue: 0
    };
  }

  // ============================================
  // 商业合作相关方法
  // ============================================

  /**
   * 获取所有商业机会
   */
  async getAllOpportunities(): Promise<CommercialOpportunity[]> {
    const { data, error } = await supabase
      .from('commercial_opportunities')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取商业机会失败:', error);
      return [];
    }

    return (data || []).map(this.transformOpportunity);
  }

  /**
   * 获取所有商业合作
   */
  async getAllPartnerships(): Promise<CommercialPartnership[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
      .from('ip_partnerships')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取商业合作失败:', error);
      return [];
    }

    return (data || []).map(this.transformPartnership);
  }

  /**
   * 获取与特定IP相关的商业合作
   */
  async getPartnershipsByIPId(ipId: string): Promise<CommercialPartnership[]> {
    const { data, error } = await supabase
      .from('ip_partnerships')
      .select('*')
      .eq('ip_asset_id', ipId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取IP相关合作失败:', error);
      return [];
    }

    return (data || []).map(this.transformPartnership);
  }

  /**
   * 创建新的商业合作申请
   */
  async createPartnership(partnership: Omit<CommercialPartnership, 'id' | 'createdAt' | 'updatedAt'>): Promise<CommercialPartnership | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('用户未登录');
    }

    const { data, error } = await supabase
      .from('ip_partnerships')
      .insert({
        ip_asset_id: partnership.ipAssetId,
        user_id: userData.user.id,
        brand_name: partnership.brandName,
        description: partnership.description,
        reward: partnership.reward,
        status: partnership.status
      })
      .select()
      .single();

    if (error) {
      console.error('创建商业合作失败:', error);
      return null;
    }

    return this.transformPartnership(data);
  }

  /**
   * 更新商业合作状态
   */
  async updatePartnershipStatus(partnershipId: string, status: CommercialPartnership['status']): Promise<boolean> {
    const { error } = await supabase
      .from('ip_partnerships')
      .update({
        status,
        updated_at: new Date().toISOString()
      })
      .eq('id', partnershipId);

    if (error) {
      console.error('更新合作状态失败:', error);
      return false;
    }

    return true;
  }

  /**
   * 申请商业机会
   */
  async applyOpportunity(opportunityId: string, ipAssetId: string): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('用户未登录');
    }

    // 获取机会详情
    const { data: opportunity } = await supabase
      .from('commercial_opportunities')
      .select('*')
      .eq('id', opportunityId)
      .single();

    if (!opportunity) {
      throw new Error('商业机会不存在');
    }

    // 创建合作申请
    const { error } = await supabase
      .from('ip_partnerships')
      .insert({
        ip_asset_id: ipAssetId,
        opportunity_id: opportunityId,
        user_id: userData.user.id,
        brand_name: opportunity.brand_name,
        description: opportunity.description,
        reward: opportunity.reward,
        status: 'pending'
      });

    if (error) {
      console.error('申请商业机会失败:', error);
      return false;
    }

    return true;
  }

  // ============================================
  // 版权资产相关方法
  // ============================================

  /**
   * 获取用户的版权资产
   */
  async getCopyrightAssets(): Promise<CopyrightAsset[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
      .from('copyright_assets')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('获取版权资产失败:', error);
      return [];
    }

    return (data || []).map(this.transformCopyrightAsset);
  }

  /**
   * 创建版权资产
   */
  async createCopyrightAsset(asset: Omit<CopyrightAsset, 'id' | 'createdAt' | 'updatedAt'>): Promise<CopyrightAsset | null> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      throw new Error('用户未登录');
    }

    const { data, error } = await supabase
      .from('copyright_assets')
      .insert({
        user_id: userData.user.id,
        name: asset.name,
        thumbnail: asset.thumbnail,
        type: asset.type,
        status: asset.status || 'registered',
        can_license: asset.canLicense ?? true,
        license_price: asset.licensePrice,
        certificate_url: asset.certificateUrl,
        registered_at: asset.registeredAt || new Date().toISOString(),
        expires_at: asset.expiresAt
      })
      .select()
      .single();

    if (error) {
      console.error('创建版权资产失败:', error);
      return null;
    }

    return this.transformCopyrightAsset(data);
  }

  /**
   * 更新版权授权状态
   */
  async updateCopyrightLicense(id: string, canLicense: boolean): Promise<boolean> {
    const { error } = await supabase
      .from('copyright_assets')
      .update({
        can_license: canLicense,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (error) {
      console.error('更新版权授权状态失败:', error);
      return false;
    }

    return true;
  }

  // ============================================
  // IP 活动相关方法
  // ============================================

  /**
   * 获取用户的IP活动/动态
   */
  async getIPActivities(limit: number = 10): Promise<IPActivity[]> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return [];

    const { data, error } = await supabase
      .from('ip_activities')
      .select('*')
      .eq('user_id', userData.user.id)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('获取IP活动失败:', error);
      return [];
    }

    return (data || []).map(this.transformActivity);
  }

  /**
   * 标记活动为已读
   */
  async markActivityAsRead(activityId: string): Promise<boolean> {
    const { error } = await supabase
      .from('ip_activities')
      .update({ is_read: true })
      .eq('id', activityId);

    if (error) {
      console.error('标记活动已读失败:', error);
      return false;
    }

    return true;
  }

  /**
   * 标记所有活动为已读
   */
  async markAllActivitiesAsRead(): Promise<boolean> {
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) return false;

    const { error } = await supabase
      .from('ip_activities')
      .update({ is_read: true })
      .eq('user_id', userData.user.id)
      .eq('is_read', false);

    if (error) {
      console.error('标记所有活动已读失败:', error);
      return false;
    }

    return true;
  }

  // ============================================
  // 实时订阅方法
  // ============================================

  /**
   * 订阅IP资产变化
   */
  subscribeToIPAssets(callback: (payload: any) => void): RealtimeChannel {
    const channel = supabase
      .channel('ip_assets_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'ip_assets'
        },
        callback
      )
      .subscribe();

    this.realtimeChannels.push(channel);
    return channel;
  }

  /**
   * 订阅IP活动变化
   */
  subscribeToActivities(callback: (payload: any) => void): RealtimeChannel {
    const channel = supabase
      .channel('ip_activities_changes')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ip_activities'
        },
        callback
      )
      .subscribe();

    this.realtimeChannels.push(channel);
    return channel;
  }

  /**
   * 取消所有订阅
   */
  unsubscribeAll(): void {
    this.realtimeChannels.forEach(channel => {
      supabase.removeChannel(channel);
    });
    this.realtimeChannels = [];
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
    const completedStages = stages.filter(stage => stage.completed).length;
    return Math.round((completedStages / stages.length) * 100);
  }

  // ============================================
  // 数据转换方法
  // ============================================

  private transformIPAssets(data: any[]): IPAsset[] {
    return data.map(item => this.transformIPAsset(item));
  }

  private transformIPAsset(item: any): IPAsset {
    return {
      id: item.id,
      name: item.name,
      description: item.description,
      type: item.type,
      originalWorkId: item.original_work_id,
      stages: (item.stages || []).map((stage: any) => ({
        id: stage.id,
        name: stage.name,
        description: stage.description,
        orderIndex: stage.order_index,
        completed: stage.completed,
        completedAt: stage.completed_at
      })).sort((a: IPStage, b: IPStage) => a.orderIndex - b.orderIndex),
      commercialValue: item.commercial_value || 0,
      createdAt: item.created_at,
      updatedAt: item.updated_at,
      thumbnail: item.thumbnail,
      status: item.status
    };
  }

  private transformOpportunity(item: any): CommercialOpportunity {
    return {
      id: item.id,
      brandName: item.brand_name,
      brandLogo: item.brand_logo,
      name: item.name,
      description: item.description,
      reward: item.reward,
      requirements: item.requirements,
      deadline: item.deadline,
      status: item.status,
      matchCriteria: item.match_criteria,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  }

  private transformPartnership(item: any): CommercialPartnership {
    return {
      id: item.id,
      brandName: item.brand_name,
      brandLogo: item.brand_logo,
      description: item.description,
      reward: item.reward,
      status: item.status,
      ipAssetId: item.ip_asset_id,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  }

  private transformCopyrightAsset(item: any): CopyrightAsset {
    return {
      id: item.id,
      name: item.name,
      thumbnail: item.thumbnail,
      type: item.type,
      status: item.status,
      canLicense: item.can_license,
      licensePrice: item.license_price,
      certificateUrl: item.certificate_url,
      registeredAt: item.registered_at,
      expiresAt: item.expires_at,
      createdAt: item.created_at,
      updatedAt: item.updated_at
    };
  }

  private transformActivity(item: any): IPActivity {
    return {
      id: item.id,
      type: item.type,
      title: item.title,
      description: item.description,
      ipAssetId: item.ip_asset_id,
      isRead: item.is_read,
      createdAt: item.created_at
    };
  }
}

// 导出单例实例
export default new IPService();
