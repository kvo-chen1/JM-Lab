/**
 * 侵权举报类型定义
 */

export type InfringementType = 
  | 'plagiarism'
  | 'unauthorized_use'
  | 'copyright_violation'
  | 'trademark_infringement'
  | 'piracy'
  | 'counterfeit'
  | 'other';

export type ReportPriority = 'low' | 'normal' | 'high' | 'urgent';

export type ReportStatus = 'submitted' | 'under_review' | 'evidence_requested' | 'pending_response' | 'resolved' | 'rejected' | 'withdrawn';

export type EvidenceType = 'screenshot' | 'original_file' | 'url' | 'certificate' | 'contract' | 'other';

export interface Evidence {
  id: string;
  reportId: string;
  type: EvidenceType;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  externalUrl?: string;
  uploadedAt: string;
  verified: boolean;
}

export interface InfringementReport {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterEmail?: string;
  reporterPhone?: string;
  
  targetType: 'work' | 'user' | 'product' | 'external';
  targetId: string;
  targetTitle?: string;
  targetUrl?: string;
  targetThumbnail?: string;
  targetCreatorId?: string;
  targetCreatorName?: string;
  
  infringementType: InfringementType;
  priority: ReportPriority;
  status: ReportStatus;
  
  title: string;
  description: string;
  originalWorkUrl?: string;
  originalWorkTitle?: string;
  originalCreationDate?: string;
  
  evidence: Evidence[];
  
  adminId?: string;
  adminName?: string;
  adminResponse?: string;
  resolution?: string;
  resolutionType?: 'removed' | 'warning' | 'rejected' | 'escalated' | 'no_violation';
  
  submittedAt: string;
  updatedAt: string;
  reviewedAt?: string;
  resolvedAt?: string;
  
  timeline: ReportTimelineEntry[];
}

export interface ReportTimelineEntry {
  id: string;
  reportId: string;
  action: string;
  description: string;
  actorId?: string;
  actorName?: string;
  actorRole: 'reporter' | 'admin' | 'system';
  createdAt: string;
}

export interface CreateInfringementReportDTO {
  targetType: InfringementReport['targetType'];
  targetId: string;
  targetTitle?: string;
  targetUrl?: string;
  targetThumbnail?: string;
  targetCreatorId?: string;
  targetCreatorName?: string;
  
  infringementType: InfringementType;
  priority?: ReportPriority;
  
  title: string;
  description: string;
  originalWorkUrl?: string;
  originalWorkTitle?: string;
  originalCreationDate?: string;
  
  reporterEmail?: string;
  reporterPhone?: string;
}

export interface AddEvidenceDTO {
  reportId: string;
  type: EvidenceType;
  title: string;
  description?: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  externalUrl?: string;
}

export interface UpdateReportStatusDTO {
  status: ReportStatus;
  adminResponse?: string;
  resolution?: string;
  resolutionType?: InfringementReport['resolutionType'];
}

export interface InfringementReportStats {
  total: number;
  pending: number;
  underReview: number;
  resolved: number;
  rejected: number;
  byType: Record<InfringementType, number>;
  byPriority: Record<ReportPriority, number>;
  averageResolutionTime: number;
}

export const INFRINGEMENT_TYPE_CONFIG: Record<InfringementType, { 
  label: string; 
  description: string;
  icon: string;
}> = {
  plagiarism: {
    label: '抄袭/剽窃',
    description: '未经授权使用他人作品内容',
    icon: '📝'
  },
  unauthorized_use: {
    label: '未经授权使用',
    description: '未经许可使用受版权保护的作品',
    icon: '🚫'
  },
  copyright_violation: {
    label: '版权侵权',
    description: '侵犯他人版权',
    icon: '©️'
  },
  trademark_infringement: {
    label: '商标侵权',
    description: '未经授权使用他人注册商标',
    icon: '®️'
  },
  piracy: {
    label: '盗版',
    description: '非法复制、分发受版权保护的作品',
    icon: '🏴‍☠️'
  },
  counterfeit: {
    label: '假冒',
    description: '制造或销售假冒商品',
    icon: '⚠️'
  },
  other: {
    label: '其他',
    description: '其他类型的侵权行为',
    icon: '📋'
  }
};

export const PRIORITY_CONFIG: Record<ReportPriority, {
  label: string;
  color: string;
  bgColor: string;
}> = {
  low: { label: '低', color: 'text-gray-600', bgColor: 'bg-gray-100' },
  normal: { label: '普通', color: 'text-blue-600', bgColor: 'bg-blue-100' },
  high: { label: '高', color: 'text-orange-600', bgColor: 'bg-orange-100' },
  urgent: { label: '紧急', color: 'text-red-600', bgColor: 'bg-red-100' }
};

export const STATUS_CONFIG: Record<ReportStatus, {
  label: string;
  color: string;
  bgColor: string;
  icon: string;
}> = {
  submitted: { label: '已提交', color: 'text-blue-600', bgColor: 'bg-blue-100', icon: '📤' },
  under_review: { label: '审核中', color: 'text-yellow-600', bgColor: 'bg-yellow-100', icon: '🔍' },
  evidence_requested: { label: '待补充证据', color: 'text-purple-600', bgColor: 'bg-purple-100', icon: '📎' },
  pending_response: { label: '等待回应', color: 'text-indigo-600', bgColor: 'bg-indigo-100', icon: '⏳' },
  resolved: { label: '已解决', color: 'text-green-600', bgColor: 'bg-green-100', icon: '✅' },
  rejected: { label: '已驳回', color: 'text-gray-600', bgColor: 'bg-gray-100', icon: '❌' },
  withdrawn: { label: '已撤回', color: 'text-gray-500', bgColor: 'bg-gray-50', icon: '🔙' }
};
