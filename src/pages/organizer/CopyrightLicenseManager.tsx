/**
 * 主办方中心 - 版权授权管理
 * 品牌方可以发布授权需求、管理申请、查看统计
 */

import React, { useState, useEffect, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { AuthContext } from '@/contexts/authContext';
import { useTheme } from '@/hooks/useTheme';
import copyrightLicenseService from '@/services/copyrightLicenseService';
import type {
  LicenseRequest,
  LicenseApplication,
  BrandStats
} from '@/types/copyright-license';

// 类型别名，保持代码兼容性
type CopyrightApplication = LicenseApplication;
type LicenseRequestStatus = LicenseRequest['status'];
type ApplicationStatus = LicenseApplication['status'];
import {
  Shield,
  Plus,
  Eye,
  Edit3,
  Trash2,
  CheckCircle,
  XCircle,
  MessageSquare,
  TrendingUp,
  Users,
  Package,
  DollarSign,
  Clock,
  Search,
  Filter,
  ChevronDown,
  MoreHorizontal,
  RefreshCw,
  Loader2,
  FileText,
  Phone,
  Mail,
  User
} from 'lucide-react';

// 状态标签组件
const StatusBadge: React.FC<{ status: string; type: 'request' | 'application'; isDark: boolean }> = ({ status, type, isDark }) => {
  const getStyles = () => {
    if (type === 'request') {
      switch (status) {
        case 'open': return isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'closed': return isDark ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' : 'bg-gray-100 text-gray-600 border-gray-200';
        case 'paused': return isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-200';
        default: return isDark ? 'bg-slate-500/20 text-slate-400' : 'bg-gray-100 text-gray-600';
      }
    } else {
      switch (status) {
        case 'pending': return isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-700 border-amber-200';
        case 'approved': return isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-700 border-emerald-200';
        case 'rejected': return isDark ? 'bg-red-500/20 text-red-400 border-red-500/30' : 'bg-red-100 text-red-700 border-red-200';
        case 'contacted': return isDark ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-cyan-100 text-cyan-700 border-cyan-200';
        case 'completed': return isDark ? 'bg-violet-500/20 text-violet-400 border-violet-500/30' : 'bg-violet-100 text-violet-700 border-violet-200';
        case 'cancelled': return isDark ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' : 'bg-gray-100 text-gray-600 border-gray-200';
        default: return isDark ? 'bg-slate-500/20 text-slate-400' : 'bg-gray-100 text-gray-600';
      }
    }
  };

  const getLabel = () => {
    if (type === 'request') {
      return copyrightLicenseService.getRequestStatusLabel(status);
    }
    return copyrightLicenseService.getApplicationStatusLabel(status);
  };

  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full border ${getStyles()}`}>
      {getLabel()}
    </span>
  );
};

// 统计卡片组件
const StatCard: React.FC<{
  title: string;
  value: number | string;
  icon: React.ElementType;
  trend?: string;
  color: string;
  isDark: boolean;
}> = ({ title, value, icon: Icon, trend, color, isDark }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className={`${isDark ? 'bg-slate-900/60 border-slate-800' : 'bg-white border-gray-200'} backdrop-blur-xl rounded-2xl p-5 border`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className={`text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{title}</p>
        <p className={`text-2xl font-bold ${color}`}>{value}</p>
        {trend && (
          <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>{trend}</p>
        )}
      </div>
      <div className={`p-3 rounded-xl ${color.replace('text-', 'bg-').replace('400', '500')}/20`}>
        <Icon className={`w-5 h-5 ${color}`} />
      </div>
    </div>
  </motion.div>
);

// 创建/编辑需求弹窗
const RequestModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: any) => void;
  initialData?: LicenseRequest | null;
  isDark: boolean;
}> = ({ isOpen, onClose, onSubmit, initialData, isDark }) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    requirements: '',
    licenseType: 'non_exclusive',
    licenseFeeMin: '',
    licenseFeeMax: '',
    revenueShareRate: '10',
    ipCategories: [] as string[],
    validUntil: '',
    contactEmail: '',
    contactPhone: ''
  });

  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        description: initialData.description || '',
        requirements: initialData.requirements || '',
        licenseType: initialData.licenseType,
        licenseFeeMin: initialData.licenseFeeMin?.toString() || '',
        licenseFeeMax: initialData.licenseFeeMax?.toString() || '',
        revenueShareRate: initialData.revenueShareRate.toString(),
        ipCategories: initialData.ipCategories,
        validUntil: initialData.validUntil ? new Date(initialData.validUntil).toISOString().split('T')[0] : '',
        contactEmail: initialData.contactEmail || '',
        contactPhone: initialData.contactPhone || ''
      });
    }
  }, [initialData]);

  const ipCategoryOptions = [
    { value: 'illustration', label: '插画' },
    { value: 'pattern', label: '纹样' },
    { value: 'design', label: '设计' },
    { value: '3d_model', label: '3D模型' },
    { value: 'digital_collectible', label: '数字藏品' }
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      licenseFeeMin: formData.licenseFeeMin ? parseInt(formData.licenseFeeMin) : undefined,
      licenseFeeMax: formData.licenseFeeMax ? parseInt(formData.licenseFeeMax) : undefined,
      revenueShareRate: parseFloat(formData.revenueShareRate),
      licenseScope: {
        regions: ['中国大陆'],
        channels: ['线上电商', '线下门店'],
        duration: '1年'
      }
    });
  };

  const toggleCategory = (category: string) => {
    setFormData(prev => ({
      ...prev,
      ipCategories: prev.ipCategories.includes(category)
        ? prev.ipCategories.filter(c => c !== category)
        : [...prev.ipCategories, category]
    }));
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-black/40'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
      >
        <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>
            {initialData ? '编辑授权需求' : '发布授权需求'}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* 标题 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>需求标题 *</label>
            <input
              type="text"
              value={formData.title}
              onChange={e => setFormData({ ...formData, title: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'} border`}
              placeholder="例如：天津城市文创IP授权合作"
              required
            />
          </div>

          {/* 描述 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>需求描述</label>
            <textarea
              value={formData.description}
              onChange={e => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className={`w-full px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 resize-none border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              placeholder="详细描述您的授权需求..."
            />
          </div>

          {/* 申请要求 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>申请要求</label>
            <textarea
              value={formData.requirements}
              onChange={e => setFormData({ ...formData, requirements: e.target.value })}
              rows={2}
              className={`w-full px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 resize-none border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
              placeholder="对申请者的要求，如作品风格、经验等..."
            />
          </div>

          {/* 授权类型 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>授权类型</label>
            <div className="flex gap-3">
              {[
                { value: 'non_exclusive', label: '非独家授权' },
                { value: 'exclusive', label: '独家授权' },
                { value: 'sole', label: '排他授权' }
              ].map(type => (
                <button
                  key={type.value}
                  type="button"
                  onClick={() => setFormData({ ...formData, licenseType: type.value })}
                  className={`flex-1 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
                    formData.licenseType === type.value
                      ? isDark ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' : 'bg-cyan-50 border-cyan-300 text-cyan-600'
                      : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          {/* 授权费用范围 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>最低授权费 (元)</label>
              <input
                type="number"
                value={formData.licenseFeeMin}
                onChange={e => setFormData({ ...formData, licenseFeeMin: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                placeholder="5000"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>最高授权费 (元)</label>
              <input
                type="number"
                value={formData.licenseFeeMax}
                onChange={e => setFormData({ ...formData, licenseFeeMax: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                placeholder="50000"
              />
            </div>
          </div>

          {/* 分成比例 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>分成比例 (%)</label>
            <input
              type="number"
              min="0"
              max="100"
              value={formData.revenueShareRate}
              onChange={e => setFormData({ ...formData, revenueShareRate: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
            />
            <p className={`text-xs mt-1 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>品牌方从销售额中获得的分成比例</p>
          </div>

          {/* 适用IP类别 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>适用IP类别</label>
            <div className="flex flex-wrap gap-2">
              {ipCategoryOptions.map(category => (
                <button
                  key={category.value}
                  type="button"
                  onClick={() => toggleCategory(category.value)}
                  className={`px-3 py-1.5 rounded-lg text-sm border transition-all ${
                    formData.ipCategories.includes(category.value)
                      ? isDark ? 'bg-violet-500/20 border-violet-500/50 text-violet-400' : 'bg-violet-50 border-violet-300 text-violet-600'
                      : isDark ? 'bg-slate-800 border-slate-700 text-slate-400 hover:border-slate-600' : 'bg-white border-gray-300 text-gray-600 hover:border-gray-400'
                  }`}
                >
                  {category.label}
                </button>
              ))}
            </div>
          </div>

          {/* 有效期 */}
          <div>
            <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>有效期至</label>
            <input
              type="date"
              value={formData.validUntil}
              onChange={e => setFormData({ ...formData, validUntil: e.target.value })}
              className={`w-full px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
            />
          </div>

          {/* 联系方式 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>联系邮箱</label>
              <input
                type="email"
                value={formData.contactEmail}
                onChange={e => setFormData({ ...formData, contactEmail: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                placeholder="license@example.com"
              />
            </div>
            <div>
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>联系电话</label>
              <input
                type="tel"
                value={formData.contactPhone}
                onChange={e => setFormData({ ...formData, contactPhone: e.target.value })}
                className={`w-full px-4 py-2.5 rounded-xl focus:outline-none focus:border-cyan-500/50 focus:ring-2 focus:ring-cyan-500/20 border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100 placeholder-slate-500' : 'bg-white border-gray-300 text-gray-900 placeholder-gray-400'}`}
                placeholder="022-12345678"
              />
            </div>
          </div>

          {/* 按钮 */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 px-4 py-2.5 rounded-xl transition-colors ${isDark ? 'bg-slate-800 hover:bg-slate-700 text-slate-300' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white rounded-xl transition-all"
            >
              {initialData ? '保存修改' : '发布需求'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
};

// 申请详情弹窗
const ApplicationDetailModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  application: CopyrightApplication | null;
  onApprove: (id: string, data: any) => void;
  onReject: (id: string, reason: string) => void;
  onShareContact: (id: string, contactInfo: any) => void;
  isDark: boolean;
}> = ({ isOpen, onClose, application, onApprove, onReject, onShareContact, isDark }) => {
  const [activeTab, setActiveTab] = useState<'info' | 'action'>('info');
  const [rejectReason, setRejectReason] = useState('');
  const [contactInfo, setContactInfo] = useState({ email: '', phone: '', wechat: '' });
  const [approveData, setApproveData] = useState({
    actualLicenseFee: '',
    revenueShareRate: '',
    licenseStartDate: '',
    licenseEndDate: '',
    brandResponse: ''
  });

  if (!isOpen || !application) return null;

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-sm ${isDark ? 'bg-black/60' : 'bg-black/40'}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className={`rounded-2xl border w-full max-w-2xl max-h-[90vh] overflow-y-auto ${isDark ? 'bg-slate-900 border-slate-800' : 'bg-white border-gray-200'}`}
      >
        {/* 头部 */}
        <div className={`p-6 border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <div className="flex items-center justify-between">
            <h2 className={`text-xl font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>申请详情</h2>
            <button onClick={onClose} className={isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-400 hover:text-gray-600'}>
              <XCircle className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* 标签页 */}
        <div className={`flex border-b ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('info')}
            className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
              activeTab === 'info'
                ? isDark ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-cyan-600 border-b-2 border-cyan-600'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            申请信息
          </button>
          {application.status === 'pending' && (
            <button
              onClick={() => setActiveTab('action')}
              className={`flex-1 px-4 py-3 text-sm font-medium transition-colors ${
                activeTab === 'action'
                  ? isDark ? 'text-cyan-400 border-b-2 border-cyan-400' : 'text-cyan-600 border-b-2 border-cyan-600'
                  : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              处理申请
            </button>
          )}
        </div>

        <div className="p-6">
          {activeTab === 'info' ? (
            <div className="space-y-6">
              {/* 申请人信息 */}
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white text-xl font-bold">
                  {(application.applicantName || '?').charAt(0)}
                </div>
                <div>
                  <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{application.applicantName || '未知用户'}</h3>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>
                    申请时间：{application.createdAt ? new Date(application.createdAt).toLocaleString('zh-CN') : '-'}
                  </p>
                </div>
                <div className="ml-auto">
                  <StatusBadge status={application.status} type="application" isDark={isDark} />
                </div>
              </div>

              {/* IP资产信息 */}
              {application.ipAssetName && (
                <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>申请授权的IP资产</h4>
                  <div className="flex items-center gap-3">
                    {application.ipAssetThumbnail && (
                      <img src={application.ipAssetThumbnail} alt="" className="w-16 h-16 rounded-lg object-cover" />
                    )}
                    <span className={isDark ? 'text-slate-200' : 'text-gray-800'}>{application.ipAssetName}</span>
                  </div>
                </div>
              )}

              {/* 计划用途 */}
              {application.proposedUsage && (
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>计划用途</h4>
                  <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{application.proposedUsage}</p>
                </div>
              )}

              {/* 预期产品 */}
              {application.expectedProducts && application.expectedProducts.length > 0 && (
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>预期产品类型</h4>
                  <div className="flex flex-wrap gap-2">
                    {application.expectedProducts.map((product, idx) => (
                      <span key={idx} className={`px-3 py-1 rounded-lg text-sm ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-600'}`}>
                        {product}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* 申请留言 */}
              {application.message && (
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>申请留言</h4>
                  <div className={`rounded-xl p-4 ${isDark ? 'bg-slate-800/50' : 'bg-gray-50'}`}>
                    <p className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{application.message}</p>
                  </div>
                </div>
              )}

              {/* 品牌方回复 */}
              {application.brandResponse && (
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>品牌方回复</h4>
                  <div className={`rounded-xl p-4 border ${isDark ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200'}`}>
                    <p className={`text-sm ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>{application.brandResponse}</p>
                  </div>
                </div>
              )}

              {/* 联系方式 */}
              {application.contactShared && (
                <div>
                  <h4 className={`text-sm font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>已分享的联系方式</h4>
                  <div className="space-y-2">
                    {application.brandContactEmail && (
                      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        <Mail className="w-4 h-4" />
                        {application.brandContactEmail}
                      </div>
                    )}
                    {application.brandContactPhone && (
                      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        <Phone className="w-4 h-4" />
                        {application.brandContactPhone}
                      </div>
                    )}
                    {application.brandContactWechat && (
                      <div className={`flex items-center gap-2 text-sm ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>
                        <MessageSquare className="w-4 h-4" />
                        {application.brandContactWechat}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* 同意申请 */}
              <div className={`rounded-xl p-5 border ${isDark ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-emerald-50 border-emerald-200'}`}>
                <h4 className={`font-medium mb-4 flex items-center gap-2 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                  <CheckCircle className="w-5 h-5" />
                  同意申请
                </h4>
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>实际授权费 (元)</label>
                      <input
                        type="number"
                        value={approveData.actualLicenseFee}
                        onChange={e => setApproveData({ ...approveData, actualLicenseFee: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'}`}
                        placeholder="5000"
                      />
                    </div>
                    <div>
                      <label className={`block text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>分成比例 (%)</label>
                      <input
                        type="number"
                        value={approveData.revenueShareRate}
                        onChange={e => setApproveData({ ...approveData, revenueShareRate: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'}`}
                        placeholder="15"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>授权开始日期</label>
                      <input
                        type="date"
                        value={approveData.licenseStartDate}
                        onChange={e => setApproveData({ ...approveData, licenseStartDate: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>授权结束日期</label>
                      <input
                        type="date"
                        value={approveData.licenseEndDate}
                        onChange={e => setApproveData({ ...approveData, licenseEndDate: e.target.value })}
                        className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'}`}
                      />
                    </div>
                  </div>
                  <div>
                    <label className={`block text-sm mb-1 ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>回复留言</label>
                    <textarea
                      value={approveData.brandResponse}
                      onChange={e => setApproveData({ ...approveData, brandResponse: e.target.value })}
                      rows={2}
                      className={`w-full px-3 py-2 rounded-lg text-sm resize-none border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'}`}
                      placeholder="恭喜！您的申请已通过..."
                    />
                  </div>
                  <button
                    onClick={() => onApprove(application.id, {
                      actualLicenseFee: parseInt(approveData.actualLicenseFee) || 0,
                      revenueShareRate: parseFloat(approveData.revenueShareRate) || 10,
                      licenseStartDate: approveData.licenseStartDate,
                      licenseEndDate: approveData.licenseEndDate,
                      brandResponse: approveData.brandResponse
                    })}
                    className="w-full py-2.5 bg-emerald-500 hover:bg-emerald-400 text-white rounded-lg transition-colors font-medium"
                  >
                    确认同意
                  </button>
                </div>
              </div>

              {/* 分享联系方式 */}
              <div className={`rounded-xl p-5 border ${isDark ? 'bg-cyan-500/10 border-cyan-500/20' : 'bg-cyan-50 border-cyan-200'}`}>
                <h4 className={`font-medium mb-4 flex items-center gap-2 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                  <Phone className="w-5 h-5" />
                  分享联系方式
                </h4>
                <div className="space-y-3">
                  <input
                    type="email"
                    value={contactInfo.email}
                    onChange={e => setContactInfo({ ...contactInfo, email: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="联系邮箱"
                  />
                  <input
                    type="tel"
                    value={contactInfo.phone}
                    onChange={e => setContactInfo({ ...contactInfo, phone: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="联系电话"
                  />
                  <input
                    type="text"
                    value={contactInfo.wechat}
                    onChange={e => setContactInfo({ ...contactInfo, wechat: e.target.value })}
                    className={`w-full px-3 py-2 rounded-lg text-sm border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="微信号"
                  />
                  <button
                    onClick={() => onShareContact(application.id, contactInfo)}
                    className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 text-white rounded-lg transition-colors font-medium"
                  >
                    分享联系方式
                  </button>
                </div>
              </div>

              {/* 拒绝申请 */}
              <div className={`rounded-xl p-5 border ${isDark ? 'bg-red-500/10 border-red-500/20' : 'bg-red-50 border-red-200'}`}>
                <h4 className={`font-medium mb-4 flex items-center gap-2 ${isDark ? 'text-red-400' : 'text-red-600'}`}>
                  <XCircle className="w-5 h-5" />
                  拒绝申请
                </h4>
                <div className="space-y-3">
                  <textarea
                    value={rejectReason}
                    onChange={e => setRejectReason(e.target.value)}
                    rows={2}
                    className={`w-full px-3 py-2 rounded-lg text-sm resize-none border ${isDark ? 'bg-slate-800 border-slate-700 text-slate-100' : 'bg-white border-gray-300 text-gray-900'}`}
                    placeholder="拒绝原因（可选）..."
                  />
                  <button
                    onClick={() => onReject(application.id, rejectReason)}
                    className="w-full py-2.5 bg-red-500 hover:bg-red-400 text-white rounded-lg transition-colors font-medium"
                  >
                    确认拒绝
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};

// 主组件
const CopyrightLicenseManager: React.FC = () => {
  const { user } = useContext(AuthContext);
  const { isDark } = useTheme();
  const [activeTab, setActiveTab] = useState<'requests' | 'applications'>('requests');
  const [requests, setRequests] = useState<LicenseRequest[]>([]);
  const [applications, setApplications] = useState<CopyrightApplication[]>([]);
  const [stats, setStats] = useState<BrandStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestModalOpen, setIsRequestModalOpen] = useState(false);
  const [isApplicationModalOpen, setIsApplicationModalOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<LicenseRequest | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<CopyrightApplication | null>(null);
  const [applicationFilter, setApplicationFilter] = useState<ApplicationStatus | 'all'>('all');

  // 加载数据
  const loadData = async () => {
    if (!user?.id) return;
    
    setIsLoading(true);
    try {
      const [requestsData, applicationsData, statsData] = await Promise.all([
        copyrightLicenseService.getBrandRequests(),
        copyrightLicenseService.getBrandApplications(),
        copyrightLicenseService.getBrandStats()
      ]);
      
      // 确保数据是数组
      setRequests(Array.isArray(requestsData) ? requestsData : []);
      setApplications(Array.isArray(applicationsData) ? applicationsData : []);
      setStats(statsData || {});
    } catch (error) {
      console.error('加载数据失败:', error);
      toast.error('加载数据失败');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // 创建/更新授权需求
  const handleSubmitRequest = async (data: any) => {
    if (!user?.id || !user.username) return;

    try {
      if (selectedRequest) {
        // 更新
        const result = await copyrightLicenseService.updateRequest(selectedRequest.id, data);
        if (result) {
          toast.success('授权需求已更新');
          loadData();
        }
      } else {
        // 创建
        const requestData = {
          ...data,
          brandId: user.id,
          brandName: user.username,
          brandLogo: user.avatar
        };
        const result = await copyrightLicenseService.createRequest(requestData);
        if (result) {
          toast.success('授权需求已发布');
          loadData();
        }
      }
      setIsRequestModalOpen(false);
      setSelectedRequest(null);
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 删除授权需求
  const handleDeleteRequest = async (id: string) => {
    if (!confirm('确定要删除这个授权需求吗？')) return;
    
    try {
      await copyrightLicenseService.deleteRequest(id);
      toast.success('授权需求已删除');
      loadData();
    } catch (error) {
      toast.error('删除失败');
    }
  };

  // 同意申请
  const handleApproveApplication = async (id: string, data: any) => {
    try {
      await copyrightLicenseService.approveApplication(id, data);
      toast.success('已同意申请');
      setIsApplicationModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 拒绝申请
  const handleRejectApplication = async (id: string, reason: string) => {
    try {
      await copyrightLicenseService.rejectApplication(id, reason);
      toast.success('已拒绝申请');
      setIsApplicationModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 分享联系方式
  const handleShareContact = async (id: string, contactInfo: any) => {
    try {
      await copyrightLicenseService.shareContact(id, contactInfo);
      toast.success('联系方式已分享');
      setIsApplicationModalOpen(false);
      loadData();
    } catch (error) {
      toast.error('操作失败');
    }
  };

  // 过滤申请
  const filteredApplications = applicationFilter === 'all'
    ? applications
    : applications.filter(a => a.status === applicationFilter);

  if (isLoading) {
    return (
      <div className={`flex items-center justify-center h-96 ${isDark ? 'bg-slate-950' : 'bg-gray-50'}`}>
        <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
      </div>
    );
  }

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gradient-to-br from-slate-950 via-slate-900 to-black' : 'bg-gradient-to-br from-gray-50 via-gray-100 to-gray-200'}`}>
      <div className="max-w-7xl mx-auto">
        {/* 页面标题 */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>版权授权管理</h1>
            <p className={isDark ? 'text-slate-400' : 'text-gray-500'}>发布授权需求，管理创作者申请，拓展IP商业价值</p>
          </div>
          <button
            onClick={() => {
              setSelectedRequest(null);
              setIsRequestModalOpen(true);
            }}
            className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white font-medium rounded-xl transition-all flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            发布需求
          </button>
        </div>

        {/* 统计卡片 */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="授权需求"
              value={stats.totalRequests || 0}
              icon={FileText}
              trend={`${stats.openRequests || 0} 个开放中`}
              color={isDark ? 'text-cyan-400' : 'text-cyan-600'}
              isDark={isDark}
            />
            <StatCard
              title="收到申请"
              value={stats.totalApplications || 0}
              icon={Users}
              trend={`${stats.pendingApplications || 0} 个待处理`}
              color={isDark ? 'text-violet-400' : 'text-violet-600'}
              isDark={isDark}
            />
            <StatCard
              title="授权产品"
              value={stats.totalProducts || 0}
              icon={Package}
              trend={`${stats.onSaleProducts || 0} 个销售中`}
              color={isDark ? 'text-emerald-400' : 'text-emerald-600'}
              isDark={isDark}
            />
            <StatCard
              title="累计收益"
              value={`¥${(stats.totalRevenue || 0).toLocaleString()}`}
              icon={DollarSign}
              trend={`品牌分成 ¥${(stats.totalBrandShare || 0).toLocaleString()}`}
              color={isDark ? 'text-amber-400' : 'text-amber-600'}
              isDark={isDark}
            />
          </div>
        )}

        {/* 标签页 */}
        <div className={`flex gap-6 border-b mb-6 ${isDark ? 'border-slate-800' : 'border-gray-200'}`}>
          <button
            onClick={() => setActiveTab('requests')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'requests'
                ? isDark ? 'text-cyan-400' : 'text-cyan-600'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            授权需求
            {activeTab === 'requests' && (
              <motion.div
                layoutId="activeTab"
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-cyan-400' : 'bg-cyan-600'}`}
              />
            )}
          </button>
          <button
            onClick={() => setActiveTab('applications')}
            className={`pb-4 text-sm font-medium transition-colors relative ${
              activeTab === 'applications'
                ? isDark ? 'text-cyan-400' : 'text-cyan-600'
                : isDark ? 'text-slate-400 hover:text-slate-200' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            申请管理
            {applications.filter(a => a.status === 'pending').length > 0 && (
              <span className={`ml-2 px-2 py-0.5 text-xs rounded-full ${isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-100 text-amber-700'}`}>
                {applications.filter(a => a.status === 'pending').length}
              </span>
            )}
            {activeTab === 'applications' && (
              <motion.div
                layoutId="activeTab"
                className={`absolute bottom-0 left-0 right-0 h-0.5 ${isDark ? 'bg-cyan-400' : 'bg-cyan-600'}`}
              />
            )}
          </button>
        </div>

        {/* 内容区域 */}
        {activeTab === 'requests' ? (
          <div className="space-y-4">
            {requests.length === 0 ? (
              <div className="text-center py-16">
                <Shield className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                <h3 className={`text-lg font-medium mb-2 ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>暂无授权需求</h3>
                <p className={`mb-6 ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>发布您的第一个授权需求，吸引创作者合作</p>
                <button
                  onClick={() => setIsRequestModalOpen(true)}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-white rounded-xl transition-colors"
                >
                  发布需求
                </button>
              </div>
            ) : (
              requests.map(request => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`backdrop-blur-xl rounded-2xl p-6 border transition-colors ${isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className={`text-lg font-semibold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{request.title}</h3>
                        <StatusBadge status={request.status} type="request" isDark={isDark} />
                      </div>
                      <p className={`text-sm mb-4 line-clamp-2 ${isDark ? 'text-slate-400' : 'text-gray-600'}`}>{request.description}</p>

                      <div className={`flex flex-wrap gap-4 text-sm ${isDark ? 'text-slate-500' : 'text-gray-500'}`}>
                        <span>
                          授权类型：<span className={isDark ? 'text-slate-300' : 'text-gray-700'}>{copyrightLicenseService.getLicenseTypeLabel(request.licenseType || 'non_exclusive')}</span>
                        </span>
                        {request.licenseFeeMin && request.licenseFeeMax && (
                          <span>
                            授权费：<span className={isDark ? 'text-emerald-400' : 'text-emerald-600'}>¥{(request.licenseFeeMin || 0).toLocaleString()} - ¥{(request.licenseFeeMax || 0).toLocaleString()}</span>
                          </span>
                        )}
                        <span>
                          分成：<span className={isDark ? 'text-amber-400' : 'text-amber-600'}>{request.revenueShareRate || 0}%</span>
                        </span>
                      </div>

                      {request.ipCategories.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-4">
                          {request.ipCategories.map(cat => (
                            <span key={cat} className={`px-2.5 py-1 rounded-lg text-xs ${isDark ? 'bg-slate-800 text-slate-400' : 'bg-gray-100 text-gray-600'}`}>
                              {copyrightLicenseService.getIPCategoryLabel(cat)}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 ml-4">
                      <div className="text-right mr-4">
                        <div className={`text-2xl font-bold ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{request.applicationCount}</div>
                        <div className={`text-xs ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>申请数</div>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedRequest(request);
                          setIsRequestModalOpen(true);
                        }}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-slate-800 text-slate-400 hover:text-slate-200' : 'hover:bg-gray-100 text-gray-400 hover:text-gray-600'}`}
                      >
                        <Edit3 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDeleteRequest(request.id)}
                        className={`p-2 rounded-lg transition-colors ${isDark ? 'hover:bg-red-500/20 text-slate-400 hover:text-red-400' : 'hover:bg-red-50 text-gray-400 hover:text-red-500'}`}
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        ) : (
          <div>
            {/* 筛选器 */}
            <div className="flex gap-2 mb-6">
              {[
                { value: 'all', label: '全部' },
                { value: 'pending', label: '待处理' },
                { value: 'approved', label: '已同意' },
                { value: 'rejected', label: '已拒绝' },
                { value: 'contacted', label: '已联系' }
              ].map(filter => (
                <button
                  key={filter.value}
                  onClick={() => setApplicationFilter(filter.value as any)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors border ${
                    applicationFilter === filter.value
                      ? isDark ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30' : 'bg-cyan-50 text-cyan-600 border-cyan-200'
                      : isDark ? 'bg-slate-800 text-slate-400 hover:bg-slate-700 border-transparent' : 'bg-white text-gray-600 hover:bg-gray-50 border-gray-200'
                  }`}
                >
                  {filter.label}
                </button>
              ))}
            </div>

            {/* 申请列表 */}
            <div className="space-y-4">
              {filteredApplications.length === 0 ? (
                <div className="text-center py-16">
                  <Users className={`w-16 h-16 mx-auto mb-4 ${isDark ? 'text-slate-600' : 'text-gray-300'}`} />
                  <h3 className={`text-lg font-medium ${isDark ? 'text-slate-300' : 'text-gray-700'}`}>暂无申请</h3>
                </div>
              ) : (
                filteredApplications.map(app => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`backdrop-blur-xl rounded-2xl p-6 border transition-colors cursor-pointer ${isDark ? 'bg-slate-900/60 border-slate-800 hover:border-slate-700' : 'bg-white border-gray-200 hover:border-gray-300 shadow-sm'}`}
                    onClick={() => {
                      setSelectedApplication(app);
                      setIsApplicationModalOpen(true);
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold">
                          {app.applicantName.charAt(0)}
                        </div>
                        <div>
                          <h4 className={`font-medium ${isDark ? 'text-slate-100' : 'text-gray-900'}`}>{app.applicantName}</h4>
                          <p className={`text-sm ${isDark ? 'text-slate-500' : 'text-gray-400'}`}>
                            申请时间：{new Date(app.createdAt).toLocaleDateString('zh-CN')}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className={`text-sm ${isDark ? 'text-slate-400' : 'text-gray-500'}`}>{app.request?.title || '授权需求'}</span>
                        <StatusBadge status={app.status} type="application" isDark={isDark} />
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </div>
        )}

        {/* 弹窗 */}
        <RequestModal
          isOpen={isRequestModalOpen}
          onClose={() => {
            setIsRequestModalOpen(false);
            setSelectedRequest(null);
          }}
          onSubmit={handleSubmitRequest}
          initialData={selectedRequest}
          isDark={isDark}
        />

        <ApplicationDetailModal
          isOpen={isApplicationModalOpen}
          onClose={() => {
            setIsApplicationModalOpen(false);
            setSelectedApplication(null);
          }}
          application={selectedApplication}
          onApprove={handleApproveApplication}
          onReject={handleRejectApplication}
          onShareContact={handleShareContact}
          isDark={isDark}
        />
      </div>
    </div>
  );
};

export default CopyrightLicenseManager;
