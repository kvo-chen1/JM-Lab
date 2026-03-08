import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../hooks/useAgentStore';
import { AgentMessage, AGENT_CONFIG, AgentType } from '../types/agent';
import AgentAvatar from './AgentAvatar';
import StyleSelector from './StyleSelector';
import ThinkingProcess from './ThinkingProcess';
import { ChevronDown, ChevronUp, Lightbulb, Wand2, ArrowRight, Users } from 'lucide-react';

interface ChatMessageProps {
  message: AgentMessage;
  isLast?: boolean;
}

export default function ChatMessage({ message, isLast = false }: ChatMessageProps) {
  const { isDark } = useTheme();
  const { setShowThinkingProcess, showThinkingProcess, addMessage, setShowSatisfactionModal } = useAgentStore();
  const [isExpanded, setIsExpanded] = useState(false);

  // 处理满意度检查 - 满意
  const handleSatisfied = () => {
    // 添加用户反馈消息
    addMessage({
      role: 'user',
      content: '满意，继续下一步',
      type: 'text'
    });

    // 添加设计师回复
    addMessage({
      role: 'designer',
      content: '太好了！你对设计满意我很高兴。接下来我可以为你制作：\n\n• **短视频** - 15秒以内的社交媒体视频\n• **剧情故事短片** - 有情节的动画短片\n• **文创周边** - 产品包装、文创商品设计\n• **宣传海报** - 多尺寸宣传物料\n\n你想先制作哪一个？',
      type: 'derivative-options'
    });

    // 关闭满意度弹窗
    setShowSatisfactionModal(false);
  };

  // 处理满意度检查 - 不满意
  const handleNotSatisfied = () => {
    // 添加用户反馈消息
    addMessage({
      role: 'user',
      content: '差点意思，我要修改',
      type: 'text'
    });

    // 添加设计师回复
    addMessage({
      role: 'designer',
      content: '没问题！请告诉我具体需要调整的地方，比如：\n\n• 颜色偏好\n• 风格调整\n• 元素增减\n• 构图变化\n\n我会根据你的反馈重新设计。',
      type: 'text'
    });

    // 关闭满意度弹窗
    setShowSatisfactionModal(false);
  };

  const isUser = message.role === 'user';
  const agentRole = message.role as AgentType;

  // 动画配置
  const messageVariants = {
    hidden: {
      opacity: 0,
      y: 20,
      scale: 0.95
    },
    visible: {
      opacity: 1,
      y: 0,
      scale: 1,
      transition: {
        type: 'spring',
        stiffness: 350,
        damping: 25
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.2 }
    }
  };

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取 Agent 名称和颜色
  const getAgentInfo = (role: AgentType) => {
    switch (role) {
      case 'director':
        return { name: AGENT_CONFIG.director.name, color: 'text-amber-500', bgColor: 'from-amber-500 to-orange-600' };
      case 'designer':
        return { name: AGENT_CONFIG.designer.name, color: 'text-cyan-500', bgColor: 'from-cyan-500 to-blue-600' };
      case 'illustrator':
        return { name: AGENT_CONFIG.illustrator.name, color: 'text-pink-500', bgColor: 'from-pink-500 to-rose-600' };
      case 'copywriter':
        return { name: AGENT_CONFIG.copywriter.name, color: 'text-emerald-500', bgColor: 'from-emerald-500 to-teal-600' };
      case 'animator':
        return { name: AGENT_CONFIG.animator.name, color: 'text-violet-500', bgColor: 'from-violet-500 to-purple-600' };
      case 'researcher':
        return { name: AGENT_CONFIG.researcher.name, color: 'text-slate-500', bgColor: 'from-slate-500 to-gray-600' };
      default:
        return { name: '系统', color: 'text-gray-500', bgColor: 'from-gray-500 to-gray-600' };
    }
  };

  // 渲染委派指示器
  const renderDelegationIndicator = () => {
    if (!message.metadata?.delegationInfo) return null;

    const { fromAgent, toAgent, reasoning } = message.metadata.delegationInfo;
    const fromInfo = getAgentInfo(fromAgent);
    const toInfo = getAgentInfo(toAgent);

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs mb-3 ${
          isDark ? 'bg-gray-800/80 border border-gray-700' : 'bg-gray-50 border border-gray-200'
        }`}
      >
        <span className={`font-medium ${fromInfo.color}`}>{fromInfo.name}</span>
        <ArrowRight className="w-3 h-3 text-gray-400" />
        <span className={`font-medium ${toInfo.color}`}>{toInfo.name}</span>
        <span className="text-gray-400 ml-2">{reasoning}</span>
      </motion.div>
    );
  };

  // 渲染协作指示器
  const renderCollaborationIndicator = () => {
    if (!message.metadata?.collaborationInfo) return null;

    const { participatingAgents, taskDescription, progress } = message.metadata.collaborationInfo;

    return (
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className={`flex flex-col gap-2 px-3 py-2 rounded-lg text-xs mb-3 ${
          isDark ? 'bg-gray-800/80 border border-gray-700' : 'bg-gray-50 border border-gray-200'
        }`}
      >
        <div className="flex items-center gap-2">
          <Users className="w-3 h-3 text-gray-400" />
          <span className="text-gray-500">协作任务：</span>
          <span className="text-gray-700 dark:text-gray-300">{taskDescription}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-gray-500">参与成员：</span>
          <div className="flex -space-x-1">
            {participatingAgents.map((agent, index) => (
              <div key={index} className="w-5 h-5 rounded-full bg-gradient-to-br from-gray-400 to-gray-500 flex items-center justify-center text-[8px] text-white border-2 border-white dark:border-gray-800">
                {AGENT_CONFIG[agent]?.avatar || '?'}
              </div>
            ))}
          </div>
        </div>
        {progress < 100 && (
          <div className="w-full h-1 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-cyan-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.5 }}
            />
          </div>
        )}
      </motion.div>
    );
  };

  // 渲染消息内容
  const renderContent = () => {
    switch (message.type) {
      case 'style-options':
        return (
          <div className="space-y-4">
            {renderDelegationIndicator()}
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            <StyleSelector />
            {message.metadata?.thinking && (
              <ThinkingProcess thinking={message.metadata.thinking} />
            )}
          </div>
        );

      case 'thinking':
        return (
          <div className="space-y-3">
            {renderDelegationIndicator()}
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            {message.metadata?.thinking && (
              <ThinkingProcess thinking={message.metadata.thinking} />
            )}
          </div>
        );

      case 'delegation':
        return (
          <div className="space-y-3">
            {renderDelegationIndicator()}
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
          </div>
        );

      case 'collaboration':
        return (
          <div className="space-y-3">
            {renderCollaborationIndicator()}
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            {renderDelegationIndicator()}
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            {message.metadata?.images && (
              <div className="grid grid-cols-2 gap-2">
                {message.metadata.images.map((image, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="rounded-lg overflow-hidden border-2 border-transparent hover:border-[#C02C38] transition-colors cursor-pointer"
                  >
                    <img
                      src={image}
                      alt={`Generated ${index + 1}`}
                      className="w-full h-32 object-cover"
                    />
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        );

      case 'satisfaction-check':
        return (
          <div className="space-y-4">
            {renderDelegationIndicator()}
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            <div className="flex gap-3">
              <motion.button
                onClick={handleSatisfied}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-medium shadow-lg shadow-green-500/25"
              >
                ✓ 满意，继续下一步
              </motion.button>
              <motion.button
                onClick={handleNotSatisfied}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-medium ${
                  isDark
                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                ✕ 差点意思，我要修改
              </motion.button>
            </div>
          </div>
        );

      case 'derivative-options':
        return (
          <div className="space-y-4">
            {renderDelegationIndicator()}
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            {message.metadata?.derivativeOptions && (
              <div className="space-y-2">
                {message.metadata.derivativeOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    whileHover={{ scale: 1.01, x: 4 }}
                    whileTap={{ scale: 0.99 }}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-colors ${
                      isDark
                        ? 'bg-gray-800/50 hover:bg-gray-800 border border-gray-700'
                        : 'bg-white hover:bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      isDark ? 'bg-gray-700' : 'bg-gray-100'
                    }`}>
                      <Wand2 className="w-5 h-5 text-[#C02C38]" />
                    </div>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {option.title}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {option.description}
                      </p>
                    </div>
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        );

      case 'text':
      default:
        return (
          <div className="space-y-3">
            {renderDelegationIndicator()}
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {message.content.split('\n').map((line, index) => {
                // 处理列表项（支持加粗）
                if (line.trim().startsWith('•')) {
                  const content = line.trim().substring(1).trim();
                  // 解析加粗文本 **text**
                  const parts = content.split(/(\*\*[^*]+\*\*)/g);
                  return (
                    <p key={index} className={`ml-4 mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      • {parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={i} className={isDark ? 'text-white' : 'text-gray-900'}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      })}
                    </p>
                  );
                }
                // 处理数字列表（支持加粗）
                if (/^\d+\./.test(line.trim())) {
                  const match = line.trim().match(/^(\d+)\.\s*(.+)$/);
                  if (match) {
                    const [, num, content] = match;
                    // 解析加粗文本 **text**
                    const parts = content.split(/(\*\*[^*]+\*\*)/g);
                    return (
                      <p key={index} className={`ml-4 mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {num}. {parts.map((part, i) => {
                          if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={i} className={isDark ? 'text-white' : 'text-gray-900'}>{part.slice(2, -2)}</strong>;
                          }
                          return part;
                        })}
                      </p>
                    );
                  }
                }
                // 处理整行加粗
                if (line.startsWith('**') && line.endsWith('**')) {
                  return (
                    <p key={index} className={`font-bold mt-3 mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {line.replace(/\*\*/g, '')}
                    </p>
                  );
                }
                // 处理普通文本中的加粗
                const parts = line.split(/(\*\*[^*]+\*\*)/g);
                if (parts.length > 1) {
                  return (
                    <p key={index} className={`mb-1 last:mb-0 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                      {parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                          return <strong key={i} className={isDark ? 'text-white' : 'text-gray-900'}>{part.slice(2, -2)}</strong>;
                        }
                        return part;
                      })}
                    </p>
                  );
                }
                return (
                  <p key={index} className={`mb-1 last:mb-0 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {line}
                  </p>
                );
              })}
            </div>
          </div>
        );
    }
  };

  // 获取气泡样式
  const getBubbleStyle = () => {
    if (isUser) {
      return `bg-gradient-to-br from-[#C02C38] to-[#E85D75] text-white rounded-2xl rounded-tr-sm`;
    }

    const agentInfo = getAgentInfo(agentRole);

    switch (agentRole) {
      case 'director':
        return `${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border rounded-2xl rounded-tl-sm`;
      case 'designer':
        return `${isDark ? 'bg-gray-800/80 border-gray-700/50' : 'bg-white/80 border-gray-200/50'} border rounded-2xl rounded-tl-sm`;
      case 'illustrator':
        return `${isDark ? 'bg-pink-900/20 border-pink-700/30' : 'bg-pink-50 border-pink-200'} border rounded-2xl rounded-tl-sm`;
      case 'copywriter':
        return `${isDark ? 'bg-emerald-900/20 border-emerald-700/30' : 'bg-emerald-50 border-emerald-200'} border rounded-2xl rounded-tl-sm`;
      case 'animator':
        return `${isDark ? 'bg-violet-900/20 border-violet-700/30' : 'bg-violet-50 border-violet-200'} border rounded-2xl rounded-tl-sm`;
      case 'researcher':
        return `${isDark ? 'bg-slate-800/80 border-slate-700/50' : 'bg-slate-50 border-slate-200'} border rounded-2xl rounded-tl-sm`;
      default:
        return `${isDark ? 'bg-gray-800' : 'bg-gray-100'} rounded-2xl rounded-tl-sm`;
    }
  };

  const agentInfo = getAgentInfo(agentRole);

  return (
    <motion.div
      variants={messageVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={`flex gap-3 ${isUser ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar */}
      <div className="flex-shrink-0">
        <AgentAvatar role={agentRole} size="md" />
      </div>

      {/* Message Content */}
      <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} max-w-[85%]`}>
        {/* Agent Name */}
        {!isUser && (
          <div className="flex items-center gap-2 mb-1">
            <span className={`text-xs font-medium ${agentInfo.color}`}>
              {agentInfo.name}
            </span>
            {message.metadata?.thinking && (
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full transition-colors ${
                  isDark
                    ? 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Lightbulb className="w-3 h-3" />
                思考过程
                {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
              </button>
            )}
          </div>
        )}

        {/* Bubble */}
        <div className={`px-4 py-3 shadow-sm ${getBubbleStyle()}`}>
          {renderContent()}
        </div>

        {/* Timestamp */}
        <span className={`text-xs mt-1 px-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </motion.div>
  );
}
