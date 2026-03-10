/**
 * 用户画像服务
 * 构建和维护用户偏好画像，实现个性化服务
 */

import { EntityType } from './entityExtractor';

// 用户画像
export interface UserProfile {
  userId: string;
  createdAt: number;
  updatedAt: number;
  
  // 偏好统计
  preferences: {
    styles: PreferenceItem[];      // 风格偏好
    colors: PreferenceItem[];      // 颜色偏好
    designTypes: PreferenceItem[]; // 设计类型偏好
    elements: PreferenceItem[];    // 元素偏好
    audiences: PreferenceItem[];   // 受众偏好
  };
  
  // 行为模式
  behavior: {
    avgResponseTime: number;       // 平均响应时间（毫秒）
    avgMessageLength: number;      // 平均消息长度
    preferredInteractionStyle: 'detailed' | 'concise' | 'casual' | 'formal';
    decisionSpeed: 'fast' | 'medium' | 'slow';
    feedbackFrequency: number;     // 反馈频率（0-1）
  };
  
  // 历史统计
  statistics: {
    totalConversations: number;
    totalDesigns: number;
    completedDesigns: number;
    modificationRate: number;      // 修改率
    satisfactionScore: number;     // 满意度（1-5）
  };
  
  // 时间模式
  timePatterns: {
    activeHours: number[];         // 活跃时段（0-23）
    preferredDays: number[];       // 活跃星期（0-6）
    sessionDuration: number;       // 平均会话时长（分钟）
  };
  
  // 标签
  tags: string[];
}

// 偏好项
export interface PreferenceItem {
  value: string;
  count: number;
  lastUsed: number;
  confidence: number;
}

// 用户会话
export interface UserSession {
  sessionId: string;
  userId: string;
  startTime: number;
  endTime?: number;
  messages: number;
  entities: Map<EntityType, string[]>;
  outcome: 'completed' | 'cancelled' | 'ongoing';
}

// 默认画像
const DEFAULT_PROFILE: Partial<UserProfile> = {
  preferences: {
    styles: [],
    colors: [],
    designTypes: [],
    elements: [],
    audiences: []
  },
  behavior: {
    avgResponseTime: 0,
    avgMessageLength: 0,
    preferredInteractionStyle: 'casual',
    decisionSpeed: 'medium',
    feedbackFrequency: 0.5
  },
  statistics: {
    totalConversations: 0,
    totalDesigns: 0,
    completedDesigns: 0,
    modificationRate: 0,
    satisfactionScore: 3
  },
  timePatterns: {
    activeHours: [],
    preferredDays: [],
    sessionDuration: 0
  },
  tags: []
};

/**
 * 用户画像服务类
 */
export class UserProfileService {
  private profiles: Map<string, UserProfile> = new Map();
  private sessions: Map<string, UserSession> = new Map();
  private currentSession: UserSession | null = null;

  /**
   * 获取或创建用户画像
   */
  getProfile(userId: string): UserProfile {
    let profile = this.profiles.get(userId);
    
    if (!profile) {
      profile = this.createDefaultProfile(userId);
      this.profiles.set(userId, profile);
    }
    
    return profile;
  }

  /**
   * 创建默认画像
   */
  private createDefaultProfile(userId: string): UserProfile {
    const now = Date.now();
    return {
      userId,
      createdAt: now,
      updatedAt: now,
      ...JSON.parse(JSON.stringify(DEFAULT_PROFILE))
    } as UserProfile;
  }

  /**
   * 开始新会话
   */
  startSession(userId: string): UserSession {
    const session: UserSession = {
      sessionId: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      startTime: Date.now(),
      messages: 0,
      entities: new Map(),
      outcome: 'ongoing'
    };
    
    this.sessions.set(session.sessionId, session);
    this.currentSession = session;
    
    // 更新统计
    const profile = this.getProfile(userId);
    profile.statistics.totalConversations++;
    profile.updatedAt = Date.now();
    
    return session;
  }

  /**
   * 结束会话
   */
  endSession(sessionId: string, outcome: 'completed' | 'cancelled'): void {
    const session = this.sessions.get(sessionId);
    if (session) {
      session.endTime = Date.now();
      session.outcome = outcome;
      
      // 更新用户画像
      this.updateProfileFromSession(session);
    }
    
    if (this.currentSession?.sessionId === sessionId) {
      this.currentSession = null;
    }
  }

  /**
   * 记录消息
   */
  recordMessage(userId: string, content: string, responseTime?: number): void {
    const profile = this.getProfile(userId);
    
    // 更新消息统计
    profile.statistics.totalConversations++;
    
    // 更新平均消息长度
    const newAvg = (profile.behavior.avgMessageLength * (profile.statistics.totalConversations - 1) + content.length) 
      / profile.statistics.totalConversations;
    profile.behavior.avgMessageLength = Math.round(newAvg);
    
    // 更新响应时间
    if (responseTime) {
      const newResponseAvg = (profile.behavior.avgResponseTime * (profile.statistics.totalConversations - 1) + responseTime)
        / profile.statistics.totalConversations;
      profile.behavior.avgResponseTime = Math.round(newResponseAvg);
    }
    
    // 更新活跃时间
    this.updateTimePattern(profile);
    
    profile.updatedAt = Date.now();
  }

  /**
   * 更新偏好
   */
  updatePreference(
    userId: string,
    category: keyof UserProfile['preferences'],
    value: string,
    confidence: number = 0.5
  ): void {
    const profile = this.getProfile(userId);
    const preferences = profile.preferences[category];
    
    // 查找现有偏好
    const existing = preferences.find(p => p.value === value);
    
    if (existing) {
      // 更新现有偏好
      existing.count++;
      existing.lastUsed = Date.now();
      existing.confidence = Math.min(existing.confidence + 0.1, 1);
    } else {
      // 添加新偏好
      preferences.push({
        value,
        count: 1,
        lastUsed: Date.now(),
        confidence
      });
    }
    
    // 按使用次数排序
    preferences.sort((a, b) => b.count - a.count);
    
    // 限制数量
    if (preferences.length > 10) {
      preferences.splice(10);
    }
    
    profile.updatedAt = Date.now();
  }

  /**
   * 获取用户偏好建议
   */
  getPreferenceSuggestions(
    userId: string,
    category: keyof UserProfile['preferences'],
    limit: number = 3
  ): string[] {
    const profile = this.getProfile(userId);
    const preferences = profile.preferences[category];
    
    return preferences
      .filter(p => p.confidence > 0.3)
      .slice(0, limit)
      .map(p => p.value);
  }

  /**
   * 获取个性化问候
   */
  getPersonalizedGreeting(userId: string): string {
    const profile = this.getProfile(userId);
    const hour = new Date().getHours();
    
    // 根据时间选择问候
    let timeGreeting = '你好';
    if (hour < 12) timeGreeting = '早上好';
    else if (hour < 18) timeGreeting = '下午好';
    else timeGreeting = '晚上好';
    
    // 根据用户偏好添加个性化内容
    const preferredStyle = profile.preferences.styles[0];
    if (preferredStyle && profile.statistics.totalConversations > 3) {
      return `${timeGreeting}！很高兴再次见到你。上次你选择了${preferredStyle.value}风格，今天想设计什么呢？`;
    }
    
    return `${timeGreeting}！我是津小脉，很高兴为你服务。`;
  }

  /**
   * 获取推荐风格
   */
  getRecommendedStyles(userId: string, limit: number = 3): string[] {
    const profile = this.getProfile(userId);
    
    // 优先返回用户历史偏好
    const userStyles = profile.preferences.styles
      .filter(s => s.confidence > 0.4)
      .slice(0, limit)
      .map(s => s.value);
    
    // 如果用户偏好不足，补充热门风格
    const popularStyles = ['可爱', '简约', '复古', '国潮', '现代', '科技'];
    const needed = limit - userStyles.length;
    
    if (needed > 0) {
      // 过滤掉用户已经偏好的风格
      const additional = popularStyles
        .filter(s => !userStyles.includes(s))
        .slice(0, needed);
      userStyles.push(...additional);
    }
    
    return userStyles;
  }

  /**
   * 记录设计完成
   */
  recordDesignCompletion(userId: string, success: boolean, modifications: number = 0): void {
    const profile = this.getProfile(userId);
    
    profile.statistics.totalDesigns++;
    
    if (success) {
      profile.statistics.completedDesigns++;
    }
    
    // 更新修改率
    const totalMods = profile.statistics.modificationRate * (profile.statistics.totalDesigns - 1) + modifications;
    profile.statistics.modificationRate = totalMods / profile.statistics.totalDesigns;
    
    profile.updatedAt = Date.now();
  }

  /**
   * 记录反馈
   */
  recordFeedback(userId: string, rating: number, comment?: string): void {
    const profile = this.getProfile(userId);
    
    // 更新满意度（移动平均）
    const newSatisfaction = (profile.statistics.satisfactionScore * 4 + rating) / 5;
    profile.statistics.satisfactionScore = Math.round(newSatisfaction * 10) / 10;
    
    // 更新反馈频率
    profile.behavior.feedbackFrequency = Math.min(profile.behavior.feedbackFrequency + 0.05, 1);
    
    profile.updatedAt = Date.now();
  }

  /**
   * 更新交互风格偏好
   */
  updateInteractionStyle(userId: string, style: UserProfile['behavior']['preferredInteractionStyle']): void {
    const profile = this.getProfile(userId);
    profile.behavior.preferredInteractionStyle = style;
    profile.updatedAt = Date.now();
  }

  /**
   * 获取用户标签
   */
  generateUserTags(userId: string): string[] {
    const profile = this.getProfile(userId);
    const tags: string[] = [];
    
    // 基于偏好生成标签
    if (profile.preferences.styles.length > 0) {
      const topStyle = profile.preferences.styles[0];
      if (topStyle.count >= 3) {
        tags.push(`喜欢${topStyle.value}风格`);
      }
    }
    
    // 基于行为生成标签
    if (profile.behavior.decisionSpeed === 'fast') {
      tags.push('决策迅速');
    } else if (profile.behavior.decisionSpeed === 'slow') {
      tags.push('谨慎决策');
    }
    
    if (profile.statistics.modificationRate > 0.5) {
      tags.push('追求完美');
    }
    
    if (profile.statistics.totalDesigns > 10) {
      tags.push('资深用户');
    }
    
    // 基于满意度生成标签
    if (profile.statistics.satisfactionScore >= 4.5) {
      tags.push('高度满意');
    }
    
    profile.tags = tags;
    return tags;
  }

  /**
   * 从会话更新画像
   */
  private updateProfileFromSession(session: UserSession): void {
    const profile = this.getProfile(session.userId);
    
    // 更新会话时长
    if (session.endTime) {
      const duration = (session.endTime - session.startTime) / 1000 / 60; // 分钟
      const newAvg = (profile.timePatterns.sessionDuration * (profile.statistics.totalConversations - 1) + duration)
        / profile.statistics.totalConversations;
      profile.timePatterns.sessionDuration = Math.round(newAvg);
    }
    
    // 更新实体偏好
    for (const [type, values] of session.entities) {
      for (const value of values) {
        this.mapEntityToPreference(session.userId, type, value);
      }
    }
    
    profile.updatedAt = Date.now();
  }

  /**
   * 将实体映射到偏好
   */
  private mapEntityToPreference(userId: string, entityType: EntityType, value: string): void {
    const mapping: Record<EntityType, keyof UserProfile['preferences'] | null> = {
      [EntityType.STYLE]: 'styles',
      [EntityType.COLOR]: 'colors',
      [EntityType.DESIGN_TYPE]: 'designTypes',
      [EntityType.ELEMENT]: 'elements',
      [EntityType.AUDIENCE]: 'audiences',
      [EntityType.USAGE_SCENARIO]: null,
      [EntityType.BRAND]: null,
      [EntityType.SIZE]: null,
      [EntityType.TIME]: null,
      [EntityType.BUDGET]: null,
      [EntityType.REFERENCE]: null,
      [EntityType.EMOTION]: null,
      [EntityType.MATERIAL]: null,
      [EntityType.TECHNIQUE]: null,
      [EntityType.THEME]: null
    };
    
    const preferenceKey = mapping[entityType];
    if (preferenceKey) {
      this.updatePreference(userId, preferenceKey, value);
    }
  }

  /**
   * 更新时间模式
   */
  private updateTimePattern(profile: UserProfile): void {
    const now = new Date();
    const hour = now.getHours();
    const day = now.getDay();
    
    // 更新活跃时段
    if (!profile.timePatterns.activeHours.includes(hour)) {
      profile.timePatterns.activeHours.push(hour);
      profile.timePatterns.activeHours.sort((a, b) => a - b);
    }
    
    // 更新活跃日期
    if (!profile.timePatterns.preferredDays.includes(day)) {
      profile.timePatterns.preferredDays.push(day);
      profile.timePatterns.preferredDays.sort((a, b) => a - b);
    }
  }

  /**
   * 导出用户画像
   */
  exportProfile(userId: string): string {
    const profile = this.getProfile(userId);
    return JSON.stringify({
      ...profile,
      preferences: {
        styles: profile.preferences.styles,
        colors: profile.preferences.colors,
        designTypes: profile.preferences.designTypes,
        elements: profile.preferences.elements,
        audiences: profile.preferences.audiences
      }
    }, null, 2);
  }

  /**
   * 导入用户画像
   */
  importProfile(profileJson: string): void {
    try {
      const profile = JSON.parse(profileJson) as UserProfile;
      this.profiles.set(profile.userId, profile);
    } catch (error) {
      console.error('[UserProfileService] Failed to import profile:', error);
    }
  }

  /**
   * 获取所有画像统计
   */
  getAllProfilesStats(): {
    totalUsers: number;
    avgSatisfaction: number;
    totalDesigns: number;
    topStyle: string;
  } {
    const profiles = Array.from(this.profiles.values());
    
    if (profiles.length === 0) {
      return {
        totalUsers: 0,
        avgSatisfaction: 0,
        totalDesigns: 0,
        topStyle: ''
      };
    }
    
    const totalSatisfaction = profiles.reduce((sum, p) => sum + p.statistics.satisfactionScore, 0);
    const totalDesigns = profiles.reduce((sum, p) => sum + p.statistics.totalDesigns, 0);
    
    // 统计最受欢迎的风格
    const styleCounts = new Map<string, number>();
    for (const profile of profiles) {
      for (const style of profile.preferences.styles) {
        const count = styleCounts.get(style.value) || 0;
        styleCounts.set(style.value, count + style.count);
      }
    }
    
    let topStyle = '';
    let maxCount = 0;
    for (const [style, count] of styleCounts) {
      if (count > maxCount) {
        maxCount = count;
        topStyle = style;
      }
    }
    
    return {
      totalUsers: profiles.length,
      avgSatisfaction: Math.round((totalSatisfaction / profiles.length) * 10) / 10,
      totalDesigns,
      topStyle
    };
  }
}

// 导出单例
let serviceInstance: UserProfileService | null = null;

export function getUserProfileService(): UserProfileService {
  if (!serviceInstance) {
    serviceInstance = new UserProfileService();
  }
  return serviceInstance;
}

export function resetUserProfileService(): void {
  serviceInstance = null;
}
