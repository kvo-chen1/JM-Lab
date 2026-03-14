// 聊天服务 - 基于 WebSocket 的实时聊天
import { websocketService } from './websocketService';
import type { MessageWithSender } from '../lib/supabase';
import { RealtimeChannel } from '@supabase/supabase-js';

export interface ChatMessage {
  id?: string;
  tempId?: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  receiverId: string;
  content: string;
  messageType?: 'text' | 'image' | 'file';
  isRead?: boolean;
  createdAt?: string;
  timestamp?: number;
}

export interface ChatUser {
  userId: string;
  username: string;
  avatarUrl?: string;
  isOnline?: boolean;
}

export interface MessageOptions {
  channelId?: string;
  type?: 'text' | 'image' | 'file';
  metadata?: Record<string, any>;
}

class ChatService {
  private isAuthenticated = false;
  private currentUser: ChatUser | null = null;
  private messageListeners: ((message: ChatMessage) => void)[] = [];
  private typingListeners: ((data: { userId: string; username: string; isTyping: boolean }) => void)[] = [];
  private readReceiptListeners: ((data: { readerId: string; readerName: string }) => void)[] = [];
  private userJoinListeners: ((user: ChatUser) => void)[] = [];
  private userLeaveListeners: ((user: ChatUser) => void)[] = [];
  private errorListeners: ((error: string) => void)[] = [];
  private sentConfirmListeners: ((data: { messageId: string; tempId?: string }) => void)[] = [];
  private historyListeners: ((data: { messages: ChatMessage[]; friendId: string; hasMore: boolean }) => void)[] = [];

  constructor() {
    this.setupEventListeners();
  }

  // 设置事件监听
  private setupEventListeners() {
    // 监听连接成功
    websocketService.onOpen(() => {
      console.log('[ChatService] WebSocket 连接成功');
      // 自动认证（如果有 token）
      this.authenticate();
    });

    // 监听消息
    websocketService.on('chat:message', (payload: ChatMessage) => {
      console.log('[ChatService] 收到消息:', payload);
      this.messageListeners.forEach(listener => listener(payload));
    });

    // 监听消息发送确认
    websocketService.on('chat:sent', (payload: { messageId: string; tempId?: string }) => {
      console.log('[ChatService] 消息发送成功:', payload);
      this.sentConfirmListeners.forEach(listener => listener(payload));
    });

    // 监听正在输入状态
    websocketService.on('chat:typing', (payload: { userId: string; username: string; isTyping: boolean }) => {
      this.typingListeners.forEach(listener => listener(payload));
    });

    // 监听已读回执
    websocketService.on('chat:read', (payload: { readerId: string; readerName: string }) => {
      this.readReceiptListeners.forEach(listener => listener(payload));
    });

    // 监听用户上线
    websocketService.on('user:joined', (payload: ChatUser) => {
      console.log('[ChatService] 用户上线:', payload);
      this.userJoinListeners.forEach(listener => listener(payload));
    });

    // 监听用户离线
    websocketService.on('user:left', (payload: ChatUser) => {
      console.log('[ChatService] 用户离线:', payload);
      this.userLeaveListeners.forEach(listener => listener(payload));
    });

    // 监听历史消息
    websocketService.on('chat:history', (payload: { messages: ChatMessage[]; friendId: string; hasMore: boolean }) => {
      console.log('[ChatService] 收到历史消息:', payload.messages.length, '条');
      this.historyListeners.forEach(listener => listener(payload));
    });

    // 监听错误
    websocketService.on('chat:error', (payload: { message: string }) => {
      console.error('[ChatService] 错误:', payload.message);
      this.errorListeners.forEach(listener => listener(payload.message));
    });

    // 监听认证成功
    websocketService.on('auth:success', (payload: ChatUser) => {
      console.log('[ChatService] 认证成功:', payload);
      this.isAuthenticated = true;
      this.currentUser = payload;
    });

    // 监听认证失败
    websocketService.on('auth:error', (payload: { message: string }) => {
      console.error('[ChatService] 认证失败:', payload.message);
      this.isAuthenticated = false;
      this.errorListeners.forEach(listener => listener(payload.message));
    });
  }

  // 连接到聊天服务器
  connect(): void {
    websocketService.connect();
  }

  // 断开连接
  disconnect(): void {
    websocketService.disconnect();
    this.isAuthenticated = false;
    this.currentUser = null;
  }

  // 认证
  authenticate(token?: string): void {
    const authToken = token || localStorage.getItem('token');
    if (!authToken) {
      console.warn('[ChatService] 没有可用的 token');
      return;
    }

    websocketService.send('auth', { token: authToken });
  }

  // 发送消息（WebSocket 底层方法）
  sendMessageWs(receiverId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): string {
    if (!this.isAuthenticated) {
      console.error('[ChatService] 未认证，无法发送消息');
      return '';
    }

    const tempId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    websocketService.send('chat:message', {
      receiverId,
      content,
      messageType,
      tempId
    });

    return tempId;
  }

  // 发送正在输入状态
  sendTypingStatus(receiverId: string, isTyping: boolean): void {
    if (!this.isAuthenticated) return;

    websocketService.send('chat:typing', {
      receiverId,
      isTyping
    });
  }

  // 发送已读回执
  sendReadReceipt(senderId: string): void {
    if (!this.isAuthenticated) return;

    websocketService.send('chat:read', {
      senderId
    });
  }

  // 获取历史消息
  getHistory(friendId: string, limit: number = 50, offset: number = 0): void {
    if (!this.isAuthenticated) {
      console.error('[ChatService] 未认证，无法获取历史消息');
      return;
    }

    websocketService.send('chat:history', {
      friendId,
      limit,
      offset
    });
  }

  // 监听新消息
  onMessage(callback: (message: ChatMessage) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      this.messageListeners = this.messageListeners.filter(l => l !== callback);
    };
  }

  // 监听消息发送确认
  onSentConfirm(callback: (data: { messageId: string; tempId?: string }) => void): () => void {
    this.sentConfirmListeners.push(callback);
    return () => {
      this.sentConfirmListeners = this.sentConfirmListeners.filter(l => l !== callback);
    };
  }

  // 监听正在输入状态
  onTyping(callback: (data: { userId: string; username: string; isTyping: boolean }) => void): () => void {
    this.typingListeners.push(callback);
    return () => {
      this.typingListeners = this.typingListeners.filter(l => l !== callback);
    };
  }

  // 监听已读回执
  onReadReceipt(callback: (data: { readerId: string; readerName: string }) => void): () => void {
    this.readReceiptListeners.push(callback);
    return () => {
      this.readReceiptListeners = this.readReceiptListeners.filter(l => l !== callback);
    };
  }

  // 监听用户上线
  onUserJoin(callback: (user: ChatUser) => void): () => void {
    this.userJoinListeners.push(callback);
    return () => {
      this.userJoinListeners = this.userJoinListeners.filter(l => l !== callback);
    };
  }

  // 监听用户离线
  onUserLeave(callback: (user: ChatUser) => void): () => void {
    this.userLeaveListeners.push(callback);
    return () => {
      this.userLeaveListeners = this.userLeaveListeners.filter(l => l !== callback);
    };
  }

  // 监听历史消息
  onHistory(callback: (data: { messages: ChatMessage[]; friendId: string; hasMore: boolean }) => void): () => void {
    this.historyListeners.push(callback);
    return () => {
      this.historyListeners = this.historyListeners.filter(l => l !== callback);
    };
  }

  // 监听错误
  onError(callback: (error: string) => void): () => void {
    this.errorListeners.push(callback);
    return () => {
      this.errorListeners = this.errorListeners.filter(l => l !== callback);
    };
  }

  // 获取当前用户
  getCurrentUser(): ChatUser | null {
    return this.currentUser;
  }

  // 检查是否已认证
  isAuth(): boolean {
    return this.isAuthenticated;
  }

  // 检查连接状态
  isConnected(): boolean {
    return websocketService.getConnectionStatus();
  }

  // 获取消息列表（适配 chatStore 的 API）
  async getMessages(channelId: string): Promise<MessageWithSender[]> {
    // 通过 WebSocket 请求历史消息
    return new Promise((resolve) => {
      const messages: MessageWithSender[] = [];
      
      // 设置一次性监听器来接收历史消息
      const unsubscribe = this.onHistory((data) => {
        if (data.friendId === channelId) {
          unsubscribe();
          const mappedMessages = data.messages.map(msg => this.mapChatMessageToMessageWithSender(msg, channelId));
          resolve(mappedMessages);
        }
      });

      // 请求历史消息
      this.getHistory(channelId);

      // 超时处理
      setTimeout(() => {
        unsubscribe();
        resolve(messages);
      }, 5000);
    });
  }

  // 发送消息（适配 chatStore 的 API）
  async sendMessage(
    senderId: string, 
    content: string, 
    options?: MessageOptions
  ): Promise<MessageWithSender> {
    const channelId = options?.channelId || 'global';
    const tempId = this.sendMessageToReceiver(senderId, content, options?.type || 'text');
    
    return {
      id: tempId || `msg-${Date.now()}`,
      sender_id: senderId,
      channel_id: channelId,
      community_id: null,
      receiver_id: null,
      content: content,
      status: 'sent',
      type: options?.type || 'text',
      metadata: options?.metadata || {},
      retry_count: 0,
      is_read: false,
      delivered_at: null,
      read_at: null,
      created_at: new Date().toISOString(),
      sender: {
        id: senderId,
        username: 'You',
        email: '',
        avatar_url: undefined,
        bio: undefined,
        is_verified: false,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  }

  // 内部方法：发送消息到接收者
  private sendMessageToReceiver(receiverId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): string {
    return this.sendMessageWs(receiverId, content, messageType);
  }

  // 发送跨页面消息
  async sendCrossPageMessage(
    senderId: string,
    content: string,
    targetPage: 'square' | 'community',
    options?: MessageOptions
  ): Promise<MessageWithSender> {
    const tempId = `cross-${Date.now()}`;
    
    // 广播跨页面消息事件
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('cross-page-message', {
        detail: {
          senderId,
          content,
          targetPage,
          timestamp: Date.now(),
          ...options
        }
      }));
    }

    return {
      id: tempId,
      sender_id: senderId,
      channel_id: `cross:${targetPage}`,
      community_id: null,
      receiver_id: null,
      content: content,
      status: 'sent',
      type: options?.type || 'text',
      metadata: {
        ...options?.metadata,
        targetPage,
        crossPage: true
      },
      retry_count: 0,
      is_read: false,
      delivered_at: null,
      read_at: null,
      created_at: new Date().toISOString(),
      sender: {
        id: senderId,
        username: 'You',
        email: '',
        avatar_url: undefined,
        bio: undefined,
        is_verified: false,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  }

  // 订阅消息（适配 chatStore 的 API）
  subscribeToMessages(
    channelId: string,
    callback: (message: MessageWithSender) => void
  ): RealtimeChannel {
    // 使用 WebSocket 的消息监听
    const unsubscribe = this.onMessage((chatMsg) => {
      const message = this.mapChatMessageToMessageWithSender(chatMsg, channelId);
      callback(message);
    });

    // 返回一个模拟的 RealtimeChannel 对象
    return {
      unsubscribe: () => {
        unsubscribe();
      }
    } as RealtimeChannel;
  }

  // 订阅跨页面消息
  subscribeToCrossPageMessages(
    callback: (message: MessageWithSender) => void
  ): RealtimeChannel {
    const handleCrossPageMessage = (event: CustomEvent) => {
      const detail = event.detail;
      const message: MessageWithSender = {
        id: `cross-${Date.now()}`,
        sender_id: detail.senderId,
        channel_id: `cross:${detail.targetPage}`,
        community_id: null,
        receiver_id: null,
        content: detail.content,
        status: 'delivered',
        type: detail.type || 'text',
        metadata: detail.metadata || {},
        retry_count: 0,
        is_read: false,
        delivered_at: new Date().toISOString(),
        read_at: null,
        created_at: new Date().toISOString(),
        sender: {
          id: detail.senderId,
          username: 'Unknown',
          email: '',
          avatar_url: undefined,
          bio: undefined,
          is_verified: false,
          metadata: {},
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      };
      callback(message);
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('cross-page-message', handleCrossPageMessage as EventListener);
    }

    return {
      unsubscribe: () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('cross-page-message', handleCrossPageMessage as EventListener);
        }
      }
    } as RealtimeChannel;
  }

  // 缓存消息（用于重发失败的消息）
  private failedMessagesCache: MessageWithSender[] = [];

  cacheMessage(message: MessageWithSender): void {
    this.failedMessagesCache.push(message);
    // 持久化到 localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('failed_messages', JSON.stringify(this.failedMessagesCache));
    }
  }

  // 重发失败的消息
  async resendFailedMessages(): Promise<void> {
    if (typeof window !== 'undefined') {
      const cached = localStorage.getItem('failed_messages');
      if (cached) {
        this.failedMessagesCache = JSON.parse(cached);
      }
    }

    const failedMessages = [...this.failedMessagesCache];
    this.failedMessagesCache = [];
    
    if (typeof window !== 'undefined') {
      localStorage.setItem('failed_messages', '[]');
    }

    for (const message of failedMessages) {
      try {
        await this.sendMessage(message.sender_id, message.content, {
          channelId: message.channel_id,
          type: message.type,
          metadata: message.metadata
        });
      } catch (error) {
        console.error('Failed to resend message:', error);
        this.cacheMessage(message);
      }
    }
  }

  // 辅助方法：将 ChatMessage 映射为 MessageWithSender
  private mapChatMessageToMessageWithSender(chatMsg: ChatMessage, channelId: string): MessageWithSender {
    return {
      id: chatMsg.id || `msg-${Date.now()}`,
      sender_id: chatMsg.senderId,
      channel_id: channelId,
      community_id: null,
      receiver_id: chatMsg.receiverId,
      content: chatMsg.content,
      status: 'delivered',
      type: chatMsg.messageType || 'text',
      metadata: {
        tempId: chatMsg.tempId,
        timestamp: chatMsg.timestamp
      },
      retry_count: 0,
      is_read: chatMsg.isRead || false,
      delivered_at: null,
      read_at: null,
      created_at: chatMsg.createdAt || new Date().toISOString(),
      sender: {
        id: chatMsg.senderId,
        username: chatMsg.senderName || 'Unknown',
        email: '',
        avatar_url: chatMsg.senderAvatar,
        bio: undefined,
        is_verified: false,
        metadata: {},
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    };
  }
}

// 导出单例
export const chatService = new ChatService();

// 导出类供需要自定义实例的场景使用
export default ChatService;
