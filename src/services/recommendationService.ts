/**
 * 智能推荐服务模块 - 基于用户行为和偏好提供个性化推荐
 * 
 * ============================================
 * 数据源说明 (重要!)
 * ============================================
 * 
 * 本推荐系统使用以下数据源：
 * 
 * 1. WORKS (作品) - 主要推荐内容
 *    - 存储key: 'works' 或 'jmzf_works'
 *    - 数据来源: 首页作品展示、用户创作的作品
 *    - 对应数据库表: works
 *    - 用途: 推荐给用户浏览和互动的创作内容
 * 
 * 2. CHALLENGES (挑战/活动)
 *    - 存储key: 'challenges' 或 'jmzf_challenges'
 *    - 数据来源: 平台发布的创作挑战、文化活动
 *    - 对应数据库表: challenges
 *    - 用途: 推荐用户参与的活动
 * 
 * 3. TEMPLATES (模板)
 *    - 存储key: 'templates' 或 'jmzf_templates'
 *    - 数据来源: AI创作模板、设计模板
 *    - 对应数据库表: templates
 *    - 用途: 推荐创作时使用的模板
 * 
 * 注意: POSTS (帖子/社区内容) 不用于推荐系统
 *    - posts 用于社区讨论，不是创作作品
 *    - 推荐系统只推荐 works (作品)
 * 
 * ============================================
 */

// 用户行为类型
export type UserActionType = 'view' | 'like' | 'comment' | 'share' | 'save' | 'submit' | 'participate' | 'download' | 'click' | 'search' | 'dislike' | 'hide' | 'feedback';

// 用户行为接口
export interface UserAction {
  id: string;
  userId: string;
  itemId: string;
  itemType: 'post' | 'challenge' | 'template' | 'user' | 'tag' | 'culturalElement';
  actionType: UserActionType;
  timestamp: string;
  value?: number; // 可选的评分或权重
  metadata?: Record<string, any>;
}

// 用户偏好接口
export interface UserPreference {
  userId: string;
  interests: Record<string, number>; // 兴趣标签及其权重
  culturalElements: Record<string, number>; // 文化元素偏好及其权重
  categories: Record<string, number>; // 内容分类偏好及其权重
  themes: Record<string, number>; // 主题偏好及其权重
  tags: Record<string, number>; // 标签偏好及其权重
  updateFrequency: number; // 更新频率（秒）
  lastUpdated: string;
}

// 推荐内容接口
export interface RecommendedItem {
  id: string;
  type: 'post' | 'challenge' | 'template' | 'user';
  title: string;
  thumbnail?: string;
  score: number; // 推荐分数
  reason?: string; // 推荐理由
  metadata?: Record<string, any>;
}

// 推荐策略类型
export type RecommendationStrategy = 'content' | 'collaborative' | 'hybrid' | 'trending' | 'similar' | 'diverse';

// 推荐选项接口
export interface RecommendationOptions {
  strategy?: RecommendationStrategy;
  limit?: number;
  includeDiverse?: boolean;
  recentDays?: number; // 只考虑最近N天的行为
  diversityThreshold?: number; // 多样性阈值
  userId?: string; // 可选的用户ID，用于个性化推荐
}

// 推荐反馈类型
export type RecommendationFeedbackType = 'like' | 'dislike' | 'hide' | 'report';

// 推荐反馈接口
export interface RecommendationFeedback {
  id: string;
  userId: string;
  itemId: string;
  itemType: RecommendedItem['type'];
  feedbackType: RecommendationFeedbackType;
  timestamp: string;
  reason?: string;
  metadata?: Record<string, any>;
}

// 协同过滤用户相似度接口
export interface UserSimilarity {
  userId: string;
  similarUsers: Array<{ userId: string; similarity: number }>;
  timestamp: string;
}

// ============================================
// 数据源类型定义
// ============================================

/**
 * 作品 (Work) - 用户创作的原创内容
 * 对应数据库表: works
 */
export interface Work {
  id: string;
  title: string;
  thumbnail?: string;
  category?: string;
  tags?: string[];
  culturalElements?: string[];
  theme?: string;
  likes?: number;
  views?: number;
  shares?: number;
  upvotes?: number;
  comments?: any[];
  createdAt?: string;
  authorId?: string;
  authorName?: string;
  [key: string]: any;
}

/**
 * 挑战/活动 (Challenge)
 * 对应数据库表: challenges
 */
export interface Challenge {
  id: string;
  title: string;
  featuredImage?: string;
  participants?: number;
  submissionCount?: number;
  views?: number;
  startDate?: string;
  endDate?: string;
  [key: string]: any;
}

/**
 * 模板 (Template)
 * 对应数据库表: templates
 */
export interface Template {
  id: string;
  name: string;
  preview?: string;
  category?: string;
  tags?: string[];
  usageCount?: number;
  createdAt?: string;
  [key: string]: any;
}

/**
 * 推荐数据源集合
 */
export interface RecommendationDataSource {
  works: Work[];        // 作品数据 (主要推荐内容)
  challenges: Challenge[]; // 挑战/活动数据
  templates: Template[];   // 模板数据
}

// ============================================
// 常量定义
// ============================================
const USER_ACTIONS_KEY = 'jmzf_user_actions';
const USER_PREFERENCES_KEY = 'jmzf_user_preferences';
const RECOMMENDATIONS_KEY = 'jmzf_recommendations';
const USER_SIMILARITIES_KEY = 'jmzf_user_similarities';
const RECOMMENDATION_FEEDBACK_KEY = 'jmzf_recommendation_feedback';
const DIVERSITY_CACHE_KEY = 'jmzf_recommendation_diversity';

// 行为权重配置
const ACTION_WEIGHTS: Record<UserActionType, number> = {
  view: 1,
  like: 5,
  comment: 8,
  share: 10,
  save: 7,
  submit: 12,
  participate: 15,
  download: 6,
  click: 2,
  search: 3,
  dislike: -10,  // 负向权重
  hide: -5,      // 负向权重
  feedback: 4    // 反馈权重
};

// 推荐策略权重配置
const STRATEGY_WEIGHTS: Record<RecommendationStrategy, number> = {
  content: 0.4,
  collaborative: 0.3,
  trending: 0.2,
  similar: 0.1,
  hybrid: 1.0,     // 混合策略权重（用于归一化）
  diverse: 0.15    // 多样性权重
};

// 多样性配置
const DIVERSITY_SETTINGS = {
  maxItemsPerCategory: 0.3, // 每个分类最多占30%
  maxItemsPerTheme: 0.25,    // 每个主题最多占25%
  minItemTypes: 2,           // 至少包含2种类型
  recencyWeight: 0.15,       // 新鲜度权重
  diversityScoreWeight: 0.1  // 多样性分数权重
};

/**
 * 获取用户行为记录
 * @param userId 可选，指定用户ID，不提供则返回所有用户的行为记录
 */
export function getUserActions(userId?: string): UserAction[] {
  const raw = localStorage.getItem(USER_ACTIONS_KEY);
  const allActions = raw ? JSON.parse(raw) as UserAction[] : [];
  return userId ? allActions.filter((action: UserAction) => action.userId === userId) : allActions;
}

/**
 * 记录用户行为
 */
export function recordUserAction(action: Omit<UserAction, 'id' | 'timestamp'>): UserAction {
  const newAction: UserAction = {
    id: `action-${Date.now()}`,
    timestamp: new Date().toISOString(),
    ...action
  };
  
  const actions = getUserActions();
  actions.push(newAction);
  localStorage.setItem(USER_ACTIONS_KEY, JSON.stringify(actions));
  
  // 更新用户偏好
  updateUserPreferences(newAction.userId);
  
  // 添加到待同步队列（用于后端同步）
  try {
    const { addPendingSyncAction } = require('./recommendationBackendService');
    addPendingSyncAction(newAction);
  } catch (e) {
    // 如果后端服务未加载，忽略错误
  }
  
  return newAction;
}

/**
 * 获取用户偏好
 */
export function getUserPreferences(userId: string): UserPreference | undefined {
  const raw = localStorage.getItem(USER_PREFERENCES_KEY);
  const allPreferences = raw ? JSON.parse(raw) : [];
  return allPreferences.find((pref: UserPreference) => pref.userId === userId);
}

/**
 * 初始化用户偏好
 */
export function initializeUserPreferences(userId: string): UserPreference {
  const newPreference: UserPreference = {
    userId,
    interests: {},
    culturalElements: {},
    categories: {},
    themes: {},
    tags: {},
    updateFrequency: 3600, // 默认每小时更新一次
    lastUpdated: new Date().toISOString()
  };
  
  const allPreferences = JSON.parse(localStorage.getItem(USER_PREFERENCES_KEY) || '[]');
  const existingIndex = allPreferences.findIndex((pref: UserPreference) => pref.userId === userId);
  
  if (existingIndex !== -1) {
    allPreferences[existingIndex] = newPreference;
  } else {
    allPreferences.push(newPreference);
  }
  
  localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(allPreferences));
  return newPreference;
}

/**
 * 更新用户偏好
 */
export function updateUserPreferences(userId: string): UserPreference {
  const actions = getUserActions().filter(action => action.userId === userId);
  const preference = getUserPreferences(userId) || initializeUserPreferences(userId);
  
  // 重置偏好权重
  const interests: Record<string, number> = {};
  const culturalElements: Record<string, number> = {};
  const categories: Record<string, number> = {};
  const themes: Record<string, number> = {};
  const tags: Record<string, number> = {};
  
  // 分析用户行为，计算偏好权重
  actions.forEach(action => {
    const weight = ACTION_WEIGHTS[action.actionType] * (action.value || 1);
    
    // 根据行为类型更新不同的偏好
    switch (action.itemType) {
      case 'tag':
        interests[action.itemId] = (interests[action.itemId] || 0) + weight;
        tags[action.itemId] = (tags[action.itemId] || 0) + weight;
        break;
      case 'culturalElement':
        culturalElements[action.itemId] = (culturalElements[action.itemId] || 0) + weight;
        break;
      case 'post':
        // 从元数据中提取分类、主题和标签
        if (action.metadata) {
          if (action.metadata.category) {
            categories[action.metadata.category] = (categories[action.metadata.category] || 0) + weight;
          }
          if (action.metadata.theme) {
            themes[action.metadata.theme] = (themes[action.metadata.theme] || 0) + weight;
          }
          if (action.metadata.tags) {
            action.metadata.tags.forEach((tag: string) => {
              tags[tag] = (tags[tag] || 0) + weight;
              interests[tag] = (interests[tag] || 0) + weight;
            });
          }
          if (action.metadata.culturalElements) {
            action.metadata.culturalElements.forEach((element: string) => {
              culturalElements[element] = (culturalElements[element] || 0) + weight;
            });
          }
        }
        break;
      case 'challenge':
        // 从元数据中提取主题、文化元素和标签
        if (action.metadata) {
          if (action.metadata.theme) {
            themes[action.metadata.theme] = (themes[action.metadata.theme] || 0) + weight;
          }
          if (action.metadata.culturalElements) {
            action.metadata.culturalElements.forEach((element: string) => {
              culturalElements[element] = (culturalElements[element] || 0) + weight;
            });
          }
          if (action.metadata.tags) {
            action.metadata.tags.forEach((tag: string) => {
              tags[tag] = (tags[tag] || 0) + weight;
              interests[tag] = (interests[tag] || 0) + weight;
            });
          }
        }
        break;
      case 'template':
        // 从元数据中提取标签和分类
        if (action.metadata) {
          if (action.metadata.category) {
            categories[action.metadata.category] = (categories[action.metadata.category] || 0) + weight;
          }
          if (action.metadata.tags) {
            action.metadata.tags.forEach((tag: string) => {
              tags[tag] = (tags[tag] || 0) + weight;
              interests[tag] = (interests[tag] || 0) + weight;
            });
          }
        }
        break;
    }
  });
  
  // 更新偏好
  const updatedPreference: UserPreference = {
    ...preference,
    interests,
    culturalElements,
    categories,
    themes,
    tags,
    lastUpdated: new Date().toISOString()
  };
  
  // 保存更新后的偏好
  const allPreferences = JSON.parse(localStorage.getItem(USER_PREFERENCES_KEY) || '[]');
  const existingIndex = allPreferences.findIndex((pref: UserPreference) => pref.userId === userId);
  
  if (existingIndex !== -1) {
    allPreferences[existingIndex] = updatedPreference;
  } else {
    allPreferences.push(updatedPreference);
  }
  
  localStorage.setItem(USER_PREFERENCES_KEY, JSON.stringify(allPreferences));
  
  return updatedPreference;
}

/**
 * 获取推荐数据源
 * 尝试从多个可能的来源获取数据
 * 
 * 数据源优先级：
 * 1. works (作品) - 主要推荐内容，对应数据库表: works
 * 2. challenges (挑战) - 活动推荐，对应数据库表: challenges  
 * 3. templates (模板) - 模板推荐，对应数据库表: templates
 * 
 * 注意：不使用 posts (帖子/社区内容)
 */
function getRecommendationData(): RecommendationDataSource {
  // ============================================
  // 1. 获取 WORKS (作品) 数据 - 主要推荐内容
  // ============================================
  const jmzfWorks = localStorage.getItem('jmzf_works');
  const worksData = localStorage.getItem('works');
  
  // 备选：posts 数据（向后兼容，但 posts 是社区帖子，不是作品）
  const jmzfPosts = localStorage.getItem('jmzf_posts');
  const postsData = localStorage.getItem('posts');
  
  console.log('📊 推荐系统数据源调试:', {
    hasJmzfWorks: !!jmzfWorks,
    hasWorks: !!worksData,
    hasHomePageData: !!localStorage.getItem('homePageData'),
    note: 'works = 作品(创作内容), posts = 帖子(社区讨论)'
  });
  
  // 优先使用 works 数据（作品）
  let works: Work[] = JSON.parse(jmzfWorks || worksData || '[]');
  
  // 如果没有 works，尝试使用 posts（向后兼容）
  if (works.length === 0) {
    works = JSON.parse(jmzfPosts || postsData || '[]');
    if (works.length > 0) {
      console.warn('⚠️ 使用 posts 数据作为备选，建议将作品数据保存到 works key');
    }
  }
  
  // ============================================
  // 2. 获取 CHALLENGES (挑战/活动) 数据
  // ============================================
  const challenges: Challenge[] = JSON.parse(
    localStorage.getItem('jmzf_challenges') || 
    localStorage.getItem('challenges') || 
    '[]'
  );
  
  // ============================================
  // 3. 获取 TEMPLATES (模板) 数据
  // ============================================
  const templates: Template[] = JSON.parse(
    localStorage.getItem('jmzf_templates') || 
    localStorage.getItem('templates') || 
    '[]'
  );
  
  // ============================================
  // 4. 如果 localStorage 中没有数据，尝试从首页缓存获取
  // ============================================
  if (works.length === 0) {
    try {
      const homePageData = localStorage.getItem('homePageData');
      console.log('🔄 尝试从 homePageData 获取 works:', !!homePageData);
      if (homePageData) {
        const { works: homeWorks } = JSON.parse(homePageData);
        console.log('📦 homePageData 中的 works 数量:', homeWorks?.length);
        if (Array.isArray(homeWorks) && homeWorks.length > 0) {
          works = homeWorks;
        }
      }
    } catch (e) {
      console.error('❌ 解析 homePageData 失败:', e);
    }
  }
  
  console.log('✅ 推荐数据源结果:', { 
    works: works.length, 
    challenges: challenges.length, 
    templates: templates.length,
    dataTypes: {
      works: '作品(创作内容)',
      challenges: '挑战/活动',
      templates: '模板'
    }
  });
  
  return { works, challenges, templates };
}

/**
 * 生成基于内容的推荐
 */
export function generateContentBasedRecommendations(userId: string, limit: number = 20): RecommendedItem[] {
  const preference = getUserPreferences(userId) || initializeUserPreferences(userId);
  
  // 1. 获取所有可能的推荐项
  const { works, challenges, templates } = getRecommendationData();
  
  // 2. 为每个项目计算推荐分数
  const recommendedItems: RecommendedItem[] = [];
  
  // 处理作品推荐
  works.forEach((work: any) => {
    let score = 0;
    const reasons: string[] = [];
    
    // 根据分类计算分数
    if (work.category && preference.categories[work.category]) {
      score += preference.categories[work.category] * 0.3;
      reasons.push(`您喜欢${work.category}类型的内容`);
    }
    
    // 根据标签计算分数
    if (work.tags) {
      work.tags.forEach((tag: string) => {
        if (preference.tags[tag]) {
          score += preference.tags[tag] * 0.2;
          reasons.push(`您对${tag}感兴趣`);
        }
      });
    }
    
    // 根据文化元素计算分数
    if (work.culturalElements) {
      work.culturalElements.forEach((element: string) => {
        if (preference.culturalElements[element]) {
          score += preference.culturalElements[element] * 0.25;
          reasons.push(`您喜欢${element}文化元素`);
        }
      });
    }
    
    // 根据主题计算分数
    if (work.theme && preference.themes[work.theme]) {
      score += preference.themes[work.theme] * 0.15;
      reasons.push(`您喜欢${work.theme}主题`);
    }
    
    // 根据互动数据调整分数
    score += (work.likes * 0.01) + (work.views * 0.001) + (work.shares * 0.02) + (work.upvotes || 0) * 0.01;
    
    // 新鲜度权重
    if (work.createdAt) {
      const daysOld = (Date.now() - new Date(work.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 1 - daysOld / 30) * DIVERSITY_SETTINGS.recencyWeight;
    }
    
    // 只添加分数大于0的推荐项
    if (score > 0) {
      recommendedItems.push({
        id: work.id,
        type: 'post',
        title: work.title,
        thumbnail: work.thumbnail,
        score,
        reason: reasons.slice(0, 2).join('，'),
        metadata: work
      });
    }
  });
  
  // 处理挑战推荐
  challenges.forEach((challenge: any) => {
    let score = 0;
    const reasons: string[] = [];
    
    // 根据主题计算分数
    if (challenge.theme && preference.themes[challenge.theme]) {
      score += preference.themes[challenge.theme] * 0.3;
      reasons.push(`您喜欢${challenge.theme}主题`);
    }
    
    // 根据文化元素计算分数
    if (challenge.culturalElements) {
      challenge.culturalElements.forEach((element: string) => {
        if (preference.culturalElements[element]) {
          score += preference.culturalElements[element] * 0.3;
          reasons.push(`您喜欢${element}文化元素`);
        }
      });
    }
    
    // 根据标签计算分数
    if (challenge.tags) {
      challenge.tags.forEach((tag: string) => {
        if (preference.tags[tag]) {
          score += preference.tags[tag] * 0.2;
          reasons.push(`您对${tag}感兴趣`);
        }
      });
    }
    
    // 根据参与度调整分数
    score += (challenge.participants * 0.02) + (challenge.submissionCount * 0.03);
    
    // 新鲜度权重
    if (challenge.startDate) {
      const daysToStart = (new Date(challenge.startDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 1 - Math.abs(daysToStart) / 30) * DIVERSITY_SETTINGS.recencyWeight;
    }
    
    // 只添加分数大于0的推荐项
    if (score > 0) {
      recommendedItems.push({
        id: challenge.id,
        type: 'challenge',
        title: challenge.title,
        thumbnail: challenge.featuredImage,
        score,
        reason: reasons.slice(0, 2).join('，'),
        metadata: challenge
      });
    }
  });
  
  // 处理模板推荐
  templates.forEach((template: any) => {
    let score = 0;
    const reasons: string[] = [];
    
    // 根据分类计算分数
    if (template.category && preference.categories[template.category]) {
      score += preference.categories[template.category] * 0.4;
      reasons.push(`您喜欢${template.category}类型的模板`);
    }
    
    // 根据标签计算分数
    if (template.tags) {
      template.tags.forEach((tag: string) => {
        if (preference.tags[tag]) {
          score += preference.tags[tag] * 0.3;
          reasons.push(`您对${tag}感兴趣`);
        }
      });
    }
    
    // 根据使用数据调整分数
    score += (template.usageCount || 0) * 0.02;
    
    // 新鲜度权重
    if (template.createdAt) {
      const daysOld = (Date.now() - new Date(template.createdAt).getTime()) / (1000 * 60 * 60 * 24);
      score += Math.max(0, 1 - daysOld / 90) * DIVERSITY_SETTINGS.recencyWeight;
    }
    
    // 只添加分数大于0的推荐项
    if (score > 0) {
      recommendedItems.push({
        id: template.id,
        type: 'template',
        title: template.name,
        thumbnail: template.preview,
        score,
        reason: reasons.slice(0, 2).join('，'),
        metadata: template
      });
    }
  });
  
  // 按分数排序并返回前N项
  return recommendedItems
    .sort((a, b) => b.score - a.score)
    .slice(0, limit * 2); // 返回更多项以支持后续的多样性优化
}

/**
 * 生成推荐内容
 */
export function generateRecommendations(userId: string, options: RecommendationOptions = {}): RecommendedItem[] {
  const { 
    strategy = 'hybrid', 
    limit = 20, 
    includeDiverse = true,
    recentDays = 30
  } = options;
  
  // 根据不同策略生成推荐
  let recommendations: RecommendedItem[] = [];
  
  if (strategy === 'content' || strategy === 'hybrid') {
    // 基于内容的推荐
    const contentRecs = generateContentBasedRecommendations(userId, limit * 2);
    recommendations = [...recommendations, ...contentRecs.map(item => ({ 
      ...item, 
      score: item.score * STRATEGY_WEIGHTS.content 
    }))];
  }
  
  if (strategy === 'collaborative' || strategy === 'hybrid') {
    // 基于协同过滤的推荐
    const collaborativeRecs = generateCollaborativeRecommendations(userId, limit * 2);
    recommendations = [...recommendations, ...collaborativeRecs.map(item => ({ 
      ...item, 
      score: item.score * STRATEGY_WEIGHTS.collaborative 
    }))];
  }
  
  if (strategy === 'trending' || strategy === 'hybrid') {
    // 热门内容推荐
    const trendingRecs = getTrendingContent(limit * 2);
    recommendations = [...recommendations, ...trendingRecs.map(item => ({ 
      ...item, 
      score: item.score * STRATEGY_WEIGHTS.trending 
    }))];
  }
  
  // 如果是混合策略，合并分数
  if (strategy === 'hybrid') {
    // 按itemId和type分组，合并分数
    const merged: Record<string, RecommendedItem> = {};
    
    recommendations.forEach(item => {
      const key = `${item.type}_${item.id}`;
      if (merged[key]) {
        // 合并分数和理由
        merged[key].score += item.score;
        if (item.reason && !merged[key].reason?.includes(item.reason)) {
          merged[key].reason = merged[key].reason 
            ? `${merged[key].reason}，${item.reason}` 
            : item.reason;
        }
      } else {
        merged[key] = { ...item };
      }
    });
    
    recommendations = Object.values(merged);
  }
  
  // 应用多样性优化
  if (includeDiverse) {
    recommendations = optimizeRecommendationDiversity(recommendations, limit);
  } else {
    // 按分数排序并返回前N项
    recommendations = recommendations
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }
  
  // 如果推荐结果为空，返回热门内容作为默认推荐
  if (recommendations.length === 0) {
    const trendingRecs = getTrendingContent(limit);
    return trendingRecs.map(item => ({
      ...item,
      reason: item.reason || '热门内容'
    }));
  }
  
  return recommendations;
}

/**
 * 获取推荐内容
 */
export function getRecommendations(userId: string, options: number | RecommendationOptions = 20): RecommendedItem[] {
  // 处理重载参数
  const opts: RecommendationOptions = typeof options === 'number' 
    ? { limit: options } 
    : options;
  
  const { limit = 20, strategy = 'hybrid' } = opts;
  
  // 尝试从缓存中获取推荐
  const cacheKey = `${RECOMMENDATIONS_KEY}_${userId}_${strategy}_${limit}_${opts.includeDiverse ? 'diverse' : 'normal'}`;
  const cached = localStorage.getItem(cacheKey);
  
  if (cached) {
    const parsed = JSON.parse(cached);
    // 检查缓存是否过期（1小时）
    if (Date.now() - new Date(parsed.timestamp).getTime() < 3600000) {
      return parsed.recommendations;
    }
  }
  
  // 生成新的推荐
  const recommendations = generateRecommendations(userId, opts);
  
  // 缓存推荐结果
  localStorage.setItem(cacheKey, JSON.stringify({
    recommendations,
    timestamp: new Date().toISOString()
  }));
  
  return recommendations;
}

/**
 * 记录推荐点击
 */
export function recordRecommendationClick(userId: string, item: RecommendedItem): void {
  // 记录点击行为
  recordUserAction({
    userId,
    itemId: item.id,
    itemType: item.type,
    actionType: 'click',
    metadata: item.metadata
  });
  
  // 更新推荐分数（可选）
  // 这里可以实现一个反馈机制，根据用户的点击行为调整推荐算法
}

/**
 * 记录推荐反馈
 */
export function recordRecommendationFeedback(userId: string, feedback: Omit<RecommendationFeedback, 'id' | 'timestamp' | 'userId'>): RecommendationFeedback {
  const newFeedback: RecommendationFeedback = {
    id: `feedback-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userId,
    ...feedback
  };
  
  // 保存反馈
  const allFeedback = JSON.parse(localStorage.getItem(RECOMMENDATION_FEEDBACK_KEY) || '[]');
  allFeedback.push(newFeedback);
  localStorage.setItem(RECOMMENDATION_FEEDBACK_KEY, JSON.stringify(allFeedback));
  
  // 记录相应的用户行为
  recordUserAction({
    userId,
    itemId: feedback.itemId,
    itemType: feedback.itemType,
    actionType: feedback.feedbackType === 'like' ? 'like' : feedback.feedbackType === 'dislike' ? 'dislike' : 'hide',
    value: feedback.feedbackType === 'like' ? 5 : feedback.feedbackType === 'dislike' ? -10 : -5
  });
  
  return newFeedback;
}

/**
 * 计算用户相似度（协同过滤）
 */
export function calculateUserSimilarities(targetUserId: string): UserSimilarity {
  const allActions = getUserActions();
  const targetUserActions = allActions.filter(action => action.userId === targetUserId);
  
  if (targetUserActions.length === 0) {
    return {
      userId: targetUserId,
      similarUsers: [],
      timestamp: new Date().toISOString()
    };
  }
  
  // 获取所有用户ID
  const userIds = Array.from(new Set(allActions.map(action => action.userId)));
  
  // 计算用户之间的相似度
  const similarities: Array<{ userId: string; similarity: number }> = [];
  
  userIds.forEach(userId => {
    if (userId === targetUserId) return;
    
    const otherUserActions = allActions.filter(action => action.userId === userId);
    
    // 计算共同行为
    const targetItemIds = new Set(targetUserActions.map(action => `${action.itemType}_${action.itemId}`));
    const otherItemIds = new Set(otherUserActions.map(action => `${action.itemType}_${action.itemId}`));
    
    // 计算交集
    const intersection = new Set([...targetItemIds].filter(x => otherItemIds.has(x)));
    
    // 计算并集
    const union = new Set([...targetItemIds, ...otherItemIds]);
    
    // 计算Jaccard相似度
    const similarity = union.size > 0 ? intersection.size / union.size : 0;
    
    if (similarity > 0) {
      similarities.push({ userId, similarity });
    }
  });
  
  // 按相似度排序
  similarities.sort((a, b) => b.similarity - a.similarity);
  
  const result = {
    userId: targetUserId,
    similarUsers: similarities.slice(0, 10), // 只保存前10个最相似的用户
    timestamp: new Date().toISOString()
  };
  
  // 保存相似度结果
  const allSimilarities = JSON.parse(localStorage.getItem(USER_SIMILARITIES_KEY) || '[]');
  const existingIndex = allSimilarities.findIndex((sim: UserSimilarity) => sim.userId === targetUserId);
  
  if (existingIndex !== -1) {
    allSimilarities[existingIndex] = result;
  } else {
    allSimilarities.push(result);
  }
  
  localStorage.setItem(USER_SIMILARITIES_KEY, JSON.stringify(allSimilarities));
  
  return result;
}

/**
 * 获取用户相似度
 */
export function getUserSimilarities(userId: string): UserSimilarity | undefined {
  const allSimilarities = JSON.parse(localStorage.getItem(USER_SIMILARITIES_KEY) || '[]');
  const similarity = allSimilarities.find((sim: UserSimilarity) => sim.userId === userId);
  
  if (similarity) {
    // 检查是否过期（24小时）
    if (Date.now() - new Date(similarity.timestamp).getTime() < 86400000) {
      return similarity;
    }
  }
  
  // 重新计算
  return calculateUserSimilarities(userId);
}

/**
 * 基于协同过滤的推荐
 */
export function generateCollaborativeRecommendations(userId: string, limit: number = 10): RecommendedItem[] {
  const similarities = getUserSimilarities(userId);
  
  if (!similarities || similarities.similarUsers.length === 0) {
    return [];
  }
  
  // 获取相似用户的行为
  const allActions = getUserActions();
  const recommendedItems: Record<string, { item: any; type: RecommendedItem['type']; score: number }> = {};
  
  // 获取数据源
  const { works: allWorks, challenges: allChallenges, templates: allTemplates } = getRecommendationData();
  
  similarities.similarUsers.forEach(({ userId: similarUserId, similarity }) => {
    const similarUserActions = allActions.filter(
      action => action.userId === similarUserId && 
      (action.actionType === 'like' || action.actionType === 'save' || action.actionType === 'share' || action.actionType === 'download')
    );
    
    similarUserActions.forEach(action => {
      const itemKey = `${action.itemType}_${action.itemId}`;
      const weight = ACTION_WEIGHTS[action.actionType] * similarity;
      
      // 获取实际的项目数据
      let item: any;
      let type: RecommendedItem['type'];
      
      if (action.itemType === 'post') {
        item = allWorks.find((p: any) => p.id === action.itemId);
        type = 'post';
      } else if (action.itemType === 'challenge') {
        item = allChallenges.find((c: any) => c.id === action.itemId);
        type = 'challenge';
      } else if (action.itemType === 'template') {
        item = allTemplates.find((t: any) => t.id === action.itemId);
        type = 'template';
      } else {
        return; // 跳过用户、标签等类型
      }
      
      if (item) {
        if (recommendedItems[itemKey]) {
          recommendedItems[itemKey].score += weight;
        } else {
          recommendedItems[itemKey] = { item, type, score: weight };
        }
      }
    });
  });
  
  // 转换为RecommendedItem数组
  return Object.values(recommendedItems)
    .map(({ item, type, score }) => ({
      id: item.id,
      type,
      title: type === 'post' ? item.title : type === 'challenge' ? item.title : item.name,
      thumbnail: type === 'post' ? item.thumbnail : type === 'challenge' ? item.featuredImage : item.preview,
      score,
      reason: '相似用户喜欢',
      metadata: item
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 计算推荐多样性分数
 */
export function calculateDiversityScore(items: RecommendedItem[]): number {
  if (items.length === 0) return 0;
  
  // 统计各维度分布
  const typeCount: Record<string, number> = {};
  const categoryCount: Record<string, number> = {};
  const themeCount: Record<string, number> = {};
  
  items.forEach(item => {
    // 类型统计
    typeCount[item.type] = (typeCount[item.type] || 0) + 1;
    
    // 分类统计
    if (item.metadata?.category) {
      categoryCount[item.metadata.category] = (categoryCount[item.metadata.category] || 0) + 1;
    }
    
    // 主题统计
    if (item.metadata?.theme) {
      themeCount[item.metadata.theme] = (themeCount[item.metadata.theme] || 0) + 1;
    }
  });
  
  // 计算多样性分数
  const typeDiversity = Object.keys(typeCount).length / 3; // 最大3种类型
  const categoryDiversity = 1 - Object.values(categoryCount).reduce((max, count) => Math.max(max, count / items.length), 0);
  const themeDiversity = 1 - Object.values(themeCount).reduce((max, count) => Math.max(max, count / items.length), 0);
  
  // 综合多样性分数
  return (typeDiversity * 0.4 + categoryDiversity * 0.3 + themeDiversity * 0.3);
}

/**
 * 优化推荐多样性
 */
export function optimizeRecommendationDiversity(items: RecommendedItem[], limit: number = 20): RecommendedItem[] {
  if (items.length <= limit) return items;
  
  // 按分数排序
  const sortedItems = [...items].sort((a, b) => b.score - a.score);
  
  // 多样性优化
  const optimized: RecommendedItem[] = [];
  const typeCounts: Record<string, number> = {};
  const categoryCounts: Record<string, number> = {};
  const themeCounts: Record<string, number> = {};
  
  for (const item of sortedItems) {
    if (optimized.length >= limit) break;
    
    // 检查类型限制
    const typeCount = typeCounts[item.type] || 0;
    if (typeCount >= Math.ceil(limit * 0.5)) continue; // 每种类型最多占50%
    
    // 检查分类限制
    const category = item.metadata?.category;
    const categoryCount = category ? (categoryCounts[category] || 0) : 0;
    if (category && categoryCount >= Math.ceil(limit * DIVERSITY_SETTINGS.maxItemsPerCategory)) continue;
    
    // 检查主题限制
    const theme = item.metadata?.theme;
    const themeCount = theme ? (themeCounts[theme] || 0) : 0;
    if (theme && themeCount >= Math.ceil(limit * DIVERSITY_SETTINGS.maxItemsPerTheme)) continue;
    
    // 添加到结果
    optimized.push(item);
    
    // 更新计数
    typeCounts[item.type] = typeCount + 1;
    if (category) categoryCounts[category] = categoryCount + 1;
    if (theme) themeCounts[theme] = themeCount + 1;
  }
  
  // 如果结果不足，补充剩余的项目
  if (optimized.length < limit) {
    const remaining = sortedItems.filter(item => !optimized.some(optimizedItem => optimizedItem.id === item.id));
    optimized.push(...remaining.slice(0, limit - optimized.length));
  }
  
  return optimized;
}

/**
 * 获取热门内容（基于所有用户的互动数据）
 */
export function getTrendingContent(limit: number = 10): RecommendedItem[] {
  const { works, challenges } = getRecommendationData();
  
  const trendingItems: RecommendedItem[] = [];
  
  // 处理热门作品
  works.forEach((work: any) => {
    const score = (work.likes * 5) + (work.views * 0.5) + (work.shares * 10) + ((work.comments?.length || 0) * 8);
    trendingItems.push({
      id: work.id,
      type: 'post',
      title: work.title,
      thumbnail: work.thumbnail,
      score,
      reason: '热门内容',
      metadata: work
    });
  });
  
  // 处理热门挑战
  challenges.forEach((challenge: any) => {
    const score = (challenge.participants * 10) + (challenge.submissionCount * 8) + (challenge.views || 0) * 0.5;
    trendingItems.push({
      id: challenge.id,
      type: 'challenge',
      title: challenge.title,
      thumbnail: challenge.featuredImage,
      score,
      reason: '热门挑战',
      metadata: challenge
    });
  });
  
  // 按分数排序并返回前N项
  return trendingItems
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 获取相似内容
 */
export function getSimilarContent(itemId: string, itemType: 'post' | 'challenge' | 'template', limit: number = 10): RecommendedItem[] {
  // 这里实现一个简单的相似内容推荐算法
  // 在实际应用中，这应该基于内容相似度计算
  
  // 获取数据源
  const { posts: allPosts, challenges: allChallenges, templates: allTemplates } = getRecommendationData();
  
  // 1. 获取目标项目
  let targetItem: any;
  if (itemType === 'post') {
    targetItem = allPosts.find((p: any) => p.id === itemId);
  } else if (itemType === 'challenge') {
    targetItem = allChallenges.find((c: any) => c.id === itemId);
  } else {
    targetItem = allTemplates.find((t: any) => t.id === itemId);
  }
  
  if (!targetItem) return [];
  
  // 2. 获取所有可能的相似项目
  let allItems: any[] = [];
  if (itemType === 'post') {
    allItems = allWorks.filter((p: any) => p.id !== itemId);
  } else if (itemType === 'challenge') {
    allItems = allChallenges.filter((c: any) => c.id !== itemId);
  } else {
    allItems = allTemplates.filter((t: any) => t.id !== itemId);
  }
  
  // 3. 计算相似度分数
  const similarItems: RecommendedItem[] = [];
  
  allItems.forEach((item: any) => {
    let score = 0;
    
    // 基于标签的相似度
    if (targetItem.tags && item.tags) {
      const commonTags = targetItem.tags.filter((tag: string) => item.tags.includes(tag));
      score += commonTags.length * 3;
    }
    
    // 基于分类的相似度
    if (targetItem.category && item.category && targetItem.category === item.category) {
      score += 5;
    }
    
    // 基于文化元素的相似度
    if (targetItem.culturalElements && item.culturalElements) {
      const commonElements = targetItem.culturalElements.filter((elem: string) => item.culturalElements.includes(elem));
      score += commonElements.length * 2;
    }
    
    // 基于主题的相似度
    if (targetItem.theme && item.theme && targetItem.theme === item.theme) {
      score += 4;
    }
    
    // 基于互动数据的相似度
    if (itemType === 'post') {
      score += (item.likes * 0.1) + (item.views * 0.01);
    } else if (itemType === 'challenge') {
      score += (item.participants * 0.2) + (item.submissionCount * 0.15);
    }
    
    // 只添加相似度大于0的项目
    if (score > 0) {
      similarItems.push({
        id: item.id,
        type: itemType,
        title: itemType === 'post' ? item.title : itemType === 'challenge' ? item.title : item.name,
        thumbnail: itemType === 'post' ? item.thumbnail : itemType === 'challenge' ? item.featuredImage : item.preview,
        score,
        reason: '相似内容',
        metadata: item
      });
    }
  });
  
  // 4. 按相似度排序并返回前N项
  return similarItems
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * 清除用户行为记录
 */
export function clearUserActions(userId?: string): void {
  if (userId) {
    // 只清除特定用户的行为记录
    const actions = getUserActions().filter(action => action.userId !== userId);
    localStorage.setItem(USER_ACTIONS_KEY, JSON.stringify(actions));
  } else {
    // 清除所有用户行为记录
    localStorage.removeItem(USER_ACTIONS_KEY);
  }
}

/**
 * 重置用户偏好
 */
export function resetUserPreferences(userId: string): UserPreference {
  return initializeUserPreferences(userId);
}

// 导出服务对象
export default {
  getUserActions,
  recordUserAction,
  getUserPreferences,
  initializeUserPreferences,
  updateUserPreferences,
  generateRecommendations,
  getRecommendations,
  recordRecommendationClick,
  recordRecommendationFeedback,
  getTrendingContent,
  getSimilarContent,
  calculateUserSimilarities,
  getUserSimilarities,
  calculateDiversityScore,
  optimizeRecommendationDiversity,
  clearUserActions,
  resetUserPreferences
};