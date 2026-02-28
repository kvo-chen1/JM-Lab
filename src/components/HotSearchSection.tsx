import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import {
  TrendingUp,
  Search,
  ArrowRight,
  Zap,
  Flame,
  Award,
  ChevronRight,
  RefreshCw,
  Clock
} from 'lucide-react';

// 热搜项接口
interface HotSearchItem {
  id: string;
  query: string;
  search_count: number;
  unique_searchers: number;
  trend_score: number;
  category: string | null;
  is_active: boolean;
  last_searched_at: string;
  trend?: 'up' | 'down' | 'stable' | 'new';
}

// 热搜榜组件属性
interface HotSearchSectionProps {
  className?: string;
  onSearchClick?: (query: string) => void;
  maxItems?: number;
}

// 趋势图标组件
const TrendIcon: React.FC<{ trend: string; className?: string }> = ({ trend, className = '' }) => {
  switch (trend) {
    case 'up':
      return <TrendingUp className={`${className} text-red-500`} />;
    case 'new':
      return <Zap className={`${className} text-yellow-500`} />;
    case 'down':
      return <TrendingUp className={`${className} text-green-500 rotate-180`} />;
    default:
      return <div className={`${className} w-2 h-2 rounded-full bg-gray-400`} />;
  }
};

// 排名徽章组件
const RankBadge: React.FC<{ rank: number; className?: string }> = ({ rank, className = '' }) => {
  const getBadgeStyle = () => {
    switch (rank) {
      case 0:
        return 'bg-gradient-to-br from-yellow-400 to-amber-500 text-white shadow-lg shadow-yellow-500/30';
      case 1:
        return 'bg-gradient-to-br from-gray-300 to-gray-400 text-white shadow-lg shadow-gray-400/30';
      case 2:
        return 'bg-gradient-to-br from-orange-400 to-amber-600 text-white shadow-lg shadow-orange-500/30';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  };

  const getIcon = () => {
    switch (rank) {
      case 0:
        return <Award className="w-3 h-3" />;
      case 1:
        return <Award className="w-3 h-3" />;
      case 2:
        return <Award className="w-3 h-3" />;
      default:
        return <span className="text-xs font-bold">{rank + 1}</span>;
    }
  };

  return (
    <motion.div
      initial={{ scale: 0, rotate: -180 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: 'spring', stiffness: 200, delay: rank * 0.05 }}
      className={`w-7 h-7 rounded-lg flex items-center justify-center ${getBadgeStyle()} ${className}`}
    >
      {getIcon()}
    </motion.div>
  );
};

// 热搜卡片组件
const HotSearchCard: React.FC<{
  item: HotSearchItem;
  index: number;
  isDark: boolean;
  onClick: () => void;
  isHovered: boolean;
  onHover: () => void;
  onLeave: () => void;
}> = ({ item, index, isDark, onClick, isHovered, onHover, onLeave }) => {
  const getTrendColor = () => {
    switch (item.trend) {
      case 'up':
        return 'text-red-500';
      case 'new':
        return 'text-yellow-500';
      case 'down':
        return 'text-green-500';
      default:
        return 'text-gray-400';
    }
  };

  const getTrendLabel = () => {
    switch (item.trend) {
      case 'up':
        return '上升';
      case 'new':
        return '新上榜';
      case 'down':
        return '下降';
      default:
        return '稳定';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: index * 0.05 }}
      whileHover={{ scale: 1.02, y: -2 }}
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className={`
        relative group cursor-pointer rounded-xl p-4 transition-all duration-300
        ${isDark 
          ? 'bg-gray-800/80 hover:bg-gray-700/80 border border-gray-700/50 hover:border-gray-600' 
          : 'bg-white hover:bg-gray-50 border border-gray-100 hover:border-gray-200'
        }
        ${isHovered ? 'shadow-xl shadow-red-500/10' : 'shadow-md'}
      `}
    >
      {/* 悬停时的背景光效 */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: isHovered ? 1 : 0 }}
        className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/5 to-orange-500/5 pointer-events-none"
      />

      <div className="relative flex items-center gap-4">
        {/* 排名 */}
        <RankBadge rank={index} />

        {/* 内容 */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold text-base truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {item.query}
            </h4>
            {index < 3 && (
              <motion.span
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="flex-shrink-0"
              >
                <Flame className="w-4 h-4 text-red-500" />
              </motion.span>
            )}
          </div>
          
          <div className="flex items-center gap-3 mt-1.5">
            <span className={`text-xs flex items-center gap-1 ${getTrendColor()}`}>
              <TrendIcon trend={item.trend || 'stable'} className="w-3 h-3" />
              {getTrendLabel()}
            </span>
            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {item.search_count.toLocaleString()}次搜索
            </span>
            {item.category && (
              <span className={`
                text-[10px] px-2 py-0.5 rounded-full
                ${isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'}
              `}>
                {item.category}
              </span>
            )}
          </div>
        </div>

        {/* 右侧箭头 */}
        <motion.div
          animate={{ x: isHovered ? 4 : 0, opacity: isHovered ? 1 : 0.3 }}
          transition={{ duration: 0.2 }}
        >
          <ChevronRight className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </motion.div>
      </div>

      {/* 底部进度条 - 表示热度 */}
      <div className="mt-3 h-1 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(100, (item.search_count / 1000) * 100)}%` }}
          transition={{ duration: 0.8, delay: index * 0.05 + 0.2 }}
          className={`
            h-full rounded-full
            ${index === 0 ? 'bg-gradient-to-r from-yellow-400 to-amber-500' :
              index === 1 ? 'bg-gradient-to-r from-gray-300 to-gray-400' :
              index === 2 ? 'bg-gradient-to-r from-orange-400 to-amber-600' :
              'bg-gradient-to-r from-red-400 to-red-500'}
          `}
        />
      </div>
    </motion.div>
  );
};

// 主组件
const HotSearchSection: React.FC<HotSearchSectionProps> = ({
  className = '',
  onSearchClick,
  maxItems = 10
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  
  const [hotSearches, setHotSearches] = useState<HotSearchItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // 加载热门搜索数据
  const loadHotSearches = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('hot_searches')
        .select('*')
        .eq('is_active', true)
        .order('search_count', { ascending: false })
        .limit(maxItems);

      if (error) throw error;

      // 处理数据，添加趋势信息
      const processedData = (data || []).map((item, index) => ({
        ...item,
        trend: index < 3 ? 'up' : index < 6 ? 'stable' : index < 8 ? 'new' : 'down'
      }));

      setHotSearches(processedData);
      setLastUpdated(new Date());
    } catch (error) {
      console.error('加载热搜数据失败:', error);
      toast.error('加载热搜数据失败');
      
      // 使用默认数据作为回退
      setHotSearches([
        { id: '1', query: '国潮设计', search_count: 1256, unique_searchers: 892, trend_score: 95, category: '设计', is_active: true, last_searched_at: new Date().toISOString(), trend: 'up' },
        { id: '2', query: '杨柳青年画', search_count: 1089, unique_searchers: 756, trend_score: 88, category: '非遗', is_active: true, last_searched_at: new Date().toISOString(), trend: 'up' },
        { id: '3', query: '天津之眼', search_count: 967, unique_searchers: 689, trend_score: 82, category: '地标', is_active: true, last_searched_at: new Date().toISOString(), trend: 'stable' },
        { id: '4', query: '泥人张', search_count: 845, unique_searchers: 612, trend_score: 75, category: '非遗', is_active: true, last_searched_at: new Date().toISOString(), trend: 'stable' },
        { id: '5', query: '文创产品', search_count: 723, unique_searchers: 534, trend_score: 68, category: '产品', is_active: true, last_searched_at: new Date().toISOString(), trend: 'new' },
        { id: '6', query: '五大道', search_count: 678, unique_searchers: 489, trend_score: 62, category: '地标', is_active: true, last_searched_at: new Date().toISOString(), trend: 'down' },
        { id: '7', query: '狗不理包子', search_count: 612, unique_searchers: 445, trend_score: 58, category: '美食', is_active: true, last_searched_at: new Date().toISOString(), trend: 'stable' },
        { id: '8', query: '风筝魏', search_count: 567, unique_searchers: 398, trend_score: 52, category: '非遗', is_active: true, last_searched_at: new Date().toISOString(), trend: 'new' },
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [maxItems]);

  // 初始加载
  useEffect(() => {
    loadHotSearches();
    
    // 每5分钟自动刷新
    const interval = setInterval(loadHotSearches, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadHotSearches]);

  // 处理搜索点击
  const handleSearchClick = useCallback((query: string) => {
    if (onSearchClick) {
      onSearchClick(query);
    } else {
      navigate(`/search?query=${encodeURIComponent(query)}`);
    }
  }, [navigate, onSearchClick]);

  // 查看全部热搜
  const handleViewAll = useCallback(() => {
    navigate('/search?tab=hot');
  }, [navigate]);

  return (
    <section className={`w-full ${className}`}>
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* 标题区域 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4"
        >
          <div className="flex items-center gap-4">
            {/* 主图标 */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              whileInView={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', stiffness: 200 }}
              className="relative w-12 h-12 rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 flex items-center justify-center shadow-xl shadow-orange-500/30"
            >
              <Flame className="w-6 h-6 text-white" />
              {/* 装饰光晕 */}
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-red-500 via-orange-500 to-yellow-500 blur-xl opacity-50 -z-10"></div>
              {/* 角落装饰 */}
              <motion.div
                animate={{ scale: [1, 1.2, 1] }}
                transition={{ duration: 2, repeat: Infinity }}
                className="absolute -top-1 -right-1 w-4 h-4 bg-yellow-400 rounded-full flex items-center justify-center"
              >
                <Zap className="w-2 h-2 text-yellow-700" />
              </motion.div>
            </motion.div>

            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-2xl md:text-3xl font-bold bg-gradient-to-r from-red-500 via-orange-500 to-yellow-500 bg-clip-text text-transparent`}>
                  热搜榜
                </h2>
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.2 }}
                  className="px-2 py-0.5 text-[10px] font-bold bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full"
                >
                  HOT
                </motion.span>
              </div>
              <p className={`text-sm mt-0.5 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                实时热门搜索，发现大家都在关注的内容
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* 更新时间 */}
            <span className={`text-xs flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              <Clock className="w-3 h-3" />
              更新于 {lastUpdated.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })}
            </span>

            {/* 刷新按钮 */}
            <motion.button
              whileHover={{ scale: 1.1, rotate: 180 }}
              whileTap={{ scale: 0.9 }}
              onClick={loadHotSearches}
              disabled={isLoading}
              className={`
                w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300
                ${isDark 
                  ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 hover:text-white' 
                  : 'bg-white text-gray-600 hover:bg-gray-50 hover:text-gray-900 shadow-md hover:shadow-lg'
                }
                ${isLoading ? 'animate-spin' : ''}
              `}
              title="刷新热搜"
            >
              <RefreshCw className="w-4 h-4" />
            </motion.button>

            {/* 查看全部按钮 */}
            <motion.button
              whileHover={{ scale: 1.05, x: 3 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleViewAll}
              className={`
                px-4 py-2 rounded-full text-sm font-medium transition-all duration-300
                flex items-center gap-2
                ${isDark 
                  ? 'bg-gray-800 text-white hover:bg-gray-700 border border-gray-700' 
                  : 'bg-white text-gray-900 hover:bg-gray-50 shadow-md border border-gray-200'
                }
              `}
            >
              <span>查看全部</span>
              <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </motion.div>

        {/* 热搜列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <AnimatePresence mode="wait">
            {isLoading && hotSearches.length === 0 ? (
              // 加载状态
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="col-span-full flex items-center justify-center py-12"
              >
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-8 h-8 border-3 border-red-200 border-t-red-500 rounded-full"
                />
              </motion.div>
            ) : hotSearches.length === 0 ? (
              // 空状态
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="col-span-full text-center py-12"
              >
                <Search className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>暂无热搜数据</p>
              </motion.div>
            ) : (
              // 热搜列表
              hotSearches.map((item, index) => (
                <HotSearchCard
                  key={item.id}
                  item={item}
                  index={index}
                  isDark={isDark}
                  onClick={() => handleSearchClick(item.query)}
                  isHovered={hoveredIndex === index}
                  onHover={() => setHoveredIndex(index)}
                  onLeave={() => setHoveredIndex(null)}
                />
              ))
            )}
          </AnimatePresence>
        </div>

        {/* 底部提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className={`mt-6 text-center text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
        >
          点击热搜词可快速搜索相关内容
        </motion.div>
      </div>
    </section>
  );
};

export default HotSearchSection;
