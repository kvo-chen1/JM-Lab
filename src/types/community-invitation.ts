/**
 * 社群邀请与申请系统类型定义
 * 津脉社区平台
 */

// ============================================
// 基础类型
// ============================================

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';
export type JoinRequestStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type CommunityRole = 'owner' | 'admin' | 'moderator' | 'member';
export type ReportReason = 'spam' | 'harassment' | 'inappropriate' | 'fake' | 'other';
export type ReportStatus = 'pending' | 'investigating' | 'resolved' | 'dismissed';

// ============================================
// 社群邀请类型
// ============================================

export interface CommunityInvitation {
  id: string;
  communityId: string;
  inviterId: string;
  inviteeId?: string;
  inviteeEmail?: string;
  inviteePhone?: string;
  inviteCode?: string;
  status: InvitationStatus;
  message?: string;
  expiresAt?: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  // 关联数据
  community?: {
    id: string;
    name: string;
    description: string;
    avatar?: string;
  };
  inviter?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  invitee?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface CreateInvitationRequest {
  communityId: string;
  inviteeId?: string;
  inviteeEmail?: string;
  inviteePhone?: string;
  message?: string;
}

export interface BatchCreateInvitationRequest {
  communityId: string;
  invitees: Array<{
    userId?: string;
    email?: string;
    phone?: string;
  }>;
  message?: string;
}

export interface InvitationResponse {
  invitation: CommunityInvitation;
  inviteLink?: string;
}

export interface BatchInvitationResponse {
  success: CommunityInvitation[];
  failed: Array<{
    invitee: { userId?: string; email?: string; phone?: string };
    reason: string;
  }>;
}

// ============================================
// 社群申请类型
// ============================================

export interface CommunityJoinRequest {
  id: string;
  communityId: string;
  userId: string;
  status: JoinRequestStatus;
  reason?: string;
  answers?: Record<string, string>;
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNote?: string;
  createdAt: string;
  updatedAt: string;
  // 关联数据
  community?: {
    id: string;
    name: string;
    description: string;
    avatar?: string;
  };
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
    bio?: string;
  };
  reviewer?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface CreateJoinRequest {
  communityId: string;
  reason?: string;
  answers?: Record<string, string>;
}

export interface ReviewJoinRequest {
  requestId: string;
  action: 'approve' | 'reject';
  note?: string;
}

// ============================================
// 社群邀请配置类型
// ============================================

export interface ApplicationQuestion {
  id: string;
  type: 'text' | 'textarea' | 'select' | 'checkbox';
  label: string;
  placeholder?: string;
  required?: boolean;
  options?: string[]; // 用于 select 和 checkbox
}

export interface CommunityInviteSettings {
  id: string;
  communityId: string;
  allowMemberInvite: boolean;
  requireAdminApproval: boolean;
  requireApplicationApproval: boolean;
  maxInvitesPerDay: number;
  maxInvitesPerBatch: number;
  inviteExpireHours: number;
  applicationQuestions?: ApplicationQuestion[];
  welcomeMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateInviteSettings {
  allowMemberInvite?: boolean;
  requireAdminApproval?: boolean;
  requireApplicationApproval?: boolean;
  maxInvitesPerDay?: number;
  maxInvitesPerBatch?: number;
  inviteExpireHours?: number;
  applicationQuestions?: ApplicationQuestion[];
  welcomeMessage?: string;
}

// ============================================
// 邀请频率限制类型
// ============================================

export interface InviteRateLimit {
  canInvite: boolean;
  dailyRemaining: number;
  weeklyRemaining: number;
  monthlyRemaining: number;
  resetAt: string;
}

// ============================================
// 举报类型
// ============================================

export interface InvitationReport {
  id: string;
  reporterId: string;
  invitationId?: string;
  reportedUserId: string;
  communityId: string;
  reason: ReportReason;
  description?: string;
  status: ReportStatus;
  resolvedBy?: string;
  resolvedAt?: string;
  resolutionNote?: string;
  createdAt: string;
  updatedAt: string;
  // 关联数据
  reporter?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  reportedUser?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  community?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

export interface CreateInvitationReport {
  invitationId?: string;
  reportedUserId: string;
  communityId: string;
  reason: ReportReason;
  description?: string;
}

// ============================================
// 历史记录类型
// ============================================

export type HistoryActionType =
  | 'invite_sent'
  | 'invite_accepted'
  | 'invite_rejected'
  | 'invite_cancelled'
  | 'invite_expired'
  | 'application_submitted'
  | 'application_approved'
  | 'application_rejected'
  | 'application_cancelled'
  | 'member_joined'
  | 'member_left'
  | 'member_removed';

export interface CommunityInvitationHistory {
  id: string;
  communityId: string;
  userId: string;
  targetUserId?: string;
  actionType: HistoryActionType;
  actionDetail?: Record<string, any>;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  // 关联数据
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  targetUser?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

// ============================================
// 统计类型
// ============================================

export interface CommunityInviteStats {
  totalInvites: number;
  acceptedInvites: number;
  pendingInvites: number;
  rejectedInvites: number;
  expiredInvites: number;
  totalApplications: number;
  approvedApplications: number;
  pendingApplications: number;
  rejectedApplications: number;
  conversionRate: number; // 百分比
}

export interface UserInviteStats {
  totalInvites: number;
  acceptedInvites: number;
  pendingInvites: number;
  conversionRate: number;
}

// ============================================
// 搜索类型
// ============================================

export interface SearchUsersParams {
  query: string;
  communityId?: string;
  excludeMembers?: boolean;
  limit?: number;
}

export interface SearchableUser {
  id: string;
  username: string;
  avatarUrl?: string;
  bio?: string;
  isMember?: boolean;
}

// ============================================
// 通知类型
// ============================================

export interface InvitationNotification {
  id: string;
  type: 'invitation_received' | 'invitation_accepted' | 'invitation_rejected' | 'application_approved' | 'application_rejected';
  title: string;
  content: string;
  senderId?: string;
  recipientId: string;
  communityId?: string;
  invitationId?: string;
  requestId?: string;
  isRead: boolean;
  createdAt: string;
  // 关联数据
  sender?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
  community?: {
    id: string;
    name: string;
    avatar?: string;
  };
}

// ============================================
// API 响应类型
// ============================================

export interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

// ============================================
// 权限类型
// ============================================

export interface CommunityPermissions {
  canInvite: boolean;
  canManageInvites: boolean;
  canReviewApplications: boolean;
  canManageSettings: boolean;
  canRemoveMembers: boolean;
  canManageRoles: boolean;
}

// ============================================
// 表单验证类型
// ============================================

export interface InvitationFormData {
  invitees: Array<{
    type: 'user' | 'email' | 'phone';
    value: string;
  }>;
  message?: string;
}

export interface JoinApplicationFormData {
  reason: string;
  answers?: Record<string, string>;
}
