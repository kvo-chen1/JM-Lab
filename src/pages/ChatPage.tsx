import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, LoadingSpinner } from '@/components/ui';
import { ArrowLeft, Send, MoreVertical, Phone, Video } from 'lucide-react';
import { getDirectMessages, sendDirectMessage, markMessagesAsRead } from '@/services/messageService';
import { AuthContext } from '@/contexts/authContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  is_read: boolean;
  type: 'text' | 'image';
}

interface UserInfo {
  id: string;
  username: string;
  avatar_url: string;
  status?: 'online' | 'offline';
}

const ChatPage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useContext(AuthContext);
  
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [otherUser, setOtherUser] = useState<UserInfo | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  // 加载消息和对方信息
  useEffect(() => {
    if (userId && currentUser) {
      loadMessages();
      loadOtherUserInfo();
      markAsRead();
      subscribeToMessages();
    }
    
    return () => {
      // 清理订阅
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [userId, currentUser]);

  // 滚动到底部
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // 加载消息
  const loadMessages = async () => {
    if (!userId || !currentUser) return;
    
    setLoading(true);
    try {
      const msgs = await getDirectMessages(currentUser.id, userId, 50);
      setMessages(msgs);
    } catch (error: any) {
      console.error('加载消息失败:', error);
      toast.error('加载消息失败');
    } finally {
      setLoading(false);
    }
  };

  // 加载对方用户信息
  const loadOtherUserInfo = async () => {
    if (!userId) return;
    
    try {
      // 使用后端 API 获取用户信息，绕过 RLS
      const token = localStorage.getItem('token');
      const response = await fetch(`/api/users/${userId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        console.warn('从 API 获取用户失败，使用默认信息');
        setOtherUser({
          id: userId,
          username: '用户 ' + userId.substring(0, 8),
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
        });
        return;
      }
      
      const result = await response.json();
      
      if (result.code !== 0 || !result.data) {
        console.warn('用户不存在:', userId);
        setOtherUser({
          id: userId,
          username: '用户 ' + userId.substring(0, 8),
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
        });
        return;
      }
      
      // 转换字段名以匹配组件期望的格式
      const userData = result.data;
      setOtherUser({
        id: userData.id,
        username: userData.username || userData.name || '用户 ' + userId.substring(0, 8),
        avatar_url: userData.avatar || userData.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
      });
    } catch (error: any) {
      console.error('加载用户信息失败:', error);
      // 设置默认用户信息
      setOtherUser({
        id: userId,
        username: '用户 ' + userId.substring(0, 8),
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`
      });
    }
  };

  // 标记消息已读
  const markAsRead = async () => {
    if (!userId || !currentUser) return;
    
    try {
      await markMessagesAsRead(currentUser.id, userId);
    } catch (error) {
      console.error('标记已读失败:', error);
    }
  };

  // 订阅新消息
  const subscribeToMessages = () => {
    if (!userId || !currentUser) return;
    
    subscriptionRef.current = supabase
      .channel(`chat:${currentUser.id}:${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `or(and(sender_id.eq.${userId},receiver_id.eq.${currentUser.id}),and(sender_id.eq.${currentUser.id},receiver_id.eq.${userId}))`,
        },
        (payload) => {
          const newMessage = payload.new as Message;
          setMessages((prev) => {
            // 避免重复添加
            if (prev.find((m) => m.id === newMessage.id)) return prev;
            return [...prev, newMessage];
          });
          
          // 如果是对方发来的消息，标记已读
          if (newMessage.sender_id === userId) {
            markAsRead();
          }
        }
      )
      .subscribe();
  };

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !userId || !currentUser || sending) return;

    setSending(true);
    const content = inputMessage.trim();
    setInputMessage('');

    try {
      const result = await sendDirectMessage(currentUser.id, userId, content);
      if (result.success && result.data) {
        setMessages((prev) => [...prev, result.data!]);
        toast.success('发送成功');
      } else {
        // 权限检查失败
        toast.error(result.message || '发送失败');
        setInputMessage(content); // 恢复输入内容
      }
    } catch (error: any) {
      console.error('发送消息失败:', error);
      toast.error(error.message || '发送消息失败');
      setInputMessage(content); // 恢复输入内容
    } finally {
      setSending(false);
    }
  };

  // 滚动到底部
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // 格式化时间
  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' });
  };

  // 返回
  const handleBack = () => {
    navigate(-1);
  };

  // 跳转到用户主页
  const goToProfile = () => {
    if (userId) {
      navigate(`/author/${userId}`);
    }
  };

  if (!currentUser) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-gray-500">请先登录</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部导航 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="flex items-center justify-between max-w-4xl mx-auto">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            
            <div 
              className="flex items-center gap-3 cursor-pointer"
              onClick={goToProfile}
            >
              <div className="relative">
                <img
                  src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
                  alt={otherUser?.username}
                  className="w-10 h-10 rounded-full object-cover bg-gray-100"
                />
                <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
              </div>
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white">
                  {otherUser?.username || otherUser?.name || '未知用户'}
                </h2>
                <p className="text-xs text-gray-500">在线</p>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <Phone className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <Video className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <button className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
              <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>
        </div>
      </div>

      {/* 消息列表 */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-4xl mx-auto space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <LoadingSpinner className="w-8 h-8" />
            </div>
          ) : messages.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 dark:text-gray-400">还没有消息，开始聊天吧！</p>
            </div>
          ) : (
            messages.map((message, index) => {
              const isMe = message.sender_id === currentUser.id;
              const showTime = index === 0 || 
                new Date(message.created_at).getTime() - new Date(messages[index - 1].created_at).getTime() > 5 * 60 * 1000;
              
              return (
                <div key={message.id}>
                  {showTime && (
                    <div className="text-center my-4">
                      <span className="text-xs text-gray-400 bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">
                        {formatTime(message.created_at)}
                      </span>
                    </div>
                  )}
                  <div className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                    <div className={`flex items-end gap-2 max-w-[70%] ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && (
                        <img
                          src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
                          alt={otherUser?.username}
                          className="w-8 h-8 rounded-full object-cover bg-gray-100 flex-shrink-0"
                        />
                      )}
                      <div
                        className={`px-4 py-2 rounded-2xl ${
                          isMe
                            ? 'bg-blue-500 text-white rounded-br-none'
                            : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none shadow-sm'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 输入框 */}
      <div className="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="输入消息..."
              className="w-full px-4 py-3 bg-gray-100 dark:bg-gray-700 rounded-full text-gray-800 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || sending}
            className={`p-3 rounded-full transition-colors ${
              inputMessage.trim() && !sending
                ? 'bg-blue-500 text-white hover:bg-blue-600'
                : 'bg-gray-200 text-gray-400 cursor-not-allowed'
            }`}
          >
            {sending ? (
              <LoadingSpinner className="w-5 h-5" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
