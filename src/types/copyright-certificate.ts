/**
 * 版权证书类型定义
 */

export type CertificateStatus = 'valid' | 'expired' | 'revoked';

export type CertificateTemplate = 'standard' | 'premium' | 'blockchain';

export interface CopyrightCertificate {
  id: string;
  certificateNumber: string;
  
  copyrightDeclarationId: string;
  
  workId: string;
  workTitle: string;
  workType: string;
  workThumbnail?: string;
  workHash?: string;
  
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  copyrightHolder: string;
  
  licenseType: string;
  licenseLabel: string;
  
  timestamp: string;
  timestampProvider: string;
  timestampHash: string;
  blockNumber?: number;
  transactionHash?: string;
  
  template: CertificateTemplate;
  status: CertificateStatus;
  
  validFrom: string;
  validUntil?: string;
  
  issuedAt: string;
  issuedBy: string;
  
  verificationUrl: string;
  qrCodeData?: string;
  
  metadata?: {
    description?: string;
    tags?: string[];
    customFields?: Record<string, any>;
  };
}

export interface CertificateVerificationResult {
  valid: boolean;
  certificate?: CopyrightCertificate;
  message: string;
  warnings?: string[];
}

export interface GenerateCertificateDTO {
  copyrightDeclarationId: string;
  template?: CertificateTemplate;
  validUntil?: string;
  metadata?: CopyrightCertificate['metadata'];
}

export const CERTIFICATE_TEMPLATE_CONFIG: Record<CertificateTemplate, {
  label: string;
  description: string;
  features: string[];
  icon: string;
}> = {
  standard: {
    label: '标准证书',
    description: '基础版权证书，包含核心版权信息',
    features: ['版权声明', '时间戳记录', '在线验证'],
    icon: '📜'
  },
  premium: {
    label: '高级证书',
    description: '增强版证书，包含更详细的作品信息',
    features: ['版权声明', '时间戳记录', '作品指纹', '在线验证', '防伪水印'],
    icon: '🏅'
  },
  blockchain: {
    label: '区块链证书',
    description: '基于区块链的不可篡改证书',
    features: ['版权声明', '区块链存证', '智能合约', '全球验证', '永久保存'],
    icon: '⛓️'
  }
};
