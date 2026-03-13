import React, { useState, useEffect, useRef, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, Button, HamsterWheelLoader } from '@/components/ui';
import { ArrowLeft, Send, MoreVertical, Phone, Video } from 'lucide-react';
import { getDirectMessages, sendDirectMessage, markMessagesAsRead } from '@/services/messageService';
import { parseWorkShareMessage } from '@/services/workShareService';
import { SharedWorkMessage } from '@/components/share';
import { CommunityInviteMessage } from '@/components/CommunityInviteMessage';
import { AuthContext } from '@/contexts/authContext';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { presenceService } from '@/services/presenceService';

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
  const [isOnline, setIsOnline] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const subscriptionRef = useRef<any>(null);

  // 加载消息和对方信息
  useEffect(() => {
    if (userId && currentUser) {
      loadMessages();
      loadOtherUserInfo();
      markAsRead();
      subscribeToMessages();
      subscribeToPresence();
    }
    
    return () => {
      // 清理订阅
      if (subscriptionRef.current && typeof subscriptionRef.current.unsubscribe === 'function') {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [userId, currentUser]);

  // 订阅在线状态
  const subscribeToPresence = () => {
    if (!userId) return;
    
    // 检查用户是否在线
    setIsOnline(presenceService.isUserOnline(userId));
    
    // 订阅在线用户列表变化
    const unsubscribe = presenceService.subscribe((users) => {
      const online = users.some(u => u.user_id === userId);
      setIsOnline(online);
    });
    
    return unsubscribe;
  };

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
    <div className="flex flex-col h-[calc(100vh-80px)] bg-gray-50 dark:bg-gray-900">
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
                {isOnline && (
                  <span className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white dark:border-gray-800 rounded-full"></span>
                )}
              </div>
              <div>
                <h2 className="font-semibold text-gray-800 dark:text-white">
                  {otherUser?.username || otherUser?.name || '未知用户'}
                </h2>
                <p className="text-xs text-gray-500">{isOnline ? '在线' : '不在线'}</p>
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
        <div className="w-full max-w-4xl mx-auto space-y-4">
          {loading ? (
            <div className="flex justify-center py-12">
              <HamsterWheelLoader size="medium" text="加载消息中..." />
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

              // 检查是否是作品分享消息
              const workShare = parseWorkShareMessage(message.content);

              // 检查是否是社群邀请消息
              const communityInvite = parseCommunityInviteMessage(message.content);

              // 检查是否是 AI 分享消息
              const aiShare = parseAIShareMessage(message.content);

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
                    <div className={`flex items-end gap-2 max-w-[80%] ${isMe ? 'flex-row-reverse' : ''}`}>
                      {!isMe && (
                        <img
                          src={otherUser?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${userId}`}
                          alt={otherUser?.username}
                          className="w-8 h-8 rounded-full object-cover bg-gray-100 flex-shrink-0"
                        />
                      )}

                      {workShare.isWorkShare ? (
                        // 渲染作品分享卡片
                        <div className={`${isMe ? 'mr-2' : 'ml-2'}`}>
                          <SharedWorkMessage
                            workId={workShare.data.workId}
                            workTitle={workShare.data.workTitle}
                            workThumbnail={workShare.data.workThumbnail}
                            workUrl={workShare.data.workUrl}
                            workType={workShare.data.workType}
                            message={workShare.data.message}
                            senderName={isMe ? '我' : otherUser?.username}
                          />
                        </div>
                      ) : communityInvite.isCommunityInvite ? (
                        // 渲染社群邀请卡片
                        <div className={`${isMe ? 'mr-2' : 'ml-2'}`}>
                          <CommunityInviteMessage
                            communityId={communityInvite.data.communityId}
                            communityName={communityInvite.data.communityName}
                            communityDescription={communityInvite.data.communityDescription}
                            communityAvatar={communityInvite.data.communityAvatar}
                            inviterName={isMe ? '你' : communityInvite.data.inviterName}
                            inviterAvatar={communityInvite.data.inviterAvatar}
                            message={communityInvite.data.message}
                            inviteCode={communityInvite.data.inviteCode}
                            inviteLink={communityInvite.data.inviteLink}
                            isInviter={isMe}
                          />
                        </div>
                      ) : aiShare.isAIShare ? (
                        // 渲染 AI 分享卡片
                        <div className={`${isMe ? 'mr-2' : 'ml-2'}`}>
                          <AIShareMessageCard
                            data={aiShare.data}
                            isMe={isMe}
                            senderName={isMe ? '我' : otherUser?.username}
                          />
                        </div>
                      ) : (
                        // 渲染普通文本消息
                        <div
                          className={`px-4 py-2 rounded-2xl ${
                            isMe
                              ? 'bg-blue-500 text-white rounded-br-none'
                              : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-white rounded-bl-none shadow-sm'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                      )}
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
      <div className="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-4 py-3">
        <div className="w-full max-w-4xl mx-auto flex items-center gap-3">
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
              <HamsterWheelLoader size="small" />
            ) : (
              <Send className="w-5 h-5" />
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

/**
 * 解析社群邀请消息
 */
function parseCommunityInviteMessage(content: string): { isCommunityInvite: boolean; data?: any } {
  const match = content.match(/\[COMMUNITY_INVITE\](.*?)\[\/COMMUNITY_INVITE\]/s);
  if (match) {
    try {
      const data = JSON.parse(match[1]);
      return { isCommunityInvite: true, data };
    } catch (e) {
      console.error('解析社群邀请消息失败:', e);
    }
  }
  return { isCommunityInvite: false };
}

/**
 * 解析 AI 分享消息
 */
function parseAIShareMessage(content: string): { isAIShare: boolean; data?: any } {
  try {
    const parsed = JSON.parse(content);
    if (parsed.type === 'ai_share') {
      return { isAIShare: true, data: parsed };
    }
  } catch (e) {
    // 不是 JSON 格式，不是 AI 分享消息
  }
  return { isAIShare: false };
}

/**
 * AI 分享消息卡片组件
 */
interface AIShareMessageCardProps {
  data: {
    type: string;
    title: string;
    description: string;
    imageUrl: string;
    mediaType: 'image' | 'video';
    note?: string;
  };
  isMe: boolean;
  senderName?: string;
}

const AIShareMessageCard: React.FC<AIShareMessageCardProps> = ({ data, isMe, senderName }) => {
  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden max-w-[280px]">
      {/* 图片/视频 */}
      {data.imageUrl && (
        <div className="relative w-full h-40 bg-gray-100">
          {data.mediaType === 'video' ? (
            <video
              src={data.imageUrl}
              className="w-full h-full object-cover"
              controls
              preload="metadata"
            />
          ) : (
            <img
              src={data.imageUrl}
              alt={data.title}
              className="w-full h-full object-cover"
              onError={(e) => {
                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x160?text=图片加载失败';
              }}
            />
          )}
        </div>
      )}
      {/* 内容 */}
      <div className="p-3">
        <h4 className="font-semibold text-gray-900 text-sm mb-1">
          {data.title}
        </h4>
        {data.description && (
          <p className="text-xs text-gray-600 mb-2 line-clamp-2">
            {data.description}
          </p>
        )}
        {data.note && (
          <p className="text-xs text-gray-500 italic bg-gray-50 p-2 rounded mb-2">
            附言：{data.note}
          </p>
        )}
        <div className="flex items-center justify-between pt-2 border-t border-gray-100">
          <span className="text-[10px] text-gray-400">
            AI生成的{data.mediaType === 'image' ? '图片' : '视频'}
          </span>
          <button
            onClick={() => window.open(data.imageUrl, '_blank')}
            className="text-[10px] text-blue-500 hover:text-blue-600 font-medium"
          >
            查看原图
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
