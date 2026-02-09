import { useState, useEffect, useMemo, useCallback } from 'react';
import achievementService from '@/services/achievementService';
import type {
  Achievement,
  AchievementStats,
  AchievementFilter,
  AchievementRarity,
  AchievementCategory,
  UserAchievementInfo,
  CreatorLevel,
  ViewMode
} from '../types';

// 稀有度配置
export const rarityConfig = {
  common: {
    value: 'common' as AchievementRarity,
    label: '普通',
    color: '#6B7280',
    bgColor: 'bg-gray-100',
    borderColor: 'border-gray-200',
    glowColor: 'shadow-gray-200',
    gradient: 'from-gray-100 to-gray-200',
    textColor: 'text-gray-600',
    darkBgColor: 'bg-gray-800',
    darkBorderColor: 'border-gray-700',
  },
  rare: {
    value: 'rare' as AchievementRarity,
    label: '稀有',
    color: '#3B82F6',
    bgColor: 'bg-blue-100',
    borderColor: 'border-blue-200',
    glowColor: 'shadow-blue-200',
    gradient: 'from-blue-100 to-blue-200',
    textColor: 'text-blue-600',
    darkBgColor: 'bg-blue-900/30',
    darkBorderColor: 'border-blue-800',
  },
  epic: {
    value: 'epic' as AchievementRarity,
    label: '史诗',
    color: '#8B5CF6',
    bgColor: 'bg-purple-100',
    borderColor: 'border-purple-200',
    glowColor: 'shadow-purple-200',
    gradient: 'from-purple-100 to-purple-200',
    textColor: 'text-purple-600',
    darkBgColor: 'bg-purple-900/30',
    darkBorderColor: 'border-purple-800',
  },
  legendary: {
    value: 'legendary' as AchievementRarity,
    label: '传说',
    color: '#F59E0B',
    bgColor: 'bg-amber-100',
    borderColor: 'border-amber-200',
    glowColor: 'shadow-amber-200',
    gradient: 'from-amber-100 to-amber-200',
    textColor: 'text-amber-600',
    darkBgColor: 'bg-amber-900/30',
    darkBorderColor: 'border-amber-800',
  },
};

// 分类配置
export const categoryConfig = {
  all: {
    value: 'all' as AchievementCategory,
    label: '全部成就',
    icon: 'grid',
    color: '#C02C38',
  },
  creation: {
    value: 'creation' as AchievementCategory,
    label: '创作成就',
    icon: 'pen-tool',
    color: '#3B82F6',
  },
  community: {
    value: 'community' as AchievementCategory,
    label: '社区成就',
    icon: 'users',
    color: '#8B5CF6',
  },
  special: {
    value: 'special' as AchievementCategory,
    label: '特殊成就',
    icon: 'star',
    color: '#F59E0B',
  },
};

// 创作者等级配置
const creatorLevels: CreatorLevel[] = [
  { level: 1, name: '创作新手', icon: '🌱', requiredPoints: 0, benefits: ['基础创作工具', '作品发布权限'], description: '刚刚开始创作之旅的新手' },
  { level: 2, name: '创作爱好者', icon: '✏️', requiredPoints: 100, benefits: ['高级创作工具', '模板库访问'], description: '热爱创作的积极用户' },
  { level: 3, name: '创作达人', icon: '🌟', requiredPoints: 300, benefits: ['AI创意助手', '专属客服支持'], description: '创作能力突出的达人' },
  { level: 4, name: '创作精英', icon: '🏆', requiredPoints: 600, benefits: ['精英创作工具', '优先活动邀请'], description: '创作领域的精英人物' },
  { level: 5, name: '创作大师', icon: '🎨', requiredPoints: 1000, benefits: ['大师创作工具', '线下活动邀请'], description: '创作领域的大师级人物' },
  { level: 6, name: '创作宗师', icon: '👑', requiredPoints: 2000, benefits: ['宗师创作工具', '全球作品展示'], description: '创作界的宗师级人物' },
  { level: 7, name: '创作传奇', icon: '💎', requiredPoints: 5000, benefits: ['传奇创作工具', 'IP孵化支持'], description: '创作界的传奇人物' },
];

export function useAchievements(userId?: string) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<AchievementStats | null>(null);
  const [userInfo, setUserInfo] = useState<UserAchievementInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 筛选器状态
  const [filter, setFilter] = useState<AchievementFilter>({
    rarity: 'all',
    category: 'all',
    searchQuery: '',
    sortBy: 'newest',
  });

  // 视图模式状态
  const [viewMode, setViewMode] = useState<ViewMode>('grid');

  // 加载成就数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        // 获取成就数据
        const allAchievements = achievementService.getAllAchievements();
        setAchievements(allAchievements);

        // 获取统计数据
        const achievementStats = achievementService.getAchievementStats();
        const rarityDistribution = achievementService.getRarityDistribution();
        setStats({
          ...achievementStats,
          rarityDistribution,
        });

        // 获取用户等级信息
        const levelInfo = achievementService.getCreatorLevelInfo(userId || 'current');
        setUserInfo(levelInfo);
      } catch (err) {
        setError('加载成就数据失败');
        console.error('Failed to load achievements:', err);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [userId]);

  // 筛选和排序成就
  const filteredAchievements = useMemo(() => {
    if (!Array.isArray(achievements)) return [];
    
    let result = [...achievements];

    // 按稀有度筛选
    if (filter.rarity !== 'all') {
      result = result.filter(a => a?.rarity === filter.rarity);
    }

    // 按分类筛选
    if (filter.category !== 'all') {
      result = result.filter(a => a?.category === filter.category);
    }

    // 按搜索词筛选
    if (filter.searchQuery) {
      const query = filter.searchQuery.toLowerCase();
      result = result.filter(a =>
        a?.name?.toLowerCase().includes(query) ||
        a?.description?.toLowerCase().includes(query)
      );
    }

    // 排序
    result.sort((a, b) => {
      if (!a || !b) return 0;
      switch (filter.sortBy) {
        case 'newest':
          if (a.isUnlocked && b.isUnlocked) {
            return new Date(b.unlockedAt || 0).getTime() - new Date(a.unlockedAt || 0).getTime();
          }
          return a.isUnlocked ? -1 : 1;
        case 'oldest':
          if (a.isUnlocked && b.isUnlocked) {
            return new Date(a.unlockedAt || 0).getTime() - new Date(b.unlockedAt || 0).getTime();
          }
          return a.isUnlocked ? -1 : 1;
        case 'progress':
          return (b.progress || 0) - (a.progress || 0);
        case 'points':
          return (b.points || 0) - (a.points || 0);
        default:
          return 0;
      }
    });

    return result;
  }, [achievements, filter]);

  // 获取已解锁成就
  const unlockedAchievements = useMemo(() =>
    (achievements || []).filter(a => a?.isUnlocked),
    [achievements]
  );

  // 获取未解锁成就
  const lockedAchievements = useMemo(() =>
    (achievements || []).filter(a => !a?.isUnlocked),
    [achievements]
  );

  // 获取最近解锁的成就
  const recentUnlocks = useMemo(() =>
    (unlockedAchievements || [])
      .sort((a, b) => new Date(b?.unlockedAt || 0).getTime() - new Date(a?.unlockedAt || 0).getTime())
      .slice(0, 5),
    [unlockedAchievements]
  );

  // 更新筛选器
  const updateFilter = useCallback((updates: Partial<AchievementFilter>) => {
    setFilter(prev => ({ ...prev, ...updates }));
  }, []);

  // 重置筛选器
  const resetFilter = useCallback(() => {
    setFilter({
      rarity: 'all',
      category: 'all',
      searchQuery: '',
      sortBy: 'newest',
    });
  }, []);

  // 切换视图模式
  const toggleViewMode = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  // 获取稀有度配置
  const getRarityConfig = useCallback((rarity: AchievementRarity) => {
    return rarityConfig[rarity] || rarityConfig.common;
  }, []);

  // 刷新数据
  const refreshData = useCallback(async () => {
    setIsLoading(true);
    try {
      const allAchievements = achievementService.getAllAchievements();
      setAchievements(allAchievements);

      const achievementStats = achievementService.getAchievementStats();
      const rarityDistribution = achievementService.getRarityDistribution();
      setStats({
        ...achievementStats,
        rarityDistribution,
      });

      const levelInfo = achievementService.getCreatorLevelInfo(userId || 'current');
      setUserInfo(levelInfo);
    } catch (err) {
      setError('刷新数据失败');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  return {
    // 数据
    achievements,
    filteredAchievements,
    unlockedAchievements,
    lockedAchievements,
    recentUnlocks,
    stats,
    userInfo,
    creatorLevels,

    // 状态
    isLoading,
    error,
    filter,
    viewMode,

    // 配置
    rarityConfig,
    categoryConfig,

    // 操作
    updateFilter,
    resetFilter,
    toggleViewMode,
    getRarityConfig,
    refreshData,
  };
}

export default useAchievements;
