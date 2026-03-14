import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useCreateStore } from '../../hooks/useCreateStore';
import { toast } from 'sonner';
import clsx from 'clsx';
import {
  aiGenerationService,
  GenerationTask,
  DEFAULT_STYLE_PRESETS,
  SIZE_PRESETS,
  QUALITY_PRESETS,
  ImageGenerationParams,
  VideoGenerationParams
} from '@/services/aiGenerationService';
import { llmService, Message, ConversationSession, QuickActionCard, MediaContent } from '@/services/llmService';
import { downloadAndUploadImage, downloadAndUploadVideo } from '@/services/imageService';
import { aiConversationService } from '@/services/aiConversationService';

// 生成类型
type GenerateMode = 'image' | 'video';
type TabType = 'chat' | 'history';

// 快捷指令
const QUICK_COMMANDS = [
  { id: 'generate-image', label: '生成图片', icon: 'image', prompt: '帮我生成一张图片：', color: '#8B5CF6', gradient: 'from-violet-500 to-purple-600' },
  { id: 'generate-video', label: '生成视频', icon: 'video', prompt: '帮我生成一个视频：', color: '#EC4899', gradient: 'from-pink-500 to-rose-600' },
  { id: 'optimize-prompt', label: '优化提示词', icon: 'wand-magic-sparkles', prompt: '请帮我优化以下提示词：', color: '#10B981', gradient: 'from-emerald-500 to-teal-600' },
  { id: 'creative-idea', label: '创意灵感', icon: 'lightbulb', prompt: '给我一些创意灵感：', color: '#F59E0B', gradient: 'from-amber-500 to-orange-600' },
];

// 欢迎消息
const WELCOME_MESSAGE: Message = {
  role: 'assistant',
  content: '你好！我是AI创作助手，可以帮你：',
  timestamp: Date.now()
};

// 功能列表
const FEATURES = [
  { icon: 'palette', text: '生成图片', color: '#8B5CF6', desc: '直接告诉我想要什么画面' },
  { icon: 'video', text: '生成视频', color: '#EC4899', desc: '描述你想要的动态场景' },
  { icon: 'sparkles', text: '优化提示词', color: '#10B981', desc: '让描述更专业' },
  { icon: 'lightbulb', text: '创意灵感', color: '#F59E0B', desc: '获取创作建议' },
];

export default function AIAssistantPanel() {
  const { isDark } = useTheme();
  const { prompt, setPrompt, addGeneratedResult, setSelectedResult, generatedResults } = useCreateStore();

  // 标签页状态
  const [activeTab, setActiveTab] = useState<TabType>('chat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentTask, setCurrentTask] = useState<GenerationTask | null>(null);

  // 会话管理
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null);
  // 电脑端默认收缩会话列表，给聊天区域更多空间
  const [showSessionList, setShowSessionList] = useState(false);
  const [isEditingSessionName, setIsEditingSessionName] = useState(false);
  const [editingSessionName, setEditingSessionName] = useState('');
  // 会话列表中正在编辑的会话ID和名称
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editingSessionNameInList, setEditingSessionNameInList] = useState('');

  // 聊天相关
  const [chatMessages, setChatMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [streamingContent, setStreamingContent] = useState(''); // 流式响应内容
  const [isStreaming, setIsStreaming] = useState(false); // 是否正在流式输出
  const [generatingMessageIndex, setGeneratingMessageIndex] = useState<number | null>(null); // 正在生成的消息索引
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 生成参数设置（在对话中显示）
  const [showSettings, setShowSettings] = useState(false);
  const [generateMode, setGenerateMode] = useState<GenerateMode>('image');
  const [imageParams, setImageParams] = useState<ImageGenerationParams>({
    prompt: '',
    size: '1024x1024',
    n: 1,
    style: 'auto',
    quality: 'hd'
  });
  const [videoParams, setVideoParams] = useState<VideoGenerationParams>({
    prompt: '',
    duration: 5,
    resolution: '720p',
    aspectRatio: '16:9'
  });
  const [selectedStyle, setSelectedStyle] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>(llmService.getCurrentModel().id);

  // 历史记录
  const [history, setHistory] = useState<any[]>([]);

  // 初始化会话
  useEffect(() => {
    const loadedSessions = llmService.getSessions();
    if (loadedSessions.length === 0) {
      // 如果没有会话，创建一个默认会话
      const newSession = llmService.createSession('新对话');
      setSessions([newSession]);
      setCurrentSession(newSession);
      setChatMessages([WELCOME_MESSAGE]);
    } else {
      setSessions(loadedSessions);
      const activeSession = loadedSessions.find(s => s.isActive) || loadedSessions[0];
      setCurrentSession(activeSession);
      setChatMessages(activeSession.messages.length > 0 ? activeSession.messages : [WELCOME_MESSAGE]);
    }
  }, []);

  // 自动调整textarea高度
  const adjustTextareaHeight = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + 'px';
    }
  };

  // 自动滚动到底部 - 仅在用户发送消息或首次加载时滚动
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const [lastMessageCount, setLastMessageCount] = useState(0);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const isUserScrollingRef = useRef(false);
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 只在消息数量变化时滚动（新消息添加时）
  useEffect(() => {
    const currentMessageCount = chatMessages.length;

    // 如果有新消息且允许自动滚动
    if (currentMessageCount > lastMessageCount && shouldAutoScroll && messagesEndRef.current && messagesContainerRef.current) {
      // 只在消息容器内部滚动，不影响页面其他部分
      // 使用 requestAnimationFrame 确保在渲染完成后滚动
      requestAnimationFrame(() => {
        if (messagesEndRef.current && messagesContainerRef.current) {
          const container = messagesContainerRef.current;
          const target = messagesEndRef.current;
          // 计算目标位置相对于容器的偏移
          const targetTop = target.offsetTop;
          const containerHeight = container.clientHeight;
          const targetHeight = target.clientHeight;
          // 平滑滚动到目标位置
          container.scrollTo({
            top: targetTop - containerHeight + targetHeight + 20,
            behavior: 'smooth'
          });
        }
      });
    }

    setLastMessageCount(currentMessageCount);
  }, [chatMessages.length, shouldAutoScroll]); // 只监听消息数量变化

  // 监听滚动事件，检测用户是否手动滚动
  const handleScroll = useCallback(() => {
    if (!messagesContainerRef.current) return;

    // 标记用户正在滚动
    isUserScrollingRef.current = true;

    // 清除之前的定时器
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current);
    }

    // 计算是否在底部附近
    const { scrollTop, scrollHeight, clientHeight } = messagesContainerRef.current;
    const isNearBottom = scrollHeight - scrollTop - clientHeight < 150;

    // 如果用户不在底部附近，禁用自动滚动
    if (!isNearBottom) {
      setShouldAutoScroll(false);
    } else {
      setShouldAutoScroll(true);
    }

    // 500ms后重置滚动标记
    scrollTimeoutRef.current = setTimeout(() => {
      isUserScrollingRef.current = false;
    }, 500);
  }, []);

  // 用户发送消息时重新启用自动滚动
  const handleUserMessage = useCallback(() => {
    setShouldAutoScroll(true);
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, []);

  // 监听输入变化调整高度
  useEffect(() => {
    adjustTextareaHeight();
  }, [chatInput]);

  // 使用 ref 来存储最新的 addGeneratedResult，避免闭包问题
  const addGeneratedResultRef = useRef(addGeneratedResult);
  useEffect(() => {
    addGeneratedResultRef.current = addGeneratedResult;
  }, [addGeneratedResult]);

  // 监听任务更新
  useEffect(() => {
    const unsubscribe = aiGenerationService.addTaskListener((task) => {
      setCurrentTask(task);
      if (task.status === 'completed') {
        setIsGenerating(false);
        // 将生成的结果添加到创作中心
        if (task.result?.urls) {
          task.result.urls.forEach((url, index) => {
            // 生成一个唯一的数字ID（使用时间戳 + 随机数）
            const numericId = Date.now() + Math.floor(Math.random() * 1000) + index;
            // 使用 ref 调用最新的函数
            addGeneratedResultRef.current({
              id: numericId,
              thumbnail: url,
              score: 85 + Math.floor(Math.random() * 10),
              type: task.type as 'image' | 'video',
              prompt: (task.params as any).prompt
            });
          });
          
          // 确保task.result存在
          if (!task.result?.urls) {
            console.error('[AIAssistantPanel] 任务完成但无结果URL');
            return;
          }
          
          // 更新原来的"生成中"消息为完成状态
          setChatMessages(prev => {
            const updatedMessages = [...prev];
            // 查找正在生成的消息并更新
            const generatingIndex = updatedMessages.findIndex(
              m => m.isGenerating && m.generateType === task.type
            );
            
            if (generatingIndex !== -1) {
              // 更新原来的消息
              updatedMessages[generatingIndex] = {
                ...updatedMessages[generatingIndex],
                content: '', // 清空生成中文字
                isGenerating: false,
                media: task.result!.urls.map((url: string) => ({
                  type: task.type as 'image' | 'video',
                  url: url,
                  thumbnail: url,
                  prompt: (task.params as any).prompt
                }))
              };
            } else {
              // 如果没找到生成中的消息，添加新消息
              updatedMessages.push({
                role: 'assistant',
                content: `✅ ${task.type === 'image' ? '图片' : '视频'}生成完成！`,
                timestamp: Date.now(),
                media: task.result!.urls.map((url: string) => ({
                  type: task.type as 'image' | 'video',
                  url: url,
                  thumbnail: url,
                  prompt: (task.params as any).prompt
                }))
              });
            }
            
            return updatedMessages;
          });
          
          // 清除生成中消息索引
          setGeneratingMessageIndex(null);
          
          // 保存到本地会话
          if (currentSession) {
            const updatedMessages = chatMessages.map(m => 
              m.isGenerating && m.generateType === task.type
                ? { ...m, isGenerating: false, content: '', media: task.result!.urls.map((url: string) => ({
                    type: task.type as 'image' | 'video',
                    url: url,
                    thumbnail: url,
                    prompt: (task.params as any).prompt
                  }))}
                : m
            );
            llmService.importHistory(updatedMessages);
          }
          
          // 异步保存到数据库
          (async () => {
            try {
              const cloudConversation = await aiConversationService.getActiveConversation();
              if (cloudConversation) {
                // 找到更新后的消息并保存
                const updatedMsg = chatMessages.find(m => 
                  m.media && m.media[0]?.url === task.result!.urls[0]
                );
                if (updatedMsg) {
                  await aiConversationService.saveMessage(cloudConversation.id, updatedMsg);
                  console.log('[AIAssistantPanel] 生成完成消息已保存到云端');
                }
              }
            } catch (error) {
              console.error('[AIAssistantPanel] Failed to save success message to cloud:', error);
            }
          })();
          
          // 自动保存到永久存储（云端）
          const originalUrl = task.result!.urls[0];
          // 检查是否已经是永久URL
          const isPermanentUrl = !originalUrl.includes('openai') && 
                                 !originalUrl.includes('replicate') && 
                                 !originalUrl.includes('runway') &&
                                 (originalUrl.includes('supabase') || originalUrl.includes('works/'));
          
          if (!isPermanentUrl) {
            console.log('[AIAssistantPanel] 开始自动保存到永久存储:', task.type, task.id);
            
            // 异步保存，不阻塞UI
            setTimeout(async () => {
              try {
                let permanentUrl: string;
                
                if (task.type === 'image') {
                  permanentUrl = await downloadAndUploadImage(originalUrl, 'ai-generated');
                } else if (task.type === 'video') {
                  permanentUrl = await downloadAndUploadVideo(originalUrl);
                } else {
                  return;
                }
                
                console.log('[AIAssistantPanel] 已保存到永久存储:', permanentUrl);
                
                // 更新任务结果中的URL为永久URL
                const updatedTask = {
                  ...task,
                  result: {
                    ...task.result!,
                    urls: [permanentUrl],
                    originalUrl: originalUrl
                  }
                };
                
                // 更新当前任务状态
                setCurrentTask(updatedTask);
                
                // 添加保存成功的消息
                const saveSuccessMessage: Message = {
                  role: 'assistant',
                  content: `☁️ ${task.type === 'image' ? '图片' : '视频'}已自动保存到云端，链接不会过期。`,
                  timestamp: Date.now()
                };
                setChatMessages(prev => [...prev, saveSuccessMessage]);
                
                // 保存到本地会话和数据库
                if (currentSession) {
                  const updatedMessages = [...chatMessages, saveSuccessMessage];
                  llmService.importHistory(updatedMessages);
                  
                  // 异步保存到数据库
                  (async () => {
                    try {
                      const cloudConversation = await aiConversationService.getActiveConversation();
                      if (cloudConversation) {
                        await aiConversationService.saveMessage(cloudConversation.id, saveSuccessMessage);
                      }
                    } catch (error) {
                      console.error('[AIAssistantPanel] Failed to save saveSuccessMessage to cloud:', error);
                    }
                  })();
                }
                
                toast.success(`${task.type === 'image' ? '图片' : '视频'}已自动保存到云端`);
              } catch (saveError) {
                console.error('[AIAssistantPanel] 自动保存到永久存储失败:', saveError);
                toast.error(`${task.type === 'image' ? '图片' : '视频'}保存到云端失败，请手动保存`);
              }
            }, 1000);
          }
        }
      } else if (task.status === 'failed') {
        setIsGenerating(false);
        const errorMessage: Message = {
          role: 'assistant',
          content: `❌ 生成失败：${task.error || '未知错误'}\n\n请检查提示词是否包含违规内容，或稍后重试。`,
          timestamp: Date.now()
        };
        setChatMessages(prev => [...prev, errorMessage]);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []); // 空依赖数组，只订阅一次

  // 监听历史记录
  useEffect(() => {
    const unsubscribe = aiGenerationService.addHistoryListener((items) => {
      setHistory(items);
    });

    return unsubscribe;
  }, []);

  // 创建新会话
  const createNewSession = () => {
    const newSession = llmService.createSession('新对话');
    const updatedSessions = llmService.getSessions();
    setSessions(updatedSessions);
    setCurrentSession(newSession);
    setChatMessages([WELCOME_MESSAGE]);
    toast.success('新会话已创建');
  };

  // 切换会话
  const switchSession = (sessionId: string) => {
    llmService.switchSession(sessionId);
    const updatedSessions = llmService.getSessions();
    setSessions(updatedSessions);
    const activeSession = updatedSessions.find(s => s.isActive) || updatedSessions[0];
    setCurrentSession(activeSession);
    setChatMessages(activeSession.messages.length > 0 ? activeSession.messages : [WELCOME_MESSAGE]);
  };

  // 删除会话
  const deleteSession = (sessionId: string) => {
    llmService.deleteSession(sessionId);
    const updatedSessions = llmService.getSessions();
    setSessions(updatedSessions);
    const activeSession = updatedSessions.find(s => s.isActive) || updatedSessions[0];
    setCurrentSession(activeSession);
    setChatMessages(activeSession.messages.length > 0 ? activeSession.messages : [WELCOME_MESSAGE]);
    toast.success('会话已删除');
  };

  // 重命名会话
  const renameSession = () => {
    if (!editingSessionName.trim() || !currentSession) return;
    llmService.renameSession(currentSession.id, editingSessionName.trim());
    const updatedSessions = llmService.getSessions();
    setSessions(updatedSessions);
    const updatedCurrentSession = updatedSessions.find(s => s.id === currentSession.id);
    if (updatedCurrentSession) {
      setCurrentSession(updatedCurrentSession);
    }
    setIsEditingSessionName(false);
    setEditingSessionName('');
    toast.success('会话已重命名');
  };

  // 开始编辑会话名称
  const startEditingSessionName = () => {
    if (currentSession) {
      setEditingSessionName(currentSession.name);
      setIsEditingSessionName(true);
    }
  };

  // 开始编辑会话列表中的会话名称
  const startEditingSessionInList = (session: ConversationSession, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSessionId(session.id);
    setEditingSessionNameInList(session.name);
  };

  // 保存会话列表中的会话名称
  const saveSessionNameInList = () => {
    if (!editingSessionNameInList.trim() || !editingSessionId) return;
    llmService.renameSession(editingSessionId, editingSessionNameInList.trim());
    const updatedSessions = llmService.getSessions();
    setSessions(updatedSessions);
    if (currentSession?.id === editingSessionId) {
      const updatedCurrentSession = updatedSessions.find(s => s.id === editingSessionId);
      if (updatedCurrentSession) {
        setCurrentSession(updatedCurrentSession);
      }
    }
    setEditingSessionId(null);
    setEditingSessionNameInList('');
    toast.success('会话已重命名');
  };

  // 取消编辑会话列表中的会话名称
  const cancelEditingSessionInList = () => {
    setEditingSessionId(null);
    setEditingSessionNameInList('');
  };

  // 解析用户输入，判断是否包含生成指令
  const parseGenerateCommand = (input: string): { isGenerate: boolean; mode?: GenerateMode; prompt?: string } => {
    const lowerInput = input.toLowerCase();

    // 图片生成关键词
    const imageKeywords = [
      '生成图片', '画一张', '画一个', '生成一张图', '画个', '生成图像',
      '直接生成', '帮我生成', '生成一张', '给我画', '画一', '画个图',
      'create image', 'generate image', 'draw a', 'draw me'
    ];
    // 视频生成关键词
    const videoKeywords = [
      '生成视频', '做个视频', '生成一段视频', '创建视频',
      'create video', 'generate video', 'make a video'
    ];

    for (const keyword of imageKeywords) {
      if (lowerInput.includes(keyword)) {
        const promptText = input.replace(new RegExp(keyword, 'gi'), '').trim();
        return { isGenerate: true, mode: 'image', prompt: promptText || input };
      }
    }

    for (const keyword of videoKeywords) {
      if (lowerInput.includes(keyword)) {
        const promptText = input.replace(new RegExp(keyword, 'gi'), '').trim();
        return { isGenerate: true, mode: 'video', prompt: promptText || input };
      }
    }

    return { isGenerate: false };
  };

  // 处理生成
  const handleGenerate = useCallback(async (generatePrompt: string, mode: GenerateMode) => {
    if (!generatePrompt.trim()) {
      toast.error('请输入描述内容');
      return;
    }

    setIsGenerating(true);

    try {
      if (mode === 'image') {
        const params: ImageGenerationParams = {
          ...imageParams,
          prompt: selectedStyle
            ? `${generatePrompt}，${DEFAULT_STYLE_PRESETS.find(s => s.id === selectedStyle)?.prompt || ''}`
            : generatePrompt
        };
        await aiGenerationService.generateImage(params);
      } else {
        const params: VideoGenerationParams = {
          ...videoParams,
          prompt: generatePrompt
        };
        await aiGenerationService.generateVideo(params);
      }
    } catch (error) {
      setIsGenerating(false);
      toast.error('启动生成失败');
    }
  }, [imageParams, videoParams, selectedStyle]);

  // 处理聊天消息
  const handleChatSubmit = async (e?: React.FormEvent, customInput?: string) => {
    e?.preventDefault();
    const inputText = customInput || chatInput;
    if (!inputText.trim() || isChatLoading || isGenerating) return;

    const userMessage: Message = {
      role: 'user',
      content: inputText,
      timestamp: Date.now()
    };

    const newMessages = [...chatMessages, userMessage];
    setChatMessages(newMessages);
    if (!customInput) setChatInput('');

    // 用户发送消息时启用自动滚动
    handleUserMessage();

    // 保存消息到当前会话
    if (currentSession) {
      llmService.importHistory(newMessages);
      const updatedSessions = llmService.getSessions();
      setSessions(updatedSessions);
      
      // 异步保存到数据库
      (async () => {
        try {
          // 获取或创建云端对话
          let cloudConversation = await aiConversationService.getActiveConversation();
          if (!cloudConversation) {
            cloudConversation = await aiConversationService.createConversation(currentSession.name, currentSession.modelId);
          }
          if (cloudConversation) {
            await aiConversationService.saveMessage(cloudConversation.id, userMessage);
          }
        } catch (error) {
          console.error('[AIAssistantPanel] Failed to save user message to cloud:', error);
        }
      })();
    }

    // 检查是否是生成指令
    const { isGenerate, mode, prompt: generatePrompt } = parseGenerateCommand(inputText);

    if (isGenerate && mode && generatePrompt) {
      // 是生成指令，直接执行生成
      setIsChatLoading(true);

      // 添加"生成中"消息（带生成状态标记）
      const generatingMessage: Message = {
        role: 'assistant',
        content: `${mode === 'image' ? '图片' : '视频'}生成中...`,
        timestamp: Date.now(),
        isGenerating: true,
        generateType: mode
      };
      const messagesWithGenerating = [...newMessages, generatingMessage];
      setChatMessages(messagesWithGenerating);
      
      // 记录正在生成的消息索引
      setGeneratingMessageIndex(messagesWithGenerating.length - 1);
      
      // 保存消息
      if (currentSession) {
        llmService.importHistory(messagesWithGenerating);
      }
      
      setIsChatLoading(false);

      // 执行生成
      await handleGenerate(generatePrompt, mode);
      return;
    }

    // 普通对话，调用LLM
    setIsChatLoading(true);
    setIsStreaming(true);
    setStreamingContent('');

    try {
      let fullResponse = '';
      
      const response = await llmService.generateResponse(inputText, {
        context: {
          page: 'AI助手',
          path: '/create',
          history: chatMessages.slice(-5) // 提供最近5条消息作为上下文
        },
        onDelta: (chunk: string) => {
          // 流式接收AI响应内容
          fullResponse += chunk;
          setStreamingContent(fullResponse);
        }
      });

      const assistantMessage: Message = {
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      const finalMessages = [...newMessages, assistantMessage];
      setChatMessages(finalMessages);
      
      // 保存助手回复到会话
      if (currentSession) {
        llmService.importHistory(finalMessages);
        const updatedSessions = llmService.getSessions();
        setSessions(updatedSessions);
        
        // 异步保存到数据库
        (async () => {
          try {
            const cloudConversation = await aiConversationService.getActiveConversation();
            if (cloudConversation) {
              await aiConversationService.saveMessage(cloudConversation.id, assistantMessage);
            }
          } catch (error) {
            console.error('[AIAssistantPanel] Failed to save assistant message to cloud:', error);
          }
        })();
      }
    } catch (error) {
      toast.error('发送消息失败');
    } finally {
      setIsChatLoading(false);
      setIsStreaming(false);
      setStreamingContent('');
    }
  };

  // 处理快捷指令 - 在聊天中显示卡片
  const handleQuickCommand = (command: typeof QUICK_COMMANDS[0]) => {
    // 添加带快捷操作卡片的消息
    const cardMessage: Message = {
      role: 'assistant',
      content: `我来帮您${command.label}！请在下方输入您的具体需求：`,
      timestamp: Date.now(),
      quickAction: {
        type: command.id as QuickActionCard['type'],
        title: command.label,
        description: getCommandDescription(command.id),
        icon: command.icon,
        color: command.color,
        gradient: command.gradient
      }
    };
    
    setChatMessages(prev => [...prev, cardMessage]);
    
    // 根据命令类型设置生成模式
    if (command.id === 'generate-image') {
      setGenerateMode('image');
    } else if (command.id === 'generate-video') {
      setGenerateMode('video');
    }
    
    // 设置输入框提示
    setChatInput(command.prompt);
  };
  
  // 获取命令描述
  const getCommandDescription = (commandId: string): string => {
    switch (commandId) {
      case 'generate-image':
        return '基于描述直接生成AI图片';
      case 'generate-video':
        return '基于描述直接生成AI视频';
      case 'optimize-prompt':
        return '优化您的提示词，让生成效果更好';
      case 'creative-idea':
        return '获取创意灵感，激发创作思路';
      default:
        return '';
    }
  };

  // 清空当前会话历史
  const handleClearChat = () => {
    if (currentSession) {
      llmService.clearHistory();
      const updatedSessions = llmService.getSessions();
      setSessions(updatedSessions);
      const updatedCurrentSession = updatedSessions.find(s => s.id === currentSession.id);
      if (updatedCurrentSession) {
        setCurrentSession(updatedCurrentSession);
      }
    }
    setChatMessages([WELCOME_MESSAGE]);
    toast.success('对话已清空');
  };

  // 解析 Markdown 表格
  const parseMarkdownTable = (lines: string[], startIndex: number): { table: React.ReactNode; endIndex: number } | null => {
    const tableLines: string[] = [];
    let i = startIndex;

    // 收集表格行（以 | 开头的行）
    while (i < lines.length && lines[i].trim().startsWith('|')) {
      tableLines.push(lines[i]);
      i++;
    }

    if (tableLines.length < 2) return null;

    // 解析表头
    const headerLine = tableLines[0];
    const headers = headerLine.split('|').map(h => h.trim()).filter(h => h);

    // 检查第二行是否是分隔符行 (|----|-----|)
    const separatorLine = tableLines[1];
    const isSeparator = separatorLine.split('|').every(cell => {
      const trimmed = cell.trim();
      return trimmed === '' || /^[-:]+$/.test(trimmed);
    });

    if (!isSeparator) return null;

    // 解析数据行
    const dataRows = tableLines.slice(2).map(row => {
      const cells = row.split('|').map(cell => cell.trim());
      return cells.filter((_, idx, arr) => idx > 0 && idx < arr.length - 1);
    });

    const table = (
      <div className="overflow-x-auto my-3 rounded-lg border border-gray-200 dark:border-gray-700">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-gray-100 dark:bg-gray-800">
              {headers.map((header, idx) => (
                <th
                  key={idx}
                  className="px-3 py-2 text-left font-semibold text-gray-700 dark:text-gray-300 border-b border-gray-200 dark:border-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {dataRows.map((row, rowIdx) => (
              <tr
                key={rowIdx}
                className={clsx(
                  "border-b border-gray-100 dark:border-gray-800",
                  rowIdx % 2 === 1 && "bg-gray-50/50 dark:bg-gray-800/30"
                )}
              >
                {row.map((cell, cellIdx) => (
                  <td
                    key={cellIdx}
                    className="px-3 py-2 text-gray-600 dark:text-gray-400"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );

    return { table, endIndex: i - 1 };
  };

  // 渲染消息内容，支持 Markdown 格式
  const renderMessageContent = (content: string): React.ReactNode => {
    const lines = content.split('\n');
    const result: React.ReactNode[] = [];
    let i = 0;

    // 处理内联 Markdown 格式（粗体、斜体、行内代码）
    const renderInlineMarkdown = (text: string): React.ReactNode => {
      // 处理粗体 **text**
      const parts = text.split(/(\*\*[^*]+\*\*)/g);
      return parts.map((part, idx) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={idx} className="font-semibold">{part.slice(2, -2)}</strong>;
        }
        // 处理斜体 *text*
        if (part.startsWith('*') && part.endsWith('*') && !part.startsWith('**')) {
          return <em key={idx} className="italic">{part.slice(1, -1)}</em>;
        }
        // 处理行内代码 `code`
        if (part.startsWith('`') && part.endsWith('`') && !part.startsWith('```')) {
          return (
            <code key={idx} className={clsx(
              "px-1.5 py-0.5 rounded text-xs font-mono",
              isDark ? "bg-gray-700 text-pink-300" : "bg-gray-100 text-pink-600"
            )}>
              {part.slice(1, -1)}
            </code>
          );
        }
        return part;
      });
    };

    while (i < lines.length) {
      const line = lines[i];
      const trimmedLine = line.trim();

      // 检查是否是表格开始
      if (trimmedLine.startsWith('|')) {
        const tableResult = parseMarkdownTable(lines, i);
        if (tableResult) {
          result.push(tableResult.table);
          i = tableResult.endIndex + 1;
          continue;
        }
      }

      // 检查是否是代码块开始
      if (trimmedLine.startsWith('```')) {
        const language = trimmedLine.slice(3).trim();
        let codeContent = '';
        let j = i + 1;
        while (j < lines.length && !lines[j].trim().startsWith('```')) {
          codeContent += (codeContent ? '\n' : '') + lines[j];
          j++;
        }
        result.push(
          <div key={i} className={clsx(
            "my-3 rounded-lg overflow-hidden",
            isDark ? "bg-gray-800 border border-gray-700" : "bg-gray-100 border border-gray-200"
          )}>
            {language && (
              <div className={clsx(
                "px-3 py-1 text-xs font-medium border-b",
                isDark ? "bg-gray-700/50 border-gray-700 text-gray-400" : "bg-gray-200/50 border-gray-200 text-gray-500"
              )}>
                {language}
              </div>
            )}
            <pre className="p-3 overflow-x-auto">
              <code className={clsx(
                "text-xs font-mono whitespace-pre",
                isDark ? "text-gray-300" : "text-gray-700"
              )}>
                {codeContent}
              </code>
            </pre>
          </div>
        );
        i = j + 1;
        continue;
      }

      // 检查是否是标题
      const headingMatch = trimmedLine.match(/^(#{1,6})\s+(.+)$/);
      if (headingMatch) {
        const level = headingMatch[1].length;
        const text = headingMatch[2];
        const headingClasses = [
          "text-lg font-bold mt-4 mb-2", // h1
          "text-base font-bold mt-3 mb-2", // h2
          "text-sm font-bold mt-3 mb-1", // h3
          "text-sm font-semibold mt-2 mb-1", // h4
          "text-xs font-semibold mt-2 mb-1", // h5
          "text-xs font-medium mt-2 mb-1", // h6
        ];
        result.push(
          <div key={i} className={headingClasses[level - 1]}>
            {renderInlineMarkdown(text)}
          </div>
        );
        i++;
        continue;
      }

      // 检查是否是分隔线
      if (trimmedLine === '---' || trimmedLine === '***' || trimmedLine === '___') {
        result.push(
          <hr key={i} className={clsx(
            "my-4 border-t",
            isDark ? "border-gray-700" : "border-gray-200"
          )} />
        );
        i++;
        continue;
      }

      // 检查是否是列表项
      const listMatch = trimmedLine.match(/^(\s*)(\d+\.\s+|[-*]\s+)(.+)$/);
      if (listMatch) {
        const indent = listMatch[1].length;
        const isOrdered = /^\d+\./.test(listMatch[2]);
        const listItems: React.ReactNode[] = [];
        let j = i;
        while (j < lines.length) {
          const itemMatch = lines[j].trim().match(/^(\s*)(\d+\.\s+|[-*]\s+)(.+)$/);
          if (itemMatch && itemMatch[1].length === indent) {
            listItems.push(
              <li key={j} className={clsx(
                "ml-4 mb-1",
                isOrdered ? "list-decimal" : "list-disc"
              )}>
                {renderInlineMarkdown(itemMatch[3])}
              </li>
            );
            j++;
          } else if (lines[j].trim() === '' && j + 1 < lines.length && lines[j + 1].trim().match(/^(\s*)(\d+\.\s+|[-*]\s+)(.+)$/)) {
            j++;
          } else {
            break;
          }
        }
        result.push(
          <ol key={i} className={isOrdered ? "list-decimal list-inside my-2" : "list-disc list-inside my-2"}>
            {listItems}
          </ol>
        );
        i = j;
        continue;
      }

      // 普通文本行
      if (trimmedLine) {
        result.push(
          <p key={i} className="mb-1 last:mb-0 leading-relaxed">
            {renderInlineMarkdown(line)}
          </p>
        );
      } else {
        // 空行
        result.push(<div key={i} className="h-2" />);
      }

      i++;
    }

    return result;
  };

  // 从消息内容中提取媒体URL（兼容历史消息）
  const extractMediaFromMessage = (message: Message): MediaContent[] | null => {
    // 如果已经有media字段，直接返回
    if (message.media && message.media.length > 0) {
      return message.media;
    }
    
    // 尝试从内容中提取图片URL
    const media: MediaContent[] = [];
    const content = message.content;
    
    // 匹配常见的图片URL模式
    const imageUrlPatterns = [
      /(https?:\/\/[^\s]+\.(?:jpg|jpeg|png|gif|webp))/gi,
      /(https?:\/\/[^\s]+openai[^\s]*)/gi,
      /(https?:\/\/[^\s]+replicate[^\s]*)/gi,
      /(https?:\/\/[^\s]+supabase[^\s]*)/gi,
    ];
    
    for (const pattern of imageUrlPatterns) {
      const matches = content.match(pattern);
      if (matches) {
        matches.forEach(url => {
          // 去重
          if (!media.some(m => m.url === url)) {
            media.push({
              type: 'image',
              url: url,
              thumbnail: url
            });
          }
        });
      }
    }
    
    return media.length > 0 ? media : null;
  };

  return (
    <div className={clsx(
      "flex h-full overflow-hidden sticky top-0",
      isDark ? "bg-gradient-to-b from-gray-900 via-gray-900 to-gray-950" : "bg-gradient-to-b from-gray-50 via-white to-gray-50"
    )}>
      {/* 左侧会话列表 */}
      <AnimatePresence>
        {showSessionList && (
          <motion.div
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 220, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className={clsx(
              "flex flex-col border-r shrink-0 h-full overflow-hidden relative",
              isDark ? "border-gray-800/50 bg-gray-900/50" : "border-gray-200/50 bg-gray-50/50"
            )}
          >
            {/* 关闭按钮 - 在面板内部右上角 */}
            <motion.button
              onClick={() => setShowSessionList(false)}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
              className={clsx(
                "absolute top-2 right-2 z-10 w-6 h-6 rounded-lg flex items-center justify-center transition-colors",
                isDark
                  ? "bg-gray-800/80 text-gray-400 hover:text-gray-200 hover:bg-gray-700"
                  : "bg-white/80 text-gray-400 hover:text-gray-600 hover:bg-gray-200"
              )}
              title="关闭会话列表"
            >
              <i className="fas fa-times text-xs" />
            </motion.button>
            {/* 会话列表头部 */}
            <div className={clsx(
              "flex items-center justify-between px-3 py-3 border-b",
              isDark ? "border-gray-800/50" : "border-gray-200/50"
            )}>
              <div>
                <h3 className={clsx(
                  "text-xs font-semibold",
                  isDark ? "text-gray-200" : "text-gray-700"
                )}>会话列表</h3>
                <p className={clsx(
                  "text-[10px]",
                  isDark ? "text-gray-500" : "text-gray-400"
                )}>{sessions.length} 个会话</p>
              </div>
              <motion.button
                onClick={createNewSession}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                className={clsx(
                  "w-7 h-7 rounded-lg flex items-center justify-center transition-colors",
                  isDark
                    ? "bg-purple-500/20 text-purple-400 hover:bg-purple-500/30"
                    : "bg-purple-100 text-purple-600 hover:bg-purple-200"
                )}
                title="新建会话"
              >
                <i className="fas fa-plus text-xs" />
              </motion.button>
            </div>

            {/* 会话列表 */}
            <div className="flex-1 overflow-y-auto scrollbar-hide p-2 space-y-1">
              {sessions.length === 0 && (
                <div className="text-center py-6 text-gray-400">
                  <i className="fas fa-inbox text-2xl mb-2" />
                  <p className="text-xs">暂无会话</p>
                </div>
              )}
              {sessions.map((session) => (
                <motion.div
                  key={session.id}
                  onClick={() => switchSession(session.id)}
                  className={clsx(
                    "group relative p-2.5 cursor-pointer rounded-xl transition-all duration-200 border",
                    currentSession?.id === session.id
                      ? (isDark
                        ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border-purple-500/30'
                        : 'bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200')
                      : (isDark
                        ? 'bg-gray-800/40 border-gray-700/30 hover:border-gray-600 hover:bg-gray-800/60'
                        : 'bg-white border-gray-200/50 hover:border-gray-300 hover:shadow-sm')
                  )}
                  whileHover={{ x: 2 }}
                >
                  {/* 活跃指示条 */}
                  {currentSession?.id === session.id && (
                    <div className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-full bg-gradient-to-b from-purple-500 to-pink-500" />
                  )}

                  <div className="flex items-center justify-between pl-1.5">
                    <div className="flex-1 min-w-0">
                      {editingSessionId === session.id ? (
                        // 编辑模式
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={editingSessionNameInList}
                            onChange={(e) => setEditingSessionNameInList(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                e.stopPropagation();
                                saveSessionNameInList();
                              } else if (e.key === 'Escape') {
                                e.stopPropagation();
                                cancelEditingSessionInList();
                              }
                            }}
                            onBlur={saveSessionNameInList}
                            onClick={(e) => e.stopPropagation()}
                            autoFocus
                            className={clsx(
                              "text-xs font-medium px-1.5 py-0.5 rounded border outline-none w-full",
                              isDark
                                ? "bg-gray-800 border-gray-600 text-gray-200 focus:border-purple-500"
                                : "bg-white border-gray-300 text-gray-700 focus:border-purple-500"
                            )}
                          />
                        </div>
                      ) : (
                        // 显示模式
                        <p
                          onDoubleClick={(e) => startEditingSessionInList(session, e)}
                          className={clsx(
                            "text-xs font-medium truncate cursor-pointer",
                            isDark ? "text-gray-200" : "text-gray-700"
                          )}
                          title="双击重命名"
                        >
                          {session.name}
                        </p>
                      )}
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={clsx(
                          "text-[9px] px-1.5 py-0.5 rounded-full",
                          isDark ? "bg-gray-700 text-gray-400" : "bg-gray-100 text-gray-500"
                        )}>
                          {session.messages.length} 条
                        </span>
                        {currentSession?.id === session.id && (
                          <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        )}
                      </div>
                    </div>
                    {editingSessionId !== session.id && (
                      <div className="flex items-center gap-0.5">
                        <motion.button
                          onClick={(e) => startEditingSessionInList(session, e)}
                          className={clsx(
                            "opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all",
                            isDark
                              ? "text-gray-500 hover:text-purple-400 hover:bg-purple-500/10"
                              : "text-gray-400 hover:text-purple-500 hover:bg-purple-50"
                          )}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="重命名"
                        >
                          <i className="fas fa-pencil-alt text-[10px]" />
                        </motion.button>
                        <motion.button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSession(session.id);
                          }}
                          className={clsx(
                            "opacity-0 group-hover:opacity-100 p-1 rounded-lg transition-all",
                            isDark
                              ? "text-gray-500 hover:text-red-400 hover:bg-red-500/10"
                              : "text-gray-400 hover:text-red-500 hover:bg-red-50"
                          )}
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          title="删除"
                        >
                          <i className="fas fa-trash text-[10px]" />
                        </motion.button>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* 左侧底部操作 */}
            <div className={clsx(
              "p-2 border-t",
              isDark ? "border-gray-800/50" : "border-gray-200/50"
            )}>
              <motion.button
                onClick={handleClearChat}
                className={clsx(
                  "w-full text-xs py-2 rounded-xl transition-all duration-200 font-medium flex items-center justify-center gap-1.5",
                  isDark
                    ? "bg-red-900/20 text-red-400 hover:bg-red-900/30"
                    : "bg-red-50 text-red-600 hover:bg-red-100"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <i className="fas fa-trash-alt" />
                清空当前会话
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 右侧主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
        {/* 头部 - 玻璃拟态效果 */}
        <div className={clsx(
          'flex items-center justify-between px-4 py-3 border-b backdrop-blur-xl flex-shrink-0',
          isDark
            ? 'border-gray-800/50 bg-gray-900/80'
            : 'border-gray-200/50 bg-white/80'
        )}>
          <div className="flex items-center space-x-3">
            {/* 切换会话列表按钮 - 优化样式使其更明显 */}
            <motion.button
              onClick={() => setShowSessionList(!showSessionList)}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className={clsx(
                "p-2.5 rounded-xl transition-all duration-200 border",
                showSessionList
                  ? (isDark
                      ? "bg-purple-500/20 text-purple-400 border-purple-500/30"
                      : "bg-purple-100 text-purple-600 border-purple-200")
                  : (isDark
                      ? "bg-gray-800 text-gray-300 hover:bg-gray-700 border-gray-700"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200")
              )}
              title={showSessionList ? "隐藏会话列表" : "显示会话列表"}
            >
              <i className={clsx(
                "fas text-sm",
                showSessionList ? "fa-chevron-left" : "fa-bars"
              )} />
            </motion.button>

            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="relative"
            >
              <div className={clsx(
                "absolute inset-0 rounded-xl blur-lg opacity-60",
                isDark ? "bg-gradient-to-br from-purple-600 to-pink-600" : "bg-gradient-to-br from-purple-500 to-pink-500"
              )} />
              <div className="relative w-9 h-9 rounded-xl bg-gradient-to-br from-purple-500 via-purple-600 to-pink-500 flex items-center justify-center shadow-lg shadow-purple-500/25">
                <i className="fas fa-robot text-white text-sm" />
              </div>
              {/* 在线状态指示器 */}
              <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-gray-900" />
            </motion.div>
            <div>
              {isEditingSessionName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editingSessionName}
                    onChange={(e) => setEditingSessionName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        renameSession();
                      } else if (e.key === 'Escape') {
                        setIsEditingSessionName(false);
                        setEditingSessionName('');
                      }
                    }}
                    onBlur={renameSession}
                    autoFocus
                    className={clsx(
                      "text-sm font-semibold px-2 py-1 rounded-lg border outline-none w-32",
                      isDark
                        ? "bg-gray-800 border-gray-700 text-white focus:border-purple-500"
                        : "bg-white border-gray-200 text-gray-900 focus:border-purple-500"
                    )}
                  />
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <span
                    onClick={startEditingSessionName}
                    className={clsx(
                      'font-semibold text-sm block cursor-pointer hover:underline',
                      isDark ? 'text-gray-100' : 'text-gray-800'
                    )}
                    title="点击重命名"
                  >
                    {currentSession?.name || 'AI助手'}
                  </span>
                  <motion.button
                    onClick={startEditingSessionName}
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    className={clsx(
                      "p-1 rounded-lg transition-colors opacity-0 hover:opacity-100",
                      isDark ? "text-gray-500 hover:text-gray-300" : "text-gray-400 hover:text-gray-600"
                    )}
                  >
                    <i className="fas fa-pencil-alt text-[10px]" />
                  </motion.button>
                </div>
              )}
              <span className={clsx(
                'text-[10px]',
                isDark ? 'text-emerald-400' : 'text-emerald-600'
              )}>在线</span>
            </div>
          </div>

          {/* 标签切换 - 胶囊设计 */}
          <div className={clsx(
            'flex p-1 rounded-full',
            isDark ? 'bg-gray-800/80' : 'bg-gray-100/80'
          )}>
            {[
              { id: 'chat', label: '对话', icon: 'comments' },
              { id: 'history', label: '历史', icon: 'history' }
            ].map((tab) => (
              <motion.button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className={clsx(
                  'flex items-center space-x-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium transition-all duration-300',
                  activeTab === tab.id
                    ? (isDark
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/25'
                        : 'bg-white text-gray-900 shadow-md')
                    : (isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700')
                )}
              >
                <i className={`fas fa-${tab.icon}`} />
                <span>{tab.label}</span>
              </motion.button>
            ))}
          </div>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden relative h-full">
          <AnimatePresence mode="wait">
            {/* 对话面板 */}
            {activeTab === 'chat' && (
              <motion.div
                key="chat"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full overflow-hidden"
              >
                {/* 消息列表 */}
                <div
                  ref={messagesContainerRef}
                  onScroll={handleScroll}
                  className={clsx(
                    "flex-1 overflow-y-auto scrollbar-hide p-4 space-y-5 overscroll-contain",
                    isDark ? "scrollbar-thumb-gray-700 scrollbar-track-gray-800" : "scrollbar-thumb-gray-300 scrollbar-track-gray-100"
                  )}
                >
                  {chatMessages.map((message, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 15, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      className={clsx(
                        'flex',
                        message.role === 'user' ? 'justify-end' : 'justify-start'
                      )}
                    >
                      {message.role === 'assistant' && (
                        <div className="flex-shrink-0 mr-3">
                          <div className={clsx(
                            "w-8 h-8 rounded-xl flex items-center justify-center shadow-lg",
                            isDark
                              ? "bg-gradient-to-br from-purple-600 to-pink-600 shadow-purple-500/20"
                              : "bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/25"
                          )}>
                            <i className="fas fa-robot text-white text-xs" />
                          </div>
                        </div>
                      )}

                      <div className={clsx(
                        'max-w-[82%]',
                        message.role === 'user' ? 'order-1' : 'order-2'
                      )}>
                        {/* 用户名/时间 */}
                        <div className={clsx(
                          'flex items-center mb-1.5',
                          message.role === 'user' ? 'justify-end' : 'justify-start'
                        )}>
                          <span className={clsx(
                            'text-[11px] font-medium',
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          )}>
                            {message.role === 'user' ? '我' : 'AI助手'}
                          </span>
                          <span className={clsx(
                            'text-[10px] ml-2',
                            isDark ? 'text-gray-600' : 'text-gray-400'
                          )}>
                            {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {/* 消息气泡 */}
                        <div className={clsx(
                          'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm',
                          message.role === 'user'
                            ? clsx(
                                'bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-md',
                                'shadow-purple-500/20'
                              )
                            : clsx(
                                isDark
                                  ? 'bg-gray-800/80 text-gray-100 rounded-bl-md border border-gray-700/50'
                                  : 'bg-white text-gray-700 rounded-bl-md border border-gray-200/80',
                                'shadow-lg shadow-black/5'
                              )
                        )}>
                          {/* 生成中状态显示 */}
                          {message.isGenerating ? (
                            <div className="flex items-center gap-3 py-2">
                              <motion.div
                                animate={{ 
                                  scale: [1, 1.2, 1],
                                  opacity: [0.5, 1, 0.5]
                                }}
                                transition={{ 
                                  duration: 1.5, 
                                  repeat: Infinity,
                                  ease: "easeInOut"
                                }}
                                className="w-5 h-5 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                              />
                              <span className={clsx(
                                "text-sm font-medium",
                                isDark ? "text-gray-300" : "text-gray-600"
                              )}>
                                {message.content}
                              </span>
                            </div>
                          ) : index === 0 && message.role === 'assistant' ? (
                            <div className="space-y-4">
                              <p className="font-medium text-base">{message.content}</p>
                              {/* 功能列表 - 响应式布局：电脑端2列，移动端1列 */}
                              <div className="grid grid-cols-1 lg:grid-cols-2 gap-2.5">
                                {FEATURES.map((feature, idx) => (
                                  <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, x: -10 }}
                                    animate={{ opacity: 1, x: 0 }}
                                    transition={{ delay: idx * 0.1 + 0.3 }}
                                    onClick={() => {
                                      const cmd = QUICK_COMMANDS.find(c => c.label === feature.text);
                                      if (cmd) handleQuickCommand(cmd);
                                    }}
                                    className={clsx(
                                      "flex items-center space-x-3 p-3 rounded-xl transition-all cursor-pointer group",
                                      isDark
                                        ? "bg-gray-700/50 hover:bg-gray-700 border border-gray-600/30"
                                        : "bg-gray-50 hover:bg-gray-100 border border-gray-200/50 hover:shadow-sm"
                                    )}
                                  >
                                    <div
                                      className="w-9 h-9 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110"
                                      style={{
                                        background: `linear-gradient(135deg, ${feature.color}20, ${feature.color}10)`,
                                        border: `1px solid ${feature.color}30`
                                      }}
                                    >
                                      <i
                                        className={`fas fa-${feature.icon}`}
                                        style={{ color: feature.color, fontSize: '14px' }}
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={clsx(
                                        "font-medium text-sm",
                                        isDark ? "text-gray-200" : "text-gray-700"
                                      )}>{feature.text}</p>
                                      <p className={clsx(
                                        "text-xs mt-0.5 truncate",
                                        isDark ? "text-gray-500" : "text-gray-500"
                                      )}>{feature.desc}</p>
                                    </div>
                                    <i className={clsx(
                                      "fas fa-chevron-right text-xs transition-transform group-hover:translate-x-1 flex-shrink-0",
                                      isDark ? "text-gray-600" : "text-gray-400"
                                    )} />
                                  </motion.div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            <div className="whitespace-pre-wrap max-w-none">
                              {renderMessageContent(message.content)}
                            </div>
                          )}
                          
                          {/* 媒体内容显示 - 图片/视频预览（兼容历史消息） */}
                          {(() => {
                            const mediaItems = extractMediaFromMessage(message);
                            return mediaItems && mediaItems.length > 0 ? (
                              <div className="mt-4 space-y-3">
                                {mediaItems.map((mediaItem, mediaIdx) => (
                                  <motion.div
                                    key={mediaIdx}
                                    initial={{ opacity: 0, scale: 0.95 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    transition={{ delay: mediaIdx * 0.1 }}
                                    className="relative group cursor-pointer overflow-hidden rounded-xl border-2 border-transparent hover:border-purple-500 transition-all"
                                    onClick={() => {
                                      // 点击跳转到画布查看
                                      const result = generatedResults.find(r => r.thumbnail === mediaItem.url);
                                      if (result) {
                                        setSelectedResult(result.id);
                                      }
                                    }}
                                  >
                                    {mediaItem.type === 'video' ? (
                                      <video
                                        src={mediaItem.url}
                                        poster={mediaItem.thumbnail}
                                        className="w-full max-h-48 object-cover rounded-xl"
                                        controls
                                        preload="metadata"
                                      />
                                    ) : (
                                      <img
                                        src={mediaItem.url}
                                        alt="生成的图片"
                                        className="w-full max-h-48 object-cover rounded-xl"
                                        loading="lazy"
                                        onError={(e) => {
                                          // 图片加载失败时显示占位符
                                          (e.target as HTMLImageElement).style.display = 'none';
                                        }}
                                      />
                                    )}
                                    {/* 悬停遮罩 */}
                                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-all flex items-center justify-center">
                                      <span className="opacity-0 group-hover:opacity-100 text-white text-sm font-medium flex items-center gap-2 transition-all">
                                        <i className="fas fa-expand" />
                                        在画布中查看
                                      </span>
                                    </div>
                                    {/* 类型标签 */}
                                    <div className="absolute top-2 left-2 px-2 py-1 bg-black/60 text-white text-xs rounded-md flex items-center gap-1">
                                      <i className={`fas fa-${mediaItem.type === 'video' ? 'video' : 'image'}`} />
                                      {mediaItem.type === 'video' ? '视频' : '图片'}
                                    </div>
                                  </motion.div>
                                ))}
                              </div>
                            ) : null;
                          })()}
                          
                          {/* 快捷操作卡片显示 */}
                          {message.quickAction && (
                            <motion.div
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              className="mt-4 rounded-xl overflow-hidden border-2 border-purple-500/30 hover:border-purple-500/60 transition-all"
                            >
                              {/* 卡片头部 */}
                              <div className={clsx(
                                "px-4 py-3 flex items-center gap-3",
                                `bg-gradient-to-r ${message.quickAction.gradient}`
                              )}>
                                <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center">
                                  <i className={`fas fa-${message.quickAction.icon} text-white text-lg`} />
                                </div>
                                <div className="flex-1">
                                  <h4 className="text-white font-semibold">{message.quickAction.title}</h4>
                                  <p className="text-white/80 text-xs">{message.quickAction.description}</p>
                                </div>
                              </div>
                              
                              {/* 卡片内容 - 生成参数设置 */}
                              {(message.quickAction.type === 'generate-image' || message.quickAction.type === 'generate-video') && (
                                <div className={clsx(
                                  "p-4 space-y-3",
                                  isDark ? "bg-gray-800/50" : "bg-gray-50"
                                )}>
                                  {/* 快捷参数设置 */}
                                  <div className="grid grid-cols-2 gap-2">
                                    <button
                                      onClick={() => {
                                        setShowSettings(true);
                                        setGenerateMode(message.quickAction!.type === 'generate-image' ? 'image' : 'video');
                                      }}
                                      className={clsx(
                                        "px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
                                        isDark 
                                          ? "bg-gray-700 hover:bg-gray-600 text-gray-300" 
                                          : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-200"
                                      )}
                                    >
                                      <i className="fas fa-sliders-h" />
                                      高级设置
                                    </button>
                                    <button
                                      onClick={() => {
                                        // 快速生成示例
                                        const demoPrompt = message.quickAction!.type === 'generate-image' 
                                          ? '一只可爱的猫咪在花园里玩耍，阳光明媚，色彩鲜艳'
                                          : '海浪拍打沙滩，夕阳西下的美丽景象';
                                        setChatInput(demoPrompt);
                                      }}
                                      className={clsx(
                                        "px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
                                        `bg-gradient-to-r ${message.quickAction.gradient} text-white hover:opacity-90`
                                      )}
                                    >
                                      <i className="fas fa-magic" />
                                      试试示例
                                    </button>
                                  </div>
                                  
                                  {/* 提示 */}
                                  <p className={clsx(
                                    "text-xs text-center",
                                    isDark ? "text-gray-500" : "text-gray-400"
                                  )}>
                                    💡 在下方输入框中描述您想要生成的内容，然后发送
                                  </p>
                                </div>
                              )}
                              
                              {/* 优化提示词和创意灵感卡片 */}
                              {(message.quickAction.type === 'optimize-prompt' || message.quickAction.type === 'creative-idea') && (
                                <div className={clsx(
                                  "p-4 space-y-3",
                                  isDark ? "bg-gray-800/50" : "bg-gray-50"
                                )}>
                                  <div className="flex gap-2">
                                    {message.quickAction.type === 'optimize-prompt' && prompt && (
                                      <button
                                        onClick={() => handleChatSubmit(undefined, `请帮我优化以下提示词：${prompt}`)}
                                        className={clsx(
                                          "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
                                          `bg-gradient-to-r ${message.quickAction.gradient} text-white hover:opacity-90`
                                        )}
                                      >
                                        <i className="fas fa-wand-magic-sparkles" />
                                        优化当前提示词
                                      </button>
                                    )}
                                    <button
                                      onClick={() => {
                                        const ideas = message.quickAction!.type === 'creative-idea'
                                          ? '给我一些创意灵感，关于天津传统文化的设计'
                                          : '请帮我优化以下提示词：';
                                        setChatInput(ideas);
                                      }}
                                      className={clsx(
                                        "flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all flex items-center justify-center gap-2",
                                        isDark 
                                          ? "bg-gray-700 hover:bg-gray-600 text-gray-300" 
                                          : "bg-white hover:bg-gray-100 text-gray-600 border border-gray-200"
                                      )}
                                    >
                                      <i className="fas fa-pen" />
                                      自定义输入
                                    </button>
                                  </div>
                                </div>
                              )}
                            </motion.div>
                          )}
                          
                          {/* 消息操作按钮 - 显示在图片/内容下方 */}
                          {message.role === 'assistant' && !message.isError && (
                            <div className={clsx(
                              "mt-3 flex items-center gap-1",
                              isDark ? "text-gray-400" : "text-gray-500"
                            )}>
                              {/* 复制按钮 */}
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(message.content);
                                  toast.success('已复制到剪贴板');
                                }}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-all hover:scale-110",
                                  isDark ? "hover:bg-gray-700 hover:text-gray-200" : "hover:bg-gray-100 hover:text-gray-700"
                                )}
                                title="复制"
                              >
                                <i className="fas fa-copy text-xs" />
                              </button>
                              
                              {/* 语音朗读按钮 */}
                              <button
                                onClick={() => {
                                  const utterance = new SpeechSynthesisUtterance(message.content);
                                  utterance.lang = 'zh-CN';
                                  speechSynthesis.speak(utterance);
                                }}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-all hover:scale-110",
                                  isDark ? "hover:bg-gray-700 hover:text-gray-200" : "hover:bg-gray-100 hover:text-gray-700"
                                )}
                                title="语音朗读"
                              >
                                <i className="fas fa-volume-up text-xs" />
                              </button>
                              
                              {/* 点赞按钮 */}
                              <button
                                onClick={() => toast.success('已点赞')}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-all hover:scale-110",
                                  isDark ? "hover:bg-gray-700 hover:text-green-400" : "hover:bg-gray-100 hover:text-green-600"
                                )}
                                title="点赞"
                              >
                                <i className="fas fa-thumbs-up text-xs" />
                              </button>
                              
                              {/* 点踩按钮 */}
                              <button
                                onClick={() => toast.success('已反馈')}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-all hover:scale-110",
                                  isDark ? "hover:bg-gray-700 hover:text-red-400" : "hover:bg-gray-100 hover:text-red-600"
                                )}
                                title="不喜欢"
                              >
                                <i className="fas fa-thumbs-down text-xs" />
                              </button>
                              
                              {/* 收藏按钮 */}
                              <button
                                onClick={() => toast.success('已收藏')}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-all hover:scale-110",
                                  isDark ? "hover:bg-gray-700 hover:text-yellow-400" : "hover:bg-gray-100 hover:text-yellow-600"
                                )}
                                title="收藏"
                              >
                                <i className="fas fa-bookmark text-xs" />
                              </button>
                              
                              {/* 分享按钮 */}
                              <button
                                onClick={() => toast.success('分享功能开发中')}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-all hover:scale-110",
                                  isDark ? "hover:bg-gray-700 hover:text-blue-400" : "hover:bg-gray-100 hover:text-blue-600"
                                )}
                                title="分享"
                              >
                                <i className="fas fa-share-alt text-xs" />
                              </button>
                              
                              {/* 更多按钮 */}
                              <button
                                onClick={() => toast.success('更多功能开发中')}
                                className={clsx(
                                  "p-1.5 rounded-lg transition-all hover:scale-110",
                                  isDark ? "hover:bg-gray-700 hover:text-gray-200" : "hover:bg-gray-100 hover:text-gray-700"
                                )}
                                title="更多"
                              >
                                <i className="fas fa-ellipsis-h text-xs" />
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {/* 流式响应消息显示 */}
                  {isStreaming && streamingContent && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex-shrink-0 mr-3">
                        <div className={clsx(
                          "w-8 h-8 rounded-xl flex items-center justify-center shadow-lg",
                          isDark
                            ? "bg-gradient-to-br from-purple-600 to-pink-600 shadow-purple-500/20"
                            : "bg-gradient-to-br from-purple-500 to-pink-500 shadow-purple-500/25"
                        )}>
                          <i className="fas fa-robot text-white text-xs" />
                        </div>
                      </div>
                      <div className="max-w-[82%]">
                        {/* 用户名/时间 */}
                        <div className={clsx(
                          'flex items-center mb-1.5 justify-start'
                        )}>
                          <span className={clsx(
                            'text-[11px] font-medium',
                            isDark ? 'text-gray-400' : 'text-gray-500'
                          )}>
                            AI助手
                          </span>
                          <span className={clsx(
                            'text-[10px] ml-2',
                            isDark ? 'text-gray-600' : 'text-gray-400'
                          )}>
                            {new Date().toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {/* 消息气泡 */}
                        <div className={clsx(
                          'rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm rounded-bl-md',
                          isDark
                            ? 'bg-gray-800/80 text-gray-100 border border-gray-700/50'
                            : 'bg-white text-gray-700 border border-gray-200/80',
                          'shadow-lg shadow-black/5'
                        )}>
                          <div className="whitespace-pre-wrap max-w-none">
                            {renderMessageContent(streamingContent)}
                            {/* 闪烁光标效果 */}
                            <span className="inline-block w-2 h-4 ml-0.5 align-middle bg-purple-500 animate-pulse rounded-sm" />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 加载动画 - 更精致的打字机效果（仅在非流式状态下显示） */}
                  {isChatLoading && !isStreaming && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="flex-shrink-0 mr-3">
                        <div className={clsx(
                          "w-8 h-8 rounded-xl flex items-center justify-center",
                          isDark
                            ? "bg-gradient-to-br from-purple-600 to-pink-600"
                            : "bg-gradient-to-br from-purple-500 to-pink-500"
                        )}>
                          <i className="fas fa-robot text-white text-xs" />
                        </div>
                      </div>
                      <div className={clsx(
                        'rounded-2xl rounded-tl-md px-4 py-3 shadow-sm',
                        isDark
                          ? 'bg-gray-800/80 border border-gray-700/50'
                          : 'bg-white border border-gray-200/80'
                      )}>
                        <div className="flex items-center space-x-3">
                          <div className="flex space-x-1">
                            <motion.div
                              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ repeat: Infinity, duration: 1, ease: "easeInOut" }}
                              className="w-2 h-2 rounded-full bg-gradient-to-r from-purple-500 to-purple-600"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ repeat: Infinity, duration: 1, delay: 0.15, ease: "easeInOut" }}
                              className="w-2 h-2 rounded-full bg-gradient-to-r from-pink-500 to-pink-600"
                            />
                            <motion.div
                              animate={{ scale: [1, 1.3, 1], opacity: [0.5, 1, 0.5] }}
                              transition={{ repeat: Infinity, duration: 1, delay: 0.3, ease: "easeInOut" }}
                              className="w-2 h-2 rounded-full bg-gradient-to-r from-orange-400 to-orange-500"
                            />
                          </div>
                          <span className={clsx(
                            "text-xs",
                            isDark ? "text-gray-500" : "text-gray-400"
                          )}>思考中...</span>
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {/* 生成进度 - 更现代化的进度指示器 */}
                  {isGenerating && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex justify-center py-2"
                    >
                      <div className={clsx(
                        'px-5 py-2.5 rounded-2xl text-xs flex items-center space-x-3 shadow-lg',
                        isDark
                          ? 'bg-gradient-to-r from-purple-900/40 to-pink-900/40 border border-purple-500/30 text-purple-300'
                          : 'bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 text-purple-700'
                      )}>
                        <div className="relative">
                          <i className="fas fa-circle-notch fa-spin text-sm" />
                          <span className="absolute inset-0 animate-ping opacity-30">
                            <i className="fas fa-circle-notch text-sm" />
                          </span>
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium">AI正在创作中...</span>
                          <div className="w-24 h-1 bg-gray-700/30 rounded-full mt-1.5 overflow-hidden">
                            <motion.div
                              className="h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"
                              initial={{ width: 0 }}
                              animate={{ width: `${currentTask?.progress || 0}%` }}
                              transition={{ duration: 0.5 }}
                            />
                          </div>
                        </div>
                        <span className="font-semibold">{currentTask?.progress || 0}%</span>
                      </div>
                    </motion.div>
                  )}

                  <div ref={messagesEndRef} />
                </div>

                {/* 快捷指令 - 仅在有消息时显示，避免与欢迎界面的功能列表重复 */}
                {chatMessages.length > 1 && chatMessages.length <= 3 && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="px-4 pb-3"
                  >
                    <p className={clsx(
                      'text-[11px] font-medium uppercase tracking-wider mb-3',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )}>快捷指令</p>
                    {/* 响应式布局：电脑端4列，平板2列，手机2列 */}
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5">
                      {QUICK_COMMANDS.map((cmd, idx) => (
                        <motion.button
                          key={cmd.id}
                          onClick={() => handleQuickCommand(cmd)}
                          whileHover={{ scale: 1.02, y: -2 }}
                          whileTap={{ scale: 0.98 }}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: idx * 0.08 + 0.6 }}
                          className={clsx(
                            'flex items-center space-x-2.5 p-3 rounded-xl text-xs transition-all border group',
                            isDark
                              ? 'border-gray-700/50 hover:border-gray-600 bg-gray-800/50 hover:bg-gray-800'
                              : 'border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50 shadow-sm hover:shadow-md'
                          )}
                        >
                          <div
                            className={clsx(
                              "w-7 h-7 rounded-lg flex items-center justify-center transition-transform group-hover:scale-110 flex-shrink-0",
                              `bg-gradient-to-br ${cmd.gradient}`
                            )}
                          >
                            <i className={`fas fa-${cmd.icon} text-white text-[10px]`} />
                          </div>
                          <span className={clsx(
                            "font-medium truncate",
                            isDark ? 'text-gray-300' : 'text-gray-600'
                          )}>{cmd.label}</span>
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* 生成设置面板 - 更现代化的折叠面板 */}
                <AnimatePresence>
                  {showSettings && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.3, ease: "easeInOut" }}
                      className={clsx(
                        'border-t overflow-hidden',
                        isDark
                          ? 'border-gray-800/50 bg-gradient-to-b from-gray-900/80 to-gray-900/50'
                          : 'border-gray-200/50 bg-gradient-to-b from-gray-50/80 to-white/50'
                      )}
                    >
                      <div className="p-4 space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <div className={clsx(
                              "w-6 h-6 rounded-lg flex items-center justify-center",
                              isDark ? "bg-purple-500/20" : "bg-purple-100"
                            )}>
                              <i className="fas fa-sliders-h text-purple-500 text-xs" />
                            </div>
                            <span className={clsx(
                              'text-xs font-semibold',
                              isDark ? 'text-gray-300' : 'text-gray-700'
                            )}>生成设置</span>
                          </div>
                          <motion.button
                            whileHover={{ scale: 1.1, rotate: 90 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => setShowSettings(false)}
                            className={clsx(
                              "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                              isDark
                                ? "text-gray-500 hover:text-gray-300 hover:bg-gray-800"
                                : "text-gray-400 hover:text-gray-600 hover:bg-gray-200"
                            )}
                          >
                            <i className="fas fa-times text-xs" />
                          </motion.button>
                        </div>

                        {/* 模式切换 - 分段控制器 */}
                        <div className={clsx(
                          "flex p-1 rounded-xl",
                          isDark ? "bg-gray-800" : "bg-gray-100"
                        )}>
                          {[
                            { id: 'image', label: '图片', icon: 'image' },
                            { id: 'video', label: '视频', icon: 'video' }
                          ].map((mode) => (
                            <motion.button
                              key={mode.id}
                              onClick={() => setGenerateMode(mode.id as GenerateMode)}
                              whileHover={{ scale: 1.02 }}
                              whileTap={{ scale: 0.98 }}
                              className={clsx(
                                'flex-1 flex items-center justify-center space-x-2 py-2 rounded-lg text-xs font-medium transition-all duration-300',
                                generateMode === mode.id
                                  ? 'bg-white dark:bg-gray-700 text-purple-600 dark:text-purple-400 shadow-md'
                                  : (isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-600 hover:text-gray-800')
                              )}
                            >
                              <i className={`fas fa-${mode.icon}`} />
                              <span>{mode.label}</span>
                            </motion.button>
                          ))}
                        </div>

                        {/* 风格选择 - 更精致的卡片 */}
                        <div>
                          <p className={clsx(
                            "text-[11px] font-medium mb-2",
                            isDark ? "text-gray-500" : "text-gray-400"
                          )}>选择风格</p>
                          <div className="grid grid-cols-4 gap-2">
                            {DEFAULT_STYLE_PRESETS.slice(0, 4).map((preset) => (
                              <motion.button
                                key={preset.id}
                                onClick={() => setSelectedStyle(selectedStyle === preset.id ? null : preset.id)}
                                whileHover={{ scale: 1.05 }}
                                whileTap={{ scale: 0.95 }}
                                className={clsx(
                                  'p-2.5 rounded-xl text-center transition-all border-2',
                                  selectedStyle === preset.id
                                    ? 'border-purple-500 bg-purple-500/10 shadow-md shadow-purple-500/10'
                                    : (isDark
                                        ? 'border-gray-700/50 hover:border-gray-600 bg-gray-800/50'
                                        : 'border-gray-200 hover:border-gray-300 bg-white')
                                )}
                              >
                                <i className={`fas fa-${preset.icon} text-purple-500 text-sm mb-1.5 block`} />
                                <p className={clsx(
                                  'text-[10px] font-medium truncate',
                                  isDark ? 'text-gray-300' : 'text-gray-600'
                                )}>{preset.name}</p>
                              </motion.button>
                            ))}
                          </div>
                        </div>

                        {/* AI模型选择 */}
                        <div>
                          <p className={clsx(
                            "text-[11px] font-medium mb-2",
                            isDark ? "text-gray-500" : "text-gray-400"
                          )}>AI模型</p>
                          <div className="relative">
                            <select
                              value={selectedModel}
                              onChange={(e) => {
                                const modelId = e.target.value;
                                setSelectedModel(modelId);
                                llmService.setCurrentModel(modelId);
                              }}
                              className={clsx(
                                'w-full p-2.5 pr-8 rounded-xl border text-xs appearance-none transition-all',
                                isDark
                                  ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                                  : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                              )}
                            >
                              <option value="qwen">通义千问</option>
                              <option value="kimi">Kimi</option>
                              <option value="deepseek">DeepSeek</option>
                            </select>
                            <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none" />
                          </div>
                        </div>

                        {/* 尺寸/质量 - 更现代的选择器 */}
                        <div className="grid grid-cols-2 gap-3">
                          {generateMode === 'image' ? (
                            <>
                              <div>
                                <p className={clsx(
                                  "text-[11px] font-medium mb-1.5",
                                  isDark ? "text-gray-500" : "text-gray-400"
                                )}>尺寸</p>
                                <div className="relative">
                                  <select
                                    value={imageParams.size}
                                    onChange={(e) => setImageParams({ ...imageParams, size: e.target.value as any })}
                                    className={clsx(
                                      'w-full p-2.5 pr-8 rounded-xl border text-xs appearance-none transition-all',
                                      isDark
                                        ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                                        : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                                    )}
                                  >
                                    {SIZE_PRESETS.map((preset) => (
                                      <option key={preset.value} value={preset.value}>
                                        {preset.label}
                                      </option>
                                    ))}
                                  </select>
                                  <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none" />
                                </div>
                              </div>
                              <div>
                                <p className={clsx(
                                  "text-[11px] font-medium mb-1.5",
                                  isDark ? "text-gray-500" : "text-gray-400"
                                )}>质量</p>
                                <div className="relative">
                                  <select
                                    value={imageParams.quality}
                                    onChange={(e) => setImageParams({ ...imageParams, quality: e.target.value as any })}
                                    className={clsx(
                                      'w-full p-2.5 pr-8 rounded-xl border text-xs appearance-none transition-all',
                                      isDark
                                        ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                                        : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                                    )}
                                  >
                                    {QUALITY_PRESETS.map((q) => (
                                      <option key={q.value} value={q.value}>{q.label}</option>
                                    ))}
                                  </select>
                                  <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none" />
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <div>
                                <p className={clsx(
                                  "text-[11px] font-medium mb-1.5",
                                  isDark ? "text-gray-500" : "text-gray-400"
                                )}>时长</p>
                                <div className="relative">
                                  <select
                                    value={videoParams.duration}
                                    onChange={(e) => setVideoParams({ ...videoParams, duration: Number(e.target.value) as any })}
                                    className={clsx(
                                      'w-full p-2.5 pr-8 rounded-xl border text-xs appearance-none transition-all',
                                      isDark
                                        ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                                        : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                                    )}
                                  >
                                    <option value={5}>5秒</option>
                                    <option value={10}>10秒</option>
                                    <option value={15}>15秒</option>
                                  </select>
                                  <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none" />
                                </div>
                              </div>
                              <div>
                                <p className={clsx(
                                  "text-[11px] font-medium mb-1.5",
                                  isDark ? "text-gray-500" : "text-gray-400"
                                )}>分辨率</p>
                                <div className="relative">
                                  <select
                                    value={videoParams.resolution}
                                    onChange={(e) => setVideoParams({ ...videoParams, resolution: e.target.value as any })}
                                    className={clsx(
                                      'w-full p-2.5 pr-8 rounded-xl border text-xs appearance-none transition-all',
                                      isDark
                                        ? 'bg-gray-800 border-gray-700 text-white focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                                        : 'bg-white border-gray-200 text-gray-900 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20'
                                    )}
                                  >
                                    <option value="720p">720p</option>
                                    <option value="1080p">1080p</option>
                                  </select>
                                  <i className="fas fa-chevron-down absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 pointer-events-none" />
                                </div>
                              </div>
                            </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* 输入框 - 更现代化的设计 */}
                <div className={clsx(
                  'p-3 border-t backdrop-blur-xl flex-shrink-0',
                  isDark
                    ? 'border-gray-800/50 bg-gray-900/90'
                    : 'border-gray-200/50 bg-white/90'
                )}>
                  <form onSubmit={handleChatSubmit} className="space-y-2">
                    <div className={clsx(
                      'flex items-end space-x-2 p-2 rounded-2xl border-2 transition-all duration-300 shadow-lg',
                      isDark
                        ? 'bg-gray-800/80 border-gray-700 focus-within:border-purple-500/70 focus-within:shadow-purple-500/10'
                        : 'bg-white border-gray-200 focus-within:border-purple-400 focus-within:shadow-purple-500/10'
                    )}>
                      <motion.button
                        type="button"
                        onClick={() => setShowSettings(!showSettings)}
                        whileHover={{ scale: 1.1, rotate: showSettings ? 30 : 0 }}
                        whileTap={{ scale: 0.9 }}
                        className={clsx(
                          'p-2.5 rounded-xl transition-all duration-300 flex-shrink-0',
                          showSettings
                            ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg shadow-purple-500/25'
                            : (isDark
                                ? 'text-gray-400 hover:text-gray-200 hover:bg-gray-700'
                                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-100')
                        )}
                        title="生成设置"
                      >
                        <i className="fas fa-sliders-h text-sm" />
                      </motion.button>

                      <textarea
                        ref={textareaRef}
                        value={chatInput}
                        onChange={(e) => setChatInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleChatSubmit();
                          }
                        }}
                        placeholder="输入消息，或试试说'生成一张...'"
                        rows={1}
                        className={clsx(
                          'flex-1 bg-transparent resize-none focus:outline-none text-sm py-2.5 leading-relaxed',
                          'max-h-[120px] min-h-[20px]',
                          isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'
                        )}
                      />

                      <motion.button
                        type="submit"
                        disabled={!chatInput.trim() || isChatLoading || isGenerating}
                        whileHover={{ scale: chatInput.trim() && !isChatLoading && !isGenerating ? 1.1 : 1 }}
                        whileTap={{ scale: chatInput.trim() && !isChatLoading && !isGenerating ? 0.9 : 1 }}
                        className={clsx(
                          'p-2.5 rounded-xl transition-all duration-300 flex-shrink-0',
                          chatInput.trim() && !isChatLoading && !isGenerating
                            ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-500/30 hover:shadow-purple-500/40'
                            : (isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-100 text-gray-400')
                        )}
                      >
                        <i className="fas fa-paper-plane text-sm" />
                      </motion.button>
                    </div>

                    <div className="flex items-center justify-between px-1">
                      <div className="flex items-center space-x-3">
                        <p className={clsx(
                          'text-[10px]',
                          isDark ? 'text-gray-600' : 'text-gray-400'
                        )}>
                          <span className="font-medium">Enter</span> 发送 · <span className="font-medium">Shift + Enter</span> 换行
                        </p>
                      </div>

                      {chatMessages.length > 2 && (
                        <motion.button
                          type="button"
                          onClick={handleClearChat}
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          className={clsx(
                            'text-[10px] px-2 py-1 rounded-lg transition-all duration-300',
                            isDark
                              ? 'text-gray-500 hover:text-red-400 hover:bg-red-500/10'
                              : 'text-gray-400 hover:text-red-500 hover:bg-red-50'
                          )}
                        >
                          <i className="fas fa-trash-alt mr-1" />
                          清空对话
                        </motion.button>
                      )}
                    </div>
                  </form>
                </div>
              </motion.div>
            )}

            {/* 历史面板 */}
            {activeTab === 'history' && (
              <motion.div
                key="history"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="p-4 space-y-3 overflow-y-auto h-full scrollbar-hide"
              >
                {history.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="flex flex-col items-center justify-center h-64 text-center"
                  >
                    <div className={clsx(
                      'w-20 h-20 rounded-2xl flex items-center justify-center mb-5',
                      isDark
                        ? 'bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700'
                        : 'bg-gradient-to-br from-gray-100 to-gray-50 border border-gray-200'
                    )}>
                      <i className={clsx(
                        'fas fa-history text-3xl',
                        isDark ? 'text-gray-600' : 'text-gray-400'
                      )} />
                    </div>
                    <p className={clsx(
                      'text-sm font-medium',
                      isDark ? 'text-gray-300' : 'text-gray-600'
                    )}>暂无生成记录</p>
                    <p className={clsx(
                      'text-xs mt-1.5 max-w-[200px]',
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    )}>在对话中生成图片或视频后会显示在这里</p>
                  </motion.div>
                ) : (
                  history.map((item, index) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      whileHover={{ scale: 1.01, y: -2 }}
                      className={clsx(
                        'flex items-center space-x-3 p-3 rounded-2xl border transition-all cursor-pointer group',
                        isDark
                          ? 'bg-gray-800/60 border-gray-700/50 hover:border-gray-600 hover:bg-gray-800 hover:shadow-lg hover:shadow-black/20'
                          : 'bg-white border-gray-200/80 hover:border-gray-300 hover:shadow-lg hover:shadow-gray-200/50'
                      )}
                      onClick={() => {
                        setChatInput(`重新生成：${item.prompt}`);
                        setActiveTab('chat');
                      }}
                    >
                      <div className="relative flex-shrink-0">
                        <img
                          src={item.thumbnail}
                          alt={item.prompt}
                          className="w-14 h-14 rounded-xl object-cover"
                        />
                        <div className={clsx(
                          "absolute -bottom-1 -right-1 w-5 h-5 rounded-lg flex items-center justify-center border-2",
                          item.type === 'video'
                            ? 'bg-pink-500 border-gray-900'
                            : 'bg-purple-500 border-gray-900'
                        )}>
                          <i className={clsx(
                            "fas text-white text-[8px]",
                            item.type === 'video' ? 'fa-video' : 'fa-image'
                          )} />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={clsx(
                          'text-sm font-medium truncate',
                          isDark ? 'text-gray-200' : 'text-gray-700'
                        )}>{item.prompt}</p>
                        <div className="flex items-center space-x-2 mt-1.5">
                          <span className={clsx(
                            'px-2 py-0.5 rounded-full text-[10px] font-medium',
                            item.type === 'video'
                              ? 'bg-pink-500/10 text-pink-500 border border-pink-500/20'
                              : 'bg-purple-500/10 text-purple-500 border border-purple-500/20'
                          )}>
                            {item.type === 'video' ? '视频' : '图片'}
                          </span>
                          <span className={clsx(
                            'text-[10px]',
                            isDark ? 'text-gray-500' : 'text-gray-400'
                          )}>
                            {new Date(item.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        className={clsx(
                          'p-2 rounded-xl transition-all opacity-0 group-hover:opacity-100',
                          isDark
                            ? 'hover:bg-red-500/10 text-gray-500 hover:text-red-400'
                            : 'hover:bg-red-50 text-gray-400 hover:text-red-500'
                        )}
                        onClick={(e) => {
                          e.stopPropagation();
                          aiGenerationService.deleteHistoryItem(item.id);
                        }}
                      >
                        <i className="fas fa-trash-alt text-xs" />
                      </motion.button>
                    </motion.div>
                  ))
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
