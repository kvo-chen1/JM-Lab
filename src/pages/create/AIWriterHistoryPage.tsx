import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { useAIWriterHistory, AIWriterHistoryItem } from './hooks/useAIWriterHistory';
import { 
  Search, 
  Filter, 
  Trash2, 
  FileText, 
  Clock, 
  ChevronLeft,
  MoreVertical,
  Edit3,
  Copy
} from 'lucide-react';

export default function AIWriterHistoryPage() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const { historyItems, deleteHistoryItem, isLoading } = useAIWriterHistory();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'completed' | 'archived'>('all');

  // 过滤历史记录
  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      const matchesSearch =
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.templateName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.content.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = filterStatus === 'all' || item.status === filterStatus;
      return matchesSearch && matchesStatus;
    });
  }, [historyItems, searchQuery, filterStatus]);

  // 删除历史记录
  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm('确定要删除这条记录吗？')) {
      deleteHistoryItem(id);
      toast.success('已删除');
    }
  };

  // 选择历史记录
  const handleSelectItem = (item: AIWriterHistoryItem) => {
    navigate('/create/ai-writer-editor', {
      state: {
        historyItemId: item.id,
        templateId: item.templateId,
        templateName: item.templateName,
        content: item.content,
        formData: item.formData,
      },
    });
  };

  // 获取状态标签样式
  const getStatusStyle = (status: AIWriterHistoryItem['status']) => {
    switch (status) {
      case 'draft':
        return isDark
          ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
          : 'bg-amber-100 text-amber-700 border-amber-200';
      case 'completed':
        return isDark
          ? 'bg-green-500/20 text-green-400 border-green-500/30'
          : 'bg-green-100 text-green-700 border-green-200';
      case 'archived':
        return isDark
          ? 'bg-gray-500/20 text-gray-400 border-gray-500/30'
          : 'bg-gray-100 text-gray-600 border-gray-200';
      default:
        return '';
    }
  };

  // 获取状态文本
  const getStatusText = (status: AIWriterHistoryItem['status']) => {
    switch (status) {
      case 'draft':
        return '草稿';
      case 'completed':
        return '已完成';
      case 'archived':
        return '已归档';
      default:
        return '';
    }
  };

  // 格式化日期
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* 顶部导航 */}
      <header className={`sticky top-0 z-40 border-b ${isDark ? 'bg-gray-900/95 border-gray-800' : 'bg-white/95 border-gray-200'} backdrop-blur-md`}>
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => navigate('/create/ai-writer')}
                className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-800 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>历史记录</h1>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  共 {filteredItems.length} 条记录
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate('/create/ai-writer')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              新建创作
            </button>
          </div>
        </div>
      </header>

      {/* 搜索和筛选 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className={`flex-1 flex items-center gap-3 px-4 py-3 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <Search className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索历史记录..."
              className={`flex-1 bg-transparent outline-none ${isDark ? 'text-gray-200 placeholder-gray-500' : 'text-gray-700 placeholder-gray-400'}`}
            />
          </div>
          <div className={`flex items-center gap-2 px-4 py-3 rounded-xl ${isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} border`}>
            <Filter className={`w-5 h-5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`} />
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as any)}
              className={`bg-transparent outline-none text-sm ${isDark ? 'text-gray-200' : 'text-gray-700'}`}
            >
              <option value="all">全部状态</option>
              <option value="draft">草稿</option>
              <option value="completed">已完成</option>
              <option value="archived">已归档</option>
            </select>
          </div>
        </div>
      </div>

      {/* 历史记录列表 */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 pb-8">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-gray-800' : 'bg-gray-100'}`}>
              <FileText className={`w-10 h-10 ${isDark ? 'text-gray-600' : 'text-gray-400'}`} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>暂无历史记录</h3>
            <p className={`text-sm ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>开始创作，您的作品将显示在这里</p>
            <button
              onClick={() => navigate('/create/ai-writer')}
              className={`mt-6 px-6 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isDark
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              开始创作
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredItems.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => handleSelectItem(item)}
                className={`group p-5 rounded-xl border cursor-pointer transition-all ${
                  isDark
                    ? 'bg-gray-800 border-gray-700 hover:border-gray-600'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-md'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className={`font-semibold truncate ${isDark ? 'text-white' : 'text-gray-900'}`}>
                        {item.title}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(item.status)}`}>
                        {getStatusText(item.status)}
                      </span>
                    </div>
                    <p className={`text-sm mb-3 line-clamp-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {item.content.replace(/<[^>]*>/g, '').slice(0, 150)}...
                    </p>
                    <div className="flex items-center gap-4 text-xs">
                      <span className={`flex items-center gap-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        <Clock className="w-3.5 h-3.5" />
                        {formatDate(item.createdAt)}
                      </span>
                      <span className={`px-2 py-0.5 rounded ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
                        {item.templateName}
                      </span>
                      <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                        {item.wordCount} 字
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectItem(item);
                      }}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
                      title="编辑"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(item.id, e)}
                      className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-900/30 text-red-400' : 'hover:bg-red-50 text-red-500'}`}
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
