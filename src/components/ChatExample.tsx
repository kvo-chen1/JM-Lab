// 实时聊天功能示例组件
import React, { useState, useEffect, useRef } from 'react';
import { chatService, ChatMessage, ChatUser } from '@/services/chatService';

interface ChatExampleProps {
  friendId: string;
  friendName: string;
}

export const ChatExample: React.FC<ChatExampleProps> = ({ friendId, friendName }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [currentUser, setCurrentUser] = useState<ChatUser | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 连接聊天服务器
    chatService.connect();

    // 监听连接状态
    const checkConnection = setInterval(() => {
      setIsConnected(chatService.isConnected());
      setIsAuthenticated(chatService.isAuth());
      setCurrentUser(chatService.getCurrentUser());
    }, 1000);

    // 监听新消息
    const unsubscribeMessage = chatService.onMessage((message) => {
      setMessages((prev) => [...prev, message]);
      // 滚动到底部
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    });

    // 监听消息发送确认
    const unsubscribeSent = chatService.onSentConfirm((data) => {
      console.log('消息已发送:', data);
    });

    // 监听正在输入状态
    const unsubscribeTyping = chatService.onTyping((data) => {
      if (data.userId === friendId) {
        setIsTyping(data.isTyping);
      }
    });

    // 监听已读回执
    const unsubscribeRead = chatService.onReadReceipt((data) => {
      console.log('消息已读:', data);
    });

    // 监听历史消息
    const unsubscribeHistory = chatService.onHistory((data) => {
      setMessages(data.messages);
    });

    // 获取历史消息
    if (friendId) {
      chatService.getHistory(friendId, 50);
    }

    return () => {
      clearInterval(checkConnection);
      unsubscribeMessage();
      unsubscribeSent();
      unsubscribeTyping();
      unsubscribeRead();
      unsubscribeHistory();
    };
  }, [friendId]);

  // 发送消息
  const handleSendMessage = () => {
    if (!inputMessage.trim() || !friendId) return;

    const tempId = chatService.sendMessage(friendId, inputMessage.trim());
    if (tempId) {
      // 乐观更新：立即显示在界面上
      const optimisticMessage: ChatMessage = {
        tempId,
        senderId: currentUser?.userId || '',
        senderName: currentUser?.username || '',
        receiverId: friendId,
        content: inputMessage.trim(),
        createdAt: new Date().toISOString(),
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, optimisticMessage]);
      setInputMessage('');
    }
  };

  // 处理输入变化（发送正在输入状态）
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInputMessage(e.target.value);
    
    // 发送正在输入状态
    chatService.sendTypingStatus(friendId, true);
    
    // 3秒后停止显示正在输入
    setTimeout(() => {
      chatService.sendTypingStatus(friendId, false);
    }, 3000);
  };

  // 标记消息已读
  const handleMarkAsRead = () => {
    chatService.sendReadReceipt(friendId);
  };

  return (
    <div className="flex flex-col h-[500px] border rounded-lg bg-white">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b bg-gray-50">
        <div className="flex items-center gap-2">
          <h3 className="font-semibold">{friendName}</h3>
          {isTyping && (
            <span className="text-sm text-gray-500">正在输入...</span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm">
          <span
            className={`w-2 h-2 rounded-full ${
              isConnected ? 'bg-green-500' : 'bg-red-500'
            }`}
          />
          <span className="text-gray-500">
            {isConnected ? (isAuthenticated ? '已连接' : '连接中...') : '未连接'}
          </span>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.map((msg, index) => (
          <div
            key={msg.id || msg.tempId || index}
            className={`flex ${
              msg.senderId === currentUser?.userId
                ? 'justify-end'
                : 'justify-start'
            }`}
          >
            <div
              className={`max-w-[70%] px-4 py-2 rounded-lg ${
                msg.senderId === currentUser?.userId
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 text-gray-800'
              } ${msg.tempId ? 'opacity-70' : ''}`}
            >
              <div className="text-xs opacity-70 mb-1">
                {msg.senderName || (msg.senderId === currentUser?.userId ? '我' : friendName)}
              </div>
              <div>{msg.content}</div>
              <div className="text-xs opacity-50 mt-1">
                {msg.createdAt
                  ? new Date(msg.createdAt).toLocaleTimeString()
                  : '发送中...'}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* 输入框 */}
      <div className="p-4 border-t">
        <div className="flex gap-2">
          <input
            type="text"
            value={inputMessage}
            onChange={handleInputChange}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="输入消息..."
            className="flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={!isAuthenticated}
          />
          <button
            onClick={handleSendMessage}
            disabled={!isAuthenticated || !inputMessage.trim()}
            className="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            发送
          </button>
          <button
            onClick={handleMarkAsRead}
            disabled={!isAuthenticated}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 disabled:bg-gray-100 disabled:cursor-not-allowed"
          >
            已读
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatExample;
