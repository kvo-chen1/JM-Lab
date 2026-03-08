/**
 * 品牌授权浏览组件
 * 在IP孵化中心展示可授权的品牌需求
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  Search, Filter, Building2, Calendar, DollarSign, Percent,
  ChevronDown, Sparkles, Eye, ArrowRight, X, Loader2,
  MapPin, ShoppingBag, Clock, CheckCircle2, Tag
} from 'lucide-react';
import { copyrightLicenseService } from '@/services/copyrightLicenseService';
import type { LicenseRequest, RequestFilters } from '@/types/copyright-license';
import { LicenseApplicationModal } from './LicenseApplicationModal';

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
  glowPrimary: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.3)]',
  glass: 'backdrop-blur-xl bg-slate-900/90',
};

// IP类别选项
const IP_CATEGORIES = [
  { id: 'illustration', name: '插画', icon: '🎨' },
  { id: 'pattern', name: '图案', icon: '🧩' },
  { id: 'design', name: '设计', icon: '✏️' },
  { id: '3d_model', name: '3D模型', icon: '🎭' },
  { id: 'digital_collectible', name: '数字藏品', icon: '💎' },
];

// 授权类型选项
const LICENSE_TYPES = [
  { id: 'exclusive', name: '独家授权', desc: '仅授权给一家使用' },
  { id: 'non_exclusive', name: '非独家授权', desc: '可授权给多家使用' },
  { id: 'sole', name: '唯一授权', desc: '品牌方和授权方共同使用' },
];

// 排序选项
const SORT_OPTIONS = [
  { id: 'newest', name: '最新发布' },
  { id: 'popular', name: '最受欢迎' },
  { id: 'fee_asc', name: '费用从低到高' },
  { id: 'fee_desc', name: '费用从高到低' },
];

interface BrandLicenseBrowserProps {
  onClose?: () => void;
}

export function BrandLicenseBrowser({ onClose }: BrandLicenseBrowserProps) {
  const [requests, setRequests] = useState<LicenseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState<LicenseRequest | null>(null);
  const [showApplicationModal, setShowApplicationModal] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  
  // 筛选状态
  const [filters, setFilters] = useState<RequestFilters>({
    ipCategories: [],
    licenseType: '',
    sortBy: 'newest',
  });
  const [searchQuery, setSearchQuery] = useState('');

  // 加载授权需求列表
  useEffect(() => {
    loadRequests();
  }, [filters]);

  const loadRequests = async () => {
    try {
      setLoading(true);
      const data = await copyrightLicenseService.getAvailableRequests(filters);
      // 确保数据是数组
      if (Array.isArray(data)) {
        setRequests(data);
      } else if (data && typeof data === 'object') {
        const reqs = data.requests || data.data || [];
        setRequests(Array.isArray(reqs) ? reqs : []);
      } else {
        setRequests([]);
      }
    } catch (error) {
      toast.error('加载授权需求失败');
      console.error(error);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  };

  // 筛选后的列表
  const filteredRequests = useMemo(() => {
    if (!searchQuery) return requests;
    return requests.filter(req =>
      req.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.brandName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      req.description.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [requests, searchQuery]);

  // 处理申请
  const handleApply = (request: LicenseRequest) => {
    setSelectedRequest(request);
    setShowApplicationModal(true);
  };

  // 切换IP类别筛选
  const toggleCategory = (categoryId: string) => {
    setFilters(prev => ({
      ...prev,
      ipCategories: prev.ipCategories?.includes(categoryId)
        ? prev.ipCategories.filter(c => c !== categoryId)
        : [...(prev.ipCategories || []), categoryId]
    }));
  };

  // 格式化费用显示
  const formatFee = (min?: number, max?: number) => {
    if (!min && !max) return '面议';
    if (min && max) return `¥${min.toLocaleString()} - ¥${max.toLocaleString()}`;
    if (min) return `¥${min.toLocaleString()}起`;
    if (max) return `最高¥${max.toLocaleString()}`;
    return '面议';
  };

  return (
    <div className={`min-h-screen ${DARK_THEME.bgPrimary} p-6`}>
      {/* 头部 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-3xl font-bold ${DARK_THEME.textPrimary} mb-2`}>
              <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">
                品牌授权
              </span>
            </h1>
            <p className={DARK_THEME.textMuted}>
              发现优质品牌授权机会，让您的IP价值最大化
            </p>
          </div>
          {onClose && (
            <button
              onClick={onClose}
              className={`p-2 rounded-lg ${DARK_THEME.bgSecondary} ${DARK_THEME.textSecondary} hover:bg-slate-800 transition-colors`}
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* 搜索和筛选栏 */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索品牌或授权需求..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border ${DARK_THEME.textPrimary} placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50`}
            />
          </div>

          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border ${DARK_THEME.textSecondary} hover:border-cyan-500/30 transition-all ${showFilters ? 'border-cyan-500/50 bg-cyan-500/10' : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span>筛选</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>

          {/* 排序下拉 */}
          <div className="relative">
            <select
              value={filters.sortBy}
              onChange={(e) => setFilters(prev => ({ ...prev, sortBy: e.target.value as any }))}
              className={`appearance-none px-4 py-3 pr-10 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border ${DARK_THEME.textPrimary} focus:outline-none focus:border-cyan-500/50 cursor-pointer`}
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
          </div>
        </div>

        {/* 筛选面板 */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className={`mt-4 p-4 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border`}>
                {/* IP类别筛选 */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${DARK_THEME.textSecondary} mb-2`}>
                    IP类别
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {IP_CATEGORIES.map(category => (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                          filters.ipCategories?.includes(category.id)
                            ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white'
                            : `${DARK_THEME.bgPrimary} ${DARK_THEME.textSecondary} hover:bg-slate-800`
                        }`}
                      >
                        <span>{category.icon}</span>
                        <span>{category.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 授权类型筛选 */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium ${DARK_THEME.textSecondary} mb-2`}>
                    授权类型
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {LICENSE_TYPES.map(type => (
                      <button
                        key={type.id}
                        onClick={() => setFilters(prev => ({ 
                          ...prev, 
                          licenseType: prev.licenseType === type.id ? '' : type.id 
                        }))}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          filters.licenseType === type.id
                            ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white'
                            : `${DARK_THEME.bgPrimary} ${DARK_THEME.textSecondary} hover:bg-slate-800`
                        }`}
                      >
                        {type.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* 清除筛选 */}
                <button
                  onClick={() => {
                    setFilters({ sortBy: 'newest' });
                    setSearchQuery('');
                  }}
                  className={`text-sm ${DARK_THEME.textMuted} hover:text-cyan-400 transition-colors`}
                >
                  清除所有筛选
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* 授权需求列表 */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 text-cyan-500 animate-spin" />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className={`flex flex-col items-center justify-center h-64 ${DARK_THEME.textMuted}`}>
          <Building2 className="w-16 h-16 mb-4 opacity-30" />
          <p>暂无符合条件的授权需求</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRequests.map((request, index) => (
            <motion.div
              key={request.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group relative rounded-2xl ${DARK_THEME.bgCard} ${DARK_THEME.borderPrimary} border overflow-hidden hover:border-cyan-500/30 transition-all ${DARK_THEME.glowPrimary}`}
            >
              {/* 状态标签 */}
              <div className="absolute top-4 right-4 z-10">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  request.status === 'open' 
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : request.status === 'paused'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    : 'bg-slate-500/20 text-slate-400 border border-slate-500/30'
                }`}>
                  {request.status === 'open' ? '进行中' : request.status === 'paused' ? '已暂停' : '已结束'}
                </span>
              </div>

              {/* 品牌信息 */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                    {request.brandLogo ? (
                      <img src={request.brandLogo} alt={request.brandName} className="w-8 h-8 object-contain" />
                    ) : (
                      <Building2 className="w-6 h-6 text-cyan-400" />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${DARK_THEME.textPrimary}`}>{request.brandName}</h3>
                    <p className={`text-sm ${DARK_THEME.textMuted}`}>品牌方</p>
                  </div>
                </div>

                {/* 需求标题 */}
                <h4 className={`text-lg font-bold ${DARK_THEME.textPrimary} mb-2 line-clamp-2`}>
                  {request.title}
                </h4>
                <p className={`text-sm ${DARK_THEME.textMuted} mb-4 line-clamp-2`}>
                  {request.description}
                </p>

                {/* IP类别标签 */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {request.ipCategories.slice(0, 3).map((cat, i) => {
                    const category = IP_CATEGORIES.find(c => c.id === cat);
                    return (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-md text-xs ${DARK_THEME.bgSecondary} ${DARK_THEME.textSecondary} border ${DARK_THEME.borderPrimary}`}
                      >
                        {category?.icon} {category?.name || cat}
                      </span>
                    );
                  })}
                  {request.ipCategories.length > 3 && (
                    <span className={`px-2 py-0.5 rounded-md text-xs ${DARK_THEME.bgSecondary} ${DARK_THEME.textMuted}`}>
                      +{request.ipCategories.length - 3}
                    </span>
                  )}
                </div>

                {/* 授权信息 */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className={DARK_THEME.textMuted}>授权费用</span>
                    <span className={`font-semibold ${DARK_THEME.textPrimary}`}>
                      {formatFee(request.licenseFeeMin, request.licenseFeeMax)}
                    </span>
                  </div>
                  {request.revenueShareRate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className={DARK_THEME.textMuted}>分成比例</span>
                      <span className={`font-semibold text-emerald-400`}>
                        {request.revenueShareRate}%
                      </span>
                    </div>
                  )}
                  {request.validUntil && (
                    <div className="flex items-center justify-between text-sm">
                      <span className={DARK_THEME.textMuted}>有效期至</span>
                      <span className={DARK_THEME.textSecondary}>
                        {new Date(request.validUntil).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* 统计信息 */}
                <div className={`flex items-center gap-4 pt-4 border-t ${DARK_THEME.borderPrimary} text-sm`}>
                  <div className="flex items-center gap-1">
                    <Eye className="w-4 h-4 text-slate-500" />
                    <span className={DARK_THEME.textMuted}>{request.viewCount} 浏览</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className="w-4 h-4 text-slate-500" />
                    <span className={DARK_THEME.textMuted}>{request.applicationCount} 申请</span>
                  </div>
                </div>

                {/* 申请按钮 */}
                <button
                  onClick={() => handleApply(request)}
                  disabled={request.status !== 'open'}
                  className={`w-full mt-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    request.status === 'open'
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25'
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {request.status === 'open' ? (
                    <>
                      <span>立即申请</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  ) : (
                    <span>已结束</span>
                  )}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* 申请弹窗 */}
      <LicenseApplicationModal
        isOpen={showApplicationModal}
        onClose={() => {
          setShowApplicationModal(false);
          setSelectedRequest(null);
        }}
        request={selectedRequest}
        onSuccess={() => {
          loadRequests();
        }}
      />
    </div>
  );
}
