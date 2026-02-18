import { useState, useEffect, useContext, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import { Search, Image, Check, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import type { Work } from '@/types/work';

interface WorkSelectorProps {
  selectedWork: Work | null;
  onSelect: (work: Work) => void;
  onCancel: () => void;
}

export function WorkSelector({ selectedWork, onSelect, onCancel }: WorkSelectorProps) {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  
  const [works, setWorks] = useState<Work[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'published' | 'draft'>('all');

  // 加载用户作品
  useEffect(() => {
    const loadWorks = async () => {
      if (!user?.id) return;
      
      setIsLoading(true);
      try {
        const token = localStorage.getItem('token');
        let loadedWorks: Work[] = [];

        // 优先使用 API
        if (token) {
          try {
            const response = await fetch(`/api/works?creator_id=${user.id}&limit=50`, {
              headers: { 'Authorization': `Bearer ${token}` }
            });

            if (response.ok) {
              const result = await response.json();
              if (result.code === 0 && Array.isArray(result.data)) {
                loadedWorks = result.data.map((w: any) => ({
                  id: w.id?.toString() || '',
                  title: w.title || '未命名作品',
                  thumbnail: w.thumbnail || w.cover_url || '',
                  type: w.type || 'image',
                  status: w.status === 'published' ? '已发布' : '草稿',
                  createdAt: w.created_at,
                  views: w.views || 0,
                  likes: w.likes || 0,
                  description: w.description || '',
                }));
              }
            }
          } catch (apiError) {
            console.warn('API 加载失败，使用 Supabase:', apiError);
          }
        }

        // 如果 API 失败，使用 Supabase
        if (loadedWorks.length === 0) {
          const { data, error } = await supabase
            .from('works')
            .select('*')
            .eq('creator_id', user.id)
            .order('created_at', { ascending: false })
            .limit(50);

          if (!error && data) {
            loadedWorks = data.map(w => ({
              id: w.id,
              title: w.title || '未命名作品',
              thumbnail: w.thumbnail || w.cover_url || '',
              type: w.type || 'image',
              status: w.status === 'published' ? '已发布' : '草稿',
              createdAt: w.created_at,
              views: w.views || 0,
              likes: w.likes || 0,
              description: w.description || '',
            }));
          }
        }

        setWorks(loadedWorks);
        setFilteredWorks(loadedWorks);
      } catch (error) {
        console.error('加载作品失败:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadWorks();
  }, [user?.id]);

  // 筛选和搜索
  useEffect(() => {
    let result = [...works];

    // 状态筛选
    if (filter !== 'all') {
      result = result.filter(w =>
        filter === 'published' ? w.status === '已发布' : w.status === '草稿'
      );
    }

    // 搜索
    if (searchQuery) {
      result = result.filter(w =>
        w.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredWorks(result);
  }, [works, filter, searchQuery]);

  const handleSelect = useCallback((work: Work) => {
    onSelect(work);
  }, [onSelect]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-red-500" />
        <p className={`mt-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          正在加载您的作品...
        </p>
      </div>
    );
  }

  if (works.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12">
        <div className={`w-16 h-16 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
          <Image className={`w-8 h-8 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
        </div>
        <p className={`mt-4 text-lg font-medium ${isDark ? 'text-white' : 'text-gray-900'}`}>
          暂无作品
        </p>
        <p className={`mt-2 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          您还没有创建任何作品，快去创作吧！
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* 搜索和筛选 */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
          <input
            type="text"
            placeholder="搜索作品..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full pl-10 pr-4 py-2 rounded-xl border text-sm transition-all ${
              isDark
                ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500 focus:border-red-500'
                : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-red-500'
            } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value as any)}
          className={`px-4 py-2 rounded-xl border text-sm ${
            isDark
              ? 'bg-gray-700/50 border-gray-600 text-white'
              : 'bg-gray-50 border-gray-200 text-gray-900'
          } focus:outline-none focus:ring-2 focus:ring-red-500/20`}
        >
          <option value="all">全部作品</option>
          <option value="published">已发布</option>
          <option value="draft">草稿</option>
        </select>
      </div>

      {/* 作品列表 */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 max-h-[400px] overflow-y-auto p-1">
        {filteredWorks.map((work, index) => (
          <motion.div
            key={work.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            onClick={() => handleSelect(work)}
            className={`relative group cursor-pointer rounded-xl overflow-hidden border-2 transition-all ${
              selectedWork?.id === work.id
                ? 'border-red-500 ring-2 ring-red-500/20'
                : isDark
                ? 'border-gray-700 hover:border-gray-600'
                : 'border-gray-200 hover:border-gray-300'
            }`}
          >
            {/* 缩略图 */}
            <div className="aspect-square relative">
              {work.thumbnail ? (
                <img
                  src={work.thumbnail}
                  alt={work.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              ) : (
                <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                  <Image className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                </div>
              )}
              
              {/* 选中标记 */}
              {selectedWork?.id === work.id && (
                <div className="absolute top-2 right-2 w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                  <Check className="w-4 h-4 text-white" />
                </div>
              )}

              {/* 状态标签 */}
              <div className={`absolute top-2 left-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                work.status === '已发布'
                  ? 'bg-green-500/90 text-white'
                  : 'bg-yellow-500/90 text-white'
              }`}>
                {work.status}
              </div>

              {/* 悬停遮罩 */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <span className="text-white text-sm font-medium">选择此作品</span>
              </div>
            </div>

            {/* 标题 */}
            <div className={`p-3 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
              <h3 className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {work.title}
              </h3>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                {work.views} 浏览 · {work.likes} 点赞
              </p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 结果统计 */}
      <div className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
        共 {filteredWorks.length} 个作品
        {searchQuery && `（搜索 "${searchQuery}"）`}
      </div>
    </div>
  );
}

export default WorkSelector;
