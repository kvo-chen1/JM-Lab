import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '@/contexts/authContext';
import { apiClient } from '@/lib/apiClient';
import { useLocation, useNavigate } from 'react-router-dom';

const MembershipPayment: React.FC = () => {
  const { user, updateMembership } = useContext(AuthContext);
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('wechat');
  const [qrCode, setQrCode] = useState<string | null>(null);
  
  // 获取从会员中心传递过来的套餐信息
  const plan = (location.state as any)?.plan || 'premium';
  const isRenew = (location.state as any)?.renew || false;

  // 会员套餐数据
  const membershipPlans = {
    premium: {
      name: '高级会员',
      price: 99,
      period: 'month',
      duration: 30 * 24 * 60 * 60 * 1000 // 30天
    },
    vip: {
      name: 'VIP会员',
      price: 199,
      period: 'month',
      duration: 30 * 24 * 60 * 60 * 1000 // 30天
    }
  };

  const selectedPlan = membershipPlans[plan as keyof typeof membershipPlans];

  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  if (!user || !selectedPlan) {
    return null;
  }

  // 处理支付
  const handlePayment = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 模拟支付过程
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // 创建订单
      const orderResponse = await apiClient.post('/api/payment/create', {
        plan: plan,
        amount: selectedPlan.price,
        paymentMethod: paymentMethod
      });
      
      if (orderResponse.ok) {
        // 模拟支付成功
        // 在实际项目中，这里应该跳转到支付网关
        
        // 计算会员到期时间
        const now = new Date();
        const endDate = new Date();
        endDate.setTime(now.getTime() + selectedPlan.duration);
        
        // 更新会员信息
        await updateMembership({
          membershipLevel: plan,
          membershipStatus: 'active',
          membershipStart: now.toISOString(),
          membershipEnd: endDate.toISOString()
        });
        
        setSuccess(true);
        
        // 3秒后跳转到会员中心
        setTimeout(() => {
          navigate('/membership');
        }, 3000);
      } else {
        setError('创建订单失败');
      }
    } catch (err) {
      console.error('支付失败:', err);
      setError('支付失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-[var(--bg-secondary)] dark:to-[var(--bg-tertiary)] pink:from-[var(--bg-secondary)] pink:to-[var(--bg-tertiary)] py-10">
      <div className="max-w-2xl mx-auto px-4">
        {/* 页面标题 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            {isRenew ? '续费会员' : '升级会员'}
          </h1>
          <p className="text-gray-600 dark:text-[var(--text-secondary)] pink:text-[var(--text-secondary)] text-lg">
            {isRenew ? `续费 ${selectedPlan.name}` : `升级到 ${selectedPlan.name}`}
          </p>
        </div>

        {success ? (
          // 支付成功
          <div className="bg-white dark:bg-[var(--bg-secondary)] pink:bg-[var(--bg-secondary)] rounded-2xl shadow-xl p-10 text-center transform transition-all hover:shadow-2xl dark:border border-[var(--border-primary)] pink:border border-[var(--border-primary)]">
            <div className="text-8xl mb-6">🎉</div>
            <h2 className="text-3xl font-bold mb-3 text-gray-800 dark:text-[var(--text-primary)] pink:text-[var(--text-primary)]">支付成功！</h2>
            <p className="text-gray-600 dark:text-[var(--text-secondary)] pink:text-[var(--text-secondary)] mb-8 text-lg">
              {isRenew ? '您的会员已成功续费' : '您已成功升级会员'}
            </p>
            <p className="text-gray-500 dark:text-[var(--text-tertiary)] pink:text-[var(--text-tertiary)] mb-10 text-sm">
              3秒后将自动跳转到会员中心...
            </p>
            <button
              className="bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 rounded-full hover:shadow-lg hover:scale-105 transition-all duration-300 font-medium"
              onClick={() => navigate('/membership')}
            >
              立即前往会员中心
            </button>
          </div>
        ) : (
          // 支付表单
          <div className="bg-white dark:bg-[var(--bg-secondary)] pink:bg-[var(--bg-secondary)] rounded-2xl shadow-xl p-10 transform transition-all hover:shadow-2xl dark:border border-[var(--border-primary)] pink:border border-[var(--border-primary)]">
            {/* 套餐信息 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-5 text-gray-800 dark:text-[var(--text-primary)] pink:text-[var(--text-primary)] flex items-center">
                <i className="fas fa-crown text-primary mr-3"></i>
                套餐信息
              </h2>
              <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-xl p-6 border border-primary/20 shadow-sm">
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-[var(--border-secondary)] pink:border-[var(--border-secondary)]">
                  <span className="text-gray-600 dark:text-[var(--text-secondary)] pink:text-[var(--text-secondary)] text-lg">套餐名称</span>
                  <span className="font-semibold text-xl text-gray-800 dark:text-[var(--text-primary)] pink:text-[var(--text-primary)]">{selectedPlan.name}</span>
                </div>
                <div className="flex justify-between items-center mb-4 pb-3 border-b border-gray-200 dark:border-[var(--border-secondary)] pink:border-[var(--border-secondary)]">
                  <span className="text-gray-600 dark:text-[var(--text-secondary)] pink:text-[var(--text-secondary)] text-lg">价格</span>
                  <span className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    ¥{selectedPlan.price}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-[var(--text-secondary)] pink:text-[var(--text-secondary)] text-lg">有效期</span>
                  <span className="text-gray-800 dark:text-[var(--text-primary)] pink:text-[var(--text-primary)] font-medium text-lg">{selectedPlan.period}</span>
                </div>
              </div>
            </div>

            {/* 支付方式 */}
            <div className="mb-10">
              <h2 className="text-2xl font-bold mb-5 text-gray-800 dark:text-[var(--text-primary)] pink:text-[var(--text-primary)] flex items-center">
                <i className="fas fa-credit-card text-primary mr-3"></i>
                选择支付方式
              </h2>
              <div className="grid grid-cols-2 gap-5">
                <button
                  className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md ${paymentMethod === 'wechat' ? 'border-primary bg-primary/10 scale-105' : 'border-gray-200 dark:border-[var(--border-secondary)] pink:border-[var(--border-secondary)] hover:border-primary hover:bg-primary/5'}`}
                  onClick={() => setPaymentMethod('wechat')}
                >
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-green-100 mb-3">
                    <i className="fab fa-weixin text-3xl text-green-600"></i>
                  </div>
                  <span className="font-medium text-gray-800 dark:text-[var(--text-primary)] pink:text-[var(--text-primary)]">微信支付</span>
                </button>
                <button
                  className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md ${paymentMethod === 'alipay' ? 'border-primary bg-primary/10 scale-105' : 'border-gray-200 dark:border-[var(--border-secondary)] pink:border-[var(--border-secondary)] hover:border-primary hover:bg-primary/5'}`}
                  onClick={() => setPaymentMethod('alipay')}
                >
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-blue-100 mb-3">
                    <i className="fab fa-alipay text-3xl text-blue-600"></i>
                  </div>
                  <span className="font-medium text-gray-800 dark:text-[var(--text-primary)] pink:text-[var(--text-primary)]">支付宝</span>
                </button>
                <button
                  className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md ${paymentMethod === 'credit' ? 'border-primary bg-primary/10 scale-105' : 'border-gray-200 dark:border-[var(--border-secondary)] pink:border-[var(--border-secondary)] hover:border-primary hover:bg-primary/5'}`}
                  onClick={() => setPaymentMethod('credit')}
                >
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-purple-100 mb-3">
                    <i className="fas fa-credit-card text-3xl text-purple-600"></i>
                  </div>
                  <span className="font-medium text-gray-800 dark:text-[var(--text-primary)] pink:text-[var(--text-primary)]">信用卡</span>
                </button>
                <button
                  className={`border-2 rounded-xl p-5 flex flex-col items-center justify-center transition-all duration-300 hover:shadow-md ${paymentMethod === 'unionpay' ? 'border-primary bg-primary/10 scale-105' : 'border-gray-200 dark:border-[var(--border-secondary)] pink:border-[var(--border-secondary)] hover:border-primary hover:bg-primary/5'}`}
                  onClick={() => setPaymentMethod('unionpay')}
                >
                  <div className="w-14 h-14 flex items-center justify-center rounded-full bg-red-100 mb-3">
                    <i className="fas fa-university text-3xl text-red-600"></i>
                  </div>
                  <span className="font-medium text-gray-800 dark:text-[var(--text-primary)] pink:text-[var(--text-primary)]">银联支付</span>
                </button>
              </div>
            </div>

            {/* 支付按钮 */}
            <div>
              {error && (
                <div className="bg-red-50 dark:bg-red-50/20 pink:bg-red-50/20 text-red-600 p-4 rounded-lg mb-5 flex items-center">
                  <i className="fas fa-exclamation-circle mr-2"></i>
                  {error}
                </div>
              )}

              {qrCode ? (
                <div className="text-center py-6 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700">
                  <p className="mb-4 text-gray-600 dark:text-gray-300">请使用{paymentMethod === 'wechat' ? '微信' : '支付宝'}扫码支付</p>
                  <img src={qrCode} alt="Payment QR Code" className="mx-auto w-48 h-48 rounded-lg shadow-sm mb-4" />
                  <div className="flex items-center justify-center text-primary animate-pulse">
                    <i className="fas fa-spinner fa-spin mr-2"></i>
                    正在检测支付结果...
                  </div>
                  <button 
                    onClick={() => setQrCode(null)}
                    className="mt-4 text-sm text-gray-500 underline"
                  >
                    取消支付
                  </button>
                </div>
              ) : (
                <button
                  className="w-full bg-gradient-to-r from-primary to-secondary text-white py-5 rounded-full font-semibold text-xl hover:shadow-lg hover:scale-105 transition-all duration-300 disabled:opacity-70 disabled:cursor-not-allowed disabled:scale-100"
                  onClick={handlePayment}
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin mr-3 w-6 h-6 border-2 border-white border-t-transparent rounded-full"></div>
                      正在创建订单...
                    </div>
                  ) : (
                    `确认支付 ¥${selectedPlan.price}`
                  )}
                </button>
              )}
              <div className="text-center text-gray-500 dark:text-[var(--text-tertiary)] pink:text-[var(--text-tertiary)] mt-5 text-sm">
                点击支付即表示您同意
                <a href="/terms" className="text-primary hover:underline ml-1 font-medium">
                  《会员服务协议》
                </a>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MembershipPayment;
