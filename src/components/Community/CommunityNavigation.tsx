import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface CommunityNavigationProps {
  isDark: boolean;
  mode: 'discovery' | 'community';
  communityName?: string;
  activeChannel: string;
  onSelectChannel: (channel: string) => void;
  // Discovery props
  selectedTag?: string;
  onSelectTag?: (tag: string) => void;
  tags?: string[];
}

// 预定义话题分类（提取到组件外，避免重复创建）
const TOPIC_CATEGORIES = {
  '设计相关': ['设计', 'UI', 'UX', '插画', '3D', '赛博朋克', '极简', '国潮', '非遗'],
  '艺术文化': ['艺术', '文化', '音乐', '摄影', '写作'],
  '科技数码': ['科技', '数码', 'AI', '编程', '互联网'],
  '生活方式': ['生活', '美食', '旅行', '时尚', '健康'],
  '其他': []
};

// 动画变体
const categoryVariants = {
  expanded: {
    height: 'auto',
    opacity: 1,
    transition: {
      duration: 0.3,
      ease: 'easeOut'
    }
  },
  collapsed: {
    height: 0,
    opacity: 0,
    transition: {
      duration: 0.3,
      ease: 'easeIn'
    }
  }
};

const tagVariants = {
  hidden: { opacity: 0, y: -10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2 }
  }
};

const iconVariants = {
  collapsed: { rotate: 0 },
  expanded: { rotate: 180 }
};

// 话题分类函数（提取为独立函数，提高可维护性）
const categorizeTopics = (topicList: string[]): Record<string, string[]> => {
  // 初始化分类结果
  const categorized: Record<string, string[]> = {
    '设计相关': [],
    '艺术文化': [],
    '科技数码': [],
    '生活方式': [],
    '其他': []
  };

  // 对每个话题进行分类
  topicList.forEach(topic => {
    let assigned = false;
    
    // 检查是否匹配预定义分类
    for (const [category, keywords] of Object.entries(TOPIC_CATEGORIES)) {
      if (keywords.some(keyword => topic.includes(keyword))) {
        categorized[category].push(topic);
        assigned = true;
        break;
      }
    }
    
    // 如果没有匹配的分类，放入其他
    if (!assigned) {
      categorized['其他'].push(topic);
    }
  });

  // 移除空分类
  const result: Record<string, string[]> = {};
  for (const [category, topics] of Object.entries(categorized)) {
    if (topics.length > 0) {
      result[category] = topics;
    }
  }

  return result;
};

export const CommunityNavigation: React.FC<CommunityNavigationProps> = ({
  isDark,
  mode,
  communityName,
  activeChannel,
  onSelectChannel,
  selectedTag,
  onSelectTag,
  tags = []
}) => {
  const discoveryChannels = [
    { id: 'communities', icon: 'fas fa-th-large', label: '社群广场' }, // 新增
    { id: 'feed', icon: 'fas fa-stream', label: '综合动态' },
    { id: 'hot', icon: 'fas fa-fire', label: '热门话题' },
    { id: 'fresh', icon: 'fas fa-clock', label: '最新发布' },
  ];

  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set(['设计相关']));
  const [categorySearch, setCategorySearch] = useState<Record<string, string>>({});

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

  const handleCategoryClick = (category: string) => {
    if (expandedCategories.has(category)) {
      if (categorySearch[category]) {
        setCategorySearch(prev => ({ ...prev, [category]: '' }));
      } else {
        toggleCategory(category);
      }
    } else {
      toggleCategory(category);
    }
  };

  const getHotTopics = () => {
    return categorizeTopics(tags);
  };

  const categorizedTopics = useMemo(() => {
    return categorizeTopics(tags);
  }, [tags]);

  return (
    <div className={`w-64 flex-shrink-0 flex flex-col h-full lg:h-screen ${isDark ? 'bg-gray-800 bg-opacity-95' : 'bg-white'} border-r ${isDark ? 'border-gray-700' : 'border-gray-100'} transition-all duration-300 shadow-sm`}>
      {/* Header */}
      <div className={`h-14 flex items-center px-5 font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'} border-b ${isDark ? 'border-gray-700' : 'border-gray-100'}`}>
        {mode === 'discovery' ? '发现社群' : communityName || '社群详情'}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Main Channels - Only show in discovery mode */}
        {mode === 'discovery' && (
            <div className={`rounded-xl ${isDark ? 'bg-gray-900/60' : 'bg-gray-50'} p-3.5 transition-all duration-300 shadow-sm`}>
                <div className={`px-2 py-1.5 text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    浏览
                </div>
                <div className="space-y-2">
                    {discoveryChannels.map(channel => (
                        <button
                            key={channel.id}
                            onClick={() => onSelectChannel(channel.id)}
                            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-250 ease-in-out group ${activeChannel === channel.id ? (
                                isDark ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                            ) : (
                                isDark ? 'hover:bg-gray-750 text-gray-200' : 'hover:bg-gray-100 text-gray-900 shadow-sm'
                            )}`}
                        >
                            <i className={`${channel.icon} w-5 text-center mr-2 opacity-100 transition-all duration-250 group-hover:scale-105`}></i>
                            <span className="font-medium text-sm flex-1 truncate">{channel.label}</span>
                            {channel.isExternal && (
                                <i className="fas fa-external-link-alt w-4 text-center ml-auto opacity-60 text-xs transition-opacity group-hover:opacity-80" title="跳转到创作者社区"></i>
                            )}
                        </button>
                    ))}
                </div>
            </div>
        )}

        {/* Categorized Topics - Show in both modes */}
        {tags.length > 0 && (
          <div className={`rounded-xl ${isDark ? 'bg-gray-900/60' : 'bg-gray-50'} p-3.5 transition-all duration-300 shadow-sm`}>
            <div className={`px-2 py-1.5 text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {mode === 'discovery' ? '热门分类' : '热门话题'}
            </div>
            
            {/* 显示分类后的话题 */}
            {Object.entries(categorizedTopics).map(([category, categoryTags]) => (
              <div key={category} className="mb-3 last:mb-0">
                {/* 分类标题 - 可点击，用于筛选该分类下的所有内容 */}
                <button
                  onClick={() => handleCategoryClick(category)}
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
                          onClick={() => onSelectTag?.(tag)}
                          className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-250 ease-in-out group touch-manipulation min-h-[44px] ${selectedTag === tag ? (
                              isDark ? 'bg-primary-500/25 text-primary-300 shadow-lg' : 'bg-primary-100 text-primary-700 shadow-md'
                          ) : selectedTag === `category:${category}` ? (
                              isDark ? 'bg-primary-500/15 text-primary-300' : 'bg-primary-50 text-primary-600'
                          ) : (
                              isDark ? 'hover:bg-gray-750 text-gray-200' : 'hover:bg-gray-100 text-gray-900 shadow-sm hover:shadow-md'
                          )}`}
                        >
                        <div className="flex items-center">
                          <span className={`inline-block w-5 font-semibold transition-all duration-200 group-hover:opacity-100 group-hover:scale-110 ${selectedTag === tag || selectedTag === `category:${category}` ? (isDark ? 'text-primary-400' : 'text-primary-500') : ''}`}>
                            #
                          </span>
                          <span className="ml-1 text-sm font-medium truncate flex-1">{tag}</span>
                          {selectedTag === tag && (
                            <motion.span
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              className={`text-xs ${isDark ? 'text-primary-400' : 'text-primary-500'}`}
                            >
                              <i className="fas fa-check"></i>
                            </motion.span>
                          )}
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
        )}
      </div>
    </div>
  );
};
