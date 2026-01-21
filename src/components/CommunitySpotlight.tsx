import React, { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { TianjinAvatar, TianjinButton } from '@/components/TianjinStyleComponents';

interface CommunitySpotlightProps {
  tags: string[];
  featuredCommunities: Array<{
    name: string;
    members: number;
    path: string;
    official?: boolean;
    description?: string;
    cover?: string;
  }>;
  onTagClick?: (tag: string) => void;
  loading?: boolean;
}

const getCommunityImage = (name: string) => {
  if (name.includes('国潮')) return 'https://images.unsplash.com/photo-1558655146-d09347e92766?w=200&h=200&fit=crop&q=80';
  if (name.includes('非遗')) return 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?w=200&h=200&fit=crop&q=80';
  if (name.includes('品牌') || name.includes('联名')) return 'https://images.unsplash.com/photo-1523240795612-9a054b0db644?w=200&h=200&fit=crop&q=80';
  if (name.includes('AI')) return 'https://images.unsplash.com/photo-1677442136019-21780ecad995?w=200&h=200&fit=crop&q=80';
  
  // Fallback to UI Avatars
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random&color=fff&size=200`;
}

// 预定义话题分类
const TOPIC_CATEGORIES = {
  '设计相关': ['设计', 'UI', 'UX', '插画', '3D', '赛博朋克', '极简', '国潮', '非遗'],
  '艺术文化': ['艺术', '文化', '音乐', '摄影', '写作'],
  '科技数码': ['科技', '数码', 'AI', '编程', '互联网'],
  '生活方式': ['生活', '美食', '旅行', '时尚', '健康'],
  '其他': []
};

// 话题分类函数
const categorizeTopics = (topicList: string[]): Record<string, string[]> => {
  const categorized: Record<string, string[]> = {
    '设计相关': [],
    '艺术文化': [],
    '科技数码': [],
    '生活方式': [],
    '其他': []
  };

  topicList.forEach(topic => {
    let assigned = false;
    
    for (const [category, keywords] of Object.entries(TOPIC_CATEGORIES)) {
      if (keywords.some(keyword => topic.includes(keyword))) {
        categorized[category].push(topic);
        assigned = true;
        break;
      }
    }
    
    if (!assigned) {
      categorized['其他'].push(topic);
    }
  });

  const result: Record<string, string[]> = {};
  for (const [category, topics] of Object.entries(categorized)) {
    if (topics.length > 0) {
      result[category] = topics;
    }
  }

  return result;
};

// 动画变体
const categoryVariants = {
  expanded: { height: 'auto', opacity: 1, transition: { duration: 0.3 } },
  collapsed: { height: 0, opacity: 0, transition: { duration: 0.3 } }
};

const tagVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.2 } }
};

const iconVariants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 180 }
};

const CommunitySpotlight: React.FC<CommunitySpotlightProps> = ({
  tags,
  featuredCommunities,
  onTagClick,
  loading
}) => {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());
  const [categorySearch, setCategorySearch] = useState<Record<string, string>>({});
  
  // 用于自动滚动的标签容器引用
  const tagContainerRef = useRef<HTMLDivElement>(null);
  // 动画宽度状态
  const [scrollWidth, setScrollWidth] = useState<number>(0);
  
  // 分类话题
  const categorizedTopics = useMemo(() => {
    return categorizeTopics(tags);
  }, [tags]);
  
  // 计算标签容器的实际宽度，用于自动滚动动画
  useEffect(() => {
    const updateScrollWidth = () => {
      if (tagContainerRef.current) {
        // 获取单个标签集合的宽度，然后减去容器宽度以实现完整滚动
        const singleSetWidth = tagContainerRef.current.scrollWidth / 3;
        setScrollWidth(singleSetWidth);
      }
    };
    
    // 初始化宽度
    updateScrollWidth();
    
    // 监听窗口大小变化，重新计算宽度
    window.addEventListener('resize', updateScrollWidth);
    
    return () => {
      window.removeEventListener('resize', updateScrollWidth);
    };
  }, [tags]);
  
  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };
  
  const filteredTags = (categoryTags: string[], category: string) => {
    const search = categorySearch[category] || '';
    if (!search) return categoryTags;
    return categoryTags.filter(tag => 
      tag.toLowerCase().includes(search.toLowerCase())
    );
  };
  
  const handleSearchChange = (category: string, value: string) => {
    setCategorySearch(prev => ({ ...prev, [category]: value }));
    if (value && !expandedCategories.has(category)) {
      setExpandedCategories(prev => new Set([...prev, category]));
    }
  };

  const containerBg = isDark ? 'bg-gray-800/40' : 'bg-white/60';
  const borderColor = isDark ? 'border-gray-700/50' : 'border-gray-200/50';
  const glassEffect = 'backdrop-blur-md';

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`rounded-3xl ${containerBg} ${glassEffect} border ${borderColor} p-6 mb-8 overflow-hidden relative shadow-xl`}
    >
      {/* Background decoration */}
      <div className="absolute -top-20 -right-20 w-64 h-64 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-purple-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="relative z-10">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'} flex items-center gap-2`}>
              <i className="fas fa-globe-asia text-blue-500"></i>
              共创社区 · 灵感枢纽
            </h2>
            <p className={`text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              汇聚 {tags.length}+ 热门话题，连接 {featuredCommunities.reduce((acc, c) => acc + c.members, 0)}+ 创作者
            </p>
          </div>
          <TianjinButton
            onClick={() => navigate('/community')}
            variant="primary"
            rightIcon={<i className="fas fa-arrow-right"></i>}
            className="self-start md:self-center shadow-lg shadow-blue-500/20"
          >
            探索更多社群
          </TianjinButton>
        </div>

        {/* Hot Topics Section */}
        <div className={`rounded-xl ${isDark ? 'bg-gray-900/60' : 'bg-gray-50'} p-4 transition-all duration-300 shadow-sm mb-6`}>
          {/* 横向滚动标签栏 */}
          <div className={`px-2 py-1.5 text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
            热门话题
          </div>
          
          {/* 横向滚动标签栏 - 显示热门话题 */}
          <div className="mb-8 overflow-hidden relative group">
            {/* 渐变遮罩 - 增加视觉效果 */}
            <div className={`absolute inset-y-0 left-0 w-12 z-10 bg-gradient-to-r ${isDark ? 'from-gray-900' : 'from-white'} opacity-70`}></div>
            <div className={`absolute inset-y-0 right-0 w-12 z-10 bg-gradient-to-l ${isDark ? 'from-gray-900' : 'from-white'} opacity-70`}></div>

            {/* 自动滚动的标签列表 */}
            <motion.div 
              ref={tagContainerRef}
              className="flex gap-3 w-max"
              animate={{ x: [0, -scrollWidth] }}
              transition={{ 
                repeat: Infinity, 
                ease: "linear", 
                duration: 30,
                repeatType: "loop"
              }}
            >
              {[...tags, ...tags, ...tags].map((tag, index) => (
                <motion.button
                  key={`${tag}-${index}`}
                  whileHover={{ scale: 1.05, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    if (onTagClick) onTagClick(tag);
                    navigate(`/community?tag=${encodeURIComponent(tag)}`);
                  }}
                  className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300
                    ${isDark 
                      ? 'bg-gray-700/50 hover:bg-gray-600 text-gray-200 border border-gray-600/50' 
                      : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
                    } flex items-center gap-2 group/tag`}
                >
                  <span className="w-5 h-5 rounded-full bg-gradient-to-tr from-blue-400 to-purple-400 flex items-center justify-center text-[10px] text-white">
                    #
                  </span>
                  {tag}
                </motion.button>
              ))}
            </motion.div>
          </div>
          
          {/* 显示分类后的话题 */}
          {Object.entries(categorizedTopics).map(([category, categoryTags]) => (
            <div key={category} className="mb-3 last:mb-0">
              {/* 分类标题 - 可点击，用于展开/折叠 */}
              <button
                onClick={() => toggleCategory(category)}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-250 ease-in-out group touch-manipulation min-h-[44px] ${expandedCategories.has(category) ? (
                  isDark ? 'bg-primary-500/20 text-primary-300' : 'bg-primary-100 text-primary-600'
                ) : (
                  isDark ? 'text-gray-300 hover:text-primary-400 hover:bg-primary-500/10' : 'text-gray-700 hover:text-primary-500 hover:bg-primary-50'
                )}`}
              >
                <div className="flex items-center gap-2">
                  <motion.span 
                    animate={expandedCategories.has(category) ? 'expanded' : 'collapsed'}
                    variants={iconVariants}
                    className="text-xs transition-colors"
                  >
                    <i className="fas fa-chevron-down"></i>
                  </motion.span>
                  <span className="transition-transform duration-200 group-hover:translate-x-1">{category}</span>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${expandedCategories.has(category) ? (
                  isDark ? 'bg-primary-500/30' : 'bg-primary-200'
                ) : (
                  isDark ? 'bg-gray-700' : 'bg-gray-200'
                )} transition-all duration-200 group-hover:scale-105`}>
                  {categoryTags.length}
                </span>
              </button>
              
              {/* 分类下的搜索框 */}
              <AnimatePresence>
                {expandedCategories.has(category) && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="mt-2 mb-3 relative">
                      <i className={`fas fa-search absolute left-3 top-1/2 -translate-y-1/2 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}></i>
                      <input
                        type="text"
                        placeholder="搜索话题..."
                        value={categorySearch[category] || ''}
                        onChange={(e) => handleSearchChange(category, e.target.value)}
                        className={`w-full pl-9 pr-3 py-2 text-sm rounded-lg border transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-primary-500/50 ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'}`}
                      />
                      {categorySearch[category] && (
                        <button
                          onClick={() => handleSearchChange(category, '')}
                          className={`absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded-full transition-colors ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                        >
                          <i className="fas fa-times text-xs"></i>
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* 分类下的话题列表 */}
              <AnimatePresence>
                {expandedCategories.has(category) && (
                  <motion.div
                    initial="hidden"
                    animate="visible"
                    exit="hidden"
                    variants={{
                      visible: { transition: { staggerChildren: 0.05 } }
                    }}
                    className="space-y-1.5"
                  >
                    {filteredTags(categoryTags, category).map((tag, index) => (
                      <motion.button
                        key={tag}
                        variants={tagVariants}
                        whileHover={{ scale: 1.02, y: -1 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                          if (onTagClick) onTagClick(tag);
                          navigate(`/community?tag=${encodeURIComponent(tag)}`);
                        }}
                        className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-250 ease-in-out group touch-manipulation min-h-[44px] 
                          ${isDark 
                            ? 'bg-gray-800/50 hover:bg-gray-750 text-gray-200 border border-gray-700/50' 
                            : 'bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 shadow-sm'
                          }`}
                      >
                        <div className="flex items-center">
                          <span className={`inline-block w-5 font-semibold transition-all duration-200 group-hover:opacity-100 group-hover:scale-110 ${isDark ? 'text-primary-400' : 'text-primary-500'}`}>
                            #
                          </span>
                          <span className="ml-1 text-sm font-medium truncate flex-1">{tag}</span>
                        </div>
                      </motion.button>
                    ))}
                    
                    {filteredTags(categoryTags, category).length === 0 && (
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className={`text-center py-4 text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                      >
                        <i className="fas fa-search mb-2 block text-lg opacity-50"></i>
                        没有找到相关话题
                      </motion.div>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>

        {/* Featured Communities Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {featuredCommunities.map((community, index) => (
            <motion.div
              key={community.name}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ y: -5 }}
              onClick={() => navigate(community.path)}
              className={`group cursor-pointer rounded-2xl p-4 transition-all duration-300 relative overflow-hidden
                ${isDark 
                  ? 'bg-gray-800/80 hover:bg-gray-700 border border-gray-700' 
                  : 'bg-white hover:shadow-lg border border-gray-100 shadow-sm'
                }`}
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity">
                <i className="fas fa-users text-6xl"></i>
              </div>
              
              <div className="flex items-start gap-4 relative z-10">
                <div className="relative">
                  <TianjinAvatar
                    src={community.avatar || getCommunityImage(community.name)}
                    alt={community.name}
                    size="lg"
                    variant="gradient"
                    className="shadow-md"
                  />
                  {community.official && (
                    <span className="absolute -bottom-1 -right-1 bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-white dark:border-gray-800 flex items-center gap-0.5">
                      <i className="fas fa-check-circle text-[8px]"></i> 官方
                    </span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className={`font-bold text-lg truncate ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>
                    {community.name}
                  </h3>
                  <div className={`flex items-center gap-3 text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    <span className="flex items-center gap-1">
                      <i className="fas fa-user-friends text-xs"></i>
                      {community.members} 成员
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-400"></span>
                    <span className="text-green-500 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></span>
                      活跃中
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="mt-4 flex justify-between items-center">
                 <div className="flex -space-x-2">
                    {[...Array(3)].map((_, i) => (
                      <div key={i} className={`w-6 h-6 rounded-full border-2 ${isDark ? 'border-gray-800' : 'border-white'} bg-gray-300 overflow-hidden`}>
                         <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${community.name}${i}`} alt="User" className="w-full h-full" />
                      </div>
                    ))}
                    <div className={`w-6 h-6 rounded-full border-2 ${isDark ? 'border-gray-800' : 'border-white'} ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'} flex items-center justify-center text-[10px]`}>
                      +
                    </div>
                 </div>
                 <span className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${
                   isDark 
                     ? 'bg-blue-500/10 text-blue-400 group-hover:bg-blue-500 group-hover:text-white' 
                     : 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white'
                 }`}>
                   立即加入
                 </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default CommunitySpotlight;
