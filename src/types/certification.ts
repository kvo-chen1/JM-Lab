export type CertificationLevel = 'normal' | 'verified' | 'signed';

export type CertificationStatus = 'none' | 'pending' | 'approved' | 'rejected' | 'revoked';

export type CertificationType = 'individual' | 'organization' | 'media' | 'brand';

export interface CertificationLevelConfig {
  level: CertificationLevel;
  name: string;
  nameEn: string;
  description: string;
  icon: string;
  color: string;
  badge: string;
  requirements: CertificationRequirement[];
  benefits: CertificationBenefit[];
  priority: number;
}

export interface CertificationRequirement {
  id: string;
  name: string;
  description: string;
  type: 'required' | 'optional';
  validator?: (value: any) => boolean;
}

export interface CertificationBenefit {
  id: string;
  name: string;
  description: string;
  icon: string;
  value: boolean | string | number;
}

export interface CertificationApplication {
  id: string;
  userId: string;
  level: CertificationLevel;
  type: CertificationType;
  status: CertificationStatus;
  
  realName: string;
  idNumber?: string;
  idCardFront?: string;
  idCardBack?: string;
  
  portfolioUrl?: string;
  portfolioFiles?: string[];
  personalBio: string;
  socialLinks?: {
    weibo?: string;
    wechat?: string;
    douyin?: string;
    bilibili?: string;
    xiaohongshu?: string;
    website?: string;
    other?: string;
  };
  
  organizationName?: string;
  businessLicense?: string;
  organizationCode?: string;
  
  reason: string;
  expectedBenefits?: string;
  
  materials: CertificationMaterial[];
  
  submittedAt?: string;
  reviewedAt?: string;
  reviewerId?: string;
  reviewNote?: string;
  rejectReason?: string;
  
  createdAt: string;
  updatedAt: string;
  
  user?: {
    id: string;
    username: string;
    avatar_url?: string;
    email?: string;
  };
  
  reviewer?: {
    id: string;
    username: string;
    avatar_url?: string;
  };
}

export interface CertificationMaterial {
  id: string;
  type: 'image' | 'document' | 'video' | 'link';
  name: string;
  url: string;
  description?: string;
  uploadedAt: string;
}

export interface CertificationInfo {
  userId: string;
  level: CertificationLevel;
  status: CertificationStatus;
  type: CertificationType;
  verifiedAt?: string;
  expiresAt?: string;
  badgeUrl?: string;
  certificateNumber?: string;
  
  benefits: {
    priorityRecommend: boolean;
    exclusiveFeatures: string[];
    customBadge: boolean;
    verifiedIcon: boolean;
    analyticsAccess: boolean;
    commercialUse: boolean;
    supportPriority: boolean;
  };
  
  stats: {
    totalWorks: number;
    totalViews: number;
    totalLikes: number;
    totalFollowers: number;
  };
}

export interface CertificationAuditLog {
  id: string;
  applicationId: string;
  action: 'submit' | 'approve' | 'reject' | 'revoke' | 'update';
  operatorId: string;
  operatorName: string;
  details: string;
  previousStatus: CertificationStatus;
  newStatus: CertificationStatus;
  createdAt: string;
}

export interface CertificationStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  byLevel: {
    normal: number;
    verified: number;
    signed: number;
  };
  byType: {
    individual: number;
    organization: number;
    media: number;
    brand: number;
  };
  recentApplications: number;
  approvalRate: number;
}

export const CERTIFICATION_LEVELS: CertificationLevelConfig[] = [
  {
    level: 'normal',
    name: '普通创作者',
    nameEn: 'Normal Creator',
    description: '注册用户默认等级，可使用基础创作功能',
    icon: 'user',
    color: 'gray',
    badge: '/badges/normal-creator.svg',
    requirements: [],
    benefits: [
      { id: 'basic_ai', name: '基础AI功能', description: '每日10次AI生成', icon: 'Wand2', value: '10次/天' },
      { id: 'basic_storage', name: '基础存储', description: '1GB云存储空间', icon: 'Cloud', value: '1GB' },
      { id: 'basic_export', name: '基础导出', description: '带水印导出', icon: 'Download', value: true },
      { id: 'community', name: '社区互动', description: '发布、评论、点赞', icon: 'MessageCircle', value: true },
    ],
    priority: 1,
  },
  {
    level: 'verified',
    name: '认证创作者',
    nameEn: 'Verified Creator',
    description: '通过身份认证的优质创作者，享有更多权益',
    icon: 'badge-check',
    color: 'blue',
    badge: '/badges/verified-creator.svg',
    requirements: [
      { id: 'works', name: '作品数量', description: '至少发布5个原创作品', type: 'required' },
      { id: 'followers', name: '粉丝数量', description: '至少有100个粉丝', type: 'required' },
      { id: 'quality', name: '作品质量', description: '作品总点赞数超过500', type: 'required' },
      { id: 'identity', name: '身份认证', description: '完成实名认证', type: 'required' },
      { id: 'portfolio', name: '作品集', description: '提供个人作品集链接', type: 'optional' },
    ],
    benefits: [
      { id: 'advanced_ai', name: '高级AI功能', description: '每日50次AI生成', icon: 'Wand2', value: '50次/天' },
      { id: 'advanced_storage', name: '高级存储', description: '10GB云存储空间', icon: 'Cloud', value: '10GB' },
      { id: 'no_watermark', name: '无水印导出', description: '高清无水印导出', icon: 'Download', value: true },
      { id: 'verified_badge', name: '认证标识', description: '专属认证徽章', icon: 'BadgeCheck', value: true },
      { id: 'priority_support', name: '优先客服', description: '专属客服通道', icon: 'Headphones', value: true },
      { id: 'analytics', name: '数据分析', description: '详细数据统计', icon: 'BarChart3', value: true },
      { id: 'custom_profile', name: '个性化主页', description: '自定义主页样式', icon: 'Palette', value: true },
    ],
    priority: 2,
  },
  {
    level: 'signed',
    name: '签约创作者',
    nameEn: 'Signed Creator',
    description: '平台签约的顶级创作者，享有最高权益和专属服务',
    icon: 'star',
    color: 'gold',
    badge: '/badges/signed-creator.svg',
    requirements: [
      { id: 'works', name: '作品数量', description: '至少发布20个原创作品', type: 'required' },
      { id: 'followers', name: '粉丝数量', description: '至少有1000个粉丝', type: 'required' },
      { id: 'quality', name: '作品质量', description: '作品总点赞数超过5000', type: 'required' },
      { id: 'engagement', name: '活跃度', description: '连续活跃超过30天', type: 'required' },
      { id: 'verified', name: '已认证', description: '已获得认证创作者身份', type: 'required' },
      { id: 'contract', name: '签约协议', description: '签署平台合作协议', type: 'required' },
    ],
    benefits: [
      { id: 'unlimited_ai', name: '无限AI功能', description: '无限AI生成', icon: 'Wand2', value: '无限' },
      { id: 'unlimited_storage', name: '无限存储', description: '无限云存储空间', icon: 'Cloud', value: '无限' },
      { id: 'premium_export', name: '高级导出', description: '4K/8K超清导出', icon: 'Download', value: true },
      { id: 'signed_badge', name: '签约标识', description: '专属签约徽章', icon: 'Star', value: true },
      { id: 'priority_recommend', name: '优先推荐', description: '首页优先展示', icon: 'TrendingUp', value: true },
      { id: 'revenue_share', name: '收益分成', description: '作品收益分成', icon: 'DollarSign', value: '70%' },
      { id: 'exclusive_events', name: '专属活动', description: '参与平台专属活动', icon: 'Calendar', value: true },
      { id: 'brand_coop', name: '品牌合作', description: '优先品牌合作机会', icon: 'Handshake', value: true },
      { id: 'personal_manager', name: '专属经理', description: '一对一运营支持', icon: 'UserCheck', value: true },
      { id: 'commercial_use', name: '商业授权', description: '作品商业使用授权', icon: 'Shield', value: true },
    ],
    priority: 3,
  },
];

export const CERTIFICATION_TYPE_NAMES: Record<CertificationType, string> = {
  individual: '个人创作者',
  organization: '机构/企业',
  media: '媒体/自媒体',
  brand: '品牌方',
};

export const CERTIFICATION_STATUS_NAMES: Record<CertificationStatus, string> = {
  none: '未认证',
  pending: '审核中',
  approved: '已认证',
  rejected: '已拒绝',
  revoked: '已撤销',
};
