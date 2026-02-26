import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import {
  getReports,
  getReportById,
  updateReportStatus,
  submitReportResponse,
  getReportStats,
  deleteReport,
  REPORT_TYPE_CONFIG,
  REPORT_STATUS_CONFIG,
  type Report,
  type ReportStatus,
  type ReportType
} from '@/services/reportService';
import {
  Flag,
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Trash2,
  ChevronRight,
  User,
  Calendar,
  MessageSquare,
  Image as ImageIcon,
  ExternalLink,
  MoreHorizontal,
  BarChart3,
  PieChart as PieChartIcon
} from 'lucide-react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip as RechartsTooltip,
  Legend
} from 'recharts';

// 举报类型图标映射
const typeIconMap: Record<string, string> = {
  spam: '💰',
  provocative: '🔥',
  pornographic: '🔞',
  personal_attack: '⚡',
  illegal: '🚨',
  political_rumor: '🏛️',
  social_rumor: '📢',
  false_info: '❌',
  external_link: '🔗',
  other: '📝'
};

// 目标类型标签
const targetTypeLabels: Record<string, string> = {
  feed: '动态',
  comment: '评论',
  user: '用户',
  work: '作品'
};

export default function ReportManagement() {
  const { isDark } = useTheme();
  const { user } = useContext(AuthContext);

  // 状态
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [showDetailPanel, setShowDetailPanel] = useState(false);

  // 筛选状态
  const [filters, setFilters] = useState({
    status: '' as ReportStatus | '',
    type: '' as ReportType | '',
    target_type: '' as string,
    search: ''
  });

  // 统计数据
  const [stats, setStats] = useState({
    total_count: 0,
    pending_count: 0,
    processing_count: 0,
    resolved_count: 0,
    rejected_count: 0,
    today_count: 0,
    type_distribution: {} as Record<ReportType, number>
  });

  // 处理表单
  const [responseForm, setResponseForm] = useState({
    response: '',
    actionTaken: ''
  });

  // 加载数据
  useEffect(() => {
    loadReports();
    loadStats();
  }, [page, filters]);

  const loadReports = async () => {
    setLoading(true);
    try {
      const { reports: data, total: count } = await getReports({
        page,
        limit: 20,
        status: filters.status || undefined,
        type: filters.type || undefined,
        target_type: filters.target_type || undefined,
        search: filters.search || undefined
      });
      setReports(data);
      setTotal(count);
    } catch (error) {
      console.error('加载举报列表失败:', error);
      toast.error('加载举报列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const data = await getReportStats();
      setStats(data);
    } catch (error) {
      console.error('加载统计数据失败:', error);
    }
  };

  // 查看详情
  const handleViewDetail = async (report: Report) => {
    const detail = await getReportById(report.id);
    if (detail) {
      setSelectedReport(detail);
      setShowDetailPanel(true);
      setResponseForm({
        response: detail.admin_response || '',
        actionTaken: detail.action_taken || ''
      });
    }
  };

  // 更新状态
  const handleStatusChange = async (reportId: string, status: ReportStatus) => {
    try {
      const success = await updateReportStatus(reportId, status, user?.id);
      if (success) {
        toast.success(`举报状态已更新为：${REPORT_STATUS_CONFIG[status].label}`);
        loadReports();
        loadStats();
        if (selectedReport?.id === reportId) {
          const updated = await getReportById(reportId);
          if (updated) setSelectedReport(updated);
        }
      } else {
        toast.error('更新状态失败');
      }
    } catch (error) {
      toast.error('更新状态失败');
    }
  };

  // 提交处理结果
  const handleSubmitResponse = async () => {
    if (!selectedReport || !responseForm.response.trim()) {
      toast.error('请输入处理结果');
      return;
    }

    try {
      const success = await submitReportResponse(
        selectedReport.id,
        responseForm.response,
        responseForm.actionTaken,
        user?.id || ''
      );

      if (success) {
        toast.success('处理结果已提交');
        loadReports();
        loadStats();
        const updated = await getReportById(selectedReport.id);
        if (updated) setSelectedReport(updated);
      } else {
        toast.error('提交失败');
      }
    } catch (error) {
      toast.error('提交失败');
    }
  };

  // 删除举报
  const handleDelete = async (reportId: string) => {
    if (!confirm('确定要删除这条举报吗？')) return;

    try {
      const success = await deleteReport(reportId);
      if (success) {
        toast.success('举报已删除');
        loadReports();
        loadStats();
        if (selectedReport?.id === reportId) {
          setSelectedReport(null);
          setShowDetailPanel(false);
        }
      } else {
        toast.error('删除失败');
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

  // 准备图表数据
  const pieChartData = Object.entries(stats.type_distribution).map(([type, count]) => ({
    name: REPORT_TYPE_CONFIG[type as ReportType]?.label || type,
    value: count,
    color: REPORT_TYPE_CONFIG[type as ReportType]?.color || '#6b7280'
  }));

  return (
    <div className="space-y-6">
      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { title: '今日举报', value: stats.today_count, icon: Flag, color: 'blue', trend: '实时' },
          { title: '待处理', value: stats.pending_count, icon: Clock, color: 'yellow', trend: '需关注' },
          { title: '处理中', value: stats.processing_count, icon: AlertTriangle, color: 'purple', trend: '进行中' },
          { title: '已处理', value: stats.resolved_count, icon: CheckCircle, color: 'green', trend: '已完成' },
          { title: '已驳回', value: stats.rejected_count, icon: XCircle, color: 'gray', trend: '无效举报' }
        ].map((stat, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`p-5 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>{stat.title}</p>
                <h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{stat.trend}</p>
              </div>
              <div className={`p-3 rounded-xl bg-${stat.color}-100`}>
                <stat.icon className={`w-5 h-5 text-${stat.color}-600`} />
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* 图表区域 */}
      {pieChartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`p-6 rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}
        >
          <div className="flex items-center gap-2 mb-4">
            <PieChartIcon className="w-5 h-5 text-red-500" />
            <h3 className="text-lg font-bold">举报类型分布</h3>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieChartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={{
                    backgroundColor: isDark ? '#1f2937' : '#ffffff',
                    borderColor: isDark ? '#374151' : '#e5e7eb',
                    borderRadius: '0.5rem',
                    color: isDark ? '#ffffff' : '#000000'
                  }}
                />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* 筛选栏 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md`}>
        <div className="flex flex-wrap gap-4">
          {/* 搜索 */}
          <div className="flex-1 min-w-[200px]">
            <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="搜索举报内容或举报人..."
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
            {Object.entries(REPORT_STATUS_CONFIG).map(([key, config]) => (
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
            {Object.entries(REPORT_TYPE_CONFIG).map(([key, config]) => (
              <option key={key} value={key}>{config.label}</option>
            ))}
          </select>

          {/* 目标类型筛选 */}
          <select
            value={filters.target_type}
            onChange={(e) => setFilters(prev => ({ ...prev, target_type: e.target.value }))}
            className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border-none outline-none`}
          >
            <option value="">全部目标</option>
            {Object.entries(targetTypeLabels).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>

          {/* 重置按钮 */}
          <button
            onClick={() => setFilters({ status: '', type: '', target_type: '', search: '' })}
            className="px-4 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
          >
            重置筛选
          </button>
        </div>
      </div>

      {/* 举报列表 */}
      <div className={`rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-md overflow-hidden`}>
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
          </div>
        ) : reports.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20">
            <Flag className={`w-16 h-16 ${isDark ? 'text-gray-600' : 'text-gray-300'} mb-4`} />
            <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>暂无举报数据</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-700">
            {reports.map((report) => {
              const typeConfig = REPORT_TYPE_CONFIG[report.report_type];
              const statusConfig = REPORT_STATUS_CONFIG[report.status];

              return (
                <motion.div
                  key={report.id}
                  layout
                  onClick={() => handleViewDetail(report)}
                  className={`p-6 cursor-pointer transition-colors ${
                    isDark ? 'hover:bg-gray-700/50' : 'hover:bg-gray-50'
                  } ${selectedReport?.id === report.id ? (isDark ? 'bg-gray-700' : 'bg-gray-100') : ''}`}
                >
                  <div className="flex items-start gap-4">
                    {/* 类型图标 */}
                    <div
                      className="p-3 rounded-xl shrink-0 text-2xl"
                      style={{ backgroundColor: `${typeConfig.color}20` }}
                    >
                      {typeIconMap[report.report_type]}
                    </div>

                    {/* 内容 */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: `${typeConfig.color}20`, color: typeConfig.color }}
                        >
                          {typeConfig.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${statusConfig.bgColor}`} style={{ color: statusConfig.color }}>
                          {statusConfig.label}
                        </span>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${isDark ? 'bg-gray-600 text-gray-300' : 'bg-gray-200 text-gray-600'}`}>
                          {targetTypeLabels[report.target_type]}
                        </span>
                      </div>

                      <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'} line-clamp-2 mb-2`}>
                        {report.description || '无详细描述'}
                      </p>

                      {/* 目标内容预览 */}
                      {report.target_content && (
                        <div className={`p-3 rounded-lg mb-2 text-sm ${isDark ? 'bg-gray-700/50' : 'bg-gray-100'}`}>
                          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} text-xs mb-1`}>被举报内容：</p>
                          <p className="line-clamp-2">{report.target_content.content || report.target_content.title}</p>
                        </div>
                      )}

                      <div className="flex items-center gap-4 text-xs text-gray-500 flex-wrap">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          举报人：{report.reporter?.username || '未知用户'}
                        </span>
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" />
                          被举报人：{report.target_author?.username || '未知用户'}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatTime(report.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* 操作按钮 */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleViewDetail(report);
                        }}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                      >
                        <Eye className="w-4 h-4 text-blue-500" />
                      </button>
                      {report.status !== 'resolved' && report.status !== 'rejected' && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(report.id, report.status === 'pending' ? 'processing' : 'resolved');
                            }}
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                          >
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStatusChange(report.id, 'rejected');
                            }}
                            className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-gray-600' : 'hover:bg-gray-200'}`}
                          >
                            <XCircle className="w-4 h-4 text-gray-500" />
                          </button>
                        </>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDelete(report.id);
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
        {showDetailPanel && selectedReport && (
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
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center text-xl">
                    {typeIconMap[selectedReport.report_type]}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">举报详情</h2>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {REPORT_TYPE_CONFIG[selectedReport.report_type].label} · {targetTypeLabels[selectedReport.target_type]}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowDetailPanel(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* 状态卡片 */}
                <div className={`p-4 rounded-xl ${REPORT_STATUS_CONFIG[selectedReport.status].bgColor}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Flag className="w-5 h-5" style={{ color: REPORT_STATUS_CONFIG[selectedReport.status].color }} />
                      <span className="font-medium" style={{ color: REPORT_STATUS_CONFIG[selectedReport.status].color }}>
                        {REPORT_STATUS_CONFIG[selectedReport.status].label}
                      </span>
                    </div>
                    <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      举报时间：{new Date(selectedReport.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>

                {/* 举报人信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h3 className="font-medium mb-3">举报人</h3>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedReport.reporter?.avatar_url || `https://ui-avatars.com/api/?name=${selectedReport.reporter?.username || '匿名'}&background=random`}
                      alt={selectedReport.reporter?.username}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{selectedReport.reporter?.username || '未知用户'}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        ID: {selectedReport.reporter_id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 被举报人信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h3 className="font-medium mb-3">被举报人</h3>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedReport.target_author?.avatar_url || `https://ui-avatars.com/api/?name=${selectedReport.target_author?.username || '匿名'}&background=random`}
                      alt={selectedReport.target_author?.username}
                      className="w-12 h-12 rounded-full"
                    />
                    <div>
                      <p className="font-medium">{selectedReport.target_author?.username || '未知用户'}</p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        ID: {selectedReport.target_author_id}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 举报理由 */}
                <div>
                  <h3 className="font-medium mb-3">举报理由</h3>
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{typeIconMap[selectedReport.report_type]}</span>
                      <span className="font-medium">{REPORT_TYPE_CONFIG[selectedReport.report_type].label}</span>
                    </div>
                    {REPORT_TYPE_CONFIG[selectedReport.report_type].description && (
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {REPORT_TYPE_CONFIG[selectedReport.report_type].description}
                      </p>
                    )}
                  </div>
                </div>

                {/* 详细描述 */}
                {selectedReport.description && (
                  <div>
                    <h3 className="font-medium mb-3">详细描述</h3>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <p className={`whitespace-pre-wrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                        {selectedReport.description}
                      </p>
                    </div>
                  </div>
                )}

                {/* 被举报内容 */}
                {selectedReport.target_content && (
                  <div>
                    <h3 className="font-medium mb-3">被举报内容</h3>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      {selectedReport.target_content.title && (
                        <p className="font-medium mb-2">{selectedReport.target_content.title}</p>
                      )}
                      <p className={`${isDark ? 'text-gray-300' : 'text-gray-700'} mb-3`}>
                        {selectedReport.target_content.content}
                      </p>
                      {selectedReport.target_content.media_urls && selectedReport.target_content.media_urls.length > 0 && (
                        <div className="grid grid-cols-3 gap-2">
                          {selectedReport.target_content.media_urls.slice(0, 3).map((url, index) => (
                            <img
                              key={index}
                              src={url}
                              alt={`图片 ${index + 1}`}
                              className="w-full h-20 object-cover rounded-lg"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 处理区域 */}
                <div className={`p-4 rounded-xl border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <h3 className="font-medium mb-4">处理操作</h3>

                  {/* 状态操作 */}
                  <div className="mb-4">
                    <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>更新状态</label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(REPORT_STATUS_CONFIG).map(([key, config]) => (
                        <button
                          key={key}
                          onClick={() => handleStatusChange(selectedReport.id, key as ReportStatus)}
                          disabled={selectedReport.status === key}
                          className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                            selectedReport.status === key
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

                  {/* 处理结果 */}
                  <div className="mb-4">
                    <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>处理措施</label>
                    <select
                      value={responseForm.actionTaken}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, actionTaken: e.target.value }))}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border-none outline-none mb-3`}
                    >
                      <option value="">选择处理措施</option>
                      <option value="none">暂不处理</option>
                      <option value="warn">警告用户</option>
                      <option value="delete_content">删除内容</option>
                      <option value="ban_user">封禁用户</option>
                      <option value="ban_temp">临时封禁</option>
                    </select>

                    <label className={`block text-sm mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>处理说明</label>
                    <textarea
                      value={responseForm.response}
                      onChange={(e) => setResponseForm(prev => ({ ...prev, response: e.target.value }))}
                      placeholder="请输入处理说明..."
                      rows={4}
                      className={`w-full px-3 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700' : 'bg-gray-100'} border-none outline-none resize-none`}
                    />
                    <button
                      onClick={handleSubmitResponse}
                      disabled={!responseForm.response.trim()}
                      className="mt-3 w-full py-2 bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg text-sm transition-colors"
                    >
                      提交处理结果
                    </button>
                  </div>
                </div>

                {/* 处理历史 */}
                {selectedReport.admin_response && (
                  <div>
                    <h3 className="font-medium mb-3">处理记录</h3>
                    <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>处理人：</span>
                        <span>{selectedReport.admin?.username || '管理员'}</span>
                      </div>
                      <div className="flex items-center gap-2 mb-2">
                        <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>处理时间：</span>
                        <span>{selectedReport.resolved_at ? new Date(selectedReport.resolved_at).toLocaleString() : '-'}</span>
                      </div>
                      {selectedReport.action_taken && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>处理措施：</span>
                          <span>{
                            selectedReport.action_taken === 'none' ? '暂不处理' :
                            selectedReport.action_taken === 'warn' ? '警告用户' :
                            selectedReport.action_taken === 'delete_content' ? '删除内容' :
                            selectedReport.action_taken === 'ban_user' ? '封禁用户' :
                            selectedReport.action_taken === 'ban_temp' ? '临时封禁' :
                            selectedReport.action_taken
                          }</span>
                        </div>
                      )}
                      <div className="mt-3 p-3 rounded-lg bg-gray-600/20">
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {selectedReport.admin_response}
                        </p>
                      </div>
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
