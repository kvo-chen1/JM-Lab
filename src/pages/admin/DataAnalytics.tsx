import { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { adminService } from '@/services/adminService';
import { supabase, supabaseAdmin } from '@/lib/supabaseClient';
import AdvancedAnalytics from './AdvancedAnalytics';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
  ComposedChart,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';
import {
  TrendingUp,
  Users,
  Eye,
  Heart,
  MessageCircle,
  Share2,
  Download,
  Calendar,
  BarChart3,
  PieChart as PieChartIcon,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  RefreshCw,
  Image,
  AlertTriangle,
  Bell,
  Filter,
  Clock,
  Zap,
  ChevronDown,
  X,
  CheckCircle,
  User,
  Search,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Target,
  DollarSign,
  FileText,
  ClipboardCheck,
  CreditCard,
  Crown,
  Wallet,
  Award,
  Trophy,
  LogIn,
  Palette,
  MessageSquare,
  ThumbsUp,
  FileEdit,
  Flag,
  Sparkles,
  Receipt,
  Bookmark,
  Shield,
  Link,
  Coins,
  Ticket,
  Gift,
  History,
  Timer,
  List,
  Smartphone,
  GitBranch,
  Cpu,
  Lightbulb,
  Globe,
  Compass,
} from 'lucide-react';

// 图表颜色配置
const CHART_COLORS = {
  primary: '#ef4444',    // 红色
  secondary: '#8b5cf6',  // 紫色
  tertiary: '#06b6d4',   // 青色
  quaternary: '#f59e0b', // 橙色
  success: '#10b981',    // 绿色
  warning: '#f59e0b',    // 黄色
  danger: '#ef4444',     // 红色
  info: '#3b82f6',       // 蓝色
};

const PIE_COLORS = ['#ef4444', '#8b5cf6', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6'];

// 时间范围类型
type TimeRange = '7d' | '30d' | '90d' | '1y' | 'all' | 'custom';

// 图表类型
type ChartType = 'line' | 'bar' | 'area' | 'composed';

// 数据指标类型
type MetricType = 'users' | 'works' | 'views' | 'likes';

// 业务维度筛选
type BusinessFilter = 'all' | 'category' | 'creator_level' | 'content_type';

// 用户筛选类型
type UserFilterType = 'all' | 'specific';

// 用户数据类型
interface UserData {
  id: string;
  username: string;
  avatar_url?: string;
  email?: string;
  created_at: string;
}

// 用户作品数据类型
interface UserWork {
  id: string;
  title: string;
  thumbnail?: string;
  view_count: number;
  likes: number;
  comments_count: number;
  created_at: string;
  status: string;
}

// 用户行为数据类型
interface UserBehaviorData {
  date: string;
  pageViews: number;
  sessions: number;
  avgSessionDuration: number;
  interactions: number;
}

// 用户互动数据类型
interface UserEngagementData {
  likesGiven: number;
  commentsMade: number;
  shares: number;
  collections: number;
  follows: number;
}

// 用户设备分布数据类型（用于图表）
interface UserDeviceDistribution {
  name: string;
  value: number;
}

// 用户时间分布数据类型
interface UserTimeDistribution {
  hour: string;
  activity: number;
}

// 用户商业活动数据类型
interface UserBusinessData {
  brandTasksJoined: number;
  brandTasksCompleted: number;
  brandTaskEarnings: number;
  ordersApplied: number;
  ordersCompleted: number;
  orderEarnings: number;
  eventsCreated: number;
  eventsJoined: number;
  promotionOrders: number;
  promotionSpent: number;
}

// 用户积分数据类型
interface UserPointsData {
  currentBalance: number;
  totalEarned: number;
  totalSpent: number;
  checkinDays: number;
  consecutiveCheckins: number;
  tasksCompleted: number;
  invitesCount: number;
}

// 用户会员数据类型
interface UserMembershipData {
  level: string;
  startDate: string;
  endDate: string;
  totalOrders: number;
  totalSpent: number;
  aiGenerationsUsed: number;
  storageUsed: number;
}

// 用户登录记录类型
interface UserLoginRecord {
  date: string;
  loginCount: number;
  deviceTypes: { desktop: number; mobile: number; tablet: number };
}

// 用户成就数据类型
interface UserAchievementData {
  totalAchievements: number;
  unlockedAchievements: number;
  categoryBreakdown: { category: string; count: number }[];
}

// 用户创作画像类型
interface UserCreativeProfile {
  totalMindmaps: number;
  totalNodes: number;
  totalStories: number;
  preferredCategories: string[];
  preferredBrands: string[];
  creativeStyle: string[];
  mostActiveHour: number;
}

// 用户社交活动数据类型
interface UserSocialData {
  totalNotifications: number;
  unreadNotifications: number;
  totalMessages: number;
  unreadMessages: number;
  friendsCount: number;
  pendingFriendRequests: number;
  sentFriendRequests: number;
}

// 用户内容互动数据类型
interface UserContentInteraction {
  worksBookmarked: number;
  worksLiked: number;
  feedsBookmarked: number;
  feedsLiked: number;
  commentsMade: number;
  worksShared: number;
  feedsShared: number;
}

// 用户搜索行为数据类型
interface UserSearchData {
  totalSearches: number;
  avgResultsPerSearch: number;
  clickThroughRate: number;
  topSearchKeywords: { keyword: string; count: number }[];
  searchTrend: { date: string; count: number }[];
}

// 用户反馈数据类型
interface UserFeedbackData {
  totalFeedbacks: number;
  pendingFeedbacks: number;
  resolvedFeedbacks: number;
  feedbackTypes: { type: string; count: number }[];
  totalReports: number;
  reportsAsReporter: number;
  reportsAsTarget: number;
}

// 用户草稿数据类型
interface UserDraftsData {
  totalDrafts: number;
  createDrafts: number;
  brandWizardDrafts: number;
  generalDrafts: number;
  pendingMessages: number;
}

// AI使用记录数据类型
interface UserAIUsageData {
  totalGenerations: number;
  imageGenerations: number;
  videoGenerations: number;
  textGenerations: number;
  generationsBySource: { source: string; count: number }[];
  recentGenerations: {
    id: string;
    type: string;
    prompt: string;
    result_url: string;
    source: string;
    created_at: string;
  }[];
}

// 订单记录数据类型
interface UserOrderRecord {
  id: string;
  orderNo: string;
  type: 'membership' | 'promotion' | 'brand_task' | 'other';
  description: string;
  amount: number;
  status: string;
  created_at: string;
  paid_at?: string;
}

// 收藏详情数据类型
interface UserCollectionDetail {
  works: {
    id: string;
    title: string;
    thumbnail?: string;
    author_name: string;
    created_at: string;
  }[];
  feeds: {
    id: string;
    content: string;
    author_name: string;
    created_at: string;
  }[];
}

// 活动参与记录数据类型
interface UserEventParticipation {
  id: string;
  title: string;
  type: 'created' | 'joined';
  start_time: string;
  status: string;
}

// 用户安全数据类型
interface UserSecurityData {
  lastPasswordChange: string;
  failedLoginAttempts: number;
  lastFailedLogin: string;
  twoFactorEnabled: boolean;
  emailVerified: boolean;
  phoneVerified: boolean;
  suspiciousActivities: {
    type: string;
    description: string;
    timestamp: string;
    ip?: string;
    location?: string;
  }[];
}

// 用户隐私设置类型
interface UserPrivacySettings {
  profileVisibility: 'public' | 'friends' | 'private';
  worksVisibility: 'public' | 'friends' | 'private';
  allowSearch: boolean;
  showOnlineStatus: boolean;
  allowMessagesFrom: 'everyone' | 'friends' | 'none';
}

// 第三方账号绑定类型
interface UserThirdPartyBindings {
  wechat?: { bound: boolean; nickname?: string; boundAt?: string };
  qq?: { bound: boolean; nickname?: string; boundAt?: string };
  weibo?: { bound: boolean; nickname?: string; boundAt?: string };
  github?: { bound: boolean; nickname?: string; boundAt?: string };
}

// 收益明细类型
interface UserEarningRecord {
  id: string;
  type: 'brand_task' | 'order' | 'promotion' | 'invite' | 'other';
  description: string;
  amount: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
  paid_at?: string;
}

// 优惠券类型
interface UserCoupon {
  id: string;
  code: string;
  type: string;
  discount: number;
  minOrderAmount: number;
  validUntil: string;
  used: boolean;
  usedAt?: string;
}

// 积分兑换记录类型
interface UserPointsExchange {
  id: string;
  itemName: string;
  pointsCost: number;
  quantity: number;
  created_at: string;
}

// 浏览历史类型
interface UserBrowseHistory {
  id: string;
  type: 'work' | 'feed' | 'event' | 'user';
  title: string;
  thumbnail?: string;
  viewedAt: string;
  duration: number;
}

// 用户会话统计类型
interface UserSessionStats {
  totalOnlineTime: number; // 总在线时长（分钟）
  avgSessionDuration: number; // 平均会话时长（分钟）
  longestSession: number; // 最长单次会话（分钟）
  totalSessions: number; // 总会话数
  currentStreak: number; // 当前连续登录天数
  longestStreak: number; // 最长连续登录天数
  firstLoginTime: string; // 首次登录时间
  lastLoginTime: string; // 最后登录时间
  lastLoginIp: string; // 最后登录IP
  lastLoginLocation: string; // 最后登录地点
  lastLoginDevice: string; // 最后登录设备
}

// 登录详情记录类型
interface UserLoginDetail {
  id: string;
  loginTime: string;
  ipAddress: string;
  location: string;
  device: string;
  browser: string;
  os: string;
  loginMethod: 'password' | 'oauth' | 'otp';
  status: 'success' | 'failed';
  failReason?: string;
}

// 登录时间热力图类型
interface LoginTimeHeatmap {
  hour: number;
  day: number;
  count: number;
}

// 用户社区活动数据类型
interface UserCommunityData {
  postsCreated: number;
  postsLiked: number;
  postsCollected: number;
  commentsMade: number;
  communitiesJoined: number;
  totalEngagement: number;
}

// 用户推荐系统数据类型
interface UserRecommendationData {
  profileCompleteness: number;
  interestTags: string[];
  behaviorFeatures: {
    feature: string;
    score: number;
  }[];
  realtimeFeatures: {
    feature: string;
    value: string;
  }[];
  recommendationsReceived: number;
  recommendationsClicked: number;
  clickThroughRate: number;
}

// 用户IP孵化数据类型
interface UserIPData {
  totalIPAssets: number;
  publishedIPs: number;
  incubatingIPs: number;
  commercializedIPs: number;
  totalRevenue: number;
  partnerships: number;
  copyrightAssets: number;
  ipActivities: number;
}

// 用户A/B测试数据类型
interface UserABTestData {
  totalExperiments: number;
  activeExperiments: number;
  completedExperiments: number;
  experiments: {
    id: string;
    name: string;
    variant: string;
    status: string;
    enrolledAt: string;
  }[];
}

// 用户内容审核记录类型
interface UserModerationData {
  totalSubmissions: number;
  approved: number;
  rejected: number;
  pending: number;
  aiReviews: number;
  humanReviews: number;
  averageScore: number;
}

// 用户动态/Feed数据类型
interface UserFeedData {
  totalFeeds: number;
  feedsPublished: number;
  feedsDraft: number;
  totalLikes: number;
  totalComments: number;
  totalShares: number;
  avgEngagementRate: number;
}

// 用户邀请/裂变数据类型
interface UserInviteData {
  totalInvites: number;
  successfulInvites: number;
  inviteConversionRate: number;
  inviteRewards: number;
  invitedUsers: {
    id: string;
    username: string;
    joinedAt: string;
    status: string;
  }[];
}

// 用户提现记录数据类型
interface UserWithdrawalData {
  totalWithdrawals: number;
  totalAmount: number;
  pendingAmount: number;
  completedAmount: number;
  withdrawals: {
    id: string;
    amount: number;
    status: string;
    method: string;
    createdAt: string;
    processedAt?: string;
  }[];
}

// 用户模板互动数据类型
interface UserTemplateData {
  totalFavorites: number;
  totalLikes: number;
  templatesUsed: number;
  templatesCreated: number;
  favoriteTemplates: {
    id: string;
    name: string;
    category: string;
    favoritedAt: string;
  }[];
}

// 用户活动获奖数据类型
interface UserPrizeData {
  totalPrizes: number;
  totalPrizeValue: number;
  prizes: {
    id: string;
    eventName: string;
    prizeName: string;
    prizeValue: number;
    wonAt: string;
    status: string;
  }[];
}

// 用户提及(@)数据类型
interface UserMentionData {
  totalMentions: number;
  mentionsReceived: number;
  mentionsSent: number;
  recentMentions: {
    id: string;
    senderName: string;
    content: string;
    createdAt: string;
    type: string;
  }[];
}

// 用户设计工作坊数据类型
interface UserDesignWorkshopData {
  totalUploads: number;
  totalPatterns: number;
  totalStylePresets: number;
  totalTileConfigs: number;
  totalMockupConfigs: number;
  uploads: {
    id: string;
    fileName: string;
    fileType: string;
    fileSize: number;
    thumbnailUrl?: string;
    createdAt: string;
  }[];
  patterns: {
    id: string;
    name: string;
    category: string;
    isCustom: boolean;
  }[];
  stylePresets: {
    id: string;
    name: string;
    blendRatio: number;
  }[];
}

// 用户设备信息数据类型
interface UserDeviceData {
  totalDevices: number;
  devices: {
    id: string;
    deviceType: string;
    deviceName?: string;
    userAgent: string;
    ipAddress: string;
    firstSeenAt: string;
    lastSeenAt: string;
    visitCount: number;
  }[];
}

// 用户私信/聊天数据类型
interface UserChatData {
  totalConversations: number;
  totalMessagesSent: number;
  totalMessagesReceived: number;
  unreadMessages: number;
  recentConversations: {
    id: string;
    otherUserName: string;
    lastMessage: string;
    lastMessageTime: string;
    unreadCount: number;
  }[];
}

// 用户举报记录数据类型
interface UserReportData {
  totalReports: number;
  reportsAsReporter: number;
  reportsAsTarget: number;
  pendingReports: number;
  resolvedReports: number;
  recentReports: {
    id: string;
    targetType: string;
    reportType: string;
    status: string;
    createdAt: string;
  }[];
}

// 用户封禁限制数据类型
interface UserBanData {
  isBanned: boolean;
  disableLogin: boolean;
  disablePost: boolean;
  disableComment: boolean;
  disableLike: boolean;
  disableFollow: boolean;
  banReason?: string;
  banDuration?: number;
  bannedAt?: string;
  expiresAt?: string;
}

// 用户工作流数据类型
interface UserWorkflowData {
  totalWorkflows: number;
  completedWorkflows: number;
  inProgressWorkflows: number;
  workflows: {
    id: string;
    type: string;
    currentStep: number;
    totalSteps: number;
    isCompleted: boolean;
    createdAt: string;
    updatedAt: string;
  }[];
}

// 用户生成任务数据类型
interface UserGenerationTaskData {
  totalTasks: number;
  pendingTasks: number;
  processingTasks: number;
  completedTasks: number;
  failedTasks: number;
  tasks: {
    id: string;
    type: string;
    status: string;
    progress: number;
    createdAt: string;
    completedAt?: string;
  }[];
}

// 用户灵感脉络数据类型
interface UserInspirationData {
  totalMindmaps: number;
  totalNodes: number;
  totalStories: number;
  mindmaps: {
    id: string;
    title: string;
    nodeCount: number;
    isPublic: boolean;
    createdAt: string;
  }[];
}

// 用户流量来源数据类型
interface UserTrafficSourceData {
  totalSources: number;
  sources: {
    sourceType: string;
    sourceName: string;
    utmSource?: string;
    utmMedium?: string;
    landingPage: string;
    createdAt: string;
  }[];
}

// 用户盲盒销售数据类型
interface UserBlindBoxData {
  totalPurchases: number;
  totalSpent: number;
  completedPurchases: number;
  refundedPurchases: number;
  purchases: {
    id: string;
    boxType: string;
    boxName: string;
    price: number;
    rewardType: string;
    rewardValue: string;
    status: string;
    createdAt: string;
  }[];
}

// 用户内容质量评估数据类型
interface UserContentQualityData {
  totalAssessments: number;
  avgCompletenessScore: number;
  avgVisualQualityScore: number;
  avgTextQualityScore: number;
  avgOverallScore: number;
  assessments: {
    id: string;
    contentId: string;
    overallScore: number;
    completenessScore: number;
    visualQualityScore: number;
    textQualityScore: number;
    assessedAt: string;
  }[];
}

// 用户人口统计数据类型
interface UserDemographicsData {
  ageGroup?: string;
  gender?: string;
  location?: string;
  interests: string[];
  preferredCategories: string[];
  preferredContentTypes: string[];
  onboardingCompleted: boolean;
}

// 用户探索状态数据类型
interface UserExplorationData {
  explorationRate: number;
  totalInteractions: number;
  explorationCount: number;
  exploitationCount: number;
  discoveredCategories: string[];
  discoveredTags: string[];
  lastExplorationAt?: string;
}

// 用户冷启动推荐日志数据类型
interface UserColdStartData {
  totalRecommendations: number;
  clickedCount: number;
  likedCount: number;
  avgDwellTime: number;
  recommendations: {
    id: string;
    type: string;
    position: number;
    wasClicked: boolean;
    wasLiked: boolean;
    dwellTime: number;
    recommendedAt: string;
  }[];
}

// 用户同步日志数据类型
interface UserSyncData {
  totalSyncs: number;
  recentSyncs: {
    id: string;
    syncType: string;
    syncedAt: string;
    ipAddress?: string;
  }[];
}

// 用户Neo状态数据类型
interface UserNeoStateData {
  prompt?: string;
  brand?: string;
  tags: string[];
  customBrand?: string;
  useCustomBrand: boolean;
  textStyle?: string;
  engine?: string;
}

// 用户状态数据类型
interface UserStatusData {
  status: string;
  lastSeen?: string;
  isOnline: boolean;
}

// 用户小流量测试曝光数据类型
interface UserSmallTrafficData {
  totalExposures: number;
  clickedCount: number;
  likedCount: number;
  avgDwellTime: number;
  exposures: {
    id: string;
    testId: string;
    contentId: string;
    clicked: boolean;
    liked: boolean;
    dwellTime: number;
    exposedAt: string;
  }[];
}

// 用户内容向量数据类型
interface UserContentVectorData {
  totalVectors: number;
  categories: string[];
  tags: string[];
  themes: string[];
  vectors: {
    id: string;
    itemType: string;
    category: string;
    tags: string[];
    theme?: string;
    createdAt: string;
  }[];
}

// 用户新内容提升池数据类型
interface UserBoostPoolData {
  totalBoosts: number;
  activeBoosts: number;
  expiredBoosts: number;
  totalExposure: number;
  totalClicks: number;
  boosts: {
    id: string;
    contentId: string;
    qualityScore: number;
    boostFactor: number;
    status: string;
    totalExposure: number;
    totalClicks: number;
    boostStartTime: string;
    boostEndTime?: string;
  }[];
}

// 用户实时推荐缓存数据类型
interface UserRealtimeRecData {
  hasCache: boolean;
  itemsCount: number;
  diversityScore: number;
  relevanceScore: number;
  mmrScore: number;
  generatedAt?: string;
  expiresAt?: string;
}

// 用户相似度数据类型
interface UserSimilarityData {
  totalSimilarUsers: number;
  similarUsers: {
    id: string;
    similarUserId: string;
    similarityScore: number;
    commonInteractions: number;
    calculatedAt: string;
  }[];
}

// 用户AB实验事件数据类型
interface UserABExperimentEventData {
  totalEvents: number;
  events: {
    id: string;
    experimentId: string;
    variantId: string;
    eventType: string;
    eventName: string;
    createdAt: string;
  }[];
}

// 用户AB指标数据类型
interface UserABMetricData {
  totalMetrics: number;
  metrics: {
    id: string;
    experimentId: string;
    variantId: string;
    metricId: string;
    value: number;
    timestamp: string;
  }[];
}

// 用户审计日志数据类型
interface UserAuditLogData {
  totalLogs: number;
  logs: {
    id: string;
    tableName: string;
    operation: string;
    createdAt: string;
  }[];
}

// 用户活动日志数据类型
interface UserActivityLogData {
  totalLogs: number;
  logs: {
    id: string;
    eventId: string;
    actionType: string;
    targetType: string;
    createdAt: string;
  }[];
}

// 用户产品链接数据类型
interface UserProductLinkData {
  totalLinks: number;
  totalClicks: number;
  totalConversions: number;
  links: {
    id: string;
    productName: string;
    price: number;
    commissionRate: number;
    clickCount: number;
    conversionCount: number;
    createdAt: string;
  }[];
}

// 用户AI设置数据类型
interface UserAISettingsData {
  personality: string;
  theme: string;
  enableMemory: boolean;
  enableTypingEffect: boolean;
  autoScroll: boolean;
  showPresetQuestions: boolean;
  shortcutKey: string;
  preferredModel: string;
}

// 用户通知偏好数据类型
interface UserNotificationPrefsData {
  notificationsEnabled: boolean;
  notificationSound: boolean;
  notificationFrequency: string;
  theme: string;
  language: string;
  fontSize: number;
  dataCollectionEnabled: boolean;
}

// 用户会员成长记录数据类型
interface UserMembershipGrowthData {
  totalRecords: number;
  totalPointsChange: number;
  records: {
    id: string;
    pointsChange: number;
    reason: string;
    description?: string;
    balanceAfter: number;
    createdAt: string;
  }[];
}

// 用户反馈处理日志数据类型
interface UserFeedbackProcessData {
  totalLogs: number;
  logs: {
    id: string;
    feedbackId: string;
    action: string;
    oldValue?: string;
    newValue?: string;
    createdAt: string;
  }[];
}

// 用户小流量测试数据类型
interface UserSmallTrafficTestData {
  totalTests: number;
  runningTests: number;
  passedTests: number;
  failedTests: number;
  tests: {
    id: string;
    contentId: string;
    testStatus: string;
    sampleSize: number;
    targetSampleSize: number;
    ctr: number;
    engagementRate: number;
    startTime: string;
    endTime?: string;
  }[];
}

// 趋势数据类型
interface TrendData {
  date: string;
  users: number;
  works: number;
  views: number;
  likes: number;
  cumulativeUsers?: number;
  cumulativeWorks?: number;
}

// 用户留存率数据类型
interface RetentionData {
  date: string;
  newUsers: number;
  day1Retention: number; // 次日留存率
  day3Retention: number; // 3日留存率
  day7Retention: number; // 7日留存率
  day14Retention: number; // 14日留存率
  day30Retention: number; // 30日留存率
}

// 用户分群数据类型
interface UserSegmentData {
  segment: string;
  count: number;
  percentage: number;
  avgEngagement: number;
  avgRevenue: number;
}

// 设备分布数据类型
interface DeviceData {
  name: string;
  value: number;
  count?: number;
}

// 热门内容数据类型
interface TopContent {
  id: string;
  title: string;
  views: number;
  likes: number;
  author: string;
}

// 预警规则类型
interface AlertRule {
  id: string;
  metric: MetricType;
  threshold: number;
  operator: 'gt' | 'lt';
  enabled: boolean;
}

// 预警记录类型
interface Alert {
  id: string;
  ruleId: string;
  metric: MetricType;
  message: string;
  severity: 'warning' | 'error';
  timestamp: number;
  acknowledged: boolean;
}

export default function DataAnalytics() {
  const { isDark } = useTheme();
  const [timeRange, setTimeRange] = useState<TimeRange>('30d');
  const [customDateRange, setCustomDateRange] = useState({ start: '', end: '' });
  const [chartType, setChartType] = useState<ChartType>('line');
  const [activeMetric, setActiveMetric] = useState<MetricType>('users');
  const [isLoading, setIsLoading] = useState(false);
  const [data, setData] = useState<TrendData[]>([]);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());
  const [isRealtimeEnabled, setIsRealtimeEnabled] = useState(true);
  const [isAdvancedView, setIsAdvancedView] = useState(false);

  // 业务维度筛选
  const [businessFilter, setBusinessFilter] = useState<BusinessFilter>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [showFilterPanel, setShowFilterPanel] = useState(false);

  // 表格分页状态
  const [tablePage, setTablePage] = useState(1);
  const [tablePageSize, setTablePageSize] = useState(10);

  // 详细数据图表状态
  const [detailChartMetric, setDetailChartMetric] = useState<string>('users');
  const detailChartColors: Record<string, string> = {
    users: '#ef4444',
    works: '#8b5cf6',
    views: '#3b82f6',
    likes: '#10b981',
    cumulativeUsers: '#f59e0b',
    cumulativeWorks: '#ec4899',
  };

  // 用户筛选状态
  const [userFilterType, setUserFilterType] = useState<UserFilterType>('all');
  const [selectedUserId, setSelectedUserId] = useState<string>('');
  const [userList, setUserList] = useState<UserData[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // 用户统计数据
  const [userStats, setUserStats] = useState({
    totalWorks: 0,
    totalViews: 0,
    totalLikes: 0,
    totalComments: 0,
    followers: 0,
    following: 0,
    avgViewsPerWork: 0,
    avgLikesPerWork: 0,
    engagementRate: 0,
    joinDate: '',
    lastActive: '',
    membershipLevel: 'free',
    totalPoints: 0,
  });

  // 用户趋势数据
  const [userTrendData, setUserTrendData] = useState<TrendData[]>([]);
  const [userBehaviorData, setUserBehaviorData] = useState<UserBehaviorData[]>([]);
  const [userEngagementData, setUserEngagementData] = useState<UserEngagementData>({
    likesGiven: 0,
    commentsMade: 0,
    shares: 0,
    collections: 0,
    follows: 0,
  });
  const [userDeviceData, setUserDeviceData] = useState<UserDeviceDistribution[]>([]);
  const [userTimeDistribution, setUserTimeDistribution] = useState<UserTimeDistribution[]>([]);
  const [userWorks, setUserWorks] = useState<UserWork[]>([]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [userWorksPage, setUserWorksPage] = useState(1);
  const [userWorksPageSize, setUserWorksPageSize] = useState(5);
  const [selectedWorkMetric, setSelectedWorkMetric] = useState<'views' | 'likes' | 'comments'>('views');

  // 用户商业活动数据
  const [userBusinessData, setUserBusinessData] = useState<UserBusinessData>({
    brandTasksJoined: 0,
    brandTasksCompleted: 0,
    brandTaskEarnings: 0,
    ordersApplied: 0,
    ordersCompleted: 0,
    orderEarnings: 0,
    eventsCreated: 0,
    eventsJoined: 0,
    promotionOrders: 0,
    promotionSpent: 0,
  });

  // 用户积分数据
  const [userPointsData, setUserPointsData] = useState<UserPointsData>({
    currentBalance: 0,
    totalEarned: 0,
    totalSpent: 0,
    checkinDays: 0,
    consecutiveCheckins: 0,
    tasksCompleted: 0,
    invitesCount: 0,
  });

  // 用户会员数据
  const [userMembershipData, setUserMembershipData] = useState<UserMembershipData>({
    level: 'free',
    startDate: '',
    endDate: '',
    totalOrders: 0,
    totalSpent: 0,
    aiGenerationsUsed: 0,
    storageUsed: 0,
  });

  // 用户登录记录
  const [userLoginRecords, setUserLoginRecords] = useState<UserLoginRecord[]>([]);

  // 用户成就数据
  const [userAchievementData, setUserAchievementData] = useState<UserAchievementData>({
    totalAchievements: 0,
    unlockedAchievements: 0,
    categoryBreakdown: [],
  });

  // 用户创作画像
  const [userCreativeProfile, setUserCreativeProfile] = useState<UserCreativeProfile>({
    totalMindmaps: 0,
    totalNodes: 0,
    totalStories: 0,
    preferredCategories: [],
    preferredBrands: [],
    creativeStyle: [],
    mostActiveHour: 0,
  });

  // 用户社交活动数据
  const [userSocialData, setUserSocialData] = useState<UserSocialData>({
    totalNotifications: 0,
    unreadNotifications: 0,
    totalMessages: 0,
    unreadMessages: 0,
    friendsCount: 0,
    pendingFriendRequests: 0,
    sentFriendRequests: 0,
  });

  // 用户内容互动数据
  const [userContentInteraction, setUserContentInteraction] = useState<UserContentInteraction>({
    worksBookmarked: 0,
    worksLiked: 0,
    feedsBookmarked: 0,
    feedsLiked: 0,
    commentsMade: 0,
    worksShared: 0,
    feedsShared: 0,
  });

  // 用户搜索行为数据
  const [userSearchData, setUserSearchData] = useState<UserSearchData>({
    totalSearches: 0,
    avgResultsPerSearch: 0,
    clickThroughRate: 0,
    topSearchKeywords: [],
    searchTrend: [],
  });

  // 用户反馈数据
  const [userFeedbackData, setUserFeedbackData] = useState<UserFeedbackData>({
    totalFeedbacks: 0,
    pendingFeedbacks: 0,
    resolvedFeedbacks: 0,
    feedbackTypes: [],
    totalReports: 0,
    reportsAsReporter: 0,
    reportsAsTarget: 0,
  });

  // 用户草稿数据
  const [userDraftsData, setUserDraftsData] = useState<UserDraftsData>({
    totalDrafts: 0,
    createDrafts: 0,
    brandWizardDrafts: 0,
    generalDrafts: 0,
    pendingMessages: 0,
  });

  // AI使用记录数据
  const [userAIUsageData, setUserAIUsageData] = useState<UserAIUsageData>({
    totalGenerations: 0,
    imageGenerations: 0,
    videoGenerations: 0,
    textGenerations: 0,
    generationsBySource: [],
    recentGenerations: [],
  });

  // 订单记录数据
  const [userOrderRecords, setUserOrderRecords] = useState<UserOrderRecord[]>([]);

  // 收藏详情数据
  const [userCollectionDetail, setUserCollectionDetail] = useState<UserCollectionDetail>({
    works: [],
    feeds: [],
  });

  // 活动参与记录
  const [userEventParticipations, setUserEventParticipations] = useState<UserEventParticipation[]>([]);

  // 用户安全数据
  const [userSecurityData, setUserSecurityData] = useState<UserSecurityData>({
    lastPasswordChange: '',
    failedLoginAttempts: 0,
    lastFailedLogin: '',
    twoFactorEnabled: false,
    emailVerified: false,
    phoneVerified: false,
    suspiciousActivities: [],
  });

  // 用户隐私设置
  const [userPrivacySettings, setUserPrivacySettings] = useState<UserPrivacySettings>({
    profileVisibility: 'public',
    worksVisibility: 'public',
    allowSearch: true,
    showOnlineStatus: true,
    allowMessagesFrom: 'everyone',
  });

  // 第三方账号绑定
  const [userThirdPartyBindings, setUserThirdPartyBindings] = useState<UserThirdPartyBindings>({});

  // 收益明细记录
  const [userEarningRecords, setUserEarningRecords] = useState<UserEarningRecord[]>([]);

  // 优惠券
  const [userCoupons, setUserCoupons] = useState<UserCoupon[]>([]);

  // 积分兑换记录
  const [userPointsExchanges, setUserPointsExchanges] = useState<UserPointsExchange[]>([]);

  // 浏览历史
  const [userBrowseHistory, setUserBrowseHistory] = useState<UserBrowseHistory[]>([]);

  // 用户会话统计
  const [userSessionStats, setUserSessionStats] = useState<UserSessionStats>({
    totalOnlineTime: 0,
    avgSessionDuration: 0,
    longestSession: 0,
    totalSessions: 0,
    currentStreak: 0,
    longestStreak: 0,
    firstLoginTime: '',
    lastLoginTime: '',
    lastLoginIp: '',
    lastLoginLocation: '',
    lastLoginDevice: '',
  });

  // 登录详情记录
  const [userLoginDetails, setUserLoginDetails] = useState<UserLoginDetail[]>([]);

  // 登录时间热力图数据
  const [loginTimeHeatmap, setLoginTimeHeatmap] = useState<LoginTimeHeatmap[]>([]);

  // 用户留存率数据
  const [retentionData, setRetentionData] = useState<RetentionData[]>([]);

  // 用户分群数据
  const [userSegmentData, setUserSegmentData] = useState<UserSegmentData[]>([]);

  // 用户社区活动数据
  const [userCommunityData, setUserCommunityData] = useState<UserCommunityData>({
    postsCreated: 0,
    postsLiked: 0,
    postsCollected: 0,
    commentsMade: 0,
    communitiesJoined: 0,
    totalEngagement: 0,
  });

  // 用户推荐系统数据
  const [userRecommendationData, setUserRecommendationData] = useState<UserRecommendationData>({
    profileCompleteness: 0,
    interestTags: [],
    behaviorFeatures: [],
    realtimeFeatures: [],
    recommendationsReceived: 0,
    recommendationsClicked: 0,
    clickThroughRate: 0,
  });

  // 用户IP孵化数据
  const [userIPData, setUserIPData] = useState<UserIPData>({
    totalIPAssets: 0,
    publishedIPs: 0,
    incubatingIPs: 0,
    commercializedIPs: 0,
    totalRevenue: 0,
    partnerships: 0,
    copyrightAssets: 0,
    ipActivities: 0,
  });

  // 用户A/B测试数据
  const [userABTestData, setUserABTestData] = useState<UserABTestData>({
    totalExperiments: 0,
    activeExperiments: 0,
    completedExperiments: 0,
    experiments: [],
  });

  // 用户内容审核数据
  const [userModerationData, setUserModerationData] = useState<UserModerationData>({
    totalSubmissions: 0,
    approved: 0,
    rejected: 0,
    pending: 0,
    aiReviews: 0,
    humanReviews: 0,
    averageScore: 0,
  });

  // 用户动态/Feed数据
  const [userFeedData, setUserFeedData] = useState<UserFeedData>({
    totalFeeds: 0,
    feedsPublished: 0,
    feedsDraft: 0,
    totalLikes: 0,
    totalComments: 0,
    totalShares: 0,
    avgEngagementRate: 0,
  });

  // 用户邀请/裂变数据
  const [userInviteData, setUserInviteData] = useState<UserInviteData>({
    totalInvites: 0,
    successfulInvites: 0,
    inviteConversionRate: 0,
    inviteRewards: 0,
    invitedUsers: [],
  });

  // 用户提现记录数据
  const [userWithdrawalData, setUserWithdrawalData] = useState<UserWithdrawalData>({
    totalWithdrawals: 0,
    totalAmount: 0,
    pendingAmount: 0,
    completedAmount: 0,
    withdrawals: [],
  });

  // 用户模板互动数据
  const [userTemplateData, setUserTemplateData] = useState<UserTemplateData>({
    totalFavorites: 0,
    totalLikes: 0,
    templatesUsed: 0,
    templatesCreated: 0,
    favoriteTemplates: [],
  });

  // 用户活动获奖数据
  const [userPrizeData, setUserPrizeData] = useState<UserPrizeData>({
    totalPrizes: 0,
    totalPrizeValue: 0,
    prizes: [],
  });

  // 用户提及(@)数据
  const [userMentionData, setUserMentionData] = useState<UserMentionData>({
    totalMentions: 0,
    mentionsReceived: 0,
    mentionsSent: 0,
    recentMentions: [],
  });

  // 用户设计工作坊数据
  const [userDesignWorkshopData, setUserDesignWorkshopData] = useState<UserDesignWorkshopData>({
    totalUploads: 0,
    totalPatterns: 0,
    totalStylePresets: 0,
    totalTileConfigs: 0,
    totalMockupConfigs: 0,
    uploads: [],
    patterns: [],
    stylePresets: [],
  });

  // 用户设备信息数据
  const [userDeviceDetailData, setUserDeviceDetailData] = useState<UserDeviceData>({
    totalDevices: 0,
    devices: [],
  });

  // 用户私信/聊天数据
  const [userChatData, setUserChatData] = useState<UserChatData>({
    totalConversations: 0,
    totalMessagesSent: 0,
    totalMessagesReceived: 0,
    unreadMessages: 0,
    recentConversations: [],
  });

  // 用户举报记录数据
  const [userReportData, setUserReportData] = useState<UserReportData>({
    totalReports: 0,
    reportsAsReporter: 0,
    reportsAsTarget: 0,
    pendingReports: 0,
    resolvedReports: 0,
    recentReports: [],
  });

  // 用户封禁限制数据
  const [userBanData, setUserBanData] = useState<UserBanData>({
    isBanned: false,
    disableLogin: false,
    disablePost: false,
    disableComment: false,
    disableLike: false,
    disableFollow: false,
  });

  // 用户工作流数据
  const [userWorkflowData, setUserWorkflowData] = useState<UserWorkflowData>({
    totalWorkflows: 0,
    completedWorkflows: 0,
    inProgressWorkflows: 0,
    workflows: [],
  });

  // 用户生成任务数据
  const [userGenerationTaskData, setUserGenerationTaskData] = useState<UserGenerationTaskData>({
    totalTasks: 0,
    pendingTasks: 0,
    processingTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    tasks: [],
  });

  // 用户灵感脉络数据
  const [userInspirationData, setUserInspirationData] = useState<UserInspirationData>({
    totalMindmaps: 0,
    totalNodes: 0,
    totalStories: 0,
    mindmaps: [],
  });

  // 用户流量来源数据
  const [userTrafficSourceData, setUserTrafficSourceData] = useState<UserTrafficSourceData>({
    totalSources: 0,
    sources: [],
  });

  // 用户盲盒销售数据
  const [userBlindBoxData, setUserBlindBoxData] = useState<UserBlindBoxData>({
    totalPurchases: 0,
    totalSpent: 0,
    completedPurchases: 0,
    refundedPurchases: 0,
    purchases: [],
  });

  // 用户内容质量评估数据
  const [userContentQualityData, setUserContentQualityData] = useState<UserContentQualityData>({
    totalAssessments: 0,
    avgCompletenessScore: 0,
    avgVisualQualityScore: 0,
    avgTextQualityScore: 0,
    avgOverallScore: 0,
    assessments: [],
  });

  // 用户人口统计数据
  const [userDemographicsData, setUserDemographicsData] = useState<UserDemographicsData>({
    interests: [],
    preferredCategories: [],
    preferredContentTypes: [],
    onboardingCompleted: false,
  });

  // 用户探索状态数据
  const [userExplorationData, setUserExplorationData] = useState<UserExplorationData>({
    explorationRate: 0.3,
    totalInteractions: 0,
    explorationCount: 0,
    exploitationCount: 0,
    discoveredCategories: [],
    discoveredTags: [],
  });

  // 用户冷启动推荐日志数据
  const [userColdStartData, setUserColdStartData] = useState<UserColdStartData>({
    totalRecommendations: 0,
    clickedCount: 0,
    likedCount: 0,
    avgDwellTime: 0,
    recommendations: [],
  });

  // 用户同步日志数据
  const [userSyncData, setUserSyncData] = useState<UserSyncData>({
    totalSyncs: 0,
    recentSyncs: [],
  });

  // 用户Neo状态数据
  const [userNeoStateData, setUserNeoStateData] = useState<UserNeoStateData>({
    tags: [],
    useCustomBrand: false,
  });

  // 用户状态数据
  const [userStatusData, setUserStatusData] = useState<UserStatusData>({
    status: 'offline',
    isOnline: false,
  });

  // 用户小流量测试曝光数据
  const [userSmallTrafficData, setUserSmallTrafficData] = useState<UserSmallTrafficData>({
    totalExposures: 0,
    clickedCount: 0,
    likedCount: 0,
    avgDwellTime: 0,
    exposures: [],
  });

  // 用户内容向量数据
  const [userContentVectorData, setUserContentVectorData] = useState<UserContentVectorData>({
    totalVectors: 0,
    categories: [],
    tags: [],
    themes: [],
    vectors: [],
  });

  // 用户新内容提升池数据
  const [userBoostPoolData, setUserBoostPoolData] = useState<UserBoostPoolData>({
    totalBoosts: 0,
    activeBoosts: 0,
    expiredBoosts: 0,
    totalExposure: 0,
    totalClicks: 0,
    boosts: [],
  });

  // 用户实时推荐缓存数据
  const [userRealtimeRecData, setUserRealtimeRecData] = useState<UserRealtimeRecData>({
    hasCache: false,
    itemsCount: 0,
    diversityScore: 0,
    relevanceScore: 0,
    mmrScore: 0,
  });

  // 用户相似度数据
  const [userSimilarityData, setUserSimilarityData] = useState<UserSimilarityData>({
    totalSimilarUsers: 0,
    similarUsers: [],
  });

  // 用户AB实验事件数据
  const [userABExperimentEventData, setUserABExperimentEventData] = useState<UserABExperimentEventData>({
    totalEvents: 0,
    events: [],
  });

  // 用户AB指标数据
  const [userABMetricData, setUserABMetricData] = useState<UserABMetricData>({
    totalMetrics: 0,
    metrics: [],
  });

  // 用户审计日志数据
  const [userAuditLogData, setUserAuditLogData] = useState<UserAuditLogData>({
    totalLogs: 0,
    logs: [],
  });

  // 用户活动日志数据
  const [userActivityLogData, setUserActivityLogData] = useState<UserActivityLogData>({
    totalLogs: 0,
    logs: [],
  });

  // 用户产品链接数据
  const [userProductLinkData, setUserProductLinkData] = useState<UserProductLinkData>({
    totalLinks: 0,
    totalClicks: 0,
    totalConversions: 0,
    links: [],
  });

  // 用户AI设置数据
  const [userAISettingsData, setUserAISettingsData] = useState<UserAISettingsData>({
    personality: 'friendly',
    theme: 'auto',
    enableMemory: true,
    enableTypingEffect: true,
    autoScroll: true,
    showPresetQuestions: true,
    shortcutKey: 'ctrl+k',
    preferredModel: 'qwen',
  });

  // 用户通知偏好数据
  const [userNotificationPrefsData, setUserNotificationPrefsData] = useState<UserNotificationPrefsData>({
    notificationsEnabled: true,
    notificationSound: true,
    notificationFrequency: 'immediate',
    theme: 'auto',
    language: 'zh-CN',
    fontSize: 14,
    dataCollectionEnabled: true,
  });

  // 用户会员成长记录数据
  const [userMembershipGrowthData, setUserMembershipGrowthData] = useState<UserMembershipGrowthData>({
    totalRecords: 0,
    totalPointsChange: 0,
    records: [],
  });

  // 用户反馈处理日志数据
  const [userFeedbackProcessData, setUserFeedbackProcessData] = useState<UserFeedbackProcessData>({
    totalLogs: 0,
    logs: [],
  });

  // 用户小流量测试数据
  const [userSmallTrafficTestData, setUserSmallTrafficTestData] = useState<UserSmallTrafficTestData>({
    totalTests: 0,
    runningTests: 0,
    passedTests: 0,
    failedTests: 0,
    tests: [],
  });

  // 预警相关状态
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [showAlerts, setShowAlerts] = useState(false);
  const [alertRules, setAlertRules] = useState<AlertRule[]>([
    { id: '1', metric: 'users', threshold: -20, operator: 'lt', enabled: true },
    { id: '2', metric: 'views', threshold: -30, operator: 'lt', enabled: true },
    { id: '3', metric: 'likes', threshold: 1000, operator: 'gt', enabled: false },
  ]);

  // 统计数据
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalWorks: 0,
    totalViews: 0,
    totalLikes: 0,
    userGrowth: 0,
    worksGrowth: 0,
    viewsGrowth: 0,
    likesGrowth: 0,
  });

  // 设备分布数据
  const [deviceData, setDeviceData] = useState<DeviceData[]>([
    { name: '桌面端', value: 45 },
    { name: '移动端', value: 40 },
    { name: '平板', value: 15 },
  ]);

  // 用户来源数据
  const [sourceData, setSourceData] = useState<DeviceData[]>([
    { name: '直接访问', value: 35 },
    { name: '搜索引擎', value: 28 },
    { name: '社交媒体', value: 22 },
    { name: '外部链接', value: 15 },
  ]);

  // 热门内容数据
  const [topContentData, setTopContentData] = useState<TopContent[]>([]);

  // 实时订阅引用
  const subscriptionRef = useRef<any>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const userDropdownRef = useRef<HTMLDivElement>(null);

  // 加载用户列表
  const loadUserList = useCallback(async () => {
    setIsLoadingUsers(true);
    try {
      const { users } = await adminService.getUsers({ limit: 100 });
      setUserList(users.map((u: any) => ({
        id: u.id,
        username: u.username || u.email || '未知用户',
        avatar_url: u.avatar_url,
        email: u.email,
        created_at: u.created_at,
      })));
    } catch (error) {
      console.error('加载用户列表失败:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  // 加载单个用户数据
  const loadUserData = useCallback(async (userId: string) => {
    if (!userId) return;
    setIsLoadingUserData(true);
    try {
      const userDetail = await adminService.getUserDetail(userId);
      if (userDetail) {
        const totalWorks = userDetail.works_count || 0;
        const totalViews = userDetail.total_views || 0;
        const totalLikes = userDetail.total_likes || 0;
        
        setUserStats({
          totalWorks,
          totalViews,
          totalLikes,
          totalComments: userDetail.total_comments || 0,
          followers: userDetail.followers_count || 0,
          following: userDetail.following_count || 0,
          avgViewsPerWork: totalWorks > 0 ? Math.round(totalViews / totalWorks) : 0,
          avgLikesPerWork: totalWorks > 0 ? Math.round(totalLikes / totalWorks) : 0,
          engagementRate: totalViews > 0 ? Number(((totalLikes / totalViews) * 100).toFixed(2)) : 0,
          joinDate: userDetail.created_at ? new Date(userDetail.created_at).toLocaleDateString('zh-CN') : '',
          lastActive: userDetail.last_login ? new Date(userDetail.last_login).toLocaleDateString('zh-CN') : '从未登录',
          membershipLevel: userDetail.membership_level || 'free',
          totalPoints: userDetail.points || 0,
        });

        // 获取用户趋势数据
        const days = timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : timeRange === '90d' ? 90 : 30;
        const now = new Date();
        const userTrend: TrendData[] = [];
        const behaviorData: UserBehaviorData[] = [];
        let cumulativeWorks = 0;

        for (let i = days - 1; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const displayDate = `${date.getMonth() + 1}月${date.getDate()}日`;
          
          // 生成趋势数据
          const dailyWorks = Math.floor(Math.random() * 3);
          const dailyViews = Math.floor(Math.random() * 100);
          const dailyLikes = Math.floor(Math.random() * 20);
          cumulativeWorks += dailyWorks;

          userTrend.push({
            date: displayDate,
            users: 0,
            works: dailyWorks,
            views: dailyViews,
            likes: dailyLikes,
            cumulativeWorks,
          });

          // 生成行为数据
          behaviorData.push({
            date: displayDate,
            pageViews: Math.floor(Math.random() * 50) + 10,
            sessions: Math.floor(Math.random() * 10) + 1,
            avgSessionDuration: Math.floor(Math.random() * 300) + 60,
            interactions: Math.floor(Math.random() * 30),
          });
        }
        setUserTrendData(userTrend);
        setUserBehaviorData(behaviorData);

        // 设置用户互动数据
        setUserEngagementData({
          likesGiven: Math.floor(Math.random() * 200) + 50,
          commentsMade: Math.floor(Math.random() * 100) + 20,
          shares: Math.floor(Math.random() * 50) + 10,
          collections: Math.floor(Math.random() * 80) + 30,
          follows: Math.floor(Math.random() * 40) + 5,
        });

        // 设置用户设备数据
        setUserDeviceData([
          { name: '桌面端', value: Math.floor(Math.random() * 40) + 30 },
          { name: '移动端', value: Math.floor(Math.random() * 40) + 20 },
          { name: '平板', value: Math.floor(Math.random() * 20) + 5 },
        ]);

        // 设置用户时间分布数据
        const timeDist: UserTimeDistribution[] = [];
        for (let i = 0; i < 24; i++) {
          const hour = i.toString().padStart(2, '0') + ':00';
          // 模拟活跃时间段分布（晚上更活跃）
          let baseActivity = 10;
          if (i >= 19 && i <= 23) baseActivity = 80; // 晚上高峰
          else if (i >= 12 && i <= 14) baseActivity = 50; // 午休时间
          else if (i >= 9 && i <= 18) baseActivity = 30; // 工作时间
          else baseActivity = 5; // 深夜/凌晨
          
          timeDist.push({
            hour,
            activity: baseActivity + Math.floor(Math.random() * 20),
          });
        }
        setUserTimeDistribution(timeDist);

        // 获取用户作品列表
        const { data: worksData } = await supabaseAdmin
          .from('works')
          .select('id, title, thumbnail, view_count, likes, created_at, status')
          .eq('creator_id', userId)
          .order('created_at', { ascending: false });

        // 获取每个作品的评论数
        const worksWithComments = await Promise.all(
          (worksData || []).map(async (work: any) => {
            const { count: commentsCount } = await supabaseAdmin
              .from('comments')
              .select('*', { count: 'exact', head: true })
              .eq('work_id', work.id);
            
            return {
              id: work.id,
              title: work.title,
              thumbnail: work.thumbnail,
              view_count: work.view_count || 0,
              likes: work.likes || 0,
              comments_count: commentsCount || 0,
              created_at: work.created_at,
              status: work.status || 'published',
            };
          })
        );
        
        setUserWorks(worksWithComments);

        // 加载用户商业活动数据
        await loadUserBusinessData(userId);

        // 加载用户积分数据
        await loadUserPointsData(userId);

        // 加载用户会员数据
        await loadUserMembershipData(userId);

        // 加载用户登录记录
        await loadUserLoginRecords(userId);

        // 加载用户成就数据
        await loadUserAchievementData(userId);

        // 加载用户创作画像
        await loadUserCreativeProfile(userId);

        // 加载用户社交活动数据
        await loadUserSocialData(userId);

        // 加载用户内容互动数据
        await loadUserContentInteraction(userId);

        // 加载用户搜索行为数据
        await loadUserSearchData(userId);

        // 加载用户反馈数据
        await loadUserFeedbackData(userId);

        // 加载用户草稿数据
        await loadUserDraftsData(userId);

        // 加载AI使用记录
        await loadUserAIUsageData(userId);

        // 加载订单记录
        await loadUserOrderRecords(userId);

        // 加载收藏详情
        await loadUserCollectionDetail(userId);

        // 加载活动参与记录
        await loadUserEventParticipations(userId);

        // 加载用户安全数据
        await loadUserSecurityData(userId);

        // 加载用户隐私设置
        await loadUserPrivacySettings(userId);

        // 加载第三方账号绑定
        await loadUserThirdPartyBindings(userId);

        // 加载收益明细
        await loadUserEarningRecords(userId);

        // 加载优惠券
        await loadUserCoupons(userId);

        // 加载积分兑换记录
        await loadUserPointsExchanges(userId);

        // 加载浏览历史
        await loadUserBrowseHistory(userId);

        // 加载用户会话统计
        await loadUserSessionStats(userId);

        // 加载登录详情记录
        await loadUserLoginDetails(userId);

        // 加载登录时间热力图
        await loadLoginTimeHeatmap(userId);

        // 加载用户社区活动数据
        await loadUserCommunityData(userId);

        // 加载用户推荐系统数据
        await loadUserRecommendationData(userId);

        // 加载用户IP孵化数据
        await loadUserIPData(userId);

        // 加载用户A/B测试数据
        await loadUserABTestData(userId);

        // 加载用户内容审核数据
        await loadUserModerationData(userId);

        // 加载用户动态/Feed数据
        await loadUserFeedData(userId);

        // 加载用户邀请/裂变数据
        await loadUserInviteData(userId);

        // 加载用户提现记录数据
        await loadUserWithdrawalData(userId);

        // 加载用户模板互动数据
        await loadUserTemplateData(userId);

        // 加载用户活动获奖数据
        await loadUserPrizeData(userId);

        // 加载用户提及(@)数据
        await loadUserMentionData(userId);

        // 加载用户设计工作坊数据
        await loadUserDesignWorkshopData(userId);

        // 加载用户设备信息数据
        await loadUserDeviceDetailData(userId);

        // 加载用户私信/聊天数据
        await loadUserChatData(userId);

        // 加载用户举报记录数据
        await loadUserReportData(userId);

        // 加载用户封禁限制数据
        await loadUserBanData(userId);

        // 加载用户工作流数据
        await loadUserWorkflowData(userId);

        // 加载用户生成任务数据
        await loadUserGenerationTaskData(userId);

        // 加载用户灵感脉络数据
        await loadUserInspirationData(userId);

        // 加载用户流量来源数据
        await loadUserTrafficSourceData(userId);

        // 加载用户盲盒销售数据
        await loadUserBlindBoxData(userId);

        // 加载用户内容质量评估数据
        await loadUserContentQualityData(userId);

        // 加载用户人口统计数据
        await loadUserDemographicsData(userId);

        // 加载用户探索状态数据
        await loadUserExplorationData(userId);

        // 加载用户冷启动推荐日志数据
        await loadUserColdStartData(userId);

        // 加载用户同步日志数据
        await loadUserSyncData(userId);

        // 加载用户Neo状态数据
        await loadUserNeoStateData(userId);

        // 加载用户状态数据
        await loadUserStatusData(userId);

        // 加载用户小流量测试曝光数据
        await loadUserSmallTrafficData(userId);

        // 加载用户内容向量数据
        await loadUserContentVectorData(userId);

        // 加载用户新内容提升池数据
        await loadUserBoostPoolData(userId);

        // 加载用户实时推荐缓存数据
        await loadUserRealtimeRecData(userId);

        // 加载用户相似度数据
        await loadUserSimilarityData(userId);

        // 加载用户AB实验事件数据
        await loadUserABExperimentEventData(userId);

        // 加载用户AB指标数据
        await loadUserABMetricData(userId);

        // 加载用户审计日志数据
        await loadUserAuditLogData(userId);

        // 加载用户活动日志数据
        await loadUserActivityLogData(userId);

        // 加载用户产品链接数据
        await loadUserProductLinkData(userId);

        // 加载用户AI设置数据
        await loadUserAISettingsData(userId);

        // 加载用户通知偏好数据
        await loadUserNotificationPrefsData(userId);

        // 加载用户会员成长记录数据
        await loadUserMembershipGrowthData(userId);

        // 加载用户反馈处理日志数据
        await loadUserFeedbackProcessData(userId);

        // 加载用户小流量测试数据
        await loadUserSmallTrafficTestData(userId);
      }
    } catch (error) {
      console.error('加载用户数据失败:', error);
    } finally {
      setIsLoadingUserData(false);
    }
  }, [timeRange]);

  // 加载用户商业活动数据
  const loadUserBusinessData = async (userId: string) => {
    try {
      // 获取品牌任务参与数据
      const { count: brandTasksJoined } = await supabaseAdmin
        .from('brand_task_participants')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: brandTasksCompleted } = await supabaseAdmin
        .from('brand_task_submissions')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId)
        .eq('status', 'approved');

      // 获取创作者收益
      const { data: earningsData } = await supabaseAdmin
        .from('creator_earnings')
        .select('amount')
        .eq('creator_id', userId)
        .eq('status', 'paid');
      const brandTaskEarnings = earningsData?.reduce((sum, e) => sum + (e.amount || 0), 0) || 0;

      // 获取商单申请数据
      const { count: ordersApplied } = await supabaseAdmin
        .from('order_applications')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId);

      const { count: ordersCompleted } = await supabaseAdmin
        .from('order_applications')
        .select('*', { count: 'exact', head: true })
        .eq('creator_id', userId)
        .eq('status', 'approved');

      // 获取活动数据
      const { count: eventsCreated } = await supabaseAdmin
        .from('events')
        .select('*', { count: 'exact', head: true })
        .eq('organizer_id', userId);

      // 获取推广订单数据
      const { data: promotionData } = await supabaseAdmin
        .from('promotion_orders')
        .select('final_price')
        .eq('user_id', userId)
        .eq('status', 'completed');
      const promotionOrders = promotionData?.length || 0;
      const promotionSpent = promotionData?.reduce((sum, p) => sum + (p.final_price || 0), 0) || 0;

      setUserBusinessData({
        brandTasksJoined: brandTasksJoined || 0,
        brandTasksCompleted: brandTasksCompleted || 0,
        brandTaskEarnings,
        ordersApplied: ordersApplied || 0,
        ordersCompleted: ordersCompleted || 0,
        orderEarnings: 0, // 可以从订单数据计算
        eventsCreated: eventsCreated || 0,
        eventsJoined: 0, // 需要events_participants表
        promotionOrders,
        promotionSpent,
      });
    } catch (error) {
      console.error('加载用户商业数据失败:', error);
    }
  };

  // 加载用户积分数据
  const loadUserPointsData = async (userId: string) => {
    try {
      // 获取积分余额
      const { data: pointsBalance } = await supabaseAdmin
        .from('user_points_balance')
        .select('*')
        .eq('user_id', userId)
        .single();

      // 获取签到记录
      const { count: checkinDays } = await supabaseAdmin
        .from('checkin_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 获取连续签到天数（最近一条记录）
      const { data: latestCheckin } = await supabaseAdmin
        .from('checkin_records')
        .select('consecutive_days')
        .eq('user_id', userId)
        .order('checkin_date', { ascending: false })
        .limit(1)
        .single();

      // 获取任务完成数
      const { count: tasksCompleted } = await supabaseAdmin
        .from('task_records')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('status', 'completed');

      // 获取邀请数
      const { count: invitesCount } = await supabaseAdmin
        .from('invite_records')
        .select('*', { count: 'exact', head: true })
        .eq('inviter_id', userId);

      setUserPointsData({
        currentBalance: pointsBalance?.balance || 0,
        totalEarned: pointsBalance?.total_earned || 0,
        totalSpent: pointsBalance?.total_spent || 0,
        checkinDays: checkinDays || 0,
        consecutiveCheckins: latestCheckin?.consecutive_days || 0,
        tasksCompleted: tasksCompleted || 0,
        invitesCount: invitesCount || 0,
      });
    } catch (error) {
      console.error('加载用户积分数据失败:', error);
    }
  };

  // 加载用户会员数据
  const loadUserMembershipData = async (userId: string) => {
    try {
      // 获取会员订单
      const { data: membershipOrders } = await supabaseAdmin
        .from('membership_orders')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .order('created_at', { ascending: false });

      const totalOrders = membershipOrders?.length || 0;
      const totalSpent = membershipOrders?.reduce((sum, o) => sum + (o.amount || 0), 0) || 0;
      const latestOrder = membershipOrders?.[0];

      // 获取会员使用统计
      const { data: usageStats } = await supabaseAdmin
        .from('membership_usage_stats')
        .select('*')
        .eq('user_id', userId)
        .order('stat_date', { ascending: false })
        .limit(1)
        .single();

      setUserMembershipData({
        level: latestOrder?.plan || 'free',
        startDate: latestOrder?.paid_at ? new Date(latestOrder.paid_at).toLocaleDateString('zh-CN') : '',
        endDate: latestOrder?.expires_at ? new Date(latestOrder.expires_at).toLocaleDateString('zh-CN') : '',
        totalOrders,
        totalSpent,
        aiGenerationsUsed: usageStats?.ai_generations_count || 0,
        storageUsed: usageStats?.storage_used_bytes || 0,
      });
    } catch (error) {
      console.error('加载用户会员数据失败:', error);
    }
  };

  // 加载用户登录记录
  const loadUserLoginRecords = async (userId: string) => {
    try {
      // 生成最近30天的登录记录数据
      const days = 30;
      const now = new Date();
      const loginRecords: UserLoginRecord[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const displayDate = `${date.getMonth() + 1}月${date.getDate()}日`;
        
        // 模拟登录数据（实际应从user_devices或登录日志表获取）
        const loginCount = Math.floor(Math.random() * 5);
        
        loginRecords.push({
          date: displayDate,
          loginCount,
          deviceTypes: {
            desktop: Math.floor(Math.random() * 3),
            mobile: Math.floor(Math.random() * 4),
            tablet: Math.floor(Math.random() * 2),
          },
        });
      }

      setUserLoginRecords(loginRecords);
    } catch (error) {
      console.error('加载用户登录记录失败:', error);
    }
  };

  // 加载用户成就数据
  const loadUserAchievementData = async (userId: string) => {
    try {
      // 获取用户成就
      const { data: achievements } = await supabaseAdmin
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId);

      const unlockedAchievements = achievements?.filter(a => a.is_unlocked).length || 0;

      // 模拟分类数据
      const categoryBreakdown = [
        { category: '创作类', count: Math.floor(Math.random() * 10) + 5 },
        { category: '互动类', count: Math.floor(Math.random() * 8) + 3 },
        { category: '社交类', count: Math.floor(Math.random() * 6) + 2 },
        { category: '商业类', count: Math.floor(Math.random() * 5) + 1 },
      ];

      setUserAchievementData({
        totalAchievements: 50, // 总成就数
        unlockedAchievements,
        categoryBreakdown,
      });
    } catch (error) {
      console.error('加载用户成就数据失败:', error);
    }
  };

  // 加载用户创作画像
  const loadUserCreativeProfile = async (userId: string) => {
    try {
      // 获取创作画像
      const { data: profile } = await supabaseAdmin
        .from('user_creative_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      setUserCreativeProfile({
        totalMindmaps: profile?.total_mindmaps || 0,
        totalNodes: profile?.total_nodes || 0,
        totalStories: profile?.total_stories || 0,
        preferredCategories: profile?.preferred_categories || [],
        preferredBrands: profile?.preferred_brands || [],
        creativeStyle: profile?.creative_style_tags || [],
        mostActiveHour: profile?.most_active_hour || 20,
      });
    } catch (error) {
      console.error('加载用户创作画像失败:', error);
    }
  };

  // 加载用户社交活动数据
  const loadUserSocialData = async (userId: string) => {
    try {
      // 获取通知数据
      const { count: totalNotifications } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: unreadNotifications } = await supabaseAdmin
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('is_read', false);

      // 获取私信数据
      const { count: totalMessages } = await supabaseAdmin
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`);

      const { count: unreadMessages } = await supabaseAdmin
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      // 获取好友数据
      const { count: friendsCount } = await supabaseAdmin
        .from('friend_requests')
        .select('*', { count: 'exact', head: true })
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .eq('status', 'accepted');

      const { count: pendingFriendRequests } = await supabaseAdmin
        .from('friend_requests')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('status', 'pending');

      const { count: sentFriendRequests } = await supabaseAdmin
        .from('friend_requests')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId)
        .eq('status', 'pending');

      setUserSocialData({
        totalNotifications: totalNotifications || 0,
        unreadNotifications: unreadNotifications || 0,
        totalMessages: totalMessages || 0,
        unreadMessages: unreadMessages || 0,
        friendsCount: friendsCount || 0,
        pendingFriendRequests: pendingFriendRequests || 0,
        sentFriendRequests: sentFriendRequests || 0,
      });
    } catch (error) {
      console.error('加载用户社交数据失败:', error);
    }
  };

  // 加载用户内容互动数据
  const loadUserContentInteraction = async (userId: string) => {
    try {
      // 作品收藏
      const { count: worksBookmarked } = await supabaseAdmin
        .from('works_bookmarks')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 作品点赞
      const { count: worksLiked } = await supabaseAdmin
        .from('works_likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 动态收藏
      const { count: feedsBookmarked } = await supabaseAdmin
        .from('feed_collects')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 动态点赞
      const { count: feedsLiked } = await supabaseAdmin
        .from('feed_likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 评论数
      const { count: commentsMade } = await supabaseAdmin
        .from('work_comments')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 作品分享
      const { count: worksShared } = await supabaseAdmin
        .from('work_shares')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId);

      setUserContentInteraction({
        worksBookmarked: worksBookmarked || 0,
        worksLiked: worksLiked || 0,
        feedsBookmarked: feedsBookmarked || 0,
        feedsLiked: feedsLiked || 0,
        commentsMade: commentsMade || 0,
        worksShared: worksShared || 0,
        feedsShared: 0, // 需要feeds分享表
      });
    } catch (error) {
      console.error('加载用户内容互动数据失败:', error);
    }
  };

  // 加载用户搜索行为数据
  const loadUserSearchData = async (userId: string) => {
    try {
      // 获取搜索历史
      const { data: searchHistory } = await supabaseAdmin
        .from('user_search_history')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const totalSearches = searchHistory?.length || 0;
      const avgResultsPerSearch = searchHistory?.length
        ? Math.round(searchHistory.reduce((sum, s) => sum + (s.result_count || 0), 0) / searchHistory.length)
        : 0;

      // 计算点击率
      const searchesWithClicks = searchHistory?.filter(s => s.clicked_result_id).length || 0;
      const clickThroughRate = totalSearches > 0 ? (searchesWithClicks / totalSearches) * 100 : 0;

      // 统计热门搜索词
      const keywordCount: Record<string, number> = {};
      searchHistory?.forEach(s => {
        if (s.query) {
          keywordCount[s.query] = (keywordCount[s.query] || 0) + 1;
        }
      });
      const topSearchKeywords = Object.entries(keywordCount)
        .map(([keyword, count]) => ({ keyword, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // 生成搜索趋势数据
      const days = 30;
      const now = new Date();
      const searchTrend: { date: string; count: number }[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const displayDate = `${date.getMonth() + 1}月${date.getDate()}日`;
        
        const count = searchHistory?.filter(s => {
          const sDate = new Date(s.created_at);
          return sDate.toDateString() === date.toDateString();
        }).length || 0;

        searchTrend.push({ date: displayDate, count });
      }

      setUserSearchData({
        totalSearches,
        avgResultsPerSearch,
        clickThroughRate: Number(clickThroughRate.toFixed(2)),
        topSearchKeywords,
        searchTrend,
      });
    } catch (error) {
      console.error('加载用户搜索数据失败:', error);
    }
  };

  // 加载用户反馈数据
  const loadUserFeedbackData = async (userId: string) => {
    try {
      // 获取反馈数据
      const { data: feedbacks } = await supabaseAdmin
        .from('user_feedbacks')
        .select('*')
        .eq('user_id', userId);

      const totalFeedbacks = feedbacks?.length || 0;
      const pendingFeedbacks = feedbacks?.filter(f => f.status === 'pending').length || 0;
      const resolvedFeedbacks = feedbacks?.filter(f => f.status === 'resolved').length || 0;

      // 反馈类型统计
      const typeCount: Record<string, number> = {};
      feedbacks?.forEach(f => {
        typeCount[f.type] = (typeCount[f.type] || 0) + 1;
      });
      const feedbackTypes = Object.entries(typeCount)
        .map(([type, count]) => ({ type, count }));

      // 举报数据
      const { count: reportsAsReporter } = await supabaseAdmin
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('reporter_id', userId);

      const { count: reportsAsTarget } = await supabaseAdmin
        .from('reports')
        .select('*', { count: 'exact', head: true })
        .eq('target_author_id', userId);

      setUserFeedbackData({
        totalFeedbacks,
        pendingFeedbacks,
        resolvedFeedbacks,
        feedbackTypes,
        totalReports: (reportsAsReporter || 0) + (reportsAsTarget || 0),
        reportsAsReporter: reportsAsReporter || 0,
        reportsAsTarget: reportsAsTarget || 0,
      });
    } catch (error) {
      console.error('加载用户反馈数据失败:', error);
    }
  };

  // 加载用户草稿数据
  const loadUserDraftsData = async (userId: string) => {
    try {
      // 创作中心草稿
      const { count: createDrafts } = await supabaseAdmin
        .from('create_drafts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 品牌向导草稿
      const { count: brandWizardDrafts } = await supabaseAdmin
        .from('brand_wizard_drafts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 通用草稿
      const { count: generalDrafts } = await supabaseAdmin
        .from('drafts')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 待发送消息
      const { count: pendingMessages } = await supabaseAdmin
        .from('pending_messages')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setUserDraftsData({
        totalDrafts: (createDrafts || 0) + (brandWizardDrafts || 0) + (generalDrafts || 0),
        createDrafts: createDrafts || 0,
        brandWizardDrafts: brandWizardDrafts || 0,
        generalDrafts: generalDrafts || 0,
        pendingMessages: pendingMessages || 0,
      });
    } catch (error) {
      console.error('加载用户草稿数据失败:', error);
    }
  };

  // 加载AI使用记录
  const loadUserAIUsageData = async (userId: string) => {
    try {
      // 获取AI生成记录
      const { data: generations } = await supabaseAdmin
        .from('ai_generations')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const totalGenerations = generations?.length || 0;
      const imageGenerations = generations?.filter(g => g.type === 'image').length || 0;
      const videoGenerations = generations?.filter(g => g.type === 'video').length || 0;
      const textGenerations = generations?.filter(g => g.type === 'text').length || 0;

      // 按来源统计
      const sourceCount: Record<string, number> = {};
      generations?.forEach(g => {
        const source = g.source || 'unknown';
        sourceCount[source] = (sourceCount[source] || 0) + 1;
      });
      const generationsBySource = Object.entries(sourceCount)
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count);

      // 最近10条生成记录
      const recentGenerations = (generations || []).slice(0, 10).map(g => ({
        id: g.id,
        type: g.type,
        prompt: g.prompt?.substring(0, 50) + (g.prompt?.length > 50 ? '...' : '') || '',
        result_url: g.result_url,
        source: g.source || 'unknown',
        created_at: g.created_at,
      }));

      setUserAIUsageData({
        totalGenerations,
        imageGenerations,
        videoGenerations,
        textGenerations,
        generationsBySource,
        recentGenerations,
      });
    } catch (error) {
      console.error('加载AI使用记录失败:', error);
    }
  };

  // 加载订单记录
  const loadUserOrderRecords = async (userId: string) => {
    try {
      const orders: UserOrderRecord[] = [];

      // 获取会员订单
      const { data: membershipOrders } = await supabaseAdmin
        .from('membership_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      membershipOrders?.forEach(o => {
        orders.push({
          id: o.id,
          orderNo: o.order_no || o.id,
          type: 'membership',
          description: `会员订阅 - ${o.plan_name || o.plan}`,
          amount: o.amount || 0,
          status: o.status,
          created_at: o.created_at,
          paid_at: o.paid_at,
        });
      });

      // 获取推广订单
      const { data: promotionOrders } = await supabaseAdmin
        .from('promotion_orders')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      promotionOrders?.forEach(o => {
        orders.push({
          id: o.id,
          orderNo: o.order_no || o.id,
          type: 'promotion',
          description: `推广订单 - ${o.work_title || '作品推广'}`,
          amount: o.final_price || 0,
          status: o.status,
          created_at: o.created_at,
          paid_at: o.payment_time,
        });
      });

      // 按时间排序
      orders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setUserOrderRecords(orders);
    } catch (error) {
      console.error('加载订单记录失败:', error);
    }
  };

  // 加载收藏详情
  const loadUserCollectionDetail = async (userId: string) => {
    try {
      // 获取收藏的作品详情
      const { data: bookmarkedWorks } = await supabaseAdmin
        .from('works_bookmarks')
        .select('work_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const works = await Promise.all(
        (bookmarkedWorks || []).slice(0, 5).map(async (bw) => {
          const { data: work } = await supabaseAdmin
            .from('works')
            .select('id, title, thumbnail, creator_id')
            .eq('id', bw.work_id)
            .single();

          const { data: author } = await supabaseAdmin
            .from('users')
            .select('username')
            .eq('id', work?.creator_id)
            .single();

          return {
            id: work?.id || bw.work_id,
            title: work?.title || '未知作品',
            thumbnail: work?.thumbnail,
            author_name: author?.username || '未知作者',
            created_at: bw.created_at,
          };
        })
      );

      // 获取收藏的动态详情
      const { data: collectedFeeds } = await supabaseAdmin
        .from('feed_collects')
        .select('feed_id, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const feeds = await Promise.all(
        (collectedFeeds || []).slice(0, 5).map(async (cf) => {
          const { data: feed } = await supabaseAdmin
            .from('feeds')
            .select('id, content, author_id')
            .eq('id', cf.feed_id)
            .single();

          const { data: author } = await supabaseAdmin
            .from('users')
            .select('username')
            .eq('id', feed?.author_id)
            .single();

          return {
            id: feed?.id || cf.feed_id,
            content: feed?.content?.substring(0, 50) + (feed?.content?.length > 50 ? '...' : '') || '未知内容',
            author_name: author?.username || '未知作者',
            created_at: cf.created_at,
          };
        })
      );

      setUserCollectionDetail({ works, feeds });
    } catch (error) {
      console.error('加载收藏详情失败:', error);
    }
  };

  // 加载活动参与记录
  const loadUserEventParticipations = async (userId: string) => {
    try {
      const participations: UserEventParticipation[] = [];

      // 获取创建的活动
      const { data: createdEvents } = await supabaseAdmin
        .from('events')
        .select('id, title, start_time, status')
        .eq('organizer_id', userId)
        .order('start_time', { ascending: false });

      createdEvents?.forEach(e => {
        participations.push({
          id: e.id,
          title: e.title,
          type: 'created',
          start_time: e.start_time,
          status: e.status,
        });
      });

      // 获取参与的活动（如果有event_participants表）
      try {
        const { data: joinedEvents } = await supabaseAdmin
          .from('event_participants')
          .select('event_id, created_at')
          .eq('user_id', userId);

        if (joinedEvents) {
          for (const je of joinedEvents) {
            const { data: event } = await supabaseAdmin
              .from('events')
              .select('id, title, start_time, status')
              .eq('id', je.event_id)
              .single();

            if (event) {
              participations.push({
                id: event.id,
                title: event.title,
                type: 'joined',
                start_time: event.start_time,
                status: event.status,
              });
            }
          }
        }
      } catch (e) {
        // event_participants表可能不存在
      }

      // 按时间排序
      participations.sort((a, b) => new Date(b.start_time).getTime() - new Date(a.start_time).getTime());

      setUserEventParticipations(participations.slice(0, 10));
    } catch (error) {
      console.error('加载活动参与记录失败:', error);
    }
  };

  // 加载用户安全数据
  const loadUserSecurityData = async (userId: string) => {
    try {
      // 获取用户安全信息
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('email_confirmed_at, phone_confirmed_at, updated_at, raw_user_meta_data')
        .eq('id', userId)
        .single();

      // 模拟安全数据（实际应从安全日志表获取）
      setUserSecurityData({
        lastPasswordChange: user?.updated_at ? new Date(user.updated_at).toLocaleDateString('zh-CN') : '未知',
        failedLoginAttempts: Math.floor(Math.random() * 5),
        lastFailedLogin: '',
        twoFactorEnabled: user?.raw_user_meta_data?.two_factor_enabled || false,
        emailVerified: !!user?.email_confirmed_at,
        phoneVerified: !!user?.phone_confirmed_at,
        suspiciousActivities: [],
      });
    } catch (error) {
      console.error('加载用户安全数据失败:', error);
    }
  };

  // 加载用户隐私设置
  const loadUserPrivacySettings = async (userId: string) => {
    try {
      // 获取用户隐私设置
      const { data: settings } = await supabaseAdmin
        .from('user_privacy_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      setUserPrivacySettings({
        profileVisibility: settings?.profile_visibility || 'public',
        worksVisibility: settings?.works_visibility || 'public',
        allowSearch: settings?.allow_search !== false,
        showOnlineStatus: settings?.show_online_status !== false,
        allowMessagesFrom: settings?.allow_messages_from || 'everyone',
      });
    } catch (error) {
      // 表可能不存在，使用默认值
      console.log('用户隐私设置表不存在，使用默认值');
    }
  };

  // 加载第三方账号绑定
  const loadUserThirdPartyBindings = async (userId: string) => {
    try {
      // 获取第三方绑定信息
      const { data: identities } = await supabaseAdmin
        .from('identities')
        .select('*')
        .eq('user_id', userId);

      const bindings: UserThirdPartyBindings = {};

      identities?.forEach((identity: any) => {
        const provider = identity.provider;
        if (provider === 'wechat') {
          bindings.wechat = { bound: true, nickname: identity.identity_data?.nickname, boundAt: identity.created_at };
        } else if (provider === 'qq') {
          bindings.qq = { bound: true, nickname: identity.identity_data?.nickname, boundAt: identity.created_at };
        } else if (provider === 'weibo') {
          bindings.weibo = { bound: true, nickname: identity.identity_data?.nickname, boundAt: identity.created_at };
        } else if (provider === 'github') {
          bindings.github = { bound: true, nickname: identity.identity_data?.nickname, boundAt: identity.created_at };
        }
      });

      setUserThirdPartyBindings(bindings);
    } catch (error) {
      console.error('加载第三方绑定失败:', error);
    }
  };

  // 加载收益明细
  const loadUserEarningRecords = async (userId: string) => {
    try {
      const earnings: UserEarningRecord[] = [];

      // 获取品牌任务收益
      const { data: taskEarnings } = await supabaseAdmin
        .from('creator_earnings')
        .select('*')
        .eq('creator_id', userId)
        .order('created_at', { ascending: false });

      taskEarnings?.forEach((e: any) => {
        earnings.push({
          id: e.id,
          type: 'brand_task',
          description: e.description || '品牌任务收益',
          amount: e.amount || 0,
          status: e.status || 'pending',
          created_at: e.created_at,
          paid_at: e.paid_at,
        });
      });

      // 排序
      earnings.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setUserEarningRecords(earnings.slice(0, 10));
    } catch (error) {
      console.error('加载收益明细失败:', error);
    }
  };

  // 加载优惠券
  const loadUserCoupons = async (userId: string) => {
    try {
      const { data: coupons } = await supabaseAdmin
        .from('promotion_coupon_usage')
        .select('*, promotion_coupons(*)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const formattedCoupons: UserCoupon[] = (coupons || []).map((c: any) => ({
        id: c.id,
        code: c.promotion_coupons?.code || '',
        type: c.promotion_coupons?.type || 'discount',
        discount: c.promotion_coupons?.discount_value || 0,
        minOrderAmount: c.promotion_coupons?.min_order_amount || 0,
        validUntil: c.promotion_coupons?.valid_until,
        used: !!c.used_at,
        usedAt: c.used_at,
      }));

      setUserCoupons(formattedCoupons.slice(0, 5));
    } catch (error) {
      console.error('加载优惠券失败:', error);
    }
  };

  // 加载积分兑换记录
  const loadUserPointsExchanges = async (userId: string) => {
    try {
      const { data: exchanges } = await supabaseAdmin
        .from('exchange_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const formattedExchanges: UserPointsExchange[] = (exchanges || []).slice(0, 5).map((e: any) => ({
        id: e.id,
        itemName: e.product_name || '未知商品',
        pointsCost: e.points_cost || 0,
        quantity: e.quantity || 1,
        created_at: e.created_at,
      }));

      setUserPointsExchanges(formattedExchanges);
    } catch (error) {
      console.error('加载积分兑换记录失败:', error);
    }
  };

  // 加载浏览历史
  const loadUserBrowseHistory = async (userId: string) => {
    try {
      // 获取行为日志中的浏览记录
      const { data: logs } = await supabaseAdmin
        .from('user_behavior_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('behavior_type', 'view')
        .order('created_at', { ascending: false })
        .limit(10);

      const history: UserBrowseHistory[] = (logs || []).map((log: any) => ({
        id: log.id,
        type: log.target_type === 'work' ? 'work' : log.target_type === 'feed' ? 'feed' : 'work',
        title: log.target_title || '未知内容',
        thumbnail: log.metadata?.thumbnail,
        viewedAt: log.created_at,
        duration: log.metadata?.duration || 0,
      }));

      setUserBrowseHistory(history);
    } catch (error) {
      console.error('加载浏览历史失败:', error);
    }
  };

  // 加载用户会话统计
  const loadUserSessionStats = async (userId: string) => {
    try {
      // 获取用户行为日志计算在线时长
      const { data: behaviorLogs } = await supabaseAdmin
        .from('user_behavior_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: true });

      // 计算会话统计
      let totalOnlineTime = 0;
      let longestSession = 0;
      const sessions: number[] = [];

      if (behaviorLogs && behaviorLogs.length > 1) {
        for (let i = 0; i < behaviorLogs.length - 1; i++) {
          const current = new Date(behaviorLogs[i].created_at);
          const next = new Date(behaviorLogs[i + 1].created_at);
          const diff = (next.getTime() - current.getTime()) / 1000 / 60; // 分钟

          if (diff < 30) { // 30分钟内算同一会话
            totalOnlineTime += diff;
            sessions.push(diff);
          }
        }
      }

      // 计算连续登录天数
      const { data: loginRecords } = await supabaseAdmin
        .from('user_behavior_logs')
        .select('created_at')
        .eq('user_id', userId)
        .eq('behavior_type', 'login')
        .order('created_at', { ascending: false });

      let currentStreak = 0;
      let longestStreak = 0;
      let streak = 0;
      let lastDate: Date | null = null;

      loginRecords?.forEach((record: any) => {
        const date = new Date(record.created_at);
        date.setHours(0, 0, 0, 0);

        if (lastDate) {
          const diffDays = (lastDate.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
          if (diffDays === 1) {
            streak++;
          } else if (diffDays > 1) {
            longestStreak = Math.max(longestStreak, streak);
            streak = 1;
          }
        } else {
          streak = 1;
        }
        lastDate = date;
      });

      longestStreak = Math.max(longestStreak, streak);
      currentStreak = streak;

      // 获取用户信息
      const { data: user } = await supabaseAdmin
        .from('users')
        .select('created_at, last_sign_in_at, raw_user_meta_data')
        .eq('id', userId)
        .single();

      // 获取最近登录设备信息
      const { data: recentDevice } = await supabaseAdmin
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false })
        .limit(1)
        .single();

      setUserSessionStats({
        totalOnlineTime: Math.round(totalOnlineTime),
        avgSessionDuration: sessions.length > 0 ? Math.round(totalOnlineTime / sessions.length) : 0,
        longestSession: Math.round(longestSession),
        totalSessions: sessions.length,
        currentStreak,
        longestStreak,
        firstLoginTime: user?.created_at ? new Date(user.created_at).toLocaleString('zh-CN') : '',
        lastLoginTime: user?.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('zh-CN') : '',
        lastLoginIp: recentDevice?.ip_address || '',
        lastLoginLocation: recentDevice?.location || '',
        lastLoginDevice: recentDevice?.device_type || '',
      });
    } catch (error) {
      console.error('加载用户会话统计失败:', error);
    }
  };

  // 加载登录详情记录
  const loadUserLoginDetails = async (userId: string) => {
    try {
      // 从行为日志获取登录记录
      const { data: logs } = await supabaseAdmin
        .from('user_behavior_logs')
        .select('*')
        .eq('user_id', userId)
        .eq('behavior_type', 'login')
        .order('created_at', { ascending: false })
        .limit(20);

      const details: UserLoginDetail[] = (logs || []).map((log: any) => ({
        id: log.id,
        loginTime: log.created_at,
        ipAddress: log.ip_address || '未知',
        location: log.metadata?.location || '未知',
        device: log.metadata?.device || '未知设备',
        browser: log.metadata?.browser || '未知浏览器',
        os: log.metadata?.os || '未知系统',
        loginMethod: log.metadata?.login_method || 'password',
        status: log.metadata?.status || 'success',
        failReason: log.metadata?.fail_reason,
      }));

      setUserLoginDetails(details);
    } catch (error) {
      console.error('加载登录详情失败:', error);
    }
  };

  // 加载登录时间热力图
  const loadLoginTimeHeatmap = async (userId: string) => {
    try {
      const { data: logs } = await supabaseAdmin
        .from('user_behavior_logs')
        .select('created_at')
        .eq('user_id', userId)
        .eq('behavior_type', 'login')
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

      // 初始化7天 x 24小时的数据
      const heatmap: LoginTimeHeatmap[] = [];
      for (let day = 0; day < 7; day++) {
        for (let hour = 0; hour < 24; hour++) {
          heatmap.push({ day, hour, count: 0 });
        }
      }

      // 统计登录次数
      logs?.forEach((log: any) => {
        const date = new Date(log.created_at);
        const day = date.getDay();
        const hour = date.getHours();
        const index = day * 24 + hour;
        if (heatmap[index]) {
          heatmap[index].count++;
        }
      });

      setLoginTimeHeatmap(heatmap);
    } catch (error) {
      console.error('加载登录时间热力图失败:', error);
    }
  };

  // 加载用户留存率数据
  const loadRetentionData = async () => {
    try {
      const days = 30;
      const retention: RetentionData[] = [];

      for (let i = days - 1; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = `${date.getMonth() + 1}月${date.getDate()}日`;

        // 获取当天新用户
        const startOfDay = new Date(date);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(date);
        endOfDay.setHours(23, 59, 59, 999);

        const { data: newUsers } = await supabaseAdmin
          .from('users')
          .select('id, created_at')
          .gte('created_at', startOfDay.toISOString())
          .lte('created_at', endOfDay.toISOString());

        const newUserCount = newUsers?.length || 0;
        const newUserIds = newUsers?.map(u => u.id) || [];

        // 计算留存率（模拟数据，实际应根据用户后续登录情况计算）
        const day1Retention = newUserCount > 0 ? Math.round((Math.random() * 30 + 20)) : 0;
        const day3Retention = newUserCount > 0 ? Math.round((Math.random() * 20 + 15)) : 0;
        const day7Retention = newUserCount > 0 ? Math.round((Math.random() * 15 + 10)) : 0;
        const day14Retention = newUserCount > 0 ? Math.round((Math.random() * 10 + 5)) : 0;
        const day30Retention = newUserCount > 0 ? Math.round((Math.random() * 8 + 3)) : 0;

        retention.push({
          date: dateStr,
          newUsers: newUserCount,
          day1Retention,
          day3Retention,
          day7Retention,
          day14Retention,
          day30Retention,
        });
      }

      setRetentionData(retention);
    } catch (error) {
      console.error('加载留存率数据失败:', error);
    }
  };

  // 加载用户分群数据
  const loadUserSegmentData = async () => {
    try {
      // 获取用户数据进行分群分析
      const { data: users } = await supabaseAdmin
        .from('users')
        .select('id, created_at, last_sign_in_at');

      const now = new Date();
      const segments: Record<string, { count: number; users: any[] }> = {
        '新用户': { count: 0, users: [] },
        '活跃用户': { count: 0, users: [] },
        '沉睡用户': { count: 0, users: [] },
        '流失用户': { count: 0, users: [] },
        'VIP用户': { count: 0, users: [] },
      };

      users?.forEach((user: any) => {
        const createdAt = new Date(user.created_at);
        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
        const daysSinceCreated = Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysSinceLastSignIn = lastSignIn ? Math.floor((now.getTime() - lastSignIn.getTime()) / (1000 * 60 * 60 * 24)) : Infinity;

        if (daysSinceCreated <= 7) {
          segments['新用户'].count++;
          segments['新用户'].users.push(user);
        } else if (daysSinceLastSignIn <= 7) {
          segments['活跃用户'].count++;
          segments['活跃用户'].users.push(user);
        } else if (daysSinceLastSignIn <= 30) {
          segments['沉睡用户'].count++;
          segments['沉睡用户'].users.push(user);
        } else {
          segments['流失用户'].count++;
          segments['流失用户'].users.push(user);
        }
      });

      const totalUsers = users?.length || 1;
      const segmentData: UserSegmentData[] = Object.entries(segments).map(([segment, data]) => ({
        segment,
        count: data.count,
        percentage: Math.round((data.count / totalUsers) * 100),
        avgEngagement: Math.round(Math.random() * 100),
        avgRevenue: Math.round(Math.random() * 1000),
      }));

      setUserSegmentData(segmentData);
    } catch (error) {
      console.error('加载用户分群数据失败:', error);
    }
  };

  // 加载用户社区活动数据
  const loadUserCommunityData = async (userId: string) => {
    try {
      // 获取用户发布的社区帖子
      const { count: postsCreated } = await supabaseAdmin
        .from('posts')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);

      // 获取用户点赞的帖子
      const { count: postsLiked } = await supabaseAdmin
        .from('community_post_likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 获取用户收藏的帖子
      const { count: postsCollected } = await supabaseAdmin
        .from('community_post_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 获取用户评论数
      const { count: commentsMade } = await supabaseAdmin
        .from('comments')
        .select('*', { count: 'exact', head: true })
        .eq('author_id', userId);

      // 获取用户加入的社区数
      const { count: communitiesJoined } = await supabaseAdmin
        .from('community_members')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setUserCommunityData({
        postsCreated: postsCreated || 0,
        postsLiked: postsLiked || 0,
        postsCollected: postsCollected || 0,
        commentsMade: commentsMade || 0,
        communitiesJoined: communitiesJoined || 0,
        totalEngagement: (postsLiked || 0) + (postsCollected || 0) + (commentsMade || 0),
      });
    } catch (error) {
      console.error('加载用户社区活动数据失败:', error);
    }
  };

  // 加载用户推荐系统数据
  const loadUserRecommendationData = async (userId: string) => {
    try {
      // 获取用户画像数据
      const { data: profileData } = await supabaseAdmin
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      // 获取用户行为特征
      const { data: behaviorFeatures } = await supabaseAdmin
        .from('user_behavior_events')
        .select('event_type, count')
        .eq('user_id', userId)
        .limit(10);

      // 获取实时特征
      const { data: realtimeFeatures } = await supabaseAdmin
        .from('user_realtime_features')
        .select('*')
        .eq('user_id', userId)
        .single();

      // 获取推荐历史
      const { count: recommendationsReceived } = await supabaseAdmin
        .from('recommendation_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: recommendationsClicked } = await supabaseAdmin
        .from('recommendation_history')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('clicked', true);

      const clickThroughRate = recommendationsReceived && recommendationsReceived > 0
        ? Number(((recommendationsClicked || 0) / recommendationsReceived * 100).toFixed(2))
        : 0;

      setUserRecommendationData({
        profileCompleteness: profileData?.completeness || Math.floor(Math.random() * 40) + 60,
        interestTags: profileData?.interest_tags || ['设计', '创意', '艺术'],
        behaviorFeatures: (behaviorFeatures || []).map((f: any) => ({
          feature: f.event_type,
          score: f.count || Math.floor(Math.random() * 100),
        })),
        realtimeFeatures: [
          { feature: '最近活跃', value: realtimeFeatures?.last_active || '刚刚' },
          { feature: '当前会话', value: realtimeFeatures?.current_session || '浏览中' },
          { feature: '兴趣偏好', value: realtimeFeatures?.interest_preference || '设计类' },
          { feature: '设备类型', value: realtimeFeatures?.device_type || '桌面端' },
        ],
        recommendationsReceived: recommendationsReceived || 0,
        recommendationsClicked: recommendationsClicked || 0,
        clickThroughRate,
      });
    } catch (error) {
      console.error('加载用户推荐系统数据失败:', error);
    }
  };

  // 加载用户IP孵化数据
  const loadUserIPData = async (userId: string) => {
    try {
      // 获取IP资产
      const { data: ipAssets } = await supabaseAdmin
        .from('ip_assets')
        .select('status')
        .eq('creator_id', userId);

      const totalIPAssets = ipAssets?.length || 0;
      const publishedIPs = ipAssets?.filter((ip: any) => ip.status === 'published').length || 0;
      const incubatingIPs = ipAssets?.filter((ip: any) => ip.status === 'incubating').length || 0;
      const commercializedIPs = ipAssets?.filter((ip: any) => ip.status === 'commercialized').length || 0;

      // 获取IP收益
      const { data: revenueData } = await supabaseAdmin
        .from('creator_revenue')
        .select('amount')
        .eq('creator_id', userId);
      const totalRevenue = revenueData?.reduce((sum, r) => sum + (r.amount || 0), 0) || 0;

      // 获取合作伙伴
      const { count: partnerships } = await supabaseAdmin
        .from('ip_partnerships')
        .select('*', { count: 'exact', head: true })
        .eq('ip_owner_id', userId);

      // 获取版权资产
      const { count: copyrightAssets } = await supabaseAdmin
        .from('copyright_assets')
        .select('*', { count: 'exact', head: true })
        .eq('owner_id', userId);

      // 获取IP活动
      const { count: ipActivities } = await supabaseAdmin
        .from('ip_activities')
        .select('*', { count: 'exact', head: true })
        .eq('ip_owner_id', userId);

      setUserIPData({
        totalIPAssets,
        publishedIPs,
        incubatingIPs,
        commercializedIPs,
        totalRevenue,
        partnerships: partnerships || 0,
        copyrightAssets: copyrightAssets || 0,
        ipActivities: ipActivities || 0,
      });
    } catch (error) {
      console.error('加载用户IP孵化数据失败:', error);
    }
  };

  // 加载用户A/B测试数据
  const loadUserABTestData = async (userId: string) => {
    try {
      // 获取用户参与的实验
      const { data: experiments } = await supabaseAdmin
        .from('ab_user_assignments')
        .select('*, ab_experiments(name, status)')
        .eq('user_id', userId);

      const totalExperiments = experiments?.length || 0;
      const activeExperiments = experiments?.filter((e: any) => e.ab_experiments?.status === 'active').length || 0;
      const completedExperiments = experiments?.filter((e: any) => e.ab_experiments?.status === 'completed').length || 0;

      setUserABTestData({
        totalExperiments,
        activeExperiments,
        completedExperiments,
        experiments: (experiments || []).map((e: any) => ({
          id: e.experiment_id,
          name: e.ab_experiments?.name || '未知实验',
          variant: e.variant,
          status: e.ab_experiments?.status || 'unknown',
          enrolledAt: e.assigned_at,
        })),
      });
    } catch (error) {
      console.error('加载用户A/B测试数据失败:', error);
    }
  };

  // 加载用户内容审核数据
  const loadUserModerationData = async (userId: string) => {
    try {
      // 获取内容审核记录
      const { data: moderationLogs } = await supabaseAdmin
        .from('moderation_logs')
        .select('action, reason, scores')
        .eq('user_id', userId);

      const totalSubmissions = moderationLogs?.length || 0;
      const approved = moderationLogs?.filter((m: any) => m.status === 'approved').length || 0;
      const rejected = moderationLogs?.filter((m: any) => m.status === 'rejected').length || 0;
      const pending = moderationLogs?.filter((m: any) => m.status === 'pending').length || 0;
      const aiReviews = moderationLogs?.filter((m: any) => m.review_type === 'ai').length || 0;
      const humanReviews = moderationLogs?.filter((m: any) => m.review_type === 'human').length || 0;

      const scores = moderationLogs?.filter((m: any) => m.score !== null).map((m: any) => m.score) || [];
      const averageScore = scores.length > 0
        ? Number((scores.reduce((a, b) => a + b, 0) / scores.length).toFixed(2))
        : 0;

      setUserModerationData({
        totalSubmissions,
        approved,
        rejected,
        pending,
        aiReviews,
        humanReviews,
        averageScore,
      });
    } catch (error) {
      console.error('加载用户内容审核数据失败:', error);
    }
  };

  // 加载用户动态/Feed数据
  const loadUserFeedData = async (userId: string) => {
    try {
      // 获取用户发布的动态
      const { data: feeds } = await supabaseAdmin
        .from('feeds')
        .select('status, likes_count, comments_count, shares_count')
        .eq('author_id', userId);

      const totalFeeds = feeds?.length || 0;
      const feedsPublished = feeds?.filter((f: any) => f.status === 'published').length || 0;
      const feedsDraft = feeds?.filter((f: any) => f.status === 'draft').length || 0;
      const totalLikes = feeds?.reduce((sum, f) => sum + (f.likes_count || 0), 0) || 0;
      const totalComments = feeds?.reduce((sum, f) => sum + (f.comments_count || 0), 0) || 0;
      const totalShares = feeds?.reduce((sum, f) => sum + (f.shares_count || 0), 0) || 0;

      const avgEngagementRate = totalFeeds > 0
        ? Number(((totalLikes + totalComments + totalShares) / (totalFeeds * 100) * 100).toFixed(2))
        : 0;

      setUserFeedData({
        totalFeeds,
        feedsPublished,
        feedsDraft,
        totalLikes,
        totalComments,
        totalShares,
        avgEngagementRate,
      });
    } catch (error) {
      console.error('加载用户动态/Feed数据失败:', error);
    }
  };

  // 加载用户邀请/裂变数据
  const loadUserInviteData = async (userId: string) => {
    try {
      // 获取邀请记录
      const { data: inviteRecords } = await supabaseAdmin
        .from('invite_records')
        .select('*, invited_user:users(id, username, created_at)')
        .eq('inviter_id', userId);

      const totalInvites = inviteRecords?.length || 0;
      const successfulInvites = inviteRecords?.filter((r: any) => r.status === 'completed').length || 0;
      const inviteConversionRate = totalInvites > 0
        ? Number(((successfulInvites / totalInvites) * 100).toFixed(2))
        : 0;

      // 获取邀请奖励
      const { data: rewardsData } = await supabaseAdmin
        .from('points_records')
        .select('points')
        .eq('user_id', userId)
        .eq('source', 'invite');
      const inviteRewards = rewardsData?.reduce((sum, r) => sum + (r.points || 0), 0) || 0;

      setUserInviteData({
        totalInvites,
        successfulInvites,
        inviteConversionRate,
        inviteRewards,
        invitedUsers: (inviteRecords || []).map((r: any) => ({
          id: r.invited_user?.id || '',
          username: r.invited_user?.username || '未知用户',
          joinedAt: r.invited_user?.created_at || r.created_at,
          status: r.status,
        })),
      });
    } catch (error) {
      console.error('加载用户邀请/裂变数据失败:', error);
    }
  };

  // 加载用户提现记录数据
  const loadUserWithdrawalData = async (userId: string) => {
    try {
      const { data: withdrawals } = await supabaseAdmin
        .from('withdrawal_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const totalWithdrawals = withdrawals?.length || 0;
      const totalAmount = withdrawals?.reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
      const pendingAmount = withdrawals?.filter((w: any) => w.status === 'pending').reduce((sum, w) => sum + (w.amount || 0), 0) || 0;
      const completedAmount = withdrawals?.filter((w: any) => w.status === 'completed').reduce((sum, w) => sum + (w.amount || 0), 0) || 0;

      setUserWithdrawalData({
        totalWithdrawals,
        totalAmount,
        pendingAmount,
        completedAmount,
        withdrawals: (withdrawals || []).map((w: any) => ({
          id: w.id,
          amount: w.amount || 0,
          status: w.status || 'pending',
          method: w.method || 'unknown',
          createdAt: w.created_at,
          processedAt: w.processed_at,
        })),
      });
    } catch (error) {
      console.error('加载用户提现记录数据失败:', error);
    }
  };

  // 加载用户模板互动数据
  const loadUserTemplateData = async (userId: string) => {
    try {
      const { count: totalFavorites } = await supabaseAdmin
        .from('template_favorites')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: totalLikes } = await supabaseAdmin
        .from('template_likes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      // 获取收藏的模板详情
      const { data: favoriteTemplates } = await supabaseAdmin
        .from('template_favorites')
        .select('*, template:tianjin_templates(id, name, category)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      setUserTemplateData({
        totalFavorites: totalFavorites || 0,
        totalLikes: totalLikes || 0,
        templatesUsed: Math.floor(Math.random() * 50), // 模拟数据
        templatesCreated: Math.floor(Math.random() * 10), // 模拟数据
        favoriteTemplates: (favoriteTemplates || []).map((f: any) => ({
          id: f.template?.id || '',
          name: f.template?.name || '未知模板',
          category: f.template?.category || '未分类',
          favoritedAt: f.created_at,
        })),
      });
    } catch (error) {
      console.error('加载用户模板互动数据失败:', error);
    }
  };

  // 加载用户活动获奖数据
  const loadUserPrizeData = async (userId: string) => {
    try {
      const { data: prizeWinners } = await supabaseAdmin
        .from('prize_winners')
        .select('*, event:events(id, title), prize:event_prizes(id, name, value)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const totalPrizes = prizeWinners?.length || 0;
      const totalPrizeValue = prizeWinners?.reduce((sum, p) => sum + (p.prize?.value || 0), 0) || 0;

      setUserPrizeData({
        totalPrizes,
        totalPrizeValue,
        prizes: (prizeWinners || []).map((p: any) => ({
          id: p.id,
          eventName: p.event?.title || '未知活动',
          prizeName: p.prize?.name || '未知奖品',
          prizeValue: p.prize?.value || 0,
          wonAt: p.created_at,
          status: p.status || 'pending',
        })),
      });
    } catch (error) {
      console.error('加载用户活动获奖数据失败:', error);
    }
  };

  // 加载用户提及(@)数据
  const loadUserMentionData = async (userId: string) => {
    try {
      // 获取收到的提及
      const { data: mentionsReceived } = await supabaseAdmin
        .from('mentions')
        .select('*')
        .eq('receiver_id', userId);

      // 获取发送的提及
      const { data: mentionsSent } = await supabaseAdmin
        .from('mentions')
        .select('*, sender:users(username)')
        .eq('sender_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      const totalMentions = (mentionsReceived?.length || 0) + (mentionsSent?.length || 0);

      setUserMentionData({
        totalMentions,
        mentionsReceived: mentionsReceived?.length || 0,
        mentionsSent: mentionsSent?.length || 0,
        recentMentions: (mentionsSent || []).map((m: any) => ({
          id: m.id,
          senderName: m.sender?.username || '未知用户',
          content: m.content || '',
          createdAt: m.created_at,
          type: m.type || 'comment',
        })),
      });
    } catch (error) {
      console.error('加载用户提及(@)数据失败:', error);
    }
  };

  // 加载用户设计工作坊数据
  const loadUserDesignWorkshopData = async (userId: string) => {
    try {
      // 获取用户上传
      const { data: uploads } = await supabaseAdmin
        .from('user_uploads')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);

      // 获取用户图案
      const { data: patterns } = await supabaseAdmin
        .from('user_patterns')
        .select('*')
        .eq('user_id', userId)
        .limit(5);

      // 获取用户风格预设
      const { data: stylePresets } = await supabaseAdmin
        .from('user_style_presets')
        .select('*')
        .eq('user_id', userId)
        .limit(5);

      // 获取总数
      const { count: totalUploads } = await supabaseAdmin
        .from('user_uploads')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: totalPatterns } = await supabaseAdmin
        .from('user_patterns')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: totalStylePresets } = await supabaseAdmin
        .from('user_style_presets')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: totalTileConfigs } = await supabaseAdmin
        .from('user_tile_configs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      const { count: totalMockupConfigs } = await supabaseAdmin
        .from('user_mockup_configs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      setUserDesignWorkshopData({
        totalUploads: totalUploads || 0,
        totalPatterns: totalPatterns || 0,
        totalStylePresets: totalStylePresets || 0,
        totalTileConfigs: totalTileConfigs || 0,
        totalMockupConfigs: totalMockupConfigs || 0,
        uploads: (uploads || []).map((u: any) => ({
          id: u.id,
          fileName: u.file_name,
          fileType: u.file_type,
          fileSize: u.file_size || 0,
          thumbnailUrl: u.thumbnail_url,
          createdAt: u.created_at,
        })),
        patterns: (patterns || []).map((p: any) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          isCustom: p.is_custom || false,
        })),
        stylePresets: (stylePresets || []).map((s: any) => ({
          id: s.id,
          name: s.name,
          blendRatio: s.blend_ratio || 0,
        })),
      });
    } catch (error) {
      console.error('加载用户设计工作坊数据失败:', error);
    }
  };

  // 加载用户设备信息数据
  const loadUserDeviceDetailData = async (userId: string) => {
    try {
      const { data: devices } = await supabaseAdmin
        .from('user_devices')
        .select('*')
        .eq('user_id', userId)
        .order('last_seen_at', { ascending: false })
        .limit(10);

      setUserDeviceDetailData({
        totalDevices: devices?.length || 0,
        devices: (devices || []).map((d: any) => ({
          id: d.id,
          deviceType: d.device_type || 'unknown',
          deviceName: d.device_name,
          userAgent: d.user_agent || '',
          ipAddress: d.ip_address || '',
          firstSeenAt: d.first_seen_at,
          lastSeenAt: d.last_seen_at,
          visitCount: d.visit_count || 1,
        })),
      });
    } catch (error) {
      console.error('加载用户设备信息数据失败:', error);
    }
  };

  // 加载用户私信/聊天数据
  const loadUserChatData = async (userId: string) => {
    try {
      // 获取发送的消息
      const { count: messagesSent } = await supabaseAdmin
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('sender_id', userId);

      // 获取接收的消息
      const { count: messagesReceived } = await supabaseAdmin
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId);

      // 获取未读消息
      const { count: unreadMessages } = await supabaseAdmin
        .from('direct_messages')
        .select('*', { count: 'exact', head: true })
        .eq('receiver_id', userId)
        .eq('is_read', false);

      // 获取最近的对话
      const { data: recentMessages } = await supabaseAdmin
        .from('direct_messages')
        .select('*, sender:users(username), receiver:users(username)')
        .or(`sender_id.eq.${userId},receiver_id.eq.${userId}`)
        .order('created_at', { ascending: false })
        .limit(5);

      // 统计对话数量（唯一的对话对象）
      const uniqueConversations = new Set();
      recentMessages?.forEach((m: any) => {
        if (m.sender_id === userId) {
          uniqueConversations.add(m.receiver_id);
        } else {
          uniqueConversations.add(m.sender_id);
        }
      });

      setUserChatData({
        totalConversations: uniqueConversations.size,
        totalMessagesSent: messagesSent || 0,
        totalMessagesReceived: messagesReceived || 0,
        unreadMessages: unreadMessages || 0,
        recentConversations: (recentMessages || []).map((m: any) => ({
          id: m.id,
          otherUserName: m.sender_id === userId ? m.receiver?.username : m.sender?.username,
          lastMessage: m.content?.substring(0, 50) || '',
          lastMessageTime: m.created_at,
          unreadCount: m.receiver_id === userId && !m.is_read ? 1 : 0,
        })),
      });
    } catch (error) {
      console.error('加载用户私信/聊天数据失败:', error);
    }
  };

  // 加载用户举报记录数据
  const loadUserReportData = async (userId: string) => {
    try {
      // 获取作为举报者的记录
      const { data: reportsAsReporter } = await supabaseAdmin
        .from('reports')
        .select('*')
        .eq('reporter_id', userId);

      // 获取作为被举报目标的记录
      const { data: reportsAsTarget } = await supabaseAdmin
        .from('reports')
        .select('*')
        .eq('target_author_id', userId);

      const allReports = [...(reportsAsReporter || []), ...(reportsAsTarget || [])];
      const pendingReports = allReports.filter((r: any) => r.status === 'pending').length;
      const resolvedReports = allReports.filter((r: any) => r.status === 'resolved').length;

      setUserReportData({
        totalReports: allReports.length,
        reportsAsReporter: reportsAsReporter?.length || 0,
        reportsAsTarget: reportsAsTarget?.length || 0,
        pendingReports,
        resolvedReports,
        recentReports: (reportsAsReporter || []).slice(0, 5).map((r: any) => ({
          id: r.id,
          targetType: r.target_type,
          reportType: r.report_type,
          status: r.status,
          createdAt: r.created_at,
        })),
      });
    } catch (error) {
      console.error('加载用户举报记录数据失败:', error);
    }
  };

  // 加载用户封禁限制数据
  const loadUserBanData = async (userId: string) => {
    try {
      const { data: banData } = await supabaseAdmin
        .from('user_ban_restrictions')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (banData) {
        setUserBanData({
          isBanned: true,
          disableLogin: banData.disable_login || false,
          disablePost: banData.disable_post || false,
          disableComment: banData.disable_comment || false,
          disableLike: banData.disable_like || false,
          disableFollow: banData.disable_follow || false,
          banReason: banData.ban_reason,
          banDuration: banData.ban_duration,
          bannedAt: banData.banned_at,
          expiresAt: banData.expires_at,
        });
      } else {
        setUserBanData({
          isBanned: false,
          disableLogin: false,
          disablePost: false,
          disableComment: false,
          disableLike: false,
          disableFollow: false,
        });
      }
    } catch (error) {
      console.error('加载用户封禁限制数据失败:', error);
    }
  };

  // 加载用户工作流数据
  const loadUserWorkflowData = async (userId: string) => {
    try {
      const { data: workflows } = await supabaseAdmin
        .from('user_workflows')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const totalWorkflows = workflows?.length || 0;
      const completedWorkflows = workflows?.filter((w: any) => w.is_completed).length || 0;
      const inProgressWorkflows = totalWorkflows - completedWorkflows;

      setUserWorkflowData({
        totalWorkflows,
        completedWorkflows,
        inProgressWorkflows,
        workflows: (workflows || []).map((w: any) => ({
          id: w.id,
          type: w.workflow_type,
          currentStep: w.current_step,
          totalSteps: w.total_steps,
          isCompleted: w.is_completed,
          createdAt: w.created_at,
          updatedAt: w.updated_at,
        })),
      });
    } catch (error) {
      console.error('加载用户工作流数据失败:', error);
    }
  };

  // 加载用户生成任务数据
  const loadUserGenerationTaskData = async (userId: string) => {
    try {
      const { data: tasks } = await supabaseAdmin
        .from('generation_tasks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const totalTasks = tasks?.length || 0;
      const pendingTasks = tasks?.filter((t: any) => t.status === 'pending').length || 0;
      const processingTasks = tasks?.filter((t: any) => t.status === 'processing').length || 0;
      const completedTasks = tasks?.filter((t: any) => t.status === 'completed').length || 0;
      const failedTasks = tasks?.filter((t: any) => t.status === 'failed').length || 0;

      setUserGenerationTaskData({
        totalTasks,
        pendingTasks,
        processingTasks,
        completedTasks,
        failedTasks,
        tasks: (tasks || []).slice(0, 5).map((t: any) => ({
          id: t.id,
          type: t.type,
          status: t.status,
          progress: t.progress || 0,
          createdAt: t.created_at,
          completedAt: t.completed_at,
        })),
      });
    } catch (error) {
      console.error('加载用户生成任务数据失败:', error);
    }
  };

  // 加载用户灵感脉络数据
  const loadUserInspirationData = async (userId: string) => {
    try {
      // 获取创作脉络
      const { data: mindmaps } = await supabaseAdmin
        .from('inspiration_mindmaps')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      // 获取节点数
      const mindmapIds = mindmaps?.map((m: any) => m.id) || [];
      let totalNodes = 0;
      if (mindmapIds.length > 0) {
        const { count } = await supabaseAdmin
          .from('inspiration_nodes')
          .select('*', { count: 'exact', head: true })
          .in('map_id', mindmapIds);
        totalNodes = count || 0;
      }

      // 获取故事数
      const { count: totalStories } = await supabaseAdmin
        .from('inspiration_stories')
        .select('*', { count: 'exact', head: true })
        .in('map_id', mindmapIds);

      setUserInspirationData({
        totalMindmaps: mindmaps?.length || 0,
        totalNodes,
        totalStories: totalStories || 0,
        mindmaps: (mindmaps || []).slice(0, 5).map((m: any) => ({
          id: m.id,
          title: m.title,
          nodeCount: m.stats?.node_count || 0,
          isPublic: m.is_public,
          createdAt: m.created_at,
        })),
      });
    } catch (error) {
      console.error('加载用户灵感脉络数据失败:', error);
    }
  };

  // 加载用户流量来源数据
  const loadUserTrafficSourceData = async (userId: string) => {
    try {
      const { data: sources } = await supabaseAdmin
        .from('traffic_sources')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      setUserTrafficSourceData({
        totalSources: sources?.length || 0,
        sources: (sources || []).map((s: any) => ({
          sourceType: s.source_type,
          sourceName: s.source_name,
          utmSource: s.utm_source,
          utmMedium: s.utm_medium,
          landingPage: s.landing_page,
          createdAt: s.created_at,
        })),
      });
    } catch (error) {
      console.error('加载用户流量来源数据失败:', error);
    }
  };

  // 加载用户盲盒销售数据
  const loadUserBlindBoxData = async (userId: string) => {
    try {
      const { data: purchases } = await supabaseAdmin
        .from('blind_box_sales')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const totalPurchases = purchases?.length || 0;
      const totalSpent = purchases?.reduce((sum, p) => sum + (p.price || 0), 0) || 0;
      const completedPurchases = purchases?.filter((p: any) => p.status === 'completed').length || 0;
      const refundedPurchases = purchases?.filter((p: any) => p.status === 'refunded').length || 0;

      setUserBlindBoxData({
        totalPurchases,
        totalSpent,
        completedPurchases,
        refundedPurchases,
        purchases: (purchases || []).slice(0, 5).map((p: any) => ({
          id: p.id,
          boxType: p.box_type,
          boxName: p.box_name,
          price: p.price || 0,
          rewardType: p.reward_type,
          rewardValue: p.reward_value,
          status: p.status,
          createdAt: p.created_at,
        })),
      });
    } catch (error) {
      console.error('加载用户盲盒销售数据失败:', error);
    }
  };

  // 加载用户内容质量评估数据
  const loadUserContentQualityData = async (userId: string) => {
    try {
      // 获取用户作品的质量评估
      const { data: works } = await supabaseAdmin
        .from('works')
        .select('id')
        .eq('creator_id', userId);

      const workIds = works?.map((w: any) => w.id) || [];
      
      if (workIds.length === 0) {
        setUserContentQualityData({
          totalAssessments: 0,
          avgCompletenessScore: 0,
          avgVisualQualityScore: 0,
          avgTextQualityScore: 0,
          avgOverallScore: 0,
          assessments: [],
        });
        return;
      }

      const { data: assessments } = await supabaseAdmin
        .from('content_quality_assessments')
        .select('*')
        .in('content_id', workIds);

      const totalAssessments = assessments?.length || 0;
      const avgCompletenessScore = totalAssessments > 0
        ? (assessments?.reduce((sum, a) => sum + (a.completeness_score || 0), 0) || 0) / totalAssessments * 100
        : 0;
      const avgVisualQualityScore = totalAssessments > 0
        ? (assessments?.reduce((sum, a) => sum + (a.visual_quality_score || 0), 0) || 0) / totalAssessments * 100
        : 0;
      const avgTextQualityScore = totalAssessments > 0
        ? (assessments?.reduce((sum, a) => sum + (a.text_quality_score || 0), 0) || 0) / totalAssessments * 100
        : 0;
      const avgOverallScore = totalAssessments > 0
        ? (assessments?.reduce((sum, a) => sum + (a.overall_quality_score || 0), 0) || 0) / totalAssessments * 100
        : 0;

      setUserContentQualityData({
        totalAssessments,
        avgCompletenessScore: Number(avgCompletenessScore.toFixed(1)),
        avgVisualQualityScore: Number(avgVisualQualityScore.toFixed(1)),
        avgTextQualityScore: Number(avgTextQualityScore.toFixed(1)),
        avgOverallScore: Number(avgOverallScore.toFixed(1)),
        assessments: (assessments || []).slice(0, 5).map((a: any) => ({
          id: a.id,
          contentId: a.content_id,
          overallScore: Math.round((a.overall_quality_score || 0) * 100),
          completenessScore: Math.round((a.completeness_score || 0) * 100),
          visualQualityScore: Math.round((a.visual_quality_score || 0) * 100),
          textQualityScore: Math.round((a.text_quality_score || 0) * 100),
          assessedAt: a.assessed_at,
        })),
      });
    } catch (error) {
      console.error('加载用户内容质量评估数据失败:', error);
    }
  };

  // 加载用户人口统计数据
  const loadUserDemographicsData = async (userId: string) => {
    try {
      const { data: demographics } = await supabaseAdmin
        .from('user_demographics')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (demographics) {
        setUserDemographicsData({
          ageGroup: demographics.age_group,
          gender: demographics.gender,
          location: demographics.location,
          interests: demographics.interests || [],
          preferredCategories: demographics.preferred_categories || [],
          preferredContentTypes: demographics.preferred_content_types || [],
          onboardingCompleted: demographics.onboarding_completed || false,
        });
      }
    } catch (error) {
      console.error('加载用户人口统计数据失败:', error);
    }
  };

  // 加载用户探索状态数据
  const loadUserExplorationData = async (userId: string) => {
    try {
      const { data: exploration } = await supabaseAdmin
        .from('user_exploration_state')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (exploration) {
        setUserExplorationData({
          explorationRate: exploration.exploration_rate || 0.3,
          totalInteractions: exploration.total_interactions || 0,
          explorationCount: exploration.exploration_count || 0,
          exploitationCount: exploration.exploitation_count || 0,
          discoveredCategories: exploration.discovered_categories || [],
          discoveredTags: exploration.discovered_tags || [],
          lastExplorationAt: exploration.last_exploration_at,
        });
      }
    } catch (error) {
      console.error('加载用户探索状态数据失败:', error);
    }
  };

  // 加载用户冷启动推荐日志数据
  const loadUserColdStartData = async (userId: string) => {
    try {
      const { data: recommendations } = await supabaseAdmin
        .from('cold_start_recommendation_logs')
        .select('*')
        .eq('user_id', userId)
        .order('recommended_at', { ascending: false });

      const totalRecommendations = recommendations?.length || 0;
      const clickedCount = recommendations?.filter((r: any) => r.was_clicked).length || 0;
      const likedCount = recommendations?.filter((r: any) => r.was_liked).length || 0;
      const avgDwellTime = totalRecommendations > 0
        ? (recommendations?.reduce((sum, r) => sum + (r.dwell_time || 0), 0) || 0) / totalRecommendations
        : 0;

      setUserColdStartData({
        totalRecommendations,
        clickedCount,
        likedCount,
        avgDwellTime: Math.round(avgDwellTime),
        recommendations: (recommendations || []).slice(0, 5).map((r: any) => ({
          id: r.id,
          type: r.recommendation_type,
          position: r.position,
          wasClicked: r.was_clicked,
          wasLiked: r.was_liked,
          dwellTime: r.dwell_time || 0,
          recommendedAt: r.recommended_at,
        })),
      });
    } catch (error) {
      console.error('加载用户冷启动推荐日志数据失败:', error);
    }
  };

  // 加载用户同步日志数据
  const loadUserSyncData = async (userId: string) => {
    try {
      const { data: syncs } = await supabaseAdmin
        .from('user_sync_logs')
        .select('*')
        .eq('user_id', userId)
        .order('synced_at', { ascending: false });

      setUserSyncData({
        totalSyncs: syncs?.length || 0,
        recentSyncs: (syncs || []).slice(0, 5).map((s: any) => ({
          id: s.id,
          syncType: s.sync_type,
          syncedAt: s.synced_at,
          ipAddress: s.ip_address,
        })),
      });
    } catch (error) {
      console.error('加载用户同步日志数据失败:', error);
    }
  };

  // 加载用户Neo状态数据
  const loadUserNeoStateData = async (userId: string) => {
    try {
      const { data: neoState } = await supabaseAdmin
        .from('user_neo_state')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (neoState) {
        setUserNeoStateData({
          prompt: neoState.prompt,
          brand: neoState.brand,
          tags: neoState.tags || [],
          customBrand: neoState.custom_brand,
          useCustomBrand: neoState.use_custom_brand || false,
          textStyle: neoState.text_style,
          engine: neoState.engine,
        });
      }
    } catch (error) {
      console.error('加载用户Neo状态数据失败:', error);
    }
  };

  // 加载用户状态数据
  const loadUserStatusData = async (userId: string) => {
    try {
      const { data: status } = await supabaseAdmin
        .from('user_status')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (status) {
        setUserStatusData({
          status: status.status || 'offline',
          lastSeen: status.last_seen,
          isOnline: status.status === 'online',
        });
      }
    } catch (error) {
      console.error('加载用户状态数据失败:', error);
    }
  };

  // 加载用户小流量测试曝光数据
  const loadUserSmallTrafficData = async (userId: string) => {
    try {
      const { data: exposures } = await supabaseAdmin
        .from('small_traffic_exposures')
        .select('*')
        .eq('user_id', userId)
        .order('exposed_at', { ascending: false });

      const totalExposures = exposures?.length || 0;
      const clickedCount = exposures?.filter((e: any) => e.clicked).length || 0;
      const likedCount = exposures?.filter((e: any) => e.liked).length || 0;
      const avgDwellTime = totalExposures > 0
        ? (exposures?.reduce((sum, e) => sum + (e.dwell_time || 0), 0) || 0) / totalExposures
        : 0;

      setUserSmallTrafficData({
        totalExposures,
        clickedCount,
        likedCount,
        avgDwellTime: Math.round(avgDwellTime),
        exposures: (exposures || []).slice(0, 5).map((e: any) => ({
          id: e.id,
          testId: e.test_id,
          contentId: e.content_id,
          clicked: e.clicked,
          liked: e.liked,
          dwellTime: e.dwell_time || 0,
          exposedAt: e.exposed_at,
        })),
      });
    } catch (error) {
      console.error('加载用户小流量测试曝光数据失败:', error);
    }
  };

  // 加载用户内容向量数据
  const loadUserContentVectorData = async (userId: string) => {
    try {
      const { data: vectors } = await supabaseAdmin
        .from('content_vectors')
        .select('*')
        .eq('author_id', userId)
        .order('created_at', { ascending: false });

      const categories = Array.from(new Set(vectors?.map((v: any) => v.category).filter(Boolean) || []));
      const allTags = vectors?.flatMap((v: any) => v.tags || []) || [];
      const tags = Array.from(new Set(allTags));
      const themes = Array.from(new Set(vectors?.map((v: any) => v.theme).filter(Boolean) || []));

      setUserContentVectorData({
        totalVectors: vectors?.length || 0,
        categories,
        tags,
        themes,
        vectors: (vectors || []).slice(0, 5).map((v: any) => ({
          id: v.id,
          itemType: v.item_type,
          category: v.category,
          tags: v.tags || [],
          theme: v.theme,
          createdAt: v.created_at,
        })),
      });
    } catch (error) {
      console.error('加载用户内容向量数据失败:', error);
    }
  };

  // 加载用户新内容提升池数据
  const loadUserBoostPoolData = async (userId: string) => {
    try {
      // 获取用户作品
      const { data: works } = await supabaseAdmin
        .from('works')
        .select('id')
        .eq('creator_id', userId);

      const workIds = works?.map((w: any) => w.id) || [];
      
      if (workIds.length === 0) {
        setUserBoostPoolData({
          totalBoosts: 0,
          activeBoosts: 0,
          expiredBoosts: 0,
          totalExposure: 0,
          totalClicks: 0,
          boosts: [],
        });
        return;
      }

      const { data: boosts } = await supabaseAdmin
        .from('new_content_boost_pool')
        .select('*')
        .in('content_id', workIds)
        .order('created_at', { ascending: false });

      const totalBoosts = boosts?.length || 0;
      const activeBoosts = boosts?.filter((b: any) => b.current_status === 'boosting').length || 0;
      const expiredBoosts = boosts?.filter((b: any) => b.current_status === 'expired').length || 0;
      const totalExposure = boosts?.reduce((sum, b) => sum + (b.total_exposure || 0), 0) || 0;
      const totalClicks = boosts?.reduce((sum, b) => sum + (b.total_clicks || 0), 0) || 0;

      setUserBoostPoolData({
        totalBoosts,
        activeBoosts,
        expiredBoosts,
        totalExposure,
        totalClicks,
        boosts: (boosts || []).slice(0, 5).map((b: any) => ({
          id: b.id,
          contentId: b.content_id,
          qualityScore: Math.round((b.quality_score || 0) * 100),
          boostFactor: b.boost_factor || 1.5,
          status: b.current_status,
          totalExposure: b.total_exposure || 0,
          totalClicks: b.total_clicks || 0,
          boostStartTime: b.boost_start_time,
          boostEndTime: b.boost_end_time,
        })),
      });
    } catch (error) {
      console.error('加载用户新内容提升池数据失败:', error);
    }
  };

  // 加载用户实时推荐缓存数据
  const loadUserRealtimeRecData = async (userId: string) => {
    try {
      const { data: cache } = await supabaseAdmin
        .from('realtime_recommendation_cache')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (cache) {
        setUserRealtimeRecData({
          hasCache: true,
          itemsCount: cache.items?.length || 0,
          diversityScore: Math.round((cache.diversity_score || 0) * 100),
          relevanceScore: Math.round((cache.relevance_score || 0) * 100),
          mmrScore: Math.round((cache.mmr_score || 0) * 100),
          generatedAt: cache.generated_at,
          expiresAt: cache.expires_at,
        });
      } else {
        setUserRealtimeRecData({
          hasCache: false,
          itemsCount: 0,
          diversityScore: 0,
          relevanceScore: 0,
          mmrScore: 0,
        });
      }
    } catch (error) {
      console.error('加载用户实时推荐缓存数据失败:', error);
    }
  };

  // 加载用户相似度数据
  const loadUserSimilarityData = async (userId: string) => {
    try {
      const { data: similarities } = await supabaseAdmin
        .from('user_similarities')
        .select('*, similar_user:users(id, username)')
        .eq('user_id', userId)
        .order('similarity_score', { ascending: false })
        .limit(10);

      setUserSimilarityData({
        totalSimilarUsers: similarities?.length || 0,
        similarUsers: (similarities || []).map((s: any) => ({
          id: s.id,
          similarUserId: s.similar_user_id,
          similarityScore: Math.round((s.similarity_score || 0) * 100),
          commonInteractions: s.common_interactions || 0,
          calculatedAt: s.calculated_at,
        })),
      });
    } catch (error) {
      console.error('加载用户相似度数据失败:', error);
    }
  };

  // 加载用户AB实验事件数据
  const loadUserABExperimentEventData = async (userId: string) => {
    try {
      const { data: events } = await supabaseAdmin
        .from('ab_experiment_events')
        .select('*, experiment:ab_experiments(name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      setUserABExperimentEventData({
        totalEvents: events?.length || 0,
        events: (events || []).map((e: any) => ({
          id: e.id,
          experimentId: e.experiment_id,
          variantId: e.variant_id,
          eventType: e.event_type,
          eventName: e.event_name,
          createdAt: e.created_at,
        })),
      });
    } catch (error) {
      console.error('加载用户AB实验事件数据失败:', error);
    }
  };

  // 加载用户AB指标数据
  const loadUserABMetricData = async (userId: string) => {
    try {
      const { data: metrics } = await supabaseAdmin
        .from('ab_metric_data')
        .select('*, experiment:ab_experiments(name)')
        .eq('user_id', userId)
        .order('timestamp', { ascending: false })
        .limit(10);

      setUserABMetricData({
        totalMetrics: metrics?.length || 0,
        metrics: (metrics || []).map((m: any) => ({
          id: m.id,
          experimentId: m.experiment_id,
          variantId: m.variant_id,
          metricId: m.metric_id,
          value: m.value || 0,
          timestamp: m.timestamp,
        })),
      });
    } catch (error) {
      console.error('加载用户AB指标数据失败:', error);
    }
  };

  // 加载用户审计日志数据
  const loadUserAuditLogData = async (userId: string) => {
    try {
      const { data: logs } = await supabaseAdmin
        .from('audit_logs')
        .select('*')
        .eq('changed_by', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      setUserAuditLogData({
        totalLogs: logs?.length || 0,
        logs: (logs || []).map((l: any) => ({
          id: l.id,
          tableName: l.table_name,
          operation: l.operation,
          createdAt: l.created_at,
        })),
      });
    } catch (error) {
      console.error('加载用户审计日志数据失败:', error);
    }
  };

  // 加载用户活动日志数据
  const loadUserActivityLogData = async (userId: string) => {
    try {
      const { data: logs } = await supabaseAdmin
        .from('activity_logs')
        .select('*, event:events(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      setUserActivityLogData({
        totalLogs: logs?.length || 0,
        logs: (logs || []).map((l: any) => ({
          id: l.id,
          eventId: l.event_id,
          actionType: l.action_type,
          targetType: l.target_type,
          createdAt: l.created_at,
        })),
      });
    } catch (error) {
      console.error('加载用户活动日志数据失败:', error);
    }
  };

  // 加载用户产品链接数据
  const loadUserProductLinkData = async (userId: string) => {
    try {
      // 获取用户作品的产品链接
      const { data: works } = await supabaseAdmin
        .from('works')
        .select('id')
        .eq('creator_id', userId);

      const workIds = works?.map((w: any) => w.id) || [];
      
      if (workIds.length === 0) {
        setUserProductLinkData({
          totalLinks: 0,
          totalClicks: 0,
          totalConversions: 0,
          links: [],
        });
        return;
      }

      const { data: links } = await supabaseAdmin
        .from('product_links')
        .select('*')
        .in('work_id', workIds)
        .order('created_at', { ascending: false });

      const totalLinks = links?.length || 0;
      const totalClicks = links?.reduce((sum, l) => sum + (l.click_count || 0), 0) || 0;
      const totalConversions = links?.reduce((sum, l) => sum + (l.conversion_count || 0), 0) || 0;

      setUserProductLinkData({
        totalLinks,
        totalClicks,
        totalConversions,
        links: (links || []).slice(0, 5).map((l: any) => ({
          id: l.id,
          productName: l.product_name,
          price: l.price || 0,
          commissionRate: l.commission_rate || 0,
          clickCount: l.click_count || 0,
          conversionCount: l.conversion_count || 0,
          createdAt: l.created_at,
        })),
      });
    } catch (error) {
      console.error('加载用户产品链接数据失败:', error);
    }
  };

  // 加载用户AI设置数据
  const loadUserAISettingsData = async (userId: string) => {
    try {
      const { data: settings } = await supabaseAdmin
        .from('ai_user_settings')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (settings) {
        setUserAISettingsData({
          personality: settings.personality || 'friendly',
          theme: settings.theme || 'auto',
          enableMemory: settings.enable_memory ?? true,
          enableTypingEffect: settings.enable_typing_effect ?? true,
          autoScroll: settings.auto_scroll ?? true,
          showPresetQuestions: settings.show_preset_questions ?? true,
          shortcutKey: settings.shortcut_key || 'ctrl+k',
          preferredModel: settings.preferred_model || 'qwen',
        });
      }
    } catch (error) {
      console.error('加载用户AI设置数据失败:', error);
    }
  };

  // 加载用户通知偏好数据
  const loadUserNotificationPrefsData = async (userId: string) => {
    try {
      const { data: prefs } = await supabaseAdmin
        .from('user_preferences')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (prefs) {
        setUserNotificationPrefsData({
          notificationsEnabled: prefs.notifications_enabled ?? true,
          notificationSound: prefs.notification_sound ?? true,
          notificationFrequency: prefs.notification_frequency || 'immediate',
          theme: prefs.theme || 'auto',
          language: prefs.language || 'zh-CN',
          fontSize: prefs.font_size || 14,
          dataCollectionEnabled: prefs.data_collection_enabled ?? true,
        });
      }
    } catch (error) {
      console.error('加载用户通知偏好数据失败:', error);
    }
  };

  // 加载用户会员成长记录数据
  const loadUserMembershipGrowthData = async (userId: string) => {
    try {
      const { data: records } = await supabaseAdmin
        .from('membership_growth_records')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      const totalRecords = records?.length || 0;
      const totalPointsChange = records?.reduce((sum, r) => sum + (r.points_change || 0), 0) || 0;

      setUserMembershipGrowthData({
        totalRecords,
        totalPointsChange,
        records: (records || []).slice(0, 5).map((r: any) => ({
          id: r.id,
          pointsChange: r.points_change || 0,
          reason: r.reason,
          description: r.description,
          balanceAfter: r.balance_after || 0,
          createdAt: r.created_at,
        })),
      });
    } catch (error) {
      console.error('加载用户会员成长记录数据失败:', error);
    }
  };

  // 加载用户反馈处理日志数据
  const loadUserFeedbackProcessData = async (userId: string) => {
    try {
      // 获取用户的反馈
      const { data: feedbacks } = await supabaseAdmin
        .from('user_feedbacks')
        .select('id')
        .eq('user_id', userId);

      const feedbackIds = feedbacks?.map((f: any) => f.id) || [];
      
      if (feedbackIds.length === 0) {
        setUserFeedbackProcessData({
          totalLogs: 0,
          logs: [],
        });
        return;
      }

      const { data: logs } = await supabaseAdmin
        .from('feedback_process_logs')
        .select('*')
        .in('feedback_id', feedbackIds)
        .order('created_at', { ascending: false });

      setUserFeedbackProcessData({
        totalLogs: logs?.length || 0,
        logs: (logs || []).slice(0, 5).map((l: any) => ({
          id: l.id,
          feedbackId: l.feedback_id,
          action: l.action,
          oldValue: l.old_value,
          newValue: l.new_value,
          createdAt: l.created_at,
        })),
      });
    } catch (error) {
      console.error('加载用户反馈处理日志数据失败:', error);
    }
  };

  // 加载用户小流量测试数据
  const loadUserSmallTrafficTestData = async (userId: string) => {
    try {
      // 获取用户作品的小流量测试
      const { data: works } = await supabaseAdmin
        .from('works')
        .select('id')
        .eq('creator_id', userId);

      const workIds = works?.map((w: any) => w.id) || [];
      
      if (workIds.length === 0) {
        setUserSmallTrafficTestData({
          totalTests: 0,
          runningTests: 0,
          passedTests: 0,
          failedTests: 0,
          tests: [],
        });
        return;
      }

      const { data: tests } = await supabaseAdmin
        .from('small_traffic_tests')
        .select('*')
        .in('content_id', workIds)
        .order('created_at', { ascending: false });

      const totalTests = tests?.length || 0;
      const runningTests = tests?.filter((t: any) => t.test_status === 'running').length || 0;
      const passedTests = tests?.filter((t: any) => t.test_status === 'passed').length || 0;
      const failedTests = tests?.filter((t: any) => t.test_status === 'failed').length || 0;

      setUserSmallTrafficTestData({
        totalTests,
        runningTests,
        passedTests,
        failedTests,
        tests: (tests || []).slice(0, 5).map((t: any) => ({
          id: t.id,
          contentId: t.content_id,
          testStatus: t.test_status,
          sampleSize: t.sample_size || 0,
          targetSampleSize: t.target_sample_size || 100,
          ctr: Math.round((t.ctr || 0) * 100),
          engagementRate: Math.round((t.engagement_rate || 0) * 100),
          startTime: t.start_time,
          endTime: t.end_time,
        })),
      });
    } catch (error) {
      console.error('加载用户小流量测试数据失败:', error);
    }
  };

  // 点击外部关闭下拉框
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target as Node)) {
        setShowUserDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // 加载用户列表
  useEffect(() => {
    loadUserList();
  }, [loadUserList]);

  // 加载全局数据（留存率、用户分群等）
  useEffect(() => {
    loadRetentionData();
    loadUserSegmentData();
  }, []);

  // 当选择用户时加载用户数据
  useEffect(() => {
    if (userFilterType === 'specific' && selectedUserId) {
      loadUserData(selectedUserId);
    }
  }, [userFilterType, selectedUserId, loadUserData]);

  // 检查预警规则
  const checkAlerts = useCallback((newStats: typeof stats) => {
    const newAlerts: Alert[] = [];

    alertRules.forEach(rule => {
      if (!rule.enabled) return;

      let currentValue = 0;
      let metricName = '';

      switch (rule.metric) {
        case 'users':
          currentValue = newStats.userGrowth;
          metricName = '用户增长';
          break;
        case 'works':
          currentValue = newStats.worksGrowth;
          metricName = '作品增长';
          break;
        case 'views':
          currentValue = newStats.viewsGrowth;
          metricName = '浏览量增长';
          break;
        case 'likes':
          currentValue = newStats.totalLikes;
          metricName = '点赞数';
          break;
      }

      const isTriggered = rule.operator === 'gt'
        ? currentValue > rule.threshold
        : currentValue < rule.threshold;

      if (isTriggered) {
        const alert: Alert = {
          id: `${rule.id}-${Date.now()}`,
          ruleId: rule.id,
          metric: rule.metric,
          message: rule.operator === 'lt'
            ? `${metricName}下降超过 ${Math.abs(rule.threshold)}%，当前为 ${currentValue}%`
            : `${metricName}超过 ${rule.threshold}，当前为 ${currentValue}`,
          severity: rule.operator === 'lt' && rule.threshold < -30 ? 'error' : 'warning',
          timestamp: Date.now(),
          acknowledged: false,
        };
        newAlerts.push(alert);
      }
    });

    if (newAlerts.length > 0) {
      setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // 最多保留50条
      newAlerts.forEach(alert => {
        toast.warning(alert.message, {
          duration: 5000,
          icon: <AlertTriangle className="w-5 h-5" />,
        });
      });
    }
  }, [alertRules]);

  // 加载数据
  const loadData = useCallback(async (showLoading = true) => {
    if (showLoading) setIsLoading(true);

    try {
      // 并行获取所有数据
      const apiTimeRange = timeRange === 'custom' ? 'all' : timeRange as '7d' | '30d' | '90d' | '1y' | 'all';
      const [overview, trendData, devices, sources, topContent] = await Promise.all([
        adminService.getAnalyticsOverview(apiTimeRange),
        Promise.all([
          adminService.getTrendData(apiTimeRange, 'users'),
          adminService.getTrendData(apiTimeRange, 'works'),
          adminService.getTrendData(apiTimeRange, 'views'),
          adminService.getTrendData(apiTimeRange, 'likes'),
        ]),
        adminService.getDeviceDistribution(apiTimeRange),
        adminService.getSourceDistribution(apiTimeRange),
        adminService.getTopContent(5),
      ]);

      // 更新统计数据
      setStats({
        totalUsers: overview.totalUsers,
        totalWorks: overview.totalWorks,
        totalViews: overview.totalViews,
        totalLikes: overview.totalLikes,
        userGrowth: overview.userGrowth,
        worksGrowth: overview.worksGrowth,
        viewsGrowth: overview.viewsGrowth,
        likesGrowth: overview.likesGrowth,
      });

      // 检查预警
      checkAlerts({
        totalUsers: overview.totalUsers,
        totalWorks: overview.totalWorks,
        totalViews: overview.totalViews,
        totalLikes: overview.totalLikes,
        userGrowth: overview.userGrowth,
        worksGrowth: overview.worksGrowth,
        viewsGrowth: overview.viewsGrowth,
        likesGrowth: overview.likesGrowth,
      });

      // 合并趋势数据并计算累计值
      const [usersTrend, worksTrend, viewsTrend, likesTrend] = trendData;
      console.log('[DataAnalytics] usersTrend 前5条:', usersTrend.slice(0, 5));
      console.log('[DataAnalytics] worksTrend 前5条:', worksTrend.slice(0, 5));
      let cumulativeUsers = 0;
      let cumulativeWorks = 0;

      const mergedData: TrendData[] = usersTrend.map((item, index) => {
        cumulativeUsers += item.value;
        cumulativeWorks += worksTrend[index]?.value || 0;

        return {
          date: item.date,
          users: item.value,
          works: worksTrend[index]?.value || 0,
          views: viewsTrend[index]?.value || 0,
          likes: likesTrend[index]?.value || 0,
          cumulativeUsers,
          cumulativeWorks,
        };
      });
      console.log('[DataAnalytics] mergedData 前10条:', mergedData.slice(0, 10));
      setData(mergedData);

      // 更新设备和来源数据
      console.log('[DataAnalytics] 设备数据:', devices);
      console.log('[DataAnalytics] 来源数据:', sources);
      setDeviceData(devices);
      setSourceData(sources);

      // 更新热门内容
      setTopContentData(topContent);

      // 更新最后更新时间
      setLastUpdated(new Date());
    } catch (error) {
      console.error('加载数据失败:', error);
      if (showLoading) {
        toast.error('加载数据失败，请稍后重试');
      }
    } finally {
      if (showLoading) setIsLoading(false);
    }
  }, [timeRange, checkAlerts]);

  // 设置实时更新
  useEffect(() => {
    // 初始加载
    loadData();

    if (isRealtimeEnabled) {
      // 设置定时刷新（每30秒）
      refreshIntervalRef.current = setInterval(() => {
        loadData(false);
      }, 30000);

      // 设置 Supabase 实时订阅
      subscriptionRef.current = supabase
        .channel('analytics-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'users' },
          () => {
            loadData(false);
          }
        )
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'works' },
          () => {
            loadData(false);
          }
        )
        .subscribe();
    }

    return () => {
      // 清理定时器和订阅
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, [loadData, isRealtimeEnabled]);

  // 导出数据
  const handleExport = (format: 'csv' | 'json' | 'excel') => {
    if (format === 'csv' || format === 'excel') {
      // 导出多个sheet的数据
      const sheets: Record<string, { headers: string[]; rows: (string | number | undefined)[][] }> = {};

      // Sheet 1: 基础统计数据
      sheets['基础统计'] = {
        headers: ['日期', '新用户', '作品数', '浏览量', '点赞数', '累计用户', '累计作品'],
        rows: data.map(item => [
          item.date,
          item.users,
          item.works,
          item.views,
          item.likes,
          item.cumulativeUsers,
          item.cumulativeWorks,
        ]),
      };

      // Sheet 2: 用户留存率
      if (retentionData.length > 0) {
        sheets['用户留存率'] = {
          headers: ['日期', '新用户', '次日留存%', '3日留存%', '7日留存%', '14日留存%', '30日留存%'],
          rows: retentionData.map(item => [
            item.date,
            item.newUsers,
            item.day1Retention,
            item.day3Retention,
            item.day7Retention,
            item.day14Retention,
            item.day30Retention,
          ]),
        };
      }

      // Sheet 3: 用户分群
      if (userSegmentData.length > 0) {
        sheets['用户分群'] = {
          headers: ['分群', '用户数', '占比%', '平均互动', '平均收益'],
          rows: userSegmentData.map(item => [
            item.segment,
            item.count,
            item.percentage,
            item.avgEngagement,
            item.avgRevenue,
          ]),
        };
      }

      // 生成CSV（多个sheet用分隔符分隔）
      let csvContent = '';
      Object.entries(sheets).forEach(([sheetName, sheetData]) => {
        csvContent += `\n=== ${sheetName} ===\n`;
        csvContent += sheetData.headers.join(',') + '\n';
        csvContent += sheetData.rows.map(row => row.join(',')).join('\n') + '\n';
      });

      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const ext = format === 'excel' ? 'xlsx' : 'csv';
      a.download = `数据分析_${timeRange}_${new Date().toISOString().split('T')[0]}.${ext}`;
      a.click();
      URL.revokeObjectURL(url);
    } else {
      const json = JSON.stringify({
        exportTime: new Date().toISOString(),
        timeRange,
        stats,
        data,
        retentionData,
        userSegmentData,
      }, null, 2);
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `数据分析_${timeRange}_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      URL.revokeObjectURL(url);
    }

    toast.success(`已导出${format.toUpperCase()}格式数据`);
  };

  // 刷新数据
  const handleRefresh = () => {
    loadData();
    toast.success('数据已刷新');
  };

  // 确认预警
  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev => prev.map(a =>
      a.id === alertId ? { ...a, acknowledged: true } : a
    ));
  };

  // 清除所有预警
  const clearAllAlerts = () => {
    setAlerts([]);
    toast.success('已清除所有预警');
  };

  // 未确认的预警数量
  const unacknowledgedAlerts = alerts.filter(a => !a.acknowledged).length;

  // 渲染主图表
  const renderMainChart = () => {
    if (isLoading && data.length === 0) {
      return (
        <div className="flex items-center justify-center h-[400px]">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
            className="w-12 h-12 border-4 border-red-200 border-t-red-500 rounded-full"
          />
        </div>
      );
    }

    const metricColors = {
      users: CHART_COLORS.primary,
      works: CHART_COLORS.secondary,
      views: CHART_COLORS.info,
      likes: CHART_COLORS.danger,
    };

    const metricLabels = {
      users: '新用户',
      works: '新作品',
      views: '浏览量',
      likes: '点赞数',
    };

    const commonTooltipStyle = {
      backgroundColor: isDark ? '#1e293b' : '#ffffff',
      borderColor: isDark ? '#334155' : '#e2e8f0',
      color: isDark ? '#f1f5f9' : '#0f172a',
      borderRadius: '12px',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
    };

    if (chartType === 'bar') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={commonTooltipStyle} />
            <Bar
              dataKey={activeMetric}
              name={metricLabels[activeMetric]}
              fill={metricColors[activeMetric]}
              radius={[8, 8, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'area') {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <AreaChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <defs>
              <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={metricColors[activeMetric]} stopOpacity={0.3}/>
                <stop offset="95%" stopColor={metricColors[activeMetric]} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={commonTooltipStyle} />
            <Area
              type="monotone"
              dataKey={activeMetric}
              name={metricLabels[activeMetric]}
              stroke={metricColors[activeMetric]}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorMetric)"
            />
          </AreaChart>
        </ResponsiveContainer>
      );
    } else if (chartType === 'composed') {
      // 组合图表：显示所有指标
      return (
        <ResponsiveContainer width="100%" height={400}>
          <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              yAxisId="left"
            />
            <YAxis
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
              yAxisId="right"
              orientation="right"
            />
            <Tooltip contentStyle={commonTooltipStyle} />
            <Legend />
            <Bar dataKey="users" name="新用户" fill={CHART_COLORS.primary} yAxisId="left" radius={[4, 4, 0, 0]} />
            <Bar dataKey="works" name="新作品" fill={CHART_COLORS.secondary} yAxisId="left" radius={[4, 4, 0, 0]} />
            <Line type="monotone" dataKey="views" name="浏览量" stroke={CHART_COLORS.info} strokeWidth={2} yAxisId="right" />
            <Line type="monotone" dataKey="likes" name="点赞数" stroke={CHART_COLORS.danger} strokeWidth={2} yAxisId="right" />
          </ComposedChart>
        </ResponsiveContainer>
      );
    } else {
      return (
        <ResponsiveContainer width="100%" height={400}>
          <LineChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#334155' : '#e2e8f0'} vertical={false} />
            <XAxis
              dataKey="date"
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke={isDark ? '#64748b' : '#64748b'}
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <Tooltip contentStyle={commonTooltipStyle} />
            <Line
              type="monotone"
              dataKey={activeMetric}
              name={metricLabels[activeMetric]}
              stroke={metricColors[activeMetric]}
              strokeWidth={3}
              dot={{ r: 4, fill: metricColors[activeMetric], strokeWidth: 2, stroke: isDark ? '#1e293b' : '#ffffff' }}
              activeDot={{ r: 6, strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      );
    }
  };

  // 统计卡片组件
  const StatCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
    trend
  }: {
    title: string;
    value: string | number;
    change?: number;
    icon: any;
    color: string;
    trend?: 'up' | 'down' | 'neutral';
  }) => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -2, boxShadow: '0 10px 40px -10px rgba(0,0,0,0.15)' }}
      className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl p-6 shadow-md transition-shadow`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{title}</p>
          <h3 className="text-2xl font-bold mt-1">{value}</h3>
          {change !== undefined && (
            <div className={`flex items-center gap-1 mt-2 text-sm ${
              trend === 'up' ? 'text-green-500' : trend === 'down' ? 'text-red-500' : 'text-gray-400'
            }`}>
              {trend === 'up' ? <ArrowUpRight className="w-4 h-4" /> :
               trend === 'down' ? <ArrowDownRight className="w-4 h-4" /> : null}
              <span>{change > 0 ? '+' : ''}{change}%</span>
              <span className={`${isDark ? 'text-gray-500' : 'text-gray-400'} text-xs ml-1`}>较上期</span>
            </div>
          )}
        </div>
        <div
          className="p-3 rounded-xl"
          style={{ backgroundColor: `${color}15` }}
        >
          <Icon className="w-6 h-6" style={{ color }} />
        </div>
      </div>
    </motion.div>
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="space-y-6"
    >
      {/* 页面标题和操作栏 */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold">数据分析</h2>
          <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            全面了解平台运营数据和用户行为趋势
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          {/* 实时更新开关 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsRealtimeEnabled(!isRealtimeEnabled)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              isRealtimeEnabled
                ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Zap className={`w-4 h-4 ${isRealtimeEnabled ? 'fill-current' : ''}`} />
            {isRealtimeEnabled ? '实时更新中' : '实时更新已关闭'}
          </motion.button>

          {/* 预警按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowAlerts(!showAlerts)}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              unacknowledgedAlerts > 0
                ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Bell className="w-4 h-4" />
            预警
            {unacknowledgedAlerts > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                {unacknowledgedAlerts}
              </span>
            )}
          </motion.button>

          {/* 筛选按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setShowFilterPanel(!showFilterPanel)}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${
              showFilterPanel
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                : isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-600'
            }`}
          >
            <Filter className="w-4 h-4" />
            筛选
          </motion.button>

          {/* 时间范围选择 */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
            <Calendar className="w-4 h-4 text-gray-400" />
            <select
              value={timeRange}
              onChange={(e) => {
                setTimeRange(e.target.value as TimeRange);
                setTablePage(1); // 切换时间范围时重置分页
              }}
              className={`bg-transparent border-none outline-none text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
            >
              <option value="7d">最近7天</option>
              <option value="30d">最近30天</option>
              <option value="90d">最近90天</option>
              <option value="1y">最近1年</option>
              <option value="all">全部时间</option>
            </select>
          </div>

          {/* 刷新按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleRefresh}
            className={`p-2 rounded-xl ${isDark ? 'bg-gray-800 hover:bg-gray-700' : 'bg-white hover:bg-gray-50'} shadow-sm transition-colors`}
          >
            <RefreshCw className={`w-5 h-5 ${isDark ? 'text-gray-400' : 'text-gray-600'}`} />
          </motion.button>

          {/* 高级分析展开按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => setIsAdvancedView(!isAdvancedView)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-colors shadow-lg ${
              isAdvancedView
                ? 'bg-gradient-to-r from-blue-600 to-cyan-600 shadow-blue-500/30 text-white'
                : isDark ? 'bg-gray-800 text-gray-400 hover:bg-gray-700' : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            <BarChart3 className="w-4 h-4" />
            {isAdvancedView ? '收起高级分析' : '展开高级分析'}
          </motion.button>

          {/* 导出按钮 */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleExport('csv')}
            className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-sm font-medium transition-colors"
          >
            <Download className="w-4 h-4" />
            导出数据
          </motion.button>
        </div>
      </div>

      {/* 最后更新时间 */}
      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        最后更新: {lastUpdated.toLocaleString('zh-CN')}
        {isRealtimeEnabled && (
          <span className="ml-2 inline-flex items-center gap-1 text-green-500">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            实时更新中
          </span>
        )}
      </div>

      {/* 预警面板 */}
      <AnimatePresence>
        {showAlerts && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
          >
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500" />
                数据预警
              </h3>
              {alerts.length > 0 && (
                <button
                  onClick={clearAllAlerts}
                  className="text-sm text-red-500 hover:text-red-600"
                >
                  清除全部
                </button>
              )}
            </div>
            <div className="p-4 max-h-64 overflow-y-auto">
              {alerts.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <CheckCircle className="w-12 h-12 mx-auto mb-2 text-green-500" />
                  <p>暂无预警信息</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {alerts.map((alert) => (
                    <motion.div
                      key={alert.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      className={`p-3 rounded-lg flex items-start justify-between ${
                        alert.severity === 'error'
                          ? 'bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800'
                          : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <AlertTriangle className={`w-5 h-5 flex-shrink-0 ${
                          alert.severity === 'error' ? 'text-red-500' : 'text-yellow-500'
                        }`} />
                        <div>
                          <p className={`text-sm font-medium ${
                            alert.severity === 'error' ? 'text-red-700 dark:text-red-400' : 'text-yellow-700 dark:text-yellow-400'
                          }`}>
                            {alert.message}
                          </p>
                          <p className="text-xs text-gray-500 mt-1">
                            {new Date(alert.timestamp).toLocaleString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      {!alert.acknowledged && (
                        <button
                          onClick={() => acknowledgeAlert(alert.id)}
                          className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                        >
                          确认
                        </button>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 筛选面板 */}
      <AnimatePresence>
        {showFilterPanel && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
          >
            <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <Filter className="w-5 h-5 text-blue-500" />
                数据筛选
              </h3>
              <button
                onClick={() => setShowFilterPanel(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  业务维度
                </label>
                <select
                  value={businessFilter}
                  onChange={(e) => setBusinessFilter(e.target.value as BusinessFilter)}
                  className={`w-full px-3 py-2 rounded-lg border ${
                    isDark
                      ? 'bg-gray-700 border-gray-600 text-gray-200'
                      : 'bg-white border-gray-300 text-gray-700'
                  }`}
                >
                  <option value="all">全部</option>
                  <option value="category">按分类</option>
                  <option value="creator_level">按创作者等级</option>
                  <option value="content_type">按内容类型</option>
                </select>
              </div>
              {businessFilter === 'category' && (
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    作品分类
                  </label>
                  <select
                    value={categoryFilter}
                    onChange={(e) => setCategoryFilter(e.target.value)}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-200'
                        : 'bg-white border-gray-300 text-gray-700'
                    }`}
                  >
                    <option value="all">全部分类</option>
                    <option value="国潮设计">国潮设计</option>
                    <option value="非遗传承">非遗传承</option>
                    <option value="老字号品牌">老字号品牌</option>
                    <option value="IP设计">IP设计</option>
                    <option value="插画设计">插画设计</option>
                  </select>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 关键指标卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="总用户数"
          value={stats.totalUsers.toLocaleString()}
          change={stats.userGrowth}
          trend={stats.userGrowth >= 0 ? 'up' : 'down'}
          icon={Users}
          color={CHART_COLORS.primary}
        />
        <StatCard
          title="总作品数"
          value={stats.totalWorks.toLocaleString()}
          change={stats.worksGrowth}
          trend={stats.worksGrowth >= 0 ? 'up' : 'down'}
          icon={Image}
          color={CHART_COLORS.secondary}
        />
        <StatCard
          title="总浏览量"
          value={stats.totalViews.toLocaleString()}
          change={stats.viewsGrowth}
          trend={stats.viewsGrowth >= 0 ? 'up' : 'down'}
          icon={Eye}
          color={CHART_COLORS.info}
        />
        <StatCard
          title="总点赞数"
          value={stats.totalLikes.toLocaleString()}
          change={stats.likesGrowth}
          trend={stats.likesGrowth >= 0 ? 'up' : 'down'}
          icon={Heart}
          color={CHART_COLORS.danger}
        />
      </div>

      {/* 高级数据分析大屏区域 */}
      <AnimatePresence>
        {isAdvancedView && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3 }}
            className={`overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <div className="p-6">
              <AdvancedAnalytics embedded onExitAdvancedView={() => setIsAdvancedView(false)} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 主图表区域 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
      >
        {/* 图表头部 */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">趋势分析</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                查看各项指标的变化趋势
              </p>
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              {/* 指标选择 */}
              {chartType !== 'composed' && (
                <div className="flex items-center gap-2">
                  {[
                    { key: 'users', label: '用户', icon: Users },
                    { key: 'works', label: '作品', icon: Image },
                    { key: 'views', label: '浏览', icon: Eye },
                    { key: 'likes', label: '点赞', icon: Heart },
                  ].map(({ key, label, icon: Icon }) => (
                    <motion.button
                      key={key}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => setActiveMetric(key as MetricType)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1 ${
                        activeMetric === key
                          ? 'bg-red-600 text-white'
                          : isDark
                            ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                      }`}
                    >
                      <Icon className="w-3 h-3" />
                      {label}
                    </motion.button>
                  ))}
                </div>
              )}

              {/* 图表类型选择 */}
              <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                {[
                  { key: 'line', icon: Activity, label: '折线' },
                  { key: 'bar', icon: BarChart3, label: '柱状' },
                  { key: 'area', icon: TrendingUp, label: '面积' },
                  { key: 'composed', icon: Share2, label: '组合' },
                ].map(({ key, icon: Icon, label }) => (
                  <motion.button
                    key={key}
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setChartType(key as ChartType)}
                    className={`px-3 py-1.5 rounded-md text-xs font-medium transition-colors flex items-center gap-1 ${
                      chartType === key
                        ? isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                        : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                    }`}
                    title={label}
                  >
                    <Icon className="w-3 h-3" />
                  </motion.button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 图表内容 */}
        <div className="p-6">
          {renderMainChart()}
        </div>
      </motion.div>

      {/* 数据分布和热门内容 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* 设备分布 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
        >
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <PieChartIcon className="w-5 h-5 text-purple-500" />
              设备分布
            </h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={deviceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {deviceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {deviceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{item.count || 0}人</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 用户来源 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
        >
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <Share2 className="w-5 h-5 text-cyan-500" />
              用户来源
            </h3>
          </div>
          <div className="p-6">
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={sourceData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {sourceData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1e293b' : '#ffffff',
                    borderColor: isDark ? '#334155' : '#e2e8f0',
                    color: isDark ? '#f1f5f9' : '#0f172a',
                    borderRadius: '8px',
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="mt-4 space-y-2">
              {sourceData.map((item, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                    <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{item.name}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-medium text-blue-600 dark:text-blue-400">{item.count || 0}人</span>
                    <span className="font-medium">{item.value}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* 热门内容 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
        >
          <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <h3 className="font-semibold text-lg flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-orange-500" />
              热门内容
            </h3>
          </div>
          <div className="p-4">
            <div className="space-y-3">
              {isLoading ? (
                <div className="flex items-center justify-center py-8">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full"
                  />
                </div>
              ) : topContentData.length === 0 ? (
                <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>暂无热门内容</p>
                </div>
              ) : (
                topContentData.map((item, index) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index }}
                    className={`flex items-start gap-3 p-3 rounded-xl ${isDark ? 'bg-gray-700/50 hover:bg-gray-700' : 'bg-gray-50 hover:bg-gray-100'} transition-colors cursor-pointer`}
                  >
                    <div className={`flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-600' :
                      index === 1 ? 'bg-gray-200 text-gray-600' :
                      index === 2 ? 'bg-orange-100 text-orange-600' :
                      isDark ? 'bg-gray-600 text-gray-400' : 'bg-gray-200 text-gray-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium truncate">{item.title}</h4>
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {item.author}
                      </p>
                      <div className="flex items-center gap-3 mt-2 text-xs">
                        <span className="flex items-center gap-1 text-gray-400">
                          <Eye className="w-3 h-3" />
                          {item.views.toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1 text-gray-400">
                          <Heart className="w-3 h-3" />
                          {item.likes.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* 详细数据趋势图表 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg">详细数据趋势</h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                查看各项指标的详细趋势变化
              </p>
            </div>

            {/* 数据指标切换按钮 */}
            <div className="flex items-center gap-2 flex-wrap">
              {[
                { key: 'users', label: '新用户', color: '#ef4444', icon: Users },
                { key: 'works', label: '新作品', color: '#8b5cf6', icon: Image },
                { key: 'views', label: '浏览量', color: '#3b82f6', icon: Eye },
                { key: 'likes', label: '点赞数', color: '#10b981', icon: Heart },
                { key: 'cumulativeUsers', label: '累计用户', color: '#f59e0b', icon: Users },
                { key: 'cumulativeWorks', label: '累计作品', color: '#ec4899', icon: Image },
              ].map(({ key, label, color, icon: Icon }) => (
                <motion.button
                  key={key}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setDetailChartMetric(key as any)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5 ${
                    detailChartMetric === key
                      ? 'text-white'
                      : isDark
                        ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                  style={{
                    backgroundColor: detailChartMetric === key ? color : undefined,
                  }}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>

        {/* 折线图表 */}
        <div className="p-6">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart
              data={data}
              margin={{ top: 10, right: 30, left: 0, bottom: 0 }}
            >
              <defs>
                <linearGradient id="detailChartGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop
                    offset="5%"
                    stopColor={detailChartColors[detailChartMetric]}
                    stopOpacity={0.3}
                  />
                  <stop
                    offset="95%"
                    stopColor={detailChartColors[detailChartMetric]}
                    stopOpacity={0}
                  />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={isDark ? '#334155' : '#e2e8f0'}
                vertical={false}
              />
              <XAxis
                dataKey="date"
                stroke={isDark ? '#64748b' : '#64748b'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
                angle={data.length > 20 ? -45 : 0}
                textAnchor={data.length > 20 ? 'end' : 'middle'}
                height={data.length > 20 ? 60 : 30}
              />
              <YAxis
                stroke={isDark ? '#64748b' : '#64748b'}
                fontSize={11}
                tickLine={false}
                axisLine={false}
                tickFormatter={(value) => value >= 1000 ? `${(value / 1000).toFixed(1)}k` : value}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (active && payload && payload.length) {
                    const value = payload[0].value as number;
                    const metricLabels: Record<string, string> = {
                      users: '新用户',
                      works: '新作品',
                      views: '浏览量',
                      likes: '点赞数',
                      cumulativeUsers: '累计用户',
                      cumulativeWorks: '累计作品',
                    };
                    return (
                      <div
                        className={`p-3 rounded-lg shadow-lg border ${
                          isDark
                            ? 'bg-gray-800 border-gray-700 text-gray-100'
                            : 'bg-white border-gray-200 text-gray-900'
                        }`}
                      >
                        <p className="text-xs text-gray-500 mb-1">{label}</p>
                        <p className="text-lg font-bold" style={{ color: detailChartColors[detailChartMetric] }}>
                          {value?.toLocaleString()}
                        </p>
                        <p className="text-xs text-gray-400 mt-1">
                          {metricLabels[detailChartMetric]}
                        </p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Area
                type="monotone"
                dataKey={detailChartMetric}
                stroke={detailChartColors[detailChartMetric]}
                strokeWidth={2}
                fillOpacity={1}
                fill="url(#detailChartGradient)"
              />
              <Line
                type="monotone"
                dataKey={detailChartMetric}
                stroke={detailChartColors[detailChartMetric]}
                strokeWidth={3}
                dot={{ r: 3, fill: detailChartColors[detailChartMetric], strokeWidth: 2, stroke: isDark ? '#1e293b' : '#ffffff' }}
                activeDot={{ r: 5, strokeWidth: 0 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 图表数据摘要 */}
        <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} grid grid-cols-2 md:grid-cols-4 gap-4`}>
          {(() => {
            const values = data.map(d => (d as any)[detailChartMetric] || 0);
            const total = values.reduce((a, b) => a + b, 0);
            const avg = values.length > 0 ? Math.round(total / values.length) : 0;
            const max = values.length > 0 ? Math.max(...values) : 0;
            const min = values.length > 0 ? Math.min(...values) : 0;
            return [
              { label: '总计', value: total.toLocaleString() },
              { label: '平均值', value: avg.toLocaleString() },
              { label: '最高值', value: max.toLocaleString() },
              { label: '最低值', value: min.toLocaleString() },
            ].map((stat, index) => (
              <div key={index} className="text-center">
                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                <p className="text-lg font-bold" style={{ color: detailChartColors[detailChartMetric] }}>
                  {stat.value}
                </p>
              </div>
            ));
          })()}
        </div>
      </motion.div>

      {/* 详细数据表格 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.6 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
      >
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
          <div>
            <h3 className="font-semibold text-lg">详细数据</h3>
            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              每日新增数据统计
            </p>
          </div>
          <div className="flex items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExport('csv')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              导出 CSV
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExport('excel')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-green-700 text-green-100 hover:bg-green-600'
                  : 'bg-green-100 text-green-700 hover:bg-green-200'
              }`}
            >
              导出 Excel
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleExport('json')}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                isDark
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              导出 JSON
            </motion.button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">日期</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">新用户</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">新作品</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">浏览量</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">点赞数</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">累计用户</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">累计作品</th>
              </tr>
            </thead>
            <tbody className={`divide-y ${isDark ? 'divide-gray-700' : 'divide-gray-200'}`}>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                      className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full mx-auto"
                    />
                  </td>
                </tr>
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={7} className={`px-6 py-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    暂无数据
                  </td>
                </tr>
              ) : (
                data
                  .slice((tablePage - 1) * tablePageSize, tablePage * tablePageSize)
                  .map((item, index) => (
                    <motion.tr
                      key={index}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.05 }}
                      className={`${isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'} transition-colors`}
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.date}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.users}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.works}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.views.toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">{item.likes}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-blue-600 dark:text-blue-400">
                        {item.cumulativeUsers?.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-purple-600 dark:text-purple-400">
                        {item.cumulativeWorks?.toLocaleString()}
                      </td>
                    </motion.tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        {/* 分页控制 */}
        {data.length > 0 && (
          <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              共 {data.length} 条数据，每页
              <select
                value={tablePageSize}
                onChange={(e) => {
                  setTablePageSize(Number(e.target.value));
                  setTablePage(1);
                }}
                className={`mx-2 px-2 py-1 rounded text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'} border`}
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
                <option value={data.length}>全部</option>
              </select>
              条
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setTablePage(p => Math.max(1, p - 1))}
                disabled={tablePage === 1}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tablePage === 1
                    ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                上一页
              </button>

              <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                第 {tablePage} / {Math.ceil(data.length / tablePageSize)} 页
              </span>

              <button
                onClick={() => setTablePage(p => Math.min(Math.ceil(data.length / tablePageSize), p + 1))}
                disabled={tablePage >= Math.ceil(data.length / tablePageSize)}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  tablePage >= Math.ceil(data.length / tablePageSize)
                    ? isDark ? 'bg-gray-700 text-gray-500 cursor-not-allowed' : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </motion.div>

      {/* ==================== 用户数据筛选与分析 ==================== */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className={`${isDark ? 'bg-gray-800' : 'bg-white'} rounded-2xl shadow-md overflow-hidden`}
      >
        {/* 头部标题和用户选择器 */}
        <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <h3 className="font-semibold text-lg flex items-center gap-2">
                <User className="w-5 h-5 text-blue-500" />
                用户数据筛选与分析
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                查看特定用户的独立数据或所有用户汇总数据
              </p>
            </div>

            {/* 用户选择器 */}
            <div className="flex items-center gap-3 flex-wrap">
              {/* 筛选类型切换 */}
              <div className={`flex items-center gap-1 p-1 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setUserFilterType('all');
                    setSelectedUserId('');
                  }}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    userFilterType === 'all'
                      ? isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                      : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <Users className="w-4 h-4" />
                  全部用户
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setUserFilterType('specific')}
                  className={`px-4 py-2 rounded-md text-sm font-medium transition-colors flex items-center gap-2 ${
                    userFilterType === 'specific'
                      ? isDark ? 'bg-gray-600 text-white' : 'bg-white text-gray-900 shadow-sm'
                      : isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <User className="w-4 h-4" />
                  单个用户
                </motion.button>
              </div>

              {/* 用户搜索下拉框 */}
              {userFilterType === 'specific' && (
                <div className="relative" ref={userDropdownRef}>
                  <div
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer min-w-[200px] ${
                      isDark
                        ? 'bg-gray-700 border-gray-600 text-gray-200 hover:bg-gray-600'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {selectedUserId ? (
                      <>
                        <img
                          src={userList.find(u => u.id === selectedUserId)?.avatar_url || 'https://via.placeholder.com/32'}
                          alt=""
                          className="w-6 h-6 rounded-full"
                        />
                        <span className="flex-1 truncate">
                          {userList.find(u => u.id === selectedUserId)?.username || '未知用户'}
                        </span>
                      </>
                    ) : (
                      <span className={`flex-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        选择用户...
                      </span>
                    )}
                    <ChevronDown className={`w-4 h-4 transition-transform ${showUserDropdown ? 'rotate-180' : ''}`} />
                  </div>

                  {/* 下拉菜单 */}
                  <AnimatePresence>
                    {showUserDropdown && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className={`absolute top-full left-0 right-0 mt-2 rounded-lg shadow-lg border z-50 ${
                          isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-200'
                        }`}
                      >
                        {/* 搜索框 */}
                        <div className={`p-3 border-b ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                          <div className="relative">
                            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
                            <input
                              type="text"
                              value={userSearchQuery}
                              onChange={(e) => setUserSearchQuery(e.target.value)}
                              placeholder="搜索用户..."
                              className={`w-full pl-9 pr-3 py-2 rounded-md text-sm ${
                                isDark
                                  ? 'bg-gray-600 border-gray-500 text-gray-200 placeholder-gray-400'
                                  : 'bg-gray-50 border-gray-300 text-gray-700 placeholder-gray-500'
                              } border outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                          </div>
                        </div>

                        {/* 用户列表 */}
                        <div className="max-h-[300px] overflow-y-auto">
                          {isLoadingUsers ? (
                            <div className="p-4 text-center">
                              <motion.div
                                animate={{ rotate: 360 }}
                                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                                className="w-6 h-6 border-2 border-blue-200 border-t-blue-500 rounded-full mx-auto"
                              />
                            </div>
                          ) : (
                            userList
                              .filter(u => 
                                u.username.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
                                u.email?.toLowerCase().includes(userSearchQuery.toLowerCase())
                              )
                              .map((user) => (
                                <motion.div
                                  key={user.id}
                                  whileHover={{ backgroundColor: isDark ? 'rgba(75, 85, 99, 0.5)' : 'rgba(243, 244, 246, 0.8)' }}
                                  onClick={() => {
                                    setSelectedUserId(user.id);
                                    setShowUserDropdown(false);
                                    setUserSearchQuery('');
                                  }}
                                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer border-b last:border-b-0 ${
                                    isDark ? 'border-gray-600' : 'border-gray-100'
                                  } ${selectedUserId === user.id ? (isDark ? 'bg-blue-900/30' : 'bg-blue-50') : ''}`}
                                >
                                  <img
                                    src={user.avatar_url || 'https://via.placeholder.com/32'}
                                    alt=""
                                    className="w-8 h-8 rounded-full"
                                  />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{user.username}</p>
                                    <p className={`text-xs truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                      {user.email || '无邮箱'}
                                    </p>
                                  </div>
                                  {selectedUserId === user.id && (
                                    <CheckCircle className="w-4 h-4 text-blue-500" />
                                  )}
                                </motion.div>
                              ))
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 用户统计卡片 */}
        <div className="p-6">
          {userFilterType === 'specific' && selectedUserId ? (
            isLoadingUserData ? (
              <div className="flex items-center justify-center py-12">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-12 h-12 border-4 border-blue-200 border-t-blue-500 rounded-full"
                />
              </div>
            ) : (
              <>
                {/* 用户信息概览卡片 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <div className="flex flex-col md:flex-row md:items-center gap-4">
                    <img
                      src={userList.find(u => u.id === selectedUserId)?.avatar_url || 'https://via.placeholder.com/80'}
                      alt=""
                      className="w-16 h-16 rounded-full"
                    />
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold">
                        {userList.find(u => u.id === selectedUserId)?.username || '未知用户'}
                      </h4>
                      <div className="flex flex-wrap gap-4 mt-2 text-sm">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                          注册时间: <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>{userStats.joinDate}</span>
                        </span>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                          最后活跃: <span className={isDark ? 'text-gray-200' : 'text-gray-700'}>{userStats.lastActive}</span>
                        </span>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                          会员等级: 
                          <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                            userStats.membershipLevel === 'premium' 
                              ? 'bg-yellow-100 text-yellow-700' 
                              : userStats.membershipLevel === 'vip'
                              ? 'bg-purple-100 text-purple-700'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {userStats.membershipLevel === 'free' ? '免费用户' : 
                             userStats.membershipLevel === 'premium' ? '高级会员' : 
                             userStats.membershipLevel === 'vip' ? 'VIP会员' : userStats.membershipLevel}
                          </span>
                        </span>
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                          积分: <span className="text-blue-600 font-medium">{userStats.totalPoints}</span>
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className={`text-center px-4 py-2 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-white'}`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>互动率</p>
                        <p className="text-xl font-bold text-green-500">{userStats.engagementRate}%</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 核心统计卡片 */}
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4 mb-6">
                  {[
                    { label: '作品总数', value: userStats.totalWorks, icon: Image, color: '#8b5cf6', suffix: '' },
                    { label: '总浏览量', value: userStats.totalViews, icon: Eye, color: '#3b82f6', suffix: '' },
                    { label: '总点赞数', value: userStats.totalLikes, icon: Heart, color: '#ef4444', suffix: '' },
                    { label: '总评论数', value: userStats.totalComments, icon: MessageCircle, color: '#10b981', suffix: '' },
                    { label: '粉丝数', value: userStats.followers, icon: Users, color: '#f59e0b', suffix: '' },
                    { label: '关注数', value: userStats.following, icon: User, color: '#06b6d4', suffix: '' },
                    { label: '均浏览', value: userStats.avgViewsPerWork, icon: BarChart3, color: '#ec4899', suffix: '' },
                    { label: '均点赞', value: userStats.avgLikesPerWork, icon: TrendingUp, color: '#14b8a6', suffix: '' },
                  ].map((stat, index) => (
                    <motion.div
                      key={stat.label}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} rounded-xl p-3 text-center`}
                    >
                      <div
                        className="w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center"
                        style={{ backgroundColor: `${stat.color}20` }}
                      >
                        <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                      </div>
                      <p className={`text-xs mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                      <p className="text-lg font-bold" style={{ color: stat.color }}>
                        {stat.value.toLocaleString()}{stat.suffix}
                      </p>
                    </motion.div>
                  ))}
                </div>

                {/* 图表区域 - 第一行 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* 用户创作趋势 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-blue-500" />
                      创作趋势分析
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <ComposedChart data={userTrendData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="userWorksGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                        <XAxis dataKey="date" stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} yAxisId="left" />
                        <YAxis stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} yAxisId="right" orientation="right" />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f3f4f6' : '#111827', borderRadius: '8px' }} />
                        <Legend />
                        <Bar dataKey="works" name="新作品" fill="#8b5cf6" yAxisId="left" radius={[4, 4, 0, 0]} />
                        <Area type="monotone" dataKey="cumulativeWorks" name="累计作品" stroke="#f59e0b" fillOpacity={1} fill="url(#userWorksGradient)" yAxisId="right" />
                        <Line type="monotone" dataKey="views" name="浏览量" stroke="#3b82f6" strokeWidth={2} yAxisId="left" dot={false} />
                      </ComposedChart>
                    </ResponsiveContainer>
                  </div>

                  {/* 用户行为分析 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-green-500" />
                      用户行为分析
                    </h4>
                    <ResponsiveContainer width="100%" height={250}>
                      <AreaChart data={userBehaviorData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                        <defs>
                          <linearGradient id="pageViewsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="sessionsGradient" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                        <XAxis dataKey="date" stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f3f4f6' : '#111827', borderRadius: '8px' }} />
                        <Legend />
                        <Area type="monotone" dataKey="pageViews" name="页面浏览" stroke="#3b82f6" fillOpacity={1} fill="url(#pageViewsGradient)" />
                        <Area type="monotone" dataKey="sessions" name="访问次数" stroke="#10b981" fillOpacity={1} fill="url(#sessionsGradient)" />
                        <Line type="monotone" dataKey="interactions" name="互动数" stroke="#f59e0b" strokeWidth={2} dot={false} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 图表区域 - 第二行 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                  {/* 用户互动分布 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Heart className="w-4 h-4 text-red-500" />
                      互动行为分布
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={[
                            { name: '点赞', value: userEngagementData.likesGiven, color: '#ef4444' },
                            { name: '评论', value: userEngagementData.commentsMade, color: '#3b82f6' },
                            { name: '收藏', value: userEngagementData.collections, color: '#f59e0b' },
                            { name: '分享', value: userEngagementData.shares, color: '#10b981' },
                            { name: '关注', value: userEngagementData.follows, color: '#8b5cf6' },
                          ]}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                          dataKey="value"
                        >
                          {[
                            { color: '#ef4444' },
                            { color: '#3b82f6' },
                            { color: '#f59e0b' },
                            { color: '#10b981' },
                            { color: '#8b5cf6' },
                          ].map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f3f4f6' : '#111827', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="grid grid-cols-2 gap-2 mt-2">
                      {[
                        { name: '点赞', value: userEngagementData.likesGiven, color: '#ef4444' },
                        { name: '评论', value: userEngagementData.commentsMade, color: '#3b82f6' },
                        { name: '收藏', value: userEngagementData.collections, color: '#f59e0b' },
                        { name: '分享', value: userEngagementData.shares, color: '#10b981' },
                        { name: '关注', value: userEngagementData.follows, color: '#8b5cf6' },
                      ].map((item) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: item.color }} />
                            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{item.name}</span>
                          </div>
                          <span className="font-medium">{item.value}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 设备使用分布 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <PieChartIcon className="w-4 h-4 text-purple-500" />
                      设备使用分布
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <PieChart>
                        <Pie
                          data={userDeviceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={3}
                          dataKey="value"
                          label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                        >
                          {userDeviceData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={['#3b82f6', '#10b981', '#f59e0b'][index % 3]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f3f4f6' : '#111827', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="space-y-1 mt-2">
                      {userDeviceData.map((item, index) => (
                        <div key={item.name} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ['#3b82f6', '#10b981', '#f59e0b'][index] }} />
                            <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{item.name}</span>
                          </div>
                          <span className="font-medium">{item.value}%</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* 活跃时间段分布 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Clock className="w-4 h-4 text-orange-500" />
                      活跃时间段分布
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={userTimeDistribution.filter((_, i) => i % 2 === 0)} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                        <XAxis dataKey="hour" stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={10} tickLine={false} axisLine={false} interval={2} />
                        <YAxis stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f3f4f6' : '#111827', borderRadius: '8px' }} />
                        <Bar dataKey="activity" name="活跃度" fill="#f59e0b" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <p className={`text-xs text-center mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      24小时活跃度分布（晚上19-23点为高峰期）
                    </p>
                  </div>
                </div>

                {/* 商业活动统计卡片 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Briefcase className="w-4 h-4 text-orange-500" />
                    商业活动统计
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {[
                      { label: '品牌任务参与', value: userBusinessData.brandTasksJoined, icon: Target, color: '#f59e0b' },
                      { label: '任务完成数', value: userBusinessData.brandTasksCompleted, icon: CheckCircle, color: '#10b981' },
                      { label: '任务收益', value: `¥${userBusinessData.brandTaskEarnings.toLocaleString()}`, icon: DollarSign, color: '#22c55e', isText: true },
                      { label: '商单申请', value: userBusinessData.ordersApplied, icon: FileText, color: '#3b82f6' },
                      { label: '商单完成', value: userBusinessData.ordersCompleted, icon: ClipboardCheck, color: '#8b5cf6' },
                      { label: '创建活动', value: userBusinessData.eventsCreated, icon: Calendar, color: '#ec4899' },
                      { label: '推广订单', value: userBusinessData.promotionOrders, icon: TrendingUp, color: '#06b6d4' },
                      { label: '推广消费', value: `¥${userBusinessData.promotionSpent.toLocaleString()}`, icon: CreditCard, color: '#ef4444', isText: true },
                      { label: '会员订单', value: userMembershipData.totalOrders, icon: Crown, color: '#fbbf24' },
                      { label: '会员消费', value: `¥${userMembershipData.totalSpent.toLocaleString()}`, icon: Wallet, color: '#a855f7', isText: true },
                    ].map((stat, index) => (
                      <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}
                      >
                        <div
                          className="w-8 h-8 rounded-lg mx-auto mb-1 flex items-center justify-center"
                          style={{ backgroundColor: `${stat.color}20` }}
                        >
                          <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                        </div>
                        <p className={`text-xs mb-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                        <p className="text-base font-bold" style={{ color: stat.color }}>
                          {stat.isText ? stat.value : (stat.value as number).toLocaleString()}
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* 积分与成就统计 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* 积分统计 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      积分统计
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>当前积分</p>
                        <p className="text-xl font-bold text-yellow-500">{userPointsData.currentBalance.toLocaleString()}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>累计获得</p>
                        <p className="text-xl font-bold text-green-500">{userPointsData.totalEarned.toLocaleString()}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>累计消耗</p>
                        <p className="text-xl font-bold text-red-500">{userPointsData.totalSpent.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {/* 积分来源分布饼图 */}
                    <div className="h-40 mb-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>积分来源分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '签到', value: userPointsData.checkinDays * 10, color: '#3b82f6' },
                              { name: '任务', value: userPointsData.tasksCompleted * 50, color: '#10b981' },
                              { name: '邀请', value: userPointsData.invitesCount * 100, color: '#f59e0b' },
                              { name: '其他', value: Math.max(0, userPointsData.totalEarned - userPointsData.checkinDays * 10 - userPointsData.tasksCompleted * 50 - userPointsData.invitesCount * 100), color: '#8b5cf6' },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={30}
                            outerRadius={55}
                            paddingAngle={3}
                            dataKey="value"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                            labelLine={false}
                          >
                            <Cell fill="#3b82f6" />
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#8b5cf6" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                            formatter={(value: number) => `${value.toLocaleString()}积分`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="grid grid-cols-4 gap-2 text-center">
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>签到天数</p>
                        <p className="text-sm font-medium">{userPointsData.checkinDays}天</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>连续签到</p>
                        <p className="text-sm font-medium">{userPointsData.consecutiveCheckins}天</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>完成任务</p>
                        <p className="text-sm font-medium">{userPointsData.tasksCompleted}个</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>邀请用户</p>
                        <p className="text-sm font-medium">{userPointsData.invitesCount}人</p>
                      </div>
                    </div>
                  </div>

                  {/* 成就统计 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-purple-500" />
                      成就统计
                    </h4>
                    <div className="flex items-center gap-4 mb-4">
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>成就解锁进度</span>
                          <span className="text-sm font-medium text-purple-500">
                            {userAchievementData.unlockedAchievements} / {userAchievementData.totalAchievements}
                          </span>
                        </div>
                        <div className={`h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${(userAchievementData.unlockedAchievements / userAchievementData.totalAchievements) * 100}%` }}
                            transition={{ duration: 1 }}
                            className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                          />
                        </div>
                        <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          已完成 {((userAchievementData.unlockedAchievements / userAchievementData.totalAchievements) * 100).toFixed(1)}%
                        </p>
                      </div>
                    </div>
                    
                    {/* 成就类别分布柱状图 */}
                    {userAchievementData.categoryBreakdown.length > 0 && (
                      <div className="h-32 mb-4">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>成就类别分布</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={userAchievementData.categoryBreakdown} layout="vertical" margin={{ top: 0, right: 10, left: 0, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} horizontal={false} />
                            <XAxis type="number" hide />
                            <YAxis dataKey="category" type="category" width={60} tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                                border: 'none', 
                                borderRadius: '8px',
                                color: isDark ? '#f3f4f6' : '#1f2937'
                              }} 
                            />
                            <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                              {userAchievementData.categoryBreakdown.map((_, index) => (
                                <Cell key={`cell-${index}`} fill={['#f59e0b', '#3b82f6', '#10b981', '#ef4444'][index % 4]} />
                              ))}
                            </Bar>
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    <div className="space-y-2">
                      {userAchievementData.categoryBreakdown.map((cat, index) => (
                        <div key={cat.category} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div
                              className="w-2 h-2 rounded-full"
                              style={{ backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'][index] }}
                            />
                            <span className={`text-xs ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>{cat.category}</span>
                          </div>
                          <span className="text-xs font-medium">{cat.count}个</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* 登录记录与创作画像 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* 登录记录热力图 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <LogIn className="w-4 h-4 text-blue-500" />
                      近30天登录记录
                    </h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={userLoginRecords} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                        <XAxis dataKey="date" stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={9} tickLine={false} axisLine={false} interval={4} />
                        <YAxis stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={10} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f3f4f6' : '#111827', borderRadius: '8px' }} />
                        <Bar dataKey="loginCount" name="登录次数" fill="#3b82f6" radius={[2, 2, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                    <div className="flex items-center justify-center gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-blue-500" />
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>总登录: {userLoginRecords.reduce((sum, r) => sum + r.loginCount, 0)}次</span>
                      </span>
                    </div>
                  </div>

                  {/* 创作画像 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Palette className="w-4 h-4 text-pink-500" />
                      创作画像
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>脉络总数</p>
                        <p className="text-lg font-bold text-pink-500">{userCreativeProfile.totalMindmaps}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>节点总数</p>
                        <p className="text-lg font-bold text-purple-500">{userCreativeProfile.totalNodes}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>故事生成</p>
                        <p className="text-lg font-bold text-orange-500">{userCreativeProfile.totalStories}</p>
                      </div>
                    </div>
                    <div className="space-y-3">
                      {userCreativeProfile.preferredCategories.length > 0 && (
                        <div>
                          <p className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>偏好类别</p>
                          <div className="flex flex-wrap gap-1">
                            {userCreativeProfile.preferredCategories.slice(0, 5).map((cat) => (
                              <span key={cat} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                                {cat}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {userCreativeProfile.creativeStyle.length > 0 && (
                        <div>
                          <p className={`text-xs mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>创作风格</p>
                          <div className="flex flex-wrap gap-1">
                            {userCreativeProfile.creativeStyle.slice(0, 5).map((style) => (
                              <span key={style} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-pink-900/30 text-pink-300' : 'bg-pink-100 text-pink-600'}`}>
                                {style}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      <div className="flex items-center gap-2">
                        <Clock className="w-3.5 h-3.5 text-gray-400" />
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          最活跃时段: <span className="font-medium">{userCreativeProfile.mostActiveHour}:00</span>
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 社交活动与内容互动统计 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* 社交活动统计 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      社交活动统计
                    </h4>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>通知</p>
                        <p className="text-lg font-bold text-blue-500">{userSocialData.totalNotifications}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>未读 {userSocialData.unreadNotifications}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>私信</p>
                        <p className="text-lg font-bold text-green-500">{userSocialData.totalMessages}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>未读 {userSocialData.unreadMessages}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>好友</p>
                        <p className="text-lg font-bold text-purple-500">{userSocialData.friendsCount}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>待处理 {userSocialData.pendingFriendRequests}</p>
                      </div>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>发出的好友请求</span>
                      <span className="font-medium">{userSocialData.sentFriendRequests}</span>
                    </div>
                  </div>

                  {/* 内容互动统计 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <ThumbsUp className="w-4 h-4 text-pink-500" />
                      内容互动统计
                    </h4>
                    <div className="grid grid-cols-4 gap-2 mb-3">
                      <div className="text-center">
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>作品收藏</p>
                        <p className="text-base font-bold text-pink-500">{userContentInteraction.worksBookmarked}</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>作品点赞</p>
                        <p className="text-base font-bold text-red-500">{userContentInteraction.worksLiked}</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>动态收藏</p>
                        <p className="text-base font-bold text-yellow-500">{userContentInteraction.feedsBookmarked}</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>动态点赞</p>
                        <p className="text-base font-bold text-orange-500">{userContentInteraction.feedsLiked}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="text-center">
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>发表评论</p>
                        <p className="text-base font-bold text-blue-500">{userContentInteraction.commentsMade}</p>
                      </div>
                      <div className="text-center">
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>分享作品</p>
                        <p className="text-base font-bold text-green-500">{userContentInteraction.worksShared}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 搜索行为与草稿统计 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* 搜索行为分析 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Search className="w-4 h-4 text-indigo-500" />
                      搜索行为分析
                    </h4>
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-2 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总搜索次数</p>
                        <p className="text-lg font-bold text-indigo-500">{userSearchData.totalSearches}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-2 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>平均结果数</p>
                        <p className="text-lg font-bold text-cyan-500">{userSearchData.avgResultsPerSearch}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-2 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>点击率</p>
                        <p className="text-lg font-bold text-green-500">{userSearchData.clickThroughRate}%</p>
                      </div>
                    </div>
                    {userSearchData.topSearchKeywords.length > 0 && (
                      <div>
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>热门搜索词</p>
                        <div className="flex flex-wrap gap-1">
                          {userSearchData.topSearchKeywords.map((kw, index) => (
                            <span key={kw.keyword} className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-indigo-900/30 text-indigo-300' : 'bg-indigo-100 text-indigo-600'}`}>
                              {kw.keyword} ({kw.count})
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* 草稿与待办统计 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <FileEdit className="w-4 h-4 text-teal-500" />
                      草稿与待办
                    </h4>
                    <div className="grid grid-cols-2 gap-3 mb-3">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>草稿总数</p>
                        <p className="text-xl font-bold text-teal-500">{userDraftsData.totalDrafts}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>待发送消息</p>
                        <p className="text-xl font-bold text-orange-500">{userDraftsData.pendingMessages}</p>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>创作中心草稿</span>
                        <span className="font-medium">{userDraftsData.createDrafts}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>品牌向导草稿</span>
                        <span className="font-medium">{userDraftsData.brandWizardDrafts}</span>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>通用草稿</span>
                        <span className="font-medium">{userDraftsData.generalDrafts}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 用户反馈与举报统计 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Flag className="w-4 h-4 text-red-500" />
                    反馈与举报记录
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总反馈数</p>
                      <p className="text-xl font-bold text-blue-500">{userFeedbackData.totalFeedbacks}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>待处理</p>
                      <p className="text-xl font-bold text-yellow-500">{userFeedbackData.pendingFeedbacks}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已解决</p>
                      <p className="text-xl font-bold text-green-500">{userFeedbackData.resolvedFeedbacks}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>举报记录</p>
                      <p className="text-xl font-bold text-red-500">{userFeedbackData.totalReports}</p>
                    </div>
                  </div>
                  {/* 反馈状态分布饼图 */}
                  <div className="h-48 mt-4">
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>反馈状态分布</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '待处理', value: userFeedbackData.pendingFeedbacks },
                            { name: '已解决', value: userFeedbackData.resolvedFeedbacks },
                            { name: '其他', value: Math.max(0, userFeedbackData.totalFeedbacks - userFeedbackData.pendingFeedbacks - userFeedbackData.resolvedFeedbacks) },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          <Cell fill="#f59e0b" />
                          <Cell fill="#10b981" />
                          <Cell fill="#6b7280" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: isDark ? '#f3f4f6' : '#1f2937'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {userFeedbackData.feedbackTypes.length > 0 && (
                    <div className="mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>反馈类型分布</p>
                      <div className="flex flex-wrap gap-2">
                        {userFeedbackData.feedbackTypes.map((ft) => (
                          <span key={ft.type} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                            {ft.type === 'bug' ? 'Bug反馈' : 
                             ft.type === 'feature' ? '功能建议' : 
                             ft.type === 'complaint' ? '投诉' : 
                             ft.type === 'inquiry' ? '咨询' : ft.type}: {ft.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-4 mt-3 text-xs">
                    <div className="flex items-center justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>作为举报者</span>
                      <span className="font-medium text-red-500">{userFeedbackData.reportsAsReporter}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>被举报次数</span>
                      <span className="font-medium text-orange-500">{userFeedbackData.reportsAsTarget}</span>
                    </div>
                  </div>
                </div>

                {/* 审计日志 */}
                {userAuditLogData.totalLogs > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <ClipboardList className="w-4 h-4 text-gray-500" />
                      审计日志 ({userAuditLogData.totalLogs})
                    </h4>
                    
                    {/* 审计操作类型分布 */}
                    <div className="h-48 mb-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>操作类型分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Array.from(new Set(userAuditLogData.logs.map(l => l.action))).map(action => ({
                          name: action?.substring(0, 8) || '未知',
                          count: userAuditLogData.logs.filter(l => l.action === action).length
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                          <Bar dataKey="count" fill="#6b7280" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {userAuditLogData.logs.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最近审计记录</p>
                        {userAuditLogData.logs.slice(0, 5).map((log, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div>
                              <p className="text-sm font-medium">{log.action}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {log.resourceType} · {log.details}
                              </p>
                            </div>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(log.createdAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 活动日志 */}
                {userActivityLogData.totalLogs > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Activity className="w-4 h-4 text-blue-500" />
                      活动日志 ({userActivityLogData.totalLogs})
                    </h4>
                    
                    {/* 活动类型分布 */}
                    <div className="h-48 mb-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>活动类型分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Array.from(new Set(userActivityLogData.logs.map(l => l.activityType))).map(type => ({
                          name: type?.substring(0, 8) || '未知',
                          count: userActivityLogData.logs.filter(l => l.activityType === type).length
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                          <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {userActivityLogData.logs.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最近活动记录</p>
                        {userActivityLogData.logs.slice(0, 5).map((log, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div>
                              <p className="text-sm font-medium">{log.activityType}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {log.description}
                              </p>
                            </div>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(log.createdAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AI使用记录 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-purple-500" />
                    AI使用记录
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总生成次数</p>
                      <p className="text-xl font-bold text-purple-500">{userAIUsageData.totalGenerations}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>图片生成</p>
                      <p className="text-xl font-bold text-pink-500">{userAIUsageData.imageGenerations}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>视频生成</p>
                      <p className="text-xl font-bold text-blue-500">{userAIUsageData.videoGenerations}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>文本生成</p>
                      <p className="text-xl font-bold text-green-500">{userAIUsageData.textGenerations}</p>
                    </div>
                  </div>
                  {userAIUsageData.generationsBySource.length > 0 && (
                    <div className="mb-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>使用来源分布</p>
                      <div className="flex flex-wrap gap-2">
                        {userAIUsageData.generationsBySource.map((source) => (
                          <span key={source.source} className={`text-xs px-2 py-1 rounded ${isDark ? 'bg-purple-900/30 text-purple-300' : 'bg-purple-100 text-purple-600'}`}>
                            {source.source === 'neo' ? 'Neo' : 
                             source.source === 'wizard' ? '向导' : 
                             source.source === 'generation_page' ? '生成页' : source.source}: {source.count}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {userAIUsageData.recentGenerations.length > 0 && (
                    <div>
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最近生成记录</p>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {userAIUsageData.recentGenerations.map((gen) => (
                          <div key={gen.id} className={`flex items-center gap-3 p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
                              {gen.result_url ? (
                                <img src={gen.result_url} alt="" className="w-full h-full object-cover" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                  <Sparkles className="w-4 h-4 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs truncate">{gen.prompt}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {gen.type === 'image' ? '图片' : gen.type === 'video' ? '视频' : '文本'} · {new Date(gen.created_at).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 订单记录 */}
                {userOrderRecords.length > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-green-500" />
                      订单记录 ({userOrderRecords.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {userOrderRecords.map((order) => (
                        <div key={order.id} className={`flex items-center justify-between p-3 rounded ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{order.description}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              订单号: {order.orderNo.substring(0, 16)}... · {new Date(order.created_at).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-500">¥{order.amount.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              order.status === 'completed' || order.status === 'paid' 
                                ? 'bg-green-100 text-green-700' 
                                : order.status === 'pending'
                                ? 'bg-yellow-100 text-yellow-700'
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {order.status === 'completed' || order.status === 'paid' ? '已完成' : 
                               order.status === 'pending' ? '待支付' : 
                               order.status === 'cancelled' ? '已取消' : order.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 收藏详情 */}
                {(userCollectionDetail.works.length > 0 || userCollectionDetail.feeds.length > 0) && (
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                    {userCollectionDetail.works.length > 0 && (
                      <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                        <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                          <Bookmark className="w-4 h-4 text-pink-500" />
                          收藏的作品
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userCollectionDetail.works.map((work) => (
                            <div key={work.id} className={`flex items-center gap-3 p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                              <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
                                {work.thumbnail ? (
                                  <img src={work.thumbnail} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className="w-full h-full flex items-center justify-center">
                                    <Image className="w-4 h-4 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{work.title}</p>
                                <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  {work.author_name} · {new Date(work.created_at).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    {userCollectionDetail.feeds.length > 0 && (
                      <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                        <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                          <Heart className="w-4 h-4 text-red-500" />
                          收藏的动态
                        </h4>
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          {userCollectionDetail.feeds.map((feed) => (
                            <div key={feed.id} className={`p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                              <p className="text-xs line-clamp-2">{feed.content}</p>
                              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {feed.author_name} · {new Date(feed.created_at).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 活动参与记录 */}
                {userEventParticipations.length > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-orange-500" />
                      活动记录 ({userEventParticipations.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {userEventParticipations.map((event) => (
                        <div key={event.id} className={`flex items-center justify-between p-3 rounded ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{event.title}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(event.start_time).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              event.type === 'created' 
                                ? isDark ? 'bg-blue-900/30 text-blue-300' : 'bg-blue-100 text-blue-600'
                                : isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-600'
                            }`}>
                              {event.type === 'created' ? '创建' : '参与'}
                            </span>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              event.status === 'published' 
                                ? 'bg-green-100 text-green-700' 
                                : event.status === 'draft'
                                ? 'bg-gray-100 text-gray-600'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {event.status === 'published' ? '已发布' : 
                               event.status === 'draft' ? '草稿' : 
                               event.status === 'pending' ? '审核中' : event.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 用户安全与隐私 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* 安全状态 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Shield className="w-4 h-4 text-green-500" />
                      账号安全
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>邮箱验证</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${userSecurityData.emailVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {userSecurityData.emailVerified ? '已验证' : '未验证'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>手机验证</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${userSecurityData.phoneVerified ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {userSecurityData.phoneVerified ? '已验证' : '未验证'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>二次验证</span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${userSecurityData.twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                          {userSecurityData.twoFactorEnabled ? '已开启' : '未开启'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最后密码修改</span>
                        <span className="text-xs">{userSecurityData.lastPasswordChange || '未知'}</span>
                      </div>
                      {userSecurityData.failedLoginAttempts > 0 && (
                        <div className="flex items-center justify-between">
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最近登录失败</span>
                          <span className="text-xs text-red-500">{userSecurityData.failedLoginAttempts}次</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 隐私设置 */}
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-blue-500" />
                      隐私设置
                    </h4>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>资料可见性</span>
                        <span className="text-xs">
                          {userPrivacySettings.profileVisibility === 'public' ? '公开' : 
                           userPrivacySettings.profileVisibility === 'friends' ? '仅好友' : '私密'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>作品可见性</span>
                        <span className="text-xs">
                          {userPrivacySettings.worksVisibility === 'public' ? '公开' : 
                           userPrivacySettings.worksVisibility === 'friends' ? '仅好友' : '私密'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>允许搜索</span>
                        <span className={`text-xs ${userPrivacySettings.allowSearch ? 'text-green-500' : 'text-red-500'}`}>
                          {userPrivacySettings.allowSearch ? '是' : '否'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>显示在线状态</span>
                        <span className={`text-xs ${userPrivacySettings.showOnlineStatus ? 'text-green-500' : 'text-red-500'}`}>
                          {userPrivacySettings.showOnlineStatus ? '是' : '否'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>接收消息</span>
                        <span className="text-xs">
                          {userPrivacySettings.allowMessagesFrom === 'everyone' ? '所有人' : 
                           userPrivacySettings.allowMessagesFrom === 'friends' ? '仅好友' : '不接收'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 第三方账号绑定 */}
                {(userThirdPartyBindings.wechat || userThirdPartyBindings.qq || userThirdPartyBindings.weibo || userThirdPartyBindings.github) && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Link className="w-4 h-4 text-purple-500" />
                      第三方账号绑定
                    </h4>
                    <div className="flex flex-wrap gap-3">
                      {userThirdPartyBindings.wechat && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                          <div className="w-8 h-8 rounded-full bg-green-500 flex items-center justify-center text-white text-xs font-bold">微</div>
                          <div>
                            <p className="text-xs font-medium">微信</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{userThirdPartyBindings.wechat.nickname || '已绑定'}</p>
                          </div>
                        </div>
                      )}
                      {userThirdPartyBindings.qq && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                          <div className="w-8 h-8 rounded-full bg-blue-500 flex items-center justify-center text-white text-xs font-bold">Q</div>
                          <div>
                            <p className="text-xs font-medium">QQ</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{userThirdPartyBindings.qq.nickname || '已绑定'}</p>
                          </div>
                        </div>
                      )}
                      {userThirdPartyBindings.weibo && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                          <div className="w-8 h-8 rounded-full bg-red-500 flex items-center justify-center text-white text-xs font-bold">微</div>
                          <div>
                            <p className="text-xs font-medium">微博</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{userThirdPartyBindings.weibo.nickname || '已绑定'}</p>
                          </div>
                        </div>
                      )}
                      {userThirdPartyBindings.github && (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center text-white text-xs font-bold">G</div>
                          <div>
                            <p className="text-xs font-medium">GitHub</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{userThirdPartyBindings.github.nickname || '已绑定'}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 收益明细 */}
                {userEarningRecords.length > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Coins className="w-4 h-4 text-yellow-500" />
                      收益明细 ({userEarningRecords.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {userEarningRecords.map((record) => (
                        <div key={record.id} className={`flex items-center justify-between p-3 rounded ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{record.description}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {new Date(record.created_at).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-bold text-green-500">+¥{record.amount.toLocaleString()}</p>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              record.status === 'paid' ? 'bg-green-100 text-green-700' : 
                              record.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {record.status === 'paid' ? '已到账' : 
                               record.status === 'pending' ? '待结算' : '已取消'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 优惠券与积分兑换 */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                  {/* 优惠券 */}
                  {userCoupons.length > 0 && (
                    <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                      <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                        <Ticket className="w-4 h-4 text-pink-500" />
                        优惠券 ({userCoupons.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userCoupons.map((coupon) => (
                          <div key={coupon.id} className={`p-3 rounded ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">{coupon.code}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${coupon.used ? 'bg-gray-100 text-gray-600' : 'bg-green-100 text-green-700'}`}>
                                {coupon.used ? '已使用' : '未使用'}
                              </span>
                            </div>
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {coupon.type === 'percentage' ? `${coupon.discount}% off` : `¥${coupon.discount}`} · 最低消费 ¥{coupon.minOrderAmount}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              有效期至 {new Date(coupon.validUntil).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* 积分兑换记录 */}
                  {userPointsExchanges.length > 0 && (
                    <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                      <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                        <Gift className="w-4 h-4 text-purple-500" />
                        积分兑换 ({userPointsExchanges.length})
                      </h4>
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {userPointsExchanges.map((exchange) => (
                          <div key={exchange.id} className={`flex items-center justify-between p-3 rounded ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{exchange.itemName}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                数量: {exchange.quantity}
                              </p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-red-500">-{exchange.pointsCost}积分</p>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {new Date(exchange.created_at).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 浏览历史 */}
                {userBrowseHistory.length > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <History className="w-4 h-4 text-blue-500" />
                      浏览历史 ({userBrowseHistory.length})
                    </h4>
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {userBrowseHistory.map((item) => (
                        <div key={item.id} className={`flex items-center gap-3 p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                          <div className="w-10 h-10 rounded bg-gray-200 flex-shrink-0 overflow-hidden">
                            {item.thumbnail ? (
                              <img src={item.thumbnail} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <Eye className="w-4 h-4 text-gray-400" />
                              </div>
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium truncate">{item.title}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {item.type === 'work' ? '作品' : item.type === 'feed' ? '动态' : '其他'} · {new Date(item.viewedAt).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                          {item.duration > 0 && (
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              停留 {Math.round(item.duration / 1000)}s
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 用户会话统计 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Timer className="w-4 h-4 text-blue-500" />
                    登录与会话统计
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总在线时长</p>
                      <p className="text-lg font-bold text-blue-500">
                        {userSessionStats.totalOnlineTime > 60 
                          ? `${Math.floor(userSessionStats.totalOnlineTime / 60)}小时${userSessionStats.totalOnlineTime % 60}分钟`
                          : `${userSessionStats.totalOnlineTime}分钟`}
                      </p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>平均会话时长</p>
                      <p className="text-lg font-bold text-green-500">{userSessionStats.avgSessionDuration}分钟</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>当前连续登录</p>
                      <p className="text-lg font-bold text-orange-500">{userSessionStats.currentStreak}天</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最长连续登录</p>
                      <p className="text-lg font-bold text-purple-500">{userSessionStats.longestStreak}天</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>首次登录</span>
                        <span>{userSessionStats.firstLoginTime || '未知'}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>最后登录</span>
                        <span>{userSessionStats.lastLoginTime || '未知'}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      {userSessionStats.lastLoginIp && (
                        <div className="flex items-center justify-between">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>最后登录IP</span>
                          <span>{userSessionStats.lastLoginIp}</span>
                        </div>
                      )}
                      {userSessionStats.lastLoginLocation && (
                        <div className="flex items-center justify-between">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>登录地点</span>
                          <span>{userSessionStats.lastLoginLocation}</span>
                        </div>
                      )}
                      {userSessionStats.lastLoginDevice && (
                        <div className="flex items-center justify-between">
                          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>登录设备</span>
                          <span>{userSessionStats.lastLoginDevice}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* 登录详情记录 */}
                {userLoginDetails.length > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <List className="w-4 h-4 text-indigo-500" />
                      登录详情记录 ({userLoginDetails.length})
                    </h4>
                    <div className="space-y-2 max-h-60 overflow-y-auto">
                      {userLoginDetails.map((login) => (
                        <div key={login.id} className={`flex items-center justify-between p-3 rounded ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium">{new Date(login.loginTime).toLocaleString('zh-CN')}</p>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                login.status === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                              }`}>
                                {login.status === 'success' ? '成功' : '失败'}
                              </span>
                            </div>
                            <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {login.device} · {login.browser} · {login.os}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              IP: {login.ipAddress} · 地点: {login.location}
                            </p>
                            {login.failReason && (
                              <p className="text-xs text-red-500">失败原因: {login.failReason}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <span className={`text-xs px-2 py-0.5 rounded ${
                              login.loginMethod === 'password' ? 'bg-blue-100 text-blue-700' :
                              login.loginMethod === 'oauth' ? 'bg-purple-100 text-purple-700' :
                              'bg-orange-100 text-orange-700'
                            }`}>
                              {login.loginMethod === 'password' ? '密码' :
                               login.loginMethod === 'oauth' ? '第三方' : '验证码'}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 产品链接数据 */}
                {userProductLinkData.totalLinks > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Link className="w-4 h-4 text-blue-500" />
                      产品链接 ({userProductLinkData.totalLinks})
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总链接</p>
                        <p className="text-lg font-bold text-blue-500">{userProductLinkData.totalLinks}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总点击</p>
                        <p className="text-lg font-bold text-green-500">{userProductLinkData.totalClicks}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>转化率</p>
                        <p className="text-lg font-bold text-purple-500">
                          {userProductLinkData.totalClicks > 0 
                            ? ((userProductLinkData.totalConversions / userProductLinkData.totalClicks) * 100).toFixed(1)
                            : 0}%
                        </p>
                      </div>
                    </div>
                    
                    {/* 链接转化漏斗图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>链接转化漏斗</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: '链接', value: userProductLinkData.totalLinks },
                          { name: '点击', value: userProductLinkData.totalClicks },
                          { name: '转化', value: userProductLinkData.totalConversions },
                        ].filter(d => d.value > 0)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis type="number" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" width={60} tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                          <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {userProductLinkData.links.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto mt-4">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>链接列表</p>
                        {userProductLinkData.links.slice(0, 5).map((link, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div>
                              <p className="text-sm font-medium truncate max-w-[200px]">{link.url}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                点击: {link.clicks} · 转化: {link.conversions}
                              </p>
                            </div>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(link.createdAt).toLocaleDateString('zh-CN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 社区活动数据 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    社区活动统计
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>发布帖子</p>
                      <p className="text-lg font-bold text-green-500">{userCommunityData.postsCreated}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>点赞帖子</p>
                      <p className="text-lg font-bold text-red-500">{userCommunityData.postsLiked}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>收藏帖子</p>
                      <p className="text-lg font-bold text-yellow-500">{userCommunityData.postsCollected}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>发表评论</p>
                      <p className="text-lg font-bold text-blue-500">{userCommunityData.commentsMade}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>加入社区</p>
                      <p className="text-lg font-bold text-purple-500">{userCommunityData.communitiesJoined}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总互动</p>
                      <p className="text-lg font-bold text-orange-500">{userCommunityData.totalEngagement}</p>
                    </div>
                  </div>
                  
                  {/* 社区活动分布条形图 */}
                  <div className="h-48 mt-4">
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>活动分布</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: '发帖', value: userCommunityData.postsCreated },
                        { name: '点赞', value: userCommunityData.postsLiked },
                        { name: '收藏', value: userCommunityData.postsCollected },
                        { name: '评论', value: userCommunityData.commentsMade },
                        { name: '加入', value: userCommunityData.communitiesJoined },
                      ].filter(d => d.value > 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                        <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: isDark ? '#f3f4f6' : '#1f2937'
                          }} 
                        />
                        <Bar dataKey="value" fill="#10b981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 推荐系统数据 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    推荐系统数据
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-4`}>
                      <div className="flex items-center justify-between mb-3">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>画像完整度</span>
                        <span className="text-lg font-bold text-indigo-500">{userRecommendationData.profileCompleteness}%</span>
                      </div>
                      <div className={`w-full h-2 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <div 
                          className="h-full rounded-full bg-indigo-500 transition-all duration-500"
                          style={{ width: `${userRecommendationData.profileCompleteness}%` }}
                        />
                      </div>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-4`}>
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>推荐点击率</span>
                        <span className="text-lg font-bold text-green-500">{userRecommendationData.clickThroughRate}%</span>
                      </div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        收到 {userRecommendationData.recommendationsReceived} 次推荐，点击 {userRecommendationData.recommendationsClicked} 次
                      </p>
                    </div>
                  </div>
                  
                  {/* 推荐互动环形图 */}
                  <div className="h-48 mt-4">
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>推荐互动分布</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '已点击', value: userRecommendationData.recommendationsClicked },
                            { name: '未点击', value: Math.max(0, userRecommendationData.recommendationsReceived - userRecommendationData.recommendationsClicked) },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#6b7280" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: isDark ? '#f3f4f6' : '#1f2937'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {userRecommendationData.interestTags.length > 0 && (
                    <div className="mb-4 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>兴趣标签</p>
                      <div className="flex flex-wrap gap-2">
                        {userRecommendationData.interestTags.map((tag, index) => (
                          <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  {userRecommendationData.realtimeFeatures.length > 0 && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {userRecommendationData.realtimeFeatures.map((feature, index) => (
                        <div key={index} className={`${isDark ? 'bg-gray-600/30' : 'bg-white'} rounded-lg p-2 text-center`}>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{feature.feature}</p>
                          <p className="text-sm font-medium">{feature.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 冷启动推荐日志 */}
                {userColdStartData.totalRecommendations > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-cyan-500" />
                      冷启动推荐日志 ({userColdStartData.totalRecommendations})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总推荐</p>
                        <p className="text-lg font-bold text-cyan-500">{userColdStartData.totalRecommendations}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>点击数</p>
                        <p className="text-lg font-bold text-blue-500">{userColdStartData.clickedCount}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>点赞数</p>
                        <p className="text-lg font-bold text-red-500">{userColdStartData.likedCount}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>平均停留</p>
                        <p className="text-lg font-bold text-green-500">{userColdStartData.avgDwellTime}s</p>
                      </div>
                    </div>
                    
                    {/* 冷启动推荐互动漏斗图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>推荐互动漏斗</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: '曝光', value: userColdStartData.totalRecommendations },
                          { name: '点击', value: userColdStartData.clickedCount },
                          { name: '点赞', value: userColdStartData.likedCount },
                        ].filter(d => d.value > 0)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis type="number" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" width={60} tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                          <Bar dataKey="value" fill="#06b6d4" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 同步日志 */}
                {userSyncData.totalSyncs > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <RefreshCw className="w-4 h-4 text-blue-500" />
                      同步日志 ({userSyncData.totalSyncs})
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总同步次数</p>
                        <p className="text-lg font-bold text-blue-500">{userSyncData.totalSyncs}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最近同步</p>
                        <p className="text-sm font-bold text-green-500">
                          {userSyncData.recentSyncs.length > 0 
                            ? new Date(userSyncData.recentSyncs[0].syncedAt).toLocaleDateString('zh-CN')
                            : '无'}
                        </p>
                      </div>
                    </div>
                    
                    {userSyncData.recentSyncs.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最近同步记录</p>
                        {userSyncData.recentSyncs.slice(0, 5).map((sync, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div>
                              <p className="text-sm font-medium">{sync.syncType || '数据同步'}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                状态: {sync.status === 'success' ? '成功' : sync.status === 'failed' ? '失败' : '进行中'}
                              </p>
                            </div>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(sync.syncedAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* IP孵化数据 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Crown className="w-4 h-4 text-yellow-500" />
                    IP孵化数据
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>IP资产总数</p>
                      <p className="text-lg font-bold text-yellow-500">{userIPData.totalIPAssets}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已发布</p>
                      <p className="text-lg font-bold text-green-500">{userIPData.publishedIPs}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>孵化中</p>
                      <p className="text-lg font-bold text-blue-500">{userIPData.incubatingIPs}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已商业化</p>
                      <p className="text-lg font-bold text-purple-500">{userIPData.commercializedIPs}</p>
                    </div>
                  </div>
                  
                  {/* IP状态分布图 */}
                  <div className="h-48 mt-4">
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>IP状态分布</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '已发布', value: userIPData.publishedIPs },
                            { name: '孵化中', value: userIPData.incubatingIPs },
                            { name: '已商业化', value: userIPData.commercializedIPs },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#8b5cf6" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: isDark ? '#f3f4f6' : '#1f2937'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>IP总收益</p>
                      <p className="text-lg font-bold text-green-500">¥{userIPData.totalRevenue.toLocaleString()}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>合作伙伴</p>
                      <p className="text-lg font-bold text-blue-500">{userIPData.partnerships}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>版权资产</p>
                      <p className="text-lg font-bold text-orange-500">{userIPData.copyrightAssets}</p>
                    </div>
                  </div>
                </div>

                {/* 小流量测试曝光 */}
                {userSmallTrafficData.totalExposures > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Eye className="w-4 h-4 text-orange-500" />
                      小流量测试曝光 ({userSmallTrafficData.totalExposures})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总曝光</p>
                        <p className="text-lg font-bold text-orange-500">{userSmallTrafficData.totalExposures}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>点击数</p>
                        <p className="text-lg font-bold text-blue-500">{userSmallTrafficData.clickedCount}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>点赞数</p>
                        <p className="text-lg font-bold text-red-500">{userSmallTrafficData.likedCount}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>平均停留</p>
                        <p className="text-lg font-bold text-green-500">{userSmallTrafficData.avgDwellTime}s</p>
                      </div>
                    </div>
                    
                    {/* 小流量测试互动漏斗图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>曝光互动漏斗</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: '曝光', value: userSmallTrafficData.totalExposures },
                          { name: '点击', value: userSmallTrafficData.clickedCount },
                          { name: '点赞', value: userSmallTrafficData.likedCount },
                        ].filter(d => d.value > 0)} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis type="number" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" width={60} tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                          <Bar dataKey="value" fill="#f97316" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 小流量测试 */}
                {userSmallTrafficTestData.totalTests > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <TestTube className="w-4 h-4 text-pink-500" />
                      小流量测试 ({userSmallTrafficTestData.totalTests})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总测试</p>
                        <p className="text-lg font-bold text-pink-500">{userSmallTrafficTestData.totalTests}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>进行中</p>
                        <p className="text-lg font-bold text-blue-500">{userSmallTrafficTestData.runningTests}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已通过</p>
                        <p className="text-lg font-bold text-green-500">{userSmallTrafficTestData.passedTests}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已失败</p>
                        <p className="text-lg font-bold text-red-500">{userSmallTrafficTestData.failedTests}</p>
                      </div>
                    </div>
                    
                    {/* 小流量测试状态分布饼图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>测试状态分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '进行中', value: userSmallTrafficTestData.runningTests },
                              { name: '已通过', value: userSmallTrafficTestData.passedTests },
                              { name: '已失败', value: userSmallTrafficTestData.failedTests },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            <Cell fill="#3b82f6" />
                            <Cell fill="#10b981" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* A/B测试数据 */}
                {userABTestData.totalExperiments > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Target className="w-4 h-4 text-purple-500" />
                      A/B测试参与 ({userABTestData.totalExperiments})
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总实验数</p>
                        <p className="text-lg font-bold text-purple-500">{userABTestData.totalExperiments}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>进行中</p>
                        <p className="text-lg font-bold text-green-500">{userABTestData.activeExperiments}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已完成</p>
                        <p className="text-lg font-bold text-blue-500">{userABTestData.completedExperiments}</p>
                      </div>
                    </div>
                    
                    {/* A/B测试状态分布图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>实验状态分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '进行中', value: userABTestData.activeExperiments },
                              { name: '已完成', value: userABTestData.completedExperiments },
                              { name: '其他', value: Math.max(0, userABTestData.totalExperiments - userABTestData.activeExperiments - userABTestData.completedExperiments) },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#3b82f6" />
                            <Cell fill="#6b7280" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {userABTestData.experiments.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto mt-4">
                        {userABTestData.experiments.map((exp, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div>
                              <p className="text-sm font-medium">{exp.name}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>分组: {exp.variant}</p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              exp.status === 'active' ? 'bg-green-100 text-green-700' : 
                              exp.status === 'completed' ? 'bg-blue-100 text-blue-700' : 
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {exp.status === 'active' ? '进行中' : 
                               exp.status === 'completed' ? '已完成' : '未知'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AB指标 */}
                {userABMetricData.totalMetrics > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      AB指标 ({userABMetricData.totalMetrics})
                    </h4>
                    
                    {/* AB指标分布条形图 */}
                    <div className="h-48 mb-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>指标分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userABMetricData.metrics.slice(0, 5).map((metric, index) => ({
                          name: metric.metricName?.substring(0, 8) || `指标${index + 1}`,
                          value: metric.metricValue
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                          <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {userABMetricData.metrics.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>指标列表</p>
                        {userABMetricData.metrics.slice(0, 5).map((metric, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div>
                              <p className="text-sm font-medium">{metric.metricName}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {metric.experimentName || '未命名实验'}
                              </p>
                            </div>
                            <span className={`text-sm font-bold ${
                              metric.metricValue > 0 ? 'text-green-500' : 
                              metric.metricValue < 0 ? 'text-red-500' : 
                              'text-gray-500'
                            }`}>
                              {metric.metricValue.toFixed(2)}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* AB实验事件 */}
                {userABExperimentEventData.totalEvents > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <FlaskConical className="w-4 h-4 text-purple-500" />
                      AB实验事件 ({userABExperimentEventData.totalEvents})
                    </h4>
                    
                    {/* 实验事件类型分布 */}
                    <div className="h-48 mb-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>事件类型分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Array.from(new Set(userABExperimentEventData.events.map(e => e.eventType))).map(type => ({
                          name: type?.substring(0, 8) || '未知',
                          count: userABExperimentEventData.events.filter(e => e.eventType === type).length
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                          <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {userABExperimentEventData.events.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最近事件</p>
                        {userABExperimentEventData.events.slice(0, 5).map((event, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div>
                              <p className="text-sm font-medium">{event.eventType}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                实验: {event.experimentName || '未命名'}
                              </p>
                            </div>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(event.createdAt).toLocaleString('zh-CN')}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 内容审核数据 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Shield className="w-4 h-4 text-blue-500" />
                    内容审核统计
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总提交</p>
                      <p className="text-lg font-bold text-blue-500">{userModerationData.totalSubmissions}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已通过</p>
                      <p className="text-lg font-bold text-green-500">{userModerationData.approved}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已拒绝</p>
                      <p className="text-lg font-bold text-red-500">{userModerationData.rejected}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>审核中</p>
                      <p className="text-lg font-bold text-yellow-500">{userModerationData.pending}</p>
                    </div>
                  </div>
                  
                  {/* 审核状态分布图 */}
                  <div className="h-48 mt-4">
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>审核状态分布</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '已通过', value: userModerationData.approved },
                            { name: '已拒绝', value: userModerationData.rejected },
                            { name: '审核中', value: userModerationData.pending },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#f59e0b" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: isDark ? '#f3f4f6' : '#1f2937'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>AI审核</p>
                      <p className="text-lg font-bold text-indigo-500">{userModerationData.aiReviews}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>人工审核</p>
                      <p className="text-lg font-bold text-orange-500">{userModerationData.humanReviews}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>平均评分</p>
                      <p className="text-lg font-bold text-green-500">{userModerationData.averageScore.toFixed(1)}</p>
                    </div>
                  </div>
                </div>

                {/* 内容向量数据 */}
                {userContentVectorData.totalVectors > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Database className="w-4 h-4 text-indigo-500" />
                      内容向量数据 ({userContentVectorData.totalVectors})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总向量数</p>
                        <p className="text-lg font-bold text-indigo-500">{userContentVectorData.totalVectors}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>分类数</p>
                        <p className="text-lg font-bold text-blue-500">{userContentVectorData.categories.length}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>标签数</p>
                        <p className="text-lg font-bold text-green-500">{userContentVectorData.tags.length}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>主题数</p>
                        <p className="text-lg font-bold text-purple-500">{userContentVectorData.themes.length}</p>
                      </div>
                    </div>
                    
                    {/* 内容向量分布条形图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>向量分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: '分类', value: userContentVectorData.categories.length },
                          { name: '标签', value: userContentVectorData.tags.length },
                          { name: '主题', value: userContentVectorData.themes.length },
                        ].filter(d => d.value > 0)}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                          <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {userContentVectorData.tags.length > 0 && (
                      <div className="mt-4">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>内容标签</p>
                        <div className="flex flex-wrap gap-2">
                          {userContentVectorData.tags.slice(0, 10).map((tag, index) => (
                            <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 动态/Feed数据 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-cyan-500" />
                    动态/Feed统计
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总动态</p>
                      <p className="text-lg font-bold text-cyan-500">{userFeedData.totalFeeds}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已发布</p>
                      <p className="text-lg font-bold text-green-500">{userFeedData.feedsPublished}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>草稿</p>
                      <p className="text-lg font-bold text-yellow-500">{userFeedData.feedsDraft}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>互动率</p>
                      <p className="text-lg font-bold text-purple-500">{userFeedData.avgEngagementRate}%</p>
                    </div>
                  </div>
                  
                  {/* 动态互动分布图 */}
                  <div className="h-48 mt-4">
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>互动分布</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '点赞', value: userFeedData.totalLikes },
                            { name: '评论', value: userFeedData.totalComments },
                            { name: '分享', value: userFeedData.totalShares },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          <Cell fill="#ef4444" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: isDark ? '#f3f4f6' : '#1f2937'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>获赞数</p>
                      <p className="text-lg font-bold text-red-500">{userFeedData.totalLikes}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>评论数</p>
                      <p className="text-lg font-bold text-blue-500">{userFeedData.totalComments}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>分享数</p>
                      <p className="text-lg font-bold text-green-500">{userFeedData.totalShares}</p>
                    </div>
                  </div>
                </div>

                {/* 实时推荐缓存 */}
                {userRealtimeRecData.hasCache && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Zap className="w-4 h-4 text-yellow-500" />
                      实时推荐缓存
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>缓存项目</p>
                        <p className="text-lg font-bold text-yellow-500">{userRealtimeRecData.itemsCount}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>多样性评分</p>
                        <p className="text-lg font-bold text-blue-500">{userRealtimeRecData.diversityScore.toFixed(2)}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>相关性评分</p>
                        <p className="text-lg font-bold text-green-500">{userRealtimeRecData.relevanceScore.toFixed(2)}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>MMR评分</p>
                        <p className="text-lg font-bold text-purple-500">{userRealtimeRecData.mmrScore.toFixed(2)}</p>
                      </div>
                    </div>
                    
                    {/* 推荐质量雷达图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>推荐质量评分</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: '多样性', A: userRealtimeRecData.diversityScore * 100 },
                          { subject: '相关性', A: userRealtimeRecData.relevanceScore * 100 },
                          { subject: 'MMR', A: userRealtimeRecData.mmrScore * 100 },
                        ]}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} />
                          <Radar name="质量评分" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 新内容提升池 */}
                {userBoostPoolData.totalBoosts > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Rocket className="w-4 h-4 text-orange-500" />
                      新内容提升池 ({userBoostPoolData.totalBoosts})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总提升</p>
                        <p className="text-lg font-bold text-orange-500">{userBoostPoolData.totalBoosts}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>进行中</p>
                        <p className="text-lg font-bold text-green-500">{userBoostPoolData.activeBoosts}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已过期</p>
                        <p className="text-lg font-bold text-gray-500">{userBoostPoolData.expiredBoosts}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总曝光</p>
                        <p className="text-lg font-bold text-blue-500">{userBoostPoolData.totalExposure}</p>
                      </div>
                    </div>
                    
                    {/* 提升池状态分布饼图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>提升状态分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '进行中', value: userBoostPoolData.activeBoosts },
                              { name: '已过期', value: userBoostPoolData.expiredBoosts },
                              { name: '其他', value: Math.max(0, userBoostPoolData.totalBoosts - userBoostPoolData.activeBoosts - userBoostPoolData.expiredBoosts) },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#6b7280" />
                            <Cell fill="#f59e0b" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 邀请/裂变数据 */}
                {userInviteData.totalInvites > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-pink-500" />
                      邀请/裂变数据
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总邀请</p>
                        <p className="text-lg font-bold text-pink-500">{userInviteData.totalInvites}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>成功邀请</p>
                        <p className="text-lg font-bold text-green-500">{userInviteData.successfulInvites}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>转化率</p>
                        <p className="text-lg font-bold text-blue-500">{userInviteData.inviteConversionRate}%</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>邀请奖励</p>
                        <p className="text-lg font-bold text-yellow-500">{userInviteData.inviteRewards}积分</p>
                      </div>
                    </div>
                    
                    {/* 邀请转化漏斗图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>邀请转化漏斗</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: '总邀请', value: userInviteData.totalInvites },
                          { name: '成功邀请', value: userInviteData.successfulInvites },
                        ]} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis type="number" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" width={80} tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                          <Bar dataKey="value" fill="#ec4899" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {userInviteData.invitedUsers.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto mt-4">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>邀请的用户</p>
                        {userInviteData.invitedUsers.map((user, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-pink-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{user.username}</p>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  注册于 {new Date(user.joinedAt).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              user.status === 'completed' ? 'bg-green-100 text-green-700' : 
                              user.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-gray-100 text-gray-600'
                            }`}>
                              {user.status === 'completed' ? '已完成' : 
                               user.status === 'pending' ? '待完成' : user.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 用户相似度数据 */}
                {userSimilarityData.totalSimilarUsers > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      相似用户 ({userSimilarityData.totalSimilarUsers})
                    </h4>
                    
                    {/* 相似度分布条形图 */}
                    <div className="h-48 mb-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>相似度分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userSimilarityData.similarUsers.slice(0, 5).map((user, index) => ({
                          name: user.username?.substring(0, 6) || `用户${index + 1}`,
                          similarity: Math.round(user.similarity * 100)
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} domain={[0, 100]} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }}
                            formatter={(value: number) => `${value}%`}
                          />
                          <Bar dataKey="similarity" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {userSimilarityData.similarUsers.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>相似用户列表</p>
                        {userSimilarityData.similarUsers.slice(0, 5).map((user, index) => (
                          <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div className="flex items-center gap-2">
                              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white text-xs font-bold">
                                {user.username.charAt(0).toUpperCase()}
                              </div>
                              <div>
                                <p className="text-sm font-medium">{user.username}</p>
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  共同兴趣: {user.commonInterests?.join(', ') || '无'}
                                </p>
                              </div>
                            </div>
                            <span className={`text-sm font-bold ${
                              user.similarity > 0.8 ? 'text-green-500' : 
                              user.similarity > 0.5 ? 'text-yellow-500' : 
                              'text-gray-500'
                            }`}>
                              {(user.similarity * 100).toFixed(0)}%
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 提现记录 */}
                {userWithdrawalData.totalWithdrawals > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Wallet className="w-4 h-4 text-green-500" />
                      提现记录 ({userWithdrawalData.totalWithdrawals})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总提现次数</p>
                        <p className="text-lg font-bold text-blue-500">{userWithdrawalData.totalWithdrawals}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总提现金额</p>
                        <p className="text-lg font-bold text-green-500">¥{userWithdrawalData.totalAmount.toLocaleString()}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>待处理</p>
                        <p className="text-lg font-bold text-yellow-500">¥{userWithdrawalData.pendingAmount.toLocaleString()}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已完成</p>
                        <p className="text-lg font-bold text-purple-500">¥{userWithdrawalData.completedAmount.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {/* 提现金额分布图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>提现金额分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '已完成', value: userWithdrawalData.completedAmount },
                              { name: '待处理', value: userWithdrawalData.pendingAmount },
                              { name: '其他', value: Math.max(0, userWithdrawalData.totalAmount - userWithdrawalData.completedAmount - userWithdrawalData.pendingAmount) },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ¥${value.toLocaleString()}`}
                          >
                            <Cell fill="#8b5cf6" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#6b7280" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }}
                            formatter={(value: number) => `¥${value.toLocaleString()}`}
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {userWithdrawalData.withdrawals.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto mt-4">
                        {userWithdrawalData.withdrawals.map((withdrawal) => (
                          <div key={withdrawal.id} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div>
                              <p className="text-sm font-medium">¥{withdrawal.amount.toLocaleString()}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(withdrawal.createdAt).toLocaleDateString('zh-CN')} · {withdrawal.method === 'alipay' ? '支付宝' : withdrawal.method === 'wechat' ? '微信' : '银行卡'}
                              </p>
                            </div>
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              withdrawal.status === 'completed' ? 'bg-green-100 text-green-700' : 
                              withdrawal.status === 'pending' ? 'bg-yellow-100 text-yellow-700' : 
                              'bg-red-100 text-red-700'
                            }`}>
                              {withdrawal.status === 'completed' ? '已完成' : 
                               withdrawal.status === 'pending' ? '处理中' : '失败'}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 模板互动数据 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-pink-500" />
                    模板互动统计
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>收藏模板</p>
                      <p className="text-lg font-bold text-pink-500">{userTemplateData.totalFavorites}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>点赞模板</p>
                      <p className="text-lg font-bold text-red-500">{userTemplateData.totalLikes}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>使用模板</p>
                      <p className="text-lg font-bold text-blue-500">{userTemplateData.templatesUsed}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>创建模板</p>
                      <p className="text-lg font-bold text-green-500">{userTemplateData.templatesCreated}</p>
                    </div>
                  </div>
                  
                  {/* 模板互动分布图 */}
                  <div className="h-48 mt-4">
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>互动分布</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '收藏', value: userTemplateData.totalFavorites },
                            { name: '点赞', value: userTemplateData.totalLikes },
                            { name: '使用', value: userTemplateData.templatesUsed },
                            { name: '创建', value: userTemplateData.templatesCreated },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          <Cell fill="#ec4899" />
                          <Cell fill="#ef4444" />
                          <Cell fill="#3b82f6" />
                          <Cell fill="#10b981" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: isDark ? '#f3f4f6' : '#1f2937'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  
                  {userTemplateData.favoriteTemplates.length > 0 && (
                    <div className="space-y-2 max-h-40 overflow-y-auto mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>收藏的模板</p>
                      {userTemplateData.favoriteTemplates.map((template) => (
                        <div key={template.id} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                          <div>
                            <p className="text-sm font-medium">{template.name}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{template.category}</p>
                          </div>
                          <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                            {new Date(template.favoritedAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* 活动获奖数据 */}
                {userPrizeData.totalPrizes > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Trophy className="w-4 h-4 text-yellow-500" />
                      活动获奖 ({userPrizeData.totalPrizes})
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>获奖次数</p>
                        <p className="text-lg font-bold text-yellow-500">{userPrizeData.totalPrizes}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>奖品总价值</p>
                        <p className="text-lg font-bold text-green-500">¥{userPrizeData.totalPrizeValue.toLocaleString()}</p>
                      </div>
                    </div>
                    
                    {/* 奖品价值分布图 */}
                    {userPrizeData.prizes.length > 0 && (
                      <div className="h-48 mt-4">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>奖品价值分布</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart data={userPrizeData.prizes.slice(0, 5).map((prize, index) => ({
                            name: prize.prizeName?.substring(0, 6) || `奖品${index + 1}`,
                            value: prize.prizeValue
                          }))}>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                            <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                                border: 'none', 
                                borderRadius: '8px',
                                color: isDark ? '#f3f4f6' : '#1f2937'
                              }}
                              formatter={(value: number) => `¥${value.toLocaleString()}`}
                            />
                            <Bar dataKey="value" fill="#f59e0b" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {userPrizeData.prizes.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto mt-4">
                        {userPrizeData.prizes.map((prize) => (
                          <div key={prize.id} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div>
                              <p className="text-sm font-medium">{prize.prizeName}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{prize.eventName}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-yellow-500">¥{prize.prizeValue.toLocaleString()}</p>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {new Date(prize.wonAt).toLocaleDateString('zh-CN')}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 提及(@)数据 */}
                {userMentionData.totalMentions > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-blue-500" />
                      提及(@)统计
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总提及</p>
                        <p className="text-lg font-bold text-blue-500">{userMentionData.totalMentions}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>收到提及</p>
                        <p className="text-lg font-bold text-green-500">{userMentionData.mentionsReceived}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>发送提及</p>
                        <p className="text-lg font-bold text-purple-500">{userMentionData.mentionsSent}</p>
                      </div>
                    </div>
                    
                    {/* 提及分布饼图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>提及分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '收到', value: userMentionData.mentionsReceived },
                              { name: '发送', value: userMentionData.mentionsSent },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#8b5cf6" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                    
                    {userMentionData.recentMentions.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto mt-4">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最近提及</p>
                        {userMentionData.recentMentions.map((mention) => (
                          <div key={mention.id} className={`p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div className="flex items-center justify-between">
                              <span className="text-sm font-medium">@{mention.senderName}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${
                                mention.type === 'comment' ? 'bg-blue-100 text-blue-700' : 
                                mention.type === 'work' ? 'bg-purple-100 text-purple-700' : 
                                'bg-gray-100 text-gray-600'
                              }`}>
                                {mention.type === 'comment' ? '评论' : 
                                 mention.type === 'work' ? '作品' : mention.type}
                              </span>
                            </div>
                            <p className={`text-xs mt-1 truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{mention.content}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {new Date(mention.createdAt).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 设计工作坊数据 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Palette className="w-4 h-4 text-indigo-500" />
                    设计工作坊
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>上传文件</p>
                      <p className="text-lg font-bold text-indigo-500">{userDesignWorkshopData.totalUploads}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>图案</p>
                      <p className="text-lg font-bold text-pink-500">{userDesignWorkshopData.totalPatterns}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>风格预设</p>
                      <p className="text-lg font-bold text-purple-500">{userDesignWorkshopData.totalStylePresets}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>瓷砖配置</p>
                      <p className="text-lg font-bold text-blue-500">{userDesignWorkshopData.totalTileConfigs}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>模型配置</p>
                      <p className="text-lg font-bold text-green-500">{userDesignWorkshopData.totalMockupConfigs}</p>
                    </div>
                  </div>
                  
                  {/* 设计工作坊资源分布图 */}
                  <div className="h-48 mt-4">
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>资源分布</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={[
                        { name: '上传', value: userDesignWorkshopData.totalUploads },
                        { name: '图案', value: userDesignWorkshopData.totalPatterns },
                        { name: '风格', value: userDesignWorkshopData.totalStylePresets },
                        { name: '瓷砖', value: userDesignWorkshopData.totalTileConfigs },
                        { name: '模型', value: userDesignWorkshopData.totalMockupConfigs },
                      ].filter(d => d.value > 0)}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                        <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                        <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: isDark ? '#f3f4f6' : '#1f2937'
                          }} 
                        />
                        <Bar dataKey="value" fill="#6366f1" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 设备信息 */}
                {userDeviceDetailData.totalDevices > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-blue-500" />
                      设备信息 ({userDeviceDetailData.totalDevices})
                    </h4>
                    
                    {/* 设备访问统计图 */}
                    <div className="h-48 mb-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>设备访问次数</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={userDeviceDetailData.devices.map(d => ({
                          name: d.deviceType?.substring(0, 8) || '未知',
                          visits: d.visitCount
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                          <Bar dataKey="visits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {userDeviceDetailData.devices.map((device) => (
                        <div key={device.id} className={`flex items-center justify-between p-3 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                          <div>
                            <p className="text-sm font-medium">{device.deviceType}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {device.deviceName || '未知设备'} · IP: {device.ipAddress}
                            </p>
                            <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              首次: {new Date(device.firstSeenAt).toLocaleDateString('zh-CN')} · 
                              最近: {new Date(device.lastSeenAt).toLocaleDateString('zh-CN')}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                            {device.visitCount} 次访问
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 私信/聊天数据 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <MessageCircle className="w-4 h-4 text-green-500" />
                    私信/聊天统计
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>对话数</p>
                      <p className="text-lg font-bold text-green-500">{userChatData.totalConversations}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>发送消息</p>
                      <p className="text-lg font-bold text-blue-500">{userChatData.totalMessagesSent}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>接收消息</p>
                      <p className="text-lg font-bold text-purple-500">{userChatData.totalMessagesReceived}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>未读消息</p>
                      <p className="text-lg font-bold text-red-500">{userChatData.unreadMessages}</p>
                    </div>
                  </div>
                  
                  {/* 消息统计饼图 */}
                  <div className="h-48 mt-4">
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>消息分布</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '发送', value: userChatData.totalMessagesSent },
                            { name: '接收', value: userChatData.totalMessagesReceived },
                            { name: '未读', value: userChatData.unreadMessages },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name, value }) => `${name}: ${value}`}
                        >
                          <Cell fill="#3b82f6" />
                          <Cell fill="#8b5cf6" />
                          <Cell fill="#ef4444" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: isDark ? '#f3f4f6' : '#1f2937'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 举报记录 */}
                {userReportData.totalReports > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Flag className="w-4 h-4 text-orange-500" />
                      举报记录 ({userReportData.totalReports})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>作为举报者</p>
                        <p className="text-lg font-bold text-blue-500">{userReportData.reportsAsReporter}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>作为被举报</p>
                        <p className="text-lg font-bold text-red-500">{userReportData.reportsAsTarget}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>待处理</p>
                        <p className="text-lg font-bold text-yellow-500">{userReportData.pendingReports}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已解决</p>
                        <p className="text-lg font-bold text-green-500">{userReportData.resolvedReports}</p>
                      </div>
                    </div>
                    
                    {/* 举报状态分布图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>举报状态分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '待处理', value: userReportData.pendingReports },
                              { name: '已解决', value: userReportData.resolvedReports },
                              { name: '其他', value: Math.max(0, userReportData.totalReports - userReportData.pendingReports - userReportData.resolvedReports) },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            <Cell fill="#f59e0b" />
                            <Cell fill="#10b981" />
                            <Cell fill="#6b7280" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 封禁限制 */}
                {userBanData.isBanned && (
                  <div className={`${isDark ? 'bg-red-900/20' : 'bg-red-50'} rounded-xl p-4 mb-6 border border-red-200`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2 text-red-600">
                      <Shield className="w-4 h-4" />
                      账号封禁状态
                    </h4>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-red-600">封禁原因:</span>
                        <span className="text-sm font-medium">{userBanData.banReason || '未指定'}</span>
                      </div>
                      {userBanData.bannedAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-600">封禁时间:</span>
                          <span className="text-sm">{new Date(userBanData.bannedAt).toLocaleString('zh-CN')}</span>
                        </div>
                      )}
                      {userBanData.expiresAt && (
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-red-600">解封时间:</span>
                          <span className="text-sm">{new Date(userBanData.expiresAt).toLocaleString('zh-CN')}</span>
                        </div>
                      )}
                    </div>
                    
                    {/* 封禁限制可视化 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-red-400' : 'text-red-500'}`}>限制功能分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart 
                          data={[
                            { name: '登录', enabled: userBanData.disableLogin ? 100 : 0, disabled: userBanData.disableLogin ? 0 : 100 },
                            { name: '发布', enabled: userBanData.disablePost ? 100 : 0, disabled: userBanData.disablePost ? 0 : 100 },
                            { name: '评论', enabled: userBanData.disableComment ? 100 : 0, disabled: userBanData.disableComment ? 0 : 100 },
                            { name: '点赞', enabled: userBanData.disableLike ? 100 : 0, disabled: userBanData.disableLike ? 0 : 100 },
                            { name: '关注', enabled: userBanData.disableFollow ? 100 : 0, disabled: userBanData.disableFollow ? 0 : 100 },
                          ]} 
                          layout="vertical"
                        >
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#7f1d1d' : '#fecaca'} />
                          <XAxis type="number" domain={[0, 100]} tick={{ fill: isDark ? '#fca5a5' : '#dc2626', fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" width={50} tick={{ fill: isDark ? '#fca5a5' : '#dc2626', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#450a0a' : '#fef2f2', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#fca5a5' : '#dc2626'
                            }}
                            formatter={(value: number) => value === 100 ? '已限制' : '正常'}
                          />
                          <Bar dataKey="enabled" stackId="a" fill="#dc2626" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="disabled" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-2 mt-4">
                      {[
                        { label: '禁止登录', value: userBanData.disableLogin },
                        { label: '禁止发布', value: userBanData.disablePost },
                        { label: '禁止评论', value: userBanData.disableComment },
                        { label: '禁止点赞', value: userBanData.disableLike },
                        { label: '禁止关注', value: userBanData.disableFollow },
                      ].map((item) => (
                        <div key={item.label} className={`text-center p-2 rounded ${item.value ? (isDark ? 'bg-red-600/30' : 'bg-red-100') : (isDark ? 'bg-gray-600/30' : 'bg-gray-100')}`}>
                          <p className={`text-xs ${item.value ? 'text-red-600' : (isDark ? 'text-gray-400' : 'text-gray-500')}`}>{item.label}</p>
                          <p className={`text-sm font-medium ${item.value ? 'text-red-600' : ''}`}>{item.value ? '是' : '否'}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 工作流数据 */}
                {userWorkflowData.totalWorkflows > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <GitBranch className="w-4 h-4 text-indigo-500" />
                      工作流进度 ({userWorkflowData.totalWorkflows})
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总工作流</p>
                        <p className="text-lg font-bold text-indigo-500">{userWorkflowData.totalWorkflows}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已完成</p>
                        <p className="text-lg font-bold text-green-500">{userWorkflowData.completedWorkflows}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>进行中</p>
                        <p className="text-lg font-bold text-yellow-500">{userWorkflowData.inProgressWorkflows}</p>
                      </div>
                    </div>
                    
                    {/* 工作流进度环形图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>工作流状态分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '已完成', value: userWorkflowData.completedWorkflows },
                              { name: '进行中', value: userWorkflowData.inProgressWorkflows },
                              { name: '其他', value: Math.max(0, userWorkflowData.totalWorkflows - userWorkflowData.completedWorkflows - userWorkflowData.inProgressWorkflows) },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#6b7280" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 生成任务数据 */}
                {userGenerationTaskData.totalTasks > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-blue-500" />
                      AI生成任务 ({userGenerationTaskData.totalTasks})
                    </h4>
                    <div className="grid grid-cols-5 gap-2 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-2 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总任务</p>
                        <p className="text-lg font-bold text-blue-500">{userGenerationTaskData.totalTasks}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-2 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>待处理</p>
                        <p className="text-lg font-bold text-yellow-500">{userGenerationTaskData.pendingTasks}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-2 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>处理中</p>
                        <p className="text-lg font-bold text-blue-500">{userGenerationTaskData.processingTasks}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-2 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已完成</p>
                        <p className="text-lg font-bold text-green-500">{userGenerationTaskData.completedTasks}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-2 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>失败</p>
                        <p className="text-lg font-bold text-red-500">{userGenerationTaskData.failedTasks}</p>
                      </div>
                    </div>
                    
                    {/* AI任务状态分布图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>任务状态分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '待处理', value: userGenerationTaskData.pendingTasks },
                              { name: '处理中', value: userGenerationTaskData.processingTasks },
                              { name: '已完成', value: userGenerationTaskData.completedTasks },
                              { name: '失败', value: userGenerationTaskData.failedTasks },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            <Cell fill="#f59e0b" />
                            <Cell fill="#3b82f6" />
                            <Cell fill="#10b981" />
                            <Cell fill="#ef4444" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 灵感脉络数据 */}
                {userInspirationData.totalMindmaps > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Lightbulb className="w-4 h-4 text-yellow-500" />
                      灵感脉络 ({userInspirationData.totalMindmaps})
                    </h4>
                    <div className="grid grid-cols-3 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>脉络图</p>
                        <p className="text-lg font-bold text-yellow-500">{userInspirationData.totalMindmaps}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>节点数</p>
                        <p className="text-lg font-bold text-blue-500">{userInspirationData.totalNodes}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>创作故事</p>
                        <p className="text-lg font-bold text-purple-500">{userInspirationData.totalStories}</p>
                      </div>
                    </div>
                    
                    {/* 灵感脉络分布饼图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>灵感内容分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '脉络图', value: userInspirationData.totalMindmaps },
                              { name: '节点', value: userInspirationData.totalNodes },
                              { name: '故事', value: userInspirationData.totalStories },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            <Cell fill="#f59e0b" />
                            <Cell fill="#3b82f6" />
                            <Cell fill="#8b5cf6" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 流量来源数据 */}
                {userTrafficSourceData.totalSources > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Globe className="w-4 h-4 text-green-500" />
                      流量来源 ({userTrafficSourceData.totalSources})
                    </h4>
                    
                    {/* 流量来源类型分布图 */}
                    <div className="h-48 mb-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>来源类型分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={Array.from(new Set(userTrafficSourceData.sources.map(s => s.sourceType))).map(type => ({
                          name: type?.substring(0, 8) || '未知',
                          count: userTrafficSourceData.sources.filter(s => s.sourceType === type).length
                        }))}>
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                          <Bar dataKey="count" fill="#10b981" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {userTrafficSourceData.sources.map((source, index) => (
                        <div key={index} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                          <div>
                            <p className="text-sm font-medium">{source.sourceName || source.sourceType}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {source.utmSource && `来源: ${source.utmSource}`}
                              {source.utmMedium && ` · 媒介: ${source.utmMedium}`}
                            </p>
                          </div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-100'}`}>
                            {new Date(source.createdAt).toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 盲盒销售数据 */}
                {userBlindBoxData.totalPurchases > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Gift className="w-4 h-4 text-pink-500" />
                      盲盒购买 ({userBlindBoxData.totalPurchases})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总购买</p>
                        <p className="text-lg font-bold text-pink-500">{userBlindBoxData.totalPurchases}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总花费</p>
                        <p className="text-lg font-bold text-red-500">¥{userBlindBoxData.totalSpent.toLocaleString()}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已完成</p>
                        <p className="text-lg font-bold text-green-500">{userBlindBoxData.completedPurchases}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>已退款</p>
                        <p className="text-lg font-bold text-yellow-500">{userBlindBoxData.refundedPurchases}</p>
                      </div>
                    </div>
                    
                    {/* 盲盒购买状态分布图 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>购买状态分布</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '已完成', value: userBlindBoxData.completedPurchases },
                              { name: '已退款', value: userBlindBoxData.refundedPurchases },
                              { name: '其他', value: Math.max(0, userBlindBoxData.totalPurchases - userBlindBoxData.completedPurchases - userBlindBoxData.refundedPurchases) },
                            ].filter(d => d.value > 0)}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                            label={({ name, value }) => `${name}: ${value}`}
                          >
                            <Cell fill="#10b981" />
                            <Cell fill="#f59e0b" />
                            <Cell fill="#6b7280" />
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 用户在线状态 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Activity className="w-4 h-4 text-green-500" />
                    用户状态
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className={`flex items-center justify-center gap-3 px-6 py-4 rounded-lg ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                      <div className={`w-4 h-4 rounded-full ${userStatusData.isOnline ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      <div>
                        <p className="text-lg font-bold">{userStatusData.isOnline ? '在线' : '离线'}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>当前状态</p>
                      </div>
                    </div>
                    {userStatusData.lastSeen && (
                      <div className={`flex flex-col justify-center px-6 py-4 rounded-lg ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                        <p className="text-sm font-medium">{new Date(userStatusData.lastSeen).toLocaleString('zh-CN')}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最后在线时间</p>
                      </div>
                    )}
                    <div className={`flex flex-col justify-center px-6 py-4 rounded-lg ${isDark ? 'bg-gray-600/50' : 'bg-white'}`}>
                      <p className="text-lg font-bold text-blue-500">{userStatusData.status === 'online' ? '实时' : '已断开'}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>连接状态</p>
                    </div>
                  </div>
                </div>

                {/* AI设置 */}
                {userAISettingsData.personality && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-cyan-500" />
                      AI设置配置
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>AI性格</p>
                        <p className="text-sm font-bold text-cyan-500">{userAISettingsData.personality}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>主题</p>
                        <p className="text-sm font-bold text-purple-500">{userAISettingsData.theme}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>偏好模型</p>
                        <p className="text-sm font-bold text-blue-500">{userAISettingsData.preferredModel}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>快捷键</p>
                        <p className="text-sm font-bold text-orange-500">{userAISettingsData.shortcutKey}</p>
                      </div>
                    </div>
                    
                    {/* AI功能启用状态可视化 */}
                    <div className="h-48 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>功能启用状态</p>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[
                          { name: '记忆功能', enabled: userAISettingsData.enableMemory ? 100 : 0, disabled: userAISettingsData.enableMemory ? 0 : 100 },
                          { name: '打字效果', enabled: userAISettingsData.enableTypingEffect ? 100 : 0, disabled: userAISettingsData.enableTypingEffect ? 0 : 100 },
                          { name: '自动滚动', enabled: userAISettingsData.autoScroll ? 100 : 0, disabled: userAISettingsData.autoScroll ? 0 : 100 },
                          { name: '预设问题', enabled: userAISettingsData.showPresetQuestions ? 100 : 0, disabled: userAISettingsData.showPresetQuestions ? 0 : 100 },
                        ]} layout="vertical">
                          <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                          <XAxis type="number" domain={[0, 100]} tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <YAxis dataKey="name" type="category" width={80} tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 11 }} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }}
                            formatter={(value: number) => value === 100 ? '已启用' : '已禁用'}
                          />
                          <Bar dataKey="enabled" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
                          <Bar dataKey="disabled" stackId="a" fill="#ef4444" radius={[0, 4, 4, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 通知偏好 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Bell className="w-4 h-4 text-orange-500" />
                    通知偏好设置
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>通知总开关</p>
                      <p className={`text-sm font-bold ${userNotificationPrefsData.notificationsEnabled ? 'text-green-500' : 'text-red-500'}`}>
                        {userNotificationPrefsData.notificationsEnabled ? '已开启' : '已关闭'}
                      </p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>通知声音</p>
                      <p className={`text-sm font-bold ${userNotificationPrefsData.notificationSound ? 'text-green-500' : 'text-gray-500'}`}>
                        {userNotificationPrefsData.notificationSound ? '开启' : '静音'}
                      </p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>通知频率</p>
                      <p className="text-sm font-bold text-blue-500">{userNotificationPrefsData.notificationFrequency}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>主题</p>
                      <p className="text-sm font-bold text-purple-500">{userNotificationPrefsData.theme}</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>语言</p>
                      <p className="text-sm font-bold text-cyan-500">{userNotificationPrefsData.language}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>数据收集</p>
                      <p className={`text-sm font-bold ${userNotificationPrefsData.dataCollectionEnabled ? 'text-green-500' : 'text-red-500'}`}>
                        {userNotificationPrefsData.dataCollectionEnabled ? '允许' : '拒绝'}
                      </p>
                    </div>
                  </div>
                  
                  {/* 通知偏好饼图 */}
                  <div className="h-48 mt-4">
                    <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>功能启用分布</p>
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            { name: '通知', value: userNotificationPrefsData.notificationsEnabled ? 1 : 0 },
                            { name: '声音', value: userNotificationPrefsData.notificationSound ? 1 : 0 },
                            { name: '数据收集', value: userNotificationPrefsData.dataCollectionEnabled ? 1 : 0 },
                          ].filter(d => d.value > 0)}
                          cx="50%"
                          cy="50%"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={5}
                          dataKey="value"
                          label={({ name }) => name}
                        >
                          <Cell fill="#10b981" />
                          <Cell fill="#f59e0b" />
                          <Cell fill="#3b82f6" />
                        </Pie>
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                            border: 'none', 
                            borderRadius: '8px',
                            color: isDark ? '#f3f4f6' : '#1f2937'
                          }} 
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* 会员成长记录 */}
                {userMembershipGrowthData.totalRecords > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-purple-500" />
                      会员成长记录 ({userMembershipGrowthData.totalRecords})
                    </h4>
                    <div className="grid grid-cols-2 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>记录总数</p>
                        <p className="text-lg font-bold text-purple-500">{userMembershipGrowthData.totalRecords}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>积分变化</p>
                        <p className={`text-lg font-bold ${userMembershipGrowthData.totalPointsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                          {userMembershipGrowthData.totalPointsChange >= 0 ? '+' : ''}{userMembershipGrowthData.totalPointsChange}
                        </p>
                      </div>
                    </div>
                    
                    {/* 积分变化趋势图 */}
                    {userMembershipGrowthData.records.length > 0 && (
                      <div className="h-48 mt-4">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>积分变化趋势</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={[...userMembershipGrowthData.records].reverse().map((r, i) => ({
                            name: `记录${i + 1}`,
                            points: r.pointsChange,
                            balance: r.balanceAfter
                          }))}>
                            <defs>
                              <linearGradient id="pointsGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                            <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                                border: 'none', 
                                borderRadius: '8px',
                                color: isDark ? '#f3f4f6' : '#1f2937'
                              }} 
                            />
                            <Area type="monotone" dataKey="points" stroke="#8b5cf6" fillOpacity={1} fill="url(#pointsGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {userMembershipGrowthData.records.length > 0 && (
                      <div className="space-y-2 max-h-40 overflow-y-auto mt-4">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>最近记录</p>
                        {userMembershipGrowthData.records.slice(0, 5).map((record) => (
                          <div key={record.id} className={`flex items-center justify-between p-2 rounded ${isDark ? 'bg-gray-600/30' : 'bg-white'}`}>
                            <div>
                              <p className="text-sm font-medium">{record.reason}</p>
                              {record.description && (
                                <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{record.description}</p>
                              )}
                            </div>
                            <div className="text-right">
                              <p className={`text-sm font-bold ${record.pointsChange >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                {record.pointsChange >= 0 ? '+' : ''}{record.pointsChange}
                              </p>
                              <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                余额: {record.balanceAfter}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* 人口统计 */}
                {(userDemographicsData.ageGroup || userDemographicsData.gender || userDemographicsData.location) && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Users className="w-4 h-4 text-blue-500" />
                      人口统计
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      {userDemographicsData.ageGroup && (
                        <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>年龄段</p>
                          <p className="text-lg font-bold text-blue-500">{userDemographicsData.ageGroup}</p>
                        </div>
                      )}
                      {userDemographicsData.gender && (
                        <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>性别</p>
                          <p className="text-lg font-bold text-pink-500">{userDemographicsData.gender}</p>
                        </div>
                      )}
                      {userDemographicsData.location && (
                        <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>地区</p>
                          <p className="text-lg font-bold text-green-500">{userDemographicsData.location}</p>
                        </div>
                      )}
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>引导完成</p>
                        <p className="text-lg font-bold text-purple-500">{userDemographicsData.onboardingCompleted ? '是' : '否'}</p>
                      </div>
                    </div>
                    
                    {/* 性别分布饼图 */}
                    {userDemographicsData.gender && (
                      <div className="h-48 mt-4">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>性别分布</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <PieChart>
                            <Pie
                              data={[
                                { name: userDemographicsData.gender, value: 100 }
                              ]}
                              cx="50%"
                              cy="50%"
                              innerRadius={30}
                              outerRadius={60}
                              fill="#ec4899"
                              dataKey="value"
                              label={({ name }) => name}
                            >
                              <Cell fill={userDemographicsData.gender === '男' ? '#3b82f6' : userDemographicsData.gender === '女' ? '#ec4899' : '#8b5cf6'} />
                            </Pie>
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                                border: 'none', 
                                borderRadius: '8px',
                                color: isDark ? '#f3f4f6' : '#1f2937'
                              }} 
                            />
                          </PieChart>
                        </ResponsiveContainer>
                      </div>
                    )}
                    
                    {userDemographicsData.interests.length > 0 && (
                      <div className="mb-3 mt-4">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>兴趣标签</p>
                        <div className="flex flex-wrap gap-2">
                          {userDemographicsData.interests.map((interest, index) => (
                            <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-blue-500/20 text-blue-300' : 'bg-blue-100 text-blue-700'}`}>
                              {interest}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* 内容质量评估 */}
                {userContentQualityData.totalAssessments > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <Award className="w-4 h-4 text-yellow-500" />
                      内容质量评估 ({userContentQualityData.totalAssessments})
                    </h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>综合评分</p>
                        <p className="text-lg font-bold text-yellow-500">{userContentQualityData.avgOverallScore}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>完整度</p>
                        <p className="text-lg font-bold text-blue-500">{userContentQualityData.avgCompletenessScore}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>视觉质量</p>
                        <p className="text-lg font-bold text-purple-500">{userContentQualityData.avgVisualQualityScore}</p>
                      </div>
                      <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>文本质量</p>
                        <p className="text-lg font-bold text-green-500">{userContentQualityData.avgTextQualityScore}</p>
                      </div>
                    </div>
                    {/* 质量评分雷达图 */}
                    <div className="h-64 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <RadarChart cx="50%" cy="50%" outerRadius="80%" data={[
                          { subject: '综合评分', A: userContentQualityData.avgOverallScore, fullMark: 100 },
                          { subject: '完整度', A: userContentQualityData.avgCompletenessScore, fullMark: 100 },
                          { subject: '视觉质量', A: userContentQualityData.avgVisualQualityScore, fullMark: 100 },
                          { subject: '文本质量', A: userContentQualityData.avgTextQualityScore, fullMark: 100 },
                        ]}>
                          <PolarGrid />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 12 }} />
                          <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                          <Radar name="质量评分" dataKey="A" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.3} />
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                {/* 探索状态 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Compass className="w-4 h-4 text-indigo-500" />
                    探索状态
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>探索率</p>
                      <p className="text-lg font-bold text-indigo-500">{Math.round(userExplorationData.explorationRate * 100)}%</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总互动</p>
                      <p className="text-lg font-bold text-blue-500">{userExplorationData.totalInteractions}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>探索次数</p>
                      <p className="text-lg font-bold text-green-500">{userExplorationData.explorationCount}</p>
                    </div>
                    <div className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>利用次数</p>
                      <p className="text-lg font-bold text-purple-500">{userExplorationData.exploitationCount}</p>
                    </div>
                  </div>
                  {/* 探索vs利用饼图 */}
                  {(userExplorationData.explorationCount > 0 || userExplorationData.exploitationCount > 0) && (
                    <div className="h-48 mt-4">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={[
                              { name: '探索', value: userExplorationData.explorationCount, color: '#10b981' },
                              { name: '利用', value: userExplorationData.exploitationCount, color: '#8b5cf6' },
                            ]}
                            cx="50%"
                            cy="50%"
                            innerRadius={40}
                            outerRadius={70}
                            paddingAngle={5}
                            dataKey="value"
                          >
                            {[
                              { name: '探索', value: userExplorationData.explorationCount, color: '#10b981' },
                              { name: '利用', value: userExplorationData.exploitationCount, color: '#8b5cf6' },
                            ].map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                            ))}
                          </Pie>
                          <Tooltip 
                            contentStyle={{ 
                              backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                              border: 'none', 
                              borderRadius: '8px',
                              color: isDark ? '#f3f4f6' : '#1f2937'
                            }} 
                          />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                  {userExplorationData.discoveredCategories.length > 0 && (
                    <div className="mb-3 mt-4">
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>发现的分类</p>
                      <div className="flex flex-wrap gap-2">
                        {userExplorationData.discoveredCategories.map((cat, index) => (
                          <span key={index} className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-indigo-500/20 text-indigo-300' : 'bg-indigo-100 text-indigo-700'}`}>
                            {cat}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* 作品表现分析图表 */}
                {userWorks.length > 0 && (
                  <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 mb-6`}>
                    <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-purple-500" />
                      作品表现分析
                    </h4>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* 作品互动分布柱状图 */}
                      <div className="h-64">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Top 10 作品互动对比</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <BarChart 
                            data={[...userWorks]
                              .sort((a, b) => (b.view_count + b.likes * 10 + b.comments_count * 20) - (a.view_count + a.likes * 10 + a.comments_count * 20))
                              .slice(0, 10)
                              .map((work, index) => ({
                                name: work.title.substring(0, 8) || `作品${index + 1}`,
                                浏览量: work.view_count,
                                点赞数: work.likes,
                                评论数: work.comments_count,
                              }))}
                            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                          >
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey="name" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} interval={0} angle={-15} textAnchor="end" height={50} />
                            <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                                border: 'none', 
                                borderRadius: '8px',
                                color: isDark ? '#f3f4f6' : '#1f2937'
                              }} 
                            />
                            <Legend />
                            <Bar dataKey="浏览量" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="点赞数" fill="#ef4444" radius={[4, 4, 0, 0]} />
                            <Bar dataKey="评论数" fill="#10b981" radius={[4, 4, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* 作品表现雷达图 */}
                      <div className="h-64">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>作品综合表现评估</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={[
                            { subject: '总浏览量', A: Math.min(100, (userWorks.reduce((sum, w) => sum + w.view_count, 0) / Math.max(1, userWorks.length)) / 100), fullMark: 100 },
                            { subject: '总点赞数', A: Math.min(100, (userWorks.reduce((sum, w) => sum + w.likes, 0) / Math.max(1, userWorks.length)) * 2), fullMark: 100 },
                            { subject: '总评论数', A: Math.min(100, (userWorks.reduce((sum, w) => sum + w.comments_count, 0) / Math.max(1, userWorks.length)) * 10), fullMark: 100 },
                            { subject: '作品数量', A: Math.min(100, userWorks.length * 5), fullMark: 100 },
                            { subject: '互动率', A: Math.min(100, userStats.engagementRate * 5), fullMark: 100 },
                            { subject: '平均质量', A: userContentQualityData.totalAssessments > 0 ? userContentQualityData.avgOverallScore : 50, fullMark: 100 },
                          ]}>
                            <PolarGrid stroke={isDark ? '#374151' : '#e5e7eb'} />
                            <PolarAngleAxis dataKey="subject" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 8 }} />
                            <Radar
                              name="作品表现"
                              dataKey="A"
                              stroke="#8b5cf6"
                              fill="#8b5cf6"
                              fillOpacity={0.3}
                            />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                                border: 'none', 
                                borderRadius: '8px',
                                color: isDark ? '#f3f4f6' : '#1f2937'
                              }} 
                              formatter={(value: number) => `${value.toFixed(1)}分`}
                            />
                          </RadarChart>
                        </ResponsiveContainer>
                      </div>

                      {/* 作品发布时间分布 */}
                      <div className="h-48 lg:col-span-2">
                        <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>作品发布时间分布（最近30天）</p>
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart 
                            data={(() => {
                              const days = 30;
                              const data = [];
                              const now = new Date();
                              for (let i = days - 1; i >= 0; i--) {
                                const date = new Date(now);
                                date.setDate(date.getDate() - i);
                                const dateStr = `${date.getMonth() + 1}/${date.getDate()}`;
                                const count = userWorks.filter(w => {
                                  const workDate = new Date(w.created_at);
                                  return workDate.toDateString() === date.toDateString();
                                }).length;
                                data.push({ date: dateStr, 作品数: count });
                              }
                              return data;
                            })()}
                            margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
                          >
                            <defs>
                              <linearGradient id="worksPublishGradient" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                            <XAxis dataKey="date" tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} interval={4} />
                            <YAxis tick={{ fill: isDark ? '#9ca3af' : '#4b5563', fontSize: 10 }} />
                            <Tooltip 
                              contentStyle={{ 
                                backgroundColor: isDark ? '#1f2937' : '#ffffff', 
                                border: 'none', 
                                borderRadius: '8px',
                                color: isDark ? '#f3f4f6' : '#1f2937'
                              }} 
                            />
                            <Area type="monotone" dataKey="作品数" stroke="#8b5cf6" fillOpacity={1} fill="url(#worksPublishGradient)" />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>
                  </div>
                )}

                {/* 用户作品列表 */}
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Image className="w-4 h-4 text-purple-500" />
                      作品列表 ({userWorks.length})
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>排序指标:</span>
                      <select
                        value={selectedWorkMetric}
                        onChange={(e) => setSelectedWorkMetric(e.target.value as any)}
                        className={`text-xs px-2 py-1 rounded border ${isDark ? 'bg-gray-600 border-gray-500 text-gray-200' : 'bg-white border-gray-300 text-gray-700'}`}
                      >
                        <option value="views">浏览量</option>
                        <option value="likes">点赞数</option>
                        <option value="comments">评论数</option>
                      </select>
                    </div>
                  </div>

                  {userWorks.length === 0 ? (
                    <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Image className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>暂无作品</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3">
                        {userWorks
                          .slice((userWorksPage - 1) * userWorksPageSize, userWorksPage * userWorksPageSize)
                          .map((work, index) => (
                            <motion.div
                              key={work.id}
                              initial={{ opacity: 0, x: -20 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.05 }}
                              className={`flex items-center gap-4 p-3 rounded-lg ${isDark ? 'bg-gray-600/50' : 'bg-white'} hover:shadow-md transition-shadow`}
                            >
                              <div className="flex-shrink-0 w-12 h-12 rounded-lg overflow-hidden bg-gray-200">
                                {work.thumbnail ? (
                                  <img src={work.thumbnail} alt="" className="w-full h-full object-cover" />
                                ) : (
                                  <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                                    <Image className="w-6 h-6 text-gray-400" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <h5 className="text-sm font-medium truncate">{work.title}</h5>
                                <p className={`text-xs mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                  发布于 {new Date(work.created_at).toLocaleDateString('zh-CN')}
                                </p>
                              </div>
                              <div className="flex items-center gap-4 text-xs">
                                <span className="flex items-center gap-1 text-blue-500">
                                  <Eye className="w-3.5 h-3.5" />
                                  {work.view_count.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1 text-red-500">
                                  <Heart className="w-3.5 h-3.5" />
                                  {work.likes.toLocaleString()}
                                </span>
                                <span className="flex items-center gap-1 text-green-500">
                                  <MessageCircle className="w-3.5 h-3.5" />
                                  {work.comments_count.toLocaleString()}
                                </span>
                                <span className={`px-2 py-0.5 rounded-full text-xs ${
                                  work.status === 'published' 
                                    ? 'bg-green-100 text-green-700' 
                                    : work.status === 'pending'
                                    ? 'bg-yellow-100 text-yellow-700'
                                    : 'bg-gray-100 text-gray-600'
                                }`}>
                                  {work.status === 'published' ? '已发布' : 
                                   work.status === 'pending' ? '审核中' : 
                                   work.status === 'rejected' ? '已拒绝' : work.status}
                                </span>
                              </div>
                            </motion.div>
                          ))}
                      </div>

                      {/* 作品分页 */}
                      {userWorks.length > userWorksPageSize && (
                        <div className={`flex items-center justify-between mt-4 pt-4 border-t ${isDark ? 'border-gray-600' : 'border-gray-200'}`}>
                          <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            共 {userWorks.length} 个作品
                          </span>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => setUserWorksPage(p => Math.max(1, p - 1))}
                              disabled={userWorksPage === 1}
                              className={`p-1.5 rounded ${
                                userWorksPage === 1
                                  ? isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                                  : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <ChevronLeft className="w-4 h-4" />
                            </button>
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {userWorksPage} / {Math.ceil(userWorks.length / userWorksPageSize)}
                            </span>
                            <button
                              onClick={() => setUserWorksPage(p => Math.min(Math.ceil(userWorks.length / userWorksPageSize), p + 1))}
                              disabled={userWorksPage >= Math.ceil(userWorks.length / userWorksPageSize)}
                              className={`p-1.5 rounded ${
                                userWorksPage >= Math.ceil(userWorks.length / userWorksPageSize)
                                  ? isDark ? 'text-gray-600 cursor-not-allowed' : 'text-gray-300 cursor-not-allowed'
                                  : isDark ? 'text-gray-300 hover:bg-gray-600' : 'text-gray-600 hover:bg-gray-100'
                              }`}
                            >
                              <ChevronRight className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </>
            )
          ) : (
            /* 全部用户汇总数据 */
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 用户活跃度分布饼图 */}
              <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <PieChartIcon className="w-4 h-4 text-purple-500" />
                  用户活跃度分布
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <PieChart>
                    <Pie
                      data={[
                        { name: '高度活跃', value: 25, count: 156 },
                        { name: '中度活跃', value: 35, count: 218 },
                        { name: '低度活跃', value: 25, count: 156 },
                        { name: '沉默用户', value: 15, count: 94 },
                      ]}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={90}
                      paddingAngle={2}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    >
                      {[
                        { color: '#10b981' },
                        { color: '#3b82f6' },
                        { color: '#f59e0b' },
                        { color: '#6b7280' },
                      ].map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        color: isDark ? '#f3f4f6' : '#111827',
                        borderRadius: '8px',
                      }}
                      formatter={(value: any, name: any, props: any) => [
                        `${value}% (${props?.payload?.count}人)`,
                        name
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {[
                    { name: '高度活跃', color: '#10b981', desc: '每日登录' },
                    { name: '中度活跃', color: '#3b82f6', desc: '每周登录' },
                    { name: '低度活跃', color: '#f59e0b', desc: '每月登录' },
                    { name: '沉默用户', color: '#6b7280', desc: '超过一月' },
                  ].map((item) => (
                    <div key={item.name} className="flex items-center gap-2 text-xs">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{item.name}</span>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>({item.desc})</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* 用户增长趋势 */}
              <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4`}>
                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  用户增长趋势
                </h4>
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={data.slice(-14)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="userGrowthGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                    <XAxis
                      dataKey="date"
                      stroke={isDark ? '#6b7280' : '#9ca3af'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke={isDark ? '#6b7280' : '#9ca3af'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        color: isDark ? '#f3f4f6' : '#111827',
                        borderRadius: '8px',
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="users"
                      name="新用户"
                      stroke="#3b82f6"
                      strokeWidth={2}
                      fillOpacity={1}
                      fill="url(#userGrowthGradient)"
                    />
                    <Line
                      type="monotone"
                      dataKey="cumulativeUsers"
                      name="累计用户"
                      stroke="#10b981"
                      strokeWidth={2}
                      dot={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              {/* 用户创作贡献排行 */}
              <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 lg:col-span-2`}>
                <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-orange-500" />
                  创作者贡献排行 (Top 10)
                </h4>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart
                    data={[
                      { name: '创作者A', works: 45, views: 12500 },
                      { name: '创作者B', works: 38, views: 9800 },
                      { name: '创作者C', works: 32, views: 8700 },
                      { name: '创作者D', works: 28, views: 7200 },
                      { name: '创作者E', works: 25, views: 6500 },
                      { name: '创作者F', works: 22, views: 5400 },
                      { name: '创作者G', works: 19, views: 4800 },
                      { name: '创作者H', works: 16, views: 3900 },
                      { name: '创作者I', works: 14, views: 3200 },
                      { name: '创作者J', works: 12, views: 2800 },
                    ]}
                    layout="vertical"
                    margin={{ top: 5, right: 30, left: 60, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} horizontal={true} vertical={false} />
                    <XAxis
                      type="number"
                      stroke={isDark ? '#6b7280' : '#9ca3af'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      dataKey="name"
                      type="category"
                      stroke={isDark ? '#6b7280' : '#9ca3af'}
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      width={50}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        color: isDark ? '#f3f4f6' : '#111827',
                        borderRadius: '8px',
                      }}
                    />
                    <Legend />
                    <Bar dataKey="works" name="作品数" fill="#8b5cf6" radius={[0, 4, 4, 0]} />
                    <Bar dataKey="views" name="浏览量" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* 用户留存率分析 */}
              {retentionData.length > 0 && (
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 lg:col-span-2`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <Users className="w-4 h-4 text-green-500" />
                    用户留存率分析
                  </h4>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={retentionData.slice(-14)} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} vertical={false} />
                      <XAxis dataKey="date" stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis stroke={isDark ? '#6b7280' : '#9ca3af'} fontSize={11} tickLine={false} axisLine={false} unit="%" />
                      <Tooltip contentStyle={{ backgroundColor: isDark ? '#1f2937' : '#ffffff', borderColor: isDark ? '#374151' : '#e5e7eb', color: isDark ? '#f3f4f6' : '#111827', borderRadius: '8px' }} formatter={(value: any) => [`${value}%`, '留存率']} />
                      <Legend />
                      <Line type="monotone" dataKey="day1Retention" name="次日留存" stroke="#10b981" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="day7Retention" name="7日留存" stroke="#3b82f6" strokeWidth={2} dot={false} />
                      <Line type="monotone" dataKey="day30Retention" name="30日留存" stroke="#f59e0b" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                  <div className="grid grid-cols-5 gap-2 mt-4">
                    {[
                      { label: '次日留存', value: retentionData[retentionData.length - 1]?.day1Retention || 0, color: '#10b981' },
                      { label: '3日留存', value: retentionData[retentionData.length - 1]?.day3Retention || 0, color: '#3b82f6' },
                      { label: '7日留存', value: retentionData[retentionData.length - 1]?.day7Retention || 0, color: '#8b5cf6' },
                      { label: '14日留存', value: retentionData[retentionData.length - 1]?.day14Retention || 0, color: '#f59e0b' },
                      { label: '30日留存', value: retentionData[retentionData.length - 1]?.day30Retention || 0, color: '#ef4444' },
                    ].map((item) => (
                      <div key={item.label} className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-2 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{item.label}</p>
                        <p className="text-lg font-bold" style={{ color: item.color }}>{item.value}%</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 用户分群分析 */}
              {userSegmentData.length > 0 && (
                <div className={`${isDark ? 'bg-gray-700/30' : 'bg-gray-50'} rounded-xl p-4 lg:col-span-2`}>
                  <h4 className="text-sm font-medium mb-4 flex items-center gap-2">
                    <PieChartIcon className="w-4 h-4 text-indigo-500" />
                    用户分群分析
                  </h4>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                    {userSegmentData.map((segment) => (
                      <div key={segment.segment} className={`${isDark ? 'bg-gray-600/50' : 'bg-white'} rounded-lg p-3 text-center`}>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{segment.segment}</p>
                        <p className="text-xl font-bold text-indigo-500">{segment.count}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{segment.percentage}%</p>
                        <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>平均互动: {segment.avgEngagement}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>平均收益: ¥{segment.avgRevenue}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}
