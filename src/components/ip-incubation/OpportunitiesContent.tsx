/**
 * 商业机会内容组件
 * 展示所有商业机会列表，支持搜索、筛选和申请
 */

import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import {
  Search, Filter, Building2, DollarSign, Users,
  ChevronDown, Eye, ArrowRight, Loader2, Clock, Briefcase, Star
} from 'lucide-react';
import ipService, { CommercialOpportunity, IPAsset } from '@/services/ipService';
import { OpportunityDetailModal } from './OpportunityDetailModal';
import { OpportunityApplyModal } from './OpportunityApplyModal';

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
  accentWarning: 'from-amber-400 to-orange-500',
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
  accentWarning: 'from-amber-500 to-orange-600',
  glowPrimary: 'shadow-[0_0_30px_-5px_rgba(6,182,212,0.15)]',
  glass: 'backdrop-blur-xl bg-white/90',
};

// 获取主题
function useOpportunitiesTheme(isDark: boolean) {
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

// 排序选项
const SORT_OPTIONS = [
  { id: 'newest', name: '最新发布' },
  { id: 'hottest', name: '最受欢迎' },
  { id: 'reward_desc', name: '奖励从高到低' },
  { id: 'reward_asc', name: '奖励从低到高' },
  { id: 'deadline', name: '即将截止' },
];

// 状态选项
const STATUS_OPTIONS = [
  { id: 'open', name: '进行中', color: 'emerald' },
  { id: 'matched', name: '已匹配', color: 'violet' },
  { id: 'closed', name: '已结束', color: 'slate' },
];

interface OpportunitiesContentProps {
  ipAssets?: IPAsset[];
}

export function OpportunitiesContent({ ipAssets = [] }: OpportunitiesContentProps) {
  const { isDark } = useTheme();
  const theme = useOpportunitiesTheme(isDark);

  // 数据状态
  const [opportunities, setOpportunities] = useState<CommercialOpportunity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 筛选状态
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTypes, setSelectedTypes] = useState<string[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<string>('open');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  // 弹窗状态
  const [selectedOpportunity, setSelectedOpportunity] = useState<CommercialOpportunity | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);

  // 加载数据
  useEffect(() => {
    loadOpportunities();
  }, []);

  const loadOpportunities = async () => {
    try {
      setIsLoading(true);
      const data = await ipService.getAllOpportunities();
      setOpportunities(data);
    } catch (error) {
      console.error('加载商业机会失败:', error);
      toast.error('加载商业机会失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 筛选和排序
  const filteredOpportunities = useMemo(() => {
    let result = [...opportunities];

    // 搜索筛选
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        opp =>
          opp.name.toLowerCase().includes(query) ||
          opp.brandName.toLowerCase().includes(query) ||
          opp.description?.toLowerCase().includes(query)
      );
    }

    // 类型筛选
    if (selectedTypes.length > 0) {
      result = result.filter(opp => {
        const matchTypes = Array.isArray(opp.matchCriteria?.type) ? opp.matchCriteria.type : [];
        return selectedTypes.some(type => matchTypes.includes(type));
      });
    }

    // 状态筛选
    if (selectedStatus) {
      result = result.filter(opp => opp.status === selectedStatus);
    }

    // 排序
    switch (sortBy) {
      case 'newest':
        result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        break;
      case 'hottest':
        result.sort((a, b) => (b.applicationCount || 0) - (a.applicationCount || 0));
        break;
      case 'reward_desc':
        result.sort((a, b) => (b.rewardMax || 0) - (a.rewardMax || 0));
        break;
      case 'reward_asc':
        result.sort((a, b) => (a.rewardMin || 0) - (b.rewardMin || 0));
        break;
      case 'deadline':
        result.sort((a, b) => {
          if (!a.deadline) return 1;
          if (!b.deadline) return -1;
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        });
        break;
    }

    return result;
  }, [opportunities, searchQuery, selectedTypes, selectedStatus, sortBy]);

  // 切换类型筛选
  const toggleType = (typeId: string) => {
    setSelectedTypes(prev =>
      prev.includes(typeId)
        ? prev.filter(t => t !== typeId)
        : [...prev, typeId]
    );
  };

  // 查看详情
  const handleViewDetail = (opportunity: CommercialOpportunity) => {
    setSelectedOpportunity(opportunity);
    setShowDetailModal(true);
  };

  // 申请机会
  const handleApply = (opportunity: CommercialOpportunity) => {
    setSelectedOpportunity(opportunity);
    setShowApplyModal(true);
  };

  // 格式化奖励显示
  const formatReward = (reward: string, min?: number, max?: number) => {
    if (min && max) {
      return `¥${(min || 0).toLocaleString()} - ¥${(max || 0).toLocaleString()}`;
    }
    return reward;
  };

  // 获取状态样式
  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'open':
        return {
          bg: isDark ? 'bg-emerald-500/20' : 'bg-emerald-100',
          text: isDark ? 'text-emerald-400' : 'text-emerald-600',
          border: isDark ? 'border-emerald-500/30' : 'border-emerald-200',
          label: '进行中'
        };
      case 'matched':
        return {
          bg: isDark ? 'bg-violet-500/20' : 'bg-violet-100',
          text: isDark ? 'text-violet-400' : 'text-violet-600',
          border: isDark ? 'border-violet-500/30' : 'border-violet-200',
          label: '已匹配'
        };
      case 'closed':
        return {
          bg: isDark ? 'bg-slate-500/20' : 'bg-gray-200',
          text: isDark ? 'text-slate-400' : 'text-gray-500',
          border: isDark ? 'border-slate-500/30' : 'border-gray-300',
          label: '已结束'
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

  // 计算匹配度
  const calculateMatchScore = (opportunity: CommercialOpportunity) => {
    if (!ipAssets || ipAssets.length === 0) return 0;

    const criteria = opportunity.matchCriteria;
    if (!criteria) return 0;

    let matches = 0;
    let total = 0;

    // 类型匹配
    if (criteria.type && Array.isArray(criteria.type) && criteria.type.length > 0) {
      total++;
      const hasMatchingType = ipAssets.some(asset =>
        criteria.type?.includes(asset.type)
      );
      if (hasMatchingType) matches++;
    }

    // 风格匹配
    if (criteria.style) {
      total++;
      matches += 0.5; // 简化计算
    }

    // 主题匹配
    if (criteria.theme) {
      total++;
      matches += 0.5;
    }

    return total > 0 ? Math.round((matches / total) * 100) : 0;
  };

  return (
    <div className="space-y-6">
      {/* 头部区域 */}
      <div className={`rounded-2xl p-6 ${theme.glass} border ${theme.borderPrimary} ${theme.glowPrimary}`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className={`text-2xl font-bold mb-2 ${theme.textPrimary}`}>
              <span className={`bg-gradient-to-r bg-clip-text text-transparent ${theme.accentPrimary}`}>
                商业机会
              </span>
            </h2>
            <p className={theme.textMuted}>
              发现优质商业合作机会，让您的IP价值最大化
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className={`px-4 py-2 rounded-xl ${theme.bgTertiary} border ${theme.borderSecondary}`}>
              <span className={`text-2xl font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`}>
                {opportunities.filter(o => o.status === 'open').length}
              </span>
              <span className={`text-sm ml-2 ${theme.textMuted}`}>进行中</span>
            </div>
          </div>
        </div>
      </div>

      {/* 搜索和筛选栏 */}
      <div className={`rounded-2xl p-4 ${theme.glass} border ${theme.borderPrimary}`}>
        <div className="flex flex-wrap gap-4 items-center">
          {/* 搜索框 */}
          <div className="relative flex-1 min-w-[280px]">
            <Search className={`absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 ${theme.textMuted}`} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索品牌或机会名称..."
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

          {/* 排序下拉 */}
          <div className="relative">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className={`appearance-none px-4 py-2.5 pr-10 rounded-xl border focus:outline-none focus:ring-2 cursor-pointer ${theme.bgSecondary} ${theme.borderSecondary} ${theme.textPrimary} ${isDark ? 'focus:ring-cyan-500/50' : 'focus:ring-cyan-400/50'}`}
            >
              {SORT_OPTIONS.map(option => (
                <option key={option.id} value={option.id}>{option.name}</option>
              ))}
            </select>
            <ChevronDown className={`absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none ${theme.textMuted}`} />
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
              <div className={`mt-4 pt-4 border-t ${theme.borderSecondary}`}>
                {/* 状态筛选 */}
                <div className="mb-4">
                  <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                    机会状态
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
                    setSelectedStatus('open');
                    setSearchQuery('');
                    setSortBy('newest');
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

      {/* 机会列表 */}
      {isLoading ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${theme.glass} ${theme.borderPrimary}`}>
          <Loader2 className={`w-12 h-12 animate-spin mb-4 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
          <p className={theme.textMuted}>加载商业机会...</p>
        </div>
      ) : filteredOpportunities.length === 0 ? (
        <div className={`flex flex-col items-center justify-center py-20 rounded-2xl border ${theme.glass} ${theme.borderPrimary}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-4 ${isDark ? 'bg-slate-800' : 'bg-gray-100'}`}>
            <Briefcase className={`w-10 h-10 ${theme.textMuted}`} />
          </div>
          <h3 className={`text-lg font-medium mb-2 ${theme.textSecondary}`}>暂无符合条件的商业机会</h3>
          <p className={theme.textMuted}>尝试调整筛选条件或稍后再来查看</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredOpportunities.map((opportunity, index) => {
            const statusStyle = getStatusStyle(opportunity.status);
            const matchScore = calculateMatchScore(opportunity);

            return (
              <motion.div
                key={opportunity.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className={`group relative rounded-2xl border overflow-hidden hover:border-cyan-500/30 transition-all ${theme.bgCard} ${theme.borderPrimary} ${theme.glowPrimary}`}
              >
                {/* 状态标签 */}
                <div className="absolute top-4 right-4 z-10">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                    {statusStyle.label}
                  </span>
                </div>

                {/* 匹配度标签 */}
                {matchScore > 0 && (
                  <div className="absolute top-4 left-4 z-10">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                      <Star className="w-3 h-3" />
                      匹配度 {matchScore}%
                    </span>
                  </div>
                )}

                <div className="p-6">
                  {/* 品牌信息 */}
                  <div className="flex items-center gap-3 mb-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-cyan-100 to-blue-100'}`}>
                      {opportunity.brandLogo ? (
                        <img src={opportunity.brandLogo} alt={opportunity.brandName} className="w-8 h-8 object-contain rounded-lg" />
                      ) : (
                        <Building2 className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                      )}
                    </div>
                    <div>
                      <h3 className={`font-semibold ${theme.textPrimary}`}>{opportunity.brandName}</h3>
                      <p className={`text-xs ${theme.textMuted}`}>品牌方</p>
                    </div>
                  </div>

                  {/* 机会标题 */}
                  <h4 className={`text-lg font-bold mb-2 line-clamp-2 ${theme.textPrimary}`}>
                    {opportunity.name}
                  </h4>
                  <p className={`text-sm mb-4 line-clamp-2 ${theme.textMuted}`}>
                    {opportunity.description}
                  </p>

                  {/* 匹配条件标签 */}
                  {opportunity.matchCriteria?.type && Array.isArray(opportunity.matchCriteria.type) && (
                    <div className="flex flex-wrap gap-1.5 mb-4">
                      {opportunity.matchCriteria.type.slice(0, 3).map((type, i) => {
                        const typeOption = IP_TYPE_OPTIONS.find(t => t.id === type);
                        return (
                          <span
                            key={i}
                            className={`px-2 py-0.5 rounded-md text-xs border ${theme.bgSecondary} ${theme.textSecondary} ${theme.borderSecondary}`}
                          >
                            {typeOption?.icon} {typeOption?.name || type}
                          </span>
                        );
                      })}
                    </div>
                  )}

                  {/* 奖励信息 */}
                  <div className={`p-3 rounded-xl mb-4 ${isDark ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10' : 'bg-gradient-to-r from-emerald-50 to-cyan-50'} border ${isDark ? 'border-emerald-500/20' : 'border-emerald-200'}`}>
                    <div className="flex items-center gap-2">
                      <DollarSign className={`w-5 h-5 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                      <span className={`font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                        {formatReward(opportunity.reward, opportunity.rewardMin, opportunity.rewardMax)}
                      </span>
                    </div>
                  </div>

                  {/* 统计信息 */}
                  <div className="flex items-center gap-4 text-sm mb-4">
                    <div className="flex items-center gap-1">
                      <Users className={`w-4 h-4 ${theme.textMuted}`} />
                      <span className={theme.textMuted}>{opportunity.applicationCount || 0} 申请</span>
                    </div>
                    {opportunity.deadline && (
                      <div className="flex items-center gap-1">
                        <Clock className={`w-4 h-4 ${theme.textMuted}`} />
                        <span className={theme.textMuted}>
                          {new Date(opportunity.deadline) > new Date()
                            ? `${Math.ceil((new Date(opportunity.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))}天后截止`
                            : '已截止'}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewDetail(opportunity)}
                      className={`flex-1 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${theme.bgTertiary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                    >
                      <Eye className="w-4 h-4" />
                      查看详情
                    </button>
                    <button
                      onClick={() => handleApply(opportunity)}
                      disabled={opportunity.status !== 'open'}
                      className={`flex-1 py-2.5 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                        opportunity.status === 'open'
                          ? (isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg hover:shadow-cyan-500/15')
                          : (isDark ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                      }`}
                    >
                      <span>申请</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 详情弹窗 */}
      <OpportunityDetailModal
        isOpen={showDetailModal}
        onClose={() => {
          setShowDetailModal(false);
          setSelectedOpportunity(null);
        }}
        opportunity={selectedOpportunity}
        ipAssets={ipAssets}
        matchScore={selectedOpportunity ? calculateMatchScore(selectedOpportunity) : 0}
      />

      {/* 申请弹窗 */}
      <OpportunityApplyModal
        isOpen={showApplyModal}
        onClose={() => {
          setShowApplyModal(false);
          setSelectedOpportunity(null);
        }}
        opportunity={selectedOpportunity}
        ipAssets={ipAssets}
        onSuccess={() => {
          loadOpportunities();
        }}
      />
    </div>
  );
}
