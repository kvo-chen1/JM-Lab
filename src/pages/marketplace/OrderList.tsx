/**
 * 订单列表页面 - 支持状态筛选、订单跟踪
 */
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import orderService, { OrderStatus, type Order } from '@/services/orderService';
import { Package, Clock, Truck, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

const OrderListPage: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStatus, setSelectedStatus] = useState<OrderStatus | 'all'>('all');

  // 订单状态选项
  const statusOptions = [
    { value: 'all', label: '全部', icon: Package },
    { value: OrderStatus.PENDING_PAYMENT, label: '待付款', icon: Clock },
    { value: OrderStatus.PROCESSING, label: '处理中', icon: Package },
    { value: OrderStatus.SHIPPED, label: '已发货', icon: Truck },
    { value: OrderStatus.COMPLETED, label: '已完成', icon: CheckCircle },
    { value: OrderStatus.REFUNDING, label: '退款中', icon: AlertCircle }
  ];

  // 获取订单列表
  const fetchOrders = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const status = selectedStatus === 'all' ? undefined : selectedStatus;
      const result = await orderService.getOrders({
        customer_id: user.id,
        status: status
      });
      if (result.error) {
        throw new Error(result.error);
      }
      setOrders(result.data || []);
    } catch (err: any) {
      console.error('[OrderListPage] 获取订单列表失败:', err);
      toast.error('加载订单失败');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user, selectedStatus]);

  // 获取订单状态文本
  const getStatusText = (status: OrderStatus): string => {
    const statusMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING_PAYMENT]: '待付款',
      [OrderStatus.PAID]: '已付款',
      [OrderStatus.PROCESSING]: '处理中',
      [OrderStatus.SHIPPED]: '已发货',
      [OrderStatus.DELIVERED]: '已收货',
      [OrderStatus.COMPLETED]: '已完成',
      [OrderStatus.CANCELLED]: '已取消',
      [OrderStatus.REFUNDING]: '退款中',
      [OrderStatus.REFUNDED]: '已退款'
    };
    return statusMap[status] || '未知';
  };

  // 获取状态颜色
  const getStatusColor = (status: OrderStatus): string => {
    const colorMap: Record<OrderStatus, string> = {
      [OrderStatus.PENDING_PAYMENT]: 'text-orange-500 bg-orange-50',
      [OrderStatus.PAID]: 'text-blue-500 bg-blue-50',
      [OrderStatus.PROCESSING]: 'text-blue-500 bg-blue-50',
      [OrderStatus.SHIPPED]: 'text-green-500 bg-green-50',
      [OrderStatus.DELIVERED]: 'text-green-500 bg-green-50',
      [OrderStatus.COMPLETED]: 'text-green-500 bg-green-50',
      [OrderStatus.CANCELLED]: 'text-gray-500 bg-gray-50',
      [OrderStatus.REFUNDING]: 'text-orange-500 bg-orange-50',
      [OrderStatus.REFUNDED]: 'text-gray-500 bg-gray-50'
    };
    return colorMap[status] || 'text-gray-500 bg-gray-50';
  };

  return (
    <div className="min-h-screen bg-[var(--bg-secondary)] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <h1 className="text-3xl font-bold text-[var(--text-primary)] mb-8">
          我的订单
        </h1>

        {/* 状态筛选 */}
        <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
          <div className="flex flex-wrap gap-4">
            {statusOptions.map((option) => {
              const Icon = option.icon;
              const isActive = selectedStatus === option.value;

              return (
                <button
                  key={option.value}
                  onClick={() => setSelectedStatus(option.value as OrderStatus | 'all')}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'bg-[var(--haihe-500)] text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="font-medium">{option.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 订单列表 */}
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-12 h-12 border-4 border-[var(--haihe-500)] border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : orders.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm p-16 text-center">
            <Package className="w-24 h-24 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[var(--text-primary)] mb-2">
              暂无订单
            </h3>
            <p className="text-[var(--text-secondary)] mb-6">
              快去挑选心仪的商品吧～
            </p>
            <button
              onClick={() => navigate('/marketplace')}
              className="px-8 py-3 bg-gradient-to-r from-[var(--haihe-500)] to-[var(--haihe-600)] text-white rounded-lg font-medium hover:shadow-lg transition-all"
            >
              去逛逛
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div
                key={order.id}
                className="bg-white rounded-xl shadow-sm overflow-hidden hover:shadow-md transition-shadow"
              >
                {/* 订单头部 */}
                <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-b">
                  <div className="flex items-center gap-4">
                    <span className="text-sm text-gray-500">订单编号：{order.order_number}</span>
                    <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {getStatusText(order.status)}
                    </span>
                  </div>
                  <span className="text-sm text-gray-500">
                    下单时间：{new Date(order.created_at).toLocaleString('zh-CN')}
                  </span>
                </div>

                {/* 订单商品 */}
                <div className="p-6">
                  {order.items.map((item, index) => (
                    <div
                      key={item.id}
                      className={`flex items-center gap-4 ${
                        index < order.items.length - 1 ? 'pb-4 border-b mb-4' : ''
                      }`}
                    >
                      {/* 商品图片 */}
                      <div className="w-20 h-20 rounded-lg overflow-hidden bg-gray-100 flex-shrink-0">
                        {item.product_image ? (
                          <img
                            src={item.product_image}
                            alt={item.product_name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-8 h-8" />
                          </div>
                        )}
                      </div>

                      {/* 商品信息 */}
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-[var(--text-primary)] truncate">
                          {item.product_name}
                        </h4>
                        <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                          <span>数量：{item.quantity}</span>
                          <span>单价：¥{item.price.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* 商品价格 */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-red-500">
                          ¥{item.total_price.toFixed(2)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* 订单底部 */}
                <div className="bg-gray-50 px-6 py-4 flex items-center justify-between">
                  <div>
                    <div className="text-sm text-gray-500">
                      共{order.items.reduce((sum, item) => sum + item.quantity, 0)}件商品
                    </div>
                    <div className="text-lg font-bold text-[var(--text-primary)] mt-1">
                      实付：¥{order.final_amount.toFixed(2)}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {order.status === OrderStatus.PENDING_PAYMENT && (
                      <>
                        <button
                          onClick={async () => {
                            const result = await orderService.cancelOrder(order.id);
                            if (result.error) {
                              toast.error(result.error);
                            } else {
                              toast.success('订单已取消');
                              fetchOrders();
                            }
                          }}
                          className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                        >
                          取消订单
                        </button>
                        <button
                          onClick={() => navigate(`/marketplace/order/pay/${order.id}`)}
                          className="px-6 py-2 bg-gradient-to-r from-[var(--haihe-500)] to-[var(--haihe-600)] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                        >
                          去付款
                        </button>
                      </>
                    )}

                    {order.status === OrderStatus.SHIPPED && (
                      <>
                        <button
                          onClick={() => navigate(`/marketplace/order/logistics/${order.id}`)}
                          className="px-4 py-2 text-[var(--haihe-500)] hover:text-[var(--haihe-600)] transition-colors"
                        >
                          查看物流
                        </button>
                        <button
                          onClick={async () => {
                            const result = await orderService.completeOrder(order.id);
                            if (result.error) {
                              toast.error(result.error);
                            } else {
                              toast.success('确认收货成功');
                              fetchOrders();
                            }
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-[var(--haihe-500)] to-[var(--haihe-600)] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                        >
                          确认收货
                        </button>
                      </>
                    )}

                    {order.status === OrderStatus.DELIVERED && (
                      <>
                        <button
                          onClick={async () => {
                            const result = await orderService.completeOrder(order.id);
                            if (result.error) {
                              toast.error(result.error);
                            } else {
                              toast.success('订单已完成');
                              fetchOrders();
                            }
                          }}
                          className="px-6 py-2 bg-gradient-to-r from-[var(--haihe-500)] to-[var(--haihe-600)] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                        >
                          确认收货
                        </button>
                      </>
                    )}

                    {(order.status === OrderStatus.DELIVERED || order.status === OrderStatus.COMPLETED) && (
                      <button
                        onClick={() => navigate(`/marketplace/order/review/${order.id}`)}
                        className="px-6 py-2 bg-gradient-to-r from-[var(--haihe-500)] to-[var(--haihe-600)] text-white rounded-lg font-medium hover:shadow-lg transition-all"
                      >
                        评价商品
                      </button>
                    )}

                    {order.status === OrderStatus.REFUNDING && (
                      <button
                        onClick={() => navigate(`/marketplace/order/refund/${order.id}`)}
                        className="px-6 py-2 bg-gray-500 text-white rounded-lg font-medium hover:bg-gray-600 transition-all"
                      >
                        查看售后
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderListPage;
