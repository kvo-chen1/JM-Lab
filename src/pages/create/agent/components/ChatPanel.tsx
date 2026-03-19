import React, { useRef, useEffect, useState, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../hooks/useAgentStore';
import { AuthContext } from '@/contexts/authContext';
import { supabase } from '@/lib/supabase';
import { useMonitoring } from '../hooks/useMonitoring';
import { usePrediction } from '../hooks/usePrediction';
import { useABTesting } from '../hooks/useABTesting';
import { useDynamicWorkflow } from '../hooks/useDynamicWorkflow';
import { useJinbi } from '@/hooks/useJinbi';
import { Send, Image as ImageIcon, Sparkles, Trash2, Wand2, Layers, Store, Library, Coins, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import AgentAvatar from './AgentAvatar';
import AgentSwitcher from './AgentSwitcher';
import UploadDialog from './UploadDialog';
import InspirationHints from './InspirationHints';
import SuggestionPanel from './SuggestionPanel';
import ImageAnalyzer from './ImageAnalyzer';
import WorkflowStatus from './WorkflowStatus';
import SchedulerStatus from './SchedulerStatus';
import ResourceMonitor from './ResourceMonitor';
import DataMigrationDialog from './DataMigrationDialog';
import VoiceInputButton from './VoiceInputButton';
import StyleLibrary from './StyleLibrary';
import BrandLibrary from './BrandLibrary';
import WorkLibrary from './WorkLibrary';
import JinbiInsufficientModal from '@/components/jinbi/JinbiInsufficientModal';
import { IPMascotVideoLoader } from '@/components/ip-mascot';
import type { InspirationHint, StyleOption } from '../types/agent';
import type { Brand } from '@/lib/brands';
import type { Work } from '@/services/workService';
import {
  processWithOrchestrator,
  ConversationContext
} from '../services/agentOrchestrator';
import {
  analyzeDesignRequirements
} from '../services/agentService';
import { getResourceManager } from '../services/resourceManager';
import { errorHandler } from '../services/errorHandler';
import { llmService } from '@/services/llmService';
import type { AgentMessage, AgentType, OrchestratorResponse } from '../types/agent';
import { AGENT_CONFIG, PRESET_STYLES, LLM_MODELS, getLLMModelConfig } from '../types/agent';
import { Suggestion } from '../services/suggestionEngine';

// Agent对话消耗的津币数
const AGENT_CHAT_COST = 10;

// 生成标题和描述的辅助函数
async function generateTitleAndDescription(
  taskDescription: string,
  styleName: string
): Promise<{ title: string; description: string }> {
  console.log('[generateTitleAndDescription] 开始生成标题和描述:', { taskDescription, styleName });

  const prompt = `作为一位专业的创意设计师，请为以下设计作品生成一个吸引人的标题和详细的描述。

设计任务：${taskDescription}
设计风格：${styleName}

要求：
1. 标题（≤15字）：简洁有力，富有创意，能体现作品特色
2. 描述（50-100字）：详细描述作品的视觉特点、设计理念、适用场景等

请直接返回JSON格式：
{
  "title": "作品标题",
  "description": "作品描述..."
}`;

  try {
    console.log('[generateTitleAndDescription] 调用 llmService.generateResponse...');
    const response = await llmService.generateResponse(prompt, {
      priority: 'normal'
    });
    console.log('[generateTitleAndDescription] 收到响应:', response);

    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const result = JSON.parse(jsonMatch[0]);
      console.log('[generateTitleAndDescription] 解析成功:', result);
      return {
        title: result.title?.slice(0, 15) || '未命名作品',
        description: result.description || '暂无描述'
      };
    } else {
      console.warn('[generateTitleAndDescription] 未找到JSON格式响应');
    }
  } catch (error) {
    console.error('[generateTitleAndDescription] 生成标题描述失败:', error);
  }

  console.log('[generateTitleAndDescription] 返回默认值');
  return {
    title: `${styleName}作品`,
    description: taskDescription
  };
}

// 从用户消息中检测风格关键词
function detectStyleFromMessage(message: string): string | null {
  const lowerMsg = message.toLowerCase();

  // 风格关键词映射
  const styleKeywords: Record<string, string[]> = {
    'color-pencil': ['彩铅', '素描', '彩铅素描'],
    'fantasy-picture-book': ['诡萌', '幻想', '绘本', '诡萌幻想'],
    'mori-girl': ['森系', '辛逝季', '芙莉', '森系少女'],
    'warm-color': ['温馨', '彩绘', '温馨彩绘'],
    'adventure-comic': ['治愈', '冒险', '漫画', '治愈冒险', '治愈冒险漫画'],
    'grainy-cute': ['颗粒', '粉彩', '童话', '颗粒粉彩'],
    'dreamy-pastel': ['虹彩', '梦幻', '治愈', '虹彩梦幻']
  };

  for (const [styleId, keywords] of Object.entries(styleKeywords)) {
    if (keywords.some(keyword => lowerMsg.includes(keyword))) {
      return styleId;
    }
  }

  return null;
}

// 解析输入中的@提及（支持品牌、风格和作品）
function parseMentions(input: string): {
  cleanInput: string;
  brands: string[];
  styles: string[];
  works: string[];
} {
  const brandMentions: string[] = [];
  const styleMentions: string[] = [];
  const workMentions: string[] = [];
  const mentionRegex = /@([^\s,，.。!！?？]+)/g;
  let match;

  while ((match = mentionRegex.exec(input)) !== null) {
    const mention = match[1];
    // 简单判断：如果提及匹配风格名，则认为是风格
    const styleNames = PRESET_STYLES.map(s => s.name);
    const extendedStyleNames = [
      '国潮风尚', '水墨意境', '青花瓷韵', '敦煌飞天', '剪纸艺术', '书法韵味',
      '极简主义', '复古怀旧', '赛博朋克', '北欧风格',
      '卡通动漫', '日式萌系', '童话梦幻'
    ];
    const allStyleNames = [...styleNames, ...extendedStyleNames];

    if (allStyleNames.includes(mention)) {
      styleMentions.push(mention);
    } else {
      // 非风格提及，可能是品牌或作品
      // 这里简单处理：先作为品牌，也可以同时作为作品引用
      brandMentions.push(mention);
      workMentions.push(mention);
    }
  }

  const cleanInput = input.replace(mentionRegex, '').trim();

  return { cleanInput, brands: brandMentions, styles: styleMentions, works: workMentions };
}

export default function ChatPanel() {
  const { isDark } = useTheme();
  const {
    messages,
    isTyping,
    currentAgent,
    currentTask,
    delegationHistory,
    agentQueue,
    selectedStyle,
    requirementCollection,
    currentModel,
    pendingMention,
    addMessage,
    addOutput,
    setIsTyping,
    setCurrentAgent,
    clearMessages,
    createTask,
    updateTaskRequirements,
    setShowStyleSelector,
    updateMessage,
    delegateToAgent,
    completeDelegation,
    addToAgentQueue,
    processNextInQueue,
    setCollaborating,
    selectStyle,
    setCurrentModel,
    clearPendingMention
  } = useAgentStore();

  const [inputValue, setInputValue] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [showAgentSwitcher, setShowAgentSwitcher] = useState(false);
  const [switcherFromAgent, setSwitcherFromAgent] = useState<AgentType | undefined>();
  const [switcherToAgent, setSwitcherToAgent] = useState<AgentType>('director');
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState<string | null>(null);
  const [showStyleLibrary, setShowStyleLibrary] = useState(false);
  // AI生成状态
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('AI正在创作中...');
  // 粘贴图片相关状态
  const [pastedImages, setPastedImages] = useState<Array<{ id: string; file: File; preview: string }>>([]);
  const [isProcessingPaste, setIsProcessingPaste] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // 使用 AuthContext 获取用户信息
  const { user: authUser } = useContext(AuthContext);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

  // 津币相关状态
  const {
    balance: jinbiBalance,
    consumeJinbi,
    checkBalance,
    loading: jinbiLoading,
  } = useJinbi();
  const [showJinbiModal, setShowJinbiModal] = useState(false);
  const [jinbiCost] = useState(AGENT_CHAT_COST);

  // 启动监控
  try {
    useMonitoring();
  } catch (e) {
    console.warn('[ChatPanel] Monitoring hook failed:', e);
  }

  // 启动预测
  let prediction = null, userProfile = null, recordBehavior = () => {};
  try {
    const predictionResult = usePrediction();
    prediction = predictionResult.prediction;
    userProfile = predictionResult.userProfile;
    recordBehavior = predictionResult.recordBehavior;
  } catch (e) {
    console.warn('[ChatPanel] Prediction hook failed:', e);
  }

  // 启动 A/B 测试
  let abTestingReady = false, getVariant = () => null, trackABEvent = () => {};
  try {
    const abTestingResult = useABTesting();
    abTestingReady = abTestingResult.isReady;
    getVariant = abTestingResult.getVariant;
    trackABEvent = abTestingResult.trackEvent;
  } catch (e) {
    console.warn('[ChatPanel] AB Testing hook failed:', e);
  }

  // 启动动态工作流
  let isWorkflowGenerating = false, workflowSuggestions = [], analyzeAndSuggest = async () => [], getRecommendedTemplates = async () => [];
  try {
    const workflowResult = useDynamicWorkflow();
    isWorkflowGenerating = workflowResult.isGenerating;
    workflowSuggestions = workflowResult.suggestions;
    analyzeAndSuggest = workflowResult.analyzeAndSuggest;
    getRecommendedTemplates = workflowResult.getRecommendedTemplates;
  } catch (e) {
    console.warn('[ChatPanel] Dynamic Workflow hook failed:', e);
  }

  // 自动滚动到底部
  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (messagesContainerRef.current) {
      const container = messagesContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior
      });
    }
  }, []);

  // 页面加载时自动滚动到底部，并启动资源管理器
  useEffect(() => {
    // 启动资源管理器
    const resourceManager = getResourceManager();
    resourceManager.start();

    // 使用 setTimeout 确保 DOM 已完全渲染
    const timer = setTimeout(() => {
      scrollToBottom('auto');
    }, 500);

    return () => {
      clearTimeout(timer);
      resourceManager.stop();
    };
  }, [scrollToBottom]);

  // 获取用户信息和会话ID
  useEffect(() => {
    const initUserSession = async () => {
      try {
        // 生成或从存储中获取会话ID（所有用户都可用）
        let storedSessionId = localStorage.getItem('agent_session_id');
        if (!storedSessionId) {
          storedSessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('agent_session_id', storedSessionId);
        }
        setSessionId(storedSessionId);

        // 优先使用 AuthContext 中的用户（如果已登录）
        if (authUser?.id) {
          setUserId(authUser.id);
          console.log('[ChatPanel] 用户已登录(AuthContext):', authUser.id, '会话ID:', storedSessionId);
        } else {
          // 备用：从 supabase 获取
          const { data: { user } } = await supabase.auth.getUser();
          if (user) {
            setUserId(user.id);
            console.log('[ChatPanel] 用户已登录(supabase):', user.id, '会话ID:', storedSessionId);
          } else {
            // 未登录用户使用匿名ID
            let anonymousId = localStorage.getItem('agent_anonymous_id');
            if (!anonymousId) {
              anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
              localStorage.setItem('agent_anonymous_id', anonymousId);
            }
            setUserId(anonymousId);
            console.log('[ChatPanel] 匿名用户，会话ID:', storedSessionId, '匿名ID:', anonymousId);
          }
        }
      } catch (error) {
        console.error('[ChatPanel] 获取用户信息失败:', error);
        // 出错时也生成匿名ID
        let anonymousId = localStorage.getItem('agent_anonymous_id');
        if (!anonymousId) {
          anonymousId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          localStorage.setItem('agent_anonymous_id', anonymousId);
        }
        setUserId(anonymousId);
      }
    };

    initUserSession();
  }, [authUser]);

  // 消息变化时自动滚动到底部
  useEffect(() => {
    scrollToBottom('smooth');
  }, [messages, streamingContent, isTyping, scrollToBottom]);

  // 当消息从空数组变为有内容时（如从本地存储加载完成），滚动到底部
  useEffect(() => {
    if (messages.length > 0) {
      const timer = setTimeout(() => {
        scrollToBottom('auto');
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [messages.length, scrollToBottom]);

  // 自动调整输入框高度
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = `${Math.min(inputRef.current.scrollHeight, 120)}px`;
    }
  }, [inputValue]);

  // 监听 pendingMention，将引用添加到输入框
  useEffect(() => {
    if (pendingMention) {
      const mention = `@${pendingMention.name} `;
      setInputValue(prev => {
        // 如果输入框已有内容，在末尾添加引用
        return prev ? `${prev} ${mention}` : mention;
      });
      // 清除 pendingMention
      clearPendingMention();
      // 聚焦输入框
      inputRef.current?.focus();
    }
  }, [pendingMention, clearPendingMention]);

  // 处理 Agent 切换动画
  const handleAgentSwitch = useCallback((fromAgent: AgentType | undefined, toAgent: AgentType) => {
    setSwitcherFromAgent(fromAgent);
    setSwitcherToAgent(toAgent);
    setShowAgentSwitcher(true);
  }, []);

  // Agent切换后自动触发图像生成
  const handleAutoImageGeneration = useCallback(async () => {
    if (!selectedStyle || !currentTask) return;

    const style = PRESET_STYLES.find(s => s.id === selectedStyle);
    if (!style) return;

    // 添加设计师消息
    addMessage({
      role: currentAgent,
      content: `好的！我将以「${style.name}」风格为你设计。正在调用AI模型生成概念图，请稍候...`,
      type: 'text'
    });

    // 开始生成，显示IP形象加载动画
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationMessage(`正在创作「${style.name}」风格作品...`);

    // 模拟进度增长
    const progressInterval = setInterval(() => {
      setGenerationProgress(prev => {
        if (prev >= 90) return prev;
        return prev + Math.random() * 15 + 5;
      });
    }, 1000);

    try {
      // 构建生成提示词
      const taskDescription = currentTask.requirements?.description || 'IP形象设计';
      const prompt = `${taskDescription}，${style.prompt}，高质量，精美细节，专业设计作品`;

      console.log('[ChatPanel] 自动触发图像生成，prompt:', prompt);

      // 调用图像生成API
      const result = await llmService.generateImage({
        model: 'qwen-image-2.0-pro',
        prompt: prompt,
        size: '1024x1024',
        n: 1
      });

      // 停止进度模拟
      clearInterval(progressInterval);
      setGenerationProgress(100);

      if (!result.ok) {
        throw new Error(result.error || '图像生成失败');
      }

      // 提取图像URL
      let imageUrl: string | undefined;
      if (result.data?.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
        imageUrl = result.data.data[0].url;
      } else if (result.data && Array.isArray(result.data) && result.data.length > 0) {
        imageUrl = result.data[0].url;
      }

      if (!imageUrl) {
        throw new Error('无法获取生成的图像URL');
      }

      // 调用千问API生成优质的标题和描述
      const { title, description } = await generateTitleAndDescription(
        taskDescription,
        style.name
      );

      console.log('[ChatPanel] AI生成的标题和描述:', { title, description });

      // 隐藏加载动画
      setIsGenerating(false);

      // 添加生成的图像消息
      addMessage({
        role: currentAgent,
        content: '概念图已生成！这是根据你选择的风格设计的IP形象初稿。你觉得怎么样？',
        type: 'image',
        metadata: {
          images: [imageUrl],
          prompt: prompt
        }
      });

      // 添加到画布，包含描述信息
      addOutput({
        type: 'image',
        url: imageUrl,
        thumbnail: imageUrl,
        prompt: prompt,
        style: selectedStyle,
        agentType: currentAgent,
        title: title,
        description: description
      });

      toast.success('图像生成成功！');
    } catch (error: any) {
      // 停止进度模拟
      clearInterval(progressInterval);
      setIsGenerating(false);
      
      console.error('[ChatPanel] 自动图像生成失败:', error);
      toast.error('图像生成失败: ' + error.message);

      // 添加错误消息
      addMessage({
        role: currentAgent,
        content: '抱歉，图像生成遇到了问题。请稍后重试，或者尝试换一种描述方式。',
        type: 'text'
      });
    }
  }, [selectedStyle, currentTask, currentAgent, addMessage, addOutput, messages]);

  // 处理编排器响应
  const handleOrchestratorResponse = useCallback(async (
    response: OrchestratorResponse,
    messageId: string
  ) => {
    // 更新消息内容和角色（如果Agent发生变化）
    updateMessage(messageId, {
      content: response.content,
      role: response.agent, // 更新为实际响应的Agent
      type: response.aiResponse?.type || 'text',
      metadata: {
        thinking: response.aiResponse?.thinking,
        ...response.aiResponse?.metadata
      }
    });

    // 处理不同类型的响应
    switch (response.type) {
      case 'delegation':
        if (response.delegationTask) {
          // 显示 Agent 切换动画
          handleAgentSwitch(
            response.delegationTask.fromAgent,
            response.delegationTask.toAgent
          );

          // 添加委派指示消息
          addMessage({
            role: 'system',
            content: `${AGENT_CONFIG[response.delegationTask.fromAgent as keyof typeof AGENT_CONFIG].name} 将任务委派给了 ${AGENT_CONFIG[response.delegationTask.toAgent as keyof typeof AGENT_CONFIG].name}`,
            type: 'delegation',
            metadata: {
              delegationInfo: {
                fromAgent: response.delegationTask.fromAgent,
                toAgent: response.delegationTask.toAgent,
                taskDescription: response.delegationTask.taskDescription,
                reasoning: response.delegationTask.context
              }
            }
          });

          // Agent切换后，自动触发图像生成
          setTimeout(() => {
            if (selectedStyle) {
              // 如果已选择风格，直接触发图像生成
              handleAutoImageGeneration();
            } else {
              // 如果没有选择风格，显示风格选择器
              setShowStyleSelector(true);
            }
          }, 1500); // 等待切换动画完成
        }
        break;

      case 'collaboration':
        if (response.collaborationAgents && response.collaborationAgents.length > 0) {
          setCollaborating(true, response.collaborationAgents);

          // 添加协作消息
          addMessage({
            role: 'system',
            content: `开始协作模式，${response.collaborationAgents.length} 位团队成员将同时为你服务`,
            type: 'collaboration',
            metadata: {
              collaborationInfo: {
                participatingAgents: response.collaborationAgents,
                taskDescription: '协作任务',
                progress: 0
              }
            }
          });
        }
        break;

      case 'chain':
        if (response.chainQueue && response.chainQueue.length > 0) {
          addToAgentQueue(response.chainQueue);

          // 添加链式任务消息
          addMessage({
            role: 'system',
            content: `已安排 ${response.chainQueue.length + 1} 位团队成员依次为你服务`,
            type: 'text'
          });
        }
        break;

      case 'handoff':
        // 完全交接给新 Agent
        handleAgentSwitch(currentAgent, response.agent);
        break;

      case 'image_generation':
        // 图像生成响应
        if (response.generatedImage) {
          // 更新消息为图像类型
          updateMessage(messageId, {
            content: response.content,
            type: 'image',
            metadata: {
              images: [response.generatedImage.url],
              prompt: response.generatedImage.prompt
            }
          });

          // 从之前的消息中提取AI生成的描述
          const lastAgentMessage = messages.slice().reverse().find(m => m.role !== 'user');
          const generatedDescription = response.generatedImage.description || lastAgentMessage?.content || '';
          const title = response.generatedImage.title || generatedDescription.split('\n')[0].slice(0, 30) || '未命名作品';

          // 添加到画布，包含描述信息
          const outputId = addOutput({
            type: 'image',
            url: response.generatedImage.url,
            thumbnail: response.generatedImage.url,
            prompt: response.generatedImage.prompt,
            style: selectedStyle || undefined,
            agentType: response.agent,
            title: title,
            description: generatedDescription
          });

          console.log('[ChatPanel] 图像已生成并添加到画布:', outputId);
          toast.success('图像生成成功！');
        }
        break;



      case 'response':
      default:
        // 普通响应，检查是否需要切换 Agent
        if (response.agent !== currentAgent) {
          handleAgentSwitch(currentAgent, response.agent);
        }

        // 处理角色设计工作流
        if (response.aiResponse?.type === 'character-workflow') {
          updateMessage(messageId, {
            content: response.content,
            type: 'character-workflow'
          });
        }
        break;
    }

    // 处理风格选项
    if (response.aiResponse?.type === 'style-options') {
      setShowStyleSelector(true);
    }

    // 智能检测：如果设计师或总监说开始设计/生成方案等，自动显示风格选择器
    // 但只有在没有选择风格且没有生成过图像时才触发
    const designKeywords = [
      '开始设计', '生成方案', '呈现方案', '设计方案', '概念图', '概念草图', '初步方案',
      '为你设计', '提供方案', '制作方案', '提供初步', '设计形象',
      '草图', '绘制', '创作', '呈现', '展示', '1分钟', '马上', '立即'
    ];
    // 排除"生成完成"、"已生成"等表示完成的词汇
    const isGenerationCompleted = response.content.includes('生成完成') ||
      response.content.includes('已生成') ||
      response.content.includes('生成成功') ||
      response.content.includes('完成了');

    const shouldShowStyleSelector = (response.agent === 'designer' || response.agent === 'director') &&
      !selectedStyle && // 还没有选择风格
      !isGenerationCompleted && // 不是生成完成的消息
      designKeywords.some(keyword => response.content.includes(keyword));

    console.log('[ChatPanel] 智能检测风格选择器:', {
      agent: response.agent,
      content: response.content.slice(0, 100),
      shouldShowStyleSelector,
      selectedStyle,
      isGenerationCompleted,
      matchedKeyword: designKeywords.find(keyword => response.content.includes(keyword))
    });

    if (shouldShowStyleSelector) {
      console.log('[ChatPanel] 触发风格选择器显示');
      setTimeout(() => {
        setShowStyleSelector(true);
        // 添加风格选择提示
        const styleMessageId = addMessage({
          role: 'designer',
          content: '请选择你喜欢的设计风格：',
          type: 'style-options'
        });
        console.log('[ChatPanel] 已添加风格选择消息:', styleMessageId);
      }, 500);
    }

    // 智能检测：如果Agent询问设计类型，显示设计类型选项按钮
    const designTypeKeywords = [
      '设计什么类型', '想设计什么', '设计类型', '项目类型',
      '选一个最想开始', '选择类型', '设计方向'
    ];

    // 检查是否已经在当前会话中选择了设计类型或用户已指定设计类型
    const hasSelectedDesignType = messages.some(m =>
      m.metadata?.designTypeSelected ||
      (m.type === 'design-type-options' && m.metadata?.selectedDesignType) ||
      requirementCollection?.collectedInfo?.projectType
    );

    const shouldShowDesignTypeOptions = !hasSelectedDesignType &&
      (response.agent === 'designer' || response.agent === 'director') &&
      designTypeKeywords.some(keyword => response.content.includes(keyword));

    if (shouldShowDesignTypeOptions) {
      console.log('[ChatPanel] 触发设计类型选项显示');
      setTimeout(() => {
        // 添加设计类型选项消息
        const designTypeMessageId = addMessage({
          role: 'designer',
          content: '请选择一个设计类型开始：',
          type: 'design-type-options',
          metadata: {
            designTypeOptions: [
              { id: 'ip-character', label: 'IP形象', description: '独特的角色形象设计', icon: '🎭' },
              { id: 'brand-design', label: '品牌设计', description: '品牌视觉识别系统', icon: '🎨' },
              { id: 'packaging', label: '包装设计', description: '产品包装创意设计', icon: '📦' },
              { id: 'poster', label: '海报设计', description: '宣传海报与物料设计', icon: '🖼️' },
              { id: 'animation', label: '动画视频', description: '动态视觉与视频制作', icon: '🎬' },
              { id: 'illustration', label: '插画设计', description: '手绘风格插画创作', icon: '✏️' }
            ]
          }
        });
        console.log('[ChatPanel] 已添加设计类型选项消息:', designTypeMessageId);
      }, 500);
    }
  }, [currentAgent, updateMessage, addMessage, setCollaborating, addToAgentQueue, handleAgentSwitch, setShowStyleSelector]);

  // 流式显示AI响应 - 优化版：动态延迟
  const streamResponse = useCallback(async (content: string, messageId: string) => {
    setStreamingContent('');
    const chars = content.split('');
    const totalChars = chars.length;

    // 动态计算延迟：内容越长，延迟越短，保证总时间在2-4秒之间
    const targetDuration = Math.min(4000, Math.max(2000, totalChars * 8));
    const delay = Math.max(3, Math.min(20, Math.floor(targetDuration / totalChars)));

    // 批量处理字符，减少setState次数
    const batchSize = Math.max(1, Math.floor(totalChars / 100));

    for (let i = 0; i < totalChars; i += batchSize) {
      await new Promise(resolve => setTimeout(resolve, delay * batchSize));

      const endIndex = Math.min(i + batchSize, totalChars);
      const currentContent = content.slice(0, endIndex);

      setStreamingContent(currentContent);

      // 每100ms或结束时更新一次消息
      if (endIndex % 20 === 0 || endIndex === totalChars) {
        updateMessage(messageId, {
          content: currentContent
        });
      }
    }

    // 确保最终内容完整
    updateMessage(messageId, { content });
    setStreamingContent('');
  }, [updateMessage]);

  // 处理发送消息
  const handleSend = async () => {
    if (!inputValue.trim() || isTyping) return;

    // 解析@提及
    const { cleanInput, brands, styles, works } = parseMentions(inputValue);

    // 如果没有实际内容（只有@提及），不发送
    if (!cleanInput && (brands.length > 0 || styles.length > 0 || works.length > 0)) {
      toast.warning('请选择品牌/风格/作品后输入您的需求');
      return;
    }

    const userMessage = cleanInput || inputValue.trim();

    // 检查津币余额（仅限登录用户）
    if (userId && !userId.startsWith('anon_')) {
      const balanceCheck = await checkBalance(jinbiCost);
      if (!balanceCheck.sufficient) {
        setShowJinbiModal(true);
        return;
      }
    }

    setInputValue('');

    // 添加用户消息到 store - 使用原始输入值（包含@提及）
    const userMessageObj: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim(), // 使用原始输入，包含@提及
      timestamp: Date.now(),
      type: 'text',
      metadata: {
        brands, // 附加品牌信息
        styles, // 附加风格信息
        works   // 附加作品信息
      }
    };
    addMessage({
      role: 'user',
      content: inputValue.trim(), // 显示原始输入，包含@提及
      type: 'text'
    });

    // 检测用户消息中是否包含风格关键词，自动设置风格（使用清理后的内容）
    const detectedStyle = detectStyleFromMessage(cleanInput);
    if (detectedStyle && !selectedStyle) {
      console.log('[ChatPanel] 从用户消息中检测到风格:', detectedStyle);
      selectStyle(detectedStyle);
      toast.success(`已自动选择风格：${PRESET_STYLES.find(s => s.id === detectedStyle)?.name}`);
    }

    setIsTyping(true);

    // 消费津币（仅限登录用户）
    let jinbiConsumed = false;
    if (userId && !userId.startsWith('anon_')) {
      const consumeResult = await consumeJinbi(
        jinbiCost,
        'agent_chat',
        'Agent 对话消费',
        { serviceParams: { agentType: currentAgent } }
      );
      if (consumeResult.success) {
        jinbiConsumed = true;
        toast.success(`已消耗 ${jinbiCost} 津币`, { duration: 2000 });
      } else {
        toast.error('津币扣除失败，请重试');
        setIsTyping(false);
        return;
      }
    }

    try {
      // 如果没有当前任务，先分析需求并创建任务（使用清理后的内容）
      if (!currentTask) {
        const analysis = await analyzeDesignRequirements(cleanInput);
        createTask(analysis.type, getTaskTitle(analysis.type), cleanInput);

        // 更新任务需求
        updateTaskRequirements({
          description: cleanInput
        });
      } else {
        // 已有任务，累积更新需求描述
        // 智能提取用户消息中的实际内容（去除指令词）
        const generationKeywords = ['直接生成', '开始生成', '生成吧', '开始吧', '直接做', '就这样', '可以生成了', '可以开始了', '开始制作', '不用调整', '不用修改', '直接出图', '出图吧'];
        let extractedContent = cleanInput;

        // 如果用户消息包含生成指令，尝试提取实际内容
        for (const keyword of generationKeywords) {
          if (cleanInput.includes(keyword)) {
            const parts = cleanInput.split(keyword);
            if (parts[0] && parts[0].trim().length > 0) {
              extractedContent = parts[0].trim().replace(/[,，、]$/g, '');
            }
            break;
          }
        }

        const currentDescription = currentTask.requirements.description || '';
        // 只有当提取的内容有意义时才追加
        const hasMeaningfulContent = extractedContent && extractedContent.length >= 2 && !generationKeywords.some(k => extractedContent === k);
        const updatedDescription = hasMeaningfulContent
          ? (currentDescription ? `${currentDescription}。${extractedContent}` : extractedContent)
          : currentDescription;

        updateTaskRequirements({
          description: updatedDescription
        });

        console.log('[ChatPanel] 更新任务描述:', updatedDescription, '提取内容:', extractedContent);
      }

      // 构建对话上下文（包含用户消息和完整任务信息）
      const context: ConversationContext = {
        currentAgent,
        messages: [...messages.slice(-9), userMessageObj],
        taskDescription: currentTask?.requirements.description,
        delegationHistory,
        requirementCollection,
        selectedStyle: styles.length > 0 ? styles[0] : selectedStyle, // 使用@提及的风格优先
        selectedBrand: brands.length > 0 ? brands[0] : undefined, // 传递第一个提到的品牌
        currentTask: currentTask ? {
          type: currentTask.type,
          requirements: currentTask.requirements
        } : undefined,
        userId,
        sessionId
      };

      // 创建临时消息用于流式显示
      const tempMessageId = addMessage({
        role: currentAgent,
        content: '',
        type: 'text'
      });

      // 使用编排器处理用户输入（带错误处理和重试）
      const orchestratorResult = await errorHandler.handleWithRetry(
        async () => {
          const response = await processWithOrchestrator(userMessage, context);

          // 更新当前 Agent（但如果用户已选择设计类型，保持当前专业Agent不变）
          if (response.agent !== currentAgent && !currentTask?.requirements?.projectType) {
            setCurrentAgent(response.agent);
          }

          // 流式显示响应
          await streamResponse(response.content, tempMessageId);

          // 处理编排器响应
          await handleOrchestratorResponse(response, tempMessageId);

          return response;
        },
        {
          type: 'API_ERROR',
          agentType: currentAgent,
          maxRetries: 2,
          retryDelay: 1000,
          onRetry: (attempt, error) => {
            console.log(`[Chat] Retry attempt ${attempt}:`, error.message);
            toast.info(`正在重试... (${attempt}/2)`);
          },
          onSuccess: (attempts) => {
            if (attempts > 0) {
              toast.success('重试成功！');
            }
          }
        }
      );

      if (!orchestratorResult.success) {
        throw orchestratorResult.error || new Error('处理失败');
      }

    } catch (error) {
      console.error('[Chat] Error:', error);

      // 使用 errorHandler 处理错误
      const agentError = errorHandler.handleError(error, {
        type: 'API_ERROR',
        agentType: currentAgent,
        operation: 'handleSend'
      });

      // 使用 ErrorDisplay 显示错误
      addMessage({
        role: 'system',
        content: 'AI响应失败',
        type: 'error',
        metadata: {
          error: {
            type: agentError.type,
            message: agentError.message,
            retryable: agentError.retryable,
            level: agentError.level
          },
          onRetry: () => {
            // 重试发送消息
            setInputValue(userMessage);
            handleSend();
          }
        }
      });
    } finally {
      setIsTyping(false);
    }
  };

  // 获取任务标题
  const getTaskTitle = (type: string): string => {
    switch (type) {
      case 'ip-character':
        return 'IP形象设计';
      case 'brand-packaging':
        return '品牌包装设计';
      case 'poster':
        return '宣传海报设计';
      default:
        return '创意设计任务';
    }
  };

  // 处理键盘事件
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // 处理粘贴事件
  const handlePaste = useCallback(async (e: React.ClipboardEvent) => {
    if (isTyping || isProcessingPaste) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    const imageItems = Array.from(items).filter(item =>
      item.type.startsWith('image/')
    );

    if (imageItems.length === 0) return;

    e.preventDefault();
    setIsProcessingPaste(true);

    const newImages: Array<{ id: string; file: File; preview: string }> = [];

    for (const item of imageItems.slice(0, 3 - pastedImages.length)) {
      const file = item.getAsFile();
      if (file) {
        const reader = new FileReader();
        const preview = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        newImages.push({
          id: Math.random().toString(36).substring(2, 9),
          file,
          preview
        });
      }
    }

    if (newImages.length > 0) {
      setPastedImages(prev => [...prev, ...newImages]);
      toast.success(`成功粘贴 ${newImages.length} 张图片`);
    }

    setIsProcessingPaste(false);
  }, [isTyping, isProcessingPaste, pastedImages.length]);

  // 删除粘贴的图片
  const handleRemovePastedImage = (id: string) => {
    setPastedImages(prev => prev.filter(img => img.id !== id));
  };

  // 清空对话
  const handleClear = () => {
    if (confirm('确定要清空对话吗？')) {
      clearMessages();
      toast.success('对话已清空');
    }
  };

  // 状态管理
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [showInspirationPanel, setShowInspirationPanel] = useState(false);
  const [showBrandLibrary, setShowBrandLibrary] = useState(false);
  const [selectedBrand, setSelectedBrand] = useState<Brand | null>(null);
  const [showWorkLibrary, setShowWorkLibrary] = useState(false);
  const [selectedWork, setSelectedWork] = useState<Work | null>(null);

  const toggleInspirationPanel = () => setShowInspirationPanel(!showInspirationPanel);

  // AI优化提示词
  const handleOptimizePrompt = async () => {
    if (!inputValue.trim()) {
      toast.warning('请先输入需要优化的内容');
      return;
    }

    setIsOptimizingPrompt(true);
    try {
      llmService.setCurrentModel('qwen');
      const optimized = await llmService.generateResponse(
        `请将以下创作描述优化为AI绘画提示词，要求：
1. 保留核心主题和风格
2. 添加细节描述（色彩、构图、质感）
3. 使用逗号分隔关键词
4. 控制在50字以内
5. 必须使用中文输出，不要出现英文
6. 只输出优化后的提示词，不要解释

原文：${inputValue}`
      );

      const cleaned = String(optimized || '').trim()
        .replace(/^["']|["']$/g, '')
        .replace(/^(提示词|优化后)[:：]\s*/i, '')
        .replace(/[\n\r]+/g, ' ')
        .trim();

      if (cleaned && cleaned !== inputValue && !/接口不可用|未返回内容/.test(cleaned)) {
        setInputValue(cleaned);
        toast.success('提示词优化完成');
      } else {
        toast.info('当前提示词已很完善');
      }
    } catch (error) {
      console.error('优化失败:', error);
      toast.error('优化失败，请稍后重试');
    } finally {
      setIsOptimizingPrompt(false);
    }
  };

  // 处理风格库选择
  const handleStyleLibrarySelect = (style: StyleOption) => {
    // 在输入框中显示 @风格名，并保留用户已输入的内容
    setInputValue(prev => {
      const mention = `@${style.name} `;
      return prev ? `${prev} ${mention}` : mention;
    });
    toast.success(`已选择风格：${style.name}，请在输入框中描述您的需求`);
    setShowStyleLibrary(false);
    // 聚焦到输入框
    inputRef.current?.focus();
  };

  // 处理品牌选择
  const handleBrandSelect = (brand: Brand) => {
    setSelectedBrand(brand);
    // 在输入框中显示 @品牌名，并保留用户已输入的内容
    setInputValue(prev => {
      const mention = `@${brand.name} `;
      return prev ? `${prev} ${mention}` : mention;
    });
    toast.success(`已选择品牌：${brand.name}，请在输入框中描述您的需求`);
    setShowBrandLibrary(false);
    // 聚焦到输入框
    inputRef.current?.focus();
  };

  // 处理作品选择
  const handleWorkSelect = (work: Work) => {
    setSelectedWork(work);
    // 在输入框中显示 @作品名，并保留用户已输入的内容
    setInputValue(prev => {
      const mention = `@${work.title} `;
      return prev ? `${prev} ${mention}` : mention;
    });
    toast.success(`已选择作品：${work.title}，请在输入框中描述您的需求`);
    setShowWorkLibrary(false);
    // 聚焦到输入框
    inputRef.current?.focus();
  };

  // 快速操作
  const quickActions = [
    { icon: Trash2, label: '清空对话', onClick: handleClear },
    { icon: ImageIcon, label: '上传参考', onClick: () => setShowUploadDialog(true) },
    { icon: Sparkles, label: '灵感提示', onClick: toggleInspirationPanel },
    { icon: Wand2, label: 'AI优化', onClick: handleOptimizePrompt, loading: isOptimizingPrompt },
    { icon: Layers, label: '风格库', onClick: () => setShowStyleLibrary(true) },
    { icon: Store, label: '品牌库', onClick: () => setShowBrandLibrary(true) },
    { icon: Library, label: '作品库', onClick: () => setShowWorkLibrary(true) }
  ];

  // 获取当前 Agent 的颜色
  const getAgentColor = () => {
    switch (currentAgent) {
      case 'director':
        return 'bg-amber-500';
      case 'designer':
        return 'bg-cyan-500';
      case 'illustrator':
        return 'bg-pink-500';
      case 'copywriter':
        return 'bg-emerald-500';
      case 'animator':
        return 'bg-violet-500';
      case 'researcher':
        return 'bg-slate-500';
      default:
        return 'bg-gray-500';
    }
  };

  const addReferenceImage = (image: { id: string; url: string; name: string; size: number; type: string; uploadedAt: number }) => {
    // 添加参考图片到消息
    addMessage({
      role: 'user',
      content: '',
      type: 'image',
      metadata: {
        imageUrl: image.url,
        imageName: image.name
      }
    });

    // 自动打开图像分析
    setAnalyzingImage(image.url);
  };

  // 处理建议点击
  const handleSuggestionClick = (suggestion: Suggestion) => {
    switch (suggestion.action.type) {
      case 'message':
        // 发送建议的消息
        setInputValue(suggestion.action.payload);
        toast.success(`已应用建议：${suggestion.title}`);
        break;
      case 'switch_agent':
        // 切换Agent
        setCurrentAgent(suggestion.action.payload);
        toast.success(`已切换到：${AGENT_CONFIG[suggestion.action.payload as keyof typeof AGENT_CONFIG]?.name}`);
        break;
      case 'generate':
        // 触发生成
        handleSend();
        break;
      case 'navigate':
        // 导航到指定页面
        window.location.href = suggestion.action.payload;
        break;
    }
  };

  return (
    <div className={`flex flex-col h-full ${isDark ? 'bg-[#1a1f1a]' : 'bg-white'}`}>
      {/* Agent Switcher Modal */}
      <AgentSwitcher
        fromAgent={switcherFromAgent}
        toAgent={switcherToAgent}
        isVisible={showAgentSwitcher}
        onComplete={() => setShowAgentSwitcher(false)}
      />

      {/* 上传对话框 */}
      <UploadDialog
        isOpen={showUploadDialog}
        onClose={() => setShowUploadDialog(false)}
        onUploadComplete={(results) => {
          results.forEach(result => {
            addReferenceImage({
              id: `upload_${Date.now()}_${Math.random()}`,
              url: result.url,
              name: result.name,
              size: result.size,
              type: result.type,
              uploadedAt: Date.now()
            });
          });
          toast.success(`已上传 ${results.length} 张图片`);
        }}
      />

      {/* 灵感提示面板 */}
      <AnimatePresence>
        {showInspirationPanel && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 h-full w-96 shadow-2xl z-40 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <InspirationHints
              onHintSelect={(hint: InspirationHint) => {
                setInputValue(hint.examplePrompt);
                toggleInspirationPanel();
                toast.success(`已应用灵感提示：${hint.title}`);
              }}
              onClose={toggleInspirationPanel}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 风格库面板 */}
      <AnimatePresence>
        {showStyleLibrary && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 h-full w-[480px] shadow-2xl z-40 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <StyleLibrary
              onStyleSelect={handleStyleLibrarySelect}
              onClose={() => setShowStyleLibrary(false)}
              currentStyle={selectedStyle || undefined}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 品牌库面板 */}
      <AnimatePresence>
        {showBrandLibrary && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 h-full w-[720px] shadow-2xl z-40 ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
          >
            <BrandLibrary
              onBrandSelect={handleBrandSelect}
              onClose={() => setShowBrandLibrary(false)}
              selectedBrand={selectedBrand?.id}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 作品库面板 */}
      <AnimatePresence>
        {showWorkLibrary && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 h-full w-[720px] shadow-2xl z-40 ${
              isDark ? 'bg-gray-900' : 'bg-white'
            }`}
          >
            <WorkLibrary
              onClose={() => setShowWorkLibrary(false)}
              selectedWork={selectedWork?.id}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* 图像分析弹窗 */}
      <AnimatePresence>
        {analyzingImage && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
            onClick={() => setAnalyzingImage(null)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="max-w-md w-full"
            >
              <ImageAnalyzer
                imageUrl={analyzingImage}
                onAnalysisComplete={(result) => {
                  // 可以在这里添加分析完成后的处理
                  console.log('[ChatPanel] Image analysis completed:', result);
                }}
                onClose={() => setAnalyzingImage(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 津币不足弹窗 */}
      <JinbiInsufficientModal
        isOpen={showJinbiModal}
        onClose={() => setShowJinbiModal(false)}
        requiredAmount={jinbiCost}
        currentBalance={jinbiBalance?.availableBalance || 0}
        serviceName="Agent对话"
      />

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* 调度器状态 */}
        <SchedulerStatus />

        {/* 资源监控 */}
        <ResourceMonitor />

        {/* 智能建议面板 */}
        <SuggestionPanel onSuggestionClick={handleSuggestionClick} />

        {/* 工作流状态 */}
        <WorkflowStatus />

        <AnimatePresence>
          {Array.isArray(messages) && messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
            />
          ))}
        </AnimatePresence>

        {/* IP形象视频加载动画 - 只要加载就显示 */}
        <AnimatePresence>
          {(isGenerating || isTyping) && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex justify-center my-4"
            >
              <IPMascotVideoLoader
                isVisible={true}
                message={isGenerating ? generationMessage : 'AI正在思考中...'}
                progress={isGenerating ? generationProgress : 0}
                showProgress={isGenerating}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Typing Indicator - 当不显示IP动画时显示 */}
        {false && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-start gap-3"
          >
            <AgentAvatar role={currentAgent} size="sm" />
            <div className={`px-4 py-3 rounded-2xl rounded-tl-sm ${
              isDark ? 'bg-gray-800' : 'bg-gray-100'
            }`}>
              <div className="flex items-center gap-1">
                <motion.div
                  className={`w-2 h-2 rounded-full ${getAgentColor()}`}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                />
                <motion.div
                  className={`w-2 h-2 rounded-full ${getAgentColor()}`}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                />
                <motion.div
                  className={`w-2 h-2 rounded-full ${getAgentColor()}`}
                  animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className={`p-4 border-t ${isDark ? 'border-[#2a2f2a] bg-[#1a1f1a]/80' : 'border-gray-200 bg-white/80'}`}>
        {/* Model Selector */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>AI模型:</span>
          <div className="flex items-center gap-1">
            {LLM_MODELS.map((model) => {
              const isActive = currentModel === model.id;
              const modelConfig = getLLMModelConfig(model.id);
              return (
                <motion.button
                  key={model.id}
                  onClick={() => setCurrentModel(model.id)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs transition-all ${
                    isActive
                      ? isDark
                        ? 'bg-gray-700 text-white ring-1 ring-gray-600'
                        : 'bg-white text-gray-900 ring-1 ring-gray-300 shadow-sm'
                      : isDark
                        ? 'bg-gray-800/50 text-gray-400 hover:bg-gray-800 hover:text-gray-300'
                        : 'bg-gray-100/50 text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                  title={model.description}
                >
                  <div className={`w-5 h-5 rounded-md bg-gradient-to-br ${modelConfig?.color} flex items-center justify-center`}>
                    <span className="text-[10px] text-white font-bold">{modelConfig?.icon}</span>
                  </div>
                  <span className="hidden sm:inline">{model.name}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Quick Actions - 优化为单行布局 */}
        <div className="mb-3">
          <div className="flex items-center justify-between gap-2">
            {/* 左侧：快捷操作按钮组 */}
            <div className="flex items-center gap-1.5 flex-wrap">
              {quickActions.map((action, index) => (
                <motion.button
                  key={index}
                  onClick={action.onClick}
                  disabled={(action as any).loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    isDark
                      ? 'bg-[#1E1E2E] hover:bg-[#2A2A3E] text-gray-300 border border-[#2A2A3E] hover:border-[#3A3A54]'
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300 shadow-sm'
                  } ${(action as any).loading ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {(action as any).loading ? (
                    <motion.div
                      className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                      animate={{ rotate: 360 }}
                      transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    />
                  ) : (
                    <action.icon className="w-3.5 h-3.5" />
                  )}
                  <span className="hidden sm:inline">{action.label}</span>
                </motion.button>
              ))}
            </div>

            {/* 右侧：津币余额显示 */}
            {userId && !userId.startsWith('anon_') && (
              <div className="flex-shrink-0">
                {(jinbiBalance?.availableBalance || 0) < jinbiCost ? (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => setShowJinbiModal(true)}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
                      ${isDark
                        ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/30'
                        : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}
                    `}
                  >
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>津币不足</span>
                  </motion.button>
                ) : (
                  <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => window.location.href = '/jinbi'}
                    className={`
                      flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap
                      ${isDark
                        ? 'bg-[#8B5CF6]/10 text-[#A78BFA] hover:bg-[#8B5CF6]/20 border border-[#8B5CF6]/30'
                        : 'bg-purple-50 text-purple-600 hover:bg-purple-100 border border-purple-200'}
                    `}
                  >
                    <Coins className="w-3.5 h-3.5" />
                    <span>{jinbiBalance?.availableBalance?.toLocaleString() || 0}</span>
                  </motion.button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 粘贴的图片预览 */}
        {pastedImages.length > 0 && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            className={`flex flex-wrap gap-2 mt-4 p-3 rounded-xl border ${
              isDark
                ? 'bg-[#14141F] border-[#2A2A3E]'
                : 'bg-gray-50 border-gray-200'
            }`}
          >
            {pastedImages.map((img, index) => (
              <motion.div
                key={img.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: index * 0.05 }}
                className={`relative w-16 h-16 rounded-lg overflow-hidden border group ${
                  isDark
                    ? 'border-[#2A2A3E]'
                    : 'border-gray-200'
                }`}
              >
                <img
                  src={img.preview}
                  alt="粘贴的图片"
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all" />
                <button
                  onClick={() => handleRemovePastedImage(img.id)}
                  className="absolute top-0.5 right-0.5 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center shadow-lg"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </motion.div>
            ))}
            {pastedImages.length < 3 && (
              <div className={`w-16 h-16 rounded-lg border-2 border-dashed flex items-center justify-center ${
                isDark
                  ? 'border-[#2A2A3E] text-[#4A4A5E]'
                  : 'border-gray-300 text-gray-400'
              }`}>
                <ImageIcon className="w-5 h-5" />
              </div>
            )}
          </motion.div>
        )}

        {/* Input Box - 优化深色主题样式 */}
        <div className={`flex flex-col gap-2 p-3 mt-4 rounded-xl border ${
          isDark
            ? 'bg-[#14141F] border-[#2A2A3E] focus-within:border-[#8B5CF6]/50 focus-within:shadow-[0_0_0_3px_rgba(139,92,246,0.1)]'
            : 'bg-white border-gray-200 focus-within:border-gray-300'
        } transition-all duration-200`}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onPaste={handlePaste}
            placeholder={pastedImages.length > 0 ? "输入设计需求，或继续粘贴图片..." : "输入你的设计需求，支持 Ctrl+V 粘贴图片..."}
            disabled={isTyping}
            className={`flex-1 bg-transparent border-none outline-none resize-none max-h-[120px] min-h-[44px] py-2.5 px-2 text-sm leading-relaxed ${
              isDark ? 'text-gray-100 placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            } disabled:opacity-50`}
            rows={1}
          />
          <div className="flex items-center gap-1.5 pb-1">
            <VoiceInputButton
              onTranscript={(text) => {
                setInputValue(prev => prev + text);
                toast.success('语音识别: ' + text);
              }}
              onCommand={(command, action) => {
                // 处理语音命令
                switch (action) {
                  case 'send_message':
                    handleSend();
                    break;
                  case 'start_design_task':
                    setInputValue('我想设计一个');
                    break;
                  case 'generate_image':
                    setInputValue('生成一张图片');
                    break;
                  default:
                    console.log('[Voice] Command:', command, action);
                }
              }}
            />
            <motion.button
              onClick={handleSend}
              disabled={!inputValue.trim() || isTyping}
              className={`p-2.5 rounded-lg transition-all ${
                inputValue.trim() && !isTyping
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#6366F1] text-white shadow-lg shadow-[#8B5CF6]/25 hover:shadow-xl hover:shadow-[#8B5CF6]/30'
                  : isDark
                    ? 'bg-[#2A2A3E] text-gray-500'
                    : 'bg-gray-200 text-gray-400'
              }`}
              whileHover={inputValue.trim() && !isTyping ? { scale: 1.05 } : {}}
              whileTap={inputValue.trim() && !isTyping ? { scale: 0.95 } : {}}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        {/* 底部提示区域 */}
        <div className="mt-2 flex items-center justify-between">
          {/* 左侧：津币不足提示 */}
          {userId && !userId.startsWith('anon_') && (jinbiBalance?.availableBalance || 0) < jinbiCost ? (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`
                flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs
                ${isDark
                  ? 'bg-red-500/10 text-red-400 border border-red-500/30'
                  : 'bg-red-50 text-red-600 border border-red-200'
                }
              `}
            >
              <span>⚠️ 津币余额不足</span>
              <button
                onClick={() => setShowJinbiModal(true)}
                className="underline hover:no-underline font-medium"
              >
                充值
              </button>
            </motion.div>
          ) : (
            <div />
          )}
        </div>
      </div>

      {/* 数据迁移对话框 */}
      <DataMigrationDialog />
    </div>
  );
}
