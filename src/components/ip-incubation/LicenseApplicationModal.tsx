/**
 * 授权申请弹窗组件
 */

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  X, Building2, Send, Loader2, CheckCircle2, FileText,
  Lightbulb, Package, MessageSquare, ChevronRight
} from 'lucide-react';
import { copyrightLicenseService } from '@/services/copyrightLicenseService';
import type { LicenseRequest, SubmitApplicationDTO } from '@/types/copyright-license';
import ipService from '@/services/ipService';

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
  glass: 'backdrop-blur-xl bg-slate-900/95',
};

// 预期产品类型
const PRODUCT_TYPES = [
  { id: 't_shirt', name: 'T恤/服装', icon: '👕' },
  { id: 'mug', name: '马克杯', icon: '☕' },
  { id: 'poster', name: '海报/挂画', icon: '🖼️' },
  { id: 'phone_case', name: '手机壳', icon: '📱' },
  { id: 'tote_bag', name: '帆布包', icon: '👜' },
  { id: 'sticker', name: '贴纸', icon: '🏷️' },
  { id: 'keychain', name: '钥匙扣', icon: '🔑' },
  { id: 'notebook', name: '笔记本', icon: '📓' },
  { id: 'digital', name: '数字藏品', icon: '💎' },
  { id: 'other', name: '其他', icon: '📦' },
];

interface LicenseApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: LicenseRequest | null;
  onSuccess?: () => void;
}

export function LicenseApplicationModal({
  isOpen,
  onClose,
  request,
  onSuccess
}: LicenseApplicationModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [userIPAssets, setUserIPAssets] = useState<any[]>([]);
  const [formData, setFormData] = useState<SubmitApplicationDTO>({
    requestId: '',
    ipAssetId: '',
    message: '',
    proposedUsage: '',
    expectedProducts: [],
  });

  // 加载用户的IP资产
  useEffect(() => {
    if (isOpen && request) {
      setFormData(prev => ({ ...prev, requestId: request.id }));
      loadUserIPAssets();
    }
  }, [isOpen, request]);

  const loadUserIPAssets = async () => {
    try {
      const assets = await ipService.getIPAssets();
      setUserIPAssets(assets.filter(a => a.status === 'active'));
    } catch (error) {
      console.error('加载IP资产失败:', error);
    }
  };

  // 提交申请
  const handleSubmit = async () => {
    if (!formData.proposedUsage.trim()) {
      toast.error('请填写计划用途');
      return;
    }
    if (formData.expectedProducts.length === 0) {
      toast.error('请至少选择一种预期产品类型');
      return;
    }

    try {
      setLoading(true);
      await copyrightLicenseService.submitApplication(formData);
      toast.success('申请提交成功！');
      onSuccess?.();
      onClose();
      // 重置表单
      setStep(1);
      setFormData({
        requestId: request?.id || '',
        ipAssetId: '',
        message: '',
        proposedUsage: '',
        expectedProducts: [],
      });
    } catch (error) {
      toast.error('申请提交失败，请重试');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 切换产品类型选择
  const toggleProductType = (typeId: string) => {
    setFormData(prev => ({
      ...prev,
      expectedProducts: prev.expectedProducts?.includes(typeId)
        ? prev.expectedProducts.filter(t => t !== typeId)
        : [...(prev.expectedProducts || []), typeId]
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

  if (!request) return null;

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
            className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl ${DARK_THEME.glass} ${DARK_THEME.borderPrimary} border ${DARK_THEME.glowPrimary}`}
          >
            {/* 头部 */}
            <div className={`flex items-center justify-between p-6 border-b ${DARK_THEME.borderPrimary}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-500/20 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-cyan-400" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${DARK_THEME.textPrimary}`}>授权申请</h2>
                  <p className={`text-sm ${DARK_THEME.textMuted}`}>向 {request.brandName} 提交申请</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className={`p-2 rounded-lg ${DARK_THEME.bgSecondary} ${DARK_THEME.textSecondary} hover:bg-slate-800 transition-colors`}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 进度指示器 */}
            <div className={`flex items-center px-6 py-4 border-b ${DARK_THEME.borderPrimary}`}>
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 1 ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  1
                </div>
                <span className={`text-sm ${step >= 1 ? DARK_THEME.textSecondary : DARK_THEME.textMuted}`}>选择IP</span>
              </div>
              <ChevronRight className="w-4 h-4 mx-2 text-slate-600" />
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  2
                </div>
                <span className={`text-sm ${step >= 2 ? DARK_THEME.textSecondary : DARK_THEME.textMuted}`}>填写信息</span>
              </div>
              <ChevronRight className="w-4 h-4 mx-2 text-slate-600" />
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 3 ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  3
                </div>
                <span className={`text-sm ${step >= 3 ? DARK_THEME.textSecondary : DARK_THEME.textMuted}`}>确认提交</span>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
              {step === 1 && (
                <div className="space-y-6">
                  {/* 品牌信息卡片 */}
                  <div className={`p-4 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border`}>
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                        {request.brandLogo ? (
                          <img src={request.brandLogo} alt={request.brandName} className="w-8 h-8 object-contain" />
                        ) : (
                          <Building2 className="w-6 h-6 text-violet-400" />
                        )}
                      </div>
                      <div>
                        <h3 className={`font-semibold ${DARK_THEME.textPrimary}`}>{request.brandName}</h3>
                        <p className={`text-sm ${DARK_THEME.textMuted}`}>{request.title}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4 text-sm">
                      <span className={DARK_THEME.textMuted}>
                        授权费用: <span className="text-emerald-400 font-medium">{formatFee(request.licenseFeeMin, request.licenseFeeMax)}</span>
                      </span>
                      {request.revenueShareRate && (
                        <span className={DARK_THEME.textMuted}>
                          分成: <span className="text-emerald-400 font-medium">{request.revenueShareRate}%</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* IP资产选择 */}
                  <div>
                    <label className={`block text-sm font-medium ${DARK_THEME.textSecondary} mb-3`}>
                      选择要授权的IP资产（可选）
                    </label>
                    {userIPAssets.length === 0 ? (
                      <div className={`p-4 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border text-center`}>
                        <p className={DARK_THEME.textMuted}>您还没有可用的IP资产</p>
                        <p className={`text-sm ${DARK_THEME.textMuted} mt-1`}>可以直接提交申请，后续补充IP信息</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3">
                        <button
                          onClick={() => setFormData(prev => ({ ...prev, ipAssetId: '' }))}
                          className={`p-3 rounded-xl border text-left transition-all ${
                            !formData.ipAssetId
                              ? 'border-cyan-500/50 bg-cyan-500/10'
                              : `${DARK_THEME.borderPrimary} ${DARK_THEME.bgSecondary} hover:border-slate-600`
                          }`}
                        >
                          <div className={`font-medium ${!formData.ipAssetId ? 'text-cyan-400' : DARK_THEME.textSecondary}`}>
                            暂不选择
                          </div>
                          <p className={`text-xs ${DARK_THEME.textMuted} mt-1`}>后续补充IP信息</p>
                        </button>
                        {userIPAssets.map(asset => (
                          <button
                            key={asset.id}
                            onClick={() => setFormData(prev => ({ ...prev, ipAssetId: asset.id }))}
                            className={`p-3 rounded-xl border text-left transition-all ${
                              formData.ipAssetId === asset.id
                                ? 'border-cyan-500/50 bg-cyan-500/10'
                                : `${DARK_THEME.borderPrimary} ${DARK_THEME.bgSecondary} hover:border-slate-600`
                            }`}
                          >
                            <div className={`font-medium ${formData.ipAssetId === asset.id ? 'text-cyan-400' : DARK_THEME.textSecondary}`}>
                              {asset.name}
                            </div>
                            <p className={`text-xs ${DARK_THEME.textMuted} mt-1 line-clamp-1`}>{asset.description}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  {/* 计划用途 */}
                  <div>
                    <label className={`block text-sm font-medium ${DARK_THEME.textSecondary} mb-2`}>
                      <Lightbulb className="w-4 h-4 inline mr-1" />
                      计划用途描述 *
                    </label>
                    <textarea
                      value={formData.proposedUsage}
                      onChange={(e) => setFormData(prev => ({ ...prev, proposedUsage: e.target.value }))}
                      placeholder="请描述您计划如何使用该品牌授权，包括使用场景、目标受众等..."
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border ${DARK_THEME.textPrimary} placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none`}
                    />
                  </div>

                  {/* 预期产品类型 */}
                  <div>
                    <label className={`block text-sm font-medium ${DARK_THEME.textSecondary} mb-3`}>
                      <Package className="w-4 h-4 inline mr-1" />
                      预期产品类型 *（多选）
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {PRODUCT_TYPES.map(type => (
                        <button
                          key={type.id}
                          onClick={() => toggleProductType(type.id)}
                          className={`p-2 rounded-lg border text-sm transition-all ${
                            formData.expectedProducts?.includes(type.id)
                              ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                              : `${DARK_THEME.borderPrimary} ${DARK_THEME.bgSecondary} ${DARK_THEME.textSecondary} hover:border-slate-600`
                          }`}
                        >
                          <span className="mr-1">{type.icon}</span>
                          {type.name}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 申请留言 */}
                  <div>
                    <label className={`block text-sm font-medium ${DARK_THEME.textSecondary} mb-2`}>
                      <MessageSquare className="w-4 h-4 inline mr-1" />
                      申请留言（可选）
                    </label>
                    <textarea
                      value={formData.message}
                      onChange={(e) => setFormData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder="想对品牌方说的话..."
                      rows={3}
                      className={`w-full px-4 py-3 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border ${DARK_THEME.textPrimary} placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none`}
                    />
                  </div>
                </div>
              )}

              {step === 3 && (
                <div className="space-y-6">
                  {/* 确认信息 */}
                  <div className={`p-6 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border`}>
                    <div className="flex items-center justify-center mb-6">
                      <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                        <CheckCircle2 className="w-8 h-8 text-emerald-400" />
                      </div>
                    </div>
                    <h3 className={`text-lg font-bold text-center ${DARK_THEME.textPrimary} mb-4`}>
                      确认提交申请
                    </h3>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span className={DARK_THEME.textMuted}>申请品牌</span>
                        <span className={DARK_THEME.textPrimary}>{request.brandName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className={DARK_THEME.textMuted}>授权需求</span>
                        <span className={DARK_THEME.textPrimary}>{request.title}</span>
                      </div>
                      {formData.ipAssetId && (
                        <div className="flex justify-between">
                          <span className={DARK_THEME.textMuted}>IP资产</span>
                          <span className={DARK_THEME.textPrimary}>
                            {userIPAssets.find(a => a.id === formData.ipAssetId)?.name || '已选择'}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className={DARK_THEME.textMuted}>预期产品</span>
                        <span className={DARK_THEME.textPrimary}>
                          {formData.expectedProducts?.length} 种类型
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className={`p-4 rounded-xl bg-amber-500/10 border border-amber-500/20`}>
                    <p className={`text-sm ${DARK_THEME.textSecondary}`}>
                      提交申请后，品牌方将在7个工作日内进行审核。审核通过后您将收到通知，并可以查看品牌方的联系方式。
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* 底部按钮 */}
            <div className={`flex items-center justify-between p-6 border-t ${DARK_THEME.borderPrimary}`}>
              {step > 1 ? (
                <button
                  onClick={() => setStep(step - 1)}
                  className={`px-6 py-2.5 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.textSecondary} hover:bg-slate-800 transition-colors`}
                >
                  上一步
                </button>
              ) : (
                <div />
              )}

              {step < 3 ? (
                <button
                  onClick={() => setStep(step + 1)}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white font-medium hover:shadow-lg hover:shadow-cyan-500/25 transition-all flex items-center gap-2"
                >
                  下一步
                  <ChevronRight className="w-4 h-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="px-8 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-600 text-white font-medium hover:shadow-lg hover:shadow-emerald-500/25 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      提交中...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4" />
                      提交申请
                    </>
                  )}
                </button>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
