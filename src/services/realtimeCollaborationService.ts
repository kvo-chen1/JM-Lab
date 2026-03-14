import { supabase } from '../lib/supabase';
import { websocketService } from './websocketService';
import type {
  CollaborationSession,
  CollaborationParticipant,
  CollaborationOperation,
  OperationLock,
  OperationQueue,
  CollaborationConflict,
  CollaboratorCursor,
  CollaboratorPresence,
  WebSocketCollaborationMessage,
  CollaborationRole,
  OperationType,
} from '../types/work-collaboration';

const LOCK_EXPIRY_MS = 30 * 60 * 1000;
const CURSOR_THROTTLE_MS = 100;
const TYPING_TIMEOUT_MS = 3000;
const OPERATION_QUEUE_SIZE = 100;

class RealtimeCollaborationService {
  private sessions: Map<string, CollaborationSession> = new Map();
  private participants: Map<string, Map<string, CollaborationParticipant>> = new Map();
  private operationQueues: Map<string, OperationQueue> = new Map();
  private locks: Map<string, Map<string, OperationLock>> = new Map();
  private cursors: Map<string, Map<string, CollaboratorCursor>> = new Map();
  private presence: Map<string, Map<string, CollaboratorPresence>> = new Map();
  private typingTimeouts: Map<string, Map<string, NodeJS.Timeout>> = new Map();
  private cursorThrottle: Map<string, NodeJS.Timeout> = new Map();
  private listeners: Map<string, Set<(data: any) => void>> = new Map();
  private userId: string | null = null;
  private username: string = '';
  private userColor: string = '';

  initialize(user: { id: string; username?: string; avatar?: string }) {
    if (this.userId === user.id) return;
    this.userId = user.id;
    this.username = user.username || '匿名用户';
    this.userColor = this.generateUserColor(user.id);

    websocketService.connect();

    websocketService.on('collaboration_message', (message: WebSocketCollaborationMessage) => {
      this.handleCollaborationMessage(message);
    });

    websocketService.onOpen(() => {
      console.log('[RealtimeCollaboration] Connected');
    });

    websocketService.onClose(() => {
      console.log('[RealtimeCollaboration] Disconnected');
      this.cleanup();
    });
  }

  private generateUserColor(userId: string): string {
    const colors = [
      '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FECA57',
      '#FF9FF3', '#54A0FF', '#5F27CD', '#00D2D3', '#FF9F43',
      '#10AC84', '#EE5A24', '#0ABDE3', '#F368E0', '#01A3A4',
    ];
    let hash = 0;
    for (let i = 0; i < userId.length; i++) {
      hash = userId.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  }

  async joinSession(workId: string, role: CollaborationRole): Promise<CollaborationSession> {
    if (!this.userId) throw new Error('用户未初始化');

    let session = this.sessions.get(workId);

    if (!session) {
      session = await this.createSession(workId);
    }

    const participant: CollaborationParticipant = {
      userId: this.userId,
      username: this.username,
      color: this.userColor,
      cursorPosition: 0,
      isTyping: false,
      lastActiveAt: new Date().toISOString(),
      role,
    };

    if (!this.participants.has(workId)) {
      this.participants.set(workId, new Map());
    }
    this.participants.get(workId)!.set(this.userId, participant);

    if (!this.cursors.has(workId)) {
      this.cursors.set(workId, new Map());
    }
    this.cursors.get(workId)!.set(this.userId, {
      userId: this.userId,
      username: this.username,
      color: this.userColor,
      position: 0,
      isTyping: false,
      lastUpdate: new Date().toISOString(),
    });

    if (!this.presence.has(workId)) {
      this.presence.set(workId, new Map());
    }
    this.presence.get(workId)!.set(this.userId, {
      workId,
      userId: this.userId,
      username: this.username,
      status: 'online',
      lastSeen: new Date().toISOString(),
      currentSessionId: session.id,
    });

    this.broadcastMessage({
      type: 'join_session',
      payload: { participant },
      timestamp: new Date().toISOString(),
      senderId: this.userId,
      workId,
      sessionId: session.id,
    });

    this.emit('session_joined', { session, participant });

    return session;
  }

  async leaveSession(workId: string): Promise<void> {
    if (!this.userId) return;

    const session = this.sessions.get(workId);
    if (!session) return;

    this.participants.get(workId)?.delete(this.userId);
    this.cursors.get(workId)?.delete(this.userId);
    this.presence.get(workId)?.delete(this.userId);

    this.releaseAllLocks(workId, this.userId);

    this.broadcastMessage({
      type: 'leave_session',
      payload: { userId: this.userId },
      timestamp: new Date().toISOString(),
      senderId: this.userId,
      workId,
      sessionId: session.id,
    });

    this.emit('session_left', { workId, userId: this.userId });
  }

  private async createSession(workId: string): Promise<CollaborationSession> {
    const session: CollaborationSession = {
      id: `session-${workId}-${Date.now()}`,
      workId,
      status: 'active',
      createdBy: this.userId!,
      createdAt: new Date().toISOString(),
      participants: [],
      activeOperations: 0,
      version: 0,
    };

    this.sessions.set(workId, session);

    try {
      await supabase
        .from('collaboration_sessions')
        .insert({
          id: session.id,
          work_id: workId,
          status: session.status,
          created_by: session.createdBy,
          created_at: session.createdAt,
          version: session.version,
        });
    } catch (error) {
      console.warn('Failed to save session to database:', error);
    }

    return session;
  }

  sendCursorMove(workId: string, position: number): void {
    if (!this.userId) return;

    const throttleKey = `${workId}-cursor`;
    if (this.cursorThrottle.has(throttleKey)) {
      return;
    }

    this.cursorThrottle.set(throttleKey, setTimeout(() => {
      this.cursorThrottle.delete(throttleKey);
    }, CURSOR_THROTTLE_MS));

    const cursor = this.cursors.get(workId)?.get(this.userId);
    if (cursor) {
      cursor.position = position;
      cursor.lastUpdate = new Date().toISOString();
    }

    const session = this.sessions.get(workId);
    this.broadcastMessage({
      type: 'cursor_move',
      payload: { position },
      timestamp: new Date().toISOString(),
      senderId: this.userId,
      workId,
      sessionId: session?.id,
    });
  }

  sendSelectionChange(workId: string, start: number, end: number): void {
    if (!this.userId) return;

    const cursor = this.cursors.get(workId)?.get(this.userId);
    if (cursor) {
      cursor.selectionStart = start;
      cursor.selectionEnd = end;
      cursor.lastUpdate = new Date().toISOString();
    }

    const session = this.sessions.get(workId);
    this.broadcastMessage({
      type: 'selection_change',
      payload: { start, end },
      timestamp: new Date().toISOString(),
      senderId: this.userId,
      workId,
      sessionId: session?.id,
    });
  }

  sendTextEdit(workId: string, operation: OperationType, position: number, content?: string, length?: number): void {
    if (!this.userId) return;

    const session = this.sessions.get(workId);
    if (!session) return;

    const operationData: CollaborationOperation = {
      id: `op-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      sessionId: session.id,
      workId,
      userId: this.userId,
      operationType: operation,
      position,
      content,
      length,
      timestamp: new Date().toISOString(),
      version: session.version + 1,
      isApplied: false,
      conflictDetected: false,
      conflictResolved: false,
    };

    this.queueOperation(workId, operationData);

    this.broadcastMessage({
      type: 'text_edit',
      payload: { operation: operationData },
      timestamp: new Date().toISOString(),
      senderId: this.userId,
      workId,
      sessionId: session.id,
    });

    this.startTypingIndicator(workId);
  }

  private startTypingIndicator(workId: string): void {
    if (!this.userId) return;

    const cursor = this.cursors.get(workId)?.get(this.userId);
    if (cursor) {
      cursor.isTyping = true;
      cursor.lastUpdate = new Date().toISOString();
    }

    const session = this.sessions.get(workId);
    this.broadcastMessage({
      type: 'typing_start',
      payload: {},
      timestamp: new Date().toISOString(),
      senderId: this.userId,
      workId,
      sessionId: session?.id,
    });

    if (!this.typingTimeouts.has(workId)) {
      this.typingTimeouts.set(workId, new Map());
    }

    const existingTimeout = this.typingTimeouts.get(workId)!.get(this.userId);
    if (existingTimeout) {
      clearTimeout(existingTimeout);
    }

    const timeout = setTimeout(() => {
      this.stopTypingIndicator(workId);
    }, TYPING_TIMEOUT_MS);

    this.typingTimeouts.get(workId)!.set(this.userId, timeout);
  }

  private stopTypingIndicator(workId: string): void {
    if (!this.userId) return;

    const cursor = this.cursors.get(workId)?.get(this.userId);
    if (cursor) {
      cursor.isTyping = false;
      cursor.lastUpdate = new Date().toISOString();
    }

    const session = this.sessions.get(workId);
    this.broadcastMessage({
      type: 'typing_stop',
      payload: {},
      timestamp: new Date().toISOString(),
      senderId: this.userId,
      workId,
      sessionId: session?.id,
    });
  }

  async acquireLock(
    workId: string,
    resourceType: 'content' | 'metadata' | 'file' | 'section',
    resourceId?: string
  ): Promise<OperationLock | null> {
    if (!this.userId) return null;

    const lockKey = `${resourceType}-${resourceId || 'default'}`;

    if (!this.locks.has(workId)) {
      this.locks.set(workId, new Map());
    }

    const existingLock = this.locks.get(workId)!.get(lockKey);
    if (existingLock) {
      if (existingLock.userId === this.userId) {
        existingLock.expiresAt = new Date(Date.now() + LOCK_EXPIRY_MS).toISOString();
        return existingLock;
      }

      if (new Date(existingLock.expiresAt) > new Date()) {
        return null;
      }
    }

    const lock: OperationLock = {
      id: `lock-${Date.now()}`,
      workId,
      userId: this.userId,
      resourceType,
      resourceId,
      lockStatus: 'locked',
      lockedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + LOCK_EXPIRY_MS).toISOString(),
    };

    this.locks.get(workId)!.set(lockKey, lock);

    try {
      await supabase
        .from('collaboration_locks')
        .insert({
          id: lock.id,
          work_id: workId,
          user_id: this.userId,
          resource_type: resourceType,
          resource_id: resourceId,
          lock_status: 'locked',
          locked_at: lock.lockedAt,
          expires_at: lock.expiresAt,
        });
    } catch (error) {
      console.warn('Failed to save lock to database:', error);
    }

    const session = this.sessions.get(workId);
    this.broadcastMessage({
      type: 'lock_acquire',
      payload: { lock },
      timestamp: new Date().toISOString(),
      senderId: this.userId,
      workId,
      sessionId: session?.id,
    });

    this.emit('lock_acquired', { lock });

    return lock;
  }

  async releaseLock(workId: string, resourceType: string, resourceId?: string): Promise<void> {
    if (!this.userId) return;

    const lockKey = `${resourceType}-${resourceId || 'default'}`;

    const lock = this.locks.get(workId)?.get(lockKey);
    if (!lock || lock.userId !== this.userId) return;

    this.locks.get(workId)!.delete(lockKey);

    try {
      await supabase
        .from('collaboration_locks')
        .update({ lock_status: 'unlocked' })
        .eq('id', lock.id);
    } catch (error) {
      console.warn('Failed to update lock in database:', error);
    }

    const session = this.sessions.get(workId);
    this.broadcastMessage({
      type: 'lock_release',
      payload: { lockId: lock.id, resourceType, resourceId },
      timestamp: new Date().toISOString(),
      senderId: this.userId,
      workId,
      sessionId: session?.id,
    });

    this.emit('lock_released', { lock });
  }

  private releaseAllLocks(workId: string, userId: string): void {
    const workLocks = this.locks.get(workId);
    if (!workLocks) return;

    for (const [key, lock] of workLocks.entries()) {
      if (lock.userId === userId) {
        workLocks.delete(key);
      }
    }
  }

  private queueOperation(workId: string, operation: CollaborationOperation): void {
    if (!this.operationQueues.has(workId)) {
      this.operationQueues.set(workId, {
        workId,
        pendingOperations: [],
        processingOperation: null,
        lastProcessedVersion: 0,
      });
    }

    const queue = this.operationQueues.get(workId)!;

    queue.pendingOperations.push(operation);

    if (queue.pendingOperations.length > OPERATION_QUEUE_SIZE) {
      queue.pendingOperations = queue.pendingOperations.slice(-OPERATION_QUEUE_SIZE);
    }

    this.processOperationQueue(workId);
  }

  private async processOperationQueue(workId: string): Promise<void> {
    const queue = this.operationQueues.get(workId);
    if (!queue || queue.processingOperation || queue.pendingOperations.length === 0) return;

    queue.processingOperation = queue.pendingOperations.shift()!;

    try {
      const conflict = await this.detectConflict(workId, queue.processingOperation);

      if (conflict) {
        await this.resolveConflict(workId, conflict, queue.processingOperation);
      } else {
        queue.processingOperation.isApplied = true;
        const session = this.sessions.get(workId);
        if (session) {
          session.version = queue.processingOperation.version;
        }
        queue.lastProcessedVersion = queue.processingOperation.version;
      }
    } catch (error) {
      console.error('Error processing operation:', error);
    } finally {
      queue.processingOperation = null;
      this.processOperationQueue(workId);
    }
  }

  private async detectConflict(workId: string, operation: CollaborationOperation): Promise<CollaborationConflict | null> {
    const queue = this.operationQueues.get(workId);
    if (!queue) return null;

    for (const pendingOp of queue.pendingOperations) {
      if (pendingOp.userId !== operation.userId) {
        if (this.operationsOverlap(operation, pendingOp)) {
          return {
            id: `conflict-${Date.now()}`,
            workId,
            sessionId: operation.sessionId,
            operationIds: [operation.id, pendingOp.id],
            conflictType: 'concurrent_edit',
            detectedAt: new Date().toISOString(),
            resolutionStrategy: 'last_write_wins',
            status: 'pending',
          };
        }
      }
    }

    return null;
  }

  private operationsOverlap(op1: CollaborationOperation, op2: CollaborationOperation): boolean {
    const op1Start = op1.position;
    const op1End = op1.position + (op1.length || (op1.content?.length || 0));
    const op2Start = op2.position;
    const op2End = op2.position + (op2.length || (op2.content?.length || 0));

    return !(op1End < op2Start || op2End < op1Start);
  }

  private async resolveConflict(workId: string, conflict: CollaborationConflict, operation: CollaborationOperation): Promise<void> {
    switch (conflict.resolutionStrategy) {
      case 'last_write_wins':
        operation.isApplied = true;
        operation.conflictDetected = true;
        operation.conflictResolved = true;
        operation.resolutionStrategy = 'last_write_wins';
        break;

      case 'operational_transform':
        console.log('Operational transform not yet implemented, using last_write_wins');
        operation.isApplied = true;
        operation.conflictDetected = true;
        operation.conflictResolved = true;
        operation.resolutionStrategy = 'last_write_wins';
        break;

      case 'manual':
        this.emit('conflict_detected', { conflict, operation });
        break;
    }

    conflict.resolvedAt = new Date().toISOString();
    conflict.status = conflict.resolutionStrategy === 'manual' ? 'manual_required' : 'resolved';

    this.emit('conflict_resolved', { conflict, operation });
  }

  private handleCollaborationMessage(message: WebSocketCollaborationMessage): void {
    if (message.senderId === this.userId) return;

    switch (message.type) {
      case 'join_session':
        this.handleRemoteJoin(message);
        break;
      case 'leave_session':
        this.handleRemoteLeave(message);
        break;
      case 'cursor_move':
        this.handleRemoteCursorMove(message);
        break;
      case 'selection_change':
        this.handleRemoteSelectionChange(message);
        break;
      case 'text_edit':
        this.handleRemoteTextEdit(message);
        break;
      case 'typing_start':
        this.handleRemoteTypingStart(message);
        break;
      case 'typing_stop':
        this.handleRemoteTypingStop(message);
        break;
      case 'lock_acquire':
        this.handleRemoteLockAcquire(message);
        break;
      case 'lock_release':
        this.handleRemoteLockRelease(message);
        break;
    }
  }

  private handleRemoteJoin(message: WebSocketCollaborationMessage): void {
    const { workId, payload } = message;
    const participant = payload.participant as CollaborationParticipant;

    if (!this.participants.has(workId)) {
      this.participants.set(workId, new Map());
    }
    this.participants.get(workId)!.set(participant.userId, participant);

    if (!this.cursors.has(workId)) {
      this.cursors.set(workId, new Map());
    }
    this.cursors.get(workId)!.set(participant.userId, {
      userId: participant.userId,
      username: participant.username,
      color: participant.color,
      position: participant.cursorPosition || 0,
      isTyping: false,
      lastUpdate: new Date().toISOString(),
    });

    this.emit('user_joined', { workId, participant });
  }

  private handleRemoteLeave(message: WebSocketCollaborationMessage): void {
    const { workId, payload } = message;
    const userId = payload.userId;

    this.participants.get(workId)?.delete(userId);
    this.cursors.get(workId)?.delete(userId);

    this.emit('user_left', { workId, userId });
  }

  private handleRemoteCursorMove(message: WebSocketCollaborationMessage): void {
    const { workId, senderId, payload } = message;
    const cursor = this.cursors.get(workId)?.get(senderId);

    if (cursor) {
      cursor.position = payload.position;
      cursor.lastUpdate = new Date().toISOString();
      this.emit('cursor_updated', { workId, cursor });
    }
  }

  private handleRemoteSelectionChange(message: WebSocketCollaborationMessage): void {
    const { workId, senderId, payload } = message;
    const cursor = this.cursors.get(workId)?.get(senderId);

    if (cursor) {
      cursor.selectionStart = payload.start;
      cursor.selectionEnd = payload.end;
      cursor.lastUpdate = new Date().toISOString();
      this.emit('selection_updated', { workId, cursor });
    }
  }

  private handleRemoteTextEdit(message: WebSocketCollaborationMessage): void {
    const { workId, payload } = message;
    const operation = payload.operation as CollaborationOperation;

    this.emit('text_edit', { workId, operation });
  }

  private handleRemoteTypingStart(message: WebSocketCollaborationMessage): void {
    const { workId, senderId } = message;
    const cursor = this.cursors.get(workId)?.get(senderId);

    if (cursor) {
      cursor.isTyping = true;
      cursor.lastUpdate = new Date().toISOString();
      this.emit('typing_updated', { workId, userId: senderId, isTyping: true });
    }
  }

  private handleRemoteTypingStop(message: WebSocketCollaborationMessage): void {
    const { workId, senderId } = message;
    const cursor = this.cursors.get(workId)?.get(senderId);

    if (cursor) {
      cursor.isTyping = false;
      cursor.lastUpdate = new Date().toISOString();
      this.emit('typing_updated', { workId, userId: senderId, isTyping: false });
    }
  }

  private handleRemoteLockAcquire(message: WebSocketCollaborationMessage): void {
    const { workId, payload } = message;
    const lock = payload.lock as OperationLock;

    if (!this.locks.has(workId)) {
      this.locks.set(workId, new Map());
    }

    const lockKey = `${lock.resourceType}-${lock.resourceId || 'default'}`;
    this.locks.get(workId)!.set(lockKey, lock);

    this.emit('lock_acquired', { lock });
  }

  private handleRemoteLockRelease(message: WebSocketCollaborationMessage): void {
    const { workId, payload } = message;
    const lockKey = `${payload.resourceType}-${payload.resourceId || 'default'}`;

    this.locks.get(workId)?.delete(lockKey);

    this.emit('lock_released', { workId, lockId: payload.lockId });
  }

  private broadcastMessage(message: WebSocketCollaborationMessage): void {
    websocketService.send('collaboration_message', message);
  }

  getParticipants(workId: string): CollaborationParticipant[] {
    return Array.from(this.participants.get(workId)?.values() || []);
  }

  getCursors(workId: string): CollaboratorCursor[] {
    return Array.from(this.cursors.get(workId)?.values() || []);
  }

  getLocks(workId: string): OperationLock[] {
    return Array.from(this.locks.get(workId)?.values() || []);
  }

  getSession(workId: string): CollaborationSession | undefined {
    return this.sessions.get(workId);
  }

  isLocked(workId: string, resourceType: string, resourceId?: string): boolean {
    const lockKey = `${resourceType}-${resourceId || 'default'}`;
    const lock = this.locks.get(workId)?.get(lockKey);

    if (!lock) return false;
    if (new Date(lock.expiresAt) < new Date()) {
      this.locks.get(workId)!.delete(lockKey);
      return false;
    }

    return lock.lockStatus === 'locked';
  }

  getLockOwner(workId: string, resourceType: string, resourceId?: string): string | null {
    const lockKey = `${resourceType}-${resourceId || 'default'}`;
    const lock = this.locks.get(workId)?.get(lockKey);

    if (!lock || new Date(lock.expiresAt) < new Date()) return null;
    return lock.userId;
  }

  on(event: string, callback: (data: any) => void): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  private emit(event: string, data: any): void {
    const callbacks = this.listeners.get(event);
    if (callbacks) {
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error(`Error in listener for event ${event}:`, error);
        }
      });
    }
  }

  cleanup(): void {
    this.sessions.clear();
    this.participants.clear();
    this.operationQueues.clear();
    this.locks.clear();
    this.cursors.clear();
    this.presence.clear();
    this.typingTimeouts.forEach(map => map.forEach(timeout => clearTimeout(timeout)));
    this.typingTimeouts.clear();
    this.cursorThrottle.forEach(timeout => clearTimeout(timeout));
    this.cursorThrottle.clear();
    this.listeners.clear();
  }
}

export const realtimeCollaborationService = new RealtimeCollaborationService();
export default realtimeCollaborationService;
