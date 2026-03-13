export type FeedbackType = 
  | 'like'
  | 'dislike'
  | 'not_interested'
  | 'seen_too_often'
  | 'inappropriate'
  | 'irrelevant'
  | 'outdated'
  | 'misleading'
  | 'other';

export type FeedbackReason = 
  | 'not_interested_topic'
  | 'not_interested_creator'
  | 'seen_before'
  | 'too_many_similar'
  | 'quality_issues'
  | 'misleading_content'
  | 'outdated_info'
  | 'inappropriate_content'
  | 'other';

export interface RecommendationFeedback {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'work' | 'creator' | 'event' | 'collection';
  feedbackType: FeedbackType;
  reason?: FeedbackReason;
  comment?: string;
  metadata?: {
    position?: number;
    source?: string;
    algorithm?: string;
    timestamp?: string;
    sessionId?: string;
    deviceId?: string;
  };
  createdAt: string;
}

export interface FeedbackStats {
  totalFeedback: number;
  likeCount: number;
  dislikeCount: number;
  notInterestedCount: number;
  reportCount: number;
  likeRate: number;
  dislikeRate: number;
  feedbackByType: Record<FeedbackType, number>;
  feedbackByReason: Record<FeedbackReason, number>;
  recentTrend: 'improving' | 'stable' | 'declining';
}

export interface FeedbackImpact {
  itemId: string;
  feedbackCount: number;
  avgScoreBefore: number;
  avgScoreAfter: number;
  impactScore: number;
  affectedUsers: number;
}

export interface ABTestExperiment {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'running' | 'paused' | 'completed';
  
  variants: {
    id: string;
    name: string;
    weight: number;
    config: Record<string, any>;
  }[];
  
  targeting: {
    userSegments?: string[];
    newUsersOnly?: boolean;
    platforms?: ('web' | 'mobile' | 'app')[];
    trafficAllocation: number;
  };
  
  metrics: {
    primary: string[];
    secondary: string[];
  };
  
  startDate: string;
  endDate?: string;
  
  results?: {
    variantId: string;
    impressions: number;
    clicks: number;
    ctr: number;
    engagement: number;
    conversion: number;
    confidence: number;
    isWinner: boolean;
  }[];
}

export interface RecommendationConfig {
  id: string;
  name: string;
  description: string;
  category: 'algorithm' | 'ranking' | 'diversity' | 'personalization';
  
  parameters: {
    key: string;
    value: any;
    type: 'number' | 'string' | 'boolean' | 'array' | 'object';
    description: string;
    defaultValue: any;
    min?: number;
    max?: number;
    options?: string[];
  }[];
  
  isActive: boolean;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface FeedbackLearningResult {
  userId: string;
  learningDate: string;
  
  updatedPreferences: {
    interests: Array<{ tag: string; scoreDelta: number }>;
    categories: Array<{ category: string; scoreDelta: number }>;
    creators: Array<{ creatorId: string; scoreDelta: number }>;
  };
  
  adjustedWeights: {
    algorithm: string;
    oldWeight: number;
    newWeight: number;
  }[];
  
  insights: string[];
  
  modelVersion: string;
}

export interface RecommendationQualityScore {
  overall: number;
  relevance: number;
  diversity: number;
  novelty: number;
  serendipity: number;
  freshness: number;
  
  calculatedAt: string;
  sampleSize: number;
}

export interface FeedbackBatch {
  id: string;
  userId: string;
  feedbacks: RecommendationFeedback[];
  status: 'pending' | 'processing' | 'completed' | 'failed';
  createdAt: string;
  processedAt?: string;
  error?: string;
}

export interface UserFeedbackProfile {
  userId: string;
  
  totalFeedback: number;
  feedbackRate: number;
  
  preferredFeedbackTypes: FeedbackType[];
  commonReasons: FeedbackReason[];
  
  avgSessionFeedback: number;
  lastFeedbackDate: string;
  
  feedbackQuality: 'high' | 'medium' | 'low';
  
  preferences: {
    likesDiversity: boolean;
    prefersNovelty: boolean;
    isSelective: boolean;
  };
}
