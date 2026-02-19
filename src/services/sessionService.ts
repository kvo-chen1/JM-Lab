import { Message as BaseMessage } from './llmService'

// 扩展 Message 类型，支持生成任务
export interface Message extends BaseMessage {
  generationTask?: {
    id: string
    type: 'image' | 'video'
    status: 'pending' | 'processing' | 'completed' | 'failed'
    progress: number
    params: { prompt: string }
    result?: {
      urls: string[]
      revisedPrompt?: string
    }
    error?: string
  }
}

// 会话接口定义
export interface ChatSession {
  id: string
  title: string
  messages: Message[]
  createdAt: number
  updatedAt: number
  messageCount: number
}

// 存储键名
const STORAGE_KEY = 'jinmai_ai_sessions'
const CURRENT_SESSION_KEY = 'jinmai_ai_current_session'

// 生成唯一ID
const generateId = () => {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

// 生成会话标题（基于第一条消息）
const generateTitle = (messages: Message[]): string => {
  const firstUserMessage = messages.find(m => m.role === 'user')
  if (firstUserMessage) {
    const content = firstUserMessage.content.trim()
    // 截取前20个字符作为标题
    return content.length > 20 ? content.substring(0, 20) + '...' : content
  }
  return '新会话'
}

// 会话管理服务
class SessionService {
  // 获取所有会话
  getAllSessions(): ChatSession[] {
    try {
      const data = localStorage.getItem(STORAGE_KEY)
      if (!data) return []
      const sessions = JSON.parse(data) as ChatSession[]
      // 按更新时间排序（最新的在前）
      return sessions.sort((a, b) => b.updatedAt - a.updatedAt)
    } catch (error) {
      console.error('获取会话列表失败:', error)
      return []
    }
  }

  // 获取当前会话ID
  getCurrentSessionId(): string | null {
    try {
      return localStorage.getItem(CURRENT_SESSION_KEY)
    } catch (error) {
      console.error('获取当前会话ID失败:', error)
      return null
    }
  }

  // 设置当前会话ID
  setCurrentSessionId(sessionId: string | null): void {
    try {
      if (sessionId) {
        localStorage.setItem(CURRENT_SESSION_KEY, sessionId)
      } else {
        localStorage.removeItem(CURRENT_SESSION_KEY)
      }
    } catch (error) {
      console.error('设置当前会话ID失败:', error)
    }
  }

  // 创建新会话
  createSession(initialMessages: Message[] = []): ChatSession {
    const session: ChatSession = {
      id: generateId(),
      title: generateTitle(initialMessages),
      messages: initialMessages,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      messageCount: initialMessages.length
    }

    const sessions = this.getAllSessions()
    sessions.unshift(session)
    this.saveSessions(sessions)
    this.setCurrentSessionId(session.id)

    return session
  }

  // 获取指定会话
  getSession(sessionId: string): ChatSession | null {
    const sessions = this.getAllSessions()
    return sessions.find(s => s.id === sessionId) || null
  }

  // 更新会话消息
  updateSessionMessages(sessionId: string, messages: Message[]): ChatSession | null {
    const sessions = this.getAllSessions()
    const index = sessions.findIndex(s => s.id === sessionId)

    if (index === -1) return null

    const session = sessions[index]
    session.messages = messages
    session.messageCount = messages.length
    session.updatedAt = Date.now()

    // 如果标题是默认的，且现在有用户消息了，更新标题
    if (session.title === '新会话' || messages.length > 0) {
      const newTitle = generateTitle(messages)
      if (newTitle !== '新会话') {
        session.title = newTitle
      }
    }

    // 移到最前面
    sessions.splice(index, 1)
    sessions.unshift(session)

    this.saveSessions(sessions)
    return session
  }

  // 更新会话标题
  updateSessionTitle(sessionId: string, title: string): ChatSession | null {
    const sessions = this.getAllSessions()
    const session = sessions.find(s => s.id === sessionId)

    if (!session) return null

    session.title = title
    session.updatedAt = Date.now()

    this.saveSessions(sessions)
    return session
  }

  // 删除会话
  deleteSession(sessionId: string): boolean {
    const sessions = this.getAllSessions()
    const filtered = sessions.filter(s => s.id !== sessionId)

    if (filtered.length === sessions.length) return false

    this.saveSessions(filtered)

    // 如果删除的是当前会话，清除当前会话ID
    if (this.getCurrentSessionId() === sessionId) {
      this.setCurrentSessionId(null)
    }

    return true
  }

  // 批量删除会话
  deleteSessions(sessionIds: string[]): boolean {
    const sessions = this.getAllSessions()
    const filtered = sessions.filter(s => !sessionIds.includes(s.id))

    if (filtered.length === sessions.length) return false

    this.saveSessions(filtered)

    // 检查当前会话是否被删除
    const currentId = this.getCurrentSessionId()
    if (currentId && sessionIds.includes(currentId)) {
      this.setCurrentSessionId(null)
    }

    return true
  }

  // 清空所有会话
  clearAllSessions(): void {
    localStorage.removeItem(STORAGE_KEY)
    localStorage.removeItem(CURRENT_SESSION_KEY)
  }

  // 获取会话数量
  getSessionCount(): number {
    return this.getAllSessions().length
  }

  // 搜索会话
  searchSessions(keyword: string): ChatSession[] {
    const sessions = this.getAllSessions()
    const lowerKeyword = keyword.toLowerCase()

    return sessions.filter(session => {
      // 搜索标题
      if (session.title.toLowerCase().includes(lowerKeyword)) return true

      // 搜索消息内容
      return session.messages.some(msg =>
        msg.content.toLowerCase().includes(lowerKeyword)
      )
    })
  }

  // 导出会话数据
  exportSessions(): string {
    const sessions = this.getAllSessions()
    return JSON.stringify(sessions, null, 2)
  }

  // 导入会话数据
  importSessions(jsonData: string): boolean {
    try {
      const sessions = JSON.parse(jsonData) as ChatSession[]
      if (!Array.isArray(sessions)) return false

      // 验证数据格式
      const validSessions = sessions.filter(s =>
        s.id && s.title && Array.isArray(s.messages)
      )

      this.saveSessions(validSessions)
      return true
    } catch (error) {
      console.error('导入会话数据失败:', error)
      return false
    }
  }

  // 私有方法：保存会话列表
  private saveSessions(sessions: ChatSession[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions))
    } catch (error) {
      console.error('保存会话列表失败:', error)
      // 如果存储空间不足，尝试删除旧会话
      if (error instanceof DOMException && error.name === 'QuotaExceededError') {
        this.handleStorageQuotaExceeded(sessions)
      }
    }
  }

  // 处理存储空间不足
  private handleStorageQuotaExceeded(sessions: ChatSession[]): void {
    // 保留最近的30个会话
    const trimmedSessions = sessions.slice(0, 30)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmedSessions))
      console.warn('存储空间不足，已自动清理旧会话')
    } catch (error) {
      console.error('清理后仍无法保存:', error)
    }
  }
}

// 导出单例实例
export const sessionService = new SessionService()
