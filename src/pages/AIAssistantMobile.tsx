import { useState, useEffect, useRef, useContext, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { useNavigate, useLocation } from 'react-router-dom'
import { llmService, Message as BaseMessage } from '@/services/llmService'
import { aiAssistantService } from '@/services/aiAssistantService'
import { sessionService, ChatSession } from '@/services/sessionService'
import { toast } from 'sonner'
import { AuthContext } from '@/contexts/authContext'
import AICollaborationMessage from '@/components/AICollaborationMessage'
import VoiceOutputButton from '@/components/VoiceOutputButton'
import SessionSidebar from '@/components/SessionSidebar'
import { InlineGenerationCard } from '@/components/InlineGenerationCard'
import AIMessageActions from '@/components/AIMessageActions'

// 扩展 Message 类型，支持生成任务
// 注意：这个类型需要与 InlineGenerationCard 组件的 GenerationTask 类型完全兼容
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
  errorType?: string  // 添加错误类型字段
  createdAt: number
  updatedAt: number
  estimatedTime?: number
}

interface Message extends BaseMessage {
  generationTask?: GenerationTaskInfo
}

// 预设问题 - 分类展示
const PRESET_QUESTIONS = {
  creative: {
    title: '创意生成',
    icon: '✨',
    color: 'from-violet-500 to-purple-500',
    bgColor: 'bg-violet-50',
    items: [
      { icon: '🎨', text: '生成创意文案和设计灵感' },
      { icon: '✍️', text: '帮我写一段品牌故事' },
      { icon: '📦', text: '生成文创产品方案' }
    ]
  },
  culture: {
    title: '文化探索',
    icon: '🏛️',
    color: 'from-amber-500 to-orange-500',
    bgColor: 'bg-amber-50',
    items: [
      { icon: '🏛️', text: '了解天津传统文化' },
      { icon: '🎭', text: '探索非遗技艺元素' },
      { icon: '🏮', text: '国潮风格设计推荐' }
    ]
  },
  optimize: {
    title: '优化提升',
    icon: '💡',
    color: 'from-emerald-500 to-teal-500',
    bgColor: 'bg-emerald-50',
    items: [
      { icon: '💡', text: '优化我的创作方案' },
      { icon: '🎯', text: '营销文案撰写技巧' },
      { icon: '🔥', text: '热门设计趋势分析' }
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

export default function AIAssistantMobile() {
  console.log('[AIAssistant] 组件开始渲染')
  
  // 添加全局错误处理
  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      console.error('[AIAssistant] 全局错误:', event.error)
    }
    window.addEventListener('error', handleError)
    return () => window.removeEventListener('error', handleError)
  }, [])
  
  const { isDark, theme } = useTheme()
  const navigate = useNavigate()
  const location = useLocation()
  const { user } = useContext(AuthContext)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
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

  // 初始化加载会话
  useEffect(() => {
    const savedSessionId = sessionService.getCurrentSessionId()
    console.log('[AIAssistant] 当前会话ID:', savedSessionId)

    // 检查 localStorage 中的数据
    const savedSessions = localStorage.getItem('jinmai_ai_sessions')
    console.log('[AIAssistant] localStorage 中的会话数据:', savedSessions)

    if (savedSessionId) {
      const session = sessionService.getSession(savedSessionId)
      console.log('[AIAssistant] 获取到的会话:', session)
      if (session && session.messages.length > 0) {
        console.log('[AIAssistant] 消息数量:', session.messages.length)
        session.messages.forEach((msg, i) => {
          console.log(`[AIAssistant] 消息 ${i}:`, msg.id, '有generationTask:', !!msg.generationTask)
        })
        setCurrentSessionId(session.id)
        setMessages(session.messages)
        setSessionTitle(session.title)
        setShowPresetQuestions(false)

        // 从消息中恢复生成任务状态
        const tasksFromMessages: Record<string, GenerationTaskInfo> = {}
        session.messages.forEach(msg => {
          if (msg.generationTask) {
            // 如果消息中的 generationTask 有完整数据（包含result），使用它
            tasksFromMessages[msg.generationTask.id] = msg.generationTask
          }
        })
        // 合并到 activeGenerationTasks
        if (Object.keys(tasksFromMessages).length > 0) {
          setActiveGenerationTasks(prev => ({
            ...prev,
            ...tasksFromMessages
          }))
        }
      } else {
        // 创建新会话
        createNewSession()
      }
    } else {
      // 创建新会话
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

🎨 **创意生成** — 文案、设计灵感、视觉方案
🏛️ **文化智库** — 天津非遗、老字号、传统元素
💡 **创作优化** — 作品点评、改进建议、趋势分析
📝 **品牌策划** — 故事撰写、营销策略、IP孵化

有什么我可以帮你的吗？`,
      timestamp: Date.now()
    }

    const session = sessionService.createSession([welcomeMessage])
    setCurrentSessionId(session.id)
    setMessages([welcomeMessage])
    setSessionTitle(session.title)
    setShowPresetQuestions(true)
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
      // 检查消息中是否有 generationTask
      const messagesWithTask = newMessages.filter(m => m.generationTask)
      console.log('[AIAssistant] 保存消息到会话，有 generationTask 的消息数:', messagesWithTask.length)
      messagesWithTask.forEach(m => {
        console.log('[AIAssistant] 保存消息:', m.id, 'generationTask:', m.generationTask)
      })
      // 保存完整消息，包括 generationTask
      sessionService.updateSessionMessages(currentSessionId, newMessages)
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

  // 监听重新生成事件
  useEffect(() => {
    const handleRetryGeneration = (e: CustomEvent) => {
      const { taskId, prompt, isContentPolicyError } = e.detail
      console.log('[AIAssistant] 收到重新生成事件:', taskId, prompt, 'isContentPolicyError:', isContentPolicyError)
      
      if (prompt) {
        // 将提示词设置到输入框，让用户可以修改
        setInput(prompt)
        
        if (isContentPolicyError) {
          toast.info('提示词包含敏感内容，请修改后重新发送', {
            duration: 5000,
            icon: '⚠️'
          })
        } else {
          toast.info('提示词已加载到输入框，您可以修改后重新发送')
        }
        
        // 聚焦输入框
        setTimeout(() => {
          inputRef.current?.focus()
        }, 100)
      }
    }

    window.addEventListener('retryGeneration', handleRetryGeneration as EventListener)
    return () => {
      window.removeEventListener('retryGeneration', handleRetryGeneration as EventListener)
    }
  }, [])

  // 生成任务状态管理
  const [activeGenerationTasks, setActiveGenerationTasks] = useState<Record<string, GenerationTaskInfo>>({})

  // 从 localStorage 恢复生成任务
  useEffect(() => {
    const savedTasks = localStorage.getItem('aiAssistantGenerationTasks')
    if (savedTasks) {
      try {
        const parsed = JSON.parse(savedTasks)
        setActiveGenerationTasks(parsed)
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

  // 直接在聊天中生成图片
  // 使用 useRef 来跟踪 interval，避免重复创建
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null)
  
  // 使用 useEffect 监听正在处理中的任务并更新进度
  useEffect(() => {
    const processingTasks = Object.entries(activeGenerationTasks).filter(
      ([, task]) => task.status === 'processing' && task.progress < 90
    )
    
    // 如果没有正在处理的任务，清除 interval
    if (processingTasks.length === 0) {
      if (progressIntervalRef.current) {
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
      return
    }
    
    // 如果已经有 interval 在运行，不需要重新创建
    if (progressIntervalRef.current) {
      return
    }
    
    console.log('[AIAssistant] 开始进度更新，任务数:', processingTasks.length)
    
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
            console.log('[AIAssistant] 进度更新:', id, '进度:', Math.round(newProgress))
          }
        })
        
        // 如果没有正在处理的任务了，清除 interval
        if (!hasProcessingTask && progressIntervalRef.current) {
          clearInterval(progressIntervalRef.current)
          progressIntervalRef.current = null
        }
        
        return hasUpdate ? updated : prev
      })
    }, 2000)
    
    return () => {
      // 组件卸载时才清理
      if (progressIntervalRef.current) {
        console.log('[AIAssistant] 清理进度更新 interval')
        clearInterval(progressIntervalRef.current)
        progressIntervalRef.current = null
      }
    }
  }, [activeGenerationTasks])

  const generateImageInChat = useCallback(async (taskId: string, prompt: string) => {
    // 防止重复生成同一个任务
    if (processingTasksRef.current.has(taskId)) {
      console.log('[AIAssistant] 任务已在处理中，跳过重复调用:', taskId)
      return
    }
    processingTasksRef.current.add(taskId)
    
    console.log('[AIAssistant] 开始生成图片，taskId:', taskId, 'prompt:', prompt)
    try {
      const now = Date.now()
      // 更新任务状态为处理中
      setActiveGenerationTasks(prev => ({
        ...prev,
        [taskId]: {
          ...prev[taskId],
          status: 'processing',
          progress: 10,
          updatedAt: now
        }
      }))
      console.log('[AIAssistant] 任务状态已更新为 processing')

      // 调用图片生成API
      console.log('[AIAssistant] 调用 llmService.generateImage...')
      let result
      try {
        result = await llmService.generateImage({
          prompt,
          n: 1,
          size: '1024x1024',
          response_format: 'url'
        })
      } catch (apiError) {
        console.error('[AIAssistant] llmService.generateImage 抛出异常:', apiError)
        throw apiError
      }
      console.log('[AIAssistant] llmService.generateImage 返回结果:', result)

      if (result.ok && result.data) {
        const data: any = result.data
        console.log('[AIAssistant] 图片生成成功，返回数据:', data)
        const items: any[] = (data && (data.data || data.images || [])) as any[]
        console.log('[AIAssistant] 解析后的items:', items)
        
        if (items.length > 0 && items[0].url) {
          const taskResult = {
            urls: [items[0].url],
            revisedPrompt: prompt
          }
          console.log('[AIAssistant] 设置taskResult:', taskResult)
          const now = Date.now()
          // 生成成功 - 先更新 activeGenerationTasks
          console.log('[AIAssistant] 更新 activeGenerationTasks 为 completed')
          setActiveGenerationTasks(prev => {
            const updated = {
              ...prev,
              [taskId]: {
                ...prev[taskId],
                status: 'completed',
                progress: 100,
                result: taskResult,
                updatedAt: now
              }
            }
            console.log('[AIAssistant] activeGenerationTasks 已更新:', updated[taskId])
            return updated
          })
          // 同时更新消息中的 generationTask，确保刷新页面后能恢复
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
            // 保存到会话
            saveMessagesToSession(updatedMessages)
            return updatedMessages
          })
          toast.success('图片生成完成！')
          
          // 自动滚动到生成的图片位置
          setTimeout(() => {
            const imageElement = document.querySelector(`[data-generation-task-id="${taskId}"]`)
            if (imageElement) {
              imageElement.scrollIntoView({ behavior: 'smooth', block: 'center' })
            } else {
              // 如果找不到特定元素，滚动到底部
              messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
            }
          }, 300)
        } else {
          throw new Error('生成结果为空')
        }
      } else {
        throw new Error(result.error || '生成失败')
      }
    } catch (error: any) {
      console.error('图片生成失败:', error)
      
      // 处理不同类型的错误
      let errorMsg = error.message || '生成失败，请重试'
      let errorType = 'general'
      
      // 检查是否是内容审核错误
      if (errorMsg.includes('inappropriate content') || 
          errorMsg.includes('敏感内容') || 
          errorMsg.includes('内容审核') ||
          errorMsg.includes('inappropriate')) {
        errorType = 'content_policy'
        errorMsg = '提示词包含敏感内容，请尝试修改描述，避免使用敏感词汇'
      }
      // 检查是否是超时错误
      else if (errorMsg.includes('timeout') || errorMsg.includes('超时')) {
        errorType = 'timeout'
        errorMsg = '生成请求超时，请稍后重试'
      }
      // 检查是否是 API Key 错误
      else if (errorMsg.includes('API Key') || errorMsg.includes('Unauthorized')) {
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
      // 同时更新消息中的 generationTask 状态为失败
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
        // 保存到会话
        saveMessagesToSession(updatedMessages)
        return updatedMessages
      })
      toast.error('图片生成失败: ' + errorMsg)
    } finally {
      // 从处理中任务集合中移除
      processingTasksRef.current.delete(taskId)
    }
  }, [saveMessagesToSession])

  // 发送消息 - 支持图片/视频生成和页面跳转
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

    // 首先检查是否是图片/视频生成请求（优先于知识库匹配）
    const imageKeywords = ['生成图片', '生成图像', '画一张', '画个', '画幅', '生成图', '帮我画图', '帮我画', '帮我生成', '帮我创作', '画一', '生成一张图', '生成一张图片', '画一张图', '生成画', '想要一张', '想要个', '想要幅', '给我画', '给我生成', '给我创作', '来一张', '来一幅', '来张', '来幅', '需要一张', '需要张', '需要幅', '做一张', '做张', '做幅', '创作一张', '创作张', '创作幅', '设计一张', '设计张', '设计幅', '整一张', '整幅', '整张图', '整幅画', '搞一张', '搞幅', '搞张图', '弄一张', '弄幅', '弄张图', '生成海河', '生成天津', '生成国潮', '生成非遗', '生成一张', '生成个', '生成幅']
    const videoKeywords = ['生成视频', '生成影片', '做个视频', '做视频', '生成动画', '生成短片', '帮我做视频', '帮我生成视频', '想要个视频', '想要视频', '给我做个视频', '给我生成视频', '来段视频', '来段', '需要视频', '做段视频', '创作视频', '设计视频']

    const isImageRequest = imageKeywords.some(k => content.includes(k))
    const isVideoRequest = videoKeywords.some(k => content.includes(k))

    console.log('[AIAssistant] ==========================================')
    console.log('[AIAssistant] 消息内容:', content)
    console.log('[AIAssistant] 匹配到的图片关键词:', imageKeywords.filter(k => content.includes(k)))
    console.log('[AIAssistant] 是否是图片请求:', isImageRequest)
    console.log('[AIAssistant] 是否是视频请求:', isVideoRequest)
    console.log('[AIAssistant] ==========================================')

    // 如果是图片/视频生成请求，直接处理，不走知识库
    if (isImageRequest || isVideoRequest) {
      console.log('[AIAssistant] 进入图片/视频生成流程')
      const taskId = `gen-${Date.now()}`
      
      // 添加AI回复消息，包含生成任务
      const now = Date.now()
      const aiMessage: Message = {
        id: (now + 1).toString(),
        role: 'assistant',
        content: `正在为您${isImageRequest ? '生成图片' : '生成视频'}，请稍候...`,
        timestamp: now,
        generationTask: {
          id: taskId,
          type: isImageRequest ? 'image' : 'video',
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

      // 初始化任务状态
      setActiveGenerationTasks(prev => ({
        ...prev,
        [taskId]: {
          id: taskId,
          type: isImageRequest ? 'image' : 'video',
          status: 'pending',
          progress: 0,
          params: { prompt: content },
          createdAt: now,
          updatedAt: now
        }
      }))

      // 开始生成
      if (isImageRequest) {
        // 直接在聊天中生成图片
        console.log('[AIAssistant] 准备调用 generateImageInChat，taskId:', taskId)
        // 使用 setTimeout 确保在 React 状态更新后执行
        setTimeout(() => {
          console.log('[AIAssistant] setTimeout 触发，开始调用 generateImageInChat')
          generateImageInChat(taskId, content)
        }, 100)
      } else {
        // 视频生成仍然跳转到创作中心（因为视频生成需要更多配置）
        setTimeout(() => {
          navigate('/create', { state: { prompt: content, type: 'video' } })
        }, 2000)
      }
      
      setIsGenerating(false)
      return
    }

    try {
      await aiAssistantService.initialize(user)
      const response = await aiAssistantService.processMessage(
        content.trim(),
        location.pathname
      )

      if (response && response.content) {
        // 处理导航响应
        if (response.type === 'navigation' && response.shouldNavigate && response.target) {
          // 添加AI回复消息
          const aiMessage: Message = {
            id: (Date.now() + 1).toString(),
            role: 'assistant',
            content: response.content,
            timestamp: Date.now()
          }
          setMessages(prev => {
            const newMessages = [...prev, aiMessage]
            saveMessagesToSession(newMessages)
            return newMessages
          })

          // 延迟跳转，让用户看到消息
          setTimeout(() => {
            navigate(response.target!)
          }, 1500)
          return
        }

        // 普通回复
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: response.content,
          timestamp: Date.now()
        }
        setMessages(prev => {
          const newMessages = [...prev, aiMessage]
          saveMessagesToSession(newMessages)
          return newMessages
        })
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
  }, [input, isGenerating, user, location.pathname, saveMessagesToSession, navigate, generateImageInChat])

  // 处理从首页跳转过来的自动发送消息
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search)
    const autoSend = searchParams.get('autoSend')
    const pendingMessage = localStorage.getItem('aiAssistantPendingMessage')

    if (autoSend === 'true' && pendingMessage) {
      // 清除 localStorage 中的消息
      localStorage.removeItem('aiAssistantPendingMessage')
      // 设置输入框内容
      setInput(pendingMessage)
      // 延迟发送，确保组件已完全初始化
      const timer = setTimeout(() => {
        handleSend(pendingMessage)
      }, 500)
      return () => clearTimeout(timer)
    }
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

🎨 **创意生成** — 文案、设计灵感、视觉方案
🏛️ **文化智库** — 天津非遗、老字号、传统元素
💡 **创作优化** — 作品点评、改进建议、趋势分析
📝 **品牌策划** — 故事撰写、营销策略、IP孵化

有什么我可以帮你的吗？`,
      timestamp: Date.now()
    }])
    setShowPresetQuestions(true)
    toast.success('对话已清空')
  }

  // 删除当前会话
  const handleDeleteCurrentSession = () => {
    if (!currentSessionId) return
    
    // 从 sessionService 中删除会话
    sessionService.deleteSession(currentSessionId)
    
    // 创建新会话
    createNewSession()
    
    toast.success('会话已删除')
  }

  // 主题色彩系统
  const colors = {
    // 主色调 - 紫罗兰渐变
    primary: {
      from: 'from-violet-500',
      via: 'via-purple-500',
      to: 'to-indigo-500',
      solid: 'bg-gradient-to-r from-violet-500 via-purple-500 to-indigo-500'
    },
    // 辅助色
    accent: {
      cyan: 'cyan-400',
      pink: 'pink-400',
      amber: 'amber-400'
    },
    // 背景色
    bg: {
      primary: isDark ? 'bg-slate-950' : 'bg-slate-50',
      secondary: isDark ? 'bg-slate-900' : 'bg-white',
      tertiary: isDark ? 'bg-slate-800' : 'bg-slate-100',
      glass: isDark ? 'bg-slate-900/80' : 'bg-white/80'
    },
    // 文字色
    text: {
      primary: isDark ? 'text-slate-100' : 'text-slate-900',
      secondary: isDark ? 'text-slate-400' : 'text-slate-500',
      tertiary: isDark ? 'text-slate-500' : 'text-slate-400',
      accent: 'text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-purple-500'
    },
    // 边框色
    border: {
      primary: isDark ? 'border-slate-800' : 'border-slate-200',
      secondary: isDark ? 'border-slate-700' : 'border-slate-100'
    }
  }

  // 处理从其他页面传入的自动生成请求
  useEffect(() => {
    const locationState = location.state as { 
      autoGenerate?: boolean
      prompt?: string
      templateId?: string
      templateName?: string
      templateCategory?: string
    } | null

    // 如果没有自动生成请求，重置触发标志，允许下次触发
    if (!locationState?.autoGenerate) {
      autoGenerateTriggeredRef.current = false
      return
    }

    // 防止重复触发
    if (autoGenerateTriggeredRef.current) {
      console.log('[AIAssistant] 自动生成已触发过，跳过')
      return
    }

    if (locationState?.prompt) {
      console.log('[AIAssistant] 接收到自动生成请求:', locationState)
      
      // 标记已触发
      autoGenerateTriggeredRef.current = true
      
      // 清除location state，避免重复触发
      navigate(location.pathname, { replace: true })
      
      // 延迟执行，确保会话已初始化
      setTimeout(() => {
        const generateMessage = `使用${locationState.templateName || '模板'}生成图片：${locationState.prompt}`
        handleSend(generateMessage)
        toast.success(`正在使用「${locationState.templateName || '模板'}」生成图片...`)
      }, 500)
    }
  }, [location.state, handleSend, navigate])

  return (
    <div className={`min-h-screen ${colors.bg.primary} flex flex-col relative overflow-hidden md:max-w-md md:mx-auto md:shadow-2xl`}>
      {/* 背景装饰 - 增加视觉层次 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -left-20 w-60 h-60 bg-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-10 w-40 h-40 bg-indigo-500/10 rounded-full blur-3xl" />
      </div>

      {/* 头部 - 玻璃拟态效果 */}
      <motion.header
        className={`sticky top-0 z-50 px-4 py-0.5 transition-all duration-300 ${
          isScrolled
            ? `${colors.bg.glass} backdrop-blur-xl border-b ${colors.border.primary}`
            : colors.primary.solid
        }`}
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={ANIMATION_CONFIG.spring}
      >
        <div className="flex items-center justify-between h-12 px-1">
          {/* 左侧：头像和标题 */}
          <div className="flex items-center gap-3">
            {/* AI头像 */}
            <motion.div
              className="relative flex-shrink-0 flex items-center justify-center"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30 shadow-lg">
                <span className="text-sm font-bold text-white">津</span>
              </div>
              {/* 在线状态指示 */}
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-violet-500 shadow-sm">
                <div className="w-full h-full rounded-full bg-emerald-400 animate-ping opacity-75" />
              </div>
            </motion.div>

            {/* 标题和状态 - 排成一行，垂直居中 */}
            <div className="flex items-center gap-2 h-8">
              <span className="font-bold text-base text-white tracking-tight leading-none">津小脉</span>
              <span className="text-white/40 leading-none">|</span>
              <span className="text-xs text-white/70 font-medium leading-none">AI 创意助手</span>
              <span className="text-white/40 leading-none">·</span>
              <span className="text-xs text-emerald-300 font-medium leading-none">在线</span>
            </div>
          </div>

          {/* 右侧：操作按钮 */}
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsSidebarOpen(true)}
              className="h-8 px-2.5 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors flex items-center gap-1.5"
              title="会话列表"
            >
              <i className="fas fa-list-ul text-xs" />
              <span className="text-xs font-medium">会话</span>
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/create')}
              className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
              title="前往创作中心"
            >
              <i className="fas fa-wand-magic-sparkles text-xs" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleClearChat}
              className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-white/20 transition-colors flex items-center justify-center"
              title="清空对话"
            >
              <i className="fas fa-rotate-right text-xs" />
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleDeleteCurrentSession}
              className="w-8 h-8 rounded-lg bg-white/10 backdrop-blur-sm border border-white/20 text-white hover:bg-red-500/30 hover:border-red-400/30 transition-colors flex items-center justify-center"
              title="删除当前会话"
            >
              <i className="fas fa-trash-can text-xs" />
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* 消息列表 - 为底部固定输入框和导航栏留出空间 */}
      <main 
        ref={mainRef}
        className={`flex-1 overflow-y-auto px-4 py-6 pb-32 ${colors.bg.primary} relative`}
      >
        <div className="max-w-2xl mx-auto space-y-3">
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
                {/* 检查是否是生成任务消息 */}
                {(() => {
                  // 优先使用消息中存储的 generationTask 数据
                  const messageTask = message.generationTask
                  if (!messageTask) {
                    return (
                      <AICollaborationMessage
                        message={message}
                        index={index}
                        userAvatar={user?.avatar}
                        onDelete={handleDeleteMessage}
                        hideAvatar={true}
                      />
                    )
                  }

                  // 尝试从 activeGenerationTasks 获取最新状态
                  const activeTask = activeGenerationTasks[messageTask.id]
                  
                  // 处理 result：优先使用 activeTask 的最新结果，其次是 messageTask 的结果
                  const activeResult = activeTask?.result
                  const messageResult = messageTask.result
                  
                  let mergedResult = null
                  if (activeResult && activeResult.urls && activeResult.urls.length > 0) {
                    mergedResult = activeResult
                  } else if (messageResult && messageResult.urls && messageResult.urls.length > 0) {
                    mergedResult = messageResult
                  }
                  
                  // 合并数据：优先使用消息中的数据，然后用 activeTask 更新实时状态
                  let mergedTask = {
                    ...messageTask,
                    // 如果 activeTask 存在，使用其状态更新
                    ...(activeTask && {
                      status: activeTask.status,
                      progress: activeTask.progress,
                      error: activeTask.error,
                    }),
                    // 单独处理 result，确保使用合并后的结果
                    ...(mergedResult && { result: mergedResult }),
                  }

                  console.log('[AIAssistant] 渲染生成任务:', mergedTask?.id, 'status:', mergedTask?.status, 'progress:', mergedTask?.progress, 'hasResult:', !!mergedTask?.result, 'urls:', mergedTask?.result?.urls, 'fullResult:', mergedTask?.result)
                  
                  return (
                    <div className="flex justify-start mb-4">
                      <div className="w-full max-w-[90%]" data-generation-task-id={message.generationTask?.id}>
                        {/* 先显示AI回复文本 */}
                        <div className={`mb-3 rounded-2xl px-4 py-3 ${colors.bg.secondary} border ${colors.border.secondary}`}>
                          <p className={`text-sm ${colors.text.primary}`}>{message.content}</p>
                        </div>
                        {/* 显示生成卡片 */}
                        <InlineGenerationCard
                          key={`${message.id}-generation-card`}
                          task={mergedTask as any}
                          onSave={() => {
                            const task = mergedTask
                            if (task?.result?.urls?.[0]) {
                              navigate('/create', { state: { imageUrl: task.result.urls[0] } })
                            }
                          }}
                          onPublish={() => {
                            const task = mergedTask
                            if (task?.result?.urls?.[0]) {
                              navigate('/submit-work', { state: { imageUrl: task.result.urls[0] } })
                            }
                          }}
                          onShare={() => {
                            const task = mergedTask
                            if (task?.result?.urls?.[0]) {
                              navigator.clipboard.writeText(task.result.urls[0])
                              toast.success('链接已复制到剪贴板')
                            }
                          }}
                          onShareToFriend={() => {
                            const task = mergedTask
                            if (task?.result?.urls?.[0]) {
                              // 打开分享对话框或跳转到好友列表
                              navigate('/friends', { state: { shareImage: task.result.urls[0] } })
                            }
                          }}
                        />
                        {/* 消息操作栏 - 时间、语音、复制、引用、点赞等 */}
                        <div className="mt-2 flex items-center gap-2 px-1">
                          <span className="text-xs text-gray-400 font-medium">
                            {new Date(message.timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          <VoiceOutputButton text={message.content} />
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

          {/* 正在输入指示器 - 优化动画 */}
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
        </div>

        {/* 预设问题 - 美化卡片式展示 */}
        <AnimatePresence>
          {showPresetQuestions && messages.length === 1 && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="mt-6 max-w-2xl mx-auto px-1"
            >
              <motion.div
                className="text-center mb-5"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium ${
                  isDark ? 'bg-slate-800 text-slate-400' : 'bg-slate-100 text-slate-500'
                }`}>
                  <i className="fas fa-lightbulb text-amber-400" />
                  你可以试试这样问我
                </span>
              </motion.div>

              <div className="space-y-3">
                {Object.entries(PRESET_QUESTIONS).map(([key, category], catIndex) => (
                  <motion.div
                    key={key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: catIndex * 0.1 + 0.3 }}
                    className={`rounded-2xl overflow-hidden ${colors.bg.secondary} border ${colors.border.primary} shadow-sm hover:shadow-md transition-shadow duration-300`}
                  >
                    {/* 分类标题栏 */}
                    <div className={`px-4 py-2.5 border-b ${colors.border.primary} ${isDark ? 'bg-slate-800/50' : 'bg-slate-50/50'}`}>
                      <div className="flex items-center gap-2">
                        <span className={`w-6 h-6 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center text-xs shadow-sm`}>
                          {category.icon}
                        </span>
                        <h3 className={`text-xs font-semibold ${colors.text.secondary}`}>
                          {category.title}
                        </h3>
                      </div>
                    </div>

                    {/* 问题按钮 */}
                    <div className="p-3">
                      <div className="flex flex-wrap gap-2">
                        {category.items.map((item, index) => (
                          <motion.button
                            key={index}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: catIndex * 0.1 + index * 0.05 + 0.4 }}
                            whileHover={{ scale: 1.02, y: -1 }}
                            whileTap={{ scale: 0.98 }}
                            onClick={() => handleSend(item.text)}
                            className={`group flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition-all duration-200 ${
                              isDark
                                ? 'bg-slate-800 text-slate-300 hover:bg-slate-700 border border-slate-700 hover:border-violet-500/30'
                                : `${category.bgColor} text-slate-700 hover:bg-white border border-transparent hover:border-violet-200 hover:shadow-sm`
                            }`}
                          >
                            <span className="text-sm group-hover:scale-110 transition-transform">{item.icon}</span>
                            <span>{item.text}</span>
                          </motion.button>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* 输入区域 - 固定在底部导航栏上方 */}
      <motion.footer
        className={`fixed left-0 right-0 bottom-14 px-3 py-2 z-40 ${isDark ? 'bg-slate-900/90' : 'bg-white/90'} backdrop-blur-xl border-t ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'}`}
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      >
        <div className="max-w-2xl mx-auto">
          {/* 普通聊天输入框 */}
          <div className={`flex items-center gap-2 rounded-full ${isDark ? 'bg-slate-800/70' : 'bg-slate-100/70'} backdrop-blur-xl border ${isDark ? 'border-slate-700/50' : 'border-slate-200/50'} px-4 py-2`}>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              placeholder="输入消息..."
              className={`flex-1 text-sm ${colors.text.primary} placeholder:text-slate-400 bg-transparent border-0 focus:outline-none focus:ring-0`}
              disabled={isGenerating}
            />
            
            {/* 发送按钮 */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => handleSend()}
              disabled={!input.trim() || isGenerating}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-300 ${
                input.trim() && !isGenerating
                  ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-md'
                  : `${isDark ? 'bg-slate-700 text-slate-500' : 'bg-slate-300 text-slate-400'}`
              }`}
            >
              <i className="fas fa-paper-plane text-xs" />
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
        onSessionsChange={() => {
          // 会话列表变化时的回调
        }}
      />
    </div>
  )
}
