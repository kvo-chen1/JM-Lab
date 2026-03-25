// Skill 聊天页面发布案例弹窗

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { publishCase } from '@/pages/agent-cases/services/agentCaseService';
import { ChatMessage } from '../types';
import { WorkItem } from '../hooks/useCanvasStore';
import ReactMarkdown from 'react-markdown';
import {
  X,
  Upload,
  Loader2,
  Check,
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  Share2,
  User,
  Bot,
} from 'lucide-react';
import { toast } from 'sonner';

interface PublishCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  messages: ChatMessage[];
  works: WorkItem[];
}

// 获取当前用户信息
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        id: user.id || user.user_id || '',
        name: user.username || user.name || '用户',
        avatar: user.avatar_url || user.avatar || '',
      };
    }
  } catch (e) {
    console.warn('获取用户信息失败:', e);
  }
  return { id: '', name: '用户', avatar: '' };
};

export const PublishCaseModal: React.FC<PublishCaseModalProps> = ({
  isOpen,
  onClose,
  messages,
  works,
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const currentUser = useMemo(() => getCurrentUser(), []);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCoverIndex, setSelectedCoverIndex] = useState(0);
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 获取所有图片作品作为封面选项
  const imageWorks = useMemo(() => {
    return works.filter(work => work.type === 'image' && work.imageUrl);
  }, [works]);

  // 如果没有作品，使用默认占位图
  const coverImages = useMemo(() => {
    if (imageWorks.length > 0) {
      return imageWorks.map(work => work.imageUrl!);
    }
    // 从消息中提取图片
    const messageImages: string[] = [];
    messages.forEach(msg => {
      if (msg.attachments) {
        msg.attachments.forEach(att => {
          if (att.type === 'image' && att.url && !messageImages.includes(att.url)) {
            messageImages.push(att.url);
          }
        });
      }
    });
    return messageImages.length > 0 ? messageImages : [''];
  }, [imageWorks, messages]);

  // 自动生成标题
  React.useEffect(() => {
    if (!title && messages.length > 0) {
      const firstUserMessage = messages.find(m => m.role === 'user');
      if (firstUserMessage) {
        const content = firstUserMessage.content.slice(0, 30);
        setTitle(content + (firstUserMessage.content.length > 30 ? '...' : ''));
      }
    }
  }, [messages, title]);

  // 转换消息格式
  const conversation = useMemo(() => {
    return messages.map((msg) => {
      // 提取图片
      const images: string[] = [];
      if (msg.attachments) {
        msg.attachments.forEach(att => {
          if (att.type === 'image' && att.url) {
            images.push(att.url);
          }
        });
      }

      return {
        id: msg.id,
        role: msg.role === 'user' ? 'user' : 'assistant' as 'user' | 'assistant',
        content: msg.content,
        type: 'text' as const,
        timestamp: new Date(msg.timestamp).toISOString(),
        metadata: {
          images: images.length > 0 ? images : undefined,
          skillCall: msg.skillCall,
          attachments: msg.attachments,
        },
      };
    });
  }, [messages]);

  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('请输入案例标题');
      return;
    }

    if (!currentUser.id) {
      toast.error('请先登录');
      return;
    }

    setIsPublishing(true);

    try {
      const coverImage = coverImages[selectedCoverIndex] || '';

      // 提取所有图片
      const allImages: string[] = [];
      messages.forEach(msg => {
        if (msg.attachments) {
          msg.attachments.forEach(att => {
            if (att.type === 'image' && att.url && !allImages.includes(att.url)) {
              allImages.push(att.url);
            }
          });
        }
      });

      const result = await publishCase({
        title: title.trim(),
        description: description.trim(),
        coverImage: coverImage,
        images: allImages,
        conversation,
        user_id: currentUser.id,
        conversationId: `skill_${Date.now()}`,
        tags: ['Skill'],
        source: 'skill',
      });

      if (result) {
        setIsSuccess(true);
        toast.success('案例发布成功！');

        // 2秒后关闭并跳转
        setTimeout(() => {
          onClose();
          navigate(`/agent-cases/${result.id}`);
        }, 1500);
      }
    } catch (error) {
      console.error('发布案例失败:', error);
      toast.error('发布失败，请重试');
    } finally {
      setIsPublishing(false);
    }
  };

  const handleClose = () => {
    if (!isPublishing) {
      setTitle('');
      setDescription('');
      setSelectedCoverIndex(0);
      setIsSuccess(false);
      onClose();
    }
  };

  // 渲染消息预览
  const renderMessagePreview = (msg: ChatMessage) => {
    const isUser = msg.role === 'user';

    return (
      <div key={msg.id} className={`flex gap-2 mb-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
        <div className={`
          flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs
          ${isUser ? 'bg-blue-500' : 'bg-gradient-to-br from-purple-500 to-pink-500'}
        `}>
          {isUser ? <User className="w-3 h-3 text-white" /> : <Bot className="w-3 h-3 text-white" />}
        </div>
        <div className={`
          max-w-[80%] rounded-lg px-3 py-2 text-xs
          ${isUser
            ? isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white'
            : isDark ? 'bg-gray-800 text-gray-200' : 'bg-gray-100 text-gray-800'
          }
        `}>
          <div className="prose prose-xs max-w-none">
            <ReactMarkdown>{msg.content.slice(0, 100) + (msg.content.length > 100 ? '...' : '')}</ReactMarkdown>
          </div>
          {msg.attachments && msg.attachments.some(att => att.type === 'image') && (
            <div className="flex gap-1 mt-1">
              <ImageIcon className="w-3 h-3 opacity-50" />
              <span className="text-[10px] opacity-70">{msg.attachments.filter(att => att.type === 'image').length} 张图片</span>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`
              relative w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl shadow-2xl
              ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
            `}
          >
            {/* Header */}
            <div className={`
              flex items-center justify-between px-6 py-4 border-b
              ${isDark ? 'border-gray-800' : 'border-gray-200'}
            `}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#C02C38] to-[#E85D75] flex items-center justify-center">
                  <Share2 className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {isSuccess ? '发布成功！' : '发布案例'}
                  </h2>
                  <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {isSuccess ? '正在跳转到案例详情...' : '将你的创作过程分享给更多人'}
                  </p>
                </div>
              </div>
              {!isPublishing && (
                <button
                  onClick={handleClose}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content */}
            {!isSuccess ? (
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Left - Form */}
                  <div className="space-y-4">
                    {/* Title Input */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        案例标题 *
                      </label>
                      <input
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        placeholder="给你的案例起个名字"
                        className={`
                          w-full px-4 py-2.5 rounded-xl text-sm
                          border-2 transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-[#C02C38]/20
                          ${isDark
                            ? 'bg-[#0f1410] border-gray-800 text-white placeholder-gray-600 focus:border-[#C02C38]'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#C02C38]'
                          }
                        `}
                      />
                    </div>

                    {/* Description Input */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        案例描述
                      </label>
                      <textarea
                        value={description}
                        onChange={(e) => setDescription(e.target.value)}
                        placeholder="简单描述一下这个案例的创作背景和亮点"
                        rows={3}
                        className={`
                          w-full px-4 py-2.5 rounded-xl text-sm resize-none
                          border-2 transition-all duration-200
                          focus:outline-none focus:ring-2 focus:ring-[#C02C38]/20
                          ${isDark
                            ? 'bg-[#0f1410] border-gray-800 text-white placeholder-gray-600 focus:border-[#C02C38]'
                            : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#C02C38]'
                          }
                        `}
                      />
                    </div>

                    {/* Cover Image Selection */}
                    {coverImages.length > 0 && coverImages[0] && (
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          选择封面
                        </label>
                        <div className="grid grid-cols-4 gap-2">
                          {coverImages.map((img, index) => (
                            <button
                              key={index}
                              onClick={() => setSelectedCoverIndex(index)}
                              className={`
                                relative aspect-square rounded-lg overflow-hidden
                                border-2 transition-all duration-200
                                ${selectedCoverIndex === index
                                  ? 'border-[#C02C38] ring-2 ring-[#C02C38]/30'
                                  : isDark ? 'border-gray-700 hover:border-gray-600' : 'border-gray-200 hover:border-gray-300'
                                }
                              `}
                            >
                              {img ? (
                                <img src={img} alt={`封面 ${index + 1}`} className="w-full h-full object-cover" />
                              ) : (
                                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                                  <ImageIcon className="w-6 h-6 text-gray-400" />
                                </div>
                              )}
                              {selectedCoverIndex === index && (
                                <div className="absolute inset-0 bg-[#C02C38]/20 flex items-center justify-center">
                                  <Check className="w-5 h-5 text-white drop-shadow-lg" />
                                </div>
                              )}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Stats */}
                    <div className={`
                      flex items-center gap-4 p-3 rounded-xl text-xs
                      ${isDark ? 'bg-[#0f1410]' : 'bg-gray-50'}
                    `}>
                      <div className="flex items-center gap-1.5">
                        <MessageSquare className="w-4 h-4 text-[#C02C38]" />
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          {messages.length} 条对话
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-[#C02C38]" />
                        <span className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                          {works.length} 个作品
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right - Preview */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      对话预览
                    </label>
                    <div className={`
                      h-[320px] overflow-y-auto rounded-xl p-3
                      ${isDark ? 'bg-[#0f1410]' : 'bg-gray-50'}
                    `}>
                      {messages.length > 0 ? (
                        messages.slice(0, 10).map(renderMessagePreview)
                      ) : (
                        <div className={`text-center py-8 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          暂无对话记录
                        </div>
                      )}
                      {messages.length > 10 && (
                        <div className={`text-center py-2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          还有 {messages.length - 10} 条消息...
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Success State */
              <div className="p-12 flex flex-col items-center justify-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mb-4"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  发布成功！
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  你的案例已发布到案例库
                </p>
              </div>
            )}

            {/* Footer */}
            {!isSuccess && (
              <div className={`
                flex justify-end gap-3 px-6 py-4 border-t
                ${isDark ? 'border-gray-800' : 'border-gray-200'}
              `}>
                <button
                  onClick={handleClose}
                  disabled={isPublishing}
                  className={`
                    px-5 py-2.5 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${isDark
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                    }
                    disabled:opacity-50 disabled:cursor-not-allowed
                  `}
                >
                  取消
                </button>
                <button
                  onClick={handlePublish}
                  disabled={isPublishing || !title.trim()}
                  className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-medium
                    bg-gradient-to-r from-[#C02C38] to-[#E85D75]
                    text-white shadow-lg shadow-[#C02C38]/25
                    hover:shadow-xl hover:shadow-[#C02C38]/30 hover:scale-[1.02]
                    active:scale-[0.98]
                    transition-all duration-200
                    disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100
                  `}
                >
                  {isPublishing ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      发布中...
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      发布案例
                    </>
                  )}
                </button>
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default PublishCaseModal;
