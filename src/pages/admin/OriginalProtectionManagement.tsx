import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { toast } from 'sonner';
import {
  Shield,
  FileText,
  Clock,
  CheckCircle2,
  XCircle,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  User,
  Download,
  Send,
  X,
  Check,
  FileUp,
  Link as LinkIcon,
  ExternalLink
} from 'lucide-react';

// 举报状态类型
 type ReportStatus = 'pending' | 'processing' | 'resolved' | 'rejected';

// 举报数据类型
interface Report {
  id: string;
  reporterId: string;
  reporterName: string;
  reporterAvatar?: string;
  type: string;
  typeLabel: string;
  targetContent: string;
  targetLinks: string[];
  description: string;
  evidence: string[];
  status: ReportStatus;
  identity: 'self' | 'other';
  subjectType: 'personal' | 'organization';
  createdAt: string;
  updatedAt: string;
  processedBy?: string;
  processNote?: string;
  processResult?: string;
  notificationSent: boolean;
}

// 模拟举报数据
const mockReports: Report[] = [
  {
    id: 'REP-20260227001',
    reporterId: 'user-001',
    reporterName: '张三',
    reporterAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1',
    type: 'plagiarism',
    typeLabel: '搬运/抄袭/洗稿',
    targetContent: '用户"李四"发布的视频《天津美食探店》',
    targetLinks: ['https://example.com/video/123', 'https://example.com/video/124'],
    description: '该用户发布的视频内容完全抄袭我的原创作品，包括文案、拍摄角度和剪辑节奏，严重侵犯了我的著作权。',
    evidence: ['evidence-001.jpg', 'evidence-002.pdf'],
    status: 'pending',
    identity: 'self',
    subjectType: 'personal',
    createdAt: '2026-02-27 10:30:00',
    updatedAt: '2026-02-27 10:30:00',
    notificationSent: false
  },
  {
    id: 'REP-20260226002',
    reporterId: 'user-002',
    reporterName: '王五',
    reporterAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2',
    type: 'portrait',
    typeLabel: '曝光肖像',
    targetContent: '用户"赵六"发布的视频《街头采访》',
    targetLinks: ['https://example.com/video/456'],
    description: '该视频在未经我同意的情况下使用了我的肖像，并且对我的形象进行了丑化处理。',
    evidence: ['evidence-003.jpg'],
    status: 'processing',
    identity: 'self',
    subjectType: 'personal',
    createdAt: '2026-02-26 15:20:00',
    updatedAt: '2026-02-27 09:00:00',
    processedBy: '管理员A',
    notificationSent: false
  },
  {
    id: 'REP-20260225003',
    reporterId: 'user-003',
    reporterName: '企业官方',
    reporterAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3',
    type: 'trademark',
    typeLabel: '假冒商标',
    targetContent: '用户"假冒商家"发布的商品《品牌正品》',
    targetLinks: ['https://example.com/product/789'],
    description: '该商家未经授权使用我司注册商标进行商品销售，涉嫌商标侵权。',
    evidence: ['evidence-004.pdf', 'evidence-005.jpg', 'evidence-006.pdf'],
    status: 'resolved',
    identity: 'self',
    subjectType: 'organization',
    createdAt: '2026-02-25 08:00:00',
    updatedAt: '2026-02-26 14:30:00',
    processedBy: '管理员B',
    processNote: '经核实，该商家确实存在商标侵权行为，已下架相关商品并对账号进行处罚。',
    processResult: 'content_removed',
    notificationSent: true
  },
  {
    id: 'REP-20260224004',
    reporterId: 'user-004',
    reporterName: '李四',
    type: 'reputation',
    typeLabel: '损害个人名誉',
    targetContent: '用户"恶意用户"发布的文章《揭秘某某》',
    targetLinks: ['https://example.com/article/101'],
    description: '该文章含有大量不实信息，恶意诽谤我的个人名誉，给我造成了严重的精神损害。',
    evidence: ['evidence-007.jpg'],
    status: 'rejected',
    identity: 'self',
    subjectType: 'personal',
    createdAt: '2026-02-24 20:00:00',
    updatedAt: '2026-02-25 10:00:00',
    processedBy: '管理员A',
    processNote: '经审核，被举报内容属于客观事实陈述，不构成名誉侵权。',
    processResult: 'no_violation',
    notificationSent: true
  }
];

// 举报类型配置
const reportTypeConfig: Record<string, { label: string; color: string; bgColor: string }> = {
  portrait: { label: '曝光肖像', color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20' },
  privacy: { label: '泄露隐私', color: 'text-purple-500', bgColor: 'bg-purple-50 dark:bg-purple-900/20' },
  impersonation: { label: '冒充身份', color: 'text-orange-500', bgColor: 'bg-orange-50 dark:bg-orange-900/20' },
  reputation: { label: '损害名誉', color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20' },
  business: { label: '损害企业名誉', color: 'text-rose-500', bgColor: 'bg-rose-50 dark:bg-rose-900/20' },
  plagiarism: { label: '搬运/抄袭', color: 'text-amber-500', bgColor: 'bg-amber-50 dark:bg-amber-900/20' },
  trademark: { label: '假冒商标', color: 'text-indigo-500', bgColor: 'bg-indigo-50 dark:bg-indigo-900/20' },
  patent: { label: '假冒专利', color: 'text-cyan-500', bgColor: 'bg-cyan-50 dark:bg-cyan-900/20' }
};

// 状态配置
const statusConfig: Record<ReportStatus, { label: string; color: string; bgColor: string; icon: any }> = {
  pending: { label: '待处理', color: 'text-yellow-500', bgColor: 'bg-yellow-50 dark:bg-yellow-900/20', icon: Clock },
  processing: { label: '处理中', color: 'text-blue-500', bgColor: 'bg-blue-50 dark:bg-blue-900/20', icon: FileText },
  resolved: { label: '已解决', color: 'text-green-500', bgColor: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle2 },
  rejected: { label: '已驳回', color: 'text-red-500', bgColor: 'bg-red-50 dark:bg-red-900/20', icon: XCircle }
};

// 处理结果选项
const processResults = [
  { value: 'content_removed', label: '已删除内容' },
  { value: 'account_suspended', label: '已封禁账号' },
  { value: 'content_restricted', label: '已限制内容' },
  { value: 'warning_issued', label: '已发出警告' },
  { value: 'no_violation', label: '无违规' },
  { value: 'other', label: '其他处理' }
];

export default function OriginalProtectionManagement() {
  const { isDark } = useTheme();
  const [reports, setReports] = useState<Report[]>(mockReports);
  const [filteredReports, setFilteredReports] = useState<Report[]>(mockReports);
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ReportStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processForm, setProcessForm] = useState({
    status: '' as ReportStatus,
    note: '',
    result: '',
    sendNotification: true
  });
  const itemsPerPage = 10;

  // 筛选和搜索
  useEffect(() => {
    let filtered = reports;

    // 状态筛选
    if (statusFilter !== 'all') {
      filtered = filtered.filter(r => r.status === statusFilter);
    }

    // 类型筛选
    if (typeFilter !== 'all') {
      filtered = filtered.filter(r => r.type === typeFilter);
    }

    // 搜索
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(r =>
        r.id.toLowerCase().includes(query) ||
        r.reporterName.toLowerCase().includes(query) ||
        r.targetContent.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query)
      );
    }

    setFilteredReports(filtered);
    setCurrentPage(1);
  }, [reports, statusFilter, typeFilter, searchQuery]);

  // 分页
  const totalPages = Math.ceil(filteredReports.length / itemsPerPage);
  const paginatedReports = filteredReports.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // 打开详情弹窗
  const openDetailModal = (report: Report) => {
    setSelectedReport(report);
    setShowDetailModal(true);
  };

  // 打开处理弹窗
  const openProcessModal = (report: Report) => {
    setSelectedReport(report);
    setProcessForm({
      status: report.status === 'pending' ? 'processing' : report.status,
      note: report.processNote || '',
      result: report.processResult || '',
      sendNotification: true
    });
    setShowProcessModal(true);
  };

  // 提交处理
  const handleProcessSubmit = () => {
    if (!selectedReport) return;
    if (!processForm.status) {
      toast.error('请选择处理状态');
      return;
    }
    if (!processForm.note.trim()) {
      toast.error('请填写处理说明');
      return;
    }

    const updatedReports = reports.map(r => {
      if (r.id === selectedReport.id) {
        return {
          ...r,
          status: processForm.status,
          processNote: processForm.note,
          processResult: processForm.result,
          processedBy: '当前管理员',
          updatedAt: new Date().toISOString().replace('T', ' ').substring(0, 19),
          notificationSent: processForm.sendNotification
        };
      }
      return r;
    });

    setReports(updatedReports);
    toast.success('处理成功', {
      description: processForm.sendNotification ? '已通知用户处理结果' : '处理结果已保存'
    });
    setShowProcessModal(false);
    setSelectedReport(null);
  };

  // 发送通知
  const sendNotification = (report: Report) => {
    toast.success('通知已发送', { description: `已向 ${report.reporterName} 发送处理结果通知` });
  };

  // 导出数据
  const exportData = () => {
    const dataStr = JSON.stringify(filteredReports, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `举报数据_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('数据导出成功');
  };

  // 统计卡片数据
  const stats = {
    total: reports.length,
    pending: reports.filter(r => r.status === 'pending').length,
    processing: reports.filter(r => r.status === 'processing').length,
    resolved: reports.filter(r => r.status === 'resolved').length,
    rejected: reports.filter(r => r.status === 'rejected').length
  };

  return (
    <div className={`min-h-screen ${isDark ? 'bg-slate-950' : 'bg-slate-50'}`}>
      {/* 页面标题区 */}
      <div className={`border-b ${isDark ? 'border-slate-800 bg-slate-900/50' : 'border-slate-200 bg-white/50'}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center`}>
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className={`text-xl font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  原创保护管理
                </h1>
                <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  举报审核与处理中心
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={exportData}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Download className="w-4 h-4" />
                导出数据
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 统计卡片 */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}
          >
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>全部举报</p>
            <p className={`text-2xl font-bold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>{stats.total}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}
          >
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>待处理</p>
            <p className="text-2xl font-bold text-yellow-500">{stats.pending}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}
          >
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>处理中</p>
            <p className="text-2xl font-bold text-blue-500">{stats.processing}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}
          >
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>已解决</p>
            <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'}`}
          >
            <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>已驳回</p>
            <p className="text-2xl font-bold text-red-500">{stats.rejected}</p>
          </motion.div>
        </div>

        {/* 筛选和搜索 */}
        <div className={`p-4 rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'} mb-6`}>
          <div className="flex flex-wrap items-center gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-slate-50'}`}>
                <Search className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-slate-400'}`} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="搜索举报编号、举报人、内容..."
                  className={`flex-1 bg-transparent text-sm outline-none ${isDark ? 'text-slate-200 placeholder-slate-500' : 'text-slate-800 placeholder-slate-400'}`}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Filter className={`w-4 h-4 ${isDark ? 'text-slate-400' : 'text-slate-500'}`} />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ReportStatus | 'all')}
                className={`px-3 py-2 rounded-lg text-sm border ${isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}
              >
                <option value="all">全部状态</option>
                <option value="pending">待处理</option>
                <option value="processing">处理中</option>
                <option value="resolved">已解决</option>
                <option value="rejected">已驳回</option>
              </select>
              <select
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
                className={`px-3 py-2 rounded-lg text-sm border ${isDark ? 'border-slate-700 bg-slate-900 text-slate-200' : 'border-slate-200 bg-white text-slate-700'}`}
              >
                <option value="all">全部类型</option>
                {Object.entries(reportTypeConfig).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* 举报列表 */}
        <div className={`rounded-xl border ${isDark ? 'border-slate-700 bg-slate-800/50' : 'border-slate-200 bg-white'} overflow-hidden`}>
          <table className="w-full">
            <thead className={`${isDark ? 'bg-slate-900/50' : 'bg-slate-50'}`}>
              <tr>
                <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                  举报编号
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                  举报人
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                  举报类型
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                  举报内容
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                  状态
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                  提交时间
                </th>
                <th className={`px-4 py-3 text-left text-xs font-medium ${isDark ? 'text-slate-400' : 'text-slate-500'} uppercase tracking-wider`}>
                  操作
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 dark:divide-slate-700">
              {paginatedReports.map((report) => {
                const status = statusConfig[report.status];
                const typeConfig = reportTypeConfig[report.type];
                return (
                  <tr key={report.id} className={`${isDark ? 'hover:bg-slate-800/50' : 'hover:bg-slate-50'} transition-colors`}>
                    <td className="px-4 py-4">
                      <span className={`text-sm font-mono ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {report.id}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        {report.reporterAvatar ? (
                          <img src={report.reporterAvatar} alt="" className="w-8 h-8 rounded-full" />
                        ) : (
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                            <User className="w-4 h-4" />
                          </div>
                        )}
                        <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                          {report.reporterName}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${typeConfig?.bgColor} ${typeConfig?.color}`}>
                        {typeConfig?.label || report.typeLabel}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <p className={`text-sm truncate max-w-xs ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                        {report.targetContent}
                      </p>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${status.bgColor} ${status.color}`}>
                        <status.icon className="w-3 h-3" />
                        {status.label}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                        {report.createdAt}
                      </span>
                    </td>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openDetailModal(report)}
                          className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-slate-700 text-slate-400' : 'hover:bg-slate-100 text-slate-500'} transition-colors`}
                          title="查看详情"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => openProcessModal(report)}
                          className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-blue-500/20 text-blue-400' : 'hover:bg-blue-50 text-blue-600'} transition-colors`}
                          title="处理"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                        {report.status === 'resolved' && !report.notificationSent && (
                          <button
                            onClick={() => sendNotification(report)}
                            className={`p-1.5 rounded-lg ${isDark ? 'hover:bg-green-500/20 text-green-400' : 'hover:bg-green-50 text-green-600'} transition-colors`}
                            title="发送通知"
                          >
                            <Send className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className={`flex items-center justify-between px-4 py-3 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
              <div className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                显示第 {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, filteredReports.length)} 条，共 {filteredReports.length} 条
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} disabled:opacity-50 transition-colors`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  {currentPage} / {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'} disabled:opacity-50 transition-colors`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* 详情弹窗 */}
      <AnimatePresence>
        {showDetailModal && selectedReport && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowDetailModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}
            >
              <div className={`sticky top-0 flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                <div className="flex items-center gap-3">
                  <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                    举报详情
                  </h2>
                  <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${statusConfig[selectedReport.status].bgColor} ${statusConfig[selectedReport.status].color}`}>
                    {statusConfig[selectedReport.status].label}
                  </span>
                </div>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* 基本信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    基本信息
                  </h3>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>举报编号：</span>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{selectedReport.id}</span>
                    </div>
                    <div>
                      <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>举报类型：</span>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{reportTypeConfig[selectedReport.type]?.label || selectedReport.typeLabel}</span>
                    </div>
                    <div>
                      <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>提交时间：</span>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{selectedReport.createdAt}</span>
                    </div>
                    <div>
                      <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>更新时间：</span>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{selectedReport.updatedAt}</span>
                    </div>
                    <div>
                      <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>举报身份：</span>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        {selectedReport.identity === 'self' ? '自己举报' : '代表他人举报'}
                      </span>
                    </div>
                    <div>
                      <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>权利主体：</span>
                      <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                        {selectedReport.subjectType === 'personal' ? '个人' : '组织'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* 举报人信息 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    举报人信息
                  </h3>
                  <div className="flex items-center gap-3">
                    {selectedReport.reporterAvatar ? (
                      <img src={selectedReport.reporterAvatar} alt="" className="w-12 h-12 rounded-full" />
                    ) : (
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center ${isDark ? 'bg-slate-700' : 'bg-slate-200'}`}>
                        <User className="w-6 h-6" />
                      </div>
                    )}
                    <div>
                      <p className={`font-medium ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                        {selectedReport.reporterName}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-slate-400'}`}>
                        ID: {selectedReport.reporterId}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 举报内容 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    举报内容
                  </h3>
                  <p className={`text-sm mb-4 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {selectedReport.targetContent}
                  </p>
                  {selectedReport.targetLinks.length > 0 && (
                    <div className="space-y-2">
                      <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>相关链接：</p>
                      {selectedReport.targetLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className={`flex items-center gap-2 text-sm ${isDark ? 'text-blue-400 hover:text-blue-300' : 'text-blue-600 hover:text-blue-700'}`}
                        >
                          <LinkIcon className="w-4 h-4" />
                          {link}
                          <ExternalLink className="w-3 h-3" />
                        </a>
                      ))}
                    </div>
                  )}
                </div>

                {/* 问题描述 */}
                <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                  <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    问题描述
                  </h3>
                  <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    {selectedReport.description}
                  </p>
                </div>

                {/* 证明材料 */}
                {selectedReport.evidence.length > 0 && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      证明材料 ({selectedReport.evidence.length})
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {selectedReport.evidence.map((file, index) => (
                        <div
                          key={index}
                          className={`flex items-center gap-2 px-3 py-2 rounded-lg ${isDark ? 'bg-slate-700' : 'bg-white'} border ${isDark ? 'border-slate-600' : 'border-slate-200'}`}
                        >
                          <FileUp className="w-4 h-4 text-blue-500" />
                          <span className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>{file}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 处理信息 */}
                {selectedReport.processedBy && (
                  <div className={`p-4 rounded-xl ${isDark ? 'bg-slate-800/50' : 'bg-slate-50'}`}>
                    <h3 className={`text-sm font-semibold mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                      处理信息
                    </h3>
                    <div className="space-y-2 text-sm">
                      <p>
                        <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>处理人：</span>
                        <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>{selectedReport.processedBy}</span>
                      </p>
                      {selectedReport.processResult && (
                        <p>
                          <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>处理结果：</span>
                          <span className={isDark ? 'text-slate-300' : 'text-slate-700'}>
                            {processResults.find(r => r.value === selectedReport.processResult)?.label || selectedReport.processResult}
                          </span>
                        </p>
                      )}
                      {selectedReport.processNote && (
                        <div>
                          <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>处理说明：</span>
                          <p className={`mt-1 p-3 rounded-lg ${isDark ? 'bg-slate-700 text-slate-300' : 'bg-white text-slate-700'}`}>
                            {selectedReport.processNote}
                          </p>
                        </div>
                      )}
                      <p>
                        <span className={`${isDark ? 'text-slate-500' : 'text-slate-400'}`}>通知状态：</span>
                        <span className={selectedReport.notificationSent ? 'text-green-500' : 'text-yellow-500'}>
                          {selectedReport.notificationSent ? '已通知' : '未通知'}
                        </span>
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className={`sticky bottom-0 flex justify-end gap-3 p-6 border-t ${isDark ? 'border-slate-700 bg-slate-900' : 'border-slate-200 bg-white'}`}>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    setShowDetailModal(false);
                    openProcessModal(selectedReport);
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  处理举报
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* 处理弹窗 */}
      <AnimatePresence>
        {showProcessModal && selectedReport && (
          <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowProcessModal(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className={`relative w-full max-w-lg rounded-2xl shadow-2xl ${isDark ? 'bg-slate-900' : 'bg-white'}`}
            >
              <div className={`flex items-center justify-between p-6 border-b ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-200' : 'text-slate-800'}`}>
                  处理举报
                </h2>
                <button
                  onClick={() => setShowProcessModal(false)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-slate-800' : 'hover:bg-slate-100'} transition-colors`}
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-6 space-y-6">
                {/* 处理状态 */}
                <div>
                  <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    处理状态 <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    {Object.entries(statusConfig).map(([key, config]) => (
                      <button
                        key={key}
                        onClick={() => setProcessForm(prev => ({ ...prev, status: key as ReportStatus }))}
                        className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                          processForm.status === key
                            ? `border-blue-500 bg-blue-50 dark:bg-blue-500/10`
                            : isDark
                              ? 'border-slate-700 hover:border-slate-600'
                              : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <config.icon className={`w-5 h-5 ${config.color}`} />
                        <span className={`text-sm font-medium ${isDark ? 'text-slate-200' : 'text-slate-700'}`}>
                          {config.label}
                        </span>
                        {processForm.status === key && (
                          <Check className="w-4 h-4 text-blue-500 ml-auto" />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 处理结果 */}
                <div>
                  <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    处理结果
                  </label>
                  <select
                    value={processForm.result}
                    onChange={(e) => setProcessForm(prev => ({ ...prev, result: e.target.value }))}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark
                        ? 'border-slate-700 bg-slate-800 text-slate-200'
                        : 'border-slate-200 bg-white text-slate-700'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  >
                    <option value="">请选择处理结果</option>
                    {processResults.map(result => (
                      <option key={result.value} value={result.value}>{result.label}</option>
                    ))}
                  </select>
                </div>

                {/* 处理说明 */}
                <div>
                  <label className={`block text-sm font-medium mb-3 ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    处理说明 <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={processForm.note}
                    onChange={(e) => setProcessForm(prev => ({ ...prev, note: e.target.value }))}
                    placeholder="请详细描述处理过程和结果..."
                    rows={4}
                    className={`w-full px-3 py-2 rounded-lg border resize-none ${
                      isDark
                        ? 'border-slate-700 bg-slate-800 text-slate-200 placeholder-slate-500'
                        : 'border-slate-200 bg-white text-slate-700 placeholder-slate-400'
                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                  />
                </div>

                {/* 发送通知 */}
                <div className="flex items-center gap-3">
                  <input
                    type="checkbox"
                    id="sendNotification"
                    checked={processForm.sendNotification}
                    onChange={(e) => setProcessForm(prev => ({ ...prev, sendNotification: e.target.checked }))}
                    className="w-4 h-4 text-blue-500 rounded"
                  />
                  <label htmlFor="sendNotification" className={`text-sm ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                    发送处理结果通知给用户
                  </label>
                </div>
              </div>

              <div className={`flex justify-end gap-3 p-6 border-t ${isDark ? 'border-slate-700' : 'border-slate-200'}`}>
                <button
                  onClick={() => setShowProcessModal(false)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isDark ? 'bg-slate-800 text-slate-300 hover:bg-slate-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  取消
                </button>
                <button
                  onClick={handleProcessSubmit}
                  className="px-4 py-2 bg-blue-500 text-white rounded-lg text-sm font-medium hover:bg-blue-600 transition-colors"
                >
                  确认处理
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
