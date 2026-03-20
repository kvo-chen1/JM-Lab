import { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { useNavigate, useLocation } from 'react-router-dom'
import { llmService, Message as BaseMessage } from '@/services/llmService'
import { aiAssistantService } from '@/services/aiAssistantService'
import { sessionService } from '@/services/sessionService'
import { aiConversationService } from '@/services/aiConversationService'
import pendingMessageService from '@/services/pendingMessageService'
import { toast } from 'sonner'
import { AuthContext } from '@/contexts/authContext'
import AICollaborationMessage from '@/components/AICollaborationMessage'
import VoiceOutputButton from '@/components/VoiceOutputButton'
import SessionSidebar from '@/components/SessionSidebar'
import { InlineGenerationCard } from '@/components/InlineGenerationCard'
import AIMessageActions from '@/components/AIMessageActions'
import { downloadAndUploadImage } from '@/services/imageService'
import { createWorkWithUrl } from '@/services/postService'
import { IPMascotVideoLoader } from '@/components/ip-mascot'

// 扩展 Message 类型，支持生成任务
interface GenerationTaskInfo {
  id: string
  type: 'image' | 'video' | 'text'
  status: 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled'
  progress: number
  params: { 
    prompt: string
    negativePrompt?: string
    size?: '1024x1024' | '1024x768' | '768x1024' | '1280x720' | '720x1280'
    n?: number
    style?: 'auto' | 'photography' | 'illustration' | '3d' | 'painting' | 'sketch'
    quality?: 'standard' | 'hd' | 'ultra'
    seed?: number
    duration?: 5 | 10 | 15
    resolution?: '720p' | '1080p'
    aspectRatio?: '16:9' | '9:16' | '1:1'
    imageUrl?: string
    model?: string
  }
  result?: {
    urls: string[]
    revisedPrompt?: string
    seed?: number
    metadata?: Record<string, any>
  }
  error?: string
  errorType?: string
  createdAt: number
  updatedAt: number
  estimatedTime?: number
}

interface QuickOption {
  icon: string
  label: string
  prompt: string
}

interface Message extends BaseMessage {
  id: string
  generationTask?: GenerationTaskInfo
  quickOptions?: QuickOption[]
}

// 预设问题 - 分类展示
const PRESET_QUESTIONS = {
  creative: {
    title: '✨ 快速生成',
    icon: '🎨',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
    items: [
      { icon: '🌃', text: '生成一张天津海河夜景图', type: 'generate' },
      { icon: '🏮', text: '画一幅杨柳青年画风格的福字', type: 'generate' },
      { icon: '🥟', text: '生成国潮风格的天津美食海报', type: 'generate' },
      { icon: '🏛️', text: '生成一张五大道建筑插画', type: 'generate' }
    ]
  },
  culture: {
    title: '🏛️ 文化探索',
    icon: '📚',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    items: [
      { icon: '🎭', text: '天津有哪些非遗文化？', type: 'chat' },
      { icon: '🏮', text: '杨柳青年画有什么特点？', type: 'chat' },
      { icon: '🎨', text: '如何在设计中融入天津元素？', type: 'chat' }
    ]
  },
  tools: {
    title: '🛠️ 创作工具',
    icon: '🎯',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    items: [
      { icon: '✍️', text: '帮我写一段天津文创品牌故事', type: 'chat' },
      { icon: '💡', text: '给我一些国潮设计灵感', type: 'chat' },
      { icon: '🎨', text: '推荐适合的风格和配色', type: 'chat' }
    ]
  }
}

// 动画配置
const ANIMATION_CONFIG = {
  spring: { type: 'spring', stiffness: 400, damping: 30 },
  fadeInUp: { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } },
  fadeIn: { initial: { opacity: 0 }, animate: { opacity: 1 } },
  scale: { initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 } }
}

export default function AIAssistant() {
  console.log('[AIAssistant Desktop] 组件开始渲染')
  
  const { isDark, theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useContext(AuthContext)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)
  const mainRef = useRef<HTMLElement>(null)

  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [showPresetQuestions, setShowPresetQuestions] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)

  // 会话管理状态
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [sessionTitle, setSessionTitle] = useState('新会话')

  // 使用 ref 防止重复生成
  const processingTasksRef = useRef<Set<string>>(new Set())
  const autoGenerateTriggeredRef = useRef(false)

  // 生成任务状态管理
  const [activeGenerationTasks, setActiveGenerationTasks] = useState<Record<string, GenerationTaskInfo>>({})

  // 发布模态框状态
  const [isPublishModalOpen, setIsPublishModalOpen] = useState(false)
  const [publishContent, setPublishContent] = useState<{
    imageUrl: string
    prompt: string
    type: 'image' | 'video'
  } | null>(null)
  const [publishTitle, setPublishTitle] = useState('')
  const [publishDescription, setPublishDescription] = useState('')
  const [publishTags, setPublishTags] = useState<string[]>([])
  const [isGeneratingMetadata, setIsGeneratingMetadata] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // 初始化加载会话
  useEffect(() => {
    const savedSessionId = sessionService.getCurrentSessionId()
    console.log('[AIAssistant Desktop] 当前会话ID:', savedSessionId)

    if (savedSessionId) {
      const session = sessionService.getSession(savedSessionId)
      console.log('[AIAssistant Desktop] 获取到的会话:', session)
      if (session && session.messages.length > 0) {
        console.log('[AIAssistant Desktop] 消息数量:', session.messages.length)
        
        // 检查并修复旧的欢迎消息格式，同时确保 generationTask 被正确保留
        const updatedMessages = session.messages.map(msg => {
          // 深拷贝消息对象，确保 generationTask 被保留
          const updatedMsg = { ...msg }
          
          if (msg.generationTask) {
            updatedMsg.generationTask = { ...msg.generationTask }
            // 确保 result 被正确解析
            if (msg.generationTask.result && typeof msg.generationTask.result === 'string') {
              try {
                updatedMsg.generationTask.result = JSON.parse(msg.generationTask.result)
              } catch (e) {
                console.error('[AIAssistant Desktop] 解析消息中的 result 失败:', e)
              }
            }
          }
          
          // 修复旧的欢迎消息格式
          if (msg.id === 'welcome' && msg.content.includes('🎨 **创意生成**') && !msg.content.includes('- 🎨')) {
            updatedMsg.content = msg.content.replace(
              /🎨 \*\*创意生成\*\* — 文案、设计灵感、视觉方案\n🏛️ \*\*文化智库\*\* — 天津非遗、老字号、传统元素\n💡 \*\*创作优化\*\* — 作品点评、改进建议、趋势分析\n📝 \*\*品牌策划\*\* — 故事撰写、营销策略、IP孵化/,
              `- 🎨 **创意生成** — 文案、设计灵感、视觉方案\n- 🏛️ **文化智库** — 天津非遗、老字号、传统元素\n- 💡 **创作优化** — 作品点评、改进建议、趋势分析\n- 📝 **品牌策划** — 故事撰写、营销策略、IP孵化`
            )
          }
          
          return updatedMsg
        })
        
        if (JSON.stringify(updatedMessages) !== JSON.stringify(session.messages)) {
          if (typeof sessionService.updateSessionMessages === 'function') {
            sessionService.updateSessionMessages(session.id, updatedMessages)
          }
        }
        
        setCurrentSessionId(session.id)
        setMessages(updatedMessages)
        setSessionTitle(session.title)
        setShowPresetQuestions(false)

        // 从消息中恢复生成任务状态（使用 updatedMessages 确保 generationTask 被正确解析）
        const tasksFromMessages: Record<string, GenerationTaskInfo> = {}
        updatedMessages.forEach(msg => {
          if (msg.generationTask) {
            // 深拷贝生成任务，确保 result 被正确解析
            const task = { ...msg.generationTask }
            if (task.result && typeof task.result === 'string') {
              try {
                task.result = JSON.parse(task.result)
              } catch (e) {
                console.error('[AIAssistant Desktop] 解析 task.result 失败:', e)
              }
            }
            tasksFromMessages[task.id] = task
          }
        })
        if (Object.keys(tasksFromMessages).length > 0) {
          setActiveGenerationTasks(prev => ({
            ...prev,
            ...tasksFromMessages
          }))
        }
      } else {
        createNewSession()
      }
    } else {
      createNewSession()
    }
  }, [])

  // 创建新会话
  const createNewSession = () => {
    const welcomeMessage: Message = {
      id: 'welcome',
      role: 'assistant',
      content: `你好！我是**津小脉** ✨

津脉智坊平台的专属AI助手，专注于传统文化创作与设计。

**我能为你做什么？**

- 🎨 **创意生成** — 文案、设计灵感、视觉方案
- 🏛️ **文化智库** — 天津非遗、老字号、传统元素
- 💡 **创作优化** — 作品点评、改进建议、趋势分析
- 📝 **品牌策划** — 故事撰写、营销策略、IP孵化

有什么我可以帮你的吗？`,
      timestamp: Date.now()
    }

    const session = sessionService.createSession([welcomeMessage])
    setCurrentSessionId(session.id)
    setMessages([welcomeMessage])
    setSessionTitle(session.title)
    setShowPresetQuestions(true)
    
    // 异步保存新会话到数据库
    (async () => {
      try {
        const cloudConversation = await aiConversationService.createConversation(session.title, 'qwen');
        if (cloudConversation && welcomeMessage) {
          await aiConversationService.saveMessage(cloudConversation.id, welcomeMessage);
          console.log('[AIAssistant] Created new session in database');
        }
      } catch (error) {
        console.error('[AIAssistant] Failed to create session in database:', error);
      }
    })();
  }

  // 切换会话
  const handleSessionSelect = (sessionId: string) => {
    const session = sessionService.getSession(sessionId)
    if (session) {
      setCurrentSessionId(session.id)
      setMessages(session.messages)
      setSessionTitle(session.title)
      setShowPresetQuestions(session.messages.length <= 1)
      sessionService.setCurrentSessionId(session.id)
      toast.success(`已切换到: ${session.title}`)
    }
  }

  // 保存消息到当前会话
  const saveMessagesToSession = useCallback((newMessages: Message[]) => {
    if (currentSessionId) {
      const messagesWithTask = newMessages.filter(m => m.generationTask)
      console.log('[AIAssistant Desktop] 保存消息到会话，有 generationTask 的消息数:', messagesWithTask.length)
      
      if (typeof sessionService.updateSessionMessages === 'function') {
        sessionService.updateSessionMessages(currentSessionId, newMessages)
      } else {
        console.error('[AIAssistant Desktop] updateSessionMessages 不是函数:', sessionService)
      }
      
      // 异步保存到数据库
      (async () => {
        try {
          const cloudConversation = await aiConversationService.getActiveConversation();
          if (cloudConversation) {
            await aiConversationService.saveMessages(cloudConversation.id, newMessages);
            console.log('[AIAssistant Desktop] Saved messages to database');
          }
        } catch (error) {
          console.error('[AIAssistant Desktop] Failed to save messages to database:', error);
        }
      })();
    }
  }, [currentSessionId])

  // 自动滚动到底部
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' })
    }
  }, [messages, isGenerating])

  // 监听滚动 - 用于头部效果
  useEffect(() => {
    const main = mainRef.current
    if (!main) return

    const handleScroll = () => {
      setIsScrolled(main.scrollTop > 20)
    }

    main.addEventListener('scroll', handleScroll, { passive: true })
    return () => main.removeEventListener('scroll', handleScroll)
  }, [])

  // 从 localStorage 恢复生成任务
  useEffect(() => {
    const savedTasks = localStorage.getItem('aiAssistantGenerationTasks')
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks)
        const now = Date.now()
        const validTasks: Record<string, GenerationTaskInfo> = {}
        
        Object.keys(parsed).forEach(key => {
          const task = parsed[key]
          if (task.result && typeof task.result === 'string') {
            try {
              task.result = JSON.parse(task.result)
            } catch (e) {
              console.error('[AIAssistant Desktop] 解析 result 字符串失败:', e)
            }
          }
          
          // 只恢复真正正在进行的任务（5分钟内且状态为processing）
          const taskAge = now - (task.updatedAt || task.createdAt)
          const isRecent = taskAge < 5 * 60 * 1000 // 5分钟内
          const isProcessing = task.status === 'processing'
          
          if (isProcessing && isRecent) {
            validTasks[key] = task
          } else if (task.status === 'completed' || task.status === 'failed') {
            // 已完成的任务也保留，但不显示动画
            validTasks[key] = task
          }
          // 其他情况（超时或已取消）不恢复
        })
        
        setActiveGenerationTasks(validTasks)
      } catch (e) {
        console.error('恢复生成任务失败:', e)
      }
    }
  }, [])

  // 保存生成任务到 localStorage
  useEffect(() => {
    if (Object.keys(activeGenerationTasks).length > 0) {
      localStorage.setItem('aiAssistantGenerationTasks', JSON.stringify(activeGenerationTasks))
    }
  }, [activeGenerationTasks])

  // 使用 useRef 来跟踪 interval
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  // 使用 useEffect 监听正在处理中的任务并更新进度
  useEffect(() => {
    const processingTasks = Object.entries(activeGenerationTasks).filter(
      ([, task]) => task.status === 'processing' && task.progress < 90
    )
    
    if (processingTasks.length === 0) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      return
    }
    
    if (progressIntervalRef.current) {
      return
    }
    
    console.log('[AIAssistant Desktop] 开始进度更新，任务数:', processingTasks.length)
    
    progressIntervalRef.current = setInterval(() => {
      setActiveGenerationTasks(prev => {
        const updated = { ...prev }
        let hasUpdate = false
        let hasProcessingTask = false
        
        Object.entries(updated).forEach(([id, task]) => {
          if (task.status === 'processing' && task.progress < 90) {
            const newProgress = Math.min(90, task.progress + Math.random() * 10 + 5)
            updated[id] = { ...task, progress: newProgress }
            hasUpdate = true
            hasProcessingTask = true
          }
        })
        
        if (!hasProcessingTask && progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
        
        return hasUpdate ? updated : prev
      })
    }, 2000)
    
    return () => {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [activeGenerationTasks])

  // 在聊天中生成图片
  const generateImageInChat = useCallback(async (taskId: string, prompt: string) => {
    if (processingTasksRef.current.has(taskId)) {
      console.log('[AIAssistant Desktop] 任务已在处理中，跳过重复调用:', taskId)
      return
    }
    processingTasksRef.current.add(taskId)
    
    console.log('[AIAssistant Desktop] 开始生成图片，taskId:', taskId, 'prompt:', prompt)
    try {
      const now = Date.now()
      setActiveGenerationTasks(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          status: 'processing',
          progress: 10,
          updatedAt: now
        }
      }))

      const result = await llmService.generateImage({
        prompt,
        n: 1,
        size: '1024x1024',
        response_format: 'url'
      })

      if (result.ok && result.data) {
        const data: any = result.data
        const items: any[] = (data && (data.data || data.images || [])) as any[]
        
        if (items.length > 0 && items[0].url) {
          const imageUrl = items[0].url
          const taskResult = {
            urls: [imageUrl],
            revisedPrompt: prompt
          }
          
          const now = Date.now()
          setActiveGenerationTasks(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              status: 'completed',
              progress: 100,
              result: taskResult,
              updatedAt: now
            }
          }))
          
          setMessages(prev => {
            const updatedMessages = prev.map(msg => {
              if (msg.generationTask?.id === taskId) {
                return {
                  ...msg,
                  generationTask: {
                    ...msg.generationTask,
                    status: 'completed',
                    progress: 100,
                    result: taskResult,
                    updatedAt: now
                  }
                }
              }
              return msg
            })
            saveMessagesToSession(updatedMessages)
            return updatedMessages
          })
          
          toast.success('图片生成完成！')
          
          // 自动保存到永久存储
          const saveImageToStorage = async () => {
            try {
              const permanentUrl = await downloadAndUploadImage(imageUrl, 'ai-generated')
              const permanentResult = {
                urls: [permanentUrl],
                revisedPrompt: prompt,
                originalUrl: imageUrl
              }
              
              setActiveGenerationTasks(prev => ({
                ...prev,
                [taskId]: {
                  ...prev[taskId],
                  result: permanentResult,
                  updatedAt: Date.now()
                }
              }))
              
              setMessages(prev => {
                const updatedMessages = prev.map(msg => {
                  if (msg.generationTask?.id === taskId) {
                    return {
                      ...msg,
                      generationTask: {
                        ...msg.generationTask,
                        result: permanentResult,
                        updatedAt: Date.now()
                      }
                    }
                  }
                  return msg
                })
                saveMessagesToSession(updatedMessages)
                return updatedMessages
              })
              
              toast.success('图片已自动保存到云端')
            } catch (saveError) {
              console.error('[AIAssistant Desktop] 自动保存图片失败:', saveError)
              toast.error('图片保存到云端失败，请手动保存')
            }
          }
          
          setTimeout(() => {
            saveImageToStorage()
          }, 1000)
          
          setTimeout(() => {
            const imageElement = document.querySelector(`[data-generation-task-id="${taskId}"]`)
            if (imageElement) {
              imageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            } else {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
          }, 300)

          // 延迟添加生成完成后的引导消息
          setTimeout(() => {
            const followUpMessage: Message = {
              id: (Date.now() + 10).toString(),
              role: 'assistant',
              content: `**✨ 图片生成完成！**

您对这张图片满意吗？您可以选择：`,
              timestamp: Date.now(),
              quickOptions: [
                { icon: '👍', label: '很满意', prompt: '这张图片我很满意，帮我保存' },
                { icon: '🎨', label: '换个风格', prompt: '重新生成，换个风格试试' },
                { icon: '✏️', label: '调整细节', prompt: '帮我调整一下细节，让画面更精致' },
                { icon: '🔄', label: '再生成一张', prompt: '基于这个主题再生成一张类似的' }
              ]
            }

            setMessages(prev => {
              const newMessages = [...prev, followUpMessage]
              saveMessagesToSession(newMessages)
              return newMessages
            })
          }, 2000)
        } else {
          throw new Error('生成结果为空')
        }
      } else {
        throw new Error(result.error || '生成失败')
      }
    } catch (error: any) {
      console.error('图片生成失败:', error)
      
      let errorMsg = error.message || '生成失败，请重试'
      let errorType = 'general'
      
      if (errorMsg.includes('inappropriate content') || 
          errorMsg.includes('敏感内容') || 
          errorMsg.includes('内容审核') ||
          errorMsg.includes('inappropriate')) {
        errorType = 'content_policy'
        errorMsg = '提示词包含敏感内容，请尝试修改描述，避免使用敏感词汇'
      } else if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
        errorType = 'timeout'
        errorMsg = '生成请求超时，请稍后重试'
      } else if (errorMsg.includes('API Key') || errorMsg.includes('Unauthorized')) {
        errorType = 'auth'
        errorMsg = 'API 认证失败，请联系管理员'
      }
      
      const now = Date.now()
      setActiveGenerationTasks(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          status: 'failed',
          error: errorMsg,
          errorType: errorType,
          updatedAt: now
        }
      }))
      
      setMessages(prev => {
        const updatedMessages = prev.map(msg => {
          if (msg.generationTask?.id === taskId) {
            return {
              ...msg,
              generationTask: {
                ...msg.generationTask,
                status: 'failed',
                error: errorMsg,
                errorType: errorType as any,
                updatedAt: now
              }
            }
          }
          return msg
        })
        saveMessagesToSession(updatedMessages)
        return updatedMessages
      })
      toast.error('图片生成失败: ' + errorMsg)
    } finally {
      processingTasksRef.current.delete(taskId)
    }
  }, [saveMessagesToSession])

  // 在聊天中生成视频
  const generateVideoInChat = useCallback(async (taskId: string, prompt: string) => {
    if (processingTasksRef.current.has(taskId)) {
      console.log('[AIAssistant Desktop] 视频任务已在处理中，跳过重复调用:', taskId)
      return
    }
    processingTasksRef.current.add(taskId)
    
    console.log('[AIAssistant Desktop] 开始生成视频，taskId:', taskId, 'prompt:', prompt)
    try {
      const now = Date.now()
      setActiveGenerationTasks(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          status: 'processing',
          progress: 10,
          updatedAt: now
        }
      }))

      const result = await llmService.generateVideo({
        prompt,
        duration: 5,
        resolution: '720p',
        aspectRatio: '16:9'
      })

      if (result.ok && result.data) {
        const data: any = result.data
        const videoUrl = data.video_url || data.url || data.videoUrl
        
        if (videoUrl) {
          const taskResult = {
            urls: [videoUrl],
            revisedPrompt: prompt
          }
          
          const now = Date.now()
          setActiveGenerationTasks(prev => ({
            ...prev,
            [taskId]: {
              ...prev[taskId],
              status: 'completed',
              progress: 100,
              result: taskResult,
              updatedAt: now
            }
          }))
          
          setMessages(prev => {
            const updatedMessages = prev.map(msg => {
              if (msg.generationTask?.id === taskId) {
                return {
                  ...msg,
                  generationTask: {
                    ...msg.generationTask,
                    status: 'completed',
                    progress: 100,
                    result: taskResult,
                    updatedAt: now
                  }
                }
              }
              return msg
            })
            saveMessagesToSession(updatedMessages)
            return updatedMessages
          })
          
          toast.success('视频生成完成！')

          setTimeout(() => {
            const videoElement = document.querySelector(`[data-generation-task-id="${taskId}"]`)
            if (videoElement) {
              videoElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            } else {
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
          }, 300)

          setTimeout(() => {
            const followUpMessage: Message = {
              id: (Date.now() + 10).toString(),
              role: 'assistant',
              content: `**🎬 视频生成完成！**

您对这段视频满意吗？您可以选择：`,
              timestamp: Date.now(),
              quickOptions: [
                { icon: '👍', label: '很满意', prompt: '这段视频我很满意，帮我保存' },
                { icon: '🎨', label: '换个风格', prompt: '重新生成，换个风格试试' },
                { icon: '✏️', label: '调整细节', prompt: '帮我调整一下细节，让画面更流畅' },
                { icon: '🔄', label: '再生成一段', prompt: '基于这个主题再生成一段类似的视频' }
              ]
            }

            setMessages(prev => {
              const newMessages = [...prev, followUpMessage]
              saveMessagesToSession(newMessages)
              return newMessages
            })
          }, 2000)
        } else {
          throw new Error('视频生成结果为空')
        }
      } else {
        throw new Error(result.error || '视频生成失败')
      }
    } catch (error: any) {
      console.error('视频生成失败:', error)
      
      let errorMsg = error.message || '视频生成失败，请重试'
      let errorType = 'general'
      
      if (errorMsg.includes('inappropriate content') || 
          errorMsg.includes('敏感内容') || 
          errorMsg.includes('内容审核') ||
          errorMsg.includes('inappropriate')) {
        errorType = 'content_policy'
        errorMsg = '提示词包含敏感内容，请尝试修改描述，避免使用敏感词汇'
      } else if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
        errorType = 'timeout'
        errorMsg = '视频生成请求超时，请稍后重试'
      } else if (errorMsg.includes('API Key') || errorMsg.includes('Unauthorized')) {
        errorType = 'auth'
        errorMsg = 'API 认证失败，请联系管理员'
      }
      
      const now = Date.now()
      setActiveGenerationTasks(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          status: 'failed',
          error: errorMsg,
          errorType: errorType,
          updatedAt: now
        }
      }))
      
      setMessages(prev => {
        const updatedMessages = prev.map(msg => {
          if (msg.generationTask?.id === taskId) {
            return {
              ...msg,
              generationTask: {
                ...msg.generationTask,
                status: 'failed',
                error: errorMsg,
                errorType: errorType as any,
                updatedAt: now
              }
            }
          }
          return msg
        })
        saveMessagesToSession(updatedMessages)
        return updatedMessages
      })
      toast.error('视频生成失败: ' + errorMsg)
    } finally {
      processingTasksRef.current.delete(taskId)
    }
  }, [saveMessagesToSession])

  // 生成发布元数据
  const generatePublishMetadata = async (prompt: string, type: 'image' | 'video') => {
    setIsGeneratingMetadata(true)
    try {
      const result = await llmService.generateTitleAndTags(prompt, type)
      setPublishTitle(result.title)
      setPublishTags(result.tags)
      setPublishDescription(prompt)
      toast.success('已使用千问AI生成标题和标签')
    } catch (error) {
      console.error('生成元数据失败:', error)
      toast.error('AI生成标题失败，请手动输入')
      setPublishTitle(type === 'video' ? '创意视频作品' : 'AI创意作品')
      setPublishDescription(prompt)
      setPublishTags(['AI创作', type === 'video' ? '数字艺术' : '概念设计'])
    } finally {
      setIsGeneratingMetadata(false)
    }
  }

  // 打开发布模态框
  const openPublishModal = async (imageUrl: string, prompt: string, type: 'image' | 'video') => {
    setPublishContent({ imageUrl, prompt, type })
    setPublishTitle('')
    setPublishDescription('')
    setPublishTags([])
    setIsPublishModalOpen(true)
    await generatePublishMetadata(prompt, type)
  }

  // 提交发布
  const handlePublishSubmit = async () => {
    if (!publishContent || !publishTitle.trim()) {
      toast.error('请输入作品标题')
      return
    }

    if (!user) {
      toast.error('请先登录后再发布作品')
      return
    }

    setIsSubmitting(true)
    try {
      let finalThumbnail = publishContent.imageUrl
      let finalVideoUrl = publishContent.type === 'video' ? publishContent.imageUrl : undefined
      
      if (!finalThumbnail.includes('supabase.co')) {
        try {
          if (publishContent.type === 'video') {
            const { downloadAndUploadVideo } = await import('@/services/imageService')
            const uploadedUrl = await downloadAndUploadVideo(finalThumbnail, user.id)
            if (uploadedUrl) {
              finalVideoUrl = uploadedUrl
              finalThumbnail = uploadedUrl
            }
          } else {
            const { downloadAndUploadImage } = await import('@/services/imageService')
            const uploadedUrl = await downloadAndUploadImage(finalThumbnail, user.id)
            if (uploadedUrl) {
              finalThumbnail = uploadedUrl
            }
          }
        } catch (uploadError) {
          console.error('[AIAssistant Desktop] Failed to upload media:', uploadError)
          toast.error('媒体上传失败，请重试')
          setIsSubmitting(false)
          return
        }
      }

      const { addPost } = await import('@/services/postService')
      const postData = {
        title: publishTitle.trim(),
        thumbnail: finalThumbnail,
        videoUrl: finalVideoUrl,
        type: publishContent.type,
        category: publishContent.type === 'image' ? 'design' : 'video' as any,
        tags: publishTags,
        description: publishDescription.trim() || publishContent.prompt,
        creativeDirection: '',
        culturalElements: [],
        colorScheme: [],
        toolsUsed: [],
        publishType: 'explore' as const,
        communityId: null,
        visibility: 'public' as const,
        scheduledPublishDate: null
      }

      const post = await addPost(postData, user as any)
      if (post) {
        toast.success('作品发布成功！')
        setIsPublishModalOpen(false)
        navigate('/square')
      } else {
        toast.error('发布失败，请重试')
      }
    } catch (error) {
      console.error('发布失败:', error)
      toast.error('发布失败，请重试')
    } finally {
      setIsSubmitting(false)
    }
  }

  // 发送消息处理
  const handleSend = useCallback(async (content: string = input) => {
    if (!content.trim() || isGenerating) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: content.trim(),
      timestamp: Date.now()
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setIsGenerating(true)
    setShowPresetQuestions(false)

    // 检查是否是图片/视频生成请求
    const explicitImageKeywords = [
      '生成图片', '生成图像', '画一张', '画个', '画幅', '生成图',
      '画一', '生成一张图', '生成一张图片', '画一张图', '生成画',
      '生成海河', '生成天津', '生成国潮', '生成非遗', '生成一张', '生成个', '生成幅',
    ]
    const explicitVideoKeywords = [
      '生成视频', '生成影片', '做个视频', '做视频', '生成动画', '生成短片',
      '做段视频', '创作视频', '设计视频'
    ]

    const vagueCreationKeywords = [
      '帮我创作', '帮我生成', '帮我画图', '帮我画', '给我画', '给我生成', '给我创作',
      '想要一张', '想要个', '想要幅', '想要视频',
      '来一张', '来一幅', '来张', '来幅', '来段', '来段视频',
      '需要一张', '需要张', '需要幅', '需要视频',
      '做一张', '做张', '做幅',
      '创作一张', '创作张', '创作幅',
      '设计一张', '设计张', '设计幅',
      '开始生成', '开始创作', '开始画',  // 添加这些关键词
    ]

    const hasExplicitImageRequest = explicitImageKeywords.some(k => content.includes(k))
    const hasExplicitVideoRequest = explicitVideoKeywords.some(k => content.includes(k))
    const hasVagueCreationRequest = vagueCreationKeywords.some(k => content.includes(k))
    
    console.log('[AIAssistant Desktop] 消息分析:', { 
      content, 
      hasExplicitImageRequest, 
      hasExplicitVideoRequest, 
      hasVagueCreationRequest 
    })

    // 如果是模糊的生成请求，先引导用户
    if (hasVagueCreationRequest && !hasExplicitImageRequest && !hasExplicitVideoRequest) {
      const now = Date.now()

      const guidanceMessage: Message = {
        id: (now + 1).toString(),
        role: 'assistant',
        content: `你好呀~我是津小脉，很高兴为你创作！✨

看到你想创作，我忍不住开心地眨眨眼——这就像打开一扇通往津门烟火气与千年文脉的大门呢 🌟

既然咱们相遇，那咱们的创作，就不是"随便画点什么"，而是——
✅ 有根有魂：扎根天津的泥土，汲取杨柳青的墨香、泥人张的指温、风筝魏的风骨；
✅ 有颜有料：AI赋能+人文温度，国潮不浮夸，传统不陈旧；
✅ 有你有我：你的想法是火种，我是陪你一起添柴、调色、定稿的共创伙伴 🎨

下面这份「津门创意手账」送给你，分三步走，清晰又暖心 👇

🌈 第一步｜找到你的「津门灵感锚点」
先别急着生成！和自己聊聊天，问问：
• 今天想画天津的什么？（建筑/美食/文化/风景）
• 想加点什么风格？（国潮/水墨/油画/写实/卡通）
• 用来做什么？（海报/头像/壁纸/宣传图）

🎯 第二步｜一句话点亮创意
把你的想法告诉我，比如：
• "生成一张天津海河夜景图，国潮风格"
• "画一幅杨柳青年画风格的福字，传统红色"
• "生成国潮风格的天津美食海报，煎饼果子"

🚀 第三步｜点击生成，静待花开
我会为你调好颜料、铺好宣纸、备好茶，咱们一起，把天津的故事，一笔一笔，认真画下去 🖌️

或者，你也可以直接选择下面的快速选项，马上开始创作：`,
        timestamp: now,
        quickOptions: [
          { icon: '🌃', label: '海河夜景', prompt: '生成一张天津海河夜景图，国潮风格' },
          { icon: '🏮', label: '杨柳青年画', prompt: '画一幅杨柳青年画风格的福字，传统红色' },
          { icon: '🥟', label: '天津美食', prompt: '生成国潮风格的天津美食海报，煎饼果子' },
          { icon: '🏛️', label: '五大道', prompt: '生成一张五大道建筑插画，欧式风格' },
          { icon: '🎭', label: '泥人张', prompt: '生成泥人张风格的可爱人物' },
          { icon: '🪁', label: '风筝魏', prompt: '生成风筝魏风格的传统风筝图案' }
        ]
      }

      setMessages(prev => {
        const newMessages = [...prev, guidanceMessage]
        saveMessagesToSession(newMessages)
        return newMessages
      })

      setIsGenerating(false)
      return
    }

    // 如果是明确的图片/视频生成请求
    if (hasExplicitImageRequest || hasExplicitVideoRequest) {
      const taskId = `gen-${Date.now()}`
      const now = Date.now()
      
      const aiMessage: Message = {
        id: (now + 1).toString(),
        role: 'assistant',
        content: `正在为您${hasExplicitImageRequest ? '生成图片' : '生成视频'}，请稍候...`,
        timestamp: now,
        generationTask: {
          id: taskId,
          type: hasExplicitImageRequest ? 'image' : 'video',
          status: 'pending',
          progress: 0,
          params: { prompt: content },
          createdAt: now,
          updatedAt: now
        }
      }

      setMessages(prev => {
        const newMessages = [...prev, aiMessage]
        saveMessagesToSession(newMessages)
        return newMessages
      })

      setActiveGenerationTasks(prev => ({
        ...prev,
        [taskId]: {
          id: taskId,
          type: hasExplicitImageRequest ? 'image' : 'video',
          status: 'pending',
          progress: 0,
          params: { prompt: content },
          createdAt: now,
          updatedAt: now
        }
      }))

      if (hasExplicitImageRequest) {
        setTimeout(() => {
          generateImageInChat(taskId, content)
        }, 100)
      } else {
        setTimeout(() => {
          generateVideoInChat(taskId, content)
        }, 100)
      }

      setIsGenerating(false)
      return
    }

    // 检查是否是保存请求
    const isSaveRequest = content.includes('很满意') && content.includes('保存')
    if (isSaveRequest) {
      const lastGenerationMessage = messages.slice().reverse().find(m => m.generationTask && m.generationTask.result)
      
      if (lastGenerationMessage?.generationTask?.result) {
        const task = lastGenerationMessage.generationTask
        const result = task.result
        
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `🎉 **保存成功！**

您的作品已保存到「我的作品」中，您可以：
• 在「我的作品」页面查看和管理
• 分享给朋友或发布到社区
• 继续创作更多作品

感谢您的创作，期待您的下一个作品！✨`,
          timestamp: Date.now()
        }
        
        setMessages(prev => {
          const newMessages = [...prev, aiMessage]
          saveMessagesToSession(newMessages)
          return newMessages
        })
        
        try {
          const mediaUrl = result.urls?.[0]
          if (mediaUrl) {
            const workData = {
              title: task.params?.prompt?.substring(0, 50) || 'AI生成作品',
              description: task.params?.prompt || '',
              type: task.type === 'image' ? 'image' : 'video',
              media_url: mediaUrl,
              creator_id: user?.id,
              status: 'published'
            }
            
            const savedWork = await createWorkWithUrl(
              {
                title: workData.title,
                description: workData.description,
                categoryId: 'ai-generated'
              },
              mediaUrl,
              user?.id,
              task.type === 'video'
            )

            console.log('[AIAssistant Desktop] 作品保存成功:', savedWork)
            toast.success('作品已保存到「我的作品」')
          }
        } catch (saveError) {
          console.error('[AIAssistant Desktop] 保存作品失败:', saveError)
          toast.error('保存失败，请稍后重试')
        }
        
        setIsGenerating(false)
        return
      } else {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `抱歉，我没有找到您刚才生成的作品。请先生成图片或视频，然后再点击「很满意」保存哦~`,
          timestamp: Date.now()
        }
        
        setMessages(prev => {
          const newMessages = [...prev, aiMessage]
          saveMessagesToSession(newMessages)
          return newMessages
        })
        
        setIsGenerating(false)
        return
      }
    }

    // 普通聊天请求
    try {
      await aiAssistantService.initialize(user)
      
      const aiMessageId = (Date.now() + 1).toString()
      
      const initialAiMessage: Message = {
        id: aiMessageId,
        role: 'assistant',
        content: '',
        timestamp: Date.now()
      }
      setMessages(prev => [...prev, initialAiMessage])
      
      let streamedContent = ''
      
      const response = await aiAssistantService.processMessage(
        content.trim(),
        location.pathname,
        (delta: string) => {
          streamedContent += delta
          setMessages(prev => {
            const updatedMessages = prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: streamedContent }
                : msg
            )
            return updatedMessages
          })
        }
      )

      if (response && response.content) {
        if (response.type === 'navigation' && response.shouldNavigate && response.target) {
          setMessages(prev => {
            const updatedMessages = prev.map(msg => 
              msg.id === aiMessageId 
                ? { ...msg, content: response.content }
                : msg
            )
            saveMessagesToSession(updatedMessages)
            return updatedMessages
          })

          setTimeout(() => {
            navigate(response.target!)
          }, 1500)
          return
        }

        setMessages(prev => {
          const updatedMessages = prev.map(msg => 
            msg.id === aiMessageId 
              ? { ...msg, content: response.content }
              : msg
          )
          saveMessagesToSession(updatedMessages)
          return updatedMessages
        })
        
        // 检查AI回复是否包含生成意图，自动开始生成
        const generationKeywords = [
          '让我来为你生成',
          '正在为你生成',
          '开始生成',
          '马上为你生成',
          '这就为你生成',
          '为你生成这张'
        ]
        
        const hasGenerationIntent = generationKeywords.some(keyword => 
          response.content.includes(keyword)
        )
        
        // 检查是否已经在生成中（避免重复触发）
        const isCurrentlyGenerating = Object.values(activeGenerationTasks).some(
          task => task.status === 'processing'
        )
        
        if (hasGenerationIntent && !isCurrentlyGenerating) {
          console.log('[AIAssistant] 检测到AI生成意图，准备开始生成')
          console.log('[AIAssistant] 当前消息内容:', content)
          
          // 提取生成参数
          const prompt = content
            .replace(/帮我生成|生成一张|画一张|创作一个|开始生成|开始创作|开始画/g, '')
            .replace(/@[^\s]+/g, '')
            .trim() || '创意作品'
          
          console.log('[AIAssistant] 提取的prompt:', prompt)
          console.log('[AIAssistant] startImageGeneration 函数是否存在:', typeof startImageGeneration)
          
          // 延迟2秒，让用户看到AI的回复，然后开始生成
          setTimeout(() => {
            try {
              console.log('[AIAssistant] setTimeout 执行，开始创建生成任务')
              
              // 创建生成任务
              const taskId = `gen-${Date.now()}`
              const newTask: GenerationTaskInfo = {
                id: taskId,
                type: 'image',
                status: 'processing',
                progress: 0,
                params: {
                  prompt: prompt,
                  model: 'wanx2.1-t2i-turbo',
                  size: '1024x1024'
                }
              }
              
              console.log('[AIAssistant] 创建生成任务:', newTask)
              
              // 添加到活动任务
              setActiveGenerationTasks(prev => ({
                ...prev,
                [taskId]: newTask
              }))
              
              // 添加生成中消息
              const generationMessage: Message = {
                id: (Date.now() + 2).toString(),
                role: 'assistant',
                content: '图片生成中...',
                timestamp: Date.now(),
                generationTask: newTask
              }
              
              setMessages(prev => {
                const newMessages = [...prev, generationMessage]
                saveMessagesToSession(newMessages)
                return newMessages
              })
              
              // 开始实际的生成流程
              console.log('[AIAssistant] 调用 startImageGeneration')
              if (typeof startImageGeneration === 'function') {
                startImageGeneration(taskId, prompt)
                  .then(() => console.log('[AIAssistant] 生成流程启动成功'))
                  .catch(err => {
                    console.error('[AIAssistant] 生成流程错误:', err)
                    toast.error('生成失败: ' + err.message)
                  })
              } else {
                console.error('[AIAssistant] startImageGeneration 不是函数')
                toast.error('生成功能暂时不可用')
              }
            } catch (innerError) {
              console.error('[AIAssistant] setTimeout 内错误:', innerError)
              toast.error('生成启动失败，请重试')
            }
          }, 2000)
        }
      } else {
        throw new Error('获取回复失败')
      }
    } catch (error) {
      console.error('发送消息失败:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我暂时无法回答你的问题。请稍后再试，或者尝试重新描述你的问题。',
        timestamp: Date.now(),
        isError: true
      }
      setMessages(prev => {
        const newMessages = [...prev, errorMessage]
        saveMessagesToSession(newMessages)
        return newMessages
      })
      toast.error('发送失败，请重试')
    } finally {
      setIsGenerating(false)
    }
  }, [input, isGenerating, user, location.pathname, saveMessagesToSession, navigate, generateImageInChat, generateVideoInChat, messages])

  // 处理从首页跳转过来的自动发送消息
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const autoSend = searchParams.get('autoSend')

    const loadPendingMessage = async () => {
      const pendingMessage = await pendingMessageService.getPendingMessage()

      if (autoSend === 'true' && pendingMessage) {
        await pendingMessageService.clearPendingMessage()
        setInput(pendingMessage)
        const timer = setTimeout(() => {
          handleSend(pendingMessage)
        }, 500)
        return () => clearTimeout(timer)
      }
    }

    loadPendingMessage()
  }, [location.search, handleSend])

  // 删除消息
  const handleDeleteMessage = (index: number) => {
    setMessages(prev => prev.filter((_, i) => i !== index))
  }

  // 清空对话
  const handleClearChat = () => {
    setMessages([{
      id: 'welcome',
      role: 'assistant',
      content: `你好！我是**津小脉** ✨

津脉智坊平台的专属AI助手，专注于传统文化创作与设计。

**我能为你做什么？**

- 🎨 **创意生成** — 文案、设计灵感、视觉方案
- 🏛️ **文化智库** — 天津非遗、老字号、传统元素
- 💡 **创作优化** — 作品点评、改进建议、趋势分析
- 📝 **品牌策划** — 故事撰写、营销策略、IP孵化

有什么我可以帮你的吗？`,
      timestamp: Date.now()
    }])
    setShowPresetQuestions(true)
    toast.success('对话已清空')
  }

  // 删除当前会话
  const handleDeleteCurrentSession = () => {
    if (!currentSessionId) return
    
    sessionService.deleteSession(currentSessionId)
    
    createNewSession()
    toast.success('会话已删除')
  }

  // 主题色彩系统
  const colors = {
    primary: {
      from: 'from-violet-500',
      via: 'via-purple-500',
      to: 'to-indigo-500',
      solid: 'bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500'
    },
    bg: {
      primary: isDark ? 'bg-slate-950' : 'bg-slate-50',
      secondary: isDark ? 'bg-slate-900' : 'bg-white',
      tertiary: isDark ? 'bg-slate-800' : 'bg-slate-100',
      glass: isDark ? 'bg-slate-900/80' : 'bg-white/80'
    },
    text: {
      primary: isDark ? 'text-slate-100' : 'text-slate-900',
      secondary: isDark ? 'text-slate-400' : 'text-slate-500',
      tertiary: isDark ? 'text-slate-500' : 'text-slate-400',
      accent: 'text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-500'
    },
    border: {
      primary: isDark ? 'border-slate-800' : 'border-slate-200',
      secondary: isDark ? 'border-slate-700' : 'border-slate-100'
    }
  }

  // 处理从其他页面传入的模板提示词
  useEffect(() => {
    if (autoGenerateTriggeredRef.current) {
      return
    }

    const locationState = location.state as { 
      autoGenerate?: boolean
      prompt?: string
      templateId?: string
      templateName?: string
      templateCategory?: string
    } | null

    let prompt = locationState?.prompt
    let templateName = locationState?.templateName
    
    if (!prompt) {
      const savedPrompt = sessionStorage.getItem('templatePrompt')
      const savedTemplateName = sessionStorage.getItem('templateName')
      if (savedPrompt) {
        prompt = savedPrompt
        templateName = savedTemplateName || '模板'
      }
    }

    if (!prompt) {
      return
    }

    autoGenerateTriggeredRef.current = true
    
    const promptText = `生成图片：${prompt}`
    setInput(promptText)
    
    setTimeout(() => {
      toast.success(`正在使用「${templateName || '模板'}」生成图片...`)
      handleSend(promptText)
    }, 500)
    
    sessionStorage.removeItem('templatePrompt')
    sessionStorage.removeItem('templateName')
    if (window.history.replaceState) {
      window.history.replaceState({}, document.title, window.location.pathname)
    }
  }, [])

  return (
    <div className={`min-h-screen w-full ${colors.bg.primary} flex flex-col relative overflow-hidden`}>
      {/* 背景装饰 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* 头部 */}
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 px-6 py-3 transition-all duration-300 ${
          isScrolled
            ? `${colors.bg.glass} backdrop-blur-xl border-b ${colors.border.primary}`
            : colors.primary.solid
        }`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={ANIMATION_CONFIG.spring}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between h-14">
          {/* 左侧：头像和标题 */}
          <div className="flex items-center gap-4">
            <motion.div
              className="relative flex-shrink-0 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg">
                <span className="text-lg font-bold text-white">津</span>
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-emerald-400 rounded-full border-2 border-violet-500 shadow-sm">
                <div className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>
            </motion.div>

            <div className="flex items-center gap-3">
              <span className="font-bold text-lg text-white tracking-tight">津小脉</span>
              <span className="text-white/40">|</span>
              <span className="text-sm text-white/70 font-medium">AI 创意助手</span>
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(true)}
              className="h-10 px-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors flex items-center gap-2"
              title="会话列表"
            >
              <i className="fas fa-list-ul text-sm" />
              <span className="text-sm font-medium">会话</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearChat}
              className="h-10 px-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors flex items-center gap-2"
              title="清空对话"
            >
              <i className="fas fa-rotate-right text-sm" />
              <span className="text-sm font-medium">清空</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDeleteCurrentSession}
              className="h-10 px-4 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-red-500/30 hover:border-red-400/30 transition-colors flex items-center gap-2"
              title="删除当前会话"
            >
              <i className="fas fa-trash-can text-sm" />
              <span className="text-sm font-medium">删除</span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* 主内容区 */}
      <main
        ref={mainRef}
        className={`flex-1 overflow-y-auto px-4 pt-20 pb-40 ${colors.bg.primary} relative`}
      >
        {/* IP形象视频加载动画 - 只显示真正正在进行的任务 */}
        <AnimatePresence>
          {(() => {
            const now = Date.now()
            const hasActiveTask = Object.values(activeGenerationTasks).some(task => {
              const taskAge = now - (task.updatedAt || task.createdAt)
              const isRecent = taskAge < 5 * 60 * 1000 // 5分钟内
              return task.status === 'processing' && isRecent
            })
            return hasActiveTask
          })() && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
              style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.85)' }}
            >
              <div className="pointer-events-auto">
                <IPMascotVideoLoader
                  isVisible={true}
                  message="AI正在创作中..."
                  progress={0}
                  showProgress={false}
                />
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="max-w-4xl mx-auto space-y-4">
          <AnimatePresence mode="popLayout">
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                layout
                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ ...ANIMATION_CONFIG.spring, delay: index * 0.05 }}
              >
                {(() => {
                  const messageTask = message.generationTask
                  const quickOptions = message.quickOptions

                  if (quickOptions && quickOptions.length > 0) {
                    return (
                      <div className="flex mb-4 justify-start">
                        <div className="max-w-[80%]">
                          <div className={`mb-3 rounded-2xl px-5 py-4 ${colors.bg.secondary} border ${colors.border.secondary}`}>
                            <p className={`text-sm whitespace-pre-wrap leading-relaxed ${colors.text.primary} mb-4`}>{message.content}</p>
                            <div className="grid grid-cols-2 gap-3">
                              {quickOptions.map((option, idx) => (
                                <motion.button
                                  key={idx}
                                  whileHover={{ scale: 1.02 }}
                                  whileTap={{ scale: 0.98 }}
                                  onClick={() => handleSend(option.prompt)}
                                  className={`flex items-center gap-3 p-4 rounded-xl text-left transition-all ${
                                    isDark
                                      ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
                                      : 'bg-white hover:bg-violet-50 text-slate-700 border border-slate-200'
                                  }`}
                                >
                                  <span className="text-xl">{option.icon}</span>
                                  <span className="text-sm font-medium">{option.label}</span>
                                </motion.button>
                              ))}
                            </div>
                          </div>
                          <div className="mt-2 flex items-center gap-2 px-1 justify-start">
                            <span className="text-xs text-gray-400 font-medium">
                              {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        </div>
                      </div>
                    )
                  }

                  if (!messageTask) {
                    return (
                      <AICollaborationMessage
                        message={message}
                        index={index}
                        userAvatar={user?.avatar_url || user?.avatar}
                        onDelete={handleDeleteMessage}
                        hideAvatar={false}
                        conversationId={currentSessionId || undefined}
                        previousMessage={index > 0 ? messages[index - 1] : undefined}
                        aiModel="qwen"
                      />
                    )
                  }

                  const activeTask = activeGenerationTasks[messageTask.id]
                  
                  // 优先使用 activeGenerationTasks 中的状态（如果有）
                  // 否则使用消息中的状态
                  const task = {
                    id: messageTask.id,
                    type: messageTask.type,
                    status: activeTask?.status ?? messageTask.status,
                    progress: activeTask?.progress ?? messageTask.progress,
                    params: messageTask.params,
                    error: activeTask?.error ?? messageTask.error,
                    result: activeTask?.result ?? messageTask.result,
                  }
                  
                  const isUserMessage = message.role === 'user'

                  return (
                    <div className={`flex mb-4 ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[80%]" data-generation-task-id={message.generationTask?.id}>
                        <div className={`mb-3 rounded-2xl px-5 py-4 ${colors.bg.secondary} border ${colors.border.secondary}`}>
                          <p className={`text-sm ${colors.text.primary}`}>{message.content}</p>
                        </div>
                        <InlineGenerationCard
                          key={`${message.id}-generation-card`}
                          task={task as any}
                          onSave={() => {
                            if (task.result?.urls?.[0]) {
                              navigate('/create', { state: { imageUrl: task.result.urls[0] } })
                            }
                          }}
                          onPublish={() => {
                            if (task.result?.urls?.[0]) {
                              openPublishModal(
                                task.result.urls[0],
                                task.params?.prompt || '',
                                task.type as 'image' | 'video'
                              )
                            }
                          }}
                          onShare={() => {
                            if (task.result?.urls?.[0]) {
                              navigator.clipboard.writeText(task.result.urls[0])
                              toast.success('链接已复制到剪贴板')
                            }
                          }}
                          onShareToFriend={() => {
                            if (task.result?.urls?.[0]) {
                              navigator.clipboard.writeText(task.result.urls[0])
                              toast.success('链接已复制到剪贴板')
                            }
                          }}
                        />
                        <div className={`mt-2 flex items-center gap-2 px-1 ${isUserMessage ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-gray-400 font-medium">
                            {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {!isUserMessage && <VoiceOutputButton text={message.content} />}
                          <AIMessageActions
                            content={message.content}
                            onQuote={() => {
                              const quoteEvent = new CustomEvent('quoteMessage', { 
                                detail: { content: message.content, index } 
                              });
                              window.dispatchEvent(quoteEvent);
                            }}
                            onDelete={() => handleDeleteMessage(index)}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* 正在输入指示器 */}
          <AnimatePresence>
            {isGenerating && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex justify-start"
              >
                <div className={`${colors.bg.secondary} rounded-2xl px-5 py-4 flex items-center gap-3 shadow-sm border ${colors.border.secondary}`}>
                  <div className="flex items-center gap-1">
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-violet-500"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0 }}
                    />
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-purple-500"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.2 }}
                    />
                    <motion.div 
                      className="w-2 h-2 rounded-full bg-indigo-500"
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 1, repeat: Infinity, delay: 0.4 }}
                    />
                  </div>
                  <span className={`text-sm ${colors.text.secondary}`}>津小脉正在思考...</span>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div ref={messagesEndRef} />

          {/* 预设问题 */}
          <AnimatePresence>
            {showPresetQuestions && messages.length === 1 && (
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.4 }}
                className="mt-8"
              >
                <motion.div
                  className="text-center mb-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                  }`}>
                    <i className="fas fa-lightbulb text-amber-400" />
                    你可以试试这样问我
                  </span>
                </motion.div>

                <div className="grid grid-cols-3 gap-4">
                  {Object.entries(PRESET_QUESTIONS).map(([key, category], catIndex) => (
                    <motion.div
                      key={key}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: catIndex * 0.1 + 0.3 }}
                      className={`rounded-2xl overflow-hidden ${colors.bg.secondary} border ${colors.border.primary} shadow-sm hover:shadow-md transition-shadow duration-300`}
                    >
                      <div className={`px-4 py-3 border-b ${colors.border.primary} ${isDark ? 'bg-slate-800/50' : 'bg-slate-50/50'}`}>
                        <div className="flex items-center gap-2">
                          <span className={`w-8 h-8 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-sm shadow-sm`}>
                            {category.icon}
                          </span>
                          <h3 className={`text-sm font-semibold ${colors.text.secondary}`}>
                            {category.title}
                          </h3>
                        </div>
                      </div>

                      <div className="p-4 space-y-2">
                        {category.items.map((item, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: catIndex * 0.1 + index * 0.05 + 0.4 }}
                            whileHover={{ scale: 1.02, x: 4 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSend(item.text)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 text-left ${
                              isDark
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 hover:border-violet-500/30'
                                : `${category.bgColor} text-slate-700 hover:bg-white border border-transparent hover:border-violet-200 hover:shadow-sm`
                            }`}
                          >
                            <span className="text-base">{item.icon}</span>
                            <span className="truncate">{item.text}</span>
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* 输入区域 */}
      <motion.footer
        className={`fixed left-0 right-0 bottom-0 px-6 py-4 z-40 ${isDark ? 'bg-slate-900/90' : 'bg-white/90'} backdrop-blur-xl border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'}`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className={`flex items-end gap-3 rounded-2xl ${isDark ? 'bg-slate-800/70' : 'bg-slate-100/70'} backdrop-blur-xl border ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'} px-4 py-3`}>
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  handleSend()
                }
              }}
              placeholder="输入消息..."
              rows={1}
              className={`flex-1 text-sm ${colors.text.primary} placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0 resize-none max-h-32`}
              disabled={isGenerating}
              style={{ minHeight: '24px' }}
            />
            
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend()}
              disabled={!input.trim() || isGenerating}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                input.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md'
                  : `${isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-300 text-slate-400'}`
              }`}
            >
              <i className="fas fa-paper-plane text-sm" />
            </motion.button>
          </div>
        </div>
      </motion.footer>

      {/* 会话侧边栏 */}
      <SessionSidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        currentSessionId={currentSessionId}
        onSessionSelect={handleSessionSelect}
        onSessionCreate={createNewSession}
        onSessionsChange={() => {}}
      />

      {/* 发布作品模态框 */}
      <AnimatePresence>
        {isPublishModalOpen && publishContent && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[99999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setIsPublishModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.9, opacity: 0, y: 20 }}
              className={`w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${
                isDark ? 'bg-gray-900' : 'bg-white'
              }`}
              onClick={e => e.stopPropagation()}
            >
              {/* 头部 */}
              <div className={`flex items-center justify-between p-6 border-b ${
                isDark ? 'border-gray-800' : 'border-gray-100'
              }`}>
                <h3 className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                  发布作品
                </h3>
                <button
                  onClick={() => setIsPublishModalOpen(false)}
                  className={`p-2 rounded-lg transition-colors ${
                    isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'
                  }`}
                >
                  <i className="fas fa-times" />
                </button>
              </div>

              {/* 内容 */}
              <div className="p-6 space-y-5">
                {/* 图片/视频预览 */}
                <div className={`rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  {publishContent.type === 'video' ? (
                    <video
                      src={publishContent.imageUrl}
                      className="w-full h-56 object-cover"
                      controls
                      autoPlay
                      muted
                      loop
                      playsInline
                      preload="auto"
                      poster={publishContent.imageUrl}
                    />
                  ) : (
                    <img
                      src={publishContent.imageUrl}
                      alt="Preview"
                      className="w-full h-56 object-cover"
                    />
                  )}
                </div>

                {/* 标题输入 */}
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    作品标题
                    {isGeneratingMetadata && (
                      <span className="ml-2 text-xs text-indigo-500">
                        <i className="fas fa-spinner fa-spin mr-1" />
                        AI生成中...
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
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500'
                        : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
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
                        ? 'bg-gray-800 border-gray-700 text-white focus:border-indigo-500'
                        : 'bg-white border-gray-200 text-gray-900 focus:border-indigo-500'
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
                              ? 'bg-indigo-500/20 text-indigo-400'
                              : 'bg-indigo-100 text-indigo-600'
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
                    onClick={() => setIsPublishModalOpen(false)}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      isDark
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handlePublishSubmit}
                    disabled={isSubmitting || !publishTitle.trim()}
                    className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                      isSubmitting || !publishTitle.trim()
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white'
                    }`}
                  >
                    {isSubmitting ? (
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
    </div>
  )
}
