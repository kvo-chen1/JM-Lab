import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { llmService, Message, AssistantPersonality, AssistantTheme, ConnectionStatus } from '@/services/llmService';
import { aiAssistantService, AIAction } from '@/services/aiAssistantService';
import { culturalExpertService } from '@/services/culturalExpertService';
import { MessageBubble, ChatInput } from '@/components/Chat';
import AIFeedbackModal from '@/components/Feedback/AIFeedbackModal';

interface FloatingAIAssistantProps {
  // 可以添加一些自定义配置属性
  defaultOpen?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'top-right' | 'top-left';
}

const FloatingAIAssistant: React.FC<FloatingAIAssistantProps> = ({
  defaultOpen = false,
  position = 'bottom-left'
}) => {
  const { isDark } = useTheme();
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState<string>('');
  const [currentPath, setCurrentPath] = useState<string>('');
  const [positionStyle, setPositionStyle] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  // 个性化设置相关状态
  const [showSettings, setShowSettings] = useState(false);
  const [personality, setPersonality] = useState<AssistantPersonality>('friendly');
  const [theme, setTheme] = useState<AssistantTheme>('auto');
  const [showPresetQuestions, setShowPresetQuestions] = useState(true);
  const [enableTypingEffect, setEnableTypingEffect] = useState(true);
  const [autoScroll, setAutoScroll] = useState(true);
  // 添加标志位，防止滚动事件在程序化滚动时触发
  const [isProgrammaticScroll, setIsProgrammaticScroll] = useState(false);
  // 反馈相关状态 - 使用新的统一反馈弹窗
  const [feedbackMessageIndex, setFeedbackMessageIndex] = useState<number | null>(null);
  // 复制相关状态
  const [copiedMessage, setCopiedMessage] = useState<number | null>(null);
  const [windowWidth, setWindowWidth] = useState<number>(0);
  // 交互式操作按钮状态
  const [messageActions, setMessageActions] = useState<{[key: number]: AIAction[]}>({});
  // 连接状态相关状态
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [connectionError, setConnectionError] = useState<string>('');
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  // 自动完成相关状态
  const [showAutocomplete, setShowAutocomplete] = useState(false);
  const [autocompleteSuggestions, setAutocompleteSuggestions] = useState<string[]>([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  // 打字效果相关状态
  const [typingMessage, setTypingMessage] = useState<string>('');
  const [isTyping, setIsTyping] = useState(false);
  // 流式响应相关状态
  const [streamingContent, setStreamingContent] = useState<string>('');
  const [isStreaming, setIsStreaming] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 安全获取窗口宽度，避免hydration mismatch
  useEffect(() => {
    const handleResize = () => {
      setWindowWidth(window.innerWidth);
    };
    
    // 初始设置宽度
    handleResize();
    
    // 添加窗口大小变化监听
    window.addEventListener('resize', handleResize);
    
    // 清理监听器
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  // 快捷操作类型定义
  interface ShortcutAction {
    id: string;
    label: string;
    icon: string;
    action: () => void;
    visible: boolean;
  }

  // 根据当前页面动态生成预设问题 - 使用知识库服务
  const [presetQuestions, setPresetQuestions] = useState<string[]>([]);
  
  useEffect(() => {
    const loadPresetQuestions = async () => {
      // 使用知识库服务获取上下文相关的问题
      const contextualQuestions = await aiAssistantService.getPresetQuestions(currentPath);
      
      // 根据对话历史调整预设问题，避免重复
      const recentUserMessages = messages.filter(msg => msg.role === 'user').slice(-5).map(msg => msg.content);
      let questions = contextualQuestions.filter(q => !recentUserMessages.some(msg => msg.includes(q)));
      
      // 如果过滤后问题太少，添加一些通用问题
      if (questions.length < 3) {
        const generalQuestions = ['如何使用平台', '平台有哪些AI功能', '如何获取帮助', '如何联系客服', '如何反馈问题'];
        const additionalQuestions = generalQuestions.filter(q => !recentUserMessages.some(msg => msg.includes(q))).slice(0, 3 - questions.length);
        questions = [...questions, ...additionalQuestions];
      }
      
      setPresetQuestions(questions.slice(0, 5));
    };
    
    loadPresetQuestions();
  }, [currentPath, messages]);

  // 生成快捷操作
  const getShortcutActions = (): ShortcutAction[] => {
    const actions: ShortcutAction[] = [
      {
        id: 'new-conversation',
        label: '新对话',
        icon: '💬',
        action: async () => {
          if (messages.length > 1) {
            if (confirm('创建新对话将保存当前对话历史并开启新对话，确定要继续吗？')) {
              await aiAssistantService.createNewConversation();
              setMessages([]);
              setMessageActions({});
            }
          } else {
            await aiAssistantService.createNewConversation();
            setMessages([]);
            setMessageActions({});
          }
        },
        visible: true
      },
      {
        id: 'clear-history',
        label: '清空历史',
        icon: '🗑️',
        action: async () => {
          if (confirm('确定要清空当前对话吗？此操作不可恢复。')) {
            await aiAssistantService.clearCurrentConversation();
            setMessages([]);
            setMessageActions({});
            setCopiedMessage(null);
            setFeedbackMessageIndex(null);
          }
        },
        visible: messages.length > 0
      },
      {
        id: 'cultural-knowledge',
        label: '文化知识',
        icon: '🏛️',
        action: () => {
          setInputMessage('天津有哪些非遗文化？');
          setTimeout(() => handleSendMessage(), 100);
        },
        visible: true
      },
      {
        id: 'work-review',
        label: '作品点评',
        icon: '🎨',
        action: () => {
          setInputMessage('帮我点评一下作品');
          setTimeout(() => handleSendMessage(), 100);
        },
        visible: true
      },
      {
        id: 'toggle-settings',
        label: '设置',
        icon: '⚙️',
        action: () => setShowSettings(!showSettings),
        visible: true
      },
      {
        id: 'help',
        label: '帮助',
        icon: '❓',
        action: () => {
          navigate('/help');
        },
        visible: true
      }
    ];

    return actions.filter(action => action.visible);
  };
  
  // 动态预设问题 - 使用上面定义的presetQuestions状态

  // 监听路由变化，更新当前页面信息
  useEffect(() => {
    // 解析当前路径，获取页面名称
    const path = location.pathname;
    setCurrentPath(path);
    
    // 完善的路径到页面名称映射
    const pathToPage: Record<string, string> = {
      '/': '首页',
      '/cultural-knowledge': '文化知识',
      '/creation-workshop': '创作工坊',
      '/marketplace': '文创市集',
      '/community': '社区',
      '/my-works': '我的作品',
      '/explore': '探索页面',
      '/create': '创作中心',
      '/dashboard': '仪表盘',
      '/settings': '设置页面',
      '/login': '登录页面',
      '/register': '注册页面',
      '/about': '关于我们',
      '/help': '帮助中心',
      '/news': '新闻资讯',
      '/events': '活动页面',
      '/leaderboard': '排行榜',
      '/knowledge': '知识库',
      '/tianjin': '天津特色',
      '/neo': '灵感引擎',

      '/wizard': '共创向导',
      '/square': '津脉广场'
    };
    
    setCurrentPage(pathToPage[path] || '未知页面');
  }, [location.pathname]);
  
  // 加载个性化设置
  useEffect(() => {
    const config = llmService.getConfig();
    setPersonality(config.personality);
    setTheme(config.theme);
    setShowPresetQuestions(config.show_preset_questions);
    setEnableTypingEffect(config.enable_typing_effect);
    setAutoScroll(config.auto_scroll);
  }, []);

  // 初始化AI助手服务
  useEffect(() => {
    const initAIAssistant = async () => {
      try {
        await aiAssistantService.initialize();
        // 加载历史对话
        const history = await aiAssistantService.getConversationHistory();
        if (history.length > 0) {
          setMessages(history.map(msg => ({
            role: msg.role,
            content: msg.content,
            timestamp: msg.timestamp,
            isError: msg.isError
          })));
        }
      } catch (error) {
        console.error('初始化AI助手服务失败:', error);
      }
    };
    
    initAIAssistant();
  }, []);

  // 保存个性化设置
  const saveSettings = () => {
    llmService.updateConfig({
      personality,
      theme,
      show_preset_questions: showPresetQuestions,
      enable_typing_effect: enableTypingEffect,
      auto_scroll: autoScroll
    });
  };

  // 测试连接功能
  const testConnection = async () => {
    setIsTestingConnection(true);
    setConnectionStatus('connecting');
    setConnectionError('');
    
    try {
      // 测试服务器健康状态
      const healthResponse = await fetch('/api/health/ping', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (healthResponse.ok) {
        // 测试模型配置状态
        const llmResponse = await fetch('/api/health/llms', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        
        if (llmResponse.ok) {
          const llmStatus = await llmResponse.json();
          // 检查当前模型是否已配置
          const currentModelId = llmService.getCurrentModel().id;
          if (llmStatus.ok && llmStatus.status && llmStatus.status[currentModelId] && llmStatus.status[currentModelId].configured) {
            setConnectionStatus('connected');
          } else {
            setConnectionStatus('error');
            setConnectionError(`当前模型 ${currentModelId} 未正确配置`);
          }
        } else {
          setConnectionStatus('error');
          setConnectionError('模型配置检查失败');
        }
      } else {
        setConnectionStatus('error');
        setConnectionError('服务器健康检查失败');
      }
    } catch (error) {
      setConnectionStatus('error');
      setConnectionError(error instanceof Error ? error.message : '连接测试失败，网络错误');
    } finally {
      setIsTestingConnection(false);
    }
  };

  // 监听连接状态变化
  useEffect(() => {
    // 定期检查连接状态
    const checkConnection = () => {
      const currentModel = llmService.getCurrentModel();
      const status = llmService.getConnectionStatus(currentModel.id);
      setConnectionStatus(status);
    };

    // 初始检查
    checkConnection();
    
    // 每分钟检查一次连接状态
    const intervalId = setInterval(checkConnection, 60000);
    
    // 监听自定义连接状态变化事件
    const handleConnectionStatusChange = (event: CustomEvent) => {
      const { modelId, status, error } = event.detail;
      setConnectionStatus(status);
      if (error) {
        setConnectionError(error);
      }
    };

    // 注册事件监听器
    window.addEventListener('llm-connection-status-changed', handleConnectionStatusChange as EventListener);
    
    return () => {
      clearInterval(intervalId);
      window.removeEventListener('llm-connection-status-changed', handleConnectionStatusChange as EventListener);
    };
  }, []);

  // 处理设置变更
  const handleSettingChange = (setting: string, value: any) => {
    switch (setting) {
      case 'personality':
        setPersonality(value);
        break;
      case 'theme':
        setTheme(value);
        break;
      case 'showPresetQuestions':
        setShowPresetQuestions(value);
        break;
      case 'enableTypingEffect':
        setEnableTypingEffect(value);
        break;
      case 'autoScroll':
        setAutoScroll(value);
        break;
      default:
        break;
    }
    saveSettings();
  };

  // 处理消息评分 - 打开统一反馈弹窗
  const handleRating = (messageIndex: number) => {
    setFeedbackMessageIndex(messageIndex);
  };

  // 关闭反馈弹窗
  const handleCloseFeedback = () => {
    setFeedbackMessageIndex(null);
  };

  // 处理消息复制
  const handleCopyMessage = async (messageIndex: number) => {
    const message = messages[messageIndex];
    if (message) {
      try {
        await navigator.clipboard.writeText(message.content);
        // 显示复制成功反馈
        setCopiedMessage(messageIndex);
        // 3秒后清除复制状态
        setTimeout(() => setCopiedMessage(null), 3000);
      } catch (error) {
        console.error('Failed to copy message:', error);
      }
    }
  };

  // 生成上下文相关的初始欢迎消息
  const getWelcomeMessage = () => {
    const welcomeMessages: Record<string, string> = {
      '/': `你好！我是津小脉，欢迎来到津脉智坊平台首页。这里是探索和创作的起点，你可以浏览热门作品、参与社区活动或开始你的创作之旅。有什么可以帮助你的吗？`,
      '/cultural-knowledge': `你好！我是津小脉，欢迎来到文化知识页面。在这里你可以探索丰富的非遗文化内容，学习传统技艺知识。有什么文化方面的问题需要解答吗？`,
      '/creation-workshop': `你好！我是津小脉，欢迎来到创作工坊。这里是你的创意实验室，你可以尝试各种数字化创作工具和AI生成功能。需要我帮你了解创作流程吗？`,
      '/marketplace': `你好！我是津小脉，欢迎来到文创市集。在这里你可以购买精美的文创产品，或成为卖家展示你的作品。有什么购物或销售方面的问题吗？`,
      '/community': `你好！我是津小脉，欢迎来到社区。这里是创作者的聚集地，你可以参与讨论、分享作品或参与活动。需要我帮你了解社区功能吗？`,
      '/my-works': `你好！我是津小脉，欢迎来到我的作品页面。在这里你可以管理和查看你的创作成果。需要我帮你了解作品管理功能吗？`,

      '/create': `你好！我是津小脉，欢迎来到创作中心。现在你可以开始你的创作之旅，使用各种AI辅助工具和素材。需要我帮你了解创作工具的使用方法吗？`,
      '/dashboard': `你好！我是津小脉，欢迎来到仪表盘。这里展示了你的创作数据和平台动态。需要我帮你解读数据或了解平台动态吗？`,
      '/neo': `你好！我是津小脉，欢迎来到灵感引擎。在这里你可以获得创作灵感和AI辅助建议。需要我帮你激发创意吗？`,

    };
    
    return welcomeMessages[currentPath] || `你好！我是津小脉，当前你正在浏览「${currentPage}」页面，有什么可以帮助你的吗？`;
  };

  // 过滤掉Gemini相关的错误消息和默认对话
  useEffect(() => {
    if (messages.length > 0) {
      const filteredMessages = messages.filter(msg => {
        // 移除包含Gemini错误的消息
        const isGeminiError = !msg.content.includes('Gemini接口不可用') && 
                              !msg.content.includes('gemini接口不可用') &&
                              !msg.content.includes('Gemini API');
        
        // 移除默认的ping消息和Gemini相关错误
        const isNotDefaultPing = msg.content !== 'ping';
        
        return isGeminiError && isNotDefaultPing;
      });
      
      // 如果过滤后消息数量变化，更新messages状态
      if (filteredMessages.length !== messages.length) {
        setMessages(filteredMessages);
      }
    }
  }, [messages]);

  // 检测手动滚动，当用户手动滚动时禁用autoScroll，滚动到底部时重新启用
  const handleScroll = () => {
    // 跳过程序化滚动触发的事件
    if (isProgrammaticScroll) {
      return;
    }
    
    if (chatContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
      // 检查是否接近底部（50px以内）
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 50;
      if (!isNearBottom && autoScroll) {
        setAutoScroll(false);
      } else if (isNearBottom && !autoScroll) {
        // 当用户滚动回底部时，重新启用autoScroll
        setAutoScroll(true);
      }
    }
  };

  // 通用的滚动到底部函数
  const scrollToBottom = useCallback(() => {
    if (chatContainerRef.current && autoScroll) {
      // 设置程序化滚动标志
      setIsProgrammaticScroll(true);
      
      const container = chatContainerRef.current;
      
      // 强制滚动到底部，不依赖autoScroll状态
      container.scrollTop = container.scrollHeight;
      
      // 额外的滚动方法，确保在各种浏览器中都能正常工作
      container.scroll({ top: container.scrollHeight, behavior: 'instant' });
      
      // 延迟清除程序化滚动标志，确保滚动事件完成
      setTimeout(() => {
        setIsProgrammaticScroll(false);
      }, 100);
    }
  }, [autoScroll]);

  // 自动滚动到底部 - 当消息变化时
  useEffect(() => {
    // 延迟执行，确保所有DOM更新完成
    const timeoutId = setTimeout(() => {
      scrollToBottom();
      // 再执行一次，确保滚动到底部
      const secondTimeoutId = setTimeout(scrollToBottom, 100);
      return () => clearTimeout(secondTimeoutId);
    }, 0);
    
    return () => clearTimeout(timeoutId);
  }, [messages, scrollToBottom]);

  // 当autoScroll变化时，也尝试滚动到底部
  useEffect(() => {
    if (autoScroll) {
      scrollToBottom();
      // 延迟再滚动一次，确保可靠
      const timeoutId = setTimeout(scrollToBottom, 50);
      return () => clearTimeout(timeoutId);
    }
  }, [autoScroll, scrollToBottom]);

  // 添加滚动事件监听和内容变化监听
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (!chatContainer) return;

    // 滚动事件处理
    const handleContainerScroll = () => {
      handleScroll();
    };

    // 创建ResizeObserver监测内容变化
    const resizeObserver = new ResizeObserver(() => {
      if (autoScroll) {
        scrollToBottom();
      }
    });

    // 监听滚动事件
    chatContainer.addEventListener('scroll', handleContainerScroll);
    // 监测聊天容器内容变化
    resizeObserver.observe(chatContainer);

    return () => {
      chatContainer.removeEventListener('scroll', handleContainerScroll);
      resizeObserver.disconnect();
    };
  }, [autoScroll, scrollToBottom]);

  // 在组件挂载和更新时都确保滚动到底部
  useEffect(() => {
    if (chatContainerRef.current) {
      const container = chatContainerRef.current;
      
      // 添加MutationObserver监测DOM变化
      const observer = new MutationObserver(() => {
        if (autoScroll) {
          scrollToBottom();
        }
      });

      observer.observe(container, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true
      });

      return () => {
        observer.disconnect();
      };
    }
  }, [autoScroll, scrollToBottom]);

  // 监听输入框聚焦事件，确保滚动到底部
  useEffect(() => {
    if (inputRef.current && chatContainerRef.current) {
      const handleFocus = () => {
        if (autoScroll) {
          scrollToBottom();
        }
      };
      
      inputRef.current.addEventListener('focus', handleFocus);
      return () => {
        inputRef.current?.removeEventListener('focus', handleFocus);
      };
    }
  }, [autoScroll, scrollToBottom]);

  // 处理发送消息 - 使用增强的AI助手服务
  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isGenerating) return;

    const userMessage: Message = {
      role: 'user',
      content: inputMessage.trim(),
      timestamp: Date.now()
    };

    setMessages(prev => [...prev, userMessage]);
    setInputMessage('');
    setIsGenerating(true);
    
    // 立即触发滚动到底部，确保用户消息显示在视野中
    setTimeout(() => {
      scrollToBottom();
    }, 0);

    try {
      const message = inputMessage.trim();
      
      // 处理常见问候语和身份问题
      const greetings = ['你好', '您好', 'hi', 'hello', '嗨', '早上好', '下午好', '晚上好'];
      let isGreeting = false;
      for (const greeting of greetings) {
        if (message.toLowerCase().includes(greeting.toLowerCase())) {
          isGreeting = true;
          const greetingResponse = `你好！我是津小脉，很高兴为你服务。你现在在「${currentPage}」页面，有什么可以帮助你的吗？\n\n我可以帮你：\n- 导航到平台各个页面\n- 指导你使用平台功能\n- 回答关于创作的问题\n- 提供文化知识\n\n试试问我："如何发布作品" 或 "带我去创作中心"`;
          await addTypingEffect(greetingResponse);
          setIsGenerating(false);
          return;
        }
      }
      
      // 处理身份问题
      if (!isGreeting && (message.includes('你是谁') || message.includes('你是什么') || message.includes('你的名字'))) {
        const identityResponse = `你好！我是津小脉，津脉智坊平台的专属AI助手。我专注于传统文化创作与设计，能够为你提供：\n\n🎯 **平台导航** - 快速跳转到任何页面\n📚 **操作指导** - 详细的功能使用教程\n💡 **创作辅助** - AI驱动的创意建议\n🧠 **长记忆** - 记住你的偏好和历史\n\n我的使命是连接传统文化与青年创意，推动文化传承与创新！`;
        await addTypingEffect(identityResponse);
        setIsGenerating(false);
        return;
      }
      
      // 使用增强的AI助手服务处理消息，支持流式响应
      setIsStreaming(true);
      setStreamingContent('');
      
      let streamedResponse = '';
      const aiResponse = await aiAssistantService.processMessage(
        message,
        currentPath,
        (chunk: string) => {
          // 流式回调：实时更新响应内容
          streamedResponse += chunk;
          setStreamingContent(streamedResponse);
          scrollToBottom();
        }
      );
      
      // 流式响应结束
      setIsStreaming(false);
      setStreamingContent('');
      
      if (aiResponse.type === 'navigation' && aiResponse.target) {
        // 导航响应 - 直接添加完整消息
        const assistantMessage: Message = {
          role: 'assistant',
          content: aiResponse.content,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsGenerating(false);
        // 延迟跳转，让用户看到反馈
        setTimeout(() => {
          navigate(aiResponse.target!.path);
        }, 1000);
        return;
      }
      
      if (aiResponse.type === 'guide') {
        // 操作指导响应 - 直接添加完整消息
        const assistantMessage: Message = {
          role: 'assistant',
          content: aiResponse.content,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsGenerating(false);
        return;
      }
      
      if (aiResponse.type === 'cultural') {
        // 文化专家响应 - 直接添加完整消息
        const assistantMessage: Message = {
          role: 'assistant',
          content: aiResponse.content,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsGenerating(false);
        // 保存交互式操作按钮
        if (aiResponse.actions && aiResponse.actions.length > 0) {
          setMessageActions(prev => ({
            ...prev,
            [messages.length]: aiResponse.actions!
          }));
        }
        return;
      }
      
      if (aiResponse.type === 'review') {
        // 作品点评响应 - 直接添加完整消息
        const assistantMessage: Message = {
          role: 'assistant',
          content: aiResponse.content,
          timestamp: Date.now()
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsGenerating(false);
        // 保存交互式操作按钮
        if (aiResponse.actions && aiResponse.actions.length > 0) {
          setMessageActions(prev => ({
            ...prev,
            [messages.length]: aiResponse.actions!
          }));
        }
        return;
      }
      
      if (aiResponse.type === 'chat' || aiResponse.type === 'error') {
        // 普通聊天响应或错误响应 - 直接添加完整消息
        const assistantMessage: Message = {
          role: 'assistant',
          content: aiResponse.content,
          timestamp: Date.now(),
          isError: aiResponse.type === 'error'
        };
        setMessages(prev => [...prev, assistantMessage]);
        setIsGenerating(false);
        return;
      }
      
    } catch (error) {
      console.error('Failed to generate response:', error);
      
      // 根据连接状态生成详细的错误信息
      let errorContent = '';
      if (connectionStatus === 'error') {
        errorContent = `抱歉，AI服务连接出现问题：${connectionError || '未知错误'}。\n\n建议：\n1. 检查网络连接是否正常\n2. 点击右上角设置按钮，使用"测试连接"功能检查AI服务状态\n3. 稍后再试或尝试其他问题`;
      } else if (connectionStatus === 'disconnected') {
        errorContent = `抱歉，AI服务当前未连接。\n\n建议：\n1. 检查网络连接是否正常\n2. 点击右上角设置按钮，使用"测试连接"功能重新连接\n3. 稍后再试`;
      } else {
        errorContent = `抱歉，我暂时无法回答你的问题。\n\n建议：\n1. 检查网络连接是否正常\n2. 稍后再试或尝试其他问题\n3. 点击右上角设置按钮，使用"测试连接"功能检查AI服务状态`;
      }
      
      // 使用打字效果显示错误信息
      await addTypingEffect(errorContent, undefined, true);
    } finally {
      setIsGenerating(false);
    }
  };

  // 打字效果辅助函数
  const addTypingEffect = async (fullResponse: string, callback?: () => void, isError: boolean = false) => {
    let displayedText = '';
    const typingSpeed = 30; // 打字速度（毫秒/字符）
    
    // 创建一个临时的打字消息
    const typingMessage: Message = {
      role: 'assistant',
      content: '',
      timestamp: Date.now()
    };
    
    // 添加到消息列表
    setMessages(prev => [...prev, typingMessage]);
    
    // 滚动到底部
    scrollToBottom();
    
    // 逐字符显示文本
    for (let i = 0; i < fullResponse.length; i++) {
      displayedText += fullResponse[i];
      
      // 更新消息列表中的最后一条消息
      setMessages(prev => {
        const updated = [...prev];
        if (updated.length > 0) {
          updated[updated.length - 1] = {
            ...updated[updated.length - 1],
            content: displayedText,
            isError: isError
          };
        }
        return updated;
      });
      
      // 滚动到底部
      scrollToBottom();
      
      // 等待打字间隔
      await new Promise(resolve => setTimeout(resolve, typingSpeed));
    }
    
    // 执行回调函数（如果有）
    if (callback) {
      callback();
    }
  };

  // 处理预设问题点击
  const handlePresetQuestionClick = (question: string) => {
    setInputMessage(question);
    handleSendMessage();
  };

  // 处理交互式操作按钮点击
  const handleActionClick = async (action: AIAction) => {
    const sendMessage = (msg: string) => {
      setInputMessage(msg);
      setTimeout(() => handleSendMessage(), 100);
    };

    switch (action.action) {
      case 'explore_intangible':
        sendMessage('天津有哪些非遗技艺？');
        break;
      case 'explore_brands':
        sendMessage('天津有哪些老字号品牌？');
        break;
      case 'explore_architecture':
        sendMessage('五大道有什么特色？');
        break;
      case 'show_element':
        if (action.data) {
          const element = culturalExpertService.getCulturalElementById(action.data);
          if (element) {
            sendMessage(`详细介绍一下${element.name}`);
          }
        }
        break;
      case 'usage_guide':
        if (action.data) {
          const element = culturalExpertService.getCulturalElementById(action.data);
          if (element) {
            sendMessage(`${element.name}怎么用？`);
          }
        }
        break;
      case 'related_elements':
        if (action.data) {
          const element = culturalExpertService.getCulturalElementById(action.data);
          if (element) {
            sendMessage(`${element.name}相关的文化元素有哪些？`);
          }
        }
        break;
      case 'fusion_suggestion':
        if (action.data) {
          const element = culturalExpertService.getCulturalElementById(action.data);
          if (element) {
            sendMessage(`${element.name}可以和什么元素融合？`);
          }
        }
        break;
      case 'upload_work':
        // 导航到创作中心
        navigate('/create');
        setIsOpen(false);
        break;
      case 'review_example':
        // 显示示例点评
        sendMessage('请给我展示一个作品点评示例');
        break;
      case 'improve_suggestions':
        sendMessage('给我一些优化建议');
        break;
      case 'cultural_fusion':
        sendMessage('怎么融合文化元素更好？');
        break;
      case 'commercial_analysis':
        sendMessage('分析一下商业潜力');
        break;
      default:
        // 对于其他操作，发送按钮标签作为消息
        sendMessage(action.label);
    }
  };

  // 渲染交互式操作按钮
  const renderMessageActions = (messageIndex: number) => {
    const actions = messageActions[messageIndex];
    if (!actions || actions.length === 0) return null;

    return (
      <div className="mt-3 flex flex-wrap gap-2">
        {actions.map((action) => (
          <button
            key={action.id}
            onClick={() => handleActionClick(action)}
            className={`px-3 py-1.5 text-xs rounded-full transition-all duration-200 ${
              isDark
                ? 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30 border border-indigo-500/30'
                : 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100 border border-indigo-200'
            }`}
          >
            {action.label}
          </button>
        ))}
      </div>
    );
  };

  // 自动完成建议生成函数
  const generateAutocompleteSuggestions = (input: string): string[] => {
    if (!input.trim() || input.length < 2) {
      return [];
    }
    
    const lowerInput = input.toLowerCase();
    
    // 从当前页面的预设问题中过滤匹配的建议
    const matchingQuestions = presetQuestions.filter((question: string) => 
      question.toLowerCase().includes(lowerInput)
    );
    
    // 从通用问题中添加更多建议
    const generalSuggestions = [
      '如何使用AI生成功能',
      '如何分享我的作品',
      '平台有哪些功能',
      '如何获取创作灵感',
      '如何参与社区活动',
      '如何管理我的作品',
      '如何编辑已发布作品',
      '如何查看作品统计',
      '如何设置作品隐私',
      '如何批量操作作品',
      '如何搜索作品',
      '如何筛选作品',
      '如何点赞收藏',
      '如何查看热门作品',
      '如何关注热门创作者',
      '如何使用创作工具',
      '如何添加素材',
      '如何使用AI辅助创作',
      '如何保存草稿',
      '如何使用快捷键',
      '如何查看创作数据',
      '如何查看收益情况',
      '如何设置通知',
      '如何管理账户信息',
      '如何查看系统通知',
      '如何修改密码',
      '如何绑定手机号',
      '如何设置隐私',
      '如何管理API密钥',
      '如何清除缓存'
    ];
    
    const additionalSuggestions = generalSuggestions
      .filter(suggestion => 
        suggestion.toLowerCase().includes(lowerInput) &&
        !matchingQuestions.includes(suggestion)
      )
      .slice(0, 5 - matchingQuestions.length);
    
    return [...matchingQuestions, ...additionalSuggestions].slice(0, 5);
  };

  // 处理输入变化，生成自动完成建议
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setInputMessage(value);
    
    if (value.trim().length >= 2) {
      const suggestions = generateAutocompleteSuggestions(value);
      setAutocompleteSuggestions(suggestions);
      setShowAutocomplete(suggestions.length > 0);
      setSelectedSuggestionIndex(-1);
    } else {
      setShowAutocomplete(false);
      setAutocompleteSuggestions([]);
      setSelectedSuggestionIndex(-1);
    }
  };

  // 处理自动完成建议选择
  const handleSuggestionSelect = (suggestion: string) => {
    setInputMessage(suggestion);
    setShowAutocomplete(false);
    setAutocompleteSuggestions([]);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  // 处理键盘导航自动完成建议
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Enter键处理
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showAutocomplete && selectedSuggestionIndex >= 0) {
        handleSuggestionSelect(autocompleteSuggestions[selectedSuggestionIndex]);
      } else {
        handleSendMessage();
      }
      return;
    }
    
    // 上下箭头处理
    if (showAutocomplete) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          if (prev < autocompleteSuggestions.length - 1) {
            return prev + 1;
          }
          return prev;
        });
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedSuggestionIndex(prev => {
          if (prev > 0) {
            return prev - 1;
          }
          return -1;
        });
        return;
      }
      
      // Escape键关闭自动完成
      if (e.key === 'Escape') {
        e.preventDefault();
        setShowAutocomplete(false);
        setSelectedSuggestionIndex(-1);
        return;
      }
    }
    
    // Tab键处理
    if (e.key === 'Tab' && showAutocomplete && selectedSuggestionIndex >= 0) {
      e.preventDefault();
      handleSuggestionSelect(autocompleteSuggestions[selectedSuggestionIndex]);
    }
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (showAutocomplete && selectedSuggestionIndex >= 0) {
        handleSuggestionSelect(autocompleteSuggestions[selectedSuggestionIndex]);
      } else {
        handleSendMessage();
      }
    }
  };

  // 处理键盘快捷键
  const handleKeyboardShortcuts = (e: KeyboardEvent) => {
    // Ctrl/Cmd + K: 打开/关闭聊天窗口
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
      e.preventDefault();
      toggleAssistant();
    }
    
    // Esc: 关闭聊天窗口或自动完成
    if (e.key === 'Escape') {
      if (showAutocomplete) {
        setShowAutocomplete(false);
        setSelectedSuggestionIndex(-1);
      } else if (isOpen) {
        setIsOpen(false);
      }
    }
  };

  // 处理语音输入
  const handleVoiceInput = () => {
    // 这里可以添加语音输入功能
    console.log('Voice input clicked');
    // 示例：模拟语音输入
    setInputMessage('你好，我想了解天津的文化特色');
  };

  // 添加键盘快捷键监听
  useEffect(() => {
    window.addEventListener('keydown', handleKeyboardShortcuts);
    return () => {
      window.removeEventListener('keydown', handleKeyboardShortcuts);
    };
  }, [isOpen, showAutocomplete]);

  // 点击外部关闭自动完成
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (autocompleteRef.current && !autocompleteRef.current.contains(event.target as Node) && 
          inputRef.current && !inputRef.current.contains(event.target as Node)) {
        setShowAutocomplete(false);
        setSelectedSuggestionIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // 初始化位置，从localStorage读取保存的位置，如果没有则使用默认位置
  useEffect(() => {
    const initializePosition = () => {
      const buttonWidth = 64; // w-16 = 64px
      const buttonHeight = 64;
      
      let newX = 20;
      let newY = window.innerHeight - 100;
      
      const savedPosition = localStorage.getItem('aiAssistantPosition');
      if (savedPosition) {
        try {
          const { x, y } = JSON.parse(savedPosition);
          // 验证并调整位置，确保按钮不会超出视口
          newX = Math.max(0, Math.min(x, window.innerWidth - buttonWidth));
          newY = Math.max(0, Math.min(y, window.innerHeight - buttonHeight));
        } catch (error) {
          console.error('Failed to parse saved position:', error);
          // 使用默认位置
          newX = 20;
          newY = window.innerHeight - 100;
        }
      }
      
      setPositionStyle({ x: newX, y: newY });
    };
    
    // 初始设置位置
    initializePosition();
  }, [windowWidth]);

  // 智能定位算法，根据视口位置动态调整AI助手位置
  // 只在聊天窗口打开且确实需要调整时才调整位置
  const updatePositionBasedOnViewport = () => {
    if (!isOpen) return;

    // 计算阈值：距离底部20%视口高度或100px，取较大值
    const calculateThreshold = () => {
      return Math.max(window.innerHeight * 0.2, 100);
    };

    // 获取当前滚动位置和视口高度
    const scrollTop = window.scrollY || document.documentElement.scrollTop;
    const windowHeight = window.innerHeight;
    const documentHeight = document.documentElement.scrollHeight;
    const threshold = calculateThreshold();
    
    // 计算当前位置距离文档底部的距离
    const distanceFromBottom = documentHeight - (scrollTop + windowHeight);
    
    // 聊天窗口的实际高度（考虑响应式设计）
    const getChatWindowHeight = () => {
      const isMobile = windowWidth < 768;
      const isTablet = windowWidth >= 768 && windowWidth < 1024;
      if (isMobile) return 400;
      if (isTablet) return 500;
      return 700; // 桌面设备使用最大高度
    };

    const chatWindowHeight = getChatWindowHeight();
    let shouldUpdate = false;
    const newPosition = { ...positionStyle };
    
    // 检查是否接近底部，只有在这种情况下才调整Y轴位置
    if (distanceFromBottom < threshold) {
      // 调整AI助手位置，确保内容可见
      const newY = Math.max(20, scrollTop + windowHeight - chatWindowHeight - 20);
      if (newY !== positionStyle.y) {
        newPosition.y = newY;
        shouldUpdate = true;
      }
    }
    // 注意：移除了正常位置的调整逻辑，这样不会在打开时重置位置

    // 确保AI助手不会超出视口左边界
    const chatWindowWidth = windowWidth < 768 ? 320 : 384;
    const newX = Math.max(20, Math.min(positionStyle.x, windowWidth - chatWindowWidth - 20));
    if (newX !== positionStyle.x) {
      newPosition.x = newX;
      shouldUpdate = true;
    }

    if (shouldUpdate) {
      setPositionStyle(newPosition);
      // 只有在位置发生变化时才保存到localStorage
      localStorage.setItem('aiAssistantPosition', JSON.stringify(newPosition));
    }
  };

  // 滚动事件监听，实现滚动感知机制
  useEffect(() => {
    // 滚动事件处理函数
    const handleScroll = () => {
      updatePositionBasedOnViewport();
    };

    // 窗口大小变化事件处理函数
    const handleResize = () => {
      updatePositionBasedOnViewport();
    };

    // 添加事件监听
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleResize);

    // 组件卸载时移除事件监听
    return () => {
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen, positionStyle]);

  // 切换AI助手显示/隐藏
  const toggleAssistant = () => {
    setIsOpen(prev => !prev);
  };

  // 处理拖动开始
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDragOffset({
        x: clientX - rect.left,
        y: clientY - rect.top
      });
    }
  };

  // 处理拖动中
  const handleDrag = (e: MouseEvent | TouchEvent) => {
    if (!isDragging) return;
    
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    
    const buttonWidth = 64; // w-16 = 64px
    const buttonHeight = 64;
    
    // 计算新位置，确保按钮不会超出视窗
    let newX = clientX - dragOffset.x;
    let newY = clientY - dragOffset.y;
    
    // 边界检查，考虑到按钮尺寸
    newX = Math.max(0, Math.min(newX, windowWidth - buttonWidth));
    newY = Math.max(0, Math.min(newY, window.innerHeight - buttonHeight));
    
    setPositionStyle({ x: newX, y: newY });
    // 拖动过程中就保存位置，确保实时更新
    localStorage.setItem('aiAssistantPosition', JSON.stringify({ x: newX, y: newY }));
  };

  // 处理拖动结束
  const handleDragEnd = () => {
    setIsDragging(false);
    // 拖动结束时也保存一次，确保位置被正确保存
    localStorage.setItem('aiAssistantPosition', JSON.stringify(positionStyle));
  };

  // 添加全局拖动事件监听
  useEffect(() => {
    if (isDragging) {
      const handleMouseMove = (e: MouseEvent) => handleDrag(e);
      const handleMouseUp = () => handleDragEnd();
      const handleTouchMove = (e: TouchEvent) => handleDrag(e);
      const handleTouchEnd = () => handleDragEnd();
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.addEventListener('touchmove', handleTouchMove, { passive: true });
      document.addEventListener('touchend', handleTouchEnd);
      
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.removeEventListener('touchmove', handleTouchMove);
        document.removeEventListener('touchend', handleTouchEnd);
      };
    }
  }, [isDragging, dragOffset]);

  // 位置类
  const positionClasses = {
    'bottom-right': 'bottom-6 right-6',
    'bottom-left': 'bottom-6 left-6',
    'top-right': 'top-6 right-6',
    'top-left': 'top-6 left-6'
  };

  return (
    <div 
      ref={containerRef}
      className="fixed"
      style={{
        left: `${positionStyle.x}px`,
        top: `${positionStyle.y}px`,
        zIndex: 99999 // 确保AI助手在最顶层显示
      }}
    >
      {/* 聊天界面 */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20, x: 0 }}
            animate={{
              opacity: 1, 
              scale: 1, 
              y: 0, 
              x: 0
            }}
            exit={{ opacity: 0, scale: 0.9, y: 20, x: 0 }}
            transition={{
              duration: windowWidth < 768 ? 0.2 : 0.3,
              ease: [0.4, 0, 0.2, 1] // 更平滑的缓动曲线
            }}
            className={`rounded-3xl shadow-2xl flex flex-col ${isDark ? 'bg-gray-800/95 border border-gray-700/50' : 'bg-white/95 border border-gray-200/50'} overflow-hidden`}
            style={{
              // 响应式宽度 - 手机端更宽，几乎占满屏幕
              width: windowWidth < 768 ? '95vw' : (windowWidth < 1024 ? '75vw' : '420px'),
              // 响应式高度 - 调整为更合适的值，确保在手机端显示完整
              minHeight: windowWidth < 768 ? '400px' : (windowWidth < 1024 ? '450px' : '500px'),
              maxHeight: windowWidth < 768 ? '90vh' : '75vh',
              // 悬浮效果：显示在按钮上方
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%) translateY(-10px)',
              // 增强悬浮感的多层次阴影
              boxShadow: isDark ? 
                '0 20px 60px rgba(0, 0, 0, 0.6), 0 8px 30px rgba(0, 0, 0, 0.4), 0 0 0 1px rgba(255, 255, 255, 0.1)' : 
                '0 20px 60px rgba(0, 0, 0, 0.15), 0 8px 30px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              // 确保不会超出视口
              maxWidth: windowWidth < 768 ? '95vw' : '90vw',
              // 确保在最顶层显示
              zIndex: 99998,
              // 添加背景模糊效果，增强漂浮感
              backdropFilter: 'blur(15px)',
              backgroundBlendMode: 'overlay',
              // 确保内容不会溢出
              overflow: 'hidden',
              // 确保容器使用flex布局，并且子元素能够正确分配空间
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* 聊天头部 - 手机端优化 */}
            <div className={`p-3.5 border-b ${isDark ? 'border-gray-700/50' : 'border-gray-200/50'} bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white flex justify-between items-center shadow-lg relative overflow-hidden rounded-t-3xl`}>
              {/* 装饰性背景元素 */}
              <div className="absolute top-0 left-0 w-full h-full opacity-15">
                <div className="absolute top-[-30%] left-[-30%] w-60 h-60 rounded-full bg-white blur-3xl"></div>
                <div className="absolute bottom-[-30%] right-[-30%] w-60 h-60 rounded-full bg-white blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-white opacity-5 blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              <div className="flex items-center gap-3 relative z-10">
                <motion.div 
                  className={`w-10 h-10 rounded-full bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-md flex items-center justify-center shadow-lg border border-white/30`}
                  whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(255, 255, 255, 0.4)' }}
                  transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                >
                  <img 
                    src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20robot%20avatar%20with%20friendly%20face%2C%20white%20background%2C%20simple%20style&image_size=square" 
                    alt="AI Assistant" 
                    className="w-8 h-8 object-contain"
                  />
                </motion.div>
                <div className="flex items-center gap-1.5">
                  <h3 className="font-bold text-base sm:text-lg text-white tracking-tight">津小脉</h3>
                  {/* 连接状态指示器 */}
                  <motion.div 
                    className={`w-3.5 h-3.5 rounded-full ring-2 ring-white/60 ${connectionStatus === 'connected' ? 'bg-green-400' : connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'}`}
                    title={`AI连接状态: ${connectionStatus === 'connected' ? '已连接' : connectionStatus === 'connecting' ? '连接中' : connectionStatus === 'error' ? `连接错误: ${connectionError}` : '未连接'}`}
                    animate={connectionStatus === 'connecting' ? { scale: [1, 1.2, 1] } : {}}
                    transition={connectionStatus === 'connecting' ? { repeat: Infinity, duration: 1 } : {}}
                  ></motion.div>
                </div>
              </div>
              <div className="flex gap-1.5 relative z-10">
                {/* 设置按钮 */}
                <motion.button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-white/15' : 'hover:bg-white/20'} transform`}
                  aria-label="设置"
                  whileHover={{ scale: 1.15, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fas fa-cog text-sm text-white"></i>
                </motion.button>
                {/* 关闭按钮 */}
                <motion.button
                  onClick={toggleAssistant}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-white/15' : 'hover:bg-white/20'} transform`}
                  aria-label="关闭"
                  whileHover={{ scale: 1.15, backgroundColor: 'rgba(255, 255, 255, 0.2)' }}
                  whileTap={{ scale: 0.95 }}
                >
                  <i className="fas fa-times text-sm text-white"></i>
                </motion.button>
              </div>
            </div>

            {/* 聊天内容和设置面板的容器 */}
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* 聊天内容 */}
              <AnimatePresence mode="wait">
                {!showSettings ? (
                  <motion.div
                    key="chat"
                    initial={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className={`flex-1 p-2 sm:p-3 space-y-3 ${windowWidth < 768 ? 'space-y-3' : 'space-y-4'} overflow-auto ${windowWidth < 768 ? 'scrollbar-hide' : ''}`}
                    style={{
                      // 隐藏滚动条但保持滚动功能
                      scrollbarWidth: windowWidth < 768 ? 'none' : 'thin',
                      scrollbarColor: isDark ? '#4B5563 #1F2937' : '#9CA3AF #F3F4F6',
                      // 强制显示滚动条（仅在非手机端）
                      msOverflowStyle: windowWidth < 768 ? 'none' : 'auto',
                      // 确保在各种浏览器中都能正常工作
                      WebkitOverflowScrolling: 'touch',
                      boxSizing: 'border-box'
                    }}
                    ref={chatContainerRef}
                    onWheel={(e) => {
                      // 阻止滚动事件冒泡到外部
                      e.stopPropagation();
                    }}
                    onTouchMove={(e) => {
                      // 阻止触摸滑动事件冒泡到外部
                      e.stopPropagation();
                      // 只在垂直滚动时阻止默认行为
                      const chatContainer = chatContainerRef.current;
                      if (chatContainer) {
                        const { scrollTop, scrollHeight, clientHeight } = chatContainer;
                        const isAtTop = scrollTop === 0;
                        const isAtBottom = scrollTop === scrollHeight - clientHeight;
                        
                        // 阻止默认行为，只在聊天区域内滚动
                        // 这样可以确保在聊天区域内滑动时不会影响外部页面
                        e.preventDefault();
                      }
                    }}
                  >
                    {messages.map((message, index) => (
                      <div key={index}>
                        <MessageBubble
                          type={message.isError ? 'error' : message.role === 'user' ? 'user' : 'assistant'}
                          content={message.content}
                          timestamp={new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          isLoading={false}
                          onRetry={message.isError ? () => {
                            if (index > 0 && messages[index - 1].role === 'user') {
                              setInputMessage(messages[index - 1].content);
                              setMessages(prev => prev.slice(0, index));
                              setTimeout(() => handleSendMessage(), 100);
                            }
                          } : undefined}
                        />
                        {/* 渲染交互式操作按钮 */}
                        {message.role === 'assistant' && renderMessageActions(index)}
                        {/* 渲染反馈按钮 */}
                        {message.role === 'assistant' && (
                          <div className="mt-2 flex justify-start">
                            <button
                              onClick={() => handleRating(index)}
                              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs transition-colors ${
                                isDark
                                  ? 'bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300'
                                  : 'bg-gray-100 text-gray-500 hover:bg-gray-200 hover:text-gray-700'
                              }`}
                            >
                              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                              </svg>
                              <span>评价</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* 流式响应消息显示 */}
                    {isStreaming && streamingContent && (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex justify-start"
                      >
                        <div className={`max-w-[88%] p-4.5 rounded-2xl ${isDark ? 'bg-gray-700/90 text-gray-200 border border-gray-600/50' : 'bg-gray-100/90 text-gray-800 border border-gray-200/50'}`}>
                          <div className="whitespace-pre-wrap">
                            {streamingContent}
                            {/* 闪烁光标效果 */}
                            <span className="inline-block w-2 h-4 ml-0.5 align-middle bg-blue-500 animate-pulse rounded-sm" />
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {/* 正在生成指示器（仅在非流式状态下显示） */}
                    {isGenerating && !isStreaming && (
                      <motion.div
                        className="flex justify-start"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className={`max-w-[88%] p-4.5 rounded-2xl ${isDark ? 'bg-gray-700/90 text-gray-200 border border-gray-600/50' : 'bg-gray-100/90 text-gray-800 border border-gray-200/50'}`}>
                          <div className="flex items-center gap-2.5">
                            <motion.div
                              className="w-2.5 h-2.5 rounded-full bg-blue-500"
                              animate={{ y: [-6, 6, -6] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                            ></motion.div>
                            <motion.div
                              className="w-2.5 h-2.5 rounded-full bg-purple-500"
                              animate={{ y: [-6, 6, -6] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                            ></motion.div>
                            <motion.div
                              className="w-2.5 h-2.5 rounded-full bg-pink-500"
                              animate={{ y: [-6, 6, -6] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                            ></motion.div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                    className="flex-1 overflow-y-auto p-5"
                  >
                    <h3 className="text-lg font-bold mb-5 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">设置</h3>
                    
                    {/* 助手性格设置 */}
                    <div className="mb-6 bg-gradient-to-br from-transparent to-gray-100 dark:to-gray-800 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                      <h4 className="text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}">助手性格</h4>
                      <div className="grid grid-cols-2 gap-2.5">
                        {(['friendly', 'professional', 'creative', 'humorous', 'concise'] as AssistantPersonality[]).map(persona => (
                          <motion.button
                            key={persona}
                            onClick={() => handleSettingChange('personality', persona)}
                            className={`p-2.5 rounded-xl transition-all ${personality === persona ? 
                              (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : 
                              (isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
                            }`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {persona === 'friendly' && '友好'}
                            {persona === 'professional' && '专业'}
                            {persona === 'creative' && '创意'}
                            {persona === 'humorous' && '幽默'}
                            {persona === 'concise' && '简洁'}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 主题设置 */}
                    <div className="mb-6 bg-gradient-to-br from-transparent to-gray-100 dark:to-gray-800 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                      <h4 className="text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}">主题</h4>
                      <div className="grid grid-cols-3 gap-2.5">
                        {(['light', 'dark', 'auto'] as AssistantTheme[]).map(themeOption => (
                          <motion.button
                            key={themeOption}
                            onClick={() => handleSettingChange('theme', themeOption)}
                            className={`p-2.5 rounded-xl transition-all ${theme === themeOption ? 
                              (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : 
                              (isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
                            }`}
                            whileHover={{ scale: 1.03 }}
                            whileTap={{ scale: 0.98 }}
                          >
                            {themeOption === 'light' && '浅色'}
                            {themeOption === 'dark' && '深色'}
                            {themeOption === 'auto' && '自动'}
                          </motion.button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 显示预设问题 */}
                    <div className="mb-3 bg-gradient-to-br from-transparent to-gray-100 dark:to-gray-800 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>显示预设问题</span>
                        <div className={`relative inline-block w-11 h-6 transition-all duration-300 ${showPresetQuestions ? 
                          (isDark ? 'bg-blue-600' : 'bg-blue-500') : 
                          (isDark ? 'bg-gray-600' : 'bg-gray-300')
                        } rounded-full`}>
                          <input
                            type="checkbox"
                            checked={showPresetQuestions}
                            onChange={(e) => handleSettingChange('showPresetQuestions', e.target.checked)}
                            className="sr-only"
                          />
                          <motion.span 
                            className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300`}
                            animate={{ x: showPresetQuestions ? 20 : 0 }}
                          ></motion.span>
                        </div>
                      </label>
                    </div>
                    
                    {/* 启用打字效果 */}
                    <div className="mb-3 bg-gradient-to-br from-transparent to-gray-100 dark:to-gray-800 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>启用打字效果</span>
                        <div className={`relative inline-block w-11 h-6 transition-all duration-300 ${enableTypingEffect ? 
                          (isDark ? 'bg-blue-600' : 'bg-blue-500') : 
                          (isDark ? 'bg-gray-600' : 'bg-gray-300')
                        } rounded-full`}>
                          <input
                            type="checkbox"
                            checked={enableTypingEffect}
                            onChange={(e) => handleSettingChange('enableTypingEffect', e.target.checked)}
                            className="sr-only"
                          />
                          <motion.span 
                            className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300`}
                            animate={{ x: enableTypingEffect ? 20 : 0 }}
                          ></motion.span>
                        </div>
                      </label>
                    </div>
                    
                    {/* 自动滚动 */}
                    <div className="mb-6 bg-gradient-to-br from-transparent to-gray-100 dark:to-gray-800 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>自动滚动</span>
                        <div className={`relative inline-block w-11 h-6 transition-all duration-300 ${autoScroll ? 
                          (isDark ? 'bg-blue-600' : 'bg-blue-500') : 
                          (isDark ? 'bg-gray-600' : 'bg-gray-300')
                        } rounded-full`}>
                          <input
                            type="checkbox"
                            checked={autoScroll}
                            onChange={(e) => handleSettingChange('autoScroll', e.target.checked)}
                            className="sr-only"
                          />
                          <motion.span 
                            className={`absolute left-0.5 top-0.5 bg-white w-5 h-5 rounded-full transition-transform duration-300`}
                            animate={{ x: autoScroll ? 20 : 0 }}
                          ></motion.span>
                        </div>
                      </label>
                    </div>
                    
                    {/* 连接状态和测试 */}
                    <div className="mt-6 bg-gradient-to-br from-transparent to-gray-100 dark:to-gray-800 p-4 rounded-2xl border border-gray-200/50 dark:border-gray-700/50">
                      <h4 className="text-sm font-medium mb-3 ${isDark ? 'text-gray-200' : 'text-gray-800'}">AI连接状态</h4>
                      <div className="flex items-center gap-2 mb-4">
                        <motion.div 
                          className={`w-3.5 h-3.5 rounded-full ${isDark ? 
                            (connectionStatus === 'connected' ? 'bg-green-400' : connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400') : 
                            (connectionStatus === 'connected' ? 'bg-green-500' : connectionStatus === 'connecting' ? 'bg-yellow-500' : 'bg-red-500')
                          }`}
                          animate={connectionStatus === 'connecting' ? { scale: [1, 1.2, 1] } : {}}
                          transition={connectionStatus === 'connecting' ? { repeat: Infinity, duration: 1 } : {}}
                        ></motion.div>
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {connectionStatus === 'connected' ? '已连接' : connectionStatus === 'connecting' ? '连接中' : connectionStatus === 'error' ? `连接错误: ${connectionError}` : '未连接'}
                        </span>
                      </div>
                      <motion.button
                        onClick={testConnection}
                        disabled={isTestingConnection}
                        className={`w-full px-4 py-2.5 rounded-xl transition-all ${isDark ? 
                          (isTestingConnection ? 'bg-gray-700 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-500') : 
                          (isTestingConnection ? 'bg-gray-200 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600')
                        } text-white text-sm font-medium`}
                        whileHover={!isTestingConnection ? { scale: 1.02 } : {}}
                        whileTap={!isTestingConnection ? { scale: 0.98 } : {}}
                      >
                        {isTestingConnection ? (
                          <div className="flex items-center justify-center gap-2">
                            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                            <span>测试中...</span>
                          </div>
                        ) : (
                          '测试连接'
                        )}
                      </motion.button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 快捷操作 */}
            {messages.length <= 1 && !isGenerating && (
              <div className={`${windowWidth < 768 ? 'px-3 py-2.5' : 'px-4 py-3'} ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <p className={`text-xs mb-2.5 ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>快捷操作</p>
                <div className={`flex flex-wrap ${windowWidth < 768 ? 'gap-1.5' : 'gap-2'}`}>
                  {getShortcutActions().map((action, index) => (
                    <motion.button
                      key={index}
                      onClick={action.action}
                      className={`${windowWidth < 768 ? 'px-2.5 py-1.5' : 'px-3 py-1.75'} text-xs rounded-xl ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600/50' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'} transition-all shadow-sm`}
                      whileHover={{ scale: 1.05, boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      title={action.label}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: windowWidth < 768 ? index * 0.03 : index * 0.05, duration: windowWidth < 768 ? 0.15 : 0.2 }}
                    >
                      <span className="mr-1.5">{action.icon}</span>
                      <span>{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* 预设问题 */}
            {messages.length <= 1 && !isGenerating && (
              <div className={`${windowWidth < 768 ? 'px-3 pb-2.5' : 'px-4 pb-3'} ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <p className={`text-xs mb-2.5 ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>快速提问</p>
                <div className={`flex flex-wrap ${windowWidth < 768 ? 'gap-1.5' : 'gap-2'}`}>
                  {presetQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handlePresetQuestionClick(question)}
                      className={`${windowWidth < 768 ? 'px-2.5 py-1.5' : 'px-3 py-1.75'} text-xs rounded-xl ${isDark ? 'bg-gradient-to-r from-gray-700 to-gray-800 hover:from-gray-600 hover:to-gray-700 text-gray-200 border border-gray-600/50' : 'bg-gradient-to-r from-gray-100 to-gray-50 hover:from-gray-200 hover:to-gray-100 text-gray-800 border border-gray-200'} transition-all shadow-sm`}
                      whileHover={{ scale: 1.05, boxShadow: isDark ? '0 4px 12px rgba(0, 0, 0, 0.3)' : '0 4px 12px rgba(0, 0, 0, 0.1)' }}
                      whileTap={{ scale: 0.98 }}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: windowWidth < 768 ? index * 0.03 : index * 0.05, duration: windowWidth < 768 ? 0.15 : 0.2 }}
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* 输入区域 - 使用新的ChatInput组件 */}
            <div className={`${windowWidth < 768 ? 'p-3' : 'p-4'} border-t ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} shadow-inner`}>
              <ChatInput
                value={inputMessage}
                onChange={setInputMessage}
                onSend={handleSendMessage}
                onVoiceStart={handleVoiceInput}
                placeholder="输入你的创意想法，与AI进行多轮对话..."
                disabled={isGenerating}
                isLoading={isGenerating}
                maxLength={2000}
                showVoiceButton={true}
              />
                
                {/* 自动完成建议列表 */}
                <AnimatePresence>
                  {showAutocomplete && autocompleteSuggestions.length > 0 && (
                    <motion.div
                      ref={autocompleteRef}
                      initial={{ opacity: 0, y: -5, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -5, scale: 0.98 }}
                      transition={{ duration: 0.2 }}
                      className={`absolute left-0 right-0 top-full mt-1 rounded-xl shadow-xl overflow-hidden z-50 ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
                    >
                      {autocompleteSuggestions.map((suggestion, index) => (
                        <motion.div
                          key={index}
                          onClick={() => handleSuggestionSelect(suggestion)}
                          className={`px-4 py-2.5 text-sm cursor-pointer transition-all ${index === selectedSuggestionIndex ? 
                            (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : 
                            (isDark ? 'bg-gray-800 hover:bg-gray-700 text-gray-200' : 'bg-white hover:bg-gray-100 text-gray-800')
                          }`}
                          whileHover={{ 
                            backgroundColor: index === selectedSuggestionIndex ? 
                              (isDark ? 'rgba(59, 130, 246, 0.8)' : 'rgba(59, 130, 246, 0.8)') : 
                              (isDark ? 'rgba(31, 41, 55, 0.8)' : 'rgba(249, 250, 251, 0.8)')
                          }}
                          whileTap={{ scale: 0.98 }}
                        >
                          <div className="flex items-center">
                            <i className="fas fa-magic text-xs mr-2 opacity-60"></i>
                            <span>{suggestion}</span>
                          </div>
                        </motion.div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 悬浮按钮 */}
      <motion.button
        ref={buttonRef}
        initial={{ scale: 1, opacity: 1, y: 0 }}
        animate={{
          scale: 1, 
          opacity: 1,
          // 添加轻微的浮动动画，与聊天窗口呼应
          y: [0, -3, 0, 3, 0],
        }}
        transition={{
          duration: 0.4, 
          type: 'spring', 
          stiffness: 200, 
          damping: 15,
          // 浮动动画循环播放
          y: { duration: 2.5, repeat: Infinity, ease: "easeInOut" }
        }}
        onClick={toggleAssistant}
        onMouseDown={handleDragStart}
        onTouchStart={handleDragStart}
        className={`w-16 h-16 rounded-full flex items-center justify-center shadow-2xl z-[100] transition-all duration-300 transform hover:scale-125 ${isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700' : 'bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600'} text-white cursor-${isDragging ? 'grabbing' : 'grab'}`}
        aria-label="津小脉"
        whileHover={{
          scale: 1.25, 
          boxShadow: isDark ? 
            '0 12px 28px rgba(99, 102, 241, 0.5), 0 4px 12px rgba(99, 102, 241, 0.3)' : 
            '0 12px 28px rgba(59, 130, 246, 0.5), 0 4px 12px rgba(59, 130, 246, 0.3)',
          // 悬停时增强浮动效果
          y: -5
        }}
        whileTap={{ scale: 1.1, y: 0 }}
        style={{
          position: 'relative',
          zIndex: 99997,
          // 添加多层次阴影，增强立体感
          boxShadow: isDark ? 
            '0 8px 25px rgba(0, 0, 0, 0.4), 0 2px 10px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(255, 255, 255, 0.1)' : 
            '0 8px 25px rgba(0, 0, 0, 0.2), 0 2px 10px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
          // 添加发光效果，增强漂浮感
          animation: 'pulse-glow 2s ease-in-out infinite alternate',
          // 确保按钮在拖动时有更好的视觉反馈
          transformStyle: 'preserve-3d',
          backfaceVisibility: 'hidden'
        }}
      >
        <motion.img 
          src="https://trae-api-cn.mchost.guru/api/ide/v1/text_to_image?prompt=cute%20robot%20avatar%20with%20friendly%20face%2C%20white%20background%2C%20simple%20style&image_size=square" 
          alt="AI Assistant" 
          className="w-8 h-8 object-contain" 
          animate={isOpen ? { rotate: 90 } : { rotate: 0 }}
          transition={{ duration: 0.3 }}
        />
        {/* 消息数量提示 */}
        {messages.length > 1 && (
          <motion.div
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-red-500 text-white text-xs font-bold flex items-center justify-center shadow-lg"
            initial={{ scale: 0 }}
            animate={{ scale: 1, y: [0, -2, 0, 2, 0] }}
            transition={{ 
              type: 'spring', 
              stiffness: 500, 
              damping: 15,
              y: { duration: 2, repeat: Infinity, ease: "easeInOut" }
            }}
          >
            {messages.length - 1}
          </motion.div>
        )}
      </motion.button>

      {/* AI反馈弹窗 */}
      {feedbackMessageIndex !== null && messages[feedbackMessageIndex] && (
        <AIFeedbackModal
          isOpen={feedbackMessageIndex !== null}
          onClose={handleCloseFeedback}
          aiModel="jinmai-floating"
          aiName="AI创意助手津小脉"
          messageId={`floating-${feedbackMessageIndex}-${Date.now()}`}
          userQuery={feedbackMessageIndex > 0 && messages[feedbackMessageIndex - 1]?.role === 'user' 
            ? messages[feedbackMessageIndex - 1].content 
            : ''}
          aiResponse={messages[feedbackMessageIndex]?.content || ''}
        />
      )}
    </div>
  );
};

export default FloatingAIAssistant;