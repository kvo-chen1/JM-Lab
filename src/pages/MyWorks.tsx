import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '@/contexts/authContext';
import { supabase } from '@/lib/supabase';
import postsApi from '@/services/postService';
import {
  Image,
  Eye,
  Heart,
  Trash2,
  Edit3,
  Plus,
  Grid3X3,
  List,
  Search,
  Filter,
  ChevronLeft,
  AlertCircle,
  CheckSquare,
  Square,
  X
} from 'lucide-react';
import { toast } from 'sonner';

interface Work {
  id: string;
  title: string;
  thumbnail: string;
  status: '已发布' | '草稿';
  date: string;
  views: number;
  likes: number;
  comments: number;
  created_at: string;
}

export default function MyWorks() {
  const { isDark } = useTheme();
  const { isAuthenticated, user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [works, setWorks] = useState<Work[]>([]);
  const [filteredWorks, setFilteredWorks] = useState<Work[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('list');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [selectedWorks, setSelectedWorks] = useState<Set<string>>(new Set());
  const [isBatchMode, setIsBatchMode] = useState(false);
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'likes'>('date');

  // 检查登录状态
  useEffect(() => {
    if (!isAuthenticated || !user) {
      navigate('/login');
    } else {
      loadWorks();
    }
  }, [isAuthenticated, user, navigate]);

  // 加载用户作品
  const loadWorks = async () => {
    if (!user?.id) return;

    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      let loadedWorks: Work[] = [];

      if (token) {
        try {
          const response = await fetch(`/api/works?creator_id=${user.id}&limit=100`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });

          if (response.ok) {
            const result = await response.json();
            if (result.code === 0 && Array.isArray(result.data)) {
              loadedWorks = result.data.map((w: any) => {
                let workDate: string;
                if (w.created_at) {
                  const timestamp = w.created_at > 10000000000 ? w.created_at : w.created_at * 1000;
                  workDate = new Date(timestamp).toLocaleDateString('zh-CN');
                } else {
                  workDate = new Date().toLocaleDateString('zh-CN');
                }

                return {
                  id: w.id?.toString() || '',
                  title: w.title || 'Untitled',
                  thumbnail: w.thumbnail || w.cover_url || '',
                  status: w.status === 'published' ? '已发布' : '草稿',
                  date: workDate,
                  views: w.views || 0,
                  likes: w.likes || 0,
                  comments: w.comments || 0,
                  created_at: w.created_at
                };
              });
            }
          }
        } catch (apiError) {
          console.warn('Backend API failed, falling back to Supabase:', apiError);
        }
      }

      // 如果 API 失败，使用 Supabase
      if (loadedWorks.length === 0) {
        const { data: supabaseWorks, error } = await supabase
          .from('works')
          .select('*')
          .eq('creator_id', user.id)
          .order('created_at', { ascending: false });

        if (!error && supabaseWorks) {
          loadedWorks = supabaseWorks.map(w => {
            let workDate: string;
            if (w.created_at) {
              workDate = new Date(w.created_at * 1000).toLocaleDateString('zh-CN');
            } else {
              workDate = new Date().toLocaleDateString('zh-CN');
            }

            return {
              id: w.id,
              title: w.title,
              thumbnail: w.thumbnail || w.cover_url || '',
              status: w.status === 'published' ? '已发布' : '草稿',
              date: workDate,
              views: w.views || 0,
              likes: w.likes || 0,
              comments: w.comments || 0,
              created_at: w.created_at
            };
          });
        }
      }

      setWorks(loadedWorks);
      setFilteredWorks(loadedWorks);
    } catch (error) {
      console.error('加载作品失败:', error);
      toast.error('加载作品失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 筛选和搜索
  useEffect(() => {
    let result = [...works];

    // 状态筛选
    if (statusFilter !== 'all') {
      result = result.filter(w =>
        statusFilter === 'published' ? w.status === '已发布' : w.status === '草稿'
      );
    }

    // 搜索
    if (searchQuery) {
      result = result.filter(w =>
        w.title.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // 排序
    result.sort((a, b) => {
      switch (sortBy) {
        case 'views':
          return b.views - a.views;
        case 'likes':
          return b.likes - a.likes;
        case 'date':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    setFilteredWorks(result);
  }, [works, statusFilter, searchQuery, sortBy]);

  // 删除单个作品
  const handleDelete = async (workId: string) => {
    if (!window.confirm('确定要删除此作品吗？此操作不可恢复。')) return;

    try {
      const success = await postsApi.deletePost(workId);
      if (success) {
        setWorks(prev => prev.filter(w => w.id !== workId));
        toast.success('作品已删除');
      } else {
        toast.error('删除失败');
      }
    } catch (error) {
      console.error('删除作品失败:', error);
      toast.error('删除作品失败');
    }
  };

  // 批量删除
  const handleBatchDelete = async () => {
    if (selectedWorks.size === 0) {
      toast.error('请选择要删除的作品');
      return;
    }

    if (!window.confirm(`确定要删除选中的 ${selectedWorks.size} 个作品吗？此操作不可恢复。`)) return;

    let successCount = 0;
    let failCount = 0;

    for (const workId of selectedWorks) {
      try {
        const success = await postsApi.deletePost(workId);
        if (success) {
          successCount++;
        } else {
          failCount++;
        }
      } catch (error) {
        failCount++;
      }
    }

    setWorks(prev => prev.filter(w => !selectedWorks.has(w.id)));
    setSelectedWorks(new Set());
    setIsBatchMode(false);

    if (successCount > 0) {
      toast.success(`成功删除 ${successCount} 个作品`);
    }
    if (failCount > 0) {
      toast.error(`${failCount} 个作品删除失败`);
    }
  };

  // 切换选择
  const toggleSelect = (workId: string) => {
    const newSelected = new Set(selectedWorks);
    if (newSelected.has(workId)) {
      newSelected.delete(workId);
    } else {
      newSelected.add(workId);
    }
    setSelectedWorks(newSelected);
  };

  // 全选
  const selectAll = () => {
    if (selectedWorks.size === filteredWorks.length) {
      setSelectedWorks(new Set());
    } else {
      setSelectedWorks(new Set(filteredWorks.map(w => w.id)));
    }
  };

  // 编辑作品
  const handleEdit = (workId: string) => {
    navigate(`/create?id=${workId}`);
  };

  // 查看作品
  const handleView = (workId: string) => {
    navigate(`/work/${workId}`);
  };

  if (isLoading) {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f8f9fc]'}`}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-[#0a0a0f]' : 'bg-[#f8f9fc]'}`}>
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-96 h-96 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-40 w-96 h-96 bg-gradient-to-br from-blue-500/10 to-purple-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 py-8">
        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/dashboard')}
            className={`flex items-center gap-2 mb-4 ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'} transition-colors`}
          >
            <ChevronLeft className="w-5 h-5" />
            返回个人中心
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className={`text-3xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                我的作品
              </h1>
              <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                管理您的所有作品，共 {works.length} 个
              </p>
            </div>
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => navigate('/create')}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-medium shadow-lg shadow-red-500/25"
            >
              <Plus className="w-5 h-5" />
              创建新作品
            </motion.button>
          </div>
        </motion.div>

        {/* 工具栏 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className={`p-4 rounded-2xl mb-6 ${isDark
            ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
            : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg'
          }`}
        >
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* 搜索 */}
            <div className="relative w-full md:w-64">
              <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
              <input
                type="text"
                placeholder="搜索作品..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className={`w-full pl-10 pr-4 py-2 rounded-xl border ${isDark
                  ? 'bg-gray-700/50 border-gray-600 text-white placeholder-gray-500'
                  : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400'
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              />
            </div>

            {/* 筛选和排序 */}
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className={`px-4 py-2 rounded-xl border ${isDark
                  ? 'bg-gray-700/50 border-gray-600 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              >
                <option value="all">全部状态</option>
                <option value="published">已发布</option>
                <option value="draft">草稿</option>
              </select>

              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className={`px-4 py-2 rounded-xl border ${isDark
                  ? 'bg-gray-700/50 border-gray-600 text-white'
                  : 'bg-gray-50 border-gray-200 text-gray-900'
                } focus:outline-none focus:ring-2 focus:ring-red-500/50`}
              >
                <option value="date">最新创建</option>
                <option value="views">最多浏览</option>
                <option value="likes">最多点赞</option>
              </select>

              {/* 视图切换 */}
              <div className={`flex items-center gap-1 p-1 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'list'
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded-lg transition-colors ${viewMode === 'grid'
                    ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white'
                    : isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* 批量操作栏 */}
          <AnimatePresence>
            {isBatchMode && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={selectAll}
                      className={`flex items-center gap-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}
                    >
                      {selectedWorks.size === filteredWorks.length && filteredWorks.length > 0 ? (
                        <CheckSquare className="w-5 h-5 text-red-500" />
                      ) : (
                        <Square className="w-5 h-5" />
                      )}
                      全选 ({selectedWorks.size}/{filteredWorks.length})
                    </button>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => {
                        setIsBatchMode(false);
                        setSelectedWorks(new Set());
                      }}
                      className={`px-4 py-2 rounded-xl ${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-600 hover:text-gray-900'}`}
                    >
                      取消
                    </button>
                    <button
                      onClick={handleBatchDelete}
                      disabled={selectedWorks.size === 0}
                      className="flex items-center gap-2 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      删除选中 ({selectedWorks.size})
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* 作品列表 */}
        {filteredWorks.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`text-center py-20 rounded-3xl ${isDark
              ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
              : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg'
            }`}
          >
            <Image className={`w-20 h-20 mx-auto mb-4 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
            <h3 className={`text-xl font-semibold mb-2 ${isDark ? 'text-white' : 'text-gray-900'}`}>
              {searchQuery ? '没有找到匹配的作品' : '暂无作品'}
            </h3>
            <p className={`mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {searchQuery ? '尝试其他搜索关键词' : '开始创作您的第一个作品吧'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => navigate('/create')}
                className="px-6 py-3 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-2xl font-medium"
              >
                开始创作
              </button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className={viewMode === 'grid'
              ? 'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4'
              : 'space-y-3'
            }
          >
            {filteredWorks.map((work, index) => (
              <motion.div
                key={work.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 * index }}
                className={`group relative ${viewMode === 'grid'
                  ? `rounded-2xl overflow-hidden ${isDark ? 'bg-gray-800/60' : 'bg-white'} shadow-lg`
                  : `flex items-center gap-4 p-4 rounded-2xl ${isDark
                    ? 'bg-gray-800/60 backdrop-blur-xl border border-gray-700/50'
                    : 'bg-white/80 backdrop-blur-xl border border-white/50 shadow-lg'
                  }`
                }`}
              >
                {/* 批量选择框 */}
                {isBatchMode && (
                  <button
                    onClick={() => toggleSelect(work.id)}
                    className={`absolute top-3 left-3 z-10 p-1 rounded-lg ${isDark ? 'bg-gray-900/80' : 'bg-white/80'}`}
                  >
                    {selectedWorks.has(work.id) ? (
                      <CheckSquare className="w-5 h-5 text-red-500" />
                    ) : (
                      <Square className="w-5 h-5 text-gray-400" />
                    )}
                  </button>
                )}

                {/* 缩略图 */}
                <div
                  className={`relative overflow-hidden cursor-pointer ${viewMode === 'grid'
                    ? 'aspect-square'
                    : 'w-24 h-24 rounded-xl flex-shrink-0'
                  }`}
                  onClick={() => isBatchMode ? toggleSelect(work.id) : handleView(work.id)}
                >
                  {work.thumbnail ? (
                    <img
                      src={work.thumbnail}
                      alt={work.title}
                      className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  ) : (
                    <div className={`w-full h-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-100'}`}>
                      <Image className={`w-8 h-8 ${isDark ? 'text-gray-600' : 'text-gray-300'}`} />
                    </div>
                  )}
                  {/* 状态标签 */}
                  <div className={`absolute top-2 right-2 px-2 py-1 rounded-full text-xs font-medium ${
                    work.status === '已发布'
                      ? 'bg-green-500 text-white'
                      : 'bg-yellow-500 text-white'
                  }`}>
                    {work.status}
                  </div>
                </div>

                {/* 信息 */}
                <div className={viewMode === 'grid' ? 'p-4' : 'flex-1 min-w-0'}>
                  <h3
                    className={`font-semibold truncate cursor-pointer hover:text-red-500 transition-colors ${isDark ? 'text-white' : 'text-gray-900'} ${viewMode === 'grid' ? 'mb-2' : ''}`}
                    onClick={() => handleView(work.id)}
                  >
                    {work.title}
                  </h3>

                  <div className={`flex items-center gap-4 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} ${viewMode === 'grid' ? 'mb-3' : ''}`}>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {work.views}
                    </span>
                    <span className="flex items-center gap-1">
                      <Heart className="w-4 h-4" />
                      {work.likes}
                    </span>
                    <span>{work.date}</span>
                  </div>

                  {/* 操作按钮 */}
                  <div className={`flex items-center gap-2 ${viewMode === 'grid' ? '' : 'mt-0'}`}>
                    <button
                      onClick={() => handleView(work.id)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isDark
                        ? 'bg-gray-700 hover:bg-gray-600 text-gray-300'
                        : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
                      }`}
                    >
                      <Eye className="w-4 h-4" />
                      查看
                    </button>
                    <button
                      onClick={() => handleEdit(work.id)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isDark
                        ? 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                        : 'bg-blue-50 hover:bg-blue-100 text-blue-600'
                      }`}
                    >
                      <Edit3 className="w-4 h-4" />
                      编辑
                    </button>
                    <button
                      onClick={() => handleDelete(work.id)}
                      className={`flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-sm font-medium transition-colors ${isDark
                        ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                        : 'bg-red-50 hover:bg-red-100 text-red-600'
                      }`}
                    >
                      <Trash2 className="w-4 h-4" />
                      删除
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        )}

        {/* 批量操作浮动按钮 */}
        {!isBatchMode && filteredWorks.length > 0 && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={() => setIsBatchMode(true)}
            className={`fixed bottom-8 right-8 flex items-center gap-2 px-6 py-3 rounded-full shadow-lg ${isDark
              ? 'bg-gray-800 text-white border border-gray-700'
              : 'bg-white text-gray-900 border border-gray-200'
            }`}
          >
            <CheckSquare className="w-5 h-5" />
            批量管理
          </motion.button>
        )}
      </div>
    </div>
  );
}
