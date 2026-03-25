// 对话面板组件 - 增强版，支持完整对话展示和回放功能

import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { ConversationMessage } from '../types';
import { AGENT_CONFIG, AgentType } from '@/pages/agent/types/agent';
import ReactMarkdown from 'react-markdown';
import {
  User,
  Bot,
  ChevronDown,
  ChevronUp,
  Image as ImageIcon,
  Sparkles,
  Palette,
  CheckCircle,
  Lightbulb,
  Wand2,
  MessageSquare,
  Play,
  Pause,
  RotateCcw,
  SkipForward,
} from 'lucide-react';

interface ConversationPanelProps {
  messages: ConversationMessage[];
  isReplayMode?: boolean;
  onReplayComplete?: () => void;
}

// 获取当前用户信息
const getCurrentUser = () => {
  try {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      const user = JSON.parse(userStr);
      return {
        name: user.username || user.name || '用户',
        avatar: user.avatar_url || user.avatar || '',
      };
    }
  } catch (e) {
    console.warn('获取用户信息失败:', e);
  }
  return { name: '用户', avatar: '' };
};

// 获取 Agent 配置
const getAgentInfo = (role: string) => {
  // 数据库中存储的是 'assistant'，需要映射到具体的 Agent 类型
  // 从 metadata 中获取实际的 agentType
  return null;
};

// 从 metadata 中获取 Agent 类型
const getAgentTypeFromMetadata = (metadata?: any): AgentType | null => {
  if (!metadata) return null;
  if (metadata.agentType) return metadata.agentType;
  if (metadata.designType) {
    // 根据设计类型推断 Agent 类型
    const designTypeMap: Record<string, AgentType> = {
      'ip-character': 'illustrator',
      'brand-design': 'designer',
      'packaging': 'designer',
      'poster': 'designer',
      'animation': 'animator',
      'illustration': 'illustrator',
    };
    return designTypeMap[metadata.designType] || 'designer';
  }
  return null;
};

export const ConversationPanel: React.FC<ConversationPanelProps> = ({
  messages,
  isReplayMode = false,
  onReplayComplete,
}) => {
  const { isDark } = useTheme();
  const [expandedMessages, setExpandedMessages] = useState<Set<string>>(new Set());
  const currentUser = useMemo(() => getCurrentUser(), []);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const lastMessageRef = useRef<HTMLDivElement>(null);

  // 回放相关状态
  const [replayIndex, setReplayIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [replaySpeed, setReplaySpeed] = useState(1);

  const toggleExpand = (messageId: string) => {
    setExpandedMessages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(messageId)) {
        newSet.delete(messageId);
      } else {
        newSet.add(messageId);
      }
      return newSet;
    });
  };

  // 回放控制函数
  const startReplay = useCallback(() => {
    setReplayIndex(0);
    setIsPlaying(true);
  }, []);

  const pauseReplay = useCallback(() => {
    setIsPlaying(false);
  }, []);

  const resumeReplay = useCallback(() => {
    setIsPlaying(true);
  }, []);

  const resetReplay = useCallback(() => {
    setReplayIndex(0);
    setIsPlaying(false);
  }, []);

  const skipToEnd = useCallback(() => {
    setReplayIndex(messages.length);
    setIsPlaying(false);
  }, [messages.length]);

  // 当进入回放模式时自动开始播放
  useEffect(() => {
    if (isReplayMode && replayIndex === 0 && !isPlaying) {
      // 延迟一点开始，让用户看到控制栏
      const timer = setTimeout(() => {
        setIsPlaying(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [isReplayMode]);

  // 回放效果
  useEffect(() => {
    if (!isReplayMode || !isPlaying) return;

    if (replayIndex >= messages.length) {
      setIsPlaying(false);
      onReplayComplete?.();
      return;
    }

    const currentMessage = messages[replayIndex];
    // 简化延迟计算：基础延迟 + 根据内容长度的额外延迟（有上限）
    const baseDelay = 800;
    const contentDelay = Math.min(currentMessage.content.length * 8, 1500);
    const delay = (baseDelay + contentDelay) / replaySpeed;

    const timer = setTimeout(() => {
      setReplayIndex(prev => prev + 1);
    }, delay);

    return () => clearTimeout(timer);
  }, [isReplayMode, isPlaying, replayIndex, messages, replaySpeed, onReplayComplete]);



  // 格式化时间
  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // 渲染头像
  const renderAvatar = (message: ConversationMessage) => {
    const isUser = message.role === 'user';

    if (isUser) {
      // 用户头像
      return (
        <div className={`
          flex-shrink-0 w-9 h-9 rounded-full
          flex items-center justify-center overflow-hidden
          bg-gradient-to-br from-blue-500 to-blue-600
        `}>
          {currentUser.avatar ? (
            <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full object-cover" />
          ) : (
            <User className="w-5 h-5 text-white" />
          )}
        </div>
      );
    }

    // Agent 头像 - 尝试从 metadata 获取具体 Agent 类型
    const agentType = getAgentTypeFromMetadata(message.metadata);
    const agentConfig = agentType ? AGENT_CONFIG[agentType as keyof typeof AGENT_CONFIG] : null;

    if (agentConfig) {
      return (
        <div className={`
          flex-shrink-0 w-9 h-9 rounded-full
          flex items-center justify-center text-sm font-bold
          bg-gradient-to-br ${agentConfig.color}
        `}>
          <span className="text-white">{agentConfig.avatar}</span>
        </div>
      );
    }

    // 默认 Agent 头像
    return (
      <div className={`
        flex-shrink-0 w-9 h-9 rounded-full
        flex items-center justify-center
        bg-gradient-to-br from-[#C02C38] to-[#E85D75]
      `}>
        <Bot className="w-5 h-5 text-white" />
      </div>
    );
  };

  // 获取 Agent 名称
  const getAgentName = (message: ConversationMessage): string => {
    if (message.role === 'user') return currentUser.name;

    const agentType = getAgentTypeFromMetadata(message.metadata);
    const agentConfig = agentType ? AGENT_CONFIG[agentType as keyof typeof AGENT_CONFIG] : null;

    return agentConfig?.name || '津脉助手';
  };

  // 渲染风格选择器
  const renderStyleOptions = (metadata?: any) => {
    if (!metadata?.styles || !Array.isArray(metadata.styles)) return null;

    return (
      <div className="mt-3">
        <div className={`
          flex items-center gap-2 mb-2 text-xs font-medium
          ${isDark ? 'text-gray-400' : 'text-gray-600'}
        `}>
          <Palette className="w-3.5 h-3.5" />
          <span>选择风格</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {metadata.styles.slice(0, 4).map((style: any, idx: number) => (
            <div
              key={idx}
              className={`
                p-2 rounded-lg border-2 border-dashed
                ${isDark ? 'border-gray-700 bg-gray-800/50' : 'border-gray-300 bg-gray-50'}
              `}
            >
              {style.thumbnail && (
                <img src={style.thumbnail} alt={style.name} className="w-full h-16 object-cover rounded mb-1" />
              )}
              <p className={`text-xs text-center ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                {style.name}
              </p>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染设计类型选项
  const renderDesignTypeOptions = (metadata?: any) => {
    if (!metadata?.designTypeOptions || !Array.isArray(metadata.designTypeOptions)) return null;

    return (
      <div className="mt-3">
        <div className={`
          flex items-center gap-2 mb-2 text-xs font-medium
          ${isDark ? 'text-gray-400' : 'text-gray-600'}
        `}>
          <Wand2 className="w-3.5 h-3.5" />
          <span>选择设计类型</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {metadata.designTypeOptions.slice(0, 4).map((option: any, idx: number) => (
            <div
              key={idx}
              className={`
                p-2 rounded-lg border text-center
                ${isDark ? 'border-gray-700 bg-gray-800/50 text-gray-300' : 'border-gray-200 bg-gray-50 text-gray-700'}
              `}
            >
              <span className="text-lg mr-1">{option.icon}</span>
              <span className="text-xs">{option.label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染满意度检查
  const renderSatisfactionCheck = (metadata?: any) => {
    if (!metadata?.showSatisfactionCheck) return null;

    return (
      <div className={`
        mt-3 p-3 rounded-lg
        ${isDark ? 'bg-green-900/20 border border-green-800/30' : 'bg-green-50 border border-green-200'}
      `}>
        <div className="flex items-center gap-2 mb-2">
          <CheckCircle className={`w-4 h-4 ${isDark ? 'text-green-400' : 'text-green-600'}`} />
          <span className={`text-xs font-medium ${isDark ? 'text-green-400' : 'text-green-700'}`}>
            满意度确认
          </span>
        </div>
        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
          对当前设计成果进行满意度评价
        </p>
      </div>
    );
  };

  // 渲染衍生选项
  const renderDerivativeOptions = (metadata?: any) => {
    if (!metadata?.derivativeOptions || !Array.isArray(metadata.derivativeOptions)) return null;

    return (
      <div className="mt-3">
        <div className={`
          flex items-center gap-2 mb-2 text-xs font-medium
          ${isDark ? 'text-gray-400' : 'text-gray-600'}
        `}>
          <Sparkles className="w-3.5 h-3.5" />
          <span>衍生创作选项</span>
        </div>
        <div className="space-y-1">
          {metadata.derivativeOptions.slice(0, 3).map((option: any, idx: number) => (
            <div
              key={idx}
              className={`
                p-2 rounded-lg text-xs
                ${isDark ? 'bg-purple-900/20 text-purple-300' : 'bg-purple-50 text-purple-700'}
              `}
            >
              {option.title}
            </div>
          ))}
        </div>
      </div>
    );
  };

  // 渲染思考过程
  const renderThinking = (message: ConversationMessage) => {
    const isExpanded = expandedMessages.has(message.id);
    const hasThinking = message.metadata?.thinking || message.type === 'thinking';

    if (!hasThinking) return null;

    return (
      <div className="mt-3">
        <button
          onClick={() => toggleExpand(message.id)}
          className={`
            flex items-center gap-1 text-xs
            ${isDark ? 'text-amber-400 hover:text-amber-300' : 'text-amber-600 hover:text-amber-700'}
          `}
        >
          <Lightbulb className="w-3 h-3" />
          <span>思考过程</span>
          {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
        </button>
        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className={`
                mt-2 p-3 rounded-lg text-xs overflow-hidden
                ${isDark ? 'bg-amber-900/20 text-amber-200/70' : 'bg-amber-50 text-amber-800'}
              `}
            >
              <pre className="whitespace-pre-wrap font-mono">
                {message.metadata?.thinking || message.content}
              </pre>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  };

  // 渲染图片
  const renderImages = (metadata?: any) => {
    const images = metadata?.images || (metadata?.imageUrl ? [metadata.imageUrl] : []);

    if (!images || images.length === 0) return null;

    return (
      <div className="mt-3 space-y-2">
        {images.map((img: string, idx: number) => (
          <div key={idx} className="rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
            <img
              src={img}
              alt={`生成的图片 ${idx + 1}`}
              className="w-full h-auto max-h-64 object-contain bg-gray-100 dark:bg-gray-800"
            />
          </div>
        ))}
      </div>
    );
  };

  // 渲染快速操作按钮
  const renderQuickActions = (metadata?: any) => {
    if (!metadata?.quickActions || !Array.isArray(metadata.quickActions)) return null;

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {metadata.quickActions.slice(0, 3).map((action: any, idx: number) => (
          <span
            key={idx}
            className={`
              px-2 py-1 rounded-full text-xs
              ${isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-50 text-blue-700'}
            `}
          >
            {action.label}
          </span>
        ))}
      </div>
    );
  };

  if (messages.length === 0) {
    return (
      <div className={`
        flex flex-col items-center justify-center py-12
        ${isDark ? 'text-gray-500' : 'text-gray-400'}
      `}>
        <MessageSquare className="w-10 h-10 mb-3 opacity-50" />
        <p className="text-sm">暂无对话记录</p>
      </div>
    );
  }

  // 在回放模式下，只显示到当前回放索引的消息（至少显示第一条）
  const displayMessages = isReplayMode ? messages.slice(0, Math.max(replayIndex, 1)) : messages;
  const progress = messages.length > 0 ? (Math.max(replayIndex, 1) / messages.length) * 100 : 0;

  // 自动滚动到最新消息
  useEffect(() => {
    if (isReplayMode && displayMessages.length > 0 && lastMessageRef.current) {
      // 使用 smooth 滚动到最新消息
      lastMessageRef.current.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'end',
        inline: 'nearest'
      });
    }
  }, [replayIndex, isReplayMode, displayMessages.length]);

  return (
    <div className="space-y-5">
      {/* 回放控制栏 */}
      {isReplayMode && (
        <div className={`
          sticky top-0 z-10 p-3 rounded-xl mb-4
          ${isDark ? 'bg-[#1a1f1a] border border-gray-800' : 'bg-white border border-gray-200 shadow-sm'}
        `}>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
              回放进度: {Math.max(replayIndex, 1)}/{messages.length}
            </span>
            <div className="flex items-center gap-2">
              {/* 速度控制 */}
              <select
                value={replaySpeed}
                onChange={(e) => setReplaySpeed(Number(e.target.value))}
                className={`
                  text-xs px-2 py-1 rounded
                  ${isDark ? 'bg-gray-800 text-gray-300 border-gray-700' : 'bg-gray-100 text-gray-700 border-gray-200'}
                  border
                `}
              >
                <option value={0.5}>0.5x</option>
                <option value={1}>1x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
              {/* 控制按钮 */}
              <button
                onClick={resetReplay}
                className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                title="重置"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
              {isPlaying ? (
                <button
                  onClick={pauseReplay}
                  className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                  title="暂停"
                >
                  <Pause className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={replayIndex >= messages.length ? startReplay : resumeReplay}
                  className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                  title={replayIndex >= messages.length ? "重新播放" : "播放"}
                >
                  <Play className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={skipToEnd}
                className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'}`}
                title="跳到结尾"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>
          </div>
          {/* 进度条 */}
          <div className={`
            h-1.5 rounded-full overflow-hidden
            ${isDark ? 'bg-gray-800' : 'bg-gray-200'}
          `}>
            <motion.div
              className="h-full bg-gradient-to-r from-[#C02C38] to-[#E85D75]"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>
      )}

      {displayMessages.map((message, index) => {
        const isUser = message.role === 'user';
        const agentName = getAgentName(message);
        const isLastMessage = index === displayMessages.length - 1;

        return (
          <motion.div
            key={message.id}
            ref={isLastMessage ? lastMessageRef : null}
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ 
              delay: isReplayMode ? 0 : index * 0.03,
              duration: 0.4,
              ease: [0.25, 0.46, 0.45, 0.94]
            }}
            className={`
              flex gap-3
              ${isUser ? 'flex-row-reverse' : 'flex-row'}
            `}
          >
            {/* 头像 */}
            {renderAvatar(message)}

            {/* 消息内容 */}
            <div className={`flex-1 ${isUser ? 'text-right' : 'text-left'}`}>
              {/* Agent 名称 */}
              {!isUser && (
                <span className={`
                  block mb-1 text-xs font-medium
                  ${isDark ? 'text-gray-500' : 'text-gray-500'}
                `}>
                  {agentName}
                </span>
              )}

              {/* 消息气泡 */}
              <div className={`
                inline-block max-w-[90%] rounded-2xl px-4 py-3
                text-left
                ${isUser
                  ? isDark
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-500 text-white'
                  : isDark
                    ? 'bg-[#1a1f1a] text-gray-100 border border-gray-800'
                    : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
                }
              `}>
                {/* 消息文本 - 使用 Markdown 渲染 */}
                {message.content && (
                  <div className={`prose prose-sm max-w-none text-left ${isDark ? 'prose-invert' : ''} ${isUser ? 'prose-white' : ''}`}>
                    <ReactMarkdown
                      components={{
                        // 段落样式
                        p: ({ children }) => (
                          <p className={`mb-2 last:mb-0 text-left leading-relaxed text-sm ${isUser ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                            {children}
                          </p>
                        ),
                        // 粗体样式
                        strong: ({ children }) => (
                          <strong className={`font-bold ${isUser ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                            {children}
                          </strong>
                        ),
                        // 斜体样式
                        em: ({ children }) => (
                          <em className={`italic ${isUser ? 'text-white/90' : isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                            {children}
                          </em>
                        ),
                        // 标题样式
                        h1: ({ children }) => (
                          <h1 className={`text-lg font-bold mb-2 mt-3 ${isUser ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                            {children}
                          </h1>
                        ),
                        h2: ({ children }) => (
                          <h2 className={`text-base font-bold mb-2 mt-3 ${isUser ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                            {children}
                          </h2>
                        ),
                        h3: ({ children }) => (
                          <h3 className={`text-sm font-bold mb-1 mt-2 ${isUser ? 'text-white' : isDark ? 'text-white' : 'text-gray-900'}`}>
                            {children}
                          </h3>
                        ),
                        // 列表样式
                        ul: ({ children }) => (
                          <ul className={`list-disc list-inside mb-2 space-y-1 ${isUser ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {children}
                          </ul>
                        ),
                        ol: ({ children }) => (
                          <ol className={`list-decimal list-inside mb-2 space-y-1 ${isUser ? 'text-white' : isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {children}
                          </ol>
                        ),
                        li: ({ children }) => (
                          <li className="text-sm leading-relaxed">
                            {children}
                          </li>
                        ),
                        // 代码样式
                        code: ({ children }) => (
                          <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${isUser ? 'bg-white/20 text-white' : isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-800'}`}>
                            {children}
                          </code>
                        ),
                        // 代码块样式
                        pre: ({ children }) => (
                          <pre className={`p-3 rounded-lg overflow-x-auto mb-2 ${isUser ? 'bg-white/10' : isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
                            {children}
                          </pre>
                        ),
                        // 引用样式
                        blockquote: ({ children }) => (
                          <blockquote className={`border-l-4 pl-3 italic my-2 ${isUser ? 'border-white/30 text-white/80' : isDark ? 'border-gray-600 text-gray-400' : 'border-gray-300 text-gray-600'}`}>
                            {children}
                          </blockquote>
                        ),
                        // 链接样式
                        a: ({ children, href }) => (
                          <a href={href} className={`underline hover:no-underline ${isUser ? 'text-blue-200' : isDark ? 'text-blue-400' : 'text-blue-600'}`}>
                            {children}
                          </a>
                        ),
                        // 分隔线
                        hr: () => (
                          <hr className={`my-3 border-t ${isUser ? 'border-white/20' : isDark ? 'border-gray-700' : 'border-gray-200'}`} />
                        ),
                      }}
                    >
                      {message.content}
                    </ReactMarkdown>
                  </div>
                )}

                {/* 图片 */}
                {renderImages(message.metadata)}

                {/* 风格选择器 */}
                {renderStyleOptions(message.metadata)}

                {/* 设计类型选项 */}
                {renderDesignTypeOptions(message.metadata)}

                {/* 满意度检查 */}
                {renderSatisfactionCheck(message.metadata)}

                {/* 衍生选项 */}
                {renderDerivativeOptions(message.metadata)}

                {/* 快速操作 */}
                {renderQuickActions(message.metadata)}

                {/* 思考过程 */}
                {renderThinking(message)}
              </div>

              {/* 时间戳 */}
              <span className={`
                block mt-1.5 text-xs
                ${isDark ? 'text-gray-600' : 'text-gray-400'}
              `}>
                {formatTime(message.timestamp)}
              </span>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
};

export default ConversationPanel;
