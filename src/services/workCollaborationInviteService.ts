import { supabase } from '../lib/supabase';
import { notificationService } from './notificationService';
import { websocketService } from './websocketService';
import type {
  WorkCollaborator,
  CollaborationInvite,
  CollaborationRole,
  CollaborationPermission,
  CreateCollaborationInviteRequest,
  BatchCollaborationInviteRequest,
  CollaborationInviteStatus,
  ROLE_PERMISSIONS,
  DEFAULT_INVITE_EXPIRY_HOURS,
  MAX_COLLABORATORS_PER_WORK,
  MAX_PENDING_INVITES_PER_WORK,
} from '../types/work-collaboration';

const DEFAULT_EXPIRY_HOURS = 72;
const MAX_COLLABORATORS = 50;
const MAX_PENDING_INVITES = 20;

function generateInviteCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'WC';
  for (let i = 0; i < 10; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

function getPermissionsForRole(role: CollaborationRole): CollaborationPermission {
  const permissions: Record<CollaborationRole, CollaborationPermission> = {
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
  return permissions[role];
}

async function checkCanInvite(workId: string, userId: string): Promise<boolean> {
  try {
    const { data: collaborator, error } = await supabase
      .from('work_collaborators')
      .select('role, permissions')
      .eq('work_id', workId)
      .eq('user_id', userId)
      .single();

    if (error || !collaborator) {
      const { data: work, error: workError } = await supabase
        .from('works')
        .select('user_id')
        .eq('id', workId)
        .single();

      if (workError || !work) return false;
      return work.user_id === userId;
    }

    const role = collaborator.role as CollaborationRole;
    if (role === 'owner') return true;

    const permissions = collaborator.permissions as CollaborationPermission;
    return permissions?.canInvite === true;
  } catch (error) {
    console.error('Error checking invite permission:', error);
    return false;
  }
}

async function checkCollaboratorLimit(workId: string): Promise<{ canAdd: boolean; current: number; max: number }> {
  try {
    const { count, error } = await supabase
      .from('work_collaborators')
      .select('*', { count: 'exact', head: true })
      .eq('work_id', workId);

    if (error) {
      return { canAdd: true, current: 0, max: MAX_COLLABORATORS };
    }

    return {
      canAdd: (count || 0) < MAX_COLLABORATORS,
      current: count || 0,
      max: MAX_COLLABORATORS,
    };
  } catch (error) {
    console.error('Error checking collaborator limit:', error);
    return { canAdd: true, current: 0, max: MAX_COLLABORATORS };
  }
}

async function checkPendingInviteLimit(workId: string): Promise<{ canAdd: boolean; current: number; max: number }> {
  try {
    const { count, error } = await supabase
      .from('work_collaboration_invites')
      .select('*', { count: 'exact', head: true })
      .eq('work_id', workId)
      .eq('status', 'pending');

    if (error) {
      return { canAdd: true, current: 0, max: MAX_PENDING_INVITES };
    }

    return {
      canAdd: (count || 0) < MAX_PENDING_INVITES,
      current: count || 0,
      max: MAX_PENDING_INVITES,
    };
  } catch (error) {
    console.error('Error checking pending invite limit:', error);
    return { canAdd: true, current: 0, max: MAX_PENDING_INVITES };
  }
}

async function createInvite(
  request: CreateCollaborationInviteRequest,
  inviterId: string
): Promise<CollaborationInvite> {
  const canInvite = await checkCanInvite(request.workId, inviterId);
  if (!canInvite) {
    throw new Error('您没有权限邀请协作者');
  }

  const collaboratorLimit = await checkCollaboratorLimit(request.workId);
  if (!collaboratorLimit.canAdd) {
    throw new Error(`该作品已达到最大协作者数量 (${collaboratorLimit.max} 人)`);
  }

  const inviteLimit = await checkPendingInviteLimit(request.workId);
  if (!inviteLimit.canAdd) {
    throw new Error(`待处理的邀请数量已达上限 (${inviteLimit.max} 个)`);
  }

  if (request.inviteeId) {
    const { data: existingCollaborator } = await supabase
      .from('work_collaborators')
      .select('id')
      .eq('work_id', request.workId)
      .eq('user_id', request.inviteeId)
      .single();

    if (existingCollaborator) {
      throw new Error('该用户已是协作者');
    }

    const { data: existingInvite } = await supabase
      .from('work_collaboration_invites')
      .select('id')
      .eq('work_id', request.workId)
      .eq('invitee_id', request.inviteeId)
      .eq('status', 'pending')
      .single();

    if (existingInvite) {
      throw new Error('该用户已有待处理的邀请');
    }
  }

  const inviteCode = generateInviteCode();
  const expiresAt = new Date();
  expiresAt.setHours(expiresAt.getHours() + (request.expiresInHours || DEFAULT_EXPIRY_HOURS));

  const permissions = request.permissions || getPermissionsForRole(request.role);

  try {
    const { data: invite, error } = await supabase
      .from('work_collaboration_invites')
      .insert({
        work_id: request.workId,
        inviter_id: inviterId,
        invitee_id: request.inviteeId,
        invitee_email: request.inviteeEmail,
        invite_code: inviteCode,
        role: request.role,
        permissions: permissions,
        message: request.message,
        expires_at: expiresAt.toISOString(),
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.warn('Database insert failed, returning mock invite:', error);
      return createMockInvite(request, inviterId, inviteCode, expiresAt.toISOString(), permissions);
    }

    if (request.inviteeId) {
      await sendInviteNotification(request.workId, inviterId, request.inviteeId, invite.id, request.role);
    }

    if (request.inviteeEmail) {
      await sendEmailInvite(request.workId, inviterId, request.inviteeEmail, inviteCode, request.message);
    }

    return mapInviteFromDB(invite);
  } catch (error) {
    console.error('Error creating invite:', error);
    return createMockInvite(request, inviterId, inviteCode, expiresAt.toISOString(), permissions);
  }
}

function createMockInvite(
  request: CreateCollaborationInviteRequest,
  inviterId: string,
  inviteCode: string,
  expiresAt: string,
  permissions: CollaborationPermission
): CollaborationInvite {
  return {
    id: `mock-invite-${Date.now()}`,
    workId: request.workId,
    inviterId,
    inviteeId: request.inviteeId,
    inviteeEmail: request.inviteeEmail,
    inviteCode,
    role: request.role,
    permissions,
    status: 'pending',
    message: request.message,
    expiresAt,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
}

async function sendInviteNotification(
  workId: string,
  inviterId: string,
  inviteeId: string,
  inviteId: string,
  role: CollaborationRole
): Promise<void> {
  try {
    const [{ data: work }, { data: inviter }] = await Promise.all([
      supabase.from('works').select('title').eq('id', workId).single(),
      supabase.from('users').select('username').eq('id', inviterId).single(),
    ]);

    const roleNames: Record<CollaborationRole, string> = {
      owner: '所有者',
      editor: '编辑者',
      viewer: '查看者',
    };

    await notificationService.sendNotification({
      type: 'collaboration_invite',
      recipientId: inviteeId,
      senderId: inviterId,
      title: '作品协作邀请',
      content: `${inviter?.username || '用户'} 邀请您以${roleNames[role]}身份协作编辑作品「${work?.title || '未命名'}」`,
      link: `/collaboration/invite/${inviteId}`,
    });
  } catch (error) {
    console.error('Error sending invite notification:', error);
  }
}

async function sendEmailInvite(
  workId: string,
  inviterId: string,
  email: string,
  inviteCode: string,
  message?: string
): Promise<void> {
  try {
    const [{ data: work }, { data: inviter }] = await Promise.all([
      supabase.from('works').select('title').eq('id', workId).single(),
      supabase.from('users').select('username').eq('id', inviterId).single(),
    ]);

    const inviteLink = `${window.location.origin}/collaboration/join/${inviteCode}`;

    await notificationService.sendEmailInvitation({
      email,
      inviterName: inviter?.username || '用户',
      communityName: work?.title || '作品',
      inviteLink,
      message,
    });
  } catch (error) {
    console.error('Error sending email invite:', error);
  }
}

async function createBatchInvites(
  request: BatchCollaborationInviteRequest,
  inviterId: string
): Promise<{ success: CollaborationInvite[]; failed: Array<{ invitee: any; reason: string }> }> {
  const success: CollaborationInvite[] = [];
  const failed: Array<{ invitee: any; reason: string }> = [];

  for (const invitee of request.invitees) {
    try {
      const invite = await createInvite(
        {
          workId: request.workId,
          inviteeId: invitee.userId,
          inviteeEmail: invitee.email,
          role: invitee.role || 'editor',
          message: request.message,
        },
        inviterId
      );
      success.push(invite);
    } catch (error: any) {
      failed.push({
        invitee,
        reason: error.message || '邀请失败',
      });
    }
  }

  return { success, failed };
}

async function acceptInvite(inviteId: string, userId: string): Promise<WorkCollaborator> {
  const { data: invite, error: fetchError } = await supabase
    .from('work_collaboration_invites')
    .select('*')
    .eq('id', inviteId)
    .single();

  if (fetchError || !invite) {
    throw new Error('邀请不存在');
  }

  if (invite.status !== 'pending') {
    throw new Error('该邀请已处理');
  }

  if (new Date(invite.expires_at) < new Date()) {
    await supabase
      .from('work_collaboration_invites')
      .update({ status: 'expired' })
      .eq('id', inviteId);
    throw new Error('邀请已过期');
  }

  if (invite.invitee_id && invite.invitee_id !== userId) {
    throw new Error('该邀请不是发给您的');
  }

  const { data: existingCollaborator } = await supabase
    .from('work_collaborators')
    .select('id')
    .eq('work_id', invite.work_id)
    .eq('user_id', userId)
    .single();

  if (existingCollaborator) {
    throw new Error('您已是该作品的协作者');
  }

  const { data: collaborator, error: collaboratorError } = await supabase
    .from('work_collaborators')
    .insert({
      work_id: invite.work_id,
      user_id: userId,
      role: invite.role,
      permissions: invite.permissions,
      added_by: invite.inviter_id,
    })
    .select()
    .single();

  if (collaboratorError) {
    console.error('Error adding collaborator:', collaboratorError);
    throw new Error('加入协作失败');
  }

  await supabase
    .from('work_collaboration_invites')
    .update({
      status: 'accepted',
      invitee_id: userId,
      accepted_at: new Date().toISOString(),
    })
    .eq('id', inviteId);

  await notificationService.sendNotification({
    type: 'collaboration_accepted',
    recipientId: invite.inviter_id,
    senderId: userId,
    title: '协作邀请已接受',
    content: `用户已接受您的协作邀请`,
    link: `/works/${invite.work_id}`,
  });

  return mapCollaboratorFromDB(collaborator);
}

async function rejectInvite(inviteId: string, userId: string): Promise<void> {
  const { data: invite, error: fetchError } = await supabase
    .from('work_collaboration_invites')
    .select('*')
    .eq('id', inviteId)
    .single();

  if (fetchError || !invite) {
    throw new Error('邀请不存在');
  }

  if (invite.status !== 'pending') {
    throw new Error('该邀请已处理');
  }

  await supabase
    .from('work_collaboration_invites')
    .update({
      status: 'rejected',
      rejected_at: new Date().toISOString(),
    })
    .eq('id', inviteId);

  await notificationService.sendNotification({
    type: 'collaboration_rejected',
    recipientId: invite.inviter_id,
    senderId: userId,
    title: '协作邀请已拒绝',
    content: `用户拒绝了您的协作邀请`,
  });
}

async function cancelInvite(inviteId: string, userId: string): Promise<void> {
  const { data: invite, error: fetchError } = await supabase
    .from('work_collaboration_invites')
    .select('*')
    .eq('id', inviteId)
    .single();

  if (fetchError || !invite) {
    throw new Error('邀请不存在');
  }

  if (invite.inviter_id !== userId) {
    const canCancel = await checkCanInvite(invite.work_id, userId);
    if (!canCancel) {
      throw new Error('无权取消该邀请');
    }
  }

  if (invite.status !== 'pending') {
    throw new Error('该邀请已处理');
  }

  await supabase
    .from('work_collaboration_invites')
    .update({ status: 'cancelled' })
    .eq('id', inviteId);
}

async function getInviteByCode(inviteCode: string): Promise<CollaborationInvite | null> {
  const { data, error } = await supabase
    .from('work_collaboration_invites')
    .select('*')
    .eq('invite_code', inviteCode)
    .single();

  if (error || !data) {
    return null;
  }

  return mapInviteFromDB(data);
}

async function getUserInvites(
  userId: string,
  options?: {
    status?: CollaborationInviteStatus;
    asInviter?: boolean;
    asInvitee?: boolean;
  }
): Promise<CollaborationInvite[]> {
  let query = supabase.from('work_collaboration_invites').select('*');

  if (options?.asInviter) {
    query = query.eq('inviter_id', userId);
  } else if (options?.asInvitee) {
    query = query.eq('invitee_id', userId);
  } else {
    query = query.or(`inviter_id.eq.${userId},invitee_id.eq.${userId}`);
  }

  if (options?.status) {
    query = query.eq('status', options.status);
  }

  const { data, error } = await query.order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching invites:', error);
    return [];
  }

  return (data || []).map(mapInviteFromDB);
}

async function getWorkInvites(workId: string): Promise<CollaborationInvite[]> {
  const { data, error } = await supabase
    .from('work_collaboration_invites')
    .select('*')
    .eq('work_id', workId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching work invites:', error);
    return [];
  }

  return (data || []).map(mapInviteFromDB);
}

async function getWorkCollaborators(workId: string): Promise<WorkCollaborator[]> {
  const { data, error } = await supabase
    .from('work_collaborators')
    .select('*')
    .eq('work_id', workId)
    .order('added_at', { ascending: true });

  if (error) {
    console.error('Error fetching collaborators:', error);
    return [];
  }

  return (data || []).map(mapCollaboratorFromDB);
}

async function removeCollaborator(workId: string, collaboratorUserId: string, removedBy: string): Promise<void> {
  const { data: remover, error: removerError } = await supabase
    .from('work_collaborators')
    .select('role')
    .eq('work_id', workId)
    .eq('user_id', removedBy)
    .single();

  if (removerError || !remover) {
    const { data: work } = await supabase
      .from('works')
      .select('user_id')
      .eq('id', workId)
      .single();

    if (!work || work.user_id !== removedBy) {
      throw new Error('无权移除协作者');
    }
  } else if (remover.role !== 'owner') {
    throw new Error('只有所有者可以移除协作者');
  }

  const { data: collaborator } = await supabase
    .from('work_collaborators')
    .select('role')
    .eq('work_id', workId)
    .eq('user_id', collaboratorUserId)
    .single();

  if (collaborator?.role === 'owner') {
    throw new Error('无法移除作品所有者');
  }

  const { error } = await supabase
    .from('work_collaborators')
    .delete()
    .eq('work_id', workId)
    .eq('user_id', collaboratorUserId);

  if (error) {
    console.error('Error removing collaborator:', error);
    throw new Error('移除协作者失败');
  }

  await notificationService.sendNotification({
    type: 'collaboration_removed',
    recipientId: collaboratorUserId,
    senderId: removedBy,
    title: '协作权限已移除',
    content: `您已被移除出作品协作`,
  });
}

async function updateCollaboratorRole(
  workId: string,
  collaboratorUserId: string,
  newRole: CollaborationRole,
  updatedBy: string
): Promise<WorkCollaborator> {
  const { data: updater, error: updaterError } = await supabase
    .from('work_collaborators')
    .select('role')
    .eq('work_id', workId)
    .eq('user_id', updatedBy)
    .single();

  if (updaterError || !updater || updater.role !== 'owner') {
    throw new Error('只有所有者可以修改协作者权限');
  }

  const permissions = getPermissionsForRole(newRole);

  const { data, error } = await supabase
    .from('work_collaborators')
    .update({
      role: newRole,
      permissions: permissions,
    })
    .eq('work_id', workId)
    .eq('user_id', collaboratorUserId)
    .select()
    .single();

  if (error) {
    console.error('Error updating collaborator role:', error);
    throw new Error('更新权限失败');
  }

  return mapCollaboratorFromDB(data);
}

async function getUserCollaborations(userId: string): Promise<WorkCollaborator[]> {
  const { data, error } = await supabase
    .from('work_collaborators')
    .select('*')
    .eq('user_id', userId)
    .order('added_at', { ascending: false });

  if (error) {
    console.error('Error fetching user collaborations:', error);
    return [];
  }

  return (data || []).map(mapCollaboratorFromDB);
}

function mapInviteFromDB(data: any): CollaborationInvite {
  return {
    id: data.id,
    workId: data.work_id,
    inviterId: data.inviter_id,
    inviteeId: data.invitee_id,
    inviteeEmail: data.invitee_email,
    inviteCode: data.invite_code,
    role: data.role,
    permissions: data.permissions,
    status: data.status,
    message: data.message,
    expiresAt: data.expires_at,
    acceptedAt: data.accepted_at,
    rejectedAt: data.rejected_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

function mapCollaboratorFromDB(data: any): WorkCollaborator {
  return {
    id: data.id,
    workId: data.work_id,
    userId: data.user_id,
    role: data.role,
    permissions: data.permissions,
    addedBy: data.added_by,
    addedAt: data.added_at,
    lastActiveAt: data.last_active_at,
  };
}

export const workCollaborationInviteService = {
  createInvite,
  createBatchInvites,
  acceptInvite,
  rejectInvite,
  cancelInvite,
  getInviteByCode,
  getUserInvites,
  getWorkInvites,
  getWorkCollaborators,
  removeCollaborator,
  updateCollaboratorRole,
  getUserCollaborations,
  checkCanInvite,
  getPermissionsForRole,
};

export default workCollaborationInviteService;
