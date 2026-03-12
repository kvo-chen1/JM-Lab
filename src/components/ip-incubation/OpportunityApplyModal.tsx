/**
 * 商业机会申请弹窗组件
 * 用于申请商业机会，选择IP资产并提交申请
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import { useTheme } from '@/hooks/useTheme';
import {
  X, Building2, CheckCircle2, ArrowRight, Loader2,
  Briefcase, MessageSquare, AlertCircle, ChevronDown
} from 'lucide-react';
import ipService, { type CommercialOpportunity, type IPAsset } from '@/services/ipService';

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
  glass: 'backdrop-blur-xl bg-white/90',
};

interface OpportunityApplyModalProps {
  isOpen: boolean;
  onClose: () => void;
  opportunity: CommercialOpportunity | null;
  ipAssets?: IPAsset[];
  onSuccess?: () => void;
}

export function OpportunityApplyModal({
  isOpen,
  onClose,
  opportunity,
  ipAssets = [],
  onSuccess
}: OpportunityApplyModalProps) {
  const { isDark } = useTheme();
  const theme = isDark ? DARK_THEME : LIGHT_THEME;

  const [selectedAssetId, setSelectedAssetId] = useState<string>('');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showAssetDropdown, setShowAssetDropdown] = useState(false);

  // 重置状态
  useEffect(() => {
    if (isOpen) {
      setSelectedAssetId('');
      setMessage('');
      setIsSubmitting(false);
    }
  }, [isOpen]);

  // 监听自定义事件（从详情弹窗触发申请）
  useEffect(() => {
    const handleApplyEvent = (e: CustomEvent<CommercialOpportunity>) => {
      if (e.detail.id === opportunity?.id) {
        // 保持弹窗打开
      }
    };
    window.addEventListener('applyOpportunity', handleApplyEvent as EventListener);
    return () => {
      window.removeEventListener('applyOpportunity', handleApplyEvent as EventListener);
    };
  }, [opportunity]);

  if (!opportunity) return null;

  // 获取匹配的IP资产
  const getMatchingAssets = () => {
    if (!opportunity.matchCriteria?.type || ipAssets.length === 0) return ipAssets;

    return ipAssets.filter(asset =>
      opportunity.matchCriteria?.type?.includes(asset.type)
    );
  };

  const matchingAssets = getMatchingAssets();
  const selectedAsset = ipAssets.find(a => a.id === selectedAssetId);

  // 提交申请
  const handleSubmit = async () => {
    if (!selectedAssetId) {
      toast.error('请选择要申请的IP资产');
      return;
    }

    try {
      setIsSubmitting(true);
      const success = await ipService.applyOpportunity(opportunity.id, selectedAssetId);
      
      if (success) {
        toast.success('申请已提交，等待品牌方审核');
        onSuccess?.();
        onClose();
      } else {
        toast.error('申请提交失败，请重试');
      }
    } catch (error) {
      console.error('申请失败:', error);
      toast.error('申请提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  // 获取资产类型标签
  const getAssetTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      'illustration': '插画',
      'pattern': '图案',
      'design': '设计',
      '3d_model': '3D模型',
      'digital_collectible': '数字藏品'
    };
    return labels[type] || type;
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
            className={`w-full max-w-lg overflow-hidden rounded-2xl ${theme.glass} ${theme.borderPrimary} border shadow-2xl`}
          >
            {/* 头部 */}
            <div className={`p-6 border-b ${theme.borderSecondary}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isDark ? 'bg-gradient-to-br from-cyan-500/20 to-blue-500/20' : 'bg-gradient-to-br from-cyan-100 to-blue-100'}`}>
                    {opportunity.brandLogo ? (
                      <img src={opportunity.brandLogo} alt={opportunity.brandName} className="w-8 h-8 object-contain rounded-lg" />
                    ) : (
                      <Building2 className={`w-6 h-6 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                    )}
                  </div>
                  <div>
                    <h3 className={`text-lg font-bold ${theme.textPrimary}`}>申请商业机会</h3>
                    <p className={`text-sm ${theme.textMuted}`}>{opportunity.brandName} · {opportunity.name}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center transition-colors ${theme.bgTertiary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* 内容 */}
            <div className="p-6 space-y-6">
              {/* IP资产选择 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                  选择IP资产 <span className="text-red-400">*</span>
                </label>
                
                {ipAssets.length === 0 ? (
                  <div className={`p-4 rounded-xl border ${theme.bgTertiary} ${theme.borderSecondary}`}>
                    <div className="flex items-center gap-2 text-amber-400">
                      <AlertCircle className="w-5 h-5" />
                      <span className="text-sm">您还没有IP资产，请先创建IP资产</span>
                    </div>
                  </div>
                ) : (
                  <div className="relative">
                    <button
                      onClick={() => setShowAssetDropdown(!showAssetDropdown)}
                      className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${theme.bgSecondary} ${theme.borderSecondary} ${theme.textPrimary} hover:border-cyan-500/30`}
                    >
                      {selectedAsset ? (
                        <div className="flex items-center gap-3">
                          {selectedAsset.thumbnail ? (
                            <img src={selectedAsset.thumbnail} alt={selectedAsset.name} className="w-8 h-8 rounded-lg object-cover" />
                          ) : (
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme.bgTertiary}`}>
                              <Briefcase className={`w-4 h-4 ${theme.textMuted}`} />
                            </div>
                          )}
                          <div className="text-left">
                            <p className={`text-sm font-medium ${theme.textPrimary}`}>{selectedAsset.name}</p>
                            <p className={`text-xs ${theme.textMuted}`}>{getAssetTypeLabel(selectedAsset.type)} · ¥{selectedAsset.commercialValue?.toLocaleString() || 0}</p>
                          </div>
                        </div>
                      ) : (
                        <span className={theme.textMuted}>请选择要申请的IP资产</span>
                      )}
                      <ChevronDown className={`w-5 h-5 transition-transform ${showAssetDropdown ? 'rotate-180' : ''} ${theme.textMuted}`} />
                    </button>

                    {/* 下拉列表 */}
                    <AnimatePresence>
                      {showAssetDropdown && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          className={`absolute top-full left-0 right-0 mt-2 max-h-60 overflow-y-auto rounded-xl border shadow-xl z-10 ${theme.bgSecondary} ${theme.borderSecondary}`}
                        >
                          {/* 匹配的资产 */}
                          {matchingAssets.length > 0 && (
                            <>
                              <div className={`px-4 py-2 text-xs font-medium ${theme.textMuted} ${theme.bgTertiary}`}>
                                推荐的IP资产 ({matchingAssets.length})
                              </div>
                              {matchingAssets.map((asset) => (
                                <button
                                  key={asset.id}
                                  onClick={() => {
                                    setSelectedAssetId(asset.id);
                                    setShowAssetDropdown(false);
                                  }}
                                  className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${selectedAssetId === asset.id ? (isDark ? 'bg-cyan-500/10' : 'bg-cyan-50') : ''} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
                                >
                                  {asset.thumbnail ? (
                                    <img src={asset.thumbnail} alt={asset.name} className="w-8 h-8 rounded-lg object-cover" />
                                  ) : (
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme.bgTertiary}`}>
                                      <Briefcase className={`w-4 h-4 ${theme.textMuted}`} />
                                    </div>
                                  )}
                                  <div className="flex-1 text-left">
                                    <p className={`text-sm font-medium ${theme.textPrimary}`}>{asset.name}</p>
                                    <p className={`text-xs ${theme.textMuted}`}>{getAssetTypeLabel(asset.type)} · ¥{asset.commercialValue?.toLocaleString() || 0}</p>
                                  </div>
                                  {selectedAssetId === asset.id && (
                                    <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                                  )}
                                </button>
                              ))}
                            </>
                          )}

                          {/* 其他资产 */}
                          {ipAssets.filter(a => !matchingAssets.find(m => m.id === a.id)).length > 0 && (
                            <>
                              <div className={`px-4 py-2 text-xs font-medium ${theme.textMuted} ${theme.bgTertiary}`}>
                                其他IP资产
                              </div>
                              {ipAssets
                                .filter(a => !matchingAssets.find(m => m.id === a.id))
                                .map((asset) => (
                                  <button
                                    key={asset.id}
                                    onClick={() => {
                                      setSelectedAssetId(asset.id);
                                      setShowAssetDropdown(false);
                                    }}
                                    className={`w-full flex items-center gap-3 px-4 py-3 transition-colors ${selectedAssetId === asset.id ? (isDark ? 'bg-cyan-500/10' : 'bg-cyan-50') : ''} ${isDark ? 'hover:bg-slate-800' : 'hover:bg-gray-100'}`}
                                  >
                                    {asset.thumbnail ? (
                                      <img src={asset.thumbnail} alt={asset.name} className="w-8 h-8 rounded-lg object-cover" />
                                    ) : (
                                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${theme.bgTertiary}`}>
                                        <Briefcase className={`w-4 h-4 ${theme.textMuted}`} />
                                      </div>
                                    )}
                                    <div className="flex-1 text-left">
                                      <p className={`text-sm font-medium ${theme.textPrimary}`}>{asset.name}</p>
                                      <p className={`text-xs ${theme.textMuted}`}>{getAssetTypeLabel(asset.type)} · ¥{asset.commercialValue?.toLocaleString() || 0}</p>
                                    </div>
                                    {selectedAssetId === asset.id && (
                                      <CheckCircle2 className={`w-5 h-5 ${isDark ? 'text-cyan-400' : 'text-cyan-600'}`} />
                                    )}
                                  </button>
                                ))}
                            </>
                          )}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                )}

                {/* 匹配提示 */}
                {selectedAssetId && matchingAssets.find(a => a.id === selectedAssetId) && (
                  <div className={`mt-2 flex items-center gap-2 text-sm ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`}>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>该IP资产符合此机会的匹配条件</span>
                  </div>
                )}
              </div>

              {/* 申请留言 */}
              <div>
                <label className={`block text-sm font-medium mb-2 ${theme.textSecondary}`}>
                  申请留言 <span className={`text-xs ${theme.textMuted}`}>(选填)</span>
                </label>
                <div className="relative">
                  <MessageSquare className={`absolute left-3 top-3 w-5 h-5 ${theme.textMuted}`} />
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="向品牌方介绍您的IP资产和合作意向..."
                    rows={4}
                    className={`w-full pl-10 pr-4 py-3 rounded-xl border focus:outline-none focus:ring-2 resize-none transition-all ${theme.bgSecondary} ${theme.borderSecondary} ${theme.textPrimary} ${isDark ? 'focus:ring-cyan-500/50 placeholder:text-slate-500' : 'focus:ring-cyan-400/50 placeholder:text-gray-400'}`}
                  />
                </div>
                <p className={`mt-1 text-xs ${theme.textMuted}`}>
                  简洁明了的介绍可以提高申请通过率
                </p>
              </div>

              {/* 提示信息 */}
              <div className={`p-4 rounded-xl ${isDark ? 'bg-amber-500/10 border border-amber-500/20' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-start gap-3">
                  <AlertCircle className={`w-5 h-5 flex-shrink-0 ${isDark ? 'text-amber-400' : 'text-amber-600'}`} />
                  <div>
                    <p className={`text-sm font-medium ${isDark ? 'text-amber-400' : 'text-amber-600'}`}>申请须知</p>
                    <ul className={`mt-1 text-xs space-y-1 ${theme.textMuted}`}>
                      <li>• 提交申请后，品牌方将在3-5个工作日内审核</li>
                      <li>• 审核通过后，品牌方将与您联系沟通合作细节</li>
                      <li>• 请确保您的IP资产已完成版权存证</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部操作 */}
            <div className={`p-6 border-t ${theme.borderSecondary}`}>
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={isSubmitting}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all ${theme.bgTertiary} ${theme.textSecondary} ${isDark ? 'hover:bg-slate-700' : 'hover:bg-gray-200'} disabled:opacity-50`}
                >
                  取消
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedAssetId || ipAssets.length === 0}
                  className={`flex-1 py-3 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                    isDark
                      ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white hover:shadow-lg hover:shadow-cyan-500/25 disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'bg-gradient-to-r from-cyan-600 to-blue-700 text-white hover:shadow-lg hover:shadow-cyan-500/15 disabled:opacity-50 disabled:cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>提交中...</span>
                    </>
                  ) : (
                    <>
                      <span>提交申请</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
