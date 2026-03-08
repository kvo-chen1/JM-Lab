/**
 * 创建授权产品弹窗组件
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import {
  X, ShoppingBag, Upload, Loader2, CheckCircle2, DollarSign,
  Package, Image as ImageIcon, ChevronRight, Tag
} from 'lucide-react';
import { copyrightLicenseService } from '@/services/copyrightLicenseService';
import type { LicenseApplication } from '@/types/copyright-license';

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
  glass: 'backdrop-blur-xl bg-slate-900/95',
};

// 产品类别
const PRODUCT_CATEGORIES = [
  { id: 'clothing', name: '服装配饰', icon: '👕' },
  { id: 'home', name: '家居用品', icon: '🏠' },
  { id: 'stationery', name: '文具办公', icon: '✏️' },
  { id: 'digital', name: '数字产品', icon: '💻' },
  { id: 'toys', name: '玩具周边', icon: '🧸' },
  { id: 'accessories', name: '配件饰品', icon: '💍' },
  { id: 'art', name: '艺术收藏', icon: '🎨' },
  { id: 'other', name: '其他', icon: '📦' },
];

interface CreateLicensedProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  application: LicenseApplication | null;
  onSuccess?: () => void;
}

export function CreateLicensedProductModal({
  isOpen,
  onClose,
  application,
  onSuccess
}: CreateLicensedProductModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    productName: '',
    productDescription: '',
    productCategory: '',
    price: '',
    stock: '',
    productImages: [] as string[],
  });

  // 提交产品
  const handleSubmit = async () => {
    if (!formData.productName.trim()) {
      toast.error('请输入产品名称');
      return;
    }
    if (!formData.productCategory) {
      toast.error('请选择产品类别');
      return;
    }
    if (!formData.price || parseFloat(formData.price) <= 0) {
      toast.error('请输入有效的价格');
      return;
    }
    if (!formData.stock || parseInt(formData.stock) < 0) {
      toast.error('请输入有效的库存数量');
      return;
    }

    try {
      setLoading(true);
      await copyrightLicenseService.createLicensedProduct({
        applicationId: application?.id || '',
        productName: formData.productName,
        productDescription: formData.productDescription,
        productCategory: formData.productCategory,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        productImages: formData.productImages,
      });
      toast.success('产品创建成功！');
      onSuccess?.();
      onClose();
      // 重置表单
      setStep(1);
      setFormData({
        productName: '',
        productDescription: '',
        productCategory: '',
        price: '',
        stock: '',
        productImages: [],
      });
    } catch (error) {
      toast.error('产品创建失败，请重试');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  // 模拟图片上传
  const handleImageUpload = () => {
    // 这里应该实现实际的图片上传逻辑
    const mockImages = [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=400',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
    ];
    const randomImage = mockImages[Math.floor(Math.random() * mockImages.length)];
    setFormData(prev => ({
      ...prev,
      productImages: [...prev.productImages, randomImage]
    }));
  };

  // 移除图片
  const removeImage = (index: number) => {
    setFormData(prev => ({
      ...prev,
      productImages: prev.productImages.filter((_, i) => i !== index)
    }));
  };

  if (!application) return null;

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
            className={`w-full max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl ${DARK_THEME.glass} ${DARK_THEME.borderPrimary} border shadow-2xl shadow-cyan-500/10`}
          >
            {/* 头部 */}
            <div className={`flex items-center justify-between p-6 border-b ${DARK_THEME.borderPrimary}`}>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 flex items-center justify-center">
                  <ShoppingBag className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h2 className={`text-xl font-bold ${DARK_THEME.textPrimary}`}>创建授权产品</h2>
                  <p className={`text-sm ${DARK_THEME.textMuted}`}>基于 {application.request?.brandName} 授权</p>
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
                <span className={`text-sm ${step >= 1 ? DARK_THEME.textSecondary : DARK_THEME.textMuted}`}>基本信息</span>
              </div>
              <ChevronRight className="w-4 h-4 mx-2 text-slate-600" />
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 2 ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  2
                </div>
                <span className={`text-sm ${step >= 2 ? DARK_THEME.textSecondary : DARK_THEME.textMuted}`}>图片上传</span>
              </div>
              <ChevronRight className="w-4 h-4 mx-2 text-slate-600" />
              <div className="flex items-center gap-2">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                  step >= 3 ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white' : 'bg-slate-800 text-slate-500'
                }`}>
                  3
                </div>
                <span className={`text-sm ${step >= 3 ? DARK_THEME.textSecondary : DARK_THEME.textMuted}`}>确认发布</span>
              </div>
            </div>

            {/* 内容区域 */}
            <div className="p-6 overflow-y-auto max-h-[calc(90vh-220px)]">
              {step === 1 && (
                <div className="space-y-6">
                  {/* 授权信息卡片 */}
                  <div className={`p-4 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border`}>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-violet-500/20 to-purple-500/20 flex items-center justify-center">
                        <Tag className="w-5 h-5 text-violet-400" />
                      </div>
                      <div>
                        <p className={`text-sm ${DARK_THEME.textMuted}`}>授权品牌</p>
                        <p className={`font-medium ${DARK_THEME.textPrimary}`}>{application.request?.brandName}</p>
                      </div>
                    </div>
                  </div>

                  {/* 产品名称 */}
                  <div>
                    <label className={`block text-sm font-medium ${DARK_THEME.textSecondary} mb-2`}>
                      <Package className="w-4 h-4 inline mr-1" />
                      产品名称 *
                    </label>
                    <input
                      type="text"
                      value={formData.productName}
                      onChange={(e) => setFormData(prev => ({ ...prev, productName: e.target.value }))}
                      placeholder="请输入产品名称"
                      className={`w-full px-4 py-3 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border ${DARK_THEME.textPrimary} placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50`}
                    />
                  </div>

                  {/* 产品描述 */}
                  <div>
                    <label className={`block text-sm font-medium ${DARK_THEME.textSecondary} mb-2`}>
                      产品描述
                    </label>
                    <textarea
                      value={formData.productDescription}
                      onChange={(e) => setFormData(prev => ({ ...prev, productDescription: e.target.value }))}
                      placeholder="描述您的产品特点、材质、尺寸等信息..."
                      rows={4}
                      className={`w-full px-4 py-3 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border ${DARK_THEME.textPrimary} placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 resize-none`}
                    />
                  </div>

                  {/* 产品类别 */}
                  <div>
                    <label className={`block text-sm font-medium ${DARK_THEME.textSecondary} mb-3`}>
                      产品类别 *
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {PRODUCT_CATEGORIES.map(category => (
                        <button
                          key={category.id}
                          onClick={() => setFormData(prev => ({ ...prev, productCategory: category.id }))}
                          className={`p-3 rounded-xl border text-center transition-all ${
                            formData.productCategory === category.id
                              ? 'border-cyan-500/50 bg-cyan-500/10'
                              : `${DARK_THEME.borderPrimary} ${DARK_THEME.bgSecondary} hover:border-slate-600`
                          }`}
                        >
                          <div className="text-2xl mb-1">{category.icon}</div>
                          <div className={`text-xs ${formData.productCategory === category.id ? 'text-cyan-400' : DARK_THEME.textSecondary}`}>
                            {category.name}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 价格和库存 */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className={`block text-sm font-medium ${DARK_THEME.textSecondary} mb-2`}>
                        <DollarSign className="w-4 h-4 inline mr-1" />
                        价格 (¥) *
                      </label>
                      <input
                        type="number"
                        value={formData.price}
                        onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        className={`w-full px-4 py-3 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border ${DARK_THEME.textPrimary} placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50`}
                      />
                    </div>
                    <div>
                      <label className={`block text-sm font-medium ${DARK_THEME.textSecondary} mb-2`}>
                        <Package className="w-4 h-4 inline mr-1" />
                        库存数量 *
                      </label>
                      <input
                        type="number"
                        value={formData.stock}
                        onChange={(e) => setFormData(prev => ({ ...prev, stock: e.target.value }))}
                        placeholder="0"
                        min="0"
                        className={`w-full px-4 py-3 rounded-xl ${DARK_THEME.bgSecondary} ${DARK_THEME.borderPrimary} border ${DARK_THEME.textPrimary} placeholder-slate-500 focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50`}
                      />
                    </div>
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-6">
                  {/* 图片上传 */}
                  <div>
                    <label className={`block text-sm font-medium ${DARK_THEME.textSecondary} mb-3`}>
                      <ImageIcon className="w-4 h-4 inline mr-1" />
                      产品图片
                    </label>
                    
                    {/* 图片网格 */}
                    <div className="grid grid-cols-3 gap-3 mb-4">
                      {formData.productImages.map((image, index) => (
                        <div key={index} className="relative aspect-square rounded-xl overflow-hidden group">
                          <img src={image} alt={`Product ${index + 1}`} className="w-full h-full object-cover" />
                          <button
                            onClick={() => removeImage(index)}
                            className="absolute top-2 right-2 p-1 rounded-full bg-red-500/80 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                      
                      {/* 上传按钮 */}
                      <button
                        onClick={handleImageUpload}
                        className={`aspect-square rounded-xl border-2 border-dashed ${DARK_THEME.borderPrimary} flex flex-col items-center justify-center gap-2 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all`}
                      >
                        <Upload className="w-8 h-8 text-slate-500" />
                        <span className={`text-sm ${DARK_THEME.textMuted}`}>上传图片</span>
                      </button>
                    </div>
                    
                    <p className={`text-xs ${DARK_THEME.textMuted}`}>
                      建议上传 3-5 张高清产品图片，包括正面、侧面、细节等角度
                    </p>
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
                    <h3 className={`text-lg font-bold text-center ${DARK_THEME.textPrimary} mb-6`}>
                      确认发布产品
                    </h3>
                    
                    <div className="space-y-4">
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className={DARK_THEME.textMuted}>产品名称</span>
                        <span className={`font-medium ${DARK_THEME.textPrimary}`}>{formData.productName}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className={DARK_THEME.textMuted}>产品类别</span>
                        <span className={DARK_THEME.textSecondary}>
                          {PRODUCT_CATEGORIES.find(c => c.id === formData.productCategory)?.name}
                        </span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className={DARK_THEME.textMuted}>价格</span>
                        <span className="text-emerald-400 font-medium">¥{parseFloat(formData.price).toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between py-2 border-b border-slate-800">
                        <span className={DARK_THEME.textMuted}>库存</span>
                        <span className={DARK_THEME.textSecondary}>{formData.stock} 件</span>
                      </div>
                      <div className="flex justify-between py-2">
                        <span className={DARK_THEME.textMuted}>产品图片</span>
                        <span className={DARK_THEME.textSecondary}>{formData.productImages.length} 张</span>
                      </div>
                    </div>
                  </div>

                  {/* 提示信息 */}
                  <div className={`p-4 rounded-xl bg-amber-500/10 border border-amber-500/20`}>
                    <p className={`text-sm ${DARK_THEME.textSecondary}`}>
                      产品创建后将进入审核状态，审核通过后即可上架销售。根据授权协议，销售收入将按照约定的分成比例进行分配。
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
                      创建中...
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-4 h-4" />
                      创建产品
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
