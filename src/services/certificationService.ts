import { supabaseAdmin } from '@/lib/supabaseClient';
import { apiClient } from '@/lib/apiClient';
import eventBus from '@/lib/eventBus';
import { toast } from 'sonner';
import {
  CertificationLevel,
  CertificationStatus,
  CertificationType,
  CertificationApplication,
  CertificationInfo,
  CertificationMaterial,
  CertificationStats,
  CERTIFICATION_LEVELS,
} from '@/types/certification';

export interface SubmitApplicationParams {
  level: CertificationLevel;
  type: CertificationType;
  realName: string;
  idNumber?: string;
  idCardFront?: string;
  idCardBack?: string;
  portfolioUrl?: string;
  portfolioFiles?: string[];
  personalBio: string;
  socialLinks?: CertificationApplication['socialLinks'];
  organizationName?: string;
  businessLicense?: string;
  organizationCode?: string;
  reason: string;
  expectedBenefits?: string;
  materials: Omit<CertificationMaterial, 'id' | 'uploadedAt'>[];
}

export interface ReviewApplicationParams {
  applicationId: string;
  action: 'approve' | 'reject';
  reviewNote?: string;
  rejectReason?: string;
}

class CertificationService {
  private readonly CACHE_KEY = 'CERTIFICATION_CACHE';
  private readonly CACHE_TTL = {
    info: 1000 * 60 * 5,
    applications: 1000 * 60 * 2,
    stats: 1000 * 60 * 10,
  };

  private cache = {
    info: null as CertificationInfo | null,
    applications: null as CertificationApplication[] | null,
    stats: null as CertificationStats | null,
    lastUpdated: {
      info: 0,
      applications: 0,
      stats: 0,
    },
  };

  constructor() {
    this.loadCacheFromStorage();
    this.setupEventListeners();
  }

  private loadCacheFromStorage() {
    try {
      const stored = localStorage.getItem(this.CACHE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.cache = { ...this.cache, ...parsed };
      }
    } catch (error) {
      console.warn('[CertificationService] 加载缓存失败:', error);
    }
  }

  private saveCacheToStorage() {
    try {
      localStorage.setItem(this.CACHE_KEY, JSON.stringify(this.cache));
    } catch (error) {
      console.warn('[CertificationService] 保存缓存失败:', error);
    }
  }

  private isCacheValid(type: keyof typeof this.cache.lastUpdated): boolean {
    const lastUpdated = this.cache.lastUpdated[type];
    const ttl = this.CACHE_TTL[type];
    return Date.now() - lastUpdated < ttl;
  }

  private clearCache() {
    this.cache = {
      info: null,
      applications: null,
      stats: null,
      lastUpdated: {
        info: 0,
        applications: 0,
        stats: 0,
      },
    };
    localStorage.removeItem(this.CACHE_KEY);
  }

  private setupEventListeners() {
    eventBus.on('auth:logout', () => {
      this.clearCache();
    });
  }

  async getCertificationLevels() {
    return CERTIFICATION_LEVELS;
  }

  async getCertificationLevel(level: CertificationLevel) {
    return CERTIFICATION_LEVELS.find((l) => l.level === level) || null;
  }

  async getCertificationInfo(userId: string): Promise<CertificationInfo | null> {
    if (!userId) return null;

    if (this.cache.info && this.cache.info.userId === userId && this.isCacheValid('info')) {
      return this.cache.info;
    }

    try {
      const { data: userData, error: userError } = await supabaseAdmin
        .from('users')
        .select('certification_level, certification_status, certification_type, certification_verified_at, certification_expires_at')
        .eq('id', userId)
        .single();

      if (userError && userError.code !== 'PGRST116') {
        console.error('[CertificationService] 获取用户认证信息失败:', userError);
      }

      const level = (userData?.certification_level as CertificationLevel) || 'normal';
      const status = (userData?.certification_status as CertificationStatus) || 'none';
      const type = (userData?.certification_type as CertificationType) || 'individual';

      const { data: worksData } = await supabaseAdmin
        .from('works')
        .select('id, view_count, likes_count')
        .eq('creator_id', userId);

      const { count: followersCount } = await supabaseAdmin
        .from('follows')
        .select('*', { count: 'exact', head: true })
        .eq('following_id', userId);

      const totalWorks = worksData?.length || 0;
      const totalViews = worksData?.reduce((sum, w) => sum + (w.view_count || 0), 0) || 0;
      const totalLikes = worksData?.reduce((sum, w) => sum + (w.likes_count || 0), 0) || 0;

      const levelConfig = await this.getCertificationLevel(level);
      
      const info: CertificationInfo = {
        userId,
        level,
        status,
        type,
        verifiedAt: userData?.certification_verified_at,
        expiresAt: userData?.certification_expires_at,
        badgeUrl: levelConfig?.badge,
        certificateNumber: `CERT-${userId.slice(0, 8).toUpperCase()}`,
        benefits: {
          priorityRecommend: level === 'signed',
          exclusiveFeatures: level === 'verified' 
            ? ['advanced_ai', 'analytics', 'custom_profile']
            : level === 'signed'
            ? ['unlimited_ai', 'analytics', 'custom_profile', 'brand_coop', 'exclusive_events']
            : [],
          customBadge: level !== 'normal',
          verifiedIcon: level !== 'normal',
          analyticsAccess: level !== 'normal',
          commercialUse: level === 'signed',
          supportPriority: level !== 'normal',
        },
        stats: {
          totalWorks,
          totalViews,
          totalLikes,
          totalFollowers: followersCount || 0,
        },
      };

      this.cache.info = info;
      this.cache.lastUpdated.info = Date.now();
      this.saveCacheToStorage();

      return info;
    } catch (error) {
      console.error('[CertificationService] 获取认证信息失败:', error);
      return null;
    }
  }

  async checkEligibility(userId: string, level: CertificationLevel): Promise<{
    eligible: boolean;
    reasons: string[];
    suggestions: string[];
  }> {
    const reasons: string[] = [];
    const suggestions: string[] = [];

    try {
      const info = await this.getCertificationInfo(userId);
      const levelConfig = await this.getCertificationLevel(level);

      if (!levelConfig || !info) {
        return { eligible: false, reasons: ['无法获取认证信息'], suggestions: [] };
      }

      if (level === 'normal') {
        return { eligible: true, reasons: [], suggestions: [] };
      }

      if (level === 'signed' && info.level !== 'verified') {
        reasons.push('需要先获得认证创作者身份');
        suggestions.push('请先申请认证创作者');
      }

      for (const req of levelConfig.requirements) {
        if (req.type !== 'required') continue;

        switch (req.id) {
          case 'works':
            if (info.stats.totalWorks < 5 && level === 'verified') {
              reasons.push(`作品数量不足：当前${info.stats.totalWorks}个，需要至少5个`);
              suggestions.push('发布更多原创作品');
            } else if (info.stats.totalWorks < 20 && level === 'signed') {
              reasons.push(`作品数量不足：当前${info.stats.totalWorks}个，需要至少20个`);
              suggestions.push('持续发布优质原创作品');
            }
            break;

          case 'followers':
            if (info.stats.totalFollowers < 100 && level === 'verified') {
              reasons.push(`粉丝数量不足：当前${info.stats.totalFollowers}个，需要至少100个`);
              suggestions.push('积极互动，吸引更多粉丝关注');
            } else if (info.stats.totalFollowers < 1000 && level === 'signed') {
              reasons.push(`粉丝数量不足：当前${info.stats.totalFollowers}个，需要至少1000个`);
              suggestions.push('提升作品质量，扩大影响力');
            }
            break;

          case 'quality':
            if (info.stats.totalLikes < 500 && level === 'verified') {
              reasons.push(`作品点赞数不足：当前${info.stats.totalLikes}个，需要至少500个`);
              suggestions.push('创作更优质的内容，获得更多点赞');
            } else if (info.stats.totalLikes < 5000 && level === 'signed') {
              reasons.push(`作品点赞数不足：当前${info.stats.totalLikes}个，需要至少5000个`);
              suggestions.push('持续输出高质量作品');
            }
            break;

          case 'identity':
            reasons.push('需要完成实名认证');
            suggestions.push('在申请时提供真实身份信息');
            break;

          case 'verified':
            if (info.level !== 'verified') {
              reasons.push('需要先获得认证创作者身份');
              suggestions.push('请先申请认证创作者');
            }
            break;

          case 'engagement':
            suggestions.push('保持活跃，连续登录使用平台');
            break;

          case 'contract':
            suggestions.push('签署平台合作协议');
            break;
        }
      }

      return {
        eligible: reasons.length === 0,
        reasons,
        suggestions,
      };
    } catch (error) {
      console.error('[CertificationService] 检查资格失败:', error);
      return { eligible: false, reasons: ['检查失败，请稍后重试'], suggestions: [] };
    }
  }

  async submitApplication(params: SubmitApplicationParams): Promise<{
    success: boolean;
    application?: CertificationApplication;
    error?: string;
  }> {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        return { success: false, error: '请先登录' };
      }

      const response = await apiClient.post('/api/certification/apply', params);

      if (response.ok && response.data?.code === 0) {
        const application = response.data.data as CertificationApplication;
        
        this.cache.lastUpdated.applications = 0;
        this.cache.lastUpdated.info = 0;

        eventBus.emit('certification:submitted', { application });
        toast.success('认证申请已提交，请等待审核');

        return { success: true, application };
      } else {
        const error = response.data?.message || '提交失败';
        toast.error(error);
        return { success: false, error };
      }
    } catch (error: any) {
      console.error('[CertificationService] 提交申请失败:', error);
      toast.error(error.message || '提交失败');
      return { success: false, error: error.message || '提交失败' };
    }
  }

  async getMyApplications(userId: string): Promise<CertificationApplication[]> {
    try {
      const response = await apiClient.get('/api/certification/my-applications');

      if (response.ok && response.data?.code === 0) {
        return response.data.data || [];
      }

      return [];
    } catch (error) {
      console.error('[CertificationService] 获取申请列表失败:', error);
      return [];
    }
  }

  async getApplicationById(applicationId: string): Promise<CertificationApplication | null> {
    try {
      const response = await apiClient.get(`/api/certification/applications/${applicationId}`);

      if (response.ok && response.data?.code === 0) {
        return response.data.data;
      }

      return null;
    } catch (error) {
      console.error('[CertificationService] 获取申请详情失败:', error);
      return null;
    }
  }

  async cancelApplication(applicationId: string): Promise<boolean> {
    try {
      const response = await apiClient.delete(`/api/certification/applications/${applicationId}`);

      if (response.ok && response.data?.code === 0) {
        this.cache.lastUpdated.applications = 0;
        toast.success('已取消申请');
        return true;
      }

      return false;
    } catch (error) {
      console.error('[CertificationService] 取消申请失败:', error);
      return false;
    }
  }

  async uploadMaterial(file: File, type: 'image' | 'document' | 'video'): Promise<{
    success: boolean;
    url?: string;
    error?: string;
  }> {
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('type', type);

      const response = await apiClient.post('/api/certification/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok && response.data?.code === 0) {
        return { success: true, url: response.data.data.url };
      }

      return { success: false, error: response.data?.message || '上传失败' };
    } catch (error: any) {
      console.error('[CertificationService] 上传材料失败:', error);
      return { success: false, error: error.message || '上传失败' };
    }
  }

  async getStats(): Promise<CertificationStats> {
    if (this.cache.stats && this.isCacheValid('stats')) {
      return this.cache.stats;
    }

    try {
      const response = await apiClient.get('/api/certification/stats');

      if (response.ok && response.data?.code === 0) {
        const stats = response.data.data as CertificationStats;
        this.cache.stats = stats;
        this.cache.lastUpdated.stats = Date.now();
        this.saveCacheToStorage();
        return stats;
      }

      return this.getDefaultStats();
    } catch (error) {
      console.error('[CertificationService] 获取统计失败:', error);
      return this.getDefaultStats();
    }
  }

  private getDefaultStats(): CertificationStats {
    return {
      total: 0,
      pending: 0,
      approved: 0,
      rejected: 0,
      byLevel: { normal: 0, verified: 0, signed: 0 },
      byType: { individual: 0, organization: 0, media: 0, brand: 0 },
      recentApplications: 0,
      approvalRate: 0,
    };
  }
}

export const certificationService = new CertificationService();
export default certificationService;
