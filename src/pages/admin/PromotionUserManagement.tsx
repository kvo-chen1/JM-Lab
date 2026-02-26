import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import { 
  Users, 
  UserCheck, 
  UserX, 
  Clock, 
  Search, 
  Filter, 
  Eye, 
  CheckCircle, 
  XCircle, 
  History,
  TrendingUp,
  DollarSign,
  BarChart3,
  MoreHorizontal,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Download,
  FileText,
  Phone,
  Mail,
  Building2,
  Link as LinkIcon,
  Award
} from 'lucide-react';
import { 
  promotionUserService, 
  type PromotionApplication, 
  type PromotionAuditLog,
  type PromotionStats 
} from '@/services/promotionUserService';
import { supabaseAdmin } from '@/lib/supabaseClient';

// 申请状态配置
const statusConfig = {
  pending: { label: '待审核', color: 'yellow', icon: Clock },
  reviewing: { label: '审核中', color: 'blue', icon: Eye },
  approved: { label: '已通过', color: 'green', icon: CheckCircle },
  rejected: { label: '已驳回', color: 'red', icon: XCircle },
  suspended: { label: '已暂停', color: 'gray', icon: UserX },
};

// 申请类型配置
const typeConfig = {
  individual: { label: '个人', color: 'blue' },
  business: { label: '企业', color: 'purple' },
  creator: { label: '创作者', color: 'pink' },
  brand: { label: '品牌方', color: 'orange' },
};

export default function PromotionUserManagement() {
  const { isDark } = useTheme();
  
  // 数据状态
  const [applications, setApplications] = useState<PromotionApplication[]>([]);
  const [stats, setStats] = useState<PromotionStats>({
    totalApplications: 0,
    pendingCount: 0,
    approvedCount: 0,
    rejectedCount: 0,
    suspendedCount: 0,
    todayNewCount: 0,
    totalSpent: 0,
    totalOrders: 0,
  });
  const [auditLogs, setAuditLogs] = useState<PromotionAuditLog[]>([]);
  
  // UI状态
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<PromotionApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [showLogsModal, setShowLogsModal] = useState(false);
  const [auditAction, setAuditAction] = useState<'approve' | 'reject'>('approve');
  const [auditNotes, setAuditNotes] = useState('');
  const [auditReason, setAuditReason] = useState('');
  const [processing, setProcessing] = useState(false);
  
  // 筛选状态
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateRange, setDateRange] = useState<{ start?: string; end?: string }>({});
  const [sortBy, setSortBy] = useState<'created_at' | 'reviewed_at'>('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  
  // 分页状态
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // 获取数据
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [appsResult, statsResult] = await Promise.all([
        promotionUserService.getApplications({
          status: statusFilter === 'all' ? undefined : statusFilter,
          type: typeFilter === 'all' ? undefined : typeFilter,
          search: searchQuery || undefined,
          startDate: dateRange.start,
          endDate: dateRange.end,
          sortBy,
          sortOrder,
          page: currentPage,
          limit: pageSize,
        }),
        promotionUserService.getStats(),
      ]);
      
      setApplications(appsResult.applications);
      setTotalCount(appsResult.total);
      setStats(statsResult);
    } catch (error) {
      console.error('获取推广用户数据失败:', error);
      toast.error('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  }, [statusFilter, typeFilter, searchQuery, dateRange, sortBy, sortOrder, currentPage, pageSize]);

  // 初始加载
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // 获取审核记录
  const fetchAuditLogs = async (applicationId: string) => {
    try {
      const logs = await promotionUserService.getAuditLogs(applicationId);
      setAuditLogs(logs);
    } catch (error) {
      console.error('获取审核记录失败:', error);
      toast.error('获取审核记录失败');
    }
  };

  // 处理审核
  const handleAudit = async () => {
    if (!selectedApplication) return;
    
    if (auditAction === 'reject' && !auditReason.trim()) {
      toast.error('请填写驳回原因');
      return;
    }
    
    setProcessing(true);
    try {
      const success = await promotionUserService.auditApplication({
        applicationId: selectedApplication.id,
        action: auditAction,
        notes: auditNotes,
        reason: auditReason,
      });
      
      if (success) {
        toast.success(auditAction === 'approve' ? '审核通过' : '已驳回申请');
        setShowAuditModal(false);
        setAuditNotes('');
        setAuditReason('');
        fetchData();
      } else {
        toast.error('审核操作失败');
      }
    } catch (error) {
      console.error('审核失败:', error);
      toast.error('审核操作失败，请重试');
    } finally {
      setProcessing(false);
    }
  };

  // 导出数据
  const handleExport = async () => {
    try {
      const data = await promotionUserService.exportApplications({
        status: statusFilter === 'all' ? undefined : statusFilter,
        type: typeFilter === 'all' ? undefined : typeFilter,
      });
      
      const csv = promotionUserService.convertToCSV(data);
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `推广用户申请_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();
      
      toast.success('导出成功');
    } catch (error) {
      console.error('导出失败:', error);
      toast.error('导出失败');
    }
  };

  // 打开详情弹窗
  const openDetailModal = (app: PromotionApplication) => {
    setSelectedApplication(app);
    setShowDetailModal(true);
  };

  // 打开审核弹窗
  const openAuditModal = (app: PromotionApplication, action: 'approve' | 'reject') => {
    setSelectedApplication(app);
    setAuditAction(action);
    setAuditNotes('');
    setAuditReason('');
    setShowAuditModal(true);
  };

  // 打开审核记录弹窗
  const openLogsModal = async (app: PromotionApplication) => {
    setSelectedApplication(app);
    await fetchAuditLogs(app.id);
    setShowLogsModal(true);
  };

  // 统计卡片数据
  const statCards = [
    { 
      title: '总申请数', 
      value: stats.totalApplications, 
      icon: Users, 
      color: 'blue',
      trend: `+${stats.todayNewCount} 今日新增`
    },
    { 
      title: '待审核', 
      value: stats.pendingCount, 
      icon: Clock, 
      color: 'yellow',
      trend: '需要处理'
    },
    { 
      title: '已通过', 
      value: stats.approvedCount, 
      icon: UserCheck, 
      color: 'green',
      trend: '正常使用中'
    },
    { 
      title: '已驳回', 
      value: stats.rejectedCount, 
      icon: UserX, 
      color: 'red',
      trend: '申请未通过'
    },
    { 
      title: '累计消费', 
      value: `¥${stats.totalSpent.toLocaleString()}`, 
      icon: DollarSign, 
      color: 'purple',
      trend: `${stats.totalOrders} 笔订单`
    },
    { 
      title: '已暂停', 
      value: stats.suspendedCount, 
      icon: Award, 
      color: 'gray',
      trend: '账号暂停中'
    },
  ];

  // 过滤后的数据
  const filteredApplications = applications;

  // 总页数
  const totalPages = Math.ceil(totalCount / pageSize);

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">推广用户管理</h1>
          <p className={`mt-1 text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            管理推广用户申请、审核和权限配置
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <Download className="w-4 h-4" />
            导出数据
          </button>
          <button
            onClick={fetchData}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${
              isDark 
                ? 'bg-gray-700 hover:bg-gray-600 text-white' 
                : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
            }`}
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((stat, index) => (
          <motion.div
            key={stat.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div className={`p-2 rounded-lg bg-${stat.color}-100 text-${stat.color}-600`}>
                <stat.icon className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <p className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {stat.value}
              </p>
              <p className={`text-xs mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                {stat.title}
              </p>
            </div>
            <p className={`text-xs mt-2 text-${stat.color}-500`}>
              {stat.trend}
            </p>
          </motion.div>
        ))}
      </div>

      {/* 筛选栏 */}
      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-wrap items-center gap-4">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[200px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
            <input
              type="text"
              placeholder="搜索用户名、手机号、公司名..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full pl-10 pr-4 py-2 rounded-lg border transition-colors ${
                isDark 
                  ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                  : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
              } focus:outline-none focus:ring-2 focus:ring-red-500`}
            />
          </div>

          {/* 状态筛选 */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
          >
            <option value="all">全部状态</option>
            <option value="pending">待审核</option>
            <option value="reviewing">审核中</option>
            <option value="approved">已通过</option>
            <option value="rejected">已驳回</option>
            <option value="suspended">已暂停</option>
          </select>

          {/* 类型筛选 */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
          >
            <option value="all">全部类型</option>
            <option value="individual">个人</option>
            <option value="business">企业</option>
            <option value="creator">创作者</option>
            <option value="brand">品牌方</option>
          </select>

          {/* 日期范围 */}
          <input
            type="date"
            value={dateRange.start || ''}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
          />
          <span className={isDark ? 'text-gray-400' : 'text-gray-500'}>至</span>
          <input
            type="date"
            value={dateRange.end || ''}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
          />

          {/* 排序 */}
          <select
            value={`${sortBy}-${sortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              setSortBy(field as 'created_at' | 'reviewed_at');
              setSortOrder(order as 'asc' | 'desc');
            }}
            className={`px-4 py-2 rounded-lg border transition-colors ${
              isDark 
                ? 'bg-gray-700 border-gray-600 text-white' 
                : 'bg-white border-gray-300 text-gray-900'
            } focus:outline-none focus:ring-2 focus:ring-red-500`}
          >
            <option value="created_at-desc">申请时间 ↓</option>
            <option value="created_at-asc">申请时间 ↑</option>
            <option value="reviewed_at-desc">审核时间 ↓</option>
            <option value="reviewed_at-asc">审核时间 ↑</option>
          </select>
        </div>
      </div>

      {/* 数据表格 */}
      <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm overflow-hidden`}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className={`${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                <th className="px-4 py-3 text-left text-sm font-medium">申请人</th>
                <th className="px-4 py-3 text-left text-sm font-medium">类型</th>
                <th className="px-4 py-3 text-left text-sm font-medium">联系信息</th>
                <th className="px-4 py-3 text-left text-sm font-medium">推广渠道</th>
                <th className="px-4 py-3 text-left text-sm font-medium">预期预算</th>
                <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
                <th className="px-4 py-3 text-left text-sm font-medium">申请时间</th>
                <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {loading ? (
                // 加载状态
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td colSpan={8} className="px-4 py-4">
                      <div className={`h-12 rounded animate-pulse ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`} />
                    </td>
                  </tr>
                ))
              ) : filteredApplications.length === 0 ? (
                // 空状态
                <tr>
                  <td colSpan={8} className="px-4 py-12 text-center">
                    <div className={`${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                      <p>暂无数据</p>
                    </div>
                  </td>
                </tr>
              ) : (
                // 数据列表
                filteredApplications.map((app) => {
                  const status = statusConfig[app.status];
                  const type = typeConfig[app.application_type];
                  const StatusIcon = status.icon;
                  
                  return (
                    <tr 
                      key={app.id} 
                      className={`hover:${isDark ? 'bg-gray-700/30' : 'bg-gray-50/50'} transition-colors`}
                    >
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={app.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${app.user_username}`}
                            alt={app.user_username}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                          <div>
                            <p className="font-medium text-sm">{app.user_username}</p>
                            <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              {app.user_email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-1 rounded-full text-xs bg-${type.color}-100 text-${type.color}-600`}>
                          {type.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-sm">
                          <p>{app.contact_name}</p>
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {app.contact_phone}
                          </p>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {app.promotion_channels?.slice(0, 3).map((channel: string, idx: number) => (
                            <span 
                              key={idx}
                              className={`px-2 py-0.5 rounded text-xs ${
                                isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              {channel}
                            </span>
                          ))}
                          {app.promotion_channels?.length > 3 && (
                            <span className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                              +{app.promotion_channels.length - 3}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <p className="text-sm font-medium">
                          ¥{app.expected_monthly_budget?.toLocaleString() || '-'}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs bg-${status.color}-100 text-${status.color}-600`}>
                          <StatusIcon className="w-3 h-3" />
                          {status.label}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                          {new Date(app.created_at).toLocaleDateString()}
                        </p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {new Date(app.created_at).toLocaleTimeString()}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => openDetailModal(app)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                            title="查看详情"
                          >
                            <Eye className="w-4 h-4 text-blue-500" />
                          </button>
                          
                          {app.status === 'pending' && (
                            <>
                              <button
                                onClick={() => openAuditModal(app, 'approve')}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                }`}
                                title="通过"
                              >
                                <CheckCircle className="w-4 h-4 text-green-500" />
                              </button>
                              <button
                                onClick={() => openAuditModal(app, 'reject')}
                                className={`p-1.5 rounded-lg transition-colors ${
                                  isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                                }`}
                                title="驳回"
                              >
                                <XCircle className="w-4 h-4 text-red-500" />
                              </button>
                            </>
                          )}
                          
                          <button
                            onClick={() => openLogsModal(app)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                            }`}
                            title="审核记录"
                          >
                            <History className="w-4 h-4 text-purple-500" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* 分页 */}
        <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              共 {totalCount} 条记录，第 {currentPage}/{totalPages || 1} 页
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === 1 
                    ? 'opacity-50 cursor-not-allowed' 
                    : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                const page = i + 1;
                return (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page)}
                    className={`w-8 h-8 rounded-lg text-sm transition-colors ${
                      currentPage === page
                        ? 'bg-red-600 text-white'
                        : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages || totalPages === 0}
                className={`p-2 rounded-lg transition-colors ${
                  currentPage === totalPages || totalPages === 0
                    ? 'opacity-50 cursor-not-allowed' 
                    : isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {showDetailModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } shadow-xl`}
            >
              {/* 弹窗头部 */}
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h3 className="text-xl font-bold">申请详情</h3>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              {/* 弹窗内容 */}
              <div className="p-6 space-y-6">
                {/* 申请人信息 */}
                <div className="flex items-start gap-4">
                  <img
                    src={selectedApplication.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedApplication.user_username}`}
                    alt={selectedApplication.user_username}
                    className="w-20 h-20 rounded-full object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="text-lg font-semibold">{selectedApplication.user_username}</h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs bg-${typeConfig[selectedApplication.application_type].color}-100 text-${typeConfig[selectedApplication.application_type].color}-600`}>
                        {typeConfig[selectedApplication.application_type].label}
                      </span>
                      {(() => {
                        const StatusIcon = statusConfig[selectedApplication.status].icon;
                        return (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-${statusConfig[selectedApplication.status].color}-100 text-${statusConfig[selectedApplication.status].color}-600`}>
                            <StatusIcon className="w-3 h-3" />
                            {statusConfig[selectedApplication.status].label}
                          </span>
                        );
                      })()}
                    </div>
                    <p className={`mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {selectedApplication.user_email}
                    </p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      申请时间：{new Date(selectedApplication.created_at).toLocaleString()}
                    </p>
                  </div>
                </div>

                {/* 联系信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h5 className="font-medium mb-3 flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    联系信息
                  </h5>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>联系人</p>
                      <p className="font-medium">{selectedApplication.contact_name}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>联系电话</p>
                      <p className="font-medium">{selectedApplication.contact_phone || '-'}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>联系邮箱</p>
                      <p className="font-medium">{selectedApplication.contact_email || '-'}</p>
                    </div>
                  </div>
                </div>

                {/* 公司信息（如果有） */}
                {selectedApplication.company_name && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <Building2 className="w-4 h-4" />
                      公司信息
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>公司名称</p>
                        <p className="font-medium">{selectedApplication.company_name}</p>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>公司地址</p>
                        <p className="font-medium">{selectedApplication.company_address || '-'}</p>
                      </div>
                    </div>
                    {selectedApplication.business_license && (
                      <div className="mt-3">
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>营业执照</p>
                        <img
                          src={selectedApplication.business_license}
                          alt="营业执照"
                          className="mt-2 max-w-xs rounded-lg border"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* 推广信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                  <h5 className="font-medium mb-3 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4" />
                    推广信息
                  </h5>
                  <div className="space-y-3">
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>推广渠道</p>
                      <div className="flex flex-wrap gap-2 mt-1">
                        {selectedApplication.promotion_channels?.map((channel: string, idx: number) => (
                          <span
                            key={idx}
                            className={`px-3 py-1 rounded-full text-sm ${
                              isDark ? 'bg-gray-600 text-gray-200' : 'bg-white text-gray-700 border'
                            }`}
                          >
                            {channel}
                          </span>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>推广经验</p>
                      <p className="mt-1 text-sm">{selectedApplication.promotion_experience || '未填写'}</p>
                    </div>
                    <div>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>预期月预算</p>
                      <p className="mt-1 text-lg font-semibold text-red-500">
                        ¥{selectedApplication.expected_monthly_budget?.toLocaleString() || '-'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 社交媒体账号 */}
                {selectedApplication.social_accounts && selectedApplication.social_accounts.length > 0 && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <LinkIcon className="w-4 h-4" />
                      社交媒体账号
                    </h5>
                    <div className="space-y-2">
                      {selectedApplication.social_accounts.map((account: any, idx: number) => (
                        <div key={idx} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className={`px-2 py-0.5 rounded text-xs ${
                              isDark ? 'bg-gray-600' : 'bg-gray-200'
                            }`}>
                              {account.platform}
                            </span>
                            <span>{account.account}</span>
                          </div>
                          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                            {account.followers?.toLocaleString()} 粉丝
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 审核信息 */}
                {selectedApplication.reviewed_at && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      审核信息
                    </h5>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>审核人</p>
                        <div className="flex items-center gap-2 mt-1">
                          <img
                            src={selectedApplication.reviewer_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedApplication.reviewer_username}`}
                            alt={selectedApplication.reviewer_username}
                            className="w-6 h-6 rounded-full"
                          />
                          <span className="font-medium">{selectedApplication.reviewer_username}</span>
                        </div>
                      </div>
                      <div>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>审核时间</p>
                        <p className="font-medium">{new Date(selectedApplication.reviewed_at).toLocaleString()}</p>
                      </div>
                      {selectedApplication.review_notes && (
                        <div className="col-span-2">
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>审核备注</p>
                          <p className="mt-1">{selectedApplication.review_notes}</p>
                        </div>
                      )}
                      {selectedApplication.rejection_reason && (
                        <div className="col-span-2">
                          <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>驳回原因</p>
                          <p className="mt-1 text-red-500">{selectedApplication.rejection_reason}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* 推广统计 */}
                {selectedApplication.status === 'approved' && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}>
                    <h5 className="font-medium mb-3 flex items-center gap-2">
                      <BarChart3 className="w-4 h-4" />
                      推广统计
                    </h5>
                    <div className="grid grid-cols-4 gap-4">
                      <div className="text-center">
                        <p className="text-2xl font-bold">{selectedApplication.total_orders || 0}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总订单</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">¥{(selectedApplication.total_spent || 0).toLocaleString()}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总消费</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{(selectedApplication.total_views || 0).toLocaleString()}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>总曝光</p>
                      </div>
                      <div className="text-center">
                        <p className="text-2xl font-bold">{selectedApplication.total_conversions || 0}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>转化数</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* 弹窗底部 */}
              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`px-4 py-2 rounded-lg ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  关闭
                </button>
                {selectedApplication.status === 'pending' && (
                  <>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        openAuditModal(selectedApplication, 'reject');
                      }}
                      className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
                    >
                      驳回
                    </button>
                    <button
                      onClick={() => {
                        setShowDetailModal(false);
                        openAuditModal(selectedApplication, 'approve');
                      }}
                      className="px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white"
                    >
                      通过
                    </button>
                  </>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 审核弹窗 */}
      <AnimatePresence>
        {showAuditModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-lg rounded-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-xl font-bold">
                  {auditAction === 'approve' ? '通过申请' : '驳回申请'}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                  <img
                    src={selectedApplication.user_avatar || `https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedApplication.user_username}`}
                    alt={selectedApplication.user_username}
                    className="w-12 h-12 rounded-full"
                  />
                  <div>
                    <p className="font-medium">{selectedApplication.user_username}</p>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                      {typeConfig[selectedApplication.application_type].label}申请
                    </p>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    审核备注
                  </label>
                  <textarea
                    value={auditNotes}
                    onChange={(e) => setAuditNotes(e.target.value)}
                    placeholder="可选：添加审核备注..."
                    rows={3}
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      isDark 
                        ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                        : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                    } focus:outline-none focus:ring-2 focus:ring-red-500`}
                  />
                </div>

                {auditAction === 'reject' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      驳回原因 <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={auditReason}
                      onChange={(e) => setAuditReason(e.target.value)}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors mb-2 ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white' 
                          : 'bg-white border-gray-300 text-gray-900'
                      } focus:outline-none focus:ring-2 focus:ring-red-500`}
                    >
                      <option value="">选择驳回原因...</option>
                      <option value="资料不完整">资料不完整</option>
                      <option value="不符合推广用户要求">不符合推广用户要求</option>
                      <option value="推广渠道不符合规范">推广渠道不符合规范</option>
                      <option value="存在违规记录">存在违规记录</option>
                      <option value="其他原因">其他原因</option>
                    </select>
                    <textarea
                      value={auditReason}
                      onChange={(e) => setAuditReason(e.target.value)}
                      placeholder="请详细说明驳回原因..."
                      rows={3}
                      className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                        isDark 
                          ? 'bg-gray-700 border-gray-600 text-white placeholder-gray-400' 
                          : 'bg-white border-gray-300 text-gray-900 placeholder-gray-500'
                      } focus:outline-none focus:ring-2 focus:ring-red-500`}
                    />
                  </div>
                )}
              </div>

              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => setShowAuditModal(false)}
                  disabled={processing}
                  className={`px-4 py-2 rounded-lg ${
                    isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={handleAudit}
                  disabled={processing}
                  className={`px-4 py-2 rounded-lg text-white ${
                    auditAction === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } ${processing ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  {processing ? '处理中...' : auditAction === 'approve' ? '确认通过' : '确认驳回'}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 审核记录弹窗 */}
      <AnimatePresence>
        {showLogsModal && selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={`w-full max-w-2xl max-h-[80vh] overflow-y-auto rounded-2xl ${
                isDark ? 'bg-gray-800' : 'bg-white'
              } shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h3 className="text-xl font-bold">审核记录</h3>
                <button
                  onClick={() => setShowLogsModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <XCircle className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6">
                {auditLogs.length === 0 ? (
                  <div className="text-center py-8">
                    <History className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>暂无审核记录</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {auditLogs.map((log, index) => (
                      <div
                        key={log.id}
                        className={`p-4 rounded-xl ${isDark ? 'bg-gray-700/50' : 'bg-gray-50'}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-full ${
                              log.action === 'approve' ? 'bg-green-100 text-green-600' :
                              log.action === 'reject' ? 'bg-red-100 text-red-600' :
                              'bg-blue-100 text-blue-600'
                            }`}>
                              {log.action === 'approve' ? <CheckCircle className="w-4 h-4" /> :
                               log.action === 'reject' ? <XCircle className="w-4 h-4" /> :
                               <History className="w-4 h-4" />}
                            </div>
                            <div>
                              <p className="font-medium">
                                {log.action === 'approve' ? '通过申请' :
                                 log.action === 'reject' ? '驳回申请' :
                                 log.action === 'submit' ? '提交申请' :
                                 log.action === 'review' ? '开始审核' :
                                 log.action === 'suspend' ? '暂停账号' :
                                 '更新信息'}
                              </p>
                              <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                                {new Date(log.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                          {log.previous_status && log.new_status && (
                            <div className="flex items-center gap-2 text-sm">
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                isDark ? 'bg-gray-600' : 'bg-gray-200'
                              }`}>
                                {statusConfig[log.previous_status as keyof typeof statusConfig]?.label || log.previous_status}
                              </span>
                              <span>→</span>
                              <span className={`px-2 py-0.5 rounded text-xs ${
                                isDark ? 'bg-gray-600' : 'bg-gray-200'
                              }`}>
                                {statusConfig[log.new_status as keyof typeof statusConfig]?.label || log.new_status}
                              </span>
                            </div>
                          )}
                        </div>
                        {log.notes && (
                          <div className="mt-3 pl-11">
                            <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                              备注：{log.notes}
                            </p>
                          </div>
                        )}
                        {log.reason && (
                          <div className="mt-2 pl-11">
                            <p className="text-sm text-red-500">
                              原因：{log.reason}
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
