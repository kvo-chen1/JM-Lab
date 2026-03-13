export type RecommendationAlgorithm = 
  | 'collaborative_filtering'
  | 'content_based'
  | 'hybrid'
  | 'trending'
  | 'cold_start'
  | 'realtime';

export interface RecommendationCandidate {
  id: string;
  type: 'work' | 'creator' | 'collection' | 'event' | 'template';
  score: number;
  reasons: string[];
  algorithm: RecommendationAlgorithm;
  metadata?: Record<string, any>;
  
  features?: {
    popularity: number;
    freshness: number;
    quality: number;
    relevance: number;
    diversity: number;
    personalization: number;
  };
}

export interface CollaborativeFilteringConfig {
  method: 'user_based' | 'item_based' | 'matrix_factorization';
  minSimilarity: number;
  maxNeighbors: number;
  decayFactor: number;
  timeWindow: number;
}

export interface ContentBasedConfig {
  featureWeights: {
    tags: number;
    category: number;
    creator: number;
    description: number;
    visual: number;
  };
  similarityThreshold: number;
  maxFeatures: number;
}

export interface HybridConfig {
  collaborativeWeight: number;
  contentWeight: number;
  trendingWeight: number;
  personalizationWeight: number;
  diversityWeight: number;
}

export interface RankingConfig {
  features: {
    name: string;
    weight: number;
    normalize: boolean;
  }[];
  diversityPenalty: number;
  freshnessBoost: number;
  popularityDecay: number;
}

export interface RecommendationContext {
  userId: string;
  sessionId?: string;
  deviceId?: string;
  timestamp: string;
  platform: 'web' | 'mobile' | 'app';
  location?: {
    country?: string;
    city?: string;
  };
  recentHistory?: string[];
  currentMood?: string;
}

export interface RecommendationRequest {
  context: RecommendationContext;
  limit: number;
  offset?: number;
  algorithms?: RecommendationAlgorithm[];
  filters?: {
    types?: string[];
    categories?: string[];
    tags?: string[];
    excludeIds?: string[];
    minQuality?: number;
    dateRange?: {
      start: string;
      end: string;
    };
  };
  config?: {
    collaborative?: CollaborativeFilteringConfig;
    contentBased?: ContentBasedConfig;
    hybrid?: HybridConfig;
    ranking?: RankingConfig;
  };
}

export interface RecommendationResponse {
  items: RecommendationCandidate[];
  context: RecommendationContext;
  metadata: {
    algorithmUsed: RecommendationAlgorithm[];
    totalCandidates: number;
    processingTime: number;
    personalizationScore: number;
    diversityScore: number;
  };
  experiments?: {
    experimentId: string;
    variant: string;
  };
}

export interface UserItemMatrix {
  userId: string;
  itemRatings: Map<string, number>;
  timestamp: string;
}

export interface ItemSimilarity {
  itemId: string;
  similarItems: Array<{
    itemId: string;
    similarity: number;
    commonUsers: number;
  }>;
}

export interface UserSimilarity {
  userId: string;
  similarUsers: Array<{
    userId: string;
    similarity: number;
    commonItems: number;
  }>;
}

export interface FeatureVector {
  id: string;
  features: Map<string, number>;
  normalized: boolean;
}

export interface RecommendationExplanation {
  itemId: string;
  primaryReason: string;
  secondaryReasons: string[];
  contributingFactors: {
    factor: string;
    weight: number;
    description: string;
  }[];
  confidence: number;
}

export interface ABTestConfig {
  experimentId: string;
  name: string;
  variants: {
    id: string;
    name: string;
    weight: number;
    config: Partial<HybridConfig>;
  }[];
  startDate: string;
  endDate?: string;
  metrics: string[];
  targeting?: {
    userSegments?: string[];
    platforms?: string[];
    newUsersOnly?: boolean;
  };
}

export interface RecommendationMetrics {
  userId: string;
  date: string;
  
  impressionCount: number;
  clickCount: number;
  clickThroughRate: number;
  
  likeCount: number;
  shareCount: number;
  commentCount: number;
  saveCount: number;
  engagementRate: number;
  
  avgTimeSpent: number;
  bounceRate: number;
  returnRate: number;
  
  diversityScore: number;
  noveltyScore: number;
  serendipityScore: number;
  
  algorithmPerformance: Record<RecommendationAlgorithm, {
    impressions: number;
    clicks: number;
    ctr: number;
    engagement: number;
  }>;
}

export interface DiversityConfig {
  maxSameCategory: number;
  maxSameCreator: number;
  maxSameTag: number;
  timeWindowHours: number;
  noveltyWeight: number;
  serendipityWeight: number;
}

export interface RankingFeatures {
  itemId: string;
  
  popularityFeatures: {
    viewCount: number;
    likeCount: number;
    commentCount: number;
    shareCount: number;
    saveCount: number;
    viralScore: number;
  };
  
  qualityFeatures: {
    completeness: number;
    mediaQuality: number;
    contentScore: number;
    creatorScore: number;
  };
  
  freshnessFeatures: {
    age: number;
    recencyScore: number;
    trendVelocity: number;
  };
  
  personalizationFeatures: {
    categoryMatch: number;
    tagMatch: number;
    creatorAffinity: number;
    historicalPreference: number;
  };
  
  socialFeatures: {
    friendEngagement: number;
    influencerEndorsement: number;
    communityPopularity: number;
  };
  
  contextFeatures: {
    timeRelevance: number;
    locationRelevance: number;
    deviceOptimization: number;
  };
}
