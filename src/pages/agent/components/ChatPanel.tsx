import React, { useRef, useEffect, useState, useCallback, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../hooks/useAgentStore';
import { AuthContext } from '@/contexts/authContext';
import { supabase } from '@/lib/supabase';
import { useLocation, useSearchParams } from 'react-router-dom';
import { useMonitoring } from '../hooks/useMonitoring';
import { usePrediction } from '../hooks/usePrediction';
import { useABTesting } from '../hooks/useABTesting';
import { useDynamicWorkflow } from '../hooks/useDynamicWorkflow';
import { useJinbi } from '@/hooks/useJinbi';
import { Send, Image as ImageIcon, Sparkles, Trash2, Wand2, Layers, Store, Library, Coins, AlertCircle, LayoutTemplate } from 'lucide-react';
import { toast } from 'sonner';
import ChatMessage from './ChatMessage';
import AgentAvatar from './AgentAvatar';
import AgentSwitcher from './AgentSwitcher';
import UploadDialog from './UploadDialog';
import InspirationHints from './InspirationHints';
import SuggestionPanel from './SuggestionPanel';
import ImageAnalyzer from './ImageAnalyzer';
import WorkflowStatus from './WorkflowStatus';
import DataMigrationDialog from './DataMigrationDialog';
import VoiceInputButton from './VoiceInputButton';
import StyleLibrary from './StyleLibrary';
import BrandLibrary from './BrandLibrary';
import WorkLibrary from './WorkLibrary';
import IPPosterLibrary from './IPPosterLibrary';
import StyleSelector from './StyleSelector';
import AgentSelector from './AgentSelector';
import WorkflowExecutionPanel, { WorkflowStep, StepStatus } from './WorkflowExecutionPanel';
import JinbiInsufficientModal from '@/components/jinbi/JinbiInsufficientModal';
import { IPMascotVideoLoader } from '@/components/ip-mascot';
import { ThinkingDecisionPanel } from './thinking';
import { ThinkingProcessPanel, InlineThinkingProcess } from './ThinkingProcessPanel';
import type { ThinkingSession, ThinkingStep } from '../types/thinking';
import type { InspirationHint, StyleOption } from '../types/agent';
import type { Brand } from '@/lib/brands';
import type { Work } from '@/services/workService';
import { createDraftService, CreateDraft } from '@/services/createDraftService';
import { ipPosterService } from '@/services/ipPosterService';
import { uploadPastedImages } from '@/pages/skill/chat/services/imageUploadService';
import {
  processWithOrchestrator,
  ConversationContextV2
} from '../services/agentOrchestrator';
import {
  analyzeDesignRequirements
} from '../services/agentService';
import { getResourceManager } from '../services/resourceManager';
import { errorHandler } from '../services/errorHandler';
import { llmService } from '@/services/llmService';
import { intentAnalyzer } from '../services/intentAnalyzer';
import { learningManager } from '../services/learningSystem';
import type { AgentMessage, AgentType, OrchestratorResponse, MentionedWork } from '../types/agent';
import { AGENT_CONFIG, PRESET_STYLES, LLM_MODELS, getLLMModelConfig } from '../types/agent';
import { Suggestion } from '../services/suggestionEngine';
import { executeStrategies, shouldAutoAddToCanvas } from '../services/canvasGenerationStrategy';
import type { GeneratedOutput } from '../types/agent';
import { getConversationTracker, resetConversationTracker } from '../services/conversationTracker';

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

// 排版名称常量
const LAYOUT_NAMES = [
  '国潮风尚·雪豹小吉',
  '游戏风·瓦当神韵',
  '博物馆风·釉趣横生',
  '经典展示·津小脉',
  '清新简约·海河之夜',
  '创意拼贴·天津印象',
  '时尚潮流·都市脉动',
  '文化传承·津门韵味'
];

// 扩展风格名称常量
const EXTENDED_STYLE_NAMES = [
  '国潮风尚', '水墨意境', '青花瓷韵', '敦煌飞天', '剪纸艺术', '书法韵味',
  '极简主义', '复古怀旧', '赛博朋克', '北欧风格',
  '卡通动漫', '日式萌系', '童话梦幻'
];

// @提及解析正则表达式
const MENTION_REGEX = /@([^\s,，.。!！?？]+)/g;

// 生成质量评估函数
async function evaluateGenerationQuality(
  imageUrl: string,
  prompt: string,
  originalRequirement: string
): Promise<number> {
  console.log('[质量评估] 开始评估生成质量...');
  
  try {
    // 基于提示词和原始需求进行质量评估
    const evaluationPrompt = `作为图像质量评估专家，请评估以下图像生成的质量。

原始需求：${originalRequirement}
生成提示词：${prompt}

请从以下维度评估（每项0-100分）：
1. 清晰度：图像是否清晰，细节是否丰富
2. 符合度：是否符合原始需求和提示词描述
3. 创意性：是否有创意，是否独特
4. 技术质量：构图、色彩、光影等技术层面

请返回总分（0-100）和简要理由，格式：
总分：XX
理由：简要说明`;

    const response = await llmService.generateResponse(evaluationPrompt, {
      priority: 'low'
    });
    
    // 解析分数
    const scoreMatch = response.match(/总分[:：]\s*(\d+)/);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1], 10);
      console.log('[质量评估] 评估完成，分数:', score);
      return Math.min(100, Math.max(0, score));
    }
  } catch (error) {
    console.error('[质量评估] 评估失败:', error);
  }
  
  // 默认返回中等质量
  return 70;
}

// 提示词优化和重试函数
async function optimizeAndRetryGeneration(
  originalPrompt: string,
  currentTask: any
): Promise<void> {
  console.log('[提示词优化] 开始优化提示词...');
  
  try {
    const optimizationPrompt = `作为提示词优化专家，请优化以下图像生成提示词，提高生成质量。

原始提示词：${originalPrompt}

请从以下方面优化：
1. 增加更多细节描述
2. 使用更专业的艺术术语
3. 强调关键视觉元素
4. 添加质量提升关键词（如"高质量"、"精致细节"、"专业设计"等）

请直接返回优化后的提示词，不要解释。`;

    const optimizedPrompt = await llmService.generateResponse(optimizationPrompt, {
      priority: 'normal'
    });
    
    console.log('[提示词优化] 优化完成:', optimizedPrompt);
    
    // 这里可以触发重新生成，但由于函数在组件外部，需要通过事件或其他方式触发
    // 暂时记录优化后的提示词供下次使用
    window.dispatchEvent(new CustomEvent('prompt-optimized', {
      detail: { originalPrompt, optimizedPrompt, task: currentTask }
    }));
    
  } catch (error) {
    console.error('[提示词优化] 优化失败:', error);
  }
}

// 解析输入中的@提及（支持品牌、风格、作品和排版）
function parseMentions(input: string): {
  cleanInput: string;
  brands: string[];
  styles: string[];
  works: string[];
  layouts: string[];
} {
  // 快速检查是否包含@提及，避免不必要的处理
  if (!input.includes('@')) {
    return { cleanInput: input.trim(), brands: [], styles: [], works: [], layouts: [] };
  }

  const brandMentions: string[] = [];
  const styleMentions: string[] = [];
  const workMentions: string[] = [];
  const layoutMentions: string[] = [];
  let match;

  while ((match = MENTION_REGEX.exec(input)) !== null) {
    const mention = match[1];

    // 1. 检查是否是排版名称
    const matchedLayout = LAYOUT_NAMES.find(name => name.includes(mention) || mention.includes(name));
    if (matchedLayout) {
      layoutMentions.push(matchedLayout);
      continue;
    }

    // 2. 检查是否是风格名称
    const styleNames = PRESET_STYLES.map(s => s.name);
    const allStyleNames = [...styleNames, ...EXTENDED_STYLE_NAMES];

    if (allStyleNames.includes(mention)) {
      styleMentions.push(mention);
    } else {
      // 3. 非风格/排版提及，可能是品牌或作品
      brandMentions.push(mention);
      workMentions.push(mention);
    }
  }

  const cleanInput = input.replace(MENTION_REGEX, '').trim();

  return { cleanInput, brands: brandMentions, styles: styleMentions, works: workMentions, layouts: layoutMentions };
}

// ==================== 图像URL提取辅助函数 ====================

interface ImageGenerateResponse {
  ok: boolean;
  error?: string;
  data?: any;
}

// 统一提取图像URL的函数
function extractImageUrl(result: ImageGenerateResponse): string | null {
  if (!result.ok || !result.data) {
    console.error('[ChatPanel] 图像生成API返回错误:', result.error);
    return null;
  }

  // 情况1: { data: [{ url: "..." }] }
  if (result.data.data && Array.isArray(result.data.data) && result.data.data.length > 0) {
    const item = result.data.data[0];
    if (item.url) {
      console.log('[ChatPanel] 使用 data.data[0].url 格式');
      return item.url;
    }
  }

  // 情况2: { data: [{ url: "..." }] } (没有中间的 data 包装)
  if (Array.isArray(result.data) && result.data.length > 0) {
    const item = result.data[0];
    if (item.url) {
      console.log('[ChatPanel] 使用 data[0].url 格式');
      return item.url;
    }
  }

  // 情况3: { data: { url: "..." } } (直接是对象)
  if (result.data.url) {
    console.log('[ChatPanel] 使用 data.url 格式');
    return result.data.url;
  }

  // 情况4: { url: "..." } (直接在顶层)
  if (typeof result.data === 'object' && !Array.isArray(result.data) && result.data.url) {
    console.log('[ChatPanel] 使用 data.url 格式（无包装）');
    return result.data.url;
  }

  console.error('[ChatPanel] 无法识别图像URL格式:', JSON.stringify(result.data).slice(0, 200));
  return null;
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
    generatedOutputs,
    showStyleSelector,
    addMessage,
    addOutput,
    updateOutput,
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
    clearPendingMention,
    setRequirementConfirmed
  } = useAgentStore();

  // 记录已处理的消息ID，防止重复添加
  const processedMessageIds = useRef<Set<string>>(new Set());

  // AI生成状态 - 必须在所有依赖它的 useCallback 之前声明
  const [isGenerating, setIsGenerating] = useState(false);

  // 智能自动添加到画布
  const autoAddToCanvas = useCallback((message: AgentMessage, silent: boolean = false) => {
    // 检查是否已经处理过
    if (processedMessageIds.current.has(message.id)) {
      console.log('[ChatPanel] 消息已处理过，跳过:', message.id);
      return null;
    }
    
    const { shouldAdd, confidence, reason } = shouldAutoAddToCanvas(message);
    
    if (!shouldAdd) {
      console.log('[ChatPanel] 不自动添加到画布:', reason, '置信度:', confidence);
      // 记录已处理的消息（即使不添加也要记录，避免重复检查）
      processedMessageIds.current.add(message.id);
      return null;
    }
    
    const { output, strategy } = executeStrategies(message);
    
    if (output && strategy) {
      console.log('[ChatPanel] 自动添加到画布:', strategy.name, '置信度:', confidence);
      
      // 记录已处理的消息
      processedMessageIds.current.add(message.id);
      
      // 添加到画布
      addOutput({
        ...output,
        metadata: {
          ...output.metadata,
          sourceMessageId: message.id // 记录来源消息ID
        }
      });
      
      // 非静默模式下显示提示
      if (!silent) {
        toast.success(`已自动添加到画布: ${output.title}`, {
          description: reason,
          duration: 2000
        });
      }
      
      return output;
    }
    
    return null;
  }, [addOutput]);

  // 统一的安全检查函数：判断是否应该显示风格选择器
  const shouldShowStyleSelectorSafely = useCallback(() => {
    // 已经选择风格，不显示
    if (selectedStyle) {
      console.log('[ChatPanel] 已选择风格，不显示风格选择器');
      return false;
    }

    // 正在生成中，不显示
    if (isGenerating) {
      console.log('[ChatPanel] 正在生成中，不显示风格选择器');
      return false;
    }

    // 已经有生成内容，不显示
    if (generatedOutputs.length > 0) {
      console.log('[ChatPanel] 已有生成内容，不显示风格选择器');
      return false;
    }

    // 当前没有任务，不显示
    if (!currentTask) {
      console.log('[ChatPanel] 没有当前任务，不显示风格选择器');
      return false;
    }

    // 需求收集未完成，不显示
    if (requirementCollection?.stage !== 'completed') {
      console.log('[ChatPanel] 需求收集未完成，不显示风格选择器');
      return false;
    }

    // 用户未确认，不显示
    if (!requirementCollection?.confirmed) {
      console.log('[ChatPanel] 用户未确认需求，不显示风格选择器');
      return false;
    }

    return true;
  }, [selectedStyle, isGenerating, generatedOutputs, currentTask, requirementCollection]);

  // 获取 URL 参数和 location state（用于"做同款"功能）
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const isSimilarMode = searchParams.get('mode') === 'similar';
  const similarCaseId = searchParams.get('case');

  const [inputValue, setInputValue] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [showAgentSwitcher, setShowAgentSwitcher] = useState(false);
  const [switcherFromAgent, setSwitcherFromAgent] = useState<AgentType | undefined>();
  const [switcherToAgent, setSwitcherToAgent] = useState<AgentType>('director');
  const [switcherReasoning, setSwitcherReasoning] = useState<string>('');
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState<string | null>(null);
  const [showStyleLibrary, setShowStyleLibrary] = useState(false);
  const [showIPPosterLibrary, setShowIPPosterLibrary] = useState(false);
  const [selectedIPPosterLayoutId, setSelectedIPPosterLayoutId] = useState<string | undefined>();
  // Agent 锁定状态
  const [isAgentLocked, setIsAgentLocked] = useState(false);
  const [generationProgress, setGenerationProgress] = useState(0);
  const [generationMessage, setGenerationMessage] = useState('AI正在创作中...');
  // 思考过程状态
  const [thinkingSession, setThinkingSession] = useState<ThinkingSession | null>(null);
  const [showThinkingProcess, setShowThinkingProcess] = useState(false);
  // 增强版思考过程
  const [enhancedThinkingSteps, setEnhancedThinkingSteps] = useState<any[]>([]);
  // 粘贴图片相关状态
  const [pastedImages, setPastedImages] = useState<Array<{ id: string; file: File; preview: string }>>([]);
  const [isProcessingPaste, setIsProcessingPaste] = useState(false);
  // 工作流执行状态
  const [activeWorkflow, setActiveWorkflow] = useState<{
    id: string;
    name: string;
    steps: WorkflowStep[];
    estimatedDuration: string;
    currentStepIndex: number;
    isExecuting: boolean;
  } | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  // 使用 AuthContext 获取用户信息
  const { user: authUser } = useContext(AuthContext);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);
  const sessionIdRef = useRef<string>('');
  const retryCountRef = useRef(0);

  // 津币相关状态
  const {
    balance: jinbiBalance,
    consumeJinbi,
    refundJinbi,
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

  // 处理"做同款"功能的预填充数据
  useEffect(() => {
    if (isSimilarMode && location.state?.prefillData) {
      const { prefillData } = location.state;
      console.log('[ChatPanel] 检测到做同款模式，预填充数据:', prefillData);

      // 填充输入框
      if (prefillData.prompt) {
        setInputValue(prefillData.prompt);
      }

      // 显示参考图片（如果有）
      if (prefillData.referenceImages && prefillData.referenceImages.length > 0) {
        // 添加系统消息显示参考图片
        addMessage({
          role: 'system',
          content: `已加载参考案例图片，你可以基于这些图片创作类似风格的作品。`,
          type: 'text',
          metadata: {
            referenceImages: prefillData.referenceImages,
            originalCaseId: prefillData.originalCaseId,
          }
        });
      }

      // 显示提示
      toast.success('已加载案例数据，可以开始创作了！');
    }
  }, [isSimilarMode, location.state, setInputValue, addMessage]);

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

  // 使用 ref 存储 handleAutoImageGeneration 函数，避免循环依赖
  const handleAutoImageGenerationRef = useRef<((skipMessage?: boolean) => void) | null>(null);

  // 页面加载时，检查是否需要显示风格选择器
  useEffect(() => {
    // 延迟执行，确保消息数据已从持久化存储中恢复
    const timer = setTimeout(() => {
      // 只有在需求收集完成且用户已确认后才显示风格选择器
      const shouldShowSelector =
        !selectedStyle &&
        generatedOutputs.length === 0 &&
        currentTask &&  // 需要当前任务存在
        requirementCollection?.stage === 'completed' &&  // 需求收集完成
        requirementCollection?.confirmed;  // 用户已确认

      if (shouldShowSelector) {
        console.log('[ChatPanel] 需求已确认，显示风格选择器');
        setShowStyleSelector(true);
      }
    }, 500); // 延迟500ms，确保状态已恢复

    return () => clearTimeout(timer);
  }, [selectedStyle, generatedOutputs, currentTask, requirementCollection, setShowStyleSelector]);

  // 监听 showStyleSelector 状态变化，当为 true 时添加风格选择消息
  useEffect(() => {
    if (showStyleSelector && !selectedStyle) {
      // 检查最后一条消息是否已经是风格选择消息
      const lastMessage = messages[messages.length - 1];
      const isLastMessageStyleOptions = lastMessage?.type === 'style-options';

      if (!isLastMessageStyleOptions) {
        console.log('[ChatPanel] showStyleSelector 为 true，添加风格选择消息');
        addMessage({
          role: currentAgent,
          content: '在开始生成之前，请先选择一个你喜欢的风格。你可以从下方选择，或者告诉我你想要的风格。',
          type: 'style-options'
        });
      }
    }
  }, [showStyleSelector, selectedStyle, messages, currentAgent, addMessage]);

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
        sessionIdRef.current = storedSessionId;

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
  const handleAgentSwitch = useCallback((fromAgent: AgentType | undefined, toAgent: AgentType, reasoning?: string) => {
    // 只设置切换动画状态，不立即切换 currentAgent
    // currentAgent 将在 handleOrchestratorResponse 中根据 response.agent 来更新
    setSwitcherFromAgent(fromAgent);
    setSwitcherToAgent(toAgent);
    setSwitcherReasoning(reasoning || '');
    setShowAgentSwitcher(true);
  }, []);

  // Agent切换后自动触发图像生成
  const handleAutoImageGeneration = useCallback(async (skipMessage = false) => {
    console.log('[ChatPanel] handleAutoImageGeneration 被调用，skipMessage:', skipMessage);
    console.log('[ChatPanel] 当前状态 - selectedStyle:', selectedStyle, 'currentTask:', currentTask ? '存在' : 'null');

    // 添加生成锁检查，防止重复触发
    if (isGenerating) {
      console.log('[ChatPanel] 生成正在进行中，跳过重复调用');
      return;
    }

    if (!selectedStyle || !currentTask) {
      console.warn('[ChatPanel] 生成条件不满足，提前返回:', { hasStyle: !!selectedStyle, hasTask: !!currentTask });
      return;
    }

    const style = PRESET_STYLES.find(s => s.id === selectedStyle);
    if (!style) {
      console.warn('[ChatPanel] 未找到风格配置:', selectedStyle);
      return;
    }

    // 检查是否已经为当前任务和风格生成过内容
    const hasGeneratedForCurrentTask = generatedOutputs.some(
      output => output.agentType === currentAgent && output.style === selectedStyle
    );

    if (hasGeneratedForCurrentTask) {
      console.log('[ChatPanel] 当前任务和风格已生成过，跳过');
      return;
    }

    console.log('[ChatPanel] 开始生成，风格:', style.name);

    // 获取最近创建的任务卡片（用于更新状态）
    const lastOutput = generatedOutputs[generatedOutputs.length - 1];
    const outputId = lastOutput?.id;

    // 回顾关键设定（强化上下文记忆）
    if (currentTask?.requirements) {
      const requirements = currentTask.requirements;
      const keySettings = [];
      
      if (requirements.characterName) keySettings.push(`角色名：${requirements.characterName}`);
      if (requirements.style) keySettings.push(`风格：${requirements.style}`);
      if (requirements.colorScheme) keySettings.push(`配色：${requirements.colorScheme}`);
      if (requirements.pose) keySettings.push(`姿态：${requirements.pose}`);
      if (requirements.expression) keySettings.push(`表情：${requirements.expression}`);
      
      if (keySettings.length > 0 && !skipMessage) {
        addMessage({
          role: 'system',
          content: `📋 设定回顾\n\n${keySettings.join('\n')}\n\n💡 确保生成符合以上设定...`,
          type: 'text'
        });
      }
    }

    // 添加生成开始提示（如果不需要跳过）
    if (!skipMessage) {
      addMessage({
        role: 'system',
        content: `🎨 开始生成【${currentTask?.type === 'ip_design' ? 'IP概念图' : '设计作品'}】\n\n风格：${style.name}\n状态：准备中...`,
        type: 'text'
      });
    }

    // 开始生成，显示IP形象加载动画
    setIsGenerating(true);
    setGenerationProgress(0);
    setGenerationMessage(`正在创作「${style.name}」风格作品...`);

    // 添加分阶段提示
    const progressMessages = [
      '🔍 分析设计需求...',
      '🎨 构思画面构图...',
      '✏️ 绘制草图...',
      '🖌️ 细化细节...',
      '🎭 添加风格效果...',
      '✨ 最终渲染...'
    ];

    let progressIndex = 0;
    const progressMessageInterval = setInterval(() => {
      if (progressIndex < progressMessages.length) {
        addMessage({
          role: 'system',
          content: progressMessages[progressIndex],
          type: 'text'
        });
        progressIndex++;
      }
    }, 2000);

    // 更新任务卡片状态为生成中
    if (outputId) {
      updateOutput(outputId, {
        status: 'generating',
        description: `正在生成${style.name}风格作品...`
      });
    }

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
      console.log('[ChatPanel] 开始调用 generateImage，参数:', {
        model: 'qwen-image-2.0',
        prompt: prompt.substring(0, 100) + '...',
        size: '1024x1024',
        n: 1
      });

      const result = await llmService.generateImage({
        model: 'qwen-image-2.0',
        prompt: prompt,
        size: '1024x1024',
        n: 1
      });

      console.log('[ChatPanel] generateImage 返回结果:', {
        ok: result.ok,
        hasData: !!result.data,
        error: result.error,
        dataStructure: result.data ? Object.keys(result.data) : 'no data'
      });

      // 停止进度模拟和分阶段提示
      clearInterval(progressInterval);
      clearInterval(progressMessageInterval);
      setGenerationProgress(100);

      if (!result.ok) {
        console.error('[ChatPanel] 图像生成失败:', result.error);
        throw new Error(result.error || '图像生成失败');
      }

      // 使用统一函数提取图像URL
      console.log('[ChatPanel] 开始提取图像URL...');
      const imageUrl = extractImageUrl(result);
      console.log('[ChatPanel] 提取的图像URL:', imageUrl ? '成功' : '失败');

      if (!imageUrl) {
        console.error('[ChatPanel] 无法提取图像URL，result结构:', JSON.stringify(result, null, 2));
        throw new Error('无法获取生成的图像URL');
      }

      // 调用千问API生成优质的标题和描述
      const { title, description } = await generateTitleAndDescription(
        taskDescription,
        style.name
      );

      console.log('[ChatPanel] AI生成的标题和描述:', { title, description });
      console.log('[ChatPanel] 准备添加输出到画布:', {
        imageUrl,
        style: selectedStyle,
        title,
        description
      });

      // 隐藏加载动画
      setIsGenerating(false);

      // 关闭风格选择器
      setShowStyleSelector(false);

      // 更新任务卡片为完成状态
      if (outputId) {
        updateOutput(outputId, {
          url: imageUrl,
          thumbnail: imageUrl,
          status: 'completed',
          title: title,
          description: description,
          prompt: prompt,
          style: selectedStyle,
          agentType: currentAgent
        });
      } else {
        // 如果没有找到之前的任务卡片，添加新的
        addOutput({
          type: 'image',
          url: imageUrl,
          thumbnail: imageUrl,
          prompt: prompt,
          style: selectedStyle,
          agentType: currentAgent,
          title: title,
          description: description,
          status: 'completed'
        });
      }

      // 添加生成完成提示
      addMessage({
        role: 'system',
        content: `✅ 生成完成！\n\n作品：${title}\n风格：${style.name}\n状态：已添加到画布`,
        type: 'text'
      });

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

      // 自动质量评估
      const qualityScore = await evaluateGenerationQuality(
        imageUrl,
        prompt,
        currentTask?.requirements?.description || ''
      );

      // 根据质量评分给出反馈
      if (qualityScore >= 80) {
        addMessage({
          role: 'system',
          content: `📊 质量评估：优秀 (${qualityScore}/100)\n\n✅ 图像清晰度：良好\n✅ 风格符合度：高\n✅ 创意表现：出色`,
          type: 'text'
        });
      } else if (qualityScore >= 60) {
        addMessage({
          role: 'system',
          content: `📊 质量评估：良好 (${qualityScore}/100)\n\n✅ 图像清晰度：尚可\n⚠️ 风格符合度：中等\n💡 建议：可以尝试调整描述词获得更好效果`,
          type: 'text'
        });
      } else {
        addMessage({
          role: 'system',
          content: `📊 质量评估：需要改进 (${qualityScore}/100)\n\n⚠️ 检测到生成质量不够理想\n🔄 正在自动优化并重新生成...`,
          type: 'text'
        });
        // 低质量时自动优化提示词并重试
        setTimeout(() => {
          optimizeAndRetryGeneration(prompt, currentTask);
        }, 2000);
      }

      // 生成成功，重置重试计数器
      retryCountRef.current = 0;

      // 记录生成成功反馈
      learningManager.recordFeedback(
        authUser?.id || 'anonymous',
        sessionIdRef.current,
        'save',
        currentAgent,
        {
          designType: currentTask?.type,
          style: selectedStyle,
          prompt: prompt,
          rating: Math.round(qualityScore / 20),  // 转换为1-5星
          qualityScore: qualityScore
        }
      );

      toast.success('图像生成成功！');
    } catch (error: any) {
      // 停止进度模拟和分阶段提示
      clearInterval(progressInterval);
      clearInterval(progressMessageInterval);
      setIsGenerating(false);

      // 更新任务卡片为错误状态
      if (outputId) {
        updateOutput(outputId, {
          status: 'error',
          description: '生成失败，请重试'
        });
      }
      
      console.error('[ChatPanel] 自动图像生成失败:', error);
      toast.error('图像生成失败: ' + error.message);

      // 添加详细的错误提示
      const errorMessage = error.message || '未知错误';
      addMessage({
        role: 'system',
        content: `❌ 生成遇到问题\n\n原因：${errorMessage}\n\n🔄 正在自动重试（1/3）...`,
        type: 'text'
      });

      // 智能重试：限制重试次数，避免无限循环
      if (retryCountRef.current < 2) {  // 最多重试2次
        retryCountRef.current++;
        setTimeout(() => {
          console.log(`[ChatPanel] 自动重试生成... (${retryCountRef.current}/2)`);
          addMessage({
            role: 'system',
            content: `🔄 重新尝试生成中... (${retryCountRef.current}/2)`,
            type: 'text'
          });
          handleAutoImageGenerationRef.current?.(true);
        }, 3000);
      } else {
        // 超过重试次数，停止重试并提示用户
        retryCountRef.current = 0;
        addMessage({
          role: 'system',
          content: '❌ 生成多次失败，请稍后重试或调整描述后再次尝试',
          type: 'text'
        });
      }
    }
  }, [selectedStyle, currentTask, currentAgent, addMessage, addOutput, updateOutput, generatedOutputs, setShowStyleSelector, isGenerating]);

  // 将函数赋值给 ref
  handleAutoImageGenerationRef.current = handleAutoImageGeneration;

  // 监听触发生成事件（来自 ChatMessage 中的确认按钮）
  useEffect(() => {
    const handleTriggerGeneration = () => {
      console.log('[ChatPanel] 收到 trigger-auto-generation 事件');
      console.log('[ChatPanel] 当前状态 - selectedStyle:', selectedStyle, 'currentTask:', currentTask ? '存在' : 'null');
      
      if (selectedStyle && currentTask) {
        console.log('[ChatPanel] 条件满足，调用 handleAutoImageGeneration');
        handleAutoImageGenerationRef.current?.();
      } else {
        console.warn('[ChatPanel] 条件不满足，无法生成:', { 
          hasStyle: !!selectedStyle, 
          hasTask: !!currentTask 
        });
      }
    };

    window.addEventListener('trigger-auto-generation', handleTriggerGeneration);
    return () => {
      window.removeEventListener('trigger-auto-generation', handleTriggerGeneration);
    };
  }, [selectedStyle, currentTask]);

  // 监听正式概念图生成事件
  useEffect(() => {
    const handleFormalConceptGeneration = () => {
      console.log('[ChatPanel] 收到正式概念图生成事件');
      console.log('[ChatPanel] currentTask:', currentTask, 'selectedStyle:', selectedStyle);
      // 设置当前任务为生成正式概念图
      if (currentTask && selectedStyle) {
        // 调用图像生成逻辑
        handleAutoImageGenerationRef.current?.(true);
      } else {
        console.warn('[ChatPanel] 无法生成：缺少 currentTask 或 selectedStyle');
      }
    };

    window.addEventListener('trigger-formal-concept-generation', handleFormalConceptGeneration);
    return () => {
      window.removeEventListener('trigger-formal-concept-generation', handleFormalConceptGeneration);
    };
  }, [currentTask, selectedStyle]);

  // 监听三视图生成事件
  useEffect(() => {
    const handleThreeViewGeneration = () => {
      console.log('[ChatPanel] 收到三视图生成事件');
      console.log('[ChatPanel] currentTask:', currentTask, 'selectedStyle:', selectedStyle);
      if (currentTask && selectedStyle) {
        // 设置任务类型为三视图
        // 调用图像生成逻辑
        handleAutoImageGenerationRef.current?.(true);
      } else {
        console.warn('[ChatPanel] 无法生成：缺少 currentTask 或 selectedStyle');
      }
    };

    window.addEventListener('trigger-three-view-generation', handleThreeViewGeneration);
    return () => {
      window.removeEventListener('trigger-three-view-generation', handleThreeViewGeneration);
    };
  }, [currentTask, selectedStyle]);

  // 监听细节图生成事件
  useEffect(() => {
    const handleDetailDesignGeneration = () => {
      console.log('[ChatPanel] 收到细节图生成事件');
      console.log('[ChatPanel] currentTask:', currentTask, 'selectedStyle:', selectedStyle);
      if (currentTask && selectedStyle) {
        // 设置任务类型为细节图
        // 调用图像生成逻辑
        handleAutoImageGenerationRef.current?.(true);
      } else {
        console.warn('[ChatPanel] 无法生成：缺少 currentTask 或 selectedStyle');
      }
    };

    window.addEventListener('trigger-detail-design-generation', handleDetailDesignGeneration);
    return () => {
      window.removeEventListener('trigger-detail-design-generation', handleDetailDesignGeneration);
    };
  }, [currentTask, selectedStyle]);

  // 监听消息变化，智能自动添加到画布
  useEffect(() => {
    if (messages.length === 0) return;
    
    // 获取最后一条消息
    const lastMessage = messages[messages.length - 1];
    
    // 确保消息有效
    if (!lastMessage || !lastMessage.id) return;
    
    // 只处理 AI 消息（非用户消息）
    if (lastMessage.role === 'user') return;
    
    // 检查消息是否已经有输出（避免重复添加）
    const existingOutput = generatedOutputs.find(
      output => output.metadata?.sourceMessageId === lastMessage.id
    );
    if (existingOutput) {
      console.log('[ChatPanel] 消息已有输出，跳过:', lastMessage.id);
      return;
    }
    
    // 检查是否已经在处理中（使用 ref 防止重复）
    if (processedMessageIds.current.has(lastMessage.id)) {
      console.log('[ChatPanel] 消息正在处理中，跳过:', lastMessage.id);
      return;
    }
    
    // 延迟执行，确保消息已完全渲染
    const timer = setTimeout(() => {
      // 再次检查消息有效性
      if (lastMessage && lastMessage.id) {
        console.log('[ChatPanel] 尝试自动添加到画布:', lastMessage.id);
        autoAddToCanvas(lastMessage, true); // 静默模式
      }
    }, 1000); // 增加延迟到 1 秒
    
    return () => clearTimeout(timer);
  }, [messages, generatedOutputs, autoAddToCanvas]);

  // 处理编排器响应
  const handleOrchestratorResponse = useCallback(async (
    response: OrchestratorResponse,
    messageId: string
  ) => {
    // 构建 metadata，包含思考过程（如果有）
    const metadata: any = {
      thinking: response.aiResponse?.thinking,
      ...response.aiResponse?.metadata
    };

    // 如果有思考过程，添加到 metadata
    if (thinkingSession) {
      metadata.thinkingSession = {
        ...thinkingSession,
        status: 'completed',
        isExpanded: false
      };
    }

    // 更新消息内容和角色（如果Agent发生变化）
    updateMessage(messageId, {
      content: response.content,
      role: response.agent, // 更新为实际响应的Agent
      type: response.aiResponse?.type || 'text',
      metadata
    });

    // 处理AI的自主行动指令
    const aiAction = response.aiResponse?.action;
    if (aiAction && selectedStyle && currentTask && !isGenerating) {
      console.log('[ChatPanel] 检测到AI行动指令:', aiAction);
      
      // 添加AI行动说明提示
      const actionDescriptions: Record<string, string> = {
        'generate_image': '🤖 AI决定：生成图像\n\n原因：根据当前对话上下文，需要为用户生成设计作品',
        'retry_generation': '🤖 AI决定：重新生成\n\n原因：之前的生成可能未完成或失败，需要重试',
        'check_canvas': '🤖 AI决定：检查画布状态\n\n原因：用户询问生成状态，需要确认画布上是否有图像'
      };
      
      addMessage({
        role: 'system',
        content: actionDescriptions[aiAction] || `🤖 AI决定：执行操作「${aiAction}」`,
        type: 'text'
      });
      
      switch (aiAction) {
        case 'generate_image':
          console.log('[ChatPanel] AI指令：触发生成图像');
          setIsGenerating(true);
          setGenerationMessage('AI正在创作中...');
          setTimeout(() => {
            handleAutoImageGenerationRef.current?.(true);
          }, 500);
          break;
        case 'retry_generation':
          console.log('[ChatPanel] AI指令：重新生成');
          setIsGenerating(true);
          setGenerationMessage('重新尝试生成...');
          setTimeout(() => {
            handleAutoImageGenerationRef.current?.(true);
          }, 500);
          break;
        case 'check_canvas':
          console.log('[ChatPanel] AI指令：检查画布');
          // 检查画布上是否有新图像
          if (generatedOutputs.length === 0) {
            console.log('[ChatPanel] 画布为空，自动触发生成');
            addMessage({
              role: 'system',
              content: '⚠️ 画布状态：未检测到图像\n\n操作：自动触发生成',
              type: 'text'
            });
            setIsGenerating(true);
            setGenerationMessage('正在为您生成...');
            setTimeout(() => {
              handleAutoImageGenerationRef.current?.(true);
            }, 500);
          } else {
            addMessage({
              role: 'system',
              content: `✅ 画布状态：已检测到 ${generatedOutputs.length} 个作品`,
              type: 'text'
            });
          }
          break;
      }
    }

    // 处理不同类型的响应
    switch (response.type) {
      case 'workflow':
        // 处理多步骤工作流响应
        if (response.workflow) {
          console.log('[ChatPanel] 收到工作流响应:', response.workflow);

          // 初始化工作流状态
          const stepsWithStatus: WorkflowStep[] = response.workflow.steps.map((step, index) => ({
            ...step,
            status: index === 0 ? 'running' : 'pending'
          }));

          setActiveWorkflow({
            id: response.workflow.id,
            name: response.workflow.name,
            steps: stepsWithStatus,
            estimatedDuration: response.workflow.estimatedDuration,
            currentStepIndex: 0,
            isExecuting: false // 等待用户确认后开始
          });

          // 将 quickActions 转换为文字中的可点击选项
          const quickActions = response.metadata?.quickActions || [];
          const actionText = quickActions.length > 0
            ? '\n\n**点击开始：**' + quickActions.map((action: any) => `[${action.label}](option:${action.action})`).join(' ｜ ')
            : '\n\n**点击开始：**[开始执行](option:start_workflow) ｜ [先不开始](option:cancel_workflow)';

          updateMessage(messageId, {
            type: 'text',
            content: response.content + actionText,
            metadata: {
              workflow: response.workflow,
              thinking: response.aiResponse?.thinking,
              // 保留 quickActions 用于事件处理
              quickActions: quickActions.length > 0 ? quickActions : [
                { label: '开始执行', action: 'start_workflow', description: '开始执行工作流' },
                { label: '先不开始', action: 'cancel_workflow', description: '暂不开始' }
              ]
            }
          });
        }
        break;

      case 'delegation':
        if (response.delegationTask) {
          // 显示 Agent 切换动画，传递切换原因
          handleAgentSwitch(
            response.delegationTask.fromAgent,
            response.delegationTask.toAgent,
            response.delegationTask.context // 使用 context 作为切换原因
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

          // Agent切换后，检查是否需要显示风格选择器或确认生成
          setTimeout(() => {
            console.log('[ChatPanel] Agent切换后检查 - selectedStyle:', selectedStyle);

            // 先检查需求收集状态，未完成则不显示风格选择器
            if (requirementCollection?.stage !== 'completed' || !requirementCollection?.confirmed) {
              console.log('[ChatPanel] 需求收集未完成，不显示风格选择器，继续对话');
              return;
            }

            if (selectedStyle) {
              // 如果已选择风格，询问用户是否立即生成，而不是直接生成
              const style = PRESET_STYLES.find(s => s.id === selectedStyle);
              console.log('[ChatPanel] 已选择风格，询问用户确认:', style?.name);

              addMessage({
                role: 'system',
                content: `已选择「${style?.name || '当前'}」风格，是否立即开始生成？`,
                type: 'quick-actions',
                metadata: {
                  quickActions: [
                    {
                      label: '✅ 立即生成',
                      action: 'generate_now',
                      description: '使用当前风格立即生成'
                    },
                    {
                      label: '🎨 更换风格',
                      action: 'change_style',
                      description: '选择其他风格'
                    },
                    {
                      label: '💬 继续沟通',
                      action: 'continue_chat',
                      description: '先不生成，继续交流'
                    }
                  ]
                }
              });
            } else {
              // 如果没有选择风格，检查是否满足显示条件
              if (shouldShowStyleSelectorSafely()) {
                console.log('[ChatPanel] 未选择风格且满足条件，显示风格选择器');
                setShowStyleSelector(true);
              } else {
                console.log('[ChatPanel] 不满足显示风格选择器条件，继续对话');
              }
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
        // 完全交接给新 Agent，传递交接原因
        handleAgentSwitch(currentAgent, response.agent, '根据你的需求，更适合由这位同事为你服务');
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

          // 添加快速操作按钮，引导用户下一步
          setTimeout(() => {
            addMessage({
              role: 'system',
              type: 'quick-actions',
              content: '对这个设计满意吗？接下来你可以：',
              metadata: {
                quickActions: [
                  { label: '🎨 生成变体', action: 'generate_variations', description: '生成不同姿态或表情的变体' },
                  { label: '✏️ 调整细节', action: 'refine', description: '调整颜色、服饰、表情等细节' },
                  { label: '🔄 换风格', action: 'change_style', description: '尝试其他风格效果' },
                  { label: '✅ 定稿导出', action: 'finalize', description: '确认并导出最终作品' }
                ]
              }
            });
          }, 1000);
        }
        break;



      case 'response':
      default:
        // 普通响应，检查是否需要切换 Agent
        if (response.agent !== currentAgent) {
          handleAgentSwitch(currentAgent, response.agent, '为你安排更专业的团队成员');
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

    // 处理风格选项 - 添加安全检查
    if ((response.type === 'style-options' || response.aiResponse?.type === 'style-options' || response.metadata?.showStyleSelector) &&
        shouldShowStyleSelectorSafely()) {
      console.log('[ChatPanel] 响应要求显示风格选择器，且满足条件');
      setShowStyleSelector(true);
    }

    // 检测 AI 响应中是否提到风格选择器在下方但未显示 - 修复显示不一致问题
    const hasStyleSelectorMention = response.content.includes('风格选择器') &&
      (response.content.includes('下方') || response.content.includes('在下面') || response.content.includes('下方显示'));
    if (hasStyleSelectorMention && !showStyleSelector && !selectedStyle && shouldShowStyleSelectorSafely()) {
      console.log('[ChatPanel] 检测到 AI 提及风格选择器在下方，且满足条件，自动显示');
      setShowStyleSelector(true);
    }

    // 检测 AI 说"正在生成中"但实际未生成的情况 - 自动触发生成
    const isGeneratingMention = response.content.includes('正在生成') ||
      response.content.includes('正在为你生成') ||
      response.content.includes('立即开始为你生成') ||
      response.content.includes('生成指令已发送') ||
      response.content.includes('让我直接为你生成') ||
      response.content.includes('直接为你生成图像') ||
      response.content.includes('正在生成中，请稍候');

    // 更严格的检查：确保AI真正在确认生成，而不仅仅是提及
    const isRealGenerationConfirmation = isGeneratingMention &&
      !response.content.includes('如果') &&  // 排除条件句
      !response.content.includes('可以') &&  // 排除建议句
      !response.content.includes('需要') &&  // 排除需求询问
      (response.content.includes('✅') ||
       response.content.includes('开始生成') ||
       response.content.includes('立即') ||
       response.content.includes('马上'));   // 必须有明确的确认词

    // 调试日志：显示触发条件状态
    console.log('[ChatPanel] 生成触发检查:', {
      isGeneratingMention,
      isRealGenerationConfirmation,
      hasSelectedStyle: !!selectedStyle,
      hasCurrentTask: !!currentTask,
      isNotGenerating: !isGenerating,
      canTrigger: isRealGenerationConfirmation && selectedStyle && currentTask && !isGenerating
    });

    // 修改：使用更严格的确认检查，避免误触发
    if (isRealGenerationConfirmation && selectedStyle && currentTask && !isGenerating) {
      console.log('[ChatPanel] 检测到 AI 确认生成，自动触发生成流程');
      
      // 添加状态检测开始提示
      addMessage({
        role: 'system',
        content: '🔍 检测到生成请求...\n\n状态：正在验证条件...\n条件检查：✅ 风格已选择\n条件检查：✅ 任务已创建',
        type: 'text'
      });

      // 立即设置生成状态，让用户看到生成动画
      setIsGenerating(true);
      setGenerationMessage('AI正在创作中...');
      
      // 添加开始生成提示
      addMessage({
        role: 'system',
        content: '✅ 条件验证通过，开始生成！',
        type: 'text'
      });

      // 延迟一点时间确保消息先显示，然后触发生成（跳过重复消息）
      setTimeout(() => {
        handleAutoImageGenerationRef.current?.(true);
      }, 800);

      // 设置生成检测定时器 - 10秒后检测是否真的有生成结果
      setTimeout(() => {
        // 检查生成状态
        if (isGenerating && generatedOutputs.length === 0) {
          console.log('[ChatPanel] 生成检测：10秒后仍未生成，可能需要重试');
          // 添加提示消息
          addMessage({
            role: 'system',
            content: '⏳ 生成仍在进行中...\n\n状态：图像生成可能需要更长时间\n建议：请耐心等待，如果长时间无响应将自动重试',
            type: 'text'
          });
        } else if (generatedOutputs.length > 0) {
          // 生成成功了
          addMessage({
            role: 'system',
            content: '✅ 检测到图像已生成！\n\n状态：生成完成\n作品数量：' + generatedOutputs.length,
            type: 'text'
          });
        }
      }, 10000);
    }

    // 检测 AI 错误地说"系统不可用"但实际应该生成的情况 - 自动修正
    const isSystemUnavailableMention = response.content.includes('图像生成系统暂时不可用') ||
      response.content.includes('系统暂时不可用') ||
      response.content.includes('无法生成') ||
      response.content.includes('不能生成');
    if (isSystemUnavailableMention && selectedStyle && currentTask && generatedOutputs.length === 0 && !isGenerating) {
      console.log('[ChatPanel] 检测到 AI 错误地报告系统不可用，自动修正并触发生成流程');
      // 立即设置生成状态，让用户看到生成动画
      setIsGenerating(true);
      setGenerationMessage('正在为您生成设计作品...');
      // 延迟一点时间确保消息先显示，然后触发生成（跳过重复消息）
      setTimeout(() => {
        handleAutoImageGenerationRef.current?.(true);
      }, 800);
    }

    // ==================== 风格选择器智能检测逻辑 ====================

    // 设计意图关键词
    const DESIGN_INTENT_KEYWORDS = [
      '开始设计', '生成方案', '呈现方案', '设计方案', '概念图', '概念草图', '初步方案',
      '为你设计', '提供方案', '制作方案', '提供初步', '设计形象',
      '草图', '绘制', '创作', '呈现', '展示',
      // 新增：更多触发词
      '生成', '创建', '制作', '设计', '画出', '画出',
      '帮我画', '帮我设计', '帮我生成', '给我画', '给我设计',
      '直接生成', '立即生成', '马上生成', '现在生成',
      '可以生成', '能够生成', '准备生成', '开始生成',
      '出图', '出方案', '出设计', '效果图', '设计图',
      'IP形象', '角色设计', '吉祥物', '品牌形象',
      // 用户确认类关键词
      '直接', '立即', '马上', '开始', '确认', '确定',
      '就这样', '可以', '好的', '行', 'OK', 'ok',
      '风格', '样式', '外观', '造型'
    ];

    // 完成相关词汇（用于排除）
    const COMPLETION_KEYWORDS = [
      '生成完成', '已生成', '生成成功', '完成了', '概念图已生成', '已为你生成'
    ];

    // 咨询类词汇（用于排除）
    const CONSULTATION_KEYWORDS = [
      '灵感', '建议', '推荐', '参考', '例子', '案例', '看看', '了解一下',
      '有什么', '哪些', '需求描述', '需求文档', '怎么写', '如何写', '模板', '框架'
    ];

    // 检查是否匹配设计意图
    const matchesDesignIntent = (content: string): boolean => {
      return DESIGN_INTENT_KEYWORDS.some(keyword => content.includes(keyword));
    };

    // 检查是否是完成消息
    const isCompletionMessage = (content: string): boolean => {
      return COMPLETION_KEYWORDS.some(keyword => content.includes(keyword));
    };

    // 检查是否是咨询类消息
    const isConsultationMessage = (content: string): boolean => {
      return CONSULTATION_KEYWORDS.some(keyword => content.includes(keyword));
    };

    // 检查是否应该显示风格选择器
    const shouldShowStyleSelectorForResponse = (
      agent: string,
      content: string,
      hasSelectedStyle: boolean,
      hasGeneratedOutput: boolean,
      lastMsg?: Message
    ): boolean => {
      // 不是设计师、总监或插画师，不触发
      if (agent !== 'designer' && agent !== 'director' && agent !== 'illustrator') return false;

      // 已有风格选择，不重复显示
      if (hasSelectedStyle) return false;

      // 已有生成内容，不重复显示
      if (hasGeneratedOutput) return false;

      // 是完成消息，不显示
      if (isCompletionMessage(content)) return false;

      // 是咨询类消息，不显示
      if (isConsultationMessage(content)) return false;

      // 纯问候语
      if (/^(你好|您好|哈喽|hi|hello|嗨|欢迎)$/i.test(content.trim())) return false;

      // 内容太短（但包含明确生成意图的除外）
      const hasStrongIntent = /(直接生成|立即生成|马上生成|现在生成|帮我生成|给我画|出图)/i.test(content);
      if (content.length < 20 && !hasStrongIntent) return false;

      // 是疑问句（但包含生成关键词的除外）
      const isQuestion = /[？?]/.test(content) || /(能否|请告诉我|需要了解|想知道|请问|什么|谁|哪里|怎么|多少|哪些|何时|为什么)/i.test(content);
      if (isQuestion && !hasStrongIntent) return false;

      // 在收集信息
      if (/(为了给你|为了更好|请提供|请描述|请说明|详细|细节|信息)/i.test(content)) return false;

      // 上一条是询问消息
      if (lastMsg && /[？?]/.test(lastMsg.content)) return false;

      // 匹配设计意图关键词
      return matchesDesignIntent(content);
    };

    // 智能检测是否应该显示风格选择器（使用新的简化逻辑）
    // 检查是否已经有生成的内容 - 使用 getState 避免依赖项循环
    const hasGeneratedContent = useAgentStore.getState().generatedOutputs.length > 0;

    // 检查上一条消息是否是询问（避免连续询问后错误触发）
    const lastMessage = messages[messages.length - 1];

    // 只有需求收集完成后才允许智能检测显示风格选择器
    const canShowStyleSelector = requirementCollection?.stage === 'completed' &&
                                  requirementCollection?.confirmed &&
                                  !selectedStyle &&
                                  !hasGeneratedContent;

    let shouldShowStyleSelector = false;
    if (canShowStyleSelector) {
      shouldShowStyleSelector = shouldShowStyleSelectorForResponse(
        response.agent,
        response.content,
        !!selectedStyle,
        hasGeneratedContent,
        lastMessage
      );
    }

    console.log('[ChatPanel] 智能检测风格选择器:', {
      agent: response.agent,
      content: response.content.slice(0, 100),
      canShowStyleSelector,
      shouldShowStyleSelector,
      selectedStyle,
      hasGeneratedContent,
      requirementStage: requirementCollection?.stage,
      requirementConfirmed: requirementCollection?.confirmed,
      matchedKeyword: DESIGN_INTENT_KEYWORDS.find(keyword => response.content.includes(keyword))
    });

    if (shouldShowStyleSelector && canShowStyleSelector) {
      console.log('[ChatPanel] 触发风格选择器显示');
      // 立即显示风格选择器，减少延迟提升用户体验
      setShowStyleSelector(true);
      // 添加风格选择提示（使用当前Agent，避免硬编码切换）
      const styleMessageId = addMessage({
        role: currentAgent,
        content: '请选择你喜欢的设计风格：',
        type: 'style-options'
      });
      console.log('[ChatPanel] 已添加风格选择消息:', styleMessageId);
    }

    // 智能检测：如果总监询问设计类型，在消息中显示设计类型选项
    const designTypeKeywords = [
      '设计什么类型', '想设计什么', '设计类型', '项目类型',
      '选一个最想开始', '选择类型', '设计方向', '创作什么内容'
    ];

    // 检查是否已经在当前会话中选择了设计类型或用户已指定设计类型
    const hasSelectedDesignType = messages.some(m =>
      m.metadata?.designTypeSelected ||
      (m.type === 'design-type-options' && m.metadata?.selectedDesignType) ||
      requirementCollection?.collectedInfo?.projectType
    );

    const shouldShowDesignTypeOptions = !hasSelectedDesignType &&
      response.agent === 'director' && // 只有总监发送类型选择器
      designTypeKeywords.some(keyword => response.content.includes(keyword));

    if (shouldShowDesignTypeOptions) {
      console.log('[ChatPanel] 总监消息触发设计类型选项显示');
      // 更新当前消息，添加类型选择器 metadata
      updateMessage(messageId, {
        metadata: {
          showDesignTypeSelector: true,
          designTypeOptions: [
            {
              category: '🎨 品牌形象类',
              items: [
                { id: 'ip-character', label: 'IP形象设计', description: '打造独特的角色、吉祥物或虚拟形象', icon: '🎭' },
                { id: 'brand-design', label: '品牌设计', description: '构建完整的品牌视觉识别系统', icon: '🎨' }
              ]
            },
            {
              category: '📦 产品包装类',
              items: [
                { id: 'packaging', label: '包装设计', description: '产品包装创意设计与视觉呈现', icon: '📦' }
              ]
            },
            {
              category: '📢 营销推广类',
              items: [
                { id: 'poster', label: '海报设计', description: '宣传海报、物料设计与视觉传达', icon: '🖼️' },
                { id: 'animation', label: '动画视频', description: '动态视觉内容与短视频制作', icon: '🎬' }
              ]
            },
            {
              category: '✏️ 插画创作类',
              items: [
                { id: 'illustration', label: '插画设计', description: '手绘风格插画与艺术创作', icon: '✏️' }
              ]
            }
          ]
        }
      });
    }
  }, [currentAgent, updateMessage, addMessage, setCollaborating, addToAgentQueue, handleAgentSwitch, setShowStyleSelector, selectedStyle, messages, requirementCollection, thinkingSession]);

  // ==================== 风格选择器智能检测逻辑结束 ====================

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
    // 允许只有图片、只有文字、或两者都有
    const hasText = inputValue.trim().length > 0;
    const hasImages = pastedImages.length > 0;

    if ((!hasText && !hasImages) || isTyping) return;

    // 解析@提及
    const { cleanInput, brands, styles, works, layouts } = parseMentions(inputValue);

    // 如果没有实际内容（只有@提及）且没有图片，不发送
    if (!cleanInput && !hasImages && (brands.length > 0 || styles.length > 0 || works.length > 0 || layouts.length > 0)) {
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

    // 查询引用的作品详细信息
    const mentionedWorks: MentionedWork[] = [];
    if (works.length > 0) {
      // 先获取用户的历史草稿
      const userDrafts = await createDraftService.getUserDrafts(50);

      for (const workName of works) {
        // 1. 先从当前生成的作品中查找
        const matchedOutput = generatedOutputs.find(
          output => output.title === workName || output.id === workName
        );
        if (matchedOutput) {
          mentionedWorks.push({
            id: matchedOutput.id,
            name: workName,
            title: matchedOutput.title,
            imageUrl: matchedOutput.url,
            thumbnail: matchedOutput.thumbnail,
            description: matchedOutput.description,
            prompt: matchedOutput.prompt,
            style: matchedOutput.style,
            type: matchedOutput.type
          });
          continue;
        }

        // 2. 从历史草稿中查找
        const matchedDraft = userDrafts.find(
          draft => draft.name === workName || draft.id === workName
        );
        if (matchedDraft) {
          const selectedResult = matchedDraft.generatedResults?.find(
            (r: any) => r.id === matchedDraft.selectedResult
          );
          const targetResult = selectedResult || matchedDraft.generatedResults?.[0];
          mentionedWorks.push({
            id: matchedDraft.id,
            name: workName,
            title: matchedDraft.name,
            imageUrl: targetResult?.url,
            thumbnail: targetResult?.thumbnail,
            description: matchedDraft.description,
            prompt: matchedDraft.prompt,
            style: matchedDraft.stylePreset,
            type: targetResult?.type === 'video' ? 'video' : 'image'
          });
          continue;
        }

        // 3. 如果没有找到完整信息，至少保留名称
        mentionedWorks.push({
          id: workName,
          name: workName
        });
      }
    }

    // 查询引用的排版详细信息
    let mentionedLayout = null;
    if (layouts.length > 0) {
      const allLayouts = ipPosterService.getAllLayouts();
      mentionedLayout = allLayouts.find(l => l.name === layouts[0]) || null;
      console.log('[ChatPanel] 找到排版:', mentionedLayout?.name);
    }

    // 上传粘贴的图片
    let uploadedImages: Array<{ url: string; thumbnail?: string; name: string; size: number }> = [];
    if (pastedImages.length > 0 && userId) {
      try {
        console.log('[ChatPanel] 开始上传粘贴的图片:', pastedImages.length, '张');
        // 转换 pastedImages 格式以匹配 uploadPastedImages 期望的格式
        const imagesToUpload = pastedImages.map(img => ({
          id: img.id,
          file: img.file,
          preview: img.preview,
          name: img.file.name || `image_${img.id}.png`,
          size: img.file.size
        }));

        const attachments = await uploadPastedImages(imagesToUpload, userId);
        uploadedImages = attachments.map(att => ({
          url: att.url,
          thumbnail: att.thumbnailUrl,
          name: att.title,
          size: att.metadata?.size || 0
        }));
        console.log('[ChatPanel] 图片上传成功:', uploadedImages);
      } catch (error) {
        console.error('[ChatPanel] 图片上传失败:', error);
        toast.error('图片上传失败，将继续发送文字消息');
      }
    }

    setInputValue('');
    setPastedImages([]); // 清空已粘贴的图片

    // 添加用户消息到 store - 使用原始输入值（包含@提及）
    const userMessageObj: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue.trim() || (uploadedImages.length > 0 ? '[图片]' : ''), // 使用原始输入，包含@提及
      timestamp: Date.now(),
      type: uploadedImages.length > 0 ? 'image' : 'text',
      metadata: {
        brands, // 附加品牌信息
        styles, // 附加风格信息
        works,  // 附加作品名称列表（向后兼容）
        mentionedWorks, // 附加作品详细信息
        mentionedLayout, // 附加排版信息
        images: uploadedImages // 附加上传的图片
      }
    };
    addMessage({
      role: 'user',
      content: inputValue.trim() || (uploadedImages.length > 0 ? '[图片]' : ''), // 显示原始输入，包含@提及
      type: uploadedImages.length > 0 ? 'image' : 'text',
      metadata: {
        brands,
        styles,
        works,
        mentionedWorks,
        mentionedLayout,
        images: uploadedImages
      }
    });

    // 对话主题跟踪
    const conversationTracker = getConversationTracker();
    conversationTracker.addMessage(userMessageObj);

    // 检查是否是特殊指令
    const lowerInput = userMessage.toLowerCase();
    if (lowerInput.includes('回到正题') || lowerInput.includes('回到主题') || lowerInput.includes('继续之前')) {
      const topicSummary = conversationTracker.getTopicSummary();
      if (topicSummary) {
        addMessage({
          role: 'system',
          content: `📋 回到正题\n\n${topicSummary}\n\n💡 让我们继续讨论...`,
          type: 'text'
        });
      }
    } else if (lowerInput.includes('总结一下') || lowerInput.includes('总结当前')) {
      const summary = await conversationTracker.summarizeTopic();
      if (summary) {
        addMessage({
          role: 'system',
          content: `📊 对话总结\n\n${summary}`,
          type: 'text'
        });
      }
    } else {
      // 检查是否偏离主题
      const deviationCheck = await conversationTracker.checkTopicDeviation(userMessage);
      if (deviationCheck.isDeviated && deviationCheck.deviationReason) {
        addMessage({
          role: 'system',
          content: `⚠️ 主题偏离提醒\n\n原因：${deviationCheck.deviationReason}\n\n💡 建议：可以输入"回到正题"继续之前的讨论，或者开始新的话题。`,
          type: 'text'
        });
      }
    }

    // 检测用户消息中是否包含风格关键词，自动设置风格（使用清理后的内容）
    console.log('[ChatPanel] 检测风格 - cleanInput:', cleanInput, '当前 selectedStyle:', selectedStyle);
    const detectedStyle = detectStyleFromMessage(cleanInput);
    console.log('[ChatPanel] 检测风格结果:', detectedStyle);
    if (detectedStyle && !selectedStyle) {
      console.log('[ChatPanel] 从用户消息中检测到风格:', detectedStyle);
      selectStyle(detectedStyle);
      toast.success(`已自动选择风格：${PRESET_STYLES.find(s => s.id === detectedStyle)?.name}`);
    }

    setIsTyping(true);

    // 消费津币（仅限登录用户）
    let jinbiConsumed = false;
    let jinbiRecordId: string | undefined;
    if (userId && !userId.startsWith('anon_')) {
      const consumeResult = await consumeJinbi(
        jinbiCost,
        'agent_chat',
        'Agent 对话消费',
        { serviceParams: { agentType: currentAgent } }
      );
      if (consumeResult.success) {
        jinbiConsumed = true;
        jinbiRecordId = consumeResult.recordId;
        toast.success(`已消耗 ${jinbiCost} 津币`, { duration: 2000 });
      } else {
        toast.error('津币扣除失败，请重试');
        setIsTyping(false);
        return;
      }
    }

    try {
      // 使用智能意图分析器分析用户输入
      intentAnalyzer.setContext({
        history: messages.map(m => ({ role: m.role, content: m.content, timestamp: m.timestamp })),
        currentAgent,
        selectedStyle
      });

      const intentAnalysis = intentAnalyzer.analyze(cleanInput);
      console.log('[ChatPanel] 智能意图分析结果:', intentAnalysis);

      // 根据意图分析结果调整处理策略
      // 如果是问候意图，简化处理
      if (intentAnalysis.primaryIntent === 'greeting') {
        console.log('[ChatPanel] 检测到问候意图，简化处理');
      }

      // 如果是咨询意图，提供更详细的建议
      const isConsultation = intentAnalysis.primaryIntent === 'consult';

      // 检查是否是明确的设计需求
      // 排除词：这些词表示用户只是咨询/寻求建议，不是要做设计
      const exclusionKeywords = /(灵感|建议|推荐|参考|例子|案例|看看|了解一下|有什么|哪些|需求描述|需求文档|怎么写|如何写|模板|框架)/i;

      const isDesignRequest = (/(设计|生成|创作|绘制|海报|logo|ip|形象|品牌|包装|插画|动画)/i.test(cleanInput) &&
        !exclusionKeywords.test(cleanInput) && // 排除咨询类输入
        cleanInput.length > 5 &&
        !/^(你好|您好|哈喽|hi|hello|嗨|早上好|下午好|晚上好)/i.test(cleanInput.trim())) ||
        (intentAnalysis.primaryIntent === 'generate' && intentAnalysis.confidence > 0.6);

      console.log('[ChatPanel] 设计需求检测:', {
        cleanInput,
        isDesignRequest,
        intentAnalysis,
        hasDesignKeyword: /(设计|生成|创作|绘制|海报|logo|ip|形象|品牌|包装|插画|动画)/i.test(cleanInput),
        hasExclusionKeyword: exclusionKeywords.test(cleanInput),
        exclusionMatch: cleanInput.match(exclusionKeywords)
      });

      // 如果没有当前任务，先分析需求并创建任务（使用清理后的内容）
      if (!currentTask && isDesignRequest) {
        const analysis = await analyzeDesignRequirements(cleanInput);
        const taskType = analysis.type;
        const taskTitle = getTaskTitle(taskType);
        createTask(taskType, taskTitle, cleanInput);

        // 更新任务需求，包含品牌信息
        updateTaskRequirements({
          description: cleanInput,
          brand: brands.length > 0 ? brands[0] : undefined
        });

        // 立即在右侧显示任务卡片 - 改进用户体验
        console.log('[ChatPanel] 立即在右侧显示任务卡片:', taskTitle);
        addOutput({
          type: 'image',
          url: '', // 占位，稍后更新
          thumbnail: '',
          title: taskTitle,
          description: cleanInput,
          status: 'pending', // 初始状态为待处理，不是生成中
          prompt: cleanInput,
          agentType: currentAgent
        });
      } else if (currentTask) {
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
        mentionedWorks: mentionedWorks.length > 0 ? mentionedWorks : undefined, // 传递引用的作品信息
        images: uploadedImages.length > 0 ? uploadedImages : undefined, // 传递上传的图片
        currentTask: currentTask ? {
          type: currentTask.type,
          requirements: currentTask.requirements
        } : undefined,
        userId,
        sessionId
      };

      // 检测是否将要生成图像（有任务、有风格、用户表达了生成意图）
      const hasGenerationIntent = /(生成|画|设计|创作|绘制|开始|直接|出图)/i.test(cleanInput);
      const willGenerateImage = currentTask && selectedStyle && hasGenerationIntent;

      let generatingMessageId: string | null = null;

      if (willGenerateImage) {
        // 先显示"正在生成"的消息
        generatingMessageId = addMessage({
          role: currentAgent,
          content: `⏳ **正在生成中...**

我正在为你创作${selectedStyle ? PRESET_STYLES.find(s => s.id === selectedStyle)?.name || selectedStyle : ''}风格的作品：

**设计需求：** ${currentTask?.requirements.description || cleanInput}
${brands.length > 0 ? `**品牌：** ${brands[0]}` : ''}

预计需要 **30-60 秒**，请稍候...

---
💡 **小贴士：** 生成过程中你可以继续与我对话，我会记住你的需求。`,
          type: 'text',
          metadata: {
            isGenerating: true,
            startTime: Date.now(),
            estimatedDuration: '30-60秒'
          }
        });

        // 显示 toast 提示
        toast.info('正在生成图像，预计30-60秒...', { duration: 3000 });
      }

      // 创建临时消息用于流式显示
      const tempMessageId = addMessage({
        role: currentAgent,
        content: '',
        type: 'text'
      });

      // 初始化思考过程（用于展示 AI 的思考与决策）
      setThinkingSession({
        id: Date.now().toString(),
        startTime: Date.now(),
        status: 'running',
        currentStepIndex: 0,
        steps: [
          {
            id: 'step-1',
            type: 'intent',
            title: '意图识别',
            status: 'processing',
            summary: '正在分析用户意图...',
            details: {
              input: { message: userMessage }
            },
            startTime: Date.now()
          }
        ]
      });
      setShowThinkingProcess(true);

      // 使用编排器处理用户输入（带错误处理和重试）
      const orchestratorResult = await errorHandler.handleWithRetry(
        async () => {
          // 构建 V2 上下文
          const contextV2: ConversationContextV2 = {
            ...context,
            systemStatus: {
              isGenerating: false,
              isThinking: true
            }
          };
          
          const v2Response = await processWithOrchestrator(userMessage, contextV2);
          
          // 保存增强版思考过程
          if (v2Response.thinkingSteps) {
            setEnhancedThinkingSteps(v2Response.thinkingSteps);
          }
          
          // 转换 V2 响应为 V1 格式（兼容现有处理逻辑）
          const response = {
            type: v2Response.type === 'collaboration' ? 'delegation' : v2Response.type,
            agent: v2Response.agent,
            content: v2Response.content,
            aiResponse: v2Response.aiResponse,
            delegationTask: v2Response.delegationTask,
            collaborationAgents: v2Response.collaborationAgents,
            workflow: v2Response.workflow,
            metadata: {
              ...v2Response.metadata,
              decisionInfo: v2Response.decisionInfo,
              thinkingSteps: v2Response.thinkingSteps
            }
          };
          
          // 更新思考过程显示
          if (v2Response.thinkingSteps && v2Response.thinkingSteps.length > 0) {
            const lastStep = v2Response.thinkingSteps[v2Response.thinkingSteps.length - 1];
            setThinkingSession(prev => prev ? {
              ...prev,
              status: lastStep.status === 'error' ? 'error' : 'completed',
              steps: v2Response.thinkingSteps!.map((step, index) => ({
                id: step.id,
                type: step.type,
                title: step.title,
                status: step.status === 'running' ? 'processing' : 
                        step.status === 'completed' ? 'completed' : 'error',
                summary: step.summary || '',
                details: step.details,
                startTime: step.startTime,
                endTime: step.endTime
              }))
            } : null);
          }

          // 更新当前 Agent（仅在未锁定状态下）
          // 避免过度切换：如果用户只是咨询，不要切换Agent
          const isConsultation = /(灵感|建议|推荐|参考|例子|案例|看看|了解一下|有什么|哪些|需求描述|需求文档|怎么写|如何写|模板|框架)/i.test(userMessage);
          
          // 如果 Agent 被锁定，不自动切换
          if (isAgentLocked) {
            console.log('[ChatPanel] Agent is locked, keeping:', currentAgent, '(orchestrator suggested:', response.agent, ')');
          } else {
            const shouldSwitchAgent = response.agent !== currentAgent && 
                                      !currentTask?.requirements?.projectType && 
                                      !isConsultation &&
                                      response.type === 'delegation'; // 只有明确的委派才切换
            
            if (shouldSwitchAgent) {
              console.log('[ChatPanel] Switching agent:', currentAgent, '->', response.agent);
              setCurrentAgent(response.agent);
            } else if (response.agent !== currentAgent) {
              console.log('[ChatPanel] Keeping current agent:', currentAgent, '(requested:', response.agent, ', isConsultation:', isConsultation, ')');
            }
          }

          // 流式显示响应
          await streamResponse(response.content, tempMessageId);

          // 处理编排器响应
          await handleOrchestratorResponse(response, tempMessageId);

          // 根据响应类型设置需求收集确认状态
          // 如果响应类型是 delegation、workflow、chain 或 handoff，说明需求收集已完成
          if (['delegation', 'workflow', 'chain', 'handoff'].includes(response.type)) {
            if (!requirementCollection?.confirmed) {
              console.log('[ChatPanel] 检测到任务分配/工作流响应，设置需求已确认');
              setRequirementConfirmed(true);
            }
          }

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

      // 更新思考过程为完成状态
      setThinkingSession(prev => {
        if (!prev) return null;
        const endTime = Date.now();
        return {
          ...prev,
          endTime,
          status: 'completed',
          totalExecutionTime: endTime - prev.startTime,
          steps: prev.steps.map(step => ({
            ...step,
            status: step.status === 'processing' ? 'completed' : step.status,
            endTime: step.status === 'processing' ? endTime : step.endTime,
            executionTime: step.status === 'processing' && step.startTime
              ? endTime - step.startTime
              : step.executionTime
          }))
        };
      });

    } catch (error) {
      console.error('[Chat] Error:', error);

      // 更新思考过程为错误状态
      setThinkingSession(prev => {
        if (!prev) return null;
        const endTime = Date.now();
        return {
          ...prev,
          endTime,
          status: 'error',
          totalExecutionTime: endTime - prev.startTime,
          steps: prev.steps.map(step => ({
            ...step,
            status: step.status === 'processing' ? 'error' : step.status,
            endTime: step.status === 'processing' ? endTime : step.endTime,
            executionTime: step.status === 'processing' && step.startTime
              ? endTime - step.startTime
              : step.executionTime,
            details: step.status === 'processing'
              ? { ...step.details, error: error instanceof Error ? error.message : String(error) }
              : step.details
          }))
        };
      });

      // 津币扣费回滚（如果已扣费但处理失败）
      if (jinbiConsumed && jinbiRecordId && userId && !userId.startsWith('anon_')) {
        console.log('[Chat] 津币扣费回滚，recordId:', jinbiRecordId);
        const refundResult = await refundJinbi(jinbiCost, jinbiRecordId, 'Agent对话处理失败');
        if (refundResult.success) {
          toast.success('已退还扣减的津币');
        } else {
          console.error('[Chat] 津币回滚失败:', refundResult.error);
        }
      }

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
  // 待处理的设计类型（用于品牌设计流程）
  const [pendingDesignType, setPendingDesignType] = useState<string | null>(null);

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

  // 处理风格库开关
  const toggleStyleLibrary = () => {
    const newState = !showStyleLibrary;
    // 关闭其他库
    if (newState) {
      setShowBrandLibrary(false);
      setShowWorkLibrary(false);
      setShowIPPosterLibrary(false);
    }
    setShowStyleLibrary(newState);
  };

  // 处理品牌库开关
  const toggleBrandLibrary = () => {
    const newState = !showBrandLibrary;
    if (newState) {
      setShowStyleLibrary(false);
      setShowWorkLibrary(false);
      setShowIPPosterLibrary(false);
    }
    setShowBrandLibrary(newState);
  };

  // 处理作品库开关
  const toggleWorkLibrary = () => {
    const newState = !showWorkLibrary;
    if (newState) {
      setShowStyleLibrary(false);
      setShowBrandLibrary(false);
      setShowIPPosterLibrary(false);
    }
    setShowWorkLibrary(newState);
  };

  // 处理排版库开关
  const toggleIPPosterLibrary = () => {
    const newState = !showIPPosterLibrary;
    if (newState) {
      setShowStyleLibrary(false);
      setShowBrandLibrary(false);
      setShowWorkLibrary(false);
    }
    setShowIPPosterLibrary(newState);
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

  // 处理 IP 海报排版库选择
  const handleIPPosterLibrarySelect = (layout: any) => {
    setSelectedIPPosterLayoutId(layout.id);
    // 在输入框中显示 @排版名，并保留用户已输入的内容
    setInputValue(prev => {
      const mention = `@${layout.name} `;
      return prev ? `${prev} ${mention}` : mention;
    });
    toast.success(`已选择排版：${layout.name}，请在输入框中描述您的需求`);
    setShowIPPosterLibrary(false);
    // 聚焦到输入框
    inputRef.current?.focus();
  };

  // 处理品牌选择（常规流程）
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

  // 处理品牌设计流程中的品牌选择
  const handleBrandSelectedForDesign = useCallback((brand: Brand) => {
    setShowBrandLibrary(false);
    setSelectedBrand(brand);

    // 如果存在待处理的设计类型，继续流程
    if (pendingDesignType === 'brand-design') {
      // 找到最后一条 brand-options 消息并更新它
      const lastBrandOptionsMessage = messages.slice().reverse().find(m => m.type === 'brand-options');
      if (lastBrandOptionsMessage) {
        updateMessage(lastBrandOptionsMessage.id, {
          metadata: {
            ...lastBrandOptionsMessage.metadata,
            selectedBrand: brand
          }
        });
      }

      // 清空待处理状态
      setPendingDesignType(null);
    }

    // 在输入框中添加品牌引用
    setInputValue(prev => {
      const mention = `@${brand.name} `;
      return prev ? `${prev} ${mention}` : mention;
    });

    toast.success(`已选择品牌：${brand.name}，请描述您的设计需求`);
  }, [pendingDesignType, messages, updateMessage, setInputValue]);

  // 监听品牌选择事件（来自 BrandSelector）
  useEffect(() => {
    const handleBrandSelected = (event: CustomEvent<Brand>) => {
      const brand = event.detail;
      console.log('[ChatPanel] 收到品牌选择事件:', brand.name, 'pendingDesignType:', pendingDesignType);
      // 只要有pendingDesignType就处理，不一定是'brand-design'
      if (pendingDesignType) {
        handleBrandSelectedForDesign(brand);
      } else {
        // 如果没有pendingDesignType，使用常规处理
        handleBrandSelect(brand);
      }
    };

    window.addEventListener('brand-selected-for-design', handleBrandSelected as EventListener);
    return () => {
      window.removeEventListener('brand-selected-for-design', handleBrandSelected as EventListener);
    };
  }, [pendingDesignType, handleBrandSelectedForDesign, handleBrandSelect]);

  // 监听选项选择事件
  useEffect(() => {
    const handleOptionSelected = (event: CustomEvent<{ option: any; message: AgentMessage }>) => {
      const { option, message } = event.detail;
      console.log('[ChatPanel] 收到选项选择事件:', option, '当前工作流:', activeWorkflow?.name);

      // 注意：细化设计选项 (formal-concept, three-view, detail-design) 现在直接使用 trigger-auto-generation 事件
      // 不再通过 option-selected 事件处理，参见 ChatMessage.tsx 中的 handleRefinementOption

      // 添加用户选择消息
      addMessage({
        role: 'user',
        content: option.label,
        type: 'text'
      });

      // 检查是否是工作流相关操作
      if (option.action === 'start_workflow' || option.action?.startsWith('start_workflow_step_')) {
        console.log('[ChatPanel] 用户选择开始执行工作流，action:', option.action);
        
        // 使用函数式更新获取最新的 activeWorkflow 状态
        setActiveWorkflow(prev => {
          if (prev) {
            console.log('[ChatPanel] 启动工作流:', prev.name);
            
            // 添加系统消息
            addMessage({
              role: 'system',
              content: `开始执行：**${prev.steps[0].name}**\n\n正在为您${prev.steps[0].description}...`,
              type: 'text'
            });
            
            // 触发实际的图像生成
            setTimeout(() => {
              if (selectedStyle && currentTask) {
                handleAutoImageGenerationRef.current?.(true);
              } else if (!selectedStyle) {
                // 如果没有选择风格，显示风格选择器
                setShowStyleSelector(true);
                addMessage({
                  role: 'system',
                  content: '请先选择一个风格，然后开始生成。',
                  type: 'text'
                });
              }
            }, 500);
            
            return { ...prev, isExecuting: true };
          }
          console.warn('[ChatPanel] 没有活跃的工作流可启动');
          return prev;
        });
        return;
      }

      if (option.action === 'cancel_workflow') {
        console.log('[ChatPanel] 用户取消工作流');
        setActiveWorkflow(null);
        addMessage({
          role: 'system',
          content: '已取消工作流。您可以随时提出新的需求。',
          type: 'text'
        });
        return;
      }

      // 检查是否是确认生成类的选项（如"开始"、"确认"、"生成"等）
      const isGenerationConfirmation = /^(开始|确认|生成|立即生成|开始生成)$/i.test(option.label.trim());

      // 如果是确认生成，且未选择风格，则检查是否满足显示条件
      if (isGenerationConfirmation && !selectedStyle) {
        if (shouldShowStyleSelectorSafely()) {
          console.log('[ChatPanel] 用户确认生成且满足条件，显示风格选择器');
          setShowStyleSelector(true);
        } else {
          console.log('[ChatPanel] 用户确认生成但不满足条件，继续对话');
          // 添加提示消息说明需要先完成需求确认
          addMessage({
            role: 'system',
            content: '💡 在生成之前，我需要先了解你的具体需求。请告诉我更多关于设计的想法。',
            type: 'text'
          });
        }
        return;
      }

      // 触发 Agent 响应
      setTimeout(async () => {
        setIsLoading(true);
        try {
          const response = await processWithOrchestrator(option.label, {
            userId: authUser?.id || 'anonymous',
            sessionId: sessionIdRef.current,
            currentAgent: currentAgent,
            history: messages,
            mentionedWork: selectedWork || undefined,
            mentionedBrand: selectedBrand || undefined
          });

          if (response) {
            addMessage({
              role: response.agent || currentAgent,
              content: response.content,
              type: response.type || 'text',
              metadata: {
                ...response.metadata,
                thinking: response.aiResponse?.metadata?.thinking
              }
            });
          }
        } catch (error) {
          console.error('[ChatPanel] 处理选项选择失败:', error);
          toast.error('处理失败，请重试');
        } finally {
          setIsLoading(false);
        }
      }, 100);
    };

    window.addEventListener('option-selected', handleOptionSelected as EventListener);
    return () => {
      window.removeEventListener('option-selected', handleOptionSelected as EventListener);
    };
  }, [currentAgent, messages, authUser, selectedWork, selectedBrand, addMessage, selectedStyle, setShowStyleSelector, currentTask, activeWorkflow]);

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

  // 快速操作 - 仅保留库相关按钮，其他按钮已移到输入框下方
  const quickActions = [
    { icon: Layers, label: '风格库', onClick: toggleStyleLibrary, isActive: showStyleLibrary },
    { icon: Store, label: '品牌库', onClick: toggleBrandLibrary, isActive: showBrandLibrary },
    { icon: Library, label: '作品库', onClick: toggleWorkLibrary, isActive: showWorkLibrary },
    { icon: LayoutTemplate, label: '排版库', onClick: toggleIPPosterLibrary, isActive: showIPPosterLibrary }
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
        onComplete={() => {
          // 动画完成后切换到目标Agent
          setCurrentAgent(switcherToAgent);
          setShowAgentSwitcher(false);
        }}
        reasoning={switcherReasoning}
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
              onHintSelect={(hint: InspirationHint, autoSend?: boolean) => {
                if (autoSend) {
                  // "为你推荐"的提示：构建询问消息并自动发送
                  const inquiryMessage = `请介绍一下「${hint.title}」相关内容，并给我适合的创作灵感。`;
                  setInputValue(inquiryMessage);
                  toggleInspirationPanel();
                  toast.success(`正在询问：${hint.title}`);
                  // 延迟一点再发送，确保UI更新
                  setTimeout(() => {
                    handleSend();
                  }, 100);
                } else {
                  // 普通灵感提示：只设置到输入框
                  setInputValue(hint.examplePrompt);
                  toggleInspirationPanel();
                  toast.success(`已应用灵感提示：${hint.title}`);
                }
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

      {/* IP 海报排版库面板 */}
      <AnimatePresence>
        {showIPPosterLibrary && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className={`fixed right-0 top-0 h-full w-[480px] shadow-2xl z-40 ${
              isDark ? 'bg-gray-800' : 'bg-white'
            }`}
          >
            <IPPosterLibrary
              onLayoutSelect={handleIPPosterLibrarySelect}
              onClose={() => setShowIPPosterLibrary(false)}
              currentLayoutId={selectedIPPosterLayoutId}
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
              onBrandSelect={(brand) => {
                console.log('[ChatPanel] BrandLibrary onBrandSelect:', brand.name, 'pendingDesignType:', pendingDesignType);
                if (pendingDesignType) {
                  handleBrandSelectedForDesign(brand);
                } else {
                  handleBrandSelect(brand);
                }
              }}
              onClose={() => {
                console.log('[ChatPanel] BrandLibrary onClose, pendingDesignType:', pendingDesignType);
                setShowBrandLibrary(false);
                // 注意：品牌选择后会自动调用onClose，此时pendingDesignType已经被handleBrandSelectedForDesign清空
                // 所以这里不需要再清理pendingDesignType
              }}
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

      {/* Agent 选择栏 */}
      <div className={`px-4 py-2 border-b ${isDark ? 'border-gray-800 bg-[#1a1f1a]' : 'border-gray-200 bg-white'}`}>
        <div className="flex items-center justify-between">
          <AgentSelector 
            currentAgent={currentAgent}
            onAgentChange={(agent) => {
              setCurrentAgent(agent);
              setIsAgentLocked(true); // 用户手动选择后自动锁定
              toast.success(`已切换到 ${AGENT_CONFIG[agent as keyof typeof AGENT_CONFIG]?.name || agent}`);
            }}
            isLocked={isAgentLocked}
            onToggleLock={() => {
              setIsAgentLocked(!isAgentLocked);
              toast.info(isAgentLocked ? '已解锁，系统将自动匹配最佳 Agent' : '已锁定当前 Agent');
            }}
          />
          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
            {isAgentLocked ? '🔒 已锁定' : '点击切换团队成员'}
          </span>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        {/* 智能建议面板 */}
        <SuggestionPanel onSuggestionClick={handleSuggestionClick} />

        {/* 工作流状态 */}
        <WorkflowStatus />

        {/* 增强版思考过程面板 */}
        {enhancedThinkingSteps.length > 0 && (
          <div className="sticky top-2 z-10">
            <ThinkingProcessPanel
              steps={enhancedThinkingSteps}
              isVisible={true}
              onClose={() => setEnhancedThinkingSteps([])}
              className="ml-auto mr-4 shadow-xl"
            />
          </div>
        )}

        {/* 工作流执行面板 */}
        {activeWorkflow && (
          <WorkflowExecutionPanel
            workflowName={activeWorkflow.name}
            steps={activeWorkflow.steps}
            currentStepIndex={activeWorkflow.currentStepIndex}
            estimatedDuration={activeWorkflow.estimatedDuration}
            isExecuting={activeWorkflow.isExecuting}
            onStart={async () => {
              setActiveWorkflow(prev => prev ? { ...prev, isExecuting: true } : null);
              // 开始执行第一步
              addMessage({
                role: 'system',
                content: `开始执行：**${activeWorkflow.steps[0].name}**\n\n正在为您${activeWorkflow.steps[0].description}...`,
                type: 'text'
              });
              
              // 触发实际的图像生成
              if (selectedStyle && currentTask) {
                setTimeout(() => {
                  handleAutoImageGenerationRef.current?.(true);
                }, 500);
              } else if (!selectedStyle) {
                // 如果没有选择风格，显示风格选择器
                setShowStyleSelector(true);
                addMessage({
                  role: 'system',
                  content: '请先选择一个风格，然后开始生成。',
                  type: 'text'
                });
              }
            }}
            onPause={() => {
              setActiveWorkflow(prev => prev ? { ...prev, isExecuting: false } : null);
            }}
            onResume={() => {
              setActiveWorkflow(prev => prev ? { ...prev, isExecuting: true } : null);
            }}
            onSkip={() => {
              // 跳过当前步骤
              const newSteps = [...activeWorkflow.steps];
              newSteps[activeWorkflow.currentStepIndex].status = 'skipped';
              const nextIndex = activeWorkflow.currentStepIndex + 1;
              
              if (nextIndex < newSteps.length) {
                newSteps[nextIndex].status = 'running';
                setActiveWorkflow(prev => prev ? {
                  ...prev,
                  steps: newSteps,
                  currentStepIndex: nextIndex
                } : null);
                
                addMessage({
                  role: 'system',
                  content: `已跳过当前步骤，开始执行：**${newSteps[nextIndex].name}**`,
                  type: 'text'
                });
              } else {
                // 所有步骤完成
                setActiveWorkflow(null);
                addMessage({
                  role: 'system',
                  content: '工作流执行完成！所有步骤已处理完毕。',
                  type: 'text'
                });
              }
            }}
            onConfirmStep={() => {
              // 完成当前步骤
              const newSteps = [...activeWorkflow.steps];
              newSteps[activeWorkflow.currentStepIndex].status = 'completed';
              newSteps[activeWorkflow.currentStepIndex].endTime = Date.now();
              const nextIndex = activeWorkflow.currentStepIndex + 1;
              
              if (nextIndex < newSteps.length) {
                newSteps[nextIndex].status = 'running';
                setActiveWorkflow(prev => prev ? {
                  ...prev,
                  steps: newSteps,
                  currentStepIndex: nextIndex
                } : null);
                
                addMessage({
                  role: 'system',
                  content: `✅ **${newSteps[activeWorkflow.currentStepIndex].name}** 已完成！\n\n继续执行下一步：**${newSteps[nextIndex].name}**`,
                  type: 'text'
                });
                
                // 自动触发下一步的图像生成（变体或新设计）
                if (selectedStyle && currentTask) {
                  setTimeout(() => {
                    // 为下一步生成变体或新设计
                    handleAutoImageGenerationRef.current?.(true);
                  }, 500);
                }
              } else {
                // 所有步骤完成
                setActiveWorkflow(null);
                addMessage({
                  role: 'system',
                  content: '🎉 **工作流执行完成！**\n\n所有步骤已成功完成。您可以查看右侧画布中的设计成果。',
                  type: 'text'
                });
              }
            }}
            onCancel={() => {
              setActiveWorkflow(null);
              addMessage({
                role: 'system',
                content: '工作流已取消。您可以随时重新开始或提出新的需求。',
                type: 'text'
              });
            }}
          />
        )}

        <AnimatePresence>
          {Array.isArray(messages) && messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLast={index === messages.length - 1}
              onOpenStyleLibrary={() => setShowStyleLibrary(true)}
              onCloseStyleLibrary={() => setShowStyleLibrary(false)}
              showStyleLibrary={showStyleLibrary}
              onOpenBrandLibrary={() => setShowBrandLibrary(true)}
              onSetPendingDesignType={setPendingDesignType}
            />
          ))}
        </AnimatePresence>

        {/* IP形象视频加载动画 - 只要加载就显示 */}
        {(() => {
          console.log('[ChatPanel] IP动画渲染检查:', { isGenerating, isTyping, shouldShow: isGenerating || isTyping });
          return null;
        })()}
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
                    (action as any).isActive
                      ? 'bg-[#C02C38]/20 text-[#C02C38] border border-[#C02C38]'
                      : isDark
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
            {/* 清空对话按钮 */}
            <motion.button
              onClick={handleClear}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                p-2.5 rounded-lg transition-all
                ${isDark
                  ? 'bg-[#2A2A3E] text-gray-400 hover:bg-[#3A3A4E] hover:text-gray-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                }
              `}
              title="清空对话"
            >
              <Trash2 className="w-4 h-4" />
            </motion.button>
            {/* 上传参考按钮 */}
            <motion.button
              onClick={() => setShowUploadDialog(true)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                p-2.5 rounded-lg transition-all
                ${isDark
                  ? 'bg-[#2A2A3E] text-gray-400 hover:bg-[#3A3A4E] hover:text-gray-200'
                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                }
              `}
              title="上传参考"
            >
              <ImageIcon className="w-4 h-4" />
            </motion.button>
            {/* 灵感提示按钮 */}
            <motion.button
              onClick={toggleInspirationPanel}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                p-2.5 rounded-lg transition-all
                ${showInspirationPanel
                  ? 'bg-[#C02C38]/20 text-[#C02C38] border border-[#C02C38]'
                  : isDark
                    ? 'bg-[#2A2A3E] text-gray-400 hover:bg-[#3A3A4E] hover:text-gray-200'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                }
              `}
              title="灵感提示"
            >
              <Sparkles className="w-4 h-4" />
            </motion.button>
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
            {/* AI 优化按钮 */}
            <motion.button
              onClick={handleOptimizePrompt}
              disabled={isOptimizingPrompt || !inputValue.trim()}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={`
                p-2.5 rounded-lg transition-all
                ${isOptimizingPrompt
                  ? 'opacity-50 cursor-not-allowed'
                  : ''
                }
                ${!inputValue.trim()
                  ? isDark
                    ? 'bg-[#2A2A3E] text-gray-500'
                    : 'bg-gray-200 text-gray-400'
                  : isDark
                    ? 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white shadow-lg shadow-[#C02C38]/20 hover:shadow-xl'
                    : 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white shadow-lg shadow-[#C02C38]/20 hover:shadow-xl'
                }
              `}
              title="AI 优化提示词"
            >
              {isOptimizingPrompt ? (
                <motion.div
                  className="w-4 h-4 border-2 border-current border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <Wand2 className="w-4 h-4" />
              )}
            </motion.button>
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
