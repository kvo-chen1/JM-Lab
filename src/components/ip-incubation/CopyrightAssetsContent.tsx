/**
 * 版权资产内容组件
 * 展示用户的版权资产列表，支持管理和授权设置
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import {
  Search, Filter, Shield, Loader2, DollarSign, Download, Eye, Award,
  ChevronDown, Unlock,
  ShoppingBag
} from 'lucide-react';
import ipService, { type CopyrightAsset, type IPAsset } from '@/services/ipService';
import { licensedProductService, type LicensedProduct } from '@/services/licensedProductService';
import { CopyrightDetailModal } from './CopyrightDetailModal';

// 深色主题配色
const DARK_THEME = {
  bgPrimary: 'bg-slate-950',
  bgSecondary: 'bg-slate-900',
  bgTertiary: 'bg-slate-800',
  bgCard: 'bg-slate-900/80',
  borderPrimary: 'border-slate-800',
  borderSecondary: 'border-slate-700',
  borderAccent: 'border-cyan-500/30',
  textPrimary: 'text-slate-100',
  textSecondary: 'text-slate-300',
  textTertiary: 'text-slate-400',
  textMuted: 'text-slate-500',
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
  bgTertiary: 'bg-gray-100',
  bgCard: 'bg-white/80',
  borderPrimary: 'border-gray-200',
  borderSecondary: 'border-gray-300',
  borderAccent: 'border-cyan-500/30',
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-700',
  textTertiary: 'text-gray-600',
  textMuted: 'text-gray-500',
  accentPrimary: 'from-cyan-600 to-blue-700',
  accentSecondary: 'from-violet-600 to-purple-700',
  accentSuccess: 'from-emerald-500 to-teal-600',
  glowPrimary: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)]',
  glass: 'backdrop-blur-xl bg-white/90',
};

// 获取主题
function useCopyrightTheme(isDark: boolean) {
  return isDark ? DARK_THEME : LIGHT_THEME;
}

// IP类型选项
const IP_TYPE_OPTIONS = [
  { id: 'illustration', name: '插画', icon: '🎨' },
  { id: 'pattern', name: '图案', icon: '🧩' },
  { id: 'design', name: '设计', icon: '✏️' },
  { id: '3d_model', name: '3D模型', icon: '🎭' },
  { id: 'digital_collectible', name: '数字藏品', icon: '💎' },
];

// 状态选项
const STATUS_OPTIONS = [
  { id: 'registered', name: '已登记', color: 'emerald' },
  { id: 'pending', name: '审核中', color: 'amber' },
  { id: 'expired', name: '已过期', color: 'slate' },
];

interface CopyrightAssetsContentProps {
  ipAssets?: IPAsset[];
}

export function CopyrightAssetsContent({ ipAssets = [] }: CopyrightAssetsContentProps) {
  const { isDark } = useTheme();
  const theme = useCopyrightTheme(isDark);

  // 数据状态
  const [copyrightAssets, setCopyrightAssets] = useState<CopyrightAsset[]>([]);
  const [licensedProducts, setLicensedProducts] = useState<LicensedProduct[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'assets' | 'products'>('assets');

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [showFilters, setShowFilters] = useState(false);

  // 弹窗状态
  const [selectedAsset, setSelectedAsset] = useState<CopyrightAsset | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // 加载数据
  useEffect(() => {
    loadCopyrightAssets();
    loadLicensedProducts();
  }, []);

  const loadCopyrightAssets = async () => {
    try {
      setIsLoading(true);
      const data = await ipService.getCopyrightAssets();
      setCopyrightAssets(data);
    } catch (error) {
      console.error('加载版权资产失败:', error);
      toast.error('加载版权资产失败');
    } finally {
      setIsLoading(false);
    }
  };

  const loadLicensedProducts = async () => {
    try {
      const products = await licensedProductService.getLicensedProducts();
      setLicensedProducts(products);
    } catch (error) {
      console.error('加载授权产品失败:', error);
    }
  };

  // 筛选
  const filteredAssets = useMemo(() => {
    let result = [...copyrightAssets];

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        asset => asset.name.toLowerCase().includes(query)
      );
    }

    // 类型筛选
    if (selectedTypes.length > 0) {
      result = result.filter(asset => selectedTypes.includes(asset.type));
    }

    // 状态筛选
    if (selectedStatus) {
      result = result.filter(asset => asset.status === selectedStatus);
    }

    return result;
  }, [copyrightAssets, searchQuery, selectedTypes, selectedStatus]);

  // 统计数据
  const stats = useMemo(() => {
    const total = copyrightAssets.length;
    const canLicense = copyrightAssets.filter(a => a.canLicense).length;
    const licensed = copyrightAssets.filter(a => a.licenseCount && a.licenseCount > 0).length;
    const totalRevenue = copyrightAssets.reduce((sum, a) => sum + (a.totalLicenseRevenue || 0), 0);

    return { total, canLicense, licensed, totalRevenue };
  }, [copyrightAssets]);

  // 切换类型筛选
  const toggleType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  // 查看详情
  const handleViewDetail = (asset: CopyrightAsset) => {
    setSelectedAsset(asset);
    setShowDetailModal(true);
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'registered':
        return {
          bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
          text: isDark ? 'text-emerald-400' : 'text-emerald-600',
          border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
          label: '已登记'
        };
      case 'pending':
        return {
          bg: isDark ? 'bg-amber-500/20' : 'bg-amber-100',
          text: isDark ? 'text-amber-400' : 'text-amber-600',
          border: isDark ? 'border-amber-500/30' : 'border-amber-200',
          label: '审核中'
        };
      case 'expired':
        return {
          bg: isDark ? 'bg-slate-500/20' : 'bg-gray-200',
          text: isDark ? 'text-slate-400' : 'text-gray-500',
          border: isDark ? 'border-slate-500/30' : 'border-gray-300',
          label: '已过期'
        };
      default:
        return {
          bg: isDark ? 'bg-slate-500/20' : 'bg-gray-200',
          text: isDark ? 'text-slate-400' : 'text-gray-500',
          border: isDark ? 'border-slate-500/30' : 'border-gray-300',
          label: status
        };
    }
  };

  // 获取资产类型标签
  const getAssetTypeLabel = (type: string) => {
    const option = IP_TYPE_OPTIONS.find(t => t.id === type);
    return option ? `${option.icon} ${option.name}` : type;
  };

  return (
    <div className="space-y-6">
      {/* 头部区域 */}
      <div className={`rounded-2xl p-6 ${theme.glass} border ${theme.borderPrimary} ${theme.glowPrimary}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${theme.textPrimary}`}>
              <span className={`bg-gradient-to-r bg-clip-text text-transparent ${theme.accentPrimary}`}>
                版权资产
              </span>
            </h2>
            <p className={theme.textMuted}>
              管理您的版权资产，保护知识产权价值
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-4 py-2 rounded-xl ${theme.bgTertiary} border ${theme.borderSecondary}`}>
              <span className={`text-2xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {stats.total}
              </span>
              <span className={`text-sm ml-2 ${theme.textMuted}`}>版权总数</span>
            </div>
          </div>
        </div>
      </div>

      {/* 统计概览 */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className={`rounded-2xl p-4 ${theme.glass} border ${theme.borderPrimary}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-cyan-500/20' : 'bg-cyan-100'}`}>
              <Shield className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${theme.textPrimary}`}>{stats.total}</p>
              <p className={`text-xs ${theme.textMuted}`}>版权总数</p>
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-4 ${theme.glass} border ${theme.borderPrimary}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
              <Unlock className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${theme.textPrimary}`}>{stats.canLicense}</p>
              <p className={`text-xs ${theme.textMuted}`}>可授权</p>
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-4 ${theme.glass} border ${theme.borderPrimary}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-violet-500/20' : 'bg-violet-100'}`}>
              <Award className={`w-5 h-5 ${isDark ? 'text-violet-400' : 'text-violet-600'}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${theme.textPrimary}`}>{stats.licensed}</p>
              <p className={`text-xs ${theme.textMuted}`}>已授权</p>
            </div>
          </div>
        </div>
        <div className={`rounded-2xl p-4 ${theme.glass} border ${theme.borderPrimary}`}>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isDark ? 'bg-amber-500/20' : 'bg-amber-100'}`}>
              <DollarSign className={`w-5 h-5 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
            </div>
            <div>
              <p className={`text-xl font-bold ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>
                ¥{(stats.totalRevenue / 10000).toFixed(1)}万
              </p>
              <p className={`text-xs ${theme.textMuted}`}>授权收益</p>
            </div>
          </div>
        </div>
      </div>

      {/* 标签切换 */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveTab('assets')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'assets'
              ? (isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white')
              : `${theme.bgSecondary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`
          }`}
        >
          版权资产 ({copyrightAssets.length})
        </button>
        <button
          onClick={() => setActiveTab('products')}
          className={`px-6 py-3 rounded-xl font-medium transition-all ${
            activeTab === 'products'
              ? (isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white')
              : `${theme.bgSecondary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`
          }`}
        >
          授权产品 ({licensedProducts.length})
        </button>
      </div>

      {/* 搜索和筛选栏 */}
      {activeTab === 'assets' && (
      <div className={`rounded-2xl p-4 ${theme.glass} border ${theme.borderPrimary}`}>
        <div className="flex flex-wrap gap-4 items-center">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索版权资产..."
              className={`w-full pl-10 pr-4 py-2.5 rounded-xl border focus:outline-none focus:ring-2 transition-all ${theme.bgSecondary} ${theme.borderSecondary} ${theme.textPrimary} ${isDark ? 'focus:ring-cyan-500/50 placeholder:text-slate-500' : 'focus:ring-cyan-400/50 placeholder:text-gray-400'}`}
            />
          </div>

          {/* 筛选按钮 */}
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${theme.bgSecondary} ${theme.borderSecondary} ${theme.textSecondary} hover:border-cyan-500/30 ${showFilters ? (isDark ? 'border-cyan-500/50 bg-cyan-500/10' : 'border-cyan-400/50 bg-cyan-50') : ''}`}
          >
            <Filter className="w-4 h-4" />
            <span>筛选</span>
            <ChevronDown className={`w-4 h-4 transition-transform ${showFilters ? 'rotate-180' : ''}`} />
          </button>
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
              <div className={`mt-4 pt-4 border-t ${theme.borderSecondary}`}>
                {/* 状态筛选 */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                    版权状态
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {STATUS_OPTIONS.map(status => (
                      <button
                        key={status.id}
                        onClick={() => setSelectedStatus(selectedStatus === status.id ? '' : status.id)}
                        className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                          selectedStatus === status.id
                            ? (isDark ? `bg-${status.color}-500/20 text-${status.color}-400 border border-${status.color}-500/30` : `bg-${status.color}-100 text-${status.color}-600 border border-${status.color}-200`)
                            : `${theme.bgTertiary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`
                        }`}
                      >
                        {status.name}
                      </button>
                    ))}
                  </div>
                </div>

                {/* IP类型筛选 */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                    IP类型
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {IP_TYPE_OPTIONS.map(type => (
                      <button
                        key={type.id}
                        onClick={() => toggleType(type.id)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-all ${
                          selectedTypes.includes(type.id)
                            ? (isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white')
                            : `${theme.bgTertiary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`
                        }`}
                      >
                        <span>{type.icon}</span>
                        <span>{type.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* 清除筛选 */}
                <button
                  onClick={() => {
                    setSelectedTypes([]);
                    setSelectedStatus('');
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
      )}

      {/* 资产列表 */}
      {activeTab === 'assets' ? (
        isLoading ? (
          <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${theme.glass} ${theme.borderPrimary}`}>
            <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
            <p className={theme.textMuted}>加载版权资产...</p>
          </div>
        ) : filteredAssets.length === 0 ? (
          <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${theme.glass} ${theme.borderPrimary}`}>
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
              <Shield className={`w-10 h-10 ${theme.textMuted}`} />
            </div>
            <h3 className={`text-lg font-medium mb-2 ${theme.textSecondary}`}>暂无版权资产</h3>
            <p className={theme.textMuted}>完成作品版权存证后，您的版权资产将显示在这里</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredAssets.map((asset, index) => {
            const statusStyle = getStatusStyle(asset.status);

            return (
              <motion.div
                key={asset.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative rounded-2xl border overflow-hidden hover:border-cyan-500/30 transition-all ${theme.bgCard} ${theme.borderPrimary} ${theme.glowPrimary}`}
              >
                <div className="p-6">
                  {/* 头部信息 */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {asset.thumbnail ? (
                        <img src={asset.thumbnail} alt={asset.name} className="w-14 h-14 rounded-xl object-cover ring-2 ring-cyan-500/30" />
                      ) : (
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-cyan-100 to-blue-100'}`}>
                          <Shield className={`w-7 h-7 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                        </div>
                      )}
                      <div>
                        <h4 className={`font-semibold ${theme.textPrimary}`}>{asset.name}</h4>
                        <p className={`text-xs ${theme.textMuted}`}>{getAssetTypeLabel(asset.type)}</p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                        {statusStyle.label}
                      </span>
                      {asset.canLicense && (
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1 ${isDark ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-emerald-100 text-emerald-600 border border-emerald-200'}`}>
                          <Unlock className="w-3 h-3" />
                          可授权
                        </span>
                      )}
                    </div>
                  </div>

                  {/* 证书信息 */}
                  <div className={`p-3 rounded-xl mb-4 ${theme.bgTertiary} border ${theme.borderSecondary}`}>
                    <div className="space-y-2">
                      {asset.certificateNumber && (
                        <div className="flex items-center justify-between text-sm">
                          <span className={theme.textMuted}>证书编号</span>
                          <span className={`font-mono ${theme.textSecondary}`}>{asset.certificateNumber}</span>
                        </div>
                      )}
                      {asset.registeredAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className={theme.textMuted}>登记时间</span>
                          <span className={theme.textSecondary}>{new Date(asset.registeredAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      )}
                      {asset.expiresAt && (
                        <div className="flex items-center justify-between text-sm">
                          <span className={theme.textMuted}>有效期至</span>
                          <span className={theme.textSecondary}>{new Date(asset.expiresAt).toLocaleDateString('zh-CN')}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 授权信息 */}
                  {asset.canLicense && (
                    <div className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10' : 'bg-gradient-to-r from-emerald-50 to-cyan-50'} border ${isDark ? 'border-emerald-500/20' : 'border-emerald-200'}`}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <DollarSign className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                          <span className={`text-sm ${theme.textMuted}`}>授权价格</span>
                        </div>
                        <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                          ¥{asset.licensePrice?.toLocaleString() || '面议'}/次
                        </span>
                      </div>
                      {asset.licenseCount !== undefined && asset.licenseCount > 0 && (
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-emerald-500/20">
                          <span className={`text-sm ${theme.textMuted}`}>已授权次数</span>
                          <span className={`font-medium ${theme.textSecondary}`}>{asset.licenseCount} 次</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetail(asset)}
                      className={`flex-1 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${theme.bgTertiary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                    >
                      <Eye className="w-4 h-4" />
                      查看详情
                    </button>
                    {asset.certificateUrl && (
                      <a
                        href={asset.certificateUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={`flex-1 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg hover:shadow-cyan-500/15'}`}
                      >
                        <Download className="w-4 h-4" />
                        下载证书
                      </a>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )
    ) : (
      // 授权产品列表
      licensedProducts.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${theme.glass} ${theme.borderPrimary}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
            <ShoppingBag className={`w-10 h-10 ${theme.textMuted}`} />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${theme.textSecondary}`}>暂无授权产品</h3>
          <p className={theme.textMuted}>基于授权创建的产品将显示在这里</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {licensedProducts.map((product, index) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`group relative rounded-2xl border overflow-hidden hover:border-cyan-500/30 transition-all ${theme.bgCard} ${theme.borderPrimary} ${theme.glowPrimary}`}
            >
              <div className="p-6">
                {/* 头部信息 */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {product.productImages && product.productImages.length > 0 ? (
                      <img src={product.productImages[0]} alt={product.productName} className="w-14 h-14 rounded-xl object-cover ring-2 ring-cyan-500/30" />
                    ) : (
                      <div className={`w-14 h-14 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-cyan-100 to-blue-100'}`}>
                        <ShoppingBag className={`w-7 h-7 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                      </div>
                    )}
                    <div>
                      <h4 className={`font-semibold ${theme.textPrimary}`}>{product.productName}</h4>
                      <p className={`text-xs ${theme.textMuted}`}>{product.brandName}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${
                    product.status === 'on_sale' 
                      ? (isDark ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' : 'bg-emerald-100 text-emerald-600 border-emerald-200')
                      : product.status === 'draft'
                      ? (isDark ? 'bg-slate-500/20 text-slate-400 border-slate-500/30' : 'bg-gray-200 text-gray-600 border-gray-300')
                      : (isDark ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' : 'bg-amber-100 text-amber-600 border-amber-200')
                  }`}>
                    {product.status === 'on_sale' ? '销售中' : product.status === 'draft' ? '草稿' : '审核中'}
                  </span>
                </div>

                {/* 产品信息 */}
                <div className={`p-3 rounded-xl mb-4 ${theme.bgTertiary} border ${theme.borderSecondary}`}>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className={theme.textMuted}>价格</span>
                      <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>¥{Number(product.price || 0).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className={theme.textMuted}>库存</span>
                      <span className={theme.textSecondary}>{product.stock} 件</span>
                    </div>
                    {product.salesCount > 0 && (
                      <div className="flex items-center justify-between text-sm">
                        <span className={theme.textMuted}>销量</span>
                        <span className={theme.textSecondary}>{product.salesCount} 件</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="flex gap-2">
                  <button
                    onClick={() => window.open(`/marketplace/product/${product.id}`, '_blank')}
                    className={`flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-xl transition-all ${theme.bgTertiary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                  >
                    <Eye className="w-4 h-4" />
                    查看
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )
    )}

      {/* 详情弹窗 */}
      <CopyrightDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedAsset(null);
        }}
        asset={selectedAsset}
        onUpdate={loadCopyrightAssets}
      />
    </div>
  );
}
