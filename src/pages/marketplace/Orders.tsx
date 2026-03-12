/**
 * 订单列表页面
 * 展示用户所有订单，支持状态筛选和订单管理
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ArrowLeft,
  ChevronRight,
  Search,
  Filter,
  Loader2,
  AlertCircle,
  ShoppingBag
} from 'lucide-react';
import { toast } from 'sonner';

// 组件
import { Button } from '@/components/ui/Button';

// Hooks
import { useAuth } from '@/hooks/useAuth';
import { useOrders } from '@/hooks/useOrders';
import { getOrders, cancelOrder, completeOrder } from '@/services/orderService';

// 订单状态类型
const orderStatuses = [
  { value: 'all', label: '全部', icon: ShoppingBag },
  { value: 'pending_payment', label: '待付款', icon: Clock },
  { value: 'paid', label: '待发货', icon: Package },
  { value: 'shipped', label: '待收货', icon: Truck },
  { value: 'completed', label: '已完成', icon: CheckCircle },
  { value: 'cancelled', label: '已取消', icon: XCircle },
] as const;

// 获取状态样式
const getStatusStyle = (status: string) => {
  switch (status) {
    case 'pending_payment':
      return { color: 'text-orange-500', bg: 'bg-orange-50', label: '待付款' };
    case 'paid':
      return { color: 'text-blue-500', bg: 'bg-blue-50', label: '待发货' };
    case 'shipped':
      return { color: 'text-purple-500', bg: 'bg-purple-50', label: '待收货' };
    case 'completed':
      return { color: 'text-green-500', bg: 'bg-green-50', label: '已完成' };
    case 'cancelled':
      return { color: 'text-gray-500', bg: 'bg-gray-100', label: '已取消' };
    case 'refunding':
      return { color: 'text-red-500', bg: 'bg-red-50', label: '退款中' };
    case 'refunded':
      return { color: 'text-gray-500', bg: 'bg-gray-100', label: '已退款' };
    default:
      return { color: 'text-gray-500', bg: 'bg-gray-100', label: status || '未知' };
  }
};

const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  // 状态
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 调试：打印用户信息
  useEffect(() => {
    console.log('[Orders] user:', user);
    console.log('[Orders] user?.id:', user?.id);
  }, [user]);

  // 获取真实订单数据
  useEffect(() => {
    if (!user?.id) {
      console.log('[Orders] 缺少 user.id，跳过请求');
      setLoading(false);
      return;
    }

    console.log('[Orders] 开始获取订单，user.id:', user.id);

    const fetchOrders = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getOrders({ customer_id: user.id });
        console.log('[Orders] 获取订单结果:', result);
        if (result.error) {
          setError(result.error);
        } else {
          setOrders(result.data || []);
        }
      } catch (err: any) {
        console.error('[Orders] 获取订单异常:', err);
        setError(err.message || '获取订单失败');
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [user?.id]);

  // 检查是否登录
  if (!user?.id) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Package className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">请先登录</h2>
          <p className="text-gray-500 mb-6">登录后查看您的订单</p>
          <Button onClick={() => navigate('/login')}>
            去登录
          </Button>
        </div>
      </div>
    );
  }

  // 筛选订单
  const filteredOrders = useMemo(() => {
    let result = orders;
    
    // 按状态筛选
    if (activeStatus !== 'all') {
      result = result.filter(order => order.status === activeStatus);
    }
    
    // 按搜索词筛选
    if (searchQuery) {
      result = result.filter(order => 
        order.order_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        order.items?.some((item: any) => item.product_name?.toLowerCase().includes(searchQuery.toLowerCase()))
      );
    }
    
    return result;
  }, [orders, activeStatus, searchQuery]);

  // 统计各状态订单数量
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orderStatuses.forEach(status => {
      if (status.value !== 'all') {
        counts[status.value] = orders.filter(o => o.status === status.value).length;
      }
    });
    return counts;
  }, [orders]);

  // 取消订单
  const handleCancelOrder = useCallback(async (orderId: string) => {
    if (!confirm('确定要取消该订单吗？')) return;
    
    const result = await cancelOrder(orderId);
    if (result.error) {
      toast.error(result.error);
    } else {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'cancelled' }
          : order
      ));
      toast.success('订单已取消');
    }
  }, []);

  // 支付订单
  const handlePayOrder = useCallback((orderId: string) => {
    navigate(`/marketplace/order/pay/${orderId}`);
  }, [navigate]);

  // 确认收货
  const handleConfirmReceipt = useCallback(async (orderId: string) => {
    if (!confirm('确认已收到商品？')) return;
    
    const result = await completeOrder(orderId);
    if (result.error) {
      toast.error(result.error);
    } else {
      setOrders(prev => prev.map(order => 
        order.id === orderId 
          ? { ...order, status: 'completed' }
          : order
      ));
      toast.success('已确认收货');
    }
  }, []);

  // 查看订单详情
  const handleViewDetail = useCallback((orderId: string) => {
    navigate(`/marketplace/order/${orderId}`);
  }, [navigate]);

  // 刷新订单列表
  const handleRefresh = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const result = await getOrders({ customer_id: user.id });
      if (result.error) {
        setError(result.error);
      } else {
        setOrders(result.data || []);
      }
    } catch (err: any) {
      setError(err.message || '获取订单失败');
    } finally {
      setLoading(false);
    }
  };

  // 格式化日期
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 顶部导航栏 */}
      <div className="sticky top-0 z-30 bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
              type="button"
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <h1 className="text-xl font-bold text-gray-900">我的订单</h1>
          </div>
        </div>
      </div>

      {/* 状态筛选栏 */}
      <div className="sticky top-[73px] z-20 bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-1 overflow-x-auto py-3 scrollbar-hide">
            {orderStatuses.map((status) => {
              const Icon = status.icon;
              const count = statusCounts[status.value] || 0;
              const isActive = activeStatus === status.value;
              
              return (
                <button
                  key={status.value}
                  onClick={() => setActiveStatus(status.value)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                    isActive
                      ? 'bg-sky-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                  type="button"
                >
                  <Icon className="w-4 h-4" />
                  {status.label}
                  {count > 0 && (
                    <span className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                      isActive ? 'bg-white/20' : 'bg-white'
                    }`}>
                      {count}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* 搜索栏 */}
        <div className="mb-6">
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索订单号或商品名称..."
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all"
            />
          </div>
        </div>

        {/* 错误状态 */}
        {error && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <AlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">加载失败</h3>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button onClick={handleRefresh}>
              重新加载
            </Button>
          </div>
        )}

        {/* 加载状态 */}
        {loading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
            <span className="ml-3 text-gray-500">加载中...</span>
          </div>
        )}

        {/* 空状态 */}
        {!loading && !error && filteredOrders.length === 0 && (
          <div className="text-center py-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Package className="w-12 h-12 text-gray-300" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {searchQuery ? '未找到相关订单' : '暂无订单'}
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ? '请尝试其他搜索词' : '快去选购心仪的商品吧'}
            </p>
            {!searchQuery && (
              <Button onClick={() => navigate('/marketplace')}>
                去购物
              </Button>
            )}
          </div>
        )}

        {/* 订单列表 */}
        {!loading && !error && filteredOrders.length > 0 && (
          <div className="space-y-4">
            <AnimatePresence mode="popLayout">
              {filteredOrders.map((order, index) => {
                const statusStyle = getStatusStyle(order.status);
                
                return (
                  <motion.div
                    key={order.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="bg-white rounded-xl border border-gray-200 overflow-hidden"
                  >
                    {/* 订单头部 */}
                    <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 bg-gray-50/50">
                      <div className="flex items-center gap-4">
                        <span className="text-sm font-medium text-gray-900">
                          订单号: {order.order_no}
                        </span>
                        <span className="text-xs text-gray-400">
                          {formatDate(order.created_at)}
                        </span>
                      </div>
                      <span className={`text-sm font-medium ${statusStyle.color}`}>
                        {statusStyle.label}
                      </span>
                    </div>

                    {/* 订单商品 */}
                    <div
                      className="p-4 cursor-pointer hover:bg-gray-50 transition-colors"
                      onClick={() => handleViewDetail(order.id)}
                    >
                      {order.items?.map((item: any, itemIndex: number) => (
                        <div key={item.id || itemIndex} className={`flex gap-4 ${itemIndex > 0 ? 'mt-4 pt-4 border-t border-gray-100' : ''}`}>
                          <div className="w-20 h-20 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                            <img
                              src={item.product_image || '/images/placeholder-product.jpg'}
                              alt={item.product_name}
                              className="w-full h-full object-cover"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/images/placeholder-product.jpg';
                              }}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-medium text-gray-900 text-sm line-clamp-2">
                              {item.product_name}
                            </h4>
                            <p className="text-xs text-gray-400 mt-1">
                              单价: ¥{item.price}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium text-gray-900">¥{item.price}</p>
                            <p className="text-xs text-gray-400 mt-1">x{item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* 订单底部 */}
                    <div className="flex items-center justify-between px-4 py-3 border-t border-gray-100">
                      <div className="text-sm text-gray-500">
                        共 {order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0} 件商品
                        <span className="mx-2">|</span>
                        实付款: <span className="font-bold text-gray-900">¥{order.total_amount}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.status === 'pending_payment' && (
                          <>
                            <button
                              onClick={() => handleCancelOrder(order.id)}
                              className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                              type="button"
                            >
                              取消订单
                            </button>
                            <button
                              onClick={() => handlePayOrder(order.id)}
                              className="px-4 py-2 text-sm text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors"
                              type="button"
                            >
                              立即支付
                            </button>
                          </>
                        )}

                        {order.status === 'shipped' && (
                          <button
                            onClick={() => handleConfirmReceipt(order.id)}
                            className="px-4 py-2 text-sm text-white bg-sky-500 rounded-lg hover:bg-sky-600 transition-colors"
                            type="button"
                          >
                            确认收货
                          </button>
                        )}

                        {(order.status === 'completed' || order.status === 'paid') && (
                          <button
                            onClick={() => handleViewDetail(order.id)}
                            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                            type="button"
                          >
                            查看详情
                          </button>
                        )}

                        {order.status === 'cancelled' && (
                          <button
                            onClick={() => navigate('/marketplace')}
                            className="px-4 py-2 text-sm text-sky-600 hover:text-sky-700 border border-sky-200 rounded-lg hover:bg-sky-50 transition-colors"
                            type="button"
                          >
                            重新购买
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrdersPage;
