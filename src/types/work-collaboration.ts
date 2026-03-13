export type CollaborationRole = 'owner' | 'editor' | 'viewer';

export type CollaborationInviteStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'cancelled';

export type CollaborationSessionStatus = 'active' | 'paused' | 'completed' | 'archived';

export type LockStatus = 'locked' | 'unlocked';

export type OperationType = 'insert' | 'delete' | 'replace' | 'move';

export type ConflictResolutionStrategy = 'last_write_wins' | 'operational_transform' | 'manual';

export interface CollaborationPermission {
  canEdit: boolean;
  canView: boolean;
  canInvite: boolean;
  canRemoveCollaborators: boolean;
  canManageVersions: boolean;
  canExport: boolean;
  canComment: boolean;
  canLock: boolean;
}

export interface WorkCollaborator {
  id: string;
  workId: string;
  userId: string;
  role: CollaborationRole;
  permissions: CollaborationPermission;
  addedBy: string;
  addedAt: string;
  lastActiveAt?: string;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
    email?: string;
  };
}

export interface CollaborationInvite {
  id: string;
  workId: string;
  inviterId: string;
  inviteeId?: string;
  inviteeEmail?: string;
  inviteCode?: string;
  role: CollaborationRole;
  permissions?: Partial<CollaborationPermission>;
  status: CollaborationInviteStatus;
  message?: string;
  expiresAt: string;
  acceptedAt?: string;
  rejectedAt?: string;
  createdAt: string;
  updatedAt: string;
  work?: {
    id: string;
    title: string;
    thumbnail?: string;
    type?: string;
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

export interface CreateCollaborationInviteRequest {
  workId: string;
  inviteeId?: string;
  inviteeEmail?: string;
  role: CollaborationRole;
  permissions?: Partial<CollaborationPermission>;
  message?: string;
  expiresInHours?: number;
}

export interface BatchCollaborationInviteRequest {
  workId: string;
  invitees: Array<{
    userId?: string;
    email?: string;
    role?: CollaborationRole;
  }>;
  message?: string;
}

export interface CollaborationSession {
  id: string;
  workId: string;
  status: CollaborationSessionStatus;
  createdBy: string;
  createdAt: string;
  endedAt?: string;
  participants: CollaborationParticipant[];
  activeOperations: number;
  version: number;
}

export interface CollaborationParticipant {
  userId: string;
  username: string;
  avatarUrl?: string;
  color: string;
  cursorPosition?: number;
  selectionRange?: { start: number; end: number };
  isTyping: boolean;
  lastActiveAt: string;
  role: CollaborationRole;
}

export interface OperationLock {
  id: string;
  workId: string;
  userId: string;
  resourceType: 'content' | 'metadata' | 'file' | 'section';
  resourceId?: string;
  lockStatus: LockStatus;
  lockedAt: string;
  expiresAt: string;
  metadata?: Record<string, any>;
}

export interface CollaborationOperation {
  id: string;
  sessionId: string;
  workId: string;
  userId: string;
  operationType: OperationType;
  position: number;
  content?: string;
  length?: number;
  previousContent?: string;
  timestamp: string;
  version: number;
  isApplied: boolean;
  conflictDetected: boolean;
  conflictResolved: boolean;
  resolutionStrategy?: ConflictResolutionStrategy;
}

export interface OperationQueue {
  workId: string;
  pendingOperations: CollaborationOperation[];
  processingOperation: CollaborationOperation | null;
  lastProcessedVersion: number;
}

export interface CollaborationConflict {
  id: string;
  workId: string;
  sessionId: string;
  operationIds: string[];
  conflictType: 'concurrent_edit' | 'lock_conflict' | 'version_mismatch';
  detectedAt: string;
  resolvedAt?: string;
  resolutionStrategy: ConflictResolutionStrategy;
  resolutionData?: Record<string, any>;
  status: 'pending' | 'resolved' | 'manual_required';
}

export interface CollaborationHistory {
  id: string;
  workId: string;
  userId: string;
  actionType: 'join' | 'leave' | 'edit' | 'lock' | 'unlock' | 'invite' | 'remove' | 'version_create' | 'version_restore';
  actionDetail?: Record<string, any>;
  sessionId?: string;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
  user?: {
    id: string;
    username: string;
    avatarUrl?: string;
  };
}

export interface CollaborationVersion {
  id: string;
  workId: string;
  versionNumber: number;
  title: string;
  description?: string;
  content?: any;
  thumbnailUrl?: string;
  tags?: string[];
  files?: string[];
  createdBy: string;
  createdAt: string;
  changeLog?: string;
  isAutoSave: boolean;
  isCollaborationSnapshot: boolean;
  collaboratorCount: number;
  collaborators: string[];
}

export interface CollaborationStats {
  totalCollaborators: number;
  activeCollaborators: number;
  totalSessions: number;
  totalEdits: number;
  totalVersions: number;
  averageSessionDuration: number;
  lastActiveAt?: string;
}

export interface CollaboratorCursor {
  userId: string;
  username: string;
  avatarUrl?: string;
  color: string;
  position: number;
  selectionStart?: number;
  selectionEnd?: number;
  isTyping: boolean;
  lastUpdate: string;
}

export interface CollaboratorPresence {
  workId: string;
  userId: string;
  username: string;
  avatarUrl?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen: string;
  currentSessionId?: string;
}

export interface WebSocketCollaborationMessage {
  type: 'join_session' | 'leave_session' | 'cursor_move' | 'selection_change' | 'text_edit' | 'typing_start' | 'typing_stop' | 'lock_acquire' | 'lock_release' | 'sync_request' | 'sync_response' | 'conflict_detected' | 'operation_applied';
  payload: any;
  timestamp: string;
  senderId: string;
  workId: string;
  sessionId?: string;
}

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

export const ROLE_PERMISSIONS: Record<CollaborationRole, CollaborationPermission> = {
  owner: {
    canEdit: true,
    canView: true,
    canInvite: true,
    canRemoveCollaborators: true,
    canManageVersions: true,
    canExport: true,
    canComment: true,
    canLock: true,
  },
  editor: {
    canEdit: true,
    canView: true,
    canInvite: false,
    canRemoveCollaborators: false,
    canManageVersions: true,
    canExport: true,
    canComment: true,
    canLock: true,
  },
  viewer: {
    canEdit: false,
    canView: true,
    canInvite: false,
    canRemoveCollaborators: false,
    canManageVersions: false,
    canExport: false,
    canComment: true,
    canLock: false,
  },
};

export const DEFAULT_INVITE_EXPIRY_HOURS = 72;

export const MAX_COLLABORATORS_PER_WORK = 50;

export const MAX_PENDING_INVITES_PER_WORK = 20;

export const LOCK_EXPIRY_MINUTES = 30;

export const OPERATION_QUEUE_SIZE = 100;

export const AUTO_SAVE_INTERVAL_MS = 30000;

export const CURSOR_UPDATE_THROTTLE_MS = 100;

export const TYPING_INDICATOR_TIMEOUT_MS = 3000;
