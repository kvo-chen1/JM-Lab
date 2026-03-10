import React, { useState, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../hooks/useAgentStore';
import { AgentMessage, AGENT_CONFIG, AgentType } from '../types/agent';
import AgentAvatar from './AgentAvatar';
import { AuthContext } from '@/contexts/authContext';
import StyleSelector from './StyleSelector';
import ThinkingProcess from './ThinkingProcess';
import ErrorDisplay from './ErrorDisplay';
import CharacterDesignWorkflow from './CharacterDesignWorkflow';
import ChainTaskProgress from './ChainTaskProgress';
import FeedbackButtons from './FeedbackButtons';
import DelegationIndicator from './DelegationIndicator';
import { generateVideo } from '../services/agentService';
import { AgentError } from '../types/errors';
import { ChevronDown, ChevronUp, Lightbulb, Wand2, ArrowRight, Users, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface ChatMessageProps {
  message: AgentMessage;
  isLast?: boolean;
}

// 视频消息内容组件
function VideoMessageContent({
  message,
  isDark,
  renderDelegationIndicator
}: {
  message: AgentMessage;
  isDark: boolean;
  renderDelegationIndicator: () => React.ReactNode;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const videoRef = React.useRef<HTMLVideoElement>(null);

  const handlePlay = () => {
    setIsPlaying(true);
  };

  const handleVideoError = () => {
    setError('视频加载失败');
    setIsLoading(false);
  };

  const handleVideoLoaded = () => {
    setIsLoading(false);
  };

  return (
    <div className="space-y-3">
      {renderDelegationIndicator()}
      <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
        {String(message.content || '').split('\n').map((line, index) => (
          <p key={index} className="mb-1 last:mb-0">
            {line}
          </p>
        ))}
      </div>
      {message.metadata?.videoUrl && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-lg overflow-hidden border-2 border-transparent hover:border-[#C02C38] transition-colors"
        >
          {isPlaying ? (
            <div className="relative bg-black">
              <video
                ref={videoRef}
                src={message.metadata.videoUrl}
                controls
                autoPlay
                className="w-full h-64 object-contain"
                onError={handleVideoError}
                onLoadedData={handleVideoLoaded}
              />
              {isLoading && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <Loader2 className="w-8 h-8 animate-spin text-white" />
                </div>
              )}
              {error && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/70">
                  <div className="text-center text-white">
                    <p className="text-sm mb-2">{error}</p>
                    <button
                      onClick={() => setIsPlaying(false)}
                      className="px-3 py-1 bg-white/20 rounded text-xs hover:bg-white/30"
                    >
                      返回缩略图
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="relative">
              <img
                src={message.metadata.thumbnail || message.metadata.videoUrl}
                alt="Video thumbnail"
                className="w-full h-48 object-cover"
              />
              <div
                className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer hover:bg-black/40 transition-colors"
                onClick={handlePlay}
              >
                <div className="w-16 h-16 rounded-full bg-white/90 flex items-center justify-center hover:scale-110 transition-transform shadow-lg">
                  <svg className="w-8 h-8 text-[#C02C38] ml-1" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                </div>
              </div>
            </div>
          )}
          <div className={`p-2 text-xs text-center flex items-center justify-center gap-2 ${
            isDark ? 'bg-gray-800 text-gray-300' : 'bg-gray-100 text-gray-600'
          }`}>
            <span>AI生成的视频</span>
            <a
              href={message.metadata.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline"
              onClick={(e) => e.stopPropagation()}
            >
              下载
            </a>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default function ChatMessage({ message, isLast = false }: ChatMessageProps) {
  const { isDark } = useTheme();
  const { setShowThinkingProcess, showThinkingProcess, addMessage, setShowSatisfactionModal, generatedOutputs } = useAgentStore();
  const { user } = useContext(AuthContext);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

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
      content: '太好了！你对设计满意我很高兴。接下来我可以为你制作：\n\n• **短视频** - 5秒以内的社交媒体视频\n• **剧情故事短片** - 有情节的动画短片\n• **文创周边** - 产品包装、文创商品设计\n• **宣传海报** - 多尺寸宣传物料\n\n你想先制作哪一个？',
      type: 'derivative-options',
      metadata: {
        derivativeOptions: [
          {
            id: 'short-video',
            title: '短视频',
            description: '5秒以内的社交媒体视频'
          },
          {
            id: 'story-short-film',
            title: '剧情故事短片',
            description: '有情节的动画短片'
          },
          {
            id: 'cultural-products',
            title: '文创周边',
            description: '产品包装、文创商品设计'
          },
          {
            id: 'poster',
            title: '宣传海报',
            description: '多尺寸宣传物料'
          }
        ]
      }
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

  // 处理衍生内容选项
  const handleDerivativeOption = (option: any) => {
    // 添加用户选择消息
    addMessage({
      role: 'user',
      content: `我选择制作：${option.title}`,
      type: 'text'
    });

    // 根据选择的选项生成对应内容
    generateDerivativeContent(option);
  };

  // 生成衍生内容
  const generateDerivativeContent = async (option: any) => {
    // 添加生成中消息
    addMessage({
      role: 'designer',
      content: `好的！我现在开始为你制作 ${option.title}。请稍候，这可能需要几分钟时间...`,
      type: 'text'
    });

    try {
      // 根据不同类型生成不同内容
      switch (option.id) {
        case 'short-video':
        case 'story-short-film':
          setIsGeneratingVideo(true);
          toast.info('开始生成视频，请耐心等待...');

          // 获取最近生成的图片作为视频生成的参考
          const recentImage = generatedOutputs.find(out => out.type === 'image');
          const imageUrl = recentImage?.url;

          // 调用真实的视频生成API
          const videoResult = await generateVideo(
            `基于IP形象制作${option.title}，展示角色动态效果，适合社交媒体传播`,
            {
              duration: option.id === 'short-video' ? 5 : 10,
              resolution: '720p',
              aspectRatio: '9:16', // 竖屏适合短视频
              imageUrl
            }
          );

          setIsGeneratingVideo(false);
          toast.success('视频生成完成！');

          addMessage({
            role: 'designer',
            content: `${option.title}已生成！这是一个 ${option.id === 'short-video' ? '5' : '10'} 秒的视频，适合在社交媒体上使用。`,
            type: 'video',
            metadata: {
              videoUrl: videoResult.url,
              thumbnail: videoResult.thumbnail,
              videoId: videoResult.id
            }
          });
          break;

        case 'cultural-products':
          // 模拟文创周边生成（后续可以接入真实API）
          setTimeout(() => {
            addMessage({
              role: 'designer',
              content: `文创周边设计已完成！这是基于你的 IP 形象设计的文创产品。`,
              type: 'image',
              metadata: {
                images: [
                  'https://neeko-copilot.bytedance.net/api/text2image?prompt=cultural%20products%20design&size=1024x1024'
                ]
              }
            });
          }, 2000);
          break;

        case 'poster':
          // 模拟海报生成（后续可以接入真实API）
          setTimeout(() => {
            addMessage({
              role: 'designer',
              content: `宣传海报已生成！这是多尺寸的宣传物料设计。`,
              type: 'image',
              metadata: {
                images: [
                  'https://neeko-copilot.bytedance.net/api/text2image?prompt=promotional%20poster%20design&size=1024x1024'
                ]
              }
            });
          }, 2000);
          break;

        default:
          addMessage({
            role: 'designer',
            content: `已为你制作完成 ${option.title}！`,
            type: 'text'
          });
      }
    } catch (error) {
      setIsGeneratingVideo(false);
      console.error('视频生成失败:', error);
      toast.error(error instanceof Error ? error.message : '视频生成失败，请重试');

      addMessage({
        role: 'designer',
        content: `抱歉，${option.title}生成过程中出现了问题。请稍后重试，或者告诉我你想要调整的地方。`,
        type: 'text'
      });
    }
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
    
    // 使用 DelegationIndicator 组件
    return (
      <DelegationIndicator
        delegation={{
          id: message.id + '-delegation',
          fromAgent,
          toAgent,
          taskDescription: reasoning || '任务委派',
          context: reasoning || '',
          status: 'completed',
          createdAt: message.timestamp,
          completedAt: message.timestamp
        }}
        showDetails={true}
      />
    );
  };

  // 渲染协作指示器
  const renderCollaborationIndicator = () => {
    if (!message.metadata?.collaborationInfo && !message.metadata?.collaborationResults) return null;

    const collaborationInfo = message.metadata?.collaborationInfo;
    const collaborationResults = message.metadata?.collaborationResults;
    const participatingAgents = collaborationInfo?.participatingAgents || 
      (Array.isArray(collaborationResults) ? collaborationResults.map((result: any) => result?.agent).filter(Boolean) : []) || [];
    const taskDescription = collaborationInfo?.taskDescription || '协作任务';
    const progress = collaborationInfo?.progress || 100;

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
            {participatingAgents.map((agent: any, index: number) => (
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
        {Array.isArray(collaborationResults) && collaborationResults.length > 0 && (
          <div className="mt-1">
            <div className="text-gray-500 mb-1">协作结果：</div>
            <div className="space-y-1">
              {collaborationResults.map((result: any, index: number) => (
                <div key={index} className="flex gap-2">
                  <span className="font-medium text-xs" style={{ color: getAgentInfo(result.agent as AgentType).color }}>
                    {AGENT_CONFIG[result.agent as AgentType]?.name}
                  </span>
                  <span className="text-xs text-gray-400 truncate">
                    {result.content.substring(0, 50)}...
                  </span>
                </div>
              ))}
            </div>
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
              {String(message.content || '').split('\n').map((line, index) => (
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
              {String(message.content || '').split('\n').map((line, index) => (
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
              {String(message.content || '').split('\n').map((line, index) => (
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
              {String(message.content || '').split('\n').map((line, index) => (
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
              {String(message.content || '').split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            {Array.isArray(message.metadata?.images) && (
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

      case 'video':
        return (
          <VideoMessageContent
            message={message}
            isDark={isDark}
            renderDelegationIndicator={renderDelegationIndicator}
          />
        );

      case 'satisfaction-check':
        return (
          <div className="space-y-4">
            {renderDelegationIndicator()}
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {String(message.content || '').split('\n').map((line, index) => (
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
              {String(message.content || '').split('\n').map((line, index) => (
                <p key={index} className="mb-1 last:mb-0">
                  {line}
                </p>
              ))}
            </div>
            {Array.isArray(message.metadata?.derivativeOptions) && (
              <div className="space-y-2">
                {message.metadata.derivativeOptions.map((option) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleDerivativeOption(option)}
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

      case 'error':
        return (
          <div className="space-y-3">
            {renderDelegationIndicator()}
            <ErrorDisplay
              error={message.metadata?.error as AgentError}
              onRetry={message.metadata?.onRetry}
              onDismiss={message.metadata?.onDismiss}
              showDetails={message.metadata?.showDetails}
            />
          </div>
        );

      case 'character-workflow':
        return (
          <div className="space-y-3">
            {renderDelegationIndicator()}
            <CharacterDesignWorkflow />
          </div>
        );

      case 'chain-progress':
        return (
          <div className="space-y-3">
            {renderDelegationIndicator()}
            <ChainTaskProgress
              queue={message.metadata?.taskQueue}
              progress={message.metadata?.progress}
            />
          </div>
        );

      case 'text':
      default:
        return (
          <div className="space-y-3">
            {renderDelegationIndicator()}
            <div className={`prose prose-sm max-w-none ${isDark ? 'prose-invert' : ''}`}>
              {String(message.content || '').split('\n').map((line, index) => {
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
        <AgentAvatar role={agentRole} size="md" userAvatarUrl={user?.avatar_url || user?.avatar} />
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

        {/* Feedback Buttons - only for AI messages */}
        {!isUser && isLast && (
          <div className="mt-2">
            <FeedbackButtons
              messageId={message.id}
              messageContent={message.content}
              agentType={agentRole}
            />
          </div>
        )}
      </div>
    </motion.div>
  );
}
