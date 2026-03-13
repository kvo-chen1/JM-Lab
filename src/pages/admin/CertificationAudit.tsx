import { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTheme } from '@/hooks/useTheme';
import { AuthContext } from '@/contexts/authContext';
import certificationAdminService, { AdminApplicationFilter } from '@/services/certificationAdminService';
import {
  CertificationApplication,
  CertificationStatus,
  CERTIFICATION_LEVELS,
  CERTIFICATION_TYPE_NAMES,
  CERTIFICATION_STATUS_NAMES,
} from '@/types/certification';
import { toast } from 'sonner';

export default function CertificationAudit() {
  const { isDark } = useTheme();
  const { user: currentUser } = useContext(AuthContext);

  const [applications, setApplications] = useState<CertificationApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<CertificationApplication | null>(null);
  const [filter, setFilter] = useState<AdminApplicationFilter>({ status: 'pending' });
  const [searchTerm, setSearchTerm] = useState('');
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [reviewAction, setReviewAction] = useState<'approve' | 'reject'>('approve');
  const [reviewNote, setReviewNote] = useState('');
  const [rejectReason, setRejectReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadApplications();
    loadStats();
  }, [filter, page]);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const result = await certificationAdminService.getApplications(
        { ...filter, search: searchTerm },
        page,
        20
      );
      setApplications(result.applications);
      setTotal(result.total);
    } catch (error) {
      console.error('加载申请列表失败:', error);
      toast.error('加载申请列表失败');
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const statsData = await certificationAdminService.getStats();
      setStats({
        total: statsData.total,
        pending: statsData.pending,
        approved: statsData.approved,
        rejected: statsData.rejected,
      });
    } catch (error) {
      console.error('加载统计失败:', error);
    }
  };

  const handleFilterChange = (key: keyof AdminApplicationFilter, value: string) => {
    setFilter((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  const handleSearch = () => {
    setPage(1);
    loadApplications();
  };

  const handleSelectApplication = (application: CertificationApplication) => {
    setSelectedApplication(application);
  };

  const handleOpenReviewModal = (action: 'approve' | 'reject') => {
    setReviewAction(action);
    setReviewNote('');
    setRejectReason('');
    setShowReviewModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedApplication) return;

    if (reviewAction === 'reject' && !rejectReason.trim()) {
      toast.error('请填写拒绝原因');
      return;
    }

    setSubmitting(true);
    try {
      const result = await certificationAdminService.reviewApplication({
        applicationId: selectedApplication.id,
        action: reviewAction,
        reviewNote,
        rejectReason,
      });

      if (result.success) {
        setShowReviewModal(false);
        setSelectedApplication(null);
        loadApplications();
        loadStats();
      }
    } catch (error) {
      console.error('审核失败:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusBadge = (status: CertificationStatus) => {
    const colors: Record<CertificationStatus, string> = {
      none: 'bg-gray-100 text-gray-600',
      pending: 'bg-yellow-100 text-yellow-600',
      approved: 'bg-green-100 text-green-600',
      rejected: 'bg-red-100 text-red-600',
      revoked: 'bg-gray-100 text-gray-600',
    };
    return colors[status] || colors.none;
  };

  const getLevelBadge = (level: string) => {
    const levelConfig = CERTIFICATION_LEVELS.find((l) => l.level === level);
    const colors: Record<string, string> = {
      normal: 'bg-gray-100 text-gray-600',
      verified: 'bg-blue-100 text-blue-600',
      signed: 'bg-yellow-100 text-yellow-600',
    };
    return (
      <span className={`px-2 py-1 rounded text-xs ${colors[level] || colors.normal}`}>
        {levelConfig?.name || level}
      </span>
    );
  };

  const formatDate = (timestamp: string | number) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
          创作者认证审核
        </h1>
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
            待审核: <span className="font-semibold text-yellow-500">{stats.pending}</span>
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: '总申请', value: stats.total, icon: 'file-alt', color: 'blue' },
          { label: '待审核', value: stats.pending, icon: 'clock', color: 'yellow' },
          { label: '已通过', value: stats.approved, icon: 'check-circle', color: 'green' },
          { label: '已拒绝', value: stats.rejected, icon: 'times-circle', color: 'red' },
        ].map((stat, index) => (
          <div
            key={index}
            className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}
          >
            <div className="flex items-center justify-between">
              <div>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                  {stat.label}
                </p>
                <p className="text-2xl font-bold mt-1">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full bg-${stat.color}-100 text-${stat.color}-600`}>
                <i className={`fas fa-${stat.icon} text-lg`}></i>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className={`p-4 rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm`}>
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className={`relative ${isDark ? 'bg-gray-700' : 'bg-gray-100'} rounded-lg`}>
              <input
                type="text"
                placeholder="搜索用户名、邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                className="w-full px-4 py-2 pl-10 bg-transparent border-none outline-none text-sm"
              />
              <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
            </div>
          </div>

          <select
            value={filter.status || ''}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
          >
            <option value="">全部状态</option>
            <option value="pending">待审核</option>
            <option value="approved">已通过</option>
            <option value="rejected">已拒绝</option>
          </select>

          <select
            value={filter.level || ''}
            onChange={(e) => handleFilterChange('level', e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
          >
            <option value="">全部等级</option>
            <option value="verified">认证创作者</option>
            <option value="signed">签约创作者</option>
          </select>

          <select
            value={filter.type || ''}
            onChange={(e) => handleFilterChange('type', e.target.value)}
            className={`px-4 py-2 rounded-lg text-sm ${isDark ? 'bg-gray-700 border-gray-600' : 'bg-gray-100 border-gray-300'} border`}
          >
            <option value="">全部类型</option>
            <option value="individual">个人创作者</option>
            <option value="organization">机构/企业</option>
            <option value="media">媒体/自媒体</option>
            <option value="brand">品牌方</option>
          </select>

          <button
            onClick={handleSearch}
            className="px-4 py-2 bg-red-500 text-white rounded-lg text-sm hover:bg-red-600"
          >
            搜索
          </button>
        </div>
      </div>

      <div className={`rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-sm overflow-hidden`}>
        <table className="min-w-full">
          <thead>
            <tr className={`${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
              <th className="px-4 py-3 text-left text-sm font-medium">申请人</th>
              <th className="px-4 py-3 text-left text-sm font-medium">认证等级</th>
              <th className="px-4 py-3 text-left text-sm font-medium">类型</th>
              <th className="px-4 py-3 text-left text-sm font-medium">状态</th>
              <th className="px-4 py-3 text-left text-sm font-medium">申请时间</th>
              <th className="px-4 py-3 text-left text-sm font-medium">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {loading ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <i className="fas fa-spinner fa-spin text-2xl text-red-600"></i>
                </td>
              </tr>
            ) : applications.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center">
                  <div className="text-gray-400">
                    <i className="fas fa-inbox text-4xl mb-2"></i>
                    <p>暂无申请数据</p>
                  </div>
                </td>
              </tr>
            ) : (
              applications.map((application) => (
                <tr
                  key={application.id}
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer ${
                    selectedApplication?.id === application.id ? 'bg-red-50 dark:bg-red-900/20' : ''
                  }`}
                  onClick={() => handleSelectApplication(application)}
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={application.user?.avatar_url || '/default-avatar.png'}
                        alt={application.user?.username}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                      <div>
                        <p className="font-medium text-sm">{application.user?.username}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                          {application.user?.email}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">{getLevelBadge(application.level)}</td>
                  <td className="px-4 py-3">
                    <span className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      {CERTIFICATION_TYPE_NAMES[application.type]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(application.status)}`}>
                      {CERTIFICATION_STATUS_NAMES[application.status]}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm">{formatDate(application.createdAt)}</td>
                  <td className="px-4 py-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectApplication(application);
                      }}
                      className="text-red-500 hover:text-red-600 text-sm"
                    >
                      查看详情
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {total > 20 && (
          <div className={`px-4 py-3 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
              共 {total} 条记录
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className={`px-3 py-1 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'} disabled:opacity-50`}
              >
                上一页
              </button>
              <span className="text-sm">第 {page} 页</span>
              <button
                onClick={() => setPage((p) => p + 1)}
                disabled={page * 20 >= total}
                className={`px-3 py-1 rounded ${isDark ? 'bg-gray-700' : 'bg-gray-100'} disabled:opacity-50`}
              >
                下一页
              </button>
            </div>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[70] p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} flex items-center justify-between`}>
                <h3 className="text-xl font-bold">申请详情</h3>
                <button
                  onClick={() => setSelectedApplication(null)}
                  className={`p-2 rounded-lg ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}`}
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>

              <div className="p-6 space-y-6">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedApplication.user?.avatar_url || '/default-avatar.png'}
                    alt={selectedApplication.user?.username}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <div>
                    <h4 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedApplication.user?.username}
                    </h4>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      {selectedApplication.user?.email}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      {getLevelBadge(selectedApplication.level)}
                      <span className={`px-2 py-1 rounded text-xs ${getStatusBadge(selectedApplication.status)}`}>
                        {CERTIFICATION_STATUS_NAMES[selectedApplication.status]}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      真实姓名
                    </label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedApplication.realName}
                    </p>
                  </div>
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      认证类型
                    </label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {CERTIFICATION_TYPE_NAMES[selectedApplication.type]}
                    </p>
                  </div>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    个人简介
                  </label>
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedApplication.personalBio}
                  </p>
                </div>

                <div>
                  <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                    申请理由
                  </label>
                  <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                    {selectedApplication.reason}
                  </p>
                </div>

                {selectedApplication.portfolioUrl && (
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      作品集链接
                    </label>
                    <a
                      href={selectedApplication.portfolioUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-blue-500 hover:underline"
                    >
                      {selectedApplication.portfolioUrl}
                    </a>
                  </div>
                )}

                {selectedApplication.socialLinks && Object.values(selectedApplication.socialLinks).some(Boolean) && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      社交媒体
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(selectedApplication.socialLinks).map(([key, value]) =>
                        value ? (
                          <span
                            key={key}
                            className={`px-3 py-1 rounded-full text-xs ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-700'}`}
                          >
                            {key}: {value}
                          </span>
                        ) : null
                      )}
                    </div>
                  </div>
                )}

                {selectedApplication.idCardFront && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      身份证明
                    </label>
                    <div className="flex gap-4">
                      {selectedApplication.idCardFront && (
                        <img
                          src={selectedApplication.idCardFront}
                          alt="身份证正面"
                          className="w-40 h-28 object-cover rounded-lg"
                        />
                      )}
                      {selectedApplication.idCardBack && (
                        <img
                          src={selectedApplication.idCardBack}
                          alt="身份证背面"
                          className="w-40 h-28 object-cover rounded-lg"
                        />
                      )}
                    </div>
                  </div>
                )}

                {selectedApplication.status === 'pending' && (
                  <div className={`pt-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                    <button
                      onClick={() => handleOpenReviewModal('reject')}
                      className="px-4 py-2 bg-red-100 text-red-600 rounded-lg hover:bg-red-200"
                    >
                      拒绝申请
                    </button>
                    <button
                      onClick={() => handleOpenReviewModal('approve')}
                      className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                    >
                      通过申请
                    </button>
                  </div>
                )}

                {selectedApplication.reviewNote && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                    <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                      审核备注
                    </label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedApplication.reviewNote}
                    </p>
                  </div>
                )}

                {selectedApplication.rejectReason && (
                  <div className={`p-4 rounded-lg ${isDark ? 'bg-red-900/20' : 'bg-red-50'}`}>
                    <label className={`block text-sm font-medium mb-1 text-red-500`}>
                      拒绝原因
                    </label>
                    <p className={`text-sm ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {selectedApplication.rejectReason}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showReviewModal && selectedApplication && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-[80] p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className={`w-full max-w-md rounded-2xl ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl`}
            >
              <div className={`px-6 py-4 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <h3 className="text-xl font-bold">
                  {reviewAction === 'approve' ? '通过认证申请' : '拒绝认证申请'}
                </h3>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                    审核备注
                  </label>
                  <textarea
                    value={reviewNote}
                    onChange={(e) => setReviewNote(e.target.value)}
                    placeholder="填写审核备注（可选）"
                    rows={3}
                    className={`w-full px-3 py-2 rounded-lg border ${
                      isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                    }`}
                  />
                </div>

                {reviewAction === 'reject' && (
                  <div>
                    <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      拒绝原因 <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="请说明拒绝原因"
                      rows={3}
                      className={`w-full px-3 py-2 rounded-lg border ${
                        isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
                      }`}
                    />
                  </div>
                )}
              </div>

              <div className={`px-6 py-4 border-t ${isDark ? 'border-gray-700' : 'border-gray-200'} flex justify-end gap-3`}>
                <button
                  onClick={() => setShowReviewModal(false)}
                  className={`px-4 py-2 rounded-lg ${isDark ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitting || (reviewAction === 'reject' && !rejectReason.trim())}
                  className={`px-4 py-2 rounded-lg text-white ${
                    reviewAction === 'approve'
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-red-500 hover:bg-red-600'
                  } disabled:opacity-50`}
                >
                  {submitting ? (
                    <>
                      <i className="fas fa-spinner fa-spin mr-2"></i>
                      处理中...
                    </>
                  ) : reviewAction === 'approve' ? (
                    '确认通过'
                  ) : (
                    '确认拒绝'
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
