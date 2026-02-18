import React, { useEffect, useRef, useState } from 'react';
import { useChatContext } from '@/contexts/chatContext';
import { useFriendContext } from '@/contexts/friendContext';
import { X, Send, Image as ImageIcon, Smile } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const PrivateChatWindow: React.FC = () => {
  const { currentChatFriendId, setCurrentChatFriendId, messages, sendMessage, loading } = useChatContext();
  const { friends } = useFriendContext();
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 获取当前聊天好友信息
  const currentFriend = friends.find(f => f.friend_id === currentChatFriendId);
  const friendUser = currentFriend?.friend;

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, currentChatFriendId]);

  // 聚焦输入框
  useEffect(() => {
    if (currentChatFriendId) {
      inputRef.current?.focus();
    }
  }, [currentChatFriendId]);

  const handleSend = async () => {
    if (!inputValue.trim()) return;
    
    const content = inputValue;
    setInputValue('');
    await sendMessage(content);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatTime = (timestamp: number | string) => {
    return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  if (!currentChatFriendId) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-4 right-4 w-80 md:w-96 h-[500px] bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 flex flex-col z-50 overflow-hidden"
      >
        {/* Header */}
        <div className="p-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between bg-white dark:bg-gray-800 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <img 
                src={friendUser?.avatar_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + currentChatFriendId} 
                alt={friendUser?.username} 
                className="w-10 h-10 rounded-full object-cover border border-gray-200 dark:border-gray-700"
              />
              <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white dark:border-gray-800 ${friendUser?.status === 'online' ? 'bg-green-500' : 'bg-gray-400'}`}></div>
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-gray-100">
                {currentFriend?.user_note || friendUser?.username || '未知用户'}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {friendUser?.status === 'online' ? '在线' : '离线'}
              </p>
            </div>
          </div>
          <button 
            onClick={() => setCurrentChatFriendId(null)}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors text-gray-500"
          >
            <X size={18} />
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 dark:bg-gray-900/50">
          {loading && messages.length === 0 ? (
            <div className="flex justify-center py-4">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400 text-sm">
              <p>暂无消息，打个招呼吧！</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isMe = msg.sender_id !== currentChatFriendId;
              
              // 尝试解析 AI 分享消息
              let aiShareData: any = null;
              try {
                const parsed = JSON.parse(msg.content);
                if (parsed.type === 'ai_share') {
                  aiShareData = parsed;
                }
              } catch (e) {
                // 不是 JSON 格式，普通消息
              }
              
              // 如果是 AI 分享消息，显示卡片
              if (aiShareData) {
                return (
                  <div 
                    key={msg.id} 
                    className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className="max-w-[85%]">
                      {/* AI 分享卡片 */}
                      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
                        {/* 图片 */}
                        {aiShareData.imageUrl && (
                          <div className="relative w-full h-40 bg-gray-100">
                            <img
                              src={aiShareData.imageUrl}
                              alt={aiShareData.title}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = 'https://via.placeholder.com/400x160?text=图片加载失败';
                              }}
                            />
                          </div>
                        )}
                        {/* 内容 */}
                        <div className="p-3">
                          <h4 className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-1">
                            {aiShareData.title}
                          </h4>
                          {aiShareData.description && (
                            <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                              {aiShareData.description}
                            </p>
                          )}
                          {aiShareData.note && (
                            <p className="text-xs text-gray-500 dark:text-gray-500 italic bg-gray-50 dark:bg-gray-700/50 p-2 rounded mb-2">
                              附言：{aiShareData.note}
                            </p>
                          )}
                          <div className="flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
                            <span className="text-[10px] text-gray-400">
                              AI生成的{aiShareData.mediaType === 'image' ? '图片' : '视频'}
                            </span>
                            <button
                              onClick={() => window.open(aiShareData.imageUrl, '_blank')}
                              className="text-[10px] text-blue-500 hover:text-blue-600 font-medium"
                            >
                              查看原图
                            </button>
                          </div>
                        </div>
                      </div>
                      {/* 时间戳 */}
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-right text-blue-100' : 'text-left text-gray-400'}`}>
                        {formatTime(msg.created_at)}
                      </p>
                    </div>
                  </div>
                );
              }
              
              // 普通消息
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      isMe 
                        ? 'bg-blue-600 text-white rounded-tr-none' 
                        : 'bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    <p>{msg.content}</p>
                    <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                      {formatTime(msg.created_at)}
                    </p>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-3 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
              <ImageIcon size={20} />
            </button>
            <div className="flex-1 relative">
              <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="发送消息..."
                className="w-full bg-gray-100 dark:bg-gray-700/50 border-none rounded-full py-2 pl-4 pr-10 text-sm focus:ring-2 focus:ring-blue-500/20 text-gray-900 dark:text-gray-100 placeholder-gray-500"
              />
              <button className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Smile size={18} />
              </button>
            </div>
            <button 
              onClick={handleSend}
              disabled={!inputValue.trim()}
              className="p-2 bg-blue-600 text-white rounded-full hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shadow-sm"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default PrivateChatWindow;
