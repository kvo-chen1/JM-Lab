import React, { useState, useEffect, useRef, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { useNavigate } from 'react-router-dom'
import { llmService, Message, ConversationSession, AssistantPersonality, AssistantTheme } from '@/services/llmService'
import { aiAssistantService, ChatMessage, AIResponse } from '@/services/aiAssistantService'
import { Conversation, aiMemoryService } from '@/services/aiMemoryService'
import { toast } from 'sonner'
import SpeechInput from './SpeechInput'
import { useTranslation } from 'react-i18next'
import { AuthContext } from '../contexts/authContext'
import AICollaborationMessage from './AICollaborationMessage'
import localServices from '@/services/localServices'
import { getRecommendations, RecommendedItem, recordRecommendationClick } from '@/services/recommendationService'
import InlineGenerationCard from './InlineGenerationCard'
import { aiGenerationService, GenerationTask } from '@/services/aiGenerationService'
import ShareDialog from './ShareDialog'
import VoiceOutputButton from './VoiceOutputButton'
import SmartInput from './SmartInput'
import InspirationCard from './InspirationCard'
import MessageSearch from './MessageSearch'
import AISettingsPanel from './AISettingsPanel'
import { useCreateStore } from '@/pages/create/hooks/useCreateStore'
import { downloadAndUploadImage, downloadAndUploadVideo } from '@/services/imageService'

interface AICollaborationPanelProps {
  isOpen: boolean
  onClose: () => void
  onContentGenerated?: (content: string) => void
  context?: {
    page?: string
    path?: string
  }
}

export default function AICollaborationPanel({ isOpen, onClose, onContentGenerated, context }: AICollaborationPanelProps) {
  const { isDark, theme } = useTheme()
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user } = useContext(AuthContext)
  const addGeneratedResult = useCreateStore((state) => state.addGeneratedResult)
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [recs, setRecs] = useState<RecommendedItem[]>([])
  const [isGenerating, setIsGenerating] = useState(false)
  const [isTyping, setIsTyping] = useState(false)
  const [newSessionName, setNewSessionName] = useState('')
  const [showNewSessionModal, setShowNewSessionModal] = useState(false)
  const [isEditingSessionName, setIsEditingSessionName] = useState(false)
  const [editingSessionName, setEditingSessionName] = useState('')
  // 会话列表中正在编辑的会话ID和名称
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editingSessionNameInList, setEditingSessionNameInList] = useState('')
  const [showTemplates, setShowTemplates] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<'unknown' | 'ok' | 'error'>('unknown')
  const [llmHealth, setLlmHealth] = useState<any>(null)
  const [isHistoryLoaded, setIsHistoryLoaded] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 个性化设置相关状态
  const [showSettings, setShowSettings] = useState(false)
  const [personality, setPersonality] = useState<AssistantPersonality>('friendly')
  const [assistantTheme, setAssistantTheme] = useState<AssistantTheme>('auto')
  const [showPresetQuestions, setShowPresetQuestions] = useState(true)
  const [enableTypingEffect, setEnableTypingEffect] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  // 移动端相关状态 - 默认显示会话列表
  const [showSessionList, setShowSessionList] = useState(true)
  // 反馈相关状态
  const [feedbackVisible, setFeedbackVisible] = useState<{[key: number]: boolean}>({})
  const [feedbackRatings, setFeedbackRatings] = useState<{[key: number]: number}>({})
  const [feedbackComments, setFeedbackComments] = useState<{[key: number]: string}>({})
  
  // 跟踪已保存到数据库的生成任务消息ID
  
  // 跟踪已保存到数据库的生成任务消息ID
  const savedGenerationMessagesRef = useRef<Map<string, string>>(new Map())
  
  // 分享对话框状态
  const [showShareDialog, setShowShareDialog] = useState(false)
  const [showFriendShareDialog, setShowFriendShareDialog] = useState(false)
  const [shareContent, setShareContent] = useState<any>(null)

  // 发布模态框状态
  const [showPublishModal, setShowPublishModal] = useState(false)
  const [publishTask, setPublishTask] = useState<GenerationTask | null>(null)
  const [publishTitle, setPublishTitle] = useState('')
  const [publishDescription, setPublishDescription] = useState('')
  const [publishTags, setPublishTags] = useState<string[]>([])
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  // 动态主题样式
  const themeStyles = (() => {
    switch (theme) {
      case 'dark':
        return {
          headerGradient: 'bg-gradient-to-r from-violet-600 via-purple-600 to-indigo-600',
          buttonGradient: 'bg-gradient-to-r from-violet-600 to-indigo-600',
          activeSessionLight: 'bg-gradient-to-r from-violet-50 to-purple-50',
          activeSessionDark: 'bg-gradient-to-r from-violet-900/30 to-purple-900/30',
          hoverLight: 'hover:bg-violet-50',
          hoverDark: 'hover:bg-violet-900/20',
          textAccent: 'text-violet-400',
          borderAccent: 'focus:ring-violet-500',
          spinner: 'text-violet-500'
        }
      case 'green':
        return {
          headerGradient: 'bg-gradient-to-r from-green-500 via-emerald-500 to-teal-600',
          buttonGradient: 'bg-gradient-to-r from-green-600 to-teal-600',
          activeSessionLight: 'bg-gradient-to-r from-green-50 to-teal-50',
          activeSessionDark: 'bg-gradient-to-r from-green-900/30 to-teal-900/30',
          hoverLight: 'hover:bg-green-50',
          hoverDark: 'hover:bg-green-900/20',
          textAccent: 'text-green-600',
          borderAccent: 'focus:ring-green-500',
          spinner: 'text-green-500'
        }
      case 'pixel':
        return {
          headerGradient: 'bg-gradient-to-r from-purple-600 via-fuchsia-600 to-pink-600',
          buttonGradient: 'bg-gradient-to-r from-purple-600 to-pink-600',
          activeSessionLight: 'bg-gradient-to-r from-purple-50 to-pink-50',
          activeSessionDark: 'bg-gradient-to-r from-purple-900/30 to-pink-900/30',
          hoverLight: 'hover:bg-purple-50',
          hoverDark: 'hover:bg-purple-900/20',
          textAccent: 'text-purple-600',
          borderAccent: 'focus:ring-purple-500',
          spinner: 'text-purple-500'
        }
      case 'blue':
      default:
        return {
          headerGradient: 'bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600',
          buttonGradient: 'bg-gradient-to-r from-blue-600 to-purple-600',
          activeSessionLight: 'bg-gradient-to-r from-blue-50 to-purple-50',
          activeSessionDark: 'bg-gradient-to-r from-blue-900/30 to-purple-900/30',
          hoverLight: 'hover:bg-blue-50',
          hoverDark: 'hover:bg-blue-900/20',
          textAccent: 'text-blue-600',
          borderAccent: 'focus:ring-blue-500',
          spinner: 'text-blue-500'
        }
    }
  })()
  
  const presetQuestions = (() => {
    const path = context?.path
    const pathKeyMap: Record<string, string> = {
      '/': 'home',
      '/cultural-knowledge': 'culturalKnowledge',
      '/creation-workshop': 'creationWorkshop',
      '/marketplace': 'marketplace',
      '/community': 'community',
      '/my-works': 'myWorks',
      '/explore': 'explore',
      '/create': 'create',
      '/dashboard': 'dashboard',
      '/settings': 'settings'
    }
    const groupKey = (path && pathKeyMap[path]) || 'common'
    const value = t(`aiCollab.quickQuestions.${groupKey}`, { returnObjects: true })
    return Array.isArray(value) ? value : []
  })()

  const conversationTemplates = (() => {
    const value = t('aiCollab.templates', { returnObjects: true })
    return Array.isArray(value) ? value : []
  })() as Array<{ id: string; name: string; description: string; prompt: string }>

  // 加载会话列表 - 使用 Supabase 存储（已登录）或 localStorage（未登录）
  useEffect(() => {
    console.log('[loadConversations] 开始加载会话, user:', user?.id || '未登录')
    const loadConversations = async () => {
      // 如果用户未登录，直接使用 localStorage
      if (!user) {
        console.log('[loadConversations] 用户未登录，使用 localStorage')
        try {
          const loadedSessions = llmService.getSessions()
          console.log('[loadConversations] 从 localStorage 加载的会话:', loadedSessions)
          if (loadedSessions.length > 0) {
            setSessions(loadedSessions)
            const activeSession = loadedSessions.find(session => session.isActive) || loadedSessions[0]
            if (activeSession) {
              setCurrentSession(activeSession)
              setMessages(activeSession.messages)
            }
          } else {
            // 如果没有会话，创建一个新会话
            console.log('[loadConversations] 没有会话，创建新会话')
            const newSession = llmService.createSession('新对话')
            console.log('[loadConversations] 创建的新会话:', newSession)
            setSessions([newSession])
            setCurrentSession(newSession)
            setMessages([])
          }
        } catch (error) {
          console.error('[loadConversations] 从 localStorage 加载会话失败:', error)
          // 创建默认会话
          const newSession = llmService.createSession('新对话')
          setSessions([newSession])
          setCurrentSession(newSession)
          setMessages([])
        } finally {
          setIsHistoryLoaded(true)
        }
        return
      }
      
      // 用户已登录，尝试从 Supabase 加载
      console.log('[loadConversations] 用户已登录，使用 Supabase, user:', user?.id)
      try {
        // 初始化 AI 助手服务，传入当前用户
        await aiAssistantService.initialize(user)
        
        // 从 Supabase 加载对话列表
        const conversations = await aiAssistantService.getAllConversations()
        console.log('[loadConversations] 从 Supabase 加载的会话:', conversations)
        
        // 转换为组件需要的格式
        const formattedSessions: ConversationSession[] = conversations.map(conv => ({
          id: conv.id,
          name: conv.title || '新对话',
          modelId: conv.model_id || 'qwen',
          messages: [], // 消息将在选择会话时加载
          createdAt: new Date(conv.created_at).getTime(),
          updatedAt: new Date(conv.updated_at).getTime(),
          isActive: conv.is_active,
          currentTopic: conv.context_summary || '',
          topicHistory: [],
          contextSummary: conv.context_summary || '',
          lastMessageTimestamp: new Date(conv.updated_at).getTime()
        }))
        
        setSessions(formattedSessions)
        
        // 设置当前活跃会话
        const activeSession = formattedSessions.find(session => session.isActive) || formattedSessions[0]
        if (activeSession) {
          setCurrentSession(activeSession)
          // 加载会话的消息历史
          console.log('[loadConversations] 开始加载会话历史:', activeSession.id)
          const history = await aiAssistantService.getConversationHistory()
          console.log('[loadConversations] 加载到消息数量:', history.length)
          history.forEach((msg, i) => {
            console.log(`[loadConversations] 消息 ${i}:`, msg.role, msg.metadata ? '有元数据' : '无元数据')
          })
          setMessages(history.map(msg => {
            const message: any = {
              id: msg.id, // 保存消息ID，用于删除
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
              isError: msg.isError
            }
            // 如果有生成任务元数据，恢复生成任务
            if (msg.metadata?.generationTask) {
              const task = { ...msg.metadata.generationTask }
              console.log('[loadConversations] 恢复生成任务:', task.id, '原始状态:', task.status, '有结果:', !!(task.result && task.result.urls && task.result.urls.length > 0))
              // 如果任务还在处理中（页面刷新导致），根据是否有结果来更新状态
              if (task.status === 'processing' || task.status === 'pending') {
                if (task.result && task.result.urls && task.result.urls.length > 0) {
                  // 有结果，标记为完成
                  task.status = 'completed'
                  task.progress = 100
                  console.log('[loadConversations] 任务有结果，标记为完成')
                } else {
                  // 没有结果，标记为失败
                  task.status = 'failed'
                  task.error = '生成中断，请重新尝试'
                  console.log('[loadConversations] 任务无结果，标记为失败')
                }
              } else {
                console.log('[loadConversations] 任务状态无需更新:', task.status)
              }
              message.generationTask = task
              console.log('[loadConversations] 最终任务状态:', task.status)
            }
            return message
          }))
        } else if (formattedSessions.length === 0) {
          // 如果没有会话，创建一个新会话
          try {
            await aiAssistantService.createNewConversation()
            const newConversations = await aiAssistantService.getAllConversations()
            const newFormattedSessions: ConversationSession[] = newConversations.map(conv => ({
              id: conv.id,
              name: conv.title || '新对话',
              modelId: conv.model_id || 'qwen',
              messages: [],
              createdAt: new Date(conv.created_at).getTime(),
              updatedAt: new Date(conv.updated_at).getTime(),
              isActive: conv.is_active,
              currentTopic: conv.context_summary || '',
              topicHistory: [],
              contextSummary: conv.context_summary || '',
              lastMessageTimestamp: new Date(conv.updated_at).getTime()
            }))
            setSessions(newFormattedSessions)
            const newActiveSession = newFormattedSessions.find(session => session.isActive) || newFormattedSessions[0]
            if (newActiveSession) {
              setCurrentSession(newActiveSession)
              setMessages([])
            }
          } catch (createError) {
            console.error('[loadConversations] 自动创建会话失败:', createError)
            // 用户已登录，但创建失败，显示空状态
            setSessions([])
            setCurrentSession(null)
            setMessages([])
          }
        }
      } catch (error) {
        console.error('[loadConversations] 从 Supabase 加载会话失败:', error)
        // 用户已登录，但 Supabase 失败，显示错误并创建空状态
        // 不要回退到 localStorage，因为 ID 格式不兼容
        toast.error('加载会话失败，请刷新页面重试')
        setSessions([])
        setCurrentSession(null)
        setMessages([])
      } finally {
        // 标记历史消息已加载完成
        setIsHistoryLoaded(true)
      }
    }
    
    if (isOpen) {
      setIsHistoryLoaded(false)
      loadConversations()
    }
  }, [isOpen, user])

  const checkAIService = async (showToast = true) => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 6000)
    try {
      const pingRes = await fetch('/api/health/ping', { signal: controller.signal })
      if (!pingRes.ok) {
        throw new Error(t('aiCollab.errors.serviceUnavailable', { status: pingRes.status, statusText: pingRes.statusText }))
      }
      const llmRes = await fetch('/api/health/llms', { signal: controller.signal })
      const llmJson = await llmRes.json().catch(() => null)
      setLlmHealth(llmJson)
      setServiceStatus('ok')

      if (showToast) {
        const status = llmJson?.status
        const unconfigured = status
          ? Object.entries(status)
              .filter(([, v]: any) => v && v.configured === false)
              .map(([k]) => k)
          : []
        const separator = i18n.language.startsWith('zh') ? '、' : ', '
        toast.success(
          unconfigured.length
            ? t('aiCollab.toasts.serviceConnectedWithMissing', { models: unconfigured.join(separator) })
            : t('aiCollab.toasts.serviceConnected')
        )
      }
    } catch (e) {
      setServiceStatus('error')
      if (showToast) {
        const message = e instanceof Error ? e.message : t('aiCollab.errors.serviceConnectFailed')
        toast.error(t('aiCollab.toasts.serviceConnectFailed', { message }))
      }
    } finally {
      clearTimeout(timeoutId)
    }
  }

  useEffect(() => {
    if (!isOpen) return
    checkAIService(false)
  }, [isOpen])
  useEffect(() => {
    if (isOpen && user?.id) {
      const items = getRecommendations(user.id, { limit: 6, strategy: 'hybrid', includeDiverse: true })
      setRecs(items)
    }
  }, [isOpen, user])

  // 设置AI生成任务监听器
  useEffect(() => {
    if (!isOpen) return
    
    const unsubscribe = aiGenerationService.addTaskListener(async (task) => {
      console.log('[TaskListener] 收到任务更新:', task.id, '状态:', task.status, '进度:', task.progress)
      // 更新消息中的生成任务状态 - 创建新的对象引用以触发React重新渲染
      setMessages(prev => prev.map(msg => {
        if ((msg as any).generationTask && (msg as any).generationTask.id === task.id) {
          return {
            ...msg,
            generationTask: { ...task }  // 创建新的对象引用
          }
        }
        return msg
      }))
      
      // 当任务完成或失败时，保存到数据库
      if ((task.status === 'completed' || task.status === 'failed') && user) {
        const savedMessageId = savedGenerationMessagesRef.current.get(task.id);
        const taskMetadata = {
          generationTask: {
            id: task.id,
            type: task.type,
            status: task.status,
            progress: task.progress,
            params: task.params,
            result: task.result,
            error: task.error,
            createdAt: task.createdAt,
            updatedAt: task.updatedAt
          }
        };
        
        try {
          // 获取当前活跃的会话ID
          const activeConversation = await aiMemoryService.getActiveConversation();
          if (!activeConversation) {
            console.error('[TaskListener] 没有活跃的会话，无法保存生成任务消息');
            return;
          }
          
          if (savedMessageId) {
            // 更新已存在的消息
            await aiMemoryService.updateMessageMetadata(savedMessageId, taskMetadata);
            console.log('[TaskListener] 更新生成任务消息成功:', savedMessageId);
          } else {
            // 创建新消息
            aiAssistantService.setCurrentConversationId(activeConversation.id);
            const savedMsg = await aiAssistantService.saveMessage('assistant', '', false, taskMetadata);
            if (savedMsg && savedMsg.id) {
              savedGenerationMessagesRef.current.set(task.id, savedMsg.id);
              console.log('[TaskListener] 保存生成任务消息成功:', savedMsg.id);
            }
          }
        } catch (error) {
          console.error('[TaskListener] 保存/更新生成任务消息失败:', error);
        }
      }
      
      // 当任务完成时，自动保存到永久存储（云端）
      if (task.status === 'completed' && task.result?.urls?.[0]) {
        const originalUrl = task.result.urls[0];
        // 检查是否已经是永久URL（不是临时URL）
        const isPermanentUrl = !originalUrl.includes('openai') && 
                               !originalUrl.includes('replicate') && 
                               !originalUrl.includes('runway') &&
                               (originalUrl.includes('supabase') || originalUrl.includes('works/'));
        
        if (!isPermanentUrl) {
          console.log('[TaskListener] 开始自动保存到永久存储:', task.type, task.id);
          
          // 异步保存，不阻塞UI
          setTimeout(async () => {
            try {
              let permanentUrl: string;
              
              if (task.type === 'image') {
                permanentUrl = await downloadAndUploadImage(originalUrl, 'ai-generated');
              } else if (task.type === 'video') {
                permanentUrl = await downloadAndUploadVideo(originalUrl);
              } else {
                return; // 不支持的类型
              }
              
              console.log('[TaskListener] 已保存到永久存储:', permanentUrl);
              
              // 更新任务结果中的URL为永久URL
              const updatedTask = {
                ...task,
                result: {
                  ...task.result,
                  urls: [permanentUrl],
                  originalUrl: originalUrl // 保留原始URL
                },
                updatedAt: Date.now()
              };
              
              // 更新消息中的任务状态
              setMessages(prev => prev.map(msg => {
                if ((msg as any).generationTask && (msg as any).generationTask.id === task.id) {
                  return {
                    ...msg,
                    generationTask: updatedTask
                  };
                }
                return msg;
              }));
              
              toast.success(`${task.type === 'image' ? '图片' : '视频'}已自动保存到云端`);
            } catch (saveError) {
              console.error('[TaskListener] 自动保存到永久存储失败:', saveError);
              toast.error(`${task.type === 'image' ? '图片' : '视频'}保存到云端失败，请手动保存`);
            }
          }, 1000); // 延迟1秒执行，让UI先更新
        }
      }
    })
    
    return () => unsubscribe()
  }, [isOpen, user])

  // 加载个性化设置
  useEffect(() => {
    const config = llmService.getConfig()
    setPersonality(config.personality)
    setAssistantTheme(config.theme)
    setShowPresetQuestions(config.show_preset_questions)
    setEnableTypingEffect(config.enable_typing_effect)
    setAutoScroll(config.auto_scroll)
  }, [isOpen])

  // 保存个性化设置
  const saveSettings = () => {
    llmService.updateConfig({
      personality,
      theme: assistantTheme,
      show_preset_questions: showPresetQuestions,
      enable_typing_effect: enableTypingEffect,
      auto_scroll: autoScroll
    })
    toast.success('设置已保存')
  }

  // 处理设置变更
  const handleSettingChange = (setting: string, value: any) => {
    switch (setting) {
      case 'personality':
        setPersonality(value)
        break
      case 'theme':
        setAssistantTheme(value)
        break
      case 'showPresetQuestions':
        setShowPresetQuestions(value)
        break
      case 'enableTypingEffect':
        setEnableTypingEffect(value)
        break
      case 'autoScroll':
        setAutoScroll(value)
        break
      default:
        break
    }
    saveSettings()
  }

  // 处理消息评分
  const handleRating = (messageIndex: number, rating: number) => {
    setFeedbackRatings(prev => ({
      ...prev,
      [messageIndex]: rating
    }))
    
    // 记录评分到本地存储或发送到服务器
    console.log(`Message ${messageIndex} rated: ${rating}`)
    
    // 显示评论输入框
    setFeedbackVisible(prev => ({
      ...prev,
      [messageIndex]: true
    }))
  }

  // 处理反馈评论提交
  const handleFeedbackSubmit = (messageIndex: number) => {
    const comment = feedbackComments[messageIndex] || ''
    const rating = feedbackRatings[messageIndex] || 0
    
    // 发送反馈到服务器或本地存储
    console.log(`Feedback submitted for message ${messageIndex}:`, {
      rating,
      comment,
      message: messages[messageIndex]
    })
    
    // 隐藏评论输入框
    setFeedbackVisible(prev => ({
      ...prev,
      [messageIndex]: false
    }))
    
    // 清除评论
    setFeedbackComments(prev => ({
      ...prev,
      [messageIndex]: ''
    }))
    
    toast.success('反馈已提交，感谢您的意见！')
  }

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
    
    const path = context?.path || '';
    const page = context?.page || '';
    return welcomeMessages[path] || `你好！我是津小脉，当前你正在浏览「${page}」页面，有什么可以帮助你的吗？`;
  };

  // 添加初始欢迎消息 - 上下文感知
  // 只在历史消息加载完成后，且确实没有消息时才显示欢迎消息
  useEffect(() => {
    if (isHistoryLoaded && messages.length === 0 && isOpen) {
      const initialMessage: Message = {
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: Date.now()
      };
      setMessages([initialMessage]);
    }
  }, [isHistoryLoaded, messages.length, isOpen, context]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 监听引用消息事件
  useEffect(() => {
    const handleQuoteMessage = (e: CustomEvent<{ content: string; index: number }>) => {
      const { content } = e.detail;
      // 在输入框中添加引用格式
      const quotedContent = content
        .split('\n')
        .map(line => `> ${line}`)
        .join('\n');
      setInput(prev => {
        const prefix = prev ? prev + '\n\n' : '';
        return prefix + quotedContent + '\n\n';
      });
      toast.success('已引用到输入框');
    };

    window.addEventListener('quoteMessage', handleQuoteMessage as EventListener);
    return () => {
      window.removeEventListener('quoteMessage', handleQuoteMessage as EventListener);
    };
  }, [])

  // 创建新会话 - 使用 Supabase 存储
  const createNewSession = async () => {
    // 如果没有输入名称，使用默认名称
    const sessionName = newSessionName.trim() || t('aiCollab.newSession.defaultName') || '新对话'
    
    // 如果用户未登录，直接使用 localStorage
    if (!user) {
      console.log('[createNewSession] 创建新会话:', sessionName)
      const newSession = llmService.createSession(sessionName)
      console.log('[createNewSession] 新会话创建成功:', newSession)
      // 从 llmService 获取最新的会话列表
      const updatedSessions = llmService.getSessions()
      console.log('[createNewSession] 更新后的会话列表:', updatedSessions)
      setSessions(updatedSessions)
      setCurrentSession(newSession)
      setMessages([])
      setNewSessionName('')
      setShowNewSessionModal(false)
      toast.success('新会话已创建')
      return
    }
    
    try {
      console.log('[createNewSession] 使用 Supabase 创建新会话')
      // 确保服务已初始化
      await aiAssistantService.initialize(user)
      
      // 使用 aiAssistantService 创建新对话（保存到 Supabase）
      await aiAssistantService.createNewConversation()
      
      // 如果提供了自定义名称，重命名对话
      const conversations = await aiAssistantService.getAllConversations()
      console.log('[createNewSession] 创建后的会话列表:', conversations)
      const newConversation = conversations.find(c => c.is_active)
      console.log('[createNewSession] 新创建的会话:', newConversation)
      if (newConversation && sessionName !== '新对话') {
        await aiAssistantService.renameConversation(newConversation.id, sessionName)
      }
      
      // 刷新会话列表
      const updatedConversations = await aiAssistantService.getAllConversations()
      console.log('[createNewSession] 更新后的会话列表:', updatedConversations)
      const formattedSessions: ConversationSession[] = updatedConversations.map(conv => ({
        id: conv.id,
        name: conv.title || '新对话',
        modelId: conv.model_id || 'qwen',
        messages: [],
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime(),
        isActive: conv.is_active,
        currentTopic: conv.context_summary || '',
        topicHistory: [],
        contextSummary: conv.context_summary || '',
        lastMessageTimestamp: new Date(conv.updated_at).getTime()
      }))
      
      console.log('[createNewSession] 格式化后的会话:', formattedSessions)
      setSessions(formattedSessions)
      const activeSession = formattedSessions.find(session => session.isActive) || formattedSessions[0]
      if (activeSession) {
        setCurrentSession(activeSession)
        setMessages([])
      }
      
      setNewSessionName('')
      setShowNewSessionModal(false)
      toast.success('新会话已创建')
    } catch (error) {
      console.error('创建会话失败:', error)
      // 回退到 localStorage
      const newSession = llmService.createSession(sessionName)
      // 从 llmService 获取最新的会话列表
      const updatedSessions = llmService.getSessions()
      setSessions(updatedSessions)
      setCurrentSession(newSession)
      setMessages([])
      setNewSessionName('')
      setShowNewSessionModal(false)
      toast.success('新会话已创建')
    }
  }

  // 切换会话 - 使用 Supabase 存储（已登录）或 localStorage（未登录）
  const switchSession = async (sessionId: string) => {
    console.log('[switchSession] 开始切换会话:', sessionId, '用户:', user?.id || '未登录')
    
    // 如果用户未登录，直接使用 localStorage
    if (!user) {
      console.log('[switchSession] 用户未登录，使用 localStorage')
      llmService.switchSession(sessionId)
      const updatedSessions = llmService.getSessions()
      setSessions(updatedSessions)
      const activeSession = updatedSessions.find(session => session.isActive) || updatedSessions[0]
      if (activeSession) {
        setCurrentSession(activeSession)
        setMessages(activeSession.messages)
      }
      return
    }

    // 用户已登录，使用 Supabase
    try {
      console.log('[switchSession] 用户已登录，使用 Supabase')
      // 确保服务已初始化
      await aiAssistantService.initialize(user)
      
      console.log('[switchSession] 调用 switchConversation:', sessionId)
      const result = await aiAssistantService.switchConversation(sessionId)
      console.log('[switchSession] switchConversation 结果:', result)
      
      // 刷新会话列表
      const conversations = await aiAssistantService.getAllConversations()
      console.log('[switchSession] 获取到的会话列表:', conversations)
      
      const formattedSessions: ConversationSession[] = conversations.map(conv => {
        console.log('[switchSession] 处理会话:', conv.id, 'created_at:', conv.created_at, 'updated_at:', conv.updated_at)
        return {
          id: conv.id,
          name: conv.title || '新对话',
          modelId: conv.model_id || 'qwen',
          messages: [],
          createdAt: new Date(conv.created_at).getTime(),
          updatedAt: new Date(conv.updated_at).getTime(),
          isActive: conv.is_active,
          currentTopic: conv.context_summary || '',
          topicHistory: [],
          contextSummary: conv.context_summary || '',
          lastMessageTimestamp: new Date(conv.updated_at).getTime()
        }
      })
      
      console.log('[switchSession] 格式化后的会话:', formattedSessions)
      console.log('[switchSession] 所有会话的 isActive 状态:', formattedSessions.map(s => ({ id: s.id.slice(0, 8), isActive: s.isActive })))
      setSessions(formattedSessions)
      
      const activeSession = formattedSessions.find(session => session.isActive) || formattedSessions[0]
      console.log('[switchSession] 活跃会话:', activeSession)
      
      if (activeSession) {
        setCurrentSession(activeSession)
        // 加载新会话的消息历史
        const history = await aiAssistantService.getConversationHistory()
        console.log('[switchSession] 消息历史:', history)
        setMessages(history.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          isError: msg.isError
        })))
      }
    } catch (error) {
      console.error('[switchSession] 切换会话失败:', error)
      toast.error('切换会话失败')
      // 回退到 localStorage
      llmService.switchSession(sessionId)
      const updatedSessions = llmService.getSessions()
      setSessions(updatedSessions)
      const activeSession = updatedSessions.find(session => session.isActive) || updatedSessions[0]
      if (activeSession) {
        setCurrentSession(activeSession)
        setMessages(activeSession.messages)
      }
    }
  }

  // 删除会话 - 使用 Supabase 存储（已登录）或 localStorage（未登录）
  const deleteSession = async (sessionId: string) => {
    console.log('[deleteSession] 开始删除会话:', sessionId, '用户:', user?.id || '未登录')
    
    // 如果用户未登录，直接使用 localStorage
    if (!user) {
      console.log('[deleteSession] 用户未登录，使用 localStorage')
      llmService.deleteSession(sessionId)
      const updatedSessions = llmService.getSessions()
      setSessions(updatedSessions)
      const activeSession = updatedSessions.find(session => session.isActive) || updatedSessions[0]
      if (activeSession) {
        setCurrentSession(activeSession)
        setMessages(activeSession.messages)
      }
      toast.success('会话已删除')
      return
    }

    // 用户已登录，使用 Supabase
    try {
      console.log('[deleteSession] 用户已登录，使用 Supabase')
      // 确保服务已初始化
      await aiAssistantService.initialize(user)
      
      console.log('[deleteSession] 调用 deleteConversation:', sessionId)
      const result = await aiAssistantService.deleteConversation(sessionId)
      console.log('[deleteSession] deleteConversation 结果:', result)
      
      // 刷新会话列表
      console.log('[deleteSession] 开始刷新会话列表...')
      await new Promise(resolve => setTimeout(resolve, 500)) // 等待 500ms，确保数据库已更新
      const conversations = await aiAssistantService.getAllConversations()
      console.log('[deleteSession] 获取到的会话列表:', conversations)
      console.log('[deleteSession] 会话数量:', conversations.length)
      
      const formattedSessions: ConversationSession[] = conversations.map(conv => ({
        id: conv.id,
        name: conv.title || '新对话',
        modelId: conv.model_id || 'qwen',
        messages: [],
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime(),
        isActive: conv.is_active,
        currentTopic: conv.context_summary || '',
        topicHistory: [],
        contextSummary: conv.context_summary || '',
        lastMessageTimestamp: new Date(conv.updated_at).getTime()
      }))
      
      console.log('[deleteSession] 设置会话列表:', formattedSessions.length, '个会话')
      setSessions(formattedSessions)
      console.log('[deleteSession] 会话列表已设置')
      
      const activeSession = formattedSessions.find(session => session.isActive) || formattedSessions[0]
      console.log('[deleteSession] 活跃会话:', activeSession?.id)
      
      if (activeSession) {
        // 设置当前会话到 React 状态
        setCurrentSession(activeSession)
        // 设置当前会话到 aiAssistantService
        aiAssistantService.setCurrentConversationId(activeSession.id)
        console.log('[deleteSession] 当前会话已设置:', activeSession.id)
        const history = await aiAssistantService.getConversationHistory()
        console.log('[deleteSession] 消息历史:', history.length, '条消息')
        setMessages(history.map(msg => ({
          role: msg.role,
          content: msg.content,
          timestamp: msg.timestamp,
          isError: msg.isError
        })))
      } else {
        // 如果没有会话了，清空 aiAssistantService 的当前会话ID
        aiAssistantService.setCurrentConversationId(null)
        setCurrentSession(null)
        setMessages([])
      }
      toast.success('会话已删除')
      console.log('[deleteSession] 删除完成')
    } catch (error) {
      console.error('[deleteSession] 删除会话失败:', error)
      toast.error('删除会话失败')
      // 回退到 localStorage
      llmService.deleteSession(sessionId)
      const updatedSessions = llmService.getSessions()
      setSessions(updatedSessions)
      const activeSession = updatedSessions.find(session => session.isActive) || updatedSessions[0]
      if (activeSession) {
        setCurrentSession(activeSession)
        setMessages(activeSession.messages)
      }
    }
  }

  // 重命名会话 - 使用 Supabase 存储（已登录）或 localStorage（未登录）
  const renameSession = async () => {
    if (!editingSessionName.trim() || !currentSession) return

    // 如果用户未登录，直接使用 localStorage
    if (!user) {
      console.log('[renameSession] 用户未登录，使用 localStorage')
      llmService.renameSession(currentSession.id, editingSessionName.trim())
      const updatedSessions = llmService.getSessions()
      setSessions(updatedSessions)
      const updatedSession = updatedSessions.find(s => s.id === currentSession.id)
      if (updatedSession) {
        setCurrentSession(updatedSession)
      }
      setIsEditingSessionName(false)
      setEditingSessionName('')
      toast.success('会话已重命名')
      return
    }
    
    // 用户已登录，使用 Supabase
    try {
      // 确保服务已初始化
      await aiAssistantService.initialize(user)
      
      await aiAssistantService.renameConversation(currentSession.id, editingSessionName.trim())
      
      // 刷新会话列表
      const conversations = await aiAssistantService.getAllConversations()
      const formattedSessions: ConversationSession[] = conversations.map(conv => ({
        id: conv.id,
        name: conv.title || '新对话',
        modelId: conv.model_id || 'qwen',
        messages: [],
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime(),
        isActive: conv.is_active,
        currentTopic: conv.context_summary || '',
        topicHistory: [],
        contextSummary: conv.context_summary || '',
        lastMessageTimestamp: new Date(conv.updated_at).getTime()
      }))
      
      setSessions(formattedSessions)
      const activeSession = formattedSessions.find(session => session.id === currentSession.id)
      if (activeSession) {
        setCurrentSession(activeSession)
      }
      setIsEditingSessionName(false)
      setEditingSessionName('')
      toast.success('会话已重命名')
    } catch (error) {
      console.error('重命名会话失败:', error)
      // 回退到 localStorage
      llmService.renameSession(currentSession.id, editingSessionName.trim())
      const updatedSessions = llmService.getSessions()
      setSessions(updatedSessions)
      const updatedSession = updatedSessions.find(s => s.id === currentSession.id)
      if (updatedSession) {
        setCurrentSession(updatedSession)
      }
      setIsEditingSessionName(false)
      setEditingSessionName('')
      toast.success('会话已重命名')
    }
  }

  // 开始编辑会话列表中的会话名称
  const startEditingSessionInList = (session: ConversationSession, e: React.MouseEvent) => {
    e.stopPropagation()
    setEditingSessionId(session.id)
    setEditingSessionNameInList(session.name)
  }

  // 保存会话列表中的会话名称
  const saveSessionNameInList = async () => {
    if (!editingSessionNameInList.trim() || !editingSessionId) return

    // 如果用户未登录，直接使用 localStorage
    if (!user) {
      llmService.renameSession(editingSessionId, editingSessionNameInList.trim())
      const updatedSessions = llmService.getSessions()
      setSessions(updatedSessions)
      if (currentSession?.id === editingSessionId) {
        const updatedCurrentSession = updatedSessions.find(s => s.id === editingSessionId)
        if (updatedCurrentSession) {
          setCurrentSession(updatedCurrentSession)
        }
      }
      setEditingSessionId(null)
      setEditingSessionNameInList('')
      toast.success('会话已重命名')
      return
    }

    // 用户已登录，使用 Supabase
    try {
      await aiAssistantService.initialize(user)
      await aiAssistantService.renameConversation(editingSessionId, editingSessionNameInList.trim())

      // 刷新会话列表
      const conversations = await aiAssistantService.getAllConversations()
      const formattedSessions: ConversationSession[] = conversations.map(conv => ({
        id: conv.id,
        name: conv.title || '新对话',
        modelId: conv.model_id || 'qwen',
        messages: [],
        createdAt: new Date(conv.created_at).getTime(),
        updatedAt: new Date(conv.updated_at).getTime(),
        isActive: conv.is_active,
        currentTopic: conv.context_summary || '',
        topicHistory: [],
        contextSummary: conv.context_summary || '',
        lastMessageTimestamp: new Date(conv.updated_at).getTime()
      }))

      setSessions(formattedSessions)
      if (currentSession?.id === editingSessionId) {
        const activeSession = formattedSessions.find(session => session.id === editingSessionId)
        if (activeSession) {
          setCurrentSession(activeSession)
        }
      }
      setEditingSessionId(null)
      setEditingSessionNameInList('')
      toast.success('会话已重命名')
    } catch (error) {
      console.error('重命名会话失败:', error)
      // 回退到 localStorage
      llmService.renameSession(editingSessionId, editingSessionNameInList.trim())
      const updatedSessions = llmService.getSessions()
      setSessions(updatedSessions)
      if (currentSession?.id === editingSessionId) {
        const updatedCurrentSession = updatedSessions.find(s => s.id === editingSessionId)
        if (updatedCurrentSession) {
          setCurrentSession(updatedCurrentSession)
        }
      }
      setEditingSessionId(null)
      setEditingSessionNameInList('')
      toast.success('会话已重命名')
    }
  }

  // 取消编辑会话列表中的会话名称
  const cancelEditingSessionInList = () => {
    setEditingSessionId(null)
    setEditingSessionNameInList('')
  }

  // 发送消息
  const sendMessage = async () => {
    console.log('[sendMessage] 开始发送消息:', { input: input.trim(), currentSession, isGenerating })
    
    if (!input.trim()) {
      console.log('[sendMessage] 输入为空，不发送')
      return
    }
    
    if (!currentSession) {
      console.log('[sendMessage] 没有当前会话，尝试创建新会话')
      // 尝试创建新会话
      try {
        // 确保服务已初始化
        await aiAssistantService.initialize(user)
        
        await aiAssistantService.createNewConversation()
        const conversations = await aiAssistantService.getAllConversations()
        const formattedSessions: ConversationSession[] = conversations.map(conv => ({
          id: conv.id,
          name: conv.title || '新对话',
          modelId: conv.model_id || 'qwen',
          messages: [],
          createdAt: new Date(conv.created_at).getTime(),
          updatedAt: new Date(conv.updated_at).getTime(),
          isActive: conv.is_active,
          currentTopic: conv.context_summary || '',
          topicHistory: [],
          contextSummary: conv.context_summary || '',
          lastMessageTimestamp: new Date(conv.updated_at).getTime()
        }))
        setSessions(formattedSessions)
        const activeSession = formattedSessions.find(session => session.isActive) || formattedSessions[0]
        if (activeSession) {
          setCurrentSession(activeSession)
          console.log('[sendMessage] 新会话已创建:', activeSession)
        }
      } catch (error) {
        console.error('[sendMessage] 创建会话失败:', error)
        toast.error('创建会话失败，请重试')
        return
      }
    }
    
    if (isGenerating) {
      console.log('[sendMessage] 正在生成中，不发送')
      return
    }
    
    setIsGenerating(true)
    setIsTyping(true)
    const userInput = input.trim()
    setInput('')

    // 添加用户消息到本地状态
    const userMessage: Message = {
      role: 'user',
      content: userInput,
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])

    // 如果用户已登录，保存用户消息到数据库
    if (user && currentSession) {
      try {
        await aiAssistantService.initialize(user)
        // 确保设置当前会话ID
        aiAssistantService.setCurrentConversationId(currentSession.id)
        console.log('[sendMessage] 保存用户消息到数据库, sessionId:', currentSession.id)
        await aiAssistantService.saveMessage('user', userInput)
      } catch (error) {
        console.error('[sendMessage] 保存用户消息失败:', error)
      }
    }
    
    try {
      // 简单的数字映射回答和页面跳转
      let response = '';
      const message = userInput.trim();
      
      // 处理常见问候语和身份问题
      const greetings = ['你好', '您好', 'hi', 'hello', '嗨', '早上好', '下午好', '晚上好'];
      let isGreeting = false;
      for (const greeting of greetings) {
        if (message.includes(greeting)) {
          isGreeting = true;
          const currentPage = context?.page || '';
          response = `你好！我是津小脉，很高兴为你服务。你现在在「${currentPage}」页面，有什么可以帮助你的吗？你可以问我关于平台使用、创作技巧、文化知识等方面的问题，我会尽力为你解答。`;
          break;
        }
      }
      
      // 处理身份问题
      if (!isGreeting && (message.includes('你是谁') || message.includes('你是什么') || message.includes('你的名字'))) {
        isGreeting = true;
        response = `你好！我是津小脉，津脉智坊平台的专属AI助手，由Kimi模型驱动。我专注于传统文化创作与设计，能够为你提供平台功能导航、创作辅助、文化知识普及等全方位支持。我的使命是连接传统文化与青年创意，推动文化传承与创新。`;
      }
      
      // 处理图片/视频生成请求
      if (!isGreeting) {
        // 图片生成关键词 - 包含更多变体
        const imageKeywords = [
          // 基础生成指令
          '生成图片', '生成图像', '生成图', '生成照片', '生成画',
          // 画/绘制指令
          '画一张', '画个', '画幅', '画一下', '帮我画', '画一', '画张', '画幅',
          '绘制', '画个图', '画张图', '画幅画',
          // 帮我生成系列
          '帮我生成', '帮我画图', '帮我画', '给我生成', '给我画',
          // 想要/需要系列
          '想要一张', '想要个', '想要幅', '想要张', '想要图',
          '需要一张', '需要张', '需要幅', '需要个图',
          // 来一张系列
          '来一张', '来一幅', '来张', '来幅', '来个图',
          // 做/创作/设计系列
          '做一张', '做张', '做幅', '做个图',
          '创作一张', '创作张', '创作幅', '创作个图',
          '设计一张', '设计张', '设计幅', '设计个图',
          // 其他表达
          '整一张', '整幅', '整张图', '整幅画',
          '搞一张', '搞幅', '搞张图',
          '弄一张', '弄幅', '弄张图',
        ];
        
        // 视频生成关键词
        const videoKeywords = [
          '生成视频', '生成影片', '生成动画', '生成短片',
          '做个视频', '做视频', '做动画', '做短片',
          '帮我做视频', '帮我生成视频', '帮我生成影片',
          '想要视频', '想要个视频', '想要段视频',
          '给我做个视频', '给我生成视频',
          '来段视频', '来段', '来段动画',
          '需要视频', '做段视频', '创作视频', '设计视频'
        ];
        
        // 更宽松的匹配：检查是否同时包含"生成/画/做"和"图片/图/画"
        const generationVerbs = ['生成', '画', '绘制', '做', '创作', '设计', '整', '搞', '弄'];
        const imageNouns = ['图片', '图像', '图', '照片', '画', '画作', '插画'];
        const videoNouns = ['视频', '影片', '动画', '短片', '录像'];
        
        const hasGenerationVerb = generationVerbs.some(v => message.includes(v));
        const hasImageNoun = imageNouns.some(n => message.includes(n));
        const hasVideoNoun = videoNouns.some(n => message.includes(n));
        
        // 判断是否为图片/视频请求（关键词匹配 或 动词+名词组合）
        const isImageRequest = imageKeywords.some(k => message.includes(k)) || 
                               (hasGenerationVerb && hasImageNoun);
        const isVideoRequest = videoKeywords.some(k => message.includes(k)) || 
                               (hasGenerationVerb && hasVideoNoun);
        
        if (isImageRequest || isVideoRequest) {
          // 提取提示词（去掉生成指令部分）
          let prompt = message;
          const allKeywords = [...imageKeywords, ...videoKeywords];
          for (const keyword of allKeywords) {
            if (prompt.includes(keyword)) {
              prompt = prompt.replace(keyword, '').trim();
            }
          }
          // 去除常见的连接词
          prompt = prompt.replace(/^(有关|关于|一个|一张|一幅|个|张|幅|的|图片|图像|视频|影片)?/, '').trim();
          prompt = prompt.replace(/^(有关|关于|一个|一张|一幅|个|张|幅|的)?/, '').trim();
          
          const type = isImageRequest ? 'image' : 'video';
          const typeName = isImageRequest ? '图片' : '视频';
          
          // 发送AI回复
          response = `好的，我来为你生成${typeName}！请稍候...`;
          setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }]);
          
          // 保存AI回复到数据库
          if (user && currentSession) {
            try {
              aiAssistantService.setCurrentConversationId(currentSession.id);
              await aiAssistantService.saveMessage('assistant', response);
            } catch (error) {
              console.error('[sendMessage] 保存AI回复失败:', error);
            }
          }
          
          // 开始生成 - 先调用服务创建任务，确保使用服务返回的任务对象
          try {
            const task = type === 'image' 
              ? await aiGenerationService.generateImage({
                  prompt: prompt || '天津传统文化创作',
                  size: '1024x1024',
                  quality: 'standard',
                  n: 1
                })
              : await aiGenerationService.generateVideo({
                  prompt: prompt || '天津传统文化创作',
                  duration: 5,
                  resolution: '720p'
                });
            
            // 添加生成卡片消息 - 使用服务返回的任务对象
            console.log('[AICollaborationPanel] Adding generation message with task:', task.id, task.status, task.progress);
            const generationMessage = {
              role: 'assistant' as const,
              content: '',
              timestamp: Date.now(),
              generationTask: task
            };
            setMessages(prev => [...prev, generationMessage]);
            
            // 注意：生成任务消息将在任务完成时由任务监听器保存到数据库
          } catch (error) {
            console.error('生成失败:', error);
            toast.error('生成失败，请重试');
          }
          
          return;
        }
      }
      
      if (!isGreeting) {
        const trafficKeywords = ['交通', '路线', '怎么去', '怎么走', '公交', '地铁', '步行', '驾车']
        const isTrafficQuery = trafficKeywords.some(k => message.includes(k))
        if (isTrafficQuery) {
          const mode = message.includes('公交') || message.includes('地铁')
            ? 'transit'
            : message.includes('步行')
            ? 'walk'
            : 'drive'
          const routeRegex = /从(.+?)到(.+?)(怎么去|怎么走)?/
          const m = message.match(routeRegex)
          let origin = ''
          let destination = ''
          if (m && m[1] && m[2]) {
            origin = m[1].trim()
            destination = m[2].trim()
          } else {
            const parts = message.replace(/[，。,.]/g, ' ').split(' ').filter(Boolean)
            const idxFrom = parts.findIndex(p => p.includes('从'))
            const idxTo = parts.findIndex(p => p.includes('到'))
            if (idxFrom !== -1 && idxTo !== -1 && idxTo > idxFrom) {
              origin = parts[idxFrom].replace('从', '')
              destination = parts[idxTo].replace('到', '')
            }
          }
          if (origin && destination) {
            const route = await localServices.getTrafficRoute({ origin, destination, mode: mode as any })
            response = `为你查询到从「${origin}」到「${destination}」的${mode === 'transit' ? '公共交通' : mode === 'walk' ? '步行' : '驾车'}路线：\n\n预计距离：${(route.distance / 1000).toFixed(1)} km\n预计耗时：${Math.round(route.duration / 60)} 分钟\n提供方：${route.provider === 'amap' ? '高德地图' : '本地快速查询'}\n\n步骤：\n${route.steps.map((s, i) => `${i + 1}. ${s.instruction}`).join('\n')}`
            setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }])
            // 保存AI回复到数据库
            if (user && currentSession) {
              try {
                aiAssistantService.setCurrentConversationId(currentSession.id)
                await aiAssistantService.saveMessage('assistant', response)
              } catch (error) {
                console.error('[sendMessage] 保存AI回复失败:', error)
              }
            }
            return
          } else {
            response = '请提供完整的出发地与目的地，例如："从天津站到鼓楼怎么去"。'
            setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }])
            // 保存AI回复到数据库
            if (user && currentSession) {
              try {
                aiAssistantService.setCurrentConversationId(currentSession.id)
                await aiAssistantService.saveMessage('assistant', response)
              } catch (error) {
                console.error('[sendMessage] 保存AI回复失败:', error)
              }
            }
            return
          }
        }
        const govKeywords = ['政务', '办理', '业务', '证', '居住证', '身份证', '社保', '公积金']
        const isGovQuery = govKeywords.some(k => message.includes(k))
        if (isGovQuery) {
          const serviceMap: Record<string, string> = {
            '身份证': '身份证办理',
            '居住证': '居住证办理'
          }
          const matched = Object.keys(serviceMap).find(k => message.includes(k))
          const service = matched ? serviceMap[matched] : '线上办理指南'
          const guide = await localServices.getGovServiceGuide({ service, city: '天津' })
          response = `为你整理了「${guide.service}」的办理指引：\n\n步骤：\n${guide.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}\n\n网上办事大厅：${guide.onlinePortal || '—'}\n咨询热线：${guide.hotline || '—'}\n提供方：${guide.provider === 'local' ? '天津政务服务' : '本地指南'}`
          setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }])
          // 保存AI回复到数据库
          if (user && currentSession) {
            try {
              aiAssistantService.setCurrentConversationId(currentSession.id)
              await aiAssistantService.saveMessage('assistant', response)
            } catch (error) {
              console.error('[sendMessage] 保存AI回复失败:', error)
            }
          }
          return
        }
        // 检查页面跳转关键词
        const navigationKeywords: Record<string, { path: string; name: string }> = {
          '首页': { path: '/', name: '首页' },
          '文化知识': { path: '/cultural-knowledge', name: '文化知识' },
          '创作中心': { path: '/create', name: '创作中心' },
          '创作工坊': { path: '/create', name: '创作工坊' },
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
          // 调用LLM服务生成响应
          // 创建一个临时的AI回复对象，用于流式更新
          const tempAssistantMessage: Message = {
            role: 'assistant',
            content: '',
            timestamp: Date.now()
          };
          
          // 将临时消息添加到状态中，用于流式更新
          setMessages(prev => [...prev, tempAssistantMessage]);
          
          // 使用简化的直接生成响应方法，绕过任务队列
          let fullResponse = '';
          response = await llmService.directGenerateResponse(userInput, {
            context,
            onDelta: (chunk) => {
              // 实现流式响应的实时更新
              fullResponse += chunk;
              setMessages(prev => {
                const updatedMessages = [...prev];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  // 创建新对象而不是修改原对象，避免重复累积
                  updatedMessages[updatedMessages.length - 1] = {
                    ...lastMessage,
                    content: fullResponse
                  };
                }
                return updatedMessages;
              });
            }
          });
        }
      }
      
      // 更新本地状态中的AI回复内容，确保内容完整
      setMessages(prev => {
        const updatedMessages = [...prev];
        const lastMessage = updatedMessages[updatedMessages.length - 1];
        if (lastMessage && lastMessage.role === 'assistant') {
          lastMessage.content = response;
        } else {
          // 如果没有临时消息，添加完整的AI回复
          updatedMessages.push({
            role: 'assistant',
            content: response,
            timestamp: Date.now()
          });
        }
        return updatedMessages;
      });

      // 如果用户已登录，保存AI回复到数据库
      if (user && currentSession) {
        try {
          aiAssistantService.setCurrentConversationId(currentSession.id)
          await aiAssistantService.saveMessage('assistant', response)
        } catch (error) {
          console.error('[sendMessage] 保存AI回复失败:', error)
        }
      }

      // 通知父组件内容已生成
      if (onContentGenerated) {
        onContentGenerated(response);
      }
    } catch (error) {
      console.error('Failed to generate response:', error);
      
      // 生成详细的错误信息
      let errorContent = '';
      const errorMessage = error instanceof Error ? error.message : t('aiCollab.errors.generateFailed');
      
      if (serviceStatus === 'error') {
        errorContent = `抱歉，AI服务连接出现问题：${errorMessage}。\n\n建议：\n1. 检查网络连接是否正常\n2. 点击右上角心跳图标检查AI服务状态\n3. 稍后再试或尝试其他问题\n4. 尝试切换到其他可用模型`;
      } else {
        errorContent = `抱歉，我暂时无法回答你的问题。\n\n建议：\n1. 检查网络连接是否正常\n2. 稍后再试或尝试其他问题\n3. 点击右上角心跳图标检查AI服务状态\n4. 尝试切换到其他可用模型`;
      }
      
      const errorMessageObj: Message = {
        role: 'assistant',
        content: errorContent,
        timestamp: Date.now()
      };

      setMessages(prev => [...prev, errorMessageObj]);
    } finally {
      setIsGenerating(false);
      setIsTyping(false);
    }
  }

  // 清除当前会话历史 - 使用 Supabase 存储（已登录）或 localStorage（未登录）
  const clearCurrentSession = async () => {
    // 如果用户已登录，使用 aiAssistantService
    if (user) {
      try {
        // 确保服务已初始化
        await aiAssistantService.initialize(user)
        
        await aiAssistantService.clearCurrentConversation()
        setMessages([])
        toast.success(t('aiCollab.toasts.historyCleared'))
        return
      } catch (error) {
        console.error('清除会话历史失败:', error)
        // 回退到 localStorage
      }
    }

    // 使用 localStorage
    llmService.clearHistory()
    const updatedSessions = llmService.getSessions()
    const activeSession = updatedSessions.find(s => s.isActive)
    if (activeSession) {
      setMessages([])
      setCurrentSession(activeSession)
      setSessions(updatedSessions)
    }
    toast.success(t('aiCollab.toasts.historyCleared'))
  }

  // 处理生成任务保存
  const handleSaveGeneration = async (task: GenerationTask) => {
    if (!task.result?.urls[0]) {
      toast.error('生成结果不可用');
      return;
    }

    try {
      // 获取提示词
      const prompt = task.params?.prompt || task.result?.revisedPrompt || '';

      // 获取认证token
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      console.log('[handleSaveGeneration] 保存作品:', { type: task.type, url: task.result.urls[0], prompt });

      // 保存到创作中心预览框 - 添加到 generatedResults
      const newResult = {
        id: Date.now(),
        thumbnail: task.result.urls[0],
        type: task.type as 'image' | 'video',
        prompt: prompt,
      };
      addGeneratedResult(newResult);
      console.log('[handleSaveGeneration] 已添加到创作中心预览框:', newResult);

      // 保存到后端
      const response = await fetch('/api/works/save', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: task.type,
          url: task.result.urls[0],
          prompt: prompt,
          createdAt: new Date().toISOString()
        })
      });

      console.log('[handleSaveGeneration] 响应状态:', response.status);

      if (response.ok) {
        const data = await response.json();
        console.log('[handleSaveGeneration] 响应数据:', data);
        toast.success('已保存到创作中心');
      } else {
        const errorData = await response.json().catch(() => ({ message: '未知错误' }));
        console.error('[handleSaveGeneration] 后端保存失败:', errorData);
        // 后端保存失败不影响前端预览框的显示
        toast.success('已添加到创作中心预览');
      }
    } catch (error) {
      console.error('保存失败:', error);
      toast.error('保存失败: ' + (error instanceof Error ? error.message : '请重试'));
    }
  };

  // 生成发布元数据（标题、描述、标签）
  const generatePublishMetadata = async (prompt: string, type: 'image' | 'video') => {
    setIsGeneratingMetadata(true);
    try {
      const result = await llmService.generateTitleAndTags(prompt, type);
      setPublishTitle(result.title);
      setPublishTags(result.tags);
      // 使用prompt作为默认描述
      setPublishDescription(prompt);
      toast.success('已使用千问AI生成标题和标签');
    } catch (error) {
      console.error('生成元数据失败:', error);
      toast.error('AI生成标题失败，请手动输入');
      // 使用默认值
      setPublishTitle(type === 'video' ? '创意视频作品' : 'AI创意作品');
      setPublishDescription(prompt);
      setPublishTags(['AI创作', type === 'video' ? '数字艺术' : '概念设计']);
    } finally {
      setIsGeneratingMetadata(false);
    }
  };

  // 处理生成任务发布 - 打开模态框并调用千问API
  const handlePublishGeneration = async (task: GenerationTask) => {
    if (!task.result?.urls[0]) {
      toast.error('生成结果不可用');
      return;
    }
    
    // 获取提示词
    const prompt = task.params?.prompt || task.result?.revisedPrompt || '';
    
    // 设置发布任务
    setPublishTask(task);
    setPublishTitle('');
    setPublishDescription('');
    setPublishTags([]);
    setShowPublishModal(true);
    
    // 自动调用千问API生成标题和标签
    await generatePublishMetadata(prompt, task.type);
  };

  // 确认发布作品
  const confirmPublish = async () => {
    if (!publishTask || !publishTitle.trim()) {
      toast.error('请输入作品标题');
      return;
    }
    
    const token = localStorage.getItem('token');
    if (!token) {
      toast.error('请先登录');
      return;
    }
    
    setIsPublishing(true);
    try {
      // 处理图片/视频上传：如果URL不是Supabase永久链接，需要下载并上传
      let finalImageUrl = publishTask.result?.urls[0] || '';
      let finalVideoUrl = publishTask.type === 'video' ? finalImageUrl : undefined;
      
      // 检查是否是外部链接（非Supabase链接）
      if (!finalImageUrl.includes('supabase.co')) {
        try {
          if (publishTask.type === 'video') {
            // 上传视频
            console.log('[AICollaborationPanel] Downloading and uploading video to Supabase...');
            const { downloadAndUploadVideo } = await import('@/services/imageService');
            const uploadedUrl = await downloadAndUploadVideo(finalImageUrl, user?.id || 'anonymous');
            if (uploadedUrl) {
              finalVideoUrl = uploadedUrl;
              finalImageUrl = uploadedUrl; // 视频使用视频URL作为缩略图
              console.log('[AICollaborationPanel] Video uploaded to:', uploadedUrl);
            } else {
              console.warn('[AICollaborationPanel] Video upload returned empty, using original URL');
            }
          } else {
            // 上传图片
            console.log('[AICollaborationPanel] Downloading and uploading image to Supabase...');
            const { downloadAndUploadImage } = await import('@/services/imageService');
            const uploadedUrl = await downloadAndUploadImage(finalImageUrl, user?.id || 'anonymous');
            if (uploadedUrl) {
              finalImageUrl = uploadedUrl;
              console.log('[AICollaborationPanel] Image uploaded to:', uploadedUrl);
            } else {
              console.warn('[AICollaborationPanel] Upload returned empty, using original URL');
            }
          }
        } catch (uploadError) {
          console.error('[AICollaborationPanel] Failed to upload media:', uploadError);
          toast.error('媒体上传失败，请重试');
          setIsPublishing(false);
          return;
        }
      }
      
      console.log('[confirmPublish] 发布作品:', { 
        type: publishTask.type, 
        url: finalImageUrl,
        videoUrl: finalVideoUrl,
        title: publishTitle,
        description: publishDescription,
        tags: publishTags
      });
      
      // 发布到津脉广场
      const response = await fetch('/api/works/publish', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          type: publishTask.type,
          url: finalImageUrl,
          videoUrl: finalVideoUrl,
          title: publishTitle,
          description: publishDescription,
          tags: publishTags,
          source: 'ai-generation'
        })
      });
      
      console.log('[confirmPublish] 响应状态:', response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log('[confirmPublish] 响应数据:', data);
        toast.success('已发布到津脉广场！');
        setShowPublishModal(false);
        setPublishTask(null);
      } else {
        const errorData = await response.json().catch(() => ({ message: '未知错误' }));
        console.error('[confirmPublish] 发布失败:', errorData);
        throw new Error(errorData.message || `发布失败: ${response.status}`);
      }
    } catch (error) {
      console.error('发布失败:', error);
      toast.error('发布失败: ' + (error instanceof Error ? error.message : '请重试'));
    } finally {
      setIsPublishing(false);
    }
  };

  // 处理生成任务分享
  const handleShareGeneration = async (task: GenerationTask) => {
    if (!task.result?.urls[0]) {
      toast.error('生成结果不可用');
      return;
    }
    
    // 获取提示词
    const prompt = task.params?.prompt || task.result?.revisedPrompt || '';
    
    // 构建分享内容
    const shareContent = {
      title: `AI生成的${task.type === 'image' ? '图片' : '视频'}`,
      description: prompt,
      imageUrl: task.result.urls[0],
      type: task.type
    };
    
    // 打开分享对话框
    setShareContent(shareContent);
    setShowShareDialog(true);
  };

  // 处理生成任务分享给好友
  const handleShareToFriendGeneration = async (task: GenerationTask) => {
    if (!task.result?.urls[0]) {
      toast.error('生成结果不可用');
      return;
    }
    
    // 获取提示词
    const prompt = task.params?.prompt || task.result?.revisedPrompt || '';
    
    // 打开好友选择对话框
    setShareContent({
      title: `AI生成的${task.type === 'image' ? '图片' : '视频'}`,
      description: prompt,
      imageUrl: task.result.urls[0],
      type: task.type
    });
    setShowFriendShareDialog(true);
  };

  // 处理删除单个消息
  const handleDeleteMessage = async (index: number) => {
    console.log('[handleDeleteMessage] 删除消息:', index);
    
    // 获取要删除的消息
    const messageToDelete = messages[index];
    const messageId = (messageToDelete as any).id;
    
    if (!messageId) {
      console.error('[handleDeleteMessage] 消息没有ID，无法从数据库删除');
      toast.error('删除失败：消息ID不存在');
      return;
    }
    
    // 从数据库中删除消息
    try {
      const success = await aiMemoryService.deleteMessage(messageId);
      if (!success) {
        console.error('[handleDeleteMessage] 从数据库删除消息失败');
        toast.error('删除失败，请重试');
        return;
      }
      console.log('[handleDeleteMessage] 从数据库删除消息成功:', messageId);
    } catch (error) {
      console.error('[handleDeleteMessage] 删除消息异常:', error);
      toast.error('删除失败，请重试');
      return;
    }
    
    // 从消息列表中删除该消息
    setMessages(prev => {
      const newMessages = [...prev];
      const deletedMessage = newMessages[index];
      
      // 如果消息包含生成任务，也从已保存的消息ID映射中删除
      const task = (deletedMessage as any).generationTask;
      if (task) {
        savedGenerationMessagesRef.current.delete(task.id);
        console.log('[handleDeleteMessage] 删除生成任务:', task.id);
      }
      
      newMessages.splice(index, 1);
      return newMessages;
    });
    
    toast.success('已删除消息');
  };

  // 处理删除生成任务消息
  const handleDeleteGeneration = (task: GenerationTask) => {
    console.log('[handleDeleteGeneration] 删除生成任务:', task.id);
    
    // 从消息列表中删除该生成任务
    setMessages(prev => prev.filter(msg => {
      const msgTask = (msg as any).generationTask;
      return !msgTask || msgTask.id !== task.id;
    }));
    
    // 从已保存的消息ID映射中删除
    savedGenerationMessagesRef.current.delete(task.id);
    
    toast.success('已删除生成记录');
  };

  // 删除所有会话 - 使用 Supabase 存储（已登录）或 localStorage（未登录）
  const deleteAllSessions = async () => {
    // 如果用户已登录，使用 aiAssistantService
    if (user) {
      try {
        // 确保服务已初始化
        await aiAssistantService.initialize(user)
        
        await aiAssistantService.deleteAllConversations()
        
        // 刷新会话列表
        const conversations = await aiAssistantService.getAllConversations()
        const formattedSessions: ConversationSession[] = conversations.map(conv => ({
          id: conv.id,
          name: conv.title || '新对话',
          modelId: conv.model_id || 'qwen',
          messages: [],
          createdAt: new Date(conv.created_at).getTime(),
          updatedAt: new Date(conv.updated_at).getTime(),
          isActive: conv.is_active,
          currentTopic: conv.context_summary || '',
          topicHistory: [],
          contextSummary: conv.context_summary || '',
          lastMessageTimestamp: new Date(conv.updated_at).getTime()
        }))
        
        setSessions(formattedSessions)
        
        // 如果没有会话了，创建一个新会话
        if (formattedSessions.length === 0) {
          await aiAssistantService.createNewConversation()
          const newConversations = await aiAssistantService.getAllConversations()
          const newFormattedSessions: ConversationSession[] = newConversations.map(conv => ({
            id: conv.id,
            name: conv.title || '新对话',
            modelId: conv.model_id || 'qwen',
            messages: [],
            createdAt: new Date(conv.created_at).getTime(),
            updatedAt: new Date(conv.updated_at).getTime(),
            isActive: conv.is_active,
            currentTopic: conv.context_summary || '',
            topicHistory: [],
            contextSummary: conv.context_summary || '',
            lastMessageTimestamp: new Date(conv.updated_at).getTime()
          }))
          setSessions(newFormattedSessions)
          const newActiveSession = newFormattedSessions.find(session => session.isActive) || newFormattedSessions[0]
          if (newActiveSession) {
            setCurrentSession(newActiveSession)
            aiAssistantService.setCurrentConversationId(newActiveSession.id)
            setMessages([])
          }
        } else {
          const activeSession = formattedSessions.find(session => session.isActive) || formattedSessions[0]
          if (activeSession) {
            setCurrentSession(activeSession)
            aiAssistantService.setCurrentConversationId(activeSession.id)
            const history = await aiAssistantService.getConversationHistory()
            setMessages(history.map(msg => ({
              role: msg.role,
              content: msg.content,
              timestamp: msg.timestamp,
              isError: msg.isError
            })))
          }
        }
        
        toast.success('所有会话已删除')
        return
      } catch (error) {
        console.error('删除所有会话失败:', error)
        toast.error('删除所有会话失败')
        // 回退到 localStorage
      }
    }

    // 使用 localStorage
    llmService.deleteAllSessions()
    const updatedSessions = llmService.getSessions()
    const activeSession = updatedSessions.find(s => s.isActive)
    if (activeSession) {
      setMessages([])
      setCurrentSession(activeSession)
      setSessions(updatedSessions)
    }
    toast.success('所有会话已删除')
  }
  
  // 使用对话模板
  const useTemplate = (template: any) => {
    setInput(template.prompt)
    setShowTemplates(false)
  }
  
  // 导出会话
  const exportSession = (format: 'text' | 'json' | 'markdown') => {
    if (!currentSession) return
    
    let content = ''
    let filename = `${currentSession.name}.${format}`
    
    switch (format) {
      case 'text':
        content = currentSession.messages.map(msg => {
          return `${msg.role === 'user' ? t('aiCollab.roles.me') : t('aiCollab.roles.ai')}: ${msg.content}`
        }).join('\n\n')
        break
      case 'json':
        content = JSON.stringify(currentSession, null, 2)
        break
      case 'markdown':
        content = `# ${currentSession.name}\n\n`
        content += currentSession.messages.map(msg => {
          return `## ${msg.role === 'user' ? t('aiCollab.roles.me') : t('aiCollab.roles.ai')}\n\n${msg.content}`
        }).join('\n\n')
        break
    }
    
    // 创建下载链接
    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    toast.success(t('aiCollab.toasts.exported', { format }))
    setShowExportOptions(false)
  }

  // 格式化时间
  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp)
    const locale = i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US'
    return date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* 背景遮罩 */}
          <motion.div
            className="absolute inset-0 bg-black bg-opacity-50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          
          {/* 主面板 */}
          <motion.div
            className={`relative w-full h-full flex flex-col bg-white dark:bg-gray-900 shadow-2xl transition-all duration-300 transform ${isDark ? 'border-gray-800/50' : 'border-gray-200/50'}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            style={{ borderLeft: '1px solid', maxWidth: '100%', borderRadius: '2xl 0 0 2xl' }}
          >
            {/* 面板头部 - 优化为更高级的设计 */}
            <div className={`p-5 border-b dark:border-gray-800/50 ${themeStyles.headerGradient} text-white shadow-xl relative overflow-hidden`}>
              {/* 装饰性背景元素 - 更精致的渐变 */}
              <div className="absolute top-0 left-0 w-full h-full">
                <div className="absolute top-[-50%] left-[-20%] w-[500px] h-[500px] rounded-full bg-white/10 blur-[100px]"></div>
                <div className="absolute bottom-[-50%] right-[-20%] w-[400px] h-[400px] rounded-full bg-white/10 blur-[80px]"></div>
                <div className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full bg-white/5 blur-[60px]"></div>
              </div>
              
              {/* 网格背景纹理 */}
              <div className="absolute inset-0 opacity-[0.03]" style={{
                backgroundImage: `linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)`,
                backgroundSize: '20px 20px'
              }}></div>
              
              <div className="relative flex items-center justify-between z-10">
                <div className="flex items-center gap-4">
                  {/* 头像优化 - 添加发光效果 */}
                  <motion.div 
                    className="relative w-14 h-14"
                    whileHover={{ scale: 1.05 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    {/* 发光背景 */}
                    <div className="absolute inset-0 rounded-full bg-white/30 blur-xl"></div>
                    <div className="relative w-full h-full rounded-full bg-gradient-to-br from-white/40 to-white/10 backdrop-blur-md flex items-center justify-center shadow-2xl border border-white/40">
                      <span className="text-white font-bold text-xl">津</span>
                    </div>
                    {/* 在线状态指示 */}
                    <div className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${serviceStatus === 'ok' ? 'bg-green-400' : serviceStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'}`}>
                      <div className={`absolute inset-0 rounded-full animate-ping ${serviceStatus === 'ok' ? 'bg-green-400' : serviceStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'}`} style={{ animationDuration: '2s' }}></div>
                    </div>
                  </motion.div>
                  
                  <div className="flex flex-col">
                    <h2 className="text-xl font-bold tracking-tight">津小脉</h2>
                    <span className="text-xs text-white/70 font-medium">AI 创意助手</span>
                  </div>
                </div>
                
                <div className="flex items-center gap-3">
                  {/* 状态指示器优化 */}
                  <motion.div
                    className={`flex items-center gap-2 px-4 py-2 rounded-full backdrop-blur-sm border border-white/20 ${serviceStatus === 'ok' ? 'bg-green-500/20' : serviceStatus === 'error' ? 'bg-red-500/20' : 'bg-gray-500/20'}`}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={`w-2 h-2 rounded-full ${serviceStatus === 'ok' ? 'bg-green-400' : serviceStatus === 'error' ? 'bg-red-400' : 'bg-yellow-400'}`}>
                      {serviceStatus === 'ok' && <div className="w-full h-full rounded-full bg-green-400 animate-pulse"></div>}
                    </div>
                    <span className="text-xs font-medium">
                      {serviceStatus === 'ok' ? '在线' : serviceStatus === 'error' ? '离线' : '检查中'}
                    </span>
                  </motion.div>
                  
                  {/* 操作按钮组 */}
                  <div className="flex items-center gap-1 bg-white/10 backdrop-blur-sm rounded-full p-1 border border-white/20">
                    <motion.button
                      onClick={() => setShowGenerationPanel(true)}
                      className="p-2.5 rounded-full hover:bg-white/20 transition-all duration-300"
                      aria-label="AI生成"
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                      title="AI生成"
                    >
                      <i className="fas fa-magic text-white/90 text-sm"></i>
                    </motion.button>
                    <div className="w-px h-4 bg-white/20"></div>
                    <motion.button
                      onClick={() => checkAIService(true)}
                      className="p-2.5 rounded-full hover:bg-white/20 transition-all duration-300"
                      aria-label={t('aiCollab.actions.checkService')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <i className="fas fa-heartbeat text-white/90 text-sm"></i>
                    </motion.button>
                    <div className="w-px h-4 bg-white/20"></div>
                    <motion.button
                      onClick={onClose}
                      className="p-2.5 rounded-full hover:bg-white/20 transition-all duration-300"
                      aria-label={t('aiCollab.actions.close')}
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <i className="fas fa-times text-white/90 text-sm"></i>
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 面板内容 */}
            <div className="flex flex-1 overflow-hidden">
              {/* 左侧会话列表 - 优化设计 */}
              <div className={`w-72 border-r dark:border-gray-800/50 flex flex-col bg-gray-50/50 dark:bg-gray-900/50 backdrop-blur-sm ${showSessionList ? 'block' : 'hidden'}`}>
                {/* 会话列表头部 - 优化样式 */}
                <div className="p-4 border-b dark:border-gray-800/50 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                        <i className="fas fa-comments text-white text-sm"></i>
                      </div>
                      <div>
                        <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">会话列表</h3>
                        <p className="text-xs text-gray-500">{sessions.length} 个会话 | 用户: {user ? '已登录' : '未登录'}</p>
                      </div>
                    </div>
                    <motion.button
                      onClick={() => setShowNewSessionModal(true)}
                      className="p-2 rounded-xl bg-indigo-500 hover:bg-indigo-600 text-white shadow-md hover:shadow-lg transition-all"
                      aria-label={t('aiCollab.actions.newSession')}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                    >
                      <i className="fas fa-plus text-xs"></i>
                    </motion.button>
                  </div>
                </div>
                
                {/* 会话列表 - 优化卡片样式 */}
                <div className="flex-1 overflow-y-auto p-3 space-y-2">
                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-gray-400">
                      <i className="fas fa-inbox text-3xl mb-2"></i>
                      <p className="text-sm">暂无会话</p>
                      <p className="text-xs mt-1">点击 + 创建新会话</p>
                    </div>
                  )}
                  {sessions.map((session, idx) => (
                    <motion.div
                      key={session.id}
                      className={`group relative rounded-xl transition-all duration-300 border ${currentSession?.id === session.id 
                        ? (isDark 
                          ? 'bg-gradient-to-r from-indigo-900/40 to-purple-900/40 border-indigo-500/30 shadow-lg shadow-indigo-500/10' 
                          : 'bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200 shadow-md shadow-indigo-200/50') 
                        : (isDark 
                          ? 'bg-gray-800/40 border-gray-700/30 hover:border-gray-600 hover:bg-gray-800/60' 
                          : 'bg-white border-gray-200/50 hover:border-gray-300 hover:shadow-sm')
                      }`}
                      whileHover={{ x: 3 }}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: idx * 0.05 }}
                    >
                      {/* 点击区域 */}
                      <div 
                        className="p-3.5 cursor-pointer"
                        onClick={() => switchSession(session.id)}
                      >
                        {/* 活跃指示条 */}
                        {currentSession?.id === session.id && (
                          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 rounded-full bg-gradient-to-b from-indigo-500 to-purple-500"></div>
                        )}
                        
                        <div className="flex items-center justify-between pl-2">
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
                                      e.stopPropagation()
                                      saveSessionNameInList()
                                    } else if (e.key === 'Escape') {
                                      e.stopPropagation()
                                      cancelEditingSessionInList()
                                    }
                                  }}
                                  onBlur={saveSessionNameInList}
                                  onClick={(e) => e.stopPropagation()}
                                  autoFocus
                                  className={`text-sm font-medium px-2 py-1 rounded border outline-none w-full ${isDark ? 'bg-gray-800 border-gray-600 text-gray-200 focus:border-indigo-500' : 'bg-white border-gray-300 text-gray-800 focus:border-indigo-500'}`}
                                />
                              </div>
                            ) : (
                              // 显示模式
                              <p
                                onDoubleClick={(e) => startEditingSessionInList(session, e)}
                                className="text-sm font-medium truncate flex items-center gap-2 text-gray-800 dark:text-gray-200 cursor-pointer"
                                title="双击重命名"
                              >
                                {session.name}
                              </p>
                            )}
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">
                                {session.messages.length} 条消息
                              </span>
                              {currentSession?.id === session.id && (
                                <motion.span
                                  className="w-1.5 h-1.5 rounded-full bg-green-400"
                                  animate={{ scale: [1, 1.3, 1], opacity: [1, 0.7, 1] }}
                                  transition={{ repeat: Infinity, duration: 2 }}
                                ></motion.span>
                              )}
                            </div>
                          </div>
                          {editingSessionId !== session.id && (
                            <div className="flex items-center gap-0.5">
                              <motion.button
                                onClick={(e) => startEditingSessionInList(session, e)}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                                title="重命名"
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                              >
                                <i className="fas fa-pen text-xs"></i>
                              </motion.button>
                              <motion.button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  deleteSession(session.id)
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                                aria-label={t('aiCollab.actions.deleteSession')}
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                title="删除"
                              >
                                <i className="fas fa-trash text-xs"></i>
                              </motion.button>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* 左侧底部操作 */}
                <div className="p-3.5 border-t dark:border-gray-800/50 space-y-2">
                  <motion.button
                    onClick={clearCurrentSession}
                    className={`w-full text-sm py-2.5 rounded-xl transition-all duration-300 font-medium flex items-center justify-center gap-2 ${isDark ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30 hover:text-red-300' : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <i className="fas fa-trash-alt"></i>
                    {t('aiCollab.actions.clearCurrentSession')}
                  </motion.button>
                  <motion.button
                    onClick={deleteAllSessions}
                    className={`w-full text-sm py-2.5 rounded-xl transition-all duration-300 font-medium flex items-center justify-center gap-2 ${isDark ? 'bg-orange-900/20 text-orange-400 hover:bg-orange-900/30 hover:text-orange-300' : 'bg-orange-50 text-orange-600 hover:bg-orange-100 hover:text-orange-700'}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <i className="fas fa-trash"></i>
                    删除所有会话
                  </motion.button>
                </div>
              </div>
              
              {/* 右侧对话区域 */}
              <div className="flex-1 flex flex-col">
                {/* 对话头部 - 优化设计 */}
                <div className="p-4 border-b dark:border-gray-800/50 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm">
                  <div className="flex items-center justify-between">
                    {/* 左侧：返回按钮和会话名称 */}
                    <div className="flex items-center gap-3">
                      <motion.button
                        onClick={() => setShowSessionList(!showSessionList)}
                        className={`p-2.5 rounded-xl ${isDark ? 'bg-gray-800/80 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'} transition-all shadow-sm`}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        <i className={`fas fa-${showSessionList ? 'chevron-left' : 'bars'} text-sm`}></i>
                      </motion.button>
                      
                      {isEditingSessionName ? (
                        <div className="flex items-center gap-2">
                          <input
                            type="text"
                            value={editingSessionName}
                            onChange={(e) => setEditingSessionName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && renameSession()}
                            onBlur={renameSession}
                            className={`text-sm px-3 py-1.5 border rounded-lg ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'} focus:outline-none focus:ring-2 focus:ring-indigo-500/30`}
                            autoFocus
                          />
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-200">
                            {currentSession?.name}
                          </h3>
                          <motion.button
                            onClick={() => {
                              setIsEditingSessionName(true)
                              setEditingSessionName(currentSession?.name || '')
                            }}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 transition-all"
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <i className="fas fa-pen text-xs"></i>
                          </motion.button>
                        </div>
                      )}
                    </div>
                    
                    {/* 右侧：操作按钮组 */}
                    <div className="flex items-center gap-1.5 bg-gray-100/80 dark:bg-gray-800/80 rounded-xl p-1">
                      {/* 消息搜索 */}
                      <MessageSearch
                        messages={messages}
                        onNavigateToMessage={(index) => {
                          // 滚动到指定消息
                          const messageElements = document.querySelectorAll('[data-message-index]');
                          if (messageElements[index]) {
                            messageElements[index].scrollIntoView({ behavior: 'smooth', block: 'center' });
                          }
                        }}
                      />
                      
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                      
                      <motion.button
                        onClick={() => setShowTemplates(!showTemplates)}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                        aria-label={t('aiCollab.actions.useTemplate')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="模板"
                      >
                        <i className="fas fa-file-alt text-sm"></i>
                      </motion.button>
                      
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                      
                      <motion.button
                        onClick={() => setShowSettings(!showSettings)}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                        aria-label="设置"
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="设置"
                      >
                        <i className="fas fa-cog text-sm"></i>
                      </motion.button>
                      
                      <div className="w-px h-4 bg-gray-300 dark:bg-gray-600"></div>
                      
                      <motion.button
                        onClick={() => setShowExportOptions(!showExportOptions)}
                        className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-700 hover:shadow-sm transition-all"
                        aria-label={t('aiCollab.actions.export')}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        title="导出"
                      >
                        <i className="fas fa-download text-sm"></i>
                      </motion.button>
                    </div>
                  </div>
                </div>
                
                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* 对话模板弹窗 */}
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div
                        className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-50"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowTemplates(false)}
                      >
                        <motion.div
                          className={`w-full max-w-lg mx-4 p-8 rounded-3xl shadow-2xl ${isDark ? 'bg-gray-900/95 border border-gray-700/50' : 'bg-white/95 border border-gray-200/50'} backdrop-blur-xl`}
                          initial={{ scale: 0.9, opacity: 0, y: 20 }}
                          animate={{ scale: 1, opacity: 1, y: 0 }}
                          exit={{ scale: 0.9, opacity: 0, y: 20 }}
                          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* 头部 */}
                          <div className="flex items-center justify-between mb-6">
                            <div className="flex items-center gap-4">
                              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20' : 'bg-gradient-to-br from-indigo-100 to-purple-100'}`}>
                                <svg className="w-6 h-6 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>{t('aiCollab.templatesTitle')}</h3>
                                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>选择一个模板开始对话</p>
                              </div>
                            </div>
                            <button
                              onClick={() => setShowTemplates(false)}
                              className={`p-2 rounded-xl transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {/* 模板列表 */}
                          <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                            {conversationTemplates.map((template, index) => (
                              <motion.div
                                key={template.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.05 }}
                                className={`group p-5 rounded-2xl border-2 cursor-pointer transition-all duration-300 ${
                                  isDark 
                                    ? 'border-gray-700/50 hover:border-indigo-500/50 bg-gray-800/30 hover:bg-gray-800/50' 
                                    : 'border-gray-200 hover:border-indigo-500/30 bg-gray-50/50 hover:bg-white'
                                }`}
                                onClick={() => useTemplate(template)}
                              >
                                <div className="flex items-start gap-4">
                                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${isDark ? 'bg-indigo-500/20' : 'bg-indigo-100'}`}>
                                    <span className="text-lg">{template.icon || '💡'}</span>
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <h4 className={`font-semibold text-lg mb-1 ${isDark ? 'text-white' : 'text-gray-900'}`}>{template.name}</h4>
                                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{template.description}</p>
                                    <div className={`p-3 rounded-xl text-sm ${isDark ? 'bg-gray-900/50 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                                      <span className="opacity-70">{template.prompt.substring(0, 60)}...</span>
                                    </div>
                                  </div>
                                  <div className={`opacity-0 group-hover:opacity-100 transition-opacity ${isDark ? 'text-indigo-400' : 'text-indigo-500'}`}>
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                    </svg>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>

                          {/* 底部提示 */}
                          <div className={`mt-6 p-4 rounded-2xl ${isDark ? 'bg-indigo-500/10 border border-indigo-500/20' : 'bg-indigo-50 border border-indigo-100'}`}>
                            <div className="flex items-center gap-3">
                              <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <p className={`text-sm ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
                                点击模板即可快速开始对话，你可以在此基础上继续编辑
                              </p>
                            </div>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* 导出选项弹窗 */}
                  <AnimatePresence>
                    {showExportOptions && (
                      <motion.div
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowExportOptions(false)}
                      >
                        <motion.div
                          className={`p-5 rounded-xl shadow-2xl ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'} max-w-md w-full`}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h3 className="text-lg font-bold mb-3">{t('aiCollab.export.title')}</h3>
                          <div className="space-y-3">
                            <button
                              onClick={() => exportSession('text')}
                              className={`w-full p-3 rounded-lg transition-colors ${isDark ? 'bg-blue-900/30 hover:bg-blue-900/50 text-white' : 'bg-blue-100 hover:bg-blue-200 text-black'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{t('aiCollab.export.text')}</span>
                                <i className="fas fa-file-alt"></i>
                              </div>
                            </button>
                            <button
                              onClick={() => exportSession('markdown')}
                              className={`w-full p-3 rounded-lg transition-colors ${isDark ? 'bg-blue-900/30 hover:bg-blue-900/50 text-white' : 'bg-blue-100 hover:bg-blue-200 text-black'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{t('aiCollab.export.markdown')}</span>
                                <i className="fab fa-markdown"></i>
                              </div>
                            </button>
                            <button
                              onClick={() => exportSession('json')}
                              className={`w-full p-3 rounded-lg transition-colors ${isDark ? 'bg-blue-900/30 hover:bg-blue-900/50 text-white' : 'bg-blue-100 hover:bg-blue-200 text-black'}`}
                            >
                              <div className="flex items-center justify-between">
                                <span>{t('aiCollab.export.json')}</span>
                                <i className="fas fa-code"></i>
                              </div>
                            </button>
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => setShowExportOptions(false)}
                              className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}
                            >
                              {t('aiCollab.actions.cancel')}
                            </button>
                          </div>
                        </motion.div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                  
                  {/* 消息内容 */}
                  {showSettings ? (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3 }}
                      className="p-5"
                    >
                      <AISettingsPanel
                        personality={personality}
                        theme={assistantTheme}
                        showPresetQuestions={showPresetQuestions}
                        enableTypingEffect={enableTypingEffect}
                        autoScroll={autoScroll}
                        onSettingChange={handleSettingChange}
                        onClose={() => setShowSettings(false)}
                      />
                    </motion.div>
                  ) : messages.length <= 1 && !messages.some(m => (m as any).generationTask) ? (
                    <div className="flex flex-col items-center justify-center h-full text-center overflow-y-auto">
                      <i className="fas fa-comments text-4xl text-gray-400 mb-2"></i>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
                        {t('aiCollab.empty.title')}
                      </p>
                      {(context?.page || context?.path) && (
                        <p className="text-xs text-gray-400 dark:text-gray-500 mb-4">
                          {t('aiCollab.empty.currentPage', { page: context?.page || context?.path })}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center justify-center gap-2 mb-4 px-6">
                        {presetQuestions.slice(0, 5).map((q) => (
                          <button
                            key={q}
                            onClick={() => setInput(q)}
                            className={`px-3 py-1.5 rounded-full text-xs transition-colors ${
                              isDark
                                ? 'bg-gray-800 text-gray-200 hover:bg-gray-700 border border-gray-700'
                                : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-200'
                            }`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                      <button
                        onClick={() => setShowTemplates(true)}
                        className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-blue-900/30 hover:bg-blue-900/50 text-white' : 'bg-blue-100 hover:bg-blue-200 text-black'}`}
                      >
                        <i className="fas fa-file-alt mr-2"></i>
                        {t('aiCollab.actions.openTemplates')}
                      </button>
                      {recs.length > 0 && user && (
                        <div className="mt-6 w-full max-w-2xl px-4">
                          <h4 className={`text-sm font-medium mb-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>为你推荐</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {recs.slice(0, 6).map(item => (
                              <button
                                key={`${item.type}_${item.id}`}
                                onClick={() => {
                                  recordRecommendationClick(user.id, item)
                                  setInput(`请介绍一下「${item.title}」相关内容，并给我适合的创作灵感。`)
                                }}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-all border ${
                                  isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'
                                }`}
                              >
                                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-200 flex-shrink-0">
                                  {item.thumbnail ? (
                                    <img 
                                      src={item.thumbnail} 
                                      alt={item.title} 
                                      className="w-full h-full object-cover"
                                      onError={(e) => {
                                        // 图片加载失败时显示默认图标
                                        (e.target as HTMLImageElement).style.display = 'none';
                                        (e.target as HTMLImageElement).parentElement!.innerHTML = '<div class="w-full h-full flex items-center justify-center text-gray-400"><i class="fas fa-image"></i></div>';
                                      }}
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <i className="fas fa-image"></i>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 text-left overflow-hidden">
                                  <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`} title={item.title}>{item.title}</div>
                                  <div className="text-xs text-gray-500 truncate mt-0.5" title={item.reason || '个性化推荐'}>{item.reason || '个性化推荐'}</div>
                                </div>
                                <div className="text-[10px] px-2 py-0.5 rounded-full border border-gray-300 text-gray-500 flex-shrink-0">{item.type}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <React.Fragment key={index}>
                        {/* 普通消息 */}
                        <div data-message-index={index}>
                          <AICollaborationMessage
                            message={message}
                            index={index}
                            userAvatar={user?.avatar}
                            feedbackRating={feedbackRatings[index]}
                            feedbackComment={feedbackComments[index]}
                            isFeedbackVisible={feedbackVisible[index]}
                            onRating={handleRating}
                            onFeedbackSubmit={(idx) => handleFeedbackSubmit(idx)}
                            onFeedbackCommentChange={(idx, val) => setFeedbackComments(prev => ({...prev, [idx]: val}))}
                            onFeedbackToggle={(idx, visible) => setFeedbackVisible(prev => ({...prev, [idx]: visible}))}
                            onDelete={handleDeleteMessage}
                          />
                        </div>
                        {/* 生成任务卡片 */}
                        {(message as any).generationTask && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="ml-14 mb-4 max-w-[55%]"
                          >
                            {(() => {
                              const task = (message as any).generationTask;
                              console.log('[AICollaborationPanel] 渲染生成任务卡片:', task.id, '状态:', task.status);
                              return (
                                <InlineGenerationCard
                                  task={task}
                                  onSave={() => handleSaveGeneration(task)}
                                  onPublish={() => handlePublishGeneration(task)}
                                  onShare={() => handleShareGeneration(task)}
                                  onShareToFriend={() => handleShareToFriendGeneration(task)}
                                  onDelete={() => handleDeleteGeneration(task)}
                                />
                              );
                            })()}
                          </motion.div>
                        )}
                      </React.Fragment>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* 输入区域 - 优化设计 */}
                <div className="p-4 border-t dark:border-gray-800/50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md">
                  {/* 快捷工具栏 */}
                  <div className="flex items-center gap-2 mb-3">
                    <InspirationCard 
                      onSelect={(text) => setInput(prev => prev ? prev + ' ' + text : text)}
                    />
                    <SpeechInput 
                      onTextRecognized={(text) => setInput(prev => prev + text)} 
                      language={i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US'}
                    />
                  </div>
                  
                  <div className="flex items-end gap-3">
                    <div className="flex-1 relative">
                      {/* 智能输入框 */}
                      <SmartInput
                        value={input}
                        onChange={setInput}
                        onSubmit={sendMessage}
                        placeholder={t('aiCollab.placeholders.input') || '输入消息，输入 / 查看快捷指令...'}
                      />
                    </div>
                    
                    {/* 发送按钮 - 优化样式 */}
                    <motion.button
                      onClick={sendMessage}
                      disabled={isGenerating || !input.trim()}
                      className={`px-5 py-4 rounded-xl transition-all duration-300 font-semibold shadow-lg flex-shrink-0 flex items-center gap-2 ${isGenerating || !input.trim() 
                        ? (isDark ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed') 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white hover:shadow-indigo-500/30 hover:shadow-xl'
                      }`}
                      whileHover={!isGenerating && input.trim() ? { scale: 1.02, y: -1 } : {}}
                      whileTap={!isGenerating && input.trim() ? { scale: 0.98 } : {}}
                      transition={{ type: 'spring', stiffness: 400, damping: 17 }}
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-2">
                          <motion.div
                            className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          />
                          <span className="text-sm">生成中</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">发送</span>
                          <i className="fas fa-paper-plane text-sm"></i>
                        </div>
                      )}
                    </motion.button>
                  </div>
                  
                  {/* 快捷提示 */}
                  <div className="flex items-center justify-between mt-2 px-1">
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <i className="fas fa-keyboard"></i>
                        Enter 发送
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-level-down-alt rotate-90"></i>
                        Shift + Enter 换行
                      </span>
                      <span className="flex items-center gap-1">
                        <i className="fas fa-bolt"></i>
                        / 快捷指令
                      </span>
                    </div>
                    <div className="text-xs text-gray-400">
                      支持 Markdown 格式
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 新建会话模态框 */}
            <AnimatePresence>
              {showNewSessionModal && (
                <motion.div
                  className="fixed inset-0 flex items-center justify-center bg-black/60 backdrop-blur-sm z-[70]"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setShowNewSessionModal(false)}
                >
                  <motion.div
                    className={`w-full max-w-md mx-4 p-8 rounded-3xl shadow-2xl ${isDark ? 'bg-gray-900/95 border border-gray-700/50' : 'bg-white/95 border border-gray-200/50'} backdrop-blur-xl`}
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* 头部图标 */}
                    <div className="flex flex-col items-center mb-8">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 ${isDark ? 'bg-gradient-to-br from-indigo-500/20 to-purple-500/20' : 'bg-gradient-to-br from-indigo-100 to-purple-100'}`}>
                        <svg className="w-8 h-8 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                      </div>
                      <h3 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {t('aiCollab.newSession.title')}
                      </h3>
                      <p className={`text-sm mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        为你的新对话起一个名字吧
                      </p>
                    </div>

                    <div className="space-y-6">
                      {/* 输入框 */}
                      <div className="relative">
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {t('aiCollab.newSession.nameLabel')}
                        </label>
                        <div className="relative">
                          <input
                            type="text"
                            value={newSessionName}
                            onChange={(e) => setNewSessionName(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && createNewSession()}
                            placeholder={t('aiCollab.newSession.namePlaceholder')}
                            className={`w-full px-5 py-4 rounded-2xl border-2 outline-none transition-all duration-300 ${
                              isDark 
                                ? 'bg-gray-800/50 border-gray-700 text-white placeholder-gray-500 focus:border-indigo-500 focus:bg-gray-800' 
                                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-indigo-500 focus:bg-white'
                            }`}
                            autoFocus
                          />
                          {newSessionName && (
                            <button
                              onClick={() => setNewSessionName('')}
                              className={`absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${
                                isDark ? 'text-gray-500 hover:text-gray-300' : 'text-gray-400 hover:text-gray-600'
                              }`}
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      </div>

                      {/* 快捷建议 */}
                      <div>
                        <label className={`block text-xs font-medium mb-3 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                          快速选择
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {['新对话', '创意构思', '文案撰写', '设计灵感', '文化知识'].map((suggestion) => (
                            <button
                              key={suggestion}
                              onClick={() => setNewSessionName(suggestion)}
                              className={`px-4 py-2 rounded-xl text-sm transition-all duration-200 ${
                                newSessionName === suggestion
                                  ? 'bg-indigo-500 text-white shadow-lg shadow-indigo-500/30'
                                  : isDark
                                    ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'
                              }`}
                            >
                              {suggestion}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 按钮组 */}
                      <div className="flex items-center gap-3 pt-4">
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={() => setShowNewSessionModal(false)}
                          className={`flex-1 py-3.5 px-6 rounded-2xl font-medium transition-all duration-200 ${
                            isDark 
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' 
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200'
                          }`}
                        >
                          {t('aiCollab.actions.cancel')}
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.02 }}
                          whileTap={{ scale: 0.98 }}
                          onClick={createNewSession}
                          disabled={!newSessionName.trim()}
                          className={`flex-1 py-3.5 px-6 rounded-2xl font-medium transition-all duration-200 ${
                            !newSessionName.trim()
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30 hover:shadow-xl hover:shadow-indigo-500/40'
                          }`}
                        >
                          {t('aiCollab.actions.create')}
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            
            {/* 分享对话框 */}
            <ShareDialog
              isOpen={showShareDialog}
              onClose={() => setShowShareDialog(false)}
              content={shareContent}
              mode="community"
            />
            
            {/* 好友分享对话框 */}
            <ShareDialog
              isOpen={showFriendShareDialog}
              onClose={() => setShowFriendShareDialog(false)}
              content={shareContent}
              mode="friend"
            />

            {/* 发布作品模态框 */}
            <AnimatePresence>
              {showPublishModal && publishTask && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
                  onClick={() => setShowPublishModal(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className={`w-full max-w-md max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
                      isDark ? 'bg-gray-900' : 'bg-white'
                    }`}
                    onClick={e => e.stopPropagation()}
                  >
                    {/* 头部 */}
                    <div className={`flex items-center justify-between p-5 border-b ${
                      isDark ? 'border-gray-800' : 'border-gray-100'
                    }`}>
                      <h3 className={`text-lg font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        发布作品到津脉广场
                      </h3>
                      <button
                        onClick={() => setShowPublishModal(false)}
                        className={`p-2 rounded-lg transition-colors ${
                          isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                        }`}
                      >
                        <i className="fas fa-times" />
                      </button>
                    </div>

                    {/* 内容 */}
                    <div className="p-5 space-y-4">
                      {/* 图片/视频预览 */}
                      <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                        {publishTask.type === 'video' ? (
                          <video
                            src={publishTask.result?.urls[0]}
                            className="w-full h-48 object-cover"
                            controls
                          />
                        ) : (
                          <img
                            src={publishTask.result?.urls[0]}
                            alt="Preview"
                            className="w-full h-48 object-cover"
                          />
                        )}
                      </div>

                      {/* 标题输入 */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          作品标题
                          {isGeneratingMetadata && (
                            <span className="ml-2 text-xs text-violet-500">
                              <i className="fas fa-spinner fa-spin mr-1" />
                              千问AI生成中...
                            </span>
                          )}
                        </label>
                        <input
                          type="text"
                          value={publishTitle}
                          onChange={(e) => setPublishTitle(e.target.value)}
                          placeholder="输入作品标题"
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-all ${
                            isDark
                              ? 'bg-gray-800 border-gray-700 text-white focus:border-violet-500'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-violet-500'
                          } outline-none`}
                        />
                      </div>

                      {/* 描述输入 */}
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          作品描述
                        </label>
                        <textarea
                          value={publishDescription}
                          onChange={(e) => setPublishDescription(e.target.value)}
                          placeholder="描述你的作品..."
                          rows={3}
                          className={`w-full px-4 py-3 rounded-xl border-2 transition-all resize-none ${
                            isDark
                              ? 'bg-gray-800 border-gray-700 text-white focus:border-violet-500'
                              : 'bg-white border-gray-200 text-gray-900 focus:border-violet-500'
                          } outline-none`}
                        />
                      </div>

                      {/* 标签显示 */}
                      {publishTags.length > 0 && (
                        <div>
                          <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            标签
                          </label>
                          <div className="flex flex-wrap gap-2">
                            {publishTags.map((tag, index) => (
                              <span
                                key={index}
                                className={`px-3 py-1 rounded-full text-sm ${
                                  isDark
                                    ? 'bg-violet-500/20 text-violet-400'
                                    : 'bg-violet-100 text-violet-600'
                                }`}
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 按钮组 */}
                      <div className="flex gap-3 pt-2">
                        <button
                          onClick={() => setShowPublishModal(false)}
                          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                            isDark
                              ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                          }`}
                        >
                          取消
                        </button>
                        <button
                          onClick={confirmPublish}
                          disabled={isPublishing || !publishTitle.trim()}
                          className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                            isPublishing || !publishTitle.trim()
                              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                              : 'bg-gradient-to-r from-violet-500 to-indigo-600 text-white'
                          }`}
                        >
                          {isPublishing ? (
                            <>
                              <i className="fas fa-spinner fa-spin mr-2" />
                              发布中...
                            </>
                          ) : (
                            '确认发布'
                          )}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
