import { supabase } from '@/lib/supabase';
import {
  RecommendationCandidate,
  RecommendationAlgorithm,
  CollaborativeFilteringConfig,
  ContentBasedConfig,
  HybridConfig,
  RankingConfig,
  RecommendationContext,
  UserSimilarity,
  ItemSimilarity,
  FeatureVector,
  DiversityConfig,
  RankingFeatures,
} from '@/types/recommendation';
import { userPersonaService } from './userPersonaService';
import { UserPersona, InterestTag } from '@/types/userPersona';

const DEFAULT_CF_CONFIG: CollaborativeFilteringConfig = {
  method: 'user_based',
  minSimilarity: 0.1,
  maxNeighbors: 50,
  decayFactor: 0.95,
  timeWindow: 30,
};

const DEFAULT_CB_CONFIG: ContentBasedConfig = {
  featureWeights: {
    tags: 0.35,
    category: 0.25,
    creator: 0.20,
    description: 0.10,
    visual: 0.10,
  },
  similarityThreshold: 0.3,
  maxFeatures: 100,
};

const DEFAULT_HYBRID_CONFIG: HybridConfig = {
  collaborativeWeight: 0.30,
  contentWeight: 0.35,
  trendingWeight: 0.15,
  personalizationWeight: 0.15,
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

class RecommendationAlgorithmService {
  private similarityCache: Map<string, UserSimilarity> = new Map();
  private itemSimilarityCache: Map<string, ItemSimilarity> = new Map();
  private featureCache: Map<string, FeatureVector> = new Map();

  async collaborativeFiltering(
    userId: string,
    candidates: RecommendationCandidate[],
    config: CollaborativeFilteringConfig = DEFAULT_CF_CONFIG
  ): Promise<RecommendationCandidate[]> {
    const userSimilarity = await this.getUserSimilarity(userId, config);
    
    if (!userSimilarity || userSimilarity.similarUsers.length === 0) {
      return candidates.map(c => ({
        ...c,
        algorithm: 'collaborative_filtering',
        score: c.score * 0.5,
        reasons: [...c.reasons, '协同过滤数据不足'],
      }));
    }

    const similarUserIds = userSimilarity.similarUsers
      .filter(u => u.similarity >= config.minSimilarity)
      .slice(0, config.maxNeighbors)
      .map(u => u.userId);

    const { data: similarUserBehaviors } = await supabase
      .from('user_behaviors')
      .select('content_id, behavior_type, user_id')
      .in('user_id', similarUserIds)
      .in('behavior_type', ['like', 'favorite', 'share', 'complete']);

    if (!similarUserBehaviors || similarUserBehaviors.length === 0) {
      return candidates;
    }

    const itemScores: Map<string, { score: number; users: string[] }> = new Map();
    
    similarUserBehaviors.forEach(behavior => {
      const similarityWeight = userSimilarity.similarUsers.find(
        u => u.userId === behavior.user_id
      )?.similarity || 0.5;
      
      const behaviorWeight = this.getBehaviorWeight(behavior.behavior_type);
      const contribution = similarityWeight * behaviorWeight;
      
      const existing = itemScores.get(behavior.content_id);
      if (existing) {
        existing.score += contribution;
        if (!existing.users.includes(behavior.user_id)) {
          existing.users.push(behavior.user_id);
        }
      } else {
        itemScores.set(behavior.content_id, {
          score: contribution,
          users: [behavior.user_id],
        });
      }
    });

    return candidates.map(candidate => {
      const cfScore = itemScores.get(candidate.id);
      if (cfScore) {
        const normalizedScore = Math.min(cfScore.score / 10, 1);
        return {
          ...candidate,
          score: candidate.score * (1 + normalizedScore),
          algorithm: 'collaborative_filtering',
          reasons: [...candidate.reasons, `${cfScore.users.length}位相似用户喜欢`],
          features: {
            ...candidate.features,
            personalization: normalizedScore,
          },
        };
      }
      return {
        ...candidate,
        algorithm: 'collaborative_filtering',
      };
    });
  }

  async contentBasedFiltering(
    userId: string,
    candidates: RecommendationCandidate[],
    config: ContentBasedConfig = DEFAULT_CB_CONFIG
  ): Promise<RecommendationCandidate[]> {
    const persona = await userPersonaService.getUserPersona(userId);
    
    if (!persona || persona.interests.length === 0) {
      return candidates.map(c => ({
        ...c,
        algorithm: 'content_based',
        score: c.score * 0.6,
        reasons: [...c.reasons, '新用户推荐'],
      }));
    }

    const userFeatureVector = this.buildUserFeatureVector(persona);
    
    return candidates.map(candidate => {
      const itemFeatureVector = this.buildItemFeatureVector(candidate);
      const similarity = this.calculateCosineSimilarity(
        userFeatureVector,
        itemFeatureVector
      );

      const reasons: string[] = [];
      const matchedTags = this.getMatchedTags(persona.interests, candidate.metadata?.tags || []);
      
      if (matchedTags.length > 0) {
        reasons.push(`符合您的兴趣: ${matchedTags.slice(0, 3).join('、')}`);
      }
      
      if (candidate.metadata?.category && 
          persona.categoryPreferences.some(c => c.category === candidate.metadata?.category)) {
        reasons.push(`您喜欢的${candidate.metadata.category}类别`);
      }

      const creatorPref = persona.creatorPreferences.find(
        c => c.creatorId === candidate.metadata?.creatorId
      );
      if (creatorPref) {
        reasons.push(`您关注的创作者: ${creatorPref.creatorName}`);
      }

      return {
        ...candidate,
        score: candidate.score * (1 + similarity * config.featureWeights.tags),
        algorithm: 'content_based',
        reasons: [...candidate.reasons, ...reasons],
        features: {
          ...candidate.features,
          relevance: similarity,
          personalization: similarity,
        },
      };
    });
  }

  async hybridRecommendation(
    userId: string,
    candidates: RecommendationCandidate[],
    config: HybridConfig = DEFAULT_HYBRID_CONFIG
  ): Promise<RecommendationCandidate[]> {
    const cfResults = await this.collaborativeFiltering(userId, candidates);
    const cbResults = await this.contentBasedFiltering(userId, candidates);
    const trendingResults = this.applyTrendingBoost(candidates);

    const mergedMap: Map<string, RecommendationCandidate> = new Map();

    cfResults.forEach(item => {
      const existing = mergedMap.get(item.id);
      const weightedScore = item.score * config.collaborativeWeight;
      
      if (existing) {
        existing.score += weightedScore;
        existing.reasons = [...new Set([...existing.reasons, ...item.reasons])];
      } else {
        mergedMap.set(item.id, {
          ...item,
          score: weightedScore,
          algorithm: 'hybrid',
        });
      }
    });

    cbResults.forEach(item => {
      const existing = mergedMap.get(item.id);
      const weightedScore = item.score * config.contentWeight;
      
      if (existing) {
        existing.score += weightedScore;
        existing.reasons = [...new Set([...existing.reasons, ...item.reasons])];
      } else {
        mergedMap.set(item.id, {
          ...item,
          score: weightedScore,
          algorithm: 'hybrid',
        });
      }
    });

    trendingResults.forEach(item => {
      const existing = mergedMap.get(item.id);
      const weightedScore = item.score * config.trendingWeight;
      
      if (existing) {
        existing.score += weightedScore;
        if (!existing.reasons.includes('热门内容')) {
          existing.reasons.push('热门内容');
        }
      } else {
        mergedMap.set(item.id, {
          ...item,
          score: weightedScore,
          algorithm: 'hybrid',
          reasons: ['热门内容'],
        });
      }
    });

    return Array.from(mergedMap.values())
      .sort((a, b) => b.score - a.score);
  }

  applyTrendingBoost(
    candidates: RecommendationCandidate[]
  ): RecommendationCandidate[] {
    const now = Date.now();
    
    return candidates.map(candidate => {
      const createdAt = candidate.metadata?.createdAt 
        ? new Date(candidate.metadata.createdAt).getTime() 
        : now;
      
      const ageInDays = (now - createdAt) / (1000 * 60 * 60 * 24);
      const freshnessScore = Math.exp(-ageInDays / 7);
      
      const popularityScore = this.calculatePopularityScore(candidate);
      
      const trendingScore = (freshnessScore * 0.4 + popularityScore * 0.6);
      
      return {
        ...candidate,
        score: candidate.score * (1 + trendingScore),
        features: {
          ...candidate.features,
          popularity: popularityScore,
          freshness: freshnessScore,
        },
      };
    });
  }

  async rankCandidates(
    candidates: RecommendationCandidate[],
    config: RankingConfig,
    context: RecommendationContext
  ): Promise<RecommendationCandidate[]> {
    const rankedCandidates = candidates.map(candidate => {
      const features = this.extractRankingFeatures(candidate, context);
      let score = candidate.score;

      config.features.forEach(featureConfig => {
        const featureValue = this.getFeatureValue(features, featureConfig.name);
        const normalizedValue = featureConfig.normalize 
          ? this.normalizeFeature(featureValue, featureConfig.name)
          : featureValue;
        score += normalizedValue * featureConfig.weight;
      });

      score *= (1 + config.freshnessBoost * (features.freshnessFeatures.recencyScore || 0));

      return {
        ...candidate,
        score,
        features: {
          ...candidate.features,
          quality: features.qualityFeatures?.contentScore || 0,
        },
      };
    });

    return rankedCandidates.sort((a, b) => b.score - a.score);
  }

  async diversifyResults(
    candidates: RecommendationCandidate[],
    config: DiversityConfig = DEFAULT_DIVERSITY_CONFIG
  ): Promise<RecommendationCandidate[]> {
    const diversified: RecommendationCandidate[] = [];
    const categoryCount: Map<string, number> = new Map();
    const creatorCount: Map<string, number> = new Map();
    const tagCount: Map<string, number> = new Map();
    const totalSlots = candidates.length;

    for (const candidate of candidates) {
      const category = candidate.metadata?.category || 'unknown';
      const creator = candidate.metadata?.creatorId || 'unknown';
      const tags = candidate.metadata?.tags || [];

      const categoryRatio = (categoryCount.get(category) || 0) / totalSlots;
      const creatorRatio = (creatorCount.get(creator) || 0) / totalSlots;
      const maxTagRatio = Math.max(
        ...tags.map((t: string) => (tagCount.get(t) || 0) / totalSlots),
        0
      );

      if (
        categoryRatio < config.maxSameCategory &&
        creatorRatio < config.maxSameCreator &&
        maxTagRatio < config.maxSameTag
      ) {
        diversified.push(candidate);
        
        categoryCount.set(category, (categoryCount.get(category) || 0) + 1);
        creatorCount.set(creator, (creatorCount.get(creator) || 0) + 1);
        tags.forEach((t: string) => {
          tagCount.set(t, (tagCount.get(t) || 0) + 1);
        });
      }

      if (diversified.length >= totalSlots) break;
    }

    if (diversified.length < totalSlots) {
      const remaining = candidates.filter(
        c => !diversified.some(d => d.id === c.id)
      );
      diversified.push(...remaining.slice(0, totalSlots - diversified.length));
    }

    return diversified;
  }

  deduplicateResults(
    candidates: RecommendationCandidate[]
  ): RecommendationCandidate[] {
    const seen = new Set<string>();
    return candidates.filter(candidate => {
      const key = `${candidate.type}_${candidate.id}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private async getUserSimilarity(
    userId: string,
    config: CollaborativeFilteringConfig
  ): Promise<UserSimilarity | null> {
    const cacheKey = `user_sim_${userId}`;
    const cached = this.similarityCache.get(cacheKey);
    
    if (cached) {
      return cached;
    }

    try {
      const { data: userBehaviors } = await supabase
        .from('user_behaviors')
        .select('content_id, behavior_type, user_id')
        .gte('timestamp', new Date(Date.now() - config.timeWindow * 24 * 60 * 60 * 1000).toISOString())
        .limit(1000);

      if (!userBehaviors || userBehaviors.length === 0) {
        return null;
      }

      const userItemMatrix: Map<string, Map<string, number>> = new Map();
      
      userBehaviors.forEach(behavior => {
        if (!userItemMatrix.has(behavior.user_id)) {
          userItemMatrix.set(behavior.user_id, new Map());
        }
        const userItems = userItemMatrix.get(behavior.user_id)!;
        const currentScore = userItems.get(behavior.content_id) || 0;
        userItems.set(
          behavior.content_id, 
          currentScore + this.getBehaviorWeight(behavior.behavior_type)
        );
      });

      const targetVector = userItemMatrix.get(userId);
      if (!targetVector) return null;

      const similarities: Array<{ userId: string; similarity: number; commonItems: number }> = [];

      userItemMatrix.forEach((vector, otherUserId) => {
        if (otherUserId === userId) return;

        const similarity = this.calculateCosineSimilarity(
          targetVector,
          vector
        );

        const commonItems = [...targetVector.keys()].filter(k => vector.has(k)).length;

        if (similarity >= config.minSimilarity) {
          similarities.push({
            userId: otherUserId,
            similarity,
            commonItems,
          });
        }
      });

      const result: UserSimilarity = {
        userId,
        similarUsers: similarities
          .sort((a, b) => b.similarity - a.similarity)
          .slice(0, config.maxNeighbors),
      };

      this.similarityCache.set(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error calculating user similarity:', error);
      return null;
    }
  }

  private buildUserFeatureVector(persona: UserPersona): Map<string, number> {
    const vector: Map<string, number> = new Map();

    persona.interests.forEach(interest => {
      vector.set(`tag_${interest.tag}`, interest.score);
    });

    persona.categoryPreferences.forEach(pref => {
      vector.set(`category_${pref.category}`, pref.score);
    });

    persona.creatorPreferences.forEach(pref => {
      vector.set(`creator_${pref.creatorId}`, pref.score);
    });

    return this.normalizeVector(vector);
  }

  private buildItemFeatureVector(candidate: RecommendationCandidate): Map<string, number> {
    const vector: Map<string, number> = new Map();

    if (candidate.metadata?.tags) {
      candidate.metadata.tags.forEach((tag: string) => {
        vector.set(`tag_${tag}`, 1);
      });
    }

    if (candidate.metadata?.category) {
      vector.set(`category_${candidate.metadata.category}`, 1);
    }

    if (candidate.metadata?.creatorId) {
      vector.set(`creator_${candidate.metadata.creatorId}`, 1);
    }

    return vector;
  }

  private calculateCosineSimilarity(
    vectorA: Map<string, number>,
    vectorB: Map<string, number>
  ): number {
    const allKeys = new Set([...vectorA.keys(), ...vectorB.keys()]);
    
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;

    allKeys.forEach(key => {
      const valueA = vectorA.get(key) || 0;
      const valueB = vectorB.get(key) || 0;
      
      dotProduct += valueA * valueB;
      normA += valueA * valueA;
      normB += valueB * valueB;
    });

    if (normA === 0 || normB === 0) return 0;
    
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
  }

  private normalizeVector(vector: Map<string, number>): Map<string, number> {
    const values = Array.from(vector.values());
    const max = Math.max(...values, 1);
    
    const normalized = new Map<string, number>();
    vector.forEach((value, key) => {
      normalized.set(key, value / max);
    });
    
    return normalized;
  }

  private getMatchedTags(userInterests: InterestTag[], itemTags: string[]): string[] {
    const userTagSet = new Set(userInterests.map(i => i.tag));
    return itemTags.filter(tag => userTagSet.has(tag));
  }

  private getBehaviorWeight(behaviorType: string): number {
    const weights: Record<string, number> = {
      view: 1,
      like: 5,
      favorite: 7,
      comment: 8,
      share: 10,
      download: 6,
      complete: 12,
      follow: 15,
    };
    return weights[behaviorType] || 1;
  }

  private calculatePopularityScore(candidate: RecommendationCandidate): number {
    const metadata = candidate.metadata || {};
    const likes = metadata.likes || 0;
    const views = metadata.views || 0;
    const comments = metadata.comments || 0;
    const shares = metadata.shares || 0;

    const engagementScore = likes * 5 + comments * 8 + shares * 10;
    const viewScore = Math.log10(views + 1);
    
    return Math.min((engagementScore / 1000 + viewScore / 5) / 2, 1);
  }

  private extractRankingFeatures(
    candidate: RecommendationCandidate,
    context: RecommendationContext
  ): RankingFeatures {
    const metadata = candidate.metadata || {};
    const now = Date.now();
    const createdAt = metadata.createdAt 
      ? new Date(metadata.createdAt).getTime() 
      : now;

    return {
      itemId: candidate.id,
      
      popularityFeatures: {
        viewCount: metadata.views || 0,
        likeCount: metadata.likes || 0,
        commentCount: metadata.comments || 0,
        shareCount: metadata.shares || 0,
        saveCount: metadata.saves || 0,
        viralScore: this.calculateViralScore(metadata),
      },
      
      qualityFeatures: {
        completeness: this.calculateCompleteness(metadata),
        mediaQuality: metadata.mediaQuality || 0.7,
        contentScore: metadata.contentScore || 0.5,
        creatorScore: metadata.creatorScore || 0.5,
      },
      
      freshnessFeatures: {
        age: (now - createdAt) / (1000 * 60 * 60 * 24),
        recencyScore: Math.exp(-((now - createdAt) / (1000 * 60 * 60 * 24 * 7))),
        trendVelocity: metadata.trendVelocity || 0,
      },
      
      personalizationFeatures: {
        categoryMatch: metadata.categoryMatch || 0,
        tagMatch: metadata.tagMatch || 0,
        creatorAffinity: metadata.creatorAffinity || 0,
        historicalPreference: metadata.historicalPreference || 0,
      },
      
      socialFeatures: {
        friendEngagement: metadata.friendEngagement || 0,
        influencerEndorsement: metadata.influencerEndorsement || 0,
        communityPopularity: metadata.communityPopularity || 0,
      },
      
      contextFeatures: {
        timeRelevance: this.calculateTimeRelevance(context),
        locationRelevance: metadata.locationRelevance || 0.5,
        deviceOptimization: 0.5,
      },
    };
  }

  private getFeatureValue(features: RankingFeatures, featureName: string): number {
    const parts = featureName.split('.');
    let value: any = features;
    
    for (const part of parts) {
      value = value?.[part];
      if (value === undefined) return 0;
    }
    
    return typeof value === 'number' ? value : 0;
  }

  private normalizeFeature(value: number, featureName: string): number {
    const maxValues: Record<string, number> = {
      'popularityFeatures.viewCount': 100000,
      'popularityFeatures.likeCount': 10000,
      'popularityFeatures.commentCount': 1000,
      'popularityFeatures.shareCount': 500,
      'popularityFeatures.saveCount': 500,
      'freshnessFeatures.age': 365,
    };

    const max = maxValues[featureName] || 1;
    return Math.min(value / max, 1);
  }

  private calculateViralScore(metadata: any): number {
    const views = metadata.views || 0;
    const shares = metadata.shares || 0;
    const likes = metadata.likes || 0;
    
    if (views === 0) return 0;
    
    const shareRate = shares / views;
    const likeRate = likes / views;
    
    return Math.min((shareRate * 10 + likeRate * 5) / 2, 1);
  }

  private calculateCompleteness(metadata: any): number {
    let score = 0;
    const weights: Record<string, number> = {
      title: 0.2,
      description: 0.2,
      thumbnail: 0.2,
      tags: 0.15,
      category: 0.15,
      creatorId: 0.1,
    };

    Object.entries(weights).forEach(([key, weight]) => {
      if (metadata[key]) {
        if (Array.isArray(metadata[key]) && metadata[key].length > 0) {
          score += weight;
        } else if (typeof metadata[key] === 'string' && metadata[key].trim()) {
          score += weight;
        } else if (metadata[key]) {
          score += weight;
        }
      }
    });

    return score;
  }

  private calculateTimeRelevance(context: RecommendationContext): number {
    const hour = new Date(context.timestamp).getHours();
    
    const peakHours = [9, 12, 18, 21];
    const minDistance = Math.min(...peakHours.map(h => Math.abs(h - hour)));
    
    return Math.max(0, 1 - minDistance / 12);
  }

  clearCache(): void {
    this.similarityCache.clear();
    this.itemSimilarityCache.clear();
    this.featureCache.clear();
  }
}

export const recommendationAlgorithmService = new RecommendationAlgorithmService();
