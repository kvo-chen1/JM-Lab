import { useState, useEffect, useContext } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'sonner';
import achievementService from '../services/achievementService';
import { TianjinImage } from './TianjinStyleComponents';
import { AuthContext } from '@/contexts/authContext';

// 3D模型展示的成就类型定义
interface AchievementExhibit {
  id: number;
  name: string;
  description: string;
  image: string;
  year: number;
  category: string;
}

export default function AchievementMuseum() {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useContext(AuthContext);
  const [achievements, setAchievements] = useState<any[]>([]);
  const [exhibits, setExhibits] = useState<AchievementExhibit[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'achievements' | 'exhibits' | 'vr'>('achievements');
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAchievement, setSelectedAchievement] = useState<any>(null);
  const [showAchievementDetail, setShowAchievementDetail] = useState(false);
  const [shareOptions, setShareOptions] = useState<string[]>(['copy', 'twitter', 'facebook', 'linkedin', 'wechat', 'qq']);
  const [exportFormat, setExportFormat] = useState<'image' | 'pdf' | 'json'>('image');
  const [filterRarity, setFilterRarity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // 加载数据
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // 如果用户已登录，从后端获取最新成就数据
        if (isAuthenticated && user?.id) {
          await achievementService.fetchUserAchievements(user.id);
        }
        
        // 从服务获取成就数据（包括本地计算的统计）
        const allAchievements = achievementService.getAllAchievements();
        setAchievements(allAchievements);
        
        // 获取成就统计
        const achievementStats = achievementService.getAchievementStats();
        setStats(achievementStats);
        
        // 模拟展品数据 (这部分暂无后端接口，保持模拟)
        setExhibits([
          {
            id: 1,
            name: '国潮插画系列',
            description: '结合传统中国元素与现代设计风格的插画作品',
            image: '/images/tianjin/culture-1.jpg', // Placeholder
            year: 2025,
            category: '插画设计'
          },
          {
            id: 2,
            name: '传统纹样创新',
            description: '基于传统纹样进行创新设计的图案集合',
            image: '/images/tianjin/culture-2.jpg', // Placeholder
            year: 2025,
            category: '纹样设计'
          },
          {
            id: 3,
            name: '老字号品牌焕新',
            description: '为老字号品牌设计的现代化视觉识别系统',
            image: '/images/tianjin/culture-3.jpg', // Placeholder
            year: 2025,
            category: '品牌设计'
          }
        ]);
      } catch (error) {
        console.error('Failed to load achievements:', error);
        toast.error('加载成就数据失败');
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [isAuthenticated, user]);

  // 获取成就稀有度对应的颜色
  const getRarityColor = (rarity: string) => {
    switch(rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-600';
      case 'rare':
        return 'bg-blue-100 text-blue-600';
      case 'epic':
        return 'bg-purple-100 text-purple-600';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // 分享成就
  const shareAchievement = async (achievement: any, platform: string) => {
    const shareUrl = `${window.location.origin}/achievement/${achievement.id}`;
    const shareText = `我在创意平台获得了成就：${achievement.name}！`;
    
    try {
      switch(platform) {
        case 'copy':
          await navigator.clipboard.writeText(shareUrl);
          toast.success('成就链接已复制到剪贴板');
          break;
        case 'twitter':
          window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'facebook':
          window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
        case 'linkedin':
          window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
          break;
      }
    } catch (error) {
      toast.error('分享失败，请重试');
    }
  };
  
  // 导出成就
  const exportAchievement = (achievement: any, format: 'image' | 'pdf' | 'json') => {
    switch(format) {
      case 'image':
        toast.info('正在生成成就图片...');
        // 模拟导出过程
        setTimeout(() => {
          toast.success('成就图片已导出');
        }, 1500);
        break;
      case 'pdf':
        toast.info('正在生成成就PDF...');
        setTimeout(() => {
          toast.success('成就PDF已导出');
        }, 1500);
        break;
      case 'json':
        toast.info('正在生成成就JSON数据...');
        setTimeout(() => {
          toast.success('成就JSON数据已导出');
        }, 1500);
        break;
    }
  };

  // 筛选成就
  const getFilteredAchievements = () => {
    let filtered = achievements;
    
    if (filterRarity !== 'all') {
      filtered = filtered.filter(achievement => achievement.rarity === filterRarity);
    }
    
    if (filterCategory !== 'all') {
      filtered = filtered.filter(achievement => achievement.category === filterCategory);
    }
    
    return filtered;
  };
  
  // 打开成就详情
  const openAchievementDetail = (achievement: any) => {
    setSelectedAchievement(achievement);
    setShowAchievementDetail(true);
  };
  
  // 关闭成就详情
  const closeAchievementDetail = () => {
    setShowAchievementDetail(false);
    setTimeout(() => {
      setSelectedAchievement(null);
    }, 300);
  };

  // 骨架屏加载状态
  if (isLoading) {
    return (
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="space-y-6">
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="flex space-x-3 overflow-x-auto pb-4">
            {[1, 2, 3].map((i) => (
              <div 
                key={i} 
                className={`h-10 w-24 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            ))}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className={`h-40 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-10 rounded-lg bg-gray-100 dark:bg-gray-700 animate-pulse"></div>
              ))}
            </div>
          </div>
          <div className={`h-8 w-1/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="space-y-3">
                <div className={`h-40 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
                <div className={`h-4 w-3/4 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
    >
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-xl font-bold">创作成就博物馆</h3>
        <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
          isDark ? 'bg-gray-700' : 'bg-gray-100'
        }`}>
          <i className="fas fa-trophy text-yellow-500 mr-1"></i>
          <span>{stats.completionRate}% 完成度</span>
        </div>
      </div>

      {/* 标签页切换 */}
      <div className="flex space-x-3 mb-6 overflow-x-auto pb-4 scrollbar-hide">
        {[
          { id: 'achievements', name: '成就列表' },
          { id: 'exhibits', name: '3D展品' },
          { id: 'vr', name: 'VR参观' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as 'achievements' | 'exhibits' | 'vr')}
            className={`px-5 py-2.5 rounded-full text-sm font-medium transition-all whitespace-nowrap ${
              activeTab === tab.id 
                ? 'bg-red-600 text-white shadow-md' 
                : isDark 
                  ? 'bg-gray-700 hover:bg-gray-600' 
                  : 'bg-gray-100 hover:bg-gray-200'
            }`}
          >
            {tab.name}
          </button>
        ))}
      </div>

      {/* 成就列表 */}
      {activeTab === 'achievements' && (
        <div>
          {/* 成就统计卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <motion.div
              className={`p-6 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <h4 className="font-medium mb-4">成就统计</h4>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { name: '已解锁', value: stats.unlocked },
                      { name: '未解锁', value: stats.locked }
                    ]}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke={isDark ? '#374151' : '#e5e7eb'} />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: isDark ? '#9ca3af' : '#4b5563' }}
                      axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
                    />
                    <YAxis 
                      tick={{ fill: isDark ? '#9ca3af' : '#4b5563' }}
                      axisLine={{ stroke: isDark ? '#374151' : '#e5e7eb' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: isDark ? '#1f2937' : '#ffffff',
                        borderColor: isDark ? '#374151' : '#e5e7eb',
                        borderRadius: '0.5rem',
                        color: isDark ? '#ffffff' : '#000000'
                      }} 
                    />
                    <Bar 
                      dataKey="value" 
                      name="数量" 
                      fill={isDark ? '#ef4444' : '#ef4444'} 
                      radius={[4, 4, 0, 0]} 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-4 text-center">
                <p className="text-sm opacity-70">总成就: {stats.total}</p>
              </div>
            </motion.div>

            <div className="space-y-4">
              <motion.div
                className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${
                  isDark ? 'border-gray-600' : 'border-gray-200'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
              >
                <h4 className="font-medium mb-3">最近解锁</h4>
                {stats.recentUnlocks.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentUnlocks.map((achievement: any) => (
                      <div key={achievement.id} className="flex items-center">
                        <div className={`w-8 h-8 rounded-full ${getRarityColor(achievement.rarity)} flex items-center justify-center mr-3`}>
                          <i className={`fas fa-${achievement.icon}`}></i>
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{achievement.name}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                            {achievement.unlockedAt}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'} text-center py-2`}>
                    暂无解锁记录
                  </p>
                )}
              </motion.div>

              <motion.div
                className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'} border ${
                  isDark ? 'border-gray-600' : 'border-gray-200'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <h4 className="font-medium mb-3">稀有度分布</h4>
                <div className="space-y-3">
                  {[
                    { rarity: 'common', label: '普通', count: 2 },
                    { rarity: 'rare', label: '稀有', count: 3 },
                    { rarity: 'epic', label: '史诗', count: 1 },
                    { rarity: 'legendary', label: '传说', count: 1 }
                  ].map((rarity, index) => (
                    <div key={index} className="flex items-center">
                      <div className={`w-3 h-3 rounded-full ${getRarityColor(rarity.rarity.replace(' ', '-'))} mr-2`}></div>
                      <span className="w-12">{rarity.label}</span>
                      <div className="flex-1 h-2 rounded-full bg-gray-200 dark:bg-gray-600">
                        <div 
                          className={`h-full rounded-full ${getRarityColor(rarity.rarity.replace(' ', '-')).split(' ')[0]}`}
                          style={{ width: `${(rarity.count / stats.total) * 100}%` }}
                        ></div>
                      </div>
                      <span className="w-8 text-right">{rarity.count}</span>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>

          {/* 成就筛选 */}
          <div className={`mb-6 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* 稀有度筛选 */}
              <div>
                <select
                  value={filterRarity}
                  onChange={(e) => setFilterRarity(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                >
                  <option value="all">所有稀有度</option>
                  <option value="common">普通</option>
                  <option value="rare">稀有</option>
                  <option value="epic">史诗</option>
                  <option value="legendary">传说</option>
                </select>
              </div>
              
              {/* 分类筛选 */}
              <div>
                <select
                  value={filterCategory}
                  onChange={(e) => setFilterCategory(e.target.value)}
                  className={`w-full px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-600 border-gray-500' : 'bg-white border-gray-300'} focus:outline-none focus:ring-2 focus:ring-red-500`}
                >
                  <option value="all">所有分类</option>
                  <option value="creation">创作</option>
                  <option value="community">社区</option>
                  <option value="achievement">成就</option>
                  <option value="special">特殊</option>
                </select>
              </div>
            </div>
          </div>
          
          {/* 成就列表 */}
          <h4 className="font-medium mb-4">全部成就 ({getFilteredAchievements().length} 项)</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {getFilteredAchievements().map((achievement) => (
              <motion.div
                key={achievement.id}
                className={`p-4 rounded-xl border cursor-pointer ${achievement.isUnlocked
                    ? `${isDark ? 'border-gray-700 bg-gray-700' : 'border-gray-200 bg-white'}`
                    : `${isDark ? 'border-gray-700 bg-gray-700/50' : 'border-gray-200 bg-gray-50'} opacity-70`
                  } transition-all hover:shadow-md`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.1 * achievement.id }}
                whileHover={{ y: -2 }}
                onClick={() => openAchievementDetail(achievement)}
              >
                <div className="flex items-start">
                  <div className={`w-10 h-10 rounded-full ${getRarityColor(achievement.rarity)} flex items-center justify-center mr-3 flex-shrink-0`}>
                    <i className={`fas fa-${achievement.icon} text-lg`}></i>
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h5 className="font-medium">{achievement.name}</h5>
                      {achievement.isUnlocked && (
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-600'}`}>
                          已解锁
                        </span>
                      )}
                    </div>
                    <p className={`text-sm mb-3 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {achievement.description}
                    </p>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span>{achievement.criteria}</span>
                        <span>{achievement.progress}%</span>
                      </div>
                      <div className={`h-1.5 rounded-full ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                        <div 
                          className={`h-full rounded-full ${getRarityColor(achievement.rarity).split(' ')[0]}`}
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                    </div>
                    {achievement.isUnlocked && achievement.unlockedAt && (
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          解锁时间: {achievement.unlockedAt}
                        </p>
                      )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* 成就详情模态框 */}
          {showAchievementDetail && selectedAchievement && (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className={`w-full max-w-md rounded-2xl ${isDark ? 'bg-gray-800 text-white' : 'bg-white text-gray-900'} p-6 shadow-xl`}
              >
                <div className="flex justify-between items-start mb-4">
                  <h3 className="text-xl font-bold">{selectedAchievement.name}</h3>
                  <button
                    onClick={closeAchievementDetail}
                    className={`p-2 rounded-full ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    <i className="fas fa-times"></i>
                  </button>
                </div>
                
                <div className="flex items-center mb-6">
                  <div className={`w-16 h-16 rounded-full ${getRarityColor(selectedAchievement.rarity)} flex items-center justify-center mr-4`}>
                    <i className={`fas fa-${selectedAchievement.icon} text-2xl`}></i>
                  </div>
                  <div>
                    <span className={`inline-block px-3 py-1 rounded-full text-xs mb-2 ${getRarityColor(selectedAchievement.rarity)}`}>
                      {selectedAchievement.rarity === 'common' ? '普通' : selectedAchievement.rarity === 'rare' ? '稀有' : selectedAchievement.rarity === 'epic' ? '史诗' : '传说'}
                    </span>
                    {selectedAchievement.isUnlocked ? (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs ${isDark ? 'bg-green-900/30 text-green-300' : 'bg-green-100 text-green-600'}`}>
                        已解锁
                      </span>
                    ) : (
                      <span className={`inline-block px-3 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                        未解锁
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-2">成就描述</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedAchievement.description}
                  </p>
                </div>
                
                <div className="mb-6">
                  <h4 className="font-medium mb-2">解锁条件</h4>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    {selectedAchievement.criteria}
                  </p>
                  <div className="mt-2">
                    <div className="flex justify-between text-xs mb-1">
                      <span>进度</span>
                      <span>{selectedAchievement.progress}%</span>
                    </div>
                    <div className={`h-2 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div 
                        className={`h-full rounded-full ${getRarityColor(selectedAchievement.rarity).split(' ')[0]}`}
                        style={{ width: `${selectedAchievement.progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
                
                {selectedAchievement.isUnlocked && selectedAchievement.unlockedAt && (
                  <div className="mb-6">
                    <h4 className="font-medium mb-2">解锁信息</h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      解锁时间: {selectedAchievement.unlockedAt}
                    </p>
                  </div>
                )}
                
                <div className="flex gap-2 mt-6">
                  <button
                    onClick={() => shareAchievement(selectedAchievement, 'copy')}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    <i className="fas fa-share-alt mr-1"></i>分享
                  </button>
                  <button
                    onClick={() => exportAchievement(selectedAchievement, 'image')}
                    className={`flex-1 py-2 rounded-lg text-sm transition-colors ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                  >
                    <i className="fas fa-download mr-1"></i>导出
                  </button>
                </div>
              </motion.div>
            </div>
          )}
        </div>
      )}

      {/* 3D展品 */}
      {activeTab === 'exhibits' && (
        <div>
          <div className="grid grid-cols-1 gap-8">
            {exhibits.map((exhibit) => (
              <motion.div
                key={exhibit.id}
                className={`rounded-xl overflow-hidden shadow-md border ${
                  isDark ? 'border-gray-700' : 'border-gray-200'
                }`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 * exhibit.id }}
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/2 relative">
                    <TianjinImage 
                      src={exhibit.image} 
                      alt={exhibit.name} 
                      className="w-full h-full object-cover min-h-[300px]"
                    />
                    <div className="absolute top-3 right-3">
                      <span className={`text-xs px-2 py-1 rounded-full bg-black bg-opacity-70 text-white`}>
                        3D模型
                      </span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 to-transparent p-4">
                      <h4 className="text-white font-bold text-xl">{exhibit.name}</h4>
                    </div>
                  </div>
                  
                  <div className={`md:w-1/2 p-6 ${isDark ? 'bg-gray-700' : 'bg-white'}`}>
                    <div className="flex justify-between items-start mb-4">
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark ? 'bg-gray-600' : 'bg-gray-100'
                      }`}>
                        {exhibit.category}
                      </span>
                      <span className={`text-xs px-2 py-1 rounded-full ${
                        isDark ? 'bg-gray-600' : 'bg-gray-100'
                      }`}>
                        {exhibit.year}
                      </span>
                    </div>
                    
                    <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {exhibit.description}
                    </p>
                    
                    <div className="space-y-4">
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-50'} flex items-center`}>
                        <div className="w-8 h-8 rounded-full bg-red-100 text-red-600 flex items-center justify-center mr-3">
                          <i className="fas fa-eye"></i>
                        </div>
                        <div>
                          <p className="text-sm opacity-70">3D预览</p>
                          <p className="font-medium">在线查看3D模型</p>
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-50'} flex items-center`}>
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mr-3">
                          <i className="fas fa-download"></i>
                        </div>
                        <div>
                          <p className="text-sm opacity-70">下载模型</p>
                          <p className="font-medium">获取STL/OBJ格式文件</p>
                        </div>
                      </div>
                      
                      <div className={`p-3 rounded-lg ${isDark ? 'bg-gray-600' : 'bg-gray-50'} flex items-center`}>
                        <div className="w-8 h-8 rounded-full bg-green-100 text-green-600 flex items-center justify-center mr-3">
                          <i className="fas fa-share-alt"></i>
                        </div>
                        <div>
                          <p className="text-sm opacity-70">分享展品</p>
                          <p className="font-medium">生成分享链接</p>
                        </div>
                      </div>
                    </div>
                    
                    <button className="w-full mt-6 py-3 rounded-lg bg-red-600 hover:bg-red-700 text-white font-medium transition-colors">
                      进入3D展示
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* VR参观 */}
      {activeTab === 'vr' && (
        <div className="text-center py-12">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
            className="max-w-2xl mx-auto"
          >
            <div className="mb-6 text-6xl text-blue-500">
              <i className="fas fa-vr-cardboard"></i>
            </div>
            <h4 className="text-xl font-bold mb-4">VR虚拟博物馆</h4>
            <p className={`text-sm mb-8 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              通过VR技术，您可以身临其境地参观自己的创作成就博物馆。佩戴VR设备，
              自由浏览您的3D作品展品，体验沉浸式的创作成果展示。
            </p>
            <div className="mb-8">
              <TianjinImage 

                alt="VR博物馆体验" 
                className="rounded-xl w-full max-h-96 object-cover mx-auto"
              />
            </div>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <button className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors flex items-center justify-center">
                <i className="fas fa-vr-cardboard mr-2"></i>
                开始VR参观
              </button>
              <button className={`px-6 py-3 rounded-lg transition-colors ${
                isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
              } flex items-center justify-center`}>
                <i className="fas fa-video mr-2"></i>
                观看演示视频
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
