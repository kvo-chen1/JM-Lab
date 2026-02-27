import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  feedbackService,
  FEEDBACK_TYPE_CONFIG,
  FEEDBACK_STATUS_CONFIG,
  FEEDBACK_PRIORITY_CONFIG,
  type Feedback,
  type FeedbackStatus,
  type FeedbackPriority,
  type FeedbackType,
  type FeedbackProcessLog
} from '@/services/feedbackService';
import { permissionService } from '@/services/permissionService';
import { AuthContext } from '@/contexts/authContext';
import { useNotifications } from '@/contexts/NotificationContext';
import {
  MessageSquare,
  Bug,
  Lightbulb,
  AlertTriangle,
  HelpCircle,
  MessageCircle,
  Clock,
  CheckCircle,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  User,
  Calendar,
  Link as LinkIcon,
  Monitor,
  Globe,
  Send,
  Trash2,
  MoreHorizontal,
  Eye,
  AlertCircle,
  ArrowRight,
  History,
  Bell,
  CheckCheck
} from 'lucide-react';

// 反馈类型图标映射
const typeIconMap = {
  bug: Bug,
  feature: Lightbulb,
  complaint: AlertTriangle,
  inquiry: HelpCircle,
  other: MessageCircle
};

export default function FeedbackManagement() {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);
  const { addNotification } = useNotifications();

  // 状态
  const [feedbacks, setFeedbacks] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedFeedback, setSelectedFeedback] = useState<Feedback | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);
  const [processLogs, setProcessLogs] = useState<FeedbackProcessLog[]>([]);
  const [admins, setAdmins] = useState<any[]>([]);

  // 筛选状态
  const [filters, setFilters] = useState({
    status: '' as FeedbackStatus | '',
    type: '' as FeedbackType | '',
    priority: '' as FeedbackPriority | '',
    search: ''
  });

  // 统计数据
  const [stats, setStats] = useState({
    total_count: 0,
    pending_count: 0,
    processing_count: 0,
    resolved_count: 0,
    today_count: 0,
    avg_process_hours: 0
  });

  // 响应表单
  const [responseForm, setResponseForm] = useState({
    content: '',
    notifyUser: true
  });

  // 加载数据
  useEffect(() => {
    loadFeedbacks();
    loadStats();
    loadAdmins();
  }, [page, filters]);

  const loadFeedbacks = async () => {
    setLoading(true);
    try {
      console.log('[FeedbackManagement] 开始加载反馈数据');
      const { feedbacks: data, total: count } = await feedbackService.getFeedbacks({
        page,
        limit: 20,
        status: filters.status || undefined,
        type: filters.type || undefined,
        priority: filters.priority || undefined,
        search: filters.search || undefined,
        forceDatabase: true // 管理后台强制从数据库查询
      });
      console.log('[FeedbackManagement] 加载到的数据:', { data, count });
      setFeedbacks(data);
      setTotal(count);
    } catch (error) {
      console.error('[FeedbackManagement] 加载反馈列表失败:', error);
      toast.error('加载反馈列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      console.log('[FeedbackManagement] 开始加载统计数据');
      const data = await feedbackService.getStats();
      console.log('[FeedbackManagement] 加载到的统计数据:', data);
      setStats(data);
    } catch (error) {
      console.error('[FeedbackManagement] 加载统计数据失败:', error);
    }
  };

  const loadAdmins = async () => {
    try {
      const data = await permissionService.getAdminAccounts();
      setAdmins(data);
    } catch (error) {
      console.error('加载管理员列表失败:', error);
    }
  };

  const loadProcessLogs = async (feedbackId: string) => {
    try {
      const logs = await feedbackService.getProcessLogs(feedbackId);
      setProcessLogs(logs);
    } catch (error) {
      console.error('加载处理日志失败:', error);
    }
  };

  // 查看详情
  const handleViewDetail = async (feedback: Feedback) => {
    setSelectedFeedback(feedback);
    setShowDetailPanel(true);
    setResponseForm({ content: feedback.response_content || '', notifyUser: true });
    await loadProcessLogs(feedback.id);
  };

  // 更新状态
  const handleStatusChange = async (feedbackId: string, status: FeedbackStatus) => {
    try {
      await feedbackService.updateFeedbackStatus(feedbackId, status, user?.id);
      toast.success(`反馈状态已更新为：${FEEDBACK_STATUS_CONFIG[status].label}`);
      loadFeedbacks();
      loadStats();
      if (selectedFeedback?.id === feedbackId) {
        const updated = await feedbackService.getFeedbackById(feedbackId);
        if (updated) setSelectedFeedback(updated);
      }
    } catch (error) {
      toast.error('更新状态失败');
    }
  };

  // 设置优先级
  const handlePriorityChange = async (feedbackId: string, priority: FeedbackPriority) => {
    try {
      await feedbackService.setPriority(feedbackId, priority, user?.id);
      toast.success(`优先级已设置为：${FEEDBACK_PRIORITY_CONFIG[priority].label}`);
      loadFeedbacks();
      if (selectedFeedback?.id === feedbackId) {
        const updated = await feedbackService.getFeedbackById(feedbackId);
        if (updated) setSelectedFeedback(updated);
      }
    } catch (error) {
      toast.error('设置优先级失败');
    }
  };

  // 分配反馈
  const handleAssign = async (feedbackId: string, adminId: string) => {
    try {
      await feedbackService.assignFeedback(feedbackId, adminId, user?.id);
      toast.success('反馈已分配');
      loadFeedbacks();
      if (selectedFeedback?.id === feedbackId) {
        const updated = await feedbackService.getFeedbackById(feedbackId);
        if (updated) setSelectedFeedback(updated);
        await loadProcessLogs(feedbackId);
      }
    } catch (error) {
      toast.error('分配失败');
    }
  };

  // 提交响应
  const handleSubmitResponse = async () => {
    if (!selectedFeedback || !responseForm.content.trim()) {
      toast.error('请输入处理结果');
      return;
    }

    try {
      await feedbackService.submitResponse(
        selectedFeedback.id,
        responseForm.content,
        user?.id,
        responseForm.notifyUser
      );
      
      // 发送前端通知
      if (responseForm.notifyUser && selectedFeedback.user_id) {
        addNotification({
          type: 'feedback_resolved',
          title: '反馈处理完成',
          content: `您对"${selectedFeedback.title || FEEDBACK_TYPE_CONFIG[selectedFeedback.type].label}"的反馈已得到回复`,
          senderId: user?.id || '',
          senderName: user?.username || '管理员',
          recipientId: selectedFeedback.user_id,
          priority: 'medium',
          link: `/feedback/${selectedFeedback.id}`
        });
      }
      
      toast.success('处理结果已提交' + (responseForm.notifyUser ? '，用户已收到通知' : ''));
      loadFeedbacks();
      loadStats();
      const updated = await feedbackService.getFeedbackById(selectedFeedback.id);
      if (updated) setSelectedFeedback(updated);
      await loadProcessLogs(selectedFeedback.id);
    } catch (error) {
      toast.error('提交失败');
    }
  };

  // 删除反馈
  const handleDelete = async (feedbackId: string) => {
    if (!confirm('确定要删除这条反馈吗？')) return;

    try {
      await feedbackService.deleteFeedback(feedbackId);
      toast.success('反馈已删除');
      loadFeedbacks();
      loadStats();
      if (selectedFeedback?.id === feedbackId) {
        setSelectedFeedback(null);
        setShowDetailPanel(false);
      }
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 格式化时间
  const formatTime = (time: string) => {
    const date = new Date(time);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) return '刚刚';
    if (hours < 24) return `${hours}小时前`;
    if (days < 7) return `${days}天前`;
    return date.toLocaleDateString();
  };

  // 调试函数：检查 localStorage
  const checkLocalStorage = () => {
    const stored = localStorage.getItem('user_feedbacks_local');
    console.log('[Debug] localStorage 中的数据:', stored);
    if (stored) {
      try {
        const data = JSON.parse(stored);
        console.log('[Debug] 解析后的数据条数:', data.length);
        console.log('[Debug] 数据内容:', data);
        toast.success(`localStorage 中有 ${data.length} 条数据`);
      } catch (e) {
        console.error('[Debug] 解析失败:', e);
        toast.error('解析 localStorage 数据失败');
      }
    } else {
      console.log('[Debug] localStorage 中没有数据');
      toast.error('localStorage 中没有数据');
    }
  };

  return (
    <div className="space-y-6">
      {/* 调试按钮 */}
      <div className="flex gap-2">
        <button
          onClick={checkLocalStorage}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600"
        >
          检查 localStorage
        </button>
        <button
          onClick={() => {
            loadFeedbacks();
            loadStats();
          }}
          className="px-4 py-2 bg-green-500 text-white rounded-lg text-sm hover:bg-green-600"
        >
          手动刷新
        </button>
        <button
          onClick={() => {
            localStorage.removeItem('user_feedbacks_local');
            toast.success('本地存储已清除，将从数据库重新加载');
            window.location.reload();
          }}
          className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
        >
          清除本地存储
        </button>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { title: '今日反馈', value: stats.today_count, icon: MessageSquare, color: 'blue', trend: '实时' },
          { title: '待处理', value: stats.pending_count, icon: Clock, color: 'yellow', trend: '需关注' },
          { title: '处理中', value: stats.processing_count, icon: RotateCcw, color: 'purple', trend: '进行中' },
          { title: '已解决', value: stats.resolved_count, icon: CheckCircle, color: 'green', trend: `${stats.avg_process_hours}小时平均` }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                <h3 className="text-3xl font-bold mt-1">{stat.value}</h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.trend}</p>
              </div>
              <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                <stat.icon className={`w-6 h-6 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="flex flex-wrap gap-4">
          {/* 搜索 */}
          <div className="flex-1 min-w-[200px]">
            <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索反馈内容..."
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
                className={`w-full pl-10 pr-4 py-2 rounded-lg bg-transparent border-none outline-none text-sm`}
              />
            </div>
          </div>

          {/* 状态筛选 */}
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value as any }))}
            className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border-none outline-none`}
          >
            <option value="">全部状态</option>
            {Object.entries(FEEDBACK_STATUS_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* 类型筛选 */}
          <select
            value={filters.type}
            onChange={(e) => setFilters(prev => ({ ...prev, type: e.target.value as any }))}
            className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border-none outline-none`}
          >
            <option value="">全部类型</option>
            {Object.entries(FEEDBACK_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* 优先级筛选 */}
          <select
            value={filters.priority}
            onChange={(e) => setFilters(prev => ({ ...prev, priority: e.target.value as any }))}
            className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border-none outline-none`}
          >
            <option value="">全部优先级</option>
            {Object.entries(FEEDBACK_PRIORITY_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* 重置按钮 */}
          <button
            onClick={() => setFilters({ status: '', type: '', priority: '', search: '' })}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            重置筛选
          </button>
        </div>
      </div>

      {/* 反馈列表 */}
      <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : feedbacks.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <MessageSquare className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-300'} mb-4`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>暂无反馈数据</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {feedbacks.map((feedback) => {
              const TypeIcon = typeIconMap[feedback.type];
              const typeConfig = FEEDBACK_TYPE_CONFIG[feedback.type];
              const statusConfig = FEEDBACK_STATUS_CONFIG[feedback.status];
              const priorityConfig = FEEDBACK_PRIORITY_CONFIG[feedback.priority];

              return (
                <motion.div
                  key={feedback.id}
                  layout
                  onClick={() => handleViewDetail(feedback)}
                  className={`p-6 cursor-pointer transition-colors ${
                    isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                  } ${selectedFeedback?.id === feedback.id ? (isDark ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* 类型图标 */}
                    <div
                      className="p-3 rounded-xl shrink-0"
                      style={{ backgroundColor: `${typeConfig.color}20` }}
                    >
                      <TypeIcon className="w-5 h-5" style={{ color: typeConfig.color }} />
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
                        >
                          {typeConfig.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bgColor}`} style={{ color: statusConfig.color }}>
                          {statusConfig.label}
                        </span>
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${priorityConfig.color}20`, color: priorityConfig.color }}
                        >
                          {priorityConfig.label}优先级
                        </span>
                        {feedback.assigned_to && (
                          <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-blue-900/50 text-blue-400' : 'bg-blue-100 text-blue-600'}`}>
                            已分配
                          </span>
                        )}
                      </div>

                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} line-clamp-2 mb-2`}>
                        {feedback.content}
                      </p>

                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          {feedback.user?.username || '匿名用户'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTime(feedback.created_at)}
                        </span>
                        {feedback.contact_info && (
                          <span className="flex items-center gap-1">
                            <Bell className="w-3 h-3" />
                            {feedback.contact_type === 'email' ? '邮箱' : feedback.contact_type === 'phone' ? '手机' : '联系方式'}: {feedback.contact_info}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(feedback);
                        }}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                      </button>
                      {feedback.status !== 'resolved' && feedback.status !== 'rejected' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleStatusChange(feedback.id, feedback.status === 'pending' ? 'processing' : 'resolved');
                          }}
                          className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                        >
                          <CheckCircle className="w-4 h-4 text-green-500" />
                        </button>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(feedback.id);
                        }}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* 分页 */}
        {total > 20 && (
          <div className={`p-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-center`}>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-2 rounded-lg disabled:opacity-50 text-sm"
              >
                上一页
              </button>
              <span className="px-4 py-2 text-sm">
                {page} / {Math.ceil(total / 20)}
              </span>
              <button
                onClick={() => setPage(p => Math.min(Math.ceil(total / 20), p + 1))}
                disabled={page >= Math.ceil(total / 20)}
                className="px-3 py-2 rounded-lg disabled:opacity-50 text-sm"
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 详情侧边栏 */}
      <AnimatePresence>
        {showDetailPanel && selectedFeedback && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailPanel(false)}
              className="fixed inset-0 bg-black/50 z-40"
            />

            {/* 侧边栏 */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className={`fixed right-0 top-0 h-full w-full max-w-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} z-50 shadow-2xl overflow-y-auto`}
            >
              {/* 头部 */}
              <div className={`sticky top-0 z-10 px-6 py-4 border-b ${isDark ? 'border-gray-700 bg-gray-800' : 'border-gray-200 bg-white'} flex items-center justify-between`}>
                <h2 className="text-xl font-bold">反馈详情</h2>
                <button
                  onClick={() => setShowDetailPanel(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* 基本信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <div className="flex items-center gap-3 mb-4">
                    <img
                      src={selectedFeedback.user?.avatar_url || `https://ui-avatars.com/api/?name=${selectedFeedback.user?.username || '匿名'}&background=random`}
                      alt={selectedFeedback.user?.username}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{selectedFeedback.user?.username || '匿名用户'}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {selectedFeedback.user?.email || '未登录用户'}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>反馈类型：</span>
                      <span style={{ color: FEEDBACK_TYPE_CONFIG[selectedFeedback.type].color }}>
                        {FEEDBACK_TYPE_CONFIG[selectedFeedback.type].label}
                      </span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>当前状态：</span>
                      <span style={{ color: FEEDBACK_STATUS_CONFIG[selectedFeedback.status].color }}>
                        {FEEDBACK_STATUS_CONFIG[selectedFeedback.status].label}
                      </span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>优先级：</span>
                      <span style={{ color: FEEDBACK_PRIORITY_CONFIG[selectedFeedback.priority].color }}>
                        {FEEDBACK_PRIORITY_CONFIG[selectedFeedback.priority].label}
                      </span>
                    </div>
                    <div>
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>提交时间：</span>
                      <span>{new Date(selectedFeedback.created_at).toLocaleString()}</span>
                    </div>
                    {selectedFeedback.contact_info && (
                      <div className="col-span-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>联系方式：</span>
                        <span>{selectedFeedback.contact_info} ({selectedFeedback.contact_type})</span>
                      </div>
                    )}
                    {selectedFeedback.page_url && (
                      <div className="col-span-2">
                        <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>页面地址：</span>
                        <a href={selectedFeedback.page_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline truncate inline-block max-w-md">
                          {selectedFeedback.page_url}
                        </a>
                      </div>
                    )}
                  </div>
                </div>

                {/* 反馈内容 */}
                <div>
                  <h3 className="font-medium mb-3">反馈内容</h3>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <p className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {selectedFeedback.content}
                    </p>
                  </div>
                </div>

                {/* 截图 */}
                {selectedFeedback.screenshots && selectedFeedback.screenshots.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">相关截图</h3>
                    <div className="grid grid-cols-2 gap-4">
                      {selectedFeedback.screenshots.map((url, index) => (
                        <a key={index} href={url} target="_blank" rel="noopener noreferrer">
                          <img
                            src={url}
                            alt={`截图 ${index + 1}`}
                            className="w-full h-32 object-cover rounded-lg hover:opacity-80 transition-opacity"
                          />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                {/* 设备信息 */}
                {selectedFeedback.device_info && (
                  <div>
                    <h3 className="font-medium mb-3">设备信息</h3>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'} text-sm space-y-2`}>
                      {selectedFeedback.device_info.os && (
                        <p><span className={isDark ? 'text-gray-400' : 'text-gray-500'}>操作系统：</span>{selectedFeedback.device_info.os}</p>
                      )}
                      {selectedFeedback.device_info.browser && (
                        <p><span className={isDark ? 'text-gray-400' : 'text-gray-500'}>浏览器：</span>{selectedFeedback.device_info.browser}</p>
                      )}
                      {selectedFeedback.device_info.screen && (
                        <p><span className={isDark ? 'text-gray-400' : 'text-gray-500'}>屏幕分辨率：</span>{selectedFeedback.device_info.screen}</p>
                      )}
                    </div>
                  </div>
                )}

                {/* 操作区域 */}
                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="font-medium mb-4">处理操作</h3>

                  {/* 状态操作 */}
                  <div className="mb-4">
                    <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>更新状态</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(FEEDBACK_STATUS_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => handleStatusChange(selectedFeedback.id, key as FeedbackStatus)}
                          disabled={selectedFeedback.status === key}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            selectedFeedback.status === key
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          } ${config.bgColor}`}
                          style={{ color: config.color }}
                        >
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 优先级设置 */}
                  <div className="mb-4">
                    <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>设置优先级</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(FEEDBACK_PRIORITY_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => handlePriorityChange(selectedFeedback.id, key as FeedbackPriority)}
                          disabled={selectedFeedback.priority === key}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            selectedFeedback.priority === key
                              ? 'opacity-50 cursor-not-allowed'
                              : ''
                          }`}
                          style={{ backgroundColor: `${config.color}20`, color: config.color }}
                        >
                          {config.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 分配给 */}
                  <div className="mb-4">
                    <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>分配给</label>
                    <select
                      value={selectedFeedback.assigned_to || ''}
                      onChange={(e) => handleAssign(selectedFeedback.id, e.target.value)}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border-none outline-none`}
                    >
                      <option value="">未分配</option>
                      {admins.map((admin) => (
                        <option key={admin.id} value={admin.id}>{admin.username}</option>
                      ))}
                    </select>
                  </div>

                  {/* 响应内容 */}
                  <div className="mb-4">
                    <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>处理结果</label>
                    <textarea
                      value={responseForm.content}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, content: e.target.value }))}
                      placeholder="请输入处理结果..."
                      rows={4}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border-none outline-none resize-none`}
                    />
                    <label className="flex items-center gap-2 mt-2 text-sm">
                      <input
                        type="checkbox"
                        checked={responseForm.notifyUser}
                        onChange={(e) => setResponseForm(prev => ({ ...prev, notifyUser: e.target.checked }))}
                        className="rounded"
                      />
                      <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>同时通知用户</span>
                    </label>
                    <button
                      onClick={handleSubmitResponse}
                      disabled={!responseForm.content.trim()}
                      className="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      提交处理结果
                    </button>
                  </div>
                </div>

                {/* 处理历史 */}
                {processLogs.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3 flex items-center gap-2">
                      <History className="w-4 h-4" />
                      处理历史
                    </h3>
                    <div className="space-y-3">
                      {processLogs.map((log) => (
                        <div
                          key={log.id}
                          className={`p-3 rounded-lg text-sm ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span className="font-medium">{log.admin?.username || '系统'}</span>
                            <span className={isDark ? 'text-gray-500' : 'text-gray-400'}>
                              {formatTime(log.created_at)}
                            </span>
                          </div>
                          <p className={isDark ? 'text-gray-400' : 'text-gray-600'}>
                            {log.action === 'created' && '创建了反馈'}
                            {log.action === 'status_change' && `状态变更为：${FEEDBACK_STATUS_CONFIG[log.new_value as FeedbackStatus]?.label || log.new_value}`}
                            {log.action === 'priority_change' && `优先级变更为：${FEEDBACK_PRIORITY_CONFIG[log.new_value as FeedbackPriority]?.label || log.new_value}`}
                            {log.action === 'assign' && `分配给：${admins.find(a => a.id === log.new_value)?.username || log.new_value}`}
                            {log.action === 'respond' && '提交了处理结果'}
                          </p>
                          {log.details?.response_content && (
                            <p className={`mt-2 p-2 rounded ${isDark ? 'bg-gray-600' : 'bg-gray-200'} text-xs`}>
                              {log.details.response_content}
                            </p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
