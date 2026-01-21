import { useState, useEffect, useRef, useContext } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { llmService, Message, ConversationSession, AssistantPersonality, AssistantTheme } from '@/services/llmService'
import { toast } from 'sonner'
import SpeechInput from './SpeechInput'
import { useTranslation } from 'react-i18next'
import { AuthContext } from '../contexts/authContext'
import AICollaborationMessage from './AICollaborationMessage'
import localServices from '@/services/localServices'
import { getRecommendations, RecommendedItem, recordRecommendationClick } from '@/services/recommendationService'

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
  const { isDark } = useTheme()
  const { t, i18n } = useTranslation()
  const { user } = useContext(AuthContext)
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
  const [showTemplates, setShowTemplates] = useState(false)
  const [showExportOptions, setShowExportOptions] = useState(false)
  const [serviceStatus, setServiceStatus] = useState<'unknown' | 'ok' | 'error'>('unknown')
  const [llmHealth, setLlmHealth] = useState<any>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 个性化设置相关状态
  const [showSettings, setShowSettings] = useState(false)
  const [personality, setPersonality] = useState<AssistantPersonality>('friendly')
  const [theme, setTheme] = useState<AssistantTheme>('auto')
  const [showPresetQuestions, setShowPresetQuestions] = useState(true)
  const [enableTypingEffect, setEnableTypingEffect] = useState(true)
  const [autoScroll, setAutoScroll] = useState(true)
  // 移动端相关状态
  const [showSessionList, setShowSessionList] = useState(false)
  // 反馈相关状态
  const [feedbackVisible, setFeedbackVisible] = useState<{[key: number]: boolean}>({})
  const [feedbackRatings, setFeedbackRatings] = useState<{[key: number]: number}>({})
  const [feedbackComments, setFeedbackComments] = useState<{[key: number]: string}>({})
  
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

  // 加载会话列表
  useEffect(() => {
    const loadedSessions = llmService.getSessions()
    setSessions(loadedSessions)
    
    // 设置当前会话
    const activeSession = loadedSessions.find(session => session.isActive) || loadedSessions[0]
    if (activeSession) {
      setCurrentSession(activeSession)
      setMessages(activeSession.messages)
    }
  }, [isOpen])

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

  // 加载个性化设置
  useEffect(() => {
    const config = llmService.getConfig()
    setPersonality(config.personality)
    setTheme(config.theme)
    setShowPresetQuestions(config.show_preset_questions)
    setEnableTypingEffect(config.enable_typing_effect)
    setAutoScroll(config.auto_scroll)
  }, [isOpen])

  // 保存个性化设置
  const saveSettings = () => {
    llmService.updateConfig({
      personality,
      theme,
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
        setTheme(value)
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
      '/explore': `你好！我是津小脉，欢迎来到探索页面。在这里你可以发现各类优秀作品，按照不同维度筛选内容。需要我帮你了解搜索和筛选功能吗？`,
      '/create': `你好！我是津小脉，欢迎来到创作中心。现在你可以开始你的创作之旅，使用各种AI辅助工具和素材。需要我帮你了解创作工具的使用方法吗？`,
      '/dashboard': `你好！我是津小脉，欢迎来到仪表盘。这里展示了你的创作数据和平台动态。需要我帮你解读数据或了解平台动态吗？`,
      '/neo': `你好！我是津小脉，欢迎来到灵感引擎。在这里你可以获得创作灵感和AI辅助建议。需要我帮你激发创意吗？`,
      '/tools': `你好！我是津小脉，欢迎来到工具页面。这里汇聚了各种创作辅助工具。需要我帮你了解工具的使用方法吗？`
    };
    
    const path = context?.path || '';
    const page = context?.page || '';
    return welcomeMessages[path] || `你好！我是津小脉，当前你正在浏览「${page}」页面，有什么可以帮助你的吗？`;
  };

  // 添加初始欢迎消息 - 上下文感知
  useEffect(() => {
    if (messages.length === 0 && isOpen) {
      const initialMessage: Message = {
        role: 'assistant',
        content: getWelcomeMessage(),
        timestamp: Date.now()
      };
      setMessages([initialMessage]);
    }
  }, [isOpen, messages.length, context]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // 创建新会话
  const createNewSession = () => {
    if (!newSessionName.trim()) {
      toast.warning(t('aiCollab.toasts.sessionNameRequired'))
      return
    }
    
    const newSession = llmService.createSession(newSessionName.trim())
    setSessions([newSession, ...sessions.filter(s => !s.isActive)])
    setCurrentSession(newSession)
    setMessages(newSession.messages)
    setNewSessionName('')
    setShowNewSessionModal(false)
  }

  // 切换会话
  const switchSession = (sessionId: string) => {
    llmService.switchSession(sessionId)
    const updatedSessions = llmService.getSessions()
    setSessions(updatedSessions)
    const activeSession = updatedSessions.find(session => session.isActive) || updatedSessions[0]
    if (activeSession) {
      setCurrentSession(activeSession)
      setMessages(activeSession.messages)
    }
  }

  // 删除会话
  const deleteSession = (sessionId: string) => {
    llmService.deleteSession(sessionId)
    const updatedSessions = llmService.getSessions()
    setSessions(updatedSessions)
    const activeSession = updatedSessions.find(session => session.isActive) || updatedSessions[0]
    if (activeSession) {
      setCurrentSession(activeSession)
      setMessages(activeSession.messages)
    }
  }

  // 重命名会话
  const renameSession = () => {
    if (!editingSessionName.trim() || !currentSession) return
    
    llmService.renameSession(currentSession.id, editingSessionName.trim())
    const updatedSessions = llmService.getSessions()
    setSessions(updatedSessions)
    const updatedSession = updatedSessions.find(s => s.id === currentSession.id)
    if (updatedSession) {
      setCurrentSession(updatedSession)
    }
    setIsEditingSessionName(false)
  }

  // 发送消息
  const sendMessage = async () => {
    if (!input.trim() || !currentSession || isGenerating) return
    
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
            return
          } else {
            response = '请提供完整的出发地与目的地，例如：“从天津站到鼓楼怎么去”。'
            setMessages(prev => [...prev, { role: 'assistant', content: response, timestamp: Date.now() }])
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
            window.location.href = navigationTarget.path;
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
          response = await llmService.directGenerateResponse(userInput, {
            context,
            onDelta: (chunk) => {
              // 实现流式响应的实时更新
              setMessages(prev => {
                const updatedMessages = [...prev];
                const lastMessage = updatedMessages[updatedMessages.length - 1];
                if (lastMessage && lastMessage.role === 'assistant') {
                  lastMessage.content += chunk;
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

  // 清除当前会话历史
  const clearCurrentSession = () => {
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
            {/* 面板头部 */}
            <div className="p-4 border-b dark:border-gray-800/50 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 text-white shadow-lg relative overflow-hidden rounded-t-2xl">
              {/* 装饰性背景元素 */}
              <div className="absolute top-0 left-0 w-full h-full opacity-20">
                <div className="absolute top-[-30%] left-[-30%] w-96 h-96 rounded-full bg-white blur-3xl"></div>
                <div className="absolute bottom-[-30%] right-[-30%] w-96 h-96 rounded-full bg-white blur-3xl"></div>
                <div className="absolute top-1/2 left-1/2 w-80 h-80 rounded-full bg-white opacity-5 blur-3xl transform -translate-x-1/2 -translate-y-1/2"></div>
              </div>
              <div className="relative flex items-center justify-between z-10">
                <div className="flex items-center gap-3">
                  <motion.div 
                    className="w-12 h-12 rounded-full bg-gradient-to-br from-white/40 to-white/20 backdrop-blur-md flex items-center justify-center shadow-xl border border-white/30"
                    whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(255, 255, 255, 0.4)' }}
                    transition={{ type: 'spring', stiffness: 400, damping: 10 }}
                  >
                    <i className="fas fa-robot text-white text-xl animate-pulse-slow"></i>
                  </motion.div>
                  <h2 className="text-xl font-bold tracking-tight">津小脉</h2>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span
                    className={`text-xs px-3 py-1.5 rounded-full font-medium transition-all duration-300 ${serviceStatus === 'ok' ? 'bg-green-100 text-green-800 hover:bg-green-200' : serviceStatus === 'error' ? 'bg-red-100 text-red-800 hover:bg-red-200' : 'bg-gray-100 text-gray-800 hover:bg-gray-200'}`}
                    whileHover={{ scale: 1.05 }}
                  >
                    {serviceStatus === 'ok' ? '已连接' : serviceStatus === 'error' ? '连接错误' : '未知状态'}
                  </motion.span>
                  <motion.button
                    onClick={() => checkAIService(true)}
                    className={`p-2 rounded-full transition-all duration-300 ${isDark ? 'hover:bg-white/15' : 'hover:bg-white/20'}`}
                    aria-label={t('aiCollab.actions.checkService')}
                    whileHover={{ scale: 1.15, boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className="fas fa-heartbeat animate-pulse text-white"></i>
                  </motion.button>
                  <motion.button
                    onClick={onClose}
                    className={`p-2 rounded-full transition-all duration-300 ${isDark ? 'hover:bg-white/15' : 'hover:bg-white/20'}`}
                    aria-label={t('aiCollab.actions.close')}
                    whileHover={{ scale: 1.15, boxShadow: '0 0 15px rgba(255, 255, 255, 0.3)' }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <i className="fas fa-times text-white"></i>
                  </motion.button>
                </div>
              </div>
            </div>
            
            {/* 面板内容 */}
            <div className="flex flex-1 overflow-hidden">
              {/* 左侧会话列表 - 响应式设计 */}
              <div className={`w-64 border-r dark:border-gray-800 flex flex-col md:flex ${showSessionList ? 'block' : 'hidden'}`}>
                {/* 会话列表头部 */}
                <div className="p-3 border-b dark:border-gray-800">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-medium">{t('aiCollab.labels.sessions')}</h3>
                    <button
                      onClick={() => setShowNewSessionModal(true)}
                      className={`p-1.5 rounded-full ${isDark ? 'bg-green-900/20 text-green-400 hover:bg-green-900/30' : 'bg-green-50 text-green-600 hover:bg-green-100'}`}
                      aria-label={t('aiCollab.actions.newSession')}
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                </div>
                
                {/* 会话列表 */}
                <div className="flex-1 overflow-y-auto">
                  {sessions.map(session => (
                    <motion.div
                      key={session.id}
                      className={`p-3.5 cursor-pointer border-b dark:border-gray-800/50 transition-all duration-300 rounded-l-lg ${currentSession?.id === session.id ? (isDark ? 'bg-gradient-to-r from-blue-900/30 to-purple-900/30 text-white' : 'bg-gradient-to-r from-blue-50 to-purple-50 text-gray-900') : (isDark ? 'hover:bg-gray-800 text-gray-200' : 'hover:bg-gray-50 text-gray-900')}`}
                      whileHover={{ x: 5 }}
                      onClick={() => switchSession(session.id)}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3 }}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate flex items-center gap-2">
                            {currentSession?.id === session.id && (
                              <motion.span 
                                className="w-2 h-2 rounded-full bg-blue-500"
                                animate={{ scale: [1, 1.2, 1] }}
                                transition={{ repeat: Infinity, duration: 1.5 }}
                              ></motion.span>
                            )}
                            {session.name}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {t('aiCollab.labels.messageCount', { count: session.messages.length })}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <motion.button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSession(session.id)
                            }}
                            className="p-1.5 rounded-full text-gray-400 hover:text-red-500 transition-colors hover:bg-red-50 dark:hover:bg-red-900/20"
                            aria-label={t('aiCollab.actions.deleteSession')}
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                          >
                            <i className="fas fa-trash text-sm"></i>
                          </motion.button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* 左侧底部操作 */}
                <div className="p-3.5 border-t dark:border-gray-800/50">
                  <motion.button
                    onClick={clearCurrentSession}
                    className={`w-full text-sm py-3 rounded-2xl transition-all duration-300 font-medium flex items-center justify-center gap-2 ${isDark ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30 hover:text-red-300' : 'bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700'}`}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <i className="fas fa-trash-alt"></i>
                    {t('aiCollab.actions.clearCurrentSession')}
                  </motion.button>
                </div>
              </div>
              
              {/* 右侧对话区域 */}
              <div className="flex-1 flex flex-col">
                {/* 对话头部 */}
                <div className="p-3 border-b dark:border-gray-800">
                  {/* 移动端会话列表切换按钮 */}
                  <div className="flex items-center justify-between mb-2">
                    <button
                      onClick={() => setShowSessionList(!showSessionList)}
                      className={`p-2 rounded-full text-sm font-medium mb-2 ${isDark ? 'bg-gray-800 text-gray-200 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                      style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
                    >
                      <i className={`fas fa-${showSessionList ? 'chevron-left' : 'chevron-right'}`}></i>
                      <span className="hidden sm:inline">{t('aiCollab.labels.sessions')}</span>
                    </button>
                  </div>
                  {isEditingSessionName ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={editingSessionName}
                        onChange={(e) => setEditingSessionName(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && renameSession()}
                        onBlur={renameSession}
                        className={`flex-1 text-sm p-1 border rounded ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'} focus:outline-none focus:ring-1 focus:ring-blue-500`}
                        autoFocus
                      />
                      <button
                        onClick={renameSession}
                        className="text-xs px-2 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      >
                        {t('aiCollab.actions.save')}
                      </button>
                      <button
                        onClick={() => {
                          setIsEditingSessionName(false)
                          setEditingSessionName(currentSession?.name || '')
                        }}
                        className="text-xs px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        {t('aiCollab.actions.cancel')}
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-medium">
                        {currentSession?.name}
                        <button
                          onClick={() => {
                            setIsEditingSessionName(true)
                            setEditingSessionName(currentSession?.name || '')
                          }}
                          className="ml-2 text-xs text-gray-400 hover:text-blue-500 transition-colors"
                        >
                          <i className="fas fa-pen"></i>
                        </button>
                      </h3>
                      <div className="flex items-center gap-2">
                          {/* 使用模板按钮 */}
                          <button
                            onClick={() => setShowTemplates(!showTemplates)}
                            className={`p-1.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            aria-label={t('aiCollab.actions.useTemplate')}
                          >
                            <i className="fas fa-file-alt"></i>
                          </button>
                          
                          {/* 设置按钮 */}
                          <button
                            onClick={() => setShowSettings(!showSettings)}
                            className={`p-1.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            aria-label="设置"
                          >
                            <i className="fas fa-cog"></i>
                          </button>
                          
                          {/* 导出会话按钮 */}
                          <button
                            onClick={() => setShowExportOptions(!showExportOptions)}
                            className={`p-1.5 rounded-full ${isDark ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            aria-label={t('aiCollab.actions.export')}
                          >
                            <i className="fas fa-download"></i>
                          </button>
                          
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {formatTime(Date.now())}
                          </div>
                        </div>
                    </div>
                  )}
                </div>
                
                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {/* 对话模板弹窗 */}
                  <AnimatePresence>
                    {showTemplates && (
                      <motion.div
                        className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-20"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowTemplates(false)}
                      >
                        <motion.div
                          className={`p-5 rounded-xl shadow-2xl ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'} max-w-md w-full`}
                          initial={{ scale: 0.9, opacity: 0 }}
                          animate={{ scale: 1, opacity: 1 }}
                          exit={{ scale: 0.9, opacity: 0 }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <h3 className="text-lg font-bold mb-3">{t('aiCollab.templatesTitle')}</h3>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {conversationTemplates.map(template => (
                              <div
                                key={template.id}
                                className={`p-3 rounded-lg border ${isDark ? 'border-gray-700 hover:border-blue-500' : 'border-gray-200 hover:border-blue-500'} cursor-pointer transition-colors`}
                                onClick={() => useTemplate(template)}
                              >
                                <h4 className="font-medium">{template.name}</h4>
                                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">{template.description}</p>
                                <p className="text-xs bg-gray-100 dark:bg-gray-700 p-2 rounded">
                                  {template.prompt}
                                </p>
                              </div>
                            ))}
                          </div>
                          <div className="mt-4 flex justify-end">
                            <button
                              onClick={() => setShowTemplates(false)}
                              className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}
                            >
                              {t('aiCollab.actions.cancel')}
                            </button>
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-4"
                    >
                      <h3 className="text-lg font-bold mb-4">设置</h3>
                      
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
                  ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-center">
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
                      {recs.length > 0 && (
                        <div className="mt-6 w-full max-w-2xl">
                          <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>为你推荐</h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            {recs.slice(0, 6).map(item => (
                              <button
                                key={`${item.type}_${item.id}`}
                                onClick={() => {
                                  recordRecommendationClick(user!.id, item)
                                  setInput(`请介绍一下「${item.title}」相关内容，并给我适合的创作灵感。`)
                                }}
                                className={`flex items-center gap-3 p-3 rounded-xl transition-colors border ${
                                  isDark ? 'bg-gray-800 border-gray-700 hover:bg-gray-700' : 'bg-white border-gray-200 hover:bg-gray-50'
                                }`}
                              >
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-200">
                                  {item.thumbnail ? (
                                    <img src={item.thumbnail} alt={item.title} className="w-full h-full object-cover" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                      <i className="fas fa-image"></i>
                                    </div>
                                  )}
                                </div>
                                <div className="flex-1 min-w-0 text-left">
                                  <div className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-black'}`}>{item.title}</div>
                                  <div className="text-xs text-gray-500 truncate">{item.reason || '个性化推荐'}</div>
                                </div>
                                <div className="text-[10px] px-2 py-0.5 rounded-full border text-gray-500">{item.type}</div>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <AICollaborationMessage
                        key={index}
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
                      />
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* 输入区域 */}
                <div className="p-3.5 border-t dark:border-gray-800/50 bg-gradient-to-b from-transparent to-gray-50 dark:to-gray-900">
                  <div className="flex items-end gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder={t('aiCollab.placeholders.input')}
                        className={`w-full min-h-[64px] max-h-[200px] p-4 rounded-2xl border resize-none shadow-sm ${isDark ? 'bg-gray-800 border-gray-700/50 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'} focus:outline-none focus:ring-3 focus:ring-blue-500/30 focus:border-blue-500 transition-all duration-300`}
                        disabled={isGenerating}
                        style={{ resize: 'none' }}
                      />
                      <div className="absolute right-4 bottom-4">
                        <SpeechInput 
                          onTextRecognized={(text) => setInput(prev => prev + text)} 
                          language={i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US'}
                        />
                      </div>
                    </div>
                    <motion.button
                      onClick={sendMessage}
                      disabled={isGenerating || !input.trim()}
                      className={`px-4.5 py-3.5 rounded-2xl transition-all duration-300 font-medium shadow-md flex-shrink-0 ${isGenerating || !input.trim() ? (isDark ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') : (isDark ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white')}`}
                      whileHover={!isGenerating && input.trim() ? { scale: 1.05, boxShadow: '0 8px 20px rgba(99, 102, 241, 0.3)' } : {}}
                      whileTap={!isGenerating && input.trim() ? { scale: 0.98 } : {}}
                      transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-1.5">
                          <motion.i 
                            className="fas fa-spinner fa-spin text-sm"
                            animate={{ rotate: 360 }}
                            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                          ></motion.i>
                          <span className="hidden sm:inline text-sm">生成中...</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="hidden sm:inline">发送</span>
                          <i className="fas fa-paper-plane"></i>
                        </div>
                      )}
                    </motion.button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* 新建会话模态框 */}
            <AnimatePresence>
              {showNewSessionModal && (
                <motion.div
                  className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <motion.div
                    className={`p-5 rounded-xl shadow-2xl ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-black'}`}
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                  >
                    <h3 className="text-lg font-bold mb-3">{t('aiCollab.newSession.title')}</h3>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium mb-1">{t('aiCollab.newSession.nameLabel')}</label>
                        <input
                          type="text"
                          value={newSessionName}
                          onChange={(e) => setNewSessionName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && createNewSession()}
                          placeholder={t('aiCollab.newSession.namePlaceholder')}
                          className={`w-full p-3 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-black'} focus:outline-none focus:ring-2 focus:ring-blue-500`}
                          autoFocus
                        />
                      </div>
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => setShowNewSessionModal(false)}
                          className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-black'}`}
                        >
                          {t('aiCollab.actions.cancel')}
                        </button>
                        <button
                          onClick={createNewSession}
                          className={`px-4 py-2 rounded-lg transition-colors ${isDark ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-green-600 hover:bg-green-700 text-white'}`}
                        >
                          {t('aiCollab.actions.create')}
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
