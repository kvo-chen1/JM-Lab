/**
 * 我的授权页面组件
 * 展示用户已获得和申请中的授权
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Award, Clock, CheckCircle2, XCircle, MessageCircle, Building2,
  Calendar, DollarSign, Package, Loader2, X, ShoppingBag, Eye, Phone, Mail, MessageSquare
} from 'lucide-react';
import { copyrightLicenseService } from '@/services/copyrightLicenseService';
import type { LicenseApplication } from '@/types/copyright-license';
import { CreateLicensedProductModal } from './CreateLicensedProductModal';
import { useTheme } from '@/hooks/useTheme';

// 深色主题配色
const DARK_THEME = {
  bgPrimary: 'bg-slate-950',
  bgSecondary: 'bg-slate-900',
  bgCard: 'bg-slate-900/80',
  borderPrimary: 'border-slate-800',
  borderSecondary: 'border-slate-700',
  textPrimary: 'text-slate-100',
  textSecondary: 'text-slate-300',
  textMuted: 'text-slate-400',
  accentPrimary: 'from-cyan-500 to-blue-600',
  accentSecondary: 'from-violet-500 to-purple-600',
  accentSuccess: 'from-emerald-400 to-teal-500',
  glowPrimary: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]',
  glass: 'backdrop-blur-xl bg-slate-900/90',
};

// 浅色主题配色
const LIGHT_THEME = {
  bgPrimary: 'bg-gray-50',
  bgSecondary: 'bg-white',
  bgCard: 'bg-white/80',
  borderPrimary: 'border-gray-200',
  borderSecondary: 'border-gray-300',
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-700',
  textMuted: 'text-gray-500',
  accentPrimary: 'from-cyan-600 to-blue-700',
  accentSecondary: 'from-violet-600 to-purple-700',
  accentSuccess: 'from-emerald-500 to-teal-600',
  glowPrimary: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)]',
  glass: 'backdrop-blur-xl bg-white/90',
};

// 获取主题
function useLicenseTheme(isDark: boolean) {
  return isDark ? DARK_THEME : LIGHT_THEME;
}

// 状态配置
const STATUS_CONFIG = {
  pending: { label: '审核中', color: 'text-amber-400', bg: 'bg-amber-500/20', border: 'border-amber-500/30', icon: Clock },
  approved: { label: '已通过', color: 'text-emerald-400', bg: 'bg-emerald-500/20', border: 'border-emerald-500/30', icon: CheckCircle2 },
  rejected: { label: '已拒绝', color: 'text-red-400', bg: 'bg-red-500/20', border: 'border-red-500/30', icon: XCircle },
  contacted: { label: '已联系', color: 'text-cyan-400', bg: 'bg-cyan-500/20', border: 'border-cyan-500/30', icon: MessageCircle },
  completed: { label: '已完成', color: 'text-violet-400', bg: 'bg-violet-500/20', border: 'border-violet-500/30', icon: Award },
  cancelled: { label: '已取消', color: 'text-slate-400', bg: 'bg-slate-500/20', border: 'border-slate-500/30', icon: X },
};

// 标签页
const TABS = [
  { id: 'all', name: '全部', icon: Award },
  { id: 'pending', name: '审核中', icon: Clock },
  { id: 'approved', name: '已通过', icon: CheckCircle2 },
  { id: 'completed', name: '已完成', icon: Award },
];

interface MyLicensesProps {
  onClose?: () => void;
}

export function MyLicenses({ onClose }: MyLicensesProps) {
  const { isDark } = useTheme();
  const theme = useLicenseTheme(isDark);
  const [applications, setApplications] = useState<LicenseApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApplication, setSelectedApplication] = useState<LicenseApplication | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateProductModal, setShowCreateProductModal] = useState(false);

  // 加载申请列表
  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    try {
      setLoading(true);
      const data = await copyrightLicenseService.getMyApplications();
      // 确保数据是数组
      if (Array.isArray(data)) {
        setApplications(data);
      } else if (data && typeof data === 'object') {
        // 如果返回的是对象，尝试获取其中的数组
        const apps = data.applications || data.data || [];
        setApplications(Array.isArray(apps) ? apps : []);
      } else {
        setApplications([]);
      }
    } catch (error) {
      toast.error('加载授权申请失败');
      console.error(error);
      setApplications([]);
    } finally {
      setLoading(false);
    }
  };

  // 筛选申请
  const filteredApplications = applications.filter(app => {
    if (activeTab === 'all') return true;
    return app.status === activeTab;
  });

  // 查看详情
  const handleViewDetail = (application: LicenseApplication) => {
    setSelectedApplication(application);
    setShowDetailModal(true);
  };

  // 取消申请
  const handleCancel = async (id: string) => {
    try {
      await copyrightLicenseService.cancelApplication(id);
      toast.success('申请已取消');
      loadApplications();
    } catch (error) {
      toast.error('取消申请失败');
      console.error(error);
    }
  };

  // 创建产品
  const handleCreateProduct = (application: LicenseApplication) => {
    setSelectedApplication(application);
    setShowCreateProductModal(true);
  };

  // 格式化日期
  const formatDate = (date?: string) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('zh-CN');
  };

  return (
    <div className={`min-h-screen ${theme.bgPrimary} p-6`}>
      {/* 头部 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${theme.textPrimary}`}>
              <span className={`bg-gradient-to-r bg-clip-text text-transparent ${isDark ? 'from-cyan-400 to-blue-500' : 'from-cyan-600 to-blue-700'}`}>
                我的授权
              </span>
            </h1>
            <p className={theme.textMuted}>
              管理您的授权申请和已获得的授权
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-lg transition-colors ${theme.bgSecondary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 标签页 */}
        <div className="flex flex-wrap gap-2">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const count = tab.id === 'all'
              ? applications.length
              : applications.filter(a => a.status === tab.id).length;

            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all ${
                  activeTab === tab.id
                    ? (isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white')
                    : `${theme.bgSecondary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.name}</span>
                <span className={`ml-1 px-2 py-0.5 rounded-full text-xs ${
                  activeTab === tab.id ? 'bg-white/20' : (isDark ? 'bg-slate-700' : 'bg-gray-200')
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 申请列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`} />
        </div>
      ) : filteredApplications.length === 0 ? (
        <div className={`flex flex-col items-center justify-center h-64 ${theme.textMuted}`}>
          <Award className="w-16 h-16 mb-4 opacity-30" />
          <p>暂无{activeTab !== 'all' ? STATUS_CONFIG[activeTab as keyof typeof STATUS_CONFIG]?.label : ''}的授权申请</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredApplications.map((application, index) => {
            const status = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG];
            const StatusIcon = status?.icon || Clock;

            return (
              <motion.div
                key={application.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group rounded-2xl border overflow-hidden hover:border-cyan-500/30 transition-all ${theme.bgCard} ${theme.borderPrimary}`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between">
                    {/* 左侧信息 */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        {/* 品牌Logo */}
                        <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-violet-500/20 to-purple-500/20' : 'bg-gradient-to-br from-violet-100 to-purple-100'}`}>
                          {application.request?.brandLogo ? (
                            <img
                              src={application.request.brandLogo}
                              alt={application.request.brandName}
                              className="w-8 h-8 object-contain"
                            />
                          ) : (
                            <Building2 className={`w-6 h-6 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                          )}
                        </div>

                        {/* 品牌名称和需求标题 */}
                        <div>
                          <h3 className={`font-semibold ${theme.textPrimary}`}>
                            {application.request?.brandName || '品牌方'}
                          </h3>
                          <p className={`text-sm ${theme.textMuted}`}>
                            {application.request?.title || application.ipAssetName || '授权申请'}
                          </p>
                        </div>

                        {/* 状态标签 */}
                        <span className={`px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1.5 border ${isDark ? `${status.bg} ${status.color} ${status.border}` : status.color.replace('400', '600').replace('500/20', '100').replace('500/30', '200')}`}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {status.label}
                        </span>
                      </div>

                      {/* 申请信息 */}
                      <div className="flex flex-wrap items-center gap-4 text-sm">
                        <span className={theme.textMuted}>
                          申请时间: <span className={theme.textSecondary}>{formatDate(application.createdAt)}</span>
                        </span>
                        {application.ipAssetName && (
                          <span className={theme.textMuted}>
                            IP资产: <span className={theme.textSecondary}>{application.ipAssetName}</span>
                          </span>
                        )}
                        {application.expectedProducts && application.expectedProducts.length > 0 && (
                          <span className={theme.textMuted}>
                            预期产品: <span className={theme.textSecondary}>{application.expectedProducts.length} 种</span>
                          </span>
                        )}
                      </div>

                      {/* 授权信息（已通过/已完成状态） */}
                      {(application.status === 'approved' || application.status === 'completed') && (
                        <div className={`mt-4 p-4 rounded-xl border ${theme.bgSecondary} ${theme.borderPrimary}`}>
                          <div className="flex flex-wrap items-center gap-6 text-sm">
                            {application.actualLicenseFee !== undefined && (
                              <div className="flex items-center gap-2">
                                <DollarSign className={`w-4 h-4 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                                <span className={theme.textMuted}>授权费用:</span>
                                <span className={`font-medium ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>¥{(application?.actualLicenseFee || 0).toLocaleString()}</span>
                              </div>
                            )}
                            {application.revenueShareRate !== undefined && (
                              <div className="flex items-center gap-2">
                                <Package className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                                <span className={theme.textMuted}>分成比例:</span>
                                <span className={`font-medium ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>{application.revenueShareRate}%</span>
                              </div>
                            )}
                            {application.licenseEndDate && (
                              <div className="flex items-center gap-2">
                                <Calendar className={`w-4 h-4 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
                                <span className={theme.textMuted}>授权期限:</span>
                                <span className={theme.textSecondary}>
                                  {formatDate(application.licenseStartDate)} 至 {formatDate(application.licenseEndDate)}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 联系方式（已联系/已完成状态） */}
                      {application.contactShared && (
                        <div className={`mt-4 p-4 rounded-xl border ${isDark ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200'}`}>
                          <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>品牌方联系方式</h4>
                          <div className="flex flex-wrap items-center gap-4 text-sm">
                            {application.brandContactEmail && (
                              <div className="flex items-center gap-2">
                                <Mail className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                                <span className={theme.textSecondary}>{application.brandContactEmail}</span>
                              </div>
                            )}
                            {application.brandContactPhone && (
                              <div className="flex items-center gap-2">
                                <Phone className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                                <span className={theme.textSecondary}>{application.brandContactPhone}</span>
                              </div>
                            )}
                            {application.brandContactWechat && (
                              <div className="flex items-center gap-2">
                                <MessageSquare className={`w-4 h-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                                <span className={theme.textSecondary}>微信: {application.brandContactWechat}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* 右侧操作 */}
                    <div className="flex flex-col gap-2 ml-4">
                      <button
                        onClick={() => handleViewDetail(application)}
                        className={`px-4 py-2 rounded-lg transition-colors text-sm flex items-center gap-2 ${theme.bgSecondary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
                      >
                        <Eye className="w-4 h-4" />
                        查看详情
                      </button>

                      {/* 根据状态显示不同操作 */}
                      {application.status === 'pending' && (
                        <button
                          onClick={() => handleCancel(application.id)}
                          className={`px-4 py-2 rounded-lg transition-colors text-sm ${isDark ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20' : 'bg-red-50 text-red-600 hover:bg-red-100'}`}
                        >
                          取消申请
                        </button>
                      )}

                      {(application.status === 'approved' || application.status === 'completed') && (
                        <button
                          onClick={() => handleCreateProduct(application)}
                          className={`px-4 py-2 rounded-lg text-white transition-all text-sm flex items-center gap-2 ${isDark ? 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:shadow-lg hover:shadow-emerald-500/25' : 'bg-gradient-to-r from-emerald-600 to-teal-700 hover:shadow-lg hover:shadow-emerald-500/15'}`}
                        >
                          <ShoppingBag className="w-4 h-4" />
                          创建产品
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 详情弹窗 */}
      <ApplicationDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
        isDark={isDark}
      />

      {/* 创建产品弹窗 */}
      <CreateLicensedProductModal
        isOpen={showCreateProductModal}
        onClose={() => {
          setShowCreateProductModal(false);
          setSelectedApplication(null);
        }}
        application={selectedApplication}
        onSuccess={() => {
          toast.success('产品创建成功！');
        }}
      />
    </div>
  );
}

// 申请详情弹窗
interface ApplicationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: LicenseApplication | null;
  isDark: boolean;
}

function ApplicationDetailModal({ isOpen, onClose, application, isDark }: ApplicationDetailModalProps) {
  if (!application) return null;

  const theme = useLicenseTheme(isDark);
  const status = STATUS_CONFIG[application.status as keyof typeof STATUS_CONFIG];
  const StatusIcon = status?.icon || Clock;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl ${theme.glass} ${theme.borderPrimary} border ${theme.glowPrimary}`}
          >
            {/* 头部 */}
            <div className={`flex items-center justify-between p-6 border-b ${theme.borderPrimary}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                  <Award className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${theme.textPrimary}`}>申请详情</h2>
                  <p className={`text-sm ${theme.textMuted}`}>申请编号: {application.id.slice(0, 8)}</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${theme.bgSecondary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'} transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 内容 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
              {/* 状态 */}
              <div className={`flex items-center justify-center mb-6 p-4 rounded-xl ${status.bg} border ${status.border}`}>
                <StatusIcon className={`w-6 h-6 ${status.color} mr-2`} />
                <span className={`text-lg font-medium ${status.color}`}>{status.label}</span>
              </div>

              {/* 品牌信息 */}
              <div className={`p-4 rounded-xl ${theme.bgSecondary} ${theme.borderPrimary} border mb-4`}>
                <h3 className={`font-semibold ${theme.textPrimary} mb-3`}>品牌信息</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                    {application.request?.brandLogo ? (
                      <img 
                        src={application.request.brandLogo} 
                        alt={application.request.brandName}
                        className="w-8 h-8 object-contain"
                      />
                    ) : (
                      <Building2 className="w-6 h-6 text-violet-400" />
                    )}
                  </div>
                  <div>
                    <p className={`font-medium ${theme.textPrimary}`}>{application.request?.brandName}</p>
                    <p className={`text-sm ${theme.textMuted}`}>{application.request?.title}</p>
                  </div>
                </div>
              </div>

              {/* 申请信息 */}
              <div className="space-y-4">
                {application.proposedUsage && (
                  <div>
                    <h4 className={`text-sm font-medium ${theme.textSecondary} mb-2`}>计划用途</h4>
                    <p className={`p-3 rounded-lg ${theme.bgSecondary} ${theme.textSecondary} text-sm`}>
                      {application.proposedUsage}
                    </p>
                  </div>
                )}

                {application.expectedProducts && application.expectedProducts.length > 0 && (
                  <div>
                    <h4 className={`text-sm font-medium ${theme.textSecondary} mb-2`}>预期产品类型</h4>
                    <div className="flex flex-wrap gap-2">
                      {application.expectedProducts.map((product, i) => (
                        <span
                          key={i}
                          className={`px-3 py-1 rounded-full text-sm ${theme.bgSecondary} ${theme.textSecondary} border ${theme.borderPrimary}`}
                        >
                          {product}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {application.message && (
                  <div>
                    <h4 className={`text-sm font-medium ${theme.textSecondary} mb-2`}>申请留言</h4>
                    <p className={`p-3 rounded-lg ${theme.bgSecondary} ${theme.textSecondary} text-sm`}>
                      {application.message}
                    </p>
                  </div>
                )}

                {application.brandResponse && (
                  <div>
                    <h4 className={`text-sm font-medium ${theme.textSecondary} mb-2`}>品牌方回复</h4>
                    <p className={`p-3 rounded-lg bg-violet-500/10 border border-violet-500/20 ${theme.textSecondary} text-sm`}>
                      {application.brandResponse}
                    </p>
                  </div>
                )}
              </div>

              {/* 时间线 */}
              <div className={`mt-6 pt-6 border-t ${theme.borderPrimary}`}>
                <h4 className={`text-sm font-medium ${theme.textSecondary} mb-4`}>申请进度</h4>
                <div className="space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    <span className={theme.textMuted}>提交申请</span>
                    <span className={theme.textSecondary}>{new Date(application.createdAt).toLocaleString('zh-CN')}</span>
                  </div>
                  {application.reviewedAt && (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className={theme.textMuted}>品牌方审核</span>
                      <span className={theme.textSecondary}>{new Date(application.reviewedAt).toLocaleString('zh-CN')}</span>
                    </div>
                  )}
                  {application.completedAt && (
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      <span className={theme.textMuted}>授权完成</span>
                      <span className={theme.textSecondary}>{new Date(application.completedAt).toLocaleString('zh-CN')}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
