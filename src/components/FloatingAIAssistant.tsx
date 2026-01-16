import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate, useLocation } from 'react-router-dom';
import { llmService, Message, AssistantPersonality, AssistantTheme } from '@/services/llmService';

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
  // 反馈相关状态
  const [feedbackVisible, setFeedbackVisible] = useState<{[key: number]: boolean}>({});
  const [feedbackRatings, setFeedbackRatings] = useState<{[key: number]: number}>({});
  const [feedbackComments, setFeedbackComments] = useState<{[key: number]: string}>({});
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // 快捷操作类型定义
  interface ShortcutAction {
    id: string;
    label: string;
    icon: string;
    action: () => void;
    visible: boolean;
  }

  // 根据当前页面动态生成预设问题
  const getPresetQuestions = () => {
    const pageQuestions: Record<string, string[]> = {
      '/': ['平台上如何创作', '如何使用AI生成功能', '如何分享我的作品', '平台有哪些功能', '如何获取创作灵感'],
      '/cultural-knowledge': ['文化知识如何分类', '如何搜索特定文化内容', '如何收藏文化知识', '如何参与文化讨论', '如何贡献文化知识'],
      '/creation-workshop': ['如何开始创作', 'AI生成功能怎么用', '如何导出我的作品', '如何查看创作数据', '如何使用创作模板'],
      '/marketplace': ['如何购买文创产品', '如何成为卖家', '如何评价商品', '如何查看订单', '如何设置店铺'],
      '/community': ['如何参与社区活动', '如何关注其他用户', '如何创建话题', '如何获取社区积分', '如何加入兴趣小组'],
      '/my-works': ['如何管理我的作品', '如何编辑已发布作品', '如何查看作品统计', '如何设置作品隐私', '如何批量操作作品'],
      '/explore': ['如何搜索作品', '如何筛选作品', '如何点赞收藏', '如何查看热门作品', '如何关注热门创作者'],
      '/create': ['如何使用创作工具', '如何添加素材', '如何使用AI辅助创作', '如何保存草稿', '如何使用快捷键'],
      '/dashboard': ['如何查看创作数据', '如何查看收益情况', '如何设置通知', '如何管理账户信息', '如何查看系统通知'],
      '/settings': ['如何修改密码', '如何绑定手机号', '如何设置隐私', '如何管理API密钥', '如何清除缓存']
    };
    
    // 获取基础预设问题
    let questions = pageQuestions[currentPath] || ['平台上如何创作', '如何使用AI生成功能', '如何分享我的作品', '如何查看创作数据', '如何参与社区活动'];
    
    // 根据对话历史调整预设问题，避免重复
    const recentUserMessages = messages.filter(msg => msg.role === 'user').slice(-5).map(msg => msg.content);
    questions = questions.filter(q => !recentUserMessages.some(msg => msg.includes(q)));
    
    // 如果过滤后问题太少，添加一些通用问题
    if (questions.length < 3) {
      const generalQuestions = ['如何使用平台', '平台有哪些AI功能', '如何获取帮助', '如何联系客服', '如何反馈问题'];
      const additionalQuestions = generalQuestions.filter(q => !recentUserMessages.some(msg => msg.includes(q))).slice(0, 3 - questions.length);
      questions = [...questions, ...additionalQuestions];
    }
    
    return questions;
  };

  // 生成快捷操作
  const getShortcutActions = (): ShortcutAction[] => {
    const actions: ShortcutAction[] = [
      {
        id: 'new-conversation',
        label: '新对话',
        icon: '💬',
        action: () => {
          llmService.createSession('新对话');
          setMessages([]);
        },
        visible: true
      },
      {
        id: 'clear-history',
        label: '清空历史',
        icon: '🗑️',
        action: () => {
          if (confirm('确定要清空对话历史吗？')) {
            llmService.clearHistory();
            setMessages([]);
          }
        },
        visible: messages.length > 0
      },
      {
        id: 'toggle-settings',
        label: '设置',
        icon: '⚙️',
        action: () => setShowSettings(!showSettings),
        visible: true
      },
      {
        id: 'feedback',
        label: '反馈',
        icon: '📝',
        action: () => {
          // 这里可以添加反馈功能
          alert('反馈功能开发中，敬请期待！');
        },
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
  
  // 动态预设问题
  const presetQuestions = getPresetQuestions();

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
      '/tools': '工具页面',
      '/wizard': '共创向导',
      '/square': '共创广场'
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

  // 处理消息评分
  const handleRating = (messageIndex: number, rating: number) => {
    setFeedbackRatings(prev => ({
      ...prev,
      [messageIndex]: rating
    }));
    
    // 记录评分到本地存储或发送到服务器
    console.log(`Message ${messageIndex} rated: ${rating}`);
    
    // 显示评论输入框
    setFeedbackVisible(prev => ({
      ...prev,
      [messageIndex]: true
    }));
  };

  // 处理反馈评论提交
  const handleFeedbackSubmit = (messageIndex: number) => {
    const comment = feedbackComments[messageIndex] || '';
    const rating = feedbackRatings[messageIndex] || 0;
    
    // 发送反馈到服务器或本地存储
    console.log(`Feedback submitted for message ${messageIndex}:`, {
      rating,
      comment,
      message: messages[messageIndex]
    });
    
    // 隐藏评论输入框
    setFeedbackVisible(prev => ({
      ...prev,
      [messageIndex]: false
    }));
    
    // 清除评论
    setFeedbackComments(prev => ({
      ...prev,
      [messageIndex]: ''
    }));
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
      '/explore': `你好！我是津小脉，欢迎来到探索页面。在这里你可以发现各类优秀作品，按照不同维度筛选内容。需要我帮你了解搜索和筛选功能吗？`,
      '/create': `你好！我是津小脉，欢迎来到创作中心。现在你可以开始你的创作之旅，使用各种AI辅助工具和素材。需要我帮你了解创作工具的使用方法吗？`,
      '/dashboard': `你好！我是津小脉，欢迎来到仪表盘。这里展示了你的创作数据和平台动态。需要我帮你解读数据或了解平台动态吗？`,
      '/neo': `你好！我是津小脉，欢迎来到灵感引擎。在这里你可以获得创作灵感和AI辅助建议。需要我帮你激发创意吗？`,
      '/tools': `你好！我是津小脉，欢迎来到工具页面。这里汇聚了各种创作辅助工具。需要我帮你了解工具的使用方法吗？`
    };
    
    return welcomeMessages[currentPath] || `你好！我是津小脉，当前你正在浏览「${currentPage}」页面，有什么可以帮助你的吗？`;
  };

  // 添加初始欢迎消息 - 上下文感知
  useEffect(() => {
    const initialMessage: Message = {
      role: 'assistant',
      content: getWelcomeMessage(),
      timestamp: Date.now()
    };
    // 只有当没有对话历史时才设置初始消息
    if (messages.length <= 1) {
      setMessages([initialMessage]);
    }
  }, [currentPage, messages.length]);

  // 检测手动滚动，当用户手动滚动时禁用autoScroll，滚动到底部时重新启用
  const handleScroll = () => {
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
      const container = chatContainerRef.current;
      
      // 强制滚动到底部，不依赖autoScroll状态
      container.scrollTop = container.scrollHeight;
      
      // 额外的滚动方法，确保在各种浏览器中都能正常工作
      container.scroll({ top: container.scrollHeight, behavior: 'instant' });
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

  // 处理发送消息
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
      // 简单的数字映射回答和页面跳转
      let response = '';
      const message = inputMessage.trim();
      
      // 处理常见问候语
      const greetings = ['你好', '您好', 'hi', 'hello', '嗨', '早上好', '下午好', '晚上好'];
      let isGreeting = false;
      for (const greeting of greetings) {
        if (message.includes(greeting)) {
          isGreeting = true;
          response = `你好！我是津小脉，很高兴为你服务。你现在在「${currentPage}」页面，有什么可以帮助你的吗？你可以问我关于平台使用、创作技巧、文化知识等方面的问题，我会尽力为你解答。`;
          break;
        }
      }
      
      if (!isGreeting) {
        // 检查页面跳转关键词
        const navigationKeywords: Record<string, { path: string; name: string }> = {
          '首页': { path: '/', name: '首页' },
          '文化知识': { path: '/cultural-knowledge', name: '文化知识' },
          '创作工坊': { path: '/creation-workshop', name: '创作工坊' },
          '文创市集': { path: '/marketplace', name: '文创市集' },
          '社区': { path: '/community', name: '社区' },
          '我的作品': { path: '/my-works', name: '我的作品' }
        };
        
        let navigationTarget = null;
        for (const [keyword, target] of Object.entries(navigationKeywords)) {
          if (message.includes(keyword)) {
            navigationTarget = target;
            break;
          }
        }
        
        if (navigationTarget) {
          // 执行页面跳转
          response = `正在为你跳转到「${navigationTarget.name}」页面...`;
          setMessages(prev => [...prev, {
            role: 'assistant',
            content: response,
            timestamp: Date.now()
          }]);
          setIsGenerating(false);
          
          // 延迟跳转，让用户看到反馈
          setTimeout(() => {
            navigate(navigationTarget.path);
          }, 1000);
          return;
        }
        
        // 检查是否为纯数字或数字相关问题
        const numericMatch = message.match(/^\s*([0-9]+)\s*$/);
        if (numericMatch) {
          const num = parseInt(numericMatch[1]);
          
          // 根据数字提供不同回答
          const numberResponses: Record<number, string> = {
            1: '1 代表了开始与创新，正如我们平台鼓励用户开启创作之旅。你可以在创作工坊中尝试各种非遗技艺的数字化创作，或者参与社区讨论分享你的创意灵感。',
            2: '2 象征着合作与平衡。在我们平台上，你可以与其他创作者合作完成作品，也可以在传承与创新之间找到平衡，将传统非遗文化以现代方式呈现。',
            3: '3 意味着多样性与丰富性。我们的平台涵盖了多种非遗技艺类型，包括陶瓷、刺绣、木雕等。你可以探索不同的文化元素，丰富你的创作素材库。',
            4: '4 代表着稳定与结构。创作需要坚实的基础，你可以通过平台的教程视频学习非遗基础知识，掌握创作技巧，构建自己的创作体系。',
            5: '5 象征着活力与探索。我们鼓励用户不断探索新的创作方式，尝试将AI生成技术与传统技艺结合，创造出既有文化底蕴又具现代美感的作品。',
            6: '6 代表着和谐与完美。在创作过程中，你可以注重作品的整体协调性，将各种元素有机结合，创造出和谐统一的视觉效果。',
            7: '7 象征着神秘与深度。非遗文化蕴含着深厚的历史底蕴和文化内涵，你可以深入挖掘其背后的故事，为你的作品增添深度和内涵。',
            8: '8 意味着发展与繁荣。我们希望通过平台的发展，推动非遗文化的繁荣传承，让更多人了解和喜爱传统技艺。',
            9: '9 代表着智慧与成就。通过不断学习和实践，你可以在非遗创作领域取得成就，成为传承和创新的使者。',
            10: '10 象征着圆满与开始。每一次创作都是一个新的开始，也是对传统文化的一次圆满传承。'          
          };
          
          response = numberResponses[num] || `你输入的数字是 ${num}。在我们的平台上，每个数字都可以成为创作的灵感来源。你可以尝试将数字元素融入你的作品中，创造出独特的视觉效果。`;
        } else {
          // 调用LLM服务生成响应，传递当前页面上下文
          response = await llmService.generateResponse(userMessage.content, {
            context: {
              page: currentPage,
              path: currentPath
            }
          });
        }
      }
      
      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error('Failed to generate response:', error);
      
      const errorMessage: Message = {
        role: 'assistant',
        content: '抱歉，我暂时无法回答你的问题。请稍后再试。',
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsGenerating(false);
    }
  };

  // 处理预设问题点击
  const handlePresetQuestionClick = (question: string) => {
    setInputMessage(question);
    handleSendMessage();
  };

  // 处理键盘事件
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // 初始化位置，从localStorage读取保存的位置，如果没有则使用默认位置
  useEffect(() => {
    const savedPosition = localStorage.getItem('aiAssistantPosition');
    if (savedPosition) {
      try {
        const { x, y } = JSON.parse(savedPosition);
        setPositionStyle({ x, y });
        return;
      } catch (error) {
        console.error('Failed to parse saved position:', error);
      }
    }
    // 使用默认位置
    setPositionStyle({ x: 20, y: window.innerHeight - 100 });
  }, []);

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
      const isMobile = window.innerWidth < 768;
      const isTablet = window.innerWidth >= 768 && window.innerWidth < 1024;
      if (isMobile) return 400;
      if (isTablet) return 500;
      return 700; // 桌面设备使用最大高度
    };

    const chatWindowHeight = getChatWindowHeight();
    let shouldUpdate = false;
    let newPosition = { ...positionStyle };
    
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
    const chatWindowWidth = window.innerWidth < 768 ? 320 : 384;
    const newX = Math.max(20, Math.min(positionStyle.x, window.innerWidth - chatWindowWidth - 20));
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
    newX = Math.max(0, Math.min(newX, window.innerWidth - buttonWidth));
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
        transform: 'translate(0, 0)',
        zIndex: 1000 // 确保AI助手在最顶层显示
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
              duration: 0.2
            }}
            className={`rounded-2xl shadow-2xl flex flex-col ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'} overflow-hidden`}
            style={{
              // 响应式宽度 - 手机端更小
              width: window.innerWidth < 768 ? '85vw' : (window.innerWidth < 1024 ? '75vw' : '384px'),
              // 响应式高度 - 调整为更大的值，确保输入区域可见
              minHeight: window.innerWidth < 768 ? '300px' : (window.innerWidth < 1024 ? '400px' : '450px'),
              maxHeight: window.innerWidth < 768 ? '80vh' : '70vh',
              // 悬浮效果：显示在按钮上方
              position: 'absolute',
              bottom: '100%',
              left: '50%',
              transform: 'translateX(-50%) translateY(-10px) translateZ(10)',
              // 增强悬浮感的多层次阴影
              boxShadow: isDark ? 
                '0 10px 30px rgba(0, 0, 0, 0.5), 0 4px 15px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255, 255, 255, 0.1)' : 
                '0 10px 30px rgba(0, 0, 0, 0.2), 0 4px 15px rgba(0, 0, 0, 0.1), 0 0 0 1px rgba(0, 0, 0, 0.05)',
              // 确保不会超出视口
              maxWidth: '85vw',
              // 确保在最顶层显示
              zIndex: 999,
              // 高DPI屏幕优化
              imageRendering: 'pixelated',
              // 添加背景模糊效果，增强漂浮感
              backdropFilter: 'blur(10px)',
              backgroundBlendMode: 'overlay',
              // 确保内容不会溢出
              overflow: 'hidden',
              // 确保容器使用flex布局，并且子元素能够正确分配空间
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {/* 聊天头部 - 手机端优化 */}
            <div className={`p-2 border-b ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} flex justify-between items-center shadow-sm`}>
              <div className="flex items-center gap-2">
                <div className={`w-7 h-7 rounded-full flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600' : 'bg-gradient-to-br from-blue-500 to-purple-500'} text-white shadow-md`}>
                  <i className="fas fa-robot text-base"></i>
                </div>
                <h3 className="font-bold text-base sm:text-lg bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">津小脉</h3>
              </div>
              <div className="flex gap-1">
                {/* 设置按钮 */}
                <button
                  onClick={() => setShowSettings(!showSettings)}
                  className={`p-1.5 rounded-full transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transform`}
                  aria-label="设置"
                >
                  <i className={`fas fa-cog text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}></i>
                </button>
                {/* 关闭按钮 */}
                <button
                  onClick={toggleAssistant}
                  className={`p-1.5 rounded-full transition-all ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transform`}
                  aria-label="关闭"
                >
                  <i className={`fas fa-times text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}></i>
                </button>
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
                  className={`flex-1 p-2 sm:p-3 space-y-3 ${window.innerWidth < 768 ? 'space-y-3' : 'space-y-4'} overflow-auto`}
                  style={{
                    scrollbarWidth: 'thin',
                    scrollbarColor: isDark ? '#4B5563 #1F2937' : '#9CA3AF #F3F4F6',
                    // 强制显示滚动条
                    msOverflowStyle: 'auto',
                    // 确保在各种浏览器中都能正常工作
                    WebkitOverflowScrolling: 'touch',
                    boxSizing: 'border-box'
                  }}
                  ref={chatContainerRef}
                >
                    {messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'} ${window.innerWidth < 768 ? 'mb-3' : 'mb-4'} opacity-0 animate-fade-in`}
                        style={{ animationDelay: `${index * 0.1}s`, animationDuration: '0.3s', animationFillMode: 'forwards' }}
                      >
                        <div className="max-w-[85%]">
                          <div
                            className={`${window.innerWidth < 768 ? 'p-3' : 'p-4'} rounded-xl ${message.role === 'user' ? 
                              (isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-lg' : 'bg-gradient-to-br from-blue-500 to-purple-500 text-white shadow-lg') : 
                              (isDark ? 'bg-gray-700 text-gray-200 border border-gray-600' : 'bg-gray-100 text-gray-800 border border-gray-200')
                            } transition-all hover:shadow-xl`}
                          >
                            <div className="text-sm whitespace-pre-wrap leading-relaxed">
                              {message.content}
                            </div>
                          </div>
                          
                          {/* 只有AI回复显示评分功能 */}
                          {message.role === 'assistant' && (
                            <div className={`mt-2 flex flex-col items-end ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {/* 评分按钮 */}
                              {!feedbackRatings[index] && (
                                <div className="flex gap-1">
                                  <button
                                    onClick={() => handleRating(index, 1)}
                                    className={`p-1 rounded-full transition-all ${isDark ? 'hover:text-red-400' : 'hover:text-red-500'}`}
                                    aria-label="非常不满意"
                                  >
                                    <i className="fas fa-thumbs-down text-xs"></i>
                                  </button>
                                  <button
                                    onClick={() => handleRating(index, 2)}
                                    className={`p-1 rounded-full transition-all ${isDark ? 'hover:text-yellow-400' : 'hover:text-yellow-500'}`}
                                    aria-label="不满意"
                                  >
                                    <i className="fas fa-thumbs-down-half-alt text-xs"></i>
                                  </button>
                                  <button
                                    onClick={() => handleRating(index, 3)}
                                    className={`p-1 rounded-full transition-all ${isDark ? 'hover:text-blue-400' : 'hover:text-blue-500'}`}
                                    aria-label="一般"
                                  >
                                    <i className="fas fa-meh text-xs"></i>
                                  </button>
                                  <button
                                    onClick={() => handleRating(index, 4)}
                                    className={`p-1 rounded-full transition-all ${isDark ? 'hover:text-green-400' : 'hover:text-green-500'}`}
                                    aria-label="满意"
                                  >
                                    <i className="fas fa-thumbs-up-half-alt text-xs"></i>
                                  </button>
                                  <button
                                    onClick={() => handleRating(index, 5)}
                                    className={`p-1 rounded-full transition-all ${isDark ? 'hover:text-green-400' : 'hover:text-green-500'}`}
                                    aria-label="非常满意"
                                  >
                                    <i className="fas fa-thumbs-up text-xs"></i>
                                  </button>
                                </div>
                              )}
                              
                              {/* 评分结果显示 */}
                              {feedbackRatings[index] && (
                                <div className="flex items-center gap-2">
                                  <span className="text-xs">
                                    {feedbackRatings[index] === 1 && '非常不满意'}
                                    {feedbackRatings[index] === 2 && '不满意'}
                                    {feedbackRatings[index] === 3 && '一般'}
                                    {feedbackRatings[index] === 4 && '满意'}
                                    {feedbackRatings[index] === 5 && '非常满意'}
                                  </span>
                                  <i className={`fas fa-star text-yellow-400 text-xs`}></i>
                                </div>
                              )}
                              
                              {/* 反馈评论输入框 */}
                              {feedbackVisible[index] && (
                                <div className="mt-2 w-full">
                                  <div className="flex gap-1">
                                    <input
                                      type="text"
                                      placeholder="有什么建议可以告诉我..."
                                      className={`flex-1 px-3 py-1.5 text-xs rounded-lg ${isDark ? 'bg-gray-700 border border-gray-600 text-gray-200 placeholder-gray-500' : 'bg-gray-100 border border-gray-200 text-gray-800 placeholder-gray-500'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                                      value={feedbackComments[index] || ''}
                                      onChange={(e) => setFeedbackComments(prev => ({
                                        ...prev,
                                        [index]: e.target.value
                                      }))}
                                      onKeyPress={(e) => e.key === 'Enter' && handleFeedbackSubmit(index)}
                                    />
                                    <button
                                      onClick={() => handleFeedbackSubmit(index)}
                                      className={`px-3 py-1.5 text-xs rounded-lg transition-all ${isDark ? 'bg-gray-600 hover:bg-gray-500 text-gray-200' : 'bg-gray-200 hover:bg-gray-300 text-gray-800'}`}
                                    >
                                      提交
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    {/* 正在生成指示器 */}
                    {isGenerating && (
                      <div className="flex justify-start">
                        <div className={`max-w-[85%] p-4 rounded-xl ${isDark ? 'bg-gray-700 text-gray-200 border border-gray-600' : 'bg-gray-100 text-gray-800 border border-gray-200'}`}>
                          <div className="flex items-center gap-2">
                            <motion.div
                              className="w-2 h-2 rounded-full bg-blue-500"
                              animate={{ y: [-5, 5, -5] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0 }}
                            ></motion.div>
                            <motion.div
                              className="w-2 h-2 rounded-full bg-purple-500"
                              animate={{ y: [-5, 5, -5] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0.2 }}
                            ></motion.div>
                            <motion.div
                              className="w-2 h-2 rounded-full bg-pink-500"
                              animate={{ y: [-5, 5, -5] }}
                              transition={{ repeat: Infinity, duration: 0.6, delay: 0.4 }}
                            ></motion.div>
                          </div>
                        </div>
                      </div>
                    )}
                  </motion.div>
                ) : (
                  <motion.div
                    key="settings"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex-1 overflow-y-auto p-4"
                  >
                    <h3 className="text-lg font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">设置</h3>
                    
                    {/* 助手性格设置 */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}">助手性格</label>
                      <div className="grid grid-cols-2 gap-2">
                        {(['friendly', 'professional', 'creative', 'humorous', 'concise'] as AssistantPersonality[]).map(persona => (
                          <button
                            key={persona}
                            onClick={() => handleSettingChange('personality', persona)}
                            className={`p-2 rounded-lg transition-all ${personality === persona ? 
                              (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : 
                              (isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
                            }`}
                          >
                            {persona === 'friendly' && '友好'}
                            {persona === 'professional' && '专业'}
                            {persona === 'creative' && '创意'}
                            {persona === 'humorous' && '幽默'}
                            {persona === 'concise' && '简洁'}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 主题设置 */}
                    <div className="mb-6">
                      <label className="block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}">主题</label>
                      <div className="grid grid-cols-3 gap-2">
                        {(['light', 'dark', 'auto'] as AssistantTheme[]).map(themeOption => (
                          <button
                            key={themeOption}
                            onClick={() => handleSettingChange('theme', themeOption)}
                            className={`p-2 rounded-lg transition-all ${theme === themeOption ? 
                              (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : 
                              (isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700')
                            }`}
                          >
                            {themeOption === 'light' && '浅色'}
                            {themeOption === 'dark' && '深色'}
                            {themeOption === 'auto' && '自动'}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {/* 显示预设问题 */}
                    <div className="mb-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>显示预设问题</span>
                        <div className={`relative inline-block w-10 h-5 transition-all ${showPresetQuestions ? 
                          (isDark ? 'bg-blue-600' : 'bg-blue-500') : 
                          (isDark ? 'bg-gray-600' : 'bg-gray-300')
                        } rounded-full`}>
                          <input
                            type="checkbox"
                            checked={showPresetQuestions}
                            onChange={(e) => handleSettingChange('showPresetQuestions', e.target.checked)}
                            className="sr-only"
                          />
                          <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${showPresetQuestions ? 'transform translate-x-5' : ''}`}></span>
                        </div>
                      </label>
                    </div>
                    
                    {/* 启用打字效果 */}
                    <div className="mb-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>启用打字效果</span>
                        <div className={`relative inline-block w-10 h-5 transition-all ${enableTypingEffect ? 
                          (isDark ? 'bg-blue-600' : 'bg-blue-500') : 
                          (isDark ? 'bg-gray-600' : 'bg-gray-300')
                        } rounded-full`}>
                          <input
                            type="checkbox"
                            checked={enableTypingEffect}
                            onChange={(e) => handleSettingChange('enableTypingEffect', e.target.checked)}
                            className="sr-only"
                          />
                          <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${enableTypingEffect ? 'transform translate-x-5' : ''}`}></span>
                        </div>
                      </label>
                    </div>
                    
                    {/* 自动滚动 */}
                    <div className="mb-4">
                      <label className="flex items-center justify-between cursor-pointer">
                        <span className={`text-sm font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>自动滚动</span>
                        <div className={`relative inline-block w-10 h-5 transition-all ${autoScroll ? 
                          (isDark ? 'bg-blue-600' : 'bg-blue-500') : 
                          (isDark ? 'bg-gray-600' : 'bg-gray-300')
                        } rounded-full`}>
                          <input
                            type="checkbox"
                            checked={autoScroll}
                            onChange={(e) => handleSettingChange('autoScroll', e.target.checked)}
                            className="sr-only"
                          />
                          <span className={`absolute left-0.5 top-0.5 bg-white w-4 h-4 rounded-full transition-transform ${autoScroll ? 'transform translate-x-5' : ''}`}></span>
                        </div>
                      </label>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* 快捷操作 */}
            {messages.length <= 1 && !isGenerating && (
              <div className={`px-3 py-2 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>快捷操作</p>
                <div className="flex flex-wrap gap-1.5">
                  {getShortcutActions().map((action, index) => (
                    <motion.button
                      key={index}
                      onClick={action.action}
                      className={`px-2.5 py-1.25 text-xs rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'} transition-all transform hover:scale-105`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      title={action.label}
                    >
                      <span className="mr-1">{action.icon}</span>
                      <span>{action.label}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* 预设问题 */}
            {messages.length <= 1 && !isGenerating && (
              <div className={`px-3 pb-2 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
                <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'} font-medium`}>快速提问</p>
                <div className="flex flex-wrap gap-1.5">
                  {presetQuestions.map((question, index) => (
                    <motion.button
                      key={index}
                      onClick={() => handlePresetQuestionClick(question)}
                      className={`px-2.5 py-1.25 text-xs rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-gray-200 border border-gray-600' : 'bg-gray-100 hover:bg-gray-200 text-gray-800 border border-gray-200'} transition-all transform hover:scale-105`}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      {question}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* 输入区域 - 手机端优化 */}
            <div className={`${window.innerWidth < 768 ? 'p-2' : 'p-3'} border-t ${isDark ? 'border-gray-700 bg-gray-900' : 'border-gray-200 bg-white'} shadow-inner`}>
              <div className="flex gap-1 items-center">
                <input
                  ref={inputRef}
                  type="text"
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder="输入你的问题..."
                  disabled={isGenerating}
                  className={`flex-1 px-2.5 py-2 rounded-full border ${isDark ? 'border-gray-700 bg-gray-800 text-white placeholder-gray-500 focus:border-blue-500' : 'border-gray-300 bg-gray-50 text-gray-900 placeholder-gray-500 focus:border-blue-500'} focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-all shadow-sm text-sm`}
                />
                <motion.button
                  onClick={handleSendMessage}
                  disabled={isGenerating || !inputMessage.trim()}
                  className={`${window.innerWidth < 768 ? 'p-2' : 'p-2.5'} rounded-full transition-all shadow-md ${isGenerating || !inputMessage.trim() ? 
                    (isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') : 
                    (isDark ? 'bg-gradient-to-br from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white' : 'bg-gradient-to-br from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white')
                  }`}
                  whileHover={{ scale: isGenerating || !inputMessage.trim() ? 1 : 1.1 }}
                  whileTap={{ scale: isGenerating || !inputMessage.trim() ? 1 : 0.95 }}
                  aria-label="发送"
                >
                  <i className="fas fa-paper-plane text-xs sm:text-sm"></i>
                </motion.button>
              </div>
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
          zIndex: 100,
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
        <motion.i 
          className="fas fa-robot text-xl" 
          animate={isOpen ? { rotate: 90 } : { rotate: 0 }}
          transition={{ duration: 0.3 }}
        ></motion.i>
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
    </div>
  );
};

export default FloatingAIAssistant;