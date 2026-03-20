import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

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
  // Search props
  search?: string;
  setSearch?: (value: string) => void;
  onSearchSubmit?: (query: string) => void;
}

export const CommunityNavigation: React.FC<CommunityNavigationProps> = ({
  isDark,
  mode,
  communityName,
  activeChannel,
  onSelectChannel,
  selectedTag,
  onSelectTag,
  tags = [],
  search = '',
  setSearch,
  onSearchSubmit
}) => {
  const discoveryChannels = [
    { id: 'communities', icon: 'fas fa-th-large', label: '社群广场' },
    { id: 'feed', icon: 'fas fa-stream', label: '综合动态' },
    { id: 'hot', icon: 'fas fa-fire', label: '热门话题' },
    { id: 'fresh', icon: 'fas fa-clock', label: '最新发布' },
  ];
  
  const communityChannels = [
    { id: 'feed', icon: 'fas fa-stream', label: '帖子' },
    { id: 'chat', icon: 'fas fa-comment-dots', label: '聊天' },
    { id: 'members', icon: 'fas fa-users', label: '成员' },
    { id: 'announcements', icon: 'fas fa-bullhorn', label: '公告' },
  ];

  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [searchSuggestions, setSearchSuggestions] = useState<string[]>([]);

  // 加载搜索历史
  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem('searchHistory');
      if (savedHistory) {
        setSearchHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Failed to parse search history:', error);
      // 如果解析失败，可能是数据损坏，尝试重置
      localStorage.removeItem('searchHistory');
      setSearchHistory([]);
    }
  }, []);

  // 保存搜索历史
  const saveSearchHistory = (query: string) => {
    if (!query.trim()) return;
    
    const newHistory = [query, ...searchHistory.filter(item => item !== query)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  // 清除搜索历史
  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  // 生成搜索建议
  useEffect(() => {
    if (search.trim()) {
      // 基于标签和常用搜索词生成建议
      const allSuggestions = [
        ...tags,
        '设计', 'UI', 'UX', '创意', '科技', 'AI', '编程', '艺术', '文化', '音乐', '摄影'
      ];
      
      const filtered = allSuggestions
        .filter(item => item.toLowerCase().includes(search.toLowerCase()))
        .filter(item => item !== search)
        .slice(0, 5);
      
      setSearchSuggestions(filtered);
    } else {
      setSearchSuggestions([]);
    }
  }, [search, tags]);

  // 处理搜索提交
  const handleSearchSubmit = (query: string) => {
    saveSearchHistory(query);
    onSearchSubmit?.(query);
    setIsSearchFocused(false);
  };

  return (
    <div className={`w-64 flex-shrink-0 flex flex-col h-full lg:h-screen ${isDark ? 'bg-gray-800 bg-opacity-95' : 'bg-white'} border-r ${isDark ? 'border-gray-700' : 'border-gray-100'} transition-all duration-300 shadow-sm`}>
      {/* Header */}
      <motion.div 
        className={`h-14 flex items-center justify-between px-5 font-bold text-lg ${isDark ? 'text-white' : 'text-gray-900'} border-b ${isDark ? 'border-gray-700' : 'border-gray-100'} transition-all duration-300`}
      >
        <div className="flex-1 truncate">
          {mode === 'discovery' ? '发现社群' : communityName || '社群详情'}
        </div>
        {/* Mobile Close Button */}
        <button 
          onClick={() => window.dispatchEvent(new CustomEvent('closeMobileNav'))}
          className="md:hidden ml-2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
        >
          <i className="fas fa-times text-sm"></i>
        </button>
      </motion.div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Search Bar */}
        <div className="relative">
          <div className="relative">
            <i className={`fas fa-search absolute left-3 top-1/2 -translate-y-1/2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}></i>
            <input
              placeholder={mode === 'discovery' ? "搜索社群或话题..." : "搜索社群内容..."}
              value={search}
              onChange={(e) => setSearch?.(e.target.value)}
              onFocus={() => setIsSearchFocused(true)}
              onBlur={() => setTimeout(() => setIsSearchFocused(false), 200)}
              onKeyPress={(e) => e.key === 'Enter' && search && handleSearchSubmit(search)}
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all ${isDark ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500' : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400 shadow-sm'}`}
            />
            {search && (
              <button
                onClick={() => setSearch?.('')}
                className={`absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 ${isDark ? 'text-gray-500 hover:text-gray-300' : ''}`}
              >
                <i className="fas fa-times-circle"></i>
              </button>
            )}
          </div>

          {/* Search Suggestions */}
          {isSearchFocused && (search || searchHistory.length > 0 || searchSuggestions.length > 0) && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`absolute top-full left-0 right-0 mt-1 rounded-xl shadow-lg z-[100] ${isDark ? 'bg-gray-800 border border-gray-700' : 'bg-white border border-gray-200'}`}
            >
              {/* Search History */}
              {!search && searchHistory.length > 0 && (
                <div className="p-2">
                  <div className="flex justify-between items-center px-3 py-2">
                    <h4 className={`text-xs font-semibold ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>搜索历史</h4>
                    <button
                      onClick={clearSearchHistory}
                      className={`text-xs ${isDark ? 'text-gray-400 hover:text-gray-300' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                      清除
                    </button>
                  </div>
                  {searchHistory.map((item, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearch?.(item);
                        handleSearchSubmit(item);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm hover:rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <i className="fas fa-history mr-2 text-gray-400 w-4"></i>
                      <span>{item}</span>
                    </button>
                  ))}
                </div>
              )}

              {/* Search Suggestions */}
              {searchSuggestions.length > 0 && (
                <div className="p-2">
                  <h4 className={`text-xs font-semibold px-3 py-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>搜索建议</h4>
                  {searchSuggestions.map((suggestion, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSearch?.(suggestion);
                        handleSearchSubmit(suggestion);
                      }}
                      className={`w-full flex items-center px-3 py-2 text-sm hover:rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                    >
                      <i className="fas fa-search mr-2 text-gray-400 w-4"></i>
                      <span>{suggestion}</span>
                    </button>
                  ))}
                </div>
              )}
            </motion.div>
          )}
        </div>
        {/* Main Channels - Only show in discovery mode */}
        {mode === 'discovery' && (
            <div className={`rounded-xl ${isDark ? 'bg-gray-900/60' : 'bg-gray-50'} p-3.5 transition-all duration-300 shadow-sm`}>
                <div className={`px-2 py-1.5 text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    浏览
                </div>
                <div className="space-y-2">
                    {discoveryChannels.map(channel => (
                        <motion.button
                            key={channel.id}
                            onClick={() => onSelectChannel(channel.id)}
                            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-250 ease-in-out group ${activeChannel === channel.id ? (
                                isDark ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                            ) : (
                                isDark ? 'hover:bg-gray-750 text-gray-200' : 'hover:bg-gray-100 text-gray-900 shadow-sm'
                            )}`}
                        >
                            <i className={`${channel.icon} w-5 text-center mr-2 opacity-100 transition-all duration-250`}></i>
                            <span className="font-medium text-sm flex-1 truncate">{channel.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>
        )}
        
        {/* Community Channels - Only show in community mode */}
        {mode === 'community' && (
            <div className={`rounded-xl ${isDark ? 'bg-gray-900/60' : 'bg-gray-50'} p-3.5 transition-all duration-300 shadow-sm`}>
                <div className={`px-2 py-1.5 text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                    频道
                </div>
                <div className="space-y-2">
                    {communityChannels.map(channel => (
                        <motion.button
                            key={channel.id}
                            onClick={() => onSelectChannel(channel.id)}
                            className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-250 ease-in-out group ${activeChannel === channel.id ? (
                                isDark ? 'bg-primary-500 text-white shadow-lg shadow-primary-500/30' : 'bg-primary-500 text-white shadow-lg shadow-primary-500/20'
                            ) : (
                                isDark ? 'hover:bg-gray-750 text-gray-200' : 'hover:bg-gray-100 text-gray-900 shadow-sm'
                            )}`}
                        >
                            <i className={`${channel.icon} w-5 text-center mr-2 opacity-100 transition-all duration-250`}></i>
                            <span className="font-medium text-sm flex-1 truncate">{channel.label}</span>
                        </motion.button>
                    ))}
                </div>
            </div>
        )}

        {/* Tags Section */}
        {tags.length > 0 && (
          <div className={`rounded-xl ${isDark ? 'bg-gray-900/60' : 'bg-gray-50'} p-3.5 transition-all duration-300 shadow-sm`}>
            <div className={`px-2 py-1.5 text-xs font-semibold uppercase tracking-wider mb-3 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
              {mode === 'discovery' ? '热门话题' : '热门话题'}
            </div>
            <div className="space-y-2">
              {tags.slice(0, 5).map((tag) => (
                <motion.button
                  key={tag}
                  onClick={() => onSelectTag?.(selectedTag === tag ? '' : tag)}
                  className={`w-full flex items-center px-4 py-3 rounded-xl transition-all duration-250 ease-in-out group ${selectedTag === tag ? (
                    isDark ? 'bg-primary-500/25 text-primary-300 shadow-lg' : 'bg-primary-100 text-primary-700 shadow-md'
                  ) : (
                    isDark ? 'hover:bg-gray-750 text-gray-200' : 'hover:bg-gray-100 text-gray-900 shadow-sm hover:shadow-md'
                  )}`}
                >
                  <span className={`inline-block w-5 font-semibold transition-all duration-200 ${selectedTag === tag ? (isDark ? 'text-primary-400' : 'text-primary-500') : ''}`}>
                    #
                  </span>
                  <span className="ml-1 text-sm font-medium truncate flex-1">{tag}</span>
                  {selectedTag === tag && (
                    <span className={`text-xs ${isDark ? 'text-primary-400' : 'text-primary-500'}`}>
                      <i className="fas fa-check"></i>
                    </span>
                  )}
                </motion.button>
              ))}
            </div>
          </div>
        )}


      </div>
    </div>
  );
};

// 添加displayName便于调试
CommunityNavigation.displayName = 'CommunityNavigation';