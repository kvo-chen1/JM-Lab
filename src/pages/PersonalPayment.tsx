import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { apiClient } from '@/lib/apiClient';
import { useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Crown,
  CreditCard,
  ShieldCheck,
  Clock,
  CheckCircle2,
  AlertCircle,
  Loader2,
  ChevronLeft,
  Sparkles,
  Lock,
  Copy,
  Check,
  Camera,
  X
} from 'lucide-react';
import { toast } from 'sonner';

// 支付方式图标组件
const PaymentIcon: React.FC<{ method: string; className?: string }> = ({ method, className = '' }) => {
  const icons: Record<string, React.ReactNode> = {
    wechat: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z" />
      </svg>
    ),
    alipay: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.5 2.5h13a3 3 0 013 3v13a3 3 0 01-3 3h-13a3 3 0 01-3-3v-13a3 3 0 013-3zm12.35 4.75a.65.65 0 00-.65-.65h-2.6a.65.65 0 00-.65.65v.6h3.9v-.6zm-4.55 2.6c-.36.13-.75.2-1.15.2-1.6 0-2.9-1.1-2.9-2.45 0-1.35 1.3-2.45 2.9-2.45.4 0 .79.07 1.15.2a3.78 3.78 0 00-1.15-.2c-1.6 0-2.9 1.1-2.9 2.45 0 1.35 1.3 2.45 2.9 2.45.4 0 .79-.07 1.15-.2zm-3.25 1.3h4.55v.65h-1.3v3.9h-.65v-3.9h-2.6v-.65zm-2.6 0h.65v4.55h-.65v-4.55zm-1.3 0h.65v4.55h-.65v-4.55zm5.85 4.55h-.65v-1.95h.65v1.95zm-2.6 0h-.65v-1.95h.65v-1.95z" />
      </svg>
    ),
  };
  return <>{icons[method] || <CreditCard className={className} />}</>;
};

// 动画配置
const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const PersonalPayment: React.FC = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'wechat' | 'alipay'>('wechat');
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentCode, setPaymentCode] = useState<string>('');
  const [qrCodeConfig, setQrCodeConfig] = useState<any>(null);
  const [step, setStep] = useState<'select' | 'pay' | 'verify' | 'success'>('select');

  // 表单数据
  const [transactionId, setTransactionId] = useState('');
  const [payerName, setPayerName] = useState('');
  const [notes, setNotes] = useState('');
  const [screenshot, setScreenshot] = useState<File | null>(null);
  const [screenshotPreview, setScreenshotPreview] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  // 获取从会员中心传递过来的套餐信息
  const plan = (location.state as any)?.plan || 'premium';
  const isRenew = (location.state as any)?.renew || false;

  // 会员套餐数据
  const membershipPlans = {
    premium: {
      name: '高级会员',
      nameEn: 'Premium',
      price: 99,
      originalPrice: 129,
      periodText: '1个月',
      duration: 30 * 24 * 60 * 60 * 1000,
      features: ['AI生成无限制', '50GB云存储', '优先客服支持', '高级模板库'],
      badge: '推荐',
      color: 'from-violet-500 to-purple-600',
      bgColor: 'bg-violet-50',
      borderColor: 'border-violet-200'
    },
    vip: {
      name: 'VIP会员',
      nameEn: 'VIP',
      price: 199,
      originalPrice: 299,
      periodText: '1个月',
      duration: 30 * 24 * 60 * 60 * 1000,
      features: ['AI生成无限制', '无限云存储', '专属客服', '全部模板库', '团队协作'],
      badge: '尊享',
      color: 'from-amber-400 to-orange-500',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200'
    }
  };

  const selectedPlan = membershipPlans[plan as keyof typeof membershipPlans] || membershipPlans.premium;

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // 获取收款码配置
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const response = await apiClient.get('/api/payment/config');
        if (response.ok && response.data?.success) {
          setQrCodeConfig(response.data.data.personal);
          if (response.data.data.personal.wechat.enabled) {
            setPaymentMethod('wechat');
          } else if (response.data.data.personal.alipay.enabled) {
            setPaymentMethod('alipay');
          }
        }
      } catch (error) {
        console.error('获取支付配置失败:', error);
      }
    };
    fetchConfig();
  }, []);

  if (!user || !selectedPlan) {
    return null;
  }

  // 创建订单
  const handleCreateOrder = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/api/payment/personal/create', {
        plan,
        amount: selectedPlan.price,
        paymentMethod,
        period: 'monthly'
      });

      if (response.ok && response.data?.success) {
        setOrderId(response.data.data.orderId);
        setPaymentCode(response.data.data.paymentCode);
        setStep('pay');
        toast.success('订单创建成功，请完成支付');
      } else {
        setError(response.data?.error || '创建订单失败');
      }
    } catch (err) {
      console.error('创建订单失败:', err);
      setError('创建订单失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  // 复制支付识别码
  const handleCopyCode = () => {
    navigator.clipboard.writeText(paymentCode);
    setCopied(true);
    toast.success('支付识别码已复制');
    setTimeout(() => setCopied(false), 2000);
  };

  // 处理文件选择
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('图片大小不能超过5MB');
        return;
      }
      setScreenshot(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setScreenshotPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // 提交支付凭证
  const handleSubmitProof = async () => {
    if (!transactionId && !screenshot) {
      toast.error('请填写支付订单号或上传支付截图');
      return;
    }

    try {
      setLoading(true);

      let screenshotUrl = null;

      if (screenshot && orderId) {
        const formData = new FormData();
        formData.append('file', screenshot);
        formData.append('orderId', orderId);

        const uploadResponse = await fetch('/api/payment/personal/upload', {
          method: 'POST',
          body: formData,
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        });

        if (uploadResponse.ok) {
          const uploadData = await uploadResponse.json();
          if (uploadData.success) {
            screenshotUrl = uploadData.url;
          }
        }
      }

      const response = await apiClient.post('/api/payment/personal/submit-proof', {
        orderId,
        transactionId,
        screenshotUrl,
        payerName,
        notes
      });

      if (response.ok && response.data?.success) {
        setStep('success');
        toast.success('支付凭证已提交，请等待审核');
      } else {
        toast.error(response.data?.error || '提交凭证失败');
      }
    } catch (err) {
      console.error('提交凭证失败:', err);
      toast.error('提交凭证失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        {/* 返回按钮 */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/membership')}
          className="group flex items-center gap-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 transition-colors mb-8"
        >
          <div className="p-2 rounded-full bg-white dark:bg-slate-800 shadow-sm group-hover:shadow-md transition-shadow">
            <ChevronLeft className="w-5 h-5" />
          </div>
          <span className="font-medium">返回会员中心</span>
        </motion.button>

        {/* 页面标题 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-10"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-violet-100 to-purple-100 dark:from-violet-900/30 dark:to-purple-900/30 text-violet-700 dark:text-violet-300 text-sm font-medium mb-4">
            <Sparkles className="w-4 h-4" />
            <span>个人收款码支付</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent mb-3">
            {isRenew ? '续费会员' : '升级会员'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {isRenew ? `续费 ${selectedPlan.name}，继续享受专属权益` : `升级到 ${selectedPlan.name}，解锁更多高级功能`}
          </p>
        </motion.div>

        {/* 错误提示 */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-6 p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-800/50 flex items-center gap-3"
            >
              <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 主内容区 - 左右布局 */}
        <motion.div
          variants={staggerContainer}
          initial="initial"
          animate="animate"
          className="grid lg:grid-cols-5 gap-6"
        >
          {/* 左侧：套餐信息 */}
          <motion.div variants={fadeInUp} className="lg:col-span-2 space-y-6">
            {/* 套餐卡片 */}
            <div className={`relative overflow-hidden rounded-3xl bg-gradient-to-br ${selectedPlan.color} p-1 shadow-xl shadow-violet-500/20`}>
              <div className="bg-white dark:bg-slate-800 rounded-[22px] p-6 sm:p-8">
                {/* 徽章 */}
                <div className="absolute top-4 right-4">
                  <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-gradient-to-r from-violet-500 to-purple-500 text-white text-xs font-bold shadow-lg">
                    <Sparkles className="w-3 h-3" />
                    {selectedPlan.badge}
                  </span>
                </div>

                <div className="flex items-center gap-3 mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${selectedPlan.color} flex items-center justify-center shadow-lg`}>
                    <Crown className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white">{selectedPlan.name}</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">{selectedPlan.nameEn} Plan</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2 mb-1">
                    <span className="text-4xl sm:text-5xl font-bold text-slate-900 dark:text-white">¥{selectedPlan.price}</span>
                    <span className="text-slate-400 line-through text-lg">¥{selectedPlan.originalPrice}</span>
                  </div>
                  <p className="text-slate-500 dark:text-slate-400 text-sm">/{selectedPlan.periodText}</p>
                </div>

                <div className="space-y-3">
                  {selectedPlan.features.map((feature, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="flex items-center gap-3 text-slate-600 dark:text-slate-300"
                    >
                      <div className="w-5 h-5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
                        <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                      </div>
                      <span className="text-sm">{feature}</span>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            {/* 安全保障 */}
            <div className="bg-white dark:bg-slate-800/50 backdrop-blur rounded-2xl p-6 border border-slate-100 dark:border-slate-700/50 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">安全保障</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">银行级数据加密保护</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                </div>
                <div>
                  <h4 className="font-semibold text-slate-900 dark:text-white">即时到账</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">支付成功后立即生效</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* 右侧：支付步骤 */}
          <motion.div variants={fadeInUp} className="lg:col-span-3">
            <AnimatePresence mode="wait">
              {step === 'select' && (
                <motion.div
                  key="select"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={fadeInUp}
                  className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8"
                >
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">选择支付方式</h2>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {qrCodeConfig?.wechat?.enabled && (
                      <button
                        onClick={() => setPaymentMethod('wechat')}
                        className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                          paymentMethod === 'wechat'
                            ? 'border-emerald-500 bg-emerald-50/80 shadow-lg'
                            : 'border-slate-100 dark:border-slate-700 hover:border-slate-200'
                        }`}
                      >
                        {paymentMethod === 'wechat' && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center mb-3">
                          <PaymentIcon method="wechat" className="w-6 h-6 text-emerald-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">微信支付</h3>
                        <p className="text-xs text-slate-500">使用微信扫码支付</p>
                      </button>
                    )}

                    {qrCodeConfig?.alipay?.enabled && (
                      <button
                        onClick={() => setPaymentMethod('alipay')}
                        className={`relative p-6 rounded-2xl border-2 transition-all text-left ${
                          paymentMethod === 'alipay'
                            ? 'border-blue-500 bg-blue-50/80 shadow-lg'
                            : 'border-slate-100 dark:border-slate-700 hover:border-slate-200'
                        }`}
                      >
                        {paymentMethod === 'alipay' && (
                          <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center">
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </div>
                        )}
                        <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center mb-3">
                          <PaymentIcon method="alipay" className="w-6 h-6 text-blue-600" />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white">支付宝</h3>
                        <p className="text-xs text-slate-500">使用支付宝扫码支付</p>
                      </button>
                    )}
                  </div>

                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={handleCreateOrder}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl shadow-violet-500/25 hover:shadow-2xl transition-all disabled:opacity-70"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center gap-3">
                        <Loader2 className="w-6 h-6 animate-spin" />
                        <span>创建订单中...</span>
                      </div>
                    ) : (
                      <div className="flex items-center justify-center gap-3">
                        <Lock className="w-5 h-5" />
                        <span>确认支付 ¥{selectedPlan.price}</span>
                      </div>
                    )}
                  </motion.button>
                </motion.div>
              )}

              {step === 'pay' && (
                <motion.div
                  key="pay"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={fadeInUp}
                  className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8"
                >
                  <div className="text-center mb-6">
                    <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">
                      请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫码支付
                    </h2>
                    <p className="text-slate-500">支付金额：<span className="text-2xl font-bold text-violet-600">¥{selectedPlan.price}</span></p>
                  </div>

                  {/* 支付识别码 */}
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-amber-700 dark:text-amber-300 font-medium">支付识别码（请备注）</p>
                        <p className="text-2xl font-bold text-amber-800 dark:text-amber-200">{paymentCode}</p>
                      </div>
                      <button
                        onClick={handleCopyCode}
                        className="p-2 rounded-lg bg-amber-100 dark:bg-amber-800 hover:bg-amber-200 transition-colors"
                      >
                        {copied ? <Check className="w-5 h-5 text-amber-600" /> : <Copy className="w-5 h-5 text-amber-600" />}
                      </button>
                    </div>
                    <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
                      支付时请在备注中填写此识别码，以便我们确认您的订单
                    </p>
                  </div>

                  {/* 收款码 */}
                  {(() => {
                    const qrCodeUrl = paymentMethod === 'wechat'
                      ? qrCodeConfig?.wechat?.qrCodeUrl
                      : qrCodeConfig?.alipay?.qrCodeUrl;
                    return qrCodeUrl ? (
                      <div className="flex justify-center mb-6">
                        <div className="bg-white p-4 rounded-2xl shadow-lg">
                          <img src={qrCodeUrl} alt="收款码" className="w-64 h-64 object-contain" />
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8 text-slate-500">
                        <AlertCircle className="w-12 h-12 mx-auto mb-2" />
                        <p>收款码未配置</p>
                      </div>
                    );
                  })()}

                  {/* 支付说明 */}
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6">
                    <h3 className="font-medium text-slate-900 dark:text-white mb-2">支付步骤：</h3>
                    <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-1 list-decimal list-inside">
                      {qrCodeConfig?.instructions?.map((instruction: string, index: number) => (
                        <li key={index}>{instruction}</li>
                      ))}
                    </ol>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('select')}
                      className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors"
                    >
                      上一步
                    </button>
                    <button
                      onClick={() => setStep('verify')}
                      className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all"
                    >
                      已完成支付
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'verify' && (
                <motion.div
                  key="verify"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={fadeInUp}
                  className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl p-6 sm:p-8"
                >
                  <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">提交支付凭证</h2>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      支付订单号/流水号 <span className="text-slate-400">（选填）</span>
                    </label>
                    <input
                      type="text"
                      value={transactionId}
                      onChange={(e) => setTransactionId(e.target.value)}
                      placeholder="请输入微信支付或支付宝的订单号"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      付款人姓名 <span className="text-slate-400">（选填）</span>
                    </label>
                    <input
                      type="text"
                      value={payerName}
                      onChange={(e) => setPayerName(e.target.value)}
                      placeholder="请输入付款人姓名"
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all"
                    />
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      支付截图 <span className="text-slate-400">（选填）</span>
                    </label>
                    <div className="relative">
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="hidden"
                        id="screenshot-upload"
                      />
                      <label
                        htmlFor="screenshot-upload"
                        className="flex items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl cursor-pointer hover:border-violet-500 transition-colors"
                      >
                        {screenshotPreview ? (
                          <img src={screenshotPreview} alt="预览" className="h-full object-contain" />
                        ) : (
                          <div className="text-center">
                            <Camera className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                            <span className="text-sm text-slate-500">点击上传支付截图</span>
                          </div>
                        )}
                      </label>
                      {screenshotPreview && (
                        <button
                          onClick={() => {
                            setScreenshot(null);
                            setScreenshotPreview(null);
                          }}
                          className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                      备注 <span className="text-slate-400">（选填）</span>
                    </label>
                    <textarea
                      value={notes}
                      onChange={(e) => setNotes(e.target.value)}
                      placeholder="如有其他信息需要说明，请在此填写"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:ring-2 focus:ring-violet-500 focus:border-transparent outline-none transition-all resize-none"
                    />
                  </div>

                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-6">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      提交后我们将在24小时内审核，审核通过后会员将自动开通
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <button
                      onClick={() => setStep('pay')}
                      className="flex-1 py-3 border border-slate-200 dark:border-slate-700 rounded-xl font-medium text-slate-600 dark:text-slate-400 hover:bg-slate-50 transition-colors"
                    >
                      上一步
                    </button>
                    <button
                      onClick={handleSubmitProof}
                      disabled={loading || (!transactionId && !screenshot)}
                      className="flex-1 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:shadow-lg transition-all disabled:opacity-70"
                    >
                      {loading ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 className="w-5 h-5 animate-spin" />
                          <span>提交中...</span>
                        </div>
                      ) : (
                        '提交凭证'
                      )}
                    </button>
                  </div>
                </motion.div>
              )}

              {step === 'success' && (
                <motion.div
                  key="success"
                  initial="initial"
                  animate="animate"
                  exit="exit"
                  variants={fadeInUp}
                  className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl p-8 sm:p-12 text-center"
                >
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/30"
                  >
                    <Clock className="w-12 h-12 text-white" />
                  </motion.div>

                  <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3">
                    支付凭证已提交
                  </h2>

                  <p className="text-slate-500 dark:text-slate-400 mb-2 text-lg">
                    我们将在24小时内审核您的支付凭证
                  </p>

                  <p className="text-slate-400 dark:text-slate-500 mb-8">
                    订单号：{orderId}
                  </p>

                  <button
                    onClick={() => navigate('/membership')}
                    className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl transition-all"
                  >
                    <Crown className="w-5 h-5" />
                    返回会员中心
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default PersonalPayment;
