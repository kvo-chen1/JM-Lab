import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  Star, MessageSquare, ThumbsUp, ThumbsDown, Filter,
  Search, Calendar, User, Bot, Eye, BarChart3, TrendingUp,
  Clock, CheckCircle, X, Download, RefreshCw, AlertCircle
} from 'lucide-react';
import {
  aiFeedbackService,
  type AIFeedback,
  type AIFeedbackStats,
  FEEDBACK_TYPE_CONFIG,
  RATING_CONFIG
} from '@/services/aiFeedbackService';

// 评分配置（带图标）
const RATING_CONFIG_WITH_ICON: Record<number, { label: string; color: string; icon: any }> = {
  1: { label: '非常不满意', color: '#EF4444', icon: ThumbsDown },
  2: { label: '不满意', color: '#F97316', icon: ThumbsDown },
  3: { label: '一般', color: '#EAB308', icon: Star },
  4: { label: '满意', color: '#22C55E', icon: ThumbsUp },
  5: { label: '非常满意', color: '#10B981', icon: ThumbsUp },
};

export default function AIFeedbackManagement() {
  const { isDark } = useTheme();
  const [feedbacks, setFeedbacks] = useState<AIFeedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [dateRange, setDateRange] = useState<string>('7');
  const [selectedFeedback, setSelectedFeedback] = useState<AIFeedback | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState<AIFeedbackStats>({
    totalCount: 0,
    avgRating: 0,
    unreadCount: 0,
    rating5Count: 0,
    rating4Count: 0,
    rating3Count: 0,
    rating2Count: 0,
    rating1Count: 0,
  });
  const [currentPage, setCurrentPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 20;

  // 获取统计数据
  const fetchStats = useCallback(async () => {
    try {
      const startDate = dateRange !== 'all'
        ? new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      const data = await aiFeedbackService.getFeedbackStats(startDate);
      setStats(data);
    } catch (error) {
      console.error('获取统计数据失败:', error);
    }
  }, [dateRange]);

  // 获取反馈列表
  const fetchFeedbacks = useCallback(async (page: number = 1) => {
    setLoading(true);
    try {
      // 计算日期范围
      const startDate = dateRange !== 'all'
        ? new Date(Date.now() - parseInt(dateRange) * 24 * 60 * 60 * 1000).toISOString()
        : undefined;

      // 解析筛选条件
      const rating = ratingFilter !== 'all' ? parseInt(ratingFilter) : undefined;
      const feedbackType = typeFilter !== 'all' ? typeFilter as any : undefined;
      const isRead = readFilter !== 'all'
        ? readFilter === 'read'
        : undefined;

      const { feedbacks: data, total } = await aiFeedbackService.getFeedbackList({
        page,
        limit: pageSize,
        rating,
        feedbackType,
        isRead,
        searchQuery: searchQuery || undefined,
        startDate,
      });

      setFeedbacks(data);
      setTotalCount(total);
      setCurrentPage(page);
    } catch (error) {
      console.error('获取AI反馈失败:', error);
      toast.error('获取数据失败');
    } finally {
      setLoading(false);
    }
  }, [dateRange, ratingFilter, typeFilter, readFilter, searchQuery]);

  // 初始化加载
  useEffect(() => {
    fetchStats();
    fetchFeedbacks(1);
  }, [fetchStats, fetchFeedbacks]);

  // 标记为已读
  const markAsRead = async (feedback: AIFeedback) => {
    try {
      const success = await aiFeedbackService.markAsRead(feedback.id);
      if (success) {
        const updated = feedbacks.map(f =>
          f.id === feedback.id ? { ...f, isRead: true } : f
        );
        setFeedbacks(updated);
        // 更新统计数据
        setStats(prev => ({
          ...prev,
          unreadCount: Math.max(0, prev.unreadCount - 1),
        }));
        toast.success('已标记为已读');
      }
    } catch (error) {
      console.error('标记已读失败:', error);
      toast.error('操作失败');
    }
  };

  // 导出数据
  const exportData = () => {
    const dataStr = JSON.stringify(filteredFeedbacks, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,' + encodeURIComponent(dataStr);
    const exportFileDefaultName = `ai-feedback-${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
    toast.success('数据导出成功');
  };

  // 查看详情
  const openDetailModal = (feedback: AIFeedback) => {
    setSelectedFeedback(feedback);
    setShowModal(true);
    if (!feedback.isRead) {
      markAsRead(feedback);
    }
  };

  // 筛选反馈（本地筛选）
  const filteredFeedbacks = feedbacks.filter(feedback => {
    const matchesSearch = !searchQuery ||
      feedback.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.comment?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      feedback.userQuery.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRating = ratingFilter === 'all' || feedback.rating === parseInt(ratingFilter);
    const matchesType = typeFilter === 'all' || feedback.feedbackType === typeFilter;
    const matchesRead = readFilter === 'all' ||
      (readFilter === 'read' && feedback.isRead) ||
      (readFilter === 'unread' && !feedback.isRead);

    return matchesSearch && matchesRating && matchesType && matchesRead;
  });

  // 获取评分星星
  const renderStars = (rating: number) => {
    return (
      <div className="flex gap-0.5">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating
                ? 'text-yellow-400 fill-yellow-400'
                : 'text-gray-300'
            }`}
          />
        ))}
      </div>
    );
  };

  // 计算总页数
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold mb-1">AI反馈管理</h2>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              查看和管理用户对AI的反馈和评价
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportData}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              导出数据
            </button>
            <button
              onClick={() => { fetchStats(); fetchFeedbacks(1); }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw className="w-4 h-4" />
              刷新
            </button>
          </div>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总反馈数</p>
              <p className="text-2xl font-bold">{stats.totalCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-blue-600" />
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>平均评分</p>
              <p className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-yellow-100 flex items-center justify-center">
              <Star className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>未读反馈</p>
              <p className="text-2xl font-bold text-red-600">{stats.unreadCount}</p>
            </div>
            <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
              <AlertCircle className="w-6 h-6 text-red-600" />
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
          <div className="flex items-center justify-between">
            <div>
              <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>满意度</p>
              <p className="text-2xl font-bold text-green-600">
                {stats.totalCount > 0 ? Math.round(((stats.rating5Count + stats.rating4Count) / stats.totalCount) * 100) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>
      </div>

      {/* 评分分布 */}
      <div className={`p-6 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <h3 className="font-bold mb-4">评分分布</h3>
        <div className="space-y-3">
          {[5, 4, 3, 2, 1].map((rating) => {
            const count = stats[`rating${rating}Count` as keyof AIFeedbackStats] as number;
            const percentage = stats.totalCount > 0 ? (count / stats.totalCount) * 100 : 0;
            const config = RATING_CONFIG[rating];
            return (
              <div key={rating} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-24">
                  <span className="font-medium">{rating}星</span>
                </div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${percentage}%`,
                      backgroundColor: config.color
                    }}
                  />
                </div>
                <div className="w-20 text-right">
                  <span className="text-sm font-medium">{count}</span>
                  <span className="text-xs text-gray-500 ml-1">({percentage.toFixed(1)}%)</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 筛选和搜索 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="flex flex-wrap gap-4 items-center">
          <div className="flex-1 min-w-[200px]">
            <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="搜索用户、评论或问题..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && fetchFeedbacks(1)}
                className={`w-full px-4 py-2 pl-10 rounded-lg bg-transparent border-none outline-none ${isDark ? 'text-white placeholder-gray-400' : 'text-gray-900 placeholder-gray-500'}`}
              />
            </div>
          </div>

          <select
            value={ratingFilter}
            onChange={(e) => setRatingFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="all">全部评分</option>
            <option value="5">5星</option>
            <option value="4">4星</option>
            <option value="3">3星</option>
            <option value="2">2星</option>
            <option value="1">1星</option>
          </select>

          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="all">全部类型</option>
            <option value="satisfaction">满意度</option>
            <option value="quality">内容质量</option>
            <option value="accuracy">准确性</option>
            <option value="helpfulness">有用性</option>
            <option value="other">其他</option>
          </select>

          <select
            value={readFilter}
            onChange={(e) => setReadFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="all">全部状态</option>
            <option value="unread">未读</option>
            <option value="read">已读</option>
          </select>

          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className={`px-4 py-2 rounded-lg border ${isDark ? 'bg-gray-700 border-gray-600 text-white' : 'bg-white border-gray-300 text-gray-900'}`}
          >
            <option value="7">最近7天</option>
            <option value="30">最近30天</option>
            <option value="90">最近90天</option>
            <option value="all">全部时间</option>
          </select>
        </div>
      </div>

      {/* 反馈列表 */}
      <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md overflow-hidden`}>
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin w-8 h-8 border-4 border-red-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>加载中...</p>
          </div>
        ) : filteredFeedbacks.length === 0 ? (
          <div className="p-12 text-center">
            <Bot className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className={`text-lg ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>暂无AI反馈</p>
            <p className={`text-sm mt-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>用户提交的AI反馈将显示在这里</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <tr>
                    <th className="px-6 py-4 text-left text-sm font-semibold">用户</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">评分</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">类型</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">用户问题</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">评论</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold">时间</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold">操作</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredFeedbacks.map((feedback) => (
                    <tr
                      key={feedback.id}
                      className={`${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-50'} transition-colors ${!feedback.isRead ? 'bg-red-50 dark:bg-red-900/10' : ''}`}
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 rounded-full bg-red-600 text-white flex items-center justify-center font-medium">
                            {feedback.userName.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{feedback.userName}</p>
                            {!feedback.isRead && (
                              <span className="text-xs text-red-600 font-medium">未读</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          {renderStars(feedback.rating)}
                          <span className="text-xs" style={{ color: RATING_CONFIG[feedback.rating].color }}>
                            {RATING_CONFIG[feedback.rating].label}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className="px-3 py-1 rounded-full text-xs font-medium"
                          style={{
                            backgroundColor: FEEDBACK_TYPE_CONFIG[feedback.feedbackType]?.bgColor,
                            color: FEEDBACK_TYPE_CONFIG[feedback.feedbackType]?.color
                          }}
                        >
                          {FEEDBACK_TYPE_CONFIG[feedback.feedbackType]?.name}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm truncate max-w-[200px] ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {feedback.userQuery}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <p className={`text-sm truncate max-w-[200px] ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {feedback.comment || '-'}
                        </p>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                          {new Date(feedback.createdAt).toLocaleDateString('zh-CN')}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button
                          onClick={() => openDetailModal(feedback)}
                          className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'} transition-colors`}
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4 text-blue-500" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 分页 */}
            {totalPages > 1 && (
              <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-center gap-2`}>
                <button
                  onClick={() => fetchFeedbacks(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                >
                  上一页
                </button>
                <span className="px-3 py-1">
                  第 {currentPage} / {totalPages} 页
                </span>
                <button
                  onClick={() => fetchFeedbacks(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 rounded-lg bg-gray-200 dark:bg-gray-700 disabled:opacity-50"
                >
                  下一页
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {showModal && selectedFeedback && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 z-[70] flex items-center justify-center p-4"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className={`w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-2xl`}
              onClick={e => e.stopPropagation()}
            >
              {/* 弹窗头部 */}
              <div className={`p-6 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-between items-center`}>
                <h3 className="text-xl font-bold">AI反馈详情</h3>
                <button
                  onClick={() => setShowModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                <div className="space-y-6">
                  {/* 用户信息 */}
                  <div className="flex items-center space-x-4">
                    <div className="w-16 h-16 rounded-full bg-red-600 text-white flex items-center justify-center text-2xl font-medium">
                      {selectedFeedback.userName.charAt(0)}
                    </div>
                    <div>
                      <h4 className="text-xl font-bold">{selectedFeedback.userName}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(selectedFeedback.createdAt).toLocaleString('zh-CN')}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 评分和类型 */}
                  <div className="flex gap-4">
                    <div className={`flex-1 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>评分</p>
                      <div className="flex items-center gap-2">
                        {renderStars(selectedFeedback.rating)}
                        <span className="font-bold" style={{ color: RATING_CONFIG[selectedFeedback.rating].color }}>
                          {RATING_CONFIG[selectedFeedback.rating].label}
                        </span>
                      </div>
                    </div>
                    <div className={`flex-1 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>反馈类型</p>
                      <span
                        className="px-3 py-1 rounded-full text-sm font-medium"
                        style={{
                          backgroundColor: FEEDBACK_TYPE_CONFIG[selectedFeedback.feedbackType]?.bgColor,
                          color: FEEDBACK_TYPE_CONFIG[selectedFeedback.feedbackType]?.color
                        }}
                      >
                        {FEEDBACK_TYPE_CONFIG[selectedFeedback.feedbackType]?.name}
                      </span>
                    </div>
                    <div className={`flex-1 p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'} mb-2`}>AI模型</p>
                      <span className="font-medium">{selectedFeedback.aiModel}</span>
                    </div>
                  </div>

                  {/* 用户问题 */}
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <User className="w-4 h-4" />
                      用户问题
                    </h5>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                      <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                        {selectedFeedback.userQuery}
                      </p>
                    </div>
                  </div>

                  {/* AI回复 */}
                  <div>
                    <h5 className="font-medium mb-2 flex items-center gap-2">
                      <Bot className="w-4 h-4" />
                      AI回复
                    </h5>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-blue-900/20' : 'bg-blue-50'}`}>
                      <p className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedFeedback.aiResponse}
                      </p>
                    </div>
                  </div>

                  {/* 用户评论 */}
                  {selectedFeedback.comment && (
                    <div>
                      <h5 className="font-medium mb-2 flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        用户评论
                      </h5>
                      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                        <p className={isDark ? 'text-gray-300' : 'text-gray-700'}>
                          {selectedFeedback.comment}
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* 弹窗底部 */}
              <div className={`p-6 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => setShowModal(false)}
                  className={`px-6 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'} transition-colors`}
                >
                  关闭
                </button>
                {!selectedFeedback.isRead && (
                  <button
                    onClick={() => markAsRead(selectedFeedback)}
                    className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg transition-colors flex items-center gap-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    标记为已读
                  </button>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
