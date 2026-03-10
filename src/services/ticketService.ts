/**
 * 工单服务 - 管理用户反馈的工单系统
 */

// 工单状态类型
export type TicketStatus = 'pending' | 'processing' | 'resolved' | 'closed'

// 工单优先级类型
export type TicketPriority = 'low' | 'medium' | 'high'

// 工单类型
export interface Ticket {
  id: string
  userId: string
  username: string
  email: string
  type: string
  title: string
  description: string
  screenshot?: string
  status: TicketStatus
  priority: TicketPriority
  createdAt: Date
  updatedAt: Date
  assignedTo?: string
  resolvedAt?: Date
  resolution?: string
  comments: TicketComment[]
}

// 工单评论类型
export interface TicketComment {
  id: string
  ticketId: string
  userId: string
  username: string
  content: string
  createdAt: Date
  isInternal?: boolean // 是否为内部评论
}

// 工单服务类
class TicketService {
  private tickets: Map<string, Ticket> = new Map()
  private lastId: number = 0
  
  constructor() {
    // 初始化模拟数据
    this.initializeMockData()
  }
  
  /**
   * 初始化模拟数据
   */
  private initializeMockData(): void {
    const mockTickets: Omit<Ticket, 'id' | 'comments' | 'createdAt' | 'updatedAt'>[] = [
      {
        userId: 'user-1',
        username: '测试用户1',
        email: 'test1@example.com',
        type: 'bug',
        title: '页面加载速度慢',
        description: '首页加载时间超过5秒，体验很差',
        status: 'pending',
        priority: 'medium'
      },
      {
        userId: 'user-2',
        username: '测试用户2',
        email: 'test2@example.com',
        type: 'feature',
        title: '希望增加夜间模式',
        description: '希望平台能增加夜间模式，保护眼睛',
        status: 'processing',
        priority: 'high'
      },
      {
        userId: 'user-3',
        username: '测试用户3',
        email: 'test3@example.com',
        type: 'suggestion',
        title: '建议优化搜索功能',
        description: '搜索功能不够智能，希望能优化搜索算法',
        status: 'resolved',
        priority: 'low',
        assignedTo: 'admin-1',
        resolvedAt: new Date(Date.now() - 86400000),
        resolution: '已计划在下个版本优化搜索功能'
      }
    ]
    
    // 添加模拟数据到内存中
    mockTickets.forEach(ticket => {
      this.createTicket({
        ...ticket,
        userId: ticket.userId,
        email: ticket.email
      })
    })
  }
  
  /**
   * 创建工单
   */
  createTicket(ticketData: Omit<Ticket, 'id' | 'comments' | 'createdAt' | 'updatedAt'> & { userId: string; email: string }): Ticket {
    const id = `ticket-${++this.lastId}`
    const now = new Date()
    
    const ticket: Ticket = {
      ...ticketData,
      id,
      comments: [],
      createdAt: now,
      updatedAt: now
    }
    
    this.tickets.set(id, ticket)
    return ticket
  }
  
  /**
   * 获取所有工单
   */
  getAllTickets(): Ticket[] {
    return Array.from(this.tickets.values()).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
  
  /**
   * 根据ID获取工单
   */
  getTicketById(id: string): Ticket | undefined {
    return this.tickets.get(id)
  }
  
  /**
   * 根据用户ID获取工单
   */
  getTicketsByUserId(userId: string): Ticket[] {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.userId === userId)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
  
  /**
   * 更新工单状态
   */
  updateTicketStatus(id: string, status: TicketStatus, resolution?: string): Ticket | undefined {
    const ticket = this.tickets.get(id)
    if (!ticket) return undefined
    
    const updatedTicket: Ticket = {
      ...ticket,
      status,
      updatedAt: new Date(),
      resolution: status === 'resolved' ? resolution : ticket.resolution,
      resolvedAt: status === 'resolved' ? new Date() : ticket.resolvedAt
    }
    
    this.tickets.set(id, updatedTicket)
    return updatedTicket
  }
  
  /**
   * 更新工单优先级
   */
  updateTicketPriority(id: string, priority: TicketPriority): Ticket | undefined {
    const ticket = this.tickets.get(id)
    if (!ticket) return undefined
    
    const updatedTicket: Ticket = {
      ...ticket,
      priority,
      updatedAt: new Date()
    }
    
    this.tickets.set(id, updatedTicket)
    return updatedTicket
  }
  
  /**
   * 分配工单
   */
  assignTicket(id: string, userId: string): Ticket | undefined {
    const ticket = this.tickets.get(id)
    if (!ticket) return undefined
    
    const updatedTicket: Ticket = {
      ...ticket,
      assignedTo: userId,
      updatedAt: new Date()
    }
    
    this.tickets.set(id, updatedTicket)
    return updatedTicket
  }
  
  /**
   * 添加工单评论
   */
  addComment(ticketId: string, commentData: Omit<TicketComment, 'id' | 'ticketId' | 'createdAt'>): TicketComment | undefined {
    const ticket = this.tickets.get(ticketId)
    if (!ticket) return undefined
    
    const comment: TicketComment = {
      ...commentData,
      id: `comment-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      ticketId,
      createdAt: new Date()
    }
    
    const updatedTicket: Ticket = {
      ...ticket,
      comments: [...ticket.comments, comment],
      updatedAt: new Date()
    }
    
    this.tickets.set(ticketId, updatedTicket)
    return comment
  }
  
  /**
   * 根据状态过滤工单
   */
  getTicketsByStatus(status: TicketStatus): Ticket[] {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.status === status)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
  
  /**
   * 根据优先级过滤工单
   */
  getTicketsByPriority(priority: TicketPriority): Ticket[] {
    return Array.from(this.tickets.values())
      .filter(ticket => ticket.priority === priority)
      .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
  }
  
  /**
   * 关闭工单
   */
  closeTicket(id: string, resolution: string): Ticket | undefined {
    const ticket = this.tickets.get(id)
    if (!ticket) return undefined
    
    const updatedTicket: Ticket = {
      ...ticket,
      status: 'closed',
      resolution,
      resolvedAt: new Date(),
      updatedAt: new Date()
    }
    
    this.tickets.set(id, updatedTicket)
    return updatedTicket
  }
  
  /**
   * 获取工单统计信息
   */
  getTicketStats(): {
    total: number
    pending: number
    processing: number
    resolved: number
    closed: number
    byPriority: { low: number; medium: number; high: number }
  } {
    const tickets = Array.from(this.tickets.values())
    
    return {
      total: tickets.length,
      pending: tickets.filter(t => t.status === 'pending').length,
      processing: tickets.filter(t => t.status === 'processing').length,
      resolved: tickets.filter(t => t.status === 'resolved').length,
      closed: tickets.filter(t => t.status === 'closed').length,
      byPriority: {
        low: tickets.filter(t => t.priority === 'low').length,
        medium: tickets.filter(t => t.priority === 'medium').length,
        high: tickets.filter(t => t.priority === 'high').length
      }
    }
  }
}

// 导出单例实例
const ticketService = new TicketService()
export default ticketService
