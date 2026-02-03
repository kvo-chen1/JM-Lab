/**
 * 津脉活动日历服务 - 提供活动日历相关功能
 */

// 活动类型定义
export type EventType = 'theme' | 'collaboration' | 'competition' | 'workshop' | 'exhibition';

// 活动状态类型
export type EventStatus = 'upcoming' | 'ongoing' | 'completed';

// 津脉活动接口
export interface CulturalEvent {
  id: string;
  title: string;
  description: string;
  type: EventType;
  status: EventStatus;
  startDate: string;
  endDate: string;
  startTime?: string;
  endTime?: string;
  location?: string;
  onlineLink?: string;
  organizer: string;
  image: string;
  tags: string[];
  culturalElements: string[];
  participantCount: number;
  maxParticipants?: number;
  registrationDeadline?: string;
  hasPrize: boolean;
  prizeDescription?: string;
  rules?: string[];
  requirements?: string[];
  createdAt: string;
  updatedAt: string;
}

// 活动参与记录接口
export interface EventParticipation {
  id: string;
  eventId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  registeredAt: string;
  status: 'registered' | 'submitted' | 'completed' | 'winner';
  submissionId?: string;
  submissionTitle?: string;
  submissionDescription?: string;
  submissionImage?: string;
  ranking?: number;
}

// 活动日历服务类
class EventCalendarService {
  // 本地存储键名
  private EVENTS_KEY = 'jmzf_cultural_events';
  private PARTICIPATIONS_KEY = 'jmzf_event_participations';
  private USER_EVENTS_KEY = 'jmzf_user_events';

  // 空数组，只存储真实的津脉活动数据
  private events: CulturalEvent[] = [];

  // 空数组，只存储真实的参与记录数据
  private participations: EventParticipation[] = [];

  constructor() {
    // 初始化时从本地存储加载数据
    this.loadData();
  }

  // 加载数据
  private loadData(): void {
    try {
      const eventsRaw = localStorage.getItem(this.EVENTS_KEY);
      if (eventsRaw) {
        this.events = JSON.parse(eventsRaw);
      }

      const participationsRaw = localStorage.getItem(this.PARTICIPATIONS_KEY);
      if (participationsRaw) {
        this.participations = JSON.parse(participationsRaw);
      }
    } catch (error) {
      console.error('Failed to load event data:', error);
    }
  }

  // 保存活动数据
  private saveEvents(): void {
    try {
      localStorage.setItem(this.EVENTS_KEY, JSON.stringify(this.events));
    } catch (error) {
      console.error('Failed to save events:', error);
    }
  }

  // 保存参与记录数据
  private saveParticipations(): void {
    try {
      localStorage.setItem(this.PARTICIPATIONS_KEY, JSON.stringify(this.participations));
    } catch (error) {
      console.error('Failed to save participations:', error);
    }
  }

  /**
   * 获取所有津脉活动
   */
  getAllEvents(): CulturalEvent[] {
    return [...this.events];
  }

  /**
   * 根据ID获取单个活动
   */
  getEventById(id: string): CulturalEvent | undefined {
    return this.events.find(event => event.id === id);
  }

  /**
   * 根据状态获取活动
   */
  getEventsByStatus(status: EventStatus): CulturalEvent[] {
    return this.events.filter(event => event.status === status);
  }

  /**
   * 根据类型获取活动
   */
  getEventsByType(type: EventType): CulturalEvent[] {
    return this.events.filter(event => event.type === type);
  }

  /**
   * 获取即将开始的活动
   */
  getUpcomingEvents(limit?: number): CulturalEvent[] {
    const now = new Date();
    return this.events
      .filter(event => event.status === 'upcoming' || event.status === 'ongoing')
      .sort((a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
      .slice(0, limit);
  }

  /**
   * 获取最近结束的活动
   */
  getRecentCompletedEvents(limit?: number): CulturalEvent[] {
    return this.events
      .filter(event => event.status === 'completed')
      .sort((a, b) => new Date(b.endDate).getTime() - new Date(a.endDate).getTime())
      .slice(0, limit);
  }

  /**
   * 根据文化元素获取活动
   */
  getEventsByCulturalElement(element: string): CulturalEvent[] {
    return this.events.filter(event => event.culturalElements.includes(element));
  }

  /**
   * 根据标签获取活动
   */
  getEventsByTag(tag: string): CulturalEvent[] {
    return this.events.filter(event => event.tags.includes(tag));
  }

  /**
   * 搜索活动
   */
  searchEvents(keyword: string): CulturalEvent[] {
    const lowerKeyword = keyword.toLowerCase();
    return this.events.filter(event => 
      event.title.toLowerCase().includes(lowerKeyword) ||
      event.description.toLowerCase().includes(lowerKeyword) ||
      event.tags.some(tag => tag.toLowerCase().includes(lowerKeyword)) ||
      event.culturalElements.some(element => element.toLowerCase().includes(lowerKeyword))
    );
  }

  /**
   * 创建新活动
   */
  createEvent(event: Omit<CulturalEvent, 'id' | 'participantCount' | 'createdAt' | 'updatedAt'>): CulturalEvent {
    const newEvent: CulturalEvent = {
      ...event,
      id: `event-${Date.now()}`,
      participantCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.events.push(newEvent);
    this.saveEvents();
    return newEvent;
  }

  /**
   * 更新活动信息
   */
  updateEvent(id: string, updates: Partial<Omit<CulturalEvent, 'id' | 'createdAt'>>): boolean {
    const index = this.events.findIndex(event => event.id === id);
    if (index === -1) {
      return false;
    }

    this.events[index] = {
      ...this.events[index],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    this.saveEvents();
    return true;
  }

  /**
   * 注册参加活动
   */
  registerForEvent(
    eventId: string,
    userId: string,
    userName: string,
    userAvatar: string
  ): EventParticipation {
    const event = this.getEventById(eventId);
    if (!event) {
      throw new Error('Event not found');
    }

    // 检查是否已达到最大参与人数
    if (event.maxParticipants && event.participantCount >= event.maxParticipants) {
      throw new Error('Event is full');
    }

    // 检查是否已注册
    const existingParticipation = this.participations.find(
      p => p.eventId === eventId && p.userId === userId
    );

    if (existingParticipation) {
      return existingParticipation;
    }

    const participation: EventParticipation = {
      id: `participation-${Date.now()}`,
      eventId,
      userId,
      userName,
      userAvatar,
      registeredAt: new Date().toISOString(),
      status: 'registered'
    };

    this.participations.push(participation);
    this.saveParticipations();

    // 更新活动参与人数
    this.updateEvent(eventId, { participantCount: event.participantCount + 1 });

    return participation;
  }

  /**
   * 提交活动作品
   */
  submitEventWork(
    participationId: string,
    workId: string,
    title: string,
    description: string,
    image: string
  ): boolean {
    const index = this.participations.findIndex(p => p.id === participationId);
    if (index === -1) {
      return false;
    }

    this.participations[index] = {
      ...this.participations[index],
      status: 'submitted',
      submissionId: workId,
      submissionTitle: title,
      submissionDescription: description,
      submissionImage: image
    };

    this.saveParticipations();
    return true;
  }

  /**
   * 获取活动参与记录
   */
  getEventParticipations(eventId: string): EventParticipation[] {
    return this.participations.filter(p => p.eventId === eventId);
  }

  /**
   * 获取用户的活动参与记录
   */
  getUserParticipations(userId: string): EventParticipation[] {
    return this.participations.filter(p => p.userId === userId);
  }

  /**
   * 获取活动统计信息
   */
  getEventStats(): {
    totalEvents: number;
    upcomingEvents: number;
    ongoingEvents: number;
    completedEvents: number;
    totalParticipants: number;
    averageParticipantsPerEvent: number;
    eventsByType: Record<EventType, number>;
  } {
    const totalEvents = this.events.length;
    const upcomingEvents = this.events.filter(e => e.status === 'upcoming').length;
    const ongoingEvents = this.events.filter(e => e.status === 'ongoing').length;
    const completedEvents = this.events.filter(e => e.status === 'completed').length;
    const totalParticipants = this.events.reduce((sum, event) => sum + event.participantCount, 0);
    const averageParticipantsPerEvent = totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0;
    
    const eventsByType: Record<EventType, number> = {
      theme: this.events.filter(e => e.type === 'theme').length,
      collaboration: this.events.filter(e => e.type === 'collaboration').length,
      competition: this.events.filter(e => e.type === 'competition').length,
      workshop: this.events.filter(e => e.type === 'workshop').length,
      exhibition: this.events.filter(e => e.type === 'exhibition').length
    };

    return {
      totalEvents,
      upcomingEvents,
      ongoingEvents,
      completedEvents,
      totalParticipants,
      averageParticipantsPerEvent,
      eventsByType
    };
  }
}

// 导出单例实例
export default new EventCalendarService();
