/**
 * 版权保护相关类型定义
 */

export type CopyrightStatus = 'active' | 'disputed' | 'expired' | 'revoked';

export type TimestampProvider = 'internal' | 'trusted_third_party' | 'blockchain';

export type WorkType = 'image' | 'video' | 'audio' | 'text' | 'design' | 'other';

export interface CopyrightDeclaration {
  id: string;
  workId: string;
  workTitle: string;
  workType: WorkType;
  workUrl?: string;
  workThumbnail?: string;
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  declaration: string;
  copyrightHolder: string;
  licenseType: 'all_rights_reserved' | 'cc_by' | 'cc_by_sa' | 'cc_by_nc' | 'cc_by_nc_sa' | 'cc_by_nd' | 'cc_by_nc_nd' | 'custom';
  customLicenseTerms?: string;
  allowCommercialUse: boolean;
  allowModification: boolean;
  requireAttribution: boolean;
  status: CopyrightStatus;
  createdAt: string;
  updatedAt: string;
}

export interface TimestampRecord {
  id: string;
  copyrightId: string;
  provider: TimestampProvider;
  timestamp: string;
  hash: string;
  blockNumber?: number;
  transactionHash?: string;
  certificateUrl?: string;
  verificationUrl?: string;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface CopyrightWithTimestamp extends CopyrightDeclaration {
  timestampRecord?: TimestampRecord;
}

export interface CreateCopyrightDeclarationDTO {
  workId: string;
  workTitle: string;
  workType: WorkType;
  workUrl?: string;
  workThumbnail?: string;
  declaration?: string;
  copyrightHolder?: string;
  licenseType: CopyrightDeclaration['licenseType'];
  customLicenseTerms?: string;
  allowCommercialUse?: boolean;
  allowModification?: boolean;
  requireAttribution?: boolean;
}

export interface UpdateCopyrightDeclarationDTO {
  declaration?: string;
  licenseType?: CopyrightDeclaration['licenseType'];
  customLicenseTerms?: string;
  allowCommercialUse?: boolean;
  allowModification?: boolean;
  requireAttribution?: boolean;
}

export interface CopyrightStats {
  totalDeclarations: number;
  activeDeclarations: number;
  disputedDeclarations: number;
  totalTimestamps: number;
  blockchainTimestamps: number;
}

export const LICENSE_TYPE_CONFIG: Record<CopyrightDeclaration['licenseType'], { 
  label: string; 
  description: string;
  icon: string;
}> = {
  all_rights_reserved: {
    label: '保留所有权利',
    description: '未经版权所有者许可，不得以任何形式使用作品',
    icon: '🔒'
  },
  cc_by: {
    label: 'CC BY 署名',
    description: '允许他人使用、修改和商业使用，但必须注明原作者',
    icon: '📝'
  },
  cc_by_sa: {
    label: 'CC BY-SA 署名-相同方式共享',
    description: '允许修改和商业使用，但必须注明原作者并以相同方式授权',
    icon: '🔄'
  },
  cc_by_nc: {
    label: 'CC BY-NC 署名-非商业使用',
    description: '允许修改，但不得用于商业目的，且必须注明原作者',
    icon: '🚫'
  },
  cc_by_nc_sa: {
    label: 'CC BY-NC-SA 署名-非商业使用-相同方式共享',
    description: '允许修改但不得商业使用，必须注明原作者并以相同方式授权',
    icon: '🔄'
  },
  cc_by_nd: {
    label: 'CC BY-ND 署名-禁止演绎',
    description: '允许商业使用但不得修改作品，且必须注明原作者',
    icon: '⛔'
  },
  cc_by_nc_nd: {
    label: 'CC BY-NC-ND 署名-非商业使用-禁止演绎',
    description: '最严格的CC协议，仅允许下载和分享，不得修改或商业使用',
    icon: '🔒'
  },
  custom: {
    label: '自定义许可',
    description: '使用自定义的许可条款',
    icon: '⚙️'
  }
};

export const WORK_TYPE_CONFIG: Record<WorkType, { label: string; icon: string }> = {
  image: { label: '图片', icon: '🖼️' },
  video: { label: '视频', icon: '🎬' },
  audio: { label: '音频', icon: '🎵' },
  text: { label: '文本', icon: '📄' },
  design: { label: '设计', icon: '🎨' },
  other: { label: '其他', icon: '📦' }
};
