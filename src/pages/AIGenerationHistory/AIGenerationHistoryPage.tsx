import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { aiGenerationHistoryService } from '@/services/aiGenerationHistoryService';
import { useTheme } from '@/hooks/useTheme';
import { Pagination } from '@/components/ui/Pagination';
import {
  AIGenerationHistoryItem,
  AIGenerationHistoryFilter,
  AIGenerationHistorySort,
  AIGenerationType,
  AIGenerationStatus,
} from '@/types/aiGenerationHistory';
import AIGenerationHistoryDetail from './AIGenerationHistoryDetail';
import BatchTagModal from './BatchTagModal';

const TYPE_FILTERS: { key: AIGenerationType | 'all'; label: string; icon: string }[] = [
  { key: 'all', label: '全部', icon: 'fa-layer-group' },
  { key: 'image', label: '图片', icon: 'fa-image' },
  { key: 'video', label: '视频', icon: 'fa-video' },
  { key: 'text', label: '文本', icon: 'fa-file-alt' },
];

const STATUS_FILTERS: { key: AIGenerationStatus | 'all'; label: string; color: string }[] = [
  { key: 'all', label: '全部状态', color: 'bg-gray-500' },
  { key: 'completed', label: '已完成', color: 'bg-green-500' },
  { key: 'processing', label: '处理中', color: 'bg-blue-500' },
  { key: 'failed', label: '失败', color: 'bg-red-500' },
  { key: 'pending', label: '待处理', color: 'bg-yellow-500' },
  { key: 'cancelled', label: '已取消', color: 'bg-gray-400' },
];

export default function AIGenerationHistoryPage() {
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [items, setItems] = useState<AIGenerationHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());
  const [showFavorites, setShowFavorites] = useState(false);
  const [searchKeyword, setSearchKeyword] = useState('');
  const [activeTypeFilter, setActiveTypeFilter] = useState<AIGenerationType | 'all'>('all');
  const [activeStatusFilter, setActiveStatusFilter] = useState<AIGenerationStatus | 'all'>('all');
  const [sort, setSort] = useState<AIGenerationHistorySort>({ field: 'createdAt', order: 'desc' });
  const [pagination, setPagination] = useState({ page: 1, pageSize: 20, total: 0, totalPages: 0 });
  const [selectedItem, setSelectedItem] = useState<AIGenerationHistoryItem | null>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showBatchTagModal, setShowBatchTagModal] = useState(false);
  const [batchTagMode, setBatchTagMode] = useState<'add' | 'remove'>('add');
  const [stats, setStats] = useState({
    total: 0,
    byType: { image: 0, video: 0, text: 0 },
    byStatus: { pending: 0, processing: 0, completed: 0, failed: 0, cancelled: 0 },
    favorites: 0,
  });

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const filter: AIGenerationHistoryFilter = {};
      if (activeTypeFilter !== 'all') filter.type = activeTypeFilter;
      if (activeStatusFilter !== 'all') filter.status = activeStatusFilter;
      if (showFavorites) filter.isFavorite = true;
      if (searchKeyword.trim()) filter.keyword = searchKeyword.trim();

      const result = await aiGenerationHistoryService.getList(filter, sort, {
        page: pagination.page,
        pageSize: pagination.pageSize,
      });

      setItems(result.items);
      setPagination(prev => ({ ...prev, ...result.pagination }));
    } catch (error) {
      console.error('Failed to fetch history:', error);
      toast.error('加载历史记录失败');
    } finally {
      setLoading(false);
    }
  }, [activeTypeFilter, activeStatusFilter, showFavorites, searchKeyword, sort, pagination.page, pagination.pageSize]);

  const fetchStats = useCallback(async () => {
    const result = await aiGenerationHistoryService.getStats();
    setStats(result);
  }, []);

  useEffect(() => {
    fetchItems();
    fetchStats();
  }, [fetchItems, fetchStats]);

  const handleTypeFilterChange = (type: AIGenerationType | 'all') => {
    setActiveTypeFilter(type);
    setPagination(prev => ({ ...prev, page: 1 }));
    setSelectedItems(new Set());
  };

  const handleStatusFilterChange = (status: AIGenerationStatus | 'all') => {
    setActiveStatusFilter(status);
    setPagination(prev => ({ ...prev, page: 1 }));
    setSelectedItems(new Set());
  };

  const handleSortChange = (field: AIGenerationHistorySort['field']) => {
    setSort(prev => ({
      field,
      order: prev.field === field && prev.order === 'desc' ? 'asc' : 'desc',
    }));
  };

  const handlePageChange = (page: number) => {
    setPagination(prev => ({ ...prev, page }));
    setSelectedItems(new Set());
  };

  const handlePageSizeChange = (pageSize: number) => {
    setPagination(prev => ({ ...prev, page: 1, pageSize }));
    setSelectedItems(new Set());
  };

  const handleSelectItem = (id: string) => {
    setSelectedItems(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedItems.size === items.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(items.map(item => item.id)));
    }
  };

  const handleToggleFavorite = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const result = await aiGenerationHistoryService.toggleFavorite(id);
    if (result.success) {
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, isFavorite: result.isFavorite! } : item
      ));
      fetchStats();
    }
  };

  const handleDelete = async (id: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!confirm('确定要删除这条记录吗？')) return;
    
    const result = await aiGenerationHistoryService.delete(id);
    if (result.success) {
      setItems(prev => prev.filter(item => item.id !== id));
      fetchStats();
    }
  };

  const handleBatchDelete = async () => {
    if (selectedItems.size === 0) {
      toast.warning('请选择要删除的记录');
      return;
    }
    if (!confirm(`确定要删除选中的 ${selectedItems.size} 条记录吗？`)) return;

    const result = await aiGenerationHistoryService.batchOperation({
      ids: Array.from(selectedItems),
      operation: 'delete',
    });
    
    if (result.success) {
      setSelectedItems(new Set());
      fetchItems();
      fetchStats();
    }
  };

  const handleBatchFavorite = async (favorite: boolean) => {
    if (selectedItems.size === 0) {
      toast.warning('请选择要操作的记录');
      return;
    }

    const result = await aiGenerationHistoryService.batchOperation({
      ids: Array.from(selectedItems),
      operation: favorite ? 'favorite' : 'unfavorite',
    });
    
    if (result.success) {
      setSelectedItems(new Set());
      fetchItems();
      fetchStats();
    }
  };

  const handleExport = async (format: 'json' | 'csv') => {
    const ids = selectedItems.size > 0 ? Array.from(selectedItems) : undefined;
    const result = await aiGenerationHistoryService.exportHistory({
      ids,
      format,
      includeMetadata: true,
    });

    if (result.success && result.data && result.filename) {
      const blob = new Blob([result.data], { type: format === 'json' ? 'application/json' : 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = result.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('导出成功');
    } else {
      toast.error(result.error || '导出失败');
    }
  };

  const handleViewDetail = (item: AIGenerationHistoryItem) => {
    setSelectedItem(item);
    setShowDetail(true);
  };

  const handleReuse = (item: AIGenerationHistoryItem) => {
    const params = new URLSearchParams({
      prompt: item.prompt,
      type: item.type,
    });
    if (item.metadata?.size) params.set('size', item.metadata.size);
    if (item.metadata?.style) params.set('style', item.metadata.style);
    if (item.metadata?.quality) params.set('quality', item.metadata.quality);
    
    navigate(`/generation?${params.toString()}`);
  };

  const getTypeIcon = (type: AIGenerationType) => {
    switch (type) {
      case 'image': return 'fa-image';
      case 'video': return 'fa-video';
      case 'text': return 'fa-file-alt';
    }
  };

  const getTypeColor = (type: AIGenerationType) => {
    switch (type) {
      case 'image': return isDark ? 'text-purple-400 bg-purple-500/20' : 'text-purple-600 bg-purple-100';
      case 'video': return isDark ? 'text-cyan-400 bg-cyan-500/20' : 'text-cyan-600 bg-cyan-100';
      case 'text': return isDark ? 'text-amber-400 bg-amber-500/20' : 'text-amber-600 bg-amber-100';
    }
  };

  const getStatusColor = (status: AIGenerationStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'processing': return 'bg-blue-500';
      case 'failed': return 'bg-red-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-gray-400';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return '刚刚';
    if (minutes < 60) return `${minutes}分钟前`;
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  };

  const truncatePrompt = (prompt: string, maxLength: number = 80) => {
    if (prompt.length <= maxLength) return prompt;
    return prompt.substring(0, maxLength) + '...';
  };

  const counts = useMemo(() => ({
    all: stats.total,
    image: stats.byType.image,
    video: stats.byType.video,
    text: stats.byType.text,
  }), [stats]);

  return (
    <div className={`min-h-screen pb-20 ${isDark ? 'bg-[#0F172A]' : 'bg-[#F5F5F5]'}`}>
      <div className="max-w-6xl mx-auto">
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
                  isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-600'
                }`}
              >
                <i className="fas fa-arrow-left"></i>
              </button>
              <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                AI创作历史
              </h1>
              <span className={`ml-auto px-3 py-1 rounded-full text-sm ${
                isDark ? 'bg-gray-800 text-gray-400' : 'bg-gray-100 text-gray-500'
              }`}>
                {stats.total} 条记录
              </span>
            </div>

            <div className={`px-4 pb-3 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <div className="relative">
                <i className={`fas fa-search absolute left-4 top-1/2 -translate-y-1/2 ${
                  isDark ? 'text-gray-500' : 'text-gray-400'
                }`}></i>
                <input
                  type="text"
                  placeholder="搜索提示词..."
                  value={searchKeyword}
                  onChange={(e) => {
                    setSearchKeyword(e.target.value);
                    setPagination(prev => ({ ...prev, page: 1 }));
                  }}
                  className={`w-full pl-11 pr-10 py-2.5 rounded-xl border text-sm transition-all ${
                    isDark 
                      ? 'bg-[#1E293B] border-gray-700 text-white placeholder-gray-500 focus:border-blue-500' 
                      : 'bg-gray-50 border-gray-200 text-gray-900 placeholder-gray-400 focus:border-blue-500'
                  }`}
                />
                {searchKeyword && (
                  <button
                    onClick={() => setSearchKeyword('')}
                    className={`absolute right-3 top-1/2 -translate-y-1/2 ${
                      isDark ? 'text-gray-500 hover:text-white' : 'text-gray-400 hover:text-gray-600'
                    }`}
                  >
                    <i className="fas fa-times-circle"></i>
                  </button>
                )}
              </div>
            </div>

            <div className={`px-4 pb-3 flex items-center gap-2 overflow-x-auto ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              {TYPE_FILTERS.map(filter => (
                <button
                  key={filter.key}
                  onClick={() => handleTypeFilterChange(filter.key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap text-sm font-medium transition-all ${
                    activeTypeFilter === filter.key
                      ? isDark
                        ? 'bg-blue-500 text-white'
                        : 'bg-gray-900 text-white'
                      : isDark
                        ? 'bg-[#1E293B] text-gray-400 hover:text-white'
                        : 'bg-white text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <i className={`fas ${filter.icon} text-xs`}></i>
                  {filter.label}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                    activeTypeFilter === filter.key
                      ? 'bg-white/20'
                      : isDark ? 'bg-gray-700' : 'bg-gray-200'
                  }`}>
                    {counts[filter.key]}
                  </span>
                </button>
              ))}
            </div>

            <div className={`px-4 pb-4 flex items-center gap-3 ${isDark ? 'border-gray-800' : 'border-gray-100'}`}>
              <select
                value={activeStatusFilter}
                onChange={(e) => handleStatusFilterChange(e.target.value as AIGenerationStatus | 'all')}
                className={`px-3 py-1.5 rounded-lg text-sm ${
                  isDark 
                    ? 'bg-[#1E293B] text-gray-300 border-gray-700' 
                    : 'bg-white text-gray-700 border-gray-200'
                } border`}
              >
                {STATUS_FILTERS.map(filter => (
                  <option key={filter.key} value={filter.key}>{filter.label}</option>
                ))}
              </select>

              <button
                onClick={() => {
                  setShowFavorites(!showFavorites);
                  setPagination(prev => ({ ...prev, page: 1 }));
                }}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-all ${
                  showFavorites
                    ? 'bg-yellow-500 text-white'
                    : isDark
                      ? 'bg-[#1E293B] text-gray-400 hover:text-yellow-400'
                      : 'bg-white text-gray-600 hover:text-yellow-500'
                }`}
              >
                <i className={`fas fa-star ${showFavorites ? '' : isDark ? 'text-gray-500' : 'text-gray-400'}`}></i>
                收藏 ({stats.favorites})
              </button>

              <div className="ml-auto flex items-center gap-2">
                <button
                  onClick={() => handleSortChange('createdAt')}
                  className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm transition-all ${
                    sort.field === 'createdAt'
                      ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-100 text-blue-600'
                      : isDark ? 'bg-[#1E293B] text-gray-400' : 'bg-white text-gray-600'
                  }`}
                >
                  <i className={`fas fa-clock`}></i>
                  时间
                  {sort.field === 'createdAt' && (
                    <i className={`fas fa-chevron-${sort.order === 'desc' ? 'down' : 'up'} text-xs`}></i>
                  )}
                </button>
              </div>
            </div>
          </div>

          {selectedItems.size > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`sticky top-[200px] z-10 mx-4 mb-4 p-3 rounded-xl ${
                isDark ? 'bg-blue-500/20 border border-blue-500/30' : 'bg-blue-50 border border-blue-200'
              }`}
            >
              <div className="flex items-center justify-between flex-wrap gap-2">
                <span className={`text-sm font-medium ${isDark ? 'text-blue-300' : 'text-blue-700'}`}>
                  已选择 {selectedItems.size} 条记录
                </span>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => handleBatchFavorite(true)}
                    className="px-3 py-1.5 rounded-lg text-sm bg-yellow-500 text-white hover:bg-yellow-600"
                  >
                    <i className="fas fa-star mr-1"></i>收藏
                  </button>
                  <button
                    onClick={() => handleBatchFavorite(false)}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <i className="fas fa-star mr-1"></i>取消收藏
                  </button>
                  <button
                    onClick={() => {
                      setBatchTagMode('add');
                      setShowBatchTagModal(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      isDark ? 'bg-green-600 text-white hover:bg-green-700' : 'bg-green-500 text-white hover:bg-green-600'
                    }`}
                  >
                    <i className="fas fa-tags mr-1"></i>添加标签
                  </button>
                  <button
                    onClick={() => {
                      setBatchTagMode('remove');
                      setShowBatchTagModal(true);
                    }}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                    }`}
                  >
                    <i className="fas fa-tag mr-1"></i>移除标签
                  </button>
                  <button
                    onClick={handleBatchDelete}
                    className="px-3 py-1.5 rounded-lg text-sm bg-red-500 text-white hover:bg-red-600"
                  >
                    <i className="fas fa-trash mr-1"></i>删除
                  </button>
                  <button
                    onClick={() => setSelectedItems(new Set())}
                    className={`px-3 py-1.5 rounded-lg text-sm ${
                      isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'
                    }`}
                  >
                    取消选择
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          <div className="px-4 py-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className="animate-spin rounded-full h-10 w-10 border-2 border-blue-500 border-t-transparent"></div>
                <p className={`mt-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>加载中...</p>
              </div>
            ) : items.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-24">
                <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${
                  isDark ? 'bg-gray-800' : 'bg-gray-100'
                }`}>
                  <i className={`fas fa-robot text-3xl ${isDark ? 'text-gray-600' : 'text-gray-400'}`}></i>
                </div>
                <p className={`font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  {searchKeyword ? '没有找到相关记录' : '暂无AI创作记录'}
                </p>
                <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                  {searchKeyword ? '试试其他关键词' : '开始使用AI创作吧'}
                </p>
                {!searchKeyword && (
                  <button
                    onClick={() => navigate('/generation')}
                    className="mt-6 px-6 py-2.5 rounded-xl font-medium bg-blue-600 text-white hover:bg-blue-700 transition-all"
                  >
                    <i className="fas fa-magic mr-2"></i>开始创作
                  </button>
                )}
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSelectAll}
                      className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
                        isDark ? 'bg-[#1E293B] text-gray-400' : 'bg-white text-gray-600'
                      }`}
                    >
                      <i className={`fas ${selectedItems.size === items.length ? 'fa-check-square' : 'fa-square'}`}></i>
                      {selectedItems.size === items.length ? '取消全选' : '全选'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleExport('json')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                        isDark ? 'bg-[#1E293B] text-gray-400 hover:text-white' : 'bg-white text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <i className="fas fa-download"></i>
                      导出JSON
                    </button>
                    <button
                      onClick={() => handleExport('csv')}
                      className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm ${
                        isDark ? 'bg-[#1E293B] text-gray-400 hover:text-white' : 'bg-white text-gray-600 hover:text-gray-900'
                      }`}
                    >
                      <i className="fas fa-file-csv"></i>
                      导出CSV
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <AnimatePresence>
                    {items.map((item, index) => (
                      <motion.div
                        key={item.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -20 }}
                        transition={{ delay: index * 0.05 }}
                        className={`group relative flex items-start gap-4 p-4 rounded-2xl cursor-pointer transition-all ${
                          selectedItems.has(item.id)
                            ? isDark ? 'bg-blue-500/20 ring-2 ring-blue-500' : 'bg-blue-50 ring-2 ring-blue-500'
                            : isDark ? 'bg-[#1E293B] hover:bg-[#334155]' : 'bg-white hover:shadow-md'
                        }`}
                        onClick={() => handleViewDetail(item)}
                      >
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleSelectItem(item.id);
                          }}
                          className={`absolute top-4 left-4 w-5 h-5 rounded flex items-center justify-center transition-all ${
                            selectedItems.has(item.id)
                              ? 'bg-blue-500 text-white'
                              : isDark ? 'bg-gray-700 text-gray-500' : 'bg-gray-200 text-gray-400'
                          }`}
                        >
                          <i className={`fas ${selectedItems.has(item.id) ? 'fa-check' : 'fa-square'} text-xs`}></i>
                        </button>

                        <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-gray-200 ml-6">
                          {item.thumbnailUrl ? (
                            item.type === 'video' ? (
                              <video
                                src={item.thumbnailUrl}
                                className="w-full h-full object-cover"
                                muted
                                preload="metadata"
                              />
                            ) : (
                              <img 
                                src={item.thumbnailUrl} 
                                alt={item.prompt}
                                className="w-full h-full object-cover"
                                loading="lazy"
                              />
                            )
                          ) : (
                            <div className={`w-full h-full flex items-center justify-center ${
                              isDark ? 'bg-gray-700' : 'bg-gray-100'
                            }`}>
                              <i className={`fas ${getTypeIcon(item.type)} ${
                                isDark ? 'text-gray-500' : 'text-gray-400'
                              } text-2xl`}></i>
                            </div>
                          )}
                          <div className="absolute top-1 left-1">
                            <span className={`px-1.5 py-0.5 rounded text-xs font-medium text-white ${getStatusColor(item.status)}`}>
                              {item.status === 'completed' ? '完成' : 
                               item.status === 'processing' ? '处理中' :
                               item.status === 'failed' ? '失败' :
                               item.status === 'pending' ? '待处理' : '已取消'}
                            </span>
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              <span className={`px-2 py-1 rounded-lg text-xs font-medium ${getTypeColor(item.type)}`}>
                                <i className={`fas ${getTypeIcon(item.type)} mr-1`}></i>
                                {item.type === 'image' ? '图片' : item.type === 'video' ? '视频' : '文本'}
                              </span>
                              {item.isFavorite && (
                                <i className="fas fa-star text-yellow-500 text-sm"></i>
                              )}
                            </div>
                            <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                              {formatDate(item.createdAt)}
                            </span>
                          </div>
                          
                          <p className={`text-sm mb-2 line-clamp-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                            {truncatePrompt(item.prompt, 120)}
                          </p>

                          {item.tags.length > 0 && (
                            <div className="flex items-center gap-1 flex-wrap">
                              {item.tags.slice(0, 3).map(tag => (
                                <span
                                  key={tag}
                                  className={`px-2 py-0.5 rounded-full text-xs ${
                                    isDark ? 'bg-gray-700 text-gray-400' : 'bg-gray-100 text-gray-500'
                                  }`}
                                >
                                  {tag}
                                </span>
                              ))}
                              {item.tags.length > 3 && (
                                <span className={`text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                  +{item.tags.length - 3}
                                </span>
                              )}
                            </div>
                          )}
                        </div>

                        <div className="flex flex-col items-end gap-2">
                          <div className="flex items-center gap-1">
                            <button
                              onClick={(e) => handleToggleFavorite(item.id, e)}
                              className={`p-2 rounded-lg transition-colors ${
                                item.isFavorite
                                  ? 'text-yellow-500'
                                  : isDark ? 'text-gray-600 hover:bg-gray-700 hover:text-yellow-400' : 'text-gray-400 hover:bg-gray-100 hover:text-yellow-500'
                              }`}
                              title={item.isFavorite ? '取消收藏' : '收藏'}
                            >
                              <i className={`fas fa-star`}></i>
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleReuse(item);
                              }}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark ? 'text-gray-600 hover:bg-gray-700 hover:text-blue-400' : 'text-gray-400 hover:bg-gray-100 hover:text-blue-500'
                              }`}
                              title="一键复用"
                            >
                              <i className="fas fa-redo"></i>
                            </button>
                            <button
                              onClick={(e) => handleDelete(item.id, e)}
                              className={`p-2 rounded-lg transition-colors ${
                                isDark ? 'text-gray-600 hover:bg-gray-700 hover:text-red-400' : 'text-gray-400 hover:bg-gray-100 hover:text-red-500'
                              }`}
                              title="删除"
                            >
                              <i className="fas fa-trash-alt"></i>
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>

                {pagination.totalPages > 1 && (
                  <div className="mt-6">
                    <Pagination
                      currentPage={pagination.page}
                      totalPages={pagination.totalPages}
                      pageSize={pagination.pageSize}
                      onPageChange={handlePageChange}
                      onPageSizeChange={handlePageSizeChange}
                    />
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      <AIGenerationHistoryDetail
        item={selectedItem}
        open={showDetail}
        onOpenChange={setShowDetail}
        onReuse={handleReuse}
        onToggleFavorite={handleToggleFavorite}
        onDelete={handleDelete}
      />

      <BatchTagModal
        open={showBatchTagModal}
        onOpenChange={setShowBatchTagModal}
        selectedIds={Array.from(selectedItems)}
        mode={batchTagMode}
        onSuccess={() => {
          setSelectedItems(new Set());
          fetchItems();
          fetchStats();
        }}
      />
    </div>
  );
}
