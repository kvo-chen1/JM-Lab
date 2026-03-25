// 发布案例弹窗组件

import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { publishCase } from '@/pages/agent-cases/services/agentCaseService';
import { useConversationStore } from '../hooks/useConversationStore';
import { useAgentStore } from '../hooks/useAgentStore';
import {
  X,
  Upload,
  Loader2,
  Check,
  Sparkles,
  MessageSquare,
  Image as ImageIcon,
  Share2,
} from 'lucide-react';
import { toast } from 'sonner';

interface PublishCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PublishCaseModal: React.FC<PublishCaseModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { getCurrentSession } = useConversationStore();
  const { messages: currentMessages } = useAgentStore();

  // 获取当前会话的完整消息（优先使用会话快照，否则使用当前消息）
  const messages = useMemo(() => {
    const session = getCurrentSession();
    if (session?.stateSnapshot?.messages && session.stateSnapshot.messages.length > 0) {
      console.log('[PublishCaseModal] 使用会话快照消息:', session.stateSnapshot.messages.length);
      return session.stateSnapshot.messages;
    }
    console.log('[PublishCaseModal] 使用当前消息:', currentMessages.length);
    return currentMessages;
  }, [getCurrentSession, currentMessages, isOpen]);

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  // 从对话中提取生成的图片
  const generatedImages = useMemo(() => {
    const images: string[] = [];
    messages.forEach((msg) => {
      if (msg.type === 'image' && msg.metadata?.images) {
        msg.metadata.images.forEach((img: any) => {
          const url = typeof img === 'string' ? img : img.url;
          if (url && !images.includes(url)) {
            images.push(url);
          }
        });
      }
    });
    return images;
  }, [messages]);

  // 获取默认标题（第一条用户消息）
  const defaultTitle = useMemo(() => {
    const firstUserMessage = messages.find((m) => m.role === 'user');
    if (firstUserMessage) {
      const content = firstUserMessage.content.slice(0, 20);
      return content + (firstUserMessage.content.length > 20 ? '...' : '');
    }
    return 'AI创作对话';
  }, [messages]);

  // 初始化标题
  React.useEffect(() => {
    if (isOpen && !title) {
      setTitle(defaultTitle);
    }
  }, [isOpen, defaultTitle, title]);

  // 重置状态当弹窗关闭
  React.useEffect(() => {
    if (!isOpen) {
      setTitle('');
      setDescription('');
      setTags([]);
      setTagInput('');
      setIsPublishing(false);
      setIsSuccess(false);
    }
  }, [isOpen]);

  // 添加标签
  const handleAddTag = () => {
    if (tagInput.trim() && !tags.includes(tagInput.trim()) && tags.length < 5) {
      setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  // 删除标签
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  // 处理标签输入回车
  const handleTagKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddTag();
    }
  };

  // 发布案例
  const handlePublish = async () => {
    if (!title.trim()) {
      toast.error('请输入标题');
      return;
    }

    if (messages.length === 0) {
      toast.error('没有可发布的对话内容');
      return;
    }

    setIsPublishing(true);

    try {
      // 构建对话历史
      // 注意：msg.role 可能是 'user', 'assistant', 'director', 'designer' 等
      // 数据库只接受 'user' 或 'assistant'，所以需要转换
      // 注意：msg.type 可能有其他值，数据库只接受 'text', 'image', 'analysis', 'thinking'
      const conversation = messages.map((msg) => {
        // 将 'director', 'designer' 等非用户角色转换为 'assistant'
        const role = msg.role === 'user' ? 'user' : 'assistant';

        // 确保 type 符合数据库约束
        const validTypes = ['text', 'image', 'analysis', 'thinking'];
        const type = validTypes.includes(msg.type) ? msg.type : 'text';

        // 构建 metadata，保留重要信息用于展示
        const metadata: any = {
          ...msg.metadata,
        };

        // 保存 Agent 类型信息，用于展示不同的 Agent 头像
        if (msg.role !== 'user') {
          // 从 role 推断 agentType
          const roleToAgentType: Record<string, string> = {
            'director': 'director',
            'designer': 'designer',
            'illustrator': 'illustrator',
            'copywriter': 'copywriter',
            'animator': 'animator',
            'researcher': 'researcher',
          };

          if (roleToAgentType[msg.role]) {
            metadata.agentType = roleToAgentType[msg.role];
          }
        }

        // 处理图片数据
        if (msg.type === 'image' && msg.metadata?.images) {
          metadata.images = msg.metadata.images.map((img: any) =>
            typeof img === 'string' ? img : img.url
          );
        }

        return {
          id: msg.id,
          role: role as 'user' | 'assistant',
          content: msg.content,
          type: type as 'text' | 'image' | 'analysis' | 'thinking',
          timestamp: new Date(msg.timestamp || Date.now()).toISOString(),
          metadata,
        };
      });

      // 如果没有图片，使用默认封面
      const coverImage = generatedImages[0] || 'https://via.placeholder.com/800x600?text=AI+Case';
      
      await publishCase({
        title: title.trim(),
        description: description.trim(),
        coverImage,
        images: generatedImages.length > 0 ? generatedImages : [coverImage],
        conversationId: `session_${Date.now()}`,
        tags,
        conversation, // 传递对话历史
        source: 'agent',
      });

      setIsSuccess(true);
      toast.success('案例发布成功！');

      // 2秒后关闭弹窗并跳转到案例列表
      setTimeout(() => {
        onClose();
        navigate('/agent-cases');
      }, 2000);
    } catch (error: any) {
      console.error('发布案例失败:', error);
      const errorMessage = error.message || '发布失败，请稍后重试';
      toast.error(errorMessage);
    } finally {
      setIsPublishing(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 - 使用更高的z-index */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm"
            style={{ zIndex: 9999 }}
          />

          {/* 弹窗内容 - 使用flex居中 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className={`
              fixed inset-0 flex items-center justify-center p-4
              pointer-events-none
            `}
            style={{ zIndex: 10000 }}
          >
            <div
              className={`
                w-full max-w-lg max-h-[85vh] overflow-y-auto
                rounded-2xl shadow-2xl pointer-events-auto
                ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}
              `}
              onClick={(e) => e.stopPropagation()}
            >
            {/* 成功状态 */}
            {isSuccess ? (
              <div className="p-8 flex flex-col items-center text-center">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="
                    w-16 h-16 rounded-full flex items-center justify-center mb-4
                    bg-gradient-to-br from-green-400 to-emerald-500
                  "
                >
                  <Check className="w-8 h-8 text-white" />
                </motion.div>
                <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  发布成功！
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  你的案例已成功发布到Agent案例库
                </p>
              </div>
            ) : (
              <>
                {/* 头部 */}
                <div className={`
                  flex items-center justify-between px-6 py-4 border-b
                  ${isDark ? 'border-[#2a2f2a]' : 'border-gray-200'}
                `}>
                  <div className="flex items-center gap-3">
                    <div className="
                      w-10 h-10 rounded-xl flex items-center justify-center
                      bg-gradient-to-br from-[#C02C38] to-[#E85D75]
                    ">
                      <Share2 className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className={`font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        发布案例
                      </h2>
                      <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>
                        分享你的AI创作过程
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={onClose}
                    className={`
                      p-2 rounded-lg transition-colors
                      ${isDark ? 'hover:bg-[#2a2f2a] text-gray-400' : 'hover:bg-gray-100 text-gray-600'}
                    `}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* 内容 */}
                <div className="p-6 space-y-5">
                  {/* 统计信息 */}
                  <div className={`
                    flex items-center gap-4 p-3 rounded-xl
                    ${isDark ? 'bg-[#0a0f0a]' : 'bg-gray-50'}
                  `}>
                    <div className="flex items-center gap-2">
                      <MessageSquare className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                      <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {messages.length} 条对话
                      </span>
                    </div>
                    {generatedImages.length > 0 && (
                      <div className="flex items-center gap-2">
                        <ImageIcon className={`w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {generatedImages.length} 张图片
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 标题输入 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      标题 <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      placeholder="给你的案例起个名字"
                      maxLength={50}
                      className={`
                        w-full px-4 py-3 rounded-xl
                        text-sm
                        border-2 transition-colors
                        focus:outline-none
                        ${isDark
                          ? 'bg-[#0a0f0a] border-[#2a2f2a] text-white placeholder-gray-600 focus:border-[#C02C38]'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#C02C38]'
                        }
                      `}
                    />
                    <div className={`text-right text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {title.length}/50
                    </div>
                  </div>

                  {/* 描述输入 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      描述
                    </label>
                    <textarea
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="描述一下你的创作思路..."
                      rows={3}
                      maxLength={200}
                      className={`
                        w-full px-4 py-3 rounded-xl resize-none
                        text-sm leading-relaxed
                        border-2 transition-colors
                        focus:outline-none
                        ${isDark
                          ? 'bg-[#0a0f0a] border-[#2a2f2a] text-white placeholder-gray-600 focus:border-[#C02C38]'
                          : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#C02C38]'
                        }
                      `}
                    />
                    <div className={`text-right text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                      {description.length}/200
                    </div>
                  </div>

                  {/* 生成的图片预览 */}
                  {generatedImages.length > 0 && (
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        生成的图片
                      </label>
                      <div className="grid grid-cols-4 gap-2">
                        {generatedImages.slice(0, 4).map((img, index) => (
                          <div
                            key={index}
                            className={`
                              aspect-square rounded-lg overflow-hidden
                              ${index === 0 ? 'ring-2 ring-[#C02C38]' : ''}
                            `}
                          >
                            <img
                              src={img}
                              alt={`图片 ${index + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        ))}
                        {generatedImages.length > 4 && (
                          <div className={`
                            aspect-square rounded-lg flex items-center justify-center
                            ${isDark ? 'bg-[#2a2f2a]' : 'bg-gray-100'}
                          `}>
                            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              +{generatedImages.length - 4}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 标签输入 */}
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      标签 <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>(最多5个)</span>
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {tags.map((tag) => (
                        <span
                          key={tag}
                          className={`
                            flex items-center gap-1 px-2.5 py-1 rounded-full text-xs
                            ${isDark ? 'bg-[#2a2f2a] text-gray-300' : 'bg-gray-100 text-gray-700'}
                          `}
                        >
                          {tag}
                          <button
                            onClick={() => handleRemoveTag(tag)}
                            className="hover:text-red-500 transition-colors"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                    {tags.length < 5 && (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={tagInput}
                          onChange={(e) => setTagInput(e.target.value)}
                          onKeyDown={handleTagKeyDown}
                          placeholder="添加标签"
                          className={`
                            flex-1 px-3 py-2 rounded-lg text-sm
                            border-2 transition-colors
                            focus:outline-none
                            ${isDark
                              ? 'bg-[#0a0f0a] border-[#2a2f2a] text-white placeholder-gray-600 focus:border-[#C02C38]'
                              : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-[#C02C38]'
                            }
                          `}
                        />
                        <button
                          onClick={handleAddTag}
                          disabled={!tagInput.trim()}
                          className="
                            px-3 py-2 rounded-lg text-sm
                            bg-gradient-to-r from-[#C02C38] to-[#E85D75]
                            text-white font-medium
                            disabled:opacity-50 disabled:cursor-not-allowed
                          "
                        >
                          添加
                        </button>
                      </div>
                    )}
                  </div>

                  {/* 提示信息 */}
                  <div className={`
                    p-3 rounded-xl flex items-start gap-2
                    ${isDark ? 'bg-blue-900/20 border border-blue-800/30' : 'bg-blue-50 border border-blue-100'}
                  `}>
                    <Sparkles className={`w-4 h-4 flex-shrink-0 mt-0.5 ${isDark ? 'text-blue-400' : 'text-blue-500'}`} />
                    <p className={`text-xs ${isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                      发布后，其他用户可以查看你的创作过程，并基于你的案例创作同款作品。
                    </p>
                  </div>
                </div>

                {/* 底部按钮 */}
                <div className={`
                  flex items-center justify-end gap-3 px-6 py-4 border-t
                  ${isDark ? 'border-[#2a2f2a]' : 'border-gray-200'}
                `}>
                  <button
                    onClick={onClose}
                    disabled={isPublishing}
                    className={`
                      px-4 py-2 rounded-lg text-sm font-medium
                      transition-colors
                      ${isDark
                        ? 'text-gray-400 hover:text-gray-300 hover:bg-[#2a2f2a]'
                        : 'text-gray-600 hover:text-gray-700 hover:bg-gray-100'
                      }
                      disabled:opacity-50
                    `}
                  >
                    取消
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={handlePublish}
                    disabled={isPublishing || !title.trim()}
                    className="
                      flex items-center gap-2 px-5 py-2 rounded-lg
                      bg-gradient-to-r from-[#C02C38] to-[#E85D75]
                      text-white text-sm font-medium
                      shadow-lg shadow-red-500/20
                      disabled:opacity-50 disabled:cursor-not-allowed
                    "
                  >
                    {isPublishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>发布中...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-4 h-4" />
                        <span>发布</span>
                      </>
                    )}
                  </motion.button>
                </div>
              </>
            )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default PublishCaseModal;
