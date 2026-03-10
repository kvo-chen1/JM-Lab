import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useAgentStore } from '../hooks/useAgentStore';
import { supabase } from '@/lib/supabase';
import { useMonitoring } from '../hooks/useMonitoring';
import { usePrediction } from '../hooks/usePrediction';
import { useABTesting } from '../hooks/useABTesting';
import { useDynamicWorkflow } from '../hooks/useDynamicWorkflow';
import { Send, Image as ImageIcon, Mic, Sparkles, Trash2, Bot, X, ChevronDown, Wand2, Layers } from 'lucide-react';
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
import type { InspirationHint, StyleOption } from '../types/agent';
import {
  agentOrchestrator,
  processWithOrchestrator,
  ConversationContext
} from '../services/agentOrchestrator';
import {
  analyzeDesignRequirements
} from '../services/agentService';
import { agentScheduler, AgentResponse } from '../services/agentScheduler';
import { getResourceManager } from '../services/resourceManager';
import { errorHandler } from '../services/errorHandler';
import { llmService } from '@/services/llmService';
import type { DesignTask, AgentMessage, AgentType, OrchestratorResponse } from '../types/agent';
import { AGENT_CONFIG, PRESET_STYLES } from '../types/agent';
import { Suggestion } from '../services/suggestionEngine';

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
    selectStyle
  } = useAgentStore();

  const [inputValue, setInputValue] = useState('');
  const [streamingContent, setStreamingContent] = useState('');
  const [showAgentSwitcher, setShowAgentSwitcher] = useState(false);
  const [switcherFromAgent, setSwitcherFromAgent] = useState<AgentType | undefined>();
  const [switcherToAgent, setSwitcherToAgent] = useState<AgentType>('director');
  const [isOptimizingPrompt, setIsOptimizingPrompt] = useState(false);
  const [analyzingImage, setAnalyzingImage] = useState<string | null>(null);
  const [showStyleLibrary, setShowStyleLibrary] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [userId, setUserId] = useState<string | undefined>(undefined);
  const [sessionId, setSessionId] = useState<string | undefined>(undefined);

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

        // 获取用户ID（如果已登录）
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setUserId(user.id);
          console.log('[ChatPanel] 用户已登录:', user.id, '会话ID:', storedSessionId);
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
  }, []);

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

    try {
      // 构建生成提示词
      const taskDescription = currentTask.requirements?.description || 'IP形象设计';
      const prompt = `${taskDescription}，${style.prompt}，高质量，精美细节，专业设计作品`;

      console.log('[ChatPanel] 自动触发图像生成，prompt:', prompt);

      // 调用图像生成API
      const result = await llmService.generateImage({
        model: 'wanx-v1',
        prompt: prompt,
        size: '1024x1024',
        n: 1
      });

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

      // 从之前的消息中提取AI生成的描述（查找最近一条非用户的消息）
      const lastAgentMessage = messages.slice().reverse().find(m => m.role !== 'user');
      const generatedDescription = lastAgentMessage?.content || '';
      // 提取标题（第一行或前20个字符）
      const title = generatedDescription.split('\n')[0].slice(0, 30) || '未命名作品';

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
        description: generatedDescription
      });

      toast.success('图像生成成功！');
    } catch (error: any) {
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

      case 'generating':
        // 生成中状态 - 添加占位符到画布，然后自动触发实际生成
        {
          const generatingOutputId = addOutput({
            type: 'image',
            url: '', // 空URL表示生成中
            thumbnail: '',
            prompt: response.generatingPrompt || '生成中...',
            style: selectedStyle || undefined,
            agentType: response.agent,
            title: '生成中...',
            description: 'AI正在为您创作，请稍候～',
            status: 'generating'
          });

          // 更新消息
          updateMessage(messageId, {
            content: response.content,
            type: 'text'
          });

          console.log('[ChatPanel] 生成中占位符已添加:', generatingOutputId);

          // 自动触发实际生成
          if (response.generatingPrompt) {
            console.log('[ChatPanel] 自动触发实际生成，提示词:', response.generatingPrompt);

            // 延迟一下让用户看到"生成中"状态
            setTimeout(async () => {
              try {
                // 调用 llmService.generateImage 实际生成图像
                const result = await llmService.generateImage({
                  model: 'wanx-v1',
                  prompt: response.generatingPrompt!,
                  size: '1024x1024',
                  n: 1
                });

                console.log('[ChatPanel] 图像生成结果:', result);

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

                // 更新输出为完成状态
                updateOutput(generatingOutputId, {
                  url: imageUrl,
                  thumbnail: imageUrl,
                  status: 'completed',
                  title: '设计作品',
                  description: '生成完成！'
                });

                // 添加完成消息
                addMessage({
                  role: response.agent,
                  content: `✨ **生成完成！**

看看效果如何？如果需要调整风格、颜色或细节，随时告诉我！`,
                  type: 'text'
                });

                console.log('[ChatPanel] 图像生成完成并更新到画布:', generatingOutputId);
                toast.success('图像生成成功！');
              } catch (error: any) {
                console.error('[ChatPanel] 图像生成失败:', error);

                // 更新输出为错误状态
                updateOutput(generatingOutputId, {
                  status: 'error',
                  title: '生成失败',
                  description: `生成失败：${error.message}`
                });

                // 添加错误消息
                addMessage({
                  role: 'system',
                  content: `❌ **生成失败**\n\n抱歉，图像生成遇到了问题：${error.message}\n\n请稍后重试，或者换一种描述方式告诉我你的需求～`,
                  type: 'text'
                });

                toast.error('图像生成失败，请重试');
              }
            }, 1000); // 延迟1秒让用户看到"生成中"状态
          }
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
    const designKeywords = [
      '开始设计', '生成方案', '呈现方案', '设计方案', '概念图', '概念草图', '初步方案',
      '为你设计', '提供方案', '制作方案', '提供初步', '设计形象',
      '草图', '绘制', '创作', '生成', '呈现', '展示', '1分钟', '马上', '立即'
    ];
    const shouldShowStyleSelector = (response.agent === 'designer' || response.agent === 'director') &&
      designKeywords.some(keyword => response.content.includes(keyword));

    console.log('[ChatPanel] 智能检测风格选择器:', {
      agent: response.agent,
      content: response.content.slice(0, 100),
      shouldShowStyleSelector,
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

    const userMessage = inputValue.trim();
    setInputValue('');

    // 添加用户消息到store
    const userMessageObj: AgentMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: userMessage,
      timestamp: Date.now(),
      type: 'text'
    };
    addMessage({
      role: 'user',
      content: userMessage,
      type: 'text'
    });

    // 检测用户消息中是否包含风格关键词，自动设置风格
    const detectedStyle = detectStyleFromMessage(userMessage);
    if (detectedStyle && !selectedStyle) {
      console.log('[ChatPanel] 从用户消息中检测到风格:', detectedStyle);
      selectStyle(detectedStyle);
      toast.success(`已自动选择风格：${PRESET_STYLES.find(s => s.id === detectedStyle)?.name}`);
    }

    setIsTyping(true);

    try {
      // 如果没有当前任务，先分析需求并创建任务
      if (!currentTask) {
        const analysis = await analyzeDesignRequirements(userMessage);
        createTask(analysis.type, getTaskTitle(analysis.type), userMessage);

        // 更新任务需求
        updateTaskRequirements({
          description: userMessage
        });
      } else {
        // 已有任务，累积更新需求描述
        const currentDescription = currentTask.requirements.description || '';
        const updatedDescription = currentDescription
          ? `${currentDescription}。${userMessage}`
          : userMessage;

        updateTaskRequirements({
          description: updatedDescription
        });

        console.log('[ChatPanel] 更新任务描述:', updatedDescription);
      }

      // 构建对话上下文（包含用户消息和完整任务信息）
      const context: ConversationContext = {
        currentAgent,
        messages: [...messages.slice(-9), userMessageObj],
        taskDescription: currentTask?.requirements.description,
        delegationHistory,
        requirementCollection,
        selectedStyle,
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

          // 更新当前 Agent
          if (response.agent !== currentAgent) {
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
    selectStyle(style.id);
    toast.success(`已选择风格：${style.name}`);
    setShowStyleLibrary(false);
  };

  // 快速操作
  const quickActions = [
    { icon: Trash2, label: '清空对话', onClick: handleClear },
    { icon: ImageIcon, label: '上传参考', onClick: () => setShowUploadDialog(true) },
    { icon: Sparkles, label: '灵感提示', onClick: toggleInspirationPanel },
    { icon: Wand2, label: 'AI优化', onClick: handleOptimizePrompt, loading: isOptimizingPrompt },
    { icon: Layers, label: '风格库', onClick: () => setShowStyleLibrary(true) }
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
    <div className={`flex flex-col h-full ${isDark ? 'bg-gray-900/50' : 'bg-white/50'}`}>
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
            className={`fixed right-0 top-0 h-full w-96 shadow-2xl z-40 ${
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

        {/* Typing Indicator */}
        {isTyping && (
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
      <div className={`p-4 border-t ${isDark ? 'border-gray-800 bg-gray-900/80' : 'border-gray-200 bg-white/80'}`}>
        {/* Quick Actions */}
        <div className="flex items-center gap-2 mb-3 overflow-x-auto pb-2">
          {quickActions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              disabled={(action as any).loading}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs whitespace-nowrap transition-colors ${
                isDark
                  ? 'bg-gray-800 hover:bg-gray-700 text-gray-400'
                  : 'bg-gray-100 hover:bg-gray-200 text-gray-600'
              } ${(action as any).loading ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              {(action as any).loading ? (
                <motion.div
                  className="w-3 h-3 border-2 border-current border-t-transparent rounded-full"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
              ) : (
                <action.icon className="w-3 h-3" />
              )}
              {action.label}
            </button>
          ))}
        </div>

        {/* Input Box */}
        <div className={`flex items-end gap-2 p-2 rounded-xl border ${
          isDark
            ? 'bg-gray-800 border-gray-700 focus-within:border-gray-600'
            : 'bg-white border-gray-200 focus-within:border-gray-300'
        }`}>
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="输入你的设计需求..."
            disabled={isTyping}
            className={`flex-1 bg-transparent border-none outline-none resize-none max-h-[120px] min-h-[40px] py-2 px-2 text-sm ${
              isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
            } disabled:opacity-50`}
            rows={1}
          />
          <div className="flex items-center gap-1 pb-1">
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
              className={`p-2 rounded-lg transition-colors ${
                inputValue.trim() && !isTyping
                  ? 'bg-gradient-to-r from-[#C02C38] to-[#E85D75] text-white'
                  : isDark
                    ? 'bg-gray-700 text-gray-500'
                    : 'bg-gray-200 text-gray-400'
              }`}
              whileHover={inputValue.trim() && !isTyping ? { scale: 1.05 } : {}}
              whileTap={inputValue.trim() && !isTyping ? { scale: 0.95 } : {}}
            >
              <Send className="w-4 h-4" />
            </motion.button>
          </div>
        </div>

        <p className={`text-xs mt-2 text-center ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          按 Enter 发送，Shift + Enter 换行
        </p>
      </div>

      {/* 数据迁移对话框 */}
      <DataMigrationDialog />
    </div>
  );
}
