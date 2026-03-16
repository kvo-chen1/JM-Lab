/**
 * 品牌授权浏览组件
 * 在IP孵化中心展示可授权的品牌需求
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import {
  Search, Filter, Building2,
  ChevronDown, Sparkles, Eye, ArrowRight, X, Loader2
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
  glowPrimary: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)]',
  glass: 'backdrop-blur-xl bg-white/90',
};

// 获取主题
function useBrowserTheme(isDark: boolean) {
  return isDark ? DARK_THEME : LIGHT_THEME;
}

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
  const { isDark } = useTheme();
  const theme = useBrowserTheme(isDark);
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
    <div className={`min-h-screen ${theme.bgPrimary} p-6`}>
      {/* 头部 */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className={`text-3xl font-bold mb-2 ${theme.textPrimary}`}>
              <span className={`bg-gradient-to-r bg-clip-text text-transparent ${isDark ? 'from-cyan-400 to-blue-500' : 'from-cyan-600 to-blue-700'}`}>
                品牌授权
              </span>
            </h1>
            <p className={theme.textMuted}>
              发现优质品牌授权机会，让您的IP价值最大化
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

        {/* 搜索和筛选栏 */}
        <div className="flex flex-wrap gap-4 items-center">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[300px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索品牌或授权需求..."
              className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-1 ${theme.bgSecondary} ${theme.borderPrimary} ${theme.textPrimary} ${isDark ? 'placeholder-slate-500 focus:border-cyan-500/50 focus:ring-cyan-500/50' : 'placeholder-gray-400 focus:border-cyan-400/50 focus:ring-cyan-400/50'}`}
            />
          </div>

          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl border transition-all ${theme.bgSecondary} ${theme.borderPrimary} ${theme.textSecondary} hover:border-cyan-500/30 ${showFilters ? (isDark ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-cyan-400/50 bg-cyan-50') : ''}`}
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
              className={`appearance-none px-4 py-3 pr-10 rounded-xl border focus:outline-none cursor-pointer ${theme.bgSecondary} ${theme.borderPrimary} ${theme.textPrimary} ${isDark ? 'focus:border-cyan-500/50' : 'focus:border-cyan-400/50'}`}
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
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
              <div className={`mt-4 p-4 rounded-xl border ${theme.bgSecondary} ${theme.borderPrimary}`}>
                {/* IP类别筛选 */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                    IP类别
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {IP_CATEGORIES.map(category => (
                      <button
                        key={category.id}
                        onClick={() => toggleCategory(category.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                          filters.ipCategories?.includes(category.id)
                            ? (isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white')
                            : `${theme.bgPrimary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`
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
                  <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
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
                            ? (isDark ? 'bg-gradient-to-r from-violet-500 to-purple-600 text-white' : 'bg-gradient-to-r from-violet-600 to-purple-700 text-white')
                            : `${theme.bgPrimary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`
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
                  className={`text-sm transition-colors ${theme.textMuted} ${isDark ? 'hover:text-cyan-400' : 'hover:text-cyan-600'}`}
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
          <Loader2 className={`w-8 h-8 animate-spin ${isDark ? 'text-cyan-500' : 'text-cyan-600'}`} />
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className={`flex flex-col items-center justify-center h-64 ${theme.textMuted}`}>
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
              className={`group relative rounded-2xl border overflow-hidden hover:border-cyan-500/30 transition-all ${theme.bgCard} ${theme.borderPrimary} ${theme.glowPrimary}`}
            >
              {/* 状态标签 */}
              <div className="absolute top-4 right-4 z-10">
                <span className={`px-2 py-1 rounded-full text-xs font-medium border ${
                  request.status === 'open'
                    ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-600 border-emerald-200')
                    : request.status === 'paused'
                    ? (isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-600 border-amber-200')
                    : (isDark ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' : 'bg-gray-200 text-gray-500 border-gray-300')
                }`}>
                  {request.status === 'open' ? '进行中' : request.status === 'paused' ? '已暂停' : '已结束'}
                </span>
              </div>

              {/* 品牌信息 */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-cyan-100 to-blue-100'}`}>
                    {request.brandLogo ? (
                      <img src={request.brandLogo} alt={request.brandName} className="w-8 h-8 object-contain" />
                    ) : (
                      <Building2 className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    )}
                  </div>
                  <div>
                    <h3 className={`font-semibold ${theme.textPrimary}`}>{request.brandName}</h3>
                    <p className={`text-sm ${theme.textMuted}`}>品牌方</p>
                  </div>
                </div>

                {/* 需求标题 */}
                <h4 className={`text-lg font-bold mb-2 line-clamp-2 ${theme.textPrimary}`}>
                  {request.title}
                </h4>
                <p className={`text-sm mb-4 line-clamp-2 ${theme.textMuted}`}>
                  {request.description}
                </p>

                {/* IP类别标签 */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {request.ipCategories?.slice(0, 3).map((cat, i) => {
                    const category = IP_CATEGORIES.find(c => c.id === cat);
                    return (
                      <span
                        key={i}
                        className={`px-2 py-0.5 rounded-md text-xs border ${theme.bgSecondary} ${theme.textSecondary} ${theme.borderPrimary}`}
                      >
                        {category?.icon} {category?.name || cat}
                      </span>
                    );
                  })}
                  {request.ipCategories && request.ipCategories.length > 3 && (
                    <span className={`px-2 py-0.5 rounded-md text-xs ${theme.bgSecondary} ${theme.textMuted}`}>
                      +{request.ipCategories.length - 3}
                    </span>
                  )}
                </div>

                {/* 授权信息 */}
                <div className="space-y-2 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className={theme.textMuted}>授权费用</span>
                    <span className={`font-semibold ${theme.textPrimary}`}>
                      {formatFee(request.licenseFeeMin, request.licenseFeeMax)}
                    </span>
                  </div>
                  {request.revenueShareRate && (
                    <div className="flex items-center justify-between text-sm">
                      <span className={theme.textMuted}>分成比例</span>
                      <span className={`font-semibold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {request.revenueShareRate}%
                      </span>
                    </div>
                  )}
                  {request.validUntil && (
                    <div className="flex items-center justify-between text-sm">
                      <span className={theme.textMuted}>有效期至</span>
                      <span className={theme.textSecondary}>
                        {new Date(request.validUntil).toLocaleDateString('zh-CN')}
                      </span>
                    </div>
                  )}
                </div>

                {/* 统计信息 */}
                <div className={`flex items-center gap-4 pt-4 border-t text-sm ${theme.borderPrimary}`}>
                  <div className="flex items-center gap-1">
                    <Eye className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                    <span className={theme.textMuted}>{request.viewCount} 浏览</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Sparkles className={`w-4 h-4 ${isDark ? 'text-slate-500' : 'text-gray-400'}`} />
                    <span className={theme.textMuted}>{request.applicationCount} 申请</span>
                  </div>
                </div>

                {/* 申请按钮 */}
                <button
                  onClick={() => handleApply(request)}
                  disabled={request.status !== 'open'}
                  className={`w-full mt-4 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    request.status === 'open'
                      ? (isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg hover:shadow-cyan-500/15')
                      : (isDark ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
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
