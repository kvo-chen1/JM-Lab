/**
 * 成就管理服务 - 管理员用
 * 用于管理成就配置数据，持久化到 Supabase 数据库
 */
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

// 成就配置类型
export interface AchievementConfig {
  id: number;
  name: string;
  description: string;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  category: 'creation' | 'community' | 'special';
  criteria: string;
  points: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// 创作者等级配置类型
export interface CreatorLevelConfig {
  id: number;
  level: number;
  name: string;
  icon: string;
  required_points: number;
  benefits: string[];
  description: string;
  color?: string;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

// 成就管理服务类
class AchievementAdminService {
  /**
   * 获取所有成就配置
   */
  async getAllAchievements(): Promise<AchievementConfig[]> {
    try {
      const { data, error } = await supabase
        .from('achievement_configs')
        .select('*')
        .eq('is_active', true)
        .order('id', { ascending: true });

      if (error) {
        console.error('[AchievementAdminService] 获取成就配置失败:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[AchievementAdminService] 获取成就配置失败:', error);
      // 尝试从 localStorage 回退
      const localData = localStorage.getItem('ACHIEVEMENTS_DATA');
      if (localData) {
        return JSON.parse(localData);
      }
      return [];
    }
  }

  /**
   * 创建新成就
   */
  async createAchievement(achievement: Omit<AchievementConfig, 'id' | 'created_at' | 'updated_at'>): Promise<AchievementConfig | null> {
    try {
      const { data, error } = await supabase
        .from('achievement_configs')
        .insert({
          ...achievement,
          is_active: true
        })
        .select()
        .single();

      if (error) {
        console.error('[AchievementAdminService] 创建成就失败:', error);
        toast.error('创建成就失败: ' + error.message);
        return null;
      }

      toast.success('成就创建成功');
      return data;
    } catch (error) {
      console.error('[AchievementAdminService] 创建成就失败:', error);
      toast.error('创建成就失败');
      return null;
    }
  }

  /**
   * 更新成就
   */
  async updateAchievement(id: number, achievement: Partial<AchievementConfig>): Promise<AchievementConfig | null> {
    try {
      const { data, error } = await supabase
        .from('achievement_configs')
        .update({
          ...achievement,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[AchievementAdminService] 更新成就失败:', error);
        toast.error('更新成就失败: ' + error.message);
        return null;
      }

      toast.success('成就更新成功');
      return data;
    } catch (error) {
      console.error('[AchievementAdminService] 更新成就失败:', error);
      toast.error('更新成就失败');
      return null;
    }
  }

  /**
   * 删除成就（软删除）
   */
  async deleteAchievement(id: number): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('achievement_configs')
        .update({ is_active: false, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) {
        console.error('[AchievementAdminService] 删除成就失败:', error);
        toast.error('删除成就失败: ' + error.message);
        return false;
      }

      toast.success('成就已删除');
      return true;
    } catch (error) {
      console.error('[AchievementAdminService] 删除成就失败:', error);
      toast.error('删除成就失败');
      return false;
    }
  }

  /**
   * 获取所有创作者等级配置
   */
  async getAllCreatorLevels(): Promise<CreatorLevelConfig[]> {
    try {
      const { data, error } = await supabase
        .from('creator_level_configs')
        .select('*')
        .eq('is_active', true)
        .order('level', { ascending: true });

      if (error) {
        console.error('[AchievementAdminService] 获取等级配置失败:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('[AchievementAdminService] 获取等级配置失败:', error);
      return [];
    }
  }

  /**
   * 更新创作者等级配置
   */
  async updateCreatorLevel(id: number, level: Partial<CreatorLevelConfig>): Promise<CreatorLevelConfig | null> {
    try {
      const { data, error } = await supabase
        .from('creator_level_configs')
        .update({
          ...level,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[AchievementAdminService] 更新等级配置失败:', error);
        toast.error('更新等级配置失败: ' + error.message);
        return null;
      }

      toast.success('等级配置更新成功');
      return data;
    } catch (error) {
      console.error('[AchievementAdminService] 更新等级配置失败:', error);
      toast.error('更新等级配置失败');
      return null;
    }
  }

  /**
   * 批量初始化默认成就配置
   * 用于首次部署时初始化数据
   */
  async initDefaultAchievements(): Promise<boolean> {
    try {
      const defaultAchievements = [
        { id: 1, name: '初次创作', description: '完成第一篇创作作品', icon: 'star', rarity: 'common', category: 'creation', criteria: '完成1篇作品', points: 10 },
        { id: 2, name: '活跃创作者', description: '连续7天登录平台', icon: 'fire', rarity: 'common', category: 'community', criteria: '连续登录7天', points: 20 },
        { id: 3, name: '人气王', description: '获得100个点赞', icon: 'thumbs-up', rarity: 'rare', category: 'community', criteria: '获得100个点赞', points: 50 },
        { id: 4, name: '文化传播者', description: '使用5种不同文化元素', icon: 'book', rarity: 'rare', category: 'creation', criteria: '使用5种不同文化元素', points: 40 },
        { id: 5, name: '作品达人', description: '发布10篇作品', icon: 'image', rarity: 'rare', category: 'creation', criteria: '发布10篇作品', points: 80 },
        { id: 6, name: '商业成功', description: '作品被品牌采纳', icon: 'handshake', rarity: 'epic', category: 'special', criteria: '作品被品牌采纳1次', points: 200 },
        { id: 7, name: '传统文化大师', description: '精通传统文化知识', icon: 'graduation-cap', rarity: 'legendary', category: 'special', criteria: '完成10个文化知识问答', points: 300 },
        { id: 8, name: '创作新手', description: '发布3篇作品', icon: 'pen-tool', rarity: 'common', category: 'creation', criteria: '发布3篇作品', points: 15 },
        { id: 9, name: '多产作者', description: '发布50篇作品', icon: 'layers', rarity: 'rare', category: 'creation', criteria: '发布50篇作品', points: 100 },
        { id: 10, name: '创作狂人', description: '发布100篇作品', icon: 'zap', rarity: 'epic', category: 'creation', criteria: '发布100篇作品', points: 200 },
        { id: 11, name: '创作传奇', description: '发布500篇作品', icon: 'crown', rarity: 'legendary', category: 'creation', criteria: '发布500篇作品', points: 1000 },
        { id: 12, name: '点赞新手', description: '获得10个点赞', icon: 'heart', rarity: 'common', category: 'community', criteria: '获得10个点赞', points: 10 },
        { id: 13, name: '受欢迎', description: '获得500个点赞', icon: 'award', rarity: 'rare', category: 'community', criteria: '获得500个点赞', points: 80 },
        { id: 14, name: '超级明星', description: '获得1000个点赞', icon: 'star', rarity: 'epic', category: 'community', criteria: '获得1000个点赞', points: 150 },
        { id: 15, name: '评论达人', description: '发表评论50次', icon: 'message-circle', rarity: 'rare', category: 'community', criteria: '发表评论50次', points: 60 },
        { id: 16, name: '收藏专家', description: '收藏100个作品', icon: 'bookmark', rarity: 'rare', category: 'community', criteria: '收藏100个作品', points: 70 },
        { id: 17, name: '分享大使', description: '分享作品30次', icon: 'share-2', rarity: 'rare', category: 'community', criteria: '分享作品30次', points: 50 },
        { id: 18, name: '坚持就是胜利', description: '连续登录30天', icon: 'calendar', rarity: 'rare', category: 'community', criteria: '连续登录30天', points: 100 },
        { id: 19, name: '忠实用户', description: '连续登录100天', icon: 'calendar-check', rarity: 'epic', category: 'community', criteria: '连续登录100天', points: 300 },
        { id: 20, name: '年度用户', description: '连续登录365天', icon: 'calendar-days', rarity: 'legendary', category: 'community', criteria: '连续登录365天', points: 1000 },
        { id: 21, name: 'AI探索者', description: '使用AI生成10张图片', icon: 'cpu', rarity: 'common', category: 'creation', criteria: '使用AI生成10张图片', points: 20 },
        { id: 22, name: 'AI创作者', description: '使用AI生成100张图片', icon: 'sparkles', rarity: 'rare', category: 'creation', criteria: '使用AI生成100张图片', points: 100 },
        { id: 23, name: '视频创作者', description: '发布10个视频作品', icon: 'video', rarity: 'rare', category: 'creation', criteria: '发布10个视频作品', points: 80 },
        { id: 24, name: '视频大师', description: '发布50个视频作品', icon: 'film', rarity: 'epic', category: 'creation', criteria: '发布50个视频作品', points: 250 },
        { id: 25, name: '文化守护者', description: '使用10种不同文化元素', icon: 'shield', rarity: 'epic', category: 'special', criteria: '使用10种不同文化元素', points: 150 },
        { id: 26, name: '津门传承者', description: '创作20个天津文化相关作品', icon: 'landmark', rarity: 'epic', category: 'special', criteria: '创作20个天津文化相关作品', points: 200 },
        { id: 27, name: '完美主义者', description: '获得10个作品评分超过90分', icon: 'target', rarity: 'epic', category: 'special', criteria: '获得10个作品评分超过90分', points: 180 },
        { id: 28, name: '社交达人', description: '获得100个粉丝', icon: 'users', rarity: 'rare', category: 'community', criteria: '获得100个粉丝', points: 100 },
        { id: 29, name: '意见领袖', description: '获得1000个粉丝', icon: 'user-check', rarity: 'epic', category: 'community', criteria: '获得1000个粉丝', points: 300 },
        { id: 30, name: '津脉之星', description: '登上排行榜前10名', icon: 'trophy', rarity: 'legendary', category: 'special', criteria: '登上排行榜前10名', points: 500 },
      ];

      const { error } = await supabase
        .from('achievement_configs')
        .upsert(defaultAchievements.map(a => ({ ...a, is_active: true })), {
          onConflict: 'id'
        });

      if (error) {
        console.error('[AchievementAdminService] 初始化默认成就失败:', error);
        return false;
      }

      toast.success('默认成就配置已初始化');
      return true;
    } catch (error) {
      console.error('[AchievementAdminService] 初始化默认成就失败:', error);
      return false;
    }
  }

  /**
   * 批量初始化默认等级配置
   */
  async initDefaultCreatorLevels(): Promise<boolean> {
    try {
      const defaultLevels = [
        { level: 1, name: '创作新手', icon: '🌱', required_points: 0, benefits: ['基础创作工具', '作品发布权限', '社区评论权限', '每日签到奖励'], description: '刚刚开始创作之旅的新手', color: '#6B7280' },
        { level: 2, name: '创作爱好者', icon: '✏️', required_points: 100, benefits: ['高级创作工具', '模板库访问', '作品打赏权限', '积分商城9折'], description: '热爱创作的积极用户', color: '#10B981' },
        { level: 3, name: '创作达人', icon: '🌟', required_points: 300, benefits: ['AI创意助手', '专属客服支持', '作品推广机会', '积分商城8折', '徽章解锁权限'], description: '创作能力突出的达人', color: '#3B82F6' },
        { level: 4, name: '创作精英', icon: '🏆', required_points: 600, benefits: ['精英创作工具', '优先活动邀请', '作品商业化机会', '积分商城7折', '专属创作空间'], description: '创作领域的精英人物', color: '#8B5CF6' },
        { level: 5, name: '创作大师', icon: '🎨', required_points: 1000, benefits: ['大师创作工具', '线下活动邀请', '品牌合作机会', '积分商城6折', '大师认证标识'], description: '创作领域的大师级人物', color: '#F59E0B' },
        { level: 6, name: '创作宗师', icon: '👑', required_points: 2000, benefits: ['宗师创作工具', '全球作品展示', '平台顾问身份', '积分商城5折', '定制化创作工具'], description: '创作界的宗师级人物', color: '#EF4444' },
        { level: 7, name: '创作传奇', icon: '💎', required_points: 5000, benefits: ['传奇创作工具', 'IP孵化支持', '平台荣誉殿堂', '积分商城4折', '专属商务合作'], description: '创作界的传奇人物', color: '#EAB308' },
      ];

      const { error } = await supabase
        .from('creator_level_configs')
        .upsert(defaultLevels.map((l, idx) => ({ ...l, id: idx + 1, is_active: true })), {
          onConflict: 'id'
        });

      if (error) {
        console.error('[AchievementAdminService] 初始化默认等级失败:', error);
        return false;
      }

      toast.success('默认等级配置已初始化');
      return true;
    } catch (error) {
      console.error('[AchievementAdminService] 初始化默认等级失败:', error);
      return false;
    }
  }
}

// 导出单例实例
const service = new AchievementAdminService();
export default service;
