import { supabase } from '@/lib/supabase';
import { userPersonaService } from './userPersonaService';
import { recommendationAlgorithmService } from './recommendationAlgorithmService';
import {
  RecommendationCandidate,
  RecommendationAlgorithm,
  RecommendationContext,
  RecommendationRequest,
  RecommendationResponse,
  RecommendationExplanation,
  HybridConfig,
  DiversityConfig,
  RankingConfig,
} from '@/types/recommendation';
import { UserPersona, BehaviorType, ContentType } from '@/types/userPersona';

const DEFAULT_HYBRID_CONFIG: HybridConfig = {
  collaborativeWeight: 0.25,
  contentWeight: 0.30,
  trendingWeight: 0.20,
  personalizationWeight: 0.20,
  diversityWeight: 0.05,
};

const DEFAULT_DIVERSITY_CONFIG: DiversityConfig = {
  maxSameCategory: 0.3,
  maxSameCreator: 0.2,
  maxSameTag: 0.25,
  timeWindowHours: 24,
  noveltyWeight: 0.15,
  serendipityWeight: 0.10,
};

const DEFAULT_RANKING_CONFIG: RankingConfig = {
  features: [
    { name: 'popularityFeatures.viralScore', weight: 0.15, normalize: true },
    { name: 'qualityFeatures.completeness', weight: 0.10, normalize: true },
    { name: 'freshnessFeatures.recencyScore', weight: 0.15, normalize: true },
    { name: 'personalizationFeatures.categoryMatch', weight: 0.20, normalize: true },
    { name: 'personalizationFeatures.tagMatch', weight: 0.15, normalize: true },
    { name: 'personalizationFeatures.creatorAffinity', weight: 0.10, normalize: true },
    { name: 'socialFeatures.friendEngagement', weight: 0.05, normalize: true },
    { name: 'contextFeatures.timeRelevance', weight: 0.10, normalize: true },
  ],
  diversityPenalty: 0.1,
  freshnessBoost: 0.2,
  popularityDecay: 0.95,
};

class PersonalizedRecommendationEngine {
  private recommendationCache: Map<string, { items: RecommendationCandidate[]; timestamp: number }> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  async getRecommendations(request: RecommendationRequest): Promise<RecommendationResponse> {
    const startTime = Date.now();
    const { context, limit, filters, config } = request;

    const cacheKey = this.getCacheKey(context.userId, limit, filters);
    const cached = this.recommendationCache.get(cacheKey);
    
    if (cached && Date.now() - cached.timestamp < this.CACHE_TTL) {
      return {
        items: cached.items.slice(0, limit),
        context,
        metadata: {
          algorithmUsed: ['cached'],
          totalCandidates: cached.items.length,
          processingTime: Date.now() - startTime,
          personalizationScore: 0.8,
          diversityScore: 0.7,
        },
      };
    }

    const persona = await userPersonaService.getUserPersona(context.userId);
    const isColdStart = !persona || persona.behaviorProfile.totalBehaviors < 20;

    let candidates: RecommendationCandidate[];

    if (isColdStart) {
      candidates = await this.coldStartRecommendation(context, limit);
    } else {
      candidates = await this.warmStartRecommendation(context, persona!, limit, config);
    }

    if (filters?.excludeIds && filters.excludeIds.length > 0) {
      candidates = candidates.filter(c => !filters.excludeIds!.includes(c.id));
    }

    candidates = await recommendationAlgorithmService.rankCandidates(
      candidates,
      config?.ranking || DEFAULT_RANKING_CONFIG,
      context
    );

    candidates = await recommendationAlgorithmService.diversifyResults(
      candidates,
      config?.hybrid ? undefined : DEFAULT_DIVERSITY_CONFIG
    );

    candidates = recommendationAlgorithmService.deduplicateResults(candidates);

    const finalItems = candidates.slice(0, limit);

    this.recommendationCache.set(cacheKey, {
      items: finalItems,
      timestamp: Date.now(),
    });

    const personalizationScore = this.calculatePersonalizationScore(finalItems, persona);
    const diversityScore = this.calculateDiversityScore(finalItems);

    return {
      items: finalItems,
      context,
      metadata: {
        algorithmUsed: isColdStart ? ['cold_start'] : ['hybrid', 'collaborative_filtering', 'content_based'],
        totalCandidates: candidates.length,
        processingTime: Date.now() - startTime,
        personalizationScore,
        diversityScore,
      },
    };
  }

  private async coldStartRecommendation(
    context: RecommendationContext,
    limit: number
  ): Promise<RecommendationCandidate[]> {
    const trendingItems = await this.getTrendingItems(limit * 2);
    const newItems = await this.getNewItems(limit);
    const popularItems = await this.getPopularItems(limit);

    const candidates: RecommendationCandidate[] = [
      ...trendingItems.map(item => ({
        ...item,
        algorithm: 'cold_start' as RecommendationAlgorithm,
        reasons: ['热门推荐', '新用户精选'],
      })),
      ...newItems.map(item => ({
        ...item,
        algorithm: 'cold_start' as RecommendationAlgorithm,
        reasons: ['新鲜内容', '最新发布'],
      })),
      ...popularItems.map(item => ({
        ...item,
        algorithm: 'cold_start' as RecommendationAlgorithm,
        reasons: ['高人气内容', '大家都在看'],
      })),
    ];

    return recommendationAlgorithmService.deduplicateResults(candidates);
  }

  private async warmStartRecommendation(
    context: RecommendationContext,
    persona: UserPersona,
    limit: number,
    config?: RecommendationRequest['config']
  ): Promise<RecommendationCandidate[]> {
    const candidatePool = await this.getCandidatePool(context.userId, limit * 3);

    let candidates = await recommendationAlgorithmService.hybridRecommendation(
      context.userId,
      candidatePool,
      config?.hybrid || DEFAULT_HYBRID_CONFIG
    );

    candidates = this.applyPersonalizationBoost(candidates, persona);

    return candidates;
  }

  private async getCandidatePool(
    userId: string,
    poolSize: number
  ): Promise<RecommendationCandidate[]> {
    const candidates: RecommendationCandidate[] = [];

    const { data: works } = await supabase
      .from('works')
      .select('*')
      .eq('status', 'published')
      .order('created_at', { ascending: false })
      .limit(poolSize);

    if (works) {
      works.forEach(work => {
        candidates.push({
          id: work.id,
          type: 'work',
          score: this.calculateInitialScore(work),
          reasons: [],
          algorithm: 'content_based',
          metadata: {
            title: work.title,
            description: work.description,
            thumbnail: work.thumbnail || work.cover_url,
            category: work.category,
            tags: work.tags,
            creatorId: work.creator_id,
            creatorName: work.creator_name,
            createdAt: work.created_at,
            likes: work.likes,
            views: work.views,
            comments: work.comments,
            shares: work.shares,
          },
        });
      });
    }

    const { data: events } = await supabase
      .from('events')
      .select('*')
      .eq('status', 'published')
      .gte('end_time', new Date().toISOString())
      .order('start_time', { ascending: true })
      .limit(poolSize / 4);

    if (events) {
      events.forEach(event => {
        candidates.push({
          id: event.id,
          type: 'event',
          score: this.calculateEventScore(event),
          reasons: [],
          algorithm: 'content_based',
          metadata: {
            title: event.title,
            description: event.description,
            thumbnail: event.image_url,
            category: event.category,
            tags: event.tags,
            startTime: event.start_time,
            endTime: event.end_time,
            participants: event.participant_count,
          },
        });
      });
    }

    const { data: creators } = await supabase
      .from('profiles')
      .select('*')
      .order('follower_count', { ascending: false })
      .limit(poolSize / 5);

    if (creators) {
      creators.forEach(creator => {
        candidates.push({
          id: creator.id,
          type: 'creator',
          score: this.calculateCreatorScore(creator),
          reasons: [],
          algorithm: 'content_based',
          metadata: {
            name: creator.username,
            avatar: creator.avatar_url,
            bio: creator.bio,
            followerCount: creator.follower_count,
            workCount: creator.work_count,
          },
        });
      });
    }

    return candidates;
  }

  private applyPersonalizationBoost(
    candidates: RecommendationCandidate[],
    persona: UserPersona
  ): RecommendationCandidate[] {
    const interestMap = new Map(persona.interests.map(i => [i.tag, i.score]));
    const categoryMap = new Map(persona.categoryPreferences.map(c => [c.category, c.score]));
    const creatorMap = new Map(persona.creatorPreferences.map(c => [c.creatorId, c.score]));

    return candidates.map(candidate => {
      let boost = 1;
      const personalizationReasons: string[] = [];

      if (candidate.metadata?.tags) {
        const matchedTags = candidate.metadata.tags.filter((t: string) => interestMap.has(t));
        if (matchedTags.length > 0) {
          const tagBoost = matchedTags.reduce((sum: number, t: string) => sum + (interestMap.get(t) || 0), 0) / matchedTags.length;
          boost += tagBoost * 0.1;
          personalizationReasons.push(`符合您的兴趣: ${matchedTags.slice(0, 2).join('、')}`);
        }
      }

      if (candidate.metadata?.category && categoryMap.has(candidate.metadata.category)) {
        boost += (categoryMap.get(candidate.metadata.category) || 0) * 0.15;
        personalizationReasons.push(`您喜欢的${candidate.metadata.category}类别`);
      }

      if (candidate.metadata?.creatorId && creatorMap.has(candidate.metadata.creatorId)) {
        boost += (creatorMap.get(candidate.metadata.creatorId) || 0) * 0.2;
        const creator = persona.creatorPreferences.find(c => c.creatorId === candidate.metadata?.creatorId);
        if (creator) {
          personalizationReasons.push(`您关注的创作者: ${creator.creatorName}`);
        }
      }

      return {
        ...candidate,
        score: candidate.score * boost,
        reasons: [...candidate.reasons, ...personalizationReasons],
        features: {
          ...candidate.features,
          personalization: boost - 1,
        },
      };
    });
  }

  private async getTrendingItems(limit: number): Promise<RecommendationCandidate[]> {
    const { data: trendingWorks } = await supabase
      .from('works')
      .select('*')
      .eq('status', 'published')
      .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
      .order('views', { ascending: false })
      .limit(limit);

    return (trendingWorks || []).map(work => ({
      id: work.id,
      type: 'work' as const,
      score: this.calculateTrendingScore(work),
      reasons: ['热门推荐'],
      algorithm: 'trending' as RecommendationAlgorithm,
      metadata: {
        title: work.title,
        description: work.description,
        thumbnail: work.thumbnail || work.cover_url,
        category: work.category,
        tags: work.tags,
        creatorId: work.creator_id,
        creatorName: work.creator_name,
        createdAt: work.created_at,
        likes: work.likes,
        views: work.views,
      },
    }));
  }

  private async getNewItems(limit: number): Promise<RecommendationCandidate[]> {
    const { data: newWorks } = await supabase
      .from('works')
      .select('*')
      .eq('status', 'published')
      .gte('created_at', new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString())
      .order('created_at', { ascending: false })
      .limit(limit);

    return (newWorks || []).map(work => ({
      id: work.id,
      type: 'work' as const,
      score: 50,
      reasons: ['最新发布'],
      algorithm: 'trending' as RecommendationAlgorithm,
      metadata: {
        title: work.title,
        description: work.description,
        thumbnail: work.thumbnail || work.cover_url,
        category: work.category,
        tags: work.tags,
        creatorId: work.creator_id,
        creatorName: work.creator_name,
        createdAt: work.created_at,
      },
    }));
  }

  private async getPopularItems(limit: number): Promise<RecommendationCandidate[]> {
    const { data: popularWorks } = await supabase
      .from('works')
      .select('*')
      .eq('status', 'published')
      .order('likes', { ascending: false })
      .limit(limit);

    return (popularWorks || []).map(work => ({
      id: work.id,
      type: 'work' as const,
      score: this.calculatePopularityScore(work),
      reasons: ['高人气内容'],
      algorithm: 'trending' as RecommendationAlgorithm,
      metadata: {
        title: work.title,
        description: work.description,
        thumbnail: work.thumbnail || work.cover_url,
        category: work.category,
        tags: work.tags,
        creatorId: work.creator_id,
        creatorName: work.creator_name,
        likes: work.likes,
        views: work.views,
      },
    }));
  }

  async getRecommendationExplanation(
    userId: string,
    itemId: string
  ): Promise<RecommendationExplanation> {
    const persona = await userPersonaService.getUserPersona(userId);
    const { data: item } = await supabase
      .from('works')
      .select('*')
      .eq('id', itemId)
      .single();

    if (!item || !persona) {
      return {
        itemId,
        primaryReason: '为您推荐',
        secondaryReasons: [],
        contributingFactors: [],
        confidence: 0.5,
      };
    }

    const factors: RecommendationExplanation['contributingFactors'] = [];
    let primaryReason = '为您推荐';
    const secondaryReasons: string[] = [];

    if (item.tags && persona.interests.length > 0) {
      const matchedTags = item.tags.filter((t: string) => 
        persona.interests.some(i => i.tag === t)
      );
      if (matchedTags.length > 0) {
        factors.push({
          factor: '兴趣匹配',
          weight: 0.3,
          description: `匹配您的兴趣标签: ${matchedTags.join('、')}`,
        });
        primaryReason = `符合您对${matchedTags[0]}的兴趣`;
        secondaryReasons.push(`您曾对${matchedTags.slice(0, 2).join('、')}表现出兴趣`);
      }
    }

    if (item.category && persona.categoryPreferences.length > 0) {
      const categoryPref = persona.categoryPreferences.find(c => c.category === item.category);
      if (categoryPref) {
        factors.push({
          factor: '分类偏好',
          weight: 0.25,
          description: `您喜欢${item.category}类别的内容`,
        });
        if (primaryReason === '为您推荐') {
          primaryReason = `您喜欢的${item.category}类别`;
        }
        secondaryReasons.push(`您在${item.category}类别中有${categoryPref.interactionCount}次互动`);
      }
    }

    if (item.creator_id && persona.creatorPreferences.length > 0) {
      const creatorPref = persona.creatorPreferences.find(c => c.creatorId === item.creator_id);
      if (creatorPref) {
        factors.push({
          factor: '创作者关注',
          weight: 0.2,
          description: `您关注的创作者: ${creatorPref.creatorName}`,
        });
        secondaryReasons.push(`您与${creatorPref.creatorName}有${creatorPref.interactionCount}次互动`);
      }
    }

    if (item.likes > 100 || item.views > 1000) {
      factors.push({
        factor: '热度',
        weight: 0.15,
        description: `高人气内容: ${item.likes}点赞, ${item.views}浏览`,
      });
      secondaryReasons.push('大家都在看');
    }

    const daysOld = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
    if (daysOld < 3) {
      factors.push({
        factor: '新鲜度',
        weight: 0.1,
        description: '最新发布的内容',
      });
      secondaryReasons.push('新鲜出炉');
    }

    const confidence = Math.min(
      factors.reduce((sum, f) => sum + f.weight, 0) + 0.3,
      1
    );

    return {
      itemId,
      primaryReason,
      secondaryReasons: secondaryReasons.slice(0, 3),
      contributingFactors: factors,
      confidence,
    };
  }

  async recordFeedback(
    userId: string,
    itemId: string,
    itemType: ContentType,
    feedbackType: BehaviorType,
    metadata?: Record<string, any>
  ): Promise<void> {
    await userPersonaService.trackBehavior(
      userId,
      itemId,
      itemType,
      feedbackType,
      metadata
    );

    const cacheKey = this.getCacheKey(userId, 20, {});
    this.recommendationCache.delete(cacheKey);

    if (feedbackType === 'dislike' || feedbackType === 'hide') {
      await this.recordNegativeFeedback(userId, itemId, feedbackType);
    }
  }

  private async recordNegativeFeedback(
    userId: string,
    itemId: string,
    feedbackType: BehaviorType
  ): Promise<void> {
    try {
      await supabase
        .from('recommendation_feedback')
        .insert({
          user_id: userId,
          item_id: itemId,
          feedback_type: feedbackType,
          created_at: new Date().toISOString(),
        });
    } catch (error) {
      console.error('Error recording negative feedback:', error);
    }
  }

  private calculateInitialScore(item: any): number {
    const likes = item.likes || 0;
    const views = item.views || 0;
    const comments = item.comments || 0;
    const shares = item.shares || 0;

    const engagementScore = likes * 5 + comments * 8 + shares * 10;
    const viewScore = Math.log10(views + 1) * 10;
    
    return Math.min(engagementScore + viewScore, 100);
  }

  private calculateEventScore(event: any): number {
    const participants = event.participant_count || 0;
    const daysUntilStart = (new Date(event.start_time).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    
    let score = Math.log10(participants + 1) * 20;
    
    if (daysUntilStart > 0 && daysUntilStart < 7) {
      score += 30;
    } else if (daysUntilStart >= 7 && daysUntilStart < 14) {
      score += 20;
    }
    
    return Math.min(score, 100);
  }

  private calculateCreatorScore(creator: any): number {
    const followers = creator.follower_count || 0;
    const works = creator.work_count || 0;
    
    return Math.min(Math.log10(followers + 1) * 15 + works * 2, 100);
  }

  private calculateTrendingScore(item: any): number {
    const daysOld = (Date.now() - new Date(item.created_at).getTime()) / (1000 * 60 * 60 * 24);
    const freshnessFactor = Math.exp(-daysOld / 7);
    
    const engagementScore = (item.likes || 0) * 5 + (item.views || 0) * 0.5 + (item.shares || 0) * 10;
    
    return Math.min(engagementScore * freshnessFactor, 100);
  }

  private calculatePopularityScore(item: any): number {
    const likes = item.likes || 0;
    const views = item.views || 0;
    
    return Math.min(Math.log10(likes + 1) * 20 + Math.log10(views + 1) * 10, 100);
  }

  private calculatePersonalizationScore(
    items: RecommendationCandidate[],
    persona: UserPersona | null
  ): number {
    if (!persona || items.length === 0) return 0;

    let totalScore = 0;
    const interestSet = new Set(persona.interests.map(i => i.tag));
    const categorySet = new Set(persona.categoryPreferences.map(c => c.category));

    items.forEach(item => {
      let itemScore = 0;

      if (item.metadata?.tags) {
        const matchedTags = item.metadata.tags.filter((t: string) => interestSet.has(t));
        itemScore += matchedTags.length * 0.3;
      }

      if (item.metadata?.category && categorySet.has(item.metadata.category)) {
        itemScore += 0.4;
      }

      totalScore += Math.min(itemScore, 1);
    });

    return totalScore / items.length;
  }

  private calculateDiversityScore(items: RecommendationCandidate[]): number {
    if (items.length === 0) return 0;

    const categories = new Set<string>();
    const creators = new Set<string>();
    const tags = new Set<string>();

    items.forEach(item => {
      if (item.metadata?.category) categories.add(item.metadata.category);
      if (item.metadata?.creatorId) creators.add(item.metadata.creatorId);
      if (item.metadata?.tags) {
        item.metadata.tags.forEach((t: string) => tags.add(t));
      }
    });

    const categoryDiversity = categories.size / Math.max(items.length, 1);
    const creatorDiversity = creators.size / Math.max(items.length, 1);
    const tagDiversity = Math.min(tags.size / 10, 1);

    return (categoryDiversity * 0.4 + creatorDiversity * 0.3 + tagDiversity * 0.3);
  }

  private getCacheKey(
    userId: string,
    limit: number,
    filters?: any
  ): string {
    const filterStr = filters ? JSON.stringify(filters) : '';
    return `${userId}_${limit}_${filterStr}`;
  }

  clearCache(): void {
    this.recommendationCache.clear();
    recommendationAlgorithmService.clearCache();
  }
}

export const personalizedRecommendationEngine = new PersonalizedRecommendationEngine();
