import { useState, useMemo, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { useBrowseHistory } from '@/hooks/useBrowseHistory';
import { HistoryItem, HistoryFilter, HistoryGroup } from '@/types/history';

const FILTER_TABS: { key: HistoryFilter; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: 'fa-globe' },
  { key: 'work', label: '作品', icon: 'fa-palette' },
  { key: 'template', label: '模板', icon: 'fa-file-alt' },
  { key: 'post', label: '帖子', icon: 'fa-comments' },
  { key: 'product', label: '商品', icon: 'fa-shopping-bag' },
  { key: 'game', label: '游戏', icon: 'fa-gamepad' }
];

export default function HistoryPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const {
    history,
    removeHistory,
    clearHistory,
    workCount,
    templateCount,
    postCount,
    productCount,
    gameCount,
    totalCount,
    isLoaded
  } = useBrowseHistory();

  const [activeFilter, setActiveFilter] = useState<HistoryFilter>(() => {
    const params = new URLSearchParams(location.search);
    return (params.get('type') as HistoryFilter) || 'all';
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [playingVideoId, setPlayingVideoId] = useState<string | null>(null);
  const videoRefs = useRef<Map<string, HTMLVideoElement>>(new Map());

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const type = params.get('type') as HistoryFilter;
    if (type && ['all', 'work', 'template', 'post', 'product', 'game'].includes(type)) {
      setActiveFilter(type);
    }
  }, [location.search]);

  useEffect(() => {
    if (playingVideoId) {
      const video = videoRefs.current.get(playingVideoId);
      if (video) {
        video.play().catch(() => {});
      }
    }
  }, [playingVideoId]);

  const handleFilterChange = (filter: HistoryFilter) => {
    setActiveFilter(filter);
    setSearchQuery('');
    navigate(`/history${filter !== 'all' ? `?type=${filter}` : ''}`, { replace: true });
  };

  const counts = useMemo(() => ({
    all: totalCount,
    work: workCount,
    template: templateCount,
    post: postCount,
    product: productCount,
    game: gameCount
  }), [totalCount, workCount, templateCount, postCount, productCount, gameCount]);

  const displayGroups = useMemo((): HistoryGroup[] => {
    let items = history;
    
    // 应用过滤器
    if (activeFilter !== 'all') {
      items = items.filter(item => item.type === activeFilter);
    }
    
    // 应用搜索
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase();
      items = items.filter(item => 
        item.title.toLowerCase().includes(lowerQuery) ||
        item.description?.toLowerCase().includes(lowerQuery) ||
        item.creator?.name.toLowerCase().includes(lowerQuery)
      );
      if (items.length === 0) return [];
      return [{ label: '搜索结果', items }];
    }
    
    // 按时间分组
    const now = Date.now();
    const dayMs = 24 * 60 * 60 * 1000;
    const groups: Map<string, HistoryItem[]> = new Map();

    items.forEach(item => {
      const itemDate = new Date(item.viewedAt);
      const itemDayStart = new Date(itemDate.getFullYear(), itemDate.getMonth(), itemDate.getDate());
      const dayDiff = Math.floor((now - itemDayStart.getTime()) / dayMs);

      let label: string;
      if (dayDiff === 0) {
        label = '今天';
      } else if (dayDiff === 1) {
        label = '昨天';
      } else if (dayDiff < 7) {
        label = `${dayDiff}天前`;
      } else if (dayDiff < 30) {
        label = `${Math.floor(dayDiff / 7)}周前`;
      } else {
        label = itemDate.toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' });
      }

      if (!groups.has(label)) {
        groups.set(label, []);
      }
      groups.get(label)!.push(item);
    });

    return Array.from(groups.entries()).map(([label, items]) => ({
      label,
      items
    }));
  }, [activeFilter, history, searchQuery]);

  // 自动播放第一个视频
  useEffect(() => {
    if (!isLoaded || totalCount === 0 || displayGroups.length === 0) return;
    
    const firstVideoItem = displayGroups
      .flatMap(g => g.items)
      .find(item => item.mediaType === 'video');
    
    if (firstVideoItem) {
      setPlayingVideoId(firstVideoItem.id);
      // 延迟播放确保video元素已渲染
      setTimeout(() => {
        const video = videoRefs.current.get(firstVideoItem.id);
        if (video) {
          video.play().catch(() => {});
        }
      }, 300);
    }
  }, [isLoaded, totalCount, displayGroups]);

  const handleItemClick = (item: HistoryItem) => {
    if (item.mediaType === 'video') {
      if (playingVideoId === item.id) {
        const video = videoRefs.current.get(item.id);
        if (video) {
          video.pause();
        }
        setPlayingVideoId(null);
      } else {
        if (playingVideoId) {
          const prevVideo = videoRefs.current.get(playingVideoId);
          if (prevVideo) prevVideo.pause();
        }
        setPlayingVideoId(item.id);
      }
    } else {
      navigate(item.url);
    }
  };

  const getTypeIcon = (type: HistoryItem['type']) => {
    switch (type) {
      case 'work': return 'fa-palette';
      case 'template': return 'fa-file-alt';
      case 'post': return 'fa-comments';
      case 'product': return 'fa-shopping-bag';
      case 'game': return 'fa-gamepad';
      default: return 'fa-file';
    }
  };

  const getTypeColor = (type: HistoryItem['type'], isDark: boolean) => {
    switch (type) {
      case 'work': return isDark ? 'text-purple-400 bg-purple-500/20' : 'text-purple-600 bg-purple-100';
      case 'template': return isDark ? 'text-amber-400 bg-amber-500/20' : 'text-amber-600 bg-amber-100';
      case 'post': return isDark ? 'text-cyan-400 bg-cyan-500/20' : 'text-cyan-600 bg-cyan-100';
      case 'product': return isDark ? 'text-pink-400 bg-pink-500/20' : 'text-pink-600 bg-pink-100';
      case 'game': return isDark ? 'text-green-400 bg-green-500/20' : 'text-green-600 bg-green-100';
      default: return isDark ? 'text-gray-400 bg-gray-500/20' : 'text-gray-600 bg-gray-100';
    }
  };

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' });
  };

  const isDark = document.documentElement.classList.contains('dark') || document.body.classList.contains('dark');

  const isEmpty = !isLoaded || (displayGroups.length === 0 && totalCount === 0);

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-[#0F172A]' : 'bg-[#F5F5F5]'}`}>
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <div className={`sticky top-0 z-10 ${isDark ? 'bg-[#0F172A]/95 backdrop-blur-md' : 'bg-white/95 backdrop-blur-md'}`}>
            <div className="flex items-center px-4 py-4">
              <button
                onClick={() => navigate(-1)}
                className={`p-2.5 rounded-xl transition-all mr-3 ${
                  isDark 
                    ? 'hover:bg-gray-800 text-gray-400' 
                    : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                浏览历史
              </h1>
              <span className={`ml-auto px-3 py-1 rounded-full text-sm ${
                isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
              }`}>
                {isLoaded ? `${totalCount} 条` : '加载中...'}
              </span>
            </div>

            <div className={`px-4 pb-3 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="relative">
                <i className={`fas fa-search absolute left-4 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}></i>
                <input
                  type="text"
                  placeholder="搜索浏览记录"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={`w-full pl-11 pr-10 py-2.5 rounded-xl border text-sm transition-all ${
                    isDark 
                      ? 'bg-[#1E293B] border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  }`}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                )}
              </div>
            </div>

            <div className={`px-4 pb-4 flex items-center gap-2 overflow-x-auto ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              {FILTER_TABS.map(tab => (
                <button
                  key={tab.key}
                  onClick={() => handleFilterChange(tab.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                    activeFilter === tab.key
                      ? isDark
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-900 text-white'
                      : isDark
                        ? 'bg-[#1E293B] text-gray-400 hover:text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i className={`fas ${tab.icon} text-xs`}></i>
                  {tab.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeFilter === tab.key
                      ? 'bg-white/20'
                      : isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    {isLoaded ? counts[tab.key] : '-'}
                  </span>
                </button>
              ))}
            </div>
          </div>

          <div className="px-4 py-4">
            {!isLoaded ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
                <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>加载中...</p>
              </div>
            ) : displayGroups.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <i className={`fas fa-history text-3xl ${
                    isDark ? 'text-gray-600' : 'text-gray-400'
                  }`}></i>
                </div>
                <p className={`font-medium mb-1 ${
                  isDark ? 'text-gray-400' : 'text-gray-500'
                }`}>
                  {searchQuery ? '没有找到相关记录' : '暂无浏览记录'}
                </p>
                <p className={`text-sm ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}>
                  {searchQuery ? '试试其他关键词' : '开始浏览作品、模板和帖子吧'}
                </p>
                {!searchQuery && (
                  <button
                    onClick={() => navigate('/square')}
                    className="mt-6 px-6 py-2.5 rounded-xl font-medium bg-gray-900 text-white hover:bg-gray-800 transition-all"
                  >
                    <i className="fas fa-compass mr-2"></i>
                    探索广场
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-6">
                {displayGroups.map((group: HistoryGroup) => (
                  <div key={group.label}>
                    <h4 className={`text-sm font-medium mb-3 flex items-center gap-2 ${
                      isDark ? 'text-gray-500' : 'text-gray-400'
                    }`}>
                      <i className="fas fa-clock text-xs"></i>
                      {group.label}
                    </h4>
                    <div className="space-y-2">
                      {group.items.map((item: HistoryItem) => (
                        <motion.div
                          key={item.id}
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className={`group flex items-center gap-3 p-3 rounded-2xl cursor-pointer transition-all ${
                            isDark 
                              ? 'bg-[#1E293B] hover:bg-[#334155]' 
                              : 'bg-white hover:shadow-md'
                          }`}
                          onClick={() => handleItemClick(item)}
                        >
                          <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200">
                            {item.thumbnail ? (
                              item.mediaType === 'video' ? (
                                <>
                                  <video
                                    ref={(el) => {
                                      if (el) videoRefs.current.set(item.id, el);
                                    }}
                                    src={item.thumbnail}
                                    className="w-full h-full object-cover"
                                    muted
                                    preload="metadata"
                                    loop
                                    onEnded={() => setPlayingVideoId(null)}
                                  />
                                  <div className={`absolute inset-0 flex items-center justify-center transition-opacity ${
                                    playingVideoId === item.id ? 'bg-black/20' : 'bg-black/40'
                                  }`}>
                                    <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-transform ${
                                      playingVideoId === item.id ? 'bg-white/30 scale-90' : 'bg-white/20'
                                    }`}>
                                      <i className={`fas ${playingVideoId === item.id ? 'fa-pause' : 'fa-play'} text-white text-sm ml-0.5`}></i>
                                    </div>
                                  </div>
                                </>
                              ) : (
                                <img 
                                  src={item.thumbnail} 
                                  alt={item.title}
                                  className="w-full h-full object-cover"
                                />
                              )
                            ) : (
                              <div className={`w-full h-full flex items-center justify-center ${
                                isDark ? 'bg-gray-700' : 'bg-gray-100'
                              }`}>
                                <i className={`fas ${getTypeIcon(item.type)} ${
                                  isDark ? 'text-gray-500' : 'text-gray-400'
                                } text-xl`}></i>
                              </div>
                            )}
                            {item.mediaType === 'video' && playingVideoId !== item.id && (
                              <div className="absolute top-1 right-1">
                                <span className="px-1.5 py-0.5 rounded bg-red-500 text-white text-xs font-medium">
                                  <i className="fas fa-video mr-1"></i>视频
                                </span>
                              </div>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <h5 className={`font-semibold truncate mb-1 ${
                              isDark ? 'text-white' : 'text-gray-900'
                            }`}>
                              {item.title}
                            </h5>
                            {item.description && (
                              <p className={`text-sm truncate mb-1.5 ${
                                isDark ? 'text-gray-500' : 'text-gray-500'
                              }`}>
                                {item.description}
                              </p>
                            )}
                            <div className="flex items-center gap-2">
                              {item.creator && (
                                <span className={`text-xs ${
                                  isDark ? 'text-gray-500' : 'text-gray-400'
                                }`}>
                                  {item.creator.name}
                                </span>
                              )}
                              <span className={`text-xs ${
                                isDark ? 'text-gray-600' : 'text-gray-400'
                              }`}>
                                {formatTime(item.viewedAt)}
                              </span>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getTypeColor(item.type, isDark)}`}>
                              {item.type === 'work' ? '作品' : item.type === 'template' ? '模板' : item.type === 'post' ? '帖子' : item.type === 'product' ? '商品' : '游戏'}
                            </span>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                removeHistory(item.id);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark 
                                  ? 'text-gray-600 hover:bg-gray-700 hover:text-red-400' 
                                  : 'text-gray-400 hover:bg-gray-100 hover:text-red-500'
                              }`}
                              title="删除"
                            >
                              <i className="fas fa-trash-alt text-sm"></i>
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {isLoaded && totalCount > 0 && (
            <div className={`fixed bottom-0 left-0 right-0 px-4 py-3 flex items-center justify-between ${
              isDark ? 'bg-[#0F172A]/95 backdrop-blur-md border-t border-gray-800' : 'bg-white/95 backdrop-blur-md border-t border-gray-200'
            }`}>
              <button
                onClick={() => {
                  if (confirm('确定清空所有浏览记录？')) {
                    clearHistory();
                  }
                }}
                className={`flex items-center gap-2 text-sm transition-colors ${
                  isDark 
                    ? 'text-gray-500 hover:text-red-400' 
                    : 'text-gray-500 hover:text-red-500'
                }`}
              >
                <i className="fas fa-trash-alt"></i>
                清空记录
              </button>
              <span className={`text-xs ${
                isDark ? 'text-gray-600' : 'text-gray-400'
              }`}>
                保留最近200条记录
              </span>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
