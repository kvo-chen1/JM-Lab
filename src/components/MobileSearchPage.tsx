import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { Search, X, Clock } from 'lucide-react';
import { apiClient } from '@/lib/apiClient';

interface SearchHistoryItem {
  id: string;
  query: string;
  created_at: string;
}

interface HotSearchItem {
  id: string;
  query: string;
  search_count: number;
}

interface MobileSearchPageProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileSearchPage({ isOpen, onClose }: MobileSearchPageProps) {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [hotSearches, setHotSearches] = useState<HotSearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // 加载搜索历史
  const loadSearchHistory = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/search/history?limit=10');
      if (response.ok && response.data?.success) {
        setSearchHistory(response.data.data.history || []);
      }
    } catch (err) {
      const localHistory = localStorage.getItem('recentSearches');
      if (localHistory) {
        try {
          const parsed = JSON.parse(localHistory);
          const formatted = parsed.map((query: string, index: number) => ({
            id: `local_${index}`,
            query,
            created_at: new Date().toISOString()
          }));
          setSearchHistory(formatted);
        } catch (e) {
          console.error('Failed to parse local history:', e);
        }
      }
    }
  }, []);

  // 加载热门搜索
  const loadHotSearches = useCallback(async () => {
    try {
      const response = await apiClient.get('/api/search/hot?limit=6');
      if (response.ok && response.data?.success) {
        setHotSearches(response.data.data || []);
      }
    } catch (err) {
      setHotSearches([
        { id: '1', query: '杨柳青年画', search_count: 1000 },
        { id: '2', query: '天津之眼', search_count: 800 },
        { id: '3', query: '泥人张', search_count: 600 },
        { id: '4', query: '国潮设计', search_count: 500 },
        { id: '5', query: '文创产品', search_count: 400 },
        { id: '6', query: '非遗文化', search_count: 350 },
      ]);
    }
  }, []);

  // 保存搜索历史
  const saveSearchHistory = useCallback(async (query: string) => {
    if (!query.trim()) return;
    
    const localHistory = localStorage.getItem('recentSearches');
    let history = localHistory ? JSON.parse(localHistory) : [];
    history = [query, ...history.filter((h: string) => h !== query)].slice(0, 10);
    localStorage.setItem('recentSearches', JSON.stringify(history));

    try {
      await apiClient.post('/api/search/history', {
        query: query.trim(),
        searchType: 'general',
        resultCount: 0
      });
    } catch (err) {
      console.error('保存搜索历史失败:', err);
    }
  }, []);

  // 删除搜索历史
  const deleteSearchHistory = useCallback(async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await apiClient.delete(`/api/search/history/${id}`);
      setSearchHistory(prev => prev.filter(item => item.id !== id));
    } catch (err) {
      const localHistory = localStorage.getItem('recentSearches');
      if (localHistory) {
        const history = JSON.parse(localHistory);
        const newHistory = history.filter((_: string, index: number) => `local_${index}` !== id);
        localStorage.setItem('recentSearches', JSON.stringify(newHistory));
        setSearchHistory(prev => prev.filter(item => item.id !== id));
      }
    }
  }, []);

  // 执行搜索
  const handleSearch = useCallback((query: string) => {
    if (!query.trim()) return;
    saveSearchHistory(query);
    onClose();
    navigate(`/square?search=${encodeURIComponent(query.trim())}`);
  }, [navigate, onClose, saveSearchHistory]);

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
      loadHotSearches();
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isOpen, loadSearchHistory, loadHotSearches]);

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
              <div className={`flex-1 flex items-center gap-2 px-4 py-2.5 rounded-full border-2 ${isDark ? 'border-blue-500 bg-gray-800' : 'border-blue-500 bg-white'}`}>
                <Search className="w-5 h-5 text-gray-400" />
                <input
                  ref={inputRef}
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="搜索"
                  className={`flex-1 bg-transparent outline-none text-base ${isDark ? 'text-white placeholder-gray-500' : 'text-gray-900 placeholder-gray-400'}`}
                />
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
              <div>
                {searchHistory.map((item) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className={`flex items-center justify-between py-4 px-4 border-b ${isDark ? 'border-gray-800' : 'border-gray-100'}`}
                  >
                    <button
                      onClick={() => handleSearch(item.query)}
                      className="flex items-center gap-3 flex-1"
                    >
                      <Clock className="w-4 h-4 text-gray-400" />
                      <span className={`text-base ${isDark ? 'text-gray-200' : 'text-gray-800'}`}>
                        {item.query}
                      </span>
                    </button>
                    <button
                      onClick={(e) => deleteSearchHistory(item.id, e)}
                      className="p-2"
                    >
                      <X className="w-4 h-4 text-gray-400" />
                    </button>
                  </motion.div>
                ))}
              </div>
            )}


          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
