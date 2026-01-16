import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { llmService, Message, ConversationSession } from '@/services/llmService'
import { toast } from 'sonner'
import SpeechInput from './SpeechInput'
import { useTranslation } from 'react-i18next'

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
  const [sessions, setSessions] = useState<ConversationSession[]>([])
  const [currentSession, setCurrentSession] = useState<ConversationSession | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
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
    if (!input.trim() || !currentSession) return
    
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
      // 调用LLM服务生成响应
      const response = await llmService.generateResponse(userInput, {
        context,
        onDelta: (chunk) => {
          // 这里可以实现流式响应的实时更新
        }
      })
      
      // 更新消息列表
      const updatedSessions = llmService.getSessions()
      const activeSession = updatedSessions.find(s => s.isActive)
      if (activeSession) {
        setMessages(activeSession.messages)
        setCurrentSession(activeSession)
        setSessions(updatedSessions)
      }
      
      // 通知父组件内容已生成
      if (onContentGenerated) {
        onContentGenerated(response)
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : t('aiCollab.errors.generateFailed')
      const hint =
        serviceStatus === 'error' ||
        /Failed to fetch|NetworkError|ECONNREFUSED|timeout|aborted/i.test(message)
          ? t('aiCollab.hints.startProxy')
          : /密钥|API.?key|unauthorized|401|403/i.test(message)
            ? t('aiCollab.hints.configureKey')
            : ''
      const sep = i18n.language.startsWith('zh') ? '。' : '. '
      toast.error(hint ? `${message}${sep}${hint}` : message)
      console.error('Error generating AI response:', error)
    } finally {
      setIsGenerating(false)
      setIsTyping(false)
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
            className={`relative w-full max-w-5xl h-full flex flex-col bg-white dark:bg-gray-900 shadow-2xl transition-all duration-300 transform ${isDark ? 'border-gray-800' : 'border-gray-200'}`}
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            style={{ borderLeft: '1px solid', maxWidth: '100%' }}
          >
            {/* 面板头部 */}
            <div className="p-4 border-b dark:border-gray-800">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-xl font-bold">{t('aiCollab.title')}</h2>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{t('aiCollab.subtitle')}</span>
                  <span
                    className={`text-xs px-2 py-1 rounded-full ${
                      serviceStatus === 'ok'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                        : serviceStatus === 'error'
                          ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
                          : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300'
                    }`}
                  >
                    {serviceStatus === 'ok'
                      ? t('aiCollab.status.ok')
                      : serviceStatus === 'error'
                        ? t('aiCollab.status.error')
                        : t('aiCollab.status.unknown')}
                  </span>
                </div>
                <button
                  onClick={() => checkAIService(true)}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  aria-label={t('aiCollab.actions.checkService')}
                >
                  <i className="fas fa-heartbeat"></i>
                </button>
                <button
                  onClick={onClose}
                  className={`p-2 rounded-full ${isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-100 text-gray-700'}`}
                  aria-label={t('aiCollab.actions.close')}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            
            {/* 面板内容 */}
            <div className="flex flex-1 overflow-hidden">
              {/* 左侧会话列表 */}
              <div className="w-64 border-r dark:border-gray-800 flex flex-col">
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
                      className={`p-3 cursor-pointer border-b dark:border-gray-800 transition-colors ${currentSession?.id === session.id ? (isDark ? 'bg-gray-800 text-white' : 'bg-gray-50 text-black') : (isDark ? 'hover:bg-gray-800 text-gray-300' : 'hover:bg-gray-50 text-gray-700')}`}
                      whileHover={{ x: 5 }}
                      onClick={() => switchSession(session.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{session.name}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                            {t('aiCollab.labels.messageCount', { count: session.messages.length })}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 ml-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation()
                              deleteSession(session.id)
                            }}
                            className="p-1 rounded text-gray-400 hover:text-red-500 transition-colors"
                            aria-label={t('aiCollab.actions.deleteSession')}
                          >
                            <i className="fas fa-trash text-xs"></i>
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>
                
                {/* 左侧底部操作 */}
                <div className="p-3 border-t dark:border-gray-800">
                  <button
                    onClick={clearCurrentSession}
                    className={`w-full text-xs py-2 rounded ${isDark ? 'bg-red-900/20 text-red-400 hover:bg-red-900/30' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                  >
                    {t('aiCollab.actions.clearCurrentSession')}
                  </button>
                </div>
              </div>
              
              {/* 右侧对话区域 */}
              <div className="flex-1 flex flex-col">
                {/* 对话头部 */}
                <div className="p-3 border-b dark:border-gray-800">
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
                  {messages.length === 0 ? (
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
                    </div>
                  ) : (
                    messages.map((message, index) => (
                      <motion.div
                        key={index}
                        className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <div className={`max-w-[75%] p-3 rounded-lg ${message.role === 'user' ? (isDark ? 'bg-blue-900/30 text-white' : 'bg-blue-100 text-black') : (isDark ? 'bg-gray-800 text-white' : 'bg-gray-100 text-black')}`}>
                          <div className="flex items-start gap-2">
                            <div className={`flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${message.role === 'user' ? (isDark ? 'bg-blue-600 text-white' : 'bg-blue-500 text-white') : (isDark ? 'bg-gray-700 text-white' : 'bg-gray-500 text-white')}`}>
                              {message.role === 'user' ? t('aiCollab.roles.me') : t('aiCollab.roles.ai')}
                            </div>
                            <div className="flex-1">
                              <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                              <p className="text-xs text-gray-400 mt-1">{formatTime(message.timestamp)}</p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                  <div ref={messagesEndRef} />
                </div>
                
                {/* 输入区域 */}
                <div className="p-4 border-t dark:border-gray-800">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 relative">
                      <textarea
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
                        placeholder={t('aiCollab.placeholders.input')}
                        className={`w-full min-h-[80px] p-3 rounded-lg border resize-none ${isDark ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-300 text-black'} focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all duration-300`}
                        disabled={isGenerating}
                      />
                      <div className="absolute right-3 bottom-3">
                        <SpeechInput 
                          onTextRecognized={(text) => setInput(prev => prev + text)} 
                          language={i18n.language.startsWith('zh') ? 'zh-CN' : 'en-US'}
                        />
                      </div>
                    </div>
                    <button
                      onClick={sendMessage}
                      disabled={isGenerating || !input.trim()}
                      className={`px-4 py-2 rounded-lg transition-colors ${isGenerating || !input.trim() ? (isDark ? 'bg-gray-700 text-gray-400 cursor-not-allowed' : 'bg-gray-300 text-gray-500 cursor-not-allowed') : (isDark ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-red-600 hover:bg-red-700 text-white')}`}
                    >
                      {isGenerating ? (
                        <div className="flex items-center gap-1">
                          <i className="fas fa-spinner fa-spin"></i>
                          <span>{t('aiCollab.actions.generating')}</span>
                        </div>
                      ) : (
                        <span>{t('aiCollab.actions.send')}</span>
                      )}
                    </button>
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
