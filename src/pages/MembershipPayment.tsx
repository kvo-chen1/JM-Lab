import React, { useContext, useEffect, useState, useCallback, useRef } from 'react';
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
  Lock
} from 'lucide-react';

// 支付方式图标组件
const PaymentIcon: React.FC<{ method: string; className?: string }> = ({ method, className = '' }) => {
  const icons: Record<string, React.ReactNode> = {
    wechat: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M8.691 2.188C3.891 2.188 0 5.476 0 9.53c0 2.212 1.17 4.203 3.002 5.55a.59.59 0 01.213.665l-.39 1.48c-.019.07-.048.141-.048.213 0 .163.13.295.29.295a.326.326 0 00.167-.054l1.903-1.114a.864.864 0 01.717-.098 10.16 10.16 0 002.837.403c.276 0 .543-.027.811-.05-.857-2.578.157-4.972 1.932-6.446 1.703-1.415 3.882-1.98 5.853-1.838-.576-3.583-4.196-6.348-8.596-6.348zM5.785 5.991c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178A1.17 1.17 0 014.623 7.17c0-.651.52-1.18 1.162-1.18zm5.813 0c.642 0 1.162.529 1.162 1.18a1.17 1.17 0 01-1.162 1.178 1.17 1.17 0 01-1.162-1.178c0-.651.52-1.18 1.162-1.18zm5.34 2.867c-1.797-.052-3.746.512-5.28 1.786-1.72 1.428-2.687 3.72-1.78 6.22.942 2.453 3.666 4.229 6.884 4.229.826 0 1.622-.12 2.361-.336a.722.722 0 01.598.082l1.584.926a.272.272 0 00.14.047c.134 0 .24-.111.24-.247 0-.06-.023-.12-.038-.177l-.327-1.233a.582.582 0 01-.023-.156.49.49 0 01.201-.398C23.024 18.48 24 16.82 24 14.98c0-3.21-2.931-5.837-6.656-6.088V8.89c-.135-.01-.27-.027-.407-.03zm-2.53 3.274c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.97-.982zm4.844 0c.535 0 .969.44.969.982a.976.976 0 01-.969.983.976.976 0 01-.969-.983c0-.542.434-.982.969-.982z"/>
      </svg>
    ),
    alipay: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M5.5 2.5h13a3 3 0 013 3v13a3 3 0 01-3 3h-13a3 3 0 01-3-3v-13a3 3 0 013-3zm12.35 4.75a.65.65 0 00-.65-.65h-2.6a.65.65 0 00-.65.65v.6h3.9v-.6zm-4.55 2.6c-.36.13-.75.2-1.15.2-1.6 0-2.9-1.1-2.9-2.45 0-1.35 1.3-2.45 2.9-2.45.4 0 .79.07 1.15.2a3.78 3.78 0 00-1.15-.2c-1.6 0-2.9 1.1-2.9 2.45 0 1.35 1.3 2.45 2.9 2.45.4 0 .79-.07 1.15-.2zm-3.25 1.3h4.55v.65h-1.3v3.9h-.65v-3.9h-2.6v-.65zm-2.6 0h.65v4.55h-.65v-4.55zm-1.3 0h.65v4.55h-.65v-4.55zm5.85 4.55h-.65v-1.95h.65v1.95zm-2.6 0h-.65v-1.95h.65v-1.95z"/>
      </svg>
    ),
    credit: <CreditCard className={className} />,
    unionpay: (
      <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M2 4h20v16H2V4zm18 14V6H4v12h16zM6 8h4v2H6V8zm0 4h4v2H6v-2zm6-4h6v2h-6V8zm0 4h6v2h-6v-2z"/>
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

const scaleIn = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1 },
  exit: { opacity: 0, scale: 0.95 }
};

const MembershipPayment: React.FC = () => {
  const { user, updateMembership } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [orderId, setOrderId] = useState<string | null>(null);
  const [paymentConfig, setPaymentConfig] = useState<any>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // 获取从会员中心传递过来的套餐信息
  const plan = (location.state as any)?.plan || 'premium';
  const isRenew = (location.state as any)?.renew || false;

  // 会员套餐数据 - 增强版
  const membershipPlans = {
    free: {
      name: '免费会员',
      nameEn: 'Free',
      price: 0,
      originalPrice: 0,
      period: 'month',
      periodText: '永久',
      duration: 0,
      features: ['基础AI生成', '1GB云存储', '基础模板库', '带水印导出'],
      badge: '基础',
      color: 'from-slate-400 to-slate-500',
      bgColor: 'bg-slate-50',
      borderColor: 'border-slate-200'
    },
    premium: {
      name: '高级会员',
      nameEn: 'Premium',
      price: 99,
      originalPrice: 129,
      period: 'month',
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
      period: 'month',
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

  // 获取支付配置
  useEffect(() => {
    const fetchPaymentConfig = async () => {
      try {
        const response = await apiClient.get('/api/payment/config');
        if (response.ok && response.data?.success) {
          setPaymentConfig(response.data.data);
        }
      } catch (error) {
        console.error('获取支付配置失败:', error);
      }
    };
    fetchPaymentConfig();
  }, []);

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  // 清理轮询
  useEffect(() => {
    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  if (!user || !selectedPlan) {
    return null;
  }

  // 支付方式数据
  const paymentMethods = [
    { 
      id: 'wechat', 
      name: '微信支付', 
      desc: '亿万用户的选择',
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      activeBorder: 'border-emerald-500',
      activeBg: 'bg-emerald-50/80',
      available: paymentConfig?.wechat?.available ?? true
    },
    { 
      id: 'alipay', 
      name: '支付宝', 
      desc: '安全便捷支付',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      activeBorder: 'border-blue-500',
      activeBg: 'bg-blue-50/80',
      available: paymentConfig?.alipay?.available ?? true
    },
    { 
      id: 'credit', 
      name: '信用卡', 
      desc: '支持主流银行',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      borderColor: 'border-purple-200',
      activeBorder: 'border-purple-500',
      activeBg: 'bg-purple-50/80',
      available: false // 暂未实现
    },
    { 
      id: 'unionpay', 
      name: '银联支付', 
      desc: '银联卡支付',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      borderColor: 'border-rose-200',
      activeBorder: 'border-rose-500',
      activeBg: 'bg-rose-50/80',
      available: false // 暂未实现
    }
  ];

  // 轮询支付状态
  const startPolling = useCallback((oid: string) => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }

    pollingRef.current = setInterval(async () => {
      try {
        const response = await apiClient.get(`/api/payment/status/${oid}`);
        if (response.ok && response.data?.success) {
          const { status, paidAt } = response.data.data;
          
          if (status === 'completed') {
            // 支付成功
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
            }
            
            const now = new Date();
            const endDate = new Date();
            endDate.setTime(now.getTime() + selectedPlan.duration);
            
            await updateMembership({
              membershipLevel: plan,
              membershipStatus: 'active',
              membershipStart: now.toISOString(),
              membershipEnd: endDate.toISOString()
            });
            
            setSuccess(true);
            setIsProcessing(false);
            
            // 3秒后跳转到会员中心
            setTimeout(() => {
              navigate('/membership');
            }, 3000);
          } else if (status === 'failed' || status === 'cancelled') {
            // 支付失败或取消
            if (pollingRef.current) {
              clearInterval(pollingRef.current);
            }
            setError('支付失败，请重试');
            setIsProcessing(false);
          }
        }
      } catch (error) {
        console.error('查询支付状态失败:', error);
      }
    }, 3000); // 每3秒查询一次
  }, [plan, selectedPlan.duration, updateMembership, navigate]);

  // 处理支付
  const handlePayment = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setIsProcessing(true);
      
      // 创建订单
      const response = await apiClient.post('/api/payment/create', {
        plan: plan,
        amount: selectedPlan.price,
        paymentMethod: paymentMethod,
        period: 'monthly'
      });
      
      if (response.ok && response.data?.success) {
        const { orderId: oid, qrCode: qr } = response.data.data;
        setOrderId(oid);
        setQrCode(qr);
        
        // 开始轮询支付状态
        startPolling(oid);
      } else {
        setError(response.data?.error || '创建订单失败，请稍后重试');
        setIsProcessing(false);
      }
    } catch (err) {
      console.error('支付失败:', err);
      setError('支付失败，请稍后重试');
      setIsProcessing(false);
    } finally {
      setLoading(false);
    }
  }, [plan, selectedPlan.price, paymentMethod, startPolling]);

  // 模拟支付（用于测试）
  const handleSimulatePayment = useCallback(async () => {
    if (!orderId) return;
    
    try {
      const response = await apiClient.post('/api/payment/simulate', {
        orderId: orderId
      });
      
      if (response.ok && response.data?.success) {
        // 模拟支付成功
        const now = new Date();
        const endDate = new Date();
        endDate.setTime(now.getTime() + selectedPlan.duration);
        
        await updateMembership({
          membershipLevel: plan,
          membershipStatus: 'active',
          membershipStart: now.toISOString(),
          membershipEnd: endDate.toISOString()
        });
        
        setSuccess(true);
        setIsProcessing(false);
        
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
        }
        
        // 3秒后跳转到会员中心
        setTimeout(() => {
          navigate('/membership');
        }, 3000);
      }
    } catch (error) {
      console.error('模拟支付失败:', error);
    }
  }, [orderId, plan, selectedPlan.duration, updateMembership, navigate]);

  // 取消支付
  const handleCancelPayment = () => {
    if (pollingRef.current) {
      clearInterval(pollingRef.current);
    }
    setQrCode(null);
    setOrderId(null);
    setIsProcessing(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* 背景装饰 */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-violet-500/10 to-purple-500/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-blue-500/10 to-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
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
            <span>安全支付 · 即时到账</span>
          </div>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 dark:from-white dark:via-slate-200 dark:to-white bg-clip-text text-transparent mb-3">
            {isRenew ? '续费会员' : '升级会员'}
          </h1>
          <p className="text-slate-500 dark:text-slate-400 text-lg">
            {isRenew ? `续费 ${selectedPlan.name}，继续享受专属权益` : `升级到 ${selectedPlan.name}，解锁更多高级功能`}
          </p>
        </motion.div>

        <AnimatePresence mode="wait">
          {success ? (
            // 支付成功状态
            <motion.div
              key="success"
              {...scaleIn}
              className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-900/50 p-8 sm:p-12 text-center border border-slate-100 dark:border-slate-700/50"
            >
              <motion.div 
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-24 h-24 mx-auto mb-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-lg shadow-emerald-500/30"
              >
                <CheckCircle2 className="w-12 h-12 text-white" />
              </motion.div>
              
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-2xl sm:text-3xl font-bold text-slate-900 dark:text-white mb-3"
              >
                支付成功！
              </motion.h2>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-slate-500 dark:text-slate-400 mb-2 text-lg"
              >
                {isRenew ? '您的会员已成功续费' : '您已成功升级会员'}
              </motion.p>
              
              <motion.p 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-slate-400 dark:text-slate-500 mb-8"
              >
                3秒后将自动跳转到会员中心...
              </motion.p>
              
              <motion.button
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-2xl font-semibold shadow-lg shadow-violet-500/25 hover:shadow-xl hover:shadow-violet-500/30 transition-all"
                onClick={() => navigate('/membership')}
              >
                <Crown className="w-5 h-5" />
                立即前往会员中心
              </motion.button>
            </motion.div>
          ) : (
            // 支付表单
            <motion.div
              key="payment"
              variants={staggerContainer}
              initial="initial"
              animate="animate"
              className="grid lg:grid-cols-5 gap-6"
            >
              {/* 左侧：套餐信息 */}
              <motion.div 
                variants={fadeInUp}
                className="lg:col-span-2 space-y-6"
              >
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

              {/* 右侧：支付方式 */}
              <motion.div 
                variants={fadeInUp}
                className="lg:col-span-3"
              >
                <div className="bg-white dark:bg-slate-800/50 backdrop-blur-xl rounded-3xl shadow-xl shadow-slate-200/50 dark:shadow-slate-900/30 border border-slate-100 dark:border-slate-700/50 p-6 sm:p-8">
                  {/* 支付方式标题 */}
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow-lg shadow-violet-500/25">
                      <CreditCard className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold text-slate-900 dark:text-white">选择支付方式</h2>
                      <p className="text-sm text-slate-500 dark:text-slate-400">请选择您偏好的支付方式</p>
                    </div>
                  </div>

                  {/* 支付方式网格 */}
                  <div className="grid grid-cols-2 gap-4 mb-8">
                    {paymentMethods.map((method, index) => (
                      <motion.button
                        key={method.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 * index }}
                        whileHover={{ scale: method.available ? 1.02 : 1, y: method.available ? -2 : 0 }}
                        whileTap={{ scale: method.available ? 0.98 : 1 }}
                        onClick={() => method.available && setPaymentMethod(method.id)}
                        disabled={!method.available}
                        className={`relative p-5 rounded-2xl border-2 transition-all duration-300 text-left group ${
                          paymentMethod === method.id
                            ? `${method.activeBorder} ${method.activeBg} shadow-lg`
                            : method.available
                              ? 'border-slate-100 dark:border-slate-700 hover:border-slate-200 dark:hover:border-slate-600 bg-slate-50/50 dark:bg-slate-800/50'
                              : 'border-slate-100 dark:border-slate-800 bg-slate-50/30 dark:bg-slate-800/30 opacity-60 cursor-not-allowed'
                        }`}
                      >
                        {/* 选中指示器 */}
                        {paymentMethod === method.id && (
                          <motion.div
                            layoutId="selectedIndicator"
                            className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center"
                          >
                            <CheckCircle2 className="w-3 h-3 text-white" />
                          </motion.div>
                        )}

                        {/* 不可用标签 */}
                        {!method.available && (
                          <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400 text-xs">
                            暂未开通
                          </div>
                        )}

                        <div className={`w-12 h-12 rounded-xl ${method.bgColor} flex items-center justify-center mb-3 transition-transform group-hover:scale-110`}>
                          <PaymentIcon method={method.id} className={`w-6 h-6 ${method.color}`} />
                        </div>
                        <h3 className="font-semibold text-slate-900 dark:text-white mb-1">{method.name}</h3>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{method.desc}</p>
                      </motion.button>
                    ))}
                  </div>

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

                  {/* 支付按钮区域 */}
                  <div className="space-y-4">
                    {qrCode ? (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="text-center py-8 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-700/50"
                      >
                        <p className="mb-4 text-slate-600 dark:text-slate-300">
                          请使用{paymentMethod === 'wechat' ? '微信' : paymentMethod === 'alipay' ? '支付宝' : ''}扫码支付
                        </p>
                        <div className="w-48 h-48 mx-auto rounded-2xl bg-white p-4 shadow-lg mb-4">
                          <img src={qrCode} alt="Payment QR Code" className="w-full h-full rounded-lg" />
                        </div>
                        <div className="flex items-center justify-center text-violet-600 animate-pulse">
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          正在检测支付结果...
                        </div>
                        
                        {/* 测试按钮 - 仅开发环境显示 */}
                        {process.env.NODE_ENV === 'development' && (
                          <button 
                            onClick={handleSimulatePayment}
                            className="mt-4 px-4 py-2 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-lg text-sm hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
                          >
                            [测试] 模拟支付成功
                          </button>
                        )}
                        
                        <button 
                          onClick={handleCancelPayment}
                          className="mt-4 block mx-auto text-sm text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200 underline"
                        >
                          取消支付
                        </button>
                      </motion.div>
                    ) : (
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={handlePayment}
                        disabled={loading || !paymentMethods.find(m => m.id === paymentMethod)?.available}
                        className="w-full relative overflow-hidden group"
                      >
                        <div className="relative bg-gradient-to-r from-violet-600 via-purple-600 to-violet-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-violet-500/25 hover:shadow-2xl hover:shadow-violet-500/30 transition-all disabled:opacity-70 disabled:cursor-not-allowed disabled:shadow-none">
                          {/* 光泽动画 */}
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 bg-gradient-to-r from-transparent via-white/20 to-transparent" />
                          
                          {loading ? (
                            <div className="flex items-center justify-center gap-3">
                              <Loader2 className="w-6 h-6 animate-spin" />
                              <span>正在创建订单...</span>
                            </div>
                          ) : (
                            <div className="flex items-center justify-center gap-3">
                              <Lock className="w-5 h-5" />
                              <span>确认支付 ¥{selectedPlan.price}</span>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    )}

                    {/* 协议说明 */}
                    <p className="text-center text-slate-400 dark:text-slate-500 text-sm">
                      点击支付即表示您同意
                      <a href="/terms" className="text-violet-600 dark:text-violet-400 hover:text-violet-700 dark:hover:text-violet-300 ml-1 font-medium underline-offset-2 hover:underline transition-all">
                        《会员服务协议》
                      </a>
                    </p>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MembershipPayment;
