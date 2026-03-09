// 聊天服务 - 基于 WebSocket 的实时聊天
import { websocketService } from './websocketService';

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

  // 发送消息
  sendMessage(receiverId: string, content: string, messageType: 'text' | 'image' | 'file' = 'text'): string {
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
}

// 导出单例
export const chatService = new ChatService();

// 导出类供需要自定义实例的场景使用
export default ChatService;
