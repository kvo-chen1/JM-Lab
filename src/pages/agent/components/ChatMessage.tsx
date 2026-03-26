import React, { useState, useContext, useMemo } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../hooks/useAgentStore';
import { AgentMessage, AGENT_CONFIG, AgentType } from '../types/agent';
import AgentAvatar from './AgentAvatar';
import { AuthContext } from '@/contexts/authContext';
import StyleSelector from './StyleSelector';
import BrandSelector from './BrandSelector';
import ThinkingProcess from './ThinkingProcess';
import ErrorDisplay from './ErrorDisplay';
import CharacterDesignWorkflow from './CharacterDesignWorkflow';
import ChainTaskProgress from './ChainTaskProgress';
import FeedbackButtons from './FeedbackButtons';
import DelegationIndicator from './DelegationIndicator';
import ThinkingProcessCard from './ThinkingProcessCard';
import { ThinkingDecisionPanel } from './thinking';
import { InlineThinkingProcess } from './ThinkingProcessPanel';
import type { ThinkingSession } from '../types/thinking';
import ImageLightbox from './ImageLightbox';
import ColorSchemeSelector, { parseColorSchemesFromContent, parseOptionsFromContent } from './ColorSchemeSelector';
import { generateVideo } from '../services/agentService';
import { AgentError } from '../types/errors';
import { ChevronDown, ChevronUp, Lightbulb, Wand2, Users, Loader2, Share2, LayoutTemplate, PanelRight, CheckCircle } from 'lucide-react';
import { analyzeContent, ContentAnalysisResult } from '../services/contentAnalyzer';
import { toast } from 'sonner';
import ReactMarkdown from 'react-markdown';
import { useNavigate } from 'react-router-dom';

interface ChatMessageProps {
  message: AgentMessage;
  isLast?: boolean;
  onOpenStyleLibrary?: () => void;
  onCloseStyleLibrary?: () => void;
  showStyleLibrary?: boolean;
  onOpenBrandLibrary?: () => void;
  onSetPendingDesignType?: (type: string | null) => void;
  onOptionSelect?: (option: any) => void;
}

// Markdown 内容渲染组件 - 美化版本
function MarkdownContent({ 
  content, 
  isDark,
  isUser = false,
  onOptionClick
}: { 
  content: string | unknown; 
  isDark: boolean;
  isUser?: boolean;
  onOptionClick?: (optionText: string) => void;
}) {
  const safeContent = typeof content === 'string' ? content : String(content || '');
  
  // 预处理内容：将方案标题转换为可点击的链接格式
  const processedContent = safeContent.replace(
    /(方案[ABC]：[^\n]+)/g,
    '[$1](option:$1)'
  );
  
  return (
    <div className={`prose prose-sm max-w-none text-left ${isDark ? 'prose-invert' : ''}`}>
      <ReactMarkdown
        components={{
          p: ({ children }) => (
            <p className={`mb-3 last:mb-0 text-left leading-relaxed ${
              isUser ? 'text-white' : isDark ? 'text-gray-200' : 'text-gray-700'
            }`}>
              {children}
            </p>
          ),
          a: ({ href, children }) => {
            // 检查是否是选项链接
            if (href?.startsWith('option:')) {
              const optionText = href.replace('option:', '');
              return (
                <button
                  onClick={() => onOptionClick?.(optionText)}
                  className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg font-medium transition-all cursor-pointer hover:scale-105 ${
                    isDark 
                      ? 'bg-[#C02C38]/20 text-[#E85D75] hover:bg-[#C02C38]/30 border border-[#C02C38]/30' 
                      : 'bg-[#C02C38]/10 text-[#C02C38] hover:bg-[#C02C38]/20 border border-[#C02C38]/20'
                  }`}
                >
                  {children}
                </button>
              );
            }
            return <a href={href}>{children}</a>;
          },
          strong: ({ children }) => (
            <strong className={`font-bold ${
              isUser 
                ? 'text-white' 
                : isDark 
                  ? 'text-[#E85D75]'  // 深色主题使用粉色
                  : 'text-[#C02C38]'  // 浅色主题使用红色
            }`}>
              {children}
            </strong>
          ),
          ul: ({ children }) => (
            <ul className="list-none mb-3 space-y-2.5 text-left pl-0">
              {children}
            </ul>
          ),
          li: ({ children }) => (
            <li className="flex items-start gap-3 text-left w-full group">
              <span className={`flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center text-xs font-bold ${
                isUser 
                  ? 'bg-white/20 text-white' 
                  : 'bg-gradient-to-br from-[#C02C38] to-[#E85D75] text-white shadow-sm'
              }`}>
                •
              </span>
              <span className={`flex-1 leading-relaxed ${
                isUser ? 'text-white/90' : isDark ? 'text-gray-300' : 'text-gray-600'
              }`}>
                {children}
              </span>
            </li>
          ),
          h1: ({ children }) => (
            <h1 className={`text-xl font-bold mb-4 pb-2 border-b-2 ${
              isUser 
                ? 'text-white border-white/20' 
                : isDark 
                  ? 'text-white border-[#C02C38]/50' 
                  : 'text-gray-900 border-[#C02C38]/30'
            }`}>
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className={`text-lg font-bold mb-3 mt-5 ${
              isUser 
                ? 'text-white' 
                : isDark 
                  ? 'text-[#E85D75]' 
                  : 'text-[#C02C38]'
            }`}>
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className={`text-base font-semibold mb-2 mt-4 ${
              isUser 
                ? 'text-white/90' 
                : isDark 
                  ? 'text-gray-200' 
                  : 'text-gray-700'
            }`}>
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className={`text-sm font-semibold mb-2 mt-3 ${
              isUser 
                ? 'text-white/80' 
                : isDark 
                  ? 'text-gray-300' 
                  : 'text-gray-600'
            }`}>
              {children}
            </h4>
          ),
          hr: () => (
            <hr className={`my-4 border-t ${
              isUser 
                ? 'border-white/20' 
                : isDark 
                  ? 'border-gray-700' 
                  : 'border-gray-200'
            }`} />
          ),
          code: ({ children }) => (
            <code className={`px-1.5 py-0.5 rounded text-xs font-mono ${
              isUser 
                ? 'bg-white/20 text-white' 
                : isDark 
                  ? 'bg-[#1E1E28] text-[#E85D75]' 
                  : 'bg-gray-100 text-[#C02C38]'
            }`}>
              {children}
            </code>
          ),
          blockquote: ({ children }) => (
            <blockquote className={`border-l-2 pl-3 my-2 italic ${
              isUser 
                ? 'border-white/30 text-white/80' 
                : isDark 
                  ? 'border-[#C02C38]/50 text-gray-400' 
                  : 'border-[#C02C38]/30 text-gray-500'
            }`}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto my-4 rounded-lg border border-gray-200 dark:border-gray-700">
              <table className={`w-full text-sm text-left ${
                isUser 
                  ? 'text-white/90' 
                  : isDark 
                    ? 'text-gray-300' 
                    : 'text-gray-700'
              }`}>
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={`text-xs uppercase ${
              isUser 
                ? 'bg-white/10 text-white' 
                : isDark 
                  ? 'bg-gray-800 text-gray-300' 
                  : 'bg-gray-50 text-gray-600'
            }`}>
              {children}
            </thead>
          ),
          tbody: ({ children }) => (
            <tbody className={`divide-y ${
              isUser 
                ? 'divide-white/10' 
                : isDark 
                  ? 'divide-gray-700' 
                  : 'divide-gray-200'
            }`}>
              {children}
            </tbody>
          ),
          tr: ({ children }) => (
            <tr className={`${
              isUser 
                ? 'hover:bg-white/5' 
                : isDark 
                  ? 'hover:bg-gray-800/50' 
                  : 'hover:bg-gray-50'
            } transition-colors`}>
              {children}
            </tr>
          ),
          th: ({ children }) => (
            <th className={`px-4 py-3 font-semibold ${
              isUser 
                ? 'text-white' 
                : isDark 
                  ? 'text-gray-200' 
                  : 'text-gray-800'
            }`}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={`px-4 py-3 ${
              isUser 
                ? 'text-white/90' 
                : isDark 
                  ? 'text-gray-300' 
                  : 'text-gray-600'
            }`}>
              {children}
            </td>
          ),
        }}
      >
        {processedContent}
      </ReactMarkdown>
    </div>
  );
}

// 视频消息内容组件
function VideoMessageContent({
  message,
  isDark,
  isUser,
  renderDelegationIndicator
}: {
  message: AgentMessage;
  isDark: boolean;
  isUser: boolean;
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
      <MarkdownContent content={message.content} isDark={isDark} isUser={isUser} />
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

export default function ChatMessage({
  message,
  isLast = false,
  onOpenStyleLibrary,
  onCloseStyleLibrary,
  showStyleLibrary = false,
  onOpenBrandLibrary,
  onSetPendingDesignType
}: ChatMessageProps) {
  const { isDark } = useTheme();
  const { setShowThinkingProcess, showThinkingProcess, addMessage, setShowSatisfactionModal, generatedOutputs, updateTaskRequirements, setCurrentAgent, messages } = useAgentStore();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isExpanded, setIsExpanded] = useState(false);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);

  // 智能内容分析
  const contentAnalysis = useMemo<ContentAnalysisResult>(() => {
    return analyzeContent(message);
  }, [message]);

  // 检查是否已自动添加到画布
  const isAutoAddedToCanvas = useMemo(() => {
    return generatedOutputs.some(
      output => output.metadata?.sourceMessageId === message.id
    );
  }, [generatedOutputs, message.id]);

  // 获取当前AI消息对应的用户查询
  const getUserQuery = () => {
    const messageIndex = messages.findIndex(m => m.id === message.id);
    if (messageIndex > 0) {
      // 向前查找最近一条用户消息
      for (let i = messageIndex - 1; i >= 0; i--) {
        if (messages[i].role === 'user') {
          return messages[i].content;
        }
      }
    }
    return '';
  };

  const userQuery = getUserQuery();

  // Lightbox 状态
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImageUrl, setLightboxImageUrl] = useState('');
  const [lightboxImageName, setLightboxImageName] = useState('');

  // 打开 Lightbox
  const handleImageClick = (imageUrl: string, imageName: string) => {
    setLightboxImageUrl(imageUrl);
    setLightboxImageName(imageName);
    setLightboxOpen(true);
  };

  // 发布到案例
  // 处理生成到画布
  const handleGenerateToCanvas = (type: 'design-spec' | 'derivatives') => {
    console.log('[ChatMessage] 生成到画布:', type);
    // 触发一个自定义事件，让父组件处理
    const event = new CustomEvent('generate-to-canvas', {
      detail: { type, message }
    });
    window.dispatchEvent(event);
    toast.success(type === 'design-spec' ? '正在生成设计规范...' : '正在生成衍生内容...');
  };

  const handlePublishToCase = () => {
    if (!message.metadata?.images || message.metadata.images.length === 0) {
      toast.error('没有可发布的图片');
      return;
    }

    // 收集所有图片URL
    const images = message.metadata.images.map((img: any) => 
      typeof img === 'string' ? img : img.url
    );

    // 获取用户查询作为标题基础
    const title = userQuery.slice(0, 20) + (userQuery.length > 20 ? '...' : '') || 'AI创作作品';
    
    // 构建发布数据
    const publishData = {
      title,
      description: userQuery,
      coverImage: images[0],
      images,
      conversationId: message.id,
    };

    // 跳转到发布页面（可以创建一个专门的发布页面，或者使用弹窗）
    // 这里我们先使用导航到案例页面，并传递数据
    navigate('/agent-cases/publish', { state: { publishData } });
    toast.success('准备发布案例...');
  };

  // 处理满意度检查 - 满意
  const handleSatisfied = () => {
    // 添加用户反馈消息
    addMessage({
      role: 'user',
      content: '满意，继续下一步',
      type: 'text'
    });

    // 添加设计师回复 - 提供细化设计选项
    addMessage({
      role: 'designer',
      content: '太好了！你对初稿满意我很高兴。接下来我可以为你：\n\n- **生成正式概念图** - 细化初稿设计，完善细节\n- **生成三视图** - 正面、侧面、背面全方位展示\n- **生成细节图** - 表情、动作等细节设计\n- **直接制作衍生内容** - 短视频、海报、文创周边等\n\n你想先进行哪一步？',
      type: 'refinement-options',
      metadata: {
        refinementOptions: [
          {
            id: 'formal-concept',
            title: '生成正式概念图',
            description: '细化初稿设计，完善细节',
            icon: '✨'
          },
          {
            id: 'three-view',
            title: '生成三视图',
            description: '正面、侧面、背面全方位展示',
            icon: '📐'
          },
          {
            id: 'detail-design',
            title: '生成细节图',
            description: '表情、动作等细节设计',
            icon: '🎨'
          },
          {
            id: 'derivative',
            title: '直接制作衍生内容',
            description: '短视频、海报、文创周边等',
            icon: '🚀'
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

  // 处理通用选项选择
  const handleOptionSelect = (option: any) => {
    console.log('[ChatMessage] 选项被点击:', option);

    // 如果有外部传入的处理函数，优先使用
    if (onOptionSelect) {
      onOptionSelect(option);
      return;
    }

    // 默认处理：添加用户选择消息并触发发送
    addMessage({
      role: 'user',
      content: option.label,
      type: 'text'
    });

    // 触发一个自定义事件，让 ChatPanel 处理后续逻辑
    window.dispatchEvent(new CustomEvent('option-selected', {
      detail: { option, message }
    }));
  };

  // 处理设计类型选项
  const handleDesignTypeOption = (option: any) => {
    console.log('[ChatMessage] 设计类型选项被点击:', option);

    // 添加用户选择消息
    addMessage({
      role: 'user',
      content: option.label,
      type: 'text'
    });

    toast.success(`已选择：${option.label}`);

    // 如果是品牌设计，显示品牌选择器消息（内嵌式）
    if (option.id === 'brand-design') {
      // 设置待处理的设计类型
      onSetPendingDesignType?.('brand-design');
      
      // 延迟一下，模拟Agent切换的效果
      setTimeout(() => {
        // 设置当前Agent为designer
        setCurrentAgent('designer');

        // 添加系统消息，显示Agent切换
        addMessage({
          role: 'system',
          content: `设计总监将任务委派给了津脉品牌设计师`,
          type: 'delegation',
          metadata: {
            delegationInfo: {
              fromAgent: 'director',
              toAgent: 'designer',
              taskDescription: option.label,
              reasoning: '根据设计类型智能分配：品牌设计由津脉品牌设计师负责'
            }
          }
        });

        // 添加designer的回复，包含品牌选择器
        addMessage({
          role: 'designer',
          content: `请选择一个品牌进行设计创作：`,
          type: 'brand-options',
          metadata: {
            showThinkingProcess: true,
            designType: option.id,
            agentType: 'designer'
          }
        });
      }, 500);
      return; // 不继续执行后续逻辑
    }

    // 根据设计类型确定对应的Agent
    const agentMapping: Record<string, { agent: AgentType; questions: string[] }> = {
      'ip-character': {
        agent: 'illustrator',
        questions: [
          '角色的性格特点是什么？',
          '有什么特别的元素或符号想要融入？',
          '目标受众是谁？'
        ]
      },
      'brand-design': {
        agent: 'designer',
        questions: [
          '品牌名称和核心理念是什么？',
          '希望传达什么样的品牌调性？',
          '主要应用场景有哪些？'
        ]
      },
      'packaging': {
        agent: 'designer',
        questions: [
          '是什么类型的产品？',
          '包装规格和材质有什么要求？',
          '目标消费群体是谁？'
        ]
      },
      'poster': {
        agent: 'designer',
        questions: [
          '海报的主题和用途是什么？',
          '需要什么尺寸和格式？',
          '是否有特定的文案或元素要求？'
        ]
      },
      'animation': {
        agent: 'animator',
        questions: [
          '动画的用途和场景是什么？',
          '需要什么风格（2D/3D/MG动画）？',
          '时长和分辨率要求？'
        ]
      },
      'illustration': {
        agent: 'illustrator',
        questions: [
          '插画的主题和用途是什么？',
          '喜欢什么风格（水彩/扁平/手绘）？',
          '需要什么尺寸和格式？'
        ]
      }
    };

    const mapping = agentMapping[option.id] || { agent: 'designer', questions: ['请描述一下你的具体需求'] };
    const agentConfig = AGENT_CONFIG[mapping.agent];

    // 获取 pendingMention 中的品牌/作品信息
    const { pendingMention } = useAgentStore.getState();
    const mentionInfo = pendingMention;

    // 更新任务类型，包含品牌信息
    updateTaskRequirements({
      projectType: option.id,
      description: option.description,
      mentionedBrand: mentionInfo?.name,  // 添加品牌信息
      mentionedBrandId: mentionInfo?.id,
      mentionedBrandType: mentionInfo?.type
    });

    // 延迟一下，模拟Agent切换的效果
    setTimeout(() => {
      // 设置当前Agent为选中的专业Agent
      setCurrentAgent(mapping.agent);

      // 添加系统消息，显示Agent切换
      addMessage({
        role: 'system',
        content: `设计总监将任务委派给了${agentConfig.name}`,
        type: 'delegation',
        metadata: {
          delegationInfo: {
            fromAgent: 'director',
            toAgent: mapping.agent,
            taskDescription: option.label,
            reasoning: `根据设计类型智能分配：${option.label}由${agentConfig.name}负责，专长：${agentConfig.capabilities.join('、')}`
          }
        }
      });

      // 添加对应Agent的回复 - 简洁标题 + 思考过程卡片
      addMessage({
        role: mapping.agent,
        content: `获取${option.label}的关键信息`,
        type: 'text',
        metadata: {
          showThinkingProcess: true,
          designType: option.id,
          agentType: mapping.agent,
          mentionInfo: mentionInfo
        }
      });
    }, 500);
  };

  // 处理细化设计选项
  const handleRefinementOption = (option: any) => {
    // 确保当前Agent是插画师
    setCurrentAgent('illustrator');

    // 添加用户选择消息
    addMessage({
      role: 'user',
      content: `我选择：${option.title}`,
      type: 'text'
    });

    // 根据选择的选项执行不同逻辑
    switch (option.id) {
      case 'formal-concept':
        // 生成正式概念图
        addMessage({
          role: 'illustrator',
          content: '好的！我来为你生成正式版概念图，会细化初稿的设计细节，让整体效果更加精致完善。请稍候...',
          type: 'text'
        });
        // 触发正式概念图生成 - 统一使用 trigger-auto-generation 事件
        setTimeout(() => {
          // 从 store 获取最新状态
          const { selectedStyle, currentTask } = useAgentStore.getState();
          console.log('[ChatMessage] 触发正式概念图生成，当前状态:', { selectedStyle, currentTask: currentTask ? '存在' : 'null' });
          
          if (!selectedStyle) {
            console.warn('[ChatMessage] 未选择风格，无法生成');
            addMessage({
              role: 'illustrator',
              content: '请先选择一个风格，然后再生成正式概念图。',
              type: 'text'
            });
            // 显示风格选择器
            const { setShowStyleSelector } = useAgentStore.getState();
            setShowStyleSelector(true);
            return;
          }
          
          if (!currentTask) {
            console.warn('[ChatMessage] 没有当前任务，无法生成');
            addMessage({
              role: 'illustrator',
              content: '请先创建一个设计任务，然后再生成正式概念图。',
              type: 'text'
            });
            return;
          }
          
          console.log('[ChatMessage] 条件满足，触发 trigger-auto-generation 事件');
          window.dispatchEvent(new CustomEvent('trigger-auto-generation'));
        }, 800);
        break;

      case 'three-view':
        // 生成三视图
        addMessage({
          role: 'illustrator',
          content: '好的！我来为你生成三视图，包含正面、侧面、背面三个角度的完整展示。请稍候...',
          type: 'text'
        });
        // 触发三视图生成 - 统一使用 trigger-auto-generation 事件
        setTimeout(() => {
          // 从 store 获取最新状态
          const { selectedStyle, currentTask } = useAgentStore.getState();
          console.log('[ChatMessage] 触发三视图生成，当前状态:', { selectedStyle, currentTask: currentTask ? '存在' : 'null' });
          
          if (!selectedStyle) {
            console.warn('[ChatMessage] 未选择风格，无法生成');
            addMessage({
              role: 'illustrator',
              content: '请先选择一个风格，然后再生成三视图。',
              type: 'text'
            });
            const { setShowStyleSelector } = useAgentStore.getState();
            setShowStyleSelector(true);
            return;
          }
          
          if (!currentTask) {
            console.warn('[ChatMessage] 没有当前任务，无法生成');
            addMessage({
              role: 'illustrator',
              content: '请先创建一个设计任务，然后再生成三视图。',
              type: 'text'
            });
            return;
          }
          
          console.log('[ChatMessage] 条件满足，触发 trigger-auto-generation 事件');
          window.dispatchEvent(new CustomEvent('trigger-auto-generation'));
        }, 800);
        break;

      case 'detail-design':
        // 生成细节图
        addMessage({
          role: 'illustrator',
          content: '好的！我来为你生成细节图，包含不同的表情和动作设计。请稍候...',
          type: 'text'
        });
        // 触发细节图生成 - 统一使用 trigger-auto-generation 事件
        setTimeout(() => {
          // 从 store 获取最新状态
          const { selectedStyle, currentTask } = useAgentStore.getState();
          console.log('[ChatMessage] 触发细节图生成，当前状态:', { selectedStyle, currentTask: currentTask ? '存在' : 'null' });
          
          if (!selectedStyle) {
            console.warn('[ChatMessage] 未选择风格，无法生成');
            addMessage({
              role: 'illustrator',
              content: '请先选择一个风格，然后再生成细节图。',
              type: 'text'
            });
            const { setShowStyleSelector } = useAgentStore.getState();
            setShowStyleSelector(true);
            return;
          }
          
          if (!currentTask) {
            console.warn('[ChatMessage] 没有当前任务，无法生成');
            addMessage({
              role: 'illustrator',
              content: '请先创建一个设计任务，然后再生成细节图。',
              type: 'text'
            });
            return;
          }
          
          console.log('[ChatMessage] 条件满足，触发 trigger-auto-generation 事件');
          window.dispatchEvent(new CustomEvent('trigger-auto-generation'));
        }, 800);
        break;

      case 'derivative':
        // 直接跳转到衍生内容 - 切换到品牌设计师
        setCurrentAgent('designer');
        addMessage({
          role: 'designer',
          content: '好的！既然你对初稿满意，我们可以直接开始制作衍生内容。接下来我可以为你制作：\n\n- **短视频** - 5秒以内的社交媒体视频\n- **剧情故事短片** - 有情节的动画短片\n- **文创周边** - 产品包装、文创商品设计\n- **宣传海报** - 多尺寸宣传物料\n\n你想先制作哪一个？',
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
        break;

      default:
        break;
    }
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

  const isUser = message?.role === 'user';
  const agentRole = message?.role as AgentType;

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

  // 格式化时间 - 支持相对时间
  const formatTime = (timestamp: number) => {
    const now = Date.now();
    const diff = now - timestamp;

    // 小于1分钟显示"刚刚"
    if (diff < 60000) {
      return '刚刚';
    }

    // 小于1小时显示"X分钟前"
    if (diff < 3600000) {
      const minutes = Math.floor(diff / 60000);
      return `${minutes}分钟前`;
    }

    // 小于24小时显示"X小时前"
    if (diff < 86400000) {
      const hours = Math.floor(diff / 3600000);
      return `${hours}小时前`;
    }

    // 否则显示具体时间
    const date = new Date(timestamp);
    return date.toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // 获取 Agent 名称和颜色 - 优化深色主题
  const getAgentInfo = (role: AgentType) => {
    switch (role) {
      case 'director':
        return { 
          name: AGENT_CONFIG.director.name, 
          color: isDark ? 'text-[#A78BFA]' : 'text-amber-500', 
          bgColor: 'from-amber-500 to-orange-600' 
        };
      case 'designer':
        return { 
          name: AGENT_CONFIG.designer.name, 
          color: isDark ? 'text-[#A78BFA]' : 'text-cyan-500', 
          bgColor: 'from-cyan-500 to-blue-600' 
        };
      case 'illustrator':
        return { 
          name: AGENT_CONFIG.illustrator.name, 
          color: isDark ? 'text-[#A78BFA]' : 'text-pink-500', 
          bgColor: 'from-pink-500 to-rose-600' 
        };
      case 'copywriter':
        return { 
          name: AGENT_CONFIG.copywriter.name, 
          color: isDark ? 'text-[#A78BFA]' : 'text-emerald-500', 
          bgColor: 'from-emerald-500 to-teal-600' 
        };
      case 'animator':
        return { 
          name: AGENT_CONFIG.animator.name, 
          color: isDark ? 'text-[#A78BFA]' : 'text-violet-500', 
          bgColor: 'from-violet-500 to-purple-600' 
        };
      case 'researcher':
        return { 
          name: AGENT_CONFIG.researcher.name, 
          color: isDark ? 'text-[#A78BFA]' : 'text-slate-500', 
          bgColor: 'from-slate-500 to-gray-600' 
        };
      default:
        return { name: '系统', color: isDark ? 'text-gray-400' : 'text-gray-500', bgColor: 'from-gray-500 to-gray-600' };
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
    if (!message || !message.type) {
      console.error('[ChatMessage] message or message.type is undefined:', message);
      return null;
    }
    switch (message.type) {
      case 'style-options':
        return (
          <div className="space-y-4">
            {renderDelegationIndicator()}
            <MarkdownContent content={message.content} isDark={isDark} isUser={isUser} />
            <StyleSelector
              onOpenStyleLibrary={onOpenStyleLibrary}
              onCloseStyleLibrary={onCloseStyleLibrary}
              showStyleLibrary={showStyleLibrary}
            />
            {message.metadata?.thinking && (
              <ThinkingProcess thinking={message.metadata.thinking} />
            )}
          </div>
        );

      case 'brand-options':
        return (
          <div className="space-y-4">
            {renderDelegationIndicator()}
            <MarkdownContent content={message.content} isDark={isDark} isUser={isUser} />
            {/* 如果已经选择了品牌，显示品牌信息；否则显示品牌选择器 */}
            {message.metadata?.selectedBrand ? (
              <div className={`p-3 rounded-lg ${isDark ? 'bg-[#C02C38]/10 border border-[#C02C38]/30' : 'bg-[#C02C38]/5 border border-[#C02C38]/20'}`}>
                <div className="flex items-center gap-2">
                  <span className={`text-xs px-2 py-0.5 rounded ${isDark ? 'bg-[#C02C38]/20 text-[#C02C38]' : 'bg-[#C02C38]/10 text-[#C02C38]'}`}>
                    已选品牌
                  </span>
                  <span className={`font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                    {message.metadata.selectedBrand.name}
                  </span>
                </div>
                {message.metadata.selectedBrand.story && (
                  <p className={`mt-2 text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {message.metadata.selectedBrand.story}
                  </p>
                )}
              </div>
            ) : (
              <BrandSelector
                onBrandSelect={(brand) => {
                  // 触发品牌选择事件，让 ChatPanel 处理
                  window.dispatchEvent(new CustomEvent('brand-selected-for-design', { detail: brand }));
                }}
                onOpenBrandLibrary={() => {
                  onSetPendingDesignType?.('brand-design');
                  onOpenBrandLibrary?.();
                }}
                showBrandLibrary={false}
              />
            )}
            {message.metadata?.thinking && (
              <ThinkingProcess thinking={message.metadata.thinking} />
            )}
          </div>
        );

      case 'thinking':
        return (
          <div className="space-y-3">
            {renderDelegationIndicator()}
            <MarkdownContent content={message.content} isDark={isDark} isUser={isUser} />
            {message.metadata?.thinkingSession && (
              <ThinkingDecisionPanel
                steps={message.metadata.thinkingSession.steps}
                currentStepIndex={message.metadata.thinkingSession.currentStepIndex}
                isExpanded={message.metadata.thinkingSession.isExpanded || false}
                isDark={isDark}
              />
            )}
            {message.metadata?.thinking && !message.metadata?.thinkingSession && (
              <ThinkingProcess thinking={message.metadata.thinking} />
            )}
            {/* V2 版本思考过程 */}
            {message.metadata?.thinkingSteps && (
              <InlineThinkingProcess steps={message.metadata.thinkingSteps} />
            )}
          </div>
        );

      case 'delegation':
        return (
          <div className="space-y-3">
            {renderDelegationIndicator()}
            <MarkdownContent content={message.content} isDark={isDark} isUser={isUser} />
            {/* V2 版本思考过程 */}
            {message.metadata?.thinkingSteps && (
              <InlineThinkingProcess steps={message.metadata.thinkingSteps} />
            )}
          </div>
        );

      case 'collaboration':
        return (
          <div className="space-y-3">
            {renderCollaborationIndicator()}
            <MarkdownContent content={message.content} isDark={isDark} isUser={isUser} />
            {/* V2 版本思考过程 */}
            {message.metadata?.thinkingSteps && (
              <InlineThinkingProcess steps={message.metadata.thinkingSteps} />
            )}
          </div>
        );

      case 'image':
        return (
          <div className="space-y-3">
            {renderDelegationIndicator()}
            <MarkdownContent content={message.content} isDark={isDark} isUser={isUser} />
            {Array.isArray(message.metadata?.images) && (
              <div className="grid grid-cols-2 gap-2">
                {message.metadata.images.map((image, index) => {
                  // 支持两种格式：字符串 URL 或对象 { url, thumbnail, name, size }
                  const imageUrl = typeof image === 'string' ? image : image.url;
                  const imageName = typeof image === 'string' ? `Generated ${index + 1}` : (image.name || `Generated ${index + 1}`);
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: index * 0.1 }}
                      className="rounded-lg overflow-hidden border-2 border-transparent hover:border-[#C02C38] transition-colors cursor-pointer"
                      onClick={() => handleImageClick(imageUrl, imageName)}
                    >
                      <img
                        src={imageUrl}
                        alt={imageName}
                        className="w-full h-32 object-cover"
                        onError={(e) => {
                          console.error('[ChatMessage] 图片加载失败:', imageUrl);
                          e.currentTarget.src = '/fallback-image.png';
                        }}
                      />
                    </motion.div>
                  );
                })}
              </div>
            )}
            {/* 显示思考过程 */}
            {message.metadata?.thinking && (
              <ThinkingProcess thinking={message.metadata.thinking} />
            )}

            {/* 发布到案例按钮 */}
            {Array.isArray(message.metadata?.images) && message.metadata.images.length > 0 && (
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handlePublishToCase}
                className={`
                  flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                  transition-colors mt-3
                  ${isDark 
                    ? 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white hover:opacity-90' 
                    : 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white hover:opacity-90'
                  }
                `}
              >
                <Share2 className="w-4 h-4" />
                <span>发布到案例</span>
              </motion.button>
            )}
          </div>
        );

      case 'video':
        return (
          <VideoMessageContent
            message={message}
            isDark={isDark}
            isUser={isUser}
            renderDelegationIndicator={renderDelegationIndicator}
          />
        );

      case 'satisfaction-check':
        return (
          <div className="space-y-4">
            {renderDelegationIndicator()}
            <MarkdownContent content={message.content} isDark={isDark} isUser={isUser} />
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

      case 'refinement-options':
        return (
          <div className="space-y-4">
            {renderDelegationIndicator()}
            <MarkdownContent content={message.content} isDark={isDark} isUser={isUser} />
            {Array.isArray(message.metadata?.refinementOptions) && (
              <div className="grid grid-cols-2 gap-3">
                {message.metadata.refinementOptions.map((option: any, index: number) => (
                  <motion.button
                    key={option.id}
                    onClick={() => handleRefinementOption(option)}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    whileTap={{ scale: 0.97 }}
                    className={`group relative p-4 rounded-2xl text-left overflow-hidden transition-all duration-300 ${
                      isDark
                        ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 hover:border-[#C02C38]/50 hover:shadow-lg hover:shadow-[#C02C38]/10'
                        : 'bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/80 hover:border-[#C02C38]/40 hover:shadow-xl hover:shadow-[#C02C38]/10'
                    }`}
                  >
                    {/* 背景装饰 */}
                    <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 ${
                      isDark ? 'bg-[#C02C38]' : 'bg-[#C02C38]'
                    }`} />

                    <div className="relative flex items-start gap-3">
                      {/* 图标容器 */}
                      <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 ${
                        isDark
                          ? 'bg-gradient-to-br from-[#C02C38]/20 to-[#C02C38]/5'
                          : 'bg-gradient-to-br from-[#C02C38]/10 to-[#C02C38]/5'
                      }`}>
                        {option.icon}
                      </div>

                      {/* 文字内容 */}
                      <div className="flex-1 min-w-0">
                        <p className={`font-semibold text-sm mb-1 transition-colors group-hover:text-[#C02C38] ${
                          isDark ? 'text-gray-100' : 'text-gray-900'
                        }`}>
                          {option.title}
                        </p>
                        <p className={`text-xs leading-relaxed line-clamp-2 ${
                          isDark ? 'text-gray-400' : 'text-gray-500'
                        }`}>
                          {option.description}
                        </p>
                      </div>
                    </div>

                    {/* 底部指示条 */}
                    <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C02C38] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
                  </motion.button>
                ))}
              </div>
            )}
          </div>
        );

      case 'derivative-options':
        return (
          <div className="space-y-4">
            {renderDelegationIndicator()}
            <MarkdownContent content={message.content} isDark={isDark} isUser={isUser} />
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

      case 'design-type-options':
        return (
          <div className="space-y-4">
            {renderDelegationIndicator()}
            <MarkdownContent content={message.content} isDark={isDark} isUser={isUser} />
            {Array.isArray(message.metadata?.designTypeOptions) && (
              <div className="space-y-4">
                {message.metadata.designTypeOptions.map((category: any, catIndex: number) => (
                  <div key={catIndex} className="space-y-3">
                    {/* 分类标题 */}
                    <div className="flex items-center gap-2">
                      <span className="text-base">{category.category?.split(' ')[0]}</span>
                      <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {category.category?.split(' ').slice(1).join(' ')}
                      </span>
                    </div>
                    {/* 选项网格 */}
                    <div className="grid grid-cols-2 gap-3">
                      {category.items?.map((option: any, index: number) => (
                        <motion.button
                          key={option.id}
                          onClick={() => handleDesignTypeOption(option)}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: (catIndex * 2 + index) * 0.1 }}
                          whileHover={{ scale: 1.03, y: -4 }}
                          whileTap={{ scale: 0.97 }}
                          className={`group relative p-4 rounded-2xl text-left overflow-hidden transition-all duration-300 ${
                            isDark
                              ? 'bg-gradient-to-br from-gray-800/90 to-gray-900/90 border border-gray-700/50 hover:border-[#C02C38]/50 hover:shadow-lg hover:shadow-[#C02C38]/10'
                              : 'bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/80 hover:border-[#C02C38]/40 hover:shadow-xl hover:shadow-[#C02C38]/10'
                          }`}
                        >
                          {/* 背景装饰 */}
                          <div className={`absolute top-0 right-0 w-20 h-20 rounded-full blur-2xl opacity-0 group-hover:opacity-30 transition-opacity duration-500 ${
                            isDark ? 'bg-[#C02C38]' : 'bg-[#C02C38]'
                          }`} />

                          <div className="relative flex items-start gap-3">
                            {/* 图标容器 */}
                            <div className={`flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center text-2xl transition-transform duration-300 group-hover:scale-110 ${
                              isDark
                                ? 'bg-gradient-to-br from-[#C02C38]/20 to-[#C02C38]/5'
                                : 'bg-gradient-to-br from-[#C02C38]/10 to-[#C02C38]/5'
                            }`}>
                              {option.icon}
                            </div>

                            {/* 文字内容 */}
                            <div className="flex-1 min-w-0">
                              <p className={`font-semibold text-sm mb-1 transition-colors group-hover:text-[#C02C38] ${
                                isDark ? 'text-gray-100' : 'text-gray-900'
                              }`}>
                                {option.label}
                              </p>
                              <p className={`text-xs leading-relaxed line-clamp-2 ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {option.description}
                              </p>
                            </div>
                          </div>

                          {/* 底部指示条 */}
                          <div className={`absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-[#C02C38] to-transparent transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500`} />
                        </motion.button>
                      ))}
                    </div>
                  </div>
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
          <div className="space-y-4">
            {renderDelegationIndicator()}
            <MarkdownContent
              content={message.content}
              isDark={isDark}
              isUser={isUser}
              onOptionClick={(optionText) => {
                console.log('[ChatMessage] 点击文字选项:', optionText);

                // 检查是否是工作流相关选项 (格式: "开始执行" 或 "先不开始")
                const quickActions = message.metadata?.quickActions || [];
                const matchedAction = quickActions.find((action: any) =>
                  optionText.includes(action.label) || action.label.includes(optionText)
                );

                if (matchedAction) {
                  console.log('[ChatMessage] 匹配到工作流操作:', matchedAction);
                  // 派发 option-selected 事件让 ChatPanel 处理
                  window.dispatchEvent(new CustomEvent('option-selected', {
                    detail: { option: matchedAction, message }
                  }));
                  return;
                }

                // 默认处理：添加用户选择消息
                addMessage({
                  role: 'user',
                  content: `我选择${optionText}`,
                  type: 'text'
                });
                toast.success(`已选择：${optionText}`);
              }}
            />

            {/* 显示设计类型选择器（如果消息中包含）- 卡片按钮式布局 */}
            {message.metadata?.showDesignTypeSelector && Array.isArray(message.metadata?.designTypeOptions) && (
              <div className="mt-4 space-y-4">
                {/* 分类列表 */}
                {message.metadata.designTypeOptions.map((category: any, catIndex: number) => (
                  <div key={catIndex} className="space-y-3">
                    {/* 分类标题 */}
                    <div className="flex items-center gap-2">
                      <span className="text-base">{category.category.split(' ')[0]}</span>
                      <span className={`text-sm font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {category.category.split(' ').slice(1).join(' ')}
                      </span>
                    </div>
                    
                    {/* 类型列表 - 卡片按钮样式 */}
                    <div className="space-y-2">
                      {category.items.map((option: any, index: number) => {
                        // 计算全局编号
                        let globalIndex = 1;
                        for (let i = 0; i < catIndex; i++) {
                          globalIndex += message.metadata.designTypeOptions[i].items.length;
                        }
                        globalIndex += index;
                        
                        return (
                          <motion.button
                            key={option.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: globalIndex * 0.05 }}
                            whileHover={{ 
                              scale: 1.01,
                              boxShadow: isDark 
                                ? '0 4px 20px rgba(0,0,0,0.4)' 
                                : '0 4px 20px rgba(0,0,0,0.1)'
                            }}
                            whileTap={{ scale: 0.99, y: 1 }}
                            className={`w-full group relative flex items-center gap-3 p-3 rounded-xl text-left transition-all duration-200 border-2 ${
                              isDark 
                                ? 'bg-gray-800/80 border-gray-700 hover:border-[#C02C38]/50 hover:bg-gray-800' 
                                : 'bg-white border-gray-200 hover:border-[#C02C38]/50 hover:bg-gray-50'
                            }`}
                            onClick={() => {
                              console.log('[ChatMessage] 点击选项:', option);
                              handleDesignTypeOption(option);
                            }}
                          >
                            {/* 序号 - 圆形背景 */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                              isDark 
                                ? 'bg-gray-700 text-gray-300 group-hover:bg-[#C02C38]/20 group-hover:text-[#C02C38]' 
                                : 'bg-gray-100 text-gray-600 group-hover:bg-[#C02C38]/10 group-hover:text-[#C02C38]'
                            } transition-colors`}>
                              {globalIndex}
                            </div>
                            
                            {/* 内容区域 */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className={`font-bold text-base ${
                                  isDark ? 'text-gray-100' : 'text-gray-800'
                                }`}>
                                  {option.label}
                                </span>
                                {/* 类型标签 */}
                                <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                                  isDark 
                                    ? 'bg-gray-700 text-gray-400' 
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                  {option.icon}
                                </span>
                              </div>
                              <p className={`text-sm mt-0.5 truncate ${
                                isDark ? 'text-gray-400' : 'text-gray-500'
                              }`}>
                                {option.description}
                              </p>
                            </div>
                            
                            {/* 右侧箭头 */}
                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                              isDark 
                                ? 'bg-gray-700/50 text-gray-500 group-hover:bg-[#C02C38]/20 group-hover:text-[#C02C38]' 
                                : 'bg-gray-100 text-gray-400 group-hover:bg-[#C02C38]/10 group-hover:text-[#C02C38]'
                            }`}>
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                              </svg>
                            </div>
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                ))}
                
                {/* 底部提示 */}
                <div className={`flex items-start gap-2 pt-3 border-t ${
                  isDark ? 'border-gray-700/30' : 'border-gray-200/50'
                }`}>
                  <span className="text-base">💡</span>
                  <p className={`text-xs leading-relaxed ${
                    isDark ? 'text-gray-400' : 'text-gray-500'
                  }`}>
                    没找到合适的选项？您可以直接在下方输入框中描述您的需求。
                  </p>
                </div>
              </div>
            )}
            
            {/* 显示思考过程卡片（如果消息中包含） */}
            {message.metadata?.showThinkingProcess && message.metadata?.designType && message.metadata?.agentType && (
              <div className="mt-4">
                <ThinkingProcessCard
                  agentType={message.metadata.agentType}
                  designType={message.metadata.designType}
                  selectedBrand={message.metadata?.selectedBrand}
                />
              </div>
            )}

            {/* 配色方案选择器 - 自动检测消息中的配色方案列表 */}
            {!isUser && (() => {
              const colorSchemes = parseColorSchemesFromContent(message.content);
              return colorSchemes && colorSchemes.length >= 2 ? (
                <ColorSchemeSelector
                  title="点击选择配色方案"
                  options={colorSchemes}
                />
              ) : null;
            })()}

            {/* 自动检测消息中的选项列表并渲染为可点击按钮 */}
            {!isUser && (() => {
              const options = parseOptionsFromContent(message.content);
              return options && options.length >= 2 ? (
                <div className="mt-4 space-y-2">
                  <p className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    点击选择：
                  </p>
                  {options.map((option, index) => (
                    <motion.button
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ scale: 1.02, x: 4 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => {
                        addMessage({
                          role: 'user',
                          content: option,
                          type: 'text'
                        });
                        toast.success(`已选择：${option}`);
                      }}
                      className={`
                        w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all
                        ${isDark
                          ? 'bg-gray-800/80 border border-gray-700 hover:border-[#C02C38]/50 hover:bg-gray-800'
                          : 'bg-white border border-gray-200 hover:border-[#C02C38]/50 hover:bg-gray-50'
                        }
                      `}
                    >
                      <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                        isDark
                          ? 'bg-gray-700 text-gray-300'
                          : 'bg-gray-100 text-gray-600'
                      }`}>
                        {index + 1}
                      </div>
                      <span className={`flex-1 ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {option}
                      </span>
                      <svg className={`w-5 h-5 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </motion.button>
                  ))}
                </div>
              ) : null;
            })()}

            {/* 在画布生成按钮 - 暂时隐藏，因为功能重复且位置不合适 */}
            {/* {!isUser && message.content && message.content.length > 100 && (
              <div className="mt-4 flex gap-2">
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  onClick={() => handleGenerateToCanvas('design-spec')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${isDark 
                      ? 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white hover:opacity-90 shadow-lg shadow-[#C02C38]/20' 
                      : 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white hover:opacity-90 shadow-lg shadow-[#C02C38]/20'
                    }
                  `}
                >
                  <LayoutTemplate className="w-4 h-4" />
                  <span>在画布上生成</span>
                </motion.button>
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  onClick={() => handleGenerateToCanvas('derivatives')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium
                    transition-all duration-200
                    ${isDark 
                      ? 'bg-gray-800 text-gray-200 border border-gray-700 hover:bg-gray-700' 
                      : 'bg-white text-gray-700 border border-gray-200 hover:bg-gray-50'
                    }
                  `}
                >
                  <PanelRight className="w-4 h-4" />
                  <span>在右侧生成</span>
                </motion.button>
              </div>
            )} */}
          </div>
        );
    }
  };

  // 获取气泡样式 - 统一深色主题样式
  const getBubbleStyle = () => {
    if (isUser) {
      return `bg-gradient-to-br from-[#8B5CF6] to-[#6366F1] text-white rounded-2xl rounded-tr-sm shadow-lg shadow-[#8B5CF6]/20`;
    }

    // 统一使用简洁的深色主题样式
    if (isDark) {
      return 'bg-[#1E1E2E] border border-[#2A2A3E] rounded-2xl rounded-tl-sm';
    }
    
    // 浅色主题保持原样
    switch (agentRole) {
      case 'director':
        return 'bg-white border border-gray-200 rounded-2xl rounded-tl-sm';
      case 'designer':
        return 'bg-white/80 border border-gray-200/50 rounded-2xl rounded-tl-sm';
      case 'illustrator':
        return 'bg-pink-50 border border-pink-200 rounded-2xl rounded-tl-sm';
      case 'copywriter':
        return 'bg-emerald-50 border border-emerald-200 rounded-2xl rounded-tl-sm';
      case 'animator':
        return 'bg-violet-50 border border-violet-200 rounded-2xl rounded-tl-sm';
      case 'researcher':
        return 'bg-slate-50 border border-slate-200 rounded-2xl rounded-tl-sm';
      default:
        return 'bg-gray-100 rounded-2xl rounded-tl-sm';
    }
  };

  const agentInfo = getAgentInfo(agentRole);

  return (
    <>
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

          {/* 智能画布添加提示 */}
          {!isUser && isAutoAddedToCanvas && (
            <motion.div
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex items-center gap-1.5 mt-2 text-xs ${
                isDark ? 'text-gray-400' : 'text-gray-500'
              }`}
            >
              <CheckCircle className="w-3 h-3 text-green-500" />
              <span>已自动添加到画布</span>
              {contentAnalysis.confidence > 0 && (
                <span className="opacity-60">
                  (置信度: {Math.round(contentAnalysis.confidence * 100)}%)
                </span>
              )}
            </motion.div>
          )}

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
                userQuery={userQuery}
              />
            </div>
          )}
        </div>
      </motion.div>

      {/* 图片 Lightbox */}
      <ImageLightbox
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
        imageUrl={lightboxImageUrl}
        title={lightboxImageName}
      />
    </>
  );
}
