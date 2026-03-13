/**
 * 订单支付页面
 * 显示支付方式和支付倒计时
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Clock,
  CreditCard,
  QrCode,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import { toast } from 'sonner';

// 组件
import { Button } from '@/components/ui/Button';
import { payOrder, getOrderById, type Order } from '@/services/orderService';

// 支付方式
const paymentMethods = [
  { id: 'wechat', name: '微信支付', icon: '💚', color: 'bg-green-500' },
  { id: 'alipay', name: '支付宝', icon: '💙', color: 'bg-blue-500' },
] as const;

const OrderPayPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  
  // 状态
  const [selectedMethod, setSelectedMethod] = useState<string>('wechat');
  const [countdown, setCountdown] = useState(30 * 60); // 30分钟倒计时
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<Order | null>(null);
  const [fetchLoading, setFetchLoading] = useState(true);

  // 获取订单信息
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) return;
      
      setFetchLoading(true);
      const { data, error } = await getOrderById(orderId);
      
      if (error) {
        toast.error('获取订单信息失败：' + error);
        navigate('/marketplace/orders');
        return;
      }
      
      if (!data) {
        toast.error('订单不存在');
        navigate('/marketplace/orders');
        return;
      }
      
      // 如果订单已支付，直接跳转到订单列表
      if (data.status !== 'pending_payment') {
        toast.info('该订单已支付或已关闭');
        navigate('/marketplace/orders');
        return;
      }
      
      setOrder(data);
      setFetchLoading(false);
    };
    
    fetchOrder();
  }, [orderId, navigate]);

  // 倒计时
  useEffect(() => {
    if (countdown <= 0) return;
    
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  // 格式化倒计时
  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // 处理支付
  const handlePay = async () => {
    if (!orderId) {
      toast.error('订单ID不存在');
      return;
    }
    
    console.log('[OrderPay] 开始支付，订单ID:', orderId);
    setLoading(true);
    
    try {
      // 调用支付接口更新订单状态
      const { data, error } = await payOrder(orderId, selectedMethod);
      
      console.log('[OrderPay] 支付结果:', { data, error });
      
      if (error) {
        console.error('[OrderPay] 支付失败:', error);
        toast.error('支付失败：' + error);
        setLoading(false);
        return;
      }
      
      if (!data) {
        console.error('[OrderPay] 支付返回数据为空');
        toast.error('支付失败，请重试');
        setLoading(false);
        return;
      }
      
      console.log('[OrderPay] 支付成功，准备跳转');
      toast.success('支付成功！');
      navigate('/marketplace/orders', { state: { refresh: true } });
    } catch (err) {
      console.error('[OrderPay] 支付异常:', err);
      toast.error('支付过程中发生错误');
      setLoading(false);
    }
  };

  // 取消支付
  const handleCancel = () => {
    if (confirm('确定要取消支付吗？订单将在30分钟后自动关闭。')) {
      navigate('/marketplace/orders');
    }
  };

  if (fetchLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="bg-white shadow-sm sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">订单支付</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* 倒计时提示 */}
        {countdown > 0 ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6 flex items-center justify-center gap-2"
          >
            <Clock className="w-5 h-5 text-orange-500" />
            <span className="text-orange-700">
              支付剩余时间：<span className="font-bold">{formatCountdown(countdown)}</span>
            </span>
          </motion.div>
        ) : (
          <div className="bg-gray-100 border border-gray-200 rounded-xl p-4 mb-6 flex items-center justify-center gap-2">
            <AlertCircle className="w-5 h-5 text-gray-500" />
            <span className="text-gray-600">订单已过期，请重新下单</span>
          </div>
        )}

        {/* 订单信息 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-gray-500">订单编号</span>
            <span className="font-medium text-gray-900">{order?.order_no}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-gray-500">支付金额</span>
            <span className="text-2xl font-bold text-[#C02C38]">
              ¥{order?.total_amount?.toFixed(2)}
            </span>
          </div>
        </div>

        {/* 支付方式 */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">选择支付方式</h2>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <button
                key={method.id}
                onClick={() => setSelectedMethod(method.id)}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  selectedMethod === method.id
                    ? 'border-sky-500 bg-sky-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                type="button"
              >
                <div className={`w-12 h-12 ${method.color} rounded-full flex items-center justify-center text-2xl`}>
                  {method.icon}
                </div>
                <div className="flex-1 text-left">
                  <div className="font-medium text-gray-900">{method.name}</div>
                  <div className="text-sm text-gray-500">推荐使用</div>
                </div>
                {selectedMethod === method.id && (
                  <CheckCircle className="w-6 h-6 text-sky-500" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* 支付按钮 */}
        {countdown > 0 && (
          <div className="space-y-3">
            <Button
              className="w-full h-14 text-lg bg-[#C02C38] hover:bg-[#991b1b]"
              onClick={handlePay}
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  支付中...
                </>
              ) : (
                <>
                  <QrCode className="w-5 h-5 mr-2" />
                  确认支付 ¥{order?.total_amount?.toFixed(2)}
                </>
              )}
            </Button>
            <Button
              variant="outline"
              className="w-full h-12"
              onClick={handleCancel}
              disabled={loading}
            >
              取消支付
            </Button>
          </div>
        )}

        {/* 安全提示 */}
        <div className="mt-8 text-center text-sm text-gray-500">
          <div className="flex items-center justify-center gap-4">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              安全支付
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              极速到账
            </span>
            <span className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4 text-green-500" />
              售后无忧
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderPayPage;
