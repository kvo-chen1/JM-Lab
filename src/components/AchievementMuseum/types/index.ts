// 成就稀有度类型
export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

// 成就分类类型
export type AchievementCategory = 'creation' | 'community' | 'special' | 'all';

// 视图模式类型
export type ViewMode = 'grid' | 'list' | 'timeline';

// 成就接口
export interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  category: AchievementCategory;
  criteria: string;
  progress: number;
  isUnlocked: boolean;
  unlockedAt?: string;
  points: number;
  badge?: string;
}

// 成就统计接口
export interface AchievementStats {
  total: number;
  unlocked: number;
  locked: number;
  completionRate: number;
  recentUnlocks: Achievement[];
  rarityDistribution: Record<AchievementRarity, number>;
}

// 创作者等级接口
export interface CreatorLevel {
  level: number;
  name: string;
  icon: string;
  requiredPoints: number;
  benefits: string[];
  description: string;
}

// 用户成就信息接口
export interface UserAchievementInfo {
  currentLevel: CreatorLevel;
  nextLevel: CreatorLevel | null;
  currentPoints: number;
  pointsToNextLevel: number;
  levelProgress: number;
  totalLevels: number;
  levelUpNotifications?: Array<{
    id: string;
    userId: string;
    oldLevel: number;
    newLevel: number;
    notifiedAt: number;
  }>;
}

// 筛选器接口
export interface AchievementFilter {
  rarity: AchievementRarity | 'all';
  category: AchievementCategory;
  searchQuery: string;
  sortBy: 'newest' | 'oldest' | 'progress' | 'points';
}

// 展品接口 (3D展品)
export interface AchievementExhibit {
  id: number;
  name: string;
  description: string;
  image: string;
  year: number;
  category: string;
}

// 排行榜项接口
export interface LeaderboardItem {
  rank: number;
  userId: string;
  userName: string;
  avatar: string;
  achievementsCount: number;
  totalPoints: number;
}

// 成就解锁通知接口
export interface AchievementUnlockNotification {
  id: string;
  achievementId: number;
  achievementName: string;
  unlockedAt: string;
  points: number;
}

// 稀有度配置
export interface RarityConfig {
  value: AchievementRarity;
  label: string;
  color: string;
  bgColor: string;
  borderColor: string;
  glowColor: string;
  gradient: string;
}

// 分类配置
export interface CategoryConfig {
  value: AchievementCategory;
  label: string;
  icon: string;
  color: string;
}

// 主题颜色配置
export interface ThemeColors {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  border: string;
  text: {
    primary: string;
    secondary: string;
    muted: string;
  };
}
