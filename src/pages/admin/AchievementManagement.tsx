import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { Upload, X, Plus, Search, Edit2, Trash2, Eye, Save, AlertCircle, Trophy, Star, Award, Crown, Shield, Target, Zap, Heart, MessageCircle, Bookmark, Share2, Calendar, Cpu, Video, Film, Users, UserCheck, Landmark, Sparkles } from 'lucide-react';
import achievementService, { Achievement, CreatorLevel } from '@/services/achievementService';

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
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [levels, setLevels] = useState<CreatorLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'achievements' | 'levels'>('achievements');
  const [selectedItem, setSelectedItem] = useState<Achievement | CreatorLevel | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<'create' | 'edit' | 'view'>('view');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 表单状态
  const [formData, setFormData] = useState<Partial<Achievement>>({
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
      const data = await achievementService.getAllAchievements();
      setAchievements(data);
      
      const levelData = achievementService.getCreatorLevels();
      setLevels(levelData);
    } catch (error) {
      console.error('获取成就列表失败:', error);
      toast.error('获取成就列表失败');
    } finally {
      setLoading(false);
    }
  };

  // 初始化数据
  useEffect(() => {
    fetchAchievements();
  }, []);

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
        // 创建新成就
        const newAchievement: Achievement = {
          ...formData as Achievement,
          id: Date.now(),
          progress: 0,
          isUnlocked: false,
        };
        // 添加到本地存储或服务
        const currentAchievements = await achievementService.getAllAchievements();
        currentAchievements.push(newAchievement);
        localStorage.setItem('ACHIEVEMENTS_DATA', JSON.stringify(currentAchievements));
        toast.success('成就创建成功');
      } else if (modalMode === 'edit' && selectedItem && 'id' in selectedItem) {
        // 更新成就
        const currentAchievements = await achievementService.getAllAchievements();
        const index = currentAchievements.findIndex(a => a.id === selectedItem.id);
        if (index !== -1) {
          currentAchievements[index] = { ...currentAchievements[index], ...formData };
          localStorage.setItem('ACHIEVEMENTS_DATA', JSON.stringify(currentAchievements));
        }
        toast.success('成就更新成功');
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
  const handleDelete = async (achievement: Achievement) => {
    if (!confirm(`确定要删除"${achievement.name}"吗？此操作不可恢复。`)) {
      return;
    }

    try {
      const currentAchievements = await achievementService.getAllAchievements();
      const filtered = currentAchievements.filter(a => a.id !== achievement.id);
      localStorage.setItem('ACHIEVEMENTS_DATA', JSON.stringify(filtered));
      toast.success('成就已删除');
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
  const openEditModal = (achievement: Achievement) => {
    setSelectedItem(achievement);
    setFormData({ ...achievement });
    setFormErrors({});
    setModalMode('edit');
    setShowModal(true);
  };

  // 打开查看弹窗
  const openViewModal = (achievement: Achievement) => {
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
      ) : (
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
                        {level.minPoints} - {level.maxPoints} 积分
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
      )}

      {/* 弹窗 */}
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
