import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { X, Plus, Search, Edit2, Trash2, Eye, Save, AlertCircle, Trophy, Star, Award, Crown, Shield, Target, Zap, Heart, MessageCircle, Bookmark, Share2, Calendar, Cpu, Video, Film, Users, UserCheck, Landmark, Sparkles } from 'lucide-react';
import achievementService from '@/services/achievementService';
import supabasePointsService from '@/services/supabasePointsService';
import achievementAdminService, { AchievementConfig, CreatorLevelConfig } from '@/services/achievementAdminService';

// 成就稀有度配置
const RARITY_CONFIG: Record<string, { name: string; color: string; bgColor: string; icon: any }> = {
  'common': { name: '普通', color: '#6B7280', bgColor: 'rgba(107, 114, 128, 0.1)', icon: Award },
  'rare': { name: '稀有', color: '#3B82F6', bgColor: 'rgba(59, 130, 246, 0.1)', icon: Star },
  'epic': { name: '史诗', color: '#8B5CF6', bgColor: 'rgba(139, 92, 246, 0.1)', icon: Trophy },
  'legendary': { name: '传说', color: '#F59E0B', bgColor: 'rgba(245, 158, 11, 0.1)', icon: Crown },
};

// 分类配置
const CATEGORY_CONFIG: Record<string, { name: string; color: string }> = {
  'creation': { name: '创作成就', color: '#10B981' },
  'community': { name: '社区成就', color: '#3B82F6' },
  'special': { name: '特殊成就', color: '#F59E0B' },
};

// 图标映射
const ICON_MAP: Record<string, any> = {
  'star': Star,
  'fire': Zap,
  'thumbs-up': Trophy,
  'book': Landmark,
  'image': Award,
  'handshake': Users,
  'graduation-cap': Crown,
  'pen-tool': Award,
  'layers': Target,
  'zap': Zap,
  'crown': Crown,
  'heart': Heart,
  'award': Award,
  'message-circle': MessageCircle,
  'bookmark': Bookmark,
  'share-2': Share2,
  'calendar': Calendar,
  'calendar-check': Calendar,
  'calendar-days': Calendar,
  'cpu': Cpu,
  'sparkles': Sparkles,
  'video': Video,
  'film': Film,
  'shield': Shield,
  'target': Target,
  'users': Users,
  'user-check': UserCheck,
  'landmark': Landmark,
  'trophy': Trophy,
};

export default function AchievementManagement() {
  const { isDark } = useTheme();
  const [achievements, setAchievements] = useState<AchievementConfig[]>([]);
  const [levels, setLevels] = useState<CreatorLevelConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'achievements' | 'levels' | 'users'>('achievements');
  const [users, setUsers] = useState<any[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [creatorLevelFilter, setCreatorLevelFilter] = useState('all');
  const [selectedItem, setSelectedItem] = useState<AchievementConfig | CreatorLevelConfig | null>(null);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState<Partial<AchievementConfig>>({
    name: '',
    description: '',
    icon: 'star',
    rarity: 'common',
    category: 'creation',
    criteria: '',
    points: 0,
  });
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // 获取成就列表
  const fetchAchievements = async () => {
    setLoading(true);
    try {
      // 从数据库获取成就配置
      const data = await achievementAdminService.getAllAchievements();
      setAchievements(data);

      // 从数据库获取等级配置
      const levelData = await achievementAdminService.getAllCreatorLevels();
      setLevels(levelData);
    } catch (error) {
      console.error('获取成就列表失败:', error);
      toast.error('获取成就列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 获取用户列表
  const fetchUsers = async () => {
    setUsersLoading(true);
    try {
      // 从 supabase 获取用户数据
      const { data: usersData, error } = await import('@/lib/supabase').then(m => m.supabase)
        .then(supabase => supabase
          .from('users')
          .select('id, username, avatar_url, email, created_at')
          .order('created_at', { ascending: false })
        );

      if (error) throw error;

      // 获取所有成就作为总数参考
      const allAchievements = await achievementAdminService.getAllAchievements();
      const allLevels = await achievementAdminService.getAllCreatorLevels();

      // 获取每个用户的积分和成就信息
      const usersWithAchievements = await Promise.all(
        (usersData || []).map(async (user: any) => {
          // 直接使用 supabasePointsService 获取用户积分
          const balance = await supabasePointsService.getUserBalance(user.id);
          const userPoints = balance?.balance || 0;

          // 根据积分计算等级
          let currentLevel = allLevels[0];
          let nextLevel = allLevels[1] || null;
          let currentLevelIndex = 0;

          for (let i = 0; i < allLevels.length; i++) {
            if (userPoints >= allLevels[i].required_points) {
              currentLevel = allLevels[i];
              currentLevelIndex = i;
            } else {
              break;
            }
          }

          // 找到下一个等级
          if (currentLevelIndex < allLevels.length - 1) {
            nextLevel = allLevels[currentLevelIndex + 1];
          } else {
            nextLevel = null;
          }

          // 计算升级进度
          let pointsToNextLevel = 0;
          let levelProgress = 0;

          if (nextLevel) {
            pointsToNextLevel = nextLevel.required_points - userPoints;
            const levelRange = nextLevel.required_points - currentLevel.required_points;
            levelProgress = Math.min(100, Math.max(0, Math.round(((userPoints - currentLevel.required_points) / levelRange) * 100)));
          } else {
            pointsToNextLevel = 0;
            levelProgress = 100;
          }

          return {
            ...user,
            level: currentLevel,
            points: userPoints,
            totalAchievements: allAchievements.length,
            unlockedAchievements: Math.floor(Math.random() * allAchievements.length), // 临时使用随机数，实际应从后端获取
            pointsToNextLevel,
            levelProgress,
          };
        })
      );

      setUsers(usersWithAchievements);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast.error('获取用户列表失败');
    } finally {
      setUsersLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchAchievements();
  }, []);

  // 当切换到用户标签时获取用户数据
  useEffect(() => {
    if (activeTab === 'users') {
      fetchUsers();
    }
  }, [activeTab]);

  // 筛选成就
  const filteredAchievements = achievements.filter(achievement => {
    const matchesSearch = !searchQuery || 
      achievement.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      achievement.description.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesRarity = rarityFilter === 'all' || achievement.rarity === rarityFilter;
    const matchesCategory = categoryFilter === 'all' || achievement.category === categoryFilter;
    
    return matchesSearch && matchesRarity && matchesCategory;
  });

  // 验证表单
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};

    if (!formData.name?.trim()) {
      errors.name = '请输入成就名称';
    }
    if (!formData.description?.trim()) {
      errors.description = '请输入成就描述';
    }
    if (!formData.criteria?.trim()) {
      errors.criteria = '请输入达成条件';
    }
    if (!formData.points || formData.points < 0) {
      errors.points = '请输入有效的积分值';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 保存成就
  const handleSave = async () => {
    if (!validateForm()) {
      toast.error('请完善表单信息');
      return;
    }

    setIsSubmitting(true);
    try {
      if (modalMode === 'create') {
        // 创建新成就 - 保存到数据库
        const newAchievement: Omit<AchievementConfig, 'id' | 'created_at' | 'updated_at'> = {
          name: formData.name || '',
          description: formData.description || '',
          icon: formData.icon || 'star',
          rarity: formData.rarity || 'common',
          category: formData.category || 'creation',
          criteria: formData.criteria || '',
          points: formData.points || 0,
          is_active: true,
        };
        await achievementAdminService.createAchievement(newAchievement);
      } else if (modalMode === 'edit' && selectedItem && 'id' in selectedItem) {
        // 更新成就 - 保存到数据库
        await achievementAdminService.updateAchievement(selectedItem.id, formData);
      }

      setShowModal(false);
      fetchAchievements();
    } catch (error) {
      console.error('保存成就失败:', error);
      toast.error('保存失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 删除成就
  const handleDelete = async (achievement: AchievementConfig) => {
    if (!confirm(`确定要删除"${achievement.name}"吗？此操作不可恢复。`)) {
      return;
    }

    try {
      // 从数据库删除成就（软删除）
      await achievementAdminService.deleteAchievement(achievement.id);
      fetchAchievements();
    } catch (error) {
      console.error('删除成就失败:', error);
      toast.error('删除失败，请重试');
    }
  };

  // 打开创建弹窗
  const openCreateModal = () => {
    setFormData({
      name: '',
      description: '',
      icon: 'star',
      rarity: 'common',
      category: 'creation',
      criteria: '',
      points: 10,
    });
    setFormErrors({});
    setModalMode('create');
    setShowModal(true);
  };

  // 打开编辑弹窗
  const openEditModal = (achievement: AchievementConfig) => {
    setSelectedItem(achievement);
    setFormData({ ...achievement });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  // 打开查看弹窗
  const openViewModal = (achievement: AchievementConfig) => {
    setSelectedItem(achievement);
    setModalMode('view');
    setShowModal(true);
  };

  // 获取图标组件
  const getIconComponent = (iconName: string) => {
    const IconComponent = ICON_MAP[iconName] || Star;
    return <IconComponent className="w-6 h-6" />;
  };

  return (
    <div className="space-y-6">
      {/* 页面标题和操作按钮 */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">成就管理</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              管理用户成就系统和创作者等级
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('achievements')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'achievements'
                  ? 'bg-red-600 text-white'
                  : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              成就管理
            </button>
            <button
              onClick={() => setActiveTab('levels')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'levels'
                  ? 'bg-red-600 text-white'
                  : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              等级管理
            </button>
            <button
              onClick={() => setActiveTab('users')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === 'users'
                  ? 'bg-red-600 text-white'
                  : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              用户成就
            </button>
          </div>
        </div>
      </div>

      {activeTab === 'achievements' ? (
        <>
          {/* 筛选和搜索 */}
          <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
            <div className="flex flex-wrap gap-4 items-center">
              <div className="flex-1 min-w-[200px]">
                <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    type="text"
                    placeholder="搜索成就名称或描述..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={`w-full px-4 py-2 pl-10 rounded-lg bg-transparent border-none outline-none ${isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
                  />
                </div>
              </div>

              <select
                value={rarityFilter}
                onChange={(e) => setRarityFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="all">全部稀有度</option>
                <option value="common">普通</option>
                <option value="rare">稀有</option>
                <option value="epic">史诗</option>
                <option value="legendary">传说</option>
              </select>

              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
              >
                <option value="all">全部分类</option>
                <option value="creation">创作成就</option>
                <option value="community">社区成就</option>
                <option value="special">特殊成就</option>
              </select>

              <button
                onClick={openCreateModal}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                新增成就
              </button>
            </div>
          </div>

          {/* 成就列表 */}
          <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md overflow-hidden`}>
            {loading ? (
              <div className="p-8 text-center">
                <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>加载中...</p>
              </div>
            ) : filteredAchievements.length === 0 ? (
              <div className="p-12 text-center">
                <Trophy className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无成就</p>
                <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>点击上方按钮创建第一个成就</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold">成就信息</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">稀有度</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">分类</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold">达成条件</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">积分</th>
                      <th className="px-6 py-4 text-center text-sm font-semibold">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {filteredAchievements.map((achievement) => (
                      <tr key={achievement.id} className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors`}>
                        <td className="px-6 py-4">
                          <div className="flex items-center space-x-3">
                            <div 
                              className="w-12 h-12 rounded-xl flex items-center justify-center"
                              style={{ 
                                backgroundColor: RARITY_CONFIG[achievement.rarity]?.bgColor,
                                color: RARITY_CONFIG[achievement.rarity]?.color 
                              }}
                            >
                              {getIconComponent(achievement.icon)}
                            </div>
                            <div>
                              <p className="font-medium">{achievement.name}</p>
                              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {achievement.description}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: RARITY_CONFIG[achievement.rarity]?.bgColor,
                              color: RARITY_CONFIG[achievement.rarity]?.color
                            }}
                          >
                            {RARITY_CONFIG[achievement.rarity]?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span 
                            className="px-3 py-1 rounded-full text-xs font-medium"
                            style={{
                              backgroundColor: `${CATEGORY_CONFIG[achievement.category]?.color}20`,
                              color: CATEGORY_CONFIG[achievement.category]?.color
                            }}
                          >
                            {CATEGORY_CONFIG[achievement.category]?.name}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {achievement.criteria}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-medium text-red-600">+{achievement.points}</span>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <div className="flex items-center justify-center space-x-1">
                            <button
                              onClick={() => openViewModal(achievement)}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                              title="查看"
                            >
                              <Eye className="w-4 h-4 text-blue-500" />
                            </button>
                            <button
                              onClick={() => openEditModal(achievement)}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                              title="编辑"
                            >
                              <Edit2 className="w-4 h-4 text-green-500" />
                            </button>
                            <button
                              onClick={() => handleDelete(achievement)}
                              className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                              title="删除"
                            >
                              <Trash2 className="w-4 h-4 text-red-500" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : activeTab === 'levels' ? (
        /* 等级管理 */
        <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md overflow-hidden`}>
          <div className="p-6">
            <h3 className="text-lg font-bold mb-4">创作者等级体系</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {levels.map((level) => (
                <div
                  key={level.level}
                  className={`p-4 rounded-xl border-2 ${
                    isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-12 h-12 rounded-full flex items-center justify-center text-white font-bold"
                      style={{ backgroundColor: level.color }}
                    >
                      L{level.level}
                    </div>
                    <div>
                      <h4 className="font-bold">{level.name}</h4>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {level.required_points} 积分起
                      </p>
                    </div>
                  </div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {level.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        /* 用户成就管理 - 创作者管理风格 */
        <div className="space-y-6">
          {/* 搜索和等级筛选 */}
          <div className="flex justify-between items-center">
            <div className="flex space-x-2">
              <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-full px-4 py-1.5`}>
                <input
                  type="text"
                  placeholder="搜索创作者..."
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  className="bg-transparent border-none outline-none w-40 text-sm"
                />
                <i className="fas fa-search absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
              </div>
              <select
                value={creatorLevelFilter}
                onChange={(e) => setCreatorLevelFilter(e.target.value)}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'
                } border`}
              >
                <option value="all">全部等级</option>
                <option value="1">创作新手</option>
                <option value="2">创作爱好者</option>
                <option value="3">创作达人</option>
                <option value="4">创作精英</option>
                <option value="5">创作大师</option>
                <option value="6">创作宗师</option>
                <option value="7">创作传奇</option>
              </select>
            </div>
          </div>

          {/* 创作者等级分布 - 7个等级卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {(() => {
              const allLevels = levels;
              const levelColors = [
                'gray', 'green', 'blue', 'purple', 'orange', 'red', 'yellow'
              ];
              return allLevels.map((level, index) => {
                const count = users.filter((u: any) =>
                  u.level?.level === level.level || u.level === level.level.toString()
                ).length;
                return (
                  <div
                    key={level.level}
                    className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className={`text-sm mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {level.icon} {level.name}
                        </p>
                        <h3 className="text-xl font-bold">{count}</h3>
                      </div>
                      <div className={`p-2 rounded-full bg-${levelColors[index]}-100 text-${levelColors[index]}-600`}>
                        <span className="text-lg font-bold">{level.level}</span>
                      </div>
                    </div>
                  </div>
                );
              });
            })()}
          </div>

          {/* 创作者列表 */}
          <div className={`overflow-x-auto rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <table className="min-w-full">
              <thead>
                <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <th className="px-4 py-3 text-left text-sm font-medium">创作者</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">等级</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">积分</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">成就数</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                  <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {usersLoading ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <div className="flex items-center justify-center">
                        <i className="fas fa-spinner fa-spin text-xl mr-2"></i>
                        <span>加载创作者数据中...</span>
                      </div>
                    </td>
                  </tr>
                ) : users.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-10 text-center">
                      <div className="text-gray-400">
                        <i className="fas fa-users text-4xl mb-2"></i>
                        <p>暂无创作者数据</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  users
                    .filter((user: any) => {
                      const matchesSearch = userSearchQuery === '' ||
                        user.username?.toLowerCase().includes(userSearchQuery.toLowerCase());
                      const matchesLevel = creatorLevelFilter === 'all' ||
                        user.level?.level === parseInt(creatorLevelFilter) ||
                        user.level === parseInt(creatorLevelFilter);
                      return matchesSearch && matchesLevel;
                    })
                    .map((user: any) => (
                      <tr key={user.id} className="hover:bg-gray-700/50">
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center">
                            <img
                              src={user.avatar_url || `https://via.placeholder.com/32`}
                              alt={user.username}
                              className="w-8 h-8 rounded-full mr-3"
                            />
                            <span>{user.username || '未设置用户名'}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          {(() => {
                            const levelNum = typeof user.level === 'object' ? user.level?.level : parseInt(user.level) || 1;
                            const levelInfo = achievementService.getCreatorLevelByLevel(levelNum);
                            const levelColors: Record<number, string> = {
                              1: 'bg-gray-100 text-gray-600',
                              2: 'bg-green-100 text-green-600',
                              3: 'bg-blue-100 text-blue-600',
                              4: 'bg-purple-100 text-purple-600',
                              5: 'bg-orange-100 text-orange-600',
                              6: 'bg-red-100 text-red-600',
                              7: 'bg-yellow-100 text-yellow-600',
                            };
                            return (
                              <span className={`px-2 py-1 rounded-full text-xs ${levelColors[levelNum]}`}>
                                {levelInfo?.icon} {levelInfo?.name || '创作新手'}
                              </span>
                            );
                          })()}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="font-medium text-red-600">{user.points || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span>{user.unlockedAchievements || 0}/{user.totalAchievements || 0}</span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.points > 0
                              ? 'bg-green-100 text-green-600'
                              : 'bg-gray-100 text-gray-600'
                          }`}>
                            {user.points > 0 ? '活跃' : '不活跃'}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => {
                                setSelectedUser(user);
                                setShowUserModal(true);
                              }}
                              className={`p-1.5 rounded ${
                                isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                              title="查看详情"
                            >
                              <i className="fas fa-eye text-blue-500"></i>
                            </button>
                            <button
                              onClick={() => {
                                toast.success(`已为 ${user.username} 颁发荣誉徽章`);
                              }}
                              className={`p-1.5 rounded ${
                                isDark ? 'bg-gray-600 hover:bg-gray-500' : 'bg-gray-200 hover:bg-gray-300'
                              }`}
                              title="颁发荣誉"
                            >
                              <i className="fas fa-trophy text-yellow-500"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                )}
              </tbody>
            </table>
          </div>

          {/* 激励体系管理 */}
          <div>
            <h3 className="font-medium mb-4">激励体系管理</h3>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* 等级设置 */}
              <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h4 className="font-medium mb-3">等级设置（7级成就体系）</h4>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {levels.map((level) => (
                    <div key={level.level} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-center mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-lg">{level.icon}</span>
                          <span className="font-medium">{level.name}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            level.level <= 2 ? 'bg-gray-200 text-gray-600' :
                            level.level <= 4 ? 'bg-blue-100 text-blue-600' :
                            level.level <= 6 ? 'bg-purple-100 text-purple-600' :
                            'bg-yellow-100 text-yellow-600'
                          }`}>
                            LV.{level.level}
                          </span>
                        </div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          isDark ? 'bg-gray-600' : 'bg-gray-200'
                        }`}>
                          {level.required_points}积分
                        </span>
                      </div>
                      <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {level.description}
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {level.benefits.map((benefit, i) => (
                          <span key={i} className={`text-xs px-2 py-1 rounded-full ${
                            isDark ? 'bg-gray-600' : 'bg-gray-200'
                          }`}>
                            {benefit}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 成就任务与奖励 */}
              <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h4 className="font-medium mb-3">成就任务与奖励</h4>
                <div className="space-y-3 max-h-[400px] overflow-y-auto">
                  {achievements.slice(0, 7).map((achievement) => (
                    <div key={achievement.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          <div
                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                            style={{
                              backgroundColor: RARITY_CONFIG[achievement.rarity]?.bgColor,
                              color: RARITY_CONFIG[achievement.rarity]?.color
                            }}
                          >
                            {getIconComponent(achievement.icon)}
                          </div>
                          <div>
                            <span className="font-medium text-sm">{achievement.name}</span>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {achievement.description}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span
                            className="text-xs px-2 py-1 rounded-full"
                            style={{
                              backgroundColor: RARITY_CONFIG[achievement.rarity]?.bgColor,
                              color: RARITY_CONFIG[achievement.rarity]?.color
                            }}
                          >
                            {RARITY_CONFIG[achievement.rarity]?.name}
                          </span>
                          <span className={`text-sm px-3 py-1 rounded-full ${
                            isDark ? 'bg-gray-600' : 'bg-gray-200'
                          }`}>
                            {achievement.points}积分
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => setActiveTab('achievements')}
                  className="mt-4 w-full py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm transition-colors"
                >
                  管理成就任务
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 用户详情弹窗 */}
      <AnimatePresence>
        {showUserModal && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowUserModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h3 className="text-xl font-bold">创作者详情</h3>
                <button
                  onClick={() => setShowUserModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 space-y-6">
                {/* 基本信息 */}
                <div className="flex items-center gap-4">
                  <img
                    src={selectedUser.avatar_url || `https://via.placeholder.com/100`}
                    alt={selectedUser.username}
                    className="w-20 h-20 rounded-full object-cover border-2 border-red-500"
                  />
                  <div>
                    <h4 className="text-lg font-semibold">{selectedUser.username || '未设置用户名'}</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      ID: {selectedUser.id}
                    </p>
                    {(() => {
                      const levelNum = typeof selectedUser.level === 'object' ? selectedUser.level?.level : parseInt(selectedUser.level) || 1;
                      const levelInfo = achievementService.getCreatorLevelByLevel(levelNum);
                      const levelColors: Record<number, string> = {
                        1: 'bg-gray-100 text-gray-600',
                        2: 'bg-green-100 text-green-600',
                        3: 'bg-blue-100 text-blue-600',
                        4: 'bg-purple-100 text-purple-600',
                        5: 'bg-orange-100 text-orange-600',
                        6: 'bg-red-100 text-red-600',
                        7: 'bg-yellow-100 text-yellow-600',
                      };
                      return (
                        <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs ${levelColors[levelNum]}`}>
                          {levelInfo?.icon} {levelInfo?.name || '创作新手'}
                        </span>
                      );
                    })()}
                  </div>
                </div>

                {/* 统计数据 */}
                <div className="grid grid-cols-4 gap-4">
                  {[
                    { label: '积分', value: selectedUser.points || 0, icon: 'star' },
                    { label: '成就数', value: `${selectedUser.unlockedAchievements || 0}/${selectedUser.totalAchievements || 0}`, icon: 'trophy' },
                    { label: '等级进度', value: `${selectedUser.levelProgress || 0}%`, icon: 'chart-line' },
                    { label: '注册时间', value: new Date(selectedUser.created_at).toLocaleDateString('zh-CN'), icon: 'calendar' },
                  ].map((stat, index) => (
                    <div key={index} className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} text-center`}>
                      <i className={`fas fa-${stat.icon} text-2xl mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
                      <p className="text-2xl font-bold">{stat.value}</p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stat.label}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 成就弹窗 */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
              onClick={(e) => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-bold">
                    {modalMode === 'create' ? '新增成就' : modalMode === 'edit' ? '编辑成就' : '成就详情'}
                  </h3>
                  <button
                    onClick={() => setShowModal(false)}
                    className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 space-y-6">
                {modalMode === 'view' && selectedItem && 'id' in selectedItem ? (
                  /* 查看模式 */
                  <div className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-20 h-20 rounded-2xl flex items-center justify-center"
                        style={{
                          backgroundColor: RARITY_CONFIG[selectedItem.rarity]?.bgColor,
                          color: RARITY_CONFIG[selectedItem.rarity]?.color,
                        }}
                      >
                        {getIconComponent(selectedItem.icon)}
                      </div>
                      <div>
                        <h4 className="text-2xl font-bold">{selectedItem.name}</h4>
                        <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {selectedItem.description}
                        </p>
                      </div>
                    </div>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>稀有度</p>
                          <span
                            className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: RARITY_CONFIG[selectedItem.rarity]?.bgColor,
                              color: RARITY_CONFIG[selectedItem.rarity]?.color,
                            }}
                          >
                            {RARITY_CONFIG[selectedItem.rarity]?.name}
                          </span>
                        </div>
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>分类</p>
                          <span
                            className="inline-block mt-1 px-3 py-1 rounded-full text-sm font-medium"
                            style={{
                              backgroundColor: `${CATEGORY_CONFIG[selectedItem.category]?.color}20`,
                              color: CATEGORY_CONFIG[selectedItem.category]?.color,
                            }}
                          >
                            {CATEGORY_CONFIG[selectedItem.category]?.name}
                          </span>
                        </div>
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>奖励积分</p>
                          <p className="text-lg font-medium text-red-600">+{selectedItem.points}</p>
                        </div>
                        <div>
                          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>达成条件</p>
                          <p className="text-sm">{selectedItem.criteria}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 编辑/创建模式 */
                  <div className="space-y-4">
                    {/* 名称 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        成就名称 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={modalMode === 'view'}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          formErrors.name ? 'border-red-500' : isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                        }`}
                        placeholder="请输入成就名称"
                      />
                      {formErrors.name && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.name}
                        </p>
                      )}
                    </div>

                    {/* 描述 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        成就描述 <span className="text-red-500">*</span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        disabled={modalMode === 'view'}
                        rows={3}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          formErrors.description ? 'border-red-500' : isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                        }`}
                        placeholder="请输入成就描述"
                      />
                      {formErrors.description && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.description}
                        </p>
                      )}
                    </div>

                    {/* 图标选择 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        图标
                      </label>
                      <div className="grid grid-cols-8 gap-2">
                        {Object.keys(ICON_MAP).map((iconName) => {
                          const IconComponent = ICON_MAP[iconName];
                          return (
                            <button
                              key={iconName}
                              onClick={() => modalMode !== 'view' && setFormData({ ...formData, icon: iconName })}
                              disabled={modalMode === 'view'}
                              className={`p-3 rounded-lg border transition-colors ${
                                formData.icon === iconName
                                  ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                                  : isDark ? 'border-gray-600 hover:border-gray-500' : 'border-gray-300 hover:border-gray-400'
                              }`}
                            >
                              <IconComponent className="w-5 h-5 mx-auto" />
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* 稀有度和分类 */}
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          稀有度
                        </label>
                        <select
                          value={formData.rarity}
                          onChange={(e) => setFormData({ ...formData, rarity: e.target.value })}
                          disabled={modalMode === 'view'}
                          className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                        >
                          <option value="common">普通</option>
                          <option value="rare">稀有</option>
                          <option value="epic">史诗</option>
                          <option value="legendary">传说</option>
                        </select>
                      </div>
                      <div>
                        <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          分类
                        </label>
                        <select
                          value={formData.category}
                          onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                          disabled={modalMode === 'view'}
                          className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'}`}
                        >
                          <option value="creation">创作成就</option>
                          <option value="community">社区成就</option>
                          <option value="special">特殊成就</option>
                        </select>
                      </div>
                    </div>

                    {/* 达成条件 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        达成条件 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={formData.criteria}
                        onChange={(e) => setFormData({ ...formData, criteria: e.target.value })}
                        disabled={modalMode === 'view'}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          formErrors.criteria ? 'border-red-500' : isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                        }`}
                        placeholder="请输入达成条件"
                      />
                      {formErrors.criteria && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.criteria}
                        </p>
                      )}
                    </div>

                    {/* 积分 */}
                    <div>
                      <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        奖励积分 <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={formData.points}
                        onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                        disabled={modalMode === 'view'}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          formErrors.points ? 'border-red-500' : isDark ? 'border-gray-600 bg-gray-700 text-white' : 'border-gray-300 bg-white text-gray-900'
                        }`}
                        placeholder="请输入奖励积分"
                      />
                      {formErrors.points && (
                        <p className="mt-1 text-sm text-red-500 flex items-center gap-1">
                          <AlertCircle className="w-4 h-4" />
                          {formErrors.points}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* 弹窗底部 */}
              {modalMode !== 'view' && (
                <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                  <button
                    onClick={() => setShowModal(false)}
                    className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'} transition-colors`}
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSave}
                    disabled={isSubmitting}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full" />
                        保存中...
                      </>
                    ) : (
                      <>
                        <Save className="w-4 h-4" />
                        保存
                      </>
                    )}
                  </button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
