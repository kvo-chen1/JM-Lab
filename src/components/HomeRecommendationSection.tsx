import React, { useState, useEffect, useCallback, useContext } from 'react';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { TianjinImage, TianjinTag } from '@/components/TianjinStyleComponents';
import recommendationService, { 
  RecommendedItem, 
  RecommendationFeedbackType,
  recordUserAction 
} from '@/services/recommendationService';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';

interface HomeRecommendationSectionProps {
  className?: string;
}

const HomeRecommendationSection: React.FC<HomeRecommendationSectionProps> = ({ className = '' }) => {
  const { isDark } = useTheme();
  const { user, isAuthenticated } = useContext(AuthContext);
  const navigate = useNavigate();
  const { t } = useTranslation();
  
  const [recommendations, setRecommendations] = useState<RecommendedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'challenges' | 'templates'>('all');
  const [feedbackStatus, setFeedbackStatus] = useState<Record<string, RecommendationFeedbackType>>({});
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  // 获取用户ID（未登录用户使用设备ID）
  const getUserId = useCallback(() => {
    if (user?.id) return user.id;
    // 为未登录用户生成临时ID
    let deviceId = localStorage.getItem('jmzf_device_id');
    if (!deviceId) {
      deviceId = `device_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      localStorage.setItem('jmzf_device_id', deviceId);
    }
    return deviceId;
  }, [user]);

  // 加载推荐内容
  const loadRecommendations = useCallback(async () => {
    setIsLoading(true);
    try {
      const userId = getUserId();
      
      // 调试：检查数据源
      const homePageData = localStorage.getItem('homePageData');
      const works = localStorage.getItem('works');
      console.log('推荐系统调试:', {
        userId,
        hasHomePageData: !!homePageData,
        hasWorks: !!works,
        worksLength: works ? JSON.parse(works).length : 0
      });
      
      const items = recommendationService.getRecommendations(userId, {
        strategy: 'hybrid',
        limit: 12,
        includeDiverse: true,
        recentDays: 30
      });
      
      console.log('推荐结果:', items.length, '项');
      setRecommendations(items);
    } catch (error) {
      console.error('加载推荐失败:', error);
    } finally {
      setIsLoading(false);
    }
  }, [getUserId]);

  // 刷新推荐
  const handleRefresh = async () => {
    setIsRefreshing(true);
    // 清除缓存强制重新生成
    const userId = getUserId();
    const cacheKey = `jmzf_recommendations_${userId}_hybrid_12_diverse`;
    localStorage.removeItem(cacheKey);
    
    await loadRecommendations();
    setIsRefreshing(false);
    toast.success('推荐已更新');
  };

  // 初始加载
  useEffect(() => {
    loadRecommendations();
  }, [loadRecommendations]);

  // 筛选推荐内容
  const filteredRecommendations = activeTab === 'all' 
    ? recommendations.slice(0, 8)
    : recommendations
        .filter(item => item.type === activeTab.slice(0, -1) as 'post' | 'challenge' | 'template')
        .slice(0, 8);

  // 处理推荐项点击
  const handleItemClick = (item: RecommendedItem) => {
    // 记录点击行为
    recommendationService.recordRecommendationClick(getUserId(), item);
    
    // 导航到对应页面
    let path = '/';
    switch (item.type) {
      case 'post':
        path = `/square?q=${encodeURIComponent(item.title)}`;
        break;
      case 'challenge':
        path = `/events`;
        break;
      case 'template':
        path = `/create`;
        break;
    }
    navigate(path);
  };

  // 处理反馈
  const handleFeedback = (e: React.MouseEvent, item: RecommendedItem, feedbackType: RecommendationFeedbackType) => {
    e.stopPropagation();
    
    recommendationService.recordRecommendationFeedback(getUserId(), {
      itemId: item.id,
      itemType: item.type,
      feedbackType
    });
    
    setFeedbackStatus(prev => ({
      ...prev,
      [item.id]: feedbackType
    }));
    
    if (feedbackType === 'hide') {
      setRecommendations(prev => prev.filter(i => i.id !== item.id));
      toast.success('已隐藏该推荐');
    } else if (feedbackType === 'like') {
      toast.success('感谢您的反馈，我们会推荐更多类似内容');
    } else if (feedbackType === 'dislike') {
      toast.success('感谢您的反馈，我们会减少类似推荐');
    }
  };

  // 获取类型名称
  const getTypeName = (type: string): string => {
    switch (type) {
      case 'post': return '作品';
      case 'challenge': return '挑战';
      case 'template': return '模板';
      default: return '内容';
    }
  };

  // 获取类型颜色 - 更精致的渐变配色
  const getTypeColor = (type: string): string => {
    switch (type) {
      case 'post': return 'bg-gradient-to-r from-violet-500 to-purple-600 text-white shadow-purple-500/30';
      case 'challenge': return 'bg-gradient-to-r from-blue-500 to-cyan-500 text-white shadow-blue-500/30';
      case 'template': return 'bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-emerald-500/30';
      default: return 'bg-gradient-to-r from-gray-500 to-slate-500 text-white';
    }
  };

  // 获取类型图标
  const getTypeIcon = (type: string): string => {
    switch (type) {
      case 'post': return 'fa-image';
      case 'challenge': return 'fa-trophy';
      case 'template': return 'fa-layer-group';
      default: return 'fa-circle';
    }
  };

  if (!isAuthenticated && recommendations.length === 0 && !isLoading) {
    return (
      <div className={`max-w-7xl mx-auto px-4 md:px-6 mb-16 ${className}`}>
        <div className={`rounded-3xl p-8 ${isDark ? 'bg-gray-900/50' : 'bg-gradient-to-br from-blue-50 to-purple-50'} border ${isDark ? 'border-gray-700' : 'border-blue-100'}`}>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0 }}
              whileInView={{ scale: 1 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center shadow-lg shadow-purple-500/30"
            >
              <i className="fas fa-magic text-white text-2xl"></i>
            </motion.div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              发现个性化推荐
            </h3>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              登录后即可获取基于您兴趣的智能推荐
            </p>
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.5)' }}
              whileTap={{ scale: 0.95 }}
              onClick={() => navigate('/login')}
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full font-medium hover:shadow-lg transition-all"
            >
              立即登录
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`max-w-7xl mx-auto px-4 md:px-6 mb-16 ${className}`}>
      {/* 标题栏 - 全新设计 */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
        <div className="flex items-center gap-4">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 flex items-center justify-center shadow-xl shadow-purple-500/30"
          >
            <i className="fas fa-sparkles text-white text-lg"></i>
            {/* 装饰光晕 */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-blue-500 via-purple-500 to-pink-500 blur-xl opacity-50 -z-10"></div>
          </motion.div>
          <div>
            <h2 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r from-gray-900 via-purple-700 to-blue-700 dark:from-white dark:via-purple-300 dark:to-blue-300 bg-clip-text text-transparent`}>
              为您推荐
            </h2>
            <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              基于您的浏览和喜好智能推荐
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* 类型筛选 - 胶囊式设计 */}
          <div className="flex gap-1.5 p-1.5 rounded-full bg-gray-100/80 dark:bg-gray-800/80 backdrop-blur-sm">
            {[
              { value: 'all', label: '全部', icon: 'fa-th-large' },
              { value: 'posts', label: '作品', icon: 'fa-image' },
              { value: 'challenges', label: '挑战', icon: 'fa-trophy' },
              { value: 'templates', label: '模板', icon: 'fa-layer-group' }
            ].map(tab => (
              <motion.button
                key={tab.value}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setActiveTab(tab.value as any)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 flex items-center gap-2 ${
                  activeTab === tab.value 
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-400 shadow-md' 
                    : isDark 
                      ? 'text-gray-400 hover:text-gray-200' 
                      : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <i className={`fas ${tab.icon} text-xs`}></i>
                {tab.label}
              </motion.button>
            ))}
          </div>

          {/* 刷新按钮 */}
          <motion.button
            whileHover={{ scale: 1.1, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            onClick={handleRefresh}
            disabled={isRefreshing}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
              isDark 
                ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-md hover:shadow-lg'
            } ${isRefreshing ? 'animate-spin' : ''}`}
            title="刷新推荐"
          >
            <i className="fas fa-sync-alt text-sm"></i>
          </motion.button>
        </div>
      </div>

      {/* 推荐内容网格 */}
      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(8)].map((_, i) => (
            <div 
              key={i} 
              className={`rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-lg`}
            >
              <div className={`aspect-square ${isDark ? 'bg-gray-700' : 'bg-gray-200'} animate-pulse`}></div>
              <div className="p-4 space-y-3">
                <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded-lg w-3/4 animate-pulse`}></div>
                <div className="flex gap-2">
                  <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-16 animate-pulse`}></div>
                  <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-16 animate-pulse`}></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredRecommendations.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {filteredRecommendations.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true, margin: '-50px' }}
              transition={{ duration: 0.5, delay: idx * 0.08, ease: [0.25, 0.46, 0.45, 0.94] }}
              whileHover={{ y: -10, scale: 1.02 }}
              onHoverStart={() => setHoveredCard(item.id)}
              onHoverEnd={() => setHoveredCard(null)}
              onClick={() => handleItemClick(item)}
              className={`group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-500 ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } ${hoveredCard === item.id ? 'shadow-2xl shadow-purple-500/20' : 'shadow-lg shadow-gray-200/50 dark:shadow-none'}`}
            >
              {/* 缩略图容器 */}
              <div className="relative aspect-square overflow-hidden">
                <TianjinImage
                  src={item.thumbnail || '/images/placeholder-image.jpg'}
                  alt={item.title}
                  className="w-full h-full object-cover transition-all duration-700 group-hover:scale-110"
                  fallbackSrc="/images/placeholder-image.jpg"
                  loading="lazy"
                />
                
                {/* 渐变遮罩 */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>

                {/* 类型标签 - 更精致的设计 */}
                <div className="absolute top-3 left-3">
                  <motion.span 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.08 + 0.2 }}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold shadow-lg ${getTypeColor(item.type)} flex items-center gap-1.5`}
                  >
                    <i className={`fas ${getTypeIcon(item.type)} text-[10px]`}></i>
                    {getTypeName(item.type)}
                  </motion.span>
                </div>

                {/* 推荐理由（悬停显示） */}
                {item.reason && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-500 flex items-end p-4">
                    <motion.p 
                      initial={{ y: 10, opacity: 0 }}
                      animate={hoveredCard === item.id ? { y: 0, opacity: 1 } : { y: 10, opacity: 0 }}
                      transition={{ duration: 0.3 }}
                      className="text-white text-xs leading-relaxed line-clamp-2"
                    >
                      <i className="fas fa-lightbulb text-yellow-400 mr-1.5"></i>
                      {item.reason}
                    </motion.p>
                  </div>
                )}

                {/* 反馈按钮（悬停显示） */}
                <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-x-2 group-hover:translate-x-0">
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleFeedback(e, item, 'like')}
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-sm transition-all duration-300 shadow-lg ${
                      feedbackStatus[item.id] === 'like'
                        ? 'bg-gradient-to-br from-red-500 to-pink-500 text-white'
                        : 'bg-white/95 text-gray-600 hover:bg-gradient-to-br hover:from-red-500 hover:to-pink-500 hover:text-white'
                    }`}
                    title="喜欢"
                  >
                    <i className="fas fa-heart"></i>
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.15 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={(e) => handleFeedback(e, item, 'hide')}
                    className="w-8 h-8 rounded-full bg-white/95 text-gray-600 hover:bg-gray-800 hover:text-white flex items-center justify-center text-sm transition-all duration-300 shadow-lg"
                    title="不感兴趣"
                  >
                    <i className="fas fa-times"></i>
                  </motion.button>
                </div>
              </div>

              {/* 内容信息 - 更精致的布局 */}
              <div className="p-4">
                <h3 className={`font-semibold text-sm mb-3 line-clamp-1 transition-colors duration-300 ${
                  isDark ? 'text-white group-hover:text-purple-300' : 'text-gray-900 group-hover:text-purple-600'
                }`}>
                  {item.title}
                </h3>
                
                {/* 互动数据 - 更美观的展示 */}
                {item.metadata && (
                  <div className="flex items-center gap-4 text-xs">
                    {item.metadata.likes !== undefined && (
                      <span className={`flex items-center gap-1.5 transition-colors duration-300 ${
                        isDark ? 'text-gray-400 group-hover:text-red-400' : 'text-gray-500 group-hover:text-red-500'
                      }`}>
                        <i className="fas fa-heart text-red-400"></i>
                        <span className="font-medium">{item.metadata.likes}</span>
                      </span>
                    )}
                    {item.metadata.views !== undefined && (
                      <span className={`flex items-center gap-1.5 transition-colors duration-300 ${
                        isDark ? 'text-gray-400 group-hover:text-blue-400' : 'text-gray-500 group-hover:text-blue-500'
                      }`}>
                        <i className="fas fa-eye text-blue-400"></i>
                        <span className="font-medium">{item.metadata.views}</span>
                      </span>
                    )}
                    {item.metadata.participants !== undefined && (
                      <span className={`flex items-center gap-1.5 transition-colors duration-300 ${
                        isDark ? 'text-gray-400 group-hover:text-emerald-400' : 'text-gray-500 group-hover:text-emerald-500'
                      }`}>
                        <i className="fas fa-users text-emerald-400"></i>
                        <span className="font-medium">{item.metadata.participants}</span>
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* 底部装饰线 */}
              <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className={`text-center py-16 rounded-3xl ${isDark ? 'bg-gray-800/50' : 'bg-gradient-to-br from-gray-50 to-blue-50/50'} border border-dashed ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', stiffness: 200 }}
            className="w-20 h-20 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center"
          >
            <i className="fas fa-compass text-gray-400 text-3xl"></i>
          </motion.div>
          <h3 className={`text-lg font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
            暂无推荐内容
          </h3>
          <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            继续探索平台内容，我们会为您提供更精准的推荐
          </p>
          <motion.button
            whileHover={{ scale: 1.05, boxShadow: '0 10px 30px -10px rgba(99, 102, 241, 0.4)' }}
            whileTap={{ scale: 0.95 }}
            onClick={() => navigate('/square')}
            className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-full text-sm font-semibold hover:shadow-lg transition-all"
          >
            <i className="fas fa-compass mr-2"></i>
            去发现
          </motion.button>
        </div>
      )}
    </div>
  );
};

export default HomeRecommendationSection;
