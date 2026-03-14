/**
 * 订单详情页面
 * 展示订单详细信息，包括商品、收货地址、物流信息等
 */
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Package,
  MapPin,
  Truck,
  CheckCircle,
  Clock,
  XCircle,
  CreditCard,
  FileText,
  Loader2,
  AlertCircle,
  Copy,
  Phone,
  User
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/Button';
import { getOrderById, cancelOrder, completeOrder, type Order } from '@/services/orderService';
import { useAuth } from '@/hooks/useAuth';

// 订单状态配置
const getStatusConfig = (status: string) => {
  switch (status) {
    case 'pending_payment':
      return {
        icon: Clock,
        label: '待付款',
        color: 'text-orange-500',
        bgColor: 'bg-orange-50',
        borderColor: 'border-orange-200',
        description: '订单已创建，等待支付'
      };
    case 'paid':
      return {
        icon: CreditCard,
        label: '待发货',
        color: 'text-blue-500',
        bgColor: 'bg-blue-50',
        borderColor: 'border-blue-200',
        description: '订单已支付，等待商家发货'
      };
    case 'shipped':
      return {
        icon: Truck,
        label: '待收货',
        color: 'text-purple-500',
        bgColor: 'bg-purple-50',
        borderColor: 'border-purple-200',
        description: '商品已发货，请注意查收'
      };
    case 'completed':
      return {
        icon: CheckCircle,
        label: '已完成',
        color: 'text-green-500',
        bgColor: 'bg-green-50',
        borderColor: 'border-green-200',
        description: '订单已完成，感谢您的购买'
      };
    case 'cancelled':
      return {
        icon: XCircle,
        label: '已取消',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200',
        description: '订单已取消'
      };
    case 'refunding':
      return {
        icon: AlertCircle,
        label: '退款中',
        color: 'text-red-500',
        bgColor: 'bg-red-50',
        borderColor: 'border-red-200',
        description: '退款申请处理中'
      };
    case 'refunded':
      return {
        icon: CheckCircle,
        label: '已退款',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200',
        description: '退款已完成'
      };
    default:
      return {
        icon: Package,
        label: '未知状态',
        color: 'text-gray-500',
        bgColor: 'bg-gray-100',
        borderColor: 'border-gray-200',
        description: ''
      };
  }
};

// 格式化日期
const formatDate = (dateStr: string | undefined) => {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const OrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // 获取订单详情
  useEffect(() => {
    const fetchOrder = async () => {
      if (!orderId) {
        setError('订单ID不存在');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        const { data, error } = await getOrderById(orderId);
        if (error) {
          setError(error);
        } else if (data) {
          setOrder(data);
        } else {
          setError('订单不存在');
        }
      } catch (err: any) {
        setError(err.message || '获取订单失败');
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  // 复制订单号
  const handleCopyOrderNo = () => {
    if (order?.order_no) {
      navigator.clipboard.writeText(order.order_no);
      toast.success('订单号已复制');
    }
  };

  // 取消订单
  const handleCancelOrder = async () => {
    if (!order || !confirm('确定要取消该订单吗？')) return;

    setActionLoading(true);
    const result = await cancelOrder(order.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('订单已取消');
      setOrder(prev => prev ? { ...prev, status: 'cancelled' } : null);
    }
    setActionLoading(false);
  };

  // 确认收货
  const handleConfirmReceipt = async () => {
    if (!order || !confirm('确认已收到商品？')) return;

    setActionLoading(true);
    const result = await completeOrder(order.id);
    if (result.error) {
      toast.error(result.error);
    } else {
      toast.success('已确认收货');
      setOrder(prev => prev ? { ...prev, status: 'completed' } : null);
    }
    setActionLoading(false);
  };

  // 去支付
  const handlePay = () => {
    if (order) {
      navigate(`/marketplace/order/pay/${order.id}`);
    }
  };

  // 重新购买
  const handleReorder = () => {
    navigate('/marketplace');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex items-center gap-3">
          <Loader2 className="w-6 h-6 text-sky-500 animate-spin" />
          <span className="text-gray-500">加载中...</span>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">加载失败</h2>
          <p className="text-gray-500 mb-6">{error || '订单不存在'}</p>
          <Button onClick={() => navigate('/marketplace/orders')}>
            返回订单列表
          </Button>
        </div>
      </div>
    );
  }

  const statusConfig = getStatusConfig(order.status);
  const StatusIcon = statusConfig.icon;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航 */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">订单详情</h1>
          </div>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-4">
        {/* 订单状态卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className={`${statusConfig.bgColor} ${statusConfig.borderColor} border rounded-2xl p-6`}
        >
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-sm`}>
              <StatusIcon className={`w-7 h-7 ${statusConfig.color}`} />
            </div>
            <div>
              <h2 className={`text-xl font-bold ${statusConfig.color}`}>
                {statusConfig.label}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                {statusConfig.description}
              </p>
            </div>
          </div>
        </motion.div>

        {/* 订单信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileText className="w-5 h-5 text-gray-400" />
              <span className="text-gray-500">订单号</span>
              <span className="font-medium text-gray-900">{order.order_no}</span>
            </div>
            <button
              onClick={handleCopyOrderNo}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="复制订单号"
            >
              <Copy className="w-4 h-4 text-gray-400" />
            </button>
          </div>
          <div className="px-6 py-4 space-y-3">
            <div className="flex justify-between">
              <span className="text-gray-500">创建时间</span>
              <span className="text-gray-900">{formatDate(order.created_at)}</span>
            </div>
            {order.paid_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">支付时间</span>
                <span className="text-gray-900">{formatDate(order.paid_at)}</span>
              </div>
            )}
            {order.shipped_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">发货时间</span>
                <span className="text-gray-900">{formatDate(order.shipped_at)}</span>
              </div>
            )}
            {order.completed_at && (
              <div className="flex justify-between">
                <span className="text-gray-500">完成时间</span>
                <span className="text-gray-900">{formatDate(order.completed_at)}</span>
              </div>
            )}
          </div>
        </motion.div>

        {/* 商品信息 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
        >
          <div className="px-6 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <Package className="w-5 h-5 text-gray-400" />
              <span className="font-semibold text-gray-900">商品信息</span>
            </div>
          </div>
          <div className="divide-y divide-gray-100">
            {order.items?.map((item, index) => (
              <div key={item.id || index} className="p-6 flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-xl overflow-hidden flex-shrink-0">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = '/images/placeholder-product.jpg';
                      }}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-gray-200">
                      <Package className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-gray-900 line-clamp-2">
                    {item.product_name}
                  </h3>
                  {item.product_specs && item.product_specs.length > 0 && (
                    <p className="text-sm text-gray-500 mt-1">
                      {item.product_specs.map(spec => `${spec.name}: ${spec.value}`).join(', ')}
                    </p>
                  )}
                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[#C02C38] font-bold">
                      ¥{item.price?.toFixed(2)}
                    </span>
                    <span className="text-gray-500">x{item.quantity}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="px-6 py-4 bg-gray-50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">商品总价</span>
              <span className="text-gray-900">
                ¥{order.items?.reduce((sum, item) => sum + (item.price || 0) * (item.quantity || 0), 0).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">运费</span>
              <span className="text-green-600">包邮</span>
            </div>
            <div className="flex justify-between items-center pt-2 border-t border-gray-200">
              <span className="text-gray-900 font-medium">实付款</span>
              <span className="text-2xl font-bold text-[#C02C38]">
                ¥{order.total_amount?.toFixed(2)}
              </span>
            </div>
          </div>
        </motion.div>

        {/* 收货地址 */}
        {order.shipping_address && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-gray-400" />
                <span className="font-semibold text-gray-900">收货地址</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex items-center gap-2 mb-2">
                <User className="w-4 h-4 text-gray-400" />
                <span className="font-medium text-gray-900">{order.shipping_address.name}</span>
                <Phone className="w-4 h-4 text-gray-400 ml-2" />
                <span className="text-gray-600">{order.shipping_address.phone}</span>
              </div>
              <p className="text-gray-600 leading-relaxed">
                {order.shipping_address.province} {order.shipping_address.city} {order.shipping_address.district} {order.shipping_address.address}
              </p>
            </div>
          </motion.div>
        )}

        {/* 物流信息 */}
        {order.status === 'shipped' && order.tracking_no && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden"
          >
            <div className="px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Truck className="w-5 h-5 text-gray-400" />
                <span className="font-semibold text-gray-900">物流信息</span>
              </div>
            </div>
            <div className="p-6">
              <div className="flex justify-between mb-2">
                <span className="text-gray-500">物流公司</span>
                <span className="text-gray-900">{order.tracking_company || '-'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">运单号</span>
                <span className="text-gray-900 font-mono">{order.tracking_no}</span>
              </div>
            </div>
          </motion.div>
        )}

        {/* 操作按钮 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="space-y-3"
        >
          {order.status === 'pending_payment' && (
            <>
              <button
                onClick={handlePay}
                disabled={actionLoading}
                className="w-full h-12 bg-[#C02C38] text-white rounded-xl font-medium hover:bg-[#991b1b] transition-colors disabled:opacity-50"
              >
                立即支付
              </button>
              <button
                onClick={handleCancelOrder}
                disabled={actionLoading}
                className="w-full h-12 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                取消订单
              </button>
            </>
          )}

          {order.status === 'shipped' && (
            <button
              onClick={handleConfirmReceipt}
              disabled={actionLoading}
              className="w-full h-12 bg-[#C02C38] text-white rounded-xl font-medium hover:bg-[#991b1b] transition-colors disabled:opacity-50"
            >
              确认收货
            </button>
          )}

          {order.status === 'cancelled' && (
            <button
              onClick={handleReorder}
              className="w-full h-12 border border-[#C02C38] text-[#C02C38] rounded-xl font-medium hover:bg-red-50 transition-colors"
            >
              重新购买
            </button>
          )}

          <button
            onClick={() => navigate('/marketplace/orders')}
            className="w-full h-12 border border-gray-300 text-gray-700 rounded-xl font-medium hover:bg-gray-50 transition-colors"
          >
            返回订单列表
          </button>
        </motion.div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
