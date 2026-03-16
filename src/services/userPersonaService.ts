import { supabase } from '@/lib/supabase';
import {
  UserBehavior,
  UserPersona,
  UserPersonaUpdate,
  InterestTag,
  BehaviorType,
  ContentType,
  BEHAVIOR_WEIGHTS,
  BehaviorAnalysisResult,
  BehaviorAggregation,
} from '@/types/userPersona';

const BEHAVIORS_TABLE = 'user_behaviors';
const PERSONA_TABLE = 'user_personas';
const BEHAVIORS_CACHE_KEY = 'jmzf_user_behaviors_cache';
const PERSONA_CACHE_KEY = 'jmzf_user_persona_cache';
const CACHE_TTL = 5 * 60 * 1000;

class UserPersonaService {
  private behaviorQueue: UserBehavior[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly FLUSH_INTERVAL = 5000;
  private readonly BATCH_SIZE = 50;

  async trackBehavior(
    userId: string,
    contentId: string,
    contentType: ContentType,
    behaviorType: BehaviorType,
    metadata?: UserBehavior['metadata']
  ): Promise<UserBehavior> {
    const behavior: UserBehavior = {
      id: `bh_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      contentId,
      contentType,
      behaviorType,
      behaviorTimestamp: new Date().toISOString(),
      metadata: {
        ...metadata,
        platform: this.detectPlatform(),
        deviceId: this.getDeviceId(),
      },
    };

    this.behaviorQueue.push(behavior);
    this.scheduleFlush();

    this.updateLocalBehaviorCache(behavior);

    return behavior;
  }

  private scheduleFlush(): void {
    if (this.flushTimer) return;
    
    if (this.behaviorQueue.length >= this.BATCH_SIZE) {
      this.flushBehaviors();
      return;
    }

    this.flushTimer = setTimeout(() => {
      this.flushBehaviors();
    }, this.FLUSH_INTERVAL);
  }

  private async flushBehaviors(): Promise<void> {
    if (this.behaviorQueue.length === 0) return;

    const behaviorsToSend = [...this.behaviorQueue];
    this.behaviorQueue = [];
    
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }

    try {
      const { error } = await supabase
        .from(BEHAVIORS_TABLE)
        .insert(behaviorsToSend.map(b => ({
          id: b.id,
          user_id: b.userId,
          content_id: b.contentId,
          content_type: b.contentType,
          behavior_type: b.behaviorType,
          behavior_timestamp: b.behaviorTimestamp,
          duration: b.duration,
          value: b.value,
          metadata: b.metadata,
        })));

      if (error) {
        console.error('Failed to flush behaviors:', error);
        this.behaviorQueue = [...behaviorsToSend, ...this.behaviorQueue];
      }
    } catch (error) {
      console.error('Error flushing behaviors:', error);
      this.behaviorQueue = [...behaviorsToSend, ...this.behaviorQueue];
    }
  }

  private updateLocalBehaviorCache(behavior: UserBehavior): void {
    try {
      const cacheKey = `${BEHAVIORS_CACHE_KEY}_${behavior.userId}`;
      const cached = localStorage.getItem(cacheKey);
      const behaviors = cached ? JSON.parse(cached) : { behaviors: [], timestamp: 0 };
      
      behaviors.behaviors.unshift(behavior);
      behaviors.behaviors = behaviors.behaviors.slice(0, 1000);
      behaviors.timestamp = Date.now();
      
      localStorage.setItem(cacheKey, JSON.stringify(behaviors));
    } catch (error) {
      console.error('Error updating local behavior cache:', error);
    }
  }

  async getUserBehaviors(
    userId: string,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      behaviorTypes?: BehaviorType[];
      contentTypes?: ContentType[];
    }
  ): Promise<UserBehavior[]> {
    try {
      let query = supabase
        .from(BEHAVIORS_TABLE)
        .select('*')
        .eq('user_id', userId)
        .order('behavior_timestamp', { ascending: false });

      if (options?.limit) {
        query = query.limit(options.limit);
      }

      if (options?.startDate) {
        query = query.gte('behavior_timestamp', options.startDate.toISOString());
      }

      if (options?.endDate) {
        query = query.lte('behavior_timestamp', options.endDate.toISOString());
      }

      if (options?.behaviorTypes && options.behaviorTypes.length > 0) {
        query = query.in('behavior_type', options.behaviorTypes);
      }

      if (options?.contentTypes && options.contentTypes.length > 0) {
        query = query.in('content_type', options.contentTypes);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map(this.mapBehaviorFromDB);
    } catch (error) {
      console.error('Error fetching user behaviors:', error);
      return this.getLocalBehaviors(userId);
    }
  }

  private getLocalBehaviors(userId: string): UserBehavior[] {
    try {
      const cacheKey = `${BEHAVIORS_CACHE_KEY}_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { behaviors } = JSON.parse(cached);
        return behaviors;
      }
    } catch (error) {
      console.error('Error getting local behaviors:', error);
    }
    return [];
  }

  async getUserPersona(userId: string): Promise<UserPersona | null> {
    try {
      const { data, error } = await supabase
        .from(PERSONA_TABLE)
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return this.createInitialPersona(userId);
        }
        throw error;
      }

      return this.mapPersonaFromDB(data);
    } catch (error) {
      console.error('Error fetching user persona:', error);
      return this.getLocalPersona(userId);
    }
  }

  async createInitialPersona(userId: string): Promise<UserPersona> {
    const now = new Date().toISOString();
    const persona: UserPersona = {
      id: `persona_${userId}`,
      userId,
      interests: [],
      creatorPreferences: [],
      categoryPreferences: [],
      behaviorProfile: {
        totalBehaviors: 0,
        avgSessionDuration: 0,
        avgBehaviorsPerSession: 0,
        activeDays: 0,
        lastActiveDate: now,
        engagementScore: 0,
        loyaltyScore: 0,
        explorationScore: 0.5,
      },
      timePatterns: [],
      devicePatterns: [],
      contentPreferences: {
        preferredTypes: [],
        typeDistribution: {} as Record<ContentType, number>,
        avgContentQuality: 0,
        noveltyPreference: 0.5,
        diversityPreference: 0.5,
      },
      socialProfile: {
        followingCount: 0,
        followerCount: 0,
        interactionRate: 0,
        shareRate: 0,
        commentRate: 0,
      },
      createdAt: now,
      updatedAt: now,
      version: 1,
    };

    try {
      await supabase
        .from(PERSONA_TABLE)
        .insert({
          id: persona.id,
          user_id: persona.userId,
          interests: persona.interests,
          creator_preferences: persona.creatorPreferences,
          category_preferences: persona.categoryPreferences,
          behavior_profile: persona.behaviorProfile,
          time_patterns: persona.timePatterns,
          device_patterns: persona.devicePatterns,
          content_preferences: persona.contentPreferences,
          social_profile: persona.socialProfile,
          demographics: persona.demographics,
          created_at: persona.createdAt,
          updated_at: persona.updatedAt,
          version: persona.version,
        });
    } catch (error) {
      console.error('Error creating initial persona:', error);
    }

    this.saveLocalPersona(persona);
    return persona;
  }

  async updateUserPersona(userId: string, update: UserPersonaUpdate): Promise<UserPersona | null> {
    try {
      const currentPersona = await this.getUserPersona(userId);
      if (!currentPersona) return null;

      const updatedPersona: UserPersona = {
        ...currentPersona,
        ...update,
        updatedAt: new Date().toISOString(),
        version: currentPersona.version + 1,
      };

      const { error } = await supabase
        .from(PERSONA_TABLE)
        .update({
          interests: updatedPersona.interests,
          creator_preferences: updatedPersona.creatorPreferences,
          category_preferences: updatedPersona.categoryPreferences,
          behavior_profile: updatedPersona.behaviorProfile,
          time_patterns: updatedPersona.timePatterns,
          device_patterns: updatedPersona.devicePatterns,
          content_preferences: updatedPersona.contentPreferences,
          social_profile: updatedPersona.socialProfile,
          demographics: updatedPersona.demographics,
          updated_at: updatedPersona.updatedAt,
          version: updatedPersona.version,
        })
        .eq('user_id', userId);

      if (error) throw error;

      this.saveLocalPersona(updatedPersona);
      return updatedPersona;
    } catch (error) {
      console.error('Error updating user persona:', error);
      return null;
    }
  }

  async analyzeBehaviors(userId: string): Promise<BehaviorAnalysisResult> {
    const behaviors = await this.getUserBehaviors(userId, { limit: 500 });
    const persona = await this.getUserPersona(userId);
    const now = new Date().toISOString();

    const tagScores: Map<string, { score: number; count: number; trend: number }> = new Map();
    const creatorScores: Map<string, { score: number; count: number; name: string }> = new Map();
    const categoryScores: Map<string, { score: number; count: number; engagement: number }> = new Map();
    const hourlyActivity: number[] = new Array(24).fill(0);
    const weeklyPattern: number[] = new Array(7).fill(0);

    behaviors.forEach((behavior, index) => {
      const weight = this.calculateBehaviorWeight(behavior, index);
      const timestamp = new Date(behavior.behaviorTimestamp);

      hourlyActivity[timestamp.getHours()] += weight;
      weeklyPattern[timestamp.getDay()] += weight;

      if (behavior.metadata?.tags) {
        behavior.metadata.tags.forEach((tag: string) => {
          const current = tagScores.get(tag) || { score: 0, count: 0, trend: 0 };
          current.score += weight;
          current.count += 1;
          current.trend += weight * (1 - index / behaviors.length);
          tagScores.set(tag, current);
        });
      }

      if (behavior.metadata?.category) {
        const category = behavior.metadata.category;
        const current = categoryScores.get(category) || { score: 0, count: 0, engagement: 0 };
        current.score += weight;
        current.count += 1;
        current.engagement += this.isEngagementBehavior(behavior.behaviorType) ? weight : 0;
        categoryScores.set(category, current);
      }

      if (behavior.metadata?.creatorId) {
        const creatorId = behavior.metadata.creatorId;
        const current = creatorScores.get(creatorId) || { 
          score: 0, 
          count: 0, 
          name: behavior.metadata.creatorName || 'Unknown' 
        };
        current.score += weight;
        current.count += 1;
        creatorScores.set(creatorId, current);
      }
    });

    const topInterests = Array.from(tagScores.entries())
      .map(([tag, data]) => ({
        tag,
        score: data.score,
        trend: data.trend > 0.3 ? 'rising' as const : data.trend < -0.3 ? 'declining' as const : 'stable' as const,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 20);

    const topCreators = Array.from(creatorScores.entries())
      .map(([creatorId, data]) => ({
        creatorId,
        creatorName: data.name,
        affinityScore: data.score,
      }))
      .sort((a, b) => b.affinityScore - a.affinityScore)
      .slice(0, 10);

    const topCategories = Array.from(categoryScores.entries())
      .map(([category, data]) => ({
        category,
        score: data.score,
        engagement: data.engagement,
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);

    const peakHours = hourlyActivity
      .map((score, hour) => ({ hour, score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(h => h.hour);

    const totalBehaviors = behaviors.length;
    const coldStartComplete = totalBehaviors >= 20;

    const insights = this.generateInsights(
      topInterests,
      topCategories,
      peakHours,
      behaviors,
      persona
    );

    return {
      userId,
      analysisDate: now,
      topInterests,
      topCreators,
      topCategories,
      behaviorTrends: {
        dailyActive: this.isDailyActive(behaviors),
        weeklyPattern,
        peakHours,
        sessionTrend: this.calculateSessionTrend(behaviors),
      },
      recommendations: {
        suggestedCategories: topCategories.slice(0, 5).map(c => c.category),
        suggestedCreators: topCreators.slice(0, 5).map(c => c.creatorId),
        suggestedTags: topInterests.slice(0, 10).map(t => t.tag),
        coldStartComplete,
      },
      insights,
    };
  }

  async extractInterestTags(userId: string): Promise<InterestTag[]> {
    const behaviors = await this.getUserBehaviors(userId, { limit: 200 });
    const tagMap: Map<string, InterestTag> = new Map();

    behaviors.forEach(behavior => {
      if (behavior.metadata?.tags) {
        behavior.metadata.tags.forEach((tag: string) => {
          const weight = this.calculateBehaviorWeight(behavior, 0);
          const existing = tagMap.get(tag);
          
          if (existing) {
            existing.score += weight;
            existing.behaviorCount += 1;
            existing.lastUpdated = behavior.behaviorTimestamp;
            if (existing.recentBehaviors.length < 10) {
              existing.recentBehaviors.push(behavior.id);
            }
          } else {
            tagMap.set(tag, {
              tag,
              score: weight,
              category: behavior.metadata?.category,
              lastUpdated: behavior.behaviorTimestamp,
              behaviorCount: 1,
              recentBehaviors: [behavior.id],
            });
          }
        });
      }
    });

    return Array.from(tagMap.values())
      .sort((a, b) => b.score - a.score)
      .slice(0, 50);
  }

  async aggregateBehaviors(
    userId: string,
    period: 'daily' | 'weekly' | 'monthly'
  ): Promise<BehaviorAggregation> {
    const now = new Date();
    const startDate = this.getPeriodStartDate(now, period);
    
    const behaviors = await this.getUserBehaviors(userId, {
      startDate,
      endDate: now,
    });

    const behaviorDistribution: Record<BehaviorType, number> = {} as any;
    const contentTypeDistribution: Record<ContentType, number> = {} as any;
    const tagCounts: Map<string, number> = new Map();
    const categoryCounts: Map<string, number> = new Map();
    const creatorCounts: Map<string, number> = new Map();
    const uniqueContents = new Set<string>();
    const uniqueCreators = new Set<string>();

    behaviors.forEach(behavior => {
      behaviorDistribution[behavior.behaviorType] = 
        (behaviorDistribution[behavior.behaviorType] || 0) + 1;
      
      contentTypeDistribution[behavior.contentType] = 
        (contentTypeDistribution[behavior.contentType] || 0) + 1;
      
      uniqueContents.add(behavior.contentId);
      
      if (behavior.metadata?.tags) {
        behavior.metadata.tags.forEach((tag: string) => {
          tagCounts.set(tag, (tagCounts.get(tag) || 0) + 1);
        });
      }
      
      if (behavior.metadata?.category) {
        categoryCounts.set(
          behavior.metadata.category, 
          (categoryCounts.get(behavior.metadata.category) || 0) + 1
        );
      }
      
      if (behavior.metadata?.creatorId) {
        creatorCounts.set(
          behavior.metadata.creatorId, 
          (creatorCounts.get(behavior.metadata.creatorId) || 0) + 1
        );
        uniqueCreators.add(behavior.metadata.creatorId);
      }
    });

    return {
      userId,
      period,
      startDate: startDate.toISOString(),
      endDate: now.toISOString(),
      totalBehaviors: behaviors.length,
      uniqueContents: uniqueContents.size,
      uniqueCreators: uniqueCreators.size,
      behaviorDistribution,
      contentTypeDistribution,
      topTags: Array.from(tagCounts.entries())
        .map(([tag, count]) => ({ tag, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20),
      topCategories: Array.from(categoryCounts.entries())
        .map(([category, count]) => ({ category, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      topCreators: Array.from(creatorCounts.entries())
        .map(([creatorId, count]) => ({ creatorId, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10),
      avgSessionDuration: this.calculateAvgSessionDuration(behaviors),
      totalSessions: this.estimateSessionCount(behaviors),
      avgBehaviorsPerSession: behaviors.length / Math.max(1, this.estimateSessionCount(behaviors)),
    };
  }

  private calculateBehaviorWeight(behavior: UserBehavior, recencyIndex: number): number {
    const config = BEHAVIOR_WEIGHTS[behavior.behaviorType];
    if (!config) return 1;

    const baseWeight = config.weight;
    const daysSinceBehavior = (Date.now() - new Date(behavior.behaviorTimestamp).getTime()) / (1000 * 60 * 60 * 24);
    const timeDecay = Math.pow(config.decayFactor, daysSinceBehavior / config.halfLife);
    const recencyBonus = 1 + (1 - recencyIndex / 100) * 0.2;

    const durationBonus = behavior.duration 
      ? Math.min(behavior.duration / 60, 2) 
      : 1;

    return baseWeight * timeDecay * recencyBonus * durationBonus;
  }

  private isEngagementBehavior(behaviorType: BehaviorType): boolean {
    return ['like', 'comment', 'share', 'favorite', 'follow'].includes(behaviorType);
  }

  private isDailyActive(behaviors: UserBehavior[]): boolean {
    const today = new Date().toDateString();
    return behaviors.some(b => new Date(b.behaviorTimestamp).toDateString() === today);
  }

  private calculateSessionTrend(behaviors: UserBehavior[]): 'increasing' | 'stable' | 'decreasing' {
    if (behaviors.length < 10) return 'stable';
    
    const midPoint = Math.floor(behaviors.length / 2);
    const recentBehaviors = behaviors.slice(0, midPoint);
    const olderBehaviors = behaviors.slice(midPoint);
    
    const recentScore = recentBehaviors.reduce((sum, b) => 
      sum + BEHAVIOR_WEIGHTS[b.behaviorType]?.weight || 0, 0);
    const olderScore = olderBehaviors.reduce((sum, b) => 
      sum + BEHAVIOR_WEIGHTS[b.behaviorType]?.weight || 0, 0);
    
    const ratio = recentScore / Math.max(olderScore, 1);
    
    if (ratio > 1.2) return 'increasing';
    if (ratio < 0.8) return 'decreasing';
    return 'stable';
  }

  private calculateAvgSessionDuration(behaviors: UserBehavior[]): number {
    if (behaviors.length === 0) return 0;
    
    const sessions = this.groupBehaviorsBySession(behaviors);
    const durations = sessions.map(session => {
      if (session.length < 2) return 0;
      const timestamps = session.map(b => new Date(b.behaviorTimestamp).getTime());
      return (Math.max(...timestamps) - Math.min(...timestamps)) / 1000;
    });
    
    return durations.reduce((a, b) => a + b, 0) / durations.length;
  }

  private estimateSessionCount(behaviors: UserBehavior[]): number {
    return this.groupBehaviorsBySession(behaviors).length;
  }

  private groupBehaviorsBySession(behaviors: UserBehavior[]): UserBehavior[][] {
    const SESSION_GAP = 30 * 60 * 1000;
    const sessions: UserBehavior[][] = [];
    let currentSession: UserBehavior[] = [];
    let lastTimestamp = 0;

    behaviors.forEach(behavior => {
      const timestamp = new Date(behavior.behaviorTimestamp).getTime();

      if (lastTimestamp > 0 && timestamp - lastTimestamp > SESSION_GAP) {
        if (currentSession.length > 0) {
          sessions.push(currentSession);
        }
        currentSession = [];
      }

      currentSession.push(behavior);
      lastTimestamp = timestamp;
    });

    if (currentSession.length > 0) {
      sessions.push(currentSession);
    }

    return sessions;
  }

  private generateInsights(
    topInterests: Array<{ tag: string; score: number; trend: string }>,
    topCategories: Array<{ category: string; score: number; engagement: number }>,
    peakHours: number[],
    behaviors: UserBehavior[],
    persona: UserPersona | null
  ): string[] {
    const insights: string[] = [];

    if (topInterests.length > 0) {
      const topInterest = topInterests[0];
      if (topInterest.trend === 'rising') {
        insights.push(`您最近对"${topInterest.tag}"表现出浓厚兴趣`);
      }
    }

    if (topCategories.length > 0) {
      const topCategory = topCategories[0];
      if (topCategory.engagement > topCategory.score * 0.5) {
        insights.push(`您在"${topCategory.category}"类别中互动非常活跃`);
      }
    }

    if (peakHours.length > 0) {
      const hour = peakHours[0];
      const period = hour < 12 ? '上午' : hour < 18 ? '下午' : '晚上';
      insights.push(`您最活跃的时间段是${period}${hour}点左右`);
    }

    if (behaviors.length > 100) {
      insights.push('您是平台的活跃用户，感谢您的持续关注！');
    } else if (behaviors.length < 10) {
      insights.push('继续探索平台内容，我们会为您推荐更精准的内容');
    }

    if (persona?.behaviorProfile.explorationScore && persona.behaviorProfile.explorationScore > 0.7) {
      insights.push('您喜欢探索新内容，我们会为您推荐更多新鲜内容');
    }

    return insights;
  }

  private getPeriodStartDate(now: Date, period: 'daily' | 'weekly' | 'monthly'): Date {
    const start = new Date(now);
    switch (period) {
      case 'daily':
        start.setDate(start.getDate() - 1);
        break;
      case 'weekly':
        start.setDate(start.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(start.getMonth() - 1);
        break;
    }
    return start;
  }

  private detectPlatform(): 'web' | 'mobile' | 'app' {
    if (typeof window === 'undefined') return 'web';
    const ua = navigator.userAgent;
    if (/mobile/i.test(ua)) return 'mobile';
    return 'web';
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('jmzf_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('jmzf_device_id', deviceId);
    }
    return deviceId;
  }

  private saveLocalPersona(persona: UserPersona): void {
    try {
      const cacheKey = `${PERSONA_CACHE_KEY}_${persona.userId}`;
      localStorage.setItem(cacheKey, JSON.stringify({
        persona,
        timestamp: Date.now(),
      }));
    } catch (error) {
      console.error('Error saving local persona:', error);
    }
  }

  private getLocalPersona(userId: string): UserPersona | null {
    try {
      const cacheKey = `${PERSONA_CACHE_KEY}_${userId}`;
      const cached = localStorage.getItem(cacheKey);
      if (cached) {
        const { persona, timestamp } = JSON.parse(cached);
        if (Date.now() - timestamp < CACHE_TTL) {
          return persona;
        }
      }
    } catch (error) {
      console.error('Error getting local persona:', error);
    }
    return null;
  }

  private mapBehaviorFromDB(data: any): UserBehavior {
    return {
      id: data.id,
      userId: data.user_id,
      contentId: data.content_id,
      contentType: data.content_type,
      behaviorType: data.behavior_type,
      behaviorTimestamp: data.behavior_timestamp,
      duration: data.duration,
      value: data.value,
      metadata: data.metadata,
    };
  }

  private mapPersonaFromDB(data: any): UserPersona {
    return {
      id: data.id,
      userId: data.user_id,
      interests: data.interests || [],
      creatorPreferences: data.creator_preferences || [],
      categoryPreferences: data.category_preferences || [],
      behaviorProfile: data.behavior_profile || {
        totalBehaviors: 0,
        avgSessionDuration: 0,
        avgBehaviorsPerSession: 0,
        activeDays: 0,
        lastActiveDate: new Date().toISOString(),
        engagementScore: 0,
        loyaltyScore: 0,
        explorationScore: 0.5,
      },
      timePatterns: data.time_patterns || [],
      devicePatterns: data.device_patterns || [],
      contentPreferences: data.content_preferences || {
        preferredTypes: [],
        typeDistribution: {} as Record<ContentType, number>,
        avgContentQuality: 0,
        noveltyPreference: 0.5,
        diversityPreference: 0.5,
      },
      socialProfile: data.social_profile || {
        followingCount: 0,
        followerCount: 0,
        interactionRate: 0,
        shareRate: 0,
        commentRate: 0,
      },
      demographics: data.demographics,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
      version: data.version || 1,
    };
  }

  async flush(): Promise<void> {
    await this.flushBehaviors();
  }
}

export const userPersonaService = new UserPersonaService();
