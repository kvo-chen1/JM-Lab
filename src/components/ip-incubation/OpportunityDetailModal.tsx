/**
 * 商业机会详情弹窗组件
 * 展示机会的详细信息和匹配分析
 */

import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import {
  X, Building2, DollarSign, Calendar, Target, Users,
  Clock, CheckCircle2, Star, ArrowRight, Briefcase,
  Sparkles, Lightbulb, TrendingUp, Award
} from 'lucide-react';
import type { CommercialOpportunity, IPAsset } from '@/services/ipService';

// 深色主题配色
const DARK_THEME = {
  bgPrimary: 'bg-slate-950',
  bgSecondary: 'bg-slate-900',
  bgTertiary: 'bg-slate-800',
  borderPrimary: 'border-slate-800',
  borderSecondary: 'border-slate-700',
  textPrimary: 'text-slate-100',
  textSecondary: 'text-slate-300',
  textMuted: 'text-slate-400',
  accentPrimary: 'from-cyan-500 to-blue-600',
  accentSecondary: 'from-violet-500 to-purple-600',
  glass: 'backdrop-blur-xl bg-slate-900/90',
};

// 浅色主题配色
const LIGHT_THEME = {
  bgPrimary: 'bg-gray-50',
  bgSecondary: 'bg-white',
  bgTertiary: 'bg-gray-100',
  borderPrimary: 'border-gray-200',
  borderSecondary: 'border-gray-300',
  textPrimary: 'text-gray-900',
  textSecondary: 'text-gray-700',
  textMuted: 'text-gray-500',
  accentPrimary: 'from-cyan-600 to-blue-700',
  accentSecondary: 'from-violet-600 to-purple-700',
  glass: 'backdrop-blur-xl bg-white/90',
};

interface OpportunityDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: CommercialOpportunity | null;
  ipAssets?: IPAsset[];
  matchScore?: number;
}

export function OpportunityDetailModal({
  isOpen,
  onClose,
  opportunity,
  ipAssets = [],
  matchScore = 0
}: OpportunityDetailModalProps) {
  const { isDark } = useTheme();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  if (!opportunity) return null;

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

  const statusStyle = getStatusStyle(opportunity.status);

  // 获取匹配的IP资产
  const getMatchingAssets = () => {
    if (!opportunity.matchCriteria?.type || ipAssets.length === 0) return [];

    return ipAssets.filter(asset =>
      opportunity.matchCriteria?.type?.includes(asset.type)
    );
  };

  const matchingAssets = getMatchingAssets();

  // 格式化奖励显示
  const formatReward = () => {
    if (opportunity?.rewardMin && opportunity?.rewardMax) {
      return `¥${(opportunity.rewardMin || 0).toLocaleString()} - ¥${(opportunity.rewardMax || 0).toLocaleString()}`;
    }
    return opportunity?.reward || '';
  };

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
            className={`w-full max-w-3xl max-h-[90vh] overflow-hidden rounded-2xl ${theme.glass} ${theme.borderPrimary} border shadow-2xl`}
          >
            {/* 头部 */}
            <div className={`relative h-48 overflow-hidden`}>
              {/* 背景渐变 */}
              <div className={`absolute inset-0 ${isDark ? 'bg-gradient-to-br from-cyan-500/20 via-violet-500/20 to-purple-500/20' : 'bg-gradient-to-br from-cyan-100 via-violet-100 to-purple-100'}`} />

              {/* 装饰元素 */}
              <div className="absolute inset-0 opacity-30">
                <div className="absolute top-10 left-10 w-32 h-32 rounded-full bg-cyan-500/20 blur-3xl" />
                <div className="absolute bottom-10 right-10 w-40 h-40 rounded-full bg-violet-500/20 blur-3xl" />
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={onClose}
                className={`absolute top-4 right-4 w-10 h-10 rounded-xl flex items-center justify-center transition-colors backdrop-blur ${isDark ? 'bg-white/10 hover:bg-white/20 text-white' : 'bg-black/10 hover:bg-black/20 text-gray-900'}`}
              >
                <X className="w-5 h-5" />
              </button>

              {/* 头部内容 */}
              <div className="relative h-full flex items-end p-6">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-cyan-500 to-blue-600' : 'bg-gradient-to-br from-cyan-600 to-blue-700'} shadow-lg`}>
                    {opportunity.brandLogo ? (
                      <img src={opportunity.brandLogo} alt={opportunity.brandName} className="w-10 h-10 object-contain rounded-lg" />
                    ) : (
                      <Building2 className="w-8 h-8 text-white" />
                    )}
                  </div>
                  <div>
                    <h2 className={`text-2xl font-bold ${theme.textPrimary}`}>{opportunity.brandName}</h2>
                    <p className={theme.textMuted}>品牌方</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-192px)]">
              {/* 标题和状态 */}
              <div className="flex items-start justify-between mb-6">
                <div className="flex-1">
                  <h3 className={`text-xl font-bold mb-2 ${theme.textPrimary}`}>{opportunity.name}</h3>
                  <div className="flex items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusStyle.bg} ${statusStyle.text} ${statusStyle.border}`}>
                      {statusStyle.label}
                    </span>
                    {matchScore > 0 && (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${isDark ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-amber-100 text-amber-600 border border-amber-200'}`}>
                        <Star className="w-3 h-3" />
                        匹配度 {matchScore}%
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* 奖励信息 */}
              <div className={`p-4 rounded-xl mb-6 ${isDark ? 'bg-gradient-to-r from-emerald-500/10 to-cyan-500/10' : 'bg-gradient-to-r from-emerald-50 to-cyan-50'} border ${isDark ? 'border-emerald-500/20' : 'border-emerald-200'}`}>
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-emerald-500/20' : 'bg-emerald-100'}`}>
                    <DollarSign className={`w-6 h-6 ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  </div>
                  <div>
                    <p className={`text-sm ${theme.textMuted}`}>合作奖励</p>
                    <p className={`text-2xl font-bold ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                      {formatReward()}
                    </p>
                  </div>
                </div>
              </div>

              {/* 详细信息 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className={`p-4 rounded-xl ${theme.bgTertiary} border ${theme.borderSecondary}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Users className={`w-4 h-4 ${theme.textMuted}`} />
                    <span className={`text-sm ${theme.textMuted}`}>申请人数</span>
                  </div>
                  <p className={`text-lg font-semibold ${theme.textPrimary}`}>{opportunity.applicationCount || 0} 人</p>
                </div>
                <div className={`p-4 rounded-xl ${theme.bgTertiary} border ${theme.borderSecondary}`}>
                  <div className="flex items-center gap-2 mb-2">
                    <Clock className={`w-4 h-4 ${theme.textMuted}`} />
                    <span className={`text-sm ${theme.textMuted}`}>截止时间</span>
                  </div>
                  <p className={`text-lg font-semibold ${theme.textPrimary}`}>
                    {opportunity.deadline
                      ? new Date(opportunity.deadline).toLocaleDateString('zh-CN')
                      : '长期有效'}
                  </p>
                </div>
              </div>

              {/* 需求描述 */}
              <div className="mb-6">
                <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${theme.textSecondary}`}>
                  <Briefcase className="w-4 h-4" />
                  需求描述
                </h4>
                <p className={`p-4 rounded-xl text-sm leading-relaxed ${theme.bgTertiary} ${theme.textSecondary}`}>
                  {opportunity.description}
                </p>
              </div>

              {/* 合作要求 */}
              {opportunity.requirements && (
                <div className="mb-6">
                  <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${theme.textSecondary}`}>
                    <Target className="w-4 h-4" />
                    合作要求
                  </h4>
                  <p className={`p-4 rounded-xl text-sm leading-relaxed ${theme.bgTertiary} ${theme.textSecondary}`}>
                    {opportunity.requirements}
                  </p>
                </div>
              )}

              {/* 匹配条件 */}
              {opportunity.matchCriteria && (
                <div className="mb-6">
                  <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${theme.textSecondary}`}>
                    <Sparkles className="w-4 h-4" />
                    匹配条件
                  </h4>
                  <div className={`p-4 rounded-xl ${theme.bgTertiary} border ${theme.borderSecondary}`}>
                    <div className="space-y-3">
                      {opportunity.matchCriteria.type && Array.isArray(opportunity.matchCriteria.type) && opportunity.matchCriteria.type.length > 0 && (
                        <div className="flex items-start gap-2">
                          <span className={`text-sm ${theme.textMuted} min-w-[60px]`}>IP类型:</span>
                          <div className="flex flex-wrap gap-1">
                            {opportunity.matchCriteria.type.map((type, i) => (
                              <span
                                key={i}
                                className={`px-2 py-0.5 rounded text-xs ${theme.bgSecondary} ${theme.textSecondary} border ${theme.borderSecondary}`}
                              >
                                {type === 'illustration' ? '插画' :
                                 type === 'pattern' ? '图案' :
                                 type === 'design' ? '设计' :
                                 type === '3d_model' ? '3D模型' :
                                 type === 'digital_collectible' ? '数字藏品' : type}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {opportunity.matchCriteria.style && (
                        <div className="flex items-start gap-2">
                          <span className={`text-sm ${theme.textMuted} min-w-[60px]`}>风格:</span>
                          <span className={`text-sm ${theme.textSecondary}`}>{opportunity.matchCriteria.style}</span>
                        </div>
                      )}
                      {opportunity.matchCriteria.theme && (
                        <div className="flex items-start gap-2">
                          <span className={`text-sm ${theme.textMuted} min-w-[60px]`}>主题:</span>
                          <span className={`text-sm ${theme.textSecondary}`}>{opportunity.matchCriteria.theme}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* 匹配的IP资产 */}
              {matchingAssets.length > 0 && (
                <div className="mb-6">
                  <h4 className={`text-sm font-semibold mb-3 flex items-center gap-2 ${theme.textSecondary}`}>
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    您有 {matchingAssets.length} 个IP资产符合要求
                  </h4>
                  <div className="space-y-2">
                    {matchingAssets.slice(0, 3).map((asset) => (
                      <div
                        key={asset.id}
                        className={`flex items-center gap-3 p-3 rounded-xl ${theme.bgTertiary} border ${theme.borderSecondary}`}
                      >
                        {asset.thumbnail ? (
                          <img src={asset.thumbnail} alt={asset.name} className="w-10 h-10 rounded-lg object-cover" />
                        ) : (
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${theme.bgSecondary}`}>
                            <Briefcase className={`w-5 h-5 ${theme.textMuted}`} />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className={`text-sm font-medium truncate ${theme.textPrimary}`}>{asset.name}</p>
                          <p className={`text-xs ${theme.textMuted}`}>
                            预估价值: ¥{asset.commercialValue?.toLocaleString() || 0}
                          </p>
                        </div>
                      </div>
                    ))}
                    {matchingAssets.length > 3 && (
                      <p className={`text-sm text-center ${theme.textMuted}`}>
                        还有 {matchingAssets.length - 3} 个匹配的IP资产
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* 底部操作 */}
              <div className="flex gap-3 pt-4 border-t border-slate-800">
                <button
                  onClick={onClose}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${theme.bgTertiary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    onClose();
                    // 触发申请
                    setTimeout(() => {
                      const event = new CustomEvent('applyOpportunity', { detail: opportunity });
                      window.dispatchEvent(event);
                    }, 100);
                  }}
                  disabled={opportunity.status !== 'open'}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    opportunity.status === 'open'
                      ? (isDark ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25' : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg hover:shadow-cyan-500/15')
                      : (isDark ? 'bg-slate-800 text-slate-500 cursor-not-allowed' : 'bg-gray-200 text-gray-400 cursor-not-allowed')
                  }`}
                >
                  <span>立即申请</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
