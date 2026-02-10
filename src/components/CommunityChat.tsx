import * as React from 'react';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { TianjinAvatar } from './TianjinStyleComponents';
import { Message } from '@/services/communityService';

// 类型定义
export type ChatMessage = Message & {
  replyTo?: { id: string; user: string; text: string };
};

export type Community = {
  id: string;
  name: string;
  description: string;
  cover: string;
  tags: string[];
  members: number;
};

interface CommunityChatProps {
  isDark: boolean;
  joinedCommunities: Community[]; // Changed from string[] to Community[]
  activeChatCommunityId: string | null;
  onActiveChatCommunityChange: (id: string | null) => void;
  pinnedJoined: string[];
  onTogglePinJoined: (id: string) => void;
  mutedCommunities: string[];
  onToggleMuteCommunity: (id: string) => void;
  messages: ChatMessage[]; // Current active messages
  onSendMessage: (text: string) => Promise<void>;
  currentUser: { name: string; avatar: string };
}

const CommunityChat: React.FC<CommunityChatProps> = ({
  isDark,
  joinedCommunities,
  activeChatCommunityId,
  onActiveChatCommunityChange,
  pinnedJoined,
  onTogglePinJoined,
  mutedCommunities,
  onToggleMuteCommunity,
  messages,
  onSendMessage,
  currentUser
}) => {
  const [chatSearch, setChatSearch] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [replyingTo, setReplyingTo] = useState<ChatMessage | null>(null);

  // 常用表情列表
  const emojis = ['👍', '❤️', '😂', '🎉', '😮', '😢', '😡', '🤔', '👀', '👏'];

  // 聊天搜索过滤
  const chatJoinedList = useMemo(() => {
    const q = chatSearch.trim().toLowerCase();
    const base = joinedCommunities.filter(c => q ? `${c.name} ${c.description} ${c.tags.join(' ')}`.toLowerCase().includes(q) : true);
    const pinned = base.filter(c => pinnedJoined.includes(c.id));
    const others = base.filter(c => !pinnedJoined.includes(c.id));
    return [...pinned, ...others];
  }, [joinedCommunities, chatSearch, pinnedJoined]);

  // 发送消息
  const handleSendMessage = async () => {
    const t = newMessage.trim();
    if (!t) return;
    
    try {
      await onSendMessage(t);
      setNewMessage('');
      setReplyingTo(null);
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('发送失败');
    }
  };

  // 插入表情
  const insertEmoji = (emoji: string) => {
    setNewMessage(prev => prev + emoji);
    setShowEmojiPicker(false);
  };

  // 获取当前活跃社群
  const activeCommunity = useMemo(() => {
    if (!activeChatCommunityId) return null;
    return joinedCommunities.find(c => c.id === activeChatCommunityId) || null;
  }, [activeChatCommunityId, joinedCommunities]);

  const handleImageUpload = () => {
    toast.info('图片上传功能开发中...');
  };

  const handleCreatePoll = () => {
    toast.info('投票功能开发中...');
  };

  const startReply = (message: ChatMessage) => {
    setReplyingTo(message);
    toast.info('引用回复功能开发中...');
  };

  const cancelReply = () => {
    setReplyingTo(null);
  };

  const togglePinMessage = (id: string) => {
     toast.info('消息置顶功能开发中...');
  };

  const deleteMessage = (id: string) => {
    toast.info('消息删除功能开发中...');
  };
  
  const addReaction = (id: string, emoji: string) => {
     toast.info('表情互动功能开发中...');
  };

  return (
    <motion.section
      className={`mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md p-4`}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-medium">社群列表与聊天</h3>
        <span className={`text-xs px-2 py-1 rounded-full ${isDark ? 'bg-gray-700 text-gray-200' : 'bg-gray-100 text-gray-700'}`}>实时</span>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-140px)] md:h-auto">
        {/* 左侧社群列表 */}
        <div className={`lg:col-span-1 h-full flex flex-col ${activeChatCommunityId ? 'hidden lg:flex' : 'flex'}`}>
          <div className="flex items-center gap-2 mb-2">
            <input 
              value={chatSearch} 
              onChange={e => setChatSearch(e.target.value)} 
              placeholder="搜索已加入社群..." 
              className={`${isDark ? 'bg-gray-800 text-white ring-1 ring-gray-700' : 'bg-white text-gray-900 ring-1 ring-gray-300'} px-3 py-2 h-12 rounded-lg flex-1 focus:outline-none focus:ring-2 ${isDark ? 'focus:ring-purple-500' : 'focus:ring-pink-300'}`} 
            />
          </div>
          <ul className="space-y-2 flex-1 overflow-y-auto">
            {chatJoinedList.length === 0 ? (
              <li className="text-sm opacity-60">暂无已加入社群</li>
            ) : (
              chatJoinedList.map(c => (
                <li key={`chatlist-top-${c.id}`}>
                  <button 
                    onClick={() => onActiveChatCommunityChange(c.id)} 
                    className={`w-full text-left p-3 rounded-lg text-sm ring-1 transition-colors min-h-[60px] flex flex-col justify-center ${activeChatCommunityId === c.id ? (isDark ? 'bg-indigo-600 text-white ring-indigo-600' : 'bg-indigo-600 text-white ring-indigo-600') : (isDark ? 'bg-gray-700 text-white ring-gray-700' : 'bg-gray-100 text-gray-900 ring-gray-200')}`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <div className="font-medium truncate mr-2 text-base">{c.name}</div>
                    </div>
                    <div className={`text-xs opacity-70 mt-1 ${activeChatCommunityId === c.id ? 'text-indigo-100' : 'text-gray-500'}`}>{c.tags.slice(0, 2).join(' · ')}</div>
                  </button>
                </li>
              ))
            )}
          </ul>
        </div>

        {/* 右侧聊天区域 */}
        <div className={`lg:col-span-2 h-full flex flex-col ${!activeChatCommunityId ? 'hidden lg:flex' : 'flex'}`}>
          {activeCommunity ? (
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onActiveChatCommunityChange(null)}
                    className={`lg:hidden p-2 rounded-full ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'}`}
                  >
                    <i className="fas fa-arrow-left"></i>
                  </button>
                  <div className="font-medium text-lg">{activeCommunity.name}</div>
                </div>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => onTogglePinJoined(activeCommunity.id)} 
                    className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} text-xs px-3 py-2 rounded-full transition-colors`}
                  >
                    {pinnedJoined.includes(activeCommunity.id) ? '取消置顶' : '置顶'}
                  </button>
                  <button 
                    onClick={() => onToggleMuteCommunity(activeCommunity.id)} 
                    className={`${isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-800'} text-xs px-3 py-2 rounded-full transition-colors`}
                  >
                    {mutedCommunities.includes(activeCommunity.id) ? '取消静音' : '静音'}
                  </button>
                </div>
              </div>
              <div className="space-y-3 mb-4 flex-1 overflow-y-auto pr-1">
                {messages.length === 0 ? (
                  <div className="text-sm opacity-60 text-center py-4">暂无消息，快来发第一条消息吧！</div>
                ) : (
                  messages.map((msg) => (
                    <div 
                      key={msg.id} 
                      className={`p-3 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}
                    >
                      <div className="flex items-start">
                        <TianjinAvatar 
                          src={msg.sender?.avatar_url || ''} 
                          alt={msg.sender?.username || 'User'} 
                          size="sm" 
                          className="mr-3" 
                        />
                        <div className="flex-1 min-w-0">
                          {/* 回复引用 */}
                          {msg.replyTo && (
                            <div className={`mb-2 p-2 rounded-lg text-xs ${isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                              <div className="font-medium">回复 {msg.replyTo.user}:</div>
                              <div className="text-xs opacity-80 line-clamp-2">{msg.replyTo.text}</div>
                            </div>
                          )}
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-medium truncate">{msg.sender?.username || 'Unknown'}</div>
                            </div>
                            <div className="text-xs text-gray-400">
                              {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                          <div className={`text-sm ${isDark ? 'text-gray-200' : 'text-gray-800'} mb-2 break-words`}>{msg.text}</div>
                          
                          {/* 表情反应 */}
                          {msg.reactions && Object.keys(msg.reactions).length > 0 && (
                            <div className="flex items-center gap-1 mb-2 flex-wrap">
                              {Object.entries(msg.reactions).map(([emoji, users]) => (
                                <button 
                                  key={emoji} 
                                  onClick={() => msg.id && addReaction(msg.id, emoji)} 
                                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-200'} ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-300'} transition-colors`}
                                >
                                  <span>{emoji}</span>
                                  <span>{users.length}</span>
                                </button>
                              ))}
                            </div>
                          )}
                          
                          {/* 操作按钮 - 在移动端简化显示 */}
                          <div className="flex items-center gap-1 flex-wrap">
                            <button 
                              onClick={() => msg.id && startReply(msg)} 
                              className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} px-2 py-0.5 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-300'} transition-colors`}
                            >
                              回复
                            </button>
                            <button 
                              onClick={() => msg.id && togglePinMessage(msg.id)} 
                              className={`${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'} px-2 py-0.5 rounded-lg text-xs ring-1 ${isDark ? 'ring-gray-700' : 'ring-gray-300'} transition-colors`}
                            >
                              {msg.is_pinned ? '取消置顶' : '置顶'}
                            </button>
                            <button 
                              onClick={() => msg.id && deleteMessage(msg.id)} 
                              className={`${isDark ? 'bg-red-700 text-white' : 'bg-red-100 text-red-800'} px-2 py-0.5 rounded-lg text-xs transition-colors`}
                            >
                              删除
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
              {/* 回复指示器 */}
              {replyingTo && (
                <div className={`flex items-center gap-2 mb-2 p-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}>
                  <div className="text-sm">回复 {replyingTo.username}:</div>
                  <button 
                    onClick={cancelReply} 
                    className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-800'}`}
                  >
                    取消
                  </button>
                </div>
              )}
              
              {/* 消息输入区域 */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <input 
                    value={newMessage} 
                    onChange={e => setNewMessage(e.target.value)} 
                    onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} 
                    placeholder={replyingTo ? `回复 ${replyingTo.username}...` : "发表你的看法..."} 
                    className={`w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-2 ${isDark ? 'bg-gray-700 text-white ring-1 ring-gray-600 focus:ring-purple-500' : 'bg-white text-gray-900 ring-1 ring-gray-300 focus:ring-pink-300'}`} 
                  />
                  {/* 表情选择器 */}
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 flex items-center gap-1">
                    <button 
                      onClick={() => setShowEmojiPicker(!showEmojiPicker)} 
                      className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-500'}`}
                      title="表情"
                    >
                      <i className="fas fa-smile"></i>
                    </button>
                    <button 
                      onClick={handleImageUpload} 
                      className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-500'}`}
                      title="发送图片"
                    >
                      <i className="fas fa-image"></i>
                    </button>
                    <button 
                      onClick={handleCreatePoll} 
                      className={`p-1.5 rounded-full transition-colors ${isDark ? 'hover:bg-gray-600 text-gray-300' : 'hover:bg-gray-200 text-gray-500'}`}
                      title="发起投票"
                    >
                      <i className="fas fa-poll"></i>
                    </button>
                  </div>

                  {showEmojiPicker && (
                    <div className={`absolute bottom-full right-0 mb-2 p-2 rounded-lg shadow-lg z-10 ${isDark ? 'bg-gray-800 ring-1 ring-gray-700' : 'bg-white ring-1 ring-gray-300'}`}>
                      <div className="grid grid-cols-5 gap-2">
                        {emojis.map((emoji) => (
                          <button 
                            key={emoji} 
                            onClick={() => insertEmoji(emoji)} 
                            className={`text-xl p-1 rounded-full ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-200'}`}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <button 
                  onClick={handleSendMessage} 
                  className="px-3 py-2 rounded-lg bg-gradient-to-r from-red-600 to-pink-600 text-white transition-colors hover:opacity-90"
                >
                  发送
                </button>
              </div>
            </div>
          ) : (
            <div className={`flex items-center justify-center h-72 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
              <div className="text-sm opacity-60">请选择一个社群开始聊天</div>
            </div>
          )}
        </div>
      </div>
    </motion.section>
  );
};

export default CommunityChat