import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { Search, X, Clock } from 'lucide-react';

interface MobileEventSearchPageProps {
  isOpen: boolean;
  onClose: () => void;
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export default function MobileEventSearchPage({ 
  isOpen, 
  onClose, 
  onSearch,
  initialQuery = ''
}: MobileEventSearchPageProps) {
  const { isDark } = useTheme();
  const [search, setSearch] = useState(initialQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载搜索历史
  const loadSearchHistory = useCallback(() => {
    const localHistory = localStorage.getItem('eventSearchHistory');
    if (localHistory) {
      try {
        const parsed = JSON.parse(localHistory);
        setSearchHistory(parsed.slice(0, 10));
      } catch (e) {
        console.error('Failed to parse search history:', e);
      }
    }
  }, []);

  // 保存搜索历史
  const saveSearchHistory = useCallback((query: string) => {
    if (!query.trim()) return;
    
    const localHistory = localStorage.getItem('eventSearchHistory');
    let history = localHistory ? JSON.parse(localHistory) : [];
    history = [query, ...history.filter((h: string) => h !== query)].slice(0, 10);
    localStorage.setItem('eventSearchHistory', JSON.stringify(history));
    setSearchHistory(history);
  }, []);

  // 删除搜索历史
  const deleteSearchHistory = useCallback((query: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const localHistory = localStorage.getItem('eventSearchHistory');
    if (localHistory) {
      const history = JSON.parse(localHistory);
      const newHistory = history.filter((h: string) => h !== query);
      localStorage.setItem('eventSearchHistory', JSON.stringify(newHistory));
      setSearchHistory(newHistory);
    }
  }, []);

  // 执行搜索
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    saveSearchHistory(query);
    onSearch(query);
    onClose();
  }, [onSearch, onClose, saveSearchHistory]);

  // 处理键盘事件
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch(search);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }, [handleSearch, onClose, search]);

  // 打开时加载数据并聚焦输入框
  useEffect(() => {
    if (isOpen) {
      loadSearchHistory();
      setSearch(initialQuery);
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, loadSearchHistory, initialQuery]);

  // 热门搜索推荐
  const hotSearches = [
    '设计大赛',
    '文创活动',
    '非遗传承',
    '摄影比赛',
    '短视频大赛',
    '天津文化',
  ];

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className={`fixed inset-0 z-[100] ${isDark ? 'bg-gray-900' : 'bg-white'}`}
        >
          {/* 顶部搜索栏 - 简约设计 */}
          <div className={`sticky top-0 z-10 px-4 py-3 border-b ${isDark ? 'border-gray-800 bg-gray-900' : 'border-gray-100 bg-white'}`}>
            <div className="flex items-center gap-3">
              {/* 搜索输入框 */}
              <div className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full border-2 ${isDark ? 'border-red-500 bg-gray-800' : 'border-red-500 bg-white'}`}>
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="搜索活动..."
                  className={`flex-1 bg-transparent outline-none text-base ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                />
                {search && (
                  <button onClick={() => setSearch('')}>
                    <X className="w-4 h-4 text-gray-400" />
                  </button>
                )}
              </div>
              
              {/* 取消按钮 */}
              <button
                onClick={onClose}
                className={`text-base px-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}
              >
                取消
              </button>
            </div>
          </div>

          {/* 搜索内容 */}
          <div className="overflow-y-auto h-[calc(100vh-70px)]">
            
            {/* 搜索历史 - 列表式设计 */}
            {searchHistory.length > 0 && (
              <div className="mb-4">
                <div className={`flex items-center justify-between px-4 py-3 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
                  <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>搜索历史</span>
                  <button 
                    onClick={() => {
                      localStorage.removeItem('eventSearchHistory');
                      setSearchHistory([]);
                    }}
                    className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}
                  >
                    清空
                  </button>
                </div>
                {searchHistory.map((item, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-center justify-between py-3 px-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
                  >
                    <button
                      onClick={() => handleSearch(item)}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className={`text-base ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {item}
                      </span>
                    </button>
                    <button
                      onClick={(e) => deleteSearchHistory(item, e)}
                      className="p-2"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}

            {/* 热门搜索 */}
            <div className="px-4 py-3">
              <span className={`text-sm font-medium ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>热门搜索</span>
              <div className="flex flex-wrap gap-2 mt-3">
                {hotSearches.map((item, index) => (
                  <button
                    key={index}
                    onClick={() => handleSearch(item)}
                    className={`px-3 py-1.5 rounded-full text-sm ${
                      isDark 
                        ? 'bg-gray-800 text-gray-300 hover:bg-gray-700' 
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>

          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
