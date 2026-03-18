/**
 * 订单列表页面 - 三栏式布局重构版
 * 展示用户所有订单，支持状态筛选和订单管理
 */
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Package,
  Clock,
  Truck,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Search,
  Loader2,
  AlertCircle,
  ShoppingBag,
  Filter,
  ChevronDown,
  RefreshCw,
  MoreHorizontal,
} from 'lucide-react';
import { toast } from 'sonner';

// 三栏布局组件
import {
  OrdersThreeColumnLayout,
  OrdersLeftSidebar,
  OrdersRightSidebar,
} from '@/components/marketplace/orders';

// Hooks
import { useAuth } from '@/hooks/useAuth';
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
      return {
        color: 'text-amber-600',
        bg: 'bg-amber-50',
        border: 'border-amber-200',
        label: '待付款',
        icon: Clock,
      };
    case 'paid':
      return {
        color: 'text-blue-600',
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        label: '待发货',
        icon: Package,
      };
    case 'shipped':
      return {
        color: 'text-purple-600',
        bg: 'bg-purple-50',
        border: 'border-purple-200',
        label: '待收货',
        icon: Truck,
      };
    case 'completed':
      return {
        color: 'text-green-600',
        bg: 'bg-green-50',
        border: 'border-green-200',
        label: '已完成',
        icon: CheckCircle,
      };
    case 'cancelled':
      return {
        color: 'text-slate-500',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        label: '已取消',
        icon: XCircle,
      };
    case 'refunding':
      return {
        color: 'text-red-500',
        bg: 'bg-red-50',
        border: 'border-red-200',
        label: '退款中',
        icon: Clock,
      };
    case 'refunded':
      return {
        color: 'text-slate-500',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        label: '已退款',
        icon: CheckCircle,
      };
    default:
      return {
        color: 'text-slate-500',
        bg: 'bg-slate-100',
        border: 'border-slate-200',
        label: status || '未知',
        icon: Package,
      };
  }
};

// 订单卡片组件
interface OrderCardProps {
  order: any;
  index: number;
  onViewDetail: (orderId: string) => void;
  onCancelOrder: (orderId: string) => void;
  onPayOrder: (orderId: string) => void;
  onConfirmReceipt: (orderId: string) => void;
  onNavigate: (path: string) => void;
}

const OrderCard: React.FC<OrderCardProps> = React.memo(({
  order,
  index,
  onViewDetail,
  onCancelOrder,
  onPayOrder,
  onConfirmReceipt,
  onNavigate,
}) => {
  const statusStyle = getStatusStyle(order.status);
  const StatusIcon = statusStyle.icon;

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
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg hover:border-slate-300 transition-all duration-300 group"
    >
      {/* 订单头部 */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100 bg-slate-50/50">
        <div className="flex items-center gap-4">
          <span className="text-sm font-medium text-slate-900">
            订单号: {order.order_no}
          </span>
          <span className="text-xs text-slate-400">
            {formatDate(order.created_at)}
          </span>
        </div>
        <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium ${statusStyle.bg} ${statusStyle.color} ${statusStyle.border} border`}>
          <StatusIcon className="w-4 h-4" />
          <span>{statusStyle.label}</span>
        </div>
      </div>

      {/* 订单商品 */}
      <div
        className="p-5 cursor-pointer hover:bg-slate-50/50 transition-colors"
        onClick={() => onViewDetail(order.id)}
      >
        {order.items?.map((item: any, itemIndex: number) => (
          <div
            key={item.id || itemIndex}
            className={`flex gap-4 ${itemIndex > 0 ? 'mt-4 pt-4 border-t border-slate-100' : ''}`}
          >
            <div className="w-20 h-20 bg-slate-100 rounded-xl overflow-hidden flex-shrink-0 ring-1 ring-slate-200">
              {item.product_image ? (
                <img
                  src={item.product_image}
                  alt={item.product_name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    (e.target as HTMLImageElement).style.display = 'none';
                  }}
                />
              ) : null}
              <div
                className={`w-full h-full flex items-center justify-center bg-slate-200 ${
                  item.product_image ? 'hidden' : 'flex'
                }`}
              >
                <Package className="w-8 h-8 text-slate-400" />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-slate-900 text-sm line-clamp-2 group-hover:text-blue-600 transition-colors">
                {item.product_name}
              </h4>
              <p className="text-xs text-slate-400 mt-1.5">
                单价: ¥{item.price}
              </p>
            </div>
            <div className="text-right">
              <p className="font-semibold text-slate-900">¥{item.price}</p>
              <p className="text-xs text-slate-400 mt-1">x{item.quantity}</p>
            </div>
          </div>
        ))}
      </div>

      {/* 订单底部 */}
      <div className="flex items-center justify-between px-5 py-4 border-t border-slate-100 bg-slate-50/30">
        <div className="text-sm text-slate-500">
          共 {order.items?.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0) || 0} 件商品
          <span className="mx-2 text-slate-300">|</span>
          实付款: <span className="font-bold text-slate-900 text-lg">¥{order.total_amount}</span>
        </div>

        <div className="flex items-center gap-2">
          {order.status === 'pending_payment' && (
            <>
              <button
                onClick={() => onCancelOrder(order.id)}
                className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 transition-all"
                type="button"
              >
                取消订单
              </button>
              <button
                onClick={() => onPayOrder(order.id)}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
                type="button"
              >
                立即支付
              </button>
            </>
          )}

          {order.status === 'shipped' && (
            <button
              onClick={() => onConfirmReceipt(order.id)}
              className="px-4 py-2 text-sm text-white bg-blue-600 rounded-xl hover:bg-blue-700 shadow-md hover:shadow-lg transition-all"
              type="button"
            >
              确认收货
            </button>
          )}

          {(order.status === 'completed' || order.status === 'paid') && (
            <button
              onClick={() => onViewDetail(order.id)}
              className="px-4 py-2 text-sm text-slate-600 hover:text-slate-900 border border-slate-200 rounded-xl hover:bg-white hover:border-slate-300 transition-all"
              type="button"
            >
              查看详情
            </button>
          )}

          {order.status === 'cancelled' && (
            <button
              onClick={() => onNavigate('/marketplace')}
              className="px-4 py-2 text-sm text-blue-600 hover:text-blue-700 border border-blue-200 rounded-xl hover:bg-blue-50 transition-all"
              type="button"
            >
              重新购买
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
});

OrderCard.displayName = 'OrderCard';

// 移动端状态筛选栏
const MobileStatusFilter: React.FC<{
  activeStatus: string;
  statusCounts: Record<string, number>;
  onStatusChange: (status: string) => void;
}> = ({ activeStatus, statusCounts, onStatusChange }) => {
  return (
    <div className="lg:hidden mb-4">
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {orderStatuses.map((status) => {
          const Icon = status.icon;
          const count = statusCounts[status.value] || 0;
          const isActive = activeStatus === status.value;

          return (
            <button
              key={status.value}
              onClick={() => onStatusChange(status.value)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-white text-slate-600 border border-slate-200 hover:border-slate-300'
              }`}
              type="button"
            >
              <Icon className="w-4 h-4" />
              {status.label}
              {count > 0 && (
                <span
                  className={`ml-1 px-1.5 py-0.5 text-xs rounded-full ${
                    isActive ? 'bg-white/20' : 'bg-slate-100'
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
};

// 主页面组件
const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // 状态
  const [activeStatus, setActiveStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'time' | 'amount'>('time');
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 获取真实订单数据
  const fetchOrders = useCallback(async () => {
    if (!user?.id) {
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

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
  }, [user?.id]);

  // 初始加载
  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // 页面重新获得焦点时刷新数据
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchOrders();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [fetchOrders]);

  // 监听 location state 变化（支付成功后跳转回来）
  useEffect(() => {
    if (location.state?.refresh) {
      let pollCount = 0;
      const maxPolls = 5;
      const pollInterval = 800;

      const pollOrders = () => {
        fetchOrders();
        pollCount++;
        if (pollCount < maxPolls) {
          setTimeout(pollOrders, pollInterval);
        }
      };

      pollOrders();
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location.state, fetchOrders, navigate, location.pathname]);

  // 筛选订单
  const filteredOrders = useMemo(() => {
    let result = [...orders];

    // 按状态筛选
    if (activeStatus !== 'all') {
      result = result.filter((order) => order.status === activeStatus);
    }

    // 按搜索词筛选
    if (searchQuery) {
      result = result.filter(
        (order) =>
          order.order_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          order.items?.some((item: any) =>
            item.product_name?.toLowerCase().includes(searchQuery.toLowerCase())
          )
      );
    }

    // 排序
    result.sort((a, b) => {
      if (sortBy === 'time') {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      } else {
        return (b.total_amount || 0) - (a.total_amount || 0);
      }
    });

    return result;
  }, [orders, activeStatus, searchQuery, sortBy]);

  // 统计各状态订单数量
  const statusCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    orderStatuses.forEach((status) => {
      if (status.value !== 'all') {
        counts[status.value] = orders.filter((o) => o.status === status.value).length;
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
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: 'cancelled' } : order
        )
      );
      toast.success('订单已取消');
    }
  }, []);

  // 支付订单
  const handlePayOrder = useCallback(
    async (orderId: string) => {
      const { payOrder } = await import('@/services/orderService');
      const { data, error } = await payOrder(orderId, 'wechat');

      if (error) {
        toast.error('支付失败：' + error);
      } else {
        toast.success('支付成功！');
        let pollCount = 0;
        const maxPolls = 5;
        const pollInterval = 800;

        const pollOrders = () => {
          fetchOrders();
          pollCount++;
          if (pollCount < maxPolls) {
            setTimeout(pollOrders, pollInterval);
          }
        };

        pollOrders();
      }
    },
    [fetchOrders]
  );

  // 确认收货
  const handleConfirmReceipt = useCallback(async (orderId: string) => {
    if (!confirm('确认已收到商品？')) return;

    const result = await completeOrder(orderId);
    if (result.error) {
      toast.error(result.error);
    } else {
      setOrders((prev) =>
        prev.map((order) =>
          order.id === orderId ? { ...order, status: 'completed' } : order
        )
      );
      toast.success('已确认收货');
    }
  }, []);

  // 查看订单详情
  const handleViewDetail = useCallback(
    (orderId: string) => {
      navigate(`/marketplace/order/${orderId}`);
    },
    [navigate]
  );

  // 检查是否登录
  if (!user?.id) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-slate-300" />
          </div>
          <h2 className="text-xl font-semibold text-slate-900 mb-2">请先登录</h2>
          <p className="text-slate-500 mb-6">登录后查看您的订单</p>
          <button
            onClick={() => navigate('/login')}
            className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
          >
            去登录
          </button>
        </div>
      </div>
    );
  }

  // 顶部导航栏
  const header = (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
      <div className="flex items-center gap-4">
        <button
          onClick={() => navigate(-1)}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          type="button"
        >
          <ArrowLeft className="w-5 h-5 text-slate-600" />
        </button>
        <h1 className="text-lg font-semibold text-slate-900">我的订单</h1>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={fetchOrders}
          className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
          title="刷新"
        >
          <RefreshCw className={`w-5 h-5 text-slate-600 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </div>
  );

  // 主内容区
  const mainContent = (
    <div>
      {/* 页面标题和工具栏 */}
      <div className="mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold text-slate-900">订单列表</h2>
            <p className="text-sm text-slate-500 mt-1">
              共 {filteredOrders.length} 个订单
            </p>
          </div>

          {/* 搜索和排序 */}
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索订单号或商品..."
                className="w-full sm:w-64 pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
              />
            </div>

            <div className="relative">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'time' | 'amount')}
                className="appearance-none px-4 py-2.5 pr-10 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent cursor-pointer"
              >
                <option value="time">按时间排序</option>
                <option value="amount">按金额排序</option>
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>
      </div>

      {/* 移动端状态筛选 */}
      <MobileStatusFilter
        activeStatus={activeStatus}
        statusCounts={statusCounts}
        onStatusChange={setActiveStatus}
      />

      {/* 错误状态 */}
      {error && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-10 h-10 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">加载失败</h3>
          <p className="text-slate-500 mb-2">{error}</p>
          {error?.includes('超时') && (
            <p className="text-sm text-slate-400 mb-6">
              可能原因：本地数据库服务未启动或网络连接异常
            </p>
          )}
          <div className="flex gap-3 justify-center">
            <button
              onClick={fetchOrders}
              className="px-5 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              重新加载
            </button>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-5 py-2.5 border border-slate-200 text-slate-700 rounded-xl hover:bg-slate-50 transition-colors font-medium"
            >
              返回商城
            </button>
          </div>
        </div>
      )}

      {/* 加载状态 */}
      {loading && (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
          <span className="ml-3 text-slate-500">加载中...</span>
        </div>
      )}

      {/* 空状态 */}
      {!loading && !error && filteredOrders.length === 0 && (
        <div className="text-center py-16">
          <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingBag className="w-10 h-10 text-slate-300" />
          </div>
          <h3 className="text-lg font-medium text-slate-900 mb-2">
            {searchQuery ? '未找到相关订单' : '暂无订单'}
          </h3>
          <p className="text-slate-500 mb-6">
            {searchQuery ? '请尝试其他搜索词' : '快去选购心仪的商品吧'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => navigate('/marketplace')}
              className="px-6 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors font-medium"
            >
              去购物
            </button>
          )}
        </div>
      )}

      {/* 订单列表 */}
      {!loading && !error && filteredOrders.length > 0 && (
        <div className="space-y-4">
          <AnimatePresence mode="popLayout">
            {filteredOrders.map((order, index) => (
              <OrderCard
                key={order.id}
                order={order}
                index={index}
                onViewDetail={handleViewDetail}
                onCancelOrder={handleCancelOrder}
                onPayOrder={handlePayOrder}
                onConfirmReceipt={handleConfirmReceipt}
                onNavigate={navigate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );

  return (
    <OrdersThreeColumnLayout
      header={header}
      leftSidebar={
        <OrdersLeftSidebar
          user={user}
          activeStatus={activeStatus}
          statusCounts={statusCounts}
          onStatusChange={setActiveStatus}
        />
      }
      mainContent={mainContent}
      rightSidebar={<OrdersRightSidebar orders={orders} />}
    />
  );
};

export default OrdersPage;
