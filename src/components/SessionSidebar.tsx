import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, PanInfo } from 'framer-motion'
import { useTheme } from '@/hooks/useTheme'
import { ChatSession, sessionService } from '@/services/sessionService'
import { toast } from 'sonner'

interface SessionSidebarProps {
  isOpen: boolean
  onClose: () => void
  currentSessionId: string | null
  onSessionSelect: (sessionId: string) => void
  onSessionCreate: () => void
  onSessionsChange?: () => void
}

// 格式化时间显示
const formatTime = (timestamp: number): string => {
  const now = Date.now()
  const diff = now - timestamp
  const minute = 60 * 1000
  const hour = 60 * minute
  const day = 24 * hour
  const week = 7 * day

  if (diff < minute) return '刚刚'
  if (diff < hour) return `${Math.floor(diff / minute)}分钟前`
  if (diff < day) return `${Math.floor(diff / hour)}小时前`
  if (diff < week) return `${Math.floor(diff / day)}天前`

  const date = new Date(timestamp)
  return `${date.getMonth() + 1}/${date.getDate()}`
}

// 获取会话摘要
const getSessionSummary = (session: ChatSession): string => {
  const lastMessage = session.messages[session.messages.length - 1]
  if (!lastMessage) return '暂无消息'

  const content = lastMessage.content
  return content.length > 30 ? content.substring(0, 30) + '...' : content
}

export default function SessionSidebar({
  isOpen,
  onClose,
  currentSessionId,
  onSessionSelect,
  onSessionCreate,
  onSessionsChange
}: SessionSidebarProps) {
  const { isDark } = useTheme()
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [searchQuery, setSearchQuery] = useState('')
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [deletingSessionId, setDeletingSessionId] = useState<string | null>(null)
  const searchInputRef = useRef<HTMLInputElement>(null)
  const editInputRef = useRef<HTMLInputElement>(null)

  // 加载会话列表
  const loadSessions = useCallback(() => {
    const allSessions = sessionService.getAllSessions()
    setSessions(allSessions)
  }, [])

  // 初始加载
  useEffect(() => {
    loadSessions()
  }, [loadSessions])

  // 当侧边栏打开时重新加载
  useEffect(() => {
    if (isOpen) {
      loadSessions()
      // 聚焦搜索框
      setTimeout(() => searchInputRef.current?.focus(), 100)
    }
  }, [isOpen, loadSessions])

  // 编辑会话标题
  const handleStartEdit = (session: ChatSession) => {
    setEditingSessionId(session.id)
    setEditTitle(session.title)
    setTimeout(() => editInputRef.current?.focus(), 100)
  }

  const handleSaveTitle = () => {
    if (!editingSessionId || !editTitle.trim()) {
      setEditingSessionId(null)
      return
    }

    sessionService.updateSessionTitle(editingSessionId, editTitle.trim())
    loadSessions()
    onSessionsChange?.()
    setEditingSessionId(null)
    toast.success('会话标题已更新')
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSaveTitle()
    } else if (e.key === 'Escape') {
      setEditingSessionId(null)
    }
  }

  // 删除会话
  const handleDelete = async (sessionId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    if (deletingSessionId === sessionId) {
      // 确认删除
      setIsLoading(true)
      sessionService.deleteSession(sessionId)
      loadSessions()
      onSessionsChange?.()
      setDeletingSessionId(null)
      setIsLoading(false)
      toast.success('会话已删除')
    } else {
      // 首次点击，显示确认
      setDeletingSessionId(sessionId)
      // 3秒后自动取消
      setTimeout(() => setDeletingSessionId(null), 3000)
    }
  }

  // 滑动删除处理
  const handleDragEnd = (sessionId: string, info: PanInfo) => {
    if (info.offset.x < -100) {
      setDeletingSessionId(sessionId)
      setTimeout(() => setDeletingSessionId(null), 3000)
    }
  }

  // 过滤会话
  const filteredSessions = searchQuery
    ? sessions.filter(s =>
        s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.messages.some(m => m.content.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : sessions

  // 主题色彩
  const colors = {
    bg: {
      overlay: 'bg-black/50',
      sidebar: isDark ? 'bg-slate-900' : 'bg-white',
      header: isDark ? 'bg-slate-800/50' : 'bg-slate-50/50',
      item: isDark ? 'bg-slate-800' : 'bg-slate-50',
      itemActive: isDark ? 'bg-violet-900/30' : 'bg-violet-50',
      itemHover: isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'
    },
    text: {
      primary: isDark ? 'text-slate-100' : 'text-slate-900',
      secondary: isDark ? 'text-slate-400' : 'text-slate-500',
      tertiary: isDark ? 'text-slate-500' : 'text-slate-400',
      accent: 'text-violet-500'
    },
    border: {
      primary: isDark ? 'border-slate-700' : 'border-slate-200',
      secondary: isDark ? 'border-slate-800' : 'border-slate-100'
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 遮罩层 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className={`fixed inset-0 ${colors.bg.overlay} z-50 backdrop-blur-sm`}
          />

          {/* 侧边栏 */}
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className={`fixed left-0 top-0 bottom-0 w-[85%] max-w-[360px] ${colors.bg.sidebar} z-50 flex flex-col shadow-2xl`}
          >
            {/* 头部 */}
            <div className={`px-4 py-3 border-b ${colors.border.primary} ${colors.bg.header}`}>
              <div className="flex items-center justify-between mb-3">
                <h2 className={`font-bold text-lg ${colors.text.primary}`}>会话列表</h2>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={onClose}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-200'} transition-colors`}
                >
                  <i className="fas fa-times text-sm" />
                </motion.button>
              </div>

              {/* 搜索框 */}
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-slate-800' : 'bg-slate-100'} border ${colors.border.secondary}`}>
                <i className="fas fa-search text-xs text-slate-400" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索会话..."
                  className={`flex-1 bg-transparent text-sm ${colors.text.primary} placeholder:text-slate-400 focus:outline-none`}
                />
                {searchQuery && (
                  <motion.button
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    onClick={() => setSearchQuery('')}
                    className="p-1 rounded-full hover:bg-slate-200 dark:hover:bg-slate-700"
                  >
                    <i className="fas fa-times text-xs text-slate-400" />
                  </motion.button>
                )}
              </div>
            </div>

            {/* 新建会话按钮 */}
            <div className="px-4 py-3">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  onSessionCreate()
                  onClose()
                }}
                className={`w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium text-sm shadow-lg shadow-violet-500/25`}
              >
                <i className="fas fa-plus" />
                新建会话
              </motion.button>
            </div>

            {/* 会话列表 */}
            <div className="flex-1 overflow-y-auto px-4 pb-4">
              {filteredSessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-100'} flex items-center justify-center mb-4`}>
                    <i className={`fas fa-comments text-2xl ${colors.text.tertiary}`} />
                  </div>
                  <p className={`text-sm ${colors.text.secondary}`}>
                    {searchQuery ? '没有找到匹配的会话' : '暂无会话'}
                  </p>
                  {!searchQuery && (
                    <p className={`text-xs ${colors.text.tertiary} mt-1`}>
                      点击上方按钮创建新会话
                    </p>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  {filteredSessions.map((session, index) => (
                    <motion.div
                      key={session.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      drag="x"
                      dragConstraints={{ left: 0, right: 0 }}
                      dragElastic={0.2}
                      onDragEnd={(_, info) => handleDragEnd(session.id, info)}
                      className="relative"
                    >
                      {/* 删除确认背景 */}
                      {deletingSessionId === session.id && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          className="absolute inset-0 bg-red-500 rounded-xl flex items-center justify-end px-4"
                        >
                          <span className="text-white text-sm font-medium">松开会删除</span>
                        </motion.div>
                      )}

                      <motion.div
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={() => {
                          onSessionSelect(session.id)
                          onClose()
                        }}
                        className={`relative p-3 rounded-xl border cursor-pointer transition-all duration-200 ${
                          session.id === currentSessionId
                            ? `${colors.bg.itemActive} border-violet-500/50 shadow-sm`
                            : `${colors.bg.item} ${colors.border.secondary} ${colors.bg.itemHover}`
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          {/* 会话图标 */}
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                            session.id === currentSessionId
                              ? 'bg-violet-500 text-white'
                              : isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'
                          }`}>
                            <i className="fas fa-comment-alt text-sm" />
                          </div>

                          {/* 会话信息 */}
                          <div className="flex-1 min-w-0">
                            {editingSessionId === session.id ? (
                              <input
                                ref={editInputRef}
                                type="text"
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={handleSaveTitle}
                                onKeyDown={handleKeyDown}
                                onClick={(e) => e.stopPropagation()}
                                className={`w-full px-2 py-1 text-sm rounded ${isDark ? 'bg-slate-700 text-white' : 'bg-white text-slate-900'} border border-violet-500 focus:outline-none`}
                              />
                            ) : (
                              <h3
                                className={`font-medium text-sm truncate ${
                                  session.id === currentSessionId ? colors.text.accent : colors.text.primary
                                }`}
                                onDoubleClick={() => handleStartEdit(session)}
                              >
                                {session.title}
                              </h3>
                            )}
                            <p className={`text-xs truncate mt-0.5 ${colors.text.secondary}`}>
                              {getSessionSummary(session)}
                            </p>
                            <div className="flex items-center justify-between mt-1.5">
                              <span className={`text-[10px] ${colors.text.tertiary}`}>
                                {formatTime(session.updatedAt)}
                              </span>
                              {session.messageCount > 0 && (
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${isDark ? 'bg-slate-700 text-slate-400' : 'bg-slate-200 text-slate-500'}`}>
                                  {session.messageCount}条消息
                                </span>
                              )}
                            </div>
                          </div>

                          {/* 删除按钮 */}
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={(e) => handleDelete(session.id, e)}
                            className={`p-2 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity ${
                              deletingSessionId === session.id
                                ? 'bg-red-500 text-white'
                                : isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-200 text-slate-400'
                            }`}
                          >
                            <i className={`fas ${deletingSessionId === session.id ? 'fa-check' : 'fa-trash-alt'} text-xs`} />
                          </motion.button>
                        </div>
                      </motion.div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>

            {/* 底部统计 */}
            <div className={`px-4 py-3 border-t ${colors.border.primary} ${colors.bg.header}`}>
              <div className={`flex items-center justify-between text-xs ${colors.text.tertiary}`}>
                <span>共 {sessions.length} 个会话</span>
                {sessions.length > 0 && (
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      if (confirm('确定要清空所有会话吗？此操作不可恢复。')) {
                        sessionService.clearAllSessions()
                        loadSessions()
                        onSessionsChange?.()
                        toast.success('所有会话已清空')
                      }
                    }}
                    className="text-red-400 hover:text-red-500"
                  >
                    清空全部
                  </motion.button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
