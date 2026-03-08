/**
 * 版权授权相关类型定义
 */

// 授权需求
export interface LicenseRequest {
  id: string;
  brandId: string;
  brandName: string;
  brandLogo?: string;
  title: string;
  description: string;
  requirements?: string;
  licenseType: 'exclusive' | 'non_exclusive' | 'sole';
  licenseScope?: {
    regions: string[];
    channels: string[];
    duration: string;
  };
  licenseFeeMin?: number;
  licenseFeeMax?: number;
  revenueShareRate?: number;
  ipCategories: string[];
  status: 'open' | 'closed' | 'paused';
  validUntil?: string;
  contactEmail?: string;
  contactPhone?: string;
  viewCount: number;
  applicationCount: number;
  approvedCount: number;
  createdAt: string;
  updatedAt: string;
}

// 授权申请
export interface LicenseApplication {
  id: string;
  requestId: string;
  request?: LicenseRequest;
  applicantId: string;
  applicantName: string;
  ipAssetId?: string;
  ipAssetName?: string;
  message?: string;
  proposedUsage?: string;
  expectedProducts?: string[];
  status: 'pending' | 'approved' | 'rejected' | 'contacted' | 'completed' | 'cancelled';
  brandResponse?: string;
  contactShared: boolean;
  brandContactEmail?: string;
  brandContactPhone?: string;
  brandContactWechat?: string;
  licenseAgreementUrl?: string;
  licenseStartDate?: string;
  licenseEndDate?: string;
  actualLicenseFee?: number;
  revenueShareRate?: number;
  reviewedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

// 授权产品
export interface LicensedProduct {
  id: string;
  applicationId: string;
  brandId: string;
  creatorId: string;
  productName: string;
  productDescription?: string;
  productImages?: string[];
  productCategory?: string;
  price: number;
  stock: number;
  status: 'draft' | 'pending_review' | 'approved' | 'rejected' | 'on_sale' | 'sold_out' | 'discontinued';
  salesCount: number;
  revenue: number;
  platformFee: number;
  brandShare: number;
  creatorShare: number;
  createdAt: string;
  updatedAt: string;
}

// 品牌统计
export interface BrandStats {
  totalRequests: number;
  activeRequests: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  totalProducts: number;
  onSaleProducts: number;
  totalRevenue: number;
  totalLicenseFees: number;
}

// 创建授权需求DTO
export interface CreateLicenseRequestDTO {
  title: string;
  description: string;
  requirements?: string;
  licenseType: 'exclusive' | 'non_exclusive' | 'sole';
  licenseScope?: {
    regions: string[];
    channels: string[];
    duration: string;
  };
  licenseFeeMin?: number;
  licenseFeeMax?: number;
  revenueShareRate?: number;
  ipCategories: string[];
  validUntil?: string;
  contactEmail?: string;
  contactPhone?: string;
}

// 提交申请DTO
export interface SubmitApplicationDTO {
  requestId: string;
  ipAssetId?: string;
  message?: string;
  proposedUsage?: string;
  expectedProducts?: string[];
}

// 审核申请DTO
export interface ApproveApplicationDTO {
  actualLicenseFee?: number;
  revenueShareRate?: number;
  licenseStartDate?: string;
  licenseEndDate?: string;
}

// 联系信息
export interface ContactInfo {
  email?: string;
  phone?: string;
  wechat?: string;
}

// 筛选条件
export interface RequestFilters {
  ipCategories?: string[];
  licenseType?: string;
  minFee?: number;
  maxFee?: number;
  sortBy?: 'newest' | 'popular' | 'fee_asc' | 'fee_desc';
}

export interface ApplicationFilters {
  status?: string;
  requestId?: string;
}
