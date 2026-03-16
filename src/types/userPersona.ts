export type BehaviorType = 
  | 'view' 
  | 'like' 
  | 'favorite' 
  | 'comment' 
  | 'share' 
  | 'download'
  | 'click'
  | 'search'
  | 'follow'
  | 'unfollow'
  | 'dislike'
  | 'hide'
  | 'report'
  | 'complete'
  | 'skip'
  | 'scroll'
  | 'expand';

export type ContentType = 
  | 'work' 
  | 'creator' 
  | 'collection' 
  | 'tag' 
  | 'category'
  | 'event'
  | 'template'
  | 'trending';

export interface UserBehavior {
  id: string;
  userId: string;
  contentId: string;
  contentType: ContentType;
  behaviorType: BehaviorType;
  behaviorTimestamp: string;
  duration?: number;
  value?: number;
  metadata?: {
    source?: string;
    position?: number;
    scrollDepth?: number;
    deviceId?: string;
    platform?: 'web' | 'mobile' | 'app';
    referrer?: string;
    [key: string]: any;
  };
}

export interface BehaviorWeight {
  behaviorType: BehaviorType;
  weight: number;
  decayFactor: number;
  halfLife: number;
}

export const BEHAVIOR_WEIGHTS: Record<BehaviorType, BehaviorWeight> = {
  view: { behaviorType: 'view', weight: 1.0, decayFactor: 0.95, halfLife: 7 },
  like: { behaviorType: 'like', weight: 5.0, decayFactor: 0.90, halfLife: 14 },
  favorite: { behaviorType: 'favorite', weight: 7.0, decayFactor: 0.85, halfLife: 21 },
  comment: { behaviorType: 'comment', weight: 8.0, decayFactor: 0.88, halfLife: 14 },
  share: { behaviorType: 'share', weight: 10.0, decayFactor: 0.80, halfLife: 30 },
  download: { behaviorType: 'download', weight: 6.0, decayFactor: 0.85, halfLife: 21 },
  click: { behaviorType: 'click', weight: 2.0, decayFactor: 0.90, halfLife: 7 },
  search: { behaviorType: 'search', weight: 3.0, decayFactor: 0.92, halfLife: 7 },
  follow: { behaviorType: 'follow', weight: 15.0, decayFactor: 0.70, halfLife: 60 },
  unfollow: { behaviorType: 'unfollow', weight: -15.0, decayFactor: 0.70, halfLife: 60 },
  dislike: { behaviorType: 'dislike', weight: -8.0, decayFactor: 0.95, halfLife: 14 },
  hide: { behaviorType: 'hide', weight: -10.0, decayFactor: 0.95, halfLife: 14 },
  report: { behaviorType: 'report', weight: -20.0, decayFactor: 0.95, halfLife: 30 },
  complete: { behaviorType: 'complete', weight: 12.0, decayFactor: 0.75, halfLife: 30 },
  skip: { behaviorType: 'skip', weight: -2.0, decayFactor: 0.95, halfLife: 3 },
  scroll: { behaviorType: 'scroll', weight: 0.5, decayFactor: 0.98, halfLife: 3 },
  expand: { behaviorType: 'expand', weight: 3.0, decayFactor: 0.90, halfLife: 7 },
};

export interface InterestTag {
  tag: string;
  score: number;
  category?: string;
  lastUpdated: string;
  behaviorCount: number;
  recentBehaviors: string[];
}

export interface CreatorPreference {
  creatorId: string;
  creatorName: string;
  creatorAvatar?: string;
  score: number;
  interactionCount: number;
  lastInteraction: string;
  preferredContentTypes: ContentType[];
}

export interface CategoryPreference {
  category: string;
  score: number;
  viewCount: number;
  interactionCount: number;
  lastViewed: string;
  subcategories?: Record<string, number>;
}

export interface TimePattern {
  hour: number;
  activityScore: number;
  preferredTypes: ContentType[];
  avgDuration: number;
}

export interface DevicePattern {
  deviceId: string;
  platform: 'web' | 'mobile' | 'app';
  usageRatio: number;
  lastUsed: string;
  preferredCategories: string[];
}

export interface UserPersona {
  id: string;
  userId: string;
  
  interests: InterestTag[];
  creatorPreferences: CreatorPreference[];
  categoryPreferences: CategoryPreference[];
  
  behaviorProfile: {
    totalBehaviors: number;
    avgSessionDuration: number;
    avgBehaviorsPerSession: number;
    activeDays: number;
    lastActiveDate: string;
    engagementScore: number;
    loyaltyScore: number;
    explorationScore: number;
  };
  
  timePatterns: TimePattern[];
  devicePatterns: DevicePattern[];
  
  contentPreferences: {
    preferredTypes: ContentType[];
    typeDistribution: Record<ContentType, number>;
    avgContentQuality: number;
    noveltyPreference: number;
    diversityPreference: number;
  };
  
  socialProfile: {
    followingCount: number;
    followerCount: number;
    interactionRate: number;
    shareRate: number;
    commentRate: number;
  };
  
  demographics?: {
    ageGroup?: string;
    gender?: string;
    location?: string;
    language?: string;
  };
  
  createdAt: string;
  updatedAt: string;
  version: number;
}

export interface UserPersonaUpdate {
  interests?: InterestTag[];
  creatorPreferences?: CreatorPreference[];
  categoryPreferences?: CategoryPreference[];
  behaviorProfile?: Partial<UserPersona['behaviorProfile']>;
  timePatterns?: TimePattern[];
  devicePatterns?: DevicePattern[];
  contentPreferences?: Partial<UserPersona['contentPreferences']>;
  socialProfile?: Partial<UserPersona['socialProfile']>;
  demographics?: Partial<UserPersona['demographics']>;
}

export interface BehaviorAnalysisResult {
  userId: string;
  analysisDate: string;
  
  topInterests: Array<{
    tag: string;
    score: number;
    trend: 'rising' | 'stable' | 'declining';
  }>;
  
  topCreators: Array<{
    creatorId: string;
    creatorName: string;
    affinityScore: number;
  }>;
  
  topCategories: Array<{
    category: string;
    score: number;
    engagement: number;
  }>;
  
  behaviorTrends: {
    dailyActive: boolean;
    weeklyPattern: number[];
    peakHours: number[];
    sessionTrend: 'increasing' | 'stable' | 'decreasing';
  };
  
  recommendations: {
    suggestedCategories: string[];
    suggestedCreators: string[];
    suggestedTags: string[];
    coldStartComplete: boolean;
  };
  
  insights: string[];
}

export interface BehaviorAggregation {
  userId: string;
  period: 'daily' | 'weekly' | 'monthly';
  startDate: string;
  endDate: string;
  
  totalBehaviors: number;
  uniqueContents: number;
  uniqueCreators: number;
  
  behaviorDistribution: Record<BehaviorType, number>;
  contentTypeDistribution: Record<ContentType, number>;
  
  topTags: Array<{ tag: string; count: number }>;
  topCategories: Array<{ category: string; count: number }>;
  topCreators: Array<{ creatorId: string; count: number }>;
  
  avgSessionDuration: number;
  totalSessions: number;
  avgBehaviorsPerSession: number;
}
